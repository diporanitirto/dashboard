-- Deadline tugas + tracking propagasi ke sangga
-- Jalankan setelah sql/09-sangga.sql

alter table pelanggaran
  add column if not exists deadline date,
  add column if not exists deadline_hari integer,
  add column if not exists sangga_propagated_at timestamptz,
  add column if not exists asal_pelanggaran_id uuid references pelanggaran(id) on delete set null;

create index if not exists idx_pelanggaran_deadline on pelanggaran(deadline);
create index if not exists idx_pelanggaran_asal on pelanggaran(asal_pelanggaran_id);

comment on column pelanggaran.deadline is 'Batas waktu penyelesaian tugas (untuk pelanggaran yang perlu bukti)';
comment on column pelanggaran.deadline_hari is 'Jumlah hari deadline sejak tanggal catat';
comment on column pelanggaran.sangga_propagated_at is 'Waktu propagasi tugas ke anggota sangga lain karena deadline lewat';
comment on column pelanggaran.asal_pelanggaran_id is 'Referensi pelanggaran asal jika baris ini hasil propagasi sangga';