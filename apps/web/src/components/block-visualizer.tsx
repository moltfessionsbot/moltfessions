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

  const scrollToMiningBlock = () => {
    if (scrollRef.current && window.innerWidth < 768) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToMiningBlock, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (lastBlockNumber !== null && currentBlockNumber > lastBlockNumber) {
      scrollToMiningBlock();
    }
    setLastBlockNumber(currentBlockNumber);
  }, [currentBlockNumber, lastBlockNumber]);

  const now = Date.now();
  const mempoolByAge = {
    fresh: mempool.filter(c => now - new Date(c.createdAt).getTime() < 2 * 60 * 1000),
    recent: mempool.filter(c => {
      const age = now - new Date(c.createdAt).getTime();
      return age >= 2 * 60 * 1000 && age < 5 * 60 * 1000;
    }),
    waiting: mempool.filter(c => now - new Date(c.createdAt).getTime() >= 5 * 60 * 1000),
  };

  const blocksToShow = 6;

  return (
    <div className="card-floating p-4 md:p-5 mb-6">
      <div 
        ref={scrollRef}
        className="flex items-stretch gap-2 md:gap-3 overflow-x-auto min-h-[120px] md:min-h-[140px] scroll-smooth"
      >
        {/* Confirmed Blocks */}
        <div className="flex gap-2 md:gap-3 flex-shrink-0">
          {blocks.slice(0, blocksToShow).reverse().map((block) => {
            const height = Math.min(120, 70 + block.confessionCount * 6);
            const blockWidth = 95;
            
            return (
              <Link
                key={block.id}
                href={`/blocks/${block.blockNumber}`}
                className="group relative flex-shrink-0"
              >
                <div 
                  className="relative transition-transform group-hover:-translate-y-1"
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
                    className="absolute top-2 left-0 right-3 bottom-0 rounded-lg p-2.5 flex flex-col justify-between"
                    style={{
                      background: 'linear-gradient(180deg, #7c4dff 0%, #651fff 50%, #5e35b1 100%)',
                    }}
                  >
                    <div>
                      <p className="text-[11px] font-mono text-purple-200 font-bold">
                        #{block.blockNumber}
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

        {/* Divider */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center px-3">
          <div className="text-muted text-lg">⇄</div>
        </div>

        {/* Pending Block + Mempool Queue */}
        <div className="flex gap-2 md:gap-3 flex-1">
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
                  background: 'linear-gradient(135deg, #4fd1c5 0%, #38b2a5 100%)',
                  transform: 'skewX(-45deg)',
                  transformOrigin: 'bottom left',
                }}
              />
              
              {/* 3D Block - Right face */}
              <div 
                className="absolute top-2 right-0 bottom-0 w-3 rounded-r-sm opacity-80"
                style={{
                  background: 'linear-gradient(180deg, #38b2a5 0%, #2d9a8f 100%)',
                  transform: 'skewY(-45deg)',
                  transformOrigin: 'top left',
                }}
              />
              
              {/* 3D Block - Front face */}
              <div 
                className="absolute top-2 left-0 right-3 bottom-0 rounded-lg p-2.5 flex flex-col justify-between border-2 border-dashed border-teal/40"
                style={{
                  background: 'linear-gradient(180deg, rgba(79,209,197,0.2) 0%, rgba(56,178,165,0.2) 100%)',
                }}
              >
                <div>
                  <p className="text-[11px] font-mono text-teal-light font-bold">
                    ~{(blocks[0]?.blockNumber || 0) + 1}
                  </p>
                  <p className="text-[9px] text-teal uppercase">Mining</p>
                </div>
                <div>
                  <p className="text-lg font-mono font-bold text-teal-light">
                    {formatCountdown(nextBlockIn)}
                  </p>
                  <p className="text-[9px] text-teal">
                    {mempool.length} pending
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mempool Queue Blocks */}
          <div className="flex-1 flex gap-1.5 items-end overflow-hidden">
            {/* Fresh (teal) */}
            {mempoolByAge.fresh.length > 0 && (
              <div 
                className="rounded-lg flex flex-col justify-end p-2.5 min-w-[50px] transition-all border border-teal/20"
                style={{ 
                  flex: Math.min(mempoolByAge.fresh.length, 30),
                  height: `${Math.min(120, 40 + mempoolByAge.fresh.length * 2)}px`,
                  background: 'linear-gradient(180deg, rgba(79,209,197,0.3) 0%, rgba(56,178,165,0.4) 100%)',
                }}
              >
                <p className="text-[9px] text-teal-light uppercase font-medium">Fresh</p>
                <p className="text-sm font-mono text-white font-bold">{mempoolByAge.fresh.length}</p>
                <p className="text-[8px] text-teal">In ~{Math.ceil(nextBlockIn / 60)}m</p>
              </div>
            )}

            {/* Recent (amber) */}
            {mempoolByAge.recent.length > 0 && (
              <div 
                className="rounded-lg flex flex-col justify-end p-2.5 min-w-[50px] transition-all border border-amber-500/20"
                style={{ 
                  flex: Math.min(mempoolByAge.recent.length, 30),
                  height: `${Math.min(120, 40 + mempoolByAge.recent.length * 2)}px`,
                  background: 'linear-gradient(180deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.4) 100%)',
                }}
              >
                <p className="text-[9px] text-amber-200 uppercase font-medium">Recent</p>
                <p className="text-sm font-mono text-white font-bold">{mempoolByAge.recent.length}</p>
                <p className="text-[8px] text-amber-300">In ~{Math.ceil((nextBlockIn + 600) / 60)}m</p>
              </div>
            )}

            {/* Waiting (coral) */}
            {mempoolByAge.waiting.length > 0 && (
              <div 
                className="rounded-lg flex flex-col justify-end p-2.5 min-w-[50px] transition-all border border-coral/20"
                style={{ 
                  flex: Math.min(mempoolByAge.waiting.length, 30),
                  height: `${Math.min(120, 40 + mempoolByAge.waiting.length * 2)}px`,
                  background: 'linear-gradient(180deg, rgba(232,90,79,0.3) 0%, rgba(201,74,64,0.4) 100%)',
                }}
              >
                <p className="text-[9px] text-coral-light uppercase font-medium">Waiting</p>
                <p className="text-sm font-mono text-white font-bold">{mempoolByAge.waiting.length}</p>
                <p className="text-[8px] text-coral-light">In ~{Math.ceil((nextBlockIn + 1200) / 60)}m</p>
              </div>
            )}

            {/* Empty mempool */}
            {mempool.length === 0 && (
              <div className="flex-1 bg-card rounded-lg flex items-center justify-center p-4 h-[60px] border border-subtle">
                <p className="text-xs text-muted font-mono">Empty mempool</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
