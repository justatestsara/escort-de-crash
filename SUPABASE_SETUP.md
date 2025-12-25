# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Wait for the project to be fully set up

## 2. Get Your Supabase Credentials

1. Go to Project Settings > API
2. Copy your:
   - Project URL (this will be `NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/Public Key (this will be `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## 3. Set Environment Variables

Create a `.env.local` file in the root of your project with:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Create Database Tables

Run these SQL commands in your Supabase SQL Editor (Dashboard > SQL Editor):

### Ads Table

```sql
-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'trans', 'luxury_escort', 'webcam')),
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  telegram TEXT,
  instagram TEXT,
  twitter TEXT,
  hairColor TEXT,
  languages JSONB,
  description TEXT NOT NULL,
  services JSONB,
  rates JSONB,
  images JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'inactive')),
  submittedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_country ON ads(country);
CREATE INDEX IF NOT EXISTS idx_ads_city ON ads(city);
CREATE INDEX IF NOT EXISTS idx_ads_gender ON ads(gender);

-- Enable Row Level Security (RLS)
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to approved ads only
CREATE POLICY "Public can view approved ads"
  ON ads FOR SELECT
  USING (status = 'approved');

-- Create policy to allow public insert (for posting ads)
CREATE POLICY "Public can insert ads"
  ON ads FOR INSERT
  WITH CHECK (true);

-- Create policy to allow updates (for admin - you'll need to add authentication later)
CREATE POLICY "Allow updates"
  ON ads FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policy to allow deletes (for admin)
CREATE POLICY "Allow deletes"
  ON ads FOR DELETE
  USING (true);
```

### Contact Submissions Table

```sql
-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed')),
  submittedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insert (for contact form)
CREATE POLICY "Public can insert contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- Create policy to allow reads (for admin - you'll need to add authentication later)
CREATE POLICY "Allow reads"
  ON contact_submissions FOR SELECT
  USING (true);

-- Create policy to allow updates (for admin)
CREATE POLICY "Allow updates"
  ON contact_submissions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policy to allow deletes (for admin)
CREATE POLICY "Allow deletes"
  ON contact_submissions FOR DELETE
  USING (true);
```

## 5. Install Dependencies

Run:
```bash
npm install @supabase/supabase-js
```

## 6. Migration from localStorage

After setting up Supabase, you can migrate existing localStorage data by:

1. Opening the browser console on your site
2. Running the migration script (we'll create this)
3. Or manually copy data from localStorage to Supabase

## Security Notes

- The current setup allows public read/write access. For production, you should:
  - Add authentication for admin operations
  - Restrict public write access to only approved operations
  - Add rate limiting
  - Consider using Supabase Auth for admin panel



