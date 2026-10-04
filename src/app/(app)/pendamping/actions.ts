"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export async function tambahPendamping(formData: FormData) {
  const nama = String(formData.get("nama") ?? "").trim();
  const kontak = String(formData.get("kontak") ?? "").trim();
  const kelasId = Number(formData.get("kelas_id"));
  if (!nama || !kelasId) return;
  const supabase = getSupabase();
  await supabase.from("pendamping").insert({ nama, kontak: kontak || null, kelas_id: kelasId });
  revalidatePath("/pendamping");
}

export async function hapusPendamping(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const supabase = getSupabase();
  await supabase.from("pendamping").delete().eq("id", id);
  revalidatePath("/pendamping");
}

export async function pindahPendamping(formData: FormData) {
  const id = Number(formData.get("id"));
  const kelasId = Number(formData.get("kelas_id"));
  if (!id || !kelasId) return;
  const supabase = getSupabase();
  await supabase.from("pendamping").update({ kelas_id: kelasId }).eq("id", id);
  revalidatePath("/pendamping");
}

export async function toggleAktifPendamping(formData: FormData) {
  const id = Number(formData.get("id"));
  const aktif = formData.get("aktif") === "true";
  if (!id) return;
  const supabase = getSupabase();
  await supabase.from("pendamping").update({ aktif: !aktif }).eq("id", id);
  revalidatePath("/pendamping");
}
