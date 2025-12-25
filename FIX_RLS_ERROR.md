# Fix RLS (Row Level Security) Policy Error

## The Error
```
code: "42501"
message: "new row violates row-level security policy for table \"ads\""
```

This means Row Level Security is blocking your insert operation.

## Quick Fix

1. Go to **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `FIX_RLS_POLICIES.sql`
4. Click **Run**
5. Try submitting your ad again

## What This Does

The SQL script will:
- Check your current RLS policies
- Drop and recreate the policies with correct permissions
- Allow public inserts (so users can post ads)
- Allow public reads of approved ads only
- Allow updates and deletes (for admin use)

## Alternative: Disable RLS Temporarily (NOT RECOMMENDED)

If you want to disable RLS temporarily for testing (NOT for production):

```sql
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;
```

**Warning:** This removes all security. Only use for testing, then re-enable RLS and set up proper policies.

## Verify RLS is Enabled

Run this to check:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'ads';
```

If `rowsecurity` is `true`, RLS is enabled (which is good, but you need the policies).

## After Fixing

1. Try submitting your ad again
2. The ad should be created with status 'pending'
3. You can approve it in the admin dashboard



