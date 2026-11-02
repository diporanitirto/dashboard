-- Tabel sangga + relasi ke siswa
-- Jalankan di Supabase SQL Editor sebelum import sangga.json

create table if not exists sangga (
  id bigint generated always as identity primary key,
  kelas_id bigint references kelas(id) on delete cascade not null,
  nama text not null,
  unique (kelas_id, nama)
);

-- Relasi siswa -> sangga (satu siswa satu sangga)
alter table siswa
  add column if not exists sangga_id bigint references sangga(id) on delete set null;

create index if not exists idx_siswa_sangga on siswa(sangga_id);
create index if not exists idx_sangga_kelas on sangga(kelas_id);

comment on table sangga is 'Kelompok sangga per kelas (perintis, pencoba, pelaksana, pendobrak, penegas, dst)';
comment on column siswa.sangga_id is 'Sangga tempat siswa tergabung';