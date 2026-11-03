import "server-only";
import { prisma } from "../db";
import { site } from "../site";
import { altDaDidascalia, categoriaDaDidascalia, type CategoriaGalleria } from "./categorie";

export type PostGalleria = {
  id: string;
  /** URL dell'immagine sul CDN di Instagram (o locale nel ripiego) */
  image: string;
  alt: string;
  /** Link al post (o al profilo nel ripiego) */
  href: string;
  categoria: CategoriaGalleria;
  video: boolean;
  timestamp: string;
};

const GRAPH = "https://graph.instagram.com";

/** Token: quello rinnovato salvato nelle impostazioni, altrimenti quello in env. */
async function getToken(): Promise<string | null> {
  const s = await prisma.settings.findUnique({ where: { id: 1 }, select: { instagramToken: true } }).catch(() => null);
  return s?.instagramToken ?? process.env.INSTAGRAM_ACCESS_TOKEN ?? null;
}

type IgMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

/**
 * Ultimi post Instagram tramite l'API ufficiale (Instagram API con login
 * Instagram, account Business o Creator). Le immagini restano su Instagram:
 * il sito le mostra passando dall'ottimizzatore di Next.js, così il browser
 * del visitatore non contatta Meta. Cache di un'ora.
 */
export async function getInstagramPosts(limit = 60): Promise<PostGalleria[] | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const res = await fetch(`${GRAPH}/me/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`, {
      next: { revalidate: 3600, tags: ["instagram"] },
    });
    if (!res.ok) {
      console.error("[Instagram]", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { data: IgMedia[] };
    return data.data
      .map((m) => {
        const image = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
        if (!image) return null;
        const categoria = categoriaDaDidascalia(m.caption);
        return {
          id: m.id,
          image,
          alt: altDaDidascalia(m.caption, categoria),
          href: m.permalink,
          categoria,
          video: m.media_type === "VIDEO",
          timestamp: m.timestamp,
        };
      })
      .filter((p): p is PostGalleria => p !== null);
  } catch (e) {
    console.error("[Instagram]", e);
    return null;
  }
}

/** Ripiego finché l'API non è collegata: le foto già nel sito, con link al profilo. */
export function postLocali(): PostGalleria[] {
  const profilo = site.instagram || "https://www.instagram.com/level_up_pesaro/";
  const t = "2026-11-01T00:00:00Z";
  return [
    { id: "l1", image: "/images/lavoro-balayage.jpg", alt: "Schiariture: balayage caramello su capelli lunghi mossi", href: profilo, categoria: "schiariture", video: false, timestamp: t },
    { id: "l2", image: "/images/lavoro-sposa-ricci.jpg", alt: "Sposa: raccolto alto di ricci con tralcio di perle", href: profilo, categoria: "sposa", video: false, timestamp: t },
    { id: "l3", image: "/images/lavoro-sposa-onde.jpg", alt: "Sposa: onde morbide su capelli lunghi castani", href: profilo, categoria: "sposa", video: false, timestamp: t },
    { id: "l4", image: "/images/lavoro-taglio-uomo.jpg", alt: "Uomo e barba: taglio corto sfumato ai lati", href: profilo, categoria: "uomo", video: false, timestamp: t },
    { id: "l5", image: "/videos/cheratina.jpg", alt: "Trattamenti: cheratina lisciante", href: profilo, categoria: "trattamenti", video: true, timestamp: t },
    { id: "l6", image: "/videos/colore-uomo.jpg", alt: "Schiariture: biondo platino per uomo", href: profilo, categoria: "schiariture", video: true, timestamp: t },
  ];
}

export async function getGalleria(): Promise<{ posts: PostGalleria[]; live: boolean }> {
  const posts = await getInstagramPosts();
  return posts && posts.length ? { posts, live: true } : { posts: postLocali(), live: false };
}

/** Anteprima per la home: fino a 8 post, una categoria alla volta per varietà. */
export function anteprima(posts: PostGalleria[], max = 8): PostGalleria[] {
  const perCat = new Map<string, PostGalleria[]>();
  for (const p of posts) perCat.set(p.categoria, [...(perCat.get(p.categoria) ?? []), p]);
  const out: PostGalleria[] = [];
  while (out.length < max && [...perCat.values()].some((l) => l.length)) {
    for (const l of perCat.values()) {
      const p = l.shift();
      if (p && out.length < max) out.push(p);
    }
  }
  return out;
}

/** Rinnovo del token a lunga durata (valido 60 giorni): una volta a settimana. */
export async function refreshInstagramToken(now = new Date()) {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  const token = s?.instagramToken ?? process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return "nessun token";
  if (s?.instagramTokenAt && now.getTime() - s.instagramTokenAt.getTime() < 7 * 86_400_000) return "non serve";
  const res = await fetch(`${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) return `errore ${res.status}`;
  const { access_token } = (await res.json()) as { access_token: string };
  await prisma.settings.update({ where: { id: 1 }, data: { instagramToken: access_token, instagramTokenAt: now } });
  return "rinnovato";
}
