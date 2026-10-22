import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabase } from "@/lib/supabase";
import { daftarBukti, tahapUntukPoin, type PelanggaranRow, type TahapHukuman } from "@/lib/pelanggaran";

const STATUS_LABEL: Record<string, string> = {
  belum: "Belum unggah",
  menunggu: "Menunggu verifikasi",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

export async function GET() {
  const supabase = getSupabase();
  const periode = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [{ data: rowsRes }, { data: tahapRes }] = await Promise.all([
    supabase.from("pelanggaran").select("*").order("created_at", { ascending: false }),
    supabase.from("tahap_hukuman").select("id, min_poin, hukuman").order("min_poin"),
  ]);

  const rows = (rowsRes ?? []) as PelanggaranRow[];
  const tahap = (tahapRes ?? []) as TahapHukuman[];

  // Rekap per siswa
  const perSiswaMap = new Map<
    number,
    { nama: string; nis: string | null; kelas: string | null; jumlah: number; total: number }
  >();
  for (const r of rows) {
    const cur =
      perSiswaMap.get(r.siswa_id) ??
      { nama: r.nama, nis: r.nis, kelas: r.kelas, jumlah: 0, total: 0 };
    cur.jumlah += 1;
    cur.total += r.poin ?? 0;
    perSiswaMap.set(r.siswa_id, cur);
  }

  const perSiswa = [
    ["Nama", "NIS", "Kelas", "Jumlah Pelanggaran", "Total Poin", "Hukuman Berlaku"],
    ...[...perSiswaMap.values()]
      .sort((a, b) => b.total - a.total || a.nama.localeCompare(b.nama))
      .map((s) => [s.nama, s.nis ?? "-", s.kelas ?? "-", s.jumlah, s.total, tahapUntukPoin(s.total, tahap)?.hukuman ?? "-"]),
  ];

  // Rekap per kelas
  const perKelasMap = new Map<string, { jumlah: number; total: number; siswa: Set<number> }>();
  for (const r of rows) {
    const key = r.kelas ?? "-";
    const cur = perKelasMap.get(key) ?? { jumlah: 0, total: 0, siswa: new Set<number>() };
    cur.jumlah += 1;
    cur.total += r.poin ?? 0;
    cur.siswa.add(r.siswa_id);
    perKelasMap.set(key, cur);
  }

  const perKelas = [
    ["Kelas", "Siswa Terlibat", "Jumlah Catatan", "Total Poin"],
    ...[...perKelasMap.entries()]
      .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
      .map(([kelas, v]) => [kelas, v.siswa.size, v.jumlah, v.total]),
  ];

  // Riwayat lengkap
  const riwayat = [
    ["Tanggal", "Nama", "NIS", "Kelas", "Jenis Pelanggaran", "Poin", "Total Poin Saat Itu", "Hukuman Saat Itu", "Status Bukti", "Catatan Verifikasi", "Keterangan", "Link Bukti", "Dicatat Oleh"],
    ...rows.map((r) => [
      new Date(r.created_at).toLocaleDateString("id-ID"),
      r.nama,
      r.nis ?? "-",
      r.kelas ?? "-",
      r.jenis_nama ?? "-",
      r.poin,
      r.total_poin ?? "-",
      r.hukuman ?? "-",
      r.perlu_bukti ? STATUS_LABEL[r.bukti_status] ?? r.bukti_status : "Tanpa bukti (peringatan)",
      r.bukti_note ?? "-",
      r.keterangan ?? "-",
      daftarBukti(r).map((file) => file.url).join("\n") || "-",
      r.dicatat_oleh ?? "-",
    ]),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(perSiswa), "Rekap Siswa");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(perKelas), "Rekap Kelas");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(riwayat), "Riwayat Pelanggaran");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Rekap_Pelanggaran_${periode.replace(/ /g, "_")}.xlsx"`,
    },
  });
}
