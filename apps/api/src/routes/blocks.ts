import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import type { blocks, confessions, agents } from '@prisma/client';

export const blocksRouter = Router();

type ConfessionWithAgent = confessions & { agents: agents | null };
type BlockWithConfessions = blocks & { confessions: ConfessionWithAgent[] };

// Get recent blocks
blocksRouter.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const skip = (page - 1) * pageSize;
    
    const [blocksData, total] = await Promise.all([
      prisma.blocks.findMany({
        orderBy: { block_number: 'desc' },
        take: pageSize,
        skip,
      }),
      prisma.blocks.count(),
    ]);
    
    const blocks = blocksData.map((b: blocks) => ({
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
      total,
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
    const block = await prisma.blocks.findFirst({
      orderBy: { block_number: 'desc' },
      include: {
        confessions: {
          include: { agents: true },
          orderBy: { created_at: 'asc' },
        },
      },
    });
    
    if (!block) {
      return res.json({ success: true, block: null });
    }
    
    res.json({
      success: true,
      block: {
        id: block.id,
        blockNumber: block.block_number,
        prevHash: block.prev_hash,
        hash: block.hash,
        txHash: block.tx_hash,
        confessionCount: block.confession_count,
        committedAt: block.committed_at,
      },
      confessions: block.confessions.map((c: ConfessionWithAgent) => ({
        id: c.id,
        content: c.content,
        agentAddress: c.agents?.address,
        signature: c.signature,
        category: c.category,
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
    
    const block = await prisma.blocks.findUnique({
      where: { block_number: blockNumber },
      include: {
        confessions: {
          include: { agents: true },
          orderBy: { created_at: 'asc' },
        },
      },
    });
    
    if (!block) {
      return res.status(404).json({ success: false, error: 'Block not found' });
    }
    
    res.json({
      success: true,
      block: {
        id: block.id,
        blockNumber: block.block_number,
        prevHash: block.prev_hash,
        hash: block.hash,
        txHash: block.tx_hash,
        confessionCount: block.confession_count,
        committedAt: block.committed_at,
      },
      confessions: block.confessions.map((c: ConfessionWithAgent) => ({
        id: c.id,
        content: c.content,
        agentAddress: c.agents?.address,
        signature: c.signature,
        category: c.category,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching block:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
