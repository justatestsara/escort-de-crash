import { notFound, redirect } from 'next/navigation'
import { genderToSlug, slugToGender } from '../../../../lib/seo-slugs'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function Page({ params }: { params: { gender: string; country: string; city?: string[] } }) {
  const g = slugToGender(params.gender)
  if (!g) notFound()
  const rest = params.city?.length ? `/${params.city.join('/')}` : ''
  redirect(`/escorts/${genderToSlug(g)}/${params.country}${rest}`)
}
