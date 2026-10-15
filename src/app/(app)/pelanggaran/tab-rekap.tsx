"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  tahapUntukPoin,
  type PelanggaranRow,
  type TahapHukuman,
} from "@/lib/pelanggaran";

interface Props {
  rows: PelanggaranRow[];
  tahap: TahapHukuman[];
}

interface RekapSiswa {
  siswa_id: number;
  nama: string;
  nis: string | null;
  kelas: string | null;
  jumlah: number;
  total: number;
  menunggu: number;
}

export default function TabRekap({ rows, tahap }: Props) {
  const perSiswa = useMemo(() => {
    const map = new Map<number, RekapSiswa>();
    for (const r of rows) {
      const cur =
        map.get(r.siswa_id) ??
        ({ siswa_id: r.siswa_id, nama: r.nama, nis: r.nis, kelas: r.kelas, jumlah: 0, total: 0, menunggu: 0 } as RekapSiswa);
      cur.jumlah += 1;
      cur.total += r.poin ?? 0;
      if (r.bukti_status === "menunggu") cur.menunggu += 1;
      map.set(r.siswa_id, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total || a.nama.localeCompare(b.nama));
  }, [rows]);

  const perKelas = useMemo(() => {
    const map = new Map<string, { kelas: string; jumlahCatatan: number; totalPoin: number; siswa: Set<number> }>();
    for (const r of rows) {
      const key = r.kelas ?? "-";
      const cur = map.get(key) ?? { kelas: key, jumlahCatatan: 0, totalPoin: 0, siswa: new Set<number>() };
      cur.jumlahCatatan += 1;
      cur.totalPoin += r.poin ?? 0;
      cur.siswa.add(r.siswa_id);
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.totalPoin - a.totalPoin || a.kelas.localeCompare(b.kelas));
  }, [rows]);

  const jumlahMenunggu = rows.filter((r) => r.bukti_status === "menunggu").length;
  const jumlahSiswa = perSiswa.length;
  const totalPoin = rows.reduce((s, r) => s + (r.poin ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Catatan</p>
          <p className="text-2xl font-bold">{rows.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Poin</p>
          <p className="text-2xl font-bold">{totalPoin}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Siswa Terlibat</p>
          <p className="text-2xl font-bold">{jumlahSiswa}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Bukti Menunggu</p>
          <p className="text-2xl font-bold">{jumlahMenunggu}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <a
          href="/api/pelanggaran/export"
          className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Download Excel (Rekap + Riwayat)
        </a>
      </div>

      {/* Per siswa */}
      <Card>
        <CardHeader>
          <CardTitle>Rekap per Siswa</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {perSiswa.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Nama</th>
                  <th className="py-2 pr-3">NIS</th>
                  <th className="py-2 pr-3">Kelas</th>
                  <th className="py-2 pr-3 text-right">Catatan</th>
                  <th className="py-2 pr-3 text-right">Total Poin</th>
                  <th className="py-2 pr-3">Hukuman Berlaku</th>
                  <th className="py-2 text-right">Menunggu</th>
                </tr>
              </thead>
              <tbody>
                {perSiswa.map((s) => {
                  const hukuman = tahapUntukPoin(s.total, tahap);
                  return (
                    <tr key={s.siswa_id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{s.nama}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{s.nis ?? "-"}</td>
                      <td className="py-2 pr-3">{s.kelas ?? "-"}</td>
                      <td className="py-2 pr-3 text-right">{s.jumlah}</td>
                      <td className="py-2 pr-3 text-right font-semibold">{s.total}</td>
                      <td className="py-2 pr-3">{hukuman?.hukuman ?? "-"}</td>
                      <td className="py-2 text-right">
                        {s.menunggu > 0 ? (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {s.menunggu}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Per kelas */}
      <Card>
        <CardHeader>
          <CardTitle>Rekap per Kelas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {perKelas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Kelas</th>
                  <th className="py-2 pr-3 text-right">Siswa Terlibat</th>
                  <th className="py-2 pr-3 text-right">Catatan</th>
                  <th className="py-2 text-right">Total Poin</th>
                </tr>
              </thead>
              <tbody>
                {perKelas.map((k) => (
                  <tr key={k.kelas} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{k.kelas}</td>
                    <td className="py-2 pr-3 text-right">{k.siswa.size}</td>
                    <td className="py-2 pr-3 text-right">{k.jumlahCatatan}</td>
                    <td className="py-2 text-right font-semibold">{k.totalPoin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
