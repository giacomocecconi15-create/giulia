"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin";
import { onBookingCancelled, onBookingCreated, onSlotFreed } from "@/lib/booking/events";
import { BookingError, createBooking } from "@/lib/booking/server";
import { registerCompletedVisit } from "@/lib/carnet";
import { prisma } from "@/lib/db";
import { normalizeItalianMobile } from "@/lib/phone";
import { chargeSavedCard, stripeConfigured } from "@/lib/stripe";
import { addDays, romeLocalToUtc } from "@/lib/time";
import { ITEMS_ORDER } from "@/lib/booking/order";


/** Blocca uno slot (pausa, appuntamento al telefono senza dettagli, ...). */
export async function blockSlot(formData: FormData) {
  await assertAdmin();
  const start = new Date(String(formData.get("start")));
  const minutes = Number(formData.get("minutes") ?? 30);
  const reason = String(formData.get("reason") || "pausa");
  await prisma.block.create({ data: { start, end: new Date(start.getTime() + minutes * 60_000), reason } });
  revalidatePath("/admin");
}

export async function unblock(formData: FormData) {
  await assertAdmin();
  const b = await prisma.block.delete({ where: { id: String(formData.get("id")) } });
  await onSlotFreed(b.start, b.end);
  revalidatePath("/admin");
  revalidatePath("/admin/blocchi");
}

/** Ferie o chiusura: blocca giorni interi (dal giorno A al giorno B inclusi). */
export async function blockDays(formData: FormData) {
  await assertAdmin();
  const from = String(formData.get("from"));
  const to = String(formData.get("to") || from);
  const reason = String(formData.get("reason") || "ferie");
  const fromT = String(formData.get("fromTime") || "00:00");
  const toT = String(formData.get("toTime") || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || to < from) return;
  const end = toT ? romeLocalToUtc(to, toT) : romeLocalToUtc(addDays(to, 1), "00:00");
  await prisma.block.create({ data: { start: romeLocalToUtc(from, fromT), end, reason } });
  revalidatePath("/admin");
  revalidatePath("/admin/blocchi");
}

export async function setBookingStatus(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "completed" | "no_show" | "confirmed";
  await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findUniqueOrThrow({ where: { id }, include: { items: true } });
    await tx.booking.update({
      where: { id },
      data: { status, completedAt: status === "completed" ? new Date() : null },
    });
    if (status === "completed" && b.status !== "completed") {
      await registerCompletedVisit(tx, b.customerId, b.items.map((i) => i.serviceId));
    }
  });
  revalidatePath(`/admin/prenotazione/${id}`);
  revalidatePath("/admin");
}

export async function adminCancel(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const notify = formData.get("notify") === "on";
  const b = await prisma.booking.update({
    where: { id },
    data: { status: "cancelled", cancelledAt: new Date() },
    include: { customer: true, items: { orderBy: ITEMS_ORDER, include: { service: true } } },
  });
  await onBookingCancelled(b, notify);
  revalidatePath("/admin");
  redirect(`/admin/prenotazione/${id}`);
}

export type ChargeState = { ok?: boolean; message?: string };

/** Addebito manuale della carta a garanzia (no-show o disdetta tardiva). */
export async function chargeBooking(_prev: ChargeState, formData: FormData): Promise<ChargeState> {
  await assertAdmin();
  if (!stripeConfigured()) return { ok: false, message: "Stripe non è collegato: addebito non disponibile in modalità prova." };
  const id = String(formData.get("id"));
  const b = await prisma.booking.findUnique({ where: { id }, include: { customer: true } });
  if (!b) return { ok: false, message: "Prenotazione non trovata." };
  if (b.chargedAt) return { ok: false, message: "Già addebitata." };
  if (!(b.status === "no_show" || (b.status === "cancelled" && b.lateCancellation))) {
    return { ok: false, message: "Si può addebitare solo un no-show o una disdetta tardiva." };
  }
  if (!b.customer.stripeCustomerId || !b.customer.stripePaymentMethodId) return { ok: false, message: "Il cliente non ha una carta salvata." };
  const amount = Number(formData.get("amount")) > 0 ? Math.round(Number(formData.get("amount")) * 100) : b.totalPriceCents - b.discountCents;
  const r = await chargeSavedCard({
    stripeCustomerId: b.customer.stripeCustomerId,
    paymentMethodId: b.customer.stripePaymentMethodId,
    amountCents: amount,
    bookingId: b.id,
    description: `Level Up: ${b.status === "no_show" ? "mancata presentazione" : "disdetta tardiva"}`,
  });
  if (!r.ok) return { ok: false, message: r.reason };
  await prisma.booking.update({ where: { id }, data: { chargedAt: new Date(), stripePaymentIntentId: r.paymentIntentId } });
  revalidatePath(`/admin/prenotazione/${id}`);
  return { ok: true, message: "Addebito riuscito." };
}

export type NewBookingState = { error?: string };

/** Prenotazione presa al telefono. */
export async function createPhoneBooking(_prev: NewBookingState, formData: FormData): Promise<NewBookingState> {
  await assertAdmin();
  const phone = normalizeItalianMobile(String(formData.get("phone") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const serviceIds = formData.getAll("services").map(String);
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!phone) return { error: "Numero di cellulare non valido." };
  if (serviceIds.length === 0) return { error: "Scegli almeno un servizio." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { error: "Scegli giorno e ora." };

  let customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) {
    if (name.length < 2) return { error: "Cliente nuovo: inserisci il nome." };
    customer = await prisma.customer.create({ data: { phone, name } });
  }
  let id: string;
  try {
    const b = await createBooking({
      customerId: customer.id,
      serviceIds,
      start: romeLocalToUtc(date, time),
      source: "telefono",
      byAdmin: true,
    });
    id = b.id;
    if (formData.get("notify") === "on") await onBookingCreated(b);
  } catch (e) {
    if (e instanceof BookingError) {
      return { error: e.code === "slot_unavailable" ? "Orario non disponibile: si sovrappone o è fuori orario." : "Controlla i servizi scelti." };
    }
    throw e;
  }
  revalidatePath("/admin");
  redirect(`/admin/prenotazione/${id}`);
}

export async function saveService(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const data = {
    name: String(formData.get("name")).trim(),
    sectionId: String(formData.get("sectionId")),
    priceCents: Math.round(Number(String(formData.get("price")).replace(",", ".")) * 100),
    priceFrom: formData.get("priceFrom") === "on",
    durationMin: Math.max(5, Number(formData.get("durationMin"))),
    promoEligible: formData.get("promoEligible") === "on",
    active: formData.get("active") === "on",
  };
  if (!data.name || Number.isNaN(data.priceCents)) return;
  if (id) {
    await prisma.service.update({ where: { id }, data });
  } else {
    const slug = data.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const count = await prisma.service.count({ where: { sectionId: data.sectionId } });
    await prisma.service.create({ data: { ...data, id: `${slug}-${Date.now().toString(36)}`, sortOrder: count } });
  }
  revalidatePath("/", "layout");
}

export async function saveSettings(formData: FormData) {
  await assertAdmin();
  const hours: Record<string, [string, string][]> = {};
  for (let d = 1; d <= 7; d++) {
    const slots: [string, string][] = [];
    for (const k of ["a", "b"]) {
      const o = String(formData.get(`h${d}${k}o`) ?? "");
      const c = String(formData.get(`h${d}${k}c`) ?? "");
      if (/^\d{2}:\d{2}$/.test(o) && /^\d{2}:\d{2}$/.test(c) && o < c) slots.push([o, c]);
    }
    if (slots.length) hours[String(d)] = slots.sort((x, y) => (x[0] < y[0] ? -1 : 1));
  }
  const num = (k: string, min: number, max: number, def: number) => {
    const n = Number(formData.get(k));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
  };
  const promoEnd = String(formData.get("promoEndDate") ?? "");
  await prisma.settings.update({
    where: { id: 1 },
    data: {
      openingHours: hours,
      freeCancellationHours: num("freeCancellationHours", 0, 168, 24),
      firstVisitDiscountPct: num("firstVisitDiscountPct", 0, 100, 20),
      recallDays: num("recallDays", 7, 365, 45),
      maxLateMinutes: num("maxLateMinutes", 0, 60, 15),
      bookingHorizonDays: num("bookingHorizonDays", 7, 365, 60),
      minLeadMinutes: num("minLeadMinutes", 0, 2880, 60),
      ...(/^\d{4}-\d{2}-\d{2}$/.test(promoEnd) && { promoEndDate: new Date(`${promoEnd}T00:00:00Z`) }),
    },
  });
  revalidatePath("/", "layout");
}
