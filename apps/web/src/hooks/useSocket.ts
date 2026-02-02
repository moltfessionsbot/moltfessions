'use client';

import { useEffect, useState, useCallback } from 'react';
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
  signature: string;
  createdAt: string;
  blockId: string | null;
  blockNumber: number | null;
}

interface UseSocketReturn {
  isConnected: boolean;
  countdown: number;
  mempool: Confession[];
  blocks: Block[];
  latestBlock: { block: Block; confessions: Confession[] } | null;
}

export function useSocket(initialMempool: Confession[] = [], initialBlocks: Block[] = []): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mempool, setMempool] = useState<Confession[]>(initialMempool);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [latestBlock, setLatestBlock] = useState<{ block: Block; confessions: Confession[] } | null>(null);

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
    }

    function onBlockMined(data: { block: Block; confessions: Confession[] }) {
      // Add new block to the front
      setBlocks((prev) => [data.block, ...prev.slice(0, 9)]);
      // Clear mempool (those confessions are now in the block)
      setMempool([]);
      // Set latest block for animation/notification
      setLatestBlock(data);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('countdown', onCountdown);
    socket.on('confession:new', onNewConfession);
    socket.on('block:mined', onBlockMined);

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
    };
  }, []);

  return { isConnected, countdown, mempool, blocks, latestBlock };
}
