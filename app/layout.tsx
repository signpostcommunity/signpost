import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import BetaWelcomeModal from '@/components/beta/BetaWelcomeModal';

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
  title: 'signpost — find your interpreter, anywhere',
  description:
    'A direct marketplace to find, browse, and connect with certified sign language interpreters worldwide.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        {process.env.NEXT_PUBLIC_BETA_MODE === 'true' && <BetaWelcomeModal />}
        {children}
      </body>
    </html>
  );
}
