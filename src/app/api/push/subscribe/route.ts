import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { SESSION_COOKIE, isValidToken, userFromToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!isValidToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const username = userFromToken(token) ?? "admin";

  try {
    const body = await request.json();
    const endpoint = String(body?.endpoint ?? "").trim();
    const p256dh = String(body?.keys?.p256dh ?? "").trim();
    const auth = String(body?.keys?.auth ?? "").trim();
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Subscription tidak valid." }, { status: 400 });
    }

    const supabase = getSupabase();
    await supabase.from("push_subscriptions").upsert(
      { target_type: "admin", target_id: username, endpoint, p256dh, auth },
      { onConflict: "endpoint" }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("push subscribe error:", e);
    return NextResponse.json({ error: "Gagal menyimpan subscription." }, { status: 500 });
  }
}