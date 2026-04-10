'use client';

import React, { useEffect, useState } from 'react';
import { generatePostSummary } from '@/lib/api';
import MarkdownIt from 'markdown-it';

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

interface AISummaryProps {
  postId: string;
  initialSummary?: string | null;
}

export const AISummary: React.FC<AISummaryProps> = ({ postId, initialSummary }) => {
  const [summary, setSummary] = useState<string | null>(initialSummary?.trim() || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(Boolean(initialSummary?.trim()));
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async (force = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generatePostSummary(postId, force);
      setSummary(result);
      setHasLoaded(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : '内容摘要生成失败。';
      setError(message);
      if (!summary) {
        setHasLoaded(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoaded || summary) {
      return;
    }

    void loadSummary(false);
  }, [hasLoaded, postId, summary]);

  if (!isLoading && !summary && !error) return null;

  return (
    <div className="mb-8 p-4 bg-surface/30 border border-border rounded-lg">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">AI Summary</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-mono text-secondary">每分钟最多 5 次</span>
          <button
            type="button"
            onClick={() => void loadSummary(true)}
            disabled={isLoading}
            className="text-xs font-mono px-2.5 py-1 rounded border border-border text-secondary hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '生成中...' : summary ? '重新生成' : '生成摘要'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-border rounded w-3/4"></div>
          <div className="h-3 bg-border rounded w-full"></div>
          <div className="h-3 bg-border rounded w-5/6"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {error ? <div className="text-sm text-red-400 font-mono">{error}</div> : null}
          {summary ? (
            <div
              className="markdown-body text-sm"
              dangerouslySetInnerHTML={{ __html: mdParser.render(summary) }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
