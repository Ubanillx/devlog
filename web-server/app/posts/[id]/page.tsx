import { Metadata } from 'next';
import { getPost } from '@/lib/posts';
import { PostView } from '@/components/PostView';
import { siteConfig } from '@/lib/config';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await getPost(id);
    return {
      title: post.title,
      description: post.excerpt || post.content?.slice(0, 160),
      keywords: post.tags,
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content?.slice(0, 160),
        type: 'article',
        publishedTime: post.date,
        authors: [siteConfig.author.name],
        tags: post.tags,
      },
      twitter: {
        card: 'summary',
        title: post.title,
        description: post.excerpt || post.content?.slice(0, 160),
      },
    };
  } catch {
    return { title: 'Post Not Found' };
  }
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  let post;
  try {
    post = await getPost(id);
  } catch {
    notFound();
  }

  return <PostView post={post} />;
}
