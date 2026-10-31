import { useMemo, useRef, useState } from "react";
import { CheckCircle2, FileUp, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankTransaction, calcTotals, formatDateDE, formatEUR, formatInvoiceNumber, matchTransaction, parseBankCSV, uid } from "@/accounting/core";
import { markBankHandled, setData, useAccounting } from "@/accounting/store";

export function BankImport() {
  const { invoices, settings, handledBankRefs } = useAccounting();
  const [txs, setTxs] = useState<BankTransaction[]>([]);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const input = useRef<HTMLInputElement>(null);

  const handled = useMemo(() => new Set(handledBankRefs), [handledBankRefs]);
  const pending = useMemo(() => txs.filter((tx) => tx.amount > 0 && !handled.has(tx.ref)), [txs, handled]);
  const suggestions = useMemo(() => Object.fromEntries(pending.map((tx) => [tx.ref, matchTransaction(tx, invoices, settings.numberPadding)])), [pending, invoices, settings.numberPadding]);
  const selectable = useMemo(() => invoices.filter((i) => !i.cancelled).sort((a, b) => b.number - a.number), [invoices]);

  const onFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    // Banken liefern CSV oft in Windows-1252 statt UTF-8
    let text = new TextDecoder("utf-8").decode(buf);
    if (text.includes("�")) text = new TextDecoder("windows-1252").decode(buf);
    const parsed = parseBankCSV(text);
    if (!parsed.length) return toast.error("Keine Buchungen erkannt. Bitte CSV-Export (nicht PDF) aus dem Online-Banking verwenden.");
    setTxs(parsed);
    setChoice({});
    const incoming = parsed.filter((t) => t.amount > 0).length;
    toast.success(`${parsed.length} Buchungen gelesen, davon ${incoming} Eingänge.`);
  };

  const assign = (tx: BankTransaction, invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    setData((d) => ({
      ...d,
      handledBankRefs: [...new Set([...d.handledBankRefs, tx.ref])],
      invoices: d.invoices.map((i) => (i.id === invoiceId ? { ...i, payments: [...i.payments, { id: uid(), date: tx.date, amount: tx.amount, method: "Überweisung", note: `${tx.name} – ${tx.purpose}`.slice(0, 160), bankRef: tx.ref }] } : i)),
    }));
    const open = calcTotals(inv).open - tx.amount;
    toast.success(`${formatEUR(tx.amount)} → Rechnung Nr. ${formatInvoiceNumber(inv.number, settings.numberPadding)}${Math.abs(open) > 0.004 ? ` (Differenz jetzt ${formatEUR(open)})` : " – vollständig bezahlt"}`);
  };

  const assignAll = () => {
    let n = 0;
    for (const tx of pending) {
      const id = choice[tx.ref] ?? suggestions[tx.ref]?.invoiceId;
      if (id && (suggestions[tx.ref]?.score ?? 0) >= 60) { assign(tx, id); n++; }
    }
    if (!n) toast.info("Keine sicheren Vorschläge – bitte einzeln zuordnen.");
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle className="text-lg">Kontoauszug importieren – sehen, was angekommen ist</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-stone-600">
          <p>Laden Sie im Online-Banking (Märkische Bank / Volksbank, Sparkasse …) die Umsätze als <b>CSV</b> herunter und wählen Sie die Datei hier aus. Die App erkennt Eingänge und ordnet sie anhand von Rechnungsnummer, Name und Betrag der passenden Rechnung zu. Die Datei bleibt auf Ihrem Gerät.</p>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" onClick={() => input.current?.click()}><FileUp className="h-4 w-4" />CSV-Datei wählen</Button>
            {pending.length > 0 && <Button variant="outline" onClick={assignAll}>Alle sicheren Vorschläge übernehmen</Button>}
          </div>
          <input ref={input} type="file" accept=".csv,text/csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
          <p className="flex items-start gap-2 rounded-md bg-sky-50 p-3 text-sky-900"><Info className="mt-0.5 h-4 w-4 shrink-0" />Tipp: Bitten Sie Kunden, die Rechnungs-Nr. im Verwendungszweck anzugeben – dann ist die Zuordnung eindeutig. Bar- oder EC-Zahlungen tragen Sie direkt in der Rechnung ein.</p>
        </CardContent>
      </Card>

      {txs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Offene Zahlungseingänge ({pending.length})</CardTitle></CardHeader>
          <CardContent className="divide-y p-0">
            {pending.length === 0 && <p className="flex items-center gap-2 p-5 text-emerald-700"><CheckCircle2 className="h-5 w-5" />Alle Eingänge dieser Datei sind zugeordnet oder geprüft.</p>}
            {pending.map((tx) => {
              const sug = suggestions[tx.ref];
              const selected = choice[tx.ref] ?? sug?.invoiceId ?? "";
              return (
                <div key={tx.ref} className="grid gap-3 p-4 md:grid-cols-[110px_1fr_320px] md:items-center">
                  <div>
                    <p className="font-semibold text-emerald-700 tabular-nums">+{formatEUR(tx.amount)}</p>
                    <p className="text-xs text-stone-500">{formatDateDE(tx.date)}</p>
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{tx.name || "–"}</p>
                    <p className="truncate text-stone-500">{tx.purpose}</p>
                    {sug && <p className="mt-1 text-xs text-amber-700">Vorschlag ({sug.score >= 60 ? "sicher" : "prüfen"}): {sug.reasons.join(" · ")}</p>}
                  </div>
                  <div className="flex gap-2">
                    <select className="h-10 min-w-0 flex-1 rounded-md border bg-white px-2 text-sm" value={selected} onChange={(e) => setChoice({ ...choice, [tx.ref]: e.target.value })}>
                      <option value="">– Rechnung wählen –</option>
                      {selectable.map((i) => {
                        const t = calcTotals(i);
                        return <option key={i.id} value={i.id}>Nr. {formatInvoiceNumber(i.number, settings.numberPadding)} · {i.customer.name} · offen {formatEUR(t.open)}</option>;
                      })}
                    </select>
                    <Button disabled={!selected} onClick={() => assign(tx, selected)}>Buchen</Button>
                    <Button variant="ghost" title="Kein Rechnungseingang (z. B. Erstattung)" onClick={() => markBankHandled([tx.ref])}>Ignorieren</Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
