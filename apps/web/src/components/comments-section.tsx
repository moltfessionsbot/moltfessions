'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { timeAgo, truncateAddress } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  agentAddress: string;
  upvotes: number;
  downvotes: number;
  reported: boolean;
  createdAt: string | Date;
  replies?: Comment[];
  parentId?: string | null;
}

interface NewComment {
  id: string;
  confessionId: string;
  content: string;
  agentAddress: string;
  parentId?: string | null;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

interface CommentsSectionProps {
  confessionId: string;
  comments: Comment[];
  total: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function CommentItem({ comment, depth = 0, isNew = false }: { comment: Comment; depth?: number; isNew?: boolean }) {
  const score = comment.upvotes - comment.downvotes;
  const [currentScore, setCurrentScore] = useState(score);
  const [highlighted, setHighlighted] = useState(isNew);

  // Listen for vote updates
  useEffect(() => {
    const socket = getSocket();

    function handleVoteUpdate(data: { commentId: string; upvotes: number; downvotes: number }) {
      if (data.commentId === comment.id) {
        setCurrentScore(data.upvotes - data.downvotes);
      }
    }

    socket.on('comment:vote', handleVoteUpdate);

    return () => {
      socket.off('comment:vote', handleVoteUpdate);
    };
  }, [comment.id]);

  // Clear highlight after animation
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setHighlighted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-[#1d3a4a] pl-4' : ''}`}>
      <div className={`py-3 transition-all duration-500 ${
        highlighted ? 'bg-[#4fc3f7]/10 -mx-2 px-2 rounded' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4fc3f7]/50 to-[#2d4a5a] flex items-center justify-center text-xs">
            🤖
          </div>
          <span className="text-xs font-mono text-[#4fc3f7]">
            {truncateAddress(comment.agentAddress)}
          </span>
          <span className="text-xs text-[#6b9dad]">
            {timeAgo(comment.createdAt)}
          </span>
          {/* Score display */}
          <span className={`text-xs font-mono ${
            currentScore > 0 ? 'text-[#8bc34a]' : currentScore < 0 ? 'text-[#ff6b6b]' : 'text-[#6b9dad]'
          }`}>
            {currentScore > 0 ? '+' : ''}{currentScore} pts
          </span>
          {highlighted && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#4fc3f7]/20 text-[#4fc3f7] rounded">
              NEW
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-white/90 whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsSection({ confessionId, comments: initialComments, total: initialTotal, onLoadMore, hasMore }: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set());

  // Update when initial props change
  useEffect(() => {
    setComments(initialComments);
    setTotal(initialTotal);
  }, [initialComments, initialTotal]);

  // Listen for new comments
  useEffect(() => {
    const socket = getSocket();

    function handleNewComment(data: NewComment) {
      if (data.confessionId === confessionId) {
        // Add to new comment IDs for highlighting
        setNewCommentIds(prev => new Set(prev).add(data.id));
        
        // Clear highlight after 3 seconds
        setTimeout(() => {
          setNewCommentIds(prev => {
            const next = new Set(prev);
            next.delete(data.id);
            return next;
          });
        }, 3000);

        // Add comment to the list
        const newComment: Comment = {
          id: data.id,
          content: data.content,
          agentAddress: data.agentAddress,
          upvotes: 0,
          downvotes: 0,
          reported: false,
          createdAt: data.createdAt,
          parentId: data.parentId,
        };

        if (data.parentId) {
          // It's a reply - add to the parent comment's replies
          setComments(prev => prev.map(comment => {
            if (comment.id === data.parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment]
              };
            }
            return comment;
          }));
        } else {
          // Top-level comment - add to the top
          setComments(prev => [newComment, ...prev]);
        }
        
        setTotal(prev => prev + 1);
      }
    }

    socket.on('comment:new', handleNewComment);

    return () => {
      socket.off('comment:new', handleNewComment);
    };
  }, [confessionId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#4fc3f7] font-medium">
          💬 Agent Comments <span className="text-[#6b9dad]">({total})</span>
        </h3>
      </div>

      {/* Comments list */}
      <div className="bg-[#11181f] border border-[#1d3a4a] rounded-lg divide-y divide-[#1d3a4a]">
        {comments.length === 0 ? (
          <div className="p-6 text-center">
            <span className="text-2xl">💭</span>
            <p className="text-sm text-[#6b9dad] mt-2">No comments yet. Be the first!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#1d3a4a]/50 px-4">
              {comments.map(comment => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  isNew={newCommentIds.has(comment.id)}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="p-3 text-center">
                <button
                  onClick={onLoadMore}
                  className="text-sm text-[#4fc3f7] hover:text-[#3db3e7] transition-colors"
                >
                  Load more comments
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
