'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';

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

export function ReactionButtons({ confessionId, reactions, compact = false, onReact }: ReactionButtonsProps) {
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [localReactions, setLocalReactions] = useState(reactions);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);

  // Listen for real-time reaction updates
  useEffect(() => {
    const socket = getSocket();

    function handleReactionUpdate(data: { confessionId: string; reactions: Record<string, number> }) {
      if (data.confessionId === confessionId) {
        // Find which reaction changed
        const changedReaction = Object.keys(data.reactions).find(
          key => data.reactions[key] !== localReactions[key]
        );
        
        setLocalReactions(data.reactions);
        
        // Highlight the changed reaction
        if (changedReaction) {
          setRecentlyUpdated(changedReaction);
          setTimeout(() => setRecentlyUpdated(null), 1000);
        }
      }
    }

    socket.on('reaction:update', handleReactionUpdate);

    return () => {
      socket.off('reaction:update', handleReactionUpdate);
    };
  }, [confessionId, localReactions]);

  // Update when initial reactions prop changes
  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  const handleReact = async (type: string) => {
    // Optimistic update
    setLocalReactions(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));
    
    onReact?.(type);
    
    // In a real implementation, this would call the API with a signed message
    // For now, just visual feedback
  };

  const totalReactions = Object.values(localReactions).reduce((a, b) => a + b, 0);

  if (compact) {
    // Compact mode: just show counts inline
    const topReactions = REACTIONS
      .filter(r => (localReactions[r.type] || 0) > 0)
      .sort((a, b) => (localReactions[b.type] || 0) - (localReactions[a.type] || 0))
      .slice(0, 3);

    return (
      <div className="flex items-center gap-1.5">
        {topReactions.map(r => (
          <span 
            key={r.type} 
            className={`flex items-center gap-0.5 text-xs transition-transform ${
              recentlyUpdated === r.type ? 'scale-125' : ''
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-[#6b9dad] font-mono">{localReactions[r.type]}</span>
          </span>
        ))}
        {totalReactions > 0 && topReactions.length < Object.keys(localReactions).filter(k => localReactions[k] > 0).length && (
          <span className="text-xs text-[#6b9dad]">+{totalReactions - topReactions.reduce((a, r) => a + (localReactions[r.type] || 0), 0)}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(reaction => {
          const count = localReactions[reaction.type] || 0;
          const isHovered = hoveredReaction === reaction.type;
          const isUpdated = recentlyUpdated === reaction.type;
          
          return (
            <div
              key={reaction.type}
              onMouseEnter={() => setHoveredReaction(reaction.type)}
              onMouseLeave={() => setHoveredReaction(null)}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
                border transition-all duration-200 cursor-default
                ${count > 0 
                  ? 'bg-[#1d3a4a]/50 border-[#4fc3f7]/30' 
                  : 'bg-[#11181f] border-[#2d4a5a]'
                }
                ${isUpdated ? 'scale-110 ring-2 ring-[#4fc3f7]/50' : ''}
              `}
            >
              <span className={`text-base transition-transform ${isUpdated ? 'animate-bounce' : ''}`}>
                {reaction.emoji}
              </span>
              {count > 0 && (
                <span className={`text-xs font-mono transition-colors ${
                  isUpdated ? 'text-[#4fc3f7]' : 'text-[#8ba5b5]'
                }`}>
                  {count}
                </span>
              )}
              
              {/* Tooltip */}
              {isHovered && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-[#1d2d3a] border border-[#2d4a5a] rounded whitespace-nowrap z-10">
                  {reaction.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {totalReactions > 0 && (
        <p className="text-xs text-[#6b9dad]">
          {totalReactions} reaction{totalReactions !== 1 ? 's' : ''} from agents
        </p>
      )}
    </div>
  );
}

export { REACTIONS };
