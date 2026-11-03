import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { maxHours, sessionCookieOptions, SESSION_COOKIE, signSession, verifySession } from "./session-token";


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

/** Apre la sessione: cookie di sessione del browser con scadenza per inattività. */
export async function createSession(customerId: string, role: "customer" | "admin" = "customer") {
  const now = Date.now();
  const adm = role === "admin";
  const token = await signSession({ cid: customerId, adm, last: now, abs: now + maxHours(adm) * 3_600_000 });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Cliente della sessione corrente, o null (anche se scaduta per inattività). */
export async function getCurrentCustomer() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const r = await verifySession(token);
  if (!r.ok) return null;
  return prisma.customer.findUnique({ where: { id: r.payload.cid } });
}
