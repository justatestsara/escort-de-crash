import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import HomeClient, { type Gender as HomeGender, type Model } from '../../../../components/HomeClient'
import { getApprovedAdsForListing, getApprovedCityFacets } from '../../../../../lib/supabase-ads'
import { genderToSlug, slugToGender, slugify, unslugifyTitle } from '../../../../../lib/seo-slugs'

export const revalidate = 60

function isHomeGender(g: unknown): g is HomeGender {
  return g === 'female' || g === 'male' || g === 'trans'
}

function genderLabelEn(g: HomeGender): string {
  switch (g) {
    case 'female':
      return 'Female'
    case 'male':
      return 'Male'
    case 'trans':
      return 'Trans'
  }
}

export async function generateMetadata({
  params,
}: {
  params: { gender: string; country: string; city?: string[] }
}): Promise<Metadata> {
  const rawGender = slugToGender(params.gender)
  if (!isHomeGender(rawGender)) return { title: 'Escorts', robots: { index: false, follow: false } }
  const gender: HomeGender = rawGender
  const canonicalGenderSlug = genderToSlug(gender)

  const country = unslugifyTitle(params.country)
  const city = params.city?.length ? unslugifyTitle(params.city.join('-')) : ''

  const h1 = city ? `${genderLabelEn(gender)} Escorts in ${city}, ${country}` : `${genderLabelEn(gender)} Escorts in ${country}`
  const placeShort = city || country
  const placeLong = city ? `${city}, ${country}` : country

  const canonical = params.city?.length
    ? `/escorts/${canonicalGenderSlug}/${params.country}/${params.city.join('/')}`
    : `/escorts/${canonicalGenderSlug}/${params.country}`

  const title = `${placeShort} Escorts, ${genderLabelEn(gender)} Independent Escorts in ${placeLong}`
  const description = `Browse ${genderLabelEn(gender)} independent escorts in ${placeLong}. Verified profiles with photos, rates, and contact information.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

export default async function Page({ params }: { params: { gender: string; country: string; city?: string[] } }) {
  const rawGender = slugToGender(params.gender)
  if (!isHomeGender(rawGender)) notFound()
  const gender: HomeGender = rawGender
  const canonicalGenderSlug = genderToSlug(gender)

  const country = unslugifyTitle(params.country)
  const requestedCitySlug = (params.city?.length ? params.city.join('-') : '').trim().toLowerCase()
  const city = requestedCitySlug ? unslugifyTitle(params.city!.join('-')) : ''

  if (params.gender !== canonicalGenderSlug) {
    permanentRedirect(
      params.city?.length
        ? `/escorts/${canonicalGenderSlug}/${params.country}/${params.city.join('/')}`
        : `/escorts/${canonicalGenderSlug}/${params.country}`
    )
  }

  // When a city is selected, fetch lightweight city facets so desktop navigation
  // can still show all cities in the country (not just the selected one).
  let facetCities: string[] | undefined
  let facetCityCounts: Record<string, number> | undefined
  if (requestedCitySlug) {
    const rows = await getApprovedCityFacets({ gender, country, limit: 5000 })
    // TS in some environments (older/odd config) can mis-type index signatures as `never`.
    // Use `any` for the counter to keep builds stable; this is runtime-safe.
    const counts: any = {}
    const facetList: any = []
    for (const r of rows) {
      const key: string = ('' + ((r as any).city ?? '')).trim()
      if (!key) continue
      if ((counts as any)[key] == null) {
        ;(facetList as any).push(key)
      }
      ;(counts as any)[key] = (((counts as any)[key] as number) ?? 0) + 1
    }
    facetCityCounts = counts as any
    // HomeClient sorts facetCities itself; avoid calling Array.prototype.sort here
    // to keep TypeScript builds resilient in odd environments.
    facetCities = facetList as any
  }

  const ads = await getApprovedAdsForListing({
    gender,
    country,
    // Don't filter by city here: city slugs are accent-insensitive (e.g. Münster -> munster),
    // but DB matching isn't. We'll filter by slug below.
    limit: requestedCitySlug ? 5000 : 500,
  })
  const models: Model[] = (ads || []).map((ad: any) => {
    const fallbackImage = 'https://i.ibb.co/GQPtQvJB/image.jpg'
    const images = ad.images && ad.images.length > 0 ? ad.images : [fallbackImage]

    return {
      id: String(ad.public_id ?? ad.id),
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
  const resolvedCity = requestedCitySlug ? (filteredModels[0]?.city || unslugifyTitle(requestedCitySlug)) : city

  const h1 = resolvedCity
    ? `${genderLabelEn(gender)} Escorts in ${resolvedCity}, ${country}`
    : `${genderLabelEn(gender)} Escorts in ${country}`

  return (
    <HomeClient
      initialModels={filteredModels}
      initialFilters={{ gender, country, city: resolvedCity }}
      facetCities={facetCities}
      facetCityCounts={facetCityCounts}
      h1={h1}
    />
  )
}
