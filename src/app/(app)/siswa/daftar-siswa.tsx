"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SiswaForm, { type KelasOption, type SiswaAwal } from "./siswa-form";

export interface KelasDenganSiswa extends KelasOption {
  siswa: SiswaAwal[];
}

interface Baris extends SiswaAwal {
  kelas_nama: string;
}

const cariClass =
  "w-full min-h-11 rounded-lg border border-foreground/50 bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background";

const tombolUtamaClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const tombolEditClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border px-3 text-xs text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function DaftarSiswa({ kelasList }: { kelasList: KelasDenganSiswa[] }) {
  const [query, setQuery] = useState("");
  const [tambahTerbuka, setTambahTerbuka] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const semua: Baris[] = useMemo(
    () =>
      kelasList
        .flatMap((k) => (k.siswa ?? []).map((s) => ({ ...s, kelas_id: s.kelas_id ?? k.id, kelas_nama: k.nama })))
        .sort((a, b) => a.kelas_nama.localeCompare(b.kelas_nama) || a.nama.localeCompare(b.nama)),
    [kelasList]
  );

  const q = query.trim().toLowerCase();
  const hasil = q
    ? semua.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) || s.nis.includes(q) || s.kelas_nama.toLowerCase().includes(q)
      )
    : null;

  const renderBaris = (s: Baris, tampilKelas: boolean) => {
    if (editId === s.id) {
      return (
        <div key={s.id} className="py-2">
          <SiswaForm
            kelasList={kelasList}
            awal={s}
            onSukses={() => setEditId(null)}
            onBatal={() => setEditId(null)}
          />
        </div>
      );
    }
    return (
      <div key={s.id} className="flex items-center gap-2 border-b py-2 last:border-0">
        <span className="w-14 shrink-0 text-xs text-muted-foreground">{s.nis}</span>
        <span className="min-w-0 flex-1 truncate text-sm" title={s.nama}>
          {s.nama}
        </span>
        <span className={`${tampilKelas ? "" : "hidden sm:inline "}shrink-0 text-xs text-muted-foreground`}>
          {tampilKelas
            ? s.kelas_nama
            : [s.jk === "L" ? "Laki-laki" : s.jk === "P" ? "Perempuan" : null, s.agama]
                .filter(Boolean)
                .join(" • ") || "-"}
        </span>
        <button
          type="button"
          aria-label={`Edit ${s.nama}`}
          onClick={() => {
            setEditId(s.id);
            setTambahTerbuka(false);
          }}
          className={tombolEditClass}
        >
          Edit
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Siswa</h1>
          <p className="text-sm text-muted-foreground">
            {semua.length} siswa terdaftar. Tambah atau edit kalau ada perubahan data di sekolah.
          </p>
        </div>
        {!tambahTerbuka && (
          <button
            type="button"
            onClick={() => {
              setTambahTerbuka(true);
              setEditId(null);
            }}
            className={tombolUtamaClass}
          >
            + Tambah Siswa
          </button>
        )}
      </div>

      {tambahTerbuka && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <SiswaForm
              kelasList={kelasList}
              onSukses={() => setTambahTerbuka(false)}
              onBatal={() => setTambahTerbuka(false)}
            />
          </CardContent>
        </Card>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama / NIS / kelas..."
        className={cariClass}
        aria-label="Cari siswa"
      />

      {hasil ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Hasil pencarian
              <Badge variant="secondary">{hasil.length} siswa</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasil.length === 0 ? (
              <p className="text-sm text-muted-foreground">{`Tidak ada siswa yang cocok dengan "${query.trim()}".`}</p>
            ) : (
              hasil.map((s) => renderBaris(s, true))
            )}
          </CardContent>
        </Card>
      ) : (
        kelasList.map((kelas) => (
          <Card key={kelas.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Kelas {kelas.nama}
                <Badge variant="secondary">{kelas.siswa?.length ?? 0} siswa</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(kelas.siswa?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada siswa di kelas ini.</p>
              ) : (
                kelas.siswa.map((s) =>
                  renderBaris({ ...s, kelas_id: s.kelas_id ?? kelas.id, kelas_nama: kelas.nama }, false)
                )
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
