import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'udyddevceuulwkqpxkxp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true, // suppress Sentry build logs
  sourcemaps: {
    disable: true, // don't upload sourcemaps — enable when DSN is configured
  },
});
