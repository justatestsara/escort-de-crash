import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import AdDetailClient, { type AdModel, type Gender } from '../../../../../components/AdDetailClient'
import { getAdById } from '../../../../../../lib/supabase-ads'
import { buildLandingPath, genderToSlug, slugify } from '../../../../../../lib/seo-slugs'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { gender: string; country: string; city: string; id: string }
type SearchParams = { back?: string }

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

function truncate(s: string, max = 160): string {
  const cleaned = s.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

function canonicalForAd(ad: { id: string; gender: Gender; country: string; city: string }): string {
  return `/escorts/${genderToSlug(ad.gender)}/${slugify(ad.country)}/${slugify(ad.city)}/${ad.id}`
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const ad = await getAdById(params.id)
  if (!ad) return { title: 'Ad not found', robots: { index: false, follow: false } }

  const canonical = canonicalForAd(ad)
  const age = typeof ad.age === 'string' ? parseInt(ad.age, 10) : ad.age
  const g = genderLabelEn(ad.gender)
  const title = `${ad.city} Escorts, ${g} Independent Escort in ${ad.city}, ${ad.country}`
  const description = truncate(ad.description || `Browse ${g} independent escorts in ${ad.city}, ${ad.country}.`)
  const ogImage = ad.images?.[0] || '/og-image.jpg'

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'article', title, description, url: canonical, images: [{ url: ogImage }] },
  }
}

export default async function Page({ params, searchParams }: { params: Params; searchParams?: SearchParams }) {
  const ad = await getAdById(params.id)
  if (!ad) notFound()

  const canonical = canonicalForAd(ad)
  const requested = `/escorts/${params.gender}/${params.country}/${params.city}/${params.id}`
  if (requested !== canonical) {
    permanentRedirect(canonical)
  }

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
      : buildLandingPath({ gender: ad.gender, country: ad.country, city: ad.city })

  return <AdDetailClient model={model} backUrl={backUrl} />
}
