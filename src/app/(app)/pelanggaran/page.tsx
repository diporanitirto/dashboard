import RefreshControls from "@/components/refresh-controls";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { JenisPelanggaran, PelanggaranRow, SiswaOption, TahapHukuman } from "@/lib/pelanggaran";
import PelanggaranTabs from "./pelanggaran-tabs";

export const dynamic = "force-dynamic";

export default async function PelanggaranPage() {
  if (!isSupabaseConfigured()) {
    return <p className="text-muted-foreground">Supabase belum dikonfigurasi.</p>;
  }

  const supabase = getSupabase();
  const [jenisRes, tahapRes, kelasRes, rowsRes] = await Promise.all([
    supabase.from("jenis_pelanggaran").select("id, nama, poin, aktif").order("nama"),
    supabase.from("tahap_hukuman").select("id, min_poin, hukuman").order("min_poin"),
    supabase.from("kelas").select("id, nama, siswa(id, nis, nama)").order("nama"),
    supabase.from("pelanggaran").select("*").order("created_at", { ascending: false }),
  ]);

  if (rowsRes.error || jenisRes.error || tahapRes.error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Pelanggaran</h1>
        <p className="text-sm text-muted-foreground">
          Tabel <code>pelanggaran</code> belum ada. Jalankan dulu <code>sql/06-pelanggaran.sql</code> di Supabase SQL Editor.
        </p>
      </div>
    );
  }

  const siswaList: SiswaOption[] = (kelasRes.data ?? []).flatMap((k: { nama: string; siswa?: { id: number; nis: string; nama: string }[] }) =>
    (k.siswa ?? []).map((s) => ({ id: s.id, nis: s.nis, nama: s.nama, kelas: k.nama }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pelanggaran</h1>
          <p className="text-sm text-muted-foreground">
            Catat pelanggaran, verifikasi bukti hukuman, dan pantau poin siswa.
          </p>
        </div>
        <RefreshControls />
      </div>
      <PelanggaranTabs
        jenis={(jenisRes.data ?? []) as JenisPelanggaran[]}
        tahap={(tahapRes.data ?? []) as TahapHukuman[]}
        siswaList={siswaList}
        rows={(rowsRes.data ?? []) as PelanggaranRow[]}
      />
    </div>
  );
}
