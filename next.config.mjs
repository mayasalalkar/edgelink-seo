/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'bullmq',
      'ioredis',
      'puppeteer',
      'cheerio',
      '@prisma/client',
    ],
  },
};

export default nextConfig;
