-- Menambahkan kolom metadata pengajuan izin (IP & perangkat)
-- Jalankan script ini di Supabase SQL Editor

ALTER TABLE izin ADD COLUMN IF NOT EXISTS ip TEXT;
ALTER TABLE izin ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE izin ADD COLUMN IF NOT EXISTS device TEXT;

COMMENT ON COLUMN izin.ip IS 'IP address pengaju (dari header x-forwarded-for)';
COMMENT ON COLUMN izin.user_agent IS 'User-Agent mentah dari browser pengaju';
COMMENT ON COLUMN izin.device IS 'Ringkasan perangkat hasil parse ua-parser-js, mis: "Mobile • Android 14 • Chrome 129"';
