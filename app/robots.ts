import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block sensitive/internal paths
        disallow: ['/adm2211/', '/api/'],
      },
    ],
    sitemap: 'https://escort.de/sitemap.xml',
  }
}



