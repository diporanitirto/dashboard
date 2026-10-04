"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatKelas } from "@/lib/utils";

export interface IzinRow {
  id: string;
  created_at: string;
  nis: string | null;
  nama: string;
  absen: number | null;
  kelas: string;
  sangga: string | null;
  alasan: string | null;
  pk_kelas: string | null;
  ip?: string | null;
  device?: string | null;
  user_agent?: string | null;
}

function formatTanggal(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatJam(d: string) {
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function IzinTable({
  rows,
  jumlahIzinPerNis = {},
}: {
  rows: IzinRow[];
  jumlahIzinPerNis?: Record<string, number>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ul className="divide-y">
      {rows.map((i) => {
        const expanded = expandedId === i.id;
        return (
          <li key={i.id}>
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : i.id)}
              className="-mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent/60"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{i.nama}</p>
                <p className="text-xs text-muted-foreground">
                  {formatKelas(i.kelas)}
                  {i.sangga ? ` • ${i.sangga}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-right text-xs text-muted-foreground">
                {formatTanggal(i.created_at)}
                <span className="hidden sm:inline"> · {formatJam(i.created_at)}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            {expanded && (
              <div className="mb-3 rounded-lg border bg-muted/40 p-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">NIS</dt>
                    <dd className="mt-0.5">{i.nis || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Nomor Absen</dt>
                    <dd className="mt-0.5">{i.absen ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Kelas</dt>
                    <dd className="mt-0.5">{formatKelas(i.kelas)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Sangga</dt>
                    <dd className="mt-0.5">{i.sangga || "-"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Pembina Kelas</dt>
                    <dd className="mt-0.5">{i.pk_kelas || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Waktu Izin</dt>
                    <dd className="mt-0.5">
                      {formatTanggal(i.created_at)}, {formatJam(i.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Sudah Izin (bulan ini)</dt>
                    <dd className="mt-0.5">
                      {i.nis ? `${jumlahIzinPerNis[i.nis] ?? 1}× minggu` : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">IP</dt>
                    <dd className="mt-0.5">{i.ip || "-"}</dd>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs text-muted-foreground">Perangkat</dt>
                    <dd className="mt-0.5">{i.device || "-"}</dd>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs text-muted-foreground">Alasan Izin</dt>
                    <dd className="mt-1 whitespace-pre-wrap rounded-md border bg-background p-3">{i.alasan || "-"}</dd>
                  </div>
                </dl>
                {i.user_agent && (
                  <p className="mt-3 break-all text-xs text-muted-foreground">User-Agent: {i.user_agent}</p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
