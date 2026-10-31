import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowDownToLine, FileText, History, PiggyBank, Scale } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcTotals, formatDateDE, formatEUR, formatInvoiceNumber, invoiceStatus, monthlySeries, summarize } from "@/accounting/core";
import { importLegacy, useAccounting } from "@/accounting/store";
import { StatusBadge } from "./AccountingLayout";

function Kpi({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint?: string; icon: typeof FileText; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <div className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="text-xs text-stone-500">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { invoices, settings } = useAccounting();
  const year = new Date().getFullYear().toString();
  const s = useMemo(() => summarize(invoices), [invoices]);
  const sYear = useMemo(() => summarize(invoices.filter((i) => i.date.startsWith(year))), [invoices, year]);
  const series = useMemo(() => monthlySeries(invoices, 12), [invoices]);
  const openList = useMemo(
    () => invoices.filter((i) => !i.cancelled && calcTotals(i).open > 0.004).sort((a, b) => a.date.localeCompare(b.date)),
    [invoices],
  );
  const recentPayments = useMemo(
    () => invoices.flatMap((i) => i.payments.map((p) => ({ ...p, inv: i }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [invoices],
  );

  if (!invoices.length) {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <CardContent className="space-y-4 p-10">
          <h1 className="font-serif text-3xl">Willkommen in Ihrer Buchhaltung</h1>
          <p className="text-stone-600">Erstellen Sie Ihre erste Rechnung. Ein Screenshot (z. B. WhatsApp) genügt – die App ordnet Kunde, Verstorbene/n, Zielland und Leistungen automatisch zu. Jede neue Rechnung bekommt automatisch die nächste Nummer (Start: {formatInvoiceNumber(settings.startNumber, settings.numberPadding)}).</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/buchhaltung/neu" className="inline-flex rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white">Erste Rechnung erstellen</Link>
            <button onClick={() => { const n = importLegacy(); toast.success(`${n} bisherige Rechnung(en) übernommen`); }} className="inline-flex items-center gap-2 rounded-lg border bg-white px-5 py-3 font-semibold"><History className="h-4 w-4" />Bisherige Rechnungen 032 & 44 übernehmen</button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label={`Berechnet ${year}`} value={formatEUR(sYear.invoiced)} hint={`${sYear.count} Rechnungen · USt ${formatEUR(sYear.vat)}`} icon={FileText} tone="bg-stone-100 text-stone-700" />
        <Kpi label={`Eingegangen ${year}`} value={formatEUR(sYear.received)} hint="Zahlungen auf diese Rechnungen" icon={ArrowDownToLine} tone="bg-emerald-100 text-emerald-700" />
        <Kpi label="Offene Differenz (gesamt)" value={formatEUR(s.open)} hint={s.overpaid > 0 ? `Überzahlt: ${formatEUR(s.overpaid)}` : "noch nicht bezahlt"} icon={Scale} tone="bg-amber-100 text-amber-700" />
        <Kpi label={`Gewinn ${year}`} value={formatEUR(sYear.profit)} hint={sYear.expenses > 0 ? `nach eigenen Kosten ${formatEUR(sYear.expenses)}` : "Kosten je Auftrag eintragen"} icon={PiggyBank} tone="bg-sky-100 text-sky-700" />
        <Kpi label="Überfällig" value={formatEUR(s.overdue)} hint={`${s.overdueCount} Rechnung(en) über Zahlungsziel`} icon={AlertTriangle} tone="bg-red-100 text-red-700" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Berechnet vs. eingegangen (12 Monate)</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => formatEUR(v)} />
              <Legend />
              <Bar dataKey="berechnet" name="Berechnet" fill="#8a6a4f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="eingegangen" name="Eingegangen" fill="#2f855a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Offene Rechnungen ({openList.length})</CardTitle></CardHeader>
          <CardContent className="divide-y p-0">
            {openList.length === 0 && <p className="p-5 text-sm text-stone-500">Alles bezahlt. 👍</p>}
            {openList.slice(0, 10).map((inv) => {
              const t = calcTotals(inv);
              return (
                <Link key={inv.id} to={`/buchhaltung/rechnung/${inv.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50">
                  <span className="w-12 font-mono text-sm text-stone-500">{formatInvoiceNumber(inv.number, settings.numberPadding)}</span>
                  <span className="min-w-0 flex-1 truncate"><b>{inv.customer.name || "–"}</b><span className="text-stone-500"> · {inv.deceased}</span></span>
                  <StatusBadge status={invoiceStatus(inv)} />
                  <span className="w-28 text-right font-semibold tabular-nums">{formatEUR(t.open)}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Letzte Zahlungseingänge</CardTitle></CardHeader>
          <CardContent className="divide-y p-0">
            {recentPayments.length === 0 && <p className="p-5 text-sm text-stone-500">Noch keine Zahlungen erfasst. Tragen Sie Zahlungen in der Rechnung ein oder importieren Sie Ihren Kontoauszug unter „Zahlungseingänge“.</p>}
            {recentPayments.map((p) => (
              <Link key={p.id} to={`/buchhaltung/rechnung/${p.inv.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50">
                <span className="w-24 text-sm text-stone-500">{formatDateDE(p.date)}</span>
                <span className="min-w-0 flex-1 truncate">Nr. {formatInvoiceNumber(p.inv.number, settings.numberPadding)} · {p.inv.customer.name} <span className="text-stone-500">({p.method})</span></span>
                <span className="font-semibold text-emerald-700 tabular-nums">+{formatEUR(p.amount)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
