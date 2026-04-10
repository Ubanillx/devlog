import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ThemeInitializer } from '@/components/ThemeInitializer';
import { BackgroundCanvas } from '@/components/BackgroundCanvas';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.site.title} | 开发日志`,
    template: `%s | ${siteConfig.site.title}`,
  },
  description: siteConfig.site.description,
  keywords: siteConfig.site.keywords,
  authors: [{ name: siteConfig.author.name }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: `${siteConfig.site.title} | 开发日志`,
    description: siteConfig.site.description,
    siteName: siteConfig.site.title,
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary',
    title: `${siteConfig.site.title} | 开发日志`,
    description: siteConfig.site.description,
  },
  icons: {
    icon: '/logo.ico',
  },
  other: {
    rss: '/rss.xml',
    sitemap: '/sitemap.xml',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
        <link rel="alternate" type="application/rss+xml" title={`${siteConfig.site.title} RSS`} href="/rss.xml" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body className="min-h-screen flex flex-col text-text selection:bg-primary/30 selection:text-textLight transition-colors duration-300 relative z-10">
        <ThemeInitializer />
        <BackgroundCanvas />
        <Navbar />
        <main className="flex-grow px-6 py-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
