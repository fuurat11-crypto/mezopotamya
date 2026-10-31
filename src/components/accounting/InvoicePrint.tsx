import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CompanySettings, Invoice, Position, addDays, calcTotals, formatAmount, formatDateDE, formatInvoiceNumber } from "@/accounting/core";
import { useAccounting } from "@/accounting/store";

const kindPhrase: Record<Invoice["kind"], string> = { Bestattung: "Für die Bestattung von", Beisetzung: "Für die Beisetzung von", Überführung: "Für die Überführung von" };

function Header({ s, inv }: { s: CompanySettings; inv: Invoice }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[22px] font-bold tracking-tight">{s.name} <span className="font-serif font-semibold text-[#8a6a4f]">{s.brand}</span></p>
        </div>
        <img src="/favicon.svg" alt="" className="h-14 w-14 opacity-90" />
      </div>
      <p className="mt-6 text-[10px] text-stone-500 underline">{s.name} · {s.street} · {s.zip} {s.city}</p>
      <div className="mt-2 flex justify-between gap-6">
        <div className="text-[13px] leading-snug">
          <p>{inv.customer.name}</p>
          <p>{inv.customer.street}</p>
          <p>{inv.customer.zip} {inv.customer.city}</p>
        </div>
        <table className="text-[13px]">
          <tbody>
            <tr><td className="pr-3 text-stone-500">Rechnungs-Nr.:</td><td className="font-semibold">{formatInvoiceNumber(inv.number, s.numberPadding)}</td></tr>
            <tr><td className="pr-3 text-stone-500">Rechnungsdatum:</td><td>{s.city}, {formatDateDE(inv.date)}</td></tr>
            <tr><td className="pr-3 text-stone-500">Leistungsdatum:</td><td>{formatDateDE(inv.serviceDate || inv.date)}</td></tr>
            {inv.destination && <tr><td className="pr-3 text-stone-500">Zielland:</td><td>{inv.destination}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Positions({ title, positions }: { title: string; positions: Position[] }) {
  return (
    <table className="mt-6 w-full border-collapse text-[12.5px]">
      <thead>
        <tr className="border-b-2 border-stone-800">
          <th className="py-1.5 text-left font-semibold">{title}</th>
          <th className="w-32 py-1.5 text-right font-semibold">Einzelpreis €</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p, i) => (
          <tr key={p.id} className="border-b border-stone-200 align-top">
            <td className="py-1.5 pr-4">{i + 1}. {p.label}</td>
            <td className="py-1.5 text-right tabular-nums">{p.amount ? formatAmount(p.amount) : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between gap-8 py-0.5 ${strong ? "border-t-2 border-stone-800 pt-1.5 text-[15px] font-bold" : ""}`}><span>{label}</span><span className="tabular-nums">{value}</span></div>;
}

function Footer({ s, inv }: { s: CompanySettings; inv: Invoice }) {
  return (
    <div className="mt-auto pt-6 text-[10.5px] leading-snug text-stone-600">
      <p className="mb-3 text-[12.5px] text-stone-800">Wir bitten Sie, den offenen Betrag bis zum <b>{formatDateDE(addDays(inv.date, inv.dueDays))}</b> unter Angabe der Rechnungs-Nr. <b>{formatInvoiceNumber(inv.number, s.numberPadding)}</b> auf unser Konto zu überweisen.</p>
      <div className="grid grid-cols-3 gap-4 border-t border-stone-300 pt-2">
        <div>
          <p className="font-semibold text-stone-800">Zahlungsdetails</p>
          <p>Begünstigter: {s.name}</p>
          <p>Bank: {s.bankName}</p>
          <p>IBAN: {s.iban}</p>
          {s.bic && <p>BIC: {s.bic}</p>}
        </div>
        <div>
          <p className="font-semibold text-stone-800">Kontakt</p>
          <p>Mobil: {s.mobile}</p>
          <p>Tel: {s.phone}{s.fax ? ` · Fax: ${s.fax}` : ""}</p>
          <p>E-Mail: {s.email}</p>
        </div>
        <div>
          <p className="font-semibold text-stone-800">{s.name}</p>
          <p>{s.street}, {s.zip} {s.city}</p>
          {s.managingDirector && <p>Geschäftsführung: {s.managingDirector}</p>}
          {(s.registerCourt || s.registerNumber) && <p>{s.registerCourt} {s.registerNumber}</p>}
          {s.taxNumber && <p>Steuernummer: {s.taxNumber}</p>}
          {s.vatId && <p>USt-IdNr.: {s.vatId}</p>}
        </div>
      </div>
    </div>
  );
}

export function InvoicePrint() {
  const { id } = useParams();
  const { invoices, settings: s } = useAccounting();
  const inv = invoices.find((i) => i.id === id);

  useEffect(() => {
    if (inv) document.title = `Rechnung ${formatInvoiceNumber(inv.number, s.numberPadding)} ${inv.customer.name}`.trim();
  }, [inv, s.numberPadding]);

  if (!inv) return <div className="p-10">Rechnung nicht gefunden. <Link className="underline" to="/buchhaltung/rechnungen">Zur Liste</Link></div>;

  const t = calcTotals(inv);
  const hasAbroad = t.abroadSum > 0;
  const inlandPositions = inv.inland.filter((p) => p.amount > 0 || p.catalogId !== "custom");
  const abroadPositions = inv.abroad.filter((p) => p.amount > 0 || p.catalogId !== "custom");

  return (
    <div className="min-h-screen bg-stone-200 py-6 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 0; } @media print { .sheet { box-shadow: none !important; margin: 0 !important; } }`}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] gap-2 px-2 print:hidden">
        <button onClick={() => window.print()} className="rounded-lg bg-stone-900 px-4 py-2 font-semibold text-white">Drucken / als PDF speichern</button>
        <Link to={`/buchhaltung/rechnung/${inv.id}`} className="rounded-lg bg-white px-4 py-2 font-semibold">Zurück zur Rechnung</Link>
        {inv.cancelled && <span className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">STORNIERT</span>}
      </div>

      <section className="sheet relative mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-white px-[18mm] py-[14mm] text-stone-900 shadow-xl" style={{ breakAfter: hasAbroad ? "page" : "auto" }}>
        {inv.cancelled && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[90px] font-black text-red-500/20 -rotate-12">STORNIERT</div>}
        <Header s={s} inv={inv} />
        <h1 className="mt-8 text-[20px] font-bold">Rechnung</h1>
        <p className="mt-2 text-[13px]">{kindPhrase[inv.kind]} <b>{inv.deceased || "–"}</b> stellen wir Ihnen folgende Leistungen in Rechnung:</p>
        <Positions title="Beschreibung (Inland)" positions={inlandPositions} />
        <div className="ml-auto mt-3 w-72 text-[13px]">
          {inv.discountInland > 0 && <Row label="Rabatt" value={`- ${formatAmount(inv.discountInland)} €`} />}
          <Row label="Gesamt netto" value={`${formatAmount(t.inlandNet)} €`} />
          {t.taxFreeNet > 0 && <Row label="davon steuerfrei" value={`${formatAmount(t.taxFreeNet)} €`} />}
          <Row label={`USt ${inv.vatRate} %`} value={`${formatAmount(t.vat)} €`} />
          <Row label={hasAbroad ? "Summe Inland" : "Rechnungsbetrag"} value={`${formatAmount(t.inlandGross)} €`} strong />
        </div>
        {!hasAbroad && <Footer s={s} inv={inv} />}
      </section>

      {hasAbroad && (
        <section className="sheet relative mx-auto mt-6 flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-white px-[18mm] py-[14mm] text-stone-900 shadow-xl print:mt-0">
          {inv.cancelled && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[90px] font-black text-red-500/20 -rotate-12">STORNIERT</div>}
          <Header s={s} inv={inv} />
          <h1 className="mt-8 text-[20px] font-bold">Rechnung – Seite 2 (Ausland)</h1>
          <Positions title={`Beschreibung (Ausland${inv.destination ? `: ${inv.destination}` : ""})`} positions={abroadPositions} />
          <div className="ml-auto mt-3 w-80 text-[13px]">
            {inv.discountAbroad > 0 && <Row label="Rabatt" value={`- ${formatAmount(inv.discountAbroad)} €`} />}
            <Row label="Gesamt netto Ausland" value={`${formatAmount(t.abroadNet)} €`} />
            {inv.abroadTaxable ? <Row label={`USt ${inv.vatRate} %`} value={`${formatAmount(t.abroadVat)} €`} /> : <p className="py-0.5 text-[11px] text-stone-500">Steuerfreie grenzüberschreitende Beförderung</p>}
            <div className="mt-3 border-t border-stone-300 pt-2">
              <Row label="Summe Inland (brutto)" value={`${formatAmount(t.inlandGross)} €`} />
              <Row label="Summe Ausland" value={`${formatAmount(t.abroadGross)} €`} />
            </div>
            <Row label="EUR GESAMT" value={`${formatAmount(t.total)} €`} strong />
          </div>
          <Footer s={s} inv={inv} />
        </section>
      )}
    </div>
  );
}
