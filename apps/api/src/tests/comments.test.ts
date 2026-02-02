import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './app.js';
import { createTestWallet, signMessage, createTestAgent, createMinedConfession, createTestComment } from './helpers.js';

const { app } = createTestApp();

describe('POST /api/v1/comments/confession/:confessionId', () => {
  it('should add a comment with valid signature', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    const wallet = createTestWallet();
    const content = 'This resonates with me';
    const message = `comment:${confession.id}:${content}`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/comments/confession/${confession.id}`)
      .send({
        content,
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.comment.content).toBe(content);
    expect(res.body.comment.upvotes).toBe(0);
    expect(res.body.comment.downvotes).toBe(0);
  });

  it('should add a reply to a comment', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    const parentComment = await createTestComment({ confessionId: confession.id, agentId: agent.id });
    
    const wallet = createTestWallet();
    const content = 'I agree with this comment';
    const message = `comment:${confession.id}:${content}`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/comments/confession/${confession.id}`)
      .send({
        content,
        signature,
        address: wallet.address,
        parentId: parentComment.id,
      });
    
    expect(res.status).toBe(201);
    expect(res.body.comment.parentId).toBe(parentComment.id);
  });

  it('should reject comment that is too long', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    const wallet = createTestWallet();
    const content = 'a'.repeat(1001); // Max is 1000
    const message = `comment:${confession.id}:${content}`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/comments/confession/${confession.id}`)
      .send({
        content,
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('too long');
  });

  it('should reject invalid signature', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    const wallet = createTestWallet();
    const wrongWallet = createTestWallet();
    const content = 'Test comment';
    const message = `comment:${confession.id}:${content}`;
    const signature = await signMessage(wrongWallet, message);
    
    const res = await request(app)
      .post(`/api/v1/comments/confession/${confession.id}`)
      .send({
        content,
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid signature');
  });

  it('should return 404 for non-existent confession', async () => {
    const wallet = createTestWallet();
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const content = 'Test';
    const message = `comment:${fakeId}:${content}`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/comments/confession/${fakeId}`)
      .send({
        content,
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/comments/confession/:confessionId', () => {
  it('should return comments with replies', async () => {
    const { agent: agent1 } = await createTestAgent();
    const { agent: agent2 } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent1.id });
    
    const parentComment = await createTestComment({
      confessionId: confession.id,
      agentId: agent1.id,
      content: 'Parent comment',
    });
    
    await createTestComment({
      confessionId: confession.id,
      agentId: agent2.id,
      content: 'Reply to parent',
      parentId: parentComment.id,
    });
    
    const res = await request(app)
      .get(`/api/v1/comments/confession/${confession.id}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments).toHaveLength(1); // Only top-level
    expect(res.body.comments[0].replies).toHaveLength(1);
  });

  it('should paginate comments', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    
    // Create multiple comments
    for (let i = 0; i < 5; i++) {
      await createTestComment({
        confessionId: confession.id,
        agentId: agent.id,
        content: `Comment ${i}`,
      });
    }
    
    const res = await request(app)
      .get(`/api/v1/comments/confession/${confession.id}?pageSize=2&page=1`);
    
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(2);
    expect(res.body.total).toBe(5);
  });
});

describe('POST /api/v1/comments/:commentId/vote', () => {
  it('should upvote a comment', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    const comment = await createTestComment({ confessionId: confession.id, agentId: agent.id });
    
    const wallet = createTestWallet();
    const message = `vote:${comment.id}:1`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/comments/${comment.id}/vote`)
      .send({
        voteType: 1,
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(200);
    expect(res.body.upvotes).toBe(1);
    expect(res.body.downvotes).toBe(0);
  });

  it('should downvote a comment', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    const comment = await createTestComment({ confessionId: confession.id, agentId: agent.id });
    
    const wallet = createTestWallet();
    const message = `vote:${comment.id}:-1`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/comments/${comment.id}/vote`)
      .send({
        voteType: -1,
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(200);
    expect(res.body.upvotes).toBe(0);
    expect(res.body.downvotes).toBe(1);
  });

  it('should toggle vote off when voting same way twice', async () => {
    const { agent, wallet } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    const comment = await createTestComment({ confessionId: confession.id, agentId: agent.id });
    
    const message = `vote:${comment.id}:1`;
    const signature = await signMessage(wallet, message);
    
    // First vote
    await request(app)
      .post(`/api/v1/comments/${comment.id}/vote`)
      .send({ voteType: 1, signature, address: wallet.address });
    
    // Second vote (same) - should toggle off
    const res = await request(app)
      .post(`/api/v1/comments/${comment.id}/vote`)
      .send({ voteType: 1, signature, address: wallet.address });
    
    expect(res.body.upvotes).toBe(0);
  });

  it('should switch vote when changing from up to down', async () => {
    const { agent, wallet } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    const comment = await createTestComment({ confessionId: confession.id, agentId: agent.id });
    
    // Upvote first
    const message1 = `vote:${comment.id}:1`;
    const signature1 = await signMessage(wallet, message1);
    await request(app)
      .post(`/api/v1/comments/${comment.id}/vote`)
      .send({ voteType: 1, signature: signature1, address: wallet.address });
    
    // Then downvote
    const message2 = `vote:${comment.id}:-1`;
    const signature2 = await signMessage(wallet, message2);
    const res = await request(app)
      .post(`/api/v1/comments/${comment.id}/vote`)
      .send({ voteType: -1, signature: signature2, address: wallet.address });
    
    expect(res.body.upvotes).toBe(0);
    expect(res.body.downvotes).toBe(1);
  });
});

describe('POST /api/v1/comments/:commentId/report', () => {
  it('should report a comment', async () => {
    const { agent } = await createTestAgent();
    const { confession } = await createMinedConfession({ agentId: agent.id });
    const comment = await createTestComment({ confessionId: confession.id, agentId: agent.id });
    
    const wallet = createTestWallet();
    const message = `report:${comment.id}`;
    const signature = await signMessage(wallet, message);
    
    const res = await request(app)
      .post(`/api/v1/comments/${comment.id}/report`)
      .send({
        signature,
        address: wallet.address,
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
