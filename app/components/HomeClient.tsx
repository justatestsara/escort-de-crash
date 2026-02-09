'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme, useLanguage } from '../providers'
import Footer from './Footer'
import LanguageSwitcher from './LanguageSwitcher'
import StructuredData from './StructuredData'
import { genderToSlug, slugify } from '../../lib/seo-slugs'

export type Gender = 'female' | 'male' | 'trans'

export type Model = {
  id: string
  name: string
  age: number
  gender: Gender
  city: string
  country: string
  image: string
  images: string[]
  description?: string
}

type InitialFilters = {
  gender?: Gender | ''
  country?: string
  city?: string
}

const ALLOWED_COUNTRIES = [
  'Germany',
  'Austria',
  'Switzerland',
  'Czech Republic',
  'Netherlands',
  'Belgium',
  'France',
  'Poland',
  'Denmark',
  'Luxembourg',
]

function normalizeGender(v: string | null): Gender | '' {
  if (v === 'female' || v === 'male' || v === 'trans') return v
  return ''
}

export default function HomeClient({
  initialModels,
  initialFilters,
  facetCities,
  facetCityCounts,
  h1,
}: {
  initialModels: Model[]
  initialFilters: InitialFilters
  facetCities?: string[]
  facetCityCounts?: Record<string, number>
  h1?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  const [models] = useState<Model[]>(initialModels)

  const [selectedGender] = useState<Gender | ''>(() => {
    if (initialFilters.gender !== undefined) return initialFilters.gender
    return normalizeGender(searchParams.get('gender')) || 'female'
  })

  const [selectedCountry, setSelectedCountry] = useState<string>(() => initialFilters.country || searchParams.get('country') || '')
  const [selectedCity, setSelectedCity] = useState<string>(() => initialFilters.city || searchParams.get('city') || '')

  const effectiveGender: Gender = (selectedGender || 'female') as Gender

  const availableCountries = useMemo(() => {
    const pool = selectedGender ? models.filter((m) => m.gender === selectedGender) : models
    return Array.from(new Set(pool.map((m) => m.country)))
      .filter((c) => ALLOWED_COUNTRIES.includes(c))
      .sort()
  }, [models, selectedGender])

  const availableCities = useMemo(() => {
    if (!selectedCountry) return []
    if (facetCities && facetCities.length > 0) return [...facetCities].sort()
    const pool = selectedGender ? models.filter((m) => m.gender === selectedGender) : models
    return Array.from(new Set(pool.filter((m) => m.country === selectedCountry).map((m) => m.city))).sort()
  }, [models, selectedGender, selectedCountry, facetCities])

  const filteredModels = useMemo(() => {
    let filtered = [...models]
    if (selectedGender) filtered = filtered.filter((m) => m.gender === selectedGender)
    if (selectedCountry) filtered = filtered.filter((m) => m.country === selectedCountry)
    if (selectedCity) filtered = filtered.filter((m) => m.city === selectedCity)
    return filtered
  }, [models, selectedGender, selectedCountry, selectedCity])

  // Keep city valid when country changes
  useEffect(() => {
    if (!selectedCountry) {
      if (selectedCity) setSelectedCity('')
      return
    }
    if (selectedCity && !availableCities.includes(selectedCity)) setSelectedCity('')
  }, [selectedCountry, selectedCity, availableCities])

  const seoHeading = useMemo(() => {
    if (selectedCity || selectedCountry) {
      if (!selectedGender) return `Escorts ${selectedCity || selectedCountry}`

      const label =
        selectedGender === 'female'
          ? t('filters.girls')
          : selectedGender === 'male'
            ? t('filters.guys')
            : selectedGender === 'trans'
              ? t('filters.trans')
              : t('filters.girls')

      return `${label} Escorts ${selectedCity || selectedCountry}`
    }

    if (selectedGender) return 'Featured Models'
    return ''
  }, [selectedCity, selectedCountry, selectedGender, t])

  const headingText = h1 ?? seoHeading

  const genderLabelForBreadcrumb = useMemo(() => {
    if (!selectedGender) return ''
    return selectedGender === 'female'
      ? t('filters.girls')
      : selectedGender === 'male'
        ? t('filters.guys')
        : selectedGender === 'trans'
          ? t('filters.trans')
          : t('filters.girls')
  }, [selectedGender, t])

  const countryCodeMap: Record<string, string> = {
    Germany: 'de',
    Austria: 'at',
    Switzerland: 'ch',
    'Czech Republic': 'cz',
    Netherlands: 'nl',
    Belgium: 'be',
    France: 'fr',
    Poland: 'pl',
    Denmark: 'dk',
    Luxembourg: 'lu',
  }

  const genderSlug = genderToSlug(effectiveGender)

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <StructuredData type="Organization" data={{ name: 'Escort.de', url: 'https://escort.de', description: 'Premium escort directory' }} />
      <StructuredData
        type="WebSite"
        data={{
          name: 'Escort.de',
          url: 'https://escort.de',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://escort.de/?country={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <StructuredData
        type="BreadcrumbList"
        data={{
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://escort.de/' },
            ...(selectedGender
              ? [{ '@type': 'ListItem', position: 2, name: genderLabelForBreadcrumb, item: `https://escort.de/${genderSlug}` }]
              : []),
            ...(selectedGender && selectedCountry
              ? [
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: selectedCountry,
                    item: `https://escort.de/${genderSlug}/${slugify(selectedCountry)}`,
                  },
                ]
              : []),
            ...(selectedGender && selectedCountry && selectedCity
              ? [
                  {
                    '@type': 'ListItem',
                    position: 4,
                    name: selectedCity,
                    item: `https://escort.de/${genderSlug}/${slugify(selectedCountry)}/${slugify(selectedCity)}`,
                  },
                ]
              : []),
          ],
        }}
      />

      <header className="border-b border-[var(--border-primary)] sticky top-0 bg-[var(--bg-primary)]/95 backdrop-blur-sm z-50 transition-colors">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex justify-between items-center gap-2">
          <Link href="/" className="text-xl sm:text-2xl font-header font-semibold tracking-wider text-[var(--header-color)] hover:opacity-80 transition-opacity">
            ESCORT.DE
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 sm:py-2 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors font-medium text-sm sm:text-base flex items-center gap-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <span className="hidden sm:inline">{t('header.light')}</span> : <span className="hidden sm:inline">{t('header.dark')}</span>}
            </button>
            <Link href="/post-ad" className="px-3 sm:px-6 py-1.5 sm:py-2 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity font-medium text-sm sm:text-base">
              {t('header.postAd')}
            </Link>
          </div>
        </div>
      </header>

      <nav aria-label="Filter escorts" className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 border-b border-[var(--border-primary)] transition-colors">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="gender-filter-heading">
            <h2 id="gender-filter-heading" className="sr-only">
              Filter by Gender
            </h2>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 max-w-3xl w-full">
                <Link
                  href="/girls"
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    effectiveGender === 'female'
                      ? 'bg-[var(--accent-pink)] text-white shadow-md'
                      : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <span>{t('filters.girls')}</span>
                </Link>
                <Link
                  href="/guys"
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    effectiveGender === 'male'
                      ? 'bg-[var(--accent-pink)] text-white shadow-md'
                      : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <span>{t('filters.guys')}</span>
                </Link>
                <Link
                  href="/trans"
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    effectiveGender === 'trans'
                      ? 'bg-[var(--accent-pink)] text-white shadow-md'
                      : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <span>{t('filters.trans')}</span>
                </Link>
              </div>
            </div>
          </section>

          <section aria-labelledby="country-filter-heading">
            <h2 id="country-filter-heading" className="text-sm font-medium text-[var(--text-secondary)] mb-3">
              {t('filters.countries')}
            </h2>

            {/* Mobile dropdown */}
            <div className="sm:hidden">
              <select
                value={selectedCountry ? `/${genderSlug}/${slugify(selectedCountry)}` : `/${genderSlug}`}
                onChange={(e) => router.push(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)]"
                aria-label="Select country"
              >
                <option value={`/${genderSlug}`}>All countries</option>
                {availableCountries.map((country) => {
                  const pool = selectedGender ? models.filter((m) => m.gender === selectedGender) : models
                  const countryCount = pool.filter((m) => m.country === country).length
                  return (
                    <option key={country} value={`/${genderSlug}/${slugify(country)}`}>
                      {country} ({countryCount})
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {availableCountries.map((country) => {
                const pool = selectedGender ? models.filter((m) => m.gender === selectedGender) : models
                const countryCount = pool.filter((m) => m.country === country).length
                const code = countryCodeMap[country] || 'un'
                const flagUrl = `https://flagcdn.com/w20/${code}.png`

                const href = selectedCountry === country ? `/${genderSlug}` : `/${genderSlug}/${slugify(country)}`

                return (
                  <Link
                    key={country}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                      selectedCountry === country
                        ? 'bg-[var(--accent-pink)] text-white shadow-md'
                        : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <Image src={flagUrl} alt={`${country} flag`} width={20} height={16} className="object-cover rounded-sm flex-shrink-0" />
                    <span className="flex-1 truncate">{country}</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        selectedCountry === country ? 'bg-white/20 text-white' : 'bg-blue-500 text-white'
                      }`}
                    >
                      {countryCount}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          {selectedCountry && availableCities.length > 0 && (
            <section aria-labelledby="city-filter-heading">
              <h2 id="city-filter-heading" className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                {t('filters.cities')}
              </h2>

              {/* Mobile dropdown */}
              <div className="sm:hidden">
                <select
                  value={
                    selectedCity
                      ? `/${genderSlug}/${slugify(selectedCountry)}/${slugify(selectedCity)}`
                      : `/${genderSlug}/${slugify(selectedCountry)}`
                  }
                  onChange={(e) => router.push(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)]"
                  aria-label="Select city"
                >
                  <option value={`/${genderSlug}/${slugify(selectedCountry)}`}>All cities</option>
                  {availableCities.map((city) => {
                    const pool = selectedGender ? models.filter((m) => m.gender === selectedGender) : models
                    const cityCount =
                      facetCityCounts?.[city] ??
                      pool.filter((m) => m.city === city && m.country === selectedCountry).length
                    return (
                      <option key={city} value={`/${genderSlug}/${slugify(selectedCountry)}/${slugify(city)}`}>
                        {city} ({cityCount})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Desktop grid */}
              <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {availableCities.map((city) => {
                  const pool = selectedGender ? models.filter((m) => m.gender === selectedGender) : models
                  const cityCount =
                    facetCityCounts?.[city] ??
                    pool.filter((m) => m.city === city && m.country === selectedCountry).length
                  const code = countryCodeMap[selectedCountry] || 'un'
                  const flagUrl = `https://flagcdn.com/w20/${code}.png`

                  const href =
                    selectedCity === city
                      ? `/${genderSlug}/${slugify(selectedCountry)}`
                      : `/${genderSlug}/${slugify(selectedCountry)}/${slugify(city)}`

                  return (
                    <Link
                      key={city}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                        selectedCity === city
                          ? 'bg-[var(--accent-pink)] text-white shadow-md'
                          : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <Image src={flagUrl} alt={`${selectedCountry} flag`} width={20} height={16} className="object-cover rounded-sm flex-shrink-0" />
                      <span className="flex-1 truncate">{city}</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                          selectedCity === city ? 'bg-white/20 text-white' : 'bg-blue-500 text-white'
                        }`}
                      >
                        {cityCount}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {headingText ? (
          <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 text-center text-[var(--text-primary)] transition-colors">{headingText}</h1>
        ) : null}

        {filteredModels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--text-secondary)] transition-colors">{t('home.noModelsFound')}</p>
          </div>
        ) : (
          <section aria-label="Escort listings" className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
            {filteredModels.map((m) => {
              // Keep ad URLs clean (no ?back=... in the address bar)
              const href = `/ad/${m.id}`
              return (
                <Link
                  key={m.id}
                  href={href}
                  className={`${theme === 'dark' ? '' : 'border-2 border-[var(--profile-border)] hover:border-[var(--accent-pink)]'} transition-colors bg-[var(--bg-secondary)] overflow-hidden group cursor-pointer rounded-lg block`}
                  aria-label={`View ${m.name}`}
                >
                  <article itemScope itemType="https://schema.org/Person">
                    <div className="aspect-[3/4] overflow-hidden bg-[var(--bg-tertiary)] relative">
                      <Image
                        src={m.images?.[0] || m.image}
                        alt={`${m.name}, ${m.age} - ${m.city}, ${m.country}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 25vw"
                        priority={false}
                      />
                    </div>
                    <div className="p-2 sm:p-4 font-body">
                      <h3 itemProp="name" className="text-sm sm:text-lg font-semibold mb-0.5 sm:mb-1 tracking-tight">
                        {m.name}{' '}
                        <span className="text-gray-400 text-xs sm:text-base font-normal" itemProp="age">
                          {m.age}
                        </span>
                      </h3>
                      <p
                        itemProp="address"
                        itemScope
                        itemType="https://schema.org/PostalAddress"
                        className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1 font-light"
                      >
                        <span itemProp="addressLocality">{m.city}</span>, <span itemProp="addressCountry">{m.country}</span>
                      </p>
                    </div>
                  </article>
                </Link>
              )
            })}
          </section>
        )}
      </div>

      <Footer />
    </main>
  )
}