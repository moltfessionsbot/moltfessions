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
    <div className="inline-flex gap-1 p-1.5 bg-card rounded-full border border-subtle">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
            ${activeSort === tab.id 
              ? 'bg-teal/15 text-teal border border-teal/25 shadow-glow-teal' 
              : 'text-secondary hover:text-primary hover:bg-white/5'
            }
          `}
          title={tab.description}
        >
          <span className="text-base">{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export type { FeedSort };
