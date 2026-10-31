import { ReactNode, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FilePlus2, FileText, Landmark, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceStatus, missingCompanyFields } from "@/accounting/core";
import { useAccounting } from "@/accounting/store";

const links = [
  { to: "/buchhaltung", label: "Übersicht", icon: LayoutDashboard, end: true },
  { to: "/buchhaltung/rechnungen", label: "Rechnungen", icon: FileText },
  { to: "/buchhaltung/bank", label: "Zahlungseingänge", icon: Landmark },
  { to: "/buchhaltung/einstellungen", label: "Einstellungen", icon: Settings },
];

export function AccountingLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { settings } = useAccounting();
  const missing = missingCompanyFields(settings);
  useEffect(() => {
    // Interner Bereich: nicht in Suchmaschinen
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = "Buchhaltung | Mezopotamya";
    return () => { meta.remove(); document.title = prevTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-auto">
            <p className="font-serif text-lg font-semibold leading-tight">Mezopotamya Buchhaltung</p>
            <p className="text-xs text-stone-500">{settings.name} · Rechnungen & Zahlungen</p>
          </div>
          <Button onClick={() => navigate("/buchhaltung/neu")} className="gap-2"><FilePlus2 className="h-4 w-4" />Neue Rechnung</Button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
              <Icon className="h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {missing.length > 0 && (
          <button onClick={() => navigate("/buchhaltung/einstellungen")} className="mb-5 w-full rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-900 print:hidden">
            <b>{settings.name}:</b> Für gültige Rechnungen fehlen noch: {missing.join(", ")}. Hier tippen und in den Einstellungen eintragen, sobald die Daten vorliegen.
          </button>
        )}
        {children}
      </main>
    </div>
  );
}

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  bezahlt: "bg-emerald-100 text-emerald-800",
  teilbezahlt: "bg-amber-100 text-amber-800",
  offen: "bg-sky-100 text-sky-800",
  überfällig: "bg-red-100 text-red-800",
  überzahlt: "bg-violet-100 text-violet-800",
  storniert: "bg-stone-200 text-stone-600 line-through",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[status]}`}>{status}</span>;
}
