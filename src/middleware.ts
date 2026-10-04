import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const user = process.env.ADMIN_USER ?? "";
  const pass = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET ?? "pramuka";
  const expected = btoa(`${user}:${pass}:${secret}`);

  const token = req.cookies.get("pramuka_session")?.value;
  if (token !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|json|txt)).*)"],
};
