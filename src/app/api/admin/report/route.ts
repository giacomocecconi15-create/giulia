import { getCurrentCustomer } from "@/lib/session";
import { CLIENTI_HEADER, MENSILE_HEADER, monthlyRow, newCustomerRows, toCsv } from "@/lib/report";
import { loadReportBookings } from "@/lib/report-data";

export const dynamic = "force-dynamic";

/** GET /api/admin/report?mese=2026-11&tipo=mensile|clienti */
export async function GET(req: Request) {
  const c = await getCurrentCustomer();
  if (c?.role !== "admin") return new Response("Non autorizzato", { status: 401 });
  const url = new URL(req.url);
  const month = url.searchParams.get("mese") ?? "";
  if (!/^\d{4}-\d{2}$/.test(month)) return new Response("Mese non valido", { status: 400 });
  const tipo = url.searchParams.get("tipo") === "clienti" ? "clienti" : "mensile";
  const all = await loadReportBookings();

  const csv =
    tipo === "clienti"
      ? toCsv(
          CLIENTI_HEADER,
          newCustomerRows(all, month).map((r) => [r.dataPrimaVisita.split("-").reverse().join("/"), r.nome, r.fonte, r.campagna, r.servizio, r.importoEuro, r.prenotatoDa, r.tornato, r.note]),
        )
      : (() => {
          const m = monthlyRow(all, month);
          const [y, mm] = month.split("-");
          return toCsv(MENSILE_HEADER, [[
            `01/${mm}/${y}`,
            m.prenotazioniOnline,
            m.prenotazioniTelefono,
            m.totalePrenotazioni,
            m.percentualeOnline,
            m.nuoviClienti,
            m.nuoviClientiOnline,
            m.ricavoPrimoServizioOnlineEuro,
            m.disdetteTardiveNoShow,
            m.slotRecuperati,
            m.disdetteTotali,
          ]]);
        })();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="levelup-${tipo}-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
