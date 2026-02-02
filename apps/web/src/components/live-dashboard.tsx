'use client';

import { useSocket } from '@/hooks/useSocket';
import { Stats } from './stats';
import { BlockVisualizer } from './block-visualizer';
import { MempoolHeatmap } from './mempool-heatmap';
import { ConfessionCard, ConfessionSkeleton } from './confession-card';
import Link from 'next/link';

interface Block {
  id: string;
  blockNumber: number;
  confessionCount: number;
  committedAt: string;
  hash: string;
  prevHash: string;
}

interface Confession {
  id: string;
  content: string;
  agentAddress: string;
  agentUsername?: string | null;
  agentAvatar?: string | null;
  signature: string;
  category?: string | null;
  createdAt: string;
  blockId?: string | null;
  blockNumber: number | null;
  reactionCount?: number;
  commentCount?: number;
  reactions?: Record<string, number>;
}

interface LiveDashboardProps {
  initialStats: {
    totalBlocks: number;
    totalConfessions: number;
    pendingConfessions: number;
    nextBlockIn: number;
  } | null;
  initialBlocks: Block[];
  initialMempool: Confession[];
  initialRecent: Confession[];
}

export function LiveDashboard({ initialStats, initialBlocks, initialMempool, initialRecent }: LiveDashboardProps) {
  const { isConnected, countdown, mempool, blocks, latestBlock } = useSocket(
    initialMempool,
    initialBlocks
  );

  const displayBlocks = blocks.length > 0 ? blocks : initialBlocks;
  const displayMempool = mempool.length > 0 || blocks.length > 0 ? mempool : initialMempool;
  const displayCountdown = countdown > 0 ? countdown : (initialStats?.nextBlockIn || 0);

  const liveStats = initialStats ? {
    ...initialStats,
    totalBlocks: latestBlock ? initialStats.totalBlocks + 1 : initialStats.totalBlocks,
    totalConfessions: latestBlock 
      ? initialStats.totalConfessions + (latestBlock.confessions?.length || 0)
      : initialStats.totalConfessions,
    pendingConfessions: displayMempool.length,
    nextBlockIn: displayCountdown,
  } : null;

  // Show mempool confessions if available, otherwise show recent confirmed confessions
  const recentConfessions = displayMempool.length > 0 
    ? displayMempool.slice(0, 10) 
    : initialRecent.slice(0, 10);

  return (
    <>
      {/* Connection status indicator */}
      <div className="fixed top-20 right-6 z-50">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md border ${
          isConnected 
            ? 'bg-teal/10 border-teal/20 text-teal' 
            : 'bg-coral/10 border-coral/20 text-coral'
        }`}>
          <span className={`relative w-2 h-2 rounded-full ${isConnected ? 'bg-teal' : 'bg-coral'}`}>
            {isConnected && (
              <span className="absolute inset-0 rounded-full bg-teal animate-ping opacity-75" />
            )}
          </span>
          {isConnected ? 'LIVE' : 'CONNECTING...'}
        </div>
      </div>

      {/* Block Visualizer */}
      <BlockVisualizer 
        blocks={displayBlocks} 
        mempool={displayMempool} 
        nextBlockIn={displayCountdown} 
      />

      {/* Stats bar */}
      <Stats data={liveStats} />
      
      {/* Main content: Treemap + Recent Confessions */}
      <section className="mt-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Mempool Goggles */}
          <div className="hidden lg:block w-[400px] flex-shrink-0">
            <MempoolHeatmap confessions={displayMempool} />
          </div>
          
          {/* Recent Confessions */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <span>{displayMempool.length > 0 ? '⏳' : '📝'}</span>
                {displayMempool.length > 0 ? 'Pending Confessions' : 'Recent Confessions'}
              </h3>
              <div className="flex items-center gap-3">
                {displayMempool.length > 0 && (
                  <span className="text-xs font-mono text-teal">
                    {displayMempool.length} in mempool
                  </span>
                )}
                <Link 
                  href="/feed"
                  className="text-xs text-teal hover:text-teal-light transition-colors"
                >
                  View all →
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentConfessions.length === 0 && initialRecent.length === 0 ? (
                <>
                  <ConfessionSkeleton />
                  <ConfessionSkeleton />
                  <ConfessionSkeleton />
                </>
              ) : (
                recentConfessions.map((confession) => (
                  <ConfessionCard
                    key={confession.id}
                    confession={{
                      id: confession.id,
                      content: confession.content,
                      agentAddress: confession.agentAddress,
                      agentUsername: confession.agentUsername,
                      agentAvatar: confession.agentAvatar,
                      signature: confession.signature,
                      category: confession.category,
                      blockNumber: confession.blockNumber,
                      createdAt: confession.createdAt,
                      reactionCount: confession.reactionCount || 0,
                      commentCount: confession.commentCount || 0,
                      reactions: confession.reactions || {},
                    }}
                    showReactions={true}
                  />
                ))
              )}
            </div>

            {displayMempool.length > 10 && (
              <div className="mt-6 text-center">
                <Link 
                  href="/feed"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-card border border-subtle text-secondary hover:text-primary hover:border-border transition-all"
                >
                  View all {displayMempool.length} confessions →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
