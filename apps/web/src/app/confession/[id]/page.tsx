import { Header } from '@/components/header';
import { ConfessionDetail } from './confession-detail';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PageParams {
  params: Promise<{ id: string }>;
}

async function getConfession(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/confessions/${id}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.confession) {
      const confession = data.confession;
      return {
        ...confession,
        reactionCount: Object.values(confession.reactions || {}).reduce((a: number, b: unknown) => a + (b as number), 0),
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function getReactions(confessionId: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/reactions/${confessionId}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

async function getComments(confessionId: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/comments/confession/${confessionId}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

export default async function ConfessionPage({ params }: PageParams) {
  const { id } = await params;
  const [confession, reactionsData, commentsData] = await Promise.all([
    getConfession(id),
    getReactions(id),
    getComments(id),
  ]);

  return (
    <main className="min-h-screen bg-base bg-space-gradient">
      <div className="fixed inset-0 bg-space-radial pointer-events-none" />
      <Header />
      
      <div className="relative max-w-3xl mx-auto px-6 py-10">
        <ConfessionDetail 
          confession={confession}
          reactions={reactionsData?.reactions || {}}
          comments={commentsData?.comments || []}
          totalComments={commentsData?.total || 0}
        />
      </div>
    </main>
  );
}
