import "server-only";
import { randomInt } from "node:crypto";
import { prisma } from "./db";
import { hmac, safeEqual } from "./session";
import { sendOtp, whatsappConfigured } from "./whatsapp";

const TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const MAX_PER_PHONE = 3; // codici per numero ogni 15 minuti
const PHONE_WINDOW_MIN = 15;
const MAX_PER_IP = 10; // codici per IP ogni ora

const hashCode = (phone: string, code: string) => hmac(`otp:${phone}:${code}`);

export type RequestResult = { ok: true; devCode?: string } | { ok: false; error: "rate_limited" };

/** Genera, salva (hashato) e invia un codice a 6 cifre. */
export async function requestOtp(phone: string, ip: string | null): Promise<RequestResult> {
  const now = Date.now();
  const [perPhone, perIp] = await Promise.all([
    prisma.otpCode.count({ where: { phone, createdAt: { gt: new Date(now - PHONE_WINDOW_MIN * 60_000) } } }),
    ip ? prisma.otpCode.count({ where: { ip, createdAt: { gt: new Date(now - 3_600_000) } } }) : 0,
  ]);
  if (perPhone >= MAX_PER_PHONE || perIp >= MAX_PER_IP) return { ok: false, error: "rate_limited" };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.otpCode.create({
    data: { phone, codeHash: hashCode(phone, code), expiresAt: new Date(now + TTL_MIN * 60_000), ip },
  });
  await sendOtp(phone, code);

  const showDev = process.env.OTP_DEV_SHOW === "1" && !whatsappConfigured();
  return showDev ? { ok: true, devCode: code } : { ok: true };
}

export type VerifyResult = "ok" | "invalid" | "expired" | "too_many_attempts";

/**
 * Controlla il codice più recente del numero. Se consume=false un codice
 * corretto resta valido (serve quando dobbiamo ancora chiedere il nome).
 */
export async function verifyOtp(phone: string, code: string, consume = true): Promise<VerifyResult> {
  const otp = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (!otp || otp.expiresAt.getTime() < Date.now()) return "expired";
  if (otp.attempts >= MAX_ATTEMPTS) return "too_many_attempts";

  if (!safeEqual(otp.codeHash, hashCode(phone, code))) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return otp.attempts + 1 >= MAX_ATTEMPTS ? "too_many_attempts" : "invalid";
  }
  if (consume) await prisma.otpCode.update({ where: { id: otp.id }, data: { expiresAt: new Date(0) } });
  return "ok";
}
