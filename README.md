<p align="center">
  <img src="public/assets/logo-diporani.png" alt="DIPORANI" width="80">
</p>

<h1 align="center">Dashboard Izin Diporani</h1>

<p align="center">
  Dashboard admin untuk memantau izin pramuka Ambalan Diporani Tirto, SMAN 1 Kasihan.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase" alt="Supabase">
</p>

---

## Tentang

Dashboard ini membaca data yang dikirim siswa lewat aplikasi [Surat Izin Pramuka](https://github.com/diporanitirto/izin) dalam satu project Supabase yang sama. Dipakai oleh dewan ambalan untuk memantau siapa saja yang izin, dari kelas mana, dan sesering apa.

## Fitur

- Daftar izin dengan baris yang bisa dibuka: alasan lengkap, waktu pengajuan, sangga, pembina kelas, alamat IP, dan perangkat pengaju.
- Auto-refresh tiap 15 detik plus tombol refresh manual, tanpa reload halaman.
- Rekap per kelas dan per siswa. Satu siswa yang izin berkali-kali dalam seminggu dihitung satu, dan hitungan kembali ke nol tiap tanggal 1.
- Jumlah izin per siswa dalam satuan minggu, dengan penanda untuk yang sudah tiga kali atau lebih.
- Beranda berisi ringkasan: total siswa, pendamping kelas, izin minggu ini, izin bulan ini, dan pengajuan terbaru.
- Manajemen data siswa dan pendamping kelas.
- Akses dashboard dilindungi login admin. Akun admin disimpan di tabel `admin_users` dan bisa dikelola dari menu **Akun Admin** (admin utama `diporani` bisa melihat password akun).
- Menu **Scan QR** untuk memindai QR di surat izin dan langsung membuka halaman verifikasi — sesi login dashboard diteruskan otomatis. Di mobile ada tombol scan melayang di tengah bawah layar.
- Notifikasi kanan atas untuk akun ditambah/dihapus, copy kredensial, dan izin baru masuk (polling tiap 15 detik).
- Rekap hanya menghitung izin yang sudah **approved**.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Bahasa | TypeScript 5 |
| Styling | Tailwind CSS 4, Base UI, shadcn |
| Database | Supabase (PostgreSQL) |
| Ikon | lucide-react |

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi variabelnya
npm run dev
```

Buka http://localhost:3000, lalu masuk dengan akun admin.

### Environment Variables

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase (fallback) |
| `AUTH_SECRET` | Secret acak untuk sesi login |
| `IZIN_APP_URL` | URL aplikasi izin (untuk redirect hasil scan QR) |

Akun admin tidak lagi lewat env — buat/kelola lewat tabel `admin_users` (SQL ada di folder `../sql/03-admin-users.sql`) dan menu **Akun Admin** di dashboard.

## Terkait

- [diporanitirto/izin](https://github.com/diporanitirto/izin): aplikasi yang dipakai siswa untuk mengajukan izin.
