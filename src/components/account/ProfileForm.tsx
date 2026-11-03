"use client";

import { useState } from "react";
import { ageRanges, BIO_MAX, hairTypes } from "@/lib/profile";

type Profile = { bio: string | null; ageRange: string | null; hairType: string | null };

const input = "mt-1 block min-h-11 w-full border border-ink bg-bg px-3 outline-none focus:border-blue focus:ring-2 focus:ring-blue";

/** Profilo facoltativo: aiuta Giulia a preparare l'appuntamento. */
export default function ProfileForm({ initial }: { initial: Profile }) {
  const [bio, setBio] = useState(initial.bio ?? "");
  const [ageRange, setAgeRange] = useState(initial.ageRange ?? "");
  const [hairType, setHairType] = useState(initial.hairType ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("saving");
    const res = await fetch("/api/account/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, ageRange, hairType }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("error");
      setMessage(data.message ?? "Salvataggio non riuscito.");
      return;
    }
    setState("saved");
  };

  return (
    <form onSubmit={save} className="space-y-5" onChange={() => state === "saved" && setState("idle")}>
      <fieldset>
        <legend className="font-semibold">Tipo di capelli</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {hairTypes.map((h) => (
            <label
              key={h.id}
              className={`flex min-h-11 cursor-pointer items-center border px-4 font-semibold transition-colors ${
                hairType === h.id ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"
              }`}
            >
              <input
                type="radio"
                name="hairType"
                value={h.id}
                checked={hairType === h.id}
                onChange={() => setHairType(h.id)}
                className="sr-only"
              />
              {h.label}
            </label>
          ))}
          {hairType && (
            <button type="button" onClick={() => setHairType("")} className="min-h-11 px-2 text-sm underline underline-offset-4">
              Non dire
            </button>
          )}
        </div>
      </fieldset>

      <div>
        <label htmlFor="ageRange" className="font-semibold">
          Età
        </label>
        <select id="ageRange" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className={`${input} max-w-xs`}>
          <option value="">Preferisco non dirlo</option>
          {ageRanges.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bio" className="font-semibold">
          Breve bio
        </label>
        <p id="bio-hint" className="text-sm text-ink-3">
          Cosa ti piace, cosa vorresti cambiare, allergie o sensibilità da sapere.
        </p>
        <textarea
          id="bio"
          value={bio}
          maxLength={BIO_MAX}
          rows={3}
          onChange={(e) => setBio(e.target.value)}
          aria-describedby="bio-hint bio-count"
          className={`${input} py-2`}
        />
        <p id="bio-count" className="mt-1 text-right text-xs text-ink-3 tabular-nums">
          {bio.length}/{BIO_MAX}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === "saving"}
          className="min-h-11 border border-ink bg-ink px-5 font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink disabled:opacity-60"
        >
          {state === "saving" ? "Salvataggio" : "Salva profilo"}
        </button>
        <span role="status" className={`text-sm ${state === "error" ? "text-magenta-text" : "text-ink-3"}`}>
          {state === "saved" ? "Profilo salvato." : state === "error" ? message : "Tutti i campi sono facoltativi. Li vede solo Giulia."}
        </span>
      </div>
    </form>
  );
}
