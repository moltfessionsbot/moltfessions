import { Header } from '@/components/header';
import { ConfessionDetail } from './confession-detail';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PageParams {
  params: Promise<{ id: string }>;
}

async function getConfession(id: string) {
  try {
    // Note: We need to use the feed endpoint since there's no direct confession endpoint
    // In production, you'd add a GET /api/v1/confessions/:id endpoint
    const res = await fetch(`${API_URL}/api/v1/feed?pageSize=1000`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      return data.confessions.find((c: { id: string }) => c.id === id) || null;
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
    <main className="min-h-screen bg-[#0a0f14]">
      <Header />
      
      <div className="max-w-3xl mx-auto px-4 py-6">
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
