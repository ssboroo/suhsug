import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { createSession, sessionCookieName } from "@/lib/auth";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = await checkRateLimit("admin-login", requestIdentity(request.headers));
  if (!limit.configured) return NextResponse.json({ error: "Нэвтрэх хамгаалалт тохируулаагүй байна." }, { status: 503 });
  if (!limit.success) return NextResponse.json({ error: "Хэт олон удаа оролдлоо. 15 минутын дараа дахин оролдоно уу." }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const username = String(body.username ?? "").slice(0, 128);
  const password = String(body.password ?? "").slice(0, 256);
  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const providedUser = Buffer.from(username);
  const configuredUser = Buffer.from(expectedUser);
  const userOk = configuredUser.length > 0 && providedUser.length === configuredUser.length &&
    timingSafeEqual(providedUser, configuredUser);
  const passOk = hash.startsWith("$2") ? await bcrypt.compare(password, hash) : false;
  if (!userOk || !passOk) return NextResponse.json({ error: "Нэвтрэх мэдээлэл буруу байна." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, createSession(username), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
