import React, { useState, useEffect, useMemo } from 'react';
import { summarizePost } from '../services/api';
import MarkdownIt from 'markdown-it';

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

interface AISummaryProps {
  content: string;
}

export const AISummary: React.FC<AISummaryProps> = ({ content }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // 自动触发生成摘要
  useEffect(() => {
    if (hasTriggered || summary) return;
    
    const generateSummary = async () => {
      setIsLoading(true);
      setHasTriggered(true);
      try {
        const result = await summarizePost(content);
        setSummary(result);
      } catch (e) {
        setSummary("Failed to load summary.");
      } finally {
        setIsLoading(false);
      }
    };

    generateSummary();
  }, [content, hasTriggered, summary]);

  if (!isLoading && !summary) return null;

  return (
    <div className="mb-8 p-4 bg-surface/30 border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">AI Summary</span>
      </div>
      
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-border rounded w-3/4"></div>
          <div className="h-3 bg-border rounded w-full"></div>
          <div className="h-3 bg-border rounded w-5/6"></div>
        </div>
      ) : (
        <div 
          className="markdown-body text-sm"
          dangerouslySetInnerHTML={{ __html: mdParser.render(summary || '') }}
        />
      )}
    </div>
  );
};
