import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RefreshControls from "@/components/refresh-controls";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatKelas, weekKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RekapPage() {
  if (!isSupabaseConfigured()) {
    return <p className="text-muted-foreground">Supabase belum dikonfigurasi.</p>;
  }
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

  // 1 siswa izin berapa kali pun dalam seminggu dihitung 1
  const unikPerKelas = new Map<string, Set<string>>();
  for (const k of kelasList ?? []) {
    unikPerKelas.set(k.nama, new Set());
  }

  const perSiswaMap = new Map<string, { nis: string; nama: string; kelas: string; minggu: Set<string> }>();
  for (const i of izinList ?? []) {
    const kelas = formatKelas(i.kelas);
    unikPerKelas.get(kelas)?.add(i.nis ? `${i.nis}|${weekKey(i.created_at)}` : i.id);

    const key = i.nis ?? i.id;
    if (!perSiswaMap.has(key)) {
      perSiswaMap.set(key, { nis: i.nis ?? "-", nama: i.nama, kelas, minggu: new Set() });
    }
    perSiswaMap.get(key)?.minggu.add(weekKey(i.created_at));
  }

  const perKelas = new Map([...unikPerKelas].map(([nama, set]) => [nama, set.size]));
  const perSiswa = [...perSiswaMap.values()]
    .map((s) => ({ ...s, total: s.minggu.size }))
    .sort((a, b) => b.total - a.total || a.nama.localeCompare(b.nama));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rekap Izin</h1>
          <p className="text-sm text-muted-foreground">Periode {periode} · hitungan reset tiap tanggal 1</p>
        </div>
        <RefreshControls />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Per Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1">Kelas</th>
                <th>Total Izin</th>
              </tr>
            </thead>
            <tbody>
              {[...perKelas.entries()].map(([nama, total]) => (
                <tr key={nama} className="border-t">
                  <td className="py-1.5">{nama}</td>
                  <td>{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          {perSiswa.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1">Nama</th>
                  <th>NIS</th>
                  <th>Kelas</th>
                  <th className="text-right">Izin</th>
                </tr>
              </thead>
              <tbody>
                {perSiswa.map((s) => (
                  <tr key={s.nis} className="border-t">
                    <td className="py-1.5">{s.nama}</td>
                    <td>{s.nis}</td>
                    <td>{s.kelas}</td>
                    <td className={`text-right ${s.total >= 3 ? "font-semibold text-destructive" : ""}`}>{s.total}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data izin.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
