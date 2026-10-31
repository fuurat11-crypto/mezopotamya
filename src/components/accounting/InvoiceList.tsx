import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Download, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceStatus, calcTotals, formatDateDE, formatEUR, formatInvoiceNumber, invoiceStatus, invoicesToCSV, nextInvoiceNumber, todayISO, uid } from "@/accounting/core";
import { download, saveInvoice, useAccounting } from "@/accounting/store";
import { StatusBadge } from "./AccountingLayout";

const FILTERS: (InvoiceStatus | "alle" | "nicht bezahlt")[] = ["alle", "nicht bezahlt", "offen", "teilbezahlt", "überfällig", "bezahlt", "überzahlt", "storniert"];

export function InvoiceList() {
  const { invoices, settings } = useAccounting();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("alle");
  const [year, setYear] = useState("alle");

  const years = useMemo(() => [...new Set(invoices.map((i) => i.date.slice(0, 4)))].sort().reverse(), [invoices]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return invoices
      .map((inv) => ({ inv, t: calcTotals(inv), status: invoiceStatus(inv) }))
      .filter(({ inv, status }) => {
        if (year !== "alle" && !inv.date.startsWith(year)) return false;
        if (filter === "nicht bezahlt" && !["offen", "teilbezahlt", "überfällig"].includes(status)) return false;
        if (filter !== "alle" && filter !== "nicht bezahlt" && status !== filter) return false;
        if (!needle) return true;
        return [String(inv.number), formatInvoiceNumber(inv.number, settings.numberPadding), inv.customer.name, inv.deceased, inv.destination, inv.customer.city].some((v) => (v || "").toLowerCase().includes(needle));
      })
      .sort((a, b) => b.inv.number - a.inv.number);
  }, [invoices, q, filter, year, settings.numberPadding]);

  const totals = rows.reduce((s, r) => (r.inv.cancelled ? s : { total: s.total + r.t.total, paid: s.paid + r.t.paid, open: s.open + r.t.open }), { total: 0, paid: 0, open: 0 });

  const duplicate = (id: string) => {
    const src = invoices.find((i) => i.id === id);
    if (!src) return;
    const today = todayISO();
    const copy = { ...structuredClone(src), id: uid(), number: nextInvoiceNumber(invoices, settings.startNumber), date: today, serviceDate: today, payments: [], expenses: [], reminders: [], cancelled: false, cancelledReason: undefined, replacedBy: undefined, replaces: undefined, createdAt: new Date().toISOString() };
    saveInvoice(copy);
    toast.success(`Kopie als Rechnung Nr. ${formatInvoiceNumber(copy.number, settings.numberPadding)} angelegt`);
    navigate(`/buchhaltung/rechnung/${copy.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input className="pl-9" placeholder="Suchen: Nummer, Kunde, Verstorbene/r, Land…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border bg-white px-3 text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="alle">Alle Jahre</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <Button variant="outline" className="gap-2" onClick={() => download(`rechnungen-${todayISO()}.csv`, invoicesToCSV(invoices, settings.numberPadding), "text/csv;charset=utf-8")}><Download className="h-4 w-4" />CSV für Steuerberater</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-sm capitalize ${filter === f ? "border-stone-900 bg-stone-900 text-white" : "bg-white text-stone-600 hover:bg-stone-100"}`}>{f}</button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr.</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Kunde / Verstorbene/r</TableHead>
                <TableHead className="hidden md:table-cell">Art</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Bezahlt</TableHead>
                <TableHead className="text-right">Differenz</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-stone-500">Keine Rechnungen gefunden. <Link className="underline" to="/buchhaltung/neu">Neue Rechnung erstellen</Link></TableCell></TableRow>}
              {rows.map(({ inv, t, status }) => (
                <TableRow key={inv.id} className="cursor-pointer" onClick={() => navigate(`/buchhaltung/rechnung/${inv.id}`)}>
                  <TableCell className="font-mono">{formatInvoiceNumber(inv.number, settings.numberPadding)}</TableCell>
                  <TableCell>{formatDateDE(inv.date)}</TableCell>
                  <TableCell><div className="font-medium">{inv.customer.name || "–"}</div><div className="text-xs text-stone-500">{inv.deceased}{inv.destination ? ` · ${inv.destination}` : ""}</div></TableCell>
                  <TableCell className="hidden md:table-cell">{inv.kind}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatEUR(t.total)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatEUR(t.paid)}</TableCell>
                  <TableCell className={`text-right font-semibold tabular-nums ${t.open > 0.004 && !inv.cancelled ? "text-red-700" : t.open < -0.004 ? "text-violet-700" : "text-emerald-700"}`}>{inv.cancelled ? "–" : formatEUR(t.open)}</TableCell>
                  <TableCell><StatusBadge status={status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="whitespace-nowrap">
                    <Button size="icon" variant="ghost" title="Drucken / PDF" onClick={() => window.open(`/buchhaltung/druck/${inv.id}`, "_blank")}><Printer className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" title="Als neue Rechnung kopieren" onClick={() => duplicate(inv.id)}><Copy className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-right text-sm text-stone-600">Summe Auswahl: <b>{formatEUR(totals.total)}</b> · bezahlt <b>{formatEUR(totals.paid)}</b> · Differenz <b className="text-red-700">{formatEUR(totals.open)}</b></p>
    </div>
  );
}
