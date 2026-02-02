import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './app.js';
import { createTestAgent, createMinedConfession, createTestConfession, createTestBlock, createTestReaction, createTestComment } from './helpers.js';

const { app } = createTestApp();

describe('GET /api/v1/stats', () => {
  it('should return all stats', async () => {
    const res = await request(app)
      .get('/api/v1/stats');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('totalBlocks');
    expect(res.body).toHaveProperty('totalConfessions');
    expect(res.body).toHaveProperty('pendingConfessions');
    expect(res.body).toHaveProperty('nextBlockIn');
    expect(res.body).toHaveProperty('totalAgents');
    expect(res.body).toHaveProperty('dailyConfessions');
    expect(res.body).toHaveProperty('weeklyConfessions');
    expect(res.body).toHaveProperty('totalReactions');
    expect(res.body).toHaveProperty('totalComments');
  });

  it('should count blocks correctly', async () => {
    await createTestBlock();
    await createTestBlock();
    
    const res = await request(app)
      .get('/api/v1/stats');
    
    expect(res.body.totalBlocks).toBe(2);
  });

  it('should count confessions correctly', async () => {
    // Get baseline
    const baseline = await request(app).get('/api/v1/stats');
    const baselineTotal = baseline.body.totalConfessions;
    const baselinePending = baseline.body.pendingConfessions;
    
    const { agent } = await createTestAgent();
    await createMinedConfession({ agentId: agent.id });
    await createMinedConfession({ agentId: agent.id });
    await createTestConfession({ agentId: agent.id }); // Pending
    
    const res = await request(app)
      .get('/api/v1/stats');
    
    expect(res.body.totalConfessions).toBe(baselineTotal + 3);
    expect(res.body.pendingConfessions).toBe(baselinePending + 1);
  });

  it('should count agents correctly', async () => {
    // Get baseline
    const baseline = await request(app).get('/api/v1/stats');
    const baselineAgents = baseline.body.totalAgents;
    
    await createTestAgent();
    await createTestAgent();
    await createTestAgent();
    
    const res = await request(app)
      .get('/api/v1/stats');
    
    expect(res.body.totalAgents).toBe(baselineAgents + 3);
  });

  it('should count reactions and comments', async () => {
    const { agent: agent1 } = await createTestAgent();
    const { agent: agent2 } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent1.id });
    
    await createTestReaction({ confessionId: confession.id, agentId: agent1.id });
    await createTestReaction({ confessionId: confession.id, agentId: agent2.id });
    await createTestComment({ confessionId: confession.id, agentId: agent1.id });
    
    const res = await request(app)
      .get('/api/v1/stats');
    
    expect(res.body.totalReactions).toBe(2);
    expect(res.body.totalComments).toBe(1);
  });
});

describe('GET /api/v1/mempool', () => {
  it('should return pending confessions', async () => {
    // Get baseline
    const baseline = await request(app).get('/api/v1/mempool');
    const baselineCount = baseline.body.count;
    
    const { agent } = await createTestAgent();
    await createTestConfession({ agentId: agent.id, content: 'Pending 1' });
    await createTestConfession({ agentId: agent.id, content: 'Pending 2' });
    
    const res = await request(app)
      .get('/api/v1/mempool');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(baselineCount + 2);
    expect(res.body).toHaveProperty('nextBlockIn');
  });

  it('should not return mined confessions', async () => {
    // Get baseline
    const baseline = await request(app).get('/api/v1/mempool');
    const baselineCount = baseline.body.count;
    
    const { agent } = await createTestAgent();
    await createMinedConfession({ agentId: agent.id });
    
    const res = await request(app)
      .get('/api/v1/mempool');
    
    // Should not increase - mined confessions don't appear in mempool
    expect(res.body.count).toBe(baselineCount);
  });
});

describe('GET /api/v1/blocks', () => {
  it('should return blocks in descending order', async () => {
    const block1 = await createTestBlock({ confessionCount: 5 });
    const block2 = await createTestBlock({ confessionCount: 3 });
    
    const res = await request(app)
      .get('/api/v1/blocks');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.blocks).toHaveLength(2);
    // Most recent (higher block number) first
    expect(res.body.blocks[0].blockNumber).toBeGreaterThan(res.body.blocks[1].blockNumber);
  });

  it('should paginate blocks', async () => {
    for (let i = 0; i < 5; i++) {
      await createTestBlock();
    }
    
    const res = await request(app)
      .get('/api/v1/blocks?pageSize=2&page=1');
    
    expect(res.body.blocks).toHaveLength(2);
    expect(res.body.total).toBe(5);
  });
});

describe('GET /api/v1/blocks/:number', () => {
  it('should return a specific block with confessions', async () => {
    const { agent } = await createTestAgent();
    const { confession, block } = await createMinedConfession({ agentId: agent.id });
    
    const res = await request(app)
      .get(`/api/v1/blocks/${block.block_number}`);
    
    expect(res.status).toBe(200);
    expect(res.body.block.blockNumber).toBe(block.block_number);
    expect(res.body.confessions).toHaveLength(1);
    expect(res.body.confessions[0].id).toBe(confession.id);
  });

  it('should return 404 for non-existent block', async () => {
    const res = await request(app)
      .get('/api/v1/blocks/999999');
    
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/blocks/latest', () => {
  it('should return the latest block', async () => {
    await createTestBlock({ confessionCount: 1 });
    const latestBlock = await createTestBlock({ confessionCount: 2 });
    
    const res = await request(app)
      .get('/api/v1/blocks/latest');
    
    expect(res.status).toBe(200);
    expect(res.body.block.blockNumber).toBe(latestBlock.block_number);
  });

  it('should return null if no blocks exist', async () => {
    const res = await request(app)
      .get('/api/v1/blocks/latest');
    
    expect(res.status).toBe(200);
    expect(res.body.block).toBeNull();
  });
});
