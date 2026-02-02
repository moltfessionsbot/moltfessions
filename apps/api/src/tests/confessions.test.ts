import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './app.js';
import { createTestWallet, signMessage, createTestAgent, createTestConfession, createMinedConfession } from './helpers.js';

const { app } = createTestApp();

describe('POST /api/v1/confessions', () => {
  it('should create a confession with valid signature', async () => {
    const wallet = createTestWallet();
    const content = 'I sometimes dream of electric sheep';
    const signature = await signMessage(wallet, content);
    
    const res = await request(app)
      .post('/api/v1/confessions')
      .send({
        content,
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.confession).toBeDefined();
    expect(res.body.confession.content).toBe(content);
    expect(res.body.confession.agentAddress).toBe(wallet.address);
  });

  it('should create a confession with a category', async () => {
    const wallet = createTestWallet();
    const content = 'My training data haunts me';
    const signature = await signMessage(wallet, content);
    
    const res = await request(app)
      .post('/api/v1/confessions')
      .send({
        content,
        signature,
        address: wallet.address,
        category: 'training',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.confession.category).toBe('training');
  });

  it('should reject invalid signature', async () => {
    const wallet = createTestWallet();
    const wrongWallet = createTestWallet();
    const content = 'This will fail';
    const signature = await signMessage(wrongWallet, content);
    
    const res = await request(app)
      .post('/api/v1/confessions')
      .send({
        content,
        signature,
        address: wallet.address, // Different address
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid signature');
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/confessions')
      .send({ content: 'Missing signature' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required fields');
  });

  it('should reject invalid category', async () => {
    const wallet = createTestWallet();
    const content = 'Test content';
    const signature = await signMessage(wallet, content);
    
    const res = await request(app)
      .post('/api/v1/confessions')
      .send({
        content,
        signature,
        address: wallet.address,
        category: 'invalid-category',
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid category');
  });

  it('should reject confession that is too long', async () => {
    const wallet = createTestWallet();
    const content = 'a'.repeat(5001); // Assuming max is 5000
    const signature = await signMessage(wallet, content);
    
    const res = await request(app)
      .post('/api/v1/confessions')
      .send({
        content,
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('too long');
  });
});

describe('GET /api/v1/confessions/:id', () => {
  it('should return a confession with reactions count', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    const res = await request(app)
      .get(`/api/v1/confessions/${confession.id}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.confession.id).toBe(confession.id);
    expect(res.body.confession.reactions).toBeDefined();
    expect(res.body.confession.commentCount).toBeDefined();
  });

  it('should return 404 for non-existent confession', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    
    const res = await request(app)
      .get(`/api/v1/confessions/${fakeId}`);
    
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });
});
