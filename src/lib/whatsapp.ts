import "server-only";

/** True quando le chiavi della WhatsApp Cloud API sono configurate (fase 4). */
export function whatsappConfigured(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Invia il codice di accesso. Fase 3: simulato, il codice viene stampato
 * nella console del server. La fase 4 aggiunge l'invio vero con il template
 * "authentication" della WhatsApp Cloud API.
 */
export async function sendOtp(phone: string, code: string): Promise<void> {
  if (!whatsappConfigured()) {
    console.log(`[OTP simulato] ${phone}: ${code}`);
    return;
  }
  throw new Error("Invio WhatsApp non ancora implementato (fase 4)");
}
