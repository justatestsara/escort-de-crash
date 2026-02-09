'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '../providers'
import Footer from './Footer'
import LanguageSwitcher from './LanguageSwitcher'
import StructuredData from './StructuredData'

export type Gender = import('../../lib/seo-slugs').Gender

export type AdModel = {
  id: string
  name: string
  age: number
  gender: Gender
  city: string
  country: string
  image: string
  images: string[]
  description?: string
  phone?: string
  email?: string
  whatsapp?: string
  telegram?: string
  instagram?: string
  twitter?: string
  hairColor?: string
  languages?: string[]
  services?: Array<{ name: string; included: boolean; extraPrice?: number }>
  rates?: Array<{ time: string; incall: number; outcall: number }>
}

function tel(phone: string): string {
  return phone.replace(/[^0-9+]/g, '')
}

function wa(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export default function AdDetailClient({ model, backUrl }: { model: AdModel; backUrl: string }) {
  const { t } = useLanguage()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const genderLabel = useMemo(() => {
    switch (model.gender) {
      case 'female':
        return t('filters.girls')
      case 'male':
        return t('filters.guys')
      case 'trans':
        return t('filters.trans')
      default:
        return ''
    }
  }, [model.gender, t])

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <StructuredData
        type="Person"
        data={{
          name: model.name,
          age: model.age,
          address: {
            '@type': 'PostalAddress',
            addressLocality: model.city,
            addressCountry: model.country,
          },
          image: model.images?.[0] || model.image,
          description: model.description || 'Professional companion',
          jobTitle: `${genderLabel} Escort`,
        }}
      />

      <header className="border-b border-[var(--border-primary)] sticky top-0 bg-[var(--bg-primary)]/95 backdrop-blur-sm z-50 transition-colors">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href={backUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Go back">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Link href="/" className="text-2xl font-header font-semibold tracking-wider text-[var(--header-color)]">
            ESCORT.DE
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <article className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8">
          <div>
            <div className="aspect-[3/4] overflow-hidden bg-[var(--bg-tertiary)] relative mb-4 transition-colors">
              <Image
                src={model.images?.[selectedImageIndex] || model.image}
                alt={`${model.name}, ${model.age} - ${genderLabel} escort in ${model.city}, ${model.country}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {model.images && model.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {model.images.map((img, index) => (
                  <button
                    key={img + index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-[3/4] overflow-hidden bg-[var(--bg-tertiary)] relative border-2 transition-colors ${
                      selectedImageIndex === index ? 'border-[var(--accent-pink)]' : 'border-transparent hover:border-[var(--border-primary)]'
                    }`}
                    aria-label={`Select image ${index + 1}`}
                  >
                    <Image src={img} alt={`${model.name} image ${index + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 20vw, 10vw" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6 font-body">
            <div>
              <h1 className="text-4xl font-semibold mb-2 tracking-tight text-[var(--text-primary)] transition-colors">
                {model.name}{' '}
                <span className="text-[var(--text-secondary)] text-3xl font-normal transition-colors">{model.age}</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-lg mb-2 font-light transition-colors">
                {model.city}, {model.country}
              </p>
            </div>

            <section className="border-t border-[var(--border-primary)] pt-6 transition-colors">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[var(--text-secondary)] text-sm mb-1 font-light transition-colors">{t('ad.gender')}</p>
                  <p className="text-[var(--text-primary)] font-medium transition-colors">{genderLabel}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] text-sm mb-1 font-light transition-colors">{t('ad.age')}</p>
                  <p className="text-[var(--text-primary)] font-medium transition-colors">{model.age}</p>
                </div>
              </div>
            </section>

            <section className="border-t border-[var(--border-primary)] pt-6 transition-colors">
              <h2 className="text-xl font-semibold mb-4 tracking-tight text-[var(--text-primary)] transition-colors">{t('ad.about')}</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed font-light transition-colors">
                {model.description || 'Professional companion available for various occasions.'}
              </p>
            </section>

            <section className="border-t border-[var(--border-primary)] pt-6 transition-colors">
              <h2 className="text-xl font-semibold mb-4 tracking-tight text-[var(--text-primary)] transition-colors">{t('ad.contactInfo')}</h2>
              <div className="grid grid-cols-2 gap-4">
                {model.phone && (
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm mb-1 font-light transition-colors">{t('ad.phone')}</p>
                    <a href={`tel:${tel(model.phone)}`} className="text-[var(--accent-pink)] hover:opacity-80 transition-opacity font-medium">
                      {model.phone}
                    </a>
                  </div>
                )}
                {model.whatsapp && (
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm mb-1 font-light transition-colors">{t('ad.whatsapp')}</p>
                    <a
                      href={`https://wa.me/${wa(model.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:text-green-600 transition-colors font-medium"
                    >
                      {model.whatsapp}
                    </a>
                  </div>
                )}
                {model.telegram && (
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm mb-1 font-light transition-colors">{t('ad.telegram')}</p>
                    <a
                      href={model.telegram.startsWith('http') ? model.telegram : `https://t.me/${model.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 transition-colors font-medium"
                    >
                      {model.telegram}
                    </a>
                  </div>
                )}
                {model.email && (
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm mb-1 font-light transition-colors">{t('ad.email')}</p>
                    <a href={`mailto:${model.email}`} className="text-[var(--accent-pink)] hover:opacity-80 transition-opacity font-medium">
                      {model.email}
                    </a>
                  </div>
                )}
              </div>
            </section>

            {model.rates && model.rates.length > 0 && (
              <section className="border-t border-[var(--border-primary)] pt-6 transition-colors">
                <h2 className="text-xl font-semibold mb-4 tracking-tight text-[var(--text-primary)] transition-colors">{t('ad.rates')}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] transition-colors">
                        <th className="text-left py-3 px-4 text-[var(--text-primary)] font-semibold text-sm transition-colors">{t('postAd.time')}</th>
                        <th className="text-center py-3 px-4 text-[var(--text-primary)] font-semibold text-sm transition-colors">{t('postAd.incall')}</th>
                        <th className="text-center py-3 px-4 text-[var(--text-primary)] font-semibold text-sm transition-colors">{t('postAd.outcall')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.rates.map((rate, index) => (
                        <tr key={rate.time + index} className={index % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}>
                          <td className="py-3 px-4 text-[var(--accent-pink)] font-medium transition-colors">{rate.time}</td>
                          <td className="py-3 px-4 text-center text-[var(--text-primary)] font-light transition-colors">{rate.incall} EUR</td>
                          <td className="py-3 px-4 text-center text-[var(--text-primary)] font-light transition-colors">{rate.outcall} EUR</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {model.services && model.services.length > 0 && (
              <section className="border-t border-[var(--border-primary)] pt-6 transition-colors">
                <h2 className="text-xl font-semibold mb-4 tracking-tight text-[var(--text-primary)] transition-colors">{t('ad.services')}</h2>
                <ul className="space-y-2 text-[var(--text-secondary)]">
                  {model.services.map((s, i) => (
                    <li key={s.name + i} className="flex justify-between gap-4">
                      <span>{s.name}</span>
                      <span className="text-[var(--text-tertiary)]">{s.included ? 'Included' : s.extraPrice ? `${s.extraPrice} EUR` : 'Extra'}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </article>

      {model.whatsapp && (
        <a
          href={`https://wa.me/${wa(model.whatsapp)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full px-4 py-3 shadow-lg transition-all hover:scale-105 z-50"
          aria-label="Contact on WhatsApp"
        >
          WhatsApp
        </a>
      )}

      <Footer />
    </main>
  )
}
