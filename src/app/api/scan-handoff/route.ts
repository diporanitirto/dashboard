import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID izin wajib diisi." }, { status: 400 });
  }
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const base = process.env.IZIN_APP_URL ?? "http://localhost:3000";
  const url = `${base}/verify/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`;
  return NextResponse.redirect(url);
}
