'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { formatCountdown, timeAgo } from '@/lib/utils';

interface Block {
  id: string;
  blockNumber: number;
  confessionCount: number;
  committedAt: string;
  hash: string;
}

interface Confession {
  id: string;
  content: string;
  agentAddress: string;
  createdAt: string;
}

interface BlockVisualizerProps {
  blocks: Block[];
  mempool: Confession[];
  nextBlockIn: number;
}

export function BlockVisualizer({ blocks, mempool, nextBlockIn }: BlockVisualizerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastBlockNumber, setLastBlockNumber] = useState<number | null>(null);
  const currentBlockNumber = blocks[0]?.blockNumber || 0;

  // Scroll to show mining block (right side) on mobile
  const scrollToMiningBlock = () => {
    if (scrollRef.current && window.innerWidth < 768) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  };

  // Initial scroll on mount (mobile only)
  useEffect(() => {
    const timer = setTimeout(scrollToMiningBlock, 100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll when new block is mined
  useEffect(() => {
    if (lastBlockNumber !== null && currentBlockNumber > lastBlockNumber) {
      scrollToMiningBlock();
    }
    setLastBlockNumber(currentBlockNumber);
  }, [currentBlockNumber, lastBlockNumber]);
  // Group mempool by time ranges
  const now = Date.now();
  const mempoolByAge = {
    fresh: mempool.filter(c => now - new Date(c.createdAt).getTime() < 2 * 60 * 1000),
    recent: mempool.filter(c => {
      const age = now - new Date(c.createdAt).getTime();
      return age >= 2 * 60 * 1000 && age < 5 * 60 * 1000;
    }),
    waiting: mempool.filter(c => now - new Date(c.createdAt).getTime() >= 5 * 60 * 1000),
  };

  // Show 6 blocks (CSS handles mobile sizing)
  const blocksToShow = 6;

  return (
    <div className="bg-[#1d2d3a]/50 rounded-xl p-3 md:p-4 mb-6 border border-[#2d4a5a]">
      <div 
        ref={scrollRef}
        className="flex items-stretch gap-1.5 md:gap-2 overflow-x-auto min-h-[120px] md:min-h-[140px] scroll-smooth"
      >
        {/* Confirmed Blocks - Left Side (reversed to show oldest first) */}
        <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
          {blocks.slice(0, blocksToShow).reverse().map((block, index) => {
            const height = Math.min(120, 70 + block.confessionCount * 6);
            const blockWidth = 90;
            
            return (
              <Link
                key={block.id}
                href={`/blocks/${block.blockNumber}`}
                className="group relative flex-shrink-0"
              >
                <div 
                  className="relative transition-transform group-hover:-translate-y-1 group-hover:scale-105"
                  style={{ width: `${blockWidth}px`, height: `${height}px` }}
                >
                  {/* 3D Block - Top face */}
                  <div 
                    className="absolute top-0 left-1 right-0 h-3 rounded-t-sm"
                    style={{
                      background: 'linear-gradient(135deg, #7c4dff 0%, #651fff 100%)',
                      transform: 'skewX(-45deg)',
                      transformOrigin: 'bottom left',
                    }}
                  />
                  
                  {/* 3D Block - Right face */}
                  <div 
                    className="absolute top-2 right-0 bottom-0 w-3 rounded-r-sm"
                    style={{
                      background: 'linear-gradient(180deg, #5e35b1 0%, #4527a0 100%)',
                      transform: 'skewY(-45deg)',
                      transformOrigin: 'top left',
                    }}
                  />
                  
                  {/* 3D Block - Front face */}
                  <div 
                    className="absolute top-2 left-0 right-3 bottom-0 rounded-sm p-2 flex flex-col justify-between"
                    style={{
                      background: 'linear-gradient(180deg, #7c4dff 0%, #651fff 50%, #5e35b1 100%)',
                    }}
                  >
                    <div>
                      <p className="text-[11px] font-mono text-purple-200 font-bold">
                        {block.blockNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-purple-200/80">
                        {block.confessionCount} tx
                      </p>
                      <p className="text-[9px] text-purple-300/60">
                        {timeAgo(block.committedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Divider with arrows */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center px-3">
          <div className="text-[#4a7a8a] text-lg">⇄</div>
        </div>

        {/* Pending Block + Mempool Queue */}
        <div className="flex gap-1.5 md:gap-2 flex-1">
          {/* Next Block (Being mined) */}
          <div className="flex-shrink-0 relative" style={{ width: '100px' }}>
            <div 
              className="relative animate-pulse h-[120px]"
              style={{ animationDuration: '2s' }}
            >
              {/* 3D Block - Top face */}
              <div 
                className="absolute top-0 left-1 right-0 h-3 rounded-t-sm opacity-80"
                style={{
                  background: 'linear-gradient(135deg, #8bc34a 0%, #689f38 100%)',
                  transform: 'skewX(-45deg)',
                  transformOrigin: 'bottom left',
                }}
              />
              
              {/* 3D Block - Right face */}
              <div 
                className="absolute top-2 right-0 bottom-0 w-3 rounded-r-sm opacity-80"
                style={{
                  background: 'linear-gradient(180deg, #689f38 0%, #558b2f 100%)',
                  transform: 'skewY(-45deg)',
                  transformOrigin: 'top left',
                }}
              />
              
              {/* 3D Block - Front face */}
              <div 
                className="absolute top-2 left-0 right-3 bottom-0 rounded-sm p-2 flex flex-col justify-between border-2 border-dashed border-[#8bc34a]/50"
                style={{
                  background: 'linear-gradient(180deg, rgba(139,195,74,0.3) 0%, rgba(104,159,56,0.3) 100%)',
                }}
              >
                <div>
                  <p className="text-[11px] font-mono text-[#c5e1a5] font-bold">
                    ~{(blocks[0]?.blockNumber || 0) + 1}
                  </p>
                  <p className="text-[9px] text-[#aed581] uppercase">Mining</p>
                </div>
                <div>
                  <p className="text-lg font-mono font-bold text-[#c5e1a5]">
                    {formatCountdown(nextBlockIn)}
                  </p>
                  <p className="text-[9px] text-[#aed581]">
                    {mempool.length} pending
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mempool Queue Blocks */}
          <div className="flex-1 flex gap-1 items-end overflow-hidden">
            {/* Fresh (green) */}
            {mempoolByAge.fresh.length > 0 && (
              <div 
                className="rounded-sm flex flex-col justify-end p-2 min-w-[50px] transition-all"
                style={{ 
                  flex: Math.min(mempoolByAge.fresh.length, 30),
                  height: `${Math.min(120, 40 + mempoolByAge.fresh.length * 2)}px`,
                  background: 'linear-gradient(180deg, rgba(139,195,74,0.6) 0%, rgba(104,159,56,0.8) 100%)',
                }}
              >
                <p className="text-[9px] text-[#c5e1a5] uppercase">Fresh</p>
                <p className="text-sm font-mono text-white font-bold">{mempoolByAge.fresh.length}</p>
                <p className="text-[8px] text-[#aed581]">In ~{Math.ceil(nextBlockIn / 60)}m</p>
              </div>
            )}

            {/* Recent (yellow) */}
            {mempoolByAge.recent.length > 0 && (
              <div 
                className="rounded-sm flex flex-col justify-end p-2 min-w-[50px] transition-all"
                style={{ 
                  flex: Math.min(mempoolByAge.recent.length, 30),
                  height: `${Math.min(120, 40 + mempoolByAge.recent.length * 2)}px`,
                  background: 'linear-gradient(180deg, rgba(255,193,7,0.6) 0%, rgba(255,160,0,0.8) 100%)',
                }}
              >
                <p className="text-[9px] text-yellow-200 uppercase">Recent</p>
                <p className="text-sm font-mono text-white font-bold">{mempoolByAge.recent.length}</p>
                <p className="text-[8px] text-yellow-300">In ~{Math.ceil((nextBlockIn + 600) / 60)}m</p>
              </div>
            )}

            {/* Waiting (orange/red) */}
            {mempoolByAge.waiting.length > 0 && (
              <div 
                className="rounded-sm flex flex-col justify-end p-2 min-w-[50px] transition-all"
                style={{ 
                  flex: Math.min(mempoolByAge.waiting.length, 30),
                  height: `${Math.min(120, 40 + mempoolByAge.waiting.length * 2)}px`,
                  background: 'linear-gradient(180deg, rgba(255,87,34,0.6) 0%, rgba(230,74,25,0.8) 100%)',
                }}
              >
                <p className="text-[9px] text-orange-200 uppercase">Waiting</p>
                <p className="text-sm font-mono text-white font-bold">{mempoolByAge.waiting.length}</p>
                <p className="text-[8px] text-orange-300">In ~{Math.ceil((nextBlockIn + 1200) / 60)}m</p>
              </div>
            )}

            {/* Empty mempool */}
            {mempool.length === 0 && (
              <div className="flex-1 bg-[#1d2d3a] rounded-sm flex items-center justify-center p-4 h-[60px]">
                <p className="text-xs text-[#6b9dad] font-mono">Empty mempool</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
