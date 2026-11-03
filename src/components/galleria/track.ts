/** Registra un click verso Instagram senza bloccare la navigazione. */
export function trackInstagram(ref: string) {
  try {
    const body = JSON.stringify({ type: "instagram_click", ref });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* niente */
  }
}
