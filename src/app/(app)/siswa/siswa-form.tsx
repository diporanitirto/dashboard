"use client";

import { useId, useState, useTransition } from "react";
import { notify } from "@/components/notifier";
import { tambahSiswa, ubahSiswa, type SiswaData } from "./actions";

export interface KelasOption {
  id: number;
  nama: string;
}

export interface SiswaAwal {
  id: number;
  nis: string;
  nama: string;
  jk: string | null;
  agama: string | null;
  kelas_id: number | null;
}

const inputClass =
  "w-full min-h-11 rounded-lg border border-foreground/50 bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60";

const tombolUtamaClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60";

const tombolBatalClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60";

const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];

const bungkusClass = "grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2";

/** Form tambah/edit siswa (`awal` diisi = mode edit); `embedded` dipakai di form Catat supaya tidak ada <form> bersarang. */
export default function SiswaForm({
  kelasList,
  awal,
  awalNama,
  embedded,
  onSukses,
  onBatal,
}: {
  kelasList: KelasOption[];
  awal?: SiswaAwal;
  awalNama?: string;
  embedded?: boolean;
  onSukses?: (s: SiswaData) => void;
  onBatal?: () => void;
}) {
  const uid = useId();
  const [nama, setNama] = useState(awal?.nama ?? awalNama ?? "");
  const [nis, setNis] = useState(awal?.nis ?? "");
  const [jk, setJk] = useState(awal?.jk ?? "");
  const [agama, setAgama] = useState(awal?.agama ?? "");
  const [kelasId, setKelasId] = useState(awal?.kelas_id ? String(awal.kelas_id) : "");
  const [kelasBaru, setKelasBaru] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const simpan = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    setError(null);

    const fd = new FormData();
    if (awal) fd.set("id", String(awal.id));
    fd.set("nama", nama);
    fd.set("nis", nis);
    fd.set("jk", jk);
    fd.set("agama", agama);
    if (kelasId === "__baru__") fd.set("kelas_baru", kelasBaru);
    else if (kelasId) fd.set("kelas_id", kelasId);

    startTransition(async () => {
      const res = awal ? await ubahSiswa(fd) : await tambahSiswa(fd);
      if (!res.ok || !res.siswa) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      notify(awal ? `Data ${res.siswa.nama} disimpan.` : `Siswa ${res.siswa.nama} ditambahkan.`);
      onSukses?.(res.siswa);
    });
  };

  const isi = (
    <>
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor={`${uid}-nama`} className="text-xs font-medium text-muted-foreground">
          Nama
        </label>
        <input
          id={`${uid}-nama`}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama lengkap siswa"
          className={inputClass}
          autoFocus={!awal}
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-nis`} className="text-xs font-medium text-muted-foreground">
          NIS
        </label>
        <input
          id={`${uid}-nis`}
          value={nis}
          onChange={(e) => setNis(e.target.value)}
          placeholder="Nomor induk siswa"
          inputMode="numeric"
          className={inputClass}
          maxLength={30}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-kelas`} className="text-xs font-medium text-muted-foreground">
          Kelas
        </label>
        <select id={`${uid}-kelas`} value={kelasId} onChange={(e) => setKelasId(e.target.value)} className={inputClass}>
          <option value="">Pilih kelas…</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
          <option value="__baru__">+ Kelas baru…</option>
        </select>
        {kelasId === "__baru__" && (
          <input
            id={`${uid}-kelas-baru`}
            value={kelasBaru}
            onChange={(e) => setKelasBaru(e.target.value)}
            placeholder="Nama kelas baru, contoh: XI-1"
            aria-label="Nama kelas baru"
            className={`${inputClass} mt-1.5`}
            autoFocus
            maxLength={60}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-jk`} className="text-xs font-medium text-muted-foreground">
          Jenis kelamin
        </label>
        <select id={`${uid}-jk`} value={jk} onChange={(e) => setJk(e.target.value)} className={inputClass}>
          <option value="">-</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-agama`} className="text-xs font-medium text-muted-foreground">
          Agama
        </label>
        <select id={`${uid}-agama`} value={agama} onChange={(e) => setAgama(e.target.value)} className={inputClass}>
          <option value="">-</option>
          {agama && !AGAMA.includes(agama) && <option value={agama}>{agama}</option>}
          {AGAMA.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-700 sm:col-span-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 sm:col-span-2">
        <button
          type={embedded ? "button" : "submit"}
          onClick={embedded ? () => simpan() : undefined}
          disabled={pending}
          className={tombolUtamaClass}
        >
          {pending ? "Menyimpan…" : awal ? "Simpan Perubahan" : "Tambah Siswa"}
        </button>
        {onBatal && (
          <button type="button" onClick={onBatal} disabled={pending} className={tombolBatalClass}>
            Batal
          </button>
        )}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div
        className={bungkusClass}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            simpan();
          }
        }}
      >
        {isi}
      </div>
    );
  }

  return (
    <form onSubmit={simpan} className={bungkusClass}>
      {isi}
    </form>
  );
}
