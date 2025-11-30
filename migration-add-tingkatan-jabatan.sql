-- Migration: Add tingkatan and jabatan columns to profiles table
-- Run this in Supabase SQL Editor

-- Step 1: Add new columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tingkatan TEXT CHECK (tingkatan IN ('bantara', 'laksana') OR tingkatan IS NULL);

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS jabatan TEXT CHECK (jabatan IN ('anggota', 'pradana', 'kerani', 'judat', 'hartoko') OR jabatan IS NULL);

-- Step 2: Set default values for existing records (optional)
UPDATE profiles SET tingkatan = 'bantara' WHERE tingkatan IS NULL;
UPDATE profiles SET jabatan = 'anggota' WHERE jabatan IS NULL;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS profiles_tingkatan_idx ON profiles(tingkatan);
CREATE INDEX IF NOT EXISTS profiles_jabatan_idx ON profiles(jabatan);

-- Note: The old 'pangkat' column is no longer used, but keeping it for backwards compatibility
-- You can drop it later with: ALTER TABLE profiles DROP COLUMN IF EXISTS pangkat;
