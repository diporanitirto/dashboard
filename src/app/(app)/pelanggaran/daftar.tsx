"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/components/notifier";
import {
  BUKTI_STATUS_INFO,
  formatJam,
  formatTanggal,
  type BuktiStatus,
  type PelanggaranRow,
} from "@/lib/pelanggaran";
import { hapusPelanggaran, verifikasiBukti } from "./actions";

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:opacity-60";

export default function Daftar({ rows }: { rows: PelanggaranRow[] }) {
  const [q, setQ] = useState("");
  const [kelas, setKelas] = useState("");
  const [status, setStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [pending, startTransition] = useTransition();

  const kelasOptions = useMemo(
    () => [...new Set(rows.map((r) => r.kelas).filter(Boolean))].sort() as string[],
    [rows]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (kelas && r.kelas !== kelas) return false;
      if (status && r.bukti_status !== status) return false;
      if (
        s &&
        !(
          r.nama.toLowerCase().includes(s) ||
          (r.nis ?? "").includes(s) ||
          (r.jenis_nama ?? "").toLowerCase().includes(s)
        )
      )
        return false;
      return true;
    });
  }, [rows, q, kelas, status]);

  const doVerifikasi = (row: PelanggaranRow, newStatus: "selesai" | "ditolak", note = "") => {
    const fd = new FormData();
    fd.set("id", row.id);
    fd.set("status", newStatus);
    fd.set("note", note);

    startTransition(async () => {
      const res = await verifikasiBukti(fd);
      if (res.ok) {
        notify(
          newStatus === "selesai"
            ? `Hukuman ${row.nama} ditandai selesai.`
            : `Bukti ${row.nama} ditolak.`
        );
        setRejectId(null);
        setRejectNote("");
      } else {
        notify(res.error ?? "Gagal memperbarui status.");
      }
    });
  };

  const doHapus = (row: PelanggaranRow) => {
    if (!confirm(`Hapus catatan "${row.jenis_nama}" milik ${row.nama}? Poin akan hilang dari rekap.`)) {
      return;
    }
    const fd = new FormData();
    fd.set("id", row.id);

    startTransition(async () => {
      const res = await hapusPelanggaran(fd);
      if (res.ok) {
        notify(`Catatan ${row.nama} dihapus.`);
        setExpandedId(null);
      } else {
        notify(res.error ?? "Gagal menghapus catatan.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pelanggaran & Verifikasi Bukti</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter */}
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / NIS / jenis..."
            className={inputClass}
            aria-label="Cari pelanggaran"
          />
          <select
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className={inputClass}
            aria-label="Filter kelas"
          >
            <option value="">Semua kelas</option>
            {kelasOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
            aria-label="Filter status bukti"
          >
            <option value="">Semua status bukti</option>
            {(Object.keys(BUKTI_STATUS_INFO) as BuktiStatus[]).map((s) => (
              <option key={s} value={s}>
                {s === "belum" ? "Belum unggah / Peringatan" : BUKTI_STATUS_INFO[s].label}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {filtered.length} dari {rows.length} catatan
        </p>

        {/* List */}
        <div className="mt-3 space-y-2">
          {filtered.length === 0 ? (
            <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
              Tidak ada catatan yang cocok.
            </p>
          ) : (
            filtered.map((r) => {
              const expanded = expandedId === r.id;
              const info = r.perlu_bukti
                ? BUKTI_STATUS_INFO[r.bukti_status]
                : { label: "Peringatan", className: "bg-secondary text-secondary-foreground" };
              return (
                <div key={r.id} className="overflow-hidden rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : r.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50"
                    aria-expanded={expanded}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.nama}
                        <span className="ml-2 hidden text-xs font-normal text-muted-foreground sm:inline">
                          {r.kelas} • {r.nis}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="sm:hidden">
                          {r.kelas} • {r.nis} •{" "}
                        </span>
                        {r.jenis_nama ?? "Pelanggaran"} • +{r.poin} poin • {formatTanggal(r.tanggal)}{" "}
                        {formatJam(r.created_at)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[0.65rem] font-medium ${info.className}`}>
                      {info.label}
                    </span>
                    <span
                      className={`shrink-0 text-xs text-muted-foreground transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {expanded && (
                    <div className="space-y-3 border-t bg-muted/30 p-4">
                      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                        <div>
                          <p className="text-muted-foreground">Poin</p>
                          <p className="font-medium">+{r.poin}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total poin saat itu</p>
                          <p className="font-medium">{r.total_poin ?? "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Hukuman saat itu</p>
                          <p className="font-medium">{r.hukuman ?? "Tidak ada"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dicatat oleh</p>
                          <p className="font-medium">{r.dicatat_oleh ?? "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Diverifikasi oleh</p>
                          <p className="font-medium">{r.verified_by ?? "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Waktu verifikasi</p>
                          <p className="font-medium">
                            {r.verified_at ? `${formatTanggal(r.verified_at)} ${formatJam(r.verified_at)}` : "-"}
                          </p>
                        </div>
                        {r.keterangan && (
                          <div className="col-span-2 sm:col-span-4">
                            <p className="text-muted-foreground">Keterangan</p>
                            <p className="mt-1 rounded-lg border bg-background p-2.5">{r.keterangan}</p>
                          </div>
                        )}
                        {r.bukti_status === "ditolak" && r.bukti_note && (
                          <div className="col-span-2 sm:col-span-4">
                            <p className="text-muted-foreground">Alasan ditolak</p>
                            <p className="mt-1 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-destructive">
                              {r.bukti_note}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Bukti */}
                      <div className="space-y-2">
                        {!r.perlu_bukti ? (
                          <p className="text-xs text-muted-foreground">
                            Hanya peringatan, tidak perlu unggah bukti.
                          </p>
                        ) : r.bukti_url ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={r.bukti_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                            >
                              Buka di Google Drive
                            </a>
                            {r.bukti_file_id && (
                              <button
                                type="button"
                                onClick={() => setPreviewId(previewId === r.id ? null : r.id)}
                                className="rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                              >
                                {previewId === r.id ? "Tutup foto" : "Lihat foto"}
                              </button>
                            )}
                            {r.bukti_uploaded_at && (
                              <span className="text-xs text-muted-foreground">
                                Diunggah {formatTanggal(r.bukti_uploaded_at)} {formatJam(r.bukti_uploaded_at)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Siswa belum unggah bukti.
                          </p>
                        )}

                        {previewId === r.id && r.bukti_file_id && (
                          <iframe
                            src={`https://drive.google.com/file/d/${r.bukti_file_id}/preview`}
                            className="h-80 w-full rounded-lg border bg-background"
                            title={`Foto bukti ${r.nama}`}
                          />
                        )}
                      </div>

                      {/* Aksi */}
                      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                        {r.perlu_bukti && r.bukti_status !== "selesai" && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => doVerifikasi(r, "selesai")}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Setujui / Tandai Selesai
                          </button>
                        )}
                        {r.perlu_bukti && r.bukti_status === "menunggu" && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              setRejectId(rejectId === r.id ? null : r.id);
                              setRejectNote("");
                            }}
                            className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/80 disabled:opacity-60"
                          >
                            Tolak Bukti
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => doHapus(r)}
                          className="rounded-md border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-60"
                        >
                          Hapus Catatan
                        </button>
                      </div>

                      {rejectId === r.id && (
                        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                          <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            rows={2}
                            placeholder="Alasan penolakan (wajib), contoh: foto buram, tolong foto ulang..."
                            className={inputClass}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => doVerifikasi(r, "ditolak", rejectNote)}
                              className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/80 disabled:opacity-60"
                            >
                              Kirim Penolakan
                            </button>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                setRejectId(null);
                                setRejectNote("");
                              }}
                              className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-60"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
