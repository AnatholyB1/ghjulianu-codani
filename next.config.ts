import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    // Serve AVIF first (20-30 % smaller than WebP at same perceived quality),
    // fall back to WebP for older browsers.
    formats: ['image/avif', 'image/webp'],

    // Allow Next.js to optimise images hosted on Supabase Storage.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zxjmhvjokdynhssporyf.supabase.co',
        pathname: '/storage/v1/object/public/**',
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
