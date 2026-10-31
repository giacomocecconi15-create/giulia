"use client";

import { useActionState } from "react";
import { chargeBooking, type ChargeState } from "@/app/admin/actions";
import { btnPrimary, input, label } from "./ui";

export default function ChargeForm({ id, defaultEuro }: { id: string; defaultEuro: string }) {
  const [state, action, pending] = useActionState<ChargeState, FormData>(chargeBooking, {});
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="amount" className={label}>
          Importo da addebitare (€)
        </label>
        <input id="amount" name="amount" inputMode="decimal" defaultValue={defaultEuro} className={`${input} max-w-40`} />
      </div>
      <button className={btnPrimary} disabled={pending}>
        {pending ? "Addebito in corso" : "Addebita la carta"}
      </button>
      {state.message && (
        <p role="status" className={state.ok ? "text-ink" : "text-magenta-text"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
