-- Seed: 2 fully-filled sample ads in Berlin, Germany
-- How to run:
-- Supabase Dashboard → SQL Editor → New query → paste + Run
--
-- Notes:
-- - Inserts as status='approved' so they show on the site immediately.
-- - Handles both "hairColor" (camelCase) and haircolor (lowercase) column variants safely.
-- - Leaves submittedAt/createdAt/updatedAt to defaults.

BEGIN;

-- 1) Insert required + JSON fields (avoid optional camelCase columns here)
INSERT INTO ads (
  id,
  name,
  age,
  gender,
  city,
  country,
  phone,
  email,
  whatsapp,
  telegram,
  instagram,
  twitter,
  languages,
  description,
  services,
  rates,
  images,
  status
)
VALUES
(
  'seed_berlin_001',
  'Lena',
  '24',
  'female',
  'Berlin',
  'Germany',
  '+49 157 1234 5678',
  'lena.berlin@escort.de',
  '+49 157 1234 5678',
  '@lena_berlin',
  'https://instagram.com/lena.berlin',
  'https://x.com/lena_berlin',
  '["German","English"]'::jsonb,
  'Hi, I''m Lena — a warm, discreet, and playful companion based in Berlin. I focus on a relaxed, genuine experience and clear communication.\n\nAvailability / Working hours: Mon–Sun 10:00–22:00 (late bookings possible).\n\nI offer incall and outcall in Berlin and surrounding areas. Please message on WhatsApp or Telegram for a quick response.\n\nSafety: respectful, clean, and private. Verification helps keep the directory free of scammers and fake ads.',
  '[
    {"name":"Girlfriend Experience (GFE)","included":true},
    {"name":"Dinner Date","included":true},
    {"name":"Roleplay","included":false,"extraPrice":50},
    {"name":"Overnight","included":false,"extraPrice":300}
  ]'::jsonb,
  '[
    {"time":"30 min","incall":180,"outcall":220},
    {"time":"1 hour","incall":250,"outcall":300},
    {"time":"2 hours","incall":450,"outcall":520},
    {"time":"Dinner Date (3h)","incall":650,"outcall":750}
  ]'::jsonb,
  NULL,
  'approved'
),
(
  'seed_berlin_002',
  'Sophie',
  '27',
  'female',
  'Berlin',
  'Germany',
  '+49 176 9876 5432',
  'sophie.berlin@escort.de',
  '+49 176 9876 5432',
  '@sophieinberlin',
  'https://instagram.com/sophie.berlin',
  'https://x.com/sophie_berlin',
  '["German","English","French"]'::jsonb,
  'Hello, I''m Sophie — elegant, friendly, and professional in Berlin. I''m all about comfort, discretion, and a premium vibe.\n\nAvailability / Working hours: Tue–Sun 12:00–23:00.\n\nI can host (incall) and I also travel (outcall) across Berlin. Quickest way to reach me is WhatsApp.\n\nWhy Escort.de? Verified profiles + clean listings helps reduce scammers and fake ads, so you can book with more confidence.',
  '[
    {"name":"Companion for Events","included":true},
    {"name":"Massage","included":true},
    {"name":"Fetish (light)","included":false,"extraPrice":60},
    {"name":"Overnight","included":false,"extraPrice":350}
  ]'::jsonb,
  '[
    {"time":"1 hour","incall":280,"outcall":330},
    {"time":"2 hours","incall":500,"outcall":580},
    {"time":"3 hours","incall":700,"outcall":820},
    {"time":"Overnight","incall":1200,"outcall":1400}
  ]'::jsonb,
  NULL,
  'approved'
);

-- 2) Set hair color in a schema-safe way (supports both "hairColor" and haircolor)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ads' AND column_name = 'hairColor'
  ) THEN
    UPDATE ads SET "hairColor" = 'Blonde' WHERE id = 'seed_berlin_001';
    UPDATE ads SET "hairColor" = 'Brown'  WHERE id = 'seed_berlin_002';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ads' AND column_name = 'haircolor'
  ) THEN
    UPDATE ads SET haircolor = 'Blonde' WHERE id = 'seed_berlin_001';
    UPDATE ads SET haircolor = 'Brown'  WHERE id = 'seed_berlin_002';
  END IF;
END $$;

COMMIT;


