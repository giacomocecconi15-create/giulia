import type { Metadata } from "next";
import Link from "next/link";
import WaitlistClaim from "@/components/booking/WaitlistClaim";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/session";
import { labelGiornoLungo, romeHm, romeYmd } from "@/lib/time";

export const metadata: Metadata = { title: "Si è liberato un posto", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Attesa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry, customer] = await Promise.all([prisma.waitlistEntry.findUnique({ where: { id } }), getCurrentCustomer()]);
  const now = new Date();
  const valid = entry && entry.status === "notified" && entry.heldUntil && entry.heldUntil > now && entry.heldStart;
  const mine = !customer || customer.id === entry?.customerId;

  return (
    <main id="contenuto" className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      {valid && mine ? (
        <>
          <h1 className="font-display text-5xl">Si è liberato un posto</h1>
          <p className="mt-4 text-xl">
            {labelGiornoLungo(romeYmd(entry.heldStart!))}, ore <strong>{romeHm(entry.heldStart!)}</strong>
          </p>
          <WaitlistClaim
            entryId={entry.id}
            logged={!!customer}
            minutesLeft={Math.max(1, Math.round((entry.heldUntil!.getTime() - now.getTime()) / 60_000))}
          />
        </>
      ) : (
        <>
          <h1 className="font-display text-5xl">Posto non più disponibile</h1>
          <p className="mt-4 text-ink-2">
            {entry?.status === "booked" ? "Hai già preso questo posto." : "Il tempo per confermare è scaduto o il posto è stato preso. Resti in lista per le prossime occasioni solo se ti iscrivi di nuovo."}
          </p>
          <Link href="/prenota" className="mt-8 inline-flex min-h-12 items-center border border-ink bg-ink px-6 font-semibold text-bg hover:border-blue hover:bg-blue hover:text-ink">
            Cerca un altro orario
          </Link>
        </>
      )}
    </main>
  );
}
