"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { SESSION_COOKIE, isValidToken, userFromToken } from "@/lib/auth";
import { perluBuktiUntukPoin, tahapUntukPoin, type TahapHukuman } from "@/lib/pelanggaran";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Pastikan hanya petugas yang login bisa memanggil server action ini. */
async function petugasLogin(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!isValidToken(token)) return null;
  return userFromToken(token) ?? "?";
}

/**
 * Sesuaikan catatan yang belum diproses (bukti_status 'belum') dengan tabel tahap
 * terbaru. Dipanggil setiap kali pengaturan tahap hukuman berubah, supaya siswa
 * langsung bisa upload bukti untuk hukuman yang sedang berlaku — misalnya saat
 * hukuman tahap baru ditambahkan setelah catatan lama sudah tercatat.
 * Catatan yang sudah diproses (menunggu/selesai/ditolak) tidak diubah.
 */
async function syncHukumanBelum(): Promise<void> {
  const supabase = getSupabase();
  const [{ data: tahapList }, { data: records }] = await Promise.all([
    supabase.from("tahap_hukuman").select("id, min_poin, hukuman").order("min_poin", { ascending: true }),
    supabase
      .from("pelanggaran")
      .select("id, total_poin, hukuman, perlu_bukti")
      .eq("bukti_status", "belum")
      .not("total_poin", "is", null),
  ]);

  const tahap = (tahapList ?? []) as TahapHukuman[];
  for (const r of records ?? []) {
    const hukuman = tahapUntukPoin(r.total_poin, tahap)?.hukuman ?? null;
    const perluBukti = perluBuktiUntukPoin(r.total_poin, tahap);
    if (r.hukuman === hukuman && r.perlu_bukti === perluBukti) continue;

    const { error } = await supabase
      .from("pelanggaran")
      .update({ hukuman, perlu_bukti: perluBukti })
      .eq("id", r.id);
    if (error) console.error("syncHukumanBelum error:", error);
  }
}

export async function catatPelanggaran(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const siswaId = Number(formData.get("siswa_id"));
  const jenisId = Number(formData.get("jenis_id"));
  const poin = Math.round(Number(formData.get("poin")));
  const tanggal = String(formData.get("tanggal") ?? "").trim();
  const keterangan = String(formData.get("keterangan") ?? "").trim();

  if (!siswaId || !jenisId) return { ok: false, error: "Siswa dan jenis pelanggaran wajib dipilih." };
  if (!Number.isFinite(poin) || poin <= 0 || poin > 100) {
    return { ok: false, error: "Poin harus angka 1-100." };
  }

  const supabase = getSupabase();
  const [{ data: siswa }, { data: jenis }, { data: poinSebelumnya }, { data: tahapList }] = await Promise.all([
    supabase.from("siswa").select("id, nis, nama, kelas(nama)").eq("id", siswaId).maybeSingle(),
    supabase.from("jenis_pelanggaran").select("id, nama").eq("id", jenisId).maybeSingle(),
    supabase.from("pelanggaran").select("poin").eq("siswa_id", siswaId),
    supabase.from("tahap_hukuman").select("id, min_poin, hukuman").order("min_poin", { ascending: true }),
  ]);

  if (!siswa) return { ok: false, error: "Siswa tidak ditemukan." };
  if (!jenis) return { ok: false, error: "Jenis pelanggaran tidak ditemukan." };

  const totalPoin = (poinSebelumnya ?? []).reduce((sum, r) => sum + (r.poin ?? 0), 0) + poin;
  const tahapList2 = (tahapList ?? []) as TahapHukuman[];
  let hukuman: string | null = null;
  for (const t of [...tahapList2].sort((a, b) => a.min_poin - b.min_poin)) {
    if (totalPoin >= t.min_poin) hukuman = t.hukuman;
  }
  // Tahap peringatan (tahap pertama) tidak perlu bukti; tahap kedua dst perlu.
  const perluBukti = perluBuktiUntukPoin(totalPoin, tahapList2);

  const kelasNama = (siswa.kelas as unknown as { nama: string } | null)?.nama ?? null;

  const payload: Record<string, unknown> = {
    siswa_id: siswa.id,
    nis: siswa.nis,
    nama: siswa.nama,
    kelas: kelasNama,
    jenis_id: jenis.id,
    jenis_nama: jenis.nama,
    poin,
    total_poin: totalPoin,
    hukuman,
    perlu_bukti: perluBukti,
    keterangan: keterangan || null,
    dicatat_oleh: petugas,
  };
  if (tanggal) payload.tanggal = tanggal;

  const { error } = await supabase.from("pelanggaran").insert(payload);
  if (error) {
    console.error("catatPelanggaran error:", error);
    return { ok: false, error: "Gagal menyimpan pelanggaran." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function verifikasiBukti(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!id || (status !== "selesai" && status !== "ditolak")) {
    return { ok: false, error: "Data tidak valid." };
  }
  if (status === "ditolak" && !note) {
    return { ok: false, error: "Alasan penolakan wajib diisi." };
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("pelanggaran")
    .update({
      bukti_status: status,
      bukti_note: status === "ditolak" ? note : null,
      verified_by: petugas,
      verified_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("verifikasiBukti error:", error);
    return { ok: false, error: "Gagal memperbarui status bukti." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function hapusPelanggaran(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = getSupabase();
  const { error } = await supabase.from("pelanggaran").delete().eq("id", id);
  if (error) {
    console.error("hapusPelanggaran error:", error);
    return { ok: false, error: "Gagal menghapus catatan." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function tambahJenis(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const nama = String(formData.get("nama") ?? "").trim();
  const poin = Math.round(Number(formData.get("poin") ?? 1));
  if (!nama) return { ok: false, error: "Nama jenis wajib diisi." };
  if (!Number.isFinite(poin) || poin <= 0 || poin > 100) return { ok: false, error: "Poin harus angka 1-100." };

  const supabase = getSupabase();
  const { error } = await supabase.from("jenis_pelanggaran").insert({ nama, poin });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Jenis dengan nama itu sudah ada." };
    console.error("tambahJenis error:", error);
    return { ok: false, error: "Gagal menambah jenis." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function ubahJenis(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = Number(formData.get("id"));
  const nama = String(formData.get("nama") ?? "").trim();
  const poin = Math.round(Number(formData.get("poin")));
  const aktif = String(formData.get("aktif")) === "true";

  if (!id || !nama) return { ok: false, error: "Data tidak valid." };
  if (!Number.isFinite(poin) || poin <= 0 || poin > 100) return { ok: false, error: "Poin harus angka 1-100." };

  const supabase = getSupabase();
  const { error } = await supabase.from("jenis_pelanggaran").update({ nama, poin, aktif }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Jenis dengan nama itu sudah ada." };
    console.error("ubahJenis error:", error);
    return { ok: false, error: "Gagal menyimpan jenis." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function hapusJenis(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = Number(formData.get("id"));
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = getSupabase();
  const { error } = await supabase.from("jenis_pelanggaran").delete().eq("id", id);
  if (error) {
    console.error("hapusJenis error:", error);
    return { ok: false, error: "Gagal menghapus jenis." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function tambahTahap(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const minPoin = Math.round(Number(formData.get("min_poin")));
  const hukuman = String(formData.get("hukuman") ?? "").trim();
  if (!Number.isFinite(minPoin) || minPoin <= 0) return { ok: false, error: "Minimal poin harus angka positif." };
  if (!hukuman) return { ok: false, error: "Hukuman wajib diisi." };

  const supabase = getSupabase();
  const { error } = await supabase.from("tahap_hukuman").insert({ min_poin: minPoin, hukuman });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Tahap dengan minimal poin itu sudah ada." };
    console.error("tambahTahap error:", error);
    return { ok: false, error: "Gagal menambah tahap." };
  }

  await syncHukumanBelum();
  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function ubahTahap(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = Number(formData.get("id"));
  const minPoin = Math.round(Number(formData.get("min_poin")));
  const hukuman = String(formData.get("hukuman") ?? "").trim();
  if (!id) return { ok: false, error: "Data tidak valid." };
  if (!Number.isFinite(minPoin) || minPoin <= 0) return { ok: false, error: "Minimal poin harus angka positif." };
  if (!hukuman) return { ok: false, error: "Hukuman wajib diisi." };

  const supabase = getSupabase();
  const { error } = await supabase
    .from("tahap_hukuman")
    .update({ min_poin: minPoin, hukuman, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Tahap dengan minimal poin itu sudah ada." };
    console.error("ubahTahap error:", error);
    return { ok: false, error: "Gagal menyimpan tahap." };
  }

  await syncHukumanBelum();
  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function hapusTahap(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = Number(formData.get("id"));
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = getSupabase();
  const { error } = await supabase.from("tahap_hukuman").delete().eq("id", id);
  if (error) {
    console.error("hapusTahap error:", error);
    return { ok: false, error: "Gagal menghapus tahap." };
  }

  await syncHukumanBelum();
  revalidatePath("/pelanggaran");
  return { ok: true };
}
