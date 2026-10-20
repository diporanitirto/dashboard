"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export interface SiswaData {
  id: number;
  nis: string;
  nama: string;
  jk: string | null;
  agama: string | null;
  kelas_id: number | null;
  kelas_nama: string | null;
}

export interface SiswaActionResult {
  ok: boolean;
  error?: string;
  siswa?: SiswaData;
}

function teks(v: FormDataEntryValue | null, max = 120) {
  return String(v ?? "").trim().slice(0, max);
}

/** Ambil kelas dari form: pakai kelas_id yang ada, atau buat kelas baru dari `kelas_baru`. */
async function ambilKelas(
  supabase: ReturnType<typeof getSupabase>,
  fd: FormData
): Promise<{ id: number | null; nama: string | null; error?: string }> {
  const kelasId = Number(teks(fd.get("kelas_id")));
  if (kelasId) {
    const { data } = await supabase.from("kelas").select("id, nama").eq("id", kelasId).maybeSingle();
    if (!data) return { id: null, nama: null, error: "Kelas tidak ditemukan." };
    return { id: data.id, nama: data.nama };
  }

  const namaBaru = teks(fd.get("kelas_baru"), 60);
  if (!namaBaru) return { id: null, nama: null, error: "Pilih kelas dulu (atau isi nama kelas baru)." };

  const { data: ada } = await supabase.from("kelas").select("id, nama").eq("nama", namaBaru).maybeSingle();
  if (ada) return { id: ada.id, nama: ada.nama };

  const { data: dibuat, error } = await supabase
    .from("kelas")
    .insert({ nama: namaBaru })
    .select("id, nama")
    .single();
  if (error || !dibuat) return { id: null, nama: null, error: "Gagal membuat kelas baru." };
  return { id: dibuat.id, nama: dibuat.nama };
}

export async function tambahSiswa(fd: FormData): Promise<SiswaActionResult> {
  if (!(await isAuthenticated())) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const nis = teks(fd.get("nis"), 30);
  const nama = teks(fd.get("nama"), 100);
  const jkMentah = teks(fd.get("jk"), 2).toUpperCase();
  const agama = teks(fd.get("agama"), 50) || null;

  if (!nis) return { ok: false, error: "NIS wajib diisi." };
  if (!nama) return { ok: false, error: "Nama wajib diisi." };
  const jk = jkMentah === "L" || jkMentah === "P" ? jkMentah : null;

  const supabase = getSupabase();

  const { data: kembar } = await supabase.from("siswa").select("nama").eq("nis", nis).maybeSingle();
  if (kembar) return { ok: false, error: `NIS ${nis} sudah dipakai (${kembar.nama}).` };

  const kelas = await ambilKelas(supabase, fd);
  if (kelas.error) return { ok: false, error: kelas.error };

  const { data, error } = await supabase
    .from("siswa")
    .insert({ nis, nama, jk, agama, kelas_id: kelas.id })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, error: `NIS ${nis} sudah terdaftar.` };
    return { ok: false, error: "Gagal menyimpan siswa." };
  }

  revalidatePath("/siswa");
  return { ok: true, siswa: { id: data.id, nis, nama, jk, agama, kelas_id: kelas.id, kelas_nama: kelas.nama } };
}

export async function ubahSiswa(fd: FormData): Promise<SiswaActionResult> {
  if (!(await isAuthenticated())) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = Number(teks(fd.get("id")));
  if (!id) return { ok: false, error: "Siswa tidak valid." };

  const nis = teks(fd.get("nis"), 30);
  const nama = teks(fd.get("nama"), 100);
  const jkMentah = teks(fd.get("jk"), 2).toUpperCase();
  const agama = teks(fd.get("agama"), 50) || null;

  if (!nis) return { ok: false, error: "NIS wajib diisi." };
  if (!nama) return { ok: false, error: "Nama wajib diisi." };
  const jk = jkMentah === "L" || jkMentah === "P" ? jkMentah : null;

  const supabase = getSupabase();

  const { data: kembar } = await supabase
    .from("siswa")
    .select("nama")
    .eq("nis", nis)
    .neq("id", id)
    .maybeSingle();
  if (kembar) return { ok: false, error: `NIS ${nis} sudah dipakai (${kembar.nama}).` };

  const kelas = await ambilKelas(supabase, fd);
  if (kelas.error) return { ok: false, error: kelas.error };

  const { data, error } = await supabase
    .from("siswa")
    .update({ nis, nama, jk, agama, kelas_id: kelas.id })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Gagal menyimpan perubahan." };
  if (!data) return { ok: false, error: "Siswa tidak ditemukan." };

  revalidatePath("/siswa");
  return { ok: true, siswa: { id, nis, nama, jk, agama, kelas_id: kelas.id, kelas_nama: kelas.nama } };
}
