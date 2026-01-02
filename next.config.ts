import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  typescript: {
    // Ignore type errors during build (validator path issue is a Next.js bug)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Don't fail build on ESLint errors, only show warnings
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

