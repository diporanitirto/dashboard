import { redirect } from "next/navigation";
import RefreshControls from "@/components/refresh-controls";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { JenisPelanggaran, PelanggaranRow, SiswaOption, TahapHukuman } from "@/lib/pelanggaran";
import Catat from "../catat";
import Daftar from "../daftar";
import Rekap from "../rekap";
import Pengaturan from "../pengaturan";

export const dynamic = "force-dynamic";

const SECTIONS = ["catat", "daftar", "rekap", "pengaturan"];

export default async function PelanggaranSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!SECTIONS.includes(section)) redirect("/pelanggaran/catat");

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

  const kelas: { id: number; nama: string }[] = (kelasRes.data ?? []).map(
    (k: { id: number; nama: string }) => ({ id: k.id, nama: k.nama })
  );

  const jenis = (jenisRes.data ?? []) as JenisPelanggaran[];
  const tahap = (tahapRes.data ?? []) as TahapHukuman[];
  const rows = (rowsRes.data ?? []) as PelanggaranRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pelanggaran</h1>
          <p className="text-sm text-muted-foreground">
            Catat pelanggaran, verifikasi bukti hukuman, dan pantau catatan siswa.
          </p>
        </div>
        <RefreshControls />
      </div>

      {section === "catat" && <Catat jenis={jenis} tahap={tahap} kelas={kelas} siswaList={siswaList} rows={rows} />}
      {section === "daftar" && <Daftar rows={rows} />}
      {section === "rekap" && <Rekap rows={rows} tahap={tahap} />}
      {section === "pengaturan" && <Pengaturan jenis={jenis} tahap={tahap} />}
    </div>
  );
}
