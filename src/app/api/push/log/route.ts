import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { isValidToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  const token = store.get("pramuka_session")?.value;
  if (!isValidToken(token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("notif_log")
      .select("id, title, body, url, read, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error("notif log GET error:", e);
    return NextResponse.json({ error: "Gagal memuat notifikasi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const store = await cookies();
  const token = store.get("pramuka_session")?.value;
  if (!isValidToken(token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const id = body?.id;
    const supabase = getSupabase();
    if (id) {
      await supabase.from("notif_log").update({ read: true }).eq("id", id);
    } else {
      await supabase.from("notif_log").update({ read: true }).eq("read", false);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("notif log POST error:", e);
    return NextResponse.json({ error: "Gagal." }, { status: 500 });
  }
}