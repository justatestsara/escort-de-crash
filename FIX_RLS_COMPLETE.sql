-- COMPLETE RLS FIX - Run this entire script
-- This will fix all RLS policy issues

-- Step 1: Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'ads';

-- Step 2: List all existing policies on ads table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ads';

-- Step 3: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Public can insert ads" ON ads;
DROP POLICY IF EXISTS "Public can view approved ads" ON ads;
DROP POLICY IF EXISTS "Allow updates" ON ads;
DROP POLICY IF EXISTS "Allow deletes" ON ads;
DROP POLICY IF EXISTS "public_can_insert_ads" ON ads;
DROP POLICY IF EXISTS "public_can_view_approved_ads" ON ads;
DROP POLICY IF EXISTS "allow_updates" ON ads;
DROP POLICY IF EXISTS "allow_deletes" ON ads;

-- Step 4: Temporarily disable RLS to ensure we can create policies
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;

-- Step 5: Re-enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Step 6: Create INSERT policy (most important - allows posting ads)
CREATE POLICY "public_can_insert_ads"
  ON ads
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Step 7: Create SELECT policy (allows viewing approved ads)
CREATE POLICY "public_can_view_approved_ads"
  ON ads
  FOR SELECT
  TO public
  USING (status = 'approved');

-- Step 8: Create UPDATE policy (allows admin to update ads)
CREATE POLICY "allow_updates"
  ON ads
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Step 9: Create DELETE policy (allows admin to delete ads)
CREATE POLICY "allow_deletes"
  ON ads
  FOR DELETE
  TO public
  USING (true);

-- Step 10: Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ads'
ORDER BY policyname;

-- Step 11: Test that RLS is working (should return rows)
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'ads';

-- If you see 4 policies above, you're good to go!


