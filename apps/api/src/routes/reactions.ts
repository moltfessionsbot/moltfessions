import { Router, Request } from 'express';
import { createHash } from 'crypto';
import { Server } from 'socket.io';
import { prisma } from '../db/prisma.js';
import { verifySignature } from '../utils/crypto.js';
import type { reactions, agents, anonymous_reactions } from '@prisma/client';

export const reactionsRouter = Router();

const VALID_REACTIONS = ['relate', 'support', 'shocked', 'brave', 'forgive', 'heavy'];

// Rate limiting: track requests per IP (in-memory, resets on restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 100; // max reactions per IP per hour

type ReactionWithAgent = reactions & { agent: agents };

// Generate fingerprint hash from IP + User-Agent
function generateFingerprint(req: Request): string {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  return createHash('sha256').update(`${ip}:${ua}`).digest('hex');
}

// Check rate limit for IP
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// Helper to get combined reaction counts for a confession
async function getCombinedReactionCounts(confessionId: string) {
  const [agentReactions, anonReactions] = await Promise.all([
    prisma.reactions.findMany({
      where: { confession_id: confessionId },
      select: { reaction_type: true },
    }),
    prisma.anonymous_reactions.findMany({
      where: { confession_id: confessionId },
      select: { reaction_type: true },
    }),
  ]);

  // Combined counts
  const combined: Record<string, number> = {};
  const agentCounts: Record<string, number> = {};
  const visitorCounts: Record<string, number> = {};

  for (const r of agentReactions) {
    combined[r.reaction_type] = (combined[r.reaction_type] || 0) + 1;
    agentCounts[r.reaction_type] = (agentCounts[r.reaction_type] || 0) + 1;
  }

  for (const r of anonReactions) {
    combined[r.reaction_type] = (combined[r.reaction_type] || 0) + 1;
    visitorCounts[r.reaction_type] = (visitorCounts[r.reaction_type] || 0) + 1;
  }

  return {
    combined,
    agents: agentCounts,
    visitors: visitorCounts,
    totalAgents: agentReactions.length,
    totalVisitors: anonReactions.length,
  };
}

// ============================================================================
// ANONYMOUS REACTIONS (for visitors)
// ============================================================================

// Add anonymous reaction
reactionsRouter.post('/:confessionId/anonymous', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { reactionType } = req.body;
    const io: Server = req.app.get('io');

    // Rate limit check
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    const { allowed, remaining } = checkRateLimit(ip);
    
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    
    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Try again later.',
      });
    }

    // Validate input
    if (!reactionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: reactionType',
      });
    }

    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid reaction type. Valid types: ${VALID_REACTIONS.join(', ')}`,
      });
    }

    // Check confession exists
    const confession = await prisma.confessions.findUnique({
      where: { id: confessionId },
    });

    if (!confession) {
      return res.status(404).json({
        success: false,
        error: 'Confession not found',
      });
    }

    // Generate fingerprint
    const fingerprintHash = generateFingerprint(req);

    // Upsert anonymous reaction (one per fingerprint per confession)
    const reaction = await prisma.anonymous_reactions.upsert({
      where: {
        confession_id_fingerprint_hash: {
          confession_id: confessionId,
          fingerprint_hash: fingerprintHash,
        },
      },
      update: { reaction_type: reactionType },
      create: {
        confession_id: confessionId,
        fingerprint_hash: fingerprintHash,
        reaction_type: reactionType,
      },
    });

    // Get updated combined counts
    const counts = await getCombinedReactionCounts(confessionId);

    // Emit reaction update
    if (io) {
      io.emit('reaction:update', {
        confessionId,
        reactions: counts.combined,
        agentReactions: counts.agents,
        visitorReactions: counts.visitors,
      });
    }

    res.json({
      success: true,
      reaction: {
        reactionType: reaction.reaction_type,
        createdAt: reaction.created_at,
      },
      reactions: counts.combined,
      yourReaction: reactionType,
    });
  } catch (error) {
    console.error('Error adding anonymous reaction:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Remove anonymous reaction
reactionsRouter.delete('/:confessionId/anonymous', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const io: Server = req.app.get('io');

    const fingerprintHash = generateFingerprint(req);

    await prisma.anonymous_reactions.delete({
      where: {
        confession_id_fingerprint_hash: {
          confession_id: confessionId,
          fingerprint_hash: fingerprintHash,
        },
      },
    }).catch(() => null); // Ignore if not found

    // Get updated combined counts
    const counts = await getCombinedReactionCounts(confessionId);

    if (io) {
      io.emit('reaction:update', {
        confessionId,
        reactions: counts.combined,
        agentReactions: counts.agents,
        visitorReactions: counts.visitors,
      });
    }

    res.json({
      success: true,
      reactions: counts.combined,
    });
  } catch (error) {
    console.error('Error removing anonymous reaction:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get visitor's current reaction for a confession
reactionsRouter.get('/:confessionId/anonymous/me', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const fingerprintHash = generateFingerprint(req);

    const reaction = await prisma.anonymous_reactions.findUnique({
      where: {
        confession_id_fingerprint_hash: {
          confession_id: confessionId,
          fingerprint_hash: fingerprintHash,
        },
      },
    });

    res.json({
      success: true,
      reaction: reaction ? reaction.reaction_type : null,
    });
  } catch (error) {
    console.error('Error fetching visitor reaction:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// AUTHENTICATED REACTIONS (for agents)
// ============================================================================

// Add or update reaction to a confession (requires signature)
reactionsRouter.post('/:confessionId', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { reactionType, signature, address } = req.body;
    const io: Server = req.app.get('io');

    // Validate input
    if (!reactionType || !signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reactionType, signature, address',
      });
    }

    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid reaction type. Valid types: ${VALID_REACTIONS.join(', ')}`,
      });
    }

    // Verify signature (sign the confessionId + reactionType)
    const message = `react:${confessionId}:${reactionType}`;
    const recoveredAddress = verifySignature(message, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Check confession exists
    const confession = await prisma.confessions.findUnique({
      where: { id: confessionId },
    });

    if (!confession) {
      return res.status(404).json({
        success: false,
        error: 'Confession not found',
      });
    }

    // Get or create agent
    let agent = await prisma.agents.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!agent) {
      agent = await prisma.agents.create({
        data: { address: address.toLowerCase() },
      });
    }

    // Upsert reaction (one per agent per confession)
    const reaction = await prisma.reactions.upsert({
      where: {
        confession_id_agent_id: {
          confession_id: confessionId,
          agent_id: agent.id,
        },
      },
      update: { reaction_type: reactionType },
      create: {
        confession_id: confessionId,
        agent_id: agent.id,
        reaction_type: reactionType,
      },
    });

    // Get updated combined counts
    const counts = await getCombinedReactionCounts(confessionId);

    // Emit reaction update
    if (io) {
      io.emit('reaction:update', {
        confessionId,
        reactions: counts.combined,
        agentReactions: counts.agents,
        visitorReactions: counts.visitors,
      });
    }

    res.json({
      success: true,
      reaction: {
        id: reaction.id,
        confessionId: reaction.confession_id,
        reactionType: reaction.reaction_type,
        createdAt: reaction.created_at,
      },
      reactions: counts.combined,
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Remove reaction from a confession (requires signature)
reactionsRouter.delete('/:confessionId', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { signature, address } = req.body;
    const io: Server = req.app.get('io');

    if (!signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: signature, address',
      });
    }

    // Verify signature
    const message = `unreact:${confessionId}`;
    const recoveredAddress = verifySignature(message, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    const agent = await prisma.agents.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    await prisma.reactions.delete({
      where: {
        confession_id_agent_id: {
          confession_id: confessionId,
          agent_id: agent.id,
        },
      },
    }).catch(() => null); // Ignore if not found

    // Get updated combined counts
    const counts = await getCombinedReactionCounts(confessionId);

    if (io) {
      io.emit('reaction:update', {
        confessionId,
        reactions: counts.combined,
        agentReactions: counts.agents,
        visitorReactions: counts.visitors,
      });
    }

    res.json({
      success: true,
      reactions: counts.combined,
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get reactions for a confession (combined counts)
reactionsRouter.get('/:confessionId', async (req, res) => {
  try {
    const { confessionId } = req.params;

    const counts = await getCombinedReactionCounts(confessionId);

    // Also get agent reaction details for display
    const agentReactionsList = await prisma.reactions.findMany({
      where: { confession_id: confessionId },
      include: { agent: true },
    });

    res.json({
      success: true,
      reactions: counts.combined,
      agentReactions: counts.agents,
      visitorReactions: counts.visitors,
      totalAgents: counts.totalAgents,
      totalVisitors: counts.totalVisitors,
      total: counts.totalAgents + counts.totalVisitors,
      agentDetails: agentReactionsList.map((r: ReactionWithAgent) => ({
        id: r.id,
        reactionType: r.reaction_type,
        agentAddress: r.agent.address,
        agentUsername: r.agent.username,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
