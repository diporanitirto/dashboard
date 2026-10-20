import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import DaftarSiswa, { type KelasDenganSiswa } from "./daftar-siswa";

export const dynamic = "force-dynamic";

export default async function SiswaPage() {
  if (!isSupabaseConfigured()) {
    return <p className="text-muted-foreground">Supabase belum dikonfigurasi.</p>;
  }

  const supabase = getSupabase();
  const { data: kelasList, error } = await supabase
    .from("kelas")
    .select("id, nama, siswa(id, nis, nama, jk, agama, kelas_id)")
    .order("nama");

  if (error) {
    console.error("Gagal memuat data siswa:", error.message);
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Siswa</h1>
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-700"
        >
          Gagal memuat data siswa. Periksa koneksi lalu muat ulang halaman.
        </p>
        <a
          href="/siswa"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Coba lagi
        </a>
      </div>
    );
  }

  return <DaftarSiswa kelasList={(kelasList ?? []) as KelasDenganSiswa[]} />;
}
