import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isDev } from "./env";

const COOKIE = "otb_admin";

function password() {
  return process.env.ADMIN_PASSWORD || (isDev ? "admin" : "");
}

function sign(value: string) {
  return createHmac("sha256", password()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function adminConfigured() {
  return password().length > 0;
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  return Boolean(token && safeEqual(token, sign("admin-session")));
}

export async function logIn(attempt: string) {
  if (!adminConfigured() || !safeEqual(sign(attempt), sign(password()))) return false;
  (await cookies()).set(COOKIE, sign("admin-session"), {
    httpOnly: true,
    secure: !isDev,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return true;
}

export async function logOut() {
  (await cookies()).delete(COOKIE);
}
