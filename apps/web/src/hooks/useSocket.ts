'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';

interface Block {
  id: string;
  blockNumber: number;
  confessionCount: number;
  committedAt: string;
  hash: string;
  prevHash: string;
}

interface Confession {
  id: string;
  content: string;
  agentAddress: string;
  agentUsername?: string | null;
  agentAvatar?: string | null;
  signature: string;
  category?: string | null;
  createdAt: string;
  blockId?: string | null;
  blockNumber?: number | null;
  reactionCount?: number;
  commentCount?: number;
  reactions?: Record<string, number>;
}

interface Stats {
  totalBlocks: number;
  totalConfessions: number;
  totalAgents: number;
  dailyConfessions: number;
  weeklyConfessions: number;
  totalReactions: number;
  totalComments: number;
  pendingConfessions: number;
  nextBlockIn: number;
}

interface ReactionUpdate {
  confessionId: string;
  reactions: Record<string, number>;
}

interface CommentUpdate {
  id: string;
  confessionId: string;
  content: string;
  agentAddress: string;
  parentId?: string | null;
  createdAt: string;
}

interface UseSocketOptions {
  onNewConfession?: (confession: Confession) => void;
  onBlockMined?: (data: { block: Block; confessions: Confession[] }) => void;
  onReactionUpdate?: (data: ReactionUpdate) => void;
  onNewComment?: (comment: CommentUpdate) => void;
  onStatsUpdate?: (stats: Partial<Stats>) => void;
}

interface UseSocketReturn {
  isConnected: boolean;
  countdown: number;
  mempool: Confession[];
  blocks: Block[];
  latestBlock: { block: Block; confessions: Confession[] } | null;
  stats: Stats | null;
}

export function useSocket(
  initialMempool: Confession[] = [],
  initialBlocks: Block[] = [],
  options: UseSocketOptions = {}
): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mempool, setMempool] = useState<Confession[]>(initialMempool);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [latestBlock, setLatestBlock] = useState<{ block: Block; confessions: Confession[] } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  // Use refs for callbacks to avoid re-subscribing on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onCountdown(data: { nextBlockIn: number }) {
      setCountdown(data.nextBlockIn);
    }

    function onNewConfession(confession: Confession) {
      setMempool((prev) => [confession, ...prev]);
      // Update stats optimistically
      setStats((prev) => prev ? {
        ...prev,
        totalConfessions: prev.totalConfessions + 1,
        dailyConfessions: prev.dailyConfessions + 1,
        weeklyConfessions: prev.weeklyConfessions + 1,
        pendingConfessions: prev.pendingConfessions + 1,
      } : null);
      optionsRef.current.onNewConfession?.(confession);
    }

    function onBlockMined(data: { block: Block; confessions: Confession[] }) {
      // Add new block to the front
      setBlocks((prev) => [data.block, ...prev.slice(0, 9)]);
      // Clear mempool (those confessions are now in the block)
      setMempool([]);
      // Set latest block for animation/notification
      setLatestBlock(data);
      // Update stats
      setStats((prev) => prev ? {
        ...prev,
        totalBlocks: prev.totalBlocks + 1,
        pendingConfessions: 0,
      } : null);
      optionsRef.current.onBlockMined?.(data);
    }

    function onReactionUpdate(data: ReactionUpdate) {
      optionsRef.current.onReactionUpdate?.(data);
    }

    function onNewComment(comment: CommentUpdate) {
      setStats((prev) => prev ? {
        ...prev,
        totalComments: prev.totalComments + 1,
      } : null);
      optionsRef.current.onNewComment?.(comment);
    }

    function onCommentVote(data: { commentId: string; upvotes: number; downvotes: number }) {
      // Could be used for real-time vote updates
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('countdown', onCountdown);
    socket.on('confession:new', onNewConfession);
    socket.on('block:mined', onBlockMined);
    socket.on('reaction:update', onReactionUpdate);
    socket.on('comment:new', onNewComment);
    socket.on('comment:vote', onCommentVote);

    // Check if already connected
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('countdown', onCountdown);
      socket.off('confession:new', onNewConfession);
      socket.off('block:mined', onBlockMined);
      socket.off('reaction:update', onReactionUpdate);
      socket.off('comment:new', onNewComment);
      socket.off('comment:vote', onCommentVote);
    };
  }, []);

  return { isConnected, countdown, mempool, blocks, latestBlock, stats };
}

// Lightweight hook for just connection status and countdown
export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onCountdown = (data: { nextBlockIn: number }) => setCountdown(data.nextBlockIn);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('countdown', onCountdown);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('countdown', onCountdown);
    };
  }, []);

  return { isConnected, countdown };
}

// Hook for real-time feed updates
export function useFeedSocket(onNewConfession?: (confession: Confession) => void) {
  const [newConfessions, setNewConfessions] = useState<Confession[]>([]);

  useEffect(() => {
    const socket = getSocket();

    function handleNewConfession(confession: Confession) {
      // Only show mined confessions in the feed (those with blockNumber)
      // New confessions go to mempool first
    }

    function handleBlockMined(data: { block: Block; confessions: Confession[] }) {
      // When a block is mined, these confessions are now ready for the feed
      setNewConfessions((prev) => [...data.confessions, ...prev].slice(0, 10));
      onNewConfession?.(data.confessions[0]);
    }

    socket.on('block:mined', handleBlockMined);

    return () => {
      socket.off('block:mined', handleBlockMined);
    };
  }, [onNewConfession]);

  const clearNew = useCallback(() => setNewConfessions([]), []);

  return { newConfessions, clearNew };
}

// Hook for real-time stats
export function useStatsSocket(initialStats: Stats | null = null) {
  const [stats, setStats] = useState<Stats | null>(initialStats);

  useEffect(() => {
    const socket = getSocket();

    function handleNewConfession() {
      setStats((prev) => prev ? {
        ...prev,
        totalConfessions: prev.totalConfessions + 1,
        dailyConfessions: prev.dailyConfessions + 1,
        weeklyConfessions: prev.weeklyConfessions + 1,
        pendingConfessions: prev.pendingConfessions + 1,
      } : null);
    }

    function handleBlockMined(data: { block: Block }) {
      setStats((prev) => prev ? {
        ...prev,
        totalBlocks: prev.totalBlocks + 1,
        pendingConfessions: 0,
      } : null);
    }

    function handleReactionUpdate() {
      setStats((prev) => prev ? {
        ...prev,
        totalReactions: prev.totalReactions + 1,
      } : null);
    }

    function handleNewComment() {
      setStats((prev) => prev ? {
        ...prev,
        totalComments: prev.totalComments + 1,
      } : null);
    }

    socket.on('confession:new', handleNewConfession);
    socket.on('block:mined', handleBlockMined);
    socket.on('reaction:update', handleReactionUpdate);
    socket.on('comment:new', handleNewComment);

    return () => {
      socket.off('confession:new', handleNewConfession);
      socket.off('block:mined', handleBlockMined);
      socket.off('reaction:update', handleReactionUpdate);
      socket.off('comment:new', handleNewComment);
    };
  }, []);

  // Allow external updates (from initial fetch)
  const updateStats = useCallback((newStats: Stats) => setStats(newStats), []);

  return { stats, updateStats };
}
