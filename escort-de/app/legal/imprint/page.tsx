'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme, useLanguage } from '../../providers'
import Footer from '../../components/Footer'
import LanguageSwitcher from '../../components/LanguageSwitcher'

interface ContactSubmission {
  id: string
  name: string
  subject: string
  description: string
  submittedAt: string
  status: 'pending' | 'reviewed'
}

export default function Imprint() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('contact.nameRequired')
    }
    if (!formData.subject.trim()) {
      newErrors.subject = t('contact.subjectRequired')
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = t('contact.descriptionRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    // Save submission to localStorage
    const newSubmission: ContactSubmission = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      subject: formData.subject.trim(),
      description: formData.description.trim(),
      submittedAt: new Date().toISOString(),
      status: 'pending',
    }

    // Get existing submissions from localStorage
    const existingSubmissions = typeof window !== 'undefined' ? localStorage.getItem('contact_submissions') : null
    const submissions = existingSubmissions ? JSON.parse(existingSubmissions) : []
    submissions.push(newSubmission)
    localStorage.setItem('contact_submissions', JSON.stringify(submissions))

    setSubmitted(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        name: '',
        subject: '',
        description: '',
      })
      setErrors({})
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

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
        <h1 className="text-3xl font-header font-semibold mb-4 text-[var(--text-primary)] transition-colors">{t('contact.title')}</h1>
        
        <div className="mb-8 text-[var(--text-secondary)] transition-colors">
          <p className="mb-4">
            {t('contact.description')}
          </p>
        </div>

        <div className="border-t border-[var(--border-primary)] pt-8 transition-colors">
          <h2 className="text-2xl font-header font-semibold mb-6 text-[var(--text-primary)] transition-colors">{t('contact.formTitle')}</h2>

          {submitted ? (
            <div className="border border-green-500 bg-green-500/10 p-6 mb-6">
              <p className="text-green-600 dark:text-green-400 transition-colors">
                {t('contact.submitted')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                  {t('contact.name')} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.name ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                  placeholder="Your name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                  {t('contact.subject')} *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.subject ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors`}
                  placeholder="Subject of your message"
                />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
                  {t('contact.message')} *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={8}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border ${errors.description ? 'border-red-500' : 'border-[var(--border-primary)]'} focus:outline-none focus:border-[var(--accent-pink)] resize-none text-[var(--text-primary)] transition-colors`}
                  placeholder="Please describe your inquiry, report, or feedback..."
                />
                <p className={`text-xs mt-1 ${formData.description.length < 10 ? 'text-red-500' : 'text-[var(--text-tertiary)]'} transition-colors`}>
                  {formData.description.length}/10 characters minimum
                </p>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity font-medium"
              >
                {t('contact.submit')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  )
}

