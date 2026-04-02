import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-dm',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://signpost.community'),
  title: 'signpost — the interpreter marketplace',
  description: 'Transparency at every step. Interpreter profiles, intro videos, real-time request tracking, direct booking. No agency markup.',
  openGraph: {
    title: 'signpost — the interpreter marketplace',
    description: 'Transparency at every step. Interpreter profiles, intro videos, real-time request tracking, direct booking. No agency markup.',
    url: 'https://signpost.community',
    siteName: 'signpost',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'signpost — the interpreter marketplace',
    description: 'Transparency at every step. Interpreter profiles, intro videos, real-time request tracking, direct booking. No agency markup.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body>
        <a
          href="#main-content"
          className="skip-to-main"
        >
          Skip to main content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
