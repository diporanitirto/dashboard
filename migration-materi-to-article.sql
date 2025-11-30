-- Migration: Convert materials table to support article content
-- Run this in Supabase SQL Editor

-- Add content column for article body
ALTER TABLE materials ADD COLUMN IF NOT EXISTS content TEXT;

-- Add file_name column for original file name
ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Make file columns optional (since materi bisa jadi artikel tanpa file)
-- file_url, file_path, file_type, file_size sudah nullable by default

-- Add public read policy for materials
DROP POLICY IF EXISTS "Public read materials" ON materials;
CREATE POLICY "Public read materials" ON materials FOR SELECT USING (true);

-- Update RLS if needed
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage materials
DROP POLICY IF EXISTS "Authenticated users can manage materials" ON materials;
CREATE POLICY "Authenticated users can manage materials" ON materials 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
