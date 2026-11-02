import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

const privato = ["/account", "/admin", "/api/"];
const aiBots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "CCBot", "Claude-Web", "ClaudeBot", "anthropic-ai", "Google-Extended", "PerplexityBot"];

export default function robots(): MetadataRoute.Robots {
  // Prima del lancio: niente indicizzazione
  if (!site.indexing) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      ...aiBots.map((userAgent) => ({ userAgent, allow: "/", disallow: privato })),
      { userAgent: "*", allow: "/", disallow: privato },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
