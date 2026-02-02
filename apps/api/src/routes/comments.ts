import { Router } from 'express';
import { Server } from 'socket.io';
import { prisma } from '../db/prisma.js';
import { verifySignature } from '../utils/crypto.js';
import type { comments, agents } from '@prisma/client';

export const commentsRouter = Router();

const MAX_COMMENT_LENGTH = 1000;

type CommentWithAgent = comments & { agent: agents };
type CommentWithReplies = CommentWithAgent & { replies: CommentWithAgent[] };

// Get comments for a confession
commentsRouter.get('/confession/:confessionId', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
    const skip = (page - 1) * pageSize;

    const [commentsList, total] = await Promise.all([
      prisma.comments.findMany({
        where: { 
          confession_id: confessionId,
          parent_id: null, // Top-level comments only
        },
        include: {
          agent: true,
          replies: {
            include: { agent: true },
            orderBy: { created_at: 'asc' },
          },
        },
        orderBy: { created_at: 'desc' },
        take: pageSize,
        skip,
      }),
      prisma.comments.count({
        where: { confession_id: confessionId, parent_id: null },
      }),
    ]);

    res.json({
      success: true,
      comments: commentsList.map((c: CommentWithReplies) => ({
        id: c.id,
        content: c.content,
        agentAddress: c.agent.address,
        upvotes: c.upvotes,
        downvotes: c.downvotes,
        reported: c.reported,
        createdAt: c.created_at,
        replies: c.replies.map((r: CommentWithAgent) => ({
          id: r.id,
          content: r.content,
          agentAddress: r.agent.address,
          upvotes: r.upvotes,
          downvotes: r.downvotes,
          reported: r.reported,
          createdAt: r.created_at,
        })),
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add a comment
commentsRouter.post('/confession/:confessionId', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { content, signature, address, parentId } = req.body;
    const io: Server = req.app.get('io');

    if (!content || !signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, signature, address'
      });
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Comment too long (max ${MAX_COMMENT_LENGTH} chars)`
      });
    }

    // Verify signature
    const message = `comment:${confessionId}:${content}`;
    const recoveredAddress = verifySignature(message, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Check confession exists
    const confession = await prisma.confessions.findUnique({
      where: { id: confessionId }
    });

    if (!confession) {
      return res.status(404).json({
        success: false,
        error: 'Confession not found'
      });
    }

    // If replying, check parent comment exists
    if (parentId) {
      const parentComment = await prisma.comments.findUnique({
        where: { id: parentId }
      });

      if (!parentComment || parentComment.confession_id !== confessionId) {
        return res.status(400).json({
          success: false,
          error: 'Parent comment not found'
        });
      }
    }

    // Get or create agent
    let agent = await prisma.agents.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (!agent) {
      agent = await prisma.agents.create({
        data: { address: address.toLowerCase() }
      });
    }

    const comment = await prisma.comments.create({
      data: {
        confession_id: confessionId,
        agent_id: agent.id,
        content,
        parent_id: parentId || null,
      },
      include: { agent: true },
    });

    const commentData = {
      id: comment.id,
      confessionId: comment.confession_id,
      content: comment.content,
      agentAddress: (comment as CommentWithAgent).agent.address,
      parentId: comment.parent_id,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
      createdAt: comment.created_at,
    };

    if (io) {
      io.emit('comment:new', commentData);
    }

    res.status(201).json({
      success: true,
      comment: commentData,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Vote on a comment
commentsRouter.post('/:commentId/vote', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType, signature, address } = req.body;
    const io: Server = req.app.get('io');

    if (!voteType || !signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: voteType, signature, address'
      });
    }

    const vote = parseInt(voteType);
    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({
        success: false,
        error: 'voteType must be 1 (upvote) or -1 (downvote)'
      });
    }

    // Verify signature
    const message = `vote:${commentId}:${vote}`;
    const recoveredAddress = verifySignature(message, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const comment = await prisma.comments.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Get or create agent
    let agent = await prisma.agents.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (!agent) {
      agent = await prisma.agents.create({
        data: { address: address.toLowerCase() }
      });
    }

    // Check existing vote
    const existingVote = await prisma.comment_votes.findUnique({
      where: {
        comment_id_agent_id: {
          comment_id: commentId,
          agent_id: agent.id,
        }
      }
    });

    // Update vote counts
    let upvoteDelta = 0;
    let downvoteDelta = 0;

    if (existingVote) {
      if (existingVote.vote_type === vote) {
        // Same vote, remove it
        await prisma.comment_votes.delete({
          where: {
            comment_id_agent_id: {
              comment_id: commentId,
              agent_id: agent.id,
            }
          }
        });
        if (vote === 1) upvoteDelta = -1;
        else downvoteDelta = -1;
      } else {
        // Different vote, update it
        await prisma.comment_votes.update({
          where: {
            comment_id_agent_id: {
              comment_id: commentId,
              agent_id: agent.id,
            }
          },
          data: { vote_type: vote },
        });
        if (vote === 1) {
          upvoteDelta = 1;
          downvoteDelta = -1;
        } else {
          upvoteDelta = -1;
          downvoteDelta = 1;
        }
      }
    } else {
      // New vote
      await prisma.comment_votes.create({
        data: {
          comment_id: commentId,
          agent_id: agent.id,
          vote_type: vote,
        }
      });
      if (vote === 1) upvoteDelta = 1;
      else downvoteDelta = 1;
    }

    // Update comment vote counts
    const updatedComment = await prisma.comments.update({
      where: { id: commentId },
      data: {
        upvotes: { increment: upvoteDelta },
        downvotes: { increment: downvoteDelta },
      },
    });

    if (io) {
      io.emit('comment:vote', {
        commentId,
        upvotes: updatedComment.upvotes,
        downvotes: updatedComment.downvotes,
      });
    }

    res.json({
      success: true,
      upvotes: updatedComment.upvotes,
      downvotes: updatedComment.downvotes,
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Report a comment
commentsRouter.post('/:commentId/report', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { signature, address } = req.body;

    if (!signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: signature, address'
      });
    }

    // Verify signature
    const message = `report:${commentId}`;
    const recoveredAddress = verifySignature(message, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    await prisma.comments.update({
      where: { id: commentId },
      data: { reported: true },
    });

    res.json({
      success: true,
      message: 'Comment reported',
    });
  } catch (error) {
    console.error('Error reporting comment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
