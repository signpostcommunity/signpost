// SETUP: Add NEXT_PUBLIC_SENTRY_DSN to Vercel env vars
// Get your DSN from https://sentry.io → Projects → signpost → Settings → Client Keys

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions — keep low for free tier
  replaysSessionSampleRate: 0, // disable replay for now
  replaysOnErrorSampleRate: 0, // disable replay for now
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production', // only report in production
});
