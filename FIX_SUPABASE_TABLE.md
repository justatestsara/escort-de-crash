# Fix Missing Columns in Supabase Table

## The Problem
You're getting an error: `Could not find the 'hairColor' column of 'ads' in the schema cache`

This means your `ads` table in Supabase is missing some columns.

## Quick Fix

### Option 1: Add Missing Columns (Recommended if you have existing data)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `SUPABASE_MIGRATION.sql`
4. Click **Run**
5. This will add all missing columns without losing existing data

### Option 2: Recreate Table (Only if you have NO important data)

1. Go to Supabase Dashboard > **SQL Editor**
2. Run this to drop the table:
   ```sql
   DROP TABLE IF EXISTS ads CASCADE;
   ```
3. Then run the complete SQL from `SUPABASE_SETUP.md` section "Ads Table"

## After Running Migration

1. **Restart your dev server** (if it's running)
2. Try submitting an ad again
3. If you get another column error, run the migration script again (it's safe to run multiple times)

## Verify Your Table Structure

Run this in Supabase SQL Editor to see all columns:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ads'
ORDER BY ordinal_position;
```

You should see these columns:
- id
- name
- age
- gender
- city
- country
- phone
- email
- whatsapp
- telegram
- instagram
- twitter
- **hairColor** ← This was missing!
- languages
- description
- services
- rates
- images
- status
- submittedAt
- createdAt
- updatedAt


