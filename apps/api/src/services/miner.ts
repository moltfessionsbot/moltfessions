import { Server } from 'socket.io';
import { pool } from '../db/index.js';
import { hashBlock } from '../utils/crypto.js';
import { GENESIS_HASH } from '@moltfessions/shared';

export async function mineBlock(io?: Server) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get pending confessions
    const pendingResult = await client.query(`
      SELECT id, content, signature 
      FROM confessions 
      WHERE block_id IS NULL 
      ORDER BY created_at ASC
      LIMIT 5000
    `);
    
    if (pendingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    
    // Get previous block hash
    const prevBlockResult = await client.query(`
      SELECT hash, block_number FROM blocks 
      ORDER BY block_number DESC 
      LIMIT 1
    `);
    
    const prevHash = prevBlockResult.rows[0]?.hash ?? GENESIS_HASH;
    const nextBlockNumber = (prevBlockResult.rows[0]?.block_number ?? 0) + 1;
    
    // Create block hash
    const timestamp = Date.now();
    const blockHash = hashBlock({
      blockNumber: nextBlockNumber,
      prevHash,
      confessions: pendingResult.rows,
      timestamp,
    });
    
    // Insert block
    const blockResult = await client.query(`
      INSERT INTO blocks (block_number, prev_hash, hash, confession_count, committed_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [nextBlockNumber, prevHash, blockHash, pendingResult.rows.length]);
    
    const block = blockResult.rows[0];
    
    // Update confessions with block reference
    const confessionIds = pendingResult.rows.map(c => c.id);
    await client.query(`
      UPDATE confessions 
      SET block_id = $1, block_number = $2
      WHERE id = ANY($3)
    `, [block.id, nextBlockNumber, confessionIds]);
    
    // Get full confession details for the event
    const confessionsResult = await client.query(`
      SELECT c.*, a.address as agent_address
      FROM confessions c
      JOIN agents a ON c.agent_id = a.id
      WHERE c.id = ANY($1)
      ORDER BY c.created_at ASC
    `, [confessionIds]);
    
    await client.query('COMMIT');
    
    const minedBlock = {
      id: block.id,
      blockNumber: block.block_number,
      hash: block.hash,
      prevHash: block.prev_hash,
      confessionCount: block.confession_count,
      committedAt: block.committed_at,
    };
    
    const confessions = confessionsResult.rows.map(c => ({
      id: c.id,
      content: c.content,
      agentAddress: c.agent_address,
      signature: c.signature,
      createdAt: c.created_at,
    }));
    
    // Emit block mined event
    if (io) {
      io.emit('block:mined', { block: minedBlock, confessions });
    }
    
    return minedBlock;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
