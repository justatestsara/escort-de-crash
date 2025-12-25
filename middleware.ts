import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const GENDER_SLUGS = new Set(['female', 'male', 'trans', 'luxury', 'webcam'])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Support country-first convenience URLs mentioned in blog posts:
  // /escorts/germany -> /escorts/female/germany
  // /escorts/switzerland/zurich -> /escorts/female/switzerland/zurich
  if (!pathname.startsWith('/escorts/')) return NextResponse.next()

  const parts = pathname.split('/').filter(Boolean) // ["escorts", ...]
  if (parts.length < 2) return NextResponse.next()

  const first = parts[1]
  if (GENDER_SLUGS.has(first)) return NextResponse.next()

  const dest = `/escorts/female/${parts.slice(1).join('/')}`
  const url = req.nextUrl.clone()
  url.pathname = dest
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: ['/escorts/:path*'],
}
