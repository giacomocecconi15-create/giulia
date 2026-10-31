import "server-only";

/**
 * WhatsApp Business Cloud API (Meta).
 * Senza WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID i messaggi vengono solo
 * stampati nella console del server (modalità prova).
 *
 * Template da creare e far approvare in Meta Business Manager (lingua: it).
 * I nomi si possono cambiare con le variabili WA_TPL_*.
 */
export const templates = {
  /** authentication: "{{1}} è il tuo codice di verifica." + pulsante copia codice */
  otp: process.env.WA_TPL_OTP ?? "codice_accesso",
  /** utility: Ciao {{1}}, la prenotazione da Level Up è confermata per {{2}} alle {{3}}. Servizi: {{4}}. */
  confirmation: process.env.WA_TPL_CONFIRMATION ?? "prenotazione_confermata",
  /** utility: Ciao {{1}}, ti aspettiamo domani {{2}} alle {{3}}. + risposte rapide Confermo / Sposta / Disdici */
  reminder: process.env.WA_TPL_REMINDER ?? "promemoria_appuntamento",
  /** utility: Ciao {{1}}, si è liberato un posto {{2}} alle {{3}}. Rispondi Prendo entro 15 minuti. + risposta rapida Prendo */
  waitlist: process.env.WA_TPL_WAITLIST ?? "posto_libero",
  /** utility: Ciao {{1}}, la prenotazione di {{2}} alle {{3}} è stata disdetta. */
  cancellation: process.env.WA_TPL_CANCELLATION ?? "prenotazione_disdetta",
  /** marketing: Ciao {{1}}, è passato un po' dall'ultima visita. Prenota qui: {{2}} */
  recall: process.env.WA_TPL_RECALL ?? "richiamo_cliente",
  /** marketing: Ciao {{1}}, grazie della visita! Ci lasci una recensione? {{2}} */
  review: process.env.WA_TPL_REVIEW ?? "richiesta_recensione",
} as const;

export type TemplateKey = keyof typeof templates;

export function whatsappConfigured(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

const GRAPH = "https://graph.facebook.com/v21.0";

type Component = Record<string, unknown>;

async function callApi(to: string, payload: Record<string, unknown>) {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: to.replace(/^\+/, ""), ...payload }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp API ${res.status}: ${text}`);
  }
  return res.json();
}

/** Invia un template con i parametri del corpo nell'ordine {{1}}, {{2}}, ... */
export async function sendTemplate(to: string, key: TemplateKey, params: string[], extra: Component[] = []) {
  const name = templates[key];
  if (!whatsappConfigured()) {
    console.log(`[WhatsApp simulato] ${to} ${name}: ${params.join(" | ")}`);
    return { simulated: true };
  }
  const components: Component[] = [];
  if (params.length) components.push({ type: "body", parameters: params.map((text) => ({ type: "text", text })) });
  components.push(...extra);
  return callApi(to, { type: "template", template: { name, language: { code: "it" }, components } });
}

/** Messaggio libero: consentito solo entro 24 ore dall'ultimo messaggio del cliente. */
export async function sendText(to: string, body: string) {
  if (!whatsappConfigured()) {
    console.log(`[WhatsApp simulato] ${to} testo: ${body}`);
    return { simulated: true };
  }
  return callApi(to, { type: "text", text: { body, preview_url: true } });
}

/** Codice di accesso con template di categoria "authentication". */
export async function sendOtp(phone: string, code: string): Promise<void> {
  if (!whatsappConfigured()) {
    console.log(`[OTP simulato] ${phone}: ${code}`);
    return;
  }
  await sendTemplate(phone, "otp", [code], [
    { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
  ]);
}

/** Non blocca il flusso se l'invio fallisce: registra e prosegue. */
export async function trySend(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
  } catch (e) {
    console.error(`[WhatsApp] invio fallito (${label})`, e);
  }
}
