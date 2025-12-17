/**
 * Migration script to move data from localStorage to Supabase
 */

import { createAd, createContactSubmission } from './supabase-ads'

export async function migrateLocalStorageToSupabase() {
  console.log('Starting migration from localStorage to Supabase...')
  
  let migratedAds = 0
  let failedAds = 0
  let migratedContacts = 0
  let failedContacts = 0
  
  // Migrate ads
  if (typeof window !== 'undefined') {
    const storedAds = localStorage.getItem('submitted_ads')
    if (storedAds) {
      try {
        const ads = JSON.parse(storedAds)
        console.log(`Found ${ads.length} ads to migrate`)
        
        for (const ad of ads) {
          try {
            const { id, submittedAt, ...adData } = ad
            // Check if ad already exists in Supabase by trying to create it
            // If it fails due to duplicate, that's okay - it means it's already migrated
            const result = await createAd(adData as any)
            if (result) {
              migratedAds++
              console.log(`✓ Migrated ad: ${ad.name} (${ad.id})`)
            } else {
              failedAds++
              console.log(`✗ Failed to migrate ad: ${ad.name} (${ad.id})`)
            }
          } catch (error: any) {
            // Check if it's a duplicate key error (already exists)
            if (error?.message?.includes('duplicate') || error?.code === '23505') {
              console.log(`→ Ad already exists in Supabase: ${ad.name} (${ad.id})`)
            } else {
              failedAds++
              console.error(`✗ Error migrating ad ${ad.name}:`, error.message)
            }
          }
        }
        
        console.log(`Ads migration completed: ${migratedAds} migrated, ${failedAds} failed`)
      } catch (error: any) {
        console.error('Error migrating ads:', error.message)
        throw error
      }
    } else {
      console.log('No ads found in localStorage')
    }
    
    // Migrate contact submissions
    const storedSubmissions = localStorage.getItem('contact_submissions')
    if (storedSubmissions) {
      try {
        const submissions = JSON.parse(storedSubmissions)
        console.log(`Found ${submissions.length} contact submissions to migrate`)
        
        for (const submission of submissions) {
          try {
            const { id, submittedAt, status, ...submissionData } = submission
            const result = await createContactSubmission(submissionData as any)
            if (result) {
              migratedContacts++
              console.log(`✓ Migrated submission: ${submission.subject} (${submission.id})`)
            } else {
              failedContacts++
              console.log(`✗ Failed to migrate submission: ${submission.subject}`)
            }
          } catch (error: any) {
            // Check if it's a duplicate key error (already exists)
            if (error?.message?.includes('duplicate') || error?.code === '23505') {
              console.log(`→ Submission already exists in Supabase: ${submission.subject} (${submission.id})`)
            } else {
              failedContacts++
              console.error(`✗ Error migrating submission ${submission.subject}:`, error.message)
            }
          }
        }
        
        console.log(`Contact submissions migration completed: ${migratedContacts} migrated, ${failedContacts} failed`)
      } catch (error: any) {
        console.error('Error migrating contact submissions:', error.message)
        throw error
      }
    } else {
      console.log('No contact submissions found in localStorage')
    }
    
    // Note: edited_sample_ads can stay in localStorage as they're just overrides
    console.log('\n=== Migration Summary ===')
    console.log(`Ads: ${migratedAds} migrated, ${failedAds} failed`)
    console.log(`Contact submissions: ${migratedContacts} migrated, ${failedContacts} failed`)
    console.log('\nMigration completed! You can now clear localStorage if desired.')
  } else {
    throw new Error('localStorage is not available')
  }
}

