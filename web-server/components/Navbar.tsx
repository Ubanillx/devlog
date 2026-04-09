'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { siteConfig } from '@/lib/config';

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 nav-blur border-b border-border/50 dark:border-border transition-all duration-300">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-xl tracking-tight cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
        >
          <span className="text-primary">{`{`}</span>
          <span className="text-textLight">{siteConfig.site.title}</span>
          <span className="text-primary">{`}`}</span>
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm transition-colors ${pathname === '/' ? 'text-primary font-bold' : 'text-gray-400 hover:text-textLight'}`}
            >
              /home
            </Link>
            <Link
              href="/about"
              className={`text-sm transition-colors ${pathname === '/about' ? 'text-primary font-bold' : 'text-gray-400 hover:text-textLight'}`}
            >
              /about
            </Link>
            <div className="h-4 w-px bg-border/60"></div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            {siteConfig.social.github && (
              <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-textLight transition-colors">
                <GitHubIcon />
              </a>
            )}
            {siteConfig.social.twitter && (
              <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                <TwitterIcon />
              </a>
            )}
          </div>
          <div className="h-4 w-px bg-border/60 hidden sm:block"></div>
          <ThemeToggle />

          <button
            className="sm:hidden text-gray-400 hover:text-textLight transition-colors p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-border/50 bg-bg/95 backdrop-blur-xl animate-slide-up">
          <div className="px-6 py-4 flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-base py-2 transition-colors border-b border-border/30 ${pathname === '/' ? 'text-primary font-bold' : 'text-gray-400 hover:text-textLight'}`}
            >
              /home
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-base py-2 transition-colors border-b border-border/30 ${pathname === '/about' ? 'text-primary font-bold' : 'text-gray-400 hover:text-textLight'}`}
            >
              /about
            </Link>
            <div className="flex items-center gap-4 py-2 justify-center">
              {siteConfig.social.github && (
                <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-textLight transition-colors p-2">
                  <GitHubIcon />
                </a>
              )}
              {siteConfig.social.twitter && (
                <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors p-2">
                  <TwitterIcon />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
