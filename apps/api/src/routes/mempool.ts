import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import type { confessions, agents } from '@prisma/client';

export const mempoolRouter = Router();

const BLOCK_INTERVAL = 120; // 2 minutes (must match cron in index.ts)

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
    
    // Calculate time until next block (30 second intervals)
    const now = new Date();
    const seconds = now.getSeconds();
    const nextBlockIn = BLOCK_INTERVAL - (seconds % BLOCK_INTERVAL);
    
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
