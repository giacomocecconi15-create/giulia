import { saveService } from "../actions";
import { btnPrimary, input } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

function ServiceForm({
  s,
  sections,
}: {
  s?: { id: string; name: string; sectionId: string; priceCents: number; priceFrom: boolean; durationMin: number; promoEligible: boolean; active: boolean; internalNote: string | null };
  sections: { id: string; name: string }[];
}) {
  return (
    <form action={saveService} className={`grid grid-cols-6 gap-2 border-b border-line py-4 ${s && !s.active ? "opacity-60" : ""}`}>
      <input type="hidden" name="id" value={s?.id ?? ""} />
      <label className="col-span-6 sm:col-span-3">
        <span className="sr-only">Nome</span>
        <input name="name" defaultValue={s?.name} required placeholder="Nome servizio" className={`${input} font-semibold`} />
      </label>
      <label className="col-span-3 sm:col-span-2">
        <span className="block text-xs text-ink-3">Sezione</span>
        <select name="sectionId" defaultValue={s?.sectionId ?? sections[0]?.id} className={input}>
          {sections.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
      </label>
      <label className="col-span-3 sm:col-span-1">
        <span className="block text-xs text-ink-3">Prezzo €</span>
        <input name="price" inputMode="decimal" required defaultValue={s ? (s.priceCents / 100).toString().replace(".", ",") : ""} className={input} />
      </label>
      <label className="col-span-3 sm:col-span-1">
        <span className="block text-xs text-ink-3">Durata min</span>
        <input name="durationMin" type="number" min={5} step={5} required defaultValue={s?.durationMin ?? 30} className={input} />
      </label>
      <div className="col-span-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:col-span-5">
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="priceFrom" defaultChecked={s?.priceFrom} className="h-5 w-5 accent-ink" /> Prezzo &ldquo;da&rdquo;</label>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="promoEligible" defaultChecked={s?.promoEligible} className="h-5 w-5 accent-ink" /> Sconto prima visita</label>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="h-5 w-5 accent-ink" /> Visibile</label>
        <button className={`${btnPrimary} ml-auto min-h-10 text-sm`}>{s ? "Salva" : "Aggiungi"}</button>
      </div>
      {s?.internalNote && <p className="col-span-6 text-sm text-magenta-text">Da verificare: {s.internalNote}</p>}
    </form>
  );
}

export default async function Listino() {
  const sections = await prisma.serviceSection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { services: { orderBy: { sortOrder: "asc" } } },
  });
  const plain = sections.map((s) => ({ id: s.id, name: s.name }));
  return (
    <>
      <h1 className="font-display text-3xl">Listino</h1>
      <p className="mt-1 text-ink-3">La durata serve solo all&apos;agenda: i clienti non la vedono. Le modifiche sono subito online.</p>
      {sections.map((sec) => (
        <section key={sec.id} className="mt-8">
          <h2 className="border-b-2 border-ink pb-1 font-display text-xl">{sec.name}</h2>
          {sec.services.map((s) => (
            <ServiceForm key={s.id} s={s} sections={plain} />
          ))}
        </section>
      ))}
      <section className="mt-10">
        <h2 className="border-b-2 border-ink pb-1 font-display text-xl">Nuovo servizio</h2>
        <ServiceForm sections={plain} />
      </section>
    </>
  );
}
