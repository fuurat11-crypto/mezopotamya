// Ausführen: node --test --experimental-strip-types tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CATALOG, DEFAULT_SETTINGS, applyExtracted, calcTotals, emptyInvoice, formatInvoiceNumber,
  invoiceStatus, matchTransaction, needsNewNumber, nextInvoiceNumber, parseAmount, parseBankCSV,
  parseInvoiceText, summarize, type Invoice, calcProfit, legacyInvoices, nextReminderLevel, shareText, whatsappNumber,
} from "../src/accounting/core.ts";

function invoiceWith(prices: Record<string, number>, extra: Partial<Invoice> = {}): Invoice {
  const base = emptyInvoice(DEFAULT_SETTINGS, [], "2026-10-31");
  const fill = (list: Invoice["inland"]) => list.map((p) => ({ ...p, amount: prices[p.catalogId] ?? 0 }));
  return { ...base, inland: fill(base.inland), abroad: fill(base.abroad), ...extra };
}

test("Rechnung 44 (Beispiel Überführung): Inland 1.200 + 19 % = 1.428, Ausland 2.530 steuerfrei, gesamt 3.958", () => {
  const inv = invoiceWith({ transport: 200, service: 100, coffin: 900, freight: 750, ambulance: 1730, consulate: 50 });
  const t = calcTotals(inv);
  assert.equal(t.inlandNet, 1200);
  assert.equal(t.vat, 228);
  assert.equal(t.inlandGross, 1428);
  assert.equal(t.abroadNet, 2530);
  assert.equal(t.total, 3958);
});

test("Rechnung 032 (Beispiel Beisetzung): 1.970 netto, 374,30 USt, 2.344,30 brutto", () => {
  const inv = invoiceWith({ transport: 320, consult: 50, dressing: 100, service: 150, imam: 150, coffin: 1200 });
  const t = calcTotals(inv);
  assert.equal(t.inlandNet, 1970);
  assert.equal(t.vat, 374.3);
  assert.equal(t.total, 2344.3);
});

test("steuerfreie Auslagen werden nicht versteuert, Rabatt mindert steuerpflichtigen Teil", () => {
  const inv = invoiceWith({ coffin: 1000, certificates: 100 }, { discountInland: 100 });
  const t = calcTotals(inv);
  assert.equal(t.taxableNet, 900);
  assert.equal(t.vat, 171);
  assert.equal(t.inlandGross, 1171);
});

test("Rechnungsnummern: fortlaufend, Startwert, nie doppelt", () => {
  assert.equal(nextInvoiceNumber([], 45), 45);
  assert.equal(nextInvoiceNumber([{ number: 45 }, { number: 47 }], 45), 48);
  assert.equal(nextInvoiceNumber([{ number: 12 }], 45), 45);
  assert.equal(formatInvoiceNumber(45, 3), "045");
  assert.equal(formatInvoiceNumber(1234, 3), "1234");
});

test("neues Datum = neue Rechnungsnummer", () => {
  assert.equal(needsNewNumber({ date: "2026-10-31" }, "2026-11-01"), true);
  assert.equal(needsNewNumber({ date: "2026-10-31" }, "2026-10-31"), false);
  assert.equal(needsNewNumber(undefined, "2026-10-31"), false);
});

test("Beträge im deutschen und englischen Format", () => {
  assert.equal(parseAmount("1.428,00 €"), 1428);
  assert.equal(parseAmount("1.730"), 1730);
  assert.equal(parseAmount("900,-"), 900);
  assert.equal(parseAmount("12.50"), 12.5);
  assert.equal(parseAmount("-50,00"), -50);
  assert.equal(parseAmount("2,344.30"), 2344.3);
});

test("Status und Differenzen", () => {
  const inv = invoiceWith({ coffin: 1000 }, { date: "2026-10-01", dueDays: 14 });
  assert.equal(invoiceStatus(inv, "2026-10-05"), "offen");
  assert.equal(invoiceStatus(inv, "2026-11-01"), "überfällig");
  inv.payments.push({ id: "p", date: "2026-10-10", amount: 500, method: "Überweisung" });
  assert.equal(invoiceStatus(inv, "2026-10-12"), "teilbezahlt");
  assert.equal(calcTotals(inv).open, 690);
  inv.payments.push({ id: "q", date: "2026-10-11", amount: 690, method: "Bar" });
  assert.equal(invoiceStatus(inv, "2026-12-01"), "bezahlt");
  const s = summarize([inv], "2026-12-01");
  assert.equal(s.invoiced, 1190);
  assert.equal(s.open, 0);
});

test("Text/Screenshot-Erkennung ordnet Kunde, Verstorbenen, Land und Preise zu", () => {
  const text = `Auftraggeber: Leyla Demir
Musterstr. 12
12345 Musterstadt
Tel: 0176 1234567
Verstorbener: Rojin Demir
Überführung nach Qamishli
Sarg 900
Transport 200 €
Dienstleistung 100,00
Fracht 750
Ambulanz 1.730
Konsulat 50`;
  const ex = parseInvoiceText(text, DEFAULT_CATALOG);
  assert.equal(ex.customer.name, "Leyla Demir");
  assert.equal(ex.customer.street, "Musterstr. 12");
  assert.equal(ex.customer.zip, "12345");
  assert.equal(ex.customer.city, "Musterstadt");
  assert.equal(ex.deceased, "Rojin Demir");
  assert.equal(ex.destination, "Syrien");
  assert.equal(ex.kind, "Überführung");
  const byId = Object.fromEntries(ex.items.map((i) => [i.catalogId, i.amount]));
  assert.deepEqual(byId, { coffin: 900, transport: 200, service: 100, freight: 750, ambulance: 1730, consulate: 50 });

  const inv = applyExtracted(emptyInvoice(DEFAULT_SETTINGS, [], "2026-10-31"), ex, DEFAULT_CATALOG);
  assert.equal(calcTotals(inv).total, 3958);
});

test("Bank-CSV (Sparkasse-Format) wird gelesen und der Rechnung zugeordnet", () => {
  const csv = `"Auftragskonto";"Buchungstag";"Valutadatum";"Buchungstext";"Verwendungszweck";"Beguenstigter/Zahlungspflichtiger";"Kontonummer/IBAN";"Betrag";"Waehrung"
"DE20";"03.11.26";"03.11.26";"GUTSCHRIFT";"Rechnung Nr. 044 Bestattung";"LEYLA DEMIR";"DE11";"3.958,00";"EUR"
"DE20";"04.11.26";"04.11.26";"LASTSCHRIFT";"Miete";"Vermieter";"DE22";"-800,00";"EUR"`;
  const txs = parseBankCSV(csv);
  assert.equal(txs.length, 2);
  assert.equal(txs[0].date, "2026-11-03");
  assert.equal(txs[0].amount, 3958);
  const inv = invoiceWith({ transport: 200, service: 100, coffin: 900, freight: 750, ambulance: 1730, consulate: 50 }, { number: 44, customer: { name: "Leyla Demir", street: "", zip: "", city: "" }, deceased: "Rojin Demir" });
  const other = invoiceWith({ coffin: 500 }, { id: "other", number: 45 });
  const m = matchTransaction(txs[0], [other, inv]);
  assert.ok(m);
  assert.equal(m.invoiceId, inv.id);
  assert.equal(matchTransaction(txs[1], [inv]), undefined);
});

test("Startbestand: Rechnungen 032 und 44 mit richtigen Beträgen, nächste Nr. 45", () => {
  const legacy = legacyInvoices(DEFAULT_SETTINGS);
  assert.deepEqual(legacy.map((i) => [i.number, calcTotals(i).total]), [[32, 2344.3], [44, 3958]]);
  assert.equal(nextInvoiceNumber(legacy, DEFAULT_SETTINGS.startNumber), 45);
});

test("Gewinn pro Auftrag: Nettoerlös minus eigene Kosten", () => {
  const inv = legacyInvoices(DEFAULT_SETTINGS)[1];
  inv.expenses = [{ id: "e1", date: "2026-10-30", label: "Luftfracht Turkish Cargo", amount: 600 }, { id: "e2", date: "2026-10-30", label: "Sarg Einkauf", amount: 400 }];
  const p = calcProfit(inv);
  assert.equal(p.revenueNet, 3730);
  assert.equal(p.expenses, 1000);
  assert.equal(p.profit, 2730);
  assert.equal(summarize([inv]).profit, 2730);
});

test("Mahnstufen, WhatsApp-Nummer und Nachrichtentext", () => {
  const inv = legacyInvoices(DEFAULT_SETTINGS)[0];
  assert.equal(nextReminderLevel(inv), 1);
  inv.reminders = [{ date: "2026-10-20", level: 1 }];
  assert.equal(nextReminderLevel(inv), 2);
  assert.equal(whatsappNumber("0176 81009006"), "4917681009006");
  assert.equal(whatsappNumber("+90 532 111 22 33"), "905321112233");
  const text = shareText(inv, DEFAULT_SETTINGS);
  assert.match(text, /Rechnung Nr\. 032/);
  assert.match(text, /2\.344,30/);
  assert.match(text, /DE88 4506/);
});
