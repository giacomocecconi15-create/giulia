import Link from "next/link";
import AccountLink from "./AccountLink";
import MobileMenu from "./MobileMenu";

export const navLinks = [
  { href: "/#valori", label: "Chi siamo" },
  { href: "/galleria", label: "Galleria" },
  { href: "/#listino", label: "Listino" },
  { href: "/#faq", label: "Domande" },
  { href: "/#contatti", label: "Contatti" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex min-h-11 shrink-0 items-center" aria-label="Level Up, torna alla home">
          {/* Logo vettoriale: nitido a qualsiasi dimensione e sugli schermi retina */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-level-up.svg" alt="" width={84} height={42} className="h-9 w-auto sm:h-11" />
        </Link>
        <nav aria-label="Principale" className="hidden lg:block">
          <ul className="flex items-center gap-6 text-ink-2">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center transition-colors hover:text-blue">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <AccountLink className="inline-flex min-h-11 items-center border border-ink px-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-bg sm:px-4 sm:text-base" />
          <Link
            href="/prenota"
            className="inline-flex min-h-11 items-center border border-ink bg-ink px-3 text-sm font-semibold text-bg sm:px-4 sm:text-base transition-colors hover:border-blue hover:bg-blue hover:text-ink"
          >
            Prenota
          </Link>
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}
