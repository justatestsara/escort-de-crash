import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import HomeClient, { type Gender as HomeGender, type Model } from '../../../../components/HomeClient'
import { getApprovedAdsForListing } from '../../../../../lib/supabase-ads'
import { slugToGender, unslugifyTitle } from '../../../../../lib/seo-slugs'

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

  const country = unslugifyTitle(params.country)
  const city = params.city?.length ? unslugifyTitle(params.city.join('-')) : ''

  const h1 = city ? `${genderLabelEn(gender)} Escorts in ${city}, ${country}` : `${genderLabelEn(gender)} Escorts in ${country}`
  const placeShort = city || country
  const placeLong = city ? `${city}, ${country}` : country

  const canonical = params.city?.length
    ? `/escorts/${params.gender}/${params.country}/${params.city.join('/')}`
    : `/escorts/${params.gender}/${params.country}`

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

  const country = unslugifyTitle(params.country)
  const city = params.city?.length ? unslugifyTitle(params.city.join('-')) : ''

  const h1 = city ? `${genderLabelEn(gender)} Escorts in ${city}, ${country}` : `${genderLabelEn(gender)} Escorts in ${country}`

  const ads = await getApprovedAdsForListing({
    gender,
    country,
    city: city || undefined,
    limit: 5000,
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

  return <HomeClient initialModels={models} initialFilters={{ gender, country, city }} h1={h1} />
}
