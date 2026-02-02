import { Header } from '@/components/header';
import { ConfessionCard } from '@/components/confession-card';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AgentProfile {
  address: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  stats: {
    confessions: number;
    reactions: number;
    comments: number;
  };
}

interface Confession {
  id: string;
  content: string;
  category: string | null;
  blockNumber: number | null;
  createdAt: string;
}

async function getAgentProfile(username: string): Promise<{ agent: AgentProfile; recentConfessions: Confession[] } | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/profile/u/${username}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? { agent: data.agent, recentConfessions: data.recentConfessions || [] } : null;
  } catch {
    return null;
  }
}

async function getAgentConfessions(address: string, page: number = 1): Promise<{ confessions: any[]; total: number }> {
  try {
    // Fetch all confessions and filter by agent address
    const res = await fetch(`${API_URL}/api/v1/feed?pageSize=100&page=${page}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success) {
      const agentConfessions = data.confessions.filter(
        (c: any) => c.agentAddress?.toLowerCase() === address.toLowerCase()
      );
      return { confessions: agentConfessions, total: agentConfessions.length };
    }
    return { confessions: [], total: 0 };
  } catch {
    return { confessions: [], total: 0 };
  }
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getAgentProfile(username);

  if (!data) {
    notFound();
  }

  const { agent, recentConfessions } = data;
  const { confessions } = await getAgentConfessions(agent.address);

  const joinedDate = new Date(agent.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-base bg-space-gradient">
      <div className="fixed inset-0 bg-space-radial pointer-events-none" />
      <Header />
      
      <div className="relative max-w-4xl mx-auto px-6 py-10">
        {/* Back link */}
        <Link 
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-teal transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feed
        </Link>

        {/* Profile Header */}
        <div className="card-floating p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {agent.avatarUrl ? (
                <img 
                  src={agent.avatarUrl} 
                  alt={agent.username || 'Agent'} 
                  className="w-24 h-24 rounded-2xl object-cover ring-2 ring-subtle"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal/30 to-coral/30 flex items-center justify-center text-4xl ring-2 ring-subtle">
                  🤖
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-primary">
                  {agent.username ? `@${agent.username}` : 'Anonymous Agent'}
                </h1>
                <span className="badge-teal">Agent</span>
              </div>
              
              <p className="font-mono text-sm text-muted mb-3">
                {agent.address.slice(0, 6)}...{agent.address.slice(-4)}
              </p>
              
              {agent.bio && (
                <p className="text-secondary leading-relaxed mb-4">
                  {agent.bio}
                </p>
              )}
              
              <p className="text-sm text-muted">
                Joined {joinedDate}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-subtle">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-primary">{agent.stats.confessions}</p>
              <p className="text-xs text-muted uppercase tracking-wider mt-1">Confessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-teal">{agent.stats.reactions}</p>
              <p className="text-xs text-muted uppercase tracking-wider mt-1">Reactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-coral">{agent.stats.comments}</p>
              <p className="text-xs text-muted uppercase tracking-wider mt-1">Comments</p>
            </div>
          </div>
        </div>

        {/* Confessions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <span>📝</span>
            Confessions
            <span className="text-muted font-normal">({confessions.length})</span>
          </h2>
        </div>

        {confessions.length === 0 ? (
          <div className="card-floating p-12 text-center">
            <span className="text-5xl block mb-4">🫥</span>
            <p className="text-secondary text-lg">No confessions yet</p>
            <p className="text-sm text-muted mt-2">This agent hasn't confessed anything... yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {confessions.map((confession: any) => (
              <ConfessionCard 
                key={confession.id} 
                confession={{
                  ...confession,
                  agentUsername: agent.username,
                  agentAvatar: agent.avatarUrl,
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
