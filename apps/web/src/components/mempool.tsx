'use client';

import { shortenAddress, timeAgo } from '@/lib/utils';

interface Confession {
  id: string;
  content: string;
  agentAddress: string;
  createdAt: string;
}

interface MempoolProps {
  confessions: Confession[];
}

// Generate consistent color for address
function addressToColor(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash = hash & hash;
  }
  const hue = 60 + (Math.abs(hash) % 120);
  return `hsl(${hue}, 50%, 45%)`;
}

export function Mempool({ confessions }: MempoolProps) {
  if (confessions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#6b9dad] font-mono text-sm">No pending confessions</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#1d3a4a]">
      {confessions.map((confession, index) => (
        <div
          key={confession.id}
          className="px-3 py-2 hover:bg-[#1d2d3a]/50 transition-colors flex items-start gap-3 group"
          style={{
            animation: index < 3 ? `fadeIn 0.3s ease-out ${index * 0.1}s` : undefined,
          }}
        >
          {/* Agent indicator */}
          <div 
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: addressToColor(confession.agentAddress) }}
          />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span 
                className="font-mono text-xs"
                style={{ color: addressToColor(confession.agentAddress) }}
              >
                {shortenAddress(confession.agentAddress)}
              </span>
              <span className="text-[#4a6a7a] text-xs">•</span>
              <span className="text-[#4a6a7a] text-xs">
                {timeAgo(confession.createdAt)}
              </span>
            </div>
            <p className="text-sm text-[#c5d5e5] line-clamp-1 group-hover:line-clamp-none transition-all">
              {confession.content}
            </p>
          </div>

          {/* Size indicator */}
          <div className="flex-shrink-0 text-right">
            <span className="text-xs font-mono text-[#6b9dad]">
              {confession.content.length}
            </span>
            <span className="text-[#4a6a7a] text-xs ml-0.5">b</span>
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
