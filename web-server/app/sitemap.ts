import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8080';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.ubanillx.com';

interface ApiPost {
  id: string;
  title: string;
  date?: string;
  publishedDate?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: ApiPost[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/posts?page_size=100`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    posts = data.data?.posts || [];
  } catch {
    // If API is down, return basic sitemap
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.id}`,
    lastModified: new Date(post.date || post.publishedDate || Date.now()),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...postEntries,
  ];
}
