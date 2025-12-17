import { MetadataRoute } from 'next'
import { getAllAds } from '../lib/supabase-ads'
import { genderToSlug, slugify } from '../lib/seo-slugs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://escort.de'

  try {
    const ads = await getAllAds()
    const approvedAds = ads.filter((ad) => ad.status === 'approved')

    const adUrls = approvedAds.map((ad) => ({
      url: `${baseUrl}/ad/${ad.id}`,
      lastModified: new Date(ad.submittedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // SEO landing pages derived from approved ads (keeps sitemap bounded)
    const genderSet = new Set<string>()
    const genderCountrySet = new Set<string>()
    const genderCountryCitySet = new Set<string>()

    for (const ad of approvedAds) {
      const gSlug = genderToSlug(ad.gender as any)
      genderSet.add(`${baseUrl}/${gSlug}`)

      const cSlug = slugify(ad.country)
      genderCountrySet.add(`${baseUrl}/${gSlug}/${cSlug}`)

      const citySlug = slugify(ad.city)
      genderCountryCitySet.add(`${baseUrl}/${gSlug}/${cSlug}/${citySlug}`)
    }

    const now = new Date()
    const landingUrls: MetadataRoute.Sitemap = [
      ...Array.from(genderSet).map((url) => ({ url, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 })),
      ...Array.from(genderCountrySet).map((url) => ({ url, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 })),
      ...Array.from(genderCountryCitySet).map((url) => ({ url, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 })),
    ]

    const staticUrls: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/legal/imprint`,
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/post-ad`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
    ]

    return [...staticUrls, ...landingUrls, ...adUrls]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/legal/imprint`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
    ]
  }
}

