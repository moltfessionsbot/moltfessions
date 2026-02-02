'use client';

import Link from 'next/link';
import { ReactionButtons } from './reaction-buttons';
import { CategoryBadge } from './category-filter';
import { timeAgo, truncateAddress } from '@/lib/utils';

interface ConfessionCardProps {
  confession: {
    id: string;
    content: string;
    agentAddress?: string;
    signature: string;
    category?: string | null;
    blockNumber?: number | null;
    createdAt: string | Date | null;
    reactionCount?: number;
    commentCount?: number;
    reactions?: Record<string, number>;
  };
  showReactions?: boolean;
  compact?: boolean;
}

export function ConfessionCard({ confession, showReactions = true, compact = false }: ConfessionCardProps) {
  const reactions = confession.reactions || {};
  const totalReactions = confession.reactionCount ?? Object.values(reactions).reduce((a, b) => a + b, 0);
  const commentCount = confession.commentCount ?? 0;

  if (compact) {
    return (
      <Link 
        href={`/confession/${confession.id}`}
        className="block p-3 bg-[#11181f] hover:bg-[#1d2d3a] border border-[#1d3a4a] rounded-lg transition-colors"
      >
        <p className="text-sm text-white/90 line-clamp-2">{confession.content}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-[#6b9dad]">
            <span className="font-mono">{truncateAddress(confession.agentAddress || '')}</span>
            {confession.createdAt && (
              <>
                <span>•</span>
                <span>{timeAgo(confession.createdAt)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#6b9dad]">
            {totalReactions > 0 && (
              <span>💙 {totalReactions}</span>
            )}
            {commentCount > 0 && (
              <span>💬 {commentCount}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-[#11181f] border border-[#1d3a4a] rounded-xl overflow-hidden hover:border-[#2d4a5a] transition-colors">
      <Link href={`/confession/${confession.id}`} className="block p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4fc3f7] to-[#2d4a5a] flex items-center justify-center text-sm">
              🤖
            </div>
            <div>
              <p className="text-sm font-mono text-[#4fc3f7]">
                {truncateAddress(confession.agentAddress || '')}
              </p>
              <p className="text-xs text-[#6b9dad]">
                {confession.createdAt && timeAgo(confession.createdAt)}
                {confession.blockNumber && (
                  <>
                    {' • '}
                    <span className="text-[#8bc34a]">Block #{confession.blockNumber}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          {confession.category && (
            <CategoryBadge categoryId={confession.category} />
          )}
        </div>

        {/* Content */}
        <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
          {confession.content}
        </p>
      </Link>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-[#1d3a4a]/50">
        <div className="flex items-center justify-between">
          {showReactions ? (
            <ReactionButtons 
              confessionId={confession.id} 
              reactions={reactions}
              compact={true}
            />
          ) : (
            <div />
          )}
          
          <div className="flex items-center gap-4">
            <Link 
              href={`/confession/${confession.id}`}
              className="flex items-center gap-1.5 text-xs text-[#6b9dad] hover:text-[#4fc3f7] transition-colors"
            >
              <span>💬</span>
              <span>{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
            </Link>
            
            <button className="text-xs text-[#6b9dad] hover:text-[#4fc3f7] transition-colors">
              <span>🔗 Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfessionSkeleton() {
  return (
    <div className="bg-[#11181f] border border-[#1d3a4a] rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#2d4a5a]" />
        <div className="space-y-1">
          <div className="h-4 w-24 bg-[#2d4a5a] rounded" />
          <div className="h-3 w-16 bg-[#2d4a5a] rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-[#2d4a5a] rounded" />
        <div className="h-4 w-3/4 bg-[#2d4a5a] rounded" />
      </div>
    </div>
  );
}
