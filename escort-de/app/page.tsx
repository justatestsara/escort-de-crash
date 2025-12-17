'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme, useLanguage } from './providers'
import Footer from './components/Footer'
import LanguageSwitcher from './components/LanguageSwitcher'

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

interface Model {
  id: string
  name: string
  age: number
  gender: 'female' | 'male' | 'trans'
  city: string
  country: string
  lat: number
  lng: number
  distance?: number
  image: string
  images?: string[]
  description?: string
  phone?: string
  email?: string
  whatsapp?: string
  telegram?: string
  instagram?: string
  twitter?: string
  hairColor?: string
  languages?: string[]
  services?: Service[]
  rates?: Rate[]
}

interface Location {
  lat: number
  lng: number
  city?: string
  country?: string
}

// Sample data - in production, this would come from a database
const SAMPLE_MODELS: Model[] = [] // Empty - ready for real ads

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

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [filteredModels, setFilteredModels] = useState<Model[]>([])
  const [selectedGender, setSelectedGender] = useState<'female' | 'male' | 'trans' | ''>(() => {
    const gender = searchParams.get('gender')
    return (gender === 'female' || gender === 'male' || gender === 'trans') ? gender : 'female'
  })
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return searchParams.get('country') || ''
  })
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    return searchParams.get('city') || ''
  })
  const [loading, setLoading] = useState(true)
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [filtersInitialized, setFiltersInitialized] = useState(false)
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({})

  // Get user location
  useEffect(() => {
    // First try IP-based location to get city/country
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(async (ipData) => {
        // If geolocation is available, use it for more accurate coordinates
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                city: ipData.city,
                country: ipData.country_name,
              })
              setLoading(false)
            },
            () => {
              // Use IP-based coordinates if geolocation denied
              setUserLocation({
                lat: ipData.latitude || 52.52,
                lng: ipData.longitude || 13.405,
                city: ipData.city,
                country: ipData.country_name,
              })
              setLoading(false)
            }
          )
        } else {
          // Use IP-based location
          setUserLocation({
            lat: ipData.latitude || 52.52,
            lng: ipData.longitude || 13.405,
            city: ipData.city,
            country: ipData.country_name,
          })
          setLoading(false)
        }
      })
      .catch(() => {
        // Default to Berlin if all fails
        setUserLocation({ lat: 52.52, lng: 13.405, city: 'Berlin', country: 'Germany' })
        setLoading(false)
      })
  }, [])

  // Calculate distances and sort models
  useEffect(() => {
    if (userLocation) {
      // Get approved ads from localStorage
      let approvedAds: Model[] = []
      if (typeof window !== 'undefined') {
        const storedAds = localStorage.getItem('submitted_ads')
        if (storedAds) {
          const allAds = JSON.parse(storedAds)
          approvedAds = allAds
            .filter((ad: any) => ad.status === 'approved')
            .map((ad: any) => ({
              id: ad.id,
              name: ad.name,
              age: parseInt(ad.age),
              gender: ad.gender,
              city: ad.city,
              country: ad.country,
              lat: 52.52, // Default coordinates - in production, get from geocoding
              lng: 13.405,
              image: ad.images && ad.images.length > 0 ? ad.images[0] : 'https://i.ibb.co/GQPtQvJB/image.jpg',
              images: ad.images && ad.images.length > 0 ? ad.images : ['https://i.ibb.co/GQPtQvJB/image.jpg'],
              description: ad.description,
              phone: ad.phone,
              email: ad.email,
              whatsapp: ad.whatsapp,
              telegram: ad.telegram,
              instagram: ad.instagram,
              twitter: ad.twitter,
              hairColor: ad.hairColor,
              languages: ad.languages,
              services: ad.services,
              rates: ad.rates,
            }))
        }
      }
      
      // Combine sample models with approved ads
      const allModels = [...SAMPLE_MODELS, ...approvedAds]
      
      const modelsWithDistance = allModels.map(model => ({
        ...model,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          model.lat,
          model.lng
        ),
      }))
      const sorted = modelsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      setModels(sorted)

      // Extract available cities and countries
      const cities = Array.from(new Set(sorted.map(m => m.city))).sort()
      const countries = Array.from(new Set(sorted.map(m => m.country))).sort()
      setAvailableCities(cities)
      setAvailableCountries(countries.filter(c => ALLOWED_COUNTRIES.includes(c)))

      // Set default filters based on URL params first, then user location (only once)
      if (!filtersInitialized && sorted.length > 0) {
        // Check if URL has filter params
        const urlCountry = searchParams.get('country')
        const urlCity = searchParams.get('city')
        const urlGender = searchParams.get('gender')
        
        if (urlCountry && countries.includes(urlCountry)) {
          setSelectedCountry(urlCountry)
          if (urlCity && sorted.some(m => m.city === urlCity && m.country === urlCountry)) {
            setSelectedCity(urlCity)
          }
          if (urlGender === 'female' || urlGender === 'male' || urlGender === 'trans') {
            setSelectedGender(urlGender)
          }
          setFiltersInitialized(true)
          return
        }
        
        // Otherwise, set defaults based on user location
        let defaultCountry = ''
        let defaultCity = ''
        
        // Try to match user's country with available countries
        if (userLocation.country) {
          const matchedCountry = countries.find(c => 
            c.toLowerCase() === userLocation.country?.toLowerCase() ||
            (userLocation.country === 'Deutschland' && c === 'Germany')
          )
          if (matchedCountry && ALLOWED_COUNTRIES.includes(matchedCountry)) {
            defaultCountry = matchedCountry
          }
        }

        // If no country match, use the closest model's country
        if (!defaultCountry) {
          const closestModel = sorted[0]
          if (ALLOWED_COUNTRIES.includes(closestModel.country)) {
            defaultCountry = closestModel.country
          }
        }

        // Set the country
        if (defaultCountry) {
          setSelectedCountry(defaultCountry)
          
          // Now find the default city
          const citiesInCountry = sorted
            .filter(m => m.country === defaultCountry)
            .map(m => m.city)
          
          if (userLocation.city) {
            // Try to match user's city
            const matchedCity = citiesInCountry.find(c => 
              c.toLowerCase() === userLocation.city?.toLowerCase()
            )
            if (matchedCity) {
              defaultCity = matchedCity
            }
          }
          
          // If no city match, use the closest model's city in the selected country
          if (!defaultCity && citiesInCountry.length > 0) {
            const closestModelInCountry = sorted
              .filter(m => m.country === defaultCountry)[0]
            if (closestModelInCountry) {
              defaultCity = closestModelInCountry.city
            }
          }
          
          if (defaultCity) {
            setSelectedCity(defaultCity)
          }
          
          setFiltersInitialized(true)
        }
      }
    }
  }, [userLocation])

  // Apply filters
  useEffect(() => {
    let filtered = [...models]

    if (selectedGender) {
      filtered = filtered.filter(m => m.gender === selectedGender)
    }

    if (selectedCountry) {
      filtered = filtered.filter(m => m.country === selectedCountry)
    }

    if (selectedCity) {
      filtered = filtered.filter(m => m.city === selectedCity)
    }

    // Re-sort by distance when filters are applied
    if (userLocation) {
      filtered = filtered.map(model => ({
        ...model,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          model.lat,
          model.lng
        ),
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    setFilteredModels(filtered)
  }, [selectedCountry, selectedCity, selectedGender, models, userLocation])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedGender && selectedGender !== 'female') {
      params.set('gender', selectedGender)
    }
    if (selectedCountry) {
      params.set('country', selectedCountry)
    }
    if (selectedCity) {
      params.set('city', selectedCity)
    }
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/'
    if (window.location.search !== `?${params.toString()}`) {
      router.replace(newUrl, { scroll: false })
    }
  }, [selectedGender, selectedCountry, selectedCity, router])

  // Update available cities when country changes
  useEffect(() => {
    if (selectedCountry && models.length > 0) {
      const citiesInCountry = models
        .filter(m => m.country === selectedCountry)
        .map(m => m.city)
      setAvailableCities([...new Set(citiesInCountry)].sort())
      
      // Reset city if it's not in the selected country
      if (selectedCity) {
        const cityExists = citiesInCountry.includes(selectedCity)
        if (!cityExists) {
          setSelectedCity('')
        }
      }
    } else if (models.length > 0) {
      const allCities = models.map(m => m.city)
      setAvailableCities([...new Set(allCities)].sort())
    }
  }, [selectedCountry, models, selectedCity])

  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      {/* Header */}
      <header className="border-b border-[var(--border-primary)] sticky top-0 bg-[var(--bg-primary)]/95 backdrop-blur-sm z-50 transition-colors">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex justify-between items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-header font-semibold tracking-wider text-[var(--header-color)]">ESCORT.DE</h1>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 sm:py-2 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors font-medium text-sm sm:text-base flex items-center gap-2"
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
              href="/post-ad"
              className="px-3 sm:px-6 py-1.5 sm:py-2 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity font-medium text-sm sm:text-base"
            >
              {t('header.postAd')}
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 border-b border-[var(--border-primary)] transition-colors">
        <div className="flex flex-col gap-6">
          {/* Gender Filter Grid */}
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-2 max-w-md w-full">
              <button
                onClick={() => setSelectedGender(selectedGender === 'female' ? '' : 'female')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedGender === 'female'
                    ? 'bg-[var(--accent-pink)] text-white shadow-md'
                    : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></span>
                <span>{t('filters.girls')}</span>
              </button>
              <button
                onClick={() => setSelectedGender(selectedGender === 'male' ? '' : 'male')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedGender === 'male'
                    ? 'bg-[var(--accent-pink)] text-white shadow-md'
                    : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></span>
                <span>{t('filters.guys')}</span>
              </button>
              <button
                onClick={() => setSelectedGender(selectedGender === 'trans' ? '' : 'trans')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedGender === 'trans'
                    ? 'bg-[var(--accent-pink)] text-white shadow-md'
                    : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></span>
                <span>{t('filters.trans')}</span>
              </button>
            </div>
          </div>

          {/* Country List with Flags */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{t('filters.countries')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {availableCountries.map(country => {
                const countryCount = models.filter(m => m.country === country).length
                const countryCodes: { [key: string]: string } = {
                  'Germany': 'de',
                  'Austria': 'at',
                  'Switzerland': 'ch',
                  'Czech Republic': 'cz',
                  'Netherlands': 'nl',
                  'Belgium': 'be',
                  'France': 'fr',
                  'Poland': 'pl',
                  'Denmark': 'dk',
                  'Luxembourg': 'lu',
                  'Italy': 'it',
                  'Spain': 'es',
                  'Portugal': 'pt',
                  'Sweden': 'se',
                  'Norway': 'no',
                  'Finland': 'fi',
                  'Ireland': 'ie',
                  'Greece': 'gr',
                  'Hungary': 'hu',
                  'Romania': 'ro',
                  'Bulgaria': 'bg',
                  'Croatia': 'hr',
                  'Slovakia': 'sk',
                  'Slovenia': 'si',
                }
                const countryCode = countryCodes[country]?.toLowerCase() || 'un'
                const flagUrl = `https://flagcdn.com/w20/${countryCode}.png`
                
                return (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(selectedCountry === country ? '' : country)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                      selectedCountry === country
                        ? 'bg-[var(--accent-pink)] text-white shadow-md'
                        : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></span>
                    <Image 
                      src={flagUrl} 
                      alt={`${country} flag`}
                      width={20}
                      height={16}
                      className="object-cover rounded-sm flex-shrink-0"
                      unoptimized
                    />
                    <span className="flex-1 truncate">{country}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      selectedCountry === country
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {countryCount}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* City List with Flags */}
          {availableCities.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{t('filters.cities')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {availableCities.map(city => {
                  // Find the country for this city
                  const cityModel = models.find(m => m.city === city)
                  const cityCountry = cityModel?.country || ''
                  const cityCount = models.filter(m => m.city === city).length
                  
                  const countryCodes: { [key: string]: string } = {
                    'Germany': 'de',
                    'Austria': 'at',
                    'Switzerland': 'ch',
                    'Czech Republic': 'cz',
                    'Netherlands': 'nl',
                    'Belgium': 'be',
                    'France': 'fr',
                    'Poland': 'pl',
                    'Denmark': 'dk',
                    'Luxembourg': 'lu',
                    'Italy': 'it',
                    'Spain': 'es',
                    'Portugal': 'pt',
                    'Sweden': 'se',
                    'Norway': 'no',
                    'Finland': 'fi',
                    'Ireland': 'ie',
                    'Greece': 'gr',
                    'Hungary': 'hu',
                    'Romania': 'ro',
                    'Bulgaria': 'bg',
                    'Croatia': 'hr',
                    'Slovakia': 'sk',
                    'Slovenia': 'si',
                  }
                  const countryCode = countryCodes[cityCountry]?.toLowerCase() || 'un'
                  const flagUrl = `https://flagcdn.com/w20/${countryCode}.png`
                  
                  return (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(selectedCity === city ? '' : city)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                        selectedCity === city
                          ? 'bg-[var(--accent-pink)] text-white shadow-md'
                          : 'bg-[var(--filter-button-bg)] text-[var(--filter-button-text)] border border-[var(--filter-button-border)] hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></span>
                      <Image 
                        src={flagUrl} 
                        alt={`${cityCountry} flag`}
                        width={20}
                        height={16}
                        className="object-cover rounded-sm flex-shrink-0"
                        unoptimized
                      />
                      <span className="flex-1 truncate">{city}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        selectedCity === city
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {cityCount}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">{t('home.detectingLocation')}</p>
          </div>
        ) : (
          <>
            {userLocation && (
              <p className="text-xs sm:text-sm text-[var(--text-tertiary)] mb-3 sm:mb-6 px-1 transition-colors">
                {t('home.showingClosest')}
                {userLocation.city && ` (${userLocation.city}${userLocation.country ? `, ${userLocation.country}` : ''})`}
              </p>
            )}

            {filteredModels.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[var(--text-secondary)] transition-colors">{t('home.noModelsFound')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
                {filteredModels.map((model) => {
                  const currentImageIndex = imageIndices[model.id] || 0
                  const images = model.images || [model.image]
                  const currentImage = images[currentImageIndex] || model.image
                  const hasMultipleImages = images.length > 1

                  const handlePrevious = (e: React.MouseEvent) => {
                    e.stopPropagation()
                    const newIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
                    setImageIndices({ ...imageIndices, [model.id]: newIndex })
                  }

                  const handleNext = (e: React.MouseEvent) => {
                    e.stopPropagation()
                    const newIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
                    setImageIndices({ ...imageIndices, [model.id]: newIndex })
                  }

                  return (
                    <div
                      key={model.id}
                      onClick={() => router.push(`/ad/${model.id}`)}
                      className={`${theme === 'dark' ? '' : 'border-2 border-[var(--profile-border)] hover:border-[var(--accent-pink)]'} transition-colors bg-[var(--bg-secondary)] overflow-hidden group cursor-pointer rounded-lg`}
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-[var(--bg-tertiary)] relative">
                        <Image
                          src={currentImage}
                          alt={model.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 25vw"
                          unoptimized
                          draggable={false}
                          priority={false}
                        />
                        {hasMultipleImages && (
                          <>
                            <button
                              onClick={handlePrevious}
                              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 sm:p-2 rounded-full transition-colors z-10"
                              aria-label="Previous image"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleNext}
                              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 sm:p-2 rounded-full transition-colors z-10"
                              aria-label="Next image"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 sm:gap-1 z-10">
                              {images.map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`h-0.5 sm:h-1 rounded-full transition-all ${
                                    idx === currentImageIndex ? 'bg-pink-400 w-3 sm:w-4' : 'bg-white/50 w-0.5 sm:w-1'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="p-2 sm:p-4 font-body">
                        <h3 className="text-sm sm:text-lg font-semibold mb-0.5 sm:mb-1 tracking-tight">
                          {model.name} <span className="text-gray-400 text-xs sm:text-base font-normal">{model.age}</span>
                        </h3>
                        <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1 font-light">{model.city}, {model.country}</p>
                        {model.distance !== undefined && (
                          <p className="text-gray-500 text-[10px] sm:text-xs mt-1 sm:mt-2 font-light">
                            {model.distance.toFixed(1)} {t('home.kmAway')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </main>
  )
}

export default function Home() {
  const { t } = useLanguage()
  
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">{t('common.loading')}</p>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}

