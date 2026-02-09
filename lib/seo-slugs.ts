export type Gender = 'female' | 'male' | 'trans'

// Canonical URL slugs (SEO): /escorts/{female|male|trans}
export type GenderSlug = 'female' | 'male' | 'trans'

export function genderToSlug(g: Gender): GenderSlug {
  switch (g) {
    case 'female':
      return 'female'
    case 'male':
      return 'male'
    case 'trans':
      return 'trans'
  }
}

export function slugToGender(slug: string): Gender | null {
  switch (slug) {
    // Canonical
    case 'female':
      return 'female'
    case 'male':
      return 'male'
    case 'trans':
      return 'trans'
    // Legacy (keep working via redirects)
    case 'girls':
      return 'female'
    case 'guys':
      return 'male'
    default:
      return null
  }
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/ß/g, 'ss')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function unslugifyTitle(input: string): string {
  const s = input
    .trim()
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
  return s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

export function buildLandingPath(opts: { gender?: Gender | ''; country?: string; city?: string }): string {
  const { gender, country, city } = opts
  if (!gender) return '/'
  const g = genderToSlug(gender)
  if (!country) return `/escorts/${g}`
  const c = slugify(country)
  if (!city) return `/escorts/${g}/${c}`
  return `/escorts/${g}/${c}/${slugify(city)}`
}
