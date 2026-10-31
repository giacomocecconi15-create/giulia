import { getListino } from "./servizi";
import { site } from "./site";

/** Dati strutturati Schema.org dell'attività, inclusi in tutte le pagine. */
export function businessSchema() {
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
    openingHoursSpecification: site.hours.flatMap((h) =>
      h.slots.map(([opens, closes]) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${h.schema}`,
        opens,
        closes,
      })),
    ),
    priceRange: "4-200 €",
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
export function offerCatalogSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Listino Level Up",
    provider: { "@id": `${site.url}/#business` },
    itemListElement: getListino().map((sezione) => ({
      "@type": "OfferCatalog",
      name: sezione.nome,
      itemListElement: sezione.servizi.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.nome, serviceType: sezione.nome },
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        ...(s.prezzoDa
          ? {
              priceSpecification: {
                "@type": "PriceSpecification",
                minPrice: s.prezzo,
                ...(s.prezzoMax && { maxPrice: s.prezzoMax }),
                priceCurrency: "EUR",
              },
            }
          : { price: s.prezzo }),
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
