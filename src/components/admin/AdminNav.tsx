"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Agenda" },
  { href: "/admin/nuova", label: "Nuova" },
  { href: "/admin/blocchi", label: "Ferie" },
  { href: "/admin/listino", label: "Listino" },
  { href: "/admin/impostazioni", label: "Altro" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg md:static md:border-0">
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {links.map((l) => {
          const active = l.href === "/admin" ? path === "/admin" || path.startsWith("/admin/prenotazione") : path.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center border-t-4 text-sm font-semibold transition-colors md:border-t-0 md:border-b-4 ${
                  active ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
