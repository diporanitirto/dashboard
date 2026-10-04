import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPowerOff, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import TambahPendamping from "./tambah";
import MoveButton from "./move-button";
import { hapusPendamping, toggleAktifPendamping } from "./actions";

export const dynamic = "force-dynamic";

export default async function PendampingPage() {
  if (!isSupabaseConfigured()) {
    return <p className="text-muted-foreground">Supabase belum dikonfigurasi.</p>;
  }
  const supabase = getSupabase();
  const { data: kelasList } = await supabase.from("kelas").select("id, nama, pendamping(id, nama, kontak, aktif)").order("nama");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pendamping Kelas</h1>
      <TambahPendamping kelasList={(kelasList ?? []).map((k: any) => ({ id: k.id, nama: k.nama }))} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kelasList?.map((kelas: any) => (
          <Card key={kelas.id}>
            <CardHeader>
              <CardTitle>
                Kelas {kelas.nama} <Badge variant="secondary">{kelas.pendamping?.length ?? 0} PK</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kelas.pendamping && kelas.pendamping.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {kelas.pendamping.map((p: any) => (
                    <li key={p.id} className="space-y-1.5 border-b pb-2 last:border-0">
                      <span className="flex items-center gap-2">
                        <form action={hapusPendamping}>
                          <input type="hidden" name="id" value={p.id} />
                          <button title="Hapus" className="rounded-md border px-2 py-1 text-destructive hover:bg-destructive/10">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </form>
                        <span className="font-medium">{p.nama}</span>
                      </span>
                      <span className="flex items-center gap-2 pl-9">
                        <form action={toggleAktifPendamping} title="Klik untuk ubah status aktif">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="aktif" value={String(p.aktif)} />
                          <button type="submit" className="cursor-pointer">
                            <Badge variant={p.aktif ? "default" : "secondary"}>
                              <FontAwesomeIcon icon={faPowerOff} className="mr-1" />
                              {p.aktif ? "aktif" : "nonaktif"}
                            </Badge>
                          </button>
                        </form>
                        <MoveButton
                          pkId={p.id}
                          nama={p.nama}
                          kelasList={(kelasList ?? []).filter((k: any) => k.id !== kelas.id).map((k: any) => ({ id: k.id, nama: k.nama }))}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada pendamping.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
