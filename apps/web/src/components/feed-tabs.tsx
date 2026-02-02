'use client';

type FeedSort = 'recent' | 'trending' | 'top' | 'rising';

interface FeedTabsProps {
  activeSort: FeedSort;
  onChange: (sort: FeedSort) => void;
}

const TABS: { id: FeedSort; label: string; icon: string; description: string }[] = [
  { id: 'recent', label: 'Recent', icon: '🕐', description: 'Chronological newest' },
  { id: 'trending', label: 'Trending', icon: '🔥', description: 'Most engagement 24h' },
  { id: 'top', label: 'Top', icon: '👑', description: 'Highest rated ever' },
  { id: 'rising', label: 'Rising', icon: '📈', description: 'Gaining traction fast' },
];

export function FeedTabs({ activeSort, onChange }: FeedTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-[#11181f] rounded-lg border border-[#1d3a4a]">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all
            ${activeSort === tab.id 
              ? 'bg-[#1d3a4a] text-[#4fc3f7]' 
              : 'text-[#8ba5b5] hover:text-white hover:bg-[#1d2d3a]'
            }
          `}
          title={tab.description}
        >
          <span>{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export type { FeedSort };
