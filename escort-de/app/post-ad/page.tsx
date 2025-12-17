'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme, useLanguage } from '../providers'
import Footer from '../components/Footer'
import LanguageSwitcher from '../components/LanguageSwitcher'

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

export default function PostAd() {
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
    images: [] as string[], // Base64 encoded images
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newService, setNewService] = useState({ name: '', included: true, extraPrice: '' })
  const [newRate, setNewRate] = useState({ time: '', incall: '', outcall: '' })
  const [imagePreviews, setImagePreviews] = useState<string[]>([])


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    
    // Save ad to localStorage with pending status
    const newAd = {
      id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...formData,
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
    }
    
    // Get existing ads from localStorage
    const existingAds = typeof window !== 'undefined' ? localStorage.getItem('submitted_ads') : null
    const ads = existingAds ? JSON.parse(existingAds) : []
    ads.push(newAd)
    localStorage.setItem('submitted_ads', JSON.stringify(ads))
    
    console.log('Form submitted:', newAd)
    setSubmitted(true)
    
    // Reset form after 3 seconds
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
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: string[] = []
    const newPreviews: string[] = []
    const maxImages = 10 // Allow up to 10 images

    Array.from(files).slice(0, maxImages - formData.images.length).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          newImages.push(base64String)
          newPreviews.push(base64String)
          
          if (newImages.length === Array.from(files).slice(0, maxImages - formData.images.length).length) {
            setFormData({
              ...formData,
              images: [...formData.images, ...newImages],
            })
            setImagePreviews([...imagePreviews, ...newPreviews])
            // Clear error when images are added
            if (errors.images) {
              setErrors({ ...errors, images: '' })
            }
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      images: newImages,
    })
    setImagePreviews(newPreviews)
  }

  const handleLanguageToggle = (language: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.includes(language)
        ? formData.languages.filter(l => l !== language)
        : [...formData.languages, language],
    })
  }

  const addService = () => {
    if (!newService.name.trim()) return
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        {
          name: newService.name,
          included: newService.included,
          extraPrice: newService.extraPrice ? parseFloat(newService.extraPrice) : undefined,
        },
      ],
    })
    setNewService({ name: '', included: true, extraPrice: '' })
  }

  const removeService = (index: number) => {
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== index),
    })
  }

  const addRate = () => {
    if (!newRate.time.trim() || !newRate.incall || !newRate.outcall) return
    setFormData({
      ...formData,
      rates: [
        ...formData.rates,
        {
          time: newRate.time,
          incall: parseFloat(newRate.incall),
          outcall: parseFloat(newRate.outcall),
        },
      ],
    })
    setNewRate({ time: '', incall: '', outcall: '' })
  }

  const removeRate = (index: number) => {
    setFormData({
      ...formData,
      rates: formData.rates.filter((_, i) => i !== index),
    })
  }

  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = t('postAd.nameRequired')
    }
    if (!formData.country) {
      newErrors.country = t('postAd.countryRequired')
    }
    if (!formData.city.trim()) {
      newErrors.city = t('postAd.cityRequired')
    }
    if (!formData.age || parseInt(formData.age) < 18) {
      newErrors.age = t('postAd.ageInvalid')
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('postAd.nameRequired') // Using nameRequired as placeholder, need to add phoneRequired
    }
    if (!formData.description.trim() || formData.description.trim().length < 50) {
      newErrors.description = t('postAd.descriptionMinLength')
    }
    if (formData.images.length < 3) {
      newErrors.images = t('postAd.imagesRequired')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
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

      {/* Form */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-light mb-8 text-[var(--text-primary)] transition-colors">{t('postAd.title')}</h1>

        {submitted ? (
          <div className="border border-green-500 bg-green-500/10 p-6 mb-6">
            <p className="text-green-600 dark:text-green-400 transition-colors">{t('postAd.submitted')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Images Upload */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">{t('postAd.photos')}</h2>
              
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-[3/4] group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover border-2 border-[var(--border-primary)] rounded transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {imagePreviews.length < 10 && (
                    <label className="aspect-[3/4] border-2 border-dashed border-[var(--border-primary)] rounded flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-pink)] transition-colors bg-[var(--bg-secondary)]">
                      <svg className="w-8 h-8 text-[var(--text-tertiary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-[var(--text-secondary)] text-center px-2">{t('postAd.addPhoto')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  {imagePreviews.length}/3 minimum ({imagePreviews.length}/10 maximum)
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">{t('postAd.basicInfo')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                    {t('postAd.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
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
                    type="number"
                    id="age"
                    name="age"
                    required
                    min="18"
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
                    required
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
                    {HAIR_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
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
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.country ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                  >
                    <option value="">Select Country</option>
                    {ALLOWED_COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                    {t('postAd.city')}
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.city ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                    placeholder="Enter your city"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                  Languages Spoken
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_LANGUAGES.map(lang => (
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
                {formData.languages.length > 0 && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">Selected: {formData.languages.join(', ')}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                  {t('postAd.description')} (Minimum 50 characters)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.description ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] resize-none text-[var(--text-primary)] transition-colors`}
                  placeholder="Tell us about your services..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
                  <p className={`text-xs ml-auto ${formData.description.length < 50 ? 'text-red-500' : 'text-[var(--text-tertiary)]'}`}>
                    {formData.description.length}/50 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">{t('postAd.contact')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                    {t('postAd.phone')} *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.phone ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                    placeholder="+49 30 12345678"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                    {t('postAd.whatsapp')}
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                    placeholder="+493012345678"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                    {t('postAd.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="telegram" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                    {t('postAd.telegram')}
                  </label>
                  <input
                    type="text"
                    id="telegram"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label htmlFor="instagram" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                    {t('postAd.instagram')}
                  </label>
                  <input
                    type="text"
                    id="instagram"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label htmlFor="twitter" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                    {t('postAd.twitter')}
                  </label>
                  <input
                    type="text"
                    id="twitter"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                    placeholder="@username"
                  />
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
                          {service.included ? t('postAd.included') : `${t('postAd.extra')}: €${service.extraPrice || 0}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
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
                  <input
                    type="checkbox"
                    checked={newService.included}
                    onChange={(e) => setNewService({ ...newService, included: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">{t('postAd.included')}</span>
                </label>
                <input
                  type="number"
                  placeholder={`${t('postAd.extra')} (€)`}
                  value={newService.extraPrice}
                  onChange={(e) => setNewService({ ...newService, extraPrice: e.target.value })}
                  disabled={newService.included}
                  className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={addService}
                  className="px-4 py-2 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity"
                >
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
                        <th className="py-3 px-4 text-center text-[var(--text-primary)] font-medium transition-colors">{t('postAd.incall')} (€)</th>
                        <th className="py-3 px-4 text-center text-[var(--text-primary)] font-medium transition-colors">{t('postAd.outcall')} (€)</th>
                        <th className="py-3 px-4 text-center text-[var(--text-primary)] font-medium transition-colors">{t('postAd.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.rates.map((rate, index) => (
                        <tr key={index} className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                          <td className="py-3 px-4 text-[var(--text-primary)] transition-colors">{rate.time}</td>
                          <td className="py-3 px-4 text-center text-[var(--text-primary)] transition-colors">€{rate.incall}</td>
                          <td className="py-3 px-4 text-center text-[var(--text-primary)] transition-colors">€{rate.outcall}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeRate(index)}
                              className="text-red-500 hover:text-red-600 transition-colors"
                            >
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
                  placeholder="Incall (€)"
                  value={newRate.incall}
                  onChange={(e) => setNewRate({ ...newRate, incall: e.target.value })}
                  className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                />
                <input
                  type="number"
                  placeholder="Outcall (€)"
                  value={newRate.outcall}
                  onChange={(e) => setNewRate({ ...newRate, outcall: e.target.value })}
                  className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
                />
                <button
                  type="button"
                  onClick={addRate}
                  className="px-4 py-2 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity"
                >
                  {t('postAd.addRate')}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity font-medium"
            >
              {t('postAd.submit')}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </main>
  )
}
