// src/app/layout.jsx
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Edgelink SEO Automation Dashboard',
  description:
    'Full-stack automated SEO audit pipeline with Next.js 14, BullMQ, Upstash Redis, Prisma Postgres, Claude Sonnet 4.6, and Puppeteer PDF reports.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
