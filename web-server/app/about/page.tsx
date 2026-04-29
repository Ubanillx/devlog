import { Metadata } from 'next';
import { AboutView } from '@/components/AboutView';
import { siteConfig } from '@/lib/config';
import { absoluteUrl, jsonLd, personSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: '关于',
  description: `关于 ${siteConfig.author.name} - 后端开发者 & AI 爱好者的个人简介与技能栈。`,
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: `关于 | ${siteConfig.site.title}`,
    description: `关于 ${siteConfig.author.name} - 后端开发者 & AI 爱好者的个人简介与技能栈。`,
    type: 'profile',
    url: absoluteUrl('/about'),
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        id="person-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(personSchema()) }}
      />
      <AboutView />
    </>
  );
}
