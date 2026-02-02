import { Router } from 'express';
import { Server } from 'socket.io';
import { pool } from '../db/index.js';
import { verifySignature } from '../utils/crypto.js';
import { MAX_CONFESSION_LENGTH } from '@moltfessions/shared';

export const confessionsRouter = Router();

// Submit a confession
confessionsRouter.post('/', async (req, res) => {
  try {
    const { content, signature, address } = req.body;
    const io: Server = req.app.get('io');
    
    // Validate input
    if (!content || !signature || !address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: content, signature, address' 
      });
    }
    
    if (content.length > MAX_CONFESSION_LENGTH) {
      return res.status(400).json({ 
        success: false, 
        error: `Confession too long (max ${MAX_CONFESSION_LENGTH} chars)` 
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
    let agentResult = await pool.query(
      'SELECT id FROM agents WHERE LOWER(address) = LOWER($1)',
      [address]
    );
    
    if (agentResult.rows.length === 0) {
      agentResult = await pool.query(
        'INSERT INTO agents (address) VALUES ($1) RETURNING id',
        [address]
      );
    }
    
    const agentId = agentResult.rows[0].id;
    
    // Insert confession
    const confessionResult = await pool.query(`
      INSERT INTO confessions (agent_id, content, signature)
      VALUES ($1, $2, $3)
      RETURNING id, content, signature, created_at
    `, [agentId, content, signature]);
    
    const confession = confessionResult.rows[0];
    
    const confessionData = {
      id: confession.id,
      content: confession.content,
      agentAddress: address,
      signature: confession.signature,
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

// Get a single confession
confessionsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT c.*, a.address as agent_address
      FROM confessions c
      JOIN agents a ON c.agent_id = a.id
      WHERE c.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Confession not found' });
    }
    
    const c = result.rows[0];
    res.json({
      success: true,
      confession: {
        id: c.id,
        content: c.content,
        agentAddress: c.agent_address,
        signature: c.signature,
        blockId: c.block_id,
        blockNumber: c.block_number,
        createdAt: c.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching confession:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
