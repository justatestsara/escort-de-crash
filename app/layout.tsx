import type { Metadata } from 'next'
import Script from 'next/script'
import { Montserrat, Open_Sans } from 'next/font/google'
import { ThemeProvider, LanguageProvider } from './providers'
import './globals.css'

// Geometric sans-serif for headings
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-header',
})

// Humanist/neo-grotesque sans-serif for body text
const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: {
    default: 'Escort.de - Premium Escort Services',
    template: '%s | Escort.de',
  },
  description: 'Find premium escort services in Germany, Austria, and Switzerland. Browse verified profiles with photos, rates, and contact information.',
  keywords: ['escort', 'escorts', 'escort services', 'Germany', 'Austria', 'Switzerland', 'escort directory'],
  authors: [{ name: 'Escort.de' }],
  creator: 'Escort.de',
  publisher: 'Escort.de',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://escort.de'),
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://escort.de',
    siteName: 'Escort.de',
    title: 'Escort.de - Premium Escort Services',
    description: 'Find premium escort services in Germany, Austria, and Switzerland',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Escort.de',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Escort.de - Premium Escort Services',
    description: 'Find premium escort services in Germany, Austria, and Switzerland',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${montserrat.variable} ${openSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="7ce2a2a1-1c8f-4391-8993-14b027d37878"
          strategy="lazyOnload"
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



