"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/components/notifier";
import type { JenisPelanggaran, TahapHukuman } from "@/lib/pelanggaran";
import {
  hapusJenis,
  hapusTahap,
  tambahJenis,
  tambahTahap,
  ubahJenis,
  ubahTahap,
} from "./actions";

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:opacity-60";

interface Props {
  jenis: JenisPelanggaran[];
  tahap: TahapHukuman[];
}

function JenisRow({ j }: { j: JenisPelanggaran }) {
  const [nama, setNama] = useState(j.nama);
  const [poin, setPoin] = useState(String(j.poin));
  const [pending, startTransition] = useTransition();

  const dirty = nama !== j.nama || poin !== String(j.poin);

  const simpan = (aktif: boolean) => {
    const fd = new FormData();
    fd.set("id", String(j.id));
    fd.set("nama", nama);
    fd.set("poin", poin);
    fd.set("aktif", String(aktif));

    startTransition(async () => {
      const res = await ubahJenis(fd);
      if (res.ok) notify(`Jenis "${nama}" disimpan.`);
      else notify(res.error ?? "Gagal menyimpan.");
    });
  };

  const hapus = () => {
    if (!confirm(`Hapus jenis "${j.nama}"? Catatan lama tetap tersimpan.`)) return;
    const fd = new FormData();
    fd.set("id", String(j.id));

    startTransition(async () => {
      const res = await hapusJenis(fd);
      if (res.ok) notify(`Jenis "${j.nama}" dihapus.`);
      else notify(res.error ?? "Gagal menghapus.");
    });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-center gap-2 rounded-lg border p-2">
      <input
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        className={inputClass}
        aria-label="Nama jenis"
        title={nama}
      />
      <input
        type="number"
        min={1}
        max={100}
        value={poin}
        onChange={(e) => setPoin(e.target.value)}
        className={inputClass}
        aria-label="Poin"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={() => simpan(j.aktif)}
          className="rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
        >
          Simpan
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => simpan(!j.aktif)}
          title={j.aktif ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
          className={`rounded-md border px-2 py-1.5 text-xs font-medium disabled:opacity-40 ${
            j.aktif ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "text-muted-foreground"
          }`}
        >
          {j.aktif ? "Aktif" : "Nonaktif"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={hapus}
          className="rounded-md border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

function TahapRow({ t }: { t: TahapHukuman }) {
  const [minPoin, setMinPoin] = useState(String(t.min_poin));
  const [hukuman, setHukuman] = useState(t.hukuman);
  const [pending, startTransition] = useTransition();

  const dirty = minPoin !== String(t.min_poin) || hukuman !== t.hukuman;

  const simpan = () => {
    const fd = new FormData();
    fd.set("id", String(t.id));
    fd.set("min_poin", minPoin);
    fd.set("hukuman", hukuman);

    startTransition(async () => {
      const res = await ubahTahap(fd);
      if (res.ok) notify("Tahap hukuman disimpan.");
      else notify(res.error ?? "Gagal menyimpan.");
    });
  };

  const hapus = () => {
    if (!confirm(`Hapus tahap "mulai ${t.min_poin} poin"?`)) return;
    const fd = new FormData();
    fd.set("id", String(t.id));

    startTransition(async () => {
      const res = await hapusTahap(fd);
      if (res.ok) notify("Tahap hukuman dihapus.");
      else notify(res.error ?? "Gagal menghapus.");
    });
  };

  return (
    <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-2 rounded-lg border p-2">
      <input
        type="number"
        min={1}
        value={minPoin}
        onChange={(e) => setMinPoin(e.target.value)}
        className={inputClass}
        aria-label="Minimal poin"
      />
      <input
        value={hukuman}
        onChange={(e) => setHukuman(e.target.value)}
        className={inputClass}
        aria-label="Hukuman"
        title={hukuman}
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={simpan}
          className="rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
        >
          Simpan
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={hapus}
          className="rounded-md border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

export default function TabPengaturan({ jenis, tahap }: Props) {
  const [namaBaru, setNamaBaru] = useState("");
  const [poinBaru, setPoinBaru] = useState("1");
  const [minPoinBaru, setMinPoinBaru] = useState("");
  const [hukumanBaru, setHukumanBaru] = useState("");
  const [pending, startTransition] = useTransition();

  const tambahJenisBaru = () => {
    const fd = new FormData();
    fd.set("nama", namaBaru);
    fd.set("poin", poinBaru);

    startTransition(async () => {
      const res = await tambahJenis(fd);
      if (res.ok) {
        notify(`Jenis "${namaBaru}" ditambahkan.`);
        setNamaBaru("");
        setPoinBaru("1");
      } else {
        notify(res.error ?? "Gagal menambah jenis.");
      }
    });
  };

  const tambahTahapBaru = () => {
    const fd = new FormData();
    fd.set("min_poin", minPoinBaru);
    fd.set("hukuman", hukumanBaru);

    startTransition(async () => {
      const res = await tambahTahap(fd);
      if (res.ok) {
        notify("Tahap hukuman ditambahkan.");
        setMinPoinBaru("");
        setHukumanBaru("");
      } else {
        notify(res.error ?? "Gagal menambah tahap.");
      }
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Jenis Pelanggaran & Poin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Setiap jenis standarnya 1 poin, bisa diubah di sini atau saat mencatat.
          </p>

          <div className="grid grid-cols-[1fr_5rem_auto] items-center gap-2">
            <input
              value={namaBaru}
              onChange={(e) => setNamaBaru(e.target.value)}
              placeholder="Jenis baru, contoh: Terlambat"
              className={inputClass}
            />
            <input
              type="number"
              min={1}
              max={100}
              value={poinBaru}
              onChange={(e) => setPoinBaru(e.target.value)}
              className={inputClass}
              aria-label="Poin jenis baru"
            />
            <button
              type="button"
              disabled={pending || !namaBaru.trim()}
              onClick={tambahJenisBaru}
              className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
            >
              Tambah
            </button>
          </div>

          <div className="space-y-2">
            {jenis.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Belum ada jenis.</p>
            ) : (
              jenis.map((j) => (
                <JenisRow key={`${j.id}-${j.nama}-${j.poin}-${j.aktif}`} j={j} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tahap Hukuman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Hukuman berlaku mulai total poin tertentu. Contoh: mulai 1 poin &quot;Peringatan&quot;, mulai 3
            poin &quot;Push up 30x&quot;. Tahap dengan poin terkecil otomatis tanpa wajib unggah bukti;
            hukuman yang tersimpan di catatan lama tidak berubah.
          </p>

          <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-2">
            <input
              type="number"
              min={1}
              value={minPoinBaru}
              onChange={(e) => setMinPoinBaru(e.target.value)}
              placeholder="Poin"
              className={inputClass}
              aria-label="Minimal poin tahap baru"
            />
            <input
              value={hukumanBaru}
              onChange={(e) => setHukumanBaru(e.target.value)}
              placeholder="Hukuman, contoh: Push up 30x"
              className={inputClass}
            />
            <button
              type="button"
              disabled={pending || !hukumanBaru.trim() || !minPoinBaru}
              onClick={tambahTahapBaru}
              className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
            >
              Tambah
            </button>
          </div>

          <div className="space-y-2">
            {tahap.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Belum ada tahap.</p>
            ) : (
              [...tahap]
                .sort((a, b) => a.min_poin - b.min_poin)
                .map((t) => <TahapRow key={`${t.id}-${t.min_poin}-${t.hukuman}`} t={t} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
