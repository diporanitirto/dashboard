export interface JenisPelanggaran {
  id: number;
  nama: string;
  poin: number;
  aktif: boolean;
}

export interface TahapHukuman {
  id: number;
  min_poin: number;
  hukuman: string;
}

export type BuktiStatus = "belum" | "menunggu" | "selesai" | "ditolak";

export interface PelanggaranRow {
  id: string;
  siswa_id: number;
  nis: string | null;
  nama: string;
  kelas: string | null;
  jenis_id: number | null;
  jenis_nama: string | null;
  poin: number;
  total_poin: number | null;
  hukuman: string | null;
  perlu_bukti: boolean;
  keterangan: string | null;
  bukti_file_id: string | null;
  bukti_url: string | null;
  bukti_status: BuktiStatus;
  bukti_note: string | null;
  bukti_uploaded_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  dicatat_oleh: string | null;
  tanggal: string;
  created_at: string;
}

export interface SiswaOption {
  id: number;
  nis: string;
  nama: string;
  kelas: string;
}

export const BUKTI_STATUS_INFO: Record<BuktiStatus, { label: string; className: string }> = {
  belum: { label: "Belum upload", className: "bg-muted text-muted-foreground" },
  menunggu: { label: "Menunggu verifikasi", className: "bg-amber-100 text-amber-700" },
  selesai: { label: "Selesai", className: "bg-emerald-100 text-emerald-700" },
  ditolak: { label: "Ditolak", className: "bg-destructive/10 text-destructive" },
};

/** Hukuman yang berlaku untuk total poin tertentu (tahap dengan min_poin terbesar yang <= total). */
export function tahapUntukPoin(totalPoin: number, tahap: TahapHukuman[]): TahapHukuman | null {
  let aktif: TahapHukuman | null = null;
  for (const t of [...tahap].sort((a, b) => a.min_poin - b.min_poin)) {
    if (totalPoin >= t.min_poin) aktif = t;
  }
  return aktif;
}

/** Tahap peringatan = tahap pertama (min_poin terkecil). Hanya ini yang tanpa bukti. */
export function tahapPeringatan(tahap: TahapHukuman[]): TahapHukuman | null {
  const urut = [...tahap].sort((a, b) => a.min_poin - b.min_poin);
  return urut[0] ?? null;
}

/** Perlu upload bukti? Tidak, kalau hukuman yang berlaku masih tahap peringatan (tahap pertama). */
export function perluBuktiUntukPoin(totalPoin: number, tahap: TahapHukuman[]): boolean {
  const aktif = tahapUntukPoin(totalPoin, tahap);
  const peringatan = tahapPeringatan(tahap);
  return aktif !== null && peringatan !== null && aktif.id !== peringatan.id;
}

/** Total poin per siswa dari daftar catatan. */
export function totalPoinPerSiswa(rows: PelanggaranRow[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const r of rows) {
    map.set(r.siswa_id, (map.get(r.siswa_id) ?? 0) + (r.poin ?? 0));
  }
  return map;
}

export function formatTanggal(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatJam(d: string) {
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
