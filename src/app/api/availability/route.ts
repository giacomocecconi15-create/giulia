import { handleError, json, parseServiceIds } from "@/lib/api";
import { getAvailability } from "@/lib/booking/server";
import { labelGiorno, labelGiornoLungo } from "@/lib/time";

export const dynamic = "force-dynamic";

/** GET /api/availability?services=a,b&from=YYYY-MM-DD&days=7 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const serviceIds = parseServiceIds(url.searchParams.get("services"));
  const from = url.searchParams.get("from") ?? "";
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 7, 1), 14);
  try {
    const { days: result, lastDay, today } = await getAvailability(
      serviceIds,
      /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : "1970-01-01",
      days,
    );
    // Solo l'ora di inizio: la durata non viene mai inviata al cliente.
    return json({
      today,
      lastDay,
      days: result.map((d) => ({
        date: d.date,
        label: labelGiorno(d.date),
        longLabel: labelGiornoLungo(d.date),
        slots: d.slots.map((s) => ({ start: s.start.toISOString(), time: s.time })),
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}
