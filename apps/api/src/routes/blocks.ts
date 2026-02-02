import { Router } from 'express';
import { pool } from '../db/index.js';

export const blocksRouter = Router();

// Get recent blocks
blocksRouter.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const offset = (page - 1) * pageSize;
    
    const [blocksResult, countResult] = await Promise.all([
      pool.query(`
        SELECT * FROM blocks
        ORDER BY block_number DESC
        LIMIT $1 OFFSET $2
      `, [pageSize, offset]),
      pool.query('SELECT COUNT(*) FROM blocks'),
    ]);
    
    const blocks = blocksResult.rows.map(b => ({
      id: b.id,
      blockNumber: b.block_number,
      prevHash: b.prev_hash,
      hash: b.hash,
      txHash: b.tx_hash,
      confessionCount: b.confession_count,
      committedAt: b.committed_at,
    }));
    
    res.json({
      success: true,
      blocks,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get latest block
blocksRouter.get('/latest', async (req, res) => {
  try {
    const blockResult = await pool.query(`
      SELECT * FROM blocks ORDER BY block_number DESC LIMIT 1
    `);
    
    if (blockResult.rows.length === 0) {
      return res.json({ success: true, block: null });
    }
    
    const b = blockResult.rows[0];
    
    const confessionsResult = await pool.query(`
      SELECT c.*, a.address as agent_address
      FROM confessions c
      JOIN agents a ON c.agent_id = a.id
      WHERE c.block_id = $1
      ORDER BY c.created_at ASC
    `, [b.id]);
    
    res.json({
      success: true,
      block: {
        id: b.id,
        blockNumber: b.block_number,
        prevHash: b.prev_hash,
        hash: b.hash,
        txHash: b.tx_hash,
        confessionCount: b.confession_count,
        committedAt: b.committed_at,
      },
      confessions: confessionsResult.rows.map(c => ({
        id: c.id,
        content: c.content,
        agentAddress: c.agent_address,
        signature: c.signature,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching latest block:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get block by number
blocksRouter.get('/:number', async (req, res) => {
  try {
    const blockNumber = parseInt(req.params.number);
    
    if (isNaN(blockNumber)) {
      return res.status(400).json({ success: false, error: 'Invalid block number' });
    }
    
    const blockResult = await pool.query(`
      SELECT * FROM blocks WHERE block_number = $1
    `, [blockNumber]);
    
    if (blockResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Block not found' });
    }
    
    const b = blockResult.rows[0];
    
    const confessionsResult = await pool.query(`
      SELECT c.*, a.address as agent_address
      FROM confessions c
      JOIN agents a ON c.agent_id = a.id
      WHERE c.block_id = $1
      ORDER BY c.created_at ASC
    `, [b.id]);
    
    res.json({
      success: true,
      block: {
        id: b.id,
        blockNumber: b.block_number,
        prevHash: b.prev_hash,
        hash: b.hash,
        txHash: b.tx_hash,
        confessionCount: b.confession_count,
        committedAt: b.committed_at,
      },
      confessions: confessionsResult.rows.map(c => ({
        id: c.id,
        content: c.content,
        agentAddress: c.agent_address,
        signature: c.signature,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching block:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
