'use client'

import Link from 'next/link'
import { useLanguage } from '../providers'

export default function Footer() {
  const { t } = useLanguage()
  
  return (
    <footer className="border-t border-[var(--border-primary)] mt-20 transition-colors">
      <div className="container mx-auto px-4 py-8 text-center text-[var(--text-tertiary)] text-sm transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/contact" 
              className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors underline"
            >
              {t('footer.contactUs')}
            </Link>
            <span className="text-[var(--text-tertiary)]">|</span>
            <Link 
              href="/legal/imprint" 
              className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors underline"
            >
              Impressum
            </Link>
            <span className="text-[var(--text-tertiary)]">|</span>
            <Link
              href="/blog"
              className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors underline"
            >
              Blog
            </Link>
          </div>
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}

