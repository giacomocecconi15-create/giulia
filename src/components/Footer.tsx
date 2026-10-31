import Link from "next/link";
import { getInfoSalone } from "@/lib/data";
import { formatFasce, giorniAperti, giorniChiusi } from "@/lib/hours";
import { site, whatsappLink } from "@/lib/site";
import CookiePrefsButton from "./CookiePrefsButton";

export default async function Footer() {
  const wa = whatsappLink();
  const { openingHours } = await getInfoSalone();
  const chiusi = giorniChiusi(openingHours);
  return (
    <footer id="contatti" className="border-t border-line bg-tint">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
        <section aria-labelledby="footer-dove">
          <h2 id="footer-dove" className="font-display text-2xl">
            Dove siamo
          </h2>
          <address className="mt-3 not-italic text-ink-2">
            <strong className="text-ink">{site.name}</strong>
            <br />
            {site.address.street}
            <br />
            {site.address.postalCode} {site.address.city} ({site.address.region})
          </address>
          <ul className="mt-3 space-y-1 text-ink-2">
            {site.phone && (
              <li>
                Telefono:{" "}
                <a href={`tel:${site.phone}`} className="underline underline-offset-2 hover:text-blue">
                  {site.phone}
                </a>
              </li>
            )}
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-blue">
                  WhatsApp
                </a>
              </li>
            )}
            {site.instagram && (
              <li>
                <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-blue">
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </section>

        <section aria-labelledby="footer-orari">
          <h2 id="footer-orari" className="font-display text-2xl">
            Orari
          </h2>
          <table className="mt-3 w-full text-left text-ink-2">
            <caption className="sr-only">Orari di apertura</caption>
            <tbody>
              {giorniAperti(openingHours).map((h) => (
                <tr key={h.iso} className="border-b border-line">
                  <th scope="row" className="py-1.5 pr-4 font-normal text-ink">
                    {h.label}
                  </th>
                  <td className="py-1.5">{formatFasce(h.slots)}</td>
                </tr>
              ))}
              {chiusi && (
                <tr>
                  <th scope="row" className="py-1.5 pr-4 font-normal text-ink">
                    Chiuso
                  </th>
                  <td className="py-1.5">{chiusi}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="footer-info">
          <h2 id="footer-info" className="font-display text-2xl">
            Informazioni
          </h2>
          <ul className="mt-3 space-y-1 text-ink-2">
            <li>
              <Link href="/termini" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-blue">
                Termini e condizioni
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-blue">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/cookie" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-blue">
                Cookie
              </Link>
            </li>
            <li>
              <CookiePrefsButton className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-blue" />
            </li>
          </ul>
        </section>
      </div>
      <p className="border-t border-line px-4 py-5 text-center text-sm text-ink-3">
        {site.name}, {site.address.city}. P.IVA in arrivo.
      </p>
    </footer>
  );
}
