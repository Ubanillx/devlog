import fs from 'fs';
import path from 'path';

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8080';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
}

async function fetchPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/posts?page_size=100`);
    const data = await response.json();
    
    if (data.data?.posts) {
      return data.data.posts.map((p: any) => ({
        id: p.id,
        title: p.title,
        excerpt: p.excerpt || '',
        date: p.created_at || p.date,
        tags: p.tags?.map((t: any) => t.name || t) || [],
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch posts from API:', error);
    console.log('Make sure the backend server is running at', API_URL);
    process.exit(1);
  }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRss(posts: BlogPost[]) {
  const now = new Date().toUTCString();
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>UbanillxのDevLog</title>\n    <link>${SITE_URL}</link>\n    <description>Technical blog feed</description>\n    <language>zh-CN</language>\n    <lastBuildDate>${now}</lastBuildDate>`;

  const items = posts.map(post => {
    const link = `${SITE_URL}/?post=${post.id}`;
    const pubDate = new Date(post.date).toUTCString();
    const cats = (post.tags || []).map(t => `      <category>${escapeXml(t)}</category>`).join('\n');
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="false">${post.id}</guid>`,
      `      <pubDate>${pubDate}</pubDate>`,
      `      <description>${escapeXml(post.excerpt || '')}</description>`,
      cats,
      '    </item>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  const footer = '  </channel>\n</rss>';
  return [header, items, footer].join('\n');
}

function buildSitemap(posts: BlogPost[]) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  const urls: string[] = [];

  // Home
  urls.push(
    [
      '  <url>',
      `    <loc>${SITE_URL}/</loc>`,
      `    <changefreq>weekly</changefreq>`,
      `    <priority>1.0</priority>`,
      '  </url>'
    ].join('\n')
  );

  // About
  urls.push(
    [
      '  <url>',
      `    <loc>${SITE_URL}/?view=about</loc>`,
      `    <changefreq>monthly</changefreq>`,
      `    <priority>0.6</priority>`,
      '  </url>'
    ].join('\n')
  );

  // Posts
  posts.forEach(post => {
    urls.push(
      [
        '  <url>',
        `    <loc>${SITE_URL}/?post=${post.id}</loc>`,
        `    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>`,
        `    <changefreq>monthly</changefreq>`,
        `    <priority>0.8</priority>`,
        '  </url>'
      ].join('\n')
    );
  });

  const footer = '</urlset>';
  return [header, urls.join('\n'), footer].join('\n');
}

async function main() {
  console.log('Fetching posts from API...');
  const posts = await fetchPosts();
  console.log(`Found ${posts.length} posts`);

  ensureDir(PUBLIC_DIR);
  const rss = buildRss(posts);
  const sitemap = buildSitemap(posts);

  fs.writeFileSync(path.join(PUBLIC_DIR, 'rss.xml'), rss, { encoding: 'utf8' });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap, { encoding: 'utf8' });

  console.log('Generated:', path.join(PUBLIC_DIR, 'rss.xml'));
  console.log('Generated:', path.join(PUBLIC_DIR, 'sitemap.xml'));
}

main();