import Link from "next/link";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

export default function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <main id="contenuto" className="mx-auto max-w-3xl px-4 py-14 md:px-8 md:py-20">
      <p className="border-l-4 border-magenta bg-tint px-4 py-3 text-sm">
        <strong>BOZZA</strong> da far verificare a un consulente prima della pubblicazione.
      </p>
      <h1 className="mt-8 font-display text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-3">Ultimo aggiornamento: {updated}</p>
      <nav aria-label="Indice" className="mt-8 border-y border-line py-4">
        <ol className="list-decimal space-y-1 pl-5 text-ink-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="underline-offset-2 hover:text-blue hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {sections.map((s, i) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="mt-10">
          <h2 id={`${s.id}-t`} className="font-display text-2xl">
            {i + 1}. {s.title}
          </h2>
          <div className="mt-3 space-y-3 text-ink-2 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">{s.body}</div>
        </section>
      ))}
      <p className="mt-12 text-sm text-ink-3">
        Vedi anche: <Link href="/termini" className="underline">Termini</Link>, <Link href="/privacy" className="underline">Privacy</Link>,{" "}
        <Link href="/cookie" className="underline">Cookie</Link>.
      </p>
    </main>
  );
}
