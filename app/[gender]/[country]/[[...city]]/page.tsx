import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { genderToSlug, slugToGender } from '../../../../lib/seo-slugs'

export const revalidate = 60

function genderLabelEn(g: NonNullable<ReturnType<typeof slugToGender>>): string {
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

export async function generateMetadata({
  params,
}: {
  params: { gender: string; country: string; city?: string[] }
}): Promise<Metadata> {
  const rawGender = slugToGender(params.gender)
  // Guard against legacy/unsupported genders (e.g. "webcam") that may exist in older branches.
  if (rawGender !== 'female' && rawGender !== 'male' && rawGender !== 'trans') {
    return { title: 'Featured Models', robots: { index: false, follow: false } }
  }
  const canonicalGenderSlug = genderToSlug(rawGender)

  const location = params.city?.length ? params.city.join('-').replace(/-/g, ' ') : params.country.replace(/-/g, ' ')
  const canonical = params.city?.length
    ? `/escorts/${canonicalGenderSlug}/${params.country}/${params.city!.join('/')}`
    : `/escorts/${canonicalGenderSlug}/${params.country}`

  const label = genderLabelEn(rawGender)
  const title = `${label} Escorts ${location}`
  const description = `Browse ${label} escorts in ${location}. Verified profiles with photos, rates, and contact information.`

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

export default async function Page({
  params,
}: {
  params: { gender: string; country: string; city?: string[] }
}) {
  const rawGender = slugToGender(params.gender)
  // Guard against legacy/unsupported genders (e.g. "webcam") that may exist in older branches.
  if (rawGender !== 'female' && rawGender !== 'male' && rawGender !== 'trans') notFound()
  const canonicalGenderSlug = genderToSlug(rawGender)

  // Legacy root route: redirect to canonical /escorts/...
  permanentRedirect(
    params.city?.length
      ? `/escorts/${canonicalGenderSlug}/${params.country}/${params.city.join('/')}`
      : `/escorts/${canonicalGenderSlug}/${params.country}`
  )
  return null
}