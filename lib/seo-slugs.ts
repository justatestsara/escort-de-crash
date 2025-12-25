export type Gender = 'female' | 'male' | 'trans' | 'luxury_escort' | 'webcam'

// New canonical slugs
export type GenderSlug = 'female' | 'male' | 'trans' | 'luxury' | 'webcam'

export const ESCORTS_BASE = '/escorts'

export function genderToSlug(g: Gender): GenderSlug {
  switch (g) {
    case 'female':
      return 'female'
    case 'male':
      return 'male'
    case 'trans':
      return 'trans'
    case 'luxury_escort':
      return 'luxury'
    case 'webcam':
      return 'webcam'
  }
}

/**
 * Accept BOTH new and legacy slugs so we can redirect old URLs:
 * - /girls -> /escorts/female
 * - /guys  -> /escorts/male
 * - /luxury-high-end -> /escorts/luxury
 */
export function slugToGender(slug: string): Gender | null {
  switch (slug) {
    // new
    case 'female':
      return 'female'
    case 'male':
      return 'male'
    case 'trans':
      return 'trans'
    case 'luxury':
      return 'luxury_escort'
    case 'webcam':
      return 'webcam'

    // legacy
    case 'girls':
      return 'female'
    case 'guys':
      return 'male'
    case 'luxury-high-end':
      return 'luxury_escort'

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
  const s = input.trim().replace(/-/g, ' ').replace(/\s+/g, ' ')
  return s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

export function buildLandingPath(opts: { gender?: Gender | ''; country?: string; city?: string }): string {
  const { gender, country, city } = opts
  if (!gender) return '/'
  const g = genderToSlug(gender)
  if (!country) return `${ESCORTS_BASE}/${g}`
  const c = slugify(country)
  if (!city) return `${ESCORTS_BASE}/${g}/${c}`
  return `${ESCORTS_BASE}/${g}/${c}/${slugify(city)}`
}
