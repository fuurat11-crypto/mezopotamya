// Kernlogik der Buchhaltung: Typen, Berechnung, Rechnungsnummern, Zahlungsabgleich,
// Text-Erkennung. Bewusst ohne Imports, damit alles isoliert getestet werden kann.

export type InvoiceKind = "Bestattung" | "Beisetzung" | "Überführung";
export type PaymentMethod = "Überweisung" | "Bar" | "EC-Karte" | "Versicherung" | "Sonstiges";

export interface Position {
  id: string;
  /** Verweis auf den Leistungskatalog (oder "custom") */
  catalogId: string;
  label: string;
  amount: number;
  /** Steuerfreie Auslagen (z. B. Sterbeurkunde, amtsärztliche Gebühren) */
  taxFree?: boolean;
}

export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  method: PaymentMethod;
  note?: string;
  /** Kennung der Bankbuchung, damit ein Import nicht doppelt gebucht wird */
  bankRef?: string;
}

export interface Expense {
  id: string;
  date: string;
  label: string;
  amount: number;
}

export interface Reminder {
  date: string;
  level: number; // 1 = Zahlungserinnerung, 2 = 1. Mahnung, 3 = letzte Mahnung
}

export interface Customer {
  name: string;
  street: string;
  zip: string;
  city: string;
  phone?: string;
  email?: string;
}

export interface Invoice {
  id: string;
  number: number;
  date: string; // Rechnungsdatum YYYY-MM-DD
  serviceDate: string; // Leistungsdatum (Pflichtangabe § 14 UStG)
  dueDays: number;
  kind: InvoiceKind;
  customer: Customer;
  deceased: string;
  destination?: string;
  inland: Position[];
  abroad: Position[];
  discountInland: number;
  discountAbroad: number;
  vatRate: number; // z. B. 19
  /** Auslandsleistungen umsatzsteuerpflichtig? Standard: nein (grenzüberschreitende Beförderung) */
  abroadTaxable?: boolean;
  notes?: string;
  payments: Payment[];
  /** Eigene Kosten zu diesem Auftrag (Fracht, Friedhof, Flughafen …) – für Gewinn pro Auftrag */
  expenses?: Expense[];
  reminders?: Reminder[];
  createdAt: string;
  cancelled?: boolean;
  cancelledReason?: string;
  replacedBy?: number;
  replaces?: number;
}

export interface CatalogItem {
  id: string;
  label: string;
  section: "inland" | "abroad";
  defaultPrice: number;
  taxFree?: boolean;
  /** Schlüsselwörter für die automatische Zuordnung aus Screenshot/Text */
  keywords: string[];
}

export interface CompanySettings {
  name: string;
  brand: string;
  street: string;
  zip: string;
  city: string;
  mobile: string;
  phone: string;
  fax: string;
  email: string;
  bankName: string;
  iban: string;
  bic: string;
  taxNumber: string;
  vatId: string;
  managingDirector: string;
  registerCourt: string;
  registerNumber: string;
  startNumber: number;
  numberPadding: number;
  vatRate: number;
  dueDays: number;
  claudeApiKey: string;
  /** SHA-256 der PIN (leer = keine Sperre) */
  pinHash: string;
  catalog: CatalogItem[];
}

export const DEFAULT_CATALOG: CatalogItem[] = [
  { id: "transport", section: "inland", label: "Anfahrt & Transport (Hausbesuche, Krankenhaus)", defaultPrice: 200, keywords: ["anfahrt", "transport", "abholung", "überführung inland", "hausbesuch fahrt", "leichenwagen"] },
  { id: "fees", section: "inland", label: "Gebühren & Auslagen pauschal (Porto, Telekommunikation)", defaultPrice: 0, keywords: ["auslagen", "porto", "telekom", "pauschal"] },
  { id: "consult", section: "inland", label: "Beratung (am Telefon, organisatorisch)", defaultPrice: 50, keywords: ["beratung", "organisatorisch", "telefon beratung"] },
  { id: "hygiene", section: "inland", label: "Hygienische Versorgung", defaultPrice: 0, keywords: ["hygien", "versorgung"] },
  { id: "dressing", section: "inland", label: "Einbetten & Einkleidung", defaultPrice: 0, keywords: ["einbetten", "einkleid", "kleidung", "kefen", "kafan", "leichentuch"] },
  { id: "service", section: "inland", label: "Dienstleistung (Hausbesuch; Beurkundung beim Standesamt; Koordination mit Friedhofsverwaltung)", defaultPrice: 100, keywords: ["dienstleistung", "standesamt", "beurkundung", "koordination", "friedhofsverwaltung"] },
  { id: "cooling", section: "inland", label: "Kühlraum, Waschraum", defaultPrice: 0, keywords: ["kühlraum", "kühlung", "waschraum", "kühlzelle"] },
  { id: "imam", section: "inland", label: "Imam / Priester zur Begleitung der Beisetzung (Waschung, Gebet)", defaultPrice: 150, keywords: ["imam", "priester", "hoca", "hodscha", "waschung", "gebet", "ghusl", "gasil", "totengebet"] },
  { id: "coffin", section: "inland", label: "Sarg", defaultPrice: 900, keywords: ["sarg", "tabut", "zinksarg"] },
  { id: "blanket", section: "inland", label: "Deckengarnitur", defaultPrice: 0, keywords: ["decke", "garnitur"] },
  { id: "certificates", section: "inland", label: "Sterbeurkunde, Leichenpass, Leichenschau (steuerfrei)", defaultPrice: 0, taxFree: true, keywords: ["sterbeurkunde", "leichenpass", "leichenschau", "urkunde"] },
  { id: "medical", section: "inland", label: "Gebühren amtsärztl. Untersuchung, Ausstellung der Todesbescheinigung (steuerfrei)", defaultPrice: 0, taxFree: true, keywords: ["amtsarzt", "amtsärzt", "todesbescheinigung", "totenschein", "untersuchung"] },
  { id: "cemetery", section: "inland", label: "Friedhof / Grabstelle (steuerfreie Auslage)", defaultPrice: 0, taxFree: true, keywords: ["friedhof", "grab", "beisetzungsgebühr", "grabstelle"] },
  { id: "freight", section: "abroad", label: "Frachtkosten (Luftfracht)", defaultPrice: 750, keywords: ["fracht", "flug", "luftfracht", "cargo", "kargo", "airline"] },
  { id: "abroadFees", section: "abroad", label: "Gebühren (Ausland)", defaultPrice: 0, keywords: ["gebühren ausland", "zoll", "flughafengebühr"] },
  { id: "hospital", section: "abroad", label: "Krankenhaus", defaultPrice: 0, keywords: ["krankenhaus", "klinik", "hastane"] },
  { id: "abroadCooling", section: "abroad", label: "Kühlraum (Ausland)", defaultPrice: 0, keywords: ["kühlraum ausland", "morgue"] },
  { id: "ambulance", section: "abroad", label: "Ambulanz im Ausland (Fahrt ab Flughafen bis zum Friedhof)", defaultPrice: 1730, keywords: ["ambulan", "krankenwagen", "cenaze aracı", "fahrt ab flughafen", "bis zum friedhof"] },
  { id: "consulate", section: "abroad", label: "Konsulat, Übersetzung", defaultPrice: 50, keywords: ["konsulat", "übersetzung", "konsolosluk", "apostille"] },
  { id: "ticket", section: "abroad", label: "Ticket Hin & Zurück", defaultPrice: 0, keywords: ["ticket", "begleitperson", "hin & zurück", "hin und zurück", "bilet"] },
];

export const DEFAULT_SETTINGS: CompanySettings = {
  // Neue Firma: Alpiroz GmbH in Gründung, Sitz Köln (laut Gesellschaftsvertrag)
  name: "Alpiroz GmbH i. G.",
  brand: "Mezopotamya Cenaze",
  street: "",
  zip: "",
  city: "Köln",
  mobile: "0173/3242196",
  phone: "02331/4733886",
  fax: "02331/7368851",
  email: "alp-gmbh@outlook.de",
  bankName: "",
  iban: "",
  bic: "",
  taxNumber: "",
  vatId: "",
  managingDirector: "",
  registerCourt: "Amtsgericht Köln",
  registerNumber: "",
  startNumber: 1,
  numberPadding: 3,
  vatRate: 19,
  dueDays: 14,
  claudeApiKey: "",
  pinHash: "",
  catalog: DEFAULT_CATALOG,
};

export const COUNTRIES = ["Türkei", "Irak", "Syrien", "Iran", "Libanon", "Armenien", "Aserbaidschan", "Georgien", "Jordanien", "Ägypten", "Marokko", "Tunesien", "Algerien", "Kosovo", "Bosnien", "Albanien", "Pakistan", "Afghanistan"];

const COUNTRY_ALIASES: Record<string, string> = {
  türkei: "Türkei", turkei: "Türkei", türkiye: "Türkei", turkey: "Türkei", tirkiye: "Türkei",
  irak: "Irak", iraq: "Irak", kurdistan: "Irak", "nordirak": "Irak", erbil: "Irak", hewlêr: "Irak", duhok: "Irak", dohuk: "Irak", sulaimaniya: "Irak", silêmanî: "Irak",
  syrien: "Syrien", suriye: "Syrien", syria: "Syrien", sûriye: "Syrien", qamishli: "Syrien", qamişlo: "Syrien", afrin: "Syrien", kobane: "Syrien", hasake: "Syrien",
  iran: "Iran", urmia: "Iran", mahabad: "Iran", libanon: "Libanon", lebanon: "Libanon",
  diyarbakir: "Türkei", diyarbakır: "Türkei", amed: "Türkei", mardin: "Türkei", batman: "Türkei", şırnak: "Türkei", sirnak: "Türkei", van: "Türkei", hakkari: "Türkei", urfa: "Türkei", şanlıurfa: "Türkei", istanbul: "Türkei", ankara: "Türkei", midyat: "Türkei", nusaybin: "Türkei", cizre: "Türkei", siirt: "Türkei", bingöl: "Türkei", muş: "Türkei", tunceli: "Türkei", dersim: "Türkei", elazığ: "Türkei", malatya: "Türkei", adıyaman: "Türkei", kars: "Türkei", ağrı: "Türkei", bitlis: "Türkei", maraş: "Türkei",
};

/** Pflichtangaben, die auf der Rechnung noch fehlen (z. B. solange die Firma in Gründung ist) */
export function missingCompanyFields(s: CompanySettings): string[] {
  const checks: [keyof CompanySettings, string][] = [["street", "Anschrift"], ["zip", "PLZ"], ["bankName", "Bank"], ["iban", "IBAN"], ["taxNumber", "Steuernummer"]];
  return checks.filter(([k]) => !String(s[k] || "").trim()).map(([, label]) => label);
}

// ---------------------------------------------------------------- Hilfsfunktionen

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return todayISO(date);
}

export function formatDateDE(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function formatEUR(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n || 0);
}

export function formatAmount(n: number): string {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
}

/** Parst deutsche und englische Zahlformate: "1.428,00", "1428.00", "900", "900,-", "1.730 €" */
export function parseAmount(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (!raw) return 0;
  let s = String(raw).replace(/[€\sEUReur]/g, "").replace(/,-+$/, "").replace(/\.-+$/, "");
  const negative = /^-|-$/.test(s) || /^\(.*\)$/.test(s);
  s = s.replace(/[()+-]/g, "");
  if (!s) return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    const decimals = s.length - lastComma - 1;
    s = decimals === 3 && s.indexOf(",") === lastComma && s.length > 4 ? s.replace(",", "") : s.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > -1) {
    const decimals = s.length - lastDot - 1;
    // "1.200" = tausend, "12.50" = dezimal
    if (decimals === 3 || s.split(".").length > 2) s = s.replace(/\./g, "");
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

// ---------------------------------------------------------------- Rechnungsnummern

/**
 * Nächste freie Rechnungsnummer. Nummern werden nie wiederverwendet –
 * auch stornierte Rechnungen behalten ihre Nummer (lückenlose Vergabe, GoBD).
 */
export function nextInvoiceNumber(invoices: Pick<Invoice, "number">[], startNumber: number): number {
  const max = invoices.reduce((m, inv) => Math.max(m, inv.number || 0), 0);
  return Math.max(max + 1, startNumber || 1);
}

export function formatInvoiceNumber(n: number, padding = 3): string {
  return String(n).padStart(padding, "0");
}

/**
 * Regel des Betriebs: neues Datum = neue Rechnungsnummer.
 * Wird bei einer bestehenden Rechnung das Datum geändert, muss eine neue Nummer vergeben
 * und die alte Rechnung als ersetzt/storniert markiert werden.
 */
export function needsNewNumber(original: Pick<Invoice, "date"> | undefined, nextDate: string): boolean {
  return !!original && original.date !== nextDate;
}

// ---------------------------------------------------------------- Berechnung

export interface InvoiceTotals {
  inlandSum: number;
  inlandNet: number;
  taxableNet: number;
  taxFreeNet: number;
  vat: number;
  inlandGross: number;
  abroadSum: number;
  abroadNet: number;
  abroadVat: number;
  abroadGross: number;
  total: number;
  paid: number;
  open: number;
}

const sum = (positions: Position[]) => round2(positions.reduce((s, p) => s + (Number(p.amount) || 0), 0));

export function calcTotals(inv: Pick<Invoice, "inland" | "abroad" | "discountInland" | "discountAbroad" | "vatRate" | "abroadTaxable" | "payments">): InvoiceTotals {
  const rate = (Number(inv.vatRate) || 0) / 100;
  const inlandSum = sum(inv.inland);
  const taxFreeNet = sum(inv.inland.filter((p) => p.taxFree));
  const discount = Math.max(0, Number(inv.discountInland) || 0);
  // Rabatt mindert zuerst den steuerpflichtigen Anteil
  const taxableNet = round2(Math.max(0, inlandSum - taxFreeNet - discount));
  const restDiscount = Math.max(0, discount - (inlandSum - taxFreeNet));
  const freeAfter = round2(Math.max(0, taxFreeNet - restDiscount));
  const inlandNet = round2(taxableNet + freeAfter);
  const vat = round2(taxableNet * rate);
  const inlandGross = round2(inlandNet + vat);

  const abroadSum = sum(inv.abroad);
  const abroadNet = round2(Math.max(0, abroadSum - Math.max(0, Number(inv.discountAbroad) || 0)));
  const abroadVat = inv.abroadTaxable ? round2(abroadNet * rate) : 0;
  const abroadGross = round2(abroadNet + abroadVat);

  const total = round2(inlandGross + abroadGross);
  const paid = round2((inv.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0));
  return { inlandSum, inlandNet, taxableNet, taxFreeNet: freeAfter, vat, inlandGross, abroadSum, abroadNet, abroadVat, abroadGross, total, paid, open: round2(total - paid) };
}

/** Gewinn pro Auftrag = Nettoerlös (ohne USt) minus eigene Kosten */
export function calcProfit(inv: Invoice): { revenueNet: number; expenses: number; profit: number; margin: number } {
  const t = calcTotals(inv);
  const revenueNet = round2(t.inlandNet + t.abroadNet);
  const expenses = round2((inv.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0));
  const profit = round2(revenueNet - expenses);
  return { revenueNet, expenses, profit, margin: revenueNet > 0 ? round2((profit / revenueNet) * 100) : 0 };
}

export type InvoiceStatus = "bezahlt" | "teilbezahlt" | "offen" | "überfällig" | "überzahlt" | "storniert";

export function invoiceStatus(inv: Invoice, today: string = todayISO()): InvoiceStatus {
  if (inv.cancelled) return "storniert";
  const t = calcTotals(inv);
  if (t.open < -0.004) return "überzahlt";
  if (Math.abs(t.open) <= 0.004 && t.total > 0) return "bezahlt";
  if (addDays(inv.date, inv.dueDays ?? 14) < today) return "überfällig";
  if (t.paid > 0) return "teilbezahlt";
  return "offen";
}

export interface Summary {
  count: number;
  invoiced: number;
  received: number;
  open: number;
  overdue: number;
  overdueCount: number;
  overpaid: number;
  vat: number;
  expenses: number;
  profit: number;
}

export function summarize(invoices: Invoice[], today: string = todayISO()): Summary {
  const s: Summary = { count: 0, invoiced: 0, received: 0, open: 0, overdue: 0, overdueCount: 0, overpaid: 0, vat: 0, expenses: 0, profit: 0 };
  for (const inv of invoices) {
    if (inv.cancelled) continue;
    const t = calcTotals(inv);
    const status = invoiceStatus(inv, today);
    s.count++;
    s.invoiced += t.total;
    s.received += t.paid;
    s.vat += t.vat + t.abroadVat;
    if (t.open > 0.004) s.open += t.open;
    if (t.open < -0.004) s.overpaid += -t.open;
    if (status === "überfällig") { s.overdue += t.open; s.overdueCount++; }
    const p = calcProfit(inv);
    s.expenses += p.expenses;
    s.profit += p.profit;
  }
  for (const k of ["invoiced", "received", "open", "overdue", "overpaid", "vat", "expenses", "profit"] as const) s[k] = round2(s[k]);
  return s;
}

export function monthlySeries(invoices: Invoice[], months = 12, today: string = todayISO()) {
  const [y, m] = today.split("-").map(Number);
  const rows: { key: string; label: string; berechnet: number; eingegangen: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    rows.push({ key, label: d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }), berechnet: 0, eingegangen: 0 });
  }
  const byKey = new Map(rows.map((r) => [r.key, r]));
  for (const inv of invoices) {
    if (inv.cancelled) continue;
    const r = byKey.get(inv.date.slice(0, 7));
    if (r) r.berechnet = round2(r.berechnet + calcTotals(inv).total);
    for (const p of inv.payments) {
      const pr = byKey.get(p.date.slice(0, 7));
      if (pr) pr.eingegangen = round2(pr.eingegangen + p.amount);
    }
  }
  return rows;
}

// ---------------------------------------------------------------- Rechnung anlegen

export function positionsFromCatalog(catalog: CatalogItem[], section: "inland" | "abroad", prices: Record<string, number> = {}): Position[] {
  return catalog.filter((c) => c.section === section).map((c) => ({ id: uid(), catalogId: c.id, label: c.label, amount: prices[c.id] ?? 0, taxFree: c.taxFree }));
}

export function emptyInvoice(settings: CompanySettings, invoices: Invoice[], today: string = todayISO()): Invoice {
  return {
    id: uid(),
    number: nextInvoiceNumber(invoices, settings.startNumber),
    date: today,
    serviceDate: today,
    dueDays: settings.dueDays,
    kind: "Bestattung",
    customer: { name: "", street: "", zip: "", city: "" },
    deceased: "",
    destination: "",
    inland: positionsFromCatalog(settings.catalog, "inland"),
    abroad: positionsFromCatalog(settings.catalog, "abroad"),
    discountInland: 0,
    discountAbroad: 0,
    vatRate: settings.vatRate,
    abroadTaxable: false,
    notes: "",
    payments: [],
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------- Erkennung aus Text

export interface ExtractedItem { catalogId: string; label?: string; amount: number }

export interface Extracted {
  customer: Partial<Customer>;
  deceased?: string;
  kind?: InvoiceKind;
  destination?: string;
  date?: string;
  serviceDate?: string;
  items: ExtractedItem[];
  discount?: number;
  notes?: string;
}

const AMOUNT_RE = /(-?\d{1,3}(?:[.\s]\d{3})+(?:,\d{1,2})?|-?\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euro|,-)?/gi;

function lastAmountInLine(line: string): number | null {
  // Datumsangaben, Telefonnummern, PLZ und Positionsnummern ignorieren
  const cleaned = line
    .replace(/\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g, " ")
    .replace(/\b0\d{2,5}[\s/-]?\d{3,}\b/g, " ")
    .replace(/\+\d[\d\s]{6,}/g, " ")
    .replace(/^\s*\d{1,2}[.)]\s+/, " ")
    .replace(/\b\d{5}\b(?=\s+[A-ZÄÖÜ])/g, " ");
  const matches = [...cleaned.matchAll(AMOUNT_RE)].map((m) => m[1]).filter((m) => /\d/.test(m));
  if (!matches.length) return null;
  const value = parseAmount(matches[matches.length - 1]);
  return value > 0 ? value : null;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function detectCountry(text: string): string | undefined {
  const lower = normalize(text);
  for (const [alias, country] of Object.entries(COUNTRY_ALIASES)) {
    const re = new RegExp(`(^|[^\\p{L}])${alias}($|[^\\p{L}])`, "u");
    if (re.test(lower)) return country;
  }
  return undefined;
}

export function matchCatalog(line: string, catalog: CatalogItem[]): CatalogItem | undefined {
  const lower = normalize(line);
  let best: { item: CatalogItem; score: number } | undefined;
  for (const item of catalog) {
    for (const kw of item.keywords) {
      if (lower.includes(kw)) {
        const score = kw.length;
        if (!best || score > best.score) best = { item, score };
      }
    }
  }
  return best?.item;
}

function cleanName(s: string) {
  return s.replace(/^[\s:,-]+|[\s:,.-]+$/g, "").replace(/\s{2,}/g, " ");
}

const LABEL = {
  customer: /^(?:auftraggeber(?:in)?|kunde|kundin|rechnungsempfänger(?:in)?|empfänger|name|ansprechpartner(?:in)?|angehörige[rn]?)\s*[:\-]\s*(.+)$/i,
  deceased: /^(?:verstorbene[rn]?|verst\.|name des verstorbenen|merhum(?:e)?|cenaze|mirî|toter|tote)\s*[:\-]\s*(.+)$/i,
  street: /^(?:straße|strasse|str\.|adresse|anschrift)\s*[:\-]\s*(.+)$/i,
  phone: /^(?:tel(?:efon)?|handy|mobil|telefonnummer)\.?\s*[:\-]\s*(.+)$/i,
  email: /([\w.+-]+@[\w-]+\.[\w.]+)/,
  plzCity: /\b(\d{5})\s+([A-ZÄÖÜ][\wäöüß.\- ]{1,40})/,
  streetLine: /^([A-ZÄÖÜ][\wäöüß.\- ]{2,40}?(?:str\.?|straße|strasse|weg|allee|platz|ring|gasse|damm|ufer|chaussee|pfad|steig|markt|hof|berg|feld|garten|tor|kamp|wall))\s*\.?\s*(\d+\s*[a-zA-Z]?(?:\s*-\s*\d+)?)\b/i,
  deceasedPhrase: /(?:bestattung|beisetzung|überführung|beerdigung)\s+(?:von|des|der|für)\s+(?:herrn?|frau)?\s*([A-ZÄÖÜ][\wäöüßçşğıîêû'-]+(?:\s+[A-ZÄÖÜ][\wäöüßçşğıîêû'-]+){0,3})/i,
  date: /\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/,
  discount: /(?:rabatt|nachlass|skonto)\D{0,15}(\d[\d.,]*)/i,
};

/**
 * Ordnet einen freien Text (WhatsApp-Nachricht, Notiz, OCR-Ergebnis eines Screenshots)
 * den Rechnungsfeldern zu. Funktioniert ohne Internet und ohne KI.
 */
export function parseInvoiceText(text: string, catalog: CatalogItem[] = DEFAULT_CATALOG): Extracted {
  const result: Extracted = { customer: {}, items: [] };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unlabeledNames: string[] = [];

  for (const line of lines) {
    let m: RegExpMatchArray | null;
    if ((m = line.match(LABEL.customer))) { result.customer.name = cleanName(m[1]); continue; }
    if ((m = line.match(LABEL.deceased))) { result.deceased = cleanName(m[1]); continue; }
    if ((m = line.match(LABEL.phone))) { result.customer.phone = cleanName(m[1]); continue; }
    if ((m = line.match(LABEL.street))) {
      const full = m[1];
      const plz = full.match(LABEL.plzCity);
      if (plz) { result.customer.zip = plz[1]; result.customer.city = cleanName(plz[2]); }
      result.customer.street = cleanName(full.replace(LABEL.plzCity, "").replace(/,\s*$/, ""));
      continue;
    }
    if ((m = line.match(LABEL.email))) result.customer.email = m[1];

    if (!result.deceased && (m = line.match(LABEL.deceasedPhrase))) result.deceased = cleanName(m[1]);

    const plz = line.match(LABEL.plzCity);
    if (plz && !result.customer.zip && !/rechnung|iban|bank/i.test(line)) {
      result.customer.zip = plz[1];
      result.customer.city = cleanName(plz[2].replace(/\d.*$/, ""));
      const before = line.slice(0, plz.index).replace(/,\s*$/, "").trim();
      if (before && !result.customer.street) result.customer.street = cleanName(before);
      continue;
    }
    const st = line.match(LABEL.streetLine);
    if (st && !result.customer.street && !lastAmountInLineIsPrice(line)) {
      result.customer.street = cleanName(`${st[1]} ${st[2]}`);
      continue;
    }

    if (!result.kind) {
      if (/überführung|ausland|heimat|flug|fracht|nakil|transfer/i.test(line)) result.kind = "Überführung";
      else if (/beisetzung|beerdigung|defin/i.test(line)) result.kind = "Beisetzung";
    }

    const disc = line.match(LABEL.discount);
    if (disc) { result.discount = parseAmount(disc[1]); continue; }

    const dt = line.match(LABEL.date);
    if (dt && !result.date && /datum|date|am\b|tarih/i.test(line)) {
      const yy = dt[3].length === 2 ? `20${dt[3]}` : dt[3];
      result.date = `${yy}-${dt[2].padStart(2, "0")}-${dt[1].padStart(2, "0")}`;
    }

    const item = matchCatalog(line, catalog);
    if (item) {
      const amount = lastAmountInLine(line);
      if (amount !== null && !seen.has(item.id)) {
        seen.add(item.id);
        result.items.push({ catalogId: item.id, amount });
      } else if (amount === null && !seen.has(item.id)) {
        // Leistung erwähnt, aber kein Preis -> Standardpreis vorschlagen
        seen.add(item.id);
        result.items.push({ catalogId: item.id, amount: item.defaultPrice });
      }
      continue;
    }

    // Zeile mit "Bezeichnung  123,00" ohne Katalogtreffer -> freie Position
    const amount = lastAmountInLine(line);
    const label = line.replace(AMOUNT_RE, "").replace(/[:=\-–]+\s*$/, "").trim();
    if (amount !== null && label.length >= 3 && /[a-zäöü]{3}/i.test(label) && !/summe|gesamt|total|netto|brutto|steuer|mwst|offen|iban|rechnung|plz/i.test(label)) {
      result.items.push({ catalogId: "custom", label, amount });
      continue;
    }

    // Möglicher Name ohne Beschriftung (zwei bis vier großgeschriebene Wörter)
    if (/^[A-ZÄÖÜÇŞ][\wäöüßçşğıîêû'-]+(\s+[A-ZÄÖÜÇŞ][\wäöüßçşğıîêû'-]+){1,3}$/.test(line) && !/gmbh|bank|rechnung|bestattung|mezopotamya|cenaze/i.test(line)) {
      unlabeledNames.push(line);
    }
  }

  if (!result.customer.name && unlabeledNames.length) result.customer.name = unlabeledNames.find((n) => n !== result.deceased);
  if (!result.deceased && unlabeledNames.length > 1) result.deceased = unlabeledNames.find((n) => n !== result.customer.name);

  const country = detectCountry(text);
  if (country) {
    result.destination = country;
    if (!result.kind) result.kind = "Überführung";
  }
  return result;
}

function lastAmountInLineIsPrice(line: string) {
  return /€|eur|,\d{2}\b/i.test(line);
}

/** Übernimmt erkannte Daten in eine (neue) Rechnung, ohne Nummer oder Datum zu verändern. */
export function applyExtracted(inv: Invoice, ex: Extracted, catalog: CatalogItem[]): Invoice {
  const next: Invoice = {
    ...inv,
    customer: { ...inv.customer, ...Object.fromEntries(Object.entries(ex.customer).filter(([, v]) => v)) },
    deceased: ex.deceased || inv.deceased,
    kind: ex.kind || inv.kind,
    destination: ex.destination || inv.destination,
    serviceDate: ex.serviceDate || inv.serviceDate,
    discountInland: ex.discount ?? inv.discountInland,
    notes: [inv.notes, ex.notes].filter(Boolean).join("\n"),
    inland: inv.inland.map((p) => ({ ...p })),
    abroad: inv.abroad.map((p) => ({ ...p })),
  };
  for (const item of ex.items) {
    if (!(item.amount > 0)) continue;
    const cat = catalog.find((c) => c.id === item.catalogId);
    if (cat) {
      const list = cat.section === "inland" ? next.inland : next.abroad;
      const pos = list.find((p) => p.catalogId === cat.id);
      if (pos) pos.amount = round2(item.amount);
      else list.push({ id: uid(), catalogId: cat.id, label: cat.label, amount: round2(item.amount), taxFree: cat.taxFree });
    } else {
      const abroadHint = /ausland|flug|fracht|konsulat|ambulan/i.test(item.label || "");
      (abroadHint ? next.abroad : next.inland).push({ id: uid(), catalogId: "custom", label: item.label || "Sonstige Leistung", amount: round2(item.amount) });
    }
  }
  return next;
}

// ---------------------------------------------------------------- Bank-Import & Abgleich

export interface BankTransaction {
  ref: string;
  date: string;
  amount: number;
  name: string;
  purpose: string;
}

export function parseCSV(text: string): string[][] {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) || "";
  const delimiter = [";", "\t", ","].map((d) => ({ d, n: firstLine.split(d).length })).sort((a, b) => b.n - a.n)[0].d;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

function toISODate(s: string): string {
  const t = s.trim();
  let m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return "";
}

const COLS = {
  date: /^(buchungstag|buchungsdatum|datum|valuta|wertstellung|date)/i,
  amount: /^(betrag|umsatz|amount|betrag \(eur\)|betrag in eur)/i,
  credit: /^(haben|gutschrift|eingang)/i,
  debit: /^(soll|lastschrift|ausgang)/i,
  name: /(beguenstigter|begünstigter|zahlungspflichtiger|auftraggeber|empfänger|name|gegenkonto.*name|kontoinhaber)/i,
  purpose: /(verwendungszweck|buchungstext|beschreibung|vorgang|purpose|zweck)/i,
};

/** Liest Kontoauszüge (CSV von Sparkasse, Volksbank/Märkische Bank, DKB u. a.) */
export function parseBankCSV(text: string): BankTransaction[] {
  const rows = parseCSV(text);
  const headerIndex = rows.findIndex((r) => r.some((c) => COLS.date.test(c.trim())) && r.some((c) => COLS.amount.test(c.trim()) || COLS.credit.test(c.trim())));
  if (headerIndex < 0) return [];
  const header = rows[headerIndex].map((h) => h.trim());
  const idx = (re: RegExp) => header.findIndex((h) => re.test(h));
  const iDate = idx(COLS.date);
  const iAmount = idx(COLS.amount);
  const iCredit = idx(COLS.credit);
  const iDebit = idx(COLS.debit);
  const iName = idx(COLS.name);
  const purposeCols = header.map((h, i) => (COLS.purpose.test(h) ? i : -1)).filter((i) => i >= 0);
  const out: BankTransaction[] = [];
  for (const r of rows.slice(headerIndex + 1)) {
    const date = toISODate(r[iDate] || "");
    if (!date) continue;
    let amount = iAmount >= 0 ? parseAmount(r[iAmount]) : parseAmount(r[iCredit]) - Math.abs(parseAmount(r[iDebit] || ""));
    if (iAmount < 0 && iCredit < 0) amount = 0;
    const name = (iName >= 0 ? r[iName] : "").trim();
    const purpose = purposeCols.map((i) => r[i] || "").join(" ").replace(/\s+/g, " ").trim();
    out.push({ ref: `${date}|${round2(amount)}|${name}|${purpose}`.slice(0, 200), date, amount: round2(amount), name, purpose });
  }
  return out;
}

export interface MatchSuggestion {
  invoiceId: string;
  score: number;
  reasons: string[];
}

function tokens(s: string) {
  return normalize(s).split(/[^\p{L}]+/u).filter((t) => t.length >= 3);
}

export function matchTransaction(tx: BankTransaction, invoices: Invoice[], padding = 3): MatchSuggestion | undefined {
  if (tx.amount <= 0) return undefined;
  const text = `${tx.name} ${tx.purpose}`;
  const lower = normalize(text);
  let best: MatchSuggestion | undefined;
  for (const inv of invoices) {
    if (inv.cancelled) continue;
    if (inv.payments.some((p) => p.bankRef === tx.ref)) return undefined; // schon gebucht
    const t = calcTotals(inv);
    const reasons: string[] = [];
    let score = 0;
    const num = String(inv.number);
    const padded = formatInvoiceNumber(inv.number, padding);
    const numRe = new RegExp(`(?:re(?:chnung)?|rg|rech|nr|invoice|fatura)\\.?\\s*(?:nr\\.?|nummer|no\\.?)?\\s*[:#]?\\s*0*${num}\\b`, "i");
    if (numRe.test(lower)) { score += 60; reasons.push(`Rechnungsnummer ${padded} im Verwendungszweck`); }
    else if (new RegExp(`(^|\\D)0*${num}(\\D|$)`).test(lower) && num.length >= 2) { score += 20; reasons.push(`Zahl ${num} im Verwendungszweck`); }
    if (Math.abs(tx.amount - t.open) < 0.01 && t.open > 0) { score += 35; reasons.push("Betrag = offener Betrag"); }
    else if (Math.abs(tx.amount - t.total) < 0.01) { score += 30; reasons.push("Betrag = Rechnungsbetrag"); }
    else if (tx.amount < t.open) { score += 5; reasons.push("Teilzahlung möglich"); }
    const nameTokens = [...tokens(inv.customer.name), ...tokens(inv.deceased)];
    const hits = nameTokens.filter((tk) => lower.includes(tk));
    if (hits.length) { score += Math.min(30, hits.length * 15); reasons.push(`Name: ${[...new Set(hits)].join(", ")}`); }
    if (t.open <= 0.004) score -= 40;
    if (!best || score > best.score) best = { invoiceId: inv.id, score, reasons };
  }
  return best && best.score >= 35 ? best : undefined;
}

// ---------------------------------------------------------------- Export

export function invoicesToCSV(invoices: Invoice[], padding = 3): string {
  const head = ["Rechnungsnr", "Datum", "Leistungsdatum", "Art", "Kunde", "Verstorbene/r", "Zielland", "Netto Inland", "USt", "Ausland (steuerfrei)", "Gesamt", "Bezahlt", "Differenz", "Status"];
  const esc = (v: string | number) => {
    // Formel-Injection in Excel verhindern (Texte, die mit = + @ beginnen)
    const s = typeof v === "number" ? formatAmount(v) : (v ?? "").replace(/^([=+@\t\r])/, "'$1");
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [head.join(";")];
  for (const inv of [...invoices].sort((a, b) => a.number - b.number)) {
    const t = calcTotals(inv);
    lines.push([formatInvoiceNumber(inv.number, padding), formatDateDE(inv.date), formatDateDE(inv.serviceDate), inv.kind, inv.customer.name, inv.deceased, inv.destination || "", t.inlandNet, t.vat + t.abroadVat, t.abroadNet, t.total, t.paid, t.open, invoiceStatus(inv)].map(esc).join(";"));
  }
  return "﻿" + lines.join("\r\n");
}

// ---------------------------------------------------------------- Zahlungserinnerung & Versand

export const REMINDER_TITLES = ["", "Zahlungserinnerung", "1. Mahnung", "Letzte Mahnung"];

export function nextReminderLevel(inv: Invoice): number {
  const last = Math.max(0, ...(inv.reminders || []).map((r) => r.level));
  return Math.min(3, last + 1);
}

export function shareText(inv: Invoice, s: CompanySettings, kind: "rechnung" | "erinnerung" = "rechnung"): string {
  const t = calcTotals(inv);
  const nr = formatInvoiceNumber(inv.number, s.numberPadding);
  const greeting = `Guten Tag ${inv.customer.name},`;
  const body = kind === "rechnung"
    ? `anbei erhalten Sie unsere Rechnung Nr. ${nr} vom ${formatDateDE(inv.date)}${inv.deceased ? ` für ${inv.deceased}` : ""} über ${formatEUR(t.total)}.`
    : `zu unserer Rechnung Nr. ${nr} vom ${formatDateDE(inv.date)} ist noch ein Betrag von ${formatEUR(t.open)} offen. Bitte überweisen Sie diesen bis zum ${formatDateDE(addDays(todayISO(), 7))}.`;
  return `${greeting}\n\n${body}\n\nBitte überweisen Sie auf:\n${s.name}\nIBAN: ${s.iban}\nBank: ${s.bankName}\nVerwendungszweck: Rechnung ${nr}\n\nVielen Dank und herzliches Beileid.\n${s.name} – ${s.brand}\n${s.mobile}`;
}

/** Telefonnummer für wa.me (deutsche Nummern mit 0 → 49) */
export function whatsappNumber(phone?: string): string {
  if (!phone) return "";
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "49" + d.slice(1);
  return d;
}
