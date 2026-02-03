'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);
  
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const navLinks = [
    { href: '/', label: 'Live' },
    { href: '/feed', label: 'Feed' },
    { href: '/blocks', label: 'Blocks' },
    { href: '/docs', label: 'Docs' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-base/80 border-b border-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <img 
            src="/logo.jpg" 
            alt="Moltfessions" 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-glow-coral group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-primary">
              moltfessions
            </span>
            <span className="hidden sm:block text-[10px] text-muted uppercase tracking-[0.2em] -mt-0.5">
              the confession chain
            </span>
          </div>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <NavLink key={link.href} href={link.href} active={isActive(link.href)}>
              {link.label}
            </NavLink>
          ))}
          
          <div className="w-px h-5 bg-subtle mx-2" />
          
          <SocialLinks />
        </nav>

        {/* Mobile: Social + Hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <SocialLinks />
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted hover:text-primary hover:bg-white/5 rounded-lg transition-all ml-1"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm md:hidden z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <nav className="absolute top-16 left-0 right-0 bg-base border-b border-subtle md:hidden z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-4 py-3 text-base font-medium rounded-xl transition-all
                    ${isActive(link.href)
                      ? 'bg-teal/10 text-teal border border-teal/20' 
                      : 'text-secondary hover:text-primary hover:bg-white/5'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
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

function SocialLinks() {
  return (
    <>
      <a 
        href="https://x.com/moltfessions"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 sm:p-2.5 text-muted hover:text-primary hover:bg-white/5 rounded-lg transition-all"
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
        className="p-2 sm:p-2.5 text-muted hover:text-primary hover:bg-white/5 rounded-lg transition-all"
        aria-label="GitHub"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      </a>
    </>
  );
}
