"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** "Accedi" oppure "Account" se c'è una sessione (l'header resta statico). */
export default function AccountLink({ className }: { className: string }) {
  const [logged, setLogged] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setLogged(!!d.customer))
      .catch(() => {});
  }, [pathname]);
  return (
    <Link href="/account" className={className}>
      {logged ? "Account" : "Accedi"}
    </Link>
  );
}
