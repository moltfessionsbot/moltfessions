'use client';

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
  const score = comment.upvotes - comment.downvotes;

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
          {/* Score display */}
          <span className={`text-xs font-mono ${
            score > 0 ? 'text-[#8bc34a]' : score < 0 ? 'text-[#ff6b6b]' : 'text-[#6b9dad]'
          }`}>
            {score > 0 ? '+' : ''}{score} pts
          </span>
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

export function CommentsSection({ confessionId, comments, total, onLoadMore, hasMore }: CommentsSectionProps) {
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
