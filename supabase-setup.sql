-- SQL untuk menyiapkan tabel izin di Supabase
-- Jalankan perintah ini di Supabase SQL Editor sebelum memakai dashboard

CREATE TABLE IF NOT EXISTS izin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  absen INTEGER NOT NULL,
  kelas VARCHAR(10) NOT NULL CHECK (kelas IN ('X1','X2','X3','X4','X5','X6','X7','X8')),
  alasan TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS izin_status_idx ON izin(status);
CREATE INDEX IF NOT EXISTS izin_kelas_idx ON izin(kelas);
CREATE INDEX IF NOT EXISTS izin_created_idx ON izin(created_at DESC);

ALTER TABLE izin ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'izin'
      AND policyname = 'Allow all actions for authenticated'
  ) THEN
    CREATE POLICY "Allow all actions for authenticated" ON izin
      FOR ALL USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS izin_archive (
  id UUID PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  absen INTEGER NOT NULL,
  kelas VARCHAR(10) NOT NULL,
  alasan TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','approved')),
  created_at TIMESTAMPTZ NOT NULL,
  archive_date DATE NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS izin_archive_date_idx ON izin_archive(archive_date DESC);

ALTER TABLE izin_archive ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'izin_archive'
      AND policyname = 'Allow read archive for authenticated'
  ) THEN
    CREATE POLICY "Allow read archive for authenticated" ON izin_archive
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END
$$;

-- Untuk kebutuhan demo tanpa autentikasi, uncomment baris berikut (hanya untuk pengujian singkat)
-- CREATE POLICY "Allow all actions for anon" ON izin
--   FOR ALL USING (true)
--   WITH CHECK (true);

-- Contoh data
INSERT INTO izin (nama, absen, kelas, alasan, status)
VALUES
  ('William Morgan', 5, 'X1', 'Latihan lomba nasional', 'pending'),
  ('William Meyer', 12, 'X3', 'Beli nasi padang untuk kegiatan sosial', 'pending'),
  ('William Oktav', 8, 'X5', 'Mewakili Indonesia ke Mongolia', 'approved'),
  ('William Fibonacci', 14, 'X2', 'Persiapan lomba tingkat internasional', 'approved'),
  ('William DaVinci', 7, 'X4', 'Koordinasi persiapan acara sekolah', 'pending')
ON CONFLICT DO NOTHING;

INSERT INTO izin_archive (id, nama, absen, kelas, alasan, status, created_at, archive_date, archived_at)
VALUES
  (
    '11111111-2222-3333-4444-555555555551',
    'Arsip minggu pertama',
    3,
    'X1',
    'Membantu persiapan apel pembukaan',
    'approved',
    NOW() - INTERVAL '20 day',
  (CURRENT_DATE - INTERVAL '20 day')::date,
    NOW() - INTERVAL '13 day'
  ),
  (
    '11111111-2222-3333-4444-555555555552',
    'Siswa Regu Matahari',
    11,
    'X4',
    'Mengurus perlengkapan regu',
    'pending',
    NOW() - INTERVAL '18 day',
  (CURRENT_DATE - INTERVAL '20 day')::date,
    NOW() - INTERVAL '13 day'
  ),
  (
    '11111111-2222-3333-4444-555555555553',
    'Arsip minggu kedua',
    6,
    'X3',
    'Koordinasi latihan pionering',
    'approved',
    NOW() - INTERVAL '13 day',
  (CURRENT_DATE - INTERVAL '13 day')::date,
    NOW() - INTERVAL '6 day'
  ),
  (
    '11111111-2222-3333-4444-555555555554',
    'Siswa Regu Rembulan',
    9,
    'X7',
    'Persiapan lomba semaphore',
    'pending',
    NOW() - INTERVAL '9 day',
  (CURRENT_DATE - INTERVAL '13 day')::date,
    NOW() - INTERVAL '6 day'
  )
ON CONFLICT (id) DO NOTHING;
