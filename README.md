# Dashboard Izin DIPORANI

Dashboard visual untuk memantau dan mengelola izin siswa DIPORANI kelas X1–X8. Halaman ini menyajikan ringkasan status, distribusi kelas, daftar izin terkini, serta aksi approve/hapus dalam satu tampilan elegan.

## Fitur Utama
- Ringkasan metrik (total izin, pending, approved, persentase approval)
- Filter status, kelas, dan pencarian kata kunci
- Tabel interaktif dengan aksi approve dan hapus
- Distribusi izin per kelas dengan bar progress
- Panel aktivitas terbaru berisi 5 pengajuan terakhir
- Integrasi penuh dengan Supabase

## Setup Cepat
1. **Install dependencies**
	```bash
	npm install
	```
2. **Konfigurasi environment Supabase** di `.env.local`
	```env
	NEXT_PUBLIC_SUPABASE_URL=your-project-url
	NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
	```
3. **Siapkan database** lewat Supabase SQL Editor dengan menjalankan `supabase-setup.sql`.
4. **Jalankan development server**
	```bash
	npm run dev
	```
5. Akses dashboard di `http://localhost:3000`.

## Struktur Utama
```
src/
 ├─ app/
 │   ├─ api/izin/           # Endpoint GET/PATCH/DELETE ke Supabase
 │   ├─ page.tsx            # Halaman dashboard
 │   └─ globals.css
 ├─ components/
 │   ├─ ClassDistribution.tsx
 │   ├─ IzinTable.tsx
 │   ├─ RecentActivity.tsx
 │   ├─ StatusBadge.tsx
 │   └─ SummaryCards.tsx
 └─ lib/
	  └─ supabase.ts         # Inisialisasi client Supabase
```

## Alur Data
1. Form izin (aplikasi terpisah) menyimpan data ke tabel `izin` di Supabase.
2. Dashboard mengambil data melalui endpoint `/api/izin`.
3. Aksi approve/hapus di dashboard memanggil endpoint PATCH/DELETE yang meneruskan perubahan ke Supabase.

## Catatan Keamanan
- Contoh policy pada `supabase-setup.sql` mengizinkan akses penuh untuk user authenticated. Sesuaikan sebelum production.
- Jika memerlukan akses publik (tanpa login), aktifkan policy opsional yang disediakan hanya untuk testing.

