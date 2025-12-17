'use client'

import { useLanguage } from '../providers'
import Image from 'next/image'

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage()

  // Show the opposite language flag
  const oppositeLanguage = language === 'de' ? 'en' : 'de'
  const flagCode = oppositeLanguage === 'de' ? 'de' : 'gb'
  const flagUrl = `https://flagcdn.com/w20/${flagCode}.png`

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1.5 sm:py-2 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
      aria-label={`Switch to ${oppositeLanguage === 'de' ? 'German' : 'English'}`}
      title={`Switch to ${oppositeLanguage === 'de' ? 'German' : 'English'}`}
    >
      <Image
        src={flagUrl}
        alt={`${oppositeLanguage === 'de' ? 'German' : 'English'} flag`}
        width={20}
        height={16}
        className="object-cover rounded-sm"
        unoptimized
      />
    </button>
  )
}

