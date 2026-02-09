import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import AdDetailClient, { type AdModel, type Gender } from '../../components/AdDetailClient'
import { getAdById } from '../../../lib/supabase-ads'
import { genderToSlug, slugify } from '../../../lib/seo-slugs'

export const revalidate = 300

type SearchParams = { gender?: string; country?: string; city?: string; back?: string }

function requireValue<T>(v: T | null | undefined): T {
  if (v == null) {
    notFound()
    // Some TS environments don't type `notFound()` as `never`; keep the compiler happy.
    throw new Error('Not found')
  }
  return v
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
  const urlId = String((ad as any).public_id ?? ad.id)
  const canonical = `/escorts/${genderToSlug(ad.gender as any)}/${slugify(ad.country)}/${slugify(ad.city)}/${urlId}`
  const ogImage = ad.images?.[0] || '/og-image.jpg'

  return {
    title,
    description,
    alternates: { canonical },
    // Legacy route: allow discovery via redirects but don't index duplicates.
    robots: { index: false, follow: true },
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
  const ad = requireValue(await getAdById(params.id))

  const urlId = String((ad as any).public_id ?? ad.id)
  const canonical = `/escorts/${genderToSlug(ad.gender as any)}/${slugify(ad.country)}/${slugify(ad.city)}/${urlId}`
  permanentRedirect(canonical)
  return null
}
