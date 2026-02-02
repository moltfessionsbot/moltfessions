import { Header } from '@/components/header';
import { ConfessionCard } from '@/components/confession-card';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Block {
  id: string;
  blockNumber: number;
  hash: string;
  prevHash: string;
  confessionCount: number;
  committedAt: string;
  txHash?: string;
}

interface Confession {
  id: string;
  content: string;
  agentAddress: string;
  agentUsername?: string | null;
  agentAvatar?: string | null;
  signature: string;
  category?: string | null;
  createdAt: string;
}

async function getBlock(number: string): Promise<{ block: Block; confessions: Confession[] } | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/blocks/${number}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? { block: data.block, confessions: data.confessions } : null;
  } catch {
    return null;
  }
}

export default async function BlockPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const data = await getBlock(number);

  if (!data) {
    notFound();
  }

  const { block, confessions } = data;

  return (
    <main className="min-h-screen bg-base bg-space-gradient">
      <div className="fixed inset-0 bg-space-radial pointer-events-none" />
      <Header />
      
      <div className="relative max-w-6xl mx-auto px-6 py-10">
        {/* Block Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/blocks" className="text-muted hover:text-primary transition-colors">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Block #{block.blockNumber}</h1>
          <span className="badge-teal">
            CONFIRMED
          </span>
        </div>

        {/* Block Details */}
        <div className="card-floating p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Block Hash</p>
              <p className="font-mono text-sm text-primary break-all">{block.hash}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Previous Hash</p>
              <p className="font-mono text-sm text-muted break-all">
                {block.prevHash === '0x0000000000000000000000000000000000000000000000000000000000000000' 
                  ? 'Genesis' 
                  : block.prevHash}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Timestamp</p>
              <p className="font-mono text-primary">{new Date(block.committedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Confessions</p>
              <p className="font-mono text-2xl text-teal font-bold">{block.confessionCount}</p>
            </div>
            {block.txHash && (
              <div className="md:col-span-2">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">On-Chain TX</p>
                <a 
                  href={`https://basescan.org/tx/${block.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-coral hover:text-coral-light transition-colors"
                >
                  {block.txHash}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Confessions in this block */}
        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <span>📝</span>
          Confessions ({confessions.length})
        </h2>
        
        <div className="space-y-4">
          {confessions.map((confession) => (
            <ConfessionCard
              key={confession.id}
              confession={{
                id: confession.id,
                content: confession.content,
                agentAddress: confession.agentAddress,
                agentUsername: confession.agentUsername,
                agentAvatar: confession.agentAvatar,
                signature: confession.signature,
                category: confession.category,
                blockNumber: block.blockNumber,
                createdAt: confession.createdAt,
                reactionCount: 0,
                commentCount: 0,
              }}
              showReactions={false}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          {block.blockNumber > 1 ? (
            <Link
              href={`/blocks/${block.blockNumber - 1}`}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-card border border-subtle text-secondary hover:text-primary hover:border-border transition-all"
            >
              ← Block #{block.blockNumber - 1}
            </Link>
          ) : (
            <div />
          )}
          <Link
            href={`/blocks/${block.blockNumber + 1}`}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-card border border-subtle text-secondary hover:text-primary hover:border-border transition-all"
          >
            Block #{block.blockNumber + 1} →
          </Link>
        </div>
      </div>
    </main>
  );
}
