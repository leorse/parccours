import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // ta config existante
};

export default withPWA(nextConfig);