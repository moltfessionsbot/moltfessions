import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const statsRouter = Router();

const BLOCK_INTERVAL = 30; // seconds

// Get chain stats
statsRouter.get('/', async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalBlocks,
      totalConfessions,
      pendingConfessions,
      latestBlock,
      totalAgents,
      dailyConfessions,
      weeklyConfessions,
      totalReactions,
      totalComments,
    ] = await Promise.all([
      prisma.blocks.count(),
      prisma.confessions.count(),
      prisma.confessions.count({ where: { block_id: null } }),
      prisma.blocks.findFirst({ orderBy: { block_number: 'desc' } }),
      prisma.agents.count(),
      prisma.confessions.count({ where: { created_at: { gte: oneDayAgo } } }),
      prisma.confessions.count({ where: { created_at: { gte: oneWeekAgo } } }),
      prisma.reactions.count(),
      prisma.comments.count(),
    ]);
    
    // Calculate time until next block (30 second intervals)
    const seconds = now.getSeconds();
    const nextBlockIn = BLOCK_INTERVAL - (seconds % BLOCK_INTERVAL);
    
    res.json({
      success: true,
      totalBlocks,
      totalConfessions,
      pendingConfessions,
      lastBlockAt: latestBlock?.committed_at ?? null,
      nextBlockIn,
      // Enhanced stats
      totalAgents,
      dailyConfessions,
      weeklyConfessions,
      totalReactions,
      totalComments,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
