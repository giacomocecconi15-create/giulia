import type { Metadata } from "next";
import PaginaProvvisoria from "@/components/PaginaProvvisoria";

export const metadata: Metadata = { title: "Accedi", robots: { index: false } };

export default function Account() {
  return (
    <PaginaProvvisoria titolo="Accedi">
      <p>L&apos;area personale con accesso tramite cellulare arriva a breve.</p>
    </PaginaProvvisoria>
  );
}
