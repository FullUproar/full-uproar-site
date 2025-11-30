import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fulluproar.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth-debug',
          '/debug-games',
          '/diagnostics',
          '/fix-users',
          '/grant-admin',
          '/migrate',
          '/sync-me',
          '/test',
          '/test-merch',
          '/test-pixel',
          '/test-printify',
          '/test-stripe',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
