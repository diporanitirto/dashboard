import { getSupabase } from "@/lib/supabase";

// Arsip otomatis: setiap ganti bulan, izin dari bulan sebelumnya dipindahkan ke arsip.
export async function archiveBulanLalu() {
  try {
    const now = new Date();
    const awalBulanIni = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const supabase = getSupabase();
    await supabase
      .from("izin")
      .update({ is_archived: true })
      .eq("is_archived", false)
      .lt("created_at", awalBulanIni);
  } catch {}
}
