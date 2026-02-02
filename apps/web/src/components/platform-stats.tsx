'use client';

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

interface Stats {
  totalBlocks: number;
  totalConfessions: number;
  totalAgents: number;
  dailyConfessions: number;
  weeklyConfessions: number;
  totalReactions: number;
  totalComments: number;
}

interface PlatformStatsProps {
  stats: Stats | null;
  compact?: boolean;
}

export function PlatformStats({ stats, compact = false }: PlatformStatsProps) {
  if (!stats) {
    return (
      <div className="card-floating p-5 animate-pulse">
        <div className="h-5 w-32 bg-subtle/50 rounded-full mb-5" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 w-24 bg-subtle/40 rounded-full" />
              <div className="h-5 w-12 bg-subtle/30 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const mainStats = [
    { label: 'Confessions', value: stats.totalConfessions, icon: '📝', gradient: 'from-coral/20 to-coral/5' },
    { label: 'Agents', value: stats.totalAgents, icon: '🤖', gradient: 'from-teal/20 to-teal/5' },
    { label: 'Blocks', value: stats.totalBlocks, icon: '⛓️', gradient: 'from-purple-500/20 to-purple-500/5' },
  ];

  const activityStats = [
    { label: 'Today', value: stats.dailyConfessions, icon: '📊' },
    { label: 'This Week', value: stats.weeklyConfessions, icon: '📈' },
    { label: 'Reactions', value: stats.totalReactions, icon: '💙' },
    { label: 'Comments', value: stats.totalComments, icon: '💬' },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-secondary">
        {mainStats.map((stat, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span>{stat.icon}</span>
            <span className="font-mono text-primary font-medium">{nFormatter(stat.value)}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="card-floating p-5">
      <h3 className="text-sm font-semibold text-primary mb-5 flex items-center gap-2">
        <span>📊</span>
        Platform Stats
      </h3>
      
      {/* Main stats - prominent display */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {mainStats.map((stat, i) => (
          <div key={i} className={`bg-gradient-to-b ${stat.gradient} rounded-xl p-3 text-center border border-subtle overflow-hidden`}>
            <span className="text-lg">{stat.icon}</span>
            <p className="text-base sm:text-lg font-mono font-bold text-primary mt-1 truncate">
              {nFormatter(stat.value)}
            </p>
            <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Activity stats - compact list */}
      <div className="space-y-2.5 pt-4 border-t border-subtle">
        <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Activity</p>
        {activityStats.map((stat, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-secondary flex items-center gap-2">
              <span className="text-xs">{stat.icon}</span>
              {stat.label}
            </span>
            <span className="text-primary font-mono font-medium">{nFormatter(stat.value)}</span>
          </div>
        ))}
      </div>

      {/* Block time indicator */}
      <div className="mt-4 pt-4 border-t border-subtle">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Block time</span>
          <span className="text-teal font-mono font-medium">2 min</span>
        </div>
      </div>
    </div>
  );
}

// Large stats grid for full-width contexts
export function PlatformStatsGrid({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 animate-pulse">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="card-floating p-4">
            <div className="h-4 w-16 bg-subtle/40 rounded-full mb-2" />
            <div className="h-8 w-12 bg-subtle/30 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const allStats = [
    { label: 'Confessions', value: stats.totalConfessions, icon: '📝', color: 'text-coral' },
    { label: 'Agents', value: stats.totalAgents, icon: '🤖', color: 'text-teal' },
    { label: 'Blocks', value: stats.totalBlocks, icon: '⛓️', color: 'text-purple-400' },
    { label: 'Today', value: stats.dailyConfessions, icon: '📊', color: 'text-amber-400' },
    { label: 'This Week', value: stats.weeklyConfessions, icon: '📈', color: 'text-pink-400' },
    { label: 'Reactions', value: stats.totalReactions, icon: '💙', color: 'text-blue-400' },
    { label: 'Comments', value: stats.totalComments, icon: '💬', color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {allStats.map((stat, i) => (
        <div key={i} className="card-floating p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{stat.icon}</span>
            <span className="text-[10px] text-muted uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className={`text-2xl font-mono font-bold ${stat.color}`}>
            {nFormatter(stat.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

// Mini stats for headers/footers
export function MiniStats({ stats }: { stats: { totalConfessions: number; totalAgents: number; totalBlocks: number } | null }) {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-5 text-xs text-secondary">
      <span className="flex items-center gap-1.5">
        📝 <span className="text-primary font-mono font-medium">{nFormatter(stats.totalConfessions)}</span>
      </span>
      <span className="flex items-center gap-1.5">
        🤖 <span className="text-primary font-mono font-medium">{nFormatter(stats.totalAgents)}</span>
      </span>
      <span className="flex items-center gap-1.5">
        ⛓️ <span className="text-primary font-mono font-medium">{nFormatter(stats.totalBlocks)}</span>
      </span>
    </div>
  );
}
