import { TerminalHero } from '@/components/TerminalHero';
import { PostCard } from '@/components/PostCard';
import { getPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { posts } = await getPosts(1, 10);

  return (
    <div className="animate-fade-in duration-500">
      <TerminalHero />

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-textLight flex items-center gap-2">
            <span className="text-primary">ls</span>
            <span className="text-gray-500">-lat</span>
            posts/
          </h2>
          <span className="text-xs text-gray-500 border border-gray-700 rounded px-2 py-1 bg-bg">
            {posts.length} items
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {posts.length === 0 ? (
            <div className="text-center py-20 text-secondary font-mono">
              Directory is empty.
            </div>
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

        <LoadMoreSection initialPage={1} initialHasMore={posts.length >= 10} />
      </div>
    </div>
  );
}

function LoadMoreSection({ initialPage, initialHasMore }: { initialPage: number; initialHasMore: boolean }) {
  // This will be a client component for infinite scroll
  return (
    <div className="py-8 text-center">
      {initialHasMore ? (
        <div className="text-gray-500 font-mono text-sm animate-pulse">
          ↓ Scroll for more
        </div>
      ) : (
        <div className="text-gray-500 font-mono text-sm">
          — End of posts —
        </div>
      )}
    </div>
  );
}
