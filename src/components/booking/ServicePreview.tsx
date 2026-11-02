"use client";

import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Categoria } from "@/data/catalogo";

export type VoceCatalogoUI = {
  id: string;
  name: string;
  priceLabel: string;
  priceCents: number;
  promoEligible: boolean;
  categorie: Categoria[];
  descrizione: string;
  video?: string;
  immagine?: { src: string; alt: string };
  videoIA?: boolean;
};

export type ServicePreviewHandle = {
  /** Mostra un servizio. Chiamare dentro il click per avere l'audio. */
  show: (item: VoceCatalogoUI, opts: { play: boolean; sound: boolean }) => void;
};

type Stato = "loading" | "ready" | "missing";

/**
 * Anteprima del lavoro: un solo elemento <video> per tutta la pagina, avviato
 * dentro il click (unico modo in cui i browser, Safari compreso, consentono
 * l'audio). Se manca il video mostra la foto reale o "Video in arrivo".
 */
const ServicePreview = forwardRef<ServicePreviewHandle, { item: VoceCatalogoUI | null; className?: string }>(
  function ServicePreview({ item, className = "" }, ref) {
    const [stato, setStato] = useState<Stato>("missing");
    const [playing, setPlaying] = useState(false);
    const [soundOn, setSoundOn] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    /** L'utente vuole il video in riproduzione (non cambia con le pause automatiche). */
    const wantPlay = useRef(false);

    const show: ServicePreviewHandle["show"] = (next, opts) => {
      const v = videoRef.current;
      if (!v) return;
      if (!next.video) {
        v.pause();
        v.removeAttribute("src");
        v.load();
        wantPlay.current = false;
        setStato("missing");
        return;
      }
      const src = `/videos/${next.video}.mp4`;
      if (!v.src.endsWith(src)) {
        setStato("loading");
        v.poster = `/videos/${next.video}.jpg`;
        v.src = src;
      }
      v.muted = !opts.sound;
      wantPlay.current = opts.play;
      if (!opts.play) return;
      v.play()
        .then(() => setSoundOn(!v.muted))
        .catch((err: DOMException) => {
          // Solo se il browser vieta l'audio senza un click: riparte muto
          if (err?.name === "NotAllowedError" && !v.muted) {
            v.muted = true;
            setSoundOn(false);
            v.play().catch(() => {});
          }
        });
    };

    useImperativeHandle(ref, () => ({ show }));

    // Pausa quando l'anteprima esce dallo schermo, ripresa quando rientra
    useEffect(() => {
      const el = boxRef.current;
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

    const togglePlay = () => {
      const v = videoRef.current;
      if (!v) return;
      wantPlay.current = v.paused;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    };

    const toggleSound = () => {
      const v = videoRef.current;
      if (!v) return;
      v.muted = !v.muted;
      setSoundOn(!v.muted);
      if (v.paused) {
        wantPlay.current = true;
        v.play().catch(() => {});
      }
    };

    const controls = (extra: string) =>
      stato === "ready" ? (
        <div className={`gap-2 ${extra}`}>
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
      ) : null;

    return (
      <figure className={className}>
        {/* Su mobile l'anteprima è grande ma non supera ~60% dell'altezza dello schermo */}
        <div
          ref={boxRef}
          className="relative mx-auto aspect-[4/5] w-full max-w-[min(100%,calc(60vh*0.8))] overflow-hidden border border-line bg-tint lg:max-w-none"
        >
          <div
            aria-hidden
            className={`absolute inset-0 bg-tint transition-opacity duration-300 ${stato === "loading" ? "animate-skeleton opacity-100" : "opacity-0"}`}
          />
          <video
            ref={videoRef}
            loop
            playsInline
            preload="auto"
            aria-label={item ? `${item.name}: video del lavoro` : undefined}
            onLoadedData={() => setStato("ready")}
            onError={() => {
              if (videoRef.current?.getAttribute("src")) setStato("missing");
            }}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${stato === "ready" ? "opacity-100" : "pointer-events-none opacity-0"}`}
          />
          {stato === "missing" && item?.immagine && (
            <Image key={item.immagine.src} src={item.immagine.src} alt={item.immagine.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
          )}
          {stato === "missing" && !item?.immagine && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {item ? (
                <>
                  <span className="font-display text-3xl">{item.name}</span>
                  <span className="mt-2 text-sm text-ink-3">Video in arrivo</span>
                </>
              ) : (
                <span className="max-w-60 text-sm text-ink-3 lg:text-base">Scegli un servizio: qui vedi il lavoro.</span>
              )}
            </div>
          )}
          {controls("absolute right-3 bottom-3 flex")}
        </div>
        {item && (
          <figcaption className="mx-auto mt-3 max-w-[min(100%,calc(60vh*0.8))] lg:max-w-none" aria-live="polite">
            <p className="font-display text-xl leading-tight sm:text-2xl lg:hidden">{item.name}</p>
            <p className="mt-1 text-ink-2 lg:mt-0">{item.descrizione}</p>
            {stato === "ready" && item.videoIA && (
              <p className="mt-1 text-xs text-ink-3">
                Video generato con l&apos;intelligenza artificiale, a scopo illustrativo. Il risultato reale dipende dal tipo di capello.
              </p>
            )}
            {((stato === "ready" && !item.videoIA) || (stato === "missing" && item.immagine)) && (
              <p className="mt-1 text-xs text-ink-3">Lavoro reale, realizzato da Giulia.</p>
            )}
          </figcaption>
        )}
      </figure>
    );
  },
);

export default ServicePreview;
