-- Sistem poin pelanggaran + bukti hukuman (link Google Drive)
-- Jalankan script ini di Supabase SQL Editor

-- 1. Katalog jenis pelanggaran
--    Poin default 1 dan bisa diubah admin lewat dashboard (menu Pelanggaran > Pengaturan).
create table if not exists jenis_pelanggaran (
  id bigint generated always as identity primary key,
  nama text unique not null,
  poin integer not null default 1,
  aktif boolean not null default true,
  created_at timestamptz default now()
);

-- 2. Tahap hukuman berdasarkan total poin siswa
--    Contoh: min_poin 1 = "Peringatan" (pelanggaran pertama).
--    Setelah poin siswa bertambah, tahap yang berlaku ikut naik.
create table if not exists tahap_hukuman (
  id bigint generated always as identity primary key,
  min_poin integer unique not null,
  hukuman text not null,
  updated_at timestamptz default now()
);

-- 3. Catatan pelanggaran siswa
--    Kolom nis/nama/kelas disimpan sebagai snapshot (konsisten dengan tabel izin).
--    Hukuman juga snapshot saat dicatat supaya riwayat tidak berubah
--    walau admin mengedit tahap hukuman di kemudian hari.
create table if not exists pelanggaran (
  id uuid default gen_random_uuid() primary key,
  siswa_id bigint references siswa(id) on delete cascade not null,
  nis text,
  nama text not null,
  kelas text,
  jenis_id bigint references jenis_pelanggaran(id) on delete set null,
  jenis_nama text,
  poin integer not null default 1,
  total_poin integer,
  hukuman text,
  perlu_bukti boolean not null default true,
  keterangan text,
  bukti_file_id text,
  bukti_url text,
  bukti_status text not null default 'belum' check (bukti_status in ('belum','menunggu','selesai','ditolak')),
  bukti_note text,
  bukti_uploaded_at timestamptz,
  verified_by text,
  verified_at timestamptz,
  dicatat_oleh text,
  tanggal date not null default current_date,
  created_at timestamptz default now()
);

create index if not exists idx_pelanggaran_siswa on pelanggaran(siswa_id);
create index if not exists idx_pelanggaran_nis on pelanggaran(nis);
create index if not exists idx_pelanggaran_created on pelanggaran(created_at desc);
create index if not exists idx_pelanggaran_bukti_status on pelanggaran(bukti_status);

-- Seed jenis pelanggaran (semua 1 poin, silakan ubah lewat dashboard)
insert into jenis_pelanggaran (nama, poin) values
  ('Terlambat', 1),
  ('Atribut tidak lengkap', 1),
  ('Tidak mengikuti latihan', 1),
  ('Rambut tidak rapi', 1),
  ('Tidak membawa perlengkapan', 1)
on conflict (nama) do nothing;

-- Seed tahap hukuman: pelanggaran pertama = peringatan.
-- Tahap berikutnya (min_poin 2, 3, dst) diisi sendiri lewat dashboard.
insert into tahap_hukuman (min_poin, hukuman) values (1, 'Peringatan')
on conflict (min_poin) do nothing;

comment on table jenis_pelanggaran is 'Katalog jenis pelanggaran + poin, dikelola dari dashboard menu Pelanggaran';
comment on table tahap_hukuman is 'Hukuman per tahap, berlaku mulai total poin min_poin';
comment on table pelanggaran is 'Catatan pelanggaran siswa; bukti hukuman berupa link Google Drive';
comment on column pelanggaran.total_poin is 'Total poin siswa setelah pelanggaran ini dicatat (snapshot)';
comment on column pelanggaran.perlu_bukti is 'false = hanya peringatan (tidak perlu upload/verifikasi bukti)';
comment on column pelanggaran.bukti_status is 'Status bukti: belum, menunggu, selesai, ditolak';
comment on column pelanggaran.bukti_url is 'Link Google Drive bukti hukuman (view URL, share anyone with link)';
