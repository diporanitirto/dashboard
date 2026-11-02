-- Jalankan di Supabase SQL Editor
create table if not exists admin_users (
  username text primary key,
  password text not null,
  created_at timestamptz default now()
);

-- Akun utama, ganti password-nya
insert into admin_users (username, password)
values ('diporani', 'inidiporani')
on conflict (username) do nothing;
