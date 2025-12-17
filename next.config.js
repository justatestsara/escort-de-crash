/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHostname = (() => {
  try {
    return supabaseUrl ? new URL(supabaseUrl).hostname : null
  } catch {
    return null
  }
})()

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'flagcdn.com' },
      ...(supabaseHostname ? [{ protocol: 'https', hostname: supabaseHostname }] : []),
    ],
  },
}

module.exports = nextConfig
