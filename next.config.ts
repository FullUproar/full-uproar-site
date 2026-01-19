import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      // ============================================
      // Navigation restructure redirects (Jan 2025)
      // Old flat URLs -> New hierarchical structure
      // ============================================

      // Discover section redirects
      {
        source: '/fugly',
        destination: '/discover/fugly',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/discover/about',
        permanent: true,
      },
      {
        source: '/the-line',
        destination: '/discover/the-line',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/discover/faq',
        permanent: true,
      },
      {
        source: '/afterroar',
        destination: '/discover/afterroar',
        permanent: true,
      },

      // Connect section redirects
      {
        source: '/forum',
        destination: '/connect/forum',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/connect/contact',
        permanent: true,
      },

      // Game Nights redirects
      {
        source: '/play-online',
        destination: '/game-nights/play-online',
        permanent: true,
      },
      {
        source: '/play-online/:room',
        destination: '/game-nights/play-online/:room',
        permanent: true,
      },

      // Games content redirects (from /games to /discover/games)
      {
        source: '/games/fugly-mayhem-machine',
        destination: '/discover/games/fugly-mayhem-machine',
        permanent: true,
      },
      {
        source: '/games/fugly-mayhem-machine/:slug',
        destination: '/discover/games/fugly-mayhem-machine/:slug',
        permanent: true,
      },
      {
        source: '/games/fugly-mayhem-machine/:slug/how-to-play',
        destination: '/discover/games/fugly-mayhem-machine/:slug/how-to-play',
        permanent: true,
      },

      // Shop redirects
      {
        source: '/play/:slug',
        destination: '/shop/games/:slug',
        permanent: true,
      },
      // /games listing goes to /shop/games
      {
        source: '/games',
        destination: '/shop/games',
        permanent: true,
      },
      // /games/:slug (product pages, NOT series like fugly-mayhem-machine) go to /shop/games/:slug
      // Note: FMM-specific redirects above take precedence
      {
        source: '/games/:slug',
        destination: '/shop/games/:slug',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/FuglyLaying.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
