import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Vercel's native Supabase integration re-resolves NEXT_PUBLIC_SUPABASE_* from
  // whichever Supabase project it's connected to at every build, overriding any
  // value set through the dashboard/API env var editor. Until the integration is
  // repointed at the "portfolio" project (Vercel dashboard > Storage), pin these
  // three public (client-exposed) values here so the build uses the right project.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://ubxllsvanurkwkohzxau.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieGxsc3ZhbnVya3drb2h6eGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjA4ODcsImV4cCI6MjA5MjY5Njg4N30.xNtSTcUw6EYyK2-RQcxK6U8VNDGOHPapSnZZM9zjkss",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_IUGwWXBKERpi_qNMIOPwLw_arDgVXsz",
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },

  images: {
    // Serve AVIF first (20-30 % smaller than WebP at same perceived quality),
    // fall back to WebP for older browsers.
    formats: ['image/avif', 'image/webp'],

    // Allow Next.js to optimise images hosted on Supabase Storage.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ubxllsvanurkwkohzxau.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Fallback placeholder used when an album has no cover/background yet.
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],

    // Wider set of breakpoints so srcset covers every viewport size.
    deviceSizes:   [640, 828, 1080, 1200, 1920, 2560],
    imageSizes:    [16, 32, 64, 96, 128, 256, 384, 512],

    // Cache optimised images for 30 days on the CDN edge.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
