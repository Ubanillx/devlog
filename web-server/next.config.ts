import type { NextConfig } from 'next';

const internalApiBase = process.env.NEXT_INTERNAL_API_URL || 'http://backend:8080/api/v1';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${internalApiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
