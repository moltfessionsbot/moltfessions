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
import { mineBlock } from './services/miner.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;
const BLOCK_INTERVAL = 30; // seconds

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'moltfessions-api', version: '0.1.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/v1/confessions', confessionsRouter);
app.use('/api/v1/blocks', blocksRouter);
app.use('/api/v1/mempool', mempoolRouter);
app.use('/api/v1/stats', statsRouter);

// Internal: manual block mining trigger
app.post('/internal/mine', async (req, res) => {
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

// Broadcast countdown every second (30 second blocks)
setInterval(() => {
  const now = new Date();
  const seconds = now.getSeconds();
  const nextBlockIn = BLOCK_INTERVAL - (seconds % BLOCK_INTERVAL);
  
  io.emit('countdown', { nextBlockIn });
}, 1000);

// Schedule block mining every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
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

httpServer.listen(PORT, () => {
  console.log(`🦀 Moltfessions API running on port ${PORT}`);
  console.log(`   WebSocket server ready`);
  console.log(`   Block mining scheduled every ${BLOCK_INTERVAL} seconds`);
});

export { io };
