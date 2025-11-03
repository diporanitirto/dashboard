-- SQL untuk menyiapkan tabel izin di Supabase
-- Jalankan perintah ini di Supabase SQL Editor sebelum memakai dashboard

CREATE TABLE IF NOT EXISTS izin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  absen INTEGER NOT NULL,
  kelas VARCHAR(10) NOT NULL CHECK (kelas IN ('X1','X2','X3','X4','X5','X6','X7','X8')),
  alasan TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archive_date DATE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS izin_status_idx ON izin(status);
CREATE INDEX IF NOT EXISTS izin_kelas_idx ON izin(kelas);
CREATE INDEX IF NOT EXISTS izin_created_idx ON izin(created_at DESC);
CREATE INDEX IF NOT EXISTS izin_archived_idx ON izin(is_archived);

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

-- ==========================================================
-- Tambahan tabel untuk fitur profil, materi, dokumentasi, agenda
-- ==========================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin','bph','materi','media','anggota') OR role IS NULL),
  pangkat TEXT CHECK (pangkat IN (
    'anggota',
    'pradana',
    'pradana_putri',
    'judat',
    'judat_putri',
    'kerani',
    'kerani_putri',
    'hartaka',
    'hartaka_putri'
  ) OR pangkat IS NULL),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_pangkat_idx ON profiles(pangkat);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users manage own profile'
  ) THEN
    CREATE POLICY "Users manage own profile" ON profiles
      FOR ALL USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT,
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS materials_created_idx ON materials(created_at DESC);
CREATE INDEX IF NOT EXISTS materials_uploader_idx ON materials(uploaded_by);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'materials'
      AND policyname = 'Allow read materials for authenticated'
  ) THEN
    CREATE POLICY "Allow read materials for authenticated" ON materials
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'materials'
      AND policyname = 'Users manage own materials'
  ) THEN
    CREATE POLICY "Users manage own materials" ON materials
      FOR ALL USING (auth.uid() = uploaded_by)
      WITH CHECK (auth.uid() = uploaded_by);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS documentation_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('foto','video','lainnya') OR category IS NULL),
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT,
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documentation_assets_created_idx ON documentation_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS documentation_assets_category_idx ON documentation_assets(category);

ALTER TABLE documentation_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'documentation_assets'
      AND policyname = 'Allow read documentation for authenticated'
  ) THEN
    CREATE POLICY "Allow read documentation for authenticated" ON documentation_assets
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'documentation_assets'
      AND policyname = 'Users manage own documentation'
  ) THEN
    CREATE POLICY "Users manage own documentation" ON documentation_assets
      FOR ALL USING (auth.uid() = uploaded_by)
      WITH CHECK (auth.uid() = uploaded_by);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agendas_starts_idx ON agendas(starts_at);
CREATE INDEX IF NOT EXISTS agendas_creator_idx ON agendas(created_by);

ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agendas'
      AND policyname = 'Allow read agendas for authenticated'
  ) THEN
    CREATE POLICY "Allow read agendas for authenticated" ON agendas
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agendas'
      AND policyname = 'Agenda owners manage agenda'
  ) THEN
    CREATE POLICY "Agenda owners manage agenda" ON agendas
      FOR ALL USING (auth.uid() = created_by)
      WITH CHECK (auth.uid() = created_by);
  END IF;
END
$$;

-- Pastikan bucket storage publik tersedia untuk materi dan dokumentasi
INSERT INTO storage.buckets (id, name, public)
VALUES ('materi', 'materi', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('dokumentasi', 'dokumentasi', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ==========================================================
-- Daftar admin dashboard (memiliki akses penuh seluruh tabel)
-- ==========================================================

CREATE TABLE IF NOT EXISTS dashboard_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dashboard_admins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dashboard_admins'
      AND policyname = 'Service role manages admin list'
  ) THEN
    CREATE POLICY "Service role manages admin list" ON dashboard_admins
      FOR ALL USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

-- Admin policies to bypass owner-only restrictions

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins manage profiles'
  ) THEN
    CREATE POLICY "Admins manage profiles" ON profiles
      FOR ALL USING (auth.uid() IN (SELECT user_id FROM dashboard_admins))
      WITH CHECK (auth.uid() IN (SELECT user_id FROM dashboard_admins));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'materials'
      AND policyname = 'Admins manage materials'
  ) THEN
    CREATE POLICY "Admins manage materials" ON materials
      FOR ALL USING (auth.uid() IN (SELECT user_id FROM dashboard_admins))
      WITH CHECK (auth.uid() IN (SELECT user_id FROM dashboard_admins));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'documentation_assets'
      AND policyname = 'Admins manage documentation'
  ) THEN
    CREATE POLICY "Admins manage documentation" ON documentation_assets
      FOR ALL USING (auth.uid() IN (SELECT user_id FROM dashboard_admins))
      WITH CHECK (auth.uid() IN (SELECT user_id FROM dashboard_admins));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agendas'
      AND policyname = 'Admins manage agendas'
  ) THEN
    CREATE POLICY "Admins manage agendas" ON agendas
      FOR ALL USING (auth.uid() IN (SELECT user_id FROM dashboard_admins))
      WITH CHECK (auth.uid() IN (SELECT user_id FROM dashboard_admins));
  END IF;
END
$$;

-- Tambahkan user admin setelah akun dibuat di Supabase Auth:
-- INSERT INTO dashboard_admins (user_id)
-- VALUES ('00000000-0000-0000-0000-000000000000')
-- ON CONFLICT DO NOTHING;

-- ==========================================================
-- Contoh skrip membuat akun admin (login memakai email kustom)
-- ==========================================================
--
-- Cara 1: Buat user via Supabase Dashboard (Authentication > Users > Add user)
-- Lalu jalankan SQL berikut (ganti <USER_UUID> dengan UUID user yang baru dibuat):
--
-- DO $$
-- DECLARE
--   user_uuid UUID := '<USER_UUID>';
-- BEGIN
--   INSERT INTO profiles (id, full_name, role, pangkat)
--   VALUES (user_uuid, 'Admin Diporani', 'admin', 'pradana')
--   ON CONFLICT (id) DO UPDATE
--     SET full_name = EXCLUDED.full_name,
--         role = EXCLUDED.role,
--         pangkat = EXCLUDED.pangkat,
--         updated_at = NOW();
--
--   INSERT INTO dashboard_admins (user_id)
--   VALUES (user_uuid)
--   ON CONFLICT DO NOTHING;
-- END $$;
--
-- Catatan: Role 'admin' memiliki akses penuh ke semua fitur dashboard.
