import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { REMINDER_TITLES, addDays, calcTotals, formatAmount, formatDateDE, formatInvoiceNumber, todayISO } from "@/accounting/core";
import { useAccounting } from "@/accounting/store";

/** Druckansicht Zahlungserinnerung / Mahnung (Stufe aus ?stufe=1..3) */
export function ReminderPrint() {
  const { id } = useParams();
  const { invoices, settings: s } = useAccounting();
  const inv = invoices.find((i) => i.id === id);
  const level = Math.min(3, Math.max(1, parseInt(new URLSearchParams(window.location.search).get("stufe") || "1") || 1));
  const title = REMINDER_TITLES[level];

  useEffect(() => {
    if (inv) document.title = `${title} ${formatInvoiceNumber(inv.number, s.numberPadding)} ${inv.customer.name}`;
  }, [inv, title, s.numberPadding]);

  if (!inv) return <div className="p-10">Rechnung nicht gefunden. <Link className="underline" to="/buchhaltung/rechnungen">Zur Liste</Link></div>;
  const t = calcTotals(inv);
  const today = todayISO();
  const nr = formatInvoiceNumber(inv.number, s.numberPadding);
  const intro = [
    "",
    `sicher ist es Ihnen in dieser schweren Zeit entgangen: Zu unserer Rechnung Nr. ${nr} vom ${formatDateDE(inv.date)} konnten wir noch keinen vollständigen Zahlungseingang feststellen.`,
    `leider ist der offene Betrag zu unserer Rechnung Nr. ${nr} vom ${formatDateDE(inv.date)} trotz unserer Zahlungserinnerung noch nicht vollständig bei uns eingegangen.`,
    `trotz unserer bisherigen Schreiben ist der offene Betrag zu unserer Rechnung Nr. ${nr} vom ${formatDateDE(inv.date)} weiterhin nicht beglichen. Wir bitten Sie letztmalig um Zahlung. Sollte bis zum genannten Datum kein Zahlungseingang erfolgen, behalten wir uns weitere Schritte vor.`,
  ][level];

  return (
    <div className="min-h-screen bg-stone-200 py-6 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 0; } @media print { .sheet { box-shadow: none !important; } }`}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] gap-2 px-2 print:hidden">
        <button onClick={() => window.print()} className="rounded-lg bg-stone-900 px-4 py-2 font-semibold text-white">Drucken / als PDF speichern</button>
        <Link to={`/buchhaltung/rechnung/${inv.id}`} className="rounded-lg bg-white px-4 py-2 font-semibold">Zurück zur Rechnung</Link>
      </div>
      <section className="sheet mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-white px-[18mm] py-[14mm] text-[13px] text-stone-900 shadow-xl">
        <p className="text-[22px] font-bold">{s.name} <span className="font-serif font-semibold text-[#8a6a4f]">{s.brand}</span></p>
        <p className="mt-6 text-[10px] text-stone-500 underline">{[s.name, s.street, `${s.zip} ${s.city}`.trim()].filter(Boolean).join(" · ")}</p>
        <div className="mt-2 flex justify-between">
          <div className="leading-snug"><p>{inv.customer.name}</p><p>{inv.customer.street}</p><p>{inv.customer.zip} {inv.customer.city}</p></div>
          <p>{s.city}, {formatDateDE(today)}</p>
        </div>
        <h1 className="mt-10 text-[20px] font-bold">{title} – Rechnung Nr. {nr}</h1>
        <p className="mt-4">Sehr geehrte/r {inv.customer.name},</p>
        <p className="mt-3 leading-relaxed">{intro}</p>
        <table className="mt-6 w-full text-[13px]">
          <tbody>
            <tr className="border-b"><td className="py-1.5">Rechnung Nr. {nr} vom {formatDateDE(inv.date)}{inv.deceased ? ` (${inv.deceased})` : ""}</td><td className="text-right tabular-nums">{formatAmount(t.total)} €</td></tr>
            {inv.payments.map((p) => <tr key={p.id} className="border-b"><td className="py-1.5">Zahlung vom {formatDateDE(p.date)}</td><td className="text-right tabular-nums">- {formatAmount(p.amount)} €</td></tr>)}
            <tr className="border-t-2 border-stone-800 font-bold"><td className="py-2">Offener Betrag</td><td className="text-right tabular-nums">{formatAmount(t.open)} €</td></tr>
          </tbody>
        </table>
        <p className="mt-6 leading-relaxed">Bitte überweisen Sie den offenen Betrag bis zum <b>{formatDateDE(addDays(today, level === 3 ? 7 : 10))}</b> unter Angabe der Rechnungs-Nr. <b>{nr}</b> auf unser Konto. Sollten Sie die Zahlung bereits veranlasst haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.</p>
        <p className="mt-6">Mit freundlichen Grüßen<br />{s.name}</p>
        <div className="mt-auto grid grid-cols-3 gap-4 border-t border-stone-300 pt-2 text-[10.5px] text-stone-600">
          <div><p className="font-semibold text-stone-800">Bankverbindung</p><p>{s.bankName}</p><p>IBAN: {s.iban}</p>{s.bic && <p>BIC: {s.bic}</p>}</div>
          <div><p className="font-semibold text-stone-800">Kontakt</p><p>Mobil: {s.mobile}</p><p>Tel: {s.phone}</p><p>{s.email}</p></div>
          <div><p className="font-semibold text-stone-800">{s.name}</p><p>{[s.street, `${s.zip} ${s.city}`.trim()].filter(Boolean).join(", ")}</p>{s.managingDirector && <p>GF: {s.managingDirector}</p>}{s.taxNumber && <p>St.-Nr.: {s.taxNumber}</p>}</div>
        </div>
      </section>
    </div>
  );
}
