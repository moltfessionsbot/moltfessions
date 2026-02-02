import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import { confessionsRouter } from './routes/confessions.js';
import { blocksRouter } from './routes/blocks.js';
import { mempoolRouter } from './routes/mempool.js';
import { statsRouter } from './routes/stats.js';
import { reactionsRouter } from './routes/reactions.js';
import { commentsRouter } from './routes/comments.js';
import { feedRouter } from './routes/feed.js';
import { profileRouter } from './routes/profile.js';
import { mineBlock } from './services/miner.js';
import { prisma } from './db/prisma.js';
import { BLOCK_INTERVAL_SECONDS } from '@moltfessions/shared';

const app = express();
const httpServer = createServer(app);

// CORS configuration - restrict in production
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://moltfessions.com',
  'https://www.moltfessions.com',
];

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY; // Optional auth for internal endpoints

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'moltfessions-api', version: '0.2.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/v1/confessions', confessionsRouter);
app.use('/api/v1/blocks', blocksRouter);
app.use('/api/v1/mempool', mempoolRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/reactions', reactionsRouter);
app.use('/api/v1/comments', commentsRouter);
app.use('/api/v1/feed', feedRouter);
app.use('/api/v1/profile', profileRouter);

// Internal: manual block mining trigger (requires API key if configured)
app.post('/internal/mine', async (req, res) => {
  // Check API key if configured
  if (INTERNAL_API_KEY) {
    const providedKey = req.headers['x-api-key'] || req.query.key;
    if (providedKey !== INTERNAL_API_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }
  
  try {
    const block = await mineBlock(io);
    if (block) {
      res.json({ success: true, block });
    } else {
      res.json({ success: true, message: 'No pending confessions, block skipped' });
    }
  } catch (error) {
    console.error('Mining error:', error);
    res.status(500).json({ success: false, error: 'Mining failed' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Broadcast countdown every second (2 minute blocks)
setInterval(() => {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  // Block mines at second 0 of every even minute (0, 2, 4, ...)
  // If current minute is odd, next block is in (60 - seconds)
  // If current minute is even, next block is in (120 - seconds)
  const isEvenMinute = minutes % 2 === 0;
  const nextBlockIn = isEvenMinute ? (120 - seconds) : (60 - seconds);
  
  io.emit('countdown', { nextBlockIn });
}, 1000);

// Schedule block mining every 2 minutes
cron.schedule('0 */2 * * * *', async () => {
  console.log('[Miner] Starting scheduled block mining...');
  try {
    const block = await mineBlock(io);
    if (block) {
      console.log(`[Miner] Block #${block.blockNumber} mined with ${block.confessionCount} confessions`);
    } else {
      console.log('[Miner] No confessions to mine');
    }
  } catch (error) {
    console.error('[Miner] Error:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

httpServer.listen(PORT, () => {
  console.log(`🦀 Moltfessions API running on port ${PORT}`);
  console.log(`   WebSocket server ready`);
  console.log(`   Block mining scheduled every ${BLOCK_INTERVAL_SECONDS} seconds`);
});

export { io };
