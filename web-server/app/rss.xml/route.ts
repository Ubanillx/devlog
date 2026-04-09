import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8080';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.ubanillx.com';

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let posts: any[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/posts?page_size=100`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    posts = data.data?.posts || [];
  } catch {
    // Return empty feed if API is down
  }

  const now = new Date().toUTCString();
  const items = posts.map((post: any) => {
    const link = `${SITE_URL}/posts/${post.id}`;
    const pubDate = new Date(post.date || post.publishedDate || Date.now()).toUTCString();
    const tags = (post.tags || []).map((t: any) => `      <category>${escapeXml(t.name || t)}</category>`).join('\n');
    return [
      '    <item>',
      `      <title>${escapeXml(post.title || '')}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="false">${post.id}</guid>`,
      `      <pubDate>${pubDate}</pubDate>`,
      `      <description>${escapeXml(post.excerpt || '')}</description>`,
      tags,
      '    </item>',
    ].filter(Boolean).join('\n');
  }).join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    '    <title>UbanillxのDevLog</title>',
    `    <link>${SITE_URL}</link>`,
    '    <description>Technical blog feed</description>',
    '    <language>zh-CN</language>',
    `    <lastBuildDate>${now}</lastBuildDate>`,
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
