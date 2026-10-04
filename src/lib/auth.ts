import { cookies } from "next/headers";

export const SESSION_COOKIE = "pramuka_session";

function expectedToken() {
  const user = process.env.ADMIN_USER ?? "";
  const pass = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET ?? "pramuka";
  return Buffer.from(`${user}:${pass}:${secret}`).toString("base64");
}

export function checkCredentials(user: string, pass: string) {
  return user === (process.env.ADMIN_USER ?? "") && pass === (process.env.ADMIN_PASSWORD ?? "");
}

export async function isAuthenticated() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === expectedToken();
}

export function sessionToken() {
  return expectedToken();
}
