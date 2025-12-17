-- ALTERNATIVE FIX: If the above doesn't work, try this
-- This temporarily disables RLS for testing, then re-enables with proper policies

-- Option 1: Completely disable RLS (TEMPORARY - for testing only)
-- Uncomment the line below to disable RLS completely:
-- ALTER TABLE ads DISABLE ROW LEVEL SECURITY;

-- Option 2: Grant direct permissions (if policies aren't working)
-- This grants INSERT permission directly to the anon role
GRANT INSERT ON ads TO anon;
GRANT SELECT ON ads TO anon;
GRANT UPDATE ON ads TO anon;
GRANT DELETE ON ads TO anon;

-- Also grant to authenticated role (if you add auth later)
GRANT INSERT ON ads TO authenticated;
GRANT SELECT ON ads TO authenticated;
GRANT UPDATE ON ads TO authenticated;
GRANT DELETE ON ads TO authenticated;

-- Verify grants
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'ads';


