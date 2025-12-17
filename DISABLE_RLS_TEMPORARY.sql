-- TEMPORARY FIX: Disable RLS completely for testing
-- WARNING: This removes all security. Only use for testing!
-- After confirming inserts work, re-enable RLS and set up proper policies

-- Disable RLS
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'ads';
-- rowsecurity should be 'f' (false)

-- Now try inserting an ad. If it works, the issue is definitely RLS policies.
-- Then run FIX_RLS_FINAL.sql to re-enable RLS with proper policies.


