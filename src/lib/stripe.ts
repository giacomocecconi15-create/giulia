import "server-only";
import Stripe from "stripe";
import { prisma } from "./db";

/** True se le chiavi Stripe sono configurate. Senza chiavi la carta non viene richiesta (modalità prova). */
export function stripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY mancante");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

type CustomerRow = { id: string; name: string; phone: string; stripeCustomerId: string | null };

export async function ensureStripeCustomer(c: CustomerRow): Promise<string> {
  if (c.stripeCustomerId) return c.stripeCustomerId;
  const sc = await stripe().customers.create({ name: c.name, phone: c.phone, metadata: { customerId: c.id } });
  await prisma.customer.update({ where: { id: c.id }, data: { stripeCustomerId: sc.id } });
  return sc.id;
}

/**
 * SetupIntent: salva la carta per usi futuri off-session.
 * Nessun addebito e nessun blocco di fondi (§6 Carta a garanzia).
 */
export async function createSetupIntent(c: CustomerRow) {
  const customer = await ensureStripeCustomer(c);
  return stripe().setupIntents.create({
    customer,
    usage: "off_session",
    allowed_payment_method_types: ["card"],
    metadata: { customerId: c.id },
  });
}

/** Dopo la conferma lato browser: verifica il SetupIntent e salva la carta sul cliente. */
export async function saveCardFromSetupIntent(c: CustomerRow, setupIntentId: string) {
  const si = await stripe().setupIntents.retrieve(setupIntentId);
  if (si.metadata?.customerId !== c.id || si.status !== "succeeded" || !si.payment_method) {
    throw new Error("SetupIntent non valido");
  }
  const pm = typeof si.payment_method === "string" ? si.payment_method : si.payment_method.id;
  await prisma.customer.update({ where: { id: c.id }, data: { stripePaymentMethodId: pm } });
  return pm;
}

export async function savedCardInfo(paymentMethodId: string | null) {
  if (!paymentMethodId || !stripeConfigured()) return null;
  try {
    const pm = await stripe().paymentMethods.retrieve(paymentMethodId);
    return pm.card ? { brand: pm.card.brand, last4: pm.card.last4, exp: `${pm.card.exp_month}/${pm.card.exp_year % 100}` } : null;
  } catch {
    return null;
  }
}

export type ChargeResult = { ok: true; paymentIntentId: string } | { ok: false; reason: string };

/**
 * Addebito off-session per no-show o disdetta tardiva.
 * Solo su azione manuale di Giulia dall'admin.
 */
export async function chargeSavedCard(input: {
  stripeCustomerId: string;
  paymentMethodId: string;
  amountCents: number;
  bookingId: string;
  description: string;
}): Promise<ChargeResult> {
  try {
    const pi = await stripe().paymentIntents.create(
      {
        amount: input.amountCents,
        currency: "eur",
        customer: input.stripeCustomerId,
        payment_method: input.paymentMethodId,
        off_session: true,
        confirm: true,
        description: input.description,
        metadata: { bookingId: input.bookingId },
      },
      { idempotencyKey: `charge-${input.bookingId}` },
    );
    if (pi.status === "succeeded") return { ok: true, paymentIntentId: pi.id };
    return { ok: false, reason: `Stato pagamento: ${pi.status}` };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === "authentication_required") {
      return { ok: false, reason: "La banca richiede l'autenticazione del cliente: l'addebito automatico non è possibile." };
    }
    return { ok: false, reason: err.message ?? "Addebito non riuscito" };
  }
}
