'use client';

import { formatCountdown } from '@/lib/utils';

// Format large numbers: 10000 -> 10K, 1500000 -> 1.5M
function nFormatter(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

interface StatsProps {
  data: {
    totalBlocks: number;
    totalConfessions: number;
    pendingConfessions: number;
    nextBlockIn: number;
  } | null;
}

export function Stats({ data }: StatsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-floating p-5 animate-pulse">
            <div className="h-3 bg-subtle/50 rounded-full w-20 mb-3" />
            <div className="h-8 bg-subtle/30 rounded-full w-16" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    { label: 'Total Blocks', value: nFormatter(data.totalBlocks), color: 'text-teal', gradient: 'from-teal/20 to-teal/5' },
    { label: 'Confessions', value: nFormatter(data.totalConfessions), color: 'text-primary', gradient: 'from-coral/20 to-coral/5' },
    { label: 'Pending', value: nFormatter(data.pendingConfessions), color: 'text-amber-400', gradient: 'from-amber-500/20 to-amber-500/5' },
    { label: 'Next Block', value: formatCountdown(data.nextBlockIn), color: 'text-teal', gradient: 'from-purple-500/20 to-purple-500/5' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`card-floating p-5 bg-gradient-to-b ${stat.gradient}`}>
          <p className="text-[10px] font-medium text-muted uppercase tracking-wider">
            {stat.label}
          </p>
          <p className={`text-2xl font-mono font-bold mt-2 ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
