import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import HomeClient, { type Gender as HomeGender, type Model } from '../components/HomeClient'
import { getApprovedAdsForListing } from '../../lib/supabase-ads'
import { genderToSlug, slugToGender } from '../../lib/seo-slugs'

export const revalidate = 60

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
  if (rawGender !== 'female' && rawGender !== 'male' && rawGender !== 'trans') {
    return { title: 'Featured Models', robots: { index: false, follow: false } }
  }
  const gender: HomeGender = rawGender

  const title = 'Featured Models'
  const description = `Browse featured ${genderLabelEn(gender)} escort profiles with photos, rates, and contact information.`
  const canonical = `/escorts/${genderToSlug(gender)}`

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  }
}

export default async function Page({ params }: { params: { gender: string } }) {
  const rawGender = slugToGender(params.gender)
  const gender: HomeGender = rawGender === 'female' || rawGender === 'male' || rawGender === 'trans' ? rawGender : 'female'
  permanentRedirect(`/escorts/${genderToSlug(gender)}`)

  const ads = await getApprovedAdsForListing({
    gender,
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

  return <HomeClient initialModels={models} initialFilters={{ gender, country: '', city: '' }} />
}