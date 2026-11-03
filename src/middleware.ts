import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieOptions, SESSION_COOKIE, signSession, verifySession } from "@/lib/session-token";

/**
 * Sessione con scadenza per inattività: a ogni richiesta rinnova l'ultima
 * attività (al massimo una volta al minuto); se la sessione è scaduta
 * cancella il cookie.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.next();

  const now = Date.now();
  const r = await verifySession(token, now);
  if (!r.ok) {
    const res = NextResponse.next();
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  // Le richieste di prefetch non contano come attività
  if (req.headers.get("next-router-prefetch") || req.headers.get("purpose") === "prefetch") return NextResponse.next();
  if (now - r.payload.last < 60_000) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, await signSession({ ...r.payload, last: now }), sessionCookieOptions);
  return res;
}

export const config = {
  // Tutto tranne file statici, immagini, video e il webhook (che non usa la sessione)
  matcher: ["/((?!_next/static|_next/image|images/|videos/|favicon.ico|robots.txt|sitemap.xml|api/whatsapp|api/cron).*)"],
};
