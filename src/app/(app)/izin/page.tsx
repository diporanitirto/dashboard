import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RefreshControls from "@/components/refresh-controls";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { weekKey } from "@/lib/utils";
import IzinTable, { type IzinRow } from "./izin-table";

export const dynamic = "force-dynamic";

export default async function IzinPage() {
  if (!isSupabaseConfigured()) {
    return <p className="text-muted-foreground">Supabase belum dikonfigurasi.</p>;
  }
  const supabase = getSupabase();
  const awalBulan = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [{ data: izinList }, { data: riwayat }] = await Promise.all([
    supabase.from("izin").select("*").eq("is_archived", false).order("created_at", { ascending: false }).limit(100),
    supabase.from("izin").select("nis, created_at").eq("is_archived", false).gte("created_at", awalBulan),
  ]);

  // Berapa minggu berbeda tiap siswa sudah izin (1 minggu dihitung 1 walau izin berkali-kali)
  const mingguPerNis = new Map<string, Set<string>>();
  for (const r of riwayat ?? []) {
    if (!r.nis) continue;
    if (!mingguPerNis.has(r.nis)) mingguPerNis.set(r.nis, new Set());
    mingguPerNis.get(r.nis)?.add(weekKey(r.created_at));
  }
  const jumlahIzinPerNis: Record<string, number> = {};
  for (const [nis, minggu] of mingguPerNis) {
    jumlahIzinPerNis[nis] = minggu.size;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Izin</h1>
        <RefreshControls />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Izin</CardTitle>
        </CardHeader>
        <CardContent>
          {izinList && izinList.length > 0 ? (
            <IzinTable rows={izinList as IzinRow[]} jumlahIzinPerNis={jumlahIzinPerNis} />
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data izin.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
