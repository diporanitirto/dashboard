"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/components/notifier";
import {
  perluBuktiUntukPoin,
  tahapUntukPoin,
  type JenisPelanggaran,
  type PelanggaranRow,
  type SiswaOption,
  type TahapHukuman,
} from "@/lib/pelanggaran";
import { catatPelanggaran } from "./actions";
import SiswaForm from "../siswa/siswa-form";

interface Props {
  jenis: JenisPelanggaran[];
  tahap: TahapHukuman[];
  kelas: { id: number; nama: string }[];
  siswaList: SiswaOption[];
  rows: PelanggaranRow[];
}

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:opacity-60";

export default function Catat({ jenis, tahap, kelas, siswaList, rows }: Props) {
  const [query, setQuery] = useState("");
  const [tambahan, setTambahan] = useState<SiswaOption[]>([]);
  const daftar = useMemo(() => {
    const ids = new Set(siswaList.map((s) => s.id));
    const extras = tambahan.filter((s) => !ids.has(s.id));
    return [...siswaList, ...extras];
  }, [siswaList, tambahan]);
  const [tambahTerbuka, setTambahTerbuka] = useState(false);
  const [siswa, setSiswa] = useState<SiswaOption | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const jenisAktif = useMemo(() => jenis.filter((j) => j.aktif), [jenis]);

  const hasilCari = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return daftar.slice(0, 8);
    return daftar
      .filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nis.includes(q) ||
          s.kelas.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, daftar]);

  const catatanSiswa = useMemo(
    () => rows.filter((r) => r.siswa_id === siswa?.id),
    [rows, siswa]
  );
  const totalSekarang = catatanSiswa.reduce((sum, r) => sum + (r.poin ?? 0), 0);

  const POIN_PER_CATATAN = 1;
  const poinAngka = selectedIds.size > 0 ? POIN_PER_CATATAN : 0;
  const totalPrediksi = totalSekarang + poinAngka;
  const hukumanPrediksi = tahapUntukPoin(totalPrediksi, tahap);
  const perluBuktiPrediksi = perluBuktiUntukPoin(totalPrediksi, tahap);

  const toggleJenis = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetForm = () => {
    setSiswa(null);
    setQuery("");
    setSelectedIds(new Set());
    setKeterangan("");
    setError(null);
    setTambahTerbuka(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!siswa) {
      setError("Pilih siswa dulu.");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Pilih minimal satu jenis pelanggaran.");
      return;
    }
    if (poinAngka <= 0) {
      setError("Pilih minimal satu jenis pelanggaran.");
      return;
    }

    const fd = new FormData();
    fd.set("siswa_id", String(siswa.id));
    fd.set("jenis_ids", [...selectedIds].join(","));
    fd.set("poin", "1");
    fd.set("tanggal", tanggal);
    fd.set("keterangan", keterangan);

    startTransition(async () => {
      const res = await catatPelanggaran(fd);
      if (res.ok) {
        notify(`Pelanggaran ${siswa.nama} dicatat.`);
        resetForm();
      } else {
        setError(res.error ?? "Gagal menyimpan.");
      }
    });
  };

  const selectedJenisList = jenisAktif.filter((j) => selectedIds.has(j.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catat Pelanggaran</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
          {/* Pilih siswa */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Siswa</label>
            {siswa ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{siswa.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {siswa.kelas} • NIS {siswa.nis}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSiswa(null)}
                  className="shrink-0 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama / NIS / kelas..."
                  className={inputClass}
                />
                <div className="max-h-56 overflow-y-auto rounded-lg border">
                  {hasilCari.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-muted-foreground">Tidak ditemukan.</p>
                  ) : (
                    hasilCari.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSiswa(s);
                          setQuery("");
                          setTambahTerbuka(false);
                        }}
                        className="flex min-h-11 w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <span className="truncate font-medium">{s.nama}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {s.kelas} • {s.nis}
                        </span>
                      </button>
                    ))
                  )}
                  {query.trim().length >= 2 && !tambahTerbuka && (
                    <button
                      type="button"
                      onClick={() => setTambahTerbuka(true)}
                      className="flex min-h-11 w-full items-center border-t px-3 py-2 text-left text-xs font-medium text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      {`Tambah siswa baru "${query.trim()}"`}
                    </button>
                  )}
                </div>
                {tambahTerbuka && (
                  <SiswaForm
                    kelasList={kelas}
                    awalNama={query.trim()}
                    embedded
                    onSukses={(s) => {
                      const baru: SiswaOption = {
                        id: s.id,
                        nis: s.nis,
                        nama: s.nama,
                        kelas: s.kelas_nama ?? "",
                      };
                      setTambahan((prev) => [...prev, baru]);
                      setSiswa(baru);
                      setQuery("");
                      setTambahTerbuka(false);
                    }}
                    onBatal={() => setTambahTerbuka(false)}
                  />
                )}
              </>
            )}
          </div>

          {/* Detail pelanggaran */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Jenis Pelanggaran (bisa pilih lebih dari satu)
              </label>
              {jenisAktif.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada jenis aktif. Tambah dulu di tab Pengaturan.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {jenisAktif.map((j) => {
                    const selected = selectedIds.has(j.id);
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => toggleJenis(j.id)}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "hover:bg-accent/60"
                        }`}
                        aria-pressed={selected}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">{j.nama}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Keterangan (opsional)</label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={2}
                placeholder="Contoh: terlambat upacara pembukaan"
                className={inputClass}
              />
            </div>
          </div>

          {/* Preview & submit */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              {siswa ? (
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold">{siswa.nama}</span> ({siswa.kelas}) punya{" "}
                    {catatanSiswa.length} catatan, total saat ini{" "}
                    <span className="font-semibold">{totalSekarang} catatan</span>
                  </p>
                  {selectedJenisList.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Dipilih: {selectedJenisList.map((j) => j.nama).join(", ")}
                    </p>
                  )}
                  <p>
                    Setelah dicatat: <span className="font-semibold">{totalPrediksi} catatan</span>. Hukuman
                    berlaku:{" "}
                    <span className="font-semibold">{hukumanPrediksi?.hukuman ?? "tidak ada"}</span>
                    {hukumanPrediksi && !perluBuktiPrediksi && " (tanpa bukti)"}
                    {hukumanPrediksi && perluBuktiPrediksi && " (perlu unggah bukti)"}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Pilih siswa untuk melihat perhitungan catatan & hukuman.</p>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
              >
                {pending ? "Menyimpan..." : "Catat Pelanggaran"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={pending}
                className="rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:bg-accent disabled:opacity-60"
              >
                Bersihkan
              </button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
