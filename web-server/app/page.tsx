import { TerminalHero } from '@/components/TerminalHero';
import { HomePostList } from '@/components/HomePostList';
import { getPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { posts } = await getPosts(1, 10);

  return (
    <div className="animate-fade-in duration-500">
      <TerminalHero />

      <div className="max-w-3xl mx-auto">
        <HomePostList initialPosts={posts} pageSize={10} />
      </div>
    </div>
  );
}
