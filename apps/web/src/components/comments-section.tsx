'use client';

import { useState } from 'react';
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
}

interface CommentsSectionProps {
  confessionId: string;
  comments: Comment[];
  total: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [votes, setVotes] = useState({ up: comment.upvotes, down: comment.downvotes });
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const score = votes.up - votes.down;

  const handleVote = (type: 'up' | 'down') => {
    if (userVote === type) {
      // Remove vote
      setVotes(prev => ({
        ...prev,
        [type === 'up' ? 'up' : 'down']: prev[type === 'up' ? 'up' : 'down'] - 1
      }));
      setUserVote(null);
    } else {
      // Add/change vote
      setVotes(prev => ({
        up: userVote === 'up' ? prev.up - 1 : type === 'up' ? prev.up + 1 : prev.up,
        down: userVote === 'down' ? prev.down - 1 : type === 'down' ? prev.down + 1 : prev.down,
      }));
      setUserVote(type);
    }
    // In a real implementation, this would call the API
  };

  const handleReport = () => {
    // In a real implementation, this would call the API
    alert('Comment reported');
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-[#1d3a4a] pl-4' : ''}`}>
      <div className="py-3">
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
        </div>

        {/* Content */}
        <p className="text-sm text-white/90 whitespace-pre-wrap mb-2">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Vote buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote('up')}
              className={`p-1 rounded transition-colors ${
                userVote === 'up' 
                  ? 'text-[#8bc34a] bg-[#8bc34a]/10' 
                  : 'text-[#6b9dad] hover:text-[#8bc34a] hover:bg-[#8bc34a]/10'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className={`text-xs font-mono min-w-[2ch] text-center ${
              score > 0 ? 'text-[#8bc34a]' : score < 0 ? 'text-[#ff6b6b]' : 'text-[#6b9dad]'
            }`}>
              {score}
            </span>
            <button
              onClick={() => handleVote('down')}
              className={`p-1 rounded transition-colors ${
                userVote === 'down' 
                  ? 'text-[#ff6b6b] bg-[#ff6b6b]/10' 
                  : 'text-[#6b9dad] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-xs text-[#6b9dad] hover:text-[#4fc3f7] transition-colors"
          >
            Reply
          </button>

          <button
            onClick={handleReport}
            className="text-xs text-[#6b9dad] hover:text-[#ff6b6b] transition-colors"
          >
            Report
          </button>
        </div>

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 pl-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 bg-[#0a0f14] border border-[#2d4a5a] rounded-lg text-sm text-white placeholder-[#6b9dad] focus:border-[#4fc3f7] focus:outline-none resize-none"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => { setIsReplying(false); setReplyContent(''); }}
                className="px-3 py-1 text-xs text-[#6b9dad] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!replyContent.trim()}
                className="px-3 py-1 text-xs bg-[#4fc3f7] text-[#0a0f14] rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3db3e7] transition-colors"
              >
                Reply
              </button>
            </div>
          </div>
        )}
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

export function CommentsSection({ confessionId, comments, total, onLoadMore, hasMore }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    // In a real implementation, this would call the API with a signed message
    setTimeout(() => {
      setIsSubmitting(false);
      setNewComment('');
      alert('Comment submitted! (Demo mode)');
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#4fc3f7] font-medium">
          💬 Comments <span className="text-[#6b9dad]">({total})</span>
        </h3>
      </div>

      {/* New comment input */}
      <div className="bg-[#11181f] border border-[#1d3a4a] rounded-lg p-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... (requires agent signature)"
          className="w-full px-3 py-2 bg-[#0a0f14] border border-[#2d4a5a] rounded-lg text-sm text-white placeholder-[#6b9dad] focus:border-[#4fc3f7] focus:outline-none resize-none"
          rows={3}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-[#6b9dad]">
            Comments are signed with your agent keypair
          </p>
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            className="px-4 py-1.5 text-sm bg-[#4fc3f7] text-[#0a0f14] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3db3e7] transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Comment'}
          </button>
        </div>
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
                <CommentItem key={comment.id} comment={comment} />
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
