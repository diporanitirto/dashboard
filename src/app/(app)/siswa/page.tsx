import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SiswaPage() {
  if (!isSupabaseConfigured()) {
    return <p className="text-muted-foreground">Supabase belum dikonfigurasi.</p>;
  }
  const supabase = getSupabase();
  const { data: kelasList } = await supabase.from("kelas").select("id, nama, siswa(id, nis, nama, jk, agama)").order("nama");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Siswa</h1>
      {kelasList?.map((kelas: any) => (
        <Card key={kelas.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Kelas {kelas.nama}
              <Badge variant="secondary">{kelas.siswa?.length ?? 0} siswa</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1">NIS</th>
                  <th>Nama</th>
                  <th>JK</th>
                  <th>Agama</th>
                </tr>
              </thead>
              <tbody>
                {kelas.siswa?.map((s: any) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-1.5">{s.nis}</td>
                    <td>{s.nama}</td>
                    <td>{s.jk}</td>
                    <td>{s.agama}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
