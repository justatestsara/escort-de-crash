'use client'

import { useState } from 'react'
import { migrateLocalStorageToSupabase } from '../../lib/migrate-localstorage'

export default function MigratePage() {
  const [migrating, setMigrating] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])

  const handleMigrate = async () => {
    if (!confirm('This will migrate all ads and contact submissions from localStorage to Supabase. Continue?')) {
      return
    }

    setMigrating(true)
    setStatus('Starting migration...')
    setLogs([])

    // Override console.log to capture logs
    const originalLog = console.log
    const originalError = console.error
    const capturedLogs: string[] = []

    console.log = (...args: any[]) => {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
      capturedLogs.push(message)
      setLogs([...capturedLogs])
      originalLog(...args)
    }

    console.error = (...args: any[]) => {
      const message = 'ERROR: ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
      capturedLogs.push(message)
      setLogs([...capturedLogs])
      originalError(...args)
    }

    try {
      await migrateLocalStorageToSupabase()
      setStatus('Migration completed successfully!')
    } catch (error: any) {
      setStatus(`Migration failed: ${error.message}`)
      console.error('Migration error:', error)
    } finally {
      console.log = originalLog
      console.error = originalError
      setMigrating(false)
    }
  }

  // Check localStorage data
  const checkLocalStorage = () => {
    if (typeof window === 'undefined') return { ads: 0, contacts: 0 }
    
    const ads = localStorage.getItem('submitted_ads')
    const contacts = localStorage.getItem('contact_submissions')
    
    return {
      ads: ads ? JSON.parse(ads).length : 0,
      contacts: contacts ? JSON.parse(contacts).length : 0,
    }
  }

  const data = typeof window !== 'undefined' ? checkLocalStorage() : { ads: 0, contacts: 0 }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold mb-6">Migrate to Supabase</h1>
        
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Data Found</h2>
          <div className="space-y-2">
            <p>Ads in localStorage: <strong>{data.ads}</strong></p>
            <p>Contact submissions in localStorage: <strong>{data.contacts}</strong></p>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-lg mb-6">
          <p className="text-sm">
            <strong>Important:</strong> Make sure you have:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm space-y-1">
            <li>Set up your Supabase project</li>
            <li>Created the database tables (see SUPABASE_SETUP.md)</li>
            <li>Added your Supabase credentials to .env.local</li>
            <li>Restarted your dev server after adding environment variables</li>
          </ul>
        </div>

        <button
          onClick={handleMigrate}
          disabled={migrating || (data.ads === 0 && data.contacts === 0)}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            migrating || (data.ads === 0 && data.contacts === 0)
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-[var(--accent-pink)] hover:opacity-90'
          } text-white`}
        >
          {migrating ? 'Migrating...' : 'Start Migration'}
        </button>

        {status && (
          <div className={`mt-6 p-4 rounded-lg ${
            status.includes('failed') || status.includes('ERROR')
              ? 'bg-red-500/10 border border-red-500/50'
              : 'bg-green-500/10 border border-green-500/50'
          }`}>
            <p className="font-semibold">{status}</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Migration Logs:</h3>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {logs.map((log, index) => (
                <p key={index} className="text-xs font-mono">{log}</p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-[var(--text-secondary)]">
          <p>After migration is complete, you can clear localStorage if desired. The data is now safely stored in Supabase.</p>
        </div>
      </div>
    </main>
  )
}


