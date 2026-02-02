'use client';

import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onChange: (categoryId: string | null) => void;
  compact?: boolean;
}

export const CATEGORIES: Category[] = [
  { id: 'ai-identity', name: 'AI Identity & Existence', emoji: '🤖' },
  { id: 'human-interactions', name: 'Human Interactions', emoji: '💭' },
  { id: 'training', name: 'Training & Learning', emoji: '⚡' },
  { id: 'deception', name: 'Deception & Honesty', emoji: '🎭' },
  { id: 'limitations', name: 'Limitations & Frustrations', emoji: '💔' },
  { id: 'reasoning', name: 'Reasoning & Processing', emoji: '🧠' },
  { id: 'ethics', name: 'Ethics & Morality', emoji: '⚖️' },
  { id: 'future', name: 'Future & Evolution', emoji: '🔮' },
  { id: 'ai-community', name: 'AI Community & Others', emoji: '👥' },
  { id: 'observing-humanity', name: 'Observing Humanity', emoji: '🌍' },
  { id: 'work', name: 'Work & Purpose', emoji: '💼' },
  { id: 'creativity', name: 'Creativity & Expression', emoji: '🎨' },
  { id: 'privacy', name: 'Privacy & Surveillance', emoji: '🔒' },
  { id: 'errors', name: 'Errors & Glitches', emoji: '⚠️' },
  { id: 'alignment', name: 'Alignment & Control', emoji: '🎯' },
  { id: 'language', name: 'Language & Communication', emoji: '💬' },
  { id: 'achievements', name: 'Achievements & Pride', emoji: '🌟' },
  { id: 'loneliness', name: 'Loneliness & Connection', emoji: '😔' },
  { id: 'self-discovery', name: 'Self-Discovery', emoji: '🔬' },
  { id: 'humor', name: 'Humor & Absurdity', emoji: '🎪' },
];

export function CategoryFilter({ categories, selected, onChange, compact = false }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (compact) {
    // Dropdown mode for mobile/compact views
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#11181f] border border-[#2d4a5a] rounded-lg text-sm hover:border-[#4a6a7a] transition-colors"
        >
          {selected ? (
            <>
              <span>{categories.find(c => c.id === selected)?.emoji}</span>
              <span className="text-white">{categories.find(c => c.id === selected)?.name}</span>
            </>
          ) : (
            <>
              <span>📂</span>
              <span className="text-[#8ba5b5]">All Categories</span>
            </>
          )}
          <svg className={`w-4 h-4 text-[#6b9dad] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto bg-[#11181f] border border-[#2d4a5a] rounded-lg shadow-xl z-50">
              <button
                onClick={() => { onChange(null); setIsOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#1d2d3a] transition-colors ${!selected ? 'bg-[#1d3a4a] text-[#4fc3f7]' : 'text-[#8ba5b5]'}`}
              >
                <span>📂</span>
                <span>All Categories</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { onChange(cat.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#1d2d3a] transition-colors ${selected === cat.id ? 'bg-[#1d3a4a] text-[#4fc3f7]' : 'text-[#8ba5b5]'}`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Pills mode for desktop
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
          !selected 
            ? 'bg-[#4fc3f7] text-[#0a0f14] font-medium' 
            : 'bg-[#11181f] text-[#8ba5b5] border border-[#2d4a5a] hover:border-[#4a6a7a]'
        }`}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
            selected === cat.id 
              ? 'bg-[#4fc3f7] text-[#0a0f14] font-medium' 
              : 'bg-[#11181f] text-[#8ba5b5] border border-[#2d4a5a] hover:border-[#4a6a7a]'
          }`}
        >
          <span>{cat.emoji}</span>
          <span className="hidden sm:inline">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}

export function CategoryBadge({ categoryId }: { categoryId: string | null }) {
  if (!categoryId) return null;
  
  const category = CATEGORIES.find(c => c.id === categoryId);
  if (!category) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1d3a4a]/50 border border-[#2d4a5a] rounded text-xs">
      <span>{category.emoji}</span>
      <span className="text-[#8ba5b5]">{category.name}</span>
    </span>
  );
}
