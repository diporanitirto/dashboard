"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JenisPelanggaran, PelanggaranRow, SiswaOption, TahapHukuman } from "@/lib/pelanggaran";
import TabCatat from "./tab-catat";
import TabDaftar from "./tab-daftar";
import TabRekap from "./tab-rekap";
import TabPengaturan from "./tab-pengaturan";

interface Props {
  jenis: JenisPelanggaran[];
  tahap: TahapHukuman[];
  siswaList: SiswaOption[];
  rows: PelanggaranRow[];
}

export default function PelanggaranTabs(props: Props) {
  const menunggu = props.rows.filter((r) => r.bukti_status === "menunggu").length;

  return (
    <Tabs defaultValue="catat" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="catat" className="flex-none px-3">
          Catat
        </TabsTrigger>
        <TabsTrigger value="daftar" className="flex-none px-3">
          Daftar & Verifikasi
          {menunggu > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.6rem] font-bold text-white">
              {menunggu}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="rekap" className="flex-none px-3">
          Rekap
        </TabsTrigger>
        <TabsTrigger value="pengaturan" className="flex-none px-3">
          Pengaturan
        </TabsTrigger>
      </TabsList>

      <TabsContent value="catat" className="mt-4">
        <TabCatat jenis={props.jenis} tahap={props.tahap} siswaList={props.siswaList} rows={props.rows} />
      </TabsContent>
      <TabsContent value="daftar" className="mt-4">
        <TabDaftar rows={props.rows} />
      </TabsContent>
      <TabsContent value="rekap" className="mt-4">
        <TabRekap rows={props.rows} tahap={props.tahap} />
      </TabsContent>
      <TabsContent value="pengaturan" className="mt-4">
        <TabPengaturan jenis={props.jenis} tahap={props.tahap} />
      </TabsContent>
    </Tabs>
  );
}
