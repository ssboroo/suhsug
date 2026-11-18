import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "suhsug_admin";
function sign(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function createSession(username: string) {
  const value = Buffer.from(JSON.stringify({ username, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  return value + "." + sign(value);
}
export function verifySession(token?: string) {
  if (!token) return false;
  const [value, signature] = token.split(".");
  if (!value || !signature) return false;
  const expected = sign(value);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString());
    return typeof payload.username === "string" && payload.exp > Date.now();
  } catch { return false; }
}
export async function isAdmin() {
  const jar = await cookies();
  return verifySession(jar.get(COOKIE)?.value);
}
export const sessionCookieName = COOKIE;