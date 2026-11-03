"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { categorieGalleria, type CategoriaGalleria } from "@/lib/instagram/categorie";
import type { PostGalleria } from "@/lib/instagram";
import { trackInstagram } from "./track";

/** Griglia della Galleria: filtri per categoria, ogni foto apre il post su Instagram. */
export default function GalleriaGrid({ posts, filtri = true }: { posts: PostGalleria[]; filtri?: boolean }) {
  const [cat, setCat] = useState<CategoriaGalleria | "tutti">("tutti");
  const presenti = useMemo(() => categorieGalleria.filter((c) => posts.some((p) => p.categoria === c.id)), [posts]);
  const visibili = cat === "tutti" ? posts : posts.filter((p) => p.categoria === cat);

  return (
    <div>
      {filtri && presenti.length > 1 && (
        <div role="group" aria-label="Filtra per categoria" className="flex flex-wrap gap-1.5 sm:gap-2">
          {[{ id: "tutti" as const, label: "Tutti" }, ...presenti].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
              className={`min-h-11 border px-3 font-semibold transition-colors sm:px-4 ${
                cat === c.id ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <ul className={`grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 ${filtri ? "mt-6" : ""}`}>
        {visibili.map((p) => (
          <li key={p.id}>
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackInstagram(p.href.includes("/p/") || p.href.includes("/reel/") ? "post" : "profilo")}
              className="group relative block aspect-[4/5] overflow-hidden bg-line"
            >
              <Image
                src={p.image}
                alt={p.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
              />
              {p.video && (
                <span className="absolute top-2 right-2 bg-ink/80 px-2 py-0.5 text-xs font-semibold text-bg">Video</span>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-ink/80 px-2 py-1.5 text-xs font-semibold text-bg opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                Apri su Instagram
              </span>
              <span className="sr-only">(si apre su Instagram)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
