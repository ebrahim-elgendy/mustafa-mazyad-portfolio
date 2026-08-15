import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function sign(value: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSessionToken(): string {
  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(sign(expiresAt), signature)) return false;
  return Date.now() < Number(expiresAt);
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_UPLOAD_PASSWORD ?? "";
  if (!expected) return false;
  return safeEqual(password, expected);
}
