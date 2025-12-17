-- Migration script to add missing columns to existing ads table
-- Run this in Supabase SQL Editor if you get column errors

-- Add submittedAt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'submittedAt'
    ) THEN
        ALTER TABLE ads ADD COLUMN "submittedAt" TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added submittedAt column';
    ELSE
        RAISE NOTICE 'submittedAt column already exists';
    END IF;
END $$;

-- Add hairColor column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'hairColor'
    ) THEN
        ALTER TABLE ads ADD COLUMN "hairColor" TEXT;
        RAISE NOTICE 'Added hairColor column';
    ELSE
        RAISE NOTICE 'hairColor column already exists';
    END IF;
END $$;

-- Add any other missing columns (check your error messages)
-- Uncomment and run these if you get errors for other columns:

-- Add email if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'email'
    ) THEN
        ALTER TABLE ads ADD COLUMN email TEXT;
    END IF;
END $$;

-- Add whatsapp if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE ads ADD COLUMN whatsapp TEXT;
    END IF;
END $$;

-- Add telegram if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'telegram'
    ) THEN
        ALTER TABLE ads ADD COLUMN telegram TEXT;
    END IF;
END $$;

-- Add instagram if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'instagram'
    ) THEN
        ALTER TABLE ads ADD COLUMN instagram TEXT;
    END IF;
END $$;

-- Add twitter if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'twitter'
    ) THEN
        ALTER TABLE ads ADD COLUMN twitter TEXT;
    END IF;
END $$;

-- Add languages (JSONB) if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'languages'
    ) THEN
        ALTER TABLE ads ADD COLUMN languages JSONB;
    END IF;
END $$;

-- Add services (JSONB) if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'services'
    ) THEN
        ALTER TABLE ads ADD COLUMN services JSONB;
    END IF;
END $$;

-- Add rates (JSONB) if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'rates'
    ) THEN
        ALTER TABLE ads ADD COLUMN rates JSONB;
    END IF;
END $$;

-- Add images (JSONB) if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'images'
    ) THEN
        ALTER TABLE ads ADD COLUMN images JSONB;
    END IF;
END $$;

-- Add createdAt if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE ads ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add updatedAt if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE ads ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Update gender constraint to include new values if needed
DO $$ 
BEGIN
    -- Check if constraint exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'ads' 
        AND constraint_name LIKE '%gender%'
    ) THEN
        -- Drop old constraint
        ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_gender_check;
        -- Add new constraint with all gender values
        ALTER TABLE ads ADD CONSTRAINT ads_gender_check 
            CHECK (gender IN ('female', 'male', 'trans', 'luxury_escort', 'webcam'));
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ads'
ORDER BY ordinal_position;

