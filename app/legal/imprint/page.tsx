'use client'

import Link from 'next/link'
import { useTheme, useLanguage } from '../../providers'
import Footer from '../../components/Footer'
import LanguageSwitcher from '../../components/LanguageSwitcher'

export default function Imprint() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      {/* Header */}
      <header className="border-b border-[var(--border-primary)] sticky top-0 bg-[var(--bg-primary)]/95 backdrop-blur-sm z-50 transition-colors">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-2">
          <Link href="/" className="text-2xl font-header font-semibold tracking-wider text-[var(--header-color)]">
            ESCORT.DE
          </Link>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="px-3 py-2 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors flex items-center gap-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="hidden sm:inline">{t('header.light')}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="hidden sm:inline">{t('header.dark')}</span>
                </>
              )}
            </button>
            <Link
              href="/"
              className="px-4 py-2 border border-[var(--border-primary)] hover:border-[var(--accent-pink)] transition-colors"
            >
              {t('header.backToHome')}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-header font-semibold mb-8 text-[var(--text-primary)] transition-colors">Impressum</h1>
        
        <div className="space-y-8">
          {/* Jugendschutzbeauftragter Section */}
          <div className="border-b border-[var(--border-primary)] pb-8 transition-colors">
            <h2 className="text-2xl font-header font-semibold mb-6 text-[var(--text-primary)] transition-colors">
              Jugendschutzbeauftragter gemäß § 7 JMStV
            </h2>
            
            {/* Contact Information */}
            <div className="text-[var(--text-secondary)] space-y-2 transition-colors">
              <p className="font-semibold text-[var(--text-primary)]">Rechtsanwalt Jan Müller</p>
              <p>IT-Recht Kanzlei, München</p>
              <p>
                E-Mail:{' '}
                <a 
                  href="mailto:jugendschutzbeauftragter@it-recht-kanzlei.de"
                  className="text-[var(--accent-pink)] hover:underline transition-colors"
                >
                  jugendschutzbeauftragter@it-recht-kanzlei.de
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  )
}
