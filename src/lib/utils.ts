export { cn } from "cn"

/** Tabel izin menyimpan kelas format "X1"/"XADMIN"; tabel kelas pakai "X-1"/"KING". */
export function formatKelas(kelas: string): string {
  if (kelas === "XADMIN") return "KING";
  return kelas.replace(/^X(\d)$/, "X-$1");
}

/** Tanggal Senin awal minggu (YYYY-MM-DD). 1 siswa izin berapa kali pun dalam seminggu dihitung 1. */
export function weekKey(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const day = (d.getDay() + 6) % 7; // Senin = 0
  d.setDate(d.getDate() - day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Hitung izin unik: 1 siswa (NIS) per minggu hanya dihitung sekali. */
export function countUniquePerWeek(rows: Array<{ id: string; nis: string | null; created_at: string }>): number {
  return new Set(rows.map((r) => (r.nis ? `${r.nis}|${weekKey(r.created_at)}` : r.id))).size;
}
