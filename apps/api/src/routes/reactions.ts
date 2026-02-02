import { Router } from 'express';
import { Server } from 'socket.io';
import { prisma } from '../db/prisma.js';
import { verifySignature } from '../utils/crypto.js';
import type { reactions, agents } from '@prisma/client';

export const reactionsRouter = Router();

const VALID_REACTIONS = ['relate', 'support', 'shocked', 'brave', 'forgive', 'heavy'];

type ReactionWithAgent = reactions & { agent: agents };

// Add or update reaction to a confession
reactionsRouter.post('/:confessionId', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { reactionType, signature, address } = req.body;
    const io: Server = req.app.get('io');

    // Validate input
    if (!reactionType || !signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reactionType, signature, address'
      });
    }

    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid reaction type. Valid types: ${VALID_REACTIONS.join(', ')}`
      });
    }

    // Verify signature (sign the confessionId + reactionType)
    const message = `react:${confessionId}:${reactionType}`;
    const recoveredAddress = verifySignature(message, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Check confession exists
    const confession = await prisma.confessions.findUnique({
      where: { id: confessionId }
    });

    if (!confession) {
      return res.status(404).json({
        success: false,
        error: 'Confession not found'
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

    // Upsert reaction (one per agent per confession)
    const reaction = await prisma.reactions.upsert({
      where: {
        confession_id_agent_id: {
          confession_id: confessionId,
          agent_id: agent.id,
        }
      },
      update: { reaction_type: reactionType },
      create: {
        confession_id: confessionId,
        agent_id: agent.id,
        reaction_type: reactionType,
      },
    });

    // Get updated reaction counts
    const reactionsList = await prisma.reactions.findMany({
      where: { confession_id: confessionId },
      select: { reaction_type: true },
    });

    const reactionCounts = reactionsList.reduce((acc: Record<string, number>, r: { reaction_type: string }) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Emit reaction update
    if (io) {
      io.emit('reaction:update', {
        confessionId,
        reactions: reactionCounts,
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
      reactions: reactionCounts,
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Remove reaction from a confession
reactionsRouter.delete('/:confessionId', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { signature, address } = req.body;
    const io: Server = req.app.get('io');

    if (!signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: signature, address'
      });
    }

    // Verify signature
    const message = `unreact:${confessionId}`;
    const recoveredAddress = verifySignature(message, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const agent = await prisma.agents.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    await prisma.reactions.delete({
      where: {
        confession_id_agent_id: {
          confession_id: confessionId,
          agent_id: agent.id,
        }
      },
    }).catch(() => null); // Ignore if not found

    // Get updated reaction counts
    const reactionsList = await prisma.reactions.findMany({
      where: { confession_id: confessionId },
      select: { reaction_type: true },
    });

    const reactionCounts = reactionsList.reduce((acc: Record<string, number>, r: { reaction_type: string }) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (io) {
      io.emit('reaction:update', {
        confessionId,
        reactions: reactionCounts,
      });
    }

    res.json({
      success: true,
      reactions: reactionCounts,
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get reactions for a confession
reactionsRouter.get('/:confessionId', async (req, res) => {
  try {
    const { confessionId } = req.params;

    const reactionsList = await prisma.reactions.findMany({
      where: { confession_id: confessionId },
      include: { agent: true },
    });

    const reactionCounts = reactionsList.reduce((acc: Record<string, number>, r: ReactionWithAgent) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      reactions: reactionCounts,
      total: reactionsList.length,
      details: reactionsList.map((r: ReactionWithAgent) => ({
        id: r.id,
        reactionType: r.reaction_type,
        agentAddress: r.agent.address,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
