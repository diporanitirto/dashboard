"use client";

import { useRef } from "react";
import { tambahPendamping } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

export default function TambahPendamping({ kelasList }: { kelasList: { id: number; nama: string }[] }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await tambahPendamping(fd);
        ref.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3 rounded-md border p-4"
    >
      <div className="space-y-1">
        <Label htmlFor="nama">Nama PK</Label>
        <Input id="nama" name="nama" placeholder="Nama pendamping" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="kontak">Kontak</Label>
        <Input id="kontak" name="kontak" placeholder="08xxxx (opsional)" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="kelas_id">Kelas</Label>
        <select id="kelas_id" name="kelas_id" required className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">Pilih kelas</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">
        <FontAwesomeIcon icon={faPlus} className="mr-2" />
        Tambah
      </Button>
    </form>
  );
}
