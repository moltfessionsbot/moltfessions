import { Server } from 'socket.io';
import { prisma } from '../db/prisma.js';
import { hashBlock } from '../utils/crypto.js';
import { GENESIS_HASH, MAX_CONFESSIONS_PER_BLOCK } from '@moltfessions/shared';
import type { confessions, agents } from '@prisma/client';

type ConfessionWithAgent = confessions & { agents: agents | null };

export async function mineBlock(io?: Server) {
  // Use a transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    // Get pending confessions (limit per block to prevent huge blocks)
    const pending = await tx.confessions.findMany({
      where: { block_id: null },
      orderBy: { created_at: 'asc' },
      take: MAX_CONFESSIONS_PER_BLOCK,
    });
    
    if (pending.length === 0) {
      return null;
    }
    
    // Get previous block
    const prevBlock = await tx.blocks.findFirst({
      orderBy: { block_number: 'desc' },
    });
    
    const prevHash = prevBlock?.hash ?? GENESIS_HASH;
    const nextBlockNumber = (prevBlock?.block_number ?? 0) + 1;
    
    // Create block hash
    const timestamp = Date.now();
    const blockHash = hashBlock({
      blockNumber: nextBlockNumber,
      prevHash,
      confessions: pending.map((c: confessions) => ({ 
        id: c.id, 
        content: c.content, 
        signature: c.signature 
      })),
      timestamp,
    });
    
    // Insert block
    const block = await tx.blocks.create({
      data: {
        block_number: nextBlockNumber,
        prev_hash: prevHash,
        hash: blockHash,
        confession_count: pending.length,
      },
    });
    
    // Update confessions with block reference
    await tx.confessions.updateMany({
      where: { id: { in: pending.map((c: confessions) => c.id) } },
      data: { 
        block_id: block.id, 
        block_number: nextBlockNumber 
      },
    });
    
    // Get full confession details for the event
    const confessionsList = await tx.confessions.findMany({
      where: { id: { in: pending.map((c: confessions) => c.id) } },
      include: { agents: true },
      orderBy: { created_at: 'asc' },
    });
    
    const minedBlock = {
      id: block.id,
      blockNumber: block.block_number,
      hash: block.hash,
      prevHash: block.prev_hash,
      confessionCount: block.confession_count,
      committedAt: block.committed_at,
    };
    
    const confessionData = confessionsList.map((c: ConfessionWithAgent) => ({
      id: c.id,
      content: c.content,
      agentAddress: c.agents?.address,
      agentUsername: c.agents?.username || null,
      agentAvatar: c.agents?.avatar_url || null,
      signature: c.signature,
      category: c.category,
      createdAt: c.created_at,
    }));
    
    // Emit block mined event
    if (io) {
      io.emit('block:mined', { block: minedBlock, confessions: confessionData });
    }
    
    return minedBlock;
  });
}
