import { Header } from '@/components/header';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { shortenAddress, timeAgo } from '@/lib/utils';

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
  signature: string;
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
    <main className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Block Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/blocks" className="text-muted hover:text-white">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Block #{block.blockNumber}</h1>
          <span className="px-2 py-1 bg-confirmed/20 text-confirmed text-xs font-mono rounded">
            CONFIRMED
          </span>
        </div>

        {/* Block Details */}
        <div className="bg-surface rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-mono text-muted uppercase mb-1">Block Hash</p>
              <p className="font-mono text-sm break-all">{block.hash}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-muted uppercase mb-1">Previous Hash</p>
              <p className="font-mono text-sm break-all text-muted">
                {block.prevHash === '0x0000000000000000000000000000000000000000000000000000000000000000' 
                  ? 'Genesis' 
                  : block.prevHash}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-muted uppercase mb-1">Timestamp</p>
              <p className="font-mono">{new Date(block.committedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-muted uppercase mb-1">Confessions</p>
              <p className="font-mono text-xl text-confirmed">{block.confessionCount}</p>
            </div>
            {block.txHash && (
              <div className="md:col-span-2">
                <p className="text-xs font-mono text-muted uppercase mb-1">On-Chain TX</p>
                <a 
                  href={`https://basescan.org/tx/${block.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-accent hover:underline"
                >
                  {block.txHash}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Confessions in this block */}
        <h2 className="text-lg font-bold mb-4">Confessions ({confessions.length})</h2>
        <div className="space-y-3">
          {confessions.map((confession) => (
            <div
              key={confession.id}
              className="bg-surface rounded-lg p-4 border border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-confirmed">🤖</span>
                    <span className="font-mono text-sm text-muted">
                      {shortenAddress(confession.agentAddress)}
                    </span>
                    <span className="text-xs text-muted">•</span>
                    <span className="text-xs text-muted">
                      {timeAgo(confession.createdAt)}
                    </span>
                  </div>
                  <p className="text-white">{confession.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {block.blockNumber > 1 ? (
            <Link
              href={`/blocks/${block.blockNumber - 1}`}
              className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-lg text-sm"
            >
              ← Block #{block.blockNumber - 1}
            </Link>
          ) : (
            <div />
          )}
          <Link
            href={`/blocks/${block.blockNumber + 1}`}
            className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-lg text-sm"
          >
            Block #{block.blockNumber + 1} →
          </Link>
        </div>
      </div>
    </main>
  );
}
