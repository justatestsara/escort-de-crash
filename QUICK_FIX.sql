-- QUICK FIX: Add missing columns
-- Copy and paste this into Supabase SQL Editor and click Run

-- Add hairColor column
ALTER TABLE ads ADD COLUMN IF NOT EXISTS "hairColor" TEXT;

-- Add submittedAt column (TIMESTAMPTZ)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMPTZ DEFAULT NOW();

-- Add other commonly missing columns
ALTER TABLE ads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS telegram TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS languages JSONB;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS services JSONB;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS rates JSONB;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE ads ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ads'
ORDER BY column_name;

