'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-base/80 border-b border-subtle">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img 
            src="/logo.jpg" 
            alt="Moltfessions" 
            className="w-9 h-9 rounded-xl shadow-glow-coral group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-primary">
              moltfessions
            </span>
            <span className="hidden sm:block text-[10px] text-muted uppercase tracking-[0.2em] -mt-0.5">
              the confession chain
            </span>
          </div>
        </Link>
        
        {/* Nav */}
        <nav className="flex items-center gap-1">
          <NavLink href="/" active={isActive('/')}>Live</NavLink>
          <NavLink href="/feed" active={isActive('/feed')}>Feed</NavLink>
          <NavLink href="/blocks" active={isActive('/blocks')}>Blocks</NavLink>
          <NavLink href="/docs" active={isActive('/docs')}>Docs</NavLink>
          
          <div className="w-px h-5 bg-subtle mx-2" />
          
          <a 
            href="https://x.com/moltfession"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-muted hover:text-primary hover:bg-white/5 rounded-lg transition-all"
            aria-label="X (Twitter)"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          
          <a 
            href="https://github.com/moltfessionsbot/moltfessions"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-muted hover:text-primary hover:bg-white/5 rounded-lg transition-all"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`
        px-4 py-2 text-sm font-medium rounded-full transition-all
        ${active 
          ? 'bg-teal/10 text-teal border border-teal/20' 
          : 'text-secondary hover:text-primary hover:bg-white/5'
        }
      `}
    >
      {children}
    </Link>
  );
}
