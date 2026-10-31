import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BellRing, Ban, Mail, MessageCircle, Plus, Printer, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  COUNTRIES, Expense, Extracted, Invoice, InvoiceKind, Payment, PaymentMethod, Position, REMINDER_TITLES, addDays, applyExtracted, calcProfit, calcTotals,
  emptyInvoice, formatDateDE, formatEUR, parseAmount, formatInvoiceNumber, invoiceStatus, needsNewNumber, nextInvoiceNumber, nextReminderLevel, round2, shareText, todayISO, uid, whatsappNumber,
} from "@/accounting/core";
import { deleteInvoice, saveInvoice, setData, useAccounting } from "@/accounting/store";
import { StatusBadge } from "./AccountingLayout";
import { ScreenshotImport } from "./ScreenshotImport";

const KINDS: InvoiceKind[] = ["Bestattung", "Beisetzung", "Überführung"];
const METHODS: PaymentMethod[] = ["Überweisung", "Bar", "EC-Karte", "Versicherung", "Sonstiges"];

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</Label>{children}</div>;
}

function PositionsTable({ title, positions, onChange, showTaxFree }: { title: string; positions: Position[]; onChange: (p: Position[]) => void; showTaxFree: boolean }) {
  const update = (id: string, patch: Partial<Position>) => onChange(positions.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => onChange([...positions, { id: uid(), catalogId: "custom", label: "", amount: 0 }])}><Plus className="h-4 w-4" />Position</Button>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {positions.map((p, i) => (
          <div key={p.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${p.amount > 0 ? "bg-amber-50" : ""}`}>
            <span className="w-6 text-right text-xs text-stone-400">{i + 1}.</span>
            <Input value={p.label} onChange={(e) => update(p.id, { label: e.target.value })} className="h-9 flex-1 border-transparent bg-transparent px-2 shadow-none hover:border-stone-200 focus:bg-white" placeholder="Bezeichnung" />
            {showTaxFree && (
              <label className="flex items-center gap-1 text-xs text-stone-500" title="Steuerfreie Auslage (keine USt)">
                <input type="checkbox" checked={!!p.taxFree} onChange={(e) => update(p.id, { taxFree: e.target.checked })} />frei
              </label>
            )}
            <div className="relative w-32">
              <Input type="number" inputMode="decimal" step="0.01" min="0" value={p.amount ? String(p.amount) : ""} onChange={(e) => update(p.id, { amount: round2(parseFloat(e.target.value) || 0) })} className="h-9 pr-7 text-right tabular-nums" placeholder="0,00" />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">€</span>
            </div>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-stone-400 hover:text-red-600" title="Entfernen" onClick={() => onChange(positions.filter((x) => x.id !== p.id))}><X className="h-4 w-4" /></Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function InvoiceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, settings } = useAccounting();
  const original = useMemo(() => invoices.find((i) => i.id === id), [invoices, id]);
  const isNew = !original;
  const [inv, setInv] = useState<Invoice>(() => original ? structuredClone(original) : emptyInvoice(settings, invoices));
  const [lastSource, setLastSource] = useState("");
  // Hinweis: Die Route rendert den Editor mit key={id}, dadurch startet jede Rechnung frisch.

  // Neue Rechnung: Nummer immer aktuell halten (nächste freie Nummer)
  const pendingNumber = isNew ? nextInvoiceNumber(invoices, settings.startNumber) : inv.number;
  const dateChanged = needsNewNumber(original, inv.date);
  const shownNumber = dateChanged ? nextInvoiceNumber(invoices, settings.startNumber) : pendingNumber;
  const t = calcTotals(inv);
  const set = (patch: Partial<Invoice>) => setInv((p) => ({ ...p, ...patch }));
  const setCustomer = (patch: Partial<Invoice["customer"]>) => setInv((p) => ({ ...p, customer: { ...p.customer, ...patch } }));

  const onExtracted = useCallback((ex: Extracted, source: string) => {
    setInv((prev) => applyExtracted(prev, ex, settings.catalog));
    setLastSource(source);
    const found = [ex.customer.name && "Kunde", ex.deceased && "Verstorbene/r", ex.destination && `Zielland ${ex.destination}`, ex.items.length && `${ex.items.length} Leistung(en)`].filter(Boolean);
    if (found.length) toast.success(`Zugeordnet (${source}): ${found.join(", ")}. Bitte kurz prüfen.`);
    else toast.warning("Keine passenden Angaben erkannt – bitte manuell ergänzen.");
  }, [settings.catalog]);

  const validate = () => {
    if (!inv.customer.name.trim()) { toast.error("Bitte Auftraggeber/Kunde eintragen."); return false; }
    if (t.total <= 0) { toast.error("Bitte mindestens eine Leistung mit Preis eintragen."); return false; }
    return true;
  };

  const save = (print = false) => {
    if (!validate()) return;
    let saved: Invoice;
    if (isNew) {
      saved = { ...inv, number: nextInvoiceNumber(invoices, settings.startNumber), createdAt: new Date().toISOString() };
      saveInvoice(saved);
      toast.success(`Rechnung Nr. ${formatInvoiceNumber(saved.number, settings.numberPadding)} gespeichert`);
    } else if (dateChanged && original) {
      // Neues Datum = neue Rechnungsnummer; alte Rechnung bleibt als storniert erhalten
      const number = nextInvoiceNumber(invoices, settings.startNumber);
      saved = { ...inv, id: uid(), number, replaces: original.number, createdAt: new Date().toISOString(), cancelled: false };
      setData((d) => ({
        ...d,
        invoices: [
          ...d.invoices.map((i) => (i.id === original.id ? { ...i, cancelled: true, payments: [], cancelledReason: `Neues Datum – ersetzt durch Nr. ${formatInvoiceNumber(number, settings.numberPadding)}`, replacedBy: number } : i)),
          saved,
        ],
      }));
      toast.success(`Neues Datum → neue Rechnung Nr. ${formatInvoiceNumber(number, settings.numberPadding)}. Nr. ${formatInvoiceNumber(original.number, settings.numberPadding)} wurde storniert.`);
    } else {
      saved = inv;
      saveInvoice(saved);
      toast.success("Änderungen gespeichert");
    }
    if (print) window.open(`/buchhaltung/druck/${saved.id}`, "_blank");
    navigate(`/buchhaltung/rechnung/${saved.id}`, { replace: true });
  };

  // ------------------------------------------------ Zahlungen
  const [payment, setPayment] = useState<{ date: string; amount: string; method: PaymentMethod; note: string }>({ date: todayISO(), amount: "", method: "Überweisung", note: "" });
  const addPayment = () => {
    // Leeres Feld = Restbetrag buchen; deutsche Schreibweise (1.000,50) wird erkannt
    const amount = round2(payment.amount.trim() ? parseAmount(payment.amount) : Math.max(0, t.open));
    if (!amount) return toast.error("Betrag eingeben.");
    const p: Payment = { id: uid(), date: payment.date, amount, method: payment.method, note: payment.note || undefined };
    const next = { ...inv, payments: [...inv.payments, p] };
    setInv(next);
    if (original) saveInvoice({ ...original, payments: next.payments });
    setPayment({ date: todayISO(), amount: "", method: "Überweisung", note: "" });
    toast.success(`Zahlung ${formatEUR(amount)} erfasst`);
  };
  const removePayment = (pid: string) => {
    const next = { ...inv, payments: inv.payments.filter((p) => p.id !== pid) };
    setInv(next);
    if (original) saveInvoice({ ...original, payments: next.payments });
  };

  const cancel = () => {
    if (!original) return;
    const reason = window.prompt("Grund der Stornierung:", "Storniert");
    if (reason === null) return;
    const cancelled = { ...original, cancelled: true, cancelledReason: reason };
    saveInvoice(cancelled);
    setInv(structuredClone(cancelled));
    toast.success("Rechnung storniert (Nummer bleibt erhalten).");
  };
  const isLatest = original && original.number === Math.max(...invoices.map((i) => i.number));
  const remove = () => {
    if (!original) return;
    if (!window.confirm(`Rechnung Nr. ${formatInvoiceNumber(original.number, settings.numberPadding)} endgültig löschen? (Nur möglich bei der letzten Nummer, damit keine Lücke entsteht.)`)) return;
    deleteInvoice(original.id);
    navigate("/buchhaltung/rechnungen");
  };

  // ------------------------------------------------ Eigene Kosten (Gewinn pro Auftrag)
  const profit = calcProfit(inv);
  const [expense, setExpense] = useState({ label: "", amount: "" });
  const persistExpenses = (expenses: Expense[]) => {
    setInv((p) => ({ ...p, expenses }));
    if (original) saveInvoice({ ...original, expenses });
  };
  const addExpense = () => {
    const amount = round2(parseAmount(expense.amount));
    if (!expense.label.trim() || !amount) return toast.error("Bezeichnung und Betrag eingeben.");
    persistExpenses([...(inv.expenses || []), { id: uid(), date: todayISO(), label: expense.label.trim(), amount }]);
    setExpense({ label: "", amount: "" });
  };

  // ------------------------------------------------ Versand & Mahnung
  const sendWhatsApp = (kind: "rechnung" | "erinnerung") => {
    const nr = whatsappNumber(inv.customer.phone);
    const text = encodeURIComponent(shareText(inv, settings, kind));
    window.open(nr ? `https://wa.me/${nr}?text=${text}` : `https://wa.me/?text=${text}`, "_blank", "noopener");
    if (kind === "rechnung") toast.info("Tipp: PDF über „Drucken / PDF“ speichern und im Chat anhängen.");
  };
  const sendMail = () => {
    const subject = encodeURIComponent(`Rechnung Nr. ${formatInvoiceNumber(inv.number, settings.numberPadding)} – ${settings.name}`);
    window.location.href = `mailto:${inv.customer.email || ""}?subject=${subject}&body=${encodeURIComponent(shareText(inv, settings))}`;
  };
  const reminderLevel = nextReminderLevel(inv);
  const createReminder = () => {
    if (!original) return;
    const reminders = [...(original.reminders || []), { date: todayISO(), level: reminderLevel }];
    saveInvoice({ ...original, reminders });
    setInv((p) => ({ ...p, reminders }));
    window.open(`/buchhaltung/mahnung/${original.id}?stufe=${reminderLevel}`, "_blank");
  };

  const status = original ? invoiceStatus(original) : null;

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <p className="text-sm text-stone-500">{isNew ? "Neue Rechnung" : "Rechnung bearbeiten"}</p>
          <h1 className="flex items-center gap-3 font-serif text-3xl">Rechnung Nr. {formatInvoiceNumber(shownNumber, settings.numberPadding)} {status && <StatusBadge status={status} />}</h1>
          {original?.cancelled && <p className="mt-1 text-sm text-red-700">{original.cancelledReason}</p>}
          {original?.replaces && <p className="mt-1 text-sm text-stone-500">Ersetzt Rechnung Nr. {formatInvoiceNumber(original.replaces, settings.numberPadding)}</p>}
          {(inv.reminders || []).length > 0 && <p className="mt-1 text-sm text-red-700">{(inv.reminders || []).map((r) => `${REMINDER_TITLES[r.level]} am ${formatDateDE(r.date)}`).join(" · ")} {t.open > 0.004 && <button className="underline" onClick={() => sendWhatsApp("erinnerung")}>Erinnerung per WhatsApp</button>}</p>}
        </div>
        {original && <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.open(`/buchhaltung/druck/${original.id}`, "_blank")}><Printer className="h-4 w-4" />Drucken / PDF</Button>
          <Button variant="outline" className="gap-2" onClick={() => sendWhatsApp("rechnung")}><MessageCircle className="h-4 w-4" />WhatsApp</Button>
          <Button variant="outline" className="gap-2" onClick={sendMail}><Mail className="h-4 w-4" />E-Mail</Button>
          {!original.cancelled && t.open > 0.004 && <Button variant="outline" className="gap-2 text-red-700" onClick={createReminder}><BellRing className="h-4 w-4" />{REMINDER_TITLES[reminderLevel]}</Button>}
        </div>}
      </div>

      {dateChanged && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Neues Datum ({formatDateDE(inv.date)}) → beim Speichern wird automatisch eine <b>neue Rechnungsnummer {formatInvoiceNumber(shownNumber, settings.numberPadding)}</b> vergeben. Die bisherige Nr. {formatInvoiceNumber(original!.number, settings.numberPadding)} wird storniert, Zahlungen werden übernommen.
        </div>
      )}

      {isNew && <ScreenshotImport catalog={settings.catalog} apiKey={settings.claudeApiKey} onExtracted={onExtracted} />}
      {lastSource && <p className="text-xs text-stone-500">Zuletzt automatisch ausgefüllt per {lastSource}. Gelb markierte Positionen haben einen Preis.</p>}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-lg">Auftrag</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Auftraggeber / Kunde *"><Input value={inv.customer.name} onChange={(e) => setCustomer({ name: e.target.value })} placeholder="Vor- und Nachname" /></Field>
            <Field label="Verstorbene/r"><Input value={inv.deceased} onChange={(e) => set({ deceased: e.target.value })} placeholder="Vor- und Nachname" /></Field>
            <Field label="Straße & Nr."><Input value={inv.customer.street} onChange={(e) => setCustomer({ street: e.target.value })} /></Field>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <Field label="PLZ"><Input value={inv.customer.zip} onChange={(e) => setCustomer({ zip: e.target.value })} inputMode="numeric" /></Field>
              <Field label="Ort"><Input value={inv.customer.city} onChange={(e) => setCustomer({ city: e.target.value })} /></Field>
            </div>
            <Field label="Telefon"><Input value={inv.customer.phone || ""} onChange={(e) => setCustomer({ phone: e.target.value })} /></Field>
            <Field label="E-Mail"><Input value={inv.customer.email || ""} onChange={(e) => setCustomer({ email: e.target.value })} /></Field>
            <Field label="Art">
              <div className="flex gap-1">
                {KINDS.map((k) => <button key={k} type="button" onClick={() => set({ kind: k })} className={`flex-1 rounded-md border px-2 py-2 text-sm ${inv.kind === k ? "border-stone-900 bg-stone-900 text-white" : "bg-white hover:bg-stone-50"}`}>{k}</button>)}
              </div>
            </Field>
            <Field label="Zielland (Überführung)">
              <Input list="countries" value={inv.destination || ""} onChange={(e) => set({ destination: e.target.value })} placeholder="z. B. Türkei, Irak, Syrien" />
              <datalist id="countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Rechnung</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Rechnungsdatum"><Input type="date" value={inv.date} onChange={(e) => set({ date: e.target.value || todayISO() })} /></Field>
            <Field label="Leistungsdatum"><Input type="date" value={inv.serviceDate} onChange={(e) => set({ serviceDate: e.target.value })} /></Field>
            <Field label={`Zahlungsziel (fällig ${formatDateDE(addDays(inv.date, inv.dueDays))})`}>
              <Input type="number" min="0" value={inv.dueDays} onChange={(e) => set({ dueDays: parseInt(e.target.value) || 0 })} />
            </Field>
            <Field label="USt-Satz %"><Input type="number" min="0" value={inv.vatRate} onChange={(e) => set({ vatRate: parseFloat(e.target.value) || 0 })} /></Field>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PositionsTable title="Leistungen Inland" positions={inv.inland} onChange={(inland) => set({ inland })} showTaxFree />
        <div className="space-y-5">
          <PositionsTable title="Leistungen Ausland (Überführung)" positions={inv.abroad} onChange={(abroad) => set({ abroad })} showTaxFree={false} />
          <label className="flex items-center gap-2 px-1 text-sm text-stone-600">
            <input type="checkbox" checked={!!inv.abroadTaxable} onChange={(e) => set({ abroadTaxable: e.target.checked })} />
            Auslandsleistungen mit USt berechnen (Standard: steuerfrei, grenzüberschreitende Beförderung)
          </label>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Summen</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rabatt Inland €"><Input type="number" min="0" step="0.01" value={inv.discountInland || ""} onChange={(e) => set({ discountInland: round2(parseFloat(e.target.value) || 0) })} /></Field>
              <Field label="Rabatt Ausland €"><Input type="number" min="0" step="0.01" value={inv.discountAbroad || ""} onChange={(e) => set({ discountAbroad: round2(parseFloat(e.target.value) || 0) })} /></Field>
            </div>
            <div className="mt-3 space-y-1 border-t pt-3 tabular-nums">
              <div className="flex justify-between"><span>Inland netto</span><span>{formatEUR(t.inlandNet)}</span></div>
              {t.taxFreeNet > 0 && <div className="flex justify-between text-stone-500"><span>davon steuerfrei</span><span>{formatEUR(t.taxFreeNet)}</span></div>}
              <div className="flex justify-between"><span>USt {inv.vatRate} %</span><span>{formatEUR(t.vat)}</span></div>
              <div className="flex justify-between font-medium"><span>Inland brutto</span><span>{formatEUR(t.inlandGross)}</span></div>
              {t.abroadGross > 0 && <div className="flex justify-between"><span>Ausland {inv.abroadTaxable ? "brutto" : "(steuerfrei)"}</span><span>{formatEUR(t.abroadGross)}</span></div>}
              <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Gesamt</span><span>{formatEUR(t.total)}</span></div>
              {!isNew && <>
                <div className="flex justify-between text-emerald-700"><span>Bezahlt</span><span>{formatEUR(t.paid)}</span></div>
                <div className={`flex justify-between font-semibold ${t.open > 0.004 ? "text-red-700" : t.open < -0.004 ? "text-violet-700" : "text-emerald-700"}`}><span>Differenz (offen)</span><span>{formatEUR(t.open)}</span></div>
              </>}
            </div>
            <Field label="Notiz (intern, nicht auf der Rechnung)" className="pt-2"><Textarea rows={2} value={inv.notes || ""} onChange={(e) => set({ notes: e.target.value })} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Zahlungseingänge</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isNew ? <p className="text-stone-500">Zahlungen können nach dem Speichern erfasst werden.</p> : <>
              {inv.payments.length === 0 && <p className="text-stone-500">Noch nichts eingegangen.</p>}
              {inv.payments.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2">
                  <span className="w-24">{formatDateDE(p.date)}</span>
                  <span className="flex-1 truncate">{p.method}{p.note ? ` · ${p.note}` : ""}</span>
                  <span className="font-semibold tabular-nums text-emerald-700">{formatEUR(p.amount)}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removePayment(p.id)} title="Zahlung löschen"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              {!inv.cancelled && (
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-4">
                  <Input type="date" value={payment.date} onChange={(e) => setPayment({ ...payment, date: e.target.value })} />
                  <Input inputMode="decimal" placeholder={t.open > 0 ? `Rest ${formatEUR(t.open)}` : "Betrag"} value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
                  <select className="h-10 rounded-md border bg-white px-2" value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value as PaymentMethod })}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select>
                  <Button onClick={addPayment} className="gap-1"><Plus className="h-4 w-4" />Zahlung</Button>
                  <Input className="col-span-2 sm:col-span-4" placeholder="Notiz (optional), z. B. Anzahlung, Versicherung …" value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} />
                </div>
              )}
            </>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Eigene Kosten & Gewinn (intern)</CardTitle></CardHeader>
        <CardContent className="grid gap-4 text-sm lg:grid-cols-2">
          <div className="space-y-2">
            {(inv.expenses || []).length === 0 && <p className="text-stone-500">Hier Ihre Ausgaben für diesen Auftrag eintragen (z. B. Luftfracht, Sarg-Einkauf, Friedhof, Flughafen, Partner im Ausland). Erscheint nicht auf der Rechnung.</p>}
            {(inv.expenses || []).map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-md bg-stone-100 px-3 py-2">
                <span className="flex-1 truncate">{e.label}</span>
                <span className="tabular-nums">{formatEUR(e.amount)}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => persistExpenses((inv.expenses || []).filter((x) => x.id !== e.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="z. B. Luftfracht Turkish Cargo" value={expense.label} onChange={(e) => setExpense({ ...expense, label: e.target.value })} />
              <Input className="w-28" inputMode="decimal" placeholder="Betrag" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addExpense()} />
              <Button onClick={addExpense}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="space-y-1 rounded-lg border p-4 tabular-nums">
            <div className="flex justify-between"><span>Erlös netto (ohne USt)</span><span>{formatEUR(profit.revenueNet)}</span></div>
            <div className="flex justify-between"><span>Eigene Kosten</span><span>- {formatEUR(profit.expenses)}</span></div>
            <div className={`flex justify-between border-t pt-2 text-lg font-bold ${profit.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}><span>Gewinn</span><span>{formatEUR(profit.profit)}</span></div>
            <p className="text-xs text-stone-500">Marge {profit.margin.toLocaleString("de-DE")} %</p>
          </div>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-auto text-sm">Gesamt <b className="text-lg tabular-nums">{formatEUR(t.total)}</b></span>
          {original && !original.cancelled && <Button variant="ghost" className="gap-1 text-red-700" onClick={cancel}><Ban className="h-4 w-4" />Stornieren</Button>}
          {original && isLatest && <Button variant="ghost" className="gap-1 text-red-700" onClick={remove}><Trash2 className="h-4 w-4" />Löschen</Button>}
          {!original?.cancelled && <>
            <Button variant="outline" className="gap-2" onClick={() => save(true)}><Printer className="h-4 w-4" />Speichern & Drucken</Button>
            <Button className="gap-2" onClick={() => save(false)}><Save className="h-4 w-4" />Speichern</Button>
          </>}
        </div>
      </div>
    </div>
  );
}
