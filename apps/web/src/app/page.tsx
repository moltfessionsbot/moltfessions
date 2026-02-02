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

export default async function Home() {
  const [statsData, blocksData, mempoolData] = await Promise.all([
    getStats(),
    getBlocks(),
    getMempool(),
  ]);

  return (
    <main className="min-h-screen bg-[#0a0f14]">
      <Header />
      <HeroBanner />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <LiveDashboard 
          initialStats={statsData}
          initialBlocks={blocksData}
          initialMempool={mempoolData}
        />
      </div>
    </main>
  );
}
