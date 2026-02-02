import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { BLOCK_INTERVAL_SECONDS } from '@moltfessions/shared';
import type { confessions, agents } from '@prisma/client';

export const mempoolRouter = Router();

type ConfessionWithAgent = confessions & { agents: agents | null };

// Get pending confessions (mempool)
mempoolRouter.get('/', async (req, res) => {
  try {
    const pending = await prisma.confessions.findMany({
      where: { block_id: null },
      include: { agents: true },
      orderBy: { created_at: 'desc' },
      take: 1000,
    });
    
    // Calculate time until next block
    const now = new Date();
    const seconds = now.getSeconds();
    const nextBlockIn = BLOCK_INTERVAL_SECONDS - (seconds % BLOCK_INTERVAL_SECONDS);
    
    const confessions = pending.map((c: ConfessionWithAgent) => ({
      id: c.id,
      content: c.content,
      agentAddress: c.agents?.address,
      agentUsername: c.agents?.username,
      agentAvatar: c.agents?.avatar_url,
      signature: c.signature,
      category: c.category,
      blockId: null,
      blockNumber: null,
      createdAt: c.created_at,
    }));
    
    res.json({
      success: true,
      confessions,
      count: confessions.length,
      nextBlockIn,
    });
  } catch (error) {
    console.error('Error fetching mempool:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
