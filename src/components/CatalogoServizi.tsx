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

/**
 * Catalogo animato: cliccando (o toccando) un servizio il suo video parte
 * subito nell'area di visualizzazione, con l'audio. Un solo elemento <video>
 * avviato dentro il click: è l'unico modo in cui i browser (Safari compreso)
 * permettono la riproduzione con audio.
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

  const [isTouch, setIsTouch] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // MP4 (H.264 + AAC): l'unico formato con audio affidabile anche su Safari iPhone
  const [ext, setExt] = useState<"mp4" | null>(null);
  const [stato, setStato] = useState<Stato>("loading");
  const [playing, setPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const loadedId = useRef<string | null>(null);
  const soundRef = useRef(false);
  /** L'utente vuole il video in riproduzione (non cambia con le pause automatiche). */
  const wantPlay = useRef(false);

  useEffect(() => {
    const touch = window.matchMedia("(hover: none), (pointer: coarse)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setIsTouch(touch.matches);
      setReducedMotion(motion.matches);
    };
    update();
    touch.addEventListener("change", update);
    motion.addEventListener("change", update);
    setExt("mp4");
    return () => {
      touch.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  /** Carica il video del servizio e lo avvia; con l'audio se richiesto e consentito. */
  const load = (item: VoceCatalogoUI, opts: { play: boolean; sound: boolean }) => {
    const v = videoRef.current;
    if (!v || !ext) return;
    loadedId.current = item.id;
    if (!item.video) {
      v.pause();
      v.removeAttribute("src");
      v.load();
      setPlaying(false);
      setStato("missing");
      return;
    }
    const src = `/videos/${item.video}.${ext}`;
    if (!v.src.endsWith(src)) {
      setStato("loading");
      v.poster = `/videos/${item.video}.jpg`;
      v.src = src;
    }
    v.muted = !opts.sound;
    wantPlay.current = opts.play;
    if (!opts.play) return;
    v.play()
      .then(() => {
        soundRef.current = !v.muted;
        setSoundOn(!v.muted);
      })
      .catch((err: DOMException) => {
        // Solo se il browser vieta l'audio senza un click: riparte muto
        if (err?.name === "NotAllowedError" && !v.muted) {
          v.muted = true;
          soundRef.current = false;
          setSoundOn(false);
          v.play().catch(() => {});
        }
      });
  };

  // Con un filtro che esclude il servizio attivo, passa al primo visibile
  useEffect(() => {
    if (visibili.length && !visibili.some((v) => v.id === activeId)) setActiveId(visibili[0].id);
  }, [visibili, activeId]);

  // Primo caricamento e cambi non dovuti a un click (filtri): video muto
  useEffect(() => {
    if (!active || !ext || loadedId.current === active.id) return;
    load(active, { play: !reducedMotion, sound: soundRef.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, ext]);

  // Pausa quando l'area esce dallo schermo, ripresa quando rientra (batteria e dati)
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const v = videoRef.current;
        if (!v || !v.getAttribute("src")) return;
        if (!e.isIntersecting) v.pause();
        else if (wantPlay.current && v.paused) v.play().catch(() => {});
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** Click su un servizio: cambia e fa partire subito il video con l'audio. */
  const select = (item: VoceCatalogoUI) => {
    setActiveId(item.id);
    load(item, { play: true, sound: true });
    if (isTouch) {
      const top = viewerRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 64 || top > window.innerHeight * 0.5) {
        viewerRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      }
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      wantPlay.current = true;
      v.play().catch(() => {});
    } else {
      wantPlay.current = false;
      v.pause();
    }
  };

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    soundRef.current = !v.muted;
    setSoundOn(!v.muted);
    if (v.paused) {
      wantPlay.current = true;
      v.play().catch(() => {});
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
            {isTouch ? "Tocca" : "Clicca"} un servizio per guardare il video del lavoro.
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
              {/* Un solo video per tutto il catalogo: src e play gestiti in load() */}
              <video
                ref={videoRef}
                loop
                playsInline
                preload="auto"
                aria-label={`${active.name}: video del lavoro`}
                onLoadedData={() => setStato("ready")}
                onError={() => {
                  if (videoRef.current?.getAttribute("src")) setStato("missing");
                }}
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${stato === "ready" ? "opacity-100" : "pointer-events-none opacity-0"}`}
              />
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
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={toggleSound}
                    aria-pressed={soundOn}
                    className="min-h-11 border border-ink bg-bg px-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-bg"
                  >
                    {soundOn ? "Audio sì" : "Audio no"}
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="min-h-11 border border-ink bg-bg px-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-bg"
                  >
                    {playing ? "Pausa" : "Riproduci"}
                  </button>
                </div>
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
                  onClick={() => select(v)}
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
