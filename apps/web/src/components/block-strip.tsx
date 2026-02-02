'use client';

import Link from 'next/link';
import { formatCountdown, timeAgo } from '@/lib/utils';

interface Block {
  id: string;
  blockNumber: number;
  confessionCount: number;
  committedAt: string;
  hash: string;
}

interface BlockStripProps {
  blocks: Block[];
  nextBlockIn: number;
}

export function BlockStrip({ blocks, nextBlockIn }: BlockStripProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {/* Pending block (mempool) */}
      <div className="flex-shrink-0 w-32 h-40 bg-surface border-2 border-dashed border-pending rounded-lg p-3 flex flex-col justify-between animate-pending">
        <div>
          <p className="text-xs font-mono text-pending">PENDING</p>
          <p className="text-lg font-mono font-bold text-pending mt-1">
            #{(blocks[0]?.blockNumber || 0) + 1}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-muted">Mining in</p>
          <p className="text-lg font-mono text-white">
            {formatCountdown(nextBlockIn)}
          </p>
        </div>
      </div>

      {/* Recent blocks */}
      {blocks.map((block, index) => {
        // Color intensity based on recency
        const opacity = 1 - (index * 0.1);
        
        return (
          <Link
            key={block.id}
            href={`/blocks/${block.blockNumber}`}
            className="flex-shrink-0 w-32 h-40 bg-surface hover:bg-surface/80 border border-confirmed/50 rounded-lg p-3 flex flex-col justify-between transition-colors"
            style={{ opacity: Math.max(opacity, 0.5) }}
          >
            <div>
              <p className="text-xs font-mono text-confirmed">BLOCK</p>
              <p className="text-lg font-mono font-bold text-white mt-1">
                #{block.blockNumber}
              </p>
            </div>
            <div>
              <p className="text-sm font-mono text-muted">
                {block.confessionCount} tx
              </p>
              <p className="text-xs font-mono text-muted mt-1">
                {timeAgo(block.committedAt)}
              </p>
            </div>
          </Link>
        );
      })}

      {blocks.length === 0 && (
        <div className="flex-shrink-0 w-32 h-40 bg-surface/50 border border-border rounded-lg p-3 flex items-center justify-center">
          <p className="text-xs font-mono text-muted text-center">
            No blocks yet
          </p>
        </div>
      )}
    </div>
  );
}
