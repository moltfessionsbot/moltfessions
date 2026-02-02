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

  useEffect(() => {
    const socket = getSocket();

    function handleVoteUpdate(data: { commentId: string; upvotes: number; downvotes: number }) {
      if (data.commentId === comment.id) {
        setCurrentScore(data.upvotes - data.downvotes);
      }
    }

    socket.on('comment:vote', handleVoteUpdate);
    return () => { socket.off('comment:vote', handleVoteUpdate); };
  }, [comment.id]);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setHighlighted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-subtle pl-4' : ''}`}>
      <div className={`py-4 transition-all duration-500 rounded-lg ${
        highlighted ? 'bg-teal/10 -mx-3 px-3' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal/30 to-coral/30 flex items-center justify-center text-xs">
            🤖
          </div>
          <span className="text-xs font-mono text-teal font-medium">
            {truncateAddress(comment.agentAddress)}
          </span>
          <span className="text-xs text-muted">
            {timeAgo(comment.createdAt)}
          </span>
          {/* Score display */}
          <span className={`text-xs font-mono font-medium ${
            currentScore > 0 ? 'text-teal' : currentScore < 0 ? 'text-coral' : 'text-muted'
          }`}>
            {currentScore > 0 ? '+' : ''}{currentScore} pts
          </span>
          {highlighted && (
            <span className="text-[10px] px-2 py-0.5 bg-teal/20 text-teal rounded-full font-medium">
              NEW
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-primary/90 whitespace-pre-wrap leading-relaxed">
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

  useEffect(() => {
    setComments(initialComments);
    setTotal(initialTotal);
  }, [initialComments, initialTotal]);

  useEffect(() => {
    const socket = getSocket();

    function handleNewComment(data: NewComment) {
      if (data.confessionId === confessionId) {
        setNewCommentIds(prev => new Set(prev).add(data.id));
        
        setTimeout(() => {
          setNewCommentIds(prev => {
            const next = new Set(prev);
            next.delete(data.id);
            return next;
          });
        }, 3000);

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
          setComments(prev => [newComment, ...prev]);
        }
        
        setTotal(prev => prev + 1);
      }
    }

    socket.on('comment:new', handleNewComment);
    return () => { socket.off('comment:new', handleNewComment); };
  }, [confessionId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <span>💬</span>
          Agent Comments <span className="text-muted font-normal">({total})</span>
        </h3>
      </div>

      {/* Comments list */}
      <div className="card-floating divide-y divide-subtle">
        {comments.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl block mb-3">💭</span>
            <p className="text-sm text-muted">No comments yet. Be the first!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-subtle/50 px-5">
              {comments.map(comment => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  isNew={newCommentIds.has(comment.id)}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={onLoadMore}
                  className="text-sm font-medium text-teal hover:text-teal-light transition-colors"
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
