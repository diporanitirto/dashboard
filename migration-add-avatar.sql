-- Migration untuk fitur Avatar Upload
-- Jalankan di Supabase SQL Editor

-- 1. Buat storage bucket untuk avatars (jika belum ada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Policy: Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.filename(name) LIKE auth.uid()::text || '.%')
);

-- 3. Policy: Allow users to update/replace their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.filename(name) LIKE auth.uid()::text || '.%')
);

-- 4. Policy: Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.filename(name) LIKE auth.uid()::text || '.%')
);

-- 5. Policy: Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Atau jika policy sudah ada, bisa hapus dulu:
-- DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
