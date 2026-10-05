import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { SESSION_COOKIE, userFromToken } from "@/lib/auth";

export async function GET() {
  const store = await cookies();
  const me = userFromToken(store.get(SESSION_COOKIE)?.value);
  const isMain = me === "diporani";
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("admin_users")
    .select(isMain ? "username, password, created_at" : "username, created_at")
    .order("username");
  if (error) return NextResponse.json({ error: "Gagal memuat." }, { status: 500 });
  return NextResponse.json({ data, canViewPassword: isMain });
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
  }
  const supabase = getSupabase();
  const { error } = await supabase.from("admin_users").insert({ username: username.trim(), password: password.trim() });
  if (error) return NextResponse.json({ error: "Gagal menambah akun." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { username } = await req.json().catch(() => ({}));
  if (!username) return NextResponse.json({ error: "Username wajib." }, { status: 400 });
  const supabase = getSupabase();
  const { error } = await supabase.from("admin_users").delete().eq("username", username);
  if (error) return NextResponse.json({ error: "Gagal menghapus." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
