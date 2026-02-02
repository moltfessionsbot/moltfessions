import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const statsRouter = Router();

const BLOCK_INTERVAL = 120; // 2 minutes

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
    
    // Calculate time until next block (2 minute intervals at even minutes)
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const isEvenMinute = minutes % 2 === 0;
    const nextBlockIn = isEvenMinute ? (120 - seconds) : (60 - seconds);
    
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
