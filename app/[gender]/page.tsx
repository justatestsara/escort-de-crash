import { notFound, redirect } from 'next/navigation'
import { genderToSlug, slugToGender } from '../../lib/seo-slugs'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function Page({ params }: { params: { gender: string } }) {
  const g = slugToGender(params.gender)
  if (!g) notFound()
  redirect(`/escorts/${genderToSlug(g)}`)
}
