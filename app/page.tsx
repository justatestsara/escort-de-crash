import type { Metadata } from 'next'
import HomeClient, { type Gender, type Model } from './components/HomeClient'
import { getApprovedAds } from '../lib/supabase-ads'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type SearchParams = Record<string, string | string[] | undefined>

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] || ''
  return v || ''
}

function normalizeGender(v: string): Gender | '' {
  if (v === 'female' || v === 'male' || v === 'trans' || v === 'luxury_escort' || v === 'webcam') return v
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
    case 'luxury_escort':
      return 'Luxury/High End'
    case 'webcam':
      return 'Webcam'
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

  const placeShort = city || country
  const placeLong = city && country ? `${city}, ${country}` : (city || country)
  const canonical = buildCanonical(searchParams)

  const label = genderLabelEn(gender)
  const title = placeShort ? `${placeShort} Escorts, ${label} Independent Escorts in ${placeLong}` : `${label} Escorts, ${label} Independent Escorts`
  const description = placeShort
    ? `Browse ${label} independent escorts in ${placeLong}. Verified profiles with photos, rates, and contact information.`
    : `Browse ${label} independent escort profiles with photos, rates, and contact information.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const ads = await getApprovedAds()

  const models: Model[] = (ads || []).map((ad: any) => {
    const fallbackImage = 'https://i.ibb.co/GQPtQvJB/image.jpg'
    const images = ad.images && ad.images.length > 0 ? ad.images : [fallbackImage]

    return {
      id: ad.id,
      name: ad.name,
      age: typeof ad.age === 'string' ? parseInt(ad.age, 10) : ad.age,
      gender: ad.gender,
      city: ad.city,
      country: ad.country,
      image: images[0],
      images,
      description: ad.description,
    }
  })

  const initialGender = getDefaultGender(searchParams)
  const initialCountry = first(searchParams.country)
  const initialCity = first(searchParams.city)


  const h1 = initialCity && initialCountry ? `${genderLabelEn(initialGender)} Escorts in ${initialCity}, ${initialCountry}` : initialCountry ? `${genderLabelEn(initialGender)} Escorts in ${initialCountry}` : `${genderLabelEn(initialGender)} Escorts`

  return <HomeClient initialModels={models} initialFilters={{ gender: initialGender, country: initialCountry, city: initialCity }} h1={h1} />
}