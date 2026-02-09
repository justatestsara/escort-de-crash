'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useTheme, useLanguage } from '../providers'
import Footer from '../components/Footer'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { createAd } from '../../lib/supabase-ads'
import { supabase } from '../../lib/supabase'

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

const HAIR_COLORS = ['Blonde', 'Brown', 'Black', 'Red', 'Auburn', 'Other']
const COMMON_LANGUAGES = ['German', 'English', 'French', 'Spanish', 'Italian', 'Dutch', 'Polish', 'Czech', 'Russian', 'Other']

interface Service {
  name: string
  included: boolean
  extraPrice?: number
}

interface Rate {
  time: string
  incall: number
  outcall: number
}

function safeUuid(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = typeof crypto !== 'undefined' ? crypto : null
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `u_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function fileToWebpBlob(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const maxWidth = 1600
    const scale = img.width > maxWidth ? maxWidth / img.width : 1
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(img, 0, 0, width, height)

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8))
    return blob || file
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function uploadWebpToSupabaseStorage(blob: Blob): Promise<string> {
  const key = `ads/${safeUuid()}.webp`

  const { error } = await supabase.storage.from('ad-images').upload(key, blob, {
    contentType: 'image/webp',
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from('ad-images').getPublicUrl(key)
  return data.publicUrl
}

export default function PostAd() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'female' as 'female' | 'male' | 'trans',
    city: '',
    country: '',
    phone: '',
    email: '',
    whatsapp: '',
    telegram: '',
    instagram: '',
    twitter: '',
    hairColor: '',
    languages: [] as string[],
    description: '',
    services: [] as Service[],
    rates: [] as Rate[],
    images: [] as string[], // Public WebP URLs
  })

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [newService, setNewService] = useState({ name: '', included: true, extraPrice: '' })
  const [newRate, setNewRate] = useState({ time: '', incall: '', outcall: '' })

  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = t('postAd.nameRequired')
    if (!formData.country) newErrors.country = t('postAd.countryRequired')
    if (!formData.city.trim()) newErrors.city = t('postAd.cityRequired')

    const ageNum = parseInt(formData.age, 10)
    if (!formData.age || !Number.isFinite(ageNum) || ageNum < 18) newErrors.age = t('postAd.ageInvalid')

    if (!formData.phone.trim()) newErrors.phone = t('postAd.nameRequired')

    if (!formData.description.trim() || formData.description.trim().length < 50) {
      newErrors.description = t('postAd.descriptionMinLength')
    }

    if (formData.images.length < 3) newErrors.images = t('postAd.imagesRequired')

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const maxImages = 10
    const toAdd = Array.from(files).slice(0, maxImages - formData.images.length)
    if (toAdd.length === 0) return

    setIsUploadingImages(true)
    setImageUploadError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of toAdd) {
        if (!file.type.startsWith('image/')) continue
        const webp = await fileToWebpBlob(file)
        const url = await uploadWebpToSupabaseStorage(webp)
        uploadedUrls.push(url)
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }))
        setImagePreviews((prev) => [...prev, ...uploadedUrls])
        if (errors.images) setErrors((prev) => ({ ...prev, images: '' }))
      }
    } catch (err: any) {
      console.error('Image upload error:', err)
      setImageUploadError(
        (err?.message || 'Failed to upload images') +
          ' (Make sure Supabase Storage bucket "ad-images" exists and allows uploads.)'
      )
    } finally {
      setIsUploadingImages(false)
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLanguageToggle = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language) ? prev.languages.filter((l) => l !== language) : [...prev.languages, language],
    }))
  }

  const addService = () => {
    if (!newService.name.trim()) return
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          name: newService.name,
          included: newService.included,
          extraPrice: newService.extraPrice ? parseFloat(newService.extraPrice) : undefined,
        },
      ],
    }))
    setNewService({ name: '', included: true, extraPrice: '' })
  }

  const removeService = (index: number) => {
    setFormData((prev) => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }))
  }

  const addRate = () => {
    if (!newRate.time.trim() || !newRate.incall || !newRate.outcall) return
    setFormData((prev) => ({
      ...prev,
      rates: [
        ...prev.rates,
        {
          time: newRate.time,
          incall: parseFloat(newRate.incall),
          outcall: parseFloat(newRate.outcall),
        },
      ],
    }))
    setNewRate({ time: '', incall: '', outcall: '' })
  }

  const removeRate = (index: number) => {
    setFormData((prev) => ({ ...prev, rates: prev.rates.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isUploadingImages) {
      setError('Please wait until image uploads finish.')
      return
    }

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const newAd = {
        id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        status: 'pending' as const,
      }

      const result = await createAd(newAd)
      if (!result) {
        setError('Failed to submit ad. Please check console for details.')
        return
      }

      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          name: '',
          age: '',
          gender: 'female',
          city: '',
          country: '',
          phone: '',
          email: '',
          whatsapp: '',
          telegram: '',
          instagram: '',
          twitter: '',
          hairColor: '',
          languages: [],
          description: '',
          services: [],
          rates: [],
          images: [],
        })
        setImagePreviews([])
        setErrors({})
        setImageUploadError(null)
      }, 2500)
    } catch (err: any) {
      setError(err?.message || 'An error occurred while submitting your ad.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <header className="border-b border-[var(--border-primary)] sticky top-0 bg-[var(--bg-primary)]/95 backdrop-blur-sm z-50 transition-colors">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-2">
          <Link href="/" className="text-2xl font-header font-semibold tracking-wider text-[var(--header-color)]">
            ESCORT.DE
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={toggleTheme}
              className="px-3 py-2 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors flex items-center gap-2"
              aria-label="Toggle theme"
            >
              <span className="hidden sm:inline">{theme === 'dark' ? t('header.light') : t('header.dark')}</span>
            </button>
            <Link href="/" className="px-4 py-2 border border-[var(--border-primary)] hover:border-[var(--accent-pink)] transition-colors">
              {t('header.backToHome')}
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-light mb-8 text-[var(--text-primary)] transition-colors">{t('postAd.title')}</h1>
        <div className="border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 mb-8 text-sm text-[var(--text-secondary)] transition-colors">
          {t('postAd.noAgencyBanner')}
        </div>

        {submitted ? (
          <div className="border border-green-500 bg-green-500/10 p-6 mb-6">
            <p className="text-green-600 dark:text-green-400 transition-colors">{t('postAd.submitted')}</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="border border-red-500 bg-red-500/10 p-6 mb-6">
                <p className="text-red-600 dark:text-red-400 transition-colors">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Images */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">
                  {t('postAd.photos')}
                </h2>

                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-[3/4] group">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover border-2 border-[var(--border-primary)] rounded transition-colors" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          x
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">{index + 1}</div>
                      </div>
                    ))}

                    {imagePreviews.length < 10 && (
                      <label className="aspect-[3/4] border-2 border-dashed border-[var(--border-primary)] rounded flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-pink)] transition-colors bg-[var(--bg-secondary)]">
                        <svg className="w-8 h-8 text-[var(--text-tertiary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-[var(--text-secondary)] text-center px-2">{t('postAd.addPhoto')}</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={isUploadingImages} />
                      </label>
                    )}
                  </div>

                  {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                  {imageUploadError && <p className="text-red-500 text-xs mt-2">{imageUploadError}</p>}
                  {isUploadingImages && <p className="text-xs text-[var(--text-tertiary)] mt-2">Uploading & converting images...</p>}

                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    {imagePreviews.length}/3 minimum ({imagePreviews.length}/10 maximum)
                  </p>
                </div>
              </div>

              {/* Basic info */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">{t('postAd.basicInfo')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.name')}
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.name ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.age')}
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      min={18}
                      value={formData.age}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.age ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                    />
                    {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.gender')}
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                    >
                      <option value="female">{t('postAd.gender.female')}</option>
                      <option value="male">{t('postAd.gender.male')}</option>
                      <option value="trans">{t('postAd.gender.trans')}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="hairColor" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.hairColor')}
                    </label>
                    <select
                      id="hairColor"
                      name="hairColor"
                      value={formData.hairColor}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                    >
                      <option value="">Select Hair Color</option>
                      {HAIR_COLORS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.country')}
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.country ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                    >
                      <option value="">Select Country</option>
                      {ALLOWED_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.city')}
                    </label>
                    <input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.city ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageToggle(lang)}
                        className={`px-3 py-1 text-sm border transition-colors ${
                          formData.languages.includes(lang)
                            ? 'bg-[var(--accent-pink)] text-white border-[var(--accent-pink)]'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--accent-pink)]'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                    {t('postAd.description')} (Minimum 50 characters)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${
                      errors.description ? 'border-red-500' : 'border-[var(--border-primary)]'
                    } focus:outline-none focus:border-[var(--accent-pink)] resize-none text-[var(--text-primary)] transition-colors`}
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">{t('postAd.contact')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.phone')} *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.phone ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="whatsapp" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.whatsapp')}
                    </label>
                    <input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors" />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.email')}
                    </label>
                    <input id="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors" />
                  </div>

                  <div>
                    <label htmlFor="telegram" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.telegram')}
                    </label>
                    <input id="telegram" name="telegram" value={formData.telegram} onChange={handleChange} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors" />
                  </div>

                  <div>
                    <label htmlFor="instagram" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.instagram')}
                    </label>
                    <input id="instagram" name="instagram" value={formData.instagram} onChange={handleChange} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors" />
                  </div>

                  <div>
                    <label htmlFor="twitter" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                      {t('postAd.twitter')}
                    </label>
                    <input id="twitter" name="twitter" value={formData.twitter} onChange={handleChange} className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors" />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">{t('postAd.services')}</h2>

                {formData.services.length > 0 && (
                  <div className="space-y-2">
                    {formData.services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--text-primary)]">{service.name}</span>
                          <span className={`text-xs px-2 py-1 ${service.included ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {service.included ? t('postAd.included') : `${t('postAd.extra')}: EUR ${service.extraPrice || 0}`}
                          </span>
                        </div>
                        <button type="button" onClick={() => removeService(index)} className="text-red-500 hover:text-red-600 transition-colors">
                          {t('postAd.remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] transition-colors">
                  <input
                    type="text"
                    placeholder="Service name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newService.included} onChange={(e) => setNewService({ ...newService, included: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm text-[var(--text-secondary)]">{t('postAd.included')}</span>
                  </label>
                  <input
                    type="number"
                    placeholder={`${t('postAd.extra')} (EUR)`}
                    value={newService.extraPrice}
                    onChange={(e) => setNewService({ ...newService, extraPrice: e.target.value })}
                    disabled={newService.included}
                    className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors disabled:opacity-50"
                  />
                  <button type="button" onClick={addService} className="px-4 py-2 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity">
                    {t('postAd.addService')}
                  </button>
                </div>
              </div>

              {/* Rates */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">{t('postAd.rates')}</h2>

                {formData.rates.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] transition-colors">
                          <th className="py-3 px-4 text-left text-[var(--text-primary)] font-medium transition-colors">{t('postAd.time')}</th>
                          <th className="py-3 px-4 text-center text-[var(--text-primary)] font-medium transition-colors">{t('postAd.incall')} (EUR)</th>
                          <th className="py-3 px-4 text-center text-[var(--text-primary)] font-medium transition-colors">{t('postAd.outcall')} (EUR)</th>
                          <th className="py-3 px-4 text-center text-[var(--text-primary)] font-medium transition-colors">{t('postAd.action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.rates.map((rate, index) => (
                          <tr key={index} className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                            <td className="py-3 px-4 text-[var(--text-primary)] transition-colors">{rate.time}</td>
                            <td className="py-3 px-4 text-center text-[var(--text-primary)] transition-colors">EUR {rate.incall}</td>
                            <td className="py-3 px-4 text-center text-[var(--text-primary)] transition-colors">EUR {rate.outcall}</td>
                            <td className="py-3 px-4 text-center">
                              <button type="button" onClick={() => removeRate(index)} className="text-red-500 hover:text-red-600 transition-colors">
                                {t('postAd.remove')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] transition-colors">
                  <input
                    type="text"
                    placeholder="Time (e.g., 1 Hour)"
                    value={newRate.time}
                    onChange={(e) => setNewRate({ ...newRate, time: e.target.value })}
                    className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Incall (EUR)"
                    value={newRate.incall}
                    onChange={(e) => setNewRate({ ...newRate, incall: e.target.value })}
                    className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Outcall (EUR)"
                    value={newRate.outcall}
                    onChange={(e) => setNewRate({ ...newRate, outcall: e.target.value })}
                    className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                  />
                  <button type="button" onClick={addRate} className="px-4 py-2 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity">
                    {t('postAd.addRate')}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingImages}
                className="w-full px-6 py-3 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingImages ? 'Uploading images...' : isSubmitting ? 'Submitting...' : t('postAd.submit')}
              </button>
            </form>
          </>
        )}
      </div>

      <Footer />
    </main>
  )
}
