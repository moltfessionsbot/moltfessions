import { Router } from 'express';
import { pool } from '../db/index.js';

export const statsRouter = Router();

const BLOCK_INTERVAL = 30; // seconds

// Get chain stats
statsRouter.get('/', async (req, res) => {
  try {
    const [blocksResult, confessionsResult, pendingResult, latestBlockResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM blocks'),
      pool.query('SELECT COUNT(*) FROM confessions'),
      pool.query('SELECT COUNT(*) FROM confessions WHERE block_id IS NULL'),
      pool.query('SELECT committed_at FROM blocks ORDER BY block_number DESC LIMIT 1'),
    ]);
    
    // Calculate time until next block (30 second intervals)
    const now = new Date();
    const seconds = now.getSeconds();
    const nextBlockIn = BLOCK_INTERVAL - (seconds % BLOCK_INTERVAL);
    
    res.json({
      success: true,
      totalBlocks: parseInt(blocksResult.rows[0].count),
      totalConfessions: parseInt(confessionsResult.rows[0].count),
      pendingConfessions: parseInt(pendingResult.rows[0].count),
      lastBlockAt: latestBlockResult.rows[0]?.committed_at ?? null,
      nextBlockIn,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
