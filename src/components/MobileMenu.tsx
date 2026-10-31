"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 font-semibold"
      >
        {open ? "Chiudi" : "Menu"}
      </button>
      {open && (
        <nav id="menu-mobile" aria-label="Menu" className="absolute inset-x-0 top-16 border-b border-line bg-bg">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {links.map((l) => (
              <li key={l.href} className="border-b border-line last:border-0">
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center text-lg transition-colors hover:text-blue"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
