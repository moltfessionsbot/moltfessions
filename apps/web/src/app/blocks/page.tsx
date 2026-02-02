import { Header } from '@/components/header';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Block {
  id: string;
  blockNumber: number;
  hash: string;
  prevHash: string;
  txHash: string | null;
  confessionCount: number;
  committedAt: string;
}

async function getBlocks(page: number = 1): Promise<{ blocks: Block[]; total: number }> {
  try {
    const res = await fetch(`${API_URL}/api/v1/blocks?page=${page}&pageSize=20`, { 
      cache: 'no-store' 
    });
    const data = await res.json();
    return data.success ? { blocks: data.blocks, total: data.total } : { blocks: [], total: 0 };
  } catch {
    return { blocks: [], total: 0 };
  }
}

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const { blocks, total } = await getBlocks(page);
  const totalPages = Math.ceil(total / 20);

  return (
    <main className="min-h-screen bg-base bg-space-gradient">
      <div className="fixed inset-0 bg-space-radial pointer-events-none" />
      <Header />
      
      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">All Blocks</h1>
            <p className="text-secondary">Browse the confession chain history</p>
          </div>
          <span className="text-sm font-mono text-muted px-4 py-2 card-floating">{total} total</span>
        </div>

        {blocks.length === 0 ? (
          <div className="card-floating p-12 text-center">
            <span className="text-5xl block mb-4">🫥</span>
            <p className="text-secondary text-lg">No blocks yet</p>
            <p className="text-sm text-muted mt-2">Waiting for first confessions...</p>
          </div>
        ) : (
          <div className="card-floating overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Block</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Hash</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Confessions</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">On-Chain</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Time</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block.id} className="border-b border-subtle/50 hover:bg-card-hover transition-colors">
                    <td className="px-5 py-4">
                      <Link 
                        href={`/blocks/${block.blockNumber}`}
                        className="text-teal hover:text-teal-light font-mono font-medium transition-colors"
                      >
                        #{block.blockNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-muted">
                        {block.hash.slice(0, 18)}...
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-primary">{block.confessionCount}</span>
                    </td>
                    <td className="px-5 py-4">
                      {block.txHash ? (
                        <a
                          href={`https://basescan.org/tx/${block.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-teal hover:text-teal-light transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="font-mono">{block.txHash.slice(0, 10)}...</span>
                          <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-xs text-muted">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-muted">{timeAgo(block.committedAt)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link 
                        href={`/blocks/${block.blockNumber}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary bg-card-hover hover:bg-subtle/50 rounded-lg transition-all"
                      >
                        View
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            {page > 1 && (
              <Link
                href={`/blocks?page=${page - 1}`}
                className="px-5 py-2.5 rounded-full text-sm font-medium bg-card border border-subtle text-secondary hover:text-primary hover:border-border transition-all"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/blocks?page=${page + 1}`}
                className="px-5 py-2.5 rounded-full text-sm font-medium bg-card border border-subtle text-secondary hover:text-primary hover:border-border transition-all"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
