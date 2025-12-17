import { supabase } from './supabase'

export interface Ad {
  id: string
  name: string
  age: string | number
  gender: 'female' | 'male' | 'trans' | 'luxury_escort' | 'webcam'
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
  
  return data || []
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
  
  return data || []
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
  
  return data
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

