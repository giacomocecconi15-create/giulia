import type { NextConfig } from "next";

// STATIC_EXPORT=1 genera una copia statica in out/ per l'anteprima senza Node.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = staticExport ? { output: "export", trailingSlash: true } : {};

export default nextConfig;
