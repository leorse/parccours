import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // Never cache API routes: they're authenticated/dynamic (session, D1 data)
      // and must always hit the network, not a stale service worker cache.
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
      handler: 'NetworkOnly',
    },
  ],
});

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // ta config existante
};

export default withPWA(nextConfig);