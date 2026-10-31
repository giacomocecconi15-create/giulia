import Link from "next/link";

export default function PaginaProvvisoria({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <main id="contenuto" className="mx-auto min-h-[60vh] max-w-3xl px-4 py-20 md:px-8">
      <h1 className="font-display text-5xl">{titolo}</h1>
      <div className="mt-6 space-y-4 text-lg text-ink-2">{children}</div>
      <Link href="/" className="mt-10 inline-flex min-h-11 items-center font-semibold underline underline-offset-4 hover:text-blue">
        Torna alla home
      </Link>
    </main>
  );
}
