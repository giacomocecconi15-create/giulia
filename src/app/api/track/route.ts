import { prisma } from "@/lib/db";

const ALLOWED = new Set(["instagram_click"]);

/**
 * Conteggio anonimo di eventi (es. click verso Instagram) per le statistiche
 * dell'admin. Nessun cookie, nessun IP, nessun dato personale salvato.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { type?: string; ref?: string };
  if (!body.type || !ALLOWED.has(body.type)) return new Response(null, { status: 204 });
  const ref = typeof body.ref === "string" ? body.ref.replace(/[^\w:-]/g, "").slice(0, 60) || null : null;
  await prisma.event.create({ data: { type: body.type, ref } }).catch(() => {});
  return new Response(null, { status: 204 });
}
