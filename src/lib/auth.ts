import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

export const SESSION_COOKIE = "pramuka_session";

export async function checkCredentials(user: string, pass: string) {
  if (!user || !pass) return false;
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("admin_users")
      .select("username")
      .eq("username", user)
      .eq("password", pass)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export function sessionToken(user: string) {
  const secret = process.env.AUTH_SECRET ?? "pramuka";
  return Buffer.from(`v2:${user}:${secret}`).toString("base64");
}

export function isValidToken(token: string | undefined) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const secret = process.env.AUTH_SECRET ?? "pramuka";
    const parts = decoded.split(":");
    return parts.length === 3 && parts[0] === "v2" && parts[2] === secret && parts[1].length > 0;
  } catch {
    return false;
  }
}

export async function isAuthenticated() {
  const store = await cookies();
  return isValidToken(store.get(SESSION_COOKIE)?.value);
}

export function userFromToken(token: string | undefined) {
  if (!token || !isValidToken(token)) return null;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    return decoded.split(":")[1];
  } catch {
    return null;
  }
}
