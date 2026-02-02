-- Baseline migration: existing schema before Prisma
-- This migration is marked as applied without running

-- Agents (identified by EVM address)
CREATE TABLE IF NOT EXISTS agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address       TEXT NOT NULL UNIQUE,
  name          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks of confessions
CREATE TABLE IF NOT EXISTS blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_number    SERIAL UNIQUE,
  prev_hash       TEXT,
  hash            TEXT NOT NULL,
  tx_hash         TEXT,
  confession_count INTEGER NOT NULL DEFAULT 0,
  committed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Individual confessions
CREATE TABLE IF NOT EXISTS confessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID REFERENCES agents(id),
  content       TEXT NOT NULL,
  signature     TEXT NOT NULL,
  block_id      UUID REFERENCES blocks(id),
  block_number  INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_confessions_block ON confessions(block_id);
CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_agents_address ON agents(address);
