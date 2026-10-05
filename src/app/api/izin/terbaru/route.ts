import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("izin")
    .select("id, nama, kelas")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return NextResponse.json({ error: "Gagal memuat." }, { status: 500 });
  return NextResponse.json({ data });
}
