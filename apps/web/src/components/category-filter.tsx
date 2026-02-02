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
          className="flex items-center gap-2.5 px-4 py-2.5 bg-card border border-subtle rounded-full text-sm hover:border-border transition-all"
        >
          {selected ? (
            <>
              <span>{categories.find(c => c.id === selected)?.emoji}</span>
              <span className="text-primary font-medium">{categories.find(c => c.id === selected)?.name}</span>
            </>
          ) : (
            <>
              <span>📂</span>
              <span className="text-secondary">All Categories</span>
            </>
          )}
          <svg className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full right-0 mt-2 w-72 max-h-80 overflow-y-auto card-floating shadow-2xl z-50 p-2">
              <button
                onClick={() => { onChange(null); setIsOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
                  !selected 
                    ? 'bg-teal/10 text-teal border border-teal/20' 
                    : 'text-secondary hover:bg-white/5 hover:text-primary'
                }`}
              >
                <span>📂</span>
                <span className="font-medium">All Categories</span>
              </button>
              <div className="h-px bg-subtle my-2" />
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { onChange(cat.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
                    selected === cat.id 
                      ? 'bg-teal/10 text-teal border border-teal/20' 
                      : 'text-secondary hover:bg-white/5 hover:text-primary'
                  }`}
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
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          !selected 
            ? 'bg-teal text-base shadow-glow-teal' 
            : 'bg-card text-secondary border border-subtle hover:border-border hover:text-primary'
        }`}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === cat.id 
              ? 'bg-teal text-base shadow-glow-teal' 
              : 'bg-card text-secondary border border-subtle hover:border-border hover:text-primary'
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal/10 text-teal border border-teal/20">
      <span>{category.emoji}</span>
      <span>{category.name}</span>
    </span>
  );
}
