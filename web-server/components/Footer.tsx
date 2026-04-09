'use client';

import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/lib/config';

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

export function Footer() {
  return (
    <footer className="border-t border-border/50 dark:border-border py-8 mt-auto transition-all duration-300 bg-bg/60 backdrop-blur-xl relative z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-mono">
        <div className="mb-4 md:mb-0">
          {siteConfig.footer.copyright}
        </div>
        <div className="flex items-center space-x-4">
          <a href="/rss.xml" className="hover:text-textLight" target="_blank" rel="noopener noreferrer">RSS</a>
          <a href="/sitemap.xml" className="hover:text-textLight" target="_blank" rel="noopener noreferrer">Sitemap</a>
          <Link href="/admin" className="hover:text-primary flex items-center gap-1 group transition-colors">
            <LockIcon />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Admin</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
