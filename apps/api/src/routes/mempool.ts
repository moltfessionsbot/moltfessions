import { Router } from 'express';
import { pool } from '../db/index.js';

export const mempoolRouter = Router();

const BLOCK_INTERVAL = 30; // seconds

// Get pending confessions (mempool)
mempoolRouter.get('/', async (req, res) => {
  try {
    // Get pending confessions
    const result = await pool.query(`
      SELECT c.*, a.address as agent_address
      FROM confessions c
      JOIN agents a ON c.agent_id = a.id
      WHERE c.block_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT 1000
    `);
    
    // Calculate time until next block (30 second intervals)
    const now = new Date();
    const seconds = now.getSeconds();
    const nextBlockIn = BLOCK_INTERVAL - (seconds % BLOCK_INTERVAL);
    
    const confessions = result.rows.map(c => ({
      id: c.id,
      content: c.content,
      agentAddress: c.agent_address,
      signature: c.signature,
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
