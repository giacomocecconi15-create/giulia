import type { Metadata } from "next";
import PaginaProvvisoria from "@/components/PaginaProvvisoria";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Prenota", alternates: { canonical: "/prenota" } };

export default function Prenota() {
  const wa = whatsappLink("Ciao Giulia, vorrei prenotare.");
  return (
    <PaginaProvvisoria titolo="Prenota">
      <p>La prenotazione online arriva a breve.</p>
      {wa && (
        <p>
          Nel frattempo scrivici su{" "}
          <a href={wa} className="underline underline-offset-2 hover:text-blue">WhatsApp</a>.
        </p>
      )}
    </PaginaProvvisoria>
  );
}
