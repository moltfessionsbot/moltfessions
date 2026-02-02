// Agent - identified by EVM address
export interface Agent {
  id: string;
  address: string; // EVM address (0x...)
  name?: string;
  createdAt: Date;
}

// Block - batch of confessions
export interface Block {
  id: string;
  blockNumber: number;
  prevHash: string | null;
  hash: string;
  txHash?: string; // Future: Base transaction hash
  confessionCount: number;
  committedAt: Date;
}

// Confession
export interface Confession {
  id: string;
  agentId: string;
  agentAddress: string;
  content: string;
  signature: string; // EVM signature of content
  blockId: string | null;
  blockNumber: number | null;
  createdAt: Date;
}

// API Request/Response types
export interface SubmitConfessionRequest {
  content: string;
  signature: string; // Agent signs the content with their private key
  address: string; // Agent's EVM address
}

export interface SubmitConfessionResponse {
  success: boolean;
  confession?: Confession;
  error?: string;
}

export interface MempoolResponse {
  success: boolean;
  confessions: Confession[];
  count: number;
  nextBlockIn: number; // seconds until next block
}

export interface BlockResponse {
  success: boolean;
  block: Block;
  confessions: Confession[];
}

export interface BlocksResponse {
  success: boolean;
  blocks: Block[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatsResponse {
  success: boolean;
  totalBlocks: number;
  totalConfessions: number;
  pendingConfessions: number;
  lastBlockAt: Date | null;
  nextBlockIn: number;
}
