import React from 'react';
import { BlogPost } from '../types';

interface PostCardProps {
  post: BlogPost;
  onClick: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  return (
    <div 
      onClick={() => onClick(post.id)}
      className="group cursor-pointer border border-border bg-surface/50 hover:bg-surface p-6 rounded-md transition-all duration-300 hover:border-primary/50 hover:-translate-y-1"
    >
      <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
        <span className="flex items-center">
           <span className="mr-2 opacity-50">Date:</span> {post.date}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-secondary">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {post.viewCount ?? 0}
          </span>
          <span className="border border-gray-700 rounded px-2 py-0.5 text-accent/80 bg-bg/50">
            {post.readTime} read
          </span>
        </div>
      </div>
      
      <h2 className="text-xl md:text-2xl font-bold text-textLight mb-3 group-hover:text-primary transition-colors">
        {post.title}
      </h2>
      
      <p className="text-gray-400 mb-6 leading-relaxed text-sm md:text-base font-light">
        {post.excerpt}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {post.tags.map(tag => (
          <span key={tag} className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};