import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const privato = ["/account", "/admin", "/api/"];
const aiBots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "CCBot", "Claude-Web", "ClaudeBot", "anthropic-ai", "Google-Extended", "PerplexityBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...aiBots.map((userAgent) => ({ userAgent, allow: "/", disallow: privato })),
      { userAgent: "*", allow: "/", disallow: privato },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
