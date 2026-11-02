import { expect, test, type Page } from "@playwright/test";
import { ADMIN_PHONE } from "./global-setup";

test.use({ storageState: { cookies: [], origins: [] } });

async function acceptCookies(page: Page) {
  const reject = page.getByRole("button", { name: "Rifiuta" });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

async function loginWithDevCode(page: Page, phone: string, name?: string) {
  await page.getByRole("textbox", { name: "Cellulare" }).fill(phone);
  await page.getByRole("button", { name: "Inviami il codice" }).click();
  const code = await page.locator("text=Codice:").locator("strong").innerText();
  await page.getByLabel("Codice a 6 cifre").fill(code);
  await page.getByRole("button", { name: "Continua" }).click();
  if (name) {
    await page.getByRole("textbox", { name: "Nome" }).fill(name);
    await page.getByRole("button", { name: "Continua" }).click();
  }
}

test("cliente da Instagram prenota, Giulia segna la visita e la ritrova nel report", async ({ page, browser }) => {
  // 1. Arriva dalla bio Instagram e tocca "Taglio donna" nel listino della home
  await page.goto("/?utm_source=ig&utm_medium=bio&utm_campaign=lancio");
  await acceptCookies(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("livello");
  await page.locator("#listino th a", { hasText: "Taglio donna" }).click();
  await page.waitForURL(/\/prenota\?servizi=taglio-donna/);

  // 2. Servizio già scelto e giorni subito visibili; aggiunge la piega con "+"
  await expect(page.getByRole("radiogroup", { name: "Giorno" })).toBeVisible();
  await page.getByRole("button", { name: "Aggiungi Piega alla prenotazione" }).click();
  await expect(page.getByRole("button", { name: "Togli Piega", exact: true })).toBeVisible();

  // 3. Giorno e ora: un giorno della settimana dopo
  await page.getByRole("button", { name: "Settimana dopo" }).click();
  await page.locator("[role=radio]:not([disabled])").first().click();
  const slot = page.locator("fieldset button[aria-pressed]").first();
  const time = await slot.innerText();
  await slot.click();
  await page.getByRole("button", { name: "Prenota", exact: true }).last().click();

  // 4. Accesso con codice (WhatsApp in modalità prova)
  await loginWithDevCode(page, "333 777 8899", "Sara Neri");

  // 5. Riepilogo: sconto solo su taglio e piega (20 + 23 = 43, sconto 8,60)
  await expect(page.getByRole("heading", { name: "Riepilogo" })).toBeVisible();
  const summary = page.getByRole("table", { name: "Servizi e prezzi" });
  await expect(summary).toContainText("-8,60");
  await expect(summary).toContainText("34,40");
  const confirm = page.getByRole("button", { name: "Conferma prenotazione" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel(/Ho letto e accetto/).check();
  await confirm.click();
  await expect(page.getByRole("heading", { name: "Ci vediamo!" })).toBeVisible();
  await expect(page.locator("main")).toContainText(time);

  // 6. Area account
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Ciao Sara Neri" })).toBeVisible();
  await expect(page.locator("main")).toContainText("Taglio donna, Piega");

  // 7. Giulia: segna la visita come fatta e scarica il report
  const admin = await browser.newContext();
  const g = await admin.newPage();
  await g.goto("/account");
  await acceptCookies(g);
  await loginWithDevCode(g, ADMIN_PHONE.replace("+39", ""));
  await g.goto("/admin?vista=settimana");
  await g.getByRole("link", { name: "Successivo" }).click();
  await g.getByRole("link", { name: /Sara Neri/ }).click();
  await expect(g.locator("dl")).toContainText("ig");
  await g.getByRole("button", { name: "Fatto", exact: true }).click();
  await expect(g.locator("dl")).toContainText("Fatta");
  await expect(g.locator("dl")).toContainText("carnet 1/5");

  const res = await g.request.get(`/api/admin/report?mese=${await currentBookingMonth(g)}&tipo=clienti`);
  const csv = await res.text();
  expect(csv).toContain("S.N.;Instagram;lancio;Taglio donna + Piega;34,4;Sito");
  await admin.close();
});

async function currentBookingMonth(g: Page) {
  // Il mese della prenotazione: lo legge dal link "Torna all'agenda"
  const href = await g.getByRole("link", { name: "Torna all'agenda" }).getAttribute("href");
  return href!.match(/giorno=(\d{4}-\d{2})/)![1];
}

test("un cliente non admin non entra nell'agenda", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/account/);
});
