import { Metadata } from 'next';
import { getPost } from '@/lib/posts';
import { PostView } from '@/components/PostView';
import { siteConfig } from '@/lib/config';
import { blogPostingSchema, jsonLd, postDescription, postPath, postUrl } from '@/lib/seo';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await getPost(id);
    const description = postDescription(post);

    return {
      title: post.title,
      description,
      keywords: post.tags,
      alternates: {
        canonical: postPath(post.id),
      },
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        url: postUrl(post.id),
        publishedTime: post.date,
        authors: [siteConfig.author.name],
        tags: post.tags,
      },
      twitter: {
        card: 'summary',
        title: post.title,
        description,
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

  return (
    <>
      <script
        id="blog-posting-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(blogPostingSchema(post)) }}
      />
      <PostView post={post} />
    </>
  );
}
