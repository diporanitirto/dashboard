import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ count: 0 });

  const { count, error } = await getSupabase()
    .from("pelanggaran")
    .select("id", { count: "exact", head: true })
    .eq("bukti_status", "menunggu");

  if (error) return NextResponse.json({ count: 0 });
  return NextResponse.json({ count: count ?? 0 });
}
