import NewBookingForm from "@/components/admin/NewBookingForm";
import { prisma } from "@/lib/db";
import { romeYmd } from "@/lib/time";

export default async function Nuova({ searchParams }: { searchParams: Promise<{ giorno?: string; ora?: string }> }) {
  const sp = await searchParams;
  const sections = await prisma.serviceSection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { services: { where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, durationMin: true } } },
  });
  return (
    <>
      <h1 className="font-display text-3xl">Prenotazione telefonica</h1>
      <p className="mt-1 mb-6 text-ink-3">Non serve la carta. Gli orari mostrati sono quelli liberi per i servizi scelti.</p>
      <NewBookingForm
        sections={sections.map((s) => ({ id: s.id, name: s.name, services: s.services }))}
        date={/^\d{4}-\d{2}-\d{2}$/.test(sp.giorno ?? "") ? sp.giorno! : romeYmd(new Date())}
        time={sp.ora ?? ""}
      />
    </>
  );
}
