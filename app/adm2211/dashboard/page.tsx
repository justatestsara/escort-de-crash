'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import {
  deleteAd as deleteAdFromSupabase,
  deleteContactSubmission,
  getAllAds,
  getAllContactSubmissions,
  updateAd,
  updateContactSubmission,
} from '../../../lib/supabase-ads'
import type { Ad, ContactSubmission } from '../../../lib/supabase-ads'

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

    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || file), 'image/webp', 0.8)
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
}

const GENDER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'female', label: 'Female' },
  { key: 'male', label: 'Male' },
  { key: 'trans', label: 'Trans' },
  { key: 'luxury', label: 'Luxury / High End' },
  { key: 'webcam', label: 'Webcam' },
] as const

type GenderFilterKey = (typeof GENDER_FILTERS)[number]['key']

function normalizeGender(gender: unknown): Exclude<GenderFilterKey, 'all'> | 'unknown' {
  const raw = String(gender || '').trim().toLowerCase()
  if (!raw) return 'unknown'
  if (raw === 'girls') return 'female'
  if (raw === 'guys') return 'male'
  if (raw === 'female' || raw === 'male' || raw === 'trans' || raw === 'webcam') return raw
  if (raw === 'luxury' || raw === 'luxury/high end' || raw === 'luxury-high-end' || raw === 'high end' || raw === 'high-end') return 'luxury'
  return 'unknown'
}

export default function AdminDashboard() {
  const router = useRouter()

  const [ads, setAds] = useState<Ad[]>([])
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)

  const [genderFilter, setGenderFilter] = useState<GenderFilterKey>('all')

  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Ad>>({})

  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

  const pendingAds = useMemo(() => ads.filter((a) => a.status === 'pending'), [ads])
  const approvedAds = useMemo(() => ads.filter((a) => a.status === 'approved'), [ads])
  const inactiveAds = useMemo(() => ads.filter((a) => a.status === 'inactive'), [ads])

  const applyGenderFilter = (list: Ad[]) => {
    if (genderFilter === 'all') return list
    return list.filter((a) => normalizeGender(a.gender) === genderFilter)
  }

  const filteredPendingAds = useMemo(() => applyGenderFilter(pendingAds), [pendingAds, genderFilter])
  const filteredApprovedAds = useMemo(() => applyGenderFilter(approvedAds), [approvedAds, genderFilter])
  const filteredInactiveAds = useMemo(() => applyGenderFilter(inactiveAds), [inactiveAds, genderFilter])

  const pendingContacts = useMemo(() => contactSubmissions.filter((c) => c.status === 'pending'), [contactSubmissions])
  const reviewedContacts = useMemo(() => contactSubmissions.filter((c) => c.status === 'reviewed'), [contactSubmissions])

  const stats = useMemo(
    () => ({
      live: approvedAds.length,
      pending: pendingAds.length,
      inactive: inactiveAds.length,
    }),
    [approvedAds.length, pendingAds.length, inactiveAds.length]
  )

  const loadAll = async () => {
    try {
      const [allAds, submissions] = await Promise.all([getAllAds(), getAllContactSubmissions()])
      setAds(allAds)
      setContactSubmissions(submissions)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true'
    if (!isLoggedIn) {
      router.push('/adm2211')
      return
    }

    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleLogout = () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('admin_logged_in')
    router.push('/adm2211')
  }

  const updateAdStatus = async (adId: string, status: Ad['status']) => {
    try {
      const result = await updateAd(adId, { status })
      if (!result) {
        alert('Failed to update ad status. Check console. If you see ERR_BLOCKED_BY_CLIENT, disable adblock/extension.')
        return
      }
      await loadAll()
    } catch (err: any) {
      console.error('Error updating ad status:', err)
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        alert('Network request was blocked (often ad blockers/extensions). Try incognito or disable extensions.')
      } else {
        alert('Error updating ad status. Check console (F12).')
      }
    }
  }

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return
    const success = await deleteAdFromSupabase(adId)
    if (!success) {
      alert('Failed to delete ad. Please try again.')
      return
    }
    setAds((prev) => prev.filter((a) => a.id !== adId))
  }

  const startEdit = (ad: Ad) => {
    setEditingAd(ad)
    setEditFormData({ ...ad })
    setImageUploadError(null)
  }

  const cancelEdit = () => {
    setEditingAd(null)
    setEditFormData({})
    setImageUploadError(null)
  }

  const handleEditChange = <K extends keyof Ad>(field: K, value: Ad[K]) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
  }

  const saveEdit = async () => {
    if (!editingAd) return

    const updates: Partial<Ad> = { ...editFormData }
    if (typeof updates.age === 'number') updates.age = String(updates.age)

    const result = await updateAd(editingAd.id, updates)
    if (!result) {
      alert('Failed to save changes. Please try again (check console).')
      return
    }

    await loadAll()
    setEditingAd(null)
    setEditFormData({})
  }

  const markContactAsReviewed = async (id: string) => {
    const result = await updateContactSubmission(id, { status: 'reviewed' })
    if (!result) return
    setContactSubmissions((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'reviewed' } : c)))
  }

  const deleteContact = async (id: string) => {
    if (!confirm('Delete this contact message?')) return
    const ok = await deleteContactSubmission(id)
    if (!ok) {
      alert('Failed to delete contact submission.')
      return
    }
    setContactSubmissions((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <header className="border-b border-[var(--border-primary)] sticky top-0 bg-[var(--bg-primary)]/95 backdrop-blur-sm z-50 transition-colors">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-2">
          <Link href="/" className="text-2xl font-header font-semibold tracking-wider text-[var(--header-color)]">
            ESCORT.DE
          </Link>
          <button onClick={handleLogout} className="px-4 py-2 border border-[var(--border-primary)] hover:border-[var(--accent-pink)] transition-colors">
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <h1 className="text-3xl font-semibold mb-8 text-[var(--text-primary)] transition-colors">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 transition-colors">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 transition-colors">Live Ads</h3>
            <p className="text-3xl font-bold text-green-500">{stats.live}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 transition-colors">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 transition-colors">Pending Approval</h3>
            <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 transition-colors">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 transition-colors">Inactive Ads</h3>
            <p className="text-3xl font-bold text-red-500">{stats.inactive}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 transition-colors">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 transition-colors">Contact Messages</h3>
            <p className="text-3xl font-bold text-blue-500">{pendingContacts.length}</p>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex flex-wrap gap-2 items-center">
            <p className="text-sm text-[var(--text-secondary)] mr-2">Filter by gender:</p>
            {GENDER_FILTERS.map((g) => {
              const active = g.key === genderFilter
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGenderFilter(g.key)}
                  className={
                    active
                      ? 'px-3 py-2 text-sm border border-[var(--accent-pink)] bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors'
                      : 'px-3 py-2 text-sm border border-[var(--border-primary)] hover:border-[var(--accent-pink)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors'
                  }
                >
                  {g.label}
                </button>
              )
            })}
          </div>
        </div>

        {pendingAds.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">
              Pending Approval ({filteredPendingAds.length}
              {genderFilter !== 'all' ? ` of ${pendingAds.length}` : ''})
            </h2>
            <div className="space-y-4">
              {filteredPendingAds.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">No ads match the selected gender filter.</p>}
              {filteredPendingAds.map((ad) => (
                <div key={ad.id} className="bg-[var(--bg-secondary)] border border-yellow-500/50 p-6 transition-colors">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      {ad.images && ad.images.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 w-32">
                            {ad.images.slice(0, 4).map((img, idx) => (
                              <div key={img + idx} className="aspect-[3/4] overflow-hidden rounded bg-[var(--bg-tertiary)]">
                                <img src={img} alt={`${ad.name} ${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                          {ad.images.length > 4 && (
                            <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">+{ad.images.length - 4} more</p>
                          )}
                        </>
                      ) : (
                        <div className="w-32 aspect-[3/4] rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--text-primary)] transition-colors">
                            {ad.name}, {ad.age} – {ad.gender}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)] transition-colors">
                            {ad.city}, {ad.country} • Submitted: {formatDate(ad.submittedAt)}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <button onClick={() => startEdit(ad)} className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => updateAdStatus(ad.id, 'approved')} className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors">
                            Approve
                          </button>
                          <button onClick={() => updateAdStatus(ad.id, 'inactive')} className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors">
                            Reject
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="text-[var(--text-secondary)] transition-colors">
                          <p>
                            <strong>Phone:</strong> {ad.phone}
                          </p>
                          {ad.email && (
                            <p>
                              <strong>Email:</strong> {ad.email}
                            </p>
                          )}
                          {ad.whatsapp && (
                            <p>
                              <strong>WhatsApp:</strong> {ad.whatsapp}
                            </p>
                          )}
                        </div>
                        <div className="text-[var(--text-secondary)] transition-colors">
                          {ad.hairColor && (
                            <p>
                              <strong>Hair Color:</strong> {ad.hairColor}
                            </p>
                          )}
                          {ad.languages && ad.languages.length > 0 && (
                            <p>
                              <strong>Languages:</strong> {ad.languages.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-[var(--text-secondary)] transition-colors">
                          <strong>Description:</strong>
                        </p>
                        <p className="text-[var(--text-primary)] mt-1 transition-colors">{ad.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {approvedAds.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">
              Approved Ads ({filteredApprovedAds.length}
              {genderFilter !== 'all' ? ` of ${approvedAds.length}` : ''})
            </h2>
            <div className="space-y-4">
              {filteredApprovedAds.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">No ads match the selected gender filter.</p>}
              {filteredApprovedAds.map((ad) => (
                <div key={ad.id} className="bg-[var(--bg-secondary)] border border-green-500/50 p-6 transition-colors">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      {ad.images && ad.images.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 w-32">
                            {ad.images.slice(0, 4).map((img, idx) => (
                              <div key={img + idx} className="aspect-[3/4] overflow-hidden rounded bg-[var(--bg-tertiary)]">
                                <img src={img} alt={`${ad.name} ${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                          {ad.images.length > 4 && (
                            <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">+{ad.images.length - 4} more</p>
                          )}
                        </>
                      ) : (
                        <div className="w-32 aspect-[3/4] rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--text-primary)] transition-colors">
                            {ad.name}, {ad.age} – {ad.gender}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)] transition-colors">
                            {ad.city}, {ad.country} • {formatDate(ad.submittedAt)}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <button onClick={() => startEdit(ad)} className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => updateAdStatus(ad.id, 'inactive')} className="px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600 transition-colors">
                            Deactivate
                          </button>
                          <button onClick={() => handleDeleteAd(ad.id)} className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {inactiveAds.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">
              Inactive Ads ({filteredInactiveAds.length}
              {genderFilter !== 'all' ? ` of ${inactiveAds.length}` : ''})
            </h2>
            <div className="space-y-4">
              {filteredInactiveAds.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">No ads match the selected gender filter.</p>}
              {filteredInactiveAds.map((ad) => (
                <div key={ad.id} className="bg-[var(--bg-secondary)] border border-red-500/50 p-6 transition-colors">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      {ad.images && ad.images.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 w-32">
                            {ad.images.slice(0, 4).map((img, idx) => (
                              <div key={img + idx} className="aspect-[3/4] overflow-hidden rounded bg-[var(--bg-tertiary)]">
                                <img src={img} alt={`${ad.name} ${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                          {ad.images.length > 4 && (
                            <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">+{ad.images.length - 4} more</p>
                          )}
                        </>
                      ) : (
                        <div className="w-32 aspect-[3/4] rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--text-primary)] transition-colors">
                            {ad.name}, {ad.age} – {ad.gender}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)] transition-colors">
                            {ad.city}, {ad.country} • {formatDate(ad.submittedAt)}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <button onClick={() => startEdit(ad)} className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => updateAdStatus(ad.id, 'approved')} className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors">
                            Reactivate
                          </button>
                          <button onClick={() => handleDeleteAd(ad.id)} className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pendingContacts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">
              Pending Contact Messages ({pendingContacts.length})
            </h2>
            <div className="space-y-4">
              {pendingContacts.map((c) => (
                <div key={c.id} className="bg-[var(--bg-secondary)] border border-blue-500/50 p-6 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--text-primary)] transition-colors">{c.subject}</h3>
                      <p className="text-sm text-[var(--text-secondary)] transition-colors">
                        From: {c.name} • {formatDate(c.submittedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <button onClick={() => markContactAsReviewed(c.id)} className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors">
                        Mark Reviewed
                      </button>
                      <button onClick={() => deleteContact(c.id)} className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-[var(--text-primary)] transition-colors">{c.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {reviewedContacts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">
              Reviewed Contact Messages ({reviewedContacts.length})
            </h2>
            <div className="space-y-4">
              {reviewedContacts.map((c) => (
                <div key={c.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] opacity-60 p-6 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--text-primary)] transition-colors">{c.subject}</h3>
                      <p className="text-sm text-[var(--text-secondary)] transition-colors">
                        From: {c.name} • {formatDate(c.submittedAt)}
                      </p>
                    </div>
                    <button onClick={() => deleteContact(c.id)} className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors">
                      Delete
                    </button>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-[var(--text-primary)] transition-colors">{c.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {ads.length === 0 && contactSubmissions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[var(--text-secondary)] text-lg">No submissions yet.</p>
          </div>
        )}
      </div>

      {editingAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] transition-colors">Edit Ad: {editingAd.name}</h2>
                <button onClick={cancelEdit} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Name *</label>
                    <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Age *</label>
                    <input
                      type="text"
                      value={(editFormData.age as any) || ''}
                      onChange={(e) => handleEditChange('age', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Gender *</label>
                    <select
                      value={editFormData.gender || 'female'}
                      onChange={(e) => handleEditChange('gender', e.target.value as any)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="trans">Trans</option>
                      <option value="luxury_escort">Luxury/High End</option>
                      <option value="webcam">Webcam</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">City *</label>
                    <input
                      type="text"
                      value={editFormData.city || ''}
                      onChange={(e) => handleEditChange('city', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Country *</label>
                    <input
                      type="text"
                      value={editFormData.country || ''}
                      onChange={(e) => handleEditChange('country', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Phone *</label>
                    <input
                      type="text"
                      value={editFormData.phone || ''}
                      onChange={(e) => handleEditChange('phone', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">WhatsApp</label>
                    <input
                      type="text"
                      value={editFormData.whatsapp || ''}
                      onChange={(e) => handleEditChange('whatsapp', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Telegram</label>
                    <input
                      type="text"
                      value={editFormData.telegram || ''}
                      onChange={(e) => handleEditChange('telegram', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Instagram</label>
                    <input
                      type="text"
                      value={editFormData.instagram || ''}
                      onChange={(e) => handleEditChange('instagram', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Twitter</label>
                    <input
                      type="text"
                      value={editFormData.twitter || ''}
                      onChange={(e) => handleEditChange('twitter', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Hair Color</label>
                    <input
                      type="text"
                      value={editFormData.hairColor || ''}
                      onChange={(e) => handleEditChange('hairColor', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Description *</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => handleEditChange('description', e.target.value as any)}
                    rows={6}
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Languages (comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editFormData.languages) ? editFormData.languages.join(', ') : ''}
                    onChange={(e) =>
                      handleEditChange(
                        'languages',
                        e.target.value
                          .split(',')
                          .map((l) => l.trim())
                          .filter((l) => l)
                      )
                    }
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                    placeholder="German, English, French"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Upload Images (WebP)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploadingImages}
                    onChange={async (e) => {
                      const files = e.target.files
                      if (!files) return

                      setIsUploadingImages(true)
                      setImageUploadError(null)

                      const uploaded: string[] = []
                      const maxImages = 10
                      const currentCount = Array.isArray(editFormData.images) ? editFormData.images.length : 0
                      const remaining = Math.max(0, maxImages - currentCount)

                      try {
                        for (const file of Array.from(files).slice(0, remaining)) {
                          if (!file.type.startsWith('image/')) continue

                          const webpBlob = await fileToWebpBlob(file)
                          const key = `ads/${safeUuid()}.webp`

                          const { error: uploadError } = await supabase.storage.from('ad-images').upload(key, webpBlob, {
                            contentType: 'image/webp',
                            upsert: false,
                          })
                          if (uploadError) throw uploadError

                          const { data } = supabase.storage.from('ad-images').getPublicUrl(key)
                          if (data?.publicUrl) uploaded.push(data.publicUrl)
                        }

                        if (uploaded.length > 0) {
                          handleEditChange('images', [
                            ...((editFormData.images as any) || []),
                            ...uploaded,
                          ] as any)
                        }
                      } catch (err: any) {
                        console.error('Admin image upload error:', err)
                        setImageUploadError(err?.message || 'Failed to upload images')
                      } finally {
                        setIsUploadingImages(false)
                        e.currentTarget.value = ''
                      }
                    }}
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                  />
                  {isUploadingImages && <p className="text-xs text-[var(--text-tertiary)] mt-2">Uploading & converting images…</p>}
                  {imageUploadError && <p className="text-xs text-red-500 mt-2">{imageUploadError}</p>}
                </div>

                {editFormData.images && editFormData.images.length > 0 && (
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Current Images ({editFormData.images.length})</label>
                    <div className="grid grid-cols-4 gap-2">
                      {editFormData.images.map((img, idx) => (
                        <div key={img + idx} className="aspect-[3/4] overflow-hidden rounded bg-[var(--bg-tertiary)] relative group">
                          <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => {
                              const next = [...(editFormData.images || [])]
                              next.splice(idx, 1)
                              handleEditChange('images', next as any)
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-[var(--border-primary)]">
                  <button onClick={saveEdit} className="px-6 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors" type="button">
                    Save Changes
                  </button>
                  <button onClick={cancelEdit} className="px-6 py-2 bg-gray-500 text-white hover:bg-gray-600 transition-colors" type="button">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
