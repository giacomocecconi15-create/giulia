import { defineConfig, devices } from "@playwright/test";

/**
 * Test end-to-end del flusso completo. Richiede un database di prova:
 *   E2E=1 npm run test:e2e
 * Il setup svuota clienti e prenotazioni, quindi rifiuta database non locali.
 */
const PORT = 3200;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: { OTP_DEV_SHOW: "1", WHATSAPP_TOKEN: "", STRIPE_SECRET_KEY: "", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "" },
  },
});
