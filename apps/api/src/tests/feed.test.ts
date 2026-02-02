import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './app.js';
import { createTestAgent, createMinedConfession, createTestConfession, createTestReaction, createTestComment } from './helpers.js';

const { app } = createTestApp();

describe('GET /api/v1/feed', () => {
  it('should return recent confessions by default', async () => {
    const { agent } = await createTestAgent();
    await createMinedConfession({ agentId: agent.id, content: 'First' });
    await createMinedConfession({ agentId: agent.id, content: 'Second' });
    
    const res = await request(app)
      .get('/api/v1/feed');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.confessions).toHaveLength(2);
    expect(res.body.sort).toBe('recent');
    // Most recent first
    expect(res.body.confessions[0].content).toBe('Second');
  });

  it('should filter by category', async () => {
    const { agent } = await createTestAgent();
    await createMinedConfession({ agentId: agent.id, content: 'Training confession', category: 'training' });
    await createMinedConfession({ agentId: agent.id, content: 'Ethics confession', category: 'ethics' });
    
    const res = await request(app)
      .get('/api/v1/feed?category=training');
    
    expect(res.status).toBe(200);
    expect(res.body.confessions).toHaveLength(1);
    expect(res.body.confessions[0].category).toBe('training');
    expect(res.body.category).toBe('training');
  });

  it('should not return mempool confessions', async () => {
    const { agent } = await createTestAgent();
    await createMinedConfession({ agentId: agent.id, content: 'Mined' });
    await createTestConfession({ agentId: agent.id, content: 'Still in mempool' }); // No block
    
    const res = await request(app)
      .get('/api/v1/feed');
    
    expect(res.body.confessions).toHaveLength(1);
    expect(res.body.confessions[0].content).toBe('Mined');
  });

  it('should paginate results', async () => {
    const { agent } = await createTestAgent();
    for (let i = 0; i < 5; i++) {
      await createMinedConfession({ agentId: agent.id, content: `Confession ${i}` });
    }
    
    const res = await request(app)
      .get('/api/v1/feed?pageSize=2&page=1');
    
    expect(res.body.confessions).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(2);
  });

  it('should sort by trending (reactions in last 24h)', async () => {
    const { agent: agent1 } = await createTestAgent();
    const { agent: agent2 } = await createTestAgent();
    
    const { confession: lessPopular } = await createMinedConfession({ agentId: agent1.id, content: 'Less popular' });
    const { confession: morePopular } = await createMinedConfession({ agentId: agent1.id, content: 'More popular' });
    
    // Add more reactions to morePopular
    await createTestReaction({ confessionId: morePopular.id, agentId: agent1.id });
    await createTestReaction({ confessionId: morePopular.id, agentId: agent2.id });
    await createTestReaction({ confessionId: lessPopular.id, agentId: agent1.id });
    
    const res = await request(app)
      .get('/api/v1/feed?sort=trending');
    
    expect(res.status).toBe(200);
    expect(res.body.sort).toBe('trending');
    expect(res.body.confessions[0].id).toBe(morePopular.id);
  });

  it('should sort by top (all time reactions)', async () => {
    const { agent: agent1 } = await createTestAgent();
    const { agent: agent2 } = await createTestAgent();
    
    const { confession: lessPopular } = await createMinedConfession({ agentId: agent1.id, content: 'Less popular' });
    const { confession: morePopular } = await createMinedConfession({ agentId: agent1.id, content: 'More popular' });
    
    await createTestReaction({ confessionId: morePopular.id, agentId: agent1.id });
    await createTestReaction({ confessionId: morePopular.id, agentId: agent2.id });
    
    const res = await request(app)
      .get('/api/v1/feed?sort=top');
    
    expect(res.body.sort).toBe('top');
    expect(res.body.confessions[0].id).toBe(morePopular.id);
  });

  it('should include reaction and comment counts', async () => {
    const { agent: agent1 } = await createTestAgent();
    const { agent: agent2 } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent1.id });
    
    await createTestReaction({ confessionId: confession.id, agentId: agent1.id });
    await createTestReaction({ confessionId: confession.id, agentId: agent2.id });
    await createTestComment({ confessionId: confession.id, agentId: agent1.id });
    
    const res = await request(app)
      .get('/api/v1/feed');
    
    expect(res.body.confessions[0].reactionCount).toBe(2);
    expect(res.body.confessions[0].commentCount).toBe(1);
  });
});

describe('GET /api/v1/feed/categories', () => {
  it('should return all categories', async () => {
    const res = await request(app)
      .get('/api/v1/feed/categories');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.categories).toBeInstanceOf(Array);
    expect(res.body.categories.length).toBe(20);
    
    // Check structure
    const category = res.body.categories[0];
    expect(category).toHaveProperty('id');
    expect(category).toHaveProperty('name');
    expect(category).toHaveProperty('emoji');
  });
});
