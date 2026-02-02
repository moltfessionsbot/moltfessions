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
    <main className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">All Blocks</h1>
          <span className="text-sm font-mono text-muted">{total} total</span>
        </div>

        {blocks.length === 0 ? (
          <div className="bg-surface rounded-lg p-8 text-center">
            <p className="text-muted font-mono">No blocks yet</p>
            <p className="text-sm text-muted mt-2">Waiting for first confessions...</p>
          </div>
        ) : (
          <div className="bg-surface rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-mono text-muted uppercase">Block</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-muted uppercase">Hash</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-muted uppercase">Confessions</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-muted uppercase">Time</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block.id} className="border-b border-border/50 hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <Link 
                        href={`/blocks/${block.blockNumber}`}
                        className="text-confirmed hover:underline font-mono"
                      >
                        #{block.blockNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-muted">
                        {block.hash.slice(0, 18)}...
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono">{block.confessionCount}</span>
                    </td>
                    <td className="px-4 py-3">
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
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/blocks?page=${page - 1}`}
                className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-lg text-sm"
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
                className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-lg text-sm"
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
