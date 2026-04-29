import { BlogPost } from './types';
import { siteConfig } from './config';

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.social.website || 'https://blog.ubanillx.com';

export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');
export const SITE_NAME = siteConfig.site.title;

export function absoluteUrl(path: string = '/') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

export function postPath(id: string) {
  return `/posts/${id}`;
}

export function postUrl(id: string) {
  return absoluteUrl(postPath(id));
}

export function postDescription(post: BlogPost) {
  return post.excerpt || `${post.title} - ${SITE_NAME} 文章`;
}

export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: siteConfig.site.description,
    author: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: SITE_URL,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author.name,
    url: SITE_URL,
    description: siteConfig.author.bio,
    email: siteConfig.author.email,
    sameAs: [
      siteConfig.social.github,
      siteConfig.social.twitter,
      siteConfig.social.linkedin,
    ].filter(Boolean),
  };
}

export function blogPostingSchema(post: BlogPost) {
  const url = postUrl(post.id);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: postDescription(post),
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    keywords: post.tags.join(', '),
  };
}
