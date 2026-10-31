import { json, parseServiceIds } from "@/lib/api";
import { bookingDurationMinutes, computeAvailability } from "@/lib/booking/availability";
import { busyBetween, loadSettings } from "@/lib/booking/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/session";
import { addDays, romeLocalToUtc } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Orari liberi per l'admin: nessun preavviso minimo né limite di orizzonte. */
export async function GET(req: Request) {
  const c = await getCurrentCustomer();
  if (c?.role !== "admin") return json({ error: "unauthorized" }, 401);
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? "";
  const ids = parseServiceIds(url.searchParams.get("services"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || ids.length === 0) return json({ slots: [] });
  const [services, settings] = await Promise.all([prisma.service.findMany({ where: { id: { in: ids } } }), loadSettings()]);
  const durationMin = bookingDurationMinutes(services.map((s) => s.durationMin), settings.slotMinutes);
  const busy = await busyBetween(prisma, romeLocalToUtc(date, "00:00"), romeLocalToUtc(addDays(date, 1), "00:00"));
  const [day] = computeAvailability({
    from: date,
    days: 1,
    durationMin,
    openingHours: settings.openingHours,
    slotMinutes: settings.slotMinutes,
    busy,
    now: new Date(),
    minLeadMinutes: 0,
    lastDay: "9999-12-31",
  });
  return json({ durationMin, slots: day.slots.map((s) => s.time) });
}
