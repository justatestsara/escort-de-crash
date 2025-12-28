import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getAdByIdentifier } from '../../../lib/supabase-ads'
import { genderToSlug, slugify } from '../../../lib/seo-slugs'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type SearchParams = { gender?: string; country?: string; city?: string; back?: string }

function genderLabelEn(g: any): string {
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
    // legacy slugs (just in case older rows exist)
    case 'girls':
      return 'Female'
    case 'guys':
      return 'Male'
    default:
      return 'Escort'
  }
}

function truncate(s: string, max = 160): string {
  const cleaned = s.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const ad = await getAdByIdentifier(params.id)
  if (!ad) {
    return { title: 'Ad not found', robots: { index: false, follow: false } }
  }

  const age = typeof ad.age === 'string' ? parseInt(ad.age, 10) : ad.age
  const g = genderLabelEn(ad.gender)
  const title = `${ad.name} (${age}) - ${g} Escort in ${ad.city}, ${ad.country}`
  const description = truncate(ad.description || `View ${g} escort in ${ad.city}, ${ad.country}.`)
  // Legacy route: canonical is the new SEO-friendly escorts path
  const canonical = `/escorts/${genderToSlug(ad.gender as any)}/${slugify(ad.country)}/${slugify(ad.city)}/${String((ad as any).public_id ?? ad.id)}`
  const ogImage = ad.images?.[0] || '/og-image.jpg'

  return {
    title,
    description,
    alternates: { canonical },
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
  const ad = await getAdByIdentifier(params.id)
  if (!ad) notFound()

  // Permanently redirect legacy /ad/:id URLs to canonical SEO-friendly URL
  const canonical = `/escorts/${genderToSlug(ad.gender as any)}/${slugify(ad.country)}/${slugify(ad.city)}/${String((ad as any).public_id ?? ad.id)}`
  permanentRedirect(canonical)
}
