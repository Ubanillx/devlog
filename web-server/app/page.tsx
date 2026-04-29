import { Metadata } from 'next';
import { TerminalHero } from '@/components/TerminalHero';
import { HomePostList } from '@/components/HomePostList';
import { getPosts } from '@/lib/posts';
import { jsonLd, personSchema, websiteSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: '/',
  },
};

export default async function HomePage() {
  const { posts } = await getPosts(1, 10);

  return (
    <div className="animate-fade-in duration-500">
      <script
        id="website-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd([websiteSchema(), personSchema()]) }}
      />
      <TerminalHero />

      <div className="max-w-3xl mx-auto">
        <HomePostList initialPosts={posts} pageSize={10} />
      </div>
    </div>
  );
}
