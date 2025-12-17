import type { Metadata } from 'next'
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
  title: 'Escort.de - Premium Escort Services',
  description: 'Find premium escort services near you',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${montserrat.variable} ${openSans.variable}`}>
      <body>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

