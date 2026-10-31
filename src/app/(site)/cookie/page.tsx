import type { Metadata } from "next";
import CookiePrefsButton from "@/components/CookiePrefsButton";
import PaginaProvvisoria from "@/components/PaginaProvvisoria";

export const metadata: Metadata = { title: "Cookie", alternates: { canonical: "/cookie" } };

export default function Cookie() {
  return (
    <PaginaProvvisoria titolo="Cookie">
      <p>
        <strong className="text-ink">BOZZA</strong>, da far verificare a un consulente.
      </p>
      <table className="w-full border-collapse text-left text-base">
        <caption className="sr-only">Cookie usati dal sito</caption>
        <thead>
          <tr className="border-b-2 border-ink">
            <th scope="col" className="py-2 pr-4">Cookie</th>
            <th scope="col" className="py-2 pr-4">Tipo</th>
            <th scope="col" className="py-2">A cosa serve</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            <td className="py-2 pr-4">lu_consent</td>
            <td className="py-2 pr-4">Tecnico</td>
            <td className="py-2">Ricorda la tua scelta sui cookie per 6 mesi.</td>
          </tr>
          <tr className="border-b border-line">
            <td className="py-2 pr-4">lu_session</td>
            <td className="py-2 pr-4">Tecnico</td>
            <td className="py-2">Mantiene l&apos;accesso al tuo account per 90 giorni. Solo se accedi.</td>
          </tr>
          <tr className="border-b border-line">
            <td className="py-2 pr-4">lu_utm (memoria della scheda)</td>
            <td className="py-2 pr-4">Tecnico, di prima parte</td>
            <td className="py-2">Ricorda da quale canale sei arrivato (es. Instagram) per associarlo alla prenotazione. Si cancella chiudendo la scheda.</td>
          </tr>
          <tr className="border-b border-line">
            <td className="py-2 pr-4">Google Analytics (_ga)</td>
            <td className="py-2 pr-4">Misurazione, solo con consenso</td>
            <td className="py-2">Statistiche anonime sulle visite.</td>
          </tr>
          <tr className="border-b border-line">
            <td className="py-2 pr-4">Pixel Meta (_fbp)</td>
            <td className="py-2 pr-4">Marketing, solo con consenso</td>
            <td className="py-2">Misura i risultati delle sponsorizzate su Facebook e Instagram.</td>
          </tr>
        </tbody>
      </table>
      <p>
        <CookiePrefsButton className="inline-flex min-h-11 items-center border border-ink px-5 font-semibold text-ink transition-colors hover:bg-ink hover:text-bg" />
      </p>
    </PaginaProvvisoria>
  );
}
