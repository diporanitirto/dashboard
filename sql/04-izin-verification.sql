-- Menambahkan kolom untuk sistem verifikasi izin
-- Jalankan script ini di Supabase SQL Editor

-- Tambah kolom satu per satu
ALTER TABLE izin ADD COLUMN IF NOT EXISTS sangga TEXT DEFAULT '';
ALTER TABLE izin ADD COLUMN IF NOT EXISTS pk_kelas TEXT DEFAULT '';
ALTER TABLE izin ADD COLUMN IF NOT EXISTS nis TEXT;
ALTER TABLE izin ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE izin ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE izin ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE izin ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update constraint kelas jika ada (hapus constraint lama jika perlu)
-- Pastikan kelas hanya menerima format X1-X8 (tanpa dash)
DO $$
BEGIN
  -- Drop constraint lama jika ada
  ALTER TABLE izin DROP CONSTRAINT IF EXISTS izin_kelas_check;
  
  -- Tambah constraint baru
  ALTER TABLE izin ADD CONSTRAINT izin_kelas_check 
    CHECK (kelas IN ('X1','X2','X3','X4','X5','X6','X7','X8','XADMIN'));
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore error jika constraint sudah ada
END $$;

-- Update nis dari absen untuk data yang sudah ada (jika diperlukan)
UPDATE izin 
SET nis = CAST(absen AS TEXT)
WHERE nis IS NULL;

-- Buat index untuk pencarian lebih cepat
CREATE INDEX IF NOT EXISTS idx_izin_status ON izin(status);
CREATE INDEX IF NOT EXISTS idx_izin_nis ON izin(nis);
CREATE INDEX IF NOT EXISTS idx_izin_created_at ON izin(created_at DESC);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_izin_updated_at ON izin;

CREATE TRIGGER update_izin_updated_at
    BEFORE UPDATE ON izin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Komentar
COMMENT ON COLUMN izin.status IS 'Status izin: pending, approved, rejected';
COMMENT ON COLUMN izin.verified_by IS 'Nama Judat yang memverifikasi';
COMMENT ON COLUMN izin.verified_at IS 'Waktu verifikasi';
COMMENT ON COLUMN izin.nis IS 'Nomor Induk Siswa';
COMMENT ON COLUMN izin.kelas IS 'Format: X1, X2, ..., X8 (tanpa dash)';
