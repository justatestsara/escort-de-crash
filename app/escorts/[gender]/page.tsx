import type { Metadata } from 'next'
import HomeClient, { type Model } from '../../components/HomeClient'
import { getApprovedAds } from '../../../lib/supabase-ads'
import { slugToGender } from '../../../lib/seo-slugs'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function genderLabelEn(g: NonNullable<ReturnType<typeof slugToGender>>): string {
  switch (g) {
    case 'female':
      return 'Female'
    case 'male':
      return 'Male'
    case 'trans':
      return 'Trans'
    case 'luxury_escort':
      return 'Luxury'
    case 'webcam':
      return 'Webcam'
  }
}

export async function generateMetadata({ params }: { params: { gender: string } }): Promise<Metadata> {
  const gender = slugToGender(params.gender)
  if (!gender) return { title: 'Escorts', robots: { index: false, follow: false } }

  const label = genderLabelEn(gender)
  const title = `${label} Escorts, ${label} Independent Escorts`
  const description = `Browse ${label} independent escort profiles with photos, rates, and contact information.`
  const canonical = `/escorts/${params.gender}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

export default async function Page({ params }: { params: { gender: string } }) {
  const gender = slugToGender(params.gender)

  const ads = await getApprovedAds()
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

  return <HomeClient initialModels={models} initialFilters={{ gender: gender || 'female', country: '', city: '' }} h1={`${genderLabelEn(gender || 'female')} Escorts`} />
}
