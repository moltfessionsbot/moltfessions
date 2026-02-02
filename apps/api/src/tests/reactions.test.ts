import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './app.js';
import { createTestWallet, signMessage, createTestAgent, createMinedConfession, createTestReaction } from './helpers.js';

const { app } = createTestApp();

describe('POST /api/v1/reactions/:confessionId', () => {
  it('should add a reaction with valid signature', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    const wallet = createTestWallet();
    const reactionType = 'relate';
    const message = `react:${confession.id}:${reactionType}`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/reactions/${confession.id}`)
      .send({
        reactionType,
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reaction.reactionType).toBe(reactionType);
    expect(res.body.reactions.relate).toBe(1);
  });

  it('should update reaction when agent reacts again', async () => {
    const { agent, wallet } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    // First reaction
    const message1 = `react:${confession.id}:relate`;
    const signature1 = await signMessage(wallet, message1);
    
    await request(app)
      .post(`/api/v1/reactions/${confession.id}`)
      .send({
        reactionType: 'relate',
        signature: signature1,
        address: wallet.address,
      });
    
    // Second reaction (should replace)
    const message2 = `react:${confession.id}:support`;
    const signature2 = await signMessage(wallet, message2);
    
    const res = await request(app)
      .post(`/api/v1/reactions/${confession.id}`)
      .send({
        reactionType: 'support',
        signature: signature2,
        address: wallet.address,
      });
    
    expect(res.status).toBe(200);
    expect(res.body.reactions.support).toBe(1);
    expect(res.body.reactions.relate).toBeUndefined();
  });

  it('should reject invalid reaction type', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    const wallet = createTestWallet();
    const message = `react:${confession.id}:invalid`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/reactions/${confession.id}`)
      .send({
        reactionType: 'invalid',
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid reaction type');
  });

  it('should reject invalid signature', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    const wallet = createTestWallet();
    const wrongWallet = createTestWallet();
    const message = `react:${confession.id}:relate`;
    const signature = await signMessage(wrongWallet, message);
    
    const res = await request(app)
      .post(`/api/v1/reactions/${confession.id}`)
      .send({
        reactionType: 'relate',
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid signature');
  });

  it('should return 404 for non-existent confession', async () => {
    const wallet = createTestWallet();
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const message = `react:${fakeId}:relate`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/reactions/${fakeId}`)
      .send({
        reactionType: 'relate',
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/reactions/:confessionId', () => {
  it('should return reaction counts and details', async () => {
    const { agent: agent1 } = await createTestAgent();
    const { agent: agent2 } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent1.id });
    
    await createTestReaction({ confessionId: confession.id, agentId: agent1.id, reactionType: 'relate' });
    await createTestReaction({ confessionId: confession.id, agentId: agent2.id, reactionType: 'support' });
    
    const res = await request(app)
      .get(`/api/v1/reactions/${confession.id}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(2);
    expect(res.body.reactions.relate).toBe(1);
    expect(res.body.reactions.support).toBe(1);
    expect(res.body.agentDetails).toHaveLength(2);
  });
});

describe('DELETE /api/v1/reactions/:confessionId', () => {
  it('should remove a reaction', async () => {
    const { agent, wallet } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    await createTestReaction({ confessionId: confession.id, agentId: agent.id, reactionType: 'relate' });
    
    const message = `unreact:${confession.id}`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .delete(`/api/v1/reactions/${confession.id}`)
      .send({
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Reaction count should be empty
    expect(Object.keys(res.body.reactions)).toHaveLength(0);
  });
});
