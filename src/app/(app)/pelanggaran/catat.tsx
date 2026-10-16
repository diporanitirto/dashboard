"use client";

import { useMemo, useState, useTransition } from "react";
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

interface Props {
  jenis: JenisPelanggaran[];
  tahap: TahapHukuman[];
  siswaList: SiswaOption[];
  rows: PelanggaranRow[];
}

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:opacity-60";

export default function Catat({ jenis, tahap, siswaList, rows }: Props) {
  const [query, setQuery] = useState("");
  const [siswa, setSiswa] = useState<SiswaOption | null>(null);
  const [jenisId, setJenisId] = useState("");
  const [poin, setPoin] = useState("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const jenisAktif = useMemo(() => jenis.filter((j) => j.aktif), [jenis]);

  const hasilCari = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return siswaList.slice(0, 8);
    return siswaList
      .filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nis.includes(q) ||
          s.kelas.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, siswaList]);

  const catatanSiswa = useMemo(
    () => rows.filter((r) => r.siswa_id === siswa?.id),
    [rows, siswa]
  );
  const totalSekarang = catatanSiswa.reduce((sum, r) => sum + (r.poin ?? 0), 0);

  const poinAngka = Math.min(100, Math.max(0, Math.round(Number(poin) || 0)));
  const totalPrediksi = totalSekarang + poinAngka;
  const hukumanPrediksi = tahapUntukPoin(totalPrediksi, tahap);
  const perluBuktiPrediksi = perluBuktiUntukPoin(totalPrediksi, tahap);

  const pilihJenis = (value: string) => {
    setJenisId(value);
    const j = jenis.find((x) => String(x.id) === value);
    if (j) setPoin(String(j.poin));
  };

  const resetForm = () => {
    setSiswa(null);
    setQuery("");
    setJenisId("");
    setPoin("");
    setKeterangan("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!siswa) {
      setError("Pilih siswa dulu.");
      return;
    }
    if (!jenisId) {
      setError("Pilih jenis pelanggaran.");
      return;
    }
    if (poinAngka <= 0) {
      setError("Poin minimal 1.");
      return;
    }

    const fd = new FormData();
    fd.set("siswa_id", String(siswa.id));
    fd.set("jenis_id", jenisId);
    fd.set("poin", String(poinAngka));
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
                        }}
                        className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-accent/60"
                      >
                        <span className="truncate font-medium">{s.nama}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {s.kelas} • {s.nis}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Detail pelanggaran */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Jenis Pelanggaran</label>
              <select
                value={jenisId}
                onChange={(e) => pilihJenis(e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih jenis…</option>
                {jenisAktif.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nama} ({j.poin} poin)
                  </option>
                ))}
              </select>
              {jenisAktif.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Belum ada jenis aktif. Tambah dulu di tab Pengaturan.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Poin</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={poin}
                  onChange={(e) => setPoin(e.target.value)}
                  className={inputClass}
                />
              </div>
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
                    <span className="font-semibold">{totalSekarang} poin</span>
                  </p>
                  <p>
                    Setelah dicatat: <span className="font-semibold">{totalPrediksi} poin</span>. Hukuman
                    berlaku:{" "}
                    <span className="font-semibold">{hukumanPrediksi?.hukuman ?? "tidak ada"}</span>
                    {hukumanPrediksi && !perluBuktiPrediksi && " (tanpa bukti)"}
                    {hukumanPrediksi && perluBuktiPrediksi && " (perlu unggah bukti)"}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Pilih siswa untuk melihat perhitungan poin & hukuman.</p>
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
