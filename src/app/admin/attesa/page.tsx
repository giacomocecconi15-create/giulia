import { prisma } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { labelGiornoLungo, romeHm, romeYmd } from "@/lib/time";

const statusText = { waiting: "In attesa", notified: "Avvisato", booked: "Ha preso il posto", expired: "Scaduto", cancelled: "Annullato" } as const;

export default async function Attesa() {
  const entries = await prisma.waitlistEntry.findMany({
    where: { date: { gte: new Date(`${romeYmd(new Date())}T00:00:00Z`) } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: { customer: true },
  });
  const services = await prisma.service.findMany({ select: { id: true, name: true } });
  const nameOf = Object.fromEntries(services.map((s) => [s.id, s.name]));
  const byDay = Map.groupBy(entries, (e) => e.date.toISOString().slice(0, 10));
  return (
    <>
      <h1 className="font-display text-3xl">Lista d&apos;attesa</h1>
      {entries.length === 0 && <p className="mt-4 text-ink-3">Nessuno in lista.</p>}
      {[...byDay].map(([day, list]) => (
        <section key={day} className="mt-6">
          <h2 className="font-display text-xl first-letter:uppercase">{labelGiornoLungo(day)}</h2>
          <ol className="mt-2 divide-y divide-line border-y border-line">
            {list.map((e, i) => (
              <li key={e.id} className="py-3">
                <p className="font-semibold">
                  {i + 1}. {e.customer.name} <span className="font-normal text-ink-3">{formatPhone(e.customer.phone)}</span>
                </p>
                <p className="text-sm text-ink-2">{e.serviceIds.map((id) => nameOf[id] ?? id).join(", ")}</p>
                <p className="text-sm text-ink-3">
                  {statusText[e.status]}
                  {e.status === "notified" && e.heldStart && ` per le ${romeHm(e.heldStart)}, fino alle ${romeHm(e.heldUntil!)}`}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}
