import type { Metadata } from "next";
import PaginaProvvisoria from "@/components/PaginaProvvisoria";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function Pagina() {
  return (
    <PaginaProvvisoria titolo="Privacy">
      <p>Testo in preparazione, in attesa di revisione legale.</p>
    </PaginaProvvisoria>
  );
}
