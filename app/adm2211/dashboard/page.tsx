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

type GenderFilter = 'all' | Ad['gender']

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

function Thumbnails({ images, name }: { images?: string[] | null; name: string }) {
  if (!images || images.length === 0) {
    return (
      <div className="w-32 aspect-[3/4] flex items-center justify-center rounded bg-[var(--bg-tertiary)] text-xs text-[var(--text-tertiary)]">
        No image
      </div>
    )
  }

  return (
    <div className="flex-shrink-0">
      <div className="grid grid-cols-2 gap-2 w-32">
        {images.slice(0, 4).map((img, idx) => (
          <div key={img + idx} className="aspect-[3/4] overflow-hidden rounded bg-[var(--bg-tertiary)]">
            <img src={img} alt={`${name} ${idx + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {images.length > 4 && <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">+{images.length - 4} more</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()

  const [ads, setAds] = useState<Ad[]>([])
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)

  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')

  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Ad>>({})

  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

  const pendingAds = useMemo(() => ads.filter((a) => a.status === 'pending'), [ads])
  const approvedAds = useMemo(() => ads.filter((a) => a.status === 'approved'), [ads])
  const inactiveAds = useMemo(() => ads.filter((a) => a.status === 'inactive'), [ads])

  const genderCounts = useMemo(() => {
    const counts: Record<GenderFilter, number> = {
      all: ads.length,
      female: 0,
      male: 0,
      trans: 0,
      luxury_escort: 0,
      webcam: 0,
    }
    for (const a of ads) counts[a.gender] = (counts[a.gender] || 0) + 1
    return counts
  }, [ads])

  const matchesGender = useMemo(() => {
    return (ad: Ad) => (genderFilter === 'all' ? true : ad.gender === genderFilter)
  }, [genderFilter])

  const filteredPendingAds = useMemo(() => pendingAds.filter(matchesGender), [pendingAds, matchesGender])
  const filteredApprovedAds = useMemo(() => approvedAds.filter(matchesGender), [approvedAds, matchesGender])
  const filteredInactiveAds = useMemo(() => inactiveAds.filter(matchesGender), [inactiveAds, matchesGender])

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
    const result = await updateAd(adId, { status })
    if (!result) return
    await loadAll()
  }

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return
    const success = await deleteAdFromSupabase(adId)
    if (!success) return
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
    if (!result) return
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
    if (!ok) return
    setContactSubmissions((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading…</p>
      </main>
    )
  }

  const sectionEmpty = <p className="text-sm text-[var(--text-tertiary)]">No ads match the selected gender filter.</p>

  const tabs: Array<{ key: GenderFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'female', label: 'Female' },
    { key: 'male', label: 'Male' },
    { key: 'trans', label: 'Trans' },
    { key: 'luxury_escort', label: 'Luxury/High End' },
    { key: 'webcam', label: 'Webcam' },
  ]

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
        <h1 className="text-3xl font-semibold mb-6 text-[var(--text-primary)] transition-colors">Admin Dashboard</h1>

        <div className="mb-8">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Filter by Gender</h2>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = genderFilter === t.key
              const cls = active
                ? 'px-3 py-2 rounded-lg text-sm font-medium border transition-colors bg-[var(--accent-pink)] text-white border-[var(--accent-pink)]'
                : 'px-3 py-2 rounded-lg text-sm font-medium border transition-colors bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-primary)] hover:border-[var(--accent-pink)]'
              const count = genderCounts[t.key] || 0
              return (
                <button key={t.key} onClick={() => setGenderFilter(t.key)} className={cls} type="button">
                  {t.label}{' '}
                  <span className={active ? 'text-white/90' : 'text-[var(--text-tertiary)]'}>({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {pendingAds.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 transition-colors">
              Pending Approval ({filteredPendingAds.length}{genderFilter === 'all' ? '' : ` / ${pendingAds.length}`})
            </h2>
            <div className="space-y-4">
              {filteredPendingAds.length === 0
                ? sectionEmpty
                : filteredPendingAds.map((ad) => (
                    <div key={ad.id} className="bg-[var(--bg-secondary)] border border-yellow-500/50 p-6 transition-colors">
                      <div className="flex gap-6">
                        <Thumbnails images={ad.images} name={ad.name} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-4">
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
              Approved Ads ({filteredApprovedAds.length}{genderFilter === 'all' ? '' : ` / ${approvedAds.length}`})
            </h2>
            <div className="space-y-4">
              {filteredApprovedAds.length === 0
                ? sectionEmpty
                : filteredApprovedAds.map((ad) => (
                    <div key={ad.id} className="bg-[var(--bg-secondary)] border border-green-500/50 p-6 transition-colors">
                      <div className="flex gap-6">
                        <Thumbnails images={ad.images} name={ad.name} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-4">
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
              Inactive Ads ({filteredInactiveAds.length}{genderFilter === 'all' ? '' : ` / ${inactiveAds.length}`})
            </h2>
            <div className="space-y-4">
              {filteredInactiveAds.length === 0
                ? sectionEmpty
                : filteredInactiveAds.map((ad) => (
                    <div key={ad.id} className="bg-[var(--bg-secondary)] border border-red-500/50 p-6 transition-colors">
                      <div className="flex gap-6">
                        <Thumbnails images={ad.images} name={ad.name} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-4">
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
      </div>

      {editingAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] transition-colors">Edit Ad: {editingAd.name}</h2>
                <button onClick={cancelEdit} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" type="button">
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Upload Images (WebP)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploadingImages}
                    onChange={async (e) => {
                      const inputEl = e.currentTarget
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
                          handleEditChange('images', [...(((editFormData.images as any) || []) as any[]), ...uploaded] as any)
                        }
                      } catch (err: any) {
                        console.error('Admin image upload error:', err)
                        setImageUploadError(err?.message || 'Failed to upload images')
                      } finally {
                        setIsUploadingImages(false)
                        if (inputEl) inputEl.value = ''
                      }
                    }}
                    className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] transition-colors"
                  />
                  {imageUploadError && <p className="text-xs text-red-500 mt-2">{imageUploadError}</p>}
                </div>

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
