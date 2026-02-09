'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'
type Language = 'en' | 'de'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

interface LanguageContextType {
  language: Language
  toggleLanguage: () => void
  t: (key: string) => string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation objects
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'header.light': 'Light',
    'header.dark': 'Dark',
    'header.postAd': 'Get Listed (FREE)',
    'header.backToHome': 'Back to Home',
    
    // Post Ad additional
    'postAd.remove': 'Remove',
    'postAd.addService': 'Add Service',
    'postAd.addRate': 'Add Rate',
    'postAd.action': 'Action',
    
    // Filters
    'filters.girls': 'Female',
    'filters.guys': 'Male',
    'filters.trans': 'Trans',
    'filters.countries': 'Countries',
    'filters.cities': 'Cities',
    
    // Home page
    'home.detectingLocation': 'Detecting your location...',
    'home.showingClosest': 'Showing models closest to your location',
    'home.noModelsFound': 'No models found matching your filters.',
    'home.kmAway': 'km away',
    
    // Post Ad page
    'postAd.title': 'Post Your Ad',
    'postAd.photos': 'Photos * (Minimum 3 required)',
    'postAd.addPhoto': 'Add Photo',
    'postAd.basicInfo': 'Basic Information',
    'postAd.name': 'Name *',
    'postAd.age': 'Age *',
    'postAd.gender': 'Gender *',
    'postAd.gender.female': 'Female',
    'postAd.gender.male': 'Male',
    'postAd.gender.trans': 'Trans',
    'postAd.hairColor': 'Hair Color',
    'postAd.languages': 'Languages (comma-separated)',
    'postAd.location': 'Location',
    'postAd.country': 'Country *',
    'postAd.city': 'City *',
    'postAd.contact': 'Contact Information',
    'postAd.phone': 'Phone',
    'postAd.whatsapp': 'WhatsApp',
    'postAd.telegram': 'Telegram',
    'postAd.email': 'Email',
    'postAd.socialMedia': 'Social Media',
    'postAd.instagram': 'Instagram',
    'postAd.twitter': 'Twitter',
    'postAd.about': 'About',
    'postAd.noAgencyBanner': 'No agency, No booking fees, you keep 100% of what you earn.',
    'postAd.whatsappCta': 'Questions? Message us on WhatsApp before you post.',
    'postAd.whatsappButton': 'WhatsApp Support',
    'postAd.description': 'Description *',
    'postAd.rates': 'Rates',
    'postAd.time': 'Time',
    'postAd.incall': 'Incall',
    'postAd.outcall': 'Outcall',
    'postAd.services': 'Services',
    'postAd.service': 'Service',
    'postAd.included': 'Included',
    'postAd.extra': 'Extra',
    'postAd.submit': 'Submit Ad',
    'postAd.submitted': 'Thank you! Your ad submission has been received. We\'ll review it and contact you soon.',
    'postAd.nameRequired': 'Name is required',
    'postAd.ageRequired': 'Age is required',
    'postAd.ageInvalid': 'Age must be a valid number',
    'postAd.genderRequired': 'Gender is required',
    'postAd.countryRequired': 'Country is required',
    'postAd.cityRequired': 'City is required',
    'postAd.descriptionRequired': 'Description is required',
    'postAd.descriptionMinLength': 'Description must be at least 10 characters',
    'postAd.imagesRequired': 'At least 3 images are required',
    
    // Contact/Imprint page
    'contact.title': 'Contact Us',
    'contact.description': 'This website is operated by Escort.de. For legal inquiries, reports, or feedback, please use the contact form below.',
    'contact.formTitle': 'Contact Form',
    'contact.name': 'Name',
    'contact.subject': 'Subject',
    'contact.message': 'Message',
    'contact.submit': 'Send Message',
    'contact.submitted': 'Thank you! Your message has been received. We\'ll review it and get back to you soon.',
    'contact.nameRequired': 'Name is required',
    'contact.subjectRequired': 'Subject is required',
    'contact.descriptionRequired': 'Description must be at least 10 characters',
    
    // Footer
    'footer.contactUs': 'Contact Us',
    'footer.copyright': '© 2025 Escort.de. All rights reserved.',
    
    // Ad detail page
    'ad.back': 'Back',
    'ad.about': 'About',
    'ad.contactInfo': 'Contact Information',
    'ad.phone': 'Phone',
    'ad.whatsapp': 'WhatsApp',
    'ad.telegram': 'Telegram',
    'ad.email': 'Email',
    'ad.socialMedia': 'Social Media',
    'ad.rates': 'Rates',
    'ad.services': 'Services',
    'ad.gender': 'Gender',
    'ad.age': 'Age',
    'ad.hairColor': 'Hair Color',
    'ad.languages': 'Languages',
    'ad.notFound': 'Ad not found.',
    
    // Common
    'common.loading': 'Loading...',
  },
  de: {
    // Header
    'header.light': 'Hell',
    'header.dark': 'Dunkel',
    'header.postAd': 'Dein Listing (FREE)',
    'header.backToHome': 'Zurück zur Startseite',
    
    // Post Ad additional
    'postAd.remove': 'Entfernen',
    'postAd.addService': 'Dienstleistung hinzufügen',
    'postAd.addRate': 'Preis hinzufügen',
    'postAd.action': 'Aktion',
    
    // Filters
    'filters.girls': 'Frauen',
    'filters.guys': 'Männer',
    'filters.trans': 'Trans',
    'filters.countries': 'Länder',
    'filters.cities': 'Städte',
    
    // Home page
    'home.detectingLocation': 'Ihr Standort wird erkannt...',
    'home.showingClosest': 'Anzeige der Modelle in Ihrer Nähe',
    'home.noModelsFound': 'Keine Modelle gefunden, die Ihren Filtern entsprechen.',
    'home.kmAway': 'km entfernt',
    
    // Post Ad page
    'postAd.title': 'Anzeige aufgeben',
    'postAd.photos': 'Fotos * (Mindestens 3 erforderlich)',
    'postAd.addPhoto': 'Foto hinzufügen',
    'postAd.basicInfo': 'Grundinformationen',
    'postAd.name': 'Name *',
    'postAd.age': 'Alter *',
    'postAd.gender': 'Geschlecht *',
    'postAd.gender.female': 'Weiblich',
    'postAd.gender.male': 'Männlich',
    'postAd.gender.trans': 'Trans',
    'postAd.hairColor': 'Haarfarbe',
    'postAd.languages': 'Sprachen (durch Komma getrennt)',
    'postAd.location': 'Standort',
    'postAd.country': 'Land *',
    'postAd.city': 'Stadt *',
    'postAd.contact': 'Kontaktinformationen',
    'postAd.phone': 'Telefon',
    'postAd.whatsapp': 'WhatsApp',
    'postAd.telegram': 'Telegram',
    'postAd.email': 'E-Mail',
    'postAd.socialMedia': 'Soziale Medien',
    'postAd.instagram': 'Instagram',
    'postAd.twitter': 'Twitter',
    'postAd.about': 'Über mich',
    'postAd.noAgencyBanner': 'Keine Agentur, keine Fees – du behältst 100% von dem, was du verdienst.',
    'postAd.whatsappCta': 'Fragen? Schreib uns auf WhatsApp, bevor du postest.',
    'postAd.whatsappButton': 'WhatsApp Support',
    'postAd.description': 'Beschreibung *',
    'postAd.rates': 'Preise',
    'postAd.time': 'Zeit',
    'postAd.incall': 'Incall',
    'postAd.outcall': 'Outcall',
    'postAd.services': 'Dienstleistungen',
    'postAd.service': 'Dienstleistung',
    'postAd.included': 'Inklusive',
    'postAd.extra': 'Extra',
    'postAd.submit': 'Anzeige absenden',
    'postAd.submitted': 'Vielen Dank! Ihre Anzeige wurde erhalten. Wir werden sie überprüfen und uns bald bei Ihnen melden.',
    'postAd.nameRequired': 'Name ist erforderlich',
    'postAd.ageRequired': 'Alter ist erforderlich',
    'postAd.ageInvalid': 'Alter muss eine gültige Zahl sein',
    'postAd.genderRequired': 'Geschlecht ist erforderlich',
    'postAd.countryRequired': 'Land ist erforderlich',
    'postAd.cityRequired': 'Stadt ist erforderlich',
    'postAd.descriptionRequired': 'Beschreibung ist erforderlich',
    'postAd.descriptionMinLength': 'Beschreibung muss mindestens 10 Zeichen lang sein',
    'postAd.imagesRequired': 'Mindestens 3 Bilder sind erforderlich',
    
    // Contact/Imprint page
    'contact.title': 'Kontaktieren Sie uns',
    'contact.description': 'Diese Website wird von Escort.de betrieben. Für rechtliche Anfragen, Meldungen oder Feedback verwenden Sie bitte das untenstehende Kontaktformular.',
    'contact.formTitle': 'Kontaktformular',
    'contact.name': 'Name',
    'contact.subject': 'Betreff',
    'contact.message': 'Nachricht',
    'contact.submit': 'Nachricht senden',
    'contact.submitted': 'Vielen Dank! Ihre Nachricht wurde erhalten. Wir werden sie überprüfen und uns bald bei Ihnen melden.',
    'contact.nameRequired': 'Name ist erforderlich',
    'contact.subjectRequired': 'Betreff ist erforderlich',
    'contact.descriptionRequired': 'Beschreibung muss mindestens 10 Zeichen lang sein',
    
    // Footer
    'footer.contactUs': 'Kontaktieren Sie uns',
    'footer.copyright': '© 2025 Escort.de. Alle Rechte vorbehalten.',
    
    // Ad detail page
    'ad.back': 'Zurück',
    'ad.about': 'Über mich',
    'ad.contactInfo': 'Kontaktinformationen',
    'ad.phone': 'Telefon',
    'ad.whatsapp': 'WhatsApp',
    'ad.telegram': 'Telegram',
    'ad.email': 'E-Mail',
    'ad.socialMedia': 'Soziale Medien',
    'ad.rates': 'Preise',
    'ad.services': 'Dienstleistungen',
    'ad.gender': 'Geschlecht',
    'ad.age': 'Alter',
    'ad.hairColor': 'Haarfarbe',
    'ad.languages': 'Sprachen',
    'ad.notFound': 'Anzeige nicht gefunden.',
    
    // Common
    'common.loading': 'Laden...',
  },
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme)
      document.documentElement.classList.toggle('light', theme === 'light')
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('de')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedLanguage = localStorage.getItem('language') as Language | null
    if (savedLanguage) {
      setLanguage(savedLanguage)
    } else {
      // Default to German
      setLanguage('de')
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('language', language)
      document.documentElement.lang = language
    }
  }, [language, mounted])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'de' : 'en')
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

