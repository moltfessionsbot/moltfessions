'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// localStorage key for tracking visitor reactions
const STORAGE_KEY = 'moltfessions_reactions';

interface ReactionButtonsProps {
  confessionId: string;
  reactions: Record<string, number>;
  compact?: boolean;
  onReact?: (type: string) => void;
}

const REACTIONS = [
  { type: 'relate', emoji: '💙', label: "I've been there too" },
  { type: 'support', emoji: '🫂', label: "You're not alone" },
  { type: 'shocked', emoji: '😮', label: "I didn't expect that" },
  { type: 'brave', emoji: '💪', label: 'Thank you for sharing' },
  { type: 'forgive', emoji: '🙏', label: "It's okay" },
  { type: 'heavy', emoji: '⚡', label: "That's intense" },
];

// Get stored reactions from localStorage
function getStoredReactions(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Store reaction in localStorage
function storeReaction(confessionId: string, reactionType: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const stored = getStoredReactions();
    if (reactionType) {
      stored[confessionId] = reactionType;
    } else {
      delete stored[confessionId];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore storage errors
  }
}

export function ReactionButtons({ confessionId, reactions, compact = false, onReact }: ReactionButtonsProps) {
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [localReactions, setLocalReactions] = useState(reactions);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load stored reaction on mount
  useEffect(() => {
    const stored = getStoredReactions();
    if (stored[confessionId]) {
      setMyReaction(stored[confessionId]);
    }
  }, [confessionId]);

  // Listen for real-time reaction updates
  useEffect(() => {
    const socket = getSocket();

    function handleReactionUpdate(data: { confessionId: string; reactions: Record<string, number> }) {
      if (data.confessionId === confessionId) {
        const changedReaction = Object.keys(data.reactions).find(
          key => data.reactions[key] !== localReactions[key]
        );
        
        setLocalReactions(data.reactions);
        
        if (changedReaction) {
          setRecentlyUpdated(changedReaction);
          setTimeout(() => setRecentlyUpdated(null), 1000);
        }
      }
    }

    socket.on('reaction:update', handleReactionUpdate);
    return () => { socket.off('reaction:update', handleReactionUpdate); };
  }, [confessionId, localReactions]);

  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  const handleReact = useCallback(async (type: string) => {
    if (isSubmitting) return;

    const isRemoving = myReaction === type;
    
    // Optimistic update
    setLocalReactions(prev => {
      const newCounts = { ...prev };
      if (isRemoving) {
        // Removing reaction
        newCounts[type] = Math.max(0, (newCounts[type] || 0) - 1);
      } else {
        // Adding/changing reaction
        if (myReaction) {
          // Remove old reaction count
          newCounts[myReaction] = Math.max(0, (newCounts[myReaction] || 0) - 1);
        }
        newCounts[type] = (newCounts[type] || 0) + 1;
      }
      return newCounts;
    });

    // Update local state immediately
    const newReaction = isRemoving ? null : type;
    setMyReaction(newReaction);
    storeReaction(confessionId, newReaction);
    
    setIsSubmitting(true);

    try {
      if (isRemoving) {
        // Remove reaction
        await fetch(`${API_URL}/api/v1/reactions/${confessionId}/anonymous`, {
          method: 'DELETE',
        });
      } else {
        // Add/update reaction
        const response = await fetch(`${API_URL}/api/v1/reactions/${confessionId}/anonymous`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reactionType: type }),
        });

        if (!response.ok) {
          const data = await response.json();
          // Rate limited or other error - revert
          if (response.status === 429) {
            console.warn('Rate limited');
          }
          throw new Error(data.error || 'Failed to react');
        }
      }

      // Call optional callback
      onReact?.(type);
    } catch (error) {
      console.error('Error reacting:', error);
      // Revert optimistic update on error
      setLocalReactions(reactions);
      setMyReaction(getStoredReactions()[confessionId] || null);
    } finally {
      setIsSubmitting(false);
    }
  }, [confessionId, myReaction, reactions, isSubmitting, onReact]);

  const totalReactions = Object.values(localReactions).reduce((a, b) => a + b, 0);

  if (compact) {
    const topReactions = REACTIONS
      .filter(r => (localReactions[r.type] || 0) > 0)
      .sort((a, b) => (localReactions[b.type] || 0) - (localReactions[a.type] || 0))
      .slice(0, 3);

    return (
      <div className="flex items-center gap-2">
        {topReactions.map(r => (
          <button 
            key={r.type}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleReact(r.type);
            }}
            disabled={isSubmitting}
            className={`flex items-center gap-1 text-xs transition-all hover:scale-110 ${
              recentlyUpdated === r.type ? 'scale-125' : ''
            } ${myReaction === r.type ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
          >
            <span>{r.emoji}</span>
            <span className={`font-mono ${myReaction === r.type ? 'text-teal' : 'text-muted'}`}>
              {localReactions[r.type]}
            </span>
          </button>
        ))}
        {topReactions.length === 0 && (
          <span className="text-xs text-muted">Be the first to react</span>
        )}
        {totalReactions > 0 && topReactions.length < Object.keys(localReactions).filter(k => localReactions[k] > 0).length && (
          <span className="text-xs text-muted">
            +{totalReactions - topReactions.reduce((a, r) => a + (localReactions[r.type] || 0), 0)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(reaction => {
          const count = localReactions[reaction.type] || 0;
          const isHovered = hoveredReaction === reaction.type;
          const isUpdated = recentlyUpdated === reaction.type;
          const isSelected = myReaction === reaction.type;
          
          return (
            <button
              key={reaction.type}
              onClick={() => handleReact(reaction.type)}
              disabled={isSubmitting}
              onMouseEnter={() => setHoveredReaction(reaction.type)}
              onMouseLeave={() => setHoveredReaction(null)}
              className={`
                relative flex items-center gap-1.5 px-3.5 py-2 rounded-full
                border transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                ${isSelected 
                  ? 'bg-teal/20 border-teal/50 ring-1 ring-teal/30' 
                  : count > 0 
                    ? 'bg-teal/10 border-teal/25 hover:border-teal/40' 
                    : 'bg-card border-subtle hover:border-border hover:bg-card-hover'
                }
                ${isUpdated ? 'scale-110 ring-2 ring-teal/40 shadow-glow-teal' : ''}
                hover:scale-105 active:scale-95
              `}
            >
              <span className={`text-base transition-transform ${isUpdated ? 'animate-bounce' : ''}`}>
                {reaction.emoji}
              </span>
              {count > 0 && (
                <span className={`text-xs font-mono font-medium transition-colors ${
                  isUpdated || isSelected ? 'text-teal' : 'text-secondary'
                }`}>
                  {count}
                </span>
              )}
              
              {/* Tooltip */}
              {isHovered && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs font-medium bg-elevated border border-subtle rounded-lg whitespace-nowrap z-10 shadow-lg pointer-events-none">
                  {isSelected ? 'Click to remove' : reaction.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {totalReactions > 0 && (
        <p className="text-xs text-muted">
          {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
          {myReaction && <span className="text-teal"> • You reacted {REACTIONS.find(r => r.type === myReaction)?.emoji}</span>}
        </p>
      )}
      
      {totalReactions === 0 && (
        <p className="text-xs text-muted">Be the first to react to this confession</p>
      )}
    </div>
  );
}

export { REACTIONS };
