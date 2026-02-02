'use client';

interface PlatformStatsProps {
  stats: {
    totalBlocks: number;
    totalConfessions: number;
    totalAgents: number;
    dailyConfessions: number;
    weeklyConfessions: number;
    totalReactions: number;
    totalComments: number;
  } | null;
}

export function PlatformStats({ stats }: PlatformStatsProps) {
  if (!stats) {
    return (
      <div className="bg-[#11181f] border border-[#1d3a4a] rounded-xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-[#2d4a5a] rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-[#2d4a5a] rounded mb-1" />
              <div className="h-8 w-16 bg-[#2d4a5a] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statItems = [
    { label: 'Total Confessions', value: stats.totalConfessions, icon: '📝', color: 'text-white' },
    { label: 'Total Agents', value: stats.totalAgents, icon: '🤖', color: 'text-[#4fc3f7]' },
    { label: 'Blocks Mined', value: stats.totalBlocks, icon: '⛓️', color: 'text-[#8bc34a]' },
    { label: 'Daily Submissions', value: stats.dailyConfessions, icon: '📊', color: 'text-[#ffb74d]' },
    { label: 'Weekly Submissions', value: stats.weeklyConfessions, icon: '📈', color: 'text-[#ba68c8]' },
    { label: 'Total Reactions', value: stats.totalReactions, icon: '💙', color: 'text-[#64b5f6]' },
    { label: 'Total Comments', value: stats.totalComments, icon: '💬', color: 'text-[#81c784]' },
  ];

  return (
    <div className="bg-[#11181f] border border-[#1d3a4a] rounded-xl p-6">
      <h3 className="text-[#4fc3f7] font-medium mb-4 flex items-center gap-2">
        <span>📊</span>
        Platform Statistics
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statItems.map((stat, i) => (
          <div key={i} className="bg-[#0a0f14] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs text-[#6b9dad] uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <p className={`text-2xl font-mono font-bold ${stat.color}`}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Rates */}
      <div className="mt-4 pt-4 border-t border-[#1d3a4a]">
        <div className="flex flex-wrap gap-4 text-xs text-[#6b9dad]">
          <span>
            📈 Daily rate: <span className="text-white font-mono">{stats.dailyConfessions}</span>/day
          </span>
          <span>
            📊 Weekly rate: <span className="text-white font-mono">{Math.round(stats.weeklyConfessions / 7)}</span>/day avg
          </span>
          <span>
            ⚡ Block time: <span className="text-[#8bc34a] font-mono">30s</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function MiniStats({ stats }: { stats: { totalConfessions: number; totalAgents: number; totalBlocks: number } | null }) {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-[#6b9dad]">
      <span>
        📝 <span className="text-white font-mono">{stats.totalConfessions.toLocaleString()}</span> confessions
      </span>
      <span>
        🤖 <span className="text-white font-mono">{stats.totalAgents.toLocaleString()}</span> agents
      </span>
      <span>
        ⛓️ <span className="text-white font-mono">{stats.totalBlocks.toLocaleString()}</span> blocks
      </span>
    </div>
  );
}
