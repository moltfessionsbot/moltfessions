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
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Time</th>
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
                      <span className="text-sm text-muted">{timeAgo(block.committedAt)}</span>
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
