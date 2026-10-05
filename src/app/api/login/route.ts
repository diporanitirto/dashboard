import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, sessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!(await checkCredentials(username ?? "", password ?? ""))) {
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(username), { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
