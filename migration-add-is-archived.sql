-- Migration: Tambahkan kolom is_archived ke tabel izin
-- Jalankan ini di Supabase SQL Editor untuk update tabel yang sudah ada

-- Tambah kolom is_archived, archive_date, dan archived_at
ALTER TABLE izin 
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archive_date DATE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Tambah index untuk performa query
CREATE INDEX IF NOT EXISTS izin_archived_idx ON izin(is_archived);

-- Pindahkan data dari izin_archive ke izin dengan flag is_archived = true
INSERT INTO izin (id, nama, absen, kelas, alasan, status, is_archived, archive_date, archived_at, created_at)
SELECT 
  id, 
  nama, 
  absen, 
  kelas, 
  alasan, 
  status, 
  true as is_archived,
  archive_date,
  archived_at,
  created_at
FROM izin_archive
ON CONFLICT (id) DO UPDATE SET
  is_archived = true,
  archive_date = EXCLUDED.archive_date,
  archived_at = EXCLUDED.archived_at;

-- Setelah yakin data sudah ter-migrate dengan benar, 
-- uncomment baris berikut untuk drop tabel izin_archive:
-- DROP TABLE IF EXISTS izin_archive;
