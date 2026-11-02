import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const endpoint = String(body?.endpoint ?? "").trim();
    if (!endpoint) return NextResponse.json({ error: "Endpoint wajib." }, { status: 400 });

    const supabase = getSupabase();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("push unsubscribe error:", e);
    return NextResponse.json({ error: "Gagal." }, { status: 500 });
  }
}