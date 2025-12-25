export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  countrySlug: string
  countryName: string
  content: Array<
    | { type: 'p'; text: string }
    | { type: 'link'; href: string; text: string; prefix?: string; suffix?: string }
    | { type: 'h2'; text: string }
    | { type: 'ul'; items: string[] }
  >
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'why-book-germany-escorts-from-escort-de',
    title: 'Why book Germany escorts from Escort.de?',
    description: 'Verified profiles, fewer scammers, and a simple way to find independent escorts in Germany.',
    date: '2025-12-23',
    countrySlug: 'germany',
    countryName: 'Germany',
    content: [
      {
        type: 'p',
        text: 'If you are looking for independent escorts in Germany, the biggest challenge is trust: fake listings, reused photos, and time-wasting “agents”. Escort.de is built to reduce that noise and help you find real profiles faster.',
      },
      { type: 'h2', text: 'What makes Escort.de better?' },
      {
        type: 'ul',
        items: [
          'Verified profile workflow to reduce scams and low-quality listings.',
          'Clear location structure (country + city) so you can browse exactly where you are.',
          'Fast pages and image optimization so mobile users can browse without waiting.',
        ],
      },
      { type: 'p', text: 'Start browsing Germany escort listings here:' },
      { type: 'link', href: '/escorts/germany', text: 'Germany Escorts' },
      { type: 'p', text: 'Tip: use the filters to narrow down by city and find the closest verified profiles.' },
    ],
  },
  {
    slug: 'why-book-switzerland-escorts-from-escort-de',
    title: 'Why book Switzerland escorts from Escort.de?',
    description: 'A safer way to browse independent escorts in Switzerland with verified profiles and clean listings.',
    date: '2025-12-23',
    countrySlug: 'switzerland',
    countryName: 'Switzerland',
    content: [
      {
        type: 'p',
        text: 'Switzerland is one of the most searched locations, but many directories are cluttered with outdated ads or spam. Escort.de focuses on quality: clean UX, fast loading on mobile, and listings that are easier to trust.',
      },
      { type: 'h2', text: 'How Escort.de helps you find the right match' },
      {
        type: 'ul',
        items: [
          'Verified profiles to reduce scammers and fake ads.',
          'Simple browsing by country and city, without endless paging.',
          'SEO-friendly landing pages so you can find relevant results quickly.',
        ],
      },
      { type: 'p', text: 'Browse Switzerland escort listings here:' },
      { type: 'link', href: '/escorts/switzerland', text: 'Switzerland Escorts' },
      { type: 'p', text: 'From there you can pick a city and view profiles with photos, rates, and contact info.' },
    ],
  },
]

export function getBlogPost(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) || null
}
