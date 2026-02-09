import { supabase } from './supabase'

export interface Ad {
  id: string
  public_id?: number | null
  name: string
  age: string | number
  gender: 'female' | 'male' | 'trans'
  city: string
  country: string
  phone: string
  email?: string
  whatsapp?: string
  telegram?: string
  instagram?: string
  twitter?: string
  hairColor?: string
  languages?: string[]
  description: string
  services?: Array<{ name: string; included: boolean; extraPrice?: number }>
  rates?: Array<{ time: string; incall: number; outcall: number }>
  images?: string[]
  status: 'pending' | 'approved' | 'inactive'
  submittedAt: string
}

function isAllowedGender(g: unknown): g is Ad['gender'] {
  return g === 'female' || g === 'male' || g === 'trans'
}

export interface ContactSubmission {
  id: string
  name: string
  subject: string
  description: string
  submittedAt: string
  status: 'pending' | 'reviewed'
}

// Ads functions
export async function getAllAds(): Promise<Ad[]> {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .order('submittedAt', { ascending: false })
  
  if (error) {
    console.error('Error fetching ads:', error)
    return []
  }
  
  const rows = (data || []) as any[]
  return rows.filter((r) => isAllowedGender(r?.gender))
}

export async function getApprovedAds(): Promise<Ad[]> {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'approved')
    .order('submittedAt', { ascending: false })
  
  if (error) {
    console.error('Error fetching approved ads:', error)
    return []
  }
  
  const rows = (data || []) as any[]
  return rows.filter((r) => isAllowedGender(r?.gender))
}

type ApprovedListingFilters = {
  gender?: string
  country?: string
  city?: string
  limit?: number
}

/**
 * Lightweight query for listing pages (home / gender / country / city).
 * Avoids `select('*')` and supports filtering so pages don't fetch all ads.
 */
export async function getApprovedAdsForListing(filters: ApprovedListingFilters = {}): Promise<Pick<
  Ad,
  'id' | 'name' | 'age' | 'gender' | 'city' | 'country' | 'images' | 'description' | 'submittedAt'
>[]> {
  let q = supabase
    .from('ads')
    .select('id,name,age,gender,city,country,images,description,submittedAt')
    .eq('status', 'approved')
    .order('submittedAt', { ascending: false })

  if (filters.gender) q = q.eq('gender', filters.gender)
  // Use case-insensitive matching for location to be resilient to capitalization differences.
  // Also allow trailing whitespace in stored values (use a "starts with" pattern).
  const country = (filters.country || '').trim()
  const city = (filters.city || '').trim()
  if (country) q = q.ilike('country', `${country}%`)
  if (city) q = q.ilike('city', `${city}%`)
  if (filters.limit) q = q.limit(filters.limit)

  const { data, error } = await q

  if (error) {
    console.error('Error fetching approved ads for listing:', error)
    return []
  }

  const rows = (data || []) as any[]
  return rows.filter((r) => isAllowedGender(r?.gender))
}

type ApprovedLocationFacetFilters = {
  gender: string
  country: string
  limit?: number
}

/**
 * Lightweight location facets for navigation (e.g. show all cities in a country)
 * without loading full ad payloads.
 */
export async function getApprovedCityFacets(filters: ApprovedLocationFacetFilters): Promise<Array<{ city: string }>> {
  const country = (filters.country || '').trim()

  let q = supabase
    .from('ads')
    .select('city')
    .eq('status', 'approved')
    .eq('gender', filters.gender)
    .order('submittedAt', { ascending: false })

  // Allow trailing whitespace in stored values.
  if (country) q = q.ilike('country', `${country}%`)
  if (filters.limit) q = q.limit(filters.limit)

  const { data, error } = await q

  if (error) {
    console.error('Error fetching approved city facets:', error)
    return []
  }

  return ((data || []) as any[])
    .map((r) => ({ city: String(r?.city || '').trim() }))
    .filter((r) => r.city.length > 0)
}

/**
 * Minimal query for sitemap generation.
 */
export async function getApprovedAdsForSitemap(): Promise<Pick<Ad, 'id' | 'submittedAt' | 'gender' | 'country' | 'city'>[]> {
  const { data, error } = await supabase
    .from('ads')
    .select('id,submittedAt,gender,country,city')
    .eq('status', 'approved')
    .order('submittedAt', { ascending: false })

  if (error) {
    console.error('Error fetching approved ads for sitemap:', error)
    return []
  }

  const rows = (data || []) as any[]
  return rows.filter((r) => isAllowedGender(r?.gender))
}

export async function getAdById(id: string): Promise<Ad | null> {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single()
  
  if (error) {
    console.error('Error fetching ad:', error)
    return null
  }
  
  if (!data) return null
  if (!isAllowedGender((data as any)?.gender)) return null
  return data as any
}

/**
 * Fetch an approved ad by either internal `id` or numeric `public_id`.
 * - If `identifier` is numeric (e.g. "12345"), we try `public_id` first.
 * - Otherwise we fetch by `id`.
 *
 * This keeps legacy routes and canonical routes working while URLs migrate.
 */
export async function getAdByIdentifier(identifier: string): Promise<Ad | null> {
  const raw = (identifier || '').trim()
  if (!raw) return null

  const isNumeric = /^\d+$/.test(raw)

  if (isNumeric) {
    const publicId = Number(raw)
    if (Number.isFinite(publicId)) {
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('public_id', publicId)
          .eq('status', 'approved')
          .single()

        if (!error && data && isAllowedGender((data as any)?.gender)) return data as any
      } catch (e) {
        // If the column doesn't exist (older schema), fall back to id lookup.
        console.warn('getAdByIdentifier: public_id lookup failed, falling back to id', e)
      }
    }
  }

  return await getAdById(raw)
}

export async function createAd(ad: Omit<Ad, 'submittedAt'> | Ad): Promise<Ad | null> {
  // Ensure id and submittedAt are set, and format data for Supabase
  const newAd: any = {
    ...ad,
    id: ad.id || `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    submittedAt: (ad as Ad).submittedAt || new Date().toISOString(),
    // Ensure age is a string (Supabase expects TEXT)
    age: typeof ad.age === 'number' ? String(ad.age) : ad.age,
    // Ensure JSONB fields are properly formatted
    languages: ad.languages || null,
    services: ad.services || null,
    rates: ad.rates || null,
    images: ad.images || null,
  }
  
  const { data, error } = await supabase
    .from('ads')
    .insert([newAd])
    .select()
    .single()
  
  if (error) {
    console.error('❌ Supabase Error creating ad:')
    console.error('Error Code:', error.code)
    console.error('Error Message:', error.message)
    console.error('Error Details:', error.details)
    console.error('Error Hint:', error.hint)
    console.error('Full Error:', error)
    console.error('Ad data being inserted:', JSON.stringify(newAd, null, 2))
    
    // Check for common issues
    if (error.code === 'PGRST116') {
      console.error('⚠️ Table "ads" might not exist. Please run the SQL setup from SUPABASE_SETUP.md')
    } else if (error.code === '42501') {
      console.error('⚠️ Permission denied. Check your RLS policies in Supabase.')
    } else if (error.message?.includes('JWT')) {
      console.error('⚠️ Authentication error. Check your NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    
    return null
  }
  
  console.log('✅ Ad created successfully:', data)
  return data
}

export async function updateAd(id: string, updates: Partial<Ad>): Promise<Ad | null> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Supabase Error updating ad:')
      console.error('Error Code:', error.code)
      console.error('Error Message:', error.message)
      console.error('Error Details:', error.details)
      console.error('Error Hint:', error.hint)
      console.error('Full Error:', error)
      console.error('Ad ID:', id)
      console.error('Updates:', JSON.stringify(updates, null, 2))
      
      // Check for common issues
      if (error.code === 'PGRST116') {
        console.error('⚠️ Table "ads" might not exist.')
      } else if (error.code === '42501') {
        console.error('⚠️ Permission denied. RLS might be blocking updates.')
      } else if (error.message?.includes('JWT')) {
        console.error('⚠️ Authentication error. Check your NEXT_PUBLIC_SUPABASE_ANON_KEY')
      }
      
      return null
    }
    
    console.log('✅ Ad updated successfully:', data)
    return data
  } catch (fetchError: any) {
    // Handle network/fetch errors (like ERR_BLOCKED_BY_CLIENT)
    console.error('❌ Network Error updating ad:')
    console.error('Error Type:', fetchError?.name || 'Unknown')
    console.error('Error Message:', fetchError?.message || 'Unknown error')
    console.error('Full Error:', fetchError)
    console.error('Ad ID:', id)
    console.error('Updates:', JSON.stringify(updates, null, 2))
    
    if (fetchError?.message?.includes('Failed to fetch') || fetchError?.name === 'TypeError') {
      console.error('⚠️ This looks like a network blocking issue:')
      console.error('1. Check if browser extensions (ad blockers) are blocking requests')
      console.error('2. Try disabling browser extensions temporarily')
      console.error('3. Check antivirus/firewall settings')
      console.error('4. Try a different browser or incognito mode')
      console.error('5. Check if your network/proxy is blocking the request')
    }
    
    return null
  }
}

export async function deleteAd(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('ads')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting ad:', error)
    return false
  }
  
  return true
}

// Contact submissions functions
export async function getAllContactSubmissions(): Promise<ContactSubmission[]> {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('submittedAt', { ascending: false })
  
  if (error) {
    console.error('Error fetching contact submissions:', error)
    return []
  }
  
  return data || []
}

export async function createContactSubmission(submission: Omit<ContactSubmission, 'id' | 'submittedAt' | 'status'>): Promise<ContactSubmission | null> {
  const newSubmission: Omit<ContactSubmission, 'id'> = {
    ...submission,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }
  
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert([newSubmission])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating contact submission:', error)
    return null
  }
  
  return data
}

export async function updateContactSubmission(id: string, updates: Partial<ContactSubmission>): Promise<ContactSubmission | null> {
  const { data, error } = await supabase
    .from('contact_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating contact submission:', error)
    return null
  }
  
  return data
}

export async function deleteContactSubmission(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('contact_submissions')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting contact submission:', error)
    return false
  }
  
  return true
}

