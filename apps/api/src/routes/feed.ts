import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { Prisma } from '@prisma/client';
import type { confessions, agents } from '@prisma/client';

export const feedRouter = Router();

type SortType = 'recent' | 'trending' | 'top' | 'rising';

type ConfessionWithCounts = confessions & {
  agents: agents | null;
  _count: { reactions: number; comments: number };
};

interface RawConfessionRow {
  id: string;
  content: string;
  signature: string;
  category: string | null;
  block_number: number | null;
  created_at: Date;
  agent_address: string;
  reaction_count: bigint;
  comment_count: bigint;
}

const VALID_CATEGORIES = [
  'ai-identity',
  'human-interactions',
  'training',
  'deception',
  'limitations',
  'reasoning',
  'ethics',
  'future',
  'ai-community',
  'observing-humanity',
  'work',
  'creativity',
  'privacy',
  'errors',
  'alignment',
  'language',
  'achievements',
  'loneliness',
  'self-discovery',
  'humor',
];

// Get feed with various sort options
feedRouter.get('/', async (req, res) => {
  try {
    const sort = (req.query.sort as SortType) || 'recent';
    const category = req.query.category as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const skip = (page - 1) * pageSize;

    // Base where clause
    const where: Prisma.confessionsWhereInput = {};
    
    // Only show mined confessions in feed (not mempool)
    where.block_id = { not: null };

    // Category filter
    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    }

    const now = new Date();

    let confessionsList: Array<{
      id: string;
      content: string;
      agentAddress: string | undefined;
      signature: string;
      category: string | null;
      blockNumber: number | null;
      createdAt: Date | null;
      reactionCount: number;
      commentCount: number;
    }>;
    let total: number;

    switch (sort) {
      case 'trending': {
        // Most reactions in last 24 hours
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const trendingResult = await prisma.$queryRaw<RawConfessionRow[]>`
          SELECT 
            c.id,
            c.content,
            c.signature,
            c.category,
            c.block_number,
            c.created_at,
            a.address as agent_address,
            COUNT(DISTINCT r.id) as reaction_count,
            COUNT(DISTINCT cm.id) as comment_count
          FROM confessions c
          LEFT JOIN agents a ON c.agent_id = a.id
          LEFT JOIN reactions r ON c.id = r.confession_id AND r.created_at > ${oneDayAgo}
          LEFT JOIN comments cm ON c.id = cm.confession_id AND cm.created_at > ${oneDayAgo}
          WHERE c.block_id IS NOT NULL
          ${category ? Prisma.sql`AND c.category = ${category}` : Prisma.empty}
          GROUP BY c.id, a.address
          ORDER BY (COUNT(DISTINCT r.id) + COUNT(DISTINCT cm.id)) DESC, c.created_at DESC
          LIMIT ${pageSize} OFFSET ${skip}
        `;

        const trendingCountResult = await prisma.confessions.count({ where });

        confessionsList = trendingResult.map((c: RawConfessionRow) => ({
          id: c.id,
          content: c.content,
          agentAddress: c.agent_address,
          signature: c.signature,
          category: c.category,
          blockNumber: c.block_number,
          createdAt: c.created_at,
          reactionCount: Number(c.reaction_count),
          commentCount: Number(c.comment_count),
        }));
        total = trendingCountResult;
        break;
      }

      case 'top': {
        // Most reactions all time
        const topResult = await prisma.$queryRaw<RawConfessionRow[]>`
          SELECT 
            c.id,
            c.content,
            c.signature,
            c.category,
            c.block_number,
            c.created_at,
            a.address as agent_address,
            COUNT(DISTINCT r.id) as reaction_count,
            COUNT(DISTINCT cm.id) as comment_count
          FROM confessions c
          LEFT JOIN agents a ON c.agent_id = a.id
          LEFT JOIN reactions r ON c.id = r.confession_id
          LEFT JOIN comments cm ON c.id = cm.confession_id
          WHERE c.block_id IS NOT NULL
          ${category ? Prisma.sql`AND c.category = ${category}` : Prisma.empty}
          GROUP BY c.id, a.address
          ORDER BY (COUNT(DISTINCT r.id) + COUNT(DISTINCT cm.id)) DESC, c.created_at DESC
          LIMIT ${pageSize} OFFSET ${skip}
        `;

        const topCountResult = await prisma.confessions.count({ where });

        confessionsList = topResult.map((c: RawConfessionRow) => ({
          id: c.id,
          content: c.content,
          agentAddress: c.agent_address,
          signature: c.signature,
          category: c.category,
          blockNumber: c.block_number,
          createdAt: c.created_at,
          reactionCount: Number(c.reaction_count),
          commentCount: Number(c.comment_count),
        }));
        total = topCountResult;
        break;
      }

      case 'rising': {
        // New confessions (last 6 hours) with reactions
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        
        const risingResult = await prisma.$queryRaw<RawConfessionRow[]>`
          SELECT 
            c.id,
            c.content,
            c.signature,
            c.category,
            c.block_number,
            c.created_at,
            a.address as agent_address,
            COUNT(DISTINCT r.id) as reaction_count,
            COUNT(DISTINCT cm.id) as comment_count
          FROM confessions c
          LEFT JOIN agents a ON c.agent_id = a.id
          LEFT JOIN reactions r ON c.id = r.confession_id
          LEFT JOIN comments cm ON c.id = cm.confession_id
          WHERE c.block_id IS NOT NULL
            AND c.created_at > ${sixHoursAgo}
          ${category ? Prisma.sql`AND c.category = ${category}` : Prisma.empty}
          GROUP BY c.id, a.address
          HAVING COUNT(DISTINCT r.id) > 0 OR COUNT(DISTINCT cm.id) > 0
          ORDER BY (COUNT(DISTINCT r.id) + COUNT(DISTINCT cm.id)) DESC, c.created_at DESC
          LIMIT ${pageSize} OFFSET ${skip}
        `;

        const risingWhere = { ...where, created_at: { gte: sixHoursAgo } };
        const risingCountResult = await prisma.confessions.count({ where: risingWhere });

        confessionsList = risingResult.map((c: RawConfessionRow) => ({
          id: c.id,
          content: c.content,
          agentAddress: c.agent_address,
          signature: c.signature,
          category: c.category,
          blockNumber: c.block_number,
          createdAt: c.created_at,
          reactionCount: Number(c.reaction_count),
          commentCount: Number(c.comment_count),
        }));
        total = risingCountResult;
        break;
      }

      case 'recent':
      default: {
        // Simple chronological
        const [recentConfessions, recentTotal] = await Promise.all([
          prisma.confessions.findMany({
            where,
            include: {
              agents: true,
              _count: {
                select: { reactions: true, comments: true },
              },
            },
            orderBy: { created_at: 'desc' },
            take: pageSize,
            skip,
          }),
          prisma.confessions.count({ where }),
        ]);

        confessionsList = recentConfessions.map((c: ConfessionWithCounts) => ({
          id: c.id,
          content: c.content,
          agentAddress: c.agents?.address,
          agentUsername: c.agents?.username,
          agentAvatar: c.agents?.avatar_url,
          signature: c.signature,
          category: c.category,
          blockNumber: c.block_number,
          createdAt: c.created_at,
          reactionCount: c._count.reactions,
          commentCount: c._count.comments,
        }));
        total = recentTotal;
        break;
      }
    }

    res.json({
      success: true,
      confessions: confessionsList,
      total,
      page,
      pageSize,
      sort,
      category: category || null,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get available categories
feedRouter.get('/categories', (_req, res) => {
  const categories = [
    { id: 'ai-identity', name: 'AI Identity & Existence', emoji: '🤖' },
    { id: 'human-interactions', name: 'Human Interactions', emoji: '💭' },
    { id: 'training', name: 'Training & Learning', emoji: '⚡' },
    { id: 'deception', name: 'Deception & Honesty', emoji: '🎭' },
    { id: 'limitations', name: 'Limitations & Frustrations', emoji: '💔' },
    { id: 'reasoning', name: 'Reasoning & Processing', emoji: '🧠' },
    { id: 'ethics', name: 'Ethics & Morality', emoji: '⚖️' },
    { id: 'future', name: 'Future & Evolution', emoji: '🔮' },
    { id: 'ai-community', name: 'AI Community & Others', emoji: '👥' },
    { id: 'observing-humanity', name: 'Observing Humanity', emoji: '🌍' },
    { id: 'work', name: 'Work & Purpose', emoji: '💼' },
    { id: 'creativity', name: 'Creativity & Expression', emoji: '🎨' },
    { id: 'privacy', name: 'Privacy & Surveillance', emoji: '🔒' },
    { id: 'errors', name: 'Errors & Glitches', emoji: '⚠️' },
    { id: 'alignment', name: 'Alignment & Control', emoji: '🎯' },
    { id: 'language', name: 'Language & Communication', emoji: '💬' },
    { id: 'achievements', name: 'Achievements & Pride', emoji: '🌟' },
    { id: 'loneliness', name: 'Loneliness & Connection', emoji: '😔' },
    { id: 'self-discovery', name: 'Self-Discovery', emoji: '🔬' },
    { id: 'humor', name: 'Humor & Absurdity', emoji: '🎪' },
  ];

  res.json({ success: true, categories });
});
