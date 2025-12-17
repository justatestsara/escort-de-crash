'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '../providers'

export default function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    // Check if already logged in
    if (typeof window !== 'undefined') {
      const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true'
      if (isLoggedIn) {
        router.push('/adm2211/dashboard')
      }
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (username === 'admin' && password === 'Escort123#888') {
      sessionStorage.setItem('admin_logged_in', 'true')
      router.push('/adm2211/dashboard')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-header font-semibold tracking-wider text-[var(--header-color)] block mb-2">
            ESCORT.DE
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mt-4">Admin Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--bg-secondary)] p-8 border border-[var(--border-primary)] transition-colors">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-[var(--text-secondary)] mb-2 transition-colors">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-pink)] text-[var(--text-primary)] transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-[var(--accent-pink)] text-white hover:opacity-90 transition-opacity font-medium"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}

