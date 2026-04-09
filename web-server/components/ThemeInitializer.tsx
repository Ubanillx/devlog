'use client';

import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return null;
}
