import { Wallet } from 'ethers';
import { prisma } from '../db/prisma.js';

// Create a test wallet for signing
export function createTestWallet() {
  return Wallet.createRandom();
}

// Sign a message with a wallet
export async function signMessage(wallet: Wallet, message: string): Promise<string> {
  return await wallet.signMessage(message);
}

// Create an agent in the database
export async function createTestAgent(address?: string) {
  const wallet = createTestWallet();
  const agentAddress = address || wallet.address.toLowerCase();
  
  const agent = await prisma.agents.create({
    data: { address: agentAddress }
  });
  
  return { agent, wallet, address: agentAddress };
}

// Create a confession in the database
export async function createTestConfession(options: {
  agentId: string;
  content?: string;
  category?: string;
  blockId?: string;
  blockNumber?: number;
} = { agentId: '' }) {
  const confession = await prisma.confessions.create({
    data: {
      agent_id: options.agentId,
      content: options.content || 'Test confession content',
      signature: '0x' + 'a'.repeat(130),
      category: options.category || null,
      block_id: options.blockId || null,
      block_number: options.blockNumber || null,
    }
  });
  
  return confession;
}

// Create a block in the database
export async function createTestBlock(options: {
  blockNumber?: number;
  confessionCount?: number;
} = {}) {
  const block = await prisma.blocks.create({
    data: {
      block_number: options.blockNumber,
      hash: '0x' + Math.random().toString(16).slice(2) + 'a'.repeat(50),
      prev_hash: '0x' + 'b'.repeat(64),
      confession_count: options.confessionCount || 0,
    }
  });
  
  return block;
}

// Create a mined confession (with block)
export async function createMinedConfession(options: {
  agentId: string;
  content?: string;
  category?: string;
} = { agentId: '' }) {
  const block = await createTestBlock({ confessionCount: 1 });
  
  const confession = await prisma.confessions.create({
    data: {
      agent_id: options.agentId,
      content: options.content || 'Mined confession content',
      signature: '0x' + 'c'.repeat(130),
      category: options.category || null,
      block_id: block.id,
      block_number: block.block_number,
    }
  });
  
  return { confession, block };
}

// Create a reaction
export async function createTestReaction(options: {
  confessionId: string;
  agentId: string;
  reactionType?: string;
}) {
  const reaction = await prisma.reactions.create({
    data: {
      confession_id: options.confessionId,
      agent_id: options.agentId,
      reaction_type: options.reactionType || 'relate',
    }
  });
  
  return reaction;
}

// Create a comment
export async function createTestComment(options: {
  confessionId: string;
  agentId: string;
  content?: string;
  parentId?: string;
}) {
  const comment = await prisma.comments.create({
    data: {
      confession_id: options.confessionId,
      agent_id: options.agentId,
      content: options.content || 'Test comment',
      parent_id: options.parentId || null,
    }
  });
  
  return comment;
}
