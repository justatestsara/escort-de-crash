import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // TEMPORARY: block all crawling while SEO work is in progress
        disallow: ['/'],
      },
    ],
    sitemap: 'https://escort.de/sitemap.xml',
  }
}



