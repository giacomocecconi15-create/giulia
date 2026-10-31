import Link from "next/link";
import { getInfoSalone } from "@/lib/data";

export default async function PromoBar() {
  const { promoActive, discountPct, promoEndLabel } = await getInfoSalone();
  if (!promoActive) return null;
  return (
    <div className="animate-oscillate-border border-b-4 bg-ink text-bg">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm md:px-8">
        <span className="animate-oscillate text-xl font-bold">-{discountPct}%</span>
        <span>sulla prima visita, fino al {promoEndLabel}.</span>
        <Link href="/prenota" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 hover:text-blue">
          Prenota
        </Link>
      </p>
    </div>
  );
}
