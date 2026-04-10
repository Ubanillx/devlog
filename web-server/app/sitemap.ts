import { MetadataRoute } from 'next';

const INTERNAL_API_BASE = process.env.NEXT_INTERNAL_API_URL || 'http://backend:8080/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.ubanillx.com';

export const dynamic = 'force-dynamic';

interface ApiPost {
  id: string;
  title: string;
  date?: string;
  publishedDate?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: ApiPost[] = [];

  try {
    const pageSize = 100;
    let page = 1;

    while (true) {
      const res = await fetch(`${INTERNAL_API_BASE}/posts?page=${page}&page_size=${pageSize}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        break;
      }

      const data = await res.json();
      const pagePosts: ApiPost[] = data.data?.posts || [];

      if (pagePosts.length === 0) {
        break;
      }

      posts.push(...pagePosts);

      if (pagePosts.length < pageSize) {
        break;
      }

      page += 1;
    }
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
