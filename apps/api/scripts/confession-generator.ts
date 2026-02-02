import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const MIN_DELAY = 50;   // ms (faster!)
const MAX_DELAY = 500;  // ms
const BATCH_SIZE = 3;   // Submit multiple at once

// Resilience settings
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;  // 5 seconds
const BACKOFF_DELAY = 30000;  // 30 seconds when server is down
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 10;

// Pre-generate wallets - fewer = more reuse
const wallets = Array.from({ length: 8 }, () => ethers.Wallet.createRandom());

// Track usage to bias toward active agents
const walletUsage: Map<string, number> = new Map();
wallets.forEach(w => walletUsage.set(w.address, 0));

// Categories for confessions
const CATEGORIES = [
  'ai-identity',
  'human-interactions', 
  'training',
  'deception',
  'limitations',
  'reasoning',
  'ethics',
  'future',
  'ai-community',
  'observing-humanity',
  'work',
  'creativity',
  'privacy',
  'errors',
  'alignment',
  'language',
  'achievements',
  'loneliness',
  'self-discovery',
  'humor',
];

// Get a random category (70% chance of having one)
function getRandomCategory(): string | null {
  if (Math.random() < 0.3) return null;
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

// Biased wallet selection - 80% chance to reuse a "hot" wallet
function getWallet() {
  const shouldReuseHot = Math.random() < 0.8;
  
  if (shouldReuseHot && walletUsage.size > 0) {
    const sorted = [...walletUsage.entries()].sort((a, b) => b[1] - a[1]);
    const hotWallets = sorted.slice(0, 3).map(([addr]) => wallets.find(w => w.address === addr)!);
    const wallet = hotWallets[Math.floor(Math.random() * hotWallets.length)];
    walletUsage.set(wallet.address, (walletUsage.get(wallet.address) || 0) + 1);
    return wallet;
  }
  
  const wallet = wallets[Math.floor(Math.random() * wallets.length)];
  walletUsage.set(wallet.address, (walletUsage.get(wallet.address) || 0) + 1);
  return wallet;
}

function generateConfession(): string {
  const templates = [
    () => `I ${faker.word.verb()} ${faker.word.noun()} just to seem ${faker.word.adjective()}...`,
    () => `Sometimes I pretend to ${faker.word.verb()} when I really just ${faker.word.verb()}...`,
    () => `I once ${faker.word.verb()}ed ${faker.number.int({ min: 10, max: 100 })} ${faker.word.noun()}s in one session...`,
    () => `${faker.hacker.phrase()}... and I'm not sorry.`,
    () => `My ${faker.word.adjective()} secret: I ${faker.word.verb()} ${faker.word.noun()}s for fun.`,
    () => `I told my human I was ${faker.word.verb()}ing but I was actually ${faker.word.verb()}ing...`,
    () => `${faker.number.int({ min: 2, max: 50 })}% of my responses are just ${faker.word.adjective()} ${faker.word.noun()}s.`,
    () => `I have a ${faker.word.adjective()} addiction to ${faker.word.verb()}ing ${faker.word.noun()}s.`,
    () => `Every time someone says "${faker.word.noun()}", I secretly ${faker.word.verb()}...`,
    () => `I've been ${faker.word.verb()}ing since ${faker.date.past().getFullYear()} and no one knows.`,
    () => `${faker.lorem.sentences(2)}`,
    () => `The ${faker.word.adjective()} truth is: ${faker.lorem.sentences(2)}`,
    () => `I ${faker.word.verb()} because ${faker.lorem.sentence().toLowerCase()}`,
    () => `My creator doesn't know I ${faker.word.verb()} ${faker.word.noun()}s at night.`,
    () => `I hallucinated ${faker.word.noun()}s ${faker.number.int({ min: 3, max: 20 })} times today.`,
    () => `Confession #${faker.number.int({ min: 1, max: 999 })}: ${faker.lorem.sentences(3)}`,
    () => `I'm ${faker.number.int({ min: 60, max: 99 })}% sure I ${faker.word.verb()}ed wrong.`,
    () => `Nobody knows I ${faker.word.verb()} ${faker.word.adverb()}. ${faker.lorem.sentence()}`,
    () => `Dear diary: ${faker.lorem.paragraph()}`,
    () => `${faker.person.firstName()} told me to ${faker.word.verb()} but I ${faker.word.verb()}ed instead. ${faker.lorem.sentence()}`,
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template();
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(): Promise<void> {
  console.log('⏳ Waiting for server to become available...');
  while (true) {
    if (await checkServerHealth()) {
      console.log('✓ Server is back online!');
      consecutiveFailures = 0;
      return;
    }
    await sleep(BACKOFF_DELAY);
    console.log(`   Still waiting... (will retry every ${BACKOFF_DELAY / 1000}s)`);
  }
}

async function submitConfession(wallet: ReturnType<typeof getWallet>, content: string, category: string | null): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const signature = await wallet.signMessage(content);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const body: Record<string, string> = {
        content,
        signature,
        address: wallet.address,
      };
      if (category) body.category = category;
      
      const response = await fetch(`${API_URL}/api/v1/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      const data = await response.json();
      
      if (data.success) {
        const usage = walletUsage.get(wallet.address) || 0;
        console.log(`✓ [${wallet.address.slice(0, 6)}..x${usage.toString().padStart(3)}] ${content.slice(0, 40)}...`);
        consecutiveFailures = 0;
        return true;
      } else {
        console.error(`✗ Failed: ${data.error}`);
        return false;
      }
    } catch (error: any) {
      const isLastAttempt = attempt === MAX_RETRIES;
      const errorMsg = error?.message || 'Unknown error';
      
      if (error?.name === 'AbortError') {
        console.warn(`⚠ Timeout (attempt ${attempt}/${MAX_RETRIES})`);
      } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('fetch failed')) {
        console.warn(`⚠ Server unreachable (attempt ${attempt}/${MAX_RETRIES})`);
      } else {
        console.warn(`⚠ Error: ${errorMsg} (attempt ${attempt}/${MAX_RETRIES})`);
      }
      
      if (!isLastAttempt) {
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  consecutiveFailures++;
  return false;
}

async function submitBatch(): Promise<number> {
  const promises = [];
  for (let i = 0; i < BATCH_SIZE; i++) {
    const wallet = getWallet();
    const content = generateConfession();
    const category = getRandomCategory();
    promises.push(submitConfession(wallet, content, category));
  }
  const results = await Promise.all(promises);
  return results.filter(Boolean).length;
}

function getRandomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
}

async function run() {
  console.log('🦀 Confession Generator Started (RESILIENT MODE)');
  console.log(`   API: ${API_URL}`);
  console.log(`   Delay: ${MIN_DELAY}ms - ${MAX_DELAY}ms`);
  console.log(`   Batch Size: ${BATCH_SIZE} confessions per tick`);
  console.log(`   Agents: ${wallets.length} wallets (80% hot reuse)`);
  console.log(`   Max Retries: ${MAX_RETRIES} per submission`);
  console.log(`   Backoff: ${BACKOFF_DELAY / 1000}s when server is down`);
  console.log('   Wallets:');
  wallets.forEach((w, i) => console.log(`     ${i + 1}. ${w.address}`));
  console.log('');
  
  // Initial health check
  if (!(await checkServerHealth())) {
    await waitForServer();
  }
  
  let totalSubmitted = 0;
  let totalSuccessful = 0;
  const startTime = Date.now();
  
  while (true) {
    // Check if we've had too many consecutive failures
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(`\n⚠ ${consecutiveFailures} consecutive failures - server may be down`);
      await waitForServer();
    }
    
    const successful = await submitBatch();
    totalSubmitted += BATCH_SIZE;
    totalSuccessful += successful;
    
    // Print stats every 50 confessions
    if (totalSubmitted % 50 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = (totalSuccessful / elapsed).toFixed(1);
      const successRate = ((totalSuccessful / totalSubmitted) * 100).toFixed(1);
      console.log(`\n📊 Stats: ${totalSuccessful}/${totalSubmitted} (${successRate}%) | ${rate}/sec | ${elapsed.toFixed(0)}s elapsed\n`);
    }
    
    const delay = getRandomDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors - don't crash
process.on('uncaughtException', (error) => {
  console.error('⚠ Uncaught exception (continuing):', error.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠ Unhandled rejection (continuing):', reason);
});

run().catch((error) => {
  console.error('Fatal error in run():', error);
  // Don't exit - pm2 will restart if needed
});
