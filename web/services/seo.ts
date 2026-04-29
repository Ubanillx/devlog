/**
 * SEO utility module for managing canonical tags and JSON-LD structured data.
 */

const SITE_URL = 'https://blog.ubanillx.com';
const SITE_NAME = 'UbanillxのDevLog';

// ── Canonical tag management ──────────────────────────────────────────────

let canonicalElement: HTMLLinkElement | null = null;

function getOrCreateCanonical(): HTMLLinkElement {
  if (!canonicalElement) {
    const existing = document.querySelector('link[rel="canonical"]');
    if (existing) {
      canonicalElement = existing as HTMLLinkElement;
    } else {
      canonicalElement = document.createElement('link');
      canonicalElement.rel = 'canonical';
      document.head.appendChild(canonicalElement);
    }
  }
  return canonicalElement;
}

/**
 * Set the canonical URL for the current page.
 * If path is omitted, defaults to the site root.
 */
export function setCanonical(path: string = '/') {
  const link = getOrCreateCanonical();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  link.href = `${SITE_URL}${cleanPath}`;
}

/**
 * Update the page <title> dynamically.
 */
export function setPageTitle(title: string) {
  document.title = title;
}

/**
 * Update a meta tag by name attribute.
 */
function setMetaByName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (el) {
    el.setAttribute('content', content);
  }
}

/**
 * Update a meta tag by property attribute (Open Graph).
 */
function setMetaByProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (el) {
    el.setAttribute('content', content);
  }
}

// ── JSON-LD structured data management ────────────────────────────────────

let jsonLdScript: HTMLScriptElement | null = null;

function getOrCreateJsonLd(): HTMLScriptElement {
  if (!jsonLdScript) {
    const existing = document.getElementById('seo-json-ld');
    if (existing) {
      jsonLdScript = existing as HTMLScriptElement;
    } else {
      jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.id = 'seo-json-ld';
      document.head.appendChild(jsonLdScript);
    }
  }
  return jsonLdScript;
}

/**
 * Set WebSite structured data (for homepage).
 */
export function setWebSiteSchema() {
  const script = getOrCreateJsonLd();
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Ubanillx 的个人开发日志，记录编程学习、技术探索与项目开发的点滴。',
    author: {
      '@type': 'Person',
      name: 'Ubanillx',
      url: SITE_URL,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
}

/**
 * Set BlogPosting structured data (for article pages).
 */
export function setBlogPostingSchema(params: {
  title: string;
  description: string;
  date: string;
  url: string;
  tags?: string[];
}) {
  const script = getOrCreateJsonLd();
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: params.title,
    description: params.description,
    datePublished: params.date,
    author: {
      '@type': 'Person',
      name: 'Ubanillx',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: 'Ubanillx',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url,
    },
    keywords: params.tags?.join(', ') || '',
  });
}

/**
 * Clear structured data (when navigating away from a page that had it).
 */
export function clearSchema() {
  if (jsonLdScript) {
    jsonLdScript.textContent = '';
  }
}

/**
 * Update page-level SEO meta tags (title, description, og tags) for a blog post.
 */
export function setPostMeta(post: {
  title: string;
  excerpt?: string;
  date?: string;
  tags?: string[];
  id: string;
}) {
  const fullTitle = `${post.title} | ${SITE_NAME}`;
  const description = post.excerpt || `${post.title} - ${SITE_NAME} 文章`;
  const postUrl = `${SITE_URL}/?post=${post.id}`;

  setPageTitle(fullTitle);
  setMetaByName('description', description);
  setMetaByName('keywords', (post.tags || []).concat(['博客', '技术文章']).join(', '));
  setMetaByProperty('og:title', fullTitle);
  setMetaByProperty('og:description', description);
  setMetaByProperty('og:type', 'article');
  setMetaByProperty('og:url', postUrl);
  setMetaByName('twitter:title', fullTitle);
  setMetaByName('twitter:description', description);

  setCanonical(`/?post=${post.id}`);
  setBlogPostingSchema({
    title: post.title,
    description,
    date: post.date || new Date().toISOString().split('T')[0],
    url: postUrl,
    tags: post.tags,
  });
}

/**
 * Reset page-level SEO meta tags back to site defaults (for homepage).
 */
export function setHomeMeta() {
  const title = `${SITE_NAME} | 开发日志`;
  const description = 'Ubanillx 的个人开发日志，记录编程学习、技术探索与项目开发的点滴。分享 Web 开发、Flutter、AI 等领域的心得与实践。';

  setPageTitle(title);
  setMetaByName('description', description);
  setMetaByName('keywords', 'Ubanillx, DevLog, 开发日志, 技术博客, Web开发, Flutter, React, 编程, 人工智能, 个人博客');
  setMetaByProperty('og:title', title);
  setMetaByProperty('og:description', description);
  setMetaByProperty('og:type', 'website');
  setMetaByProperty('og:url', SITE_URL);
  setMetaByName('twitter:title', title);
  setMetaByName('twitter:description', description);

  setCanonical('/');
  setWebSiteSchema();
}

/**
 * Reset page-level SEO meta tags for the about page.
 */
export function setAboutMeta() {
  const title = `关于 | ${SITE_NAME}`;
  const description = '关于 Ubanillx — 后端开发者 & AI 爱好者的个人简介与技能栈。';

  setPageTitle(title);
  setMetaByName('description', description);
  setMetaByProperty('og:title', title);
  setMetaByProperty('og:description', description);
  setMetaByProperty('og:type', 'website');
  setMetaByProperty('og:url', `${SITE_URL}/?view=about`);
  setMetaByName('twitter:title', title);
  setMetaByName('twitter:description', description);

  setCanonical('/?view=about');
  clearSchema();
}
