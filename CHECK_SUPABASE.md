# Checking Supabase Setup

## 1. Verify Environment Variables

Create a `.env.local` file in the root directory (`C:\Users\G\escort-de-crash\.env.local`) with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** 
- You only need the **ANON KEY** (public key), NOT the service role key
- The service role key should NEVER be exposed in client-side code
- Get these values from: Supabase Dashboard > Project Settings > API

## 2. Restart Your Dev Server

After creating/updating `.env.local`, you MUST restart your Next.js dev server:
1. Stop the current server (Ctrl+C)
2. Run `npm run dev` again

## 3. Check Browser Console

When you try to submit an ad, check the browser console (F12) for:
- Any error messages
- The detailed error information we're now logging

## 4. Verify Supabase Tables Exist

Go to Supabase Dashboard > Table Editor and verify:
- The `ads` table exists
- The `contact_submissions` table exists

## 5. Check RLS Policies

Go to Supabase Dashboard > Authentication > Policies and verify:
- There's a policy allowing INSERT on the `ads` table
- The policy should allow public inserts (WITH CHECK (true))

## Common Issues:

1. **"Table does not exist"** → Run the SQL from `SUPABASE_SETUP.md` in Supabase SQL Editor
2. **"Permission denied"** → Check RLS policies are set up correctly
3. **"JWT error"** → Check your ANON KEY is correct
4. **Environment variables not loading** → Restart dev server after creating `.env.local`



