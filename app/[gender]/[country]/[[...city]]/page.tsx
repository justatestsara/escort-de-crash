import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import HomeClient, { type Model } from '../../../components/HomeClient'
import { getApprovedAdsForListing, getApprovedCityFacets } from '../../../../lib/supabase-ads'
import { slugToGender, slugify, unslugifyTitle } from '../../../../lib/seo-slugs'

export const revalidate = 60

function genderLabelEn(g: NonNullable<ReturnType<typeof slugToGender>>): string {
  switch (g) {
    case 'female':
      return 'Girls'
    case 'male':
      return 'Guys'
    case 'trans':
      return 'Trans'
    default:
      return 'Girls'
  }
}

export async function generateMetadata({
  params,
}: {
  params: { gender: string; country: string; city?: string[] }
}): Promise<Metadata> {
  const gender = slugToGender(params.gender)
  if (!gender) return { title: 'Featured Models', robots: { index: false, follow: false } }

  const country = unslugifyTitle(params.country)
  const city = params.city?.length ? unslugifyTitle(params.city.join('-')) : ''
  const location = city || country
  const canonical = city ? `/${params.gender}/${params.country}/${params.city!.join('/')}` : `/${params.gender}/${params.country}`

  const title = `${genderLabelEn(gender)} Escorts ${location}`
  const description = `Browse ${genderLabelEn(gender)} escorts in ${location}. Verified profiles with photos, rates, and contact information.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  }
}

export default async function Page({
  params,
}: {
  params: { gender: string; country: string; city?: string[] }
}) {
  const gender = slugToGender(params.gender)
  if (!gender) notFound()

  const country = unslugifyTitle(params.country)
  const requestedCitySlug = (params.city?.length ? params.city.join('-') : '').trim().toLowerCase()

  // When a specific city is selected, fetch lightweight city facets so the UI
  // can still show the other cities in the same country (desktop navigation).
  let facetCities: string[] | undefined
  let facetCityCounts: Record<string, number> | undefined
  if (requestedCitySlug) {
    const rows = await getApprovedCityFacets({ gender, country, limit: 5000 })
    const counts: Record<string, number> = {}
    for (const r of rows) counts[r.city] = (counts[r.city] || 0) + 1
    facetCityCounts = counts
    facetCities = Object.keys(counts).sort()
  }

  // Important: city slugs are accent-insensitive (e.g. Münster -> munster), but DB matching isn't.
  // So we fetch by gender+country and filter by slug on the server.
  const ads = await getApprovedAdsForListing({
    gender,
    country,
    limit: requestedCitySlug ? 5000 : 500,
  })
  const models: Model[] = (ads || []).map((ad: any) => {
    const fallbackImage = 'https://i.ibb.co/GQPtQvJB/image.jpg'
    const images = ad.images && ad.images.length > 0 ? ad.images : [fallbackImage]

    return {
      id: ad.id,
      name: ad.name,
      age: typeof ad.age === 'string' ? parseInt(ad.age, 10) : ad.age,
      gender: ad.gender,
      city: (ad.city || '').trim(),
      country: (ad.country || '').trim(),
      image: images[0],
      images,
      description: ad.description,
    }
  })

  const filteredModels = requestedCitySlug ? models.filter((m) => slugify(m.city) === requestedCitySlug) : models
  const resolvedCity = requestedCitySlug ? (filteredModels[0]?.city || unslugifyTitle(requestedCitySlug)) : ''

  return (
    <HomeClient
      initialModels={filteredModels}
      initialFilters={{ gender, country, city: resolvedCity }}
      facetCities={facetCities}
      facetCityCounts={facetCityCounts}
    />
  )
}