import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import HomeClient, { type Gender as HomeGender, type Model } from '../../components/HomeClient'
import { getApprovedAdsForListing } from '../../../lib/supabase-ads'
import { genderToSlug, slugToGender } from '../../../lib/seo-slugs'

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

export async function generateMetadata({ params }: { params: { gender: string } }): Promise<Metadata> {
  const rawGender = slugToGender(params.gender)
  if (!isHomeGender(rawGender)) return { title: 'Escorts', robots: { index: false, follow: false } }
  const gender: HomeGender = rawGender
  const canonicalGenderSlug = genderToSlug(gender)

  const label = genderLabelEn(gender)
  const title = `${label} Escorts, ${label} Independent Escorts`
  const description = `Browse ${label} independent escort profiles with photos, rates, and contact information.`
  const canonical = `/escorts/${canonicalGenderSlug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

export default async function Page({ params }: { params: { gender: string } }) {
  const rawGender = slugToGender(params.gender)
  if (!isHomeGender(rawGender)) notFound()
  const gender: HomeGender = rawGender
  const canonicalGenderSlug = genderToSlug(gender)
  if (params.gender !== canonicalGenderSlug) permanentRedirect(`/escorts/${canonicalGenderSlug}`)

  const ads = await getApprovedAdsForListing({ gender, limit: 500 })
  const models: Model[] = (ads || []).map((ad: any) => {
    const fallbackImage = 'https://i.ibb.co/GQPtQvJB/image.jpg'
    const images = ad.images && ad.images.length > 0 ? ad.images : [fallbackImage]

    return {
      id: String(ad.public_id ?? ad.id),
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

  return <HomeClient initialModels={models} initialFilters={{ gender, country: '', city: '' }} h1={`${genderLabelEn(gender)} Escorts`} />
}
