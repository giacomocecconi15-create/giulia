import { json } from "@/lib/api";
import { runTick } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Compiti periodici: lista d'attesa, promemoria 24h, richiami, recensioni.
 * Vercel Cron invia "Authorization: Bearer $CRON_SECRET"; un servizio esterno
 * può usare lo stesso header oppure ?key=$CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) return json({ error: "unauthorized" }, 401);
  return json({ ok: true, ...(await runTick()) });
}
