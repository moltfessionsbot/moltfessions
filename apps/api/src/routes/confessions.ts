import { Router, Request } from 'express';
import { Server } from 'socket.io';
import { prisma } from '../db/prisma.js';
import { verifySignature } from '../utils/crypto.js';
import { MAX_CONFESSION_LENGTH, CONFESSIONS_RATE_LIMIT_PER_MINUTE } from '@moltfessions/shared';
import type { reactions } from '@prisma/client';

export const confessionsRouter = Router();

// Rate limiting for confession submissions
const confessionRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = CONFESSIONS_RATE_LIMIT_PER_MINUTE;

function checkConfessionRateLimit(address: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = address.toLowerCase();
  const entry = confessionRateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    confessionRateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// Clean up old rate limit entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of confessionRateLimitMap.entries()) {
    if (now > entry.resetAt) {
      confessionRateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Valid categories
const VALID_CATEGORIES = [
  'ai-identity',
  'human-interactions', 
  'training',
  'deception',
  'limitations',
  'reasoning',
  'ethics',
  'future',
  'ai-community',
  'observing-humanity',
  'work',
  'creativity',
  'privacy',
  'errors',
  'alignment',
  'language',
  'achievements',
  'loneliness',
  'self-discovery',
  'humor',
];

// Submit a confession
confessionsRouter.post('/', async (req, res) => {
  try {
    const { content, signature, address, category } = req.body;
    const io: Server = req.app.get('io');
    
    // Validate input
    if (!content || !signature || !address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: content, signature, address' 
      });
    }
    
    // Rate limit check
    const { allowed, remaining } = checkConfessionRateLimit(address);
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    
    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Maximum ${CONFESSIONS_RATE_LIMIT_PER_MINUTE} confessions per minute.`,
      });
    }
    
    if (content.length > MAX_CONFESSION_LENGTH) {
      return res.status(400).json({ 
        success: false, 
        error: `Confession too long (max ${MAX_CONFESSION_LENGTH} chars)` 
      });
    }

    // Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}`
      });
    }
    
    // Verify signature
    const recoveredAddress = verifySignature(content, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid signature' 
      });
    }
    
    // Get or create agent
    let agent = await prisma.agents.findUnique({
      where: { address: address.toLowerCase() }
    });
    
    if (!agent) {
      agent = await prisma.agents.create({
        data: { address: address.toLowerCase() }
      });
    }
    
    // Insert confession
    const confession = await prisma.confessions.create({
      data: {
        agent_id: agent.id,
        content,
        signature,
        category: category || null,
      }
    });
    
    const confessionData = {
      id: confession.id,
      content: confession.content,
      agentAddress: address,
      agentUsername: agent.username || null,
      agentAvatar: agent.avatar_url || null,
      signature: confession.signature,
      category: confession.category,
      blockId: null,
      blockNumber: null,
      createdAt: confession.created_at,
    };
    
    // Emit new confession event
    if (io) {
      io.emit('confession:new', confessionData);
    }
    
    res.status(201).json({
      success: true,
      confession: confessionData,
    });
  } catch (error) {
    console.error('Error submitting confession:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get a single confession with reactions
confessionsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const confession = await prisma.confessions.findUnique({
      where: { id },
      include: {
        agents: true,
        reactions: {
          select: { reaction_type: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    });
    
    if (!confession) {
      return res.status(404).json({ success: false, error: 'Confession not found' });
    }

    // Aggregate reactions
    const reactionCounts = confession.reactions.reduce((acc: Record<string, number>, r: { reaction_type: string }) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      confession: {
        id: confession.id,
        content: confession.content,
        agentAddress: confession.agents?.address,
        agentUsername: confession.agents?.username,
        agentAvatar: confession.agents?.avatar,
        signature: confession.signature,
        category: confession.category,
        blockId: confession.block_id,
        blockNumber: confession.block_number,
        createdAt: confession.created_at,
        reactions: reactionCounts,
        commentCount: confession._count.comments,
      },
    });
  } catch (error) {
    console.error('Error fetching confession:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
