'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { BlogPost } from '@/lib/types';
import { getPosts } from '@/lib/posts';

interface HomePostListProps {
  initialPosts: BlogPost[];
  pageSize?: number;
}

export function HomePostList({ initialPosts, pageSize = 10 }: HomePostListProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(initialPosts.length >= pageSize);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nextPage = page + 1;
      const res = await getPosts(nextPage, pageSize);
      const nextPosts = res.posts || [];

      setPosts(prev => {
        const existed = new Set(prev.map(item => item.id));
        const merged = [...prev];
        for (const item of nextPosts) {
          if (!existed.has(item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });

      setPage(nextPage);
      setHasMore(nextPosts.length >= pageSize);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, pageSize]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '220px 0px' }
    );

    observer.observe(loaderRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  const itemCountLabel = useMemo(() => `${posts.length} items`, [posts.length]);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-textLight flex items-center gap-2">
          <span className="text-primary">ls</span>
          <span className="text-gray-500">-lat</span>
          posts/
        </h2>
        <span className="text-xs text-gray-500 border border-gray-700 rounded px-2 py-1 bg-bg">
          {itemCountLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-secondary font-mono">Directory is empty.</div>
        ) : (
          posts.map((post, index) => (
            <div
              key={post.id}
              className="animate-fade-in slide-up-from-bottom-4 duration-500"
              style={{ animationDelay: `${(index % 10) * 80}ms`, animationFillMode: 'both' }}
            >
              <PostCard post={post} />
            </div>
          ))
        )}
      </div>

      <div ref={loaderRef} className="py-8 text-center min-h-14">
        {loading ? (
          <div className="text-gray-500 font-mono text-sm animate-pulse">Loading more...</div>
        ) : null}

        {!loading && hasMore ? (
          <div className="text-gray-500 font-mono text-sm animate-pulse">↓ Scroll for more</div>
        ) : null}

        {!loading && !hasMore ? (
          <div className="text-gray-500 font-mono text-sm">- End of posts -</div>
        ) : null}

        {error ? <div className="text-red-400 font-mono text-xs mt-2">Load failed: {error}</div> : null}
      </div>
    </>
  );
}