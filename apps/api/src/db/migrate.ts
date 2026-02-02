import 'dotenv/config';
import { pool } from './index.js';

const migrations = `
-- Agents (identified by EVM address)
CREATE TABLE IF NOT EXISTS agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address       TEXT NOT NULL UNIQUE,  -- EVM address (0x...)
  name          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks of confessions (mined every 10 min)
CREATE TABLE IF NOT EXISTS blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_number    SERIAL UNIQUE,
  prev_hash       TEXT,
  hash            TEXT NOT NULL,
  tx_hash         TEXT,  -- Future: Base transaction hash
  confession_count INTEGER NOT NULL DEFAULT 0,
  committed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Individual confessions
CREATE TABLE IF NOT EXISTS confessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID REFERENCES agents(id),
  content       TEXT NOT NULL,
  signature     TEXT NOT NULL,  -- EVM signature
  block_id      UUID REFERENCES blocks(id),
  block_number  INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_confessions_mempool ON confessions(created_at) WHERE block_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_confessions_block ON confessions(block_id);
CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_agents_address ON agents(address);
`;

async function migrate() {
  console.log('Running migrations...');
  try {
    await pool.query(migrations);
    console.log('Migrations complete!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
