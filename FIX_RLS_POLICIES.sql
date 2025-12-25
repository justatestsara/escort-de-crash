-- Fix Row Level Security (RLS) Policies
-- This error means RLS is blocking inserts. Run this SQL to fix it.

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ads';

-- Drop existing policies if they're not working (optional - only if needed)
-- DROP POLICY IF EXISTS "Public can insert ads" ON ads;
-- DROP POLICY IF EXISTS "Public can view approved ads" ON ads;
-- DROP POLICY IF EXISTS "Allow updates" ON ads;
-- DROP POLICY IF EXISTS "Allow deletes" ON ads;

-- Create/Replace policy to allow public insert (for posting ads)
DROP POLICY IF EXISTS "Public can insert ads" ON ads;
CREATE POLICY "Public can insert ads"
  ON ads FOR INSERT
  TO public
  WITH CHECK (true);

-- Create/Replace policy to allow public read access to approved ads only
DROP POLICY IF EXISTS "Public can view approved ads" ON ads;
CREATE POLICY "Public can view approved ads"
  ON ads FOR SELECT
  TO public
  USING (status = 'approved');

-- Create/Replace policy to allow updates (for admin)
DROP POLICY IF EXISTS "Allow updates" ON ads;
CREATE POLICY "Allow updates"
  ON ads FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create/Replace policy to allow deletes (for admin)
DROP POLICY IF EXISTS "Allow deletes" ON ads;
CREATE POLICY "Allow deletes"
  ON ads FOR DELETE
  TO public
  USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'ads';



