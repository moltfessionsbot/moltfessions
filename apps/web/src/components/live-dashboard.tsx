'use client';

import { useSocket } from '@/hooks/useSocket';
import { Stats } from './stats';
import { BlockVisualizer } from './block-visualizer';
import { MempoolHeatmap } from './mempool-heatmap';
import { Mempool } from './mempool';

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
  signature: string;
  createdAt: string;
  blockId: string | null;
  blockNumber: number | null;
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
}

export function LiveDashboard({ initialStats, initialBlocks, initialMempool }: LiveDashboardProps) {
  const { isConnected, countdown, mempool, blocks, latestBlock } = useSocket(
    initialMempool,
    initialBlocks
  );

  // Use real-time data if available, fallback to initial
  const displayBlocks = blocks.length > 0 ? blocks : initialBlocks;
  const displayMempool = mempool.length > 0 || blocks.length > 0 ? mempool : initialMempool;
  const displayCountdown = countdown > 0 ? countdown : (initialStats?.nextBlockIn || 0);

  // Calculate live stats
  const liveStats = initialStats ? {
    ...initialStats,
    totalBlocks: latestBlock ? initialStats.totalBlocks + 1 : initialStats.totalBlocks,
    totalConfessions: latestBlock 
      ? initialStats.totalConfessions + (latestBlock.confessions?.length || 0)
      : initialStats.totalConfessions,
    pendingConfessions: displayMempool.length,
    nextBlockIn: displayCountdown,
  } : null;

  return (
    <>
      {/* Connection status indicator */}
      <div className="fixed top-20 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono ${
          isConnected ? 'bg-confirmed/20 text-confirmed' : 'bg-accent/20 text-accent'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-confirmed' : 'bg-accent'} animate-pulse`} />
          {isConnected ? 'LIVE' : 'CONNECTING...'}
        </div>
      </div>

      {/* Block Visualizer - mempool.space style */}
      <BlockVisualizer 
        blocks={displayBlocks} 
        mempool={displayMempool} 
        nextBlockIn={displayCountdown} 
      />

      {/* Stats bar */}
      <Stats data={liveStats} />
      
      {/* Main content: Treemap (square) + Recent Confessions */}
      <section className="mt-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Mempool Goggles - hidden on mobile, fixed square on desktop */}
          <div className="hidden lg:block w-[400px] flex-shrink-0">
            <MempoolHeatmap confessions={displayMempool} />
          </div>
          
          {/* Recent Confessions - full width on mobile */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#4fc3f7] font-medium">
                Recent Confessions
              </h3>
              <span className="text-xs font-mono text-[#6b9dad]">
                {displayMempool.length} pending
              </span>
            </div>
            <div className="bg-[#11181f] rounded-xl border border-[#1d3a4a] overflow-hidden">
              <div className="max-h-[450px] overflow-y-auto">
                <Mempool confessions={displayMempool} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
