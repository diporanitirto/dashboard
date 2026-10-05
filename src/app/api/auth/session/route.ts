import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, userFromToken, isAuthenticated } from "@/lib/auth";

export async function GET() {
  const store = await cookies();
  const ok = await isAuthenticated();
  return NextResponse.json({
    authenticated: ok,
    username: ok ? userFromToken(store.get(SESSION_COOKIE)?.value) : null,
  });
}
