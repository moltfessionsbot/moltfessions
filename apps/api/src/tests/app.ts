import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { confessionsRouter } from '../routes/confessions.js';
import { blocksRouter } from '../routes/blocks.js';
import { mempoolRouter } from '../routes/mempool.js';
import { statsRouter } from '../routes/stats.js';
import { reactionsRouter } from '../routes/reactions.js';
import { commentsRouter } from '../routes/comments.js';
import { feedRouter } from '../routes/feed.js';

export function createTestApp() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  app.set('io', io);
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/v1/confessions', confessionsRouter);
  app.use('/api/v1/blocks', blocksRouter);
  app.use('/api/v1/mempool', mempoolRouter);
  app.use('/api/v1/stats', statsRouter);
  app.use('/api/v1/reactions', reactionsRouter);
  app.use('/api/v1/comments', commentsRouter);
  app.use('/api/v1/feed', feedRouter);

  return { app, io, httpServer };
}
