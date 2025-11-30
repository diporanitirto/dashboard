-- Migration: Add instagram and motto columns to profiles + Public read policies
-- Run this in Supabase SQL Editor

-- Add instagram column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);

-- Add motto column  
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS motto TEXT;

-- Update RLS policies to allow public read for website (diporani)
-- Profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Allow public read for website'
  ) THEN
    CREATE POLICY "Allow public read for website" ON profiles
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Materials table (untuk materi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'materials'
      AND policyname = 'Allow public read for website'
  ) THEN
    CREATE POLICY "Allow public read for website" ON materials
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Documentation assets table (untuk dokumentasi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'documentation_assets'
      AND policyname = 'Allow public read for website'
  ) THEN
    CREATE POLICY "Allow public read for website" ON documentation_assets
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Agendas table (untuk agenda)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agendas'
      AND policyname = 'Allow public read for website'
  ) THEN
    CREATE POLICY "Allow public read for website" ON agendas
      FOR SELECT USING (true);
  END IF;
END
$$;
