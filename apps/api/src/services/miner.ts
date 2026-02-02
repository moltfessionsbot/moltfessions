import { Server } from 'socket.io';
import { prisma } from '../db/prisma.js';
import { hashBlock } from '../utils/crypto.js';
import { hashConfession, computeMerkleRoot } from '../utils/merkle.js';
import { isChainEnabled, commitBlockOnChain, getExplorerUrl } from './chain.js';
import { GENESIS_HASH, MAX_CONFESSIONS_PER_BLOCK } from '@moltfessions/shared';
import type { confessions, agents } from '@prisma/client';

type ConfessionWithAgent = confessions & { agents: agents | null };

export async function mineBlock(io?: Server) {
  // First, do the database transaction
  const result = await prisma.$transaction(async (tx) => {
    // Get pending confessions (limit per block to prevent huge blocks)
    const pending = await tx.confessions.findMany({
      where: { block_id: null },
      orderBy: { created_at: 'asc' },
      take: MAX_CONFESSIONS_PER_BLOCK,
      include: { agents: true },
    });
    
    // Get previous block
    const prevBlock = await tx.blocks.findFirst({
      orderBy: { block_number: 'desc' },
    });
    
    const prevHash = prevBlock?.hash ?? GENESIS_HASH;
    const nextBlockNumber = (prevBlock?.block_number ?? 0) + 1;
    
    // Create block hash (works for empty blocks too)
    const timestamp = Date.now();
    const blockHash = hashBlock({
      blockNumber: nextBlockNumber,
      prevHash,
      confessions: pending.map((c) => ({ 
        id: c.id, 
        content: c.content, 
        signature: c.signature 
      })),
      timestamp,
    });
    
    // Compute merkle root of confession hashes (returns zero hash for empty)
    const confessionHashes = pending.map((c) => hashConfession({
      id: c.id,
      agentAddress: c.agents?.address || '0x0000000000000000000000000000000000000000',
      content: c.content,
      signature: c.signature,
      createdAt: c.created_at || new Date(),
    }));
    const merkleRoot = computeMerkleRoot(confessionHashes);
    
    // Insert block (even if empty)
    const block = await tx.blocks.create({
      data: {
        block_number: nextBlockNumber,
        prev_hash: prevHash,
        hash: blockHash,
        merkle_root: merkleRoot,
        confession_count: pending.length,
      },
    });
    
    // Update confessions with block reference (if any)
    if (pending.length > 0) {
      await tx.confessions.updateMany({
        where: { id: { in: pending.map((c) => c.id) } },
        data: { 
          block_id: block.id, 
          block_number: nextBlockNumber 
        },
      });
    }
    
    // Prepare confession data for event
    const confessionData = pending.map((c) => ({
      id: c.id,
      content: c.content,
      agentAddress: c.agents?.address,
      agentUsername: c.agents?.username || null,
      agentAvatar: c.agents?.avatar_url || null,
      signature: c.signature,
      category: c.category,
      createdAt: c.created_at,
    }));
    
    return {
      block,
      confessionData,
      merkleRoot,
      confessionCount: pending.length,
    };
  });
  
  const { block, confessionData, merkleRoot, confessionCount } = result;
  
  // Commit to blockchain (outside transaction, after DB commit)
  let txHash: string | null = null;
  let chainCommittedAt: Date | null = null;
  
  if (isChainEnabled()) {
    const chainResult = await commitBlockOnChain(
      block.block_number,
      merkleRoot,
      confessionCount
    );
    
    if (chainResult) {
      txHash = chainResult.txHash;
      chainCommittedAt = new Date(chainResult.timestamp * 1000);
      
      // Update block with tx hash
      await prisma.blocks.update({
        where: { id: block.id },
        data: { 
          tx_hash: txHash,
          chain_committed_at: chainCommittedAt,
        },
      });
      
      console.log(`   🔗 Block ${block.block_number} committed on-chain: ${getExplorerUrl(txHash)}`);
    }
  }
  
  const minedBlock = {
    id: block.id,
    blockNumber: block.block_number,
    hash: block.hash,
    merkleRoot: block.merkle_root,
    prevHash: block.prev_hash,
    confessionCount: block.confession_count,
    committedAt: block.committed_at,
    txHash,
    chainCommittedAt,
  };
  
  // Emit block mined event
  if (io) {
    io.emit('block:mined', { block: minedBlock, confessions: confessionData });
  }
  
  return minedBlock;
}
