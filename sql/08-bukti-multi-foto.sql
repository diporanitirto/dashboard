-- Dukungan lebih dari satu foto bukti per catatan pelanggaran.
-- Jalankan script ini di Supabase SQL Editor setelah sql/06-pelanggaran.sql.

-- Array JSON berisi { "file_id": "...", "url": "...", "kind": "image" } untuk
-- setiap foto, dan { "file_id": "...", "url": "...", "kind": "video" } untuk
-- link video Google Drive. Foto lama otomatis dipindahkan ke array baru.
-- Kolom lama bukti_file_id / bukti_url tetap diisi bukti pertama supaya
-- dashboard versi lama dan export yang sudah ada tetap berjalan.
alter table pelanggaran
  add column if not exists bukti_files jsonb not null default '[]'::jsonb;

-- Pindahkan bukti lama (satu foto) ke array baru.
update pelanggaran
set bukti_files = jsonb_build_array(
  jsonb_build_object(
    'file_id', coalesce(bukti_file_id, ''),
    'url', bukti_url,
    'kind', 'image'
  )
)
where bukti_url is not null
  and bukti_files = '[]'::jsonb;

comment on column pelanggaran.bukti_files is
  'Daftar bukti: foto hasil upload {file_id,url,kind:"image"} dan link video Drive {file_id,url,kind:"video"}. Kolom bukti_file_id/bukti_url menyimpan bukti pertama untuk kompatibilitas.';
