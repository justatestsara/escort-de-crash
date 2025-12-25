-- FINAL RLS FIX - This should definitely work
-- The issue is likely that policies need to explicitly allow 'anon' role

-- Step 1: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ads') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ads';
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Step 3: Create INSERT policy for anon role (this is the key!)
CREATE POLICY "anon_can_insert_ads"
  ON ads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Step 4: Also allow authenticated users to insert
CREATE POLICY "authenticated_can_insert_ads"
  ON ads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 5: Allow anon to view approved ads
CREATE POLICY "anon_can_view_approved_ads"
  ON ads
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Step 6: Allow authenticated to view all ads (for admin)
CREATE POLICY "authenticated_can_view_all_ads"
  ON ads
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 7: Allow authenticated to update (for admin)
CREATE POLICY "authenticated_can_update_ads"
  ON ads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 8: Allow authenticated to delete (for admin)
CREATE POLICY "authenticated_can_delete_ads"
  ON ads
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 9: Verify policies
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ads'
ORDER BY policyname;

-- Step 10: Also grant table permissions directly (backup method)
GRANT ALL ON ads TO anon;
GRANT ALL ON ads TO authenticated;

-- You should now see policies for both 'anon' and 'authenticated' roles



