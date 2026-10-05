import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabase } from "@/lib/supabase";
import { formatKelas, weekKey } from "@/lib/utils";

export async function GET() {
  const supabase = getSupabase();
  const now = new Date();
  const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periode = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const { data: kelasList } = await supabase.from("kelas").select("id, nama").order("nama");
  const { data: izinList } = await supabase
    .from("izin")
    .select("id, kelas, nis, nama, created_at")
    .eq("is_archived", false)
    .eq("status", "approved")
    .gte("created_at", awalBulan);

  const unikPerKelas = new Map<string, Set<string>>();
  for (const k of kelasList ?? []) unikPerKelas.set(k.nama, new Set());

  const perSiswaMap = new Map<string, { nis: string; nama: string; kelas: string; minggu: Set<string> }>();
  for (const i of izinList ?? []) {
    const kelas = formatKelas(i.kelas);
    unikPerKelas.get(kelas)?.add(i.nis ? `${i.nis}|${weekKey(i.created_at)}` : i.id);
    const key = i.nis ?? i.id;
    if (!perSiswaMap.has(key)) perSiswaMap.set(key, { nis: i.nis ?? "-", nama: i.nama, kelas, minggu: new Set() });
    perSiswaMap.get(key)?.minggu.add(weekKey(i.created_at));
  }

  const perKelas = [["Kelas", "Total Izin"], ...[...unikPerKelas.entries()].map(([n, s]) => [n, s.size])];
  const perSiswa = [
    ["Nama", "NIS", "Kelas", "Izin"],
    ...[...perSiswaMap.values()]
      .map((s) => ({ ...s, total: s.minggu.size }))
      .sort((a, b) => b.total - a.total || a.nama.localeCompare(b.nama))
      .map((s) => [s.nama, s.nis, s.kelas, s.total]),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(perKelas), "Per Kelas");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(perSiswa), "Per Siswa");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Rekap_Izin_${periode.replace(/ /g, "_")}.xlsx"`,
    },
  });
}
