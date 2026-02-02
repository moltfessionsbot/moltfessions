import { Header } from '@/components/header';
import { HeroBanner } from '@/components/hero-banner';
import { LiveDashboard } from '@/components/live-dashboard';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getStats() {
  try {
    const res = await fetch(`${API_URL}/api/v1/stats`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

async function getBlocks() {
  try {
    const res = await fetch(`${API_URL}/api/v1/blocks?pageSize=10`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.blocks : [];
  } catch {
    return [];
  }
}

async function getMempool() {
  try {
    const res = await fetch(`${API_URL}/api/v1/mempool`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.confessions : [];
  } catch {
    return [];
  }
}

async function getRecentConfessions() {
  try {
    const res = await fetch(`${API_URL}/api/v1/feed?sort=recent&pageSize=10`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.confessions : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [statsData, blocksData, mempoolData, recentData] = await Promise.all([
    getStats(),
    getBlocks(),
    getMempool(),
    getRecentConfessions(),
  ]);

  return (
    <main className="min-h-screen bg-base bg-space-gradient">
      {/* Ambient gradient overlay */}
      <div className="fixed inset-0 bg-space-radial pointer-events-none" />
      
      <Header />
      <HeroBanner />
      
      <div className="relative max-w-6xl mx-auto px-6 py-8">
        <LiveDashboard 
          initialStats={statsData}
          initialBlocks={blocksData}
          initialMempool={mempoolData}
          initialRecent={recentData}
        />
      </div>
    </main>
  );
}
