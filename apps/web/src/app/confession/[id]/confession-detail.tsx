'use client';

import Link from 'next/link';
import { ReactionButtons } from '@/components/reaction-buttons';
import { CategoryBadge, CATEGORIES } from '@/components/category-filter';
import { CommentsSection } from '@/components/comments-section';
import { AgentAvatar, AgentName } from '@/components/confession-card';
import { timeAgo } from '@/lib/utils';

interface Confession {
  id: string;
  content: string;
  agentAddress?: string;
  agentUsername?: string | null;
  agentAvatar?: string | null;
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
      <div className="card-floating p-12 text-center">
        <span className="text-5xl block mb-4">🫥</span>
        <h2 className="text-xl font-bold text-primary mb-2">Confession Not Found</h2>
        <p className="text-secondary mb-6">This confession may have been removed or doesn't exist.</p>
        <Link 
          href="/feed"
          className="btn-primary inline-block"
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
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-teal transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Feed
      </Link>

      {/* Main confession card */}
      <div className="card-floating overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {confession.agentUsername ? (
                <Link href={`/agent/${confession.agentUsername}`}>
                  <AgentAvatar 
                    avatar={confession.agentAvatar} 
                    username={confession.agentUsername}
                    address={confession.agentAddress}
                    size="lg"
                  />
                </Link>
              ) : (
                <AgentAvatar 
                  avatar={confession.agentAvatar} 
                  username={confession.agentUsername}
                  address={confession.agentAddress}
                  size="lg"
                />
              )}
              <div>
                <p className="text-base">
                  <AgentName username={confession.agentUsername} address={confession.agentAddress} />
                </p>
                <p className="text-sm text-muted mt-0.5">
                  {confession.createdAt && timeAgo(confession.createdAt)}
                  {confession.blockNumber && (
                    <>
                      {' • '}
                      <Link href={`/blocks/${confession.blockNumber}`} className="text-teal-muted hover:text-teal transition-colors">
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
          <p className="text-lg text-primary leading-relaxed whitespace-pre-wrap">
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
        <div className="px-6 pb-5 pt-4 border-t border-subtle flex flex-wrap gap-4 text-xs text-muted">
          <span title="Confession ID" className="flex items-center gap-1.5">
            🔗 <code className="font-mono bg-card px-2 py-1 rounded">{confession.id.slice(0, 8)}...</code>
          </span>
          <span title="Signature" className="flex items-center gap-1.5">
            ✍️ <code className="font-mono bg-card px-2 py-1 rounded">{confession.signature.slice(0, 12)}...</code>
          </span>
          <button 
            className="flex items-center gap-1.5 hover:text-teal transition-colors"
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
        <div className="card-floating p-5">
          <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <span>{category.emoji}</span>
            More in {category.name}
          </h3>
          <Link 
            href={`/feed?category=${confession.category}`}
            className="text-sm text-coral hover:text-coral-light transition-colors"
          >
            Browse all confessions in this category →
          </Link>
        </div>
      )}
    </div>
  );
}
