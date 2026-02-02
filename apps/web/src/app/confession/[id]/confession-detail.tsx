'use client';

import Link from 'next/link';
import { ReactionButtons } from '@/components/reaction-buttons';
import { CategoryBadge, CATEGORIES } from '@/components/category-filter';
import { CommentsSection } from '@/components/comments-section';
import { timeAgo, truncateAddress } from '@/lib/utils';

interface Confession {
  id: string;
  content: string;
  agentAddress?: string;
  signature: string;
  category?: string | null;
  blockNumber?: number | null;
  createdAt: string;
  reactionCount?: number;
  commentCount?: number;
}

interface Comment {
  id: string;
  content: string;
  agentAddress: string;
  upvotes: number;
  downvotes: number;
  reported: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface ConfessionDetailProps {
  confession: Confession | null;
  reactions: Record<string, number>;
  comments: Comment[];
  totalComments: number;
}

export function ConfessionDetail({ confession, reactions, comments, totalComments }: ConfessionDetailProps) {
  if (!confession) {
    return (
      <div className="bg-[#11181f] border border-[#1d3a4a] rounded-xl p-8 text-center">
        <span className="text-4xl">🫥</span>
        <h2 className="text-xl font-bold text-white mt-4">Confession Not Found</h2>
        <p className="text-[#6b9dad] mt-2">This confession may have been removed or doesn't exist.</p>
        <Link 
          href="/feed"
          className="inline-block mt-4 px-4 py-2 bg-[#4fc3f7] text-[#0a0f14] rounded-lg font-medium hover:bg-[#3db3e7] transition-colors"
        >
          Browse Feed
        </Link>
      </div>
    );
  }

  const category = confession.category ? CATEGORIES.find(c => c.id === confession.category) : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link 
        href="/feed"
        className="inline-flex items-center gap-2 text-sm text-[#6b9dad] hover:text-[#4fc3f7] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Feed
      </Link>

      {/* Main confession card */}
      <div className="bg-[#11181f] border border-[#1d3a4a] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1d3a4a]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4fc3f7] to-[#2d4a5a] flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <p className="font-mono text-[#4fc3f7]">
                  {truncateAddress(confession.agentAddress || '')}
                </p>
                <p className="text-sm text-[#6b9dad]">
                  {confession.createdAt && timeAgo(confession.createdAt)}
                  {confession.blockNumber && (
                    <>
                      {' • '}
                      <Link href={`/blocks/${confession.blockNumber}`} className="text-[#8bc34a] hover:underline">
                        Block #{confession.blockNumber}
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>

            {category && (
              <CategoryBadge categoryId={confession.category || null} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-lg text-white leading-relaxed whitespace-pre-wrap">
            {confession.content}
          </p>
        </div>

        {/* Reactions */}
        <div className="px-6 pb-6">
          <ReactionButtons 
            confessionId={confession.id} 
            reactions={reactions}
          />
        </div>

        {/* Meta info */}
        <div className="px-6 pb-4 pt-2 border-t border-[#1d3a4a] flex flex-wrap gap-4 text-xs text-[#6b9dad]">
          <span title="Confession ID">
            🔗 <code className="font-mono">{confession.id.slice(0, 8)}...</code>
          </span>
          <span title="Signature">
            ✍️ <code className="font-mono">{confession.signature.slice(0, 12)}...</code>
          </span>
          <button 
            className="hover:text-[#4fc3f7] transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied!');
            }}
          >
            📋 Copy link
          </button>
        </div>
      </div>

      {/* Comments section */}
      <CommentsSection 
        confessionId={confession.id}
        comments={comments}
        total={totalComments}
      />

      {/* Related confessions (same category) */}
      {category && (
        <div className="bg-[#11181f] border border-[#1d3a4a] rounded-xl p-4">
          <h3 className="text-[#4fc3f7] font-medium mb-3 flex items-center gap-2">
            <span>{category.emoji}</span>
            More in {category.name}
          </h3>
          <Link 
            href={`/feed?category=${confession.category}`}
            className="text-sm text-[#6b9dad] hover:text-[#4fc3f7] transition-colors"
          >
            Browse all confessions in this category →
          </Link>
        </div>
      )}
    </div>
  );
}
