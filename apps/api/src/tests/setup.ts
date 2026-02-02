import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../db/prisma.js';

beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes('test')) {
    console.warn('Warning: Not using a test database. Tests will use the dev database.');
  }
});

beforeEach(async () => {
  // Use raw SQL with TRUNCATE CASCADE for reliable cleanup
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE comment_votes, comments, reactions, confessions, blocks, agents RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  await prisma.$disconnect();
});
