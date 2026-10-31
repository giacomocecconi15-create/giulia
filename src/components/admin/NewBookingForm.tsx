"use client";

import { useActionState, useEffect, useState } from "react";
import { createPhoneBooking, type NewBookingState } from "@/app/admin/actions";
import { btnPrimary, input, label } from "./ui";

type Section = { id: string; name: string; services: { id: string; name: string; durationMin: number }[] };

export default function NewBookingForm({ sections, date: initialDate, time: initialTime }: { sections: Section[]; date: string; time: string }) {
  const [state, action, pending] = useActionState<NewBookingState, FormData>(createPhoneBooking, {});
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    if (selected.length === 0 || !date) {
      setSlots(null);
      return;
    }
    setSlots(null);
    fetch(`/api/admin/slots?date=${date}&services=${selected.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots);
        setDuration(d.durationMin);
      });
  }, [selected, date]);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={label}>Cellulare</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" required placeholder="333 123 4567" className={input} />
        </div>
        <div>
          <label htmlFor="name" className={label}>Nome (solo se cliente nuovo)</label>
          <input id="name" name="name" className={input} />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Servizi</legend>
        {sections.map((s) => (
          <div key={s.id} className="mt-3">
            <p className="text-sm text-ink-3">{s.name}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {s.services.map((sv) => {
                const on = selected.includes(sv.id);
                return (
                  <label key={sv.id} className={`flex min-h-11 cursor-pointer items-center gap-2 border px-3 ${on ? "border-ink bg-ink text-bg" : "border-line"}`}>
                    <input
                      type="checkbox"
                      name="services"
                      value={sv.id}
                      checked={on}
                      onChange={() => setSelected((c) => (on ? c.filter((x) => x !== sv.id) : [...c, sv.id]))}
                      className="sr-only"
                    />
                    {sv.name} <span className={on ? "text-bg/70" : "text-ink-3"}>{sv.durationMin}&apos;</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className={label}>Giorno</label>
          <input id="date" name="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="time" className={label}>
            Ora {duration > 0 && <span className="font-normal text-ink-3">(durata {duration} min)</span>}
          </label>
          <select id="time" name="time" required value={time} onChange={(e) => setTime(e.target.value)} className={input}>
            <option value="">{selected.length === 0 ? "Scegli prima i servizi" : slots === null ? "Caricamento" : slots.length === 0 ? "Nessun orario libero" : "Scegli"}</option>
            {slots?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3">
        <input type="checkbox" name="notify" defaultChecked className="h-5 w-5 accent-ink" />
        Invia la conferma su WhatsApp
      </label>

      {state.error && (
        <p role="alert" className="border-l-4 border-magenta bg-tint px-4 py-3">{state.error}</p>
      )}
      <button className={`${btnPrimary} w-full sm:w-auto`} disabled={pending}>
        {pending ? "Salvataggio" : "Salva prenotazione"}
      </button>
    </form>
  );
}
