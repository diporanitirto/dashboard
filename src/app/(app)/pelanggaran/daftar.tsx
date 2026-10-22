"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/components/notifier";
import {
  BUKTI_STATUS_INFO,
  daftarBukti,
  formatJam,
  formatTanggal,
  type BuktiStatus,
  type PelanggaranRow,
} from "@/lib/pelanggaran";
import { hapusPelanggaran, verifikasiBukti } from "./actions";

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:opacity-60";

/** Satu baris info label + nilai. */
function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm leading-snug">{value}</p>
    </div>
  );
}

/** Kartu bagian detail dengan judul kecil. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export default function Daftar({ rows }: { rows: PelanggaranRow[] }) {
  const [q, setQ] = useState("");
  const [kelas, setKelas] = useState("");
  const [status, setStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
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
          (r.jenis_nama ?? "").toLowerCase().includes(s) ||
          (r.hukuman ?? "").toLowerCase().includes(s)
        )
      )
        return false;
      return true;
    });
  }, [rows, q, kelas, status]);

  const menungguCount = useMemo(
    () => rows.filter((r) => r.perlu_bukti && r.bukti_status === "menunggu").length,
    [rows]
  );

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
            ? `Tugas ${row.nama} disetujui.`
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Daftar Pelanggaran & Verifikasi Tugas</CardTitle>
            {menungguCount > 0 && (
              <p className="mt-1 text-xs text-amber-700">
                {menungguCount} tugas menunggu verifikasi
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter */}
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / NIS / jenis / hukuman..."
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
              const files = daftarBukti(r);
              return (
                <div
                  key={r.id}
                  className={`overflow-hidden rounded-lg border transition-colors ${
                    expanded ? "border-primary/40" : ""
                  }`}
                >
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
                        {r.jenis_nama ?? "Pelanggaran"} • {formatTanggal(r.tanggal)}{" "}
                        {formatJam(r.created_at)}
                      </p>
                      {r.hukuman && (
                        <p className="mt-0.5 truncate text-xs italic text-muted-foreground/80">
                          Tugas: {r.hukuman}
                        </p>
                      )}
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
                    <div className="space-y-3 border-t bg-muted/20 p-4">
                      {/* Baris 1: Siswa + status */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-base font-semibold">{r.nama}</p>
                          <p className="text-sm text-muted-foreground">
                            {r.kelas ?? "-"} • NIS {r.nis ?? "-"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 self-start rounded-md px-2.5 py-1 text-xs font-medium ${info.className}`}
                        >
                          {info.label}
                        </span>
                      </div>

                      {/* Seksi Pelanggaran */}
                      <Section title="Pelanggaran">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <Info label="Jenis" value={r.jenis_nama ?? "-"} />
                          <Info label="Total catatan saat itu" value={r.total_poin ?? "-"} />
                          <Info
                            label="Tanggal"
                            value={`${formatTanggal(r.tanggal)} ${formatJam(r.created_at)}`}
                          />
                          <Info label="Dicatat oleh" value={r.dicatat_oleh ?? "-"} />
                          {r.keterangan && (
                            <div className="col-span-2 sm:col-span-3">
                              <Info label="Keterangan" value={r.keterangan} />
                            </div>
                          )}
                        </div>
                      </Section>

                      {/* Seksi Hukuman / Tugas (paling penting, ditonjolkan) */}
                      <Section title="Hukuman / Tugas">
                        {r.hukuman ? (
                          <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 dark:bg-amber-950/20">
                            <p className="text-sm font-medium leading-snug">{r.hukuman}</p>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {r.perlu_bukti
                                ? "Siswa wajib unggah bukti penyelesaian tugas."
                                : "Hanya peringatan, tidak perlu unggah bukti."}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Tidak ada hukuman.</p>
                        )}
                      </Section>

                      {/* Seksi Bukti */}
                      {r.perlu_bukti && (
                        <Section title="Bukti Tugas">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span
                                className={`rounded-md px-2 py-0.5 text-xs font-medium ${info.className}`}
                              >
                                {info.label}
                              </span>
                              {r.bukti_uploaded_at && (
                                <span className="text-xs text-muted-foreground">
                                  Diunggah {formatTanggal(r.bukti_uploaded_at)}{" "}
                                  {formatJam(r.bukti_uploaded_at)}
                                </span>
                              )}
                            </div>

                            {files.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Siswa belum unggah bukti.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {files.map((file, index) => {
                                  const key = `${r.id}-${file.file_id || index}`;
                                  return (
                                    <div key={key} className="space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {(files.length > 1 || file.kind === "video" || file.kind === "folder") && (
                                          <span className="text-xs font-medium text-muted-foreground">
                                            {file.kind === "video"
                                              ? "Video"
                                              : file.kind === "folder"
                                                ? `Folder foto${file.count ? ` (${file.count})` : ""}`
                                                : `Foto ${index + 1}`}
                                          </span>
                                        )}
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                                        >
                                          {file.kind === "video"
                                            ? "Buka video di Drive"
                                            : file.kind === "folder"
                                              ? "Buka folder di Google Drive"
                                              : "Buka di Google Drive"}
                                        </a>
                                        {file.file_id && file.kind !== "folder" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setPreviewKey(previewKey === key ? null : key)
                                            }
                                            className="rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                                          >
                                            {previewKey === key ? "Tutup media" : "Lihat media"}
                                          </button>
                                        )}
                                      </div>

                                      {file.kind === "folder" && (
                                        <p className="text-xs text-muted-foreground">
                                          Semua foto ada di folder ini.
                                        </p>
                                      )}

                                      {previewKey === key && file.file_id && file.kind !== "folder" && (
                                        <iframe
                                          src={`https://drive.google.com/file/d/${file.file_id}/preview`}
                                          className="h-80 w-full rounded-lg border bg-background"
                                          title={`Media bukti ${index + 1} ${r.nama}`}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {r.bukti_status === "ditolak" && r.bukti_note && (
                              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-sm text-destructive">
                                <p className="text-xs font-medium">Alasan ditolak:</p>
                                <p className="mt-0.5">{r.bukti_note}</p>
                              </div>
                            )}
                          </div>
                        </Section>
                      )}

                      {/* Seksi Verifikasi */}
                      {(r.verified_by || r.verified_at) && (
                        <Section title="Verifikasi">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <Info label="Diverifikasi oleh" value={r.verified_by ?? "-"} />
                            <Info
                              label="Waktu verifikasi"
                              value={
                                r.verified_at
                                  ? `${formatTanggal(r.verified_at)} ${formatJam(r.verified_at)}`
                                  : "-"
                              }
                            />
                          </div>
                        </Section>
                      )}

                      {/* Aksi */}
                      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                        {r.perlu_bukti && r.bukti_status !== "selesai" && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => doVerifikasi(r, "selesai")}
                            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Setujui Tugas
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
                            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/80 disabled:opacity-60"
                          >
                            Tolak Bukti
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => doHapus(r)}
                          className="rounded-md border px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
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
                              className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-white hover:bg-destructive/80 disabled:opacity-60"
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
                              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-60"
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
