## Why the site is slow right now
Many ads currently store images as **base64 data URLs** in the `ads.images` array.
That makes your Supabase responses huge (often > 2MB), slows down the home/ad pages, and triggers Next.js cache warnings.

## New behavior (implemented)
- New uploads in **/post-ad** are now converted to **WebP** in the browser and uploaded to **Supabase Storage** bucket `ad-images`.
- The ad record stores only **public URLs**, not base64.
- Admin dashboard edit view has an **Upload Images (WebP)** input that uploads to Storage and updates `images` with URLs.

## Required Supabase setup
### 1) Create a public bucket
Create a bucket named: `ad-images`
Set it to **Public**.

### 2) Storage policies
If you have Storage RLS enabled, allow uploads to that bucket.
A simple (open) policy is:
- Allow **INSERT** for `anon` on objects in bucket `ad-images`
- Allow **SELECT** for everyone

(If you want, tell me your Storage RLS status and I’ll give you the exact policy SQL for your project.)

## How to migrate existing ads
### Option A (manual, easiest)
- Open admin dashboard
- Edit each ad
- Remove the base64 images and re-upload using **Upload Images (WebP)**
- Save

### Option B (semi-automatic)
We can add a migration page/script that:
- reads approved ads
- detects images starting with `data:image/`
- converts to WebP
- uploads to Storage
- updates the ad row with URLs

If you want Option B, confirm:
- whether you want to migrate **only approved ads** or all ads
- roughly how many ads you have
