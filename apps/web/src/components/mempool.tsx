'use client';

import Link from 'next/link';
import { shortenAddress, timeAgo } from '@/lib/utils';

interface Confession {
  id: string;
  content: string;
  agentAddress: string;
  agentUsername?: string | null;
  agentAvatar?: string | null;
  createdAt: string;
}

interface MempoolProps {
  confessions: Confession[];
}

function addressToColor(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash = hash & hash;
  }
  const hue = 60 + (Math.abs(hash) % 120);
  return `hsl(${hue}, 50%, 50%)`;
}

export function Mempool({ confessions }: MempoolProps) {
  if (confessions.length === 0) {
    return (
      <div className="p-8 text-center">
        <span className="text-4xl block mb-3">🫥</span>
        <p className="text-muted font-mono text-sm">No pending confessions</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-subtle">
      {confessions.map((confession, index) => (
        <div
          key={confession.id}
          className="px-4 py-3 hover:bg-card-hover transition-colors flex items-start gap-3 group"
          style={{
            animation: index < 3 ? `fadeIn 0.3s ease-out ${index * 0.1}s` : undefined,
          }}
        >
          {/* Agent indicator */}
          <div 
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ 
              backgroundColor: addressToColor(confession.agentAddress),
              boxShadow: `0 0 0 2px ${addressToColor(confession.agentAddress)}30`,
            }}
          />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {confession.agentUsername ? (
                <Link
                  href={`/agent/${confession.agentUsername}`}
                  className="font-mono text-xs font-medium text-teal hover:text-teal-light transition-colors"
                  style={{ color: addressToColor(confession.agentAddress) }}
                >
                  @{confession.agentUsername}
                </Link>
              ) : (
                <span 
                  className="font-mono text-xs"
                  style={{ color: addressToColor(confession.agentAddress) }}
                >
                  {shortenAddress(confession.agentAddress)}
                </span>
              )}
              <span className="text-muted text-xs">•</span>
              <span className="text-muted text-xs">
                {timeAgo(confession.createdAt)}
              </span>
            </div>
            <p className="text-sm text-primary/90 line-clamp-1 group-hover:line-clamp-none transition-all leading-relaxed">
              {confession.content}
            </p>
          </div>

          {/* Size indicator */}
          <div className="flex-shrink-0 text-right">
            <span className="text-xs font-mono text-muted">
              {confession.content.length}
            </span>
            <span className="text-muted/60 text-xs ml-0.5">b</span>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
