import type { InfoSalone, SezioneListino } from "./data";
import { giorniAperti } from "./hours";
import { site } from "./site";

/** Dati strutturati Schema.org dell'attività, inclusi in tutte le pagine. */
export function businessSchema(info: InfoSalone) {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${site.url}/#business`,
    name: site.name,
    alternateName: "Level Up Pesaro",
    description: site.description,
    url: site.url,
    ...(site.phone && { telephone: site.phone }),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      postalCode: site.address.postalCode,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    employee: { "@type": "Person", name: site.operator, jobTitle: "Parrucchiera e barbiera" },
    openingHoursSpecification: giorniAperti(info.openingHours).flatMap((h) =>
      h.slots.map(([opens, closes]) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${h.schema}`,
        opens,
        closes,
      })),
    ),
    priceRange: "€€",
    currenciesAccepted: "EUR",
    ...(site.instagram && { sameAs: [site.instagram] }),
    potentialAction: {
      "@type": "ReserveAction",
      target: `${site.url}/prenota`,
      name: "Prenota online",
    },
  };
}

/** Listino come catalogo di offerte (Service + Offer). */
export function offerCatalogSchema(listino: SezioneListino[]) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Listino Level Up",
    url: `${site.url}/listino`,
    provider: { "@id": `${site.url}/#business` },
    itemListElement: listino.map((sezione) => ({
      "@type": "OfferCatalog",
      name: sezione.name,
      itemListElement: sezione.services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, serviceType: sezione.name },
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        ...(s.priceFrom
          ? {
              priceSpecification: {
                "@type": "PriceSpecification",
                minPrice: s.priceCents / 100,
                ...(s.priceMaxCents && { maxPrice: s.priceMaxCents / 100 }),
                priceCurrency: "EUR",
              },
            }
          : { price: s.priceCents / 100 }),
      })),
    })),
  };
}

export function faqSchema(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
