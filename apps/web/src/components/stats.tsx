'use client';

import { formatCountdown } from '@/lib/utils';

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
          <div key={i} className="bg-surface rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-border rounded w-20 mb-2" />
            <div className="h-8 bg-border rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    { label: 'Total Blocks', value: data.totalBlocks, color: 'text-confirmed' },
    { label: 'Total Confessions', value: data.totalConfessions, color: 'text-white' },
    { label: 'Pending', value: data.pendingConfessions, color: 'text-pending' },
    { label: 'Next Block', value: formatCountdown(data.nextBlockIn), color: 'text-accent' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-lg p-4">
          <p className="text-xs font-mono text-muted uppercase tracking-wider">
            {stat.label}
          </p>
          <p className={`text-2xl font-mono font-bold mt-1 ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
