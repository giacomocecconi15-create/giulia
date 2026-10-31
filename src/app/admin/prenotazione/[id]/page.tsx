import Link from "next/link";
import { notFound } from "next/navigation";
import { adminCancel, setBookingStatus } from "../../actions";
import ChargeForm from "@/components/admin/ChargeForm";
import { btn, btnPrimary, statusText } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { stripeConfigured } from "@/lib/stripe";
import { labelGiornoLungo, romeHm, romeYmd } from "@/lib/time";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function Prenotazione({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await prisma.booking.findUnique({
    where: { id },
    include: { customer: { include: { punchCard: true, _count: { select: { bookings: true } } } }, items: { include: { service: true } } },
  });
  if (!b) notFound();
  const now = new Date();
  const final = b.totalPriceCents - b.discountCents;
  const chargeable = (b.status === "no_show" || (b.status === "cancelled" && b.lateCancellation)) && !b.chargedAt;
  const hasCard = !!b.customer.stripePaymentMethodId;
  const wa = `https://wa.me/${b.customer.phone.replace("+", "")}`;
  const date = romeYmd(b.start);

  return (
    <>
      <Link href={`/admin?giorno=${date}`} className="text-sm underline underline-offset-4">
        Torna all&apos;agenda
      </Link>
      <h1 className="mt-4 font-display text-3xl">{b.customer.name}</h1>
      <p className="mt-1">
        <a href={`tel:${b.customer.phone}`} className="underline">{formatPhone(b.customer.phone)}</a>
        {" · "}
        <a href={wa} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a>
      </p>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-line py-4">
        <dt className="text-ink-3">Quando</dt>
        <dd className="font-semibold">
          {cap(labelGiornoLungo(date))}, {romeHm(b.start)}-{romeHm(b.end)}
        </dd>
        <dt className="text-ink-3">Servizi</dt>
        <dd>{b.items.map((i) => `${i.service.name} (${formatEuro(i.priceCents)})`).join(", ")}</dd>
        <dt className="text-ink-3">Totale</dt>
        <dd>
          {formatEuro(final)}
          {b.discountCents > 0 && <span className="text-ink-3"> (sconto prima visita {formatEuro(b.discountCents)})</span>}
        </dd>
        <dt className="text-ink-3">Stato</dt>
        <dd>
          {statusText[b.status]}
          {b.lateCancellation && " (tardiva)"}
          {b.customerConfirmedAt && b.status === "confirmed" && ", confermata dal cliente"}
          {b.chargedAt && `, addebitata il ${b.chargedAt.toLocaleDateString("it-IT")}`}
        </dd>
        <dt className="text-ink-3">Origine</dt>
        <dd>
          {b.createdByAdmin ? "telefono" : b.source ?? "online"}
          {b.fromWaitlist && ", lista d'attesa"}
        </dd>
        <dt className="text-ink-3">Cliente</dt>
        <dd>
          {b.customer._count.bookings} prenotazioni, carnet {b.customer.punchCard?.cuts ?? 0}/5
          {(b.customer.punchCard?.rewardsAvailable ?? 0) > 0 && `, ${b.customer.punchCard!.rewardsAvailable} premi da usare`}
          {hasCard ? ", carta salvata" : ", nessuna carta"}
        </dd>
      </dl>

      {b.status !== "cancelled" && (
        <section className="mt-6">
          <h2 className="font-display text-xl">Com&apos;è andata?</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {b.status !== "completed" && (
              <form action={setBookingStatus}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="status" value="completed" />
                <button className={btnPrimary}>Fatto</button>
              </form>
            )}
            {b.status !== "no_show" && b.start < now && (
              <form action={setBookingStatus}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="status" value="no_show" />
                <button className={btn}>Non si è presentato</button>
              </form>
            )}
            {b.status !== "confirmed" && (
              <form action={setBookingStatus}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="status" value="confirmed" />
                <button className="min-h-11 px-2 text-sm underline underline-offset-4">Annulla stato</button>
              </form>
            )}
          </div>
        </section>
      )}

      {chargeable && (
        <section className="mt-8 border border-magenta p-4">
          <h2 className="font-display text-xl">Addebito carta a garanzia</h2>
          {!stripeConfigured() ? (
            <p className="mt-2 text-ink-2">Stripe non è collegato (modalità prova).</p>
          ) : !hasCard ? (
            <p className="mt-2 text-ink-2">Il cliente non ha una carta salvata.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink-2">Solo per mancata presentazione o disdetta nelle ultime 24 ore, come da Termini.</p>
              <ChargeForm id={b.id} defaultEuro={(final / 100).toFixed(2).replace(".", ",")} />
            </>
          )}
        </section>
      )}

      {b.status === "confirmed" && b.start > now && (
        <section className="mt-8">
          <h2 className="font-display text-xl">Disdici</h2>
          <form action={adminCancel} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={b.id} />
            <label className="flex items-center gap-3">
              <input type="checkbox" name="notify" defaultChecked className="h-5 w-5 accent-ink" />
              Avvisa il cliente su WhatsApp
            </label>
            <button className={btn}>Disdici appuntamento</button>
          </form>
        </section>
      )}
    </>
  );
}
