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

CREATE POLICY "Allow all actions for authenticated" ON izin
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

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
