export type Gender = 'female' | 'male' | 'trans' | 'luxury_escort' | 'webcam'

export type GenderSlug = 'girls' | 'guys' | 'trans' | 'luxury-high-end' | 'webcam'

export function genderToSlug(g: Gender): GenderSlug {
  switch (g) {
    case 'female':
      return 'girls'
    case 'male':
      return 'guys'
    case 'trans':
      return 'trans'
    case 'luxury_escort':
      return 'luxury-high-end'
    case 'webcam':
      return 'webcam'
  }
}

export function slugToGender(slug: string): Gender | null {
  switch (slug) {
    case 'girls':
      return 'female'
    case 'guys':
      return 'male'
    case 'trans':
      return 'trans'
    case 'luxury-high-end':
      return 'luxury_escort'
    case 'webcam':
      return 'webcam'
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
  if (!country) return `/${g}`
  const c = slugify(country)
  if (!city) return `/${g}/${c}`
  return `/${g}/${c}/${slugify(city)}`
}
