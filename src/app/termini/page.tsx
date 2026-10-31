import type { Metadata } from "next";
import PaginaProvvisoria from "@/components/PaginaProvvisoria";

export const metadata: Metadata = { title: "Termini e condizioni", alternates: { canonical: "/termini" } };

export default function Pagina() {
  return (
    <PaginaProvvisoria titolo="Termini e condizioni">
      <p>Testo in preparazione, in attesa di revisione legale.</p>
    </PaginaProvvisoria>
  );
}
