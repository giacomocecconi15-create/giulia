"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { categorie, type Categoria } from "@/data/catalogo";

export type VoceCatalogoUI = {
  id: string;
  name: string;
  priceLabel: string;
  promoEligible: boolean;
  categorie: Categoria[];
  descrizione: string;
  video?: string;
  immagine?: { src: string; alt: string };
  videoIA?: boolean;
};

type Stato = "loading" | "ready" | "missing";

const HOVER_DELAY = 120;

/**
 * Catalogo animato: passando il mouse (desktop) o toccando (mobile) un servizio
 * parte il suo micro-video in loop, muto, nell'area di visualizzazione.
 */
export default function CatalogoServizi({
  voci,
  promoActive,
  discountPct,
}: {
  voci: VoceCatalogoUI[];
  promoActive: boolean;
  discountPct: number;
}) {
  const [filtro, setFiltro] = useState<Categoria | "tutti">("tutti");
  const visibili = useMemo(() => (filtro === "tutti" ? voci : voci.filter((v) => v.categorie.includes(filtro))), [voci, filtro]);
  const [activeId, setActiveId] = useState(voci[0]?.id);
  const active = voci.find((v) => v.id === activeId) ?? visibili[0];

  const [canHover, setCanHover] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ext, setExt] = useState<"webm" | "mp4">("mp4");
  const [stato, setStato] = useState<Stato>("loading");
  const [playing, setPlaying] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setCanHover(hover.matches);
      setReducedMotion(motion.matches);
    };
    update();
    hover.addEventListener("change", update);
    motion.addEventListener("change", update);
    const probe = document.createElement("video");
    setExt(probe.canPlayType('video/webm; codecs="vp9"') ? "webm" : "mp4");
    return () => {
      hover.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  // Con un filtro che esclude il servizio attivo, passa al primo visibile
  useEffect(() => {
    if (visibili.length && !visibili.some((v) => v.id === activeId)) setActiveId(visibili[0].id);
  }, [visibili, activeId]);

  // Nuovo servizio: torna allo skeleton finché il video non è pronto
  useEffect(() => {
    setStato(active?.video ? "loading" : "missing");
    setPlaying(!reducedMotion);
  }, [active?.id, active?.video, reducedMotion]);

  // Mette in pausa il video quando l'area non è visibile (batteria e dati)
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => {
      const v = videoRef.current;
      if (!v) return;
      if (!e.isIntersecting) v.pause();
      else if (playing) v.play().catch(() => {});
    });
    io.observe(el);
    return () => io.disconnect();
  }, [playing]);

  const select = (id: string, fromTap = false) => {
    setActiveId(id);
    if (fromTap && !canHover) {
      const top = viewerRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 64 || top > window.innerHeight * 0.5) {
        viewerRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      }
    }
  };

  const onEnter = (id: string) => {
    if (!canHover) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setActiveId(id), HOVER_DELAY);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  if (!active) return null;

  return (
    <section aria-labelledby="catalogo-title" className="mt-14">
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="catalogo-title" className="font-display text-4xl">
            Guarda i servizi
          </h2>
          <p className="mt-2 max-w-lg text-ink-2">
            {canHover ? "Passa sopra un servizio" : "Tocca un servizio"} per vedere come viene il risultato.
          </p>
        </div>
        <div role="group" aria-label="Filtra per categoria" className="flex flex-wrap gap-2">
          {categorie.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filtro === c.id}
              onClick={() => setFiltro(c.id)}
              className={`min-h-11 border px-4 font-semibold transition-colors ${
                filtro === c.id ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-start">
        {/* Area di visualizzazione: prima su mobile, a destra e fissa su desktop */}
        <div ref={viewerRef} id="catalogo-viewer" className="scroll-mt-20 md:sticky md:top-24 md:order-2">
          <figure>
            <div className="relative aspect-[4/5] max-h-[70vh] w-full overflow-hidden border border-line bg-tint">
              {/* Skeleton durante il caricamento */}
              <div
                aria-hidden
                className={`absolute inset-0 bg-tint transition-opacity duration-300 ${stato === "loading" ? "animate-skeleton opacity-100" : "opacity-0"}`}
              />
              {active.video && stato !== "missing" && (
                <video
                  key={`${active.id}.${ext}`}
                  ref={videoRef}
                  src={`/videos/${active.video}.${ext}`}
                  poster={`/videos/${active.video}.jpg`}
                  autoPlay={!reducedMotion}
                  loop
                  muted
                  playsInline
                  preload="auto"
                  aria-label={`${active.name}: video illustrativo`}
                  onLoadedData={() => setStato("ready")}
                  onError={() => setStato("missing")}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${stato === "ready" ? "opacity-100" : "opacity-0"}`}
                />
              )}
              {stato === "missing" && active.immagine && (
                <Image
                  key={active.immagine.src}
                  src={active.immagine.src}
                  alt={active.immagine.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              )}
              {stato === "missing" && !active.immagine && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <span className="font-display text-3xl">{active.name}</span>
                  <span className="mt-2 text-sm text-ink-3">Video in arrivo</span>
                </div>
              )}
              {stato === "ready" && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute right-3 bottom-3 min-h-11 border border-ink bg-bg px-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-bg"
                >
                  {playing ? "Pausa" : "Riproduci"}
                </button>
              )}
            </div>
            <figcaption className="mt-4" aria-live="polite">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-3xl">{active.name}</span>
                <span className="text-lg font-semibold whitespace-nowrap tabular-nums">{active.priceLabel}</span>
              </div>
              <p className="mt-1 text-ink-2">{active.descrizione}</p>
              {promoActive && active.promoEligible && (
                <p className="mt-1 text-sm font-semibold text-magenta-text">Prima visita -{discountPct}%</p>
              )}
              {stato === "ready" && active.videoIA && (
                <p className="mt-3 text-xs text-ink-3">
                  Video generato con l&apos;intelligenza artificiale, a scopo illustrativo. Il risultato reale dipende dal tipo di
                  capello.
                </p>
              )}
              {((stato === "ready" && !active.videoIA) || (stato === "missing" && active.immagine)) && (
                <p className="mt-3 text-xs text-ink-3">Lavoro reale, realizzato da Giulia.</p>
              )}
              <Link
                href={`/prenota?servizi=${active.id}`}
                className="mt-4 inline-flex min-h-12 items-center border border-ink bg-ink px-6 font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink"
              >
                Prenota {active.name.toLowerCase()}
              </Link>
            </figcaption>
          </figure>
        </div>

        {/* Elenco servizi */}
        <ul className="border-t border-line md:order-1" aria-label="Servizi">
          {visibili.map((v) => {
            const on = v.id === active.id;
            return (
              <li key={v.id} className="border-b border-line">
                <button
                  type="button"
                  aria-pressed={on}
                  aria-controls="catalogo-viewer"
                  onMouseEnter={() => onEnter(v.id)}
                  onFocus={() => select(v.id)}
                  onClick={() => select(v.id, true)}
                  className={`group flex min-h-14 w-full items-center gap-4 py-3 text-left transition-colors ${on ? "text-ink" : "text-ink-2 hover:text-ink"}`}
                >
                  <span
                    aria-hidden
                    className={`h-8 w-1 shrink-0 transition-colors ${on ? "animate-oscillate-bg" : "bg-transparent group-hover:bg-line"}`}
                  />
                  <span className="flex-1">
                    <span className={`block text-lg ${on ? "font-bold" : ""}`}>{v.name}</span>
                    {promoActive && v.promoEligible && (
                      <span className="text-sm font-semibold text-magenta-text">prima visita -{discountPct}%</span>
                    )}
                  </span>
                  <span className="font-semibold tabular-nums">{v.priceLabel}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
