import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Immagini della Galleria servite da Instagram attraverso l'ottimizzatore di Next.js
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
  // La vecchia pagina Listino ora è la pagina Prenota (catalogo con anteprime)
  async redirects() {
    return [{ source: "/listino", destination: "/prenota", permanent: true }];
  },
};

export default nextConfig;
