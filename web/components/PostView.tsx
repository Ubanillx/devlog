import React, { useEffect, useMemo, useState, useRef } from 'react';
import { BlogPost } from '../types';
import { AISummary } from './AISummary';
import { AIChatSidebar } from './AIChatSidebar';
import { TableOfContents } from './TableOfContents';
import { CommentSection } from './CommentSection';
import { PostsService } from '../api-client';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { PhotoSlider } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

interface PostViewProps {
  postId: string;
  onBack: () => void;
}

// 生成标题 ID 的辅助函数
const generateBaseId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// 创建带有 ID 计数器的 markdown-it 实例
const createMdParser = () => {
  const idCounts: Record<string, number> = {};
  
  const parser = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
        } catch (__) {}
      }
      try {
        return `<pre class="hljs"><code>${hljs.highlightAuto(str).value}</code></pre>`;
      } catch (__) {}
      return `<pre class="hljs"><code>${parser.utils.escapeHtml(str)}</code></pre>`;
    }
  });

  // 为标题添加唯一 ID
  parser.renderer.rules.heading_open = (tokens, idx) => {
    const token = tokens[idx];
    const level = token.tag;
    const contentToken = tokens[idx + 1];
    const text = contentToken?.children?.map(t => t.content).join('') || '';
    const baseId = generateBaseId(text);
    
    // 处理重复 ID
    const count = idCounts[baseId] || 0;
    const id = count === 0 ? baseId : `${baseId}-${count}`;
    idCounts[baseId] = count + 1;
    
    return `<${level} id="${id}">`;
  };

  return parser;
};

// Markdown Renderer Component using markdown-it
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  // 每次内容变化时创建新的 parser 实例，确保 ID 计数器重置
  const html = useMemo(() => createMdParser().render(content), [content]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<{ src: string; key: string }[]>([]);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;

    const imgElements = Array.from(contentRef.current.querySelectorAll('img')) as HTMLImageElement[];
    
    // Update images for the slider
    const imageList = imgElements.map((img, idx) => ({
      src: img.src,
      key: `${img.src}-${idx}`,
    }));
    setImages(imageList);

    // Add cursor style to indicate clickability
    imgElements.forEach(img => {
      img.style.cursor = 'zoom-in';
    });
  }, [html]);

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      const img = target as HTMLImageElement;
      
      // Find the index of the clicked image
      if (contentRef.current) {
        const allImages = Array.from(contentRef.current.querySelectorAll('img')) as HTMLImageElement[];
        const clickedIndex = allImages.indexOf(img);
        
        if (clickedIndex !== -1) {
          console.log('Image clicked:', clickedIndex, img.src);
          setIndex(clickedIndex);
          setVisible(true);
        }
      }
    }
  };
  
  return (
    <>
      <div 
        ref={contentRef}
        className="markdown-body prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleContentClick}
      />
      <PhotoSlider
        images={images}
        visible={visible}
        onClose={() => setVisible(false)}
        index={index}
        onIndexChange={setIndex}
      />
    </>
  );
};

export const PostView: React.FC<PostViewProps> = ({ postId, onBack }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch post data by ID
  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await PostsService.getPosts1(postId);
        if (res.data) {
          setPost({
            id: res.data.id || postId,
            title: res.data.title || '',
            date: res.data.date || res.data.publishedDate || new Date().toISOString().split('T')[0],
            tags: res.data.tags || [],
            excerpt: res.data.excerpt || '',
            content: res.data.content || '',
            readTime: res.data.readTime || res.data.read_time || '1 min',
            viewCount: res.data.viewCount ?? 0,
            isPublished: res.data.isPublished ?? res.data.is_published ?? true,
          });
        } else {
          setError('Post not found');
        }
      } catch (e) {
        console.error('Failed to fetch post:', e);
        setError('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
    window.scrollTo(0, 0);
  }, [postId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 animate-fade-in">
        <button 
          onClick={onBack}
          className="group mb-8 flex items-center text-sm text-secondary hover:text-primary transition-colors font-mono"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> cd ..
        </button>
        <div className="space-y-6">
          {/* Skeleton header */}
          <div className="animate-pulse space-y-4">
            <div className="flex gap-3">
              <div className="h-6 w-24 bg-surface rounded"></div>
              <div className="h-6 w-16 bg-surface rounded"></div>
            </div>
            <div className="h-10 w-3/4 bg-surface rounded"></div>
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-surface rounded"></div>
              <div className="h-5 w-20 bg-surface rounded"></div>
            </div>
          </div>
          {/* Skeleton content */}
          <div className="border-t border-border pt-8 animate-pulse space-y-4">
            <div className="h-4 w-full bg-surface rounded"></div>
            <div className="h-4 w-5/6 bg-surface rounded"></div>
            <div className="h-4 w-4/5 bg-surface rounded"></div>
            <div className="h-4 w-full bg-surface rounded"></div>
            <div className="h-4 w-3/4 bg-surface rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 animate-fade-in">
        <button 
          onClick={onBack}
          className="group mb-8 flex items-center text-sm text-secondary hover:text-primary transition-colors font-mono"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> cd ..
        </button>
        <div className="text-center py-20">
          <div className="text-red-400 font-mono mb-4">Error: {error || 'Post not found'}</div>
          <button onClick={onBack} className="text-primary hover:underline font-mono">
            Return to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[140rem] mx-auto px-4 flex justify-center gap-8 animate-fade-in">
        <article className="w-full max-w-6xl animate-slide-up">
          <button 
            onClick={onBack}
            className="group mb-8 flex items-center text-sm text-secondary hover:text-primary transition-colors font-mono"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> cd ..
          </button>

      <header className="mb-6 border-b border-border pb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3 mb-5 flex-wrap">
             <span className="text-xs font-mono text-secondary bg-surface-highlight border border-border px-2 py-1 rounded">
                {post.date}
             </span>
             <span className="text-xs font-mono text-accent bg-accent/10 border border-accent/20 px-2 py-1 rounded">
                {post.readTime}
             </span>
             <span className="text-xs font-mono text-secondary bg-surface-highlight border border-border px-2 py-1 rounded flex items-center gap-1">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {post.viewCount ?? 0} views
             </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-textLight leading-tight mb-6 tracking-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          {post.tags.map(tag => (
             <span key={tag} className="text-xs text-primary hover:underline cursor-pointer">#{tag}</span>
          ))}
        </div>
      </header>

      {/* AI Summary - 标题下方自动生成 */}
      <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <AISummary content={post.content} />
      </div>

      <div className="font-medium text-text leading-loose mb-16 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <MarkdownRenderer content={post.content} />
      </div>
      
      <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CommentSection postId={post.id} />
      </div>
      
      <div className="h-24"></div> {/* Bottom spacer */}
    </article>

    {/* Left Sidebar - Table of Contents */}
    <aside className="hidden lg:block w-64 flex-shrink-0 order-first">
      <div className="sticky top-28 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="bg-surface/30 border border-border/50 rounded-lg p-4 backdrop-blur-sm">
          <TableOfContents content={post.content} />
        </div>
      </div>
    </aside>

    {/* Right Sidebar - AI Chat */}
    <aside className="hidden xl:block w-80 flex-shrink-0">
      <div className="sticky top-28 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <AIChatSidebar content={post.content} mode="sidebar" />
      </div>
    </aside>
    </div>

    {/* Mobile/Tablet Floating Button */}
    <div className="xl:hidden">
      <AIChatSidebar content={post.content} mode="floating" />
    </div>
    </>
  );
};