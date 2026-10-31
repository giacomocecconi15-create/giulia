import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "lu_session";
export const SESSION_DAYS = 90;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET mancante o troppo corto (minimo 32 caratteri)");
  return s;
}

export function hmac(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

type Payload = { cid: string; exp: number };

function sign(p: Payload): string {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

function verify(token: string): Payload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, hmac(body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

/** Apre la sessione (cookie httpOnly, 90 giorni). */
export async function createSession(customerId: string) {
  const exp = Date.now() + SESSION_DAYS * 86_400_000;
  (await cookies()).set(COOKIE, sign({ cid: customerId, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Cliente della sessione corrente, o null. */
export async function getCurrentCustomer() {
  const token = (await cookies()).get(COOKIE)?.value;
  const p = token ? verify(token) : null;
  if (!p) return null;
  return prisma.customer.findUnique({ where: { id: p.cid } });
}
