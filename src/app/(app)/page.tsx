import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RefreshControls from "@/components/refresh-controls";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { countUniquePerWeek, formatKelas } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Supabase belum dikonfigurasi. Salin <code>.env.example</code> ke <code>.env.local</code> lalu isi URL dan key-nya.
        </p>
      </div>
    );
  }

  const supabase = getSupabase();
  const now = new Date();
  const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const awalMinggu = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).toISOString();

  const [{ count: siswaCount }, { count: pendampingCount }, { data: izinMingguIni }, { data: izinBulanIni }, { data: izinTerbaru }] =
    await Promise.all([
      supabase.from("siswa").select("*", { count: "exact", head: true }),
      supabase.from("pendamping").select("*", { count: "exact", head: true }),
      supabase.from("izin").select("id, nis, created_at").eq("is_archived", false).gte("created_at", awalMinggu),
      supabase.from("izin").select("id, nis, created_at").eq("is_archived", false).gte("created_at", awalBulan),
      supabase.from("izin").select("id, created_at, nama, kelas").eq("is_archived", false).order("created_at", { ascending: false }).limit(5),
    ]);

  const cards = [
    { label: "Total Siswa", value: siswaCount ?? 0 },
    { label: "Pendamping Kelas", value: pendampingCount ?? 0 },
    { label: "Izin Minggu Ini", value: countUniquePerWeek(izinMingguIni ?? []) },
    { label: "Izin Bulan Ini", value: countUniquePerWeek(izinBulanIni ?? []) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <RefreshControls />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Izin Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {izinTerbaru && izinTerbaru.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {izinTerbaru.map((i: { id: string; created_at: string; nama: string; kelas: string }) => (
                <li key={i.id} className="flex justify-between border-b py-2 last:border-0">
                  <span>
                    {i.nama} ({formatKelas(i.kelas)})
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(i.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data izin.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
