/**
 * Normalizza un cellulare italiano in formato E.164 (+39...).
 * Accetta "333 123 4567", "+39 333-1234567", "0039 3331234567".
 * Restituisce null se non sembra un cellulare italiano.
 */
export function normalizeItalianMobile(input: string): string | null {
  let d = input.replace(/[\s\-().\/]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith("39") && d.length >= 11) d = d.slice(2);
  if (!/^3\d{8,9}$/.test(d)) return null;
  return `+39${d}`;
}

/** "+393331234567" -> "+39 333 123 4567" */
export function formatPhone(e164: string): string {
  const n = e164.replace(/^\+39/, "");
  return `+39 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}
