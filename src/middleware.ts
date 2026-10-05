import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const secret = process.env.AUTH_SECRET ?? "pramuka";
  const token = req.cookies.get("pramuka_session")?.value;
  let ok = false;
  if (token) {
    try {
      const parts = Buffer.from(token, "base64").toString("utf8").split(":");
      ok = parts.length === 3 && parts[0] === "v2" && parts[2] === secret && parts[1].length > 0;
    } catch {
      ok = false;
    }
  }
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|json|txt)).*)"],
};
