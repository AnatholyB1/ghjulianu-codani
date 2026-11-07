import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },

  // Delivery pages and routes carry a personal token: never referred, indexed or cached.
  async headers() {
    const privateHeaders = [
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Cache-Control', value: 'private, no-store' },
    ];
    // Global baseline FIRST: later per-route rules (Referrer-Policy: no-referrer) override the same key.
    const globalHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];
    return [
      { source: '/:path*', headers: globalHeaders },
      { source: '/telechargement/:path*', headers: privateHeaders },
      { source: '/api/download/:path*', headers: privateHeaders },
    ];
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
