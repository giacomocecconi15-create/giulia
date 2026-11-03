/**
 * Token di sessione firmato (HMAC-SHA256), usabile sia nel middleware sia nel server.
 * Scade per inattività (idle) e comunque dopo una durata massima (abs).
 */
export const SESSION_COOKIE = "lu_session";

export type SessionPayload = {
  cid: string;
  /** Admin: inattività consentita più lunga (agenda usata tutto il giorno) */
  adm?: boolean;
  /** Ultima attività (ms) */
  last: number;
  /** Scadenza assoluta (ms) */
  abs: number;
};

const min = (name: string, def: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : def;
};

/** Minuti di inattività dopo cui la sessione decade. */
export const idleMinutes = (adm?: boolean) =>
  adm ? min("ADMIN_SESSION_IDLE_MINUTES", 720) : min("SESSION_IDLE_MINUTES", 30);

/** Durata massima della sessione in ore, anche con attività continua. */
export const maxHours = (adm?: boolean) => (adm ? 24 * 7 : 24);

const enc = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function key(): Promise<CryptoKey> {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET mancante o troppo corto (minimo 32 caratteri)");
  keyPromise ??= crypto.subtle.importKey("raw", enc.encode(s), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return keyPromise;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function signSession(p: SessionPayload): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(p)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export type VerifyResult = { ok: true; payload: SessionPayload } | { ok: false; reason: "invalid" | "idle" | "expired" };

export async function verifySession(token: string, now = Date.now()): Promise<VerifyResult> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return { ok: false, reason: "invalid" };
  try {
    const valid = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), enc.encode(body));
    if (!valid) return { ok: false, reason: "invalid" };
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (typeof p.cid !== "string" || typeof p.last !== "number" || typeof p.abs !== "number") return { ok: false, reason: "invalid" };
    if (now > p.abs) return { ok: false, reason: "expired" };
    if (now - p.last > idleMinutes(p.adm) * 60_000) return { ok: false, reason: "idle" };
    return { ok: true, payload: p };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

/** Cookie di sessione del browser: senza Max-Age, sparisce alla chiusura del browser. */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
