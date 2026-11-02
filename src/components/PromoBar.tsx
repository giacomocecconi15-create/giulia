import { getInfoSalone } from "@/lib/data";

/** Barra promo: solo testo informativo, una riga anche su mobile. */
export default async function PromoBar() {
  const { promoActive, discountPct, promoEndLabel } = await getInfoSalone();
  if (!promoActive) return null;
  return (
    <div className="animate-oscillate-border border-b-4 bg-ink text-bg">
      <p className="mx-auto flex max-w-6xl items-baseline justify-center gap-2 px-4 py-1.5 text-center text-xs leading-tight sm:text-sm md:px-8">
        <span className="animate-oscillate text-xl leading-none font-bold">-{discountPct}%</span>
        <span>
          sulla prima visita<span className="hidden sm:inline">, fino al {promoEndLabel}</span>
          <span className="sm:hidden">, fino al {promoEndLabel.replace(/ \d{4}$/, "")}</span>
        </span>
      </p>
    </div>
  );
}
