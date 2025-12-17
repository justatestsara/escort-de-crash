import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AdDetailClient, { type AdModel, type Gender } from '../../components/AdDetailClient'
import { getAdById } from '../../../lib/supabase-ads'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type SearchParams = { gender?: string; country?: string; city?: string; back?: string }

function genderLabelEn(g: Gender): string {
  switch (g) {
    case 'female':
      return 'Girls'
    case 'male':
      return 'Guys'
    case 'trans':
      return 'Trans'
    case 'luxury_escort':
      return 'Luxury/High End'
    case 'webcam':
      return 'Webcam'
  }
}

function truncate(s: string, max = 160): string {
  const cleaned = s.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const ad = await getAdById(params.id)
  if (!ad) {
    return { title: 'Ad not found', robots: { index: false, follow: false } }
  }

  const age = typeof ad.age === 'string' ? parseInt(ad.age, 10) : ad.age
  const g = genderLabelEn(ad.gender)
  const title = `${ad.name} (${age}) - ${g} Escort in ${ad.city}, ${ad.country}`
  const description = truncate(ad.description || `View ${g} escort in ${ad.city}, ${ad.country}.`)
  const canonical = `/ad/${ad.id}`
  const ogImage = ad.images?.[0] || '/og-image.jpg'

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      images: [{ url: ogImage }],
    },
  }
}

export default async function Page({ params, searchParams }: { params: { id: string }; searchParams?: SearchParams }) {
  const ad = await getAdById(params.id)
  if (!ad) notFound()

  const fallbackImage = 'https://i.ibb.co/GQPtQvJB/image.jpg'
  const images = ad.images && ad.images.length > 0 ? ad.images : [fallbackImage]

  const model: AdModel = {
    id: ad.id,
    name: ad.name,
    age: typeof ad.age === 'string' ? parseInt(ad.age, 10) : ad.age,
    gender: ad.gender,
    city: ad.city,
    country: ad.country,
    image: images[0],
    images,
    description: ad.description,
    phone: ad.phone,
    email: ad.email,
    whatsapp: ad.whatsapp,
    telegram: ad.telegram,
    instagram: ad.instagram,
    twitter: ad.twitter,
    hairColor: ad.hairColor,
    languages: ad.languages,
    services: ad.services,
    rates: ad.rates,
  }

  const backFromQuery = (searchParams?.back || '').trim()
  const backUrl =
    backFromQuery && backFromQuery.startsWith('/')
      ? backFromQuery
      : (() => {
          const qp = new URLSearchParams()
          if (searchParams?.gender) qp.set('gender', searchParams.gender)
          if (searchParams?.country) qp.set('country', searchParams.country)
          if (searchParams?.city) qp.set('city', searchParams.city)
          const qs = qp.toString()
          return qs ? `/?${qs}` : '/'
        })()

  return <AdDetailClient model={model} backUrl={backUrl} />
}
