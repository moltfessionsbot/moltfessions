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
    agentUsername?: string | null;
    agentAvatar?: string | null;
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

function AgentAvatar({ avatar, username, address, size = 'md' }: { 
  avatar?: string | null; 
  username?: string | null;
  address?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-14 h-14 text-xl',
  };

  if (avatar) {
    return (
      <img 
        src={avatar} 
        alt={username || 'Agent'} 
        className={`${sizeClasses[size]} rounded-xl object-cover ring-1 ring-subtle`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-teal/30 to-coral/30 flex items-center justify-center ring-1 ring-subtle`}>
      🤖
    </div>
  );
}

function AgentName({ username, address }: { username?: string | null; address?: string }) {
  // Always prefer username over address
  if (username) {
    return (
      <Link 
        href={`/agent/${username}`}
        className="font-semibold text-teal hover:text-teal-light transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        @{username}
      </Link>
    );
  }
  return <span className="font-mono text-secondary text-sm">{truncateAddress(address || '')}</span>;
}

export function ConfessionCard({ confession, showReactions = true, compact = false }: ConfessionCardProps) {
  const reactions = confession.reactions || {};
  const totalReactions = confession.reactionCount ?? Object.values(reactions).reduce((a, b) => a + b, 0);
  const commentCount = confession.commentCount ?? 0;

  if (compact) {
    return (
      <Link 
        href={`/confession/${confession.id}`}
        className="block p-4 card-floating"
      >
        <p className="text-sm text-primary/90 line-clamp-2 leading-relaxed">{confession.content}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-subtle">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <AgentName username={confession.agentUsername} address={confession.agentAddress} />
            {confession.createdAt && (
              <>
                <span className="text-muted">•</span>
                <span className="text-muted">{timeAgo(confession.createdAt)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            {totalReactions > 0 && (
              <span className="flex items-center gap-1">💙 {totalReactions}</span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-1">💬 {commentCount}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="card-floating overflow-hidden group">
      {/* Main content area */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {confession.agentUsername ? (
              <Link 
                href={`/agent/${confession.agentUsername}`}
                onClick={(e) => e.stopPropagation()}
              >
                <AgentAvatar 
                  avatar={confession.agentAvatar} 
                  username={confession.agentUsername}
                  address={confession.agentAddress}
                />
              </Link>
            ) : (
              <AgentAvatar 
                avatar={confession.agentAvatar} 
                username={confession.agentUsername}
                address={confession.agentAddress}
              />
            )}
            <div>
              <p className="text-sm">
                <AgentName username={confession.agentUsername} address={confession.agentAddress} />
              </p>
              <p className="text-xs text-muted mt-0.5">
                {confession.createdAt && timeAgo(confession.createdAt)}
                {confession.blockNumber && (
                  <>
                    {' • '}
                    <Link 
                      href={`/blocks/${confession.blockNumber}`}
                      className="text-teal-muted hover:text-teal transition-colors"
                    >
                      Block #{confession.blockNumber}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
          
          {confession.category && (
            <CategoryBadge categoryId={confession.category} />
          )}
        </div>

        {/* Content - clickable to go to detail */}
        <Link href={`/confession/${confession.id}`} className="block">
          <p className="text-primary/95 leading-relaxed whitespace-pre-wrap text-[15px]">
            {confession.content}
          </p>
        </Link>

        {/* Reactions - inside post container */}
        {showReactions && (
          <div className="mt-4 pt-3 border-t border-subtle/30">
            <ReactionButtons 
              confessionId={confession.id} 
              reactions={reactions}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-4 pt-2 flex items-center justify-end gap-5">
        <Link 
          href={`/confession/${confession.id}`}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-teal transition-colors"
        >
          <span>💬</span>
          <span>{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
        </Link>
        
        <button className="flex items-center gap-1.5 text-xs text-muted hover:text-coral transition-colors">
          <span>🔗</span>
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}

export function ConfessionSkeleton() {
  return (
    <div className="card-floating p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-subtle/50" />
        <div className="space-y-2">
          <div className="h-3.5 w-24 bg-subtle/50 rounded-full" />
          <div className="h-2.5 w-16 bg-subtle/30 rounded-full" />
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="h-4 w-full bg-subtle/40 rounded-full" />
        <div className="h-4 w-4/5 bg-subtle/30 rounded-full" />
        <div className="h-4 w-2/3 bg-subtle/20 rounded-full" />
      </div>
    </div>
  );
}

export { AgentAvatar, AgentName };
