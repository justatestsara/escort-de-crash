import type { Metadata } from 'next'
import HomeClient, { type Gender, type Model } from './components/HomeClient'
import { getApprovedAdsForListing } from '../lib/supabase-ads'

// Cache rendered HTML briefly to avoid hammering Supabase and to keep TTFB stable.
export const revalidate = 60

type SearchParams = Record<string, string | string[] | undefined>

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] || ''
  return v || ''
}

function normalizeGender(v: string): Gender | '' {
  if (v === 'female' || v === 'male' || v === 'trans') return v
  return ''
}

function genderLabelEn(g: Gender): string {
  switch (g) {
    case 'female':
      return 'Female'
    case 'male':
      return 'Male'
    case 'trans':
      return 'Trans'
    default:
      return 'Female'
  }
}

function getDefaultGender(searchParams: SearchParams): Gender {
  return normalizeGender(first(searchParams.gender)) || 'female'
}

function buildCanonical(searchParams: SearchParams): string {
  const gender = getDefaultGender(searchParams)
  const country = first(searchParams.country)
  const city = first(searchParams.city)

  const qp = new URLSearchParams()
  qp.set('gender', gender)
  if (country) qp.set('country', country)
  if (city) qp.set('city', city)

  return `/?${qp.toString()}`
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const gender = getDefaultGender(searchParams)
  const country = first(searchParams.country)
  const city = first(searchParams.city)

  const location = city || country
  const canonical = buildCanonical(searchParams)

  const title = location ? `${genderLabelEn(gender)} Escorts ${location}` : 'Featured Models'
  const description = location
    ? `Browse ${genderLabelEn(gender)} escorts in ${location}. Verified profiles with photos, rates, and contact information.`
    : 'Browse featured escort profiles with photos, rates, and contact information.'

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const gender = getDefaultGender(searchParams)
  const country = first(searchParams.country)
  const city = first(searchParams.city)

  const ads = await getApprovedAdsForListing({
    gender,
    country: country || undefined,
    city: city || undefined,
    limit: 500,
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

  const initialGender = gender
  const initialCountry = country
  const initialCity = city

  return <HomeClient initialModels={models} initialFilters={{ gender: initialGender, country: initialCountry, city: initialCity }} />
}