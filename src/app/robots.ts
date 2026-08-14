import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/hall',
          '/daily',
          '/leaderboard',
          '/immortalize',
          '/wall',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/room/',
          '/d/',
          '/api/',
          '/search',
        ],
      },
    ],
  };
}
