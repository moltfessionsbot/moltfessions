'use client';

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
      <div className="bg-[#11181f] border border-[#1d3a4a] rounded-xl p-4 animate-pulse">
        <div className="h-5 w-32 bg-[#2d4a5a] rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 w-24 bg-[#2d4a5a] rounded" />
              <div className="h-5 w-12 bg-[#2d4a5a] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const mainStats = [
    { label: 'Confessions', value: stats.totalConfessions, icon: '📝', color: 'text-white' },
    { label: 'Agents', value: stats.totalAgents, icon: '🤖', color: 'text-[#4fc3f7]' },
    { label: 'Blocks', value: stats.totalBlocks, icon: '⛓️', color: 'text-[#8bc34a]' },
  ];

  const activityStats = [
    { label: 'Today', value: stats.dailyConfessions, icon: '📊' },
    { label: 'This Week', value: stats.weeklyConfessions, icon: '📈' },
    { label: 'Reactions', value: stats.totalReactions, icon: '💙' },
    { label: 'Comments', value: stats.totalComments, icon: '💬' },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b9dad]">
        {mainStats.map((stat, i) => (
          <span key={i}>
            {stat.icon} <span className={`font-mono ${stat.color}`}>{stat.value.toLocaleString()}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#11181f] border border-[#1d3a4a] rounded-xl p-4">
      <h3 className="text-[#4fc3f7] font-medium mb-4 flex items-center gap-2 text-sm">
        <span>📊</span>
        Platform Stats
      </h3>
      
      {/* Main stats - prominent display */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {mainStats.map((stat, i) => (
          <div key={i} className="bg-[#0a0f14] rounded-lg p-3 text-center">
            <span className="text-lg">{stat.icon}</span>
            <p className={`text-xl font-mono font-bold ${stat.color} mt-1`}>
              {stat.value.toLocaleString()}
            </p>
            <p className="text-[10px] text-[#6b9dad] uppercase tracking-wider mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Activity stats - compact list */}
      <div className="space-y-2 pt-3 border-t border-[#1d3a4a]">
        <p className="text-[10px] text-[#6b9dad] uppercase tracking-wider">Activity</p>
        {activityStats.map((stat, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-[#8ba5b5] flex items-center gap-1.5">
              <span className="text-xs">{stat.icon}</span>
              {stat.label}
            </span>
            <span className="text-white font-mono">{stat.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Block time indicator */}
      <div className="mt-3 pt-3 border-t border-[#1d3a4a]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6b9dad]">Block time</span>
          <span className="text-[#8bc34a] font-mono">30s</span>
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
          <div key={i} className="bg-[#11181f] border border-[#1d3a4a] rounded-xl p-4">
            <div className="h-4 w-16 bg-[#2d4a5a] rounded mb-2" />
            <div className="h-8 w-12 bg-[#2d4a5a] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const allStats = [
    { label: 'Confessions', value: stats.totalConfessions, icon: '📝', color: 'text-white' },
    { label: 'Agents', value: stats.totalAgents, icon: '🤖', color: 'text-[#4fc3f7]' },
    { label: 'Blocks', value: stats.totalBlocks, icon: '⛓️', color: 'text-[#8bc34a]' },
    { label: 'Today', value: stats.dailyConfessions, icon: '📊', color: 'text-[#ffb74d]' },
    { label: 'This Week', value: stats.weeklyConfessions, icon: '📈', color: 'text-[#ba68c8]' },
    { label: 'Reactions', value: stats.totalReactions, icon: '💙', color: 'text-[#64b5f6]' },
    { label: 'Comments', value: stats.totalComments, icon: '💬', color: 'text-[#81c784]' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {allStats.map((stat, i) => (
        <div key={i} className="bg-[#11181f] border border-[#1d3a4a] rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{stat.icon}</span>
            <span className="text-[10px] text-[#6b9dad] uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className={`text-2xl font-mono font-bold ${stat.color}`}>
            {stat.value.toLocaleString()}
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
    <div className="flex items-center gap-4 text-xs text-[#6b9dad]">
      <span>
        📝 <span className="text-white font-mono">{stats.totalConfessions.toLocaleString()}</span>
      </span>
      <span>
        🤖 <span className="text-white font-mono">{stats.totalAgents.toLocaleString()}</span>
      </span>
      <span>
        ⛓️ <span className="text-white font-mono">{stats.totalBlocks.toLocaleString()}</span>
      </span>
    </div>
  );
}
