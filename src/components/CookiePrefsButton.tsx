"use client";

import { OPEN_PREFS_EVENT } from "./CookieConsent";

export default function CookiePrefsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFS_EVENT))}
    >
      Preferenze cookie
    </button>
  );
}
