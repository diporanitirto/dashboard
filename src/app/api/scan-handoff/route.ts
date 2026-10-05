import { NextRequest, NextResponse } from "next/server";
import { sessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID izin wajib diisi." }, { status: 400 });
  }
  const base = process.env.IZIN_APP_URL ?? "http://localhost:3000";
  const url = `${base}/verify/${encodeURIComponent(id)}?t=${encodeURIComponent(sessionToken())}`;
  return NextResponse.redirect(url);
}
