import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La vecchia pagina Listino ora è la pagina Prenota (catalogo con anteprime)
  async redirects() {
    return [{ source: "/listino", destination: "/prenota", permanent: true }];
  },
};

export default nextConfig;
