"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { pindahPendamping } from "./actions";

export default function MoveButton({
  pkId,
  nama,
  kelasList,
}: {
  pkId: number;
  nama: string;
  kelasList: { id: number; nama: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button type="button" className="rounded-md border px-2 py-1 text-xs text-primary hover:bg-accent" />
        }
      >
        Move
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pindahkan {nama}</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await pindahPendamping(fd);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={pkId} />
          <div className="space-y-2">
            <Label htmlFor={`move-${pkId}`}>Pindah ke kelas</Label>
            <select id={`move-${pkId}`} name="kelas_id" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Pilih kelas tujuan</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full">
            Pindahkan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
