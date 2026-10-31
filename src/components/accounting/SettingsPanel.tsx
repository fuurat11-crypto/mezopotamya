import { useRef, useState } from "react";
import { Download, History, KeyRound, Lock, Plus, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY_PRESETS, CatalogItem, CompanySettings, DEFAULT_CATALOG, formatInvoiceNumber, nextInvoiceNumber, todayISO } from "@/accounting/core";
import { download, exportBackup, hashPin, importBackup, importLegacy, saveSettings, useAccounting } from "@/accounting/store";

type TextKey = { [K in keyof CompanySettings]: CompanySettings[K] extends string ? K : never }[keyof CompanySettings];

const COMPANY_FIELDS: [TextKey, string][] = [
  ["name", "Firma"], ["brand", "Marke / Zusatz"], ["street", "Straße"], ["zip", "PLZ"], ["city", "Ort"],
  ["mobile", "Mobil"], ["phone", "Telefon"], ["fax", "Fax"], ["email", "E-Mail"],
  ["bankName", "Bank"], ["iban", "IBAN"], ["bic", "BIC"], ["taxNumber", "Steuernummer"], ["vatId", "USt-IdNr."],
  ["managingDirector", "Geschäftsführer/in"], ["registerCourt", "Registergericht"], ["registerNumber", "HRB-Nummer"],
];

export function SettingsPanel() {
  const { settings, invoices } = useAccounting();
  const [s, setS] = useState<CompanySettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [newPin, setNewPin] = useState("");
  const setPin = async () => {
    if (!/^\d{4,8}$/.test(newPin)) return toast.error("PIN: 4 bis 8 Ziffern.");
    const pinHash = await hashPin(newPin);
    setS({ ...s, pinHash });
    saveSettings({ ...settings, pinHash });
    try { sessionStorage.setItem("mezopotamya-buchhaltung-unlocked", pinHash); } catch { /* ignorieren */ }
    setNewPin("");
    toast.success("PIN gesetzt. Beim nächsten Öffnen wird sie abgefragt.");
  };
  const removePin = () => { setS({ ...s, pinHash: "" }); saveSettings({ ...settings, pinHash: "" }); toast.success("PIN-Sperre entfernt."); };
  const file = useRef<HTMLInputElement>(null);
  const next = nextInvoiceNumber(invoices, s.startNumber);

  const updateItem = (id: string, patch: Partial<CatalogItem>) => setS({ ...s, catalog: s.catalog.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  const save = () => {
    saveSettings({ ...s, claudeApiKey: s.claudeApiKey.trim() });
    toast.success("Einstellungen gespeichert");
  };

  return (
    <div className="space-y-5 pb-20">
      <Card>
        <CardHeader><CardTitle className="text-lg">Firmendaten (erscheinen auf jeder Rechnung)</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            {COMPANY_PRESETS.map((p) => (
              <button key={p.id} type="button" title={p.hint} onClick={() => { setS({ ...s, ...p.values }); toast.info(`${p.title} eingesetzt – bitte prüfen und speichern.`); }} className={`rounded-lg border px-3 py-2 text-left text-sm ${s.name === p.values.name ? "border-stone-900 bg-stone-900 text-white" : "bg-white hover:bg-stone-50"}`}>
                <span className="block font-semibold">{p.title}</span><span className="block text-xs opacity-75">{p.hint}</span>
              </button>
            ))}
          </div>
          {COMPANY_FIELDS.map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-stone-500">{label}</Label>
              <Input value={s[key]} onChange={(e) => setS({ ...s, [key]: e.target.value })} />
            </div>
          ))}
          <p className="text-xs text-stone-500 sm:col-span-2 lg:col-span-3">Sobald die Alpiroz GmbH eingetragen ist und ein eigenes Konto hat: oben auf „Alpiroz GmbH i. G.“ tippen, fehlende Felder (Anschrift, IBAN, Steuernummer, HRB) ausfüllen, „i. G.“ im Namen entfernen und speichern. Bereits geschriebene Rechnungen bleiben unverändert.</p>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Rechnungsnummern & Steuer</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs text-stone-500">Startnummer</Label><Input type="number" min="1" value={s.startNumber} onChange={(e) => setS({ ...s, startNumber: parseInt(e.target.value) || 1 })} /></div>
            <div className="space-y-1"><Label className="text-xs text-stone-500">Stellen (032 = 3)</Label><Input type="number" min="1" max="8" value={s.numberPadding} onChange={(e) => setS({ ...s, numberPadding: parseInt(e.target.value) || 1 })} /></div>
            <div className="space-y-1"><Label className="text-xs text-stone-500">USt-Satz %</Label><Input type="number" min="0" value={s.vatRate} onChange={(e) => setS({ ...s, vatRate: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label className="text-xs text-stone-500">Zahlungsziel (Tage)</Label><Input type="number" min="0" value={s.dueDays} onChange={(e) => setS({ ...s, dueDays: parseInt(e.target.value) || 0 })} /></div>
            <p className="col-span-2 text-sm text-stone-600">Nächste Rechnung erhält die Nr. <b>{formatInvoiceNumber(next, s.numberPadding)}</b>. Jede neue Rechnung – und jedes neue Datum – bekommt automatisch eine neue, fortlaufende Nummer. Nummern werden nie doppelt vergeben.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="h-5 w-5" />Claude-KI für Screenshots (optional)</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>Mit einem eigenen Claude-API-Schlüssel (console.anthropic.com) werden Screenshots sehr genau zugeordnet – auch Handschrift, Türkisch und Kurmancî. Ohne Schlüssel arbeitet die eingebaute Texterkennung.</p>
            <div className="flex gap-2">
              <Input type={showKey ? "text" : "password"} autoComplete="off" placeholder="sk-ant-…" value={s.claudeApiKey} onChange={(e) => setS({ ...s, claudeApiKey: e.target.value })} />
              <Button variant="outline" onClick={() => setShowKey(!showKey)}>{showKey ? "Verbergen" : "Zeigen"}</Button>
            </div>
            <p className="text-xs">Der Schlüssel wird nur auf diesem Gerät gespeichert, nie in Sicherungsdateien exportiert und nur direkt an Anthropic gesendet. Nutzen Sie die App nur auf eigenen Geräten.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Leistungskatalog & Standardpreise</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setS({ ...s, catalog: DEFAULT_CATALOG })}>Zurücksetzen</Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setS({ ...s, catalog: [...s.catalog, { id: `eigene-${Date.now().toString(36)}`, section: "inland", label: "Neue Leistung", defaultPrice: 0, keywords: [] }] })}><Plus className="h-4 w-4" />Leistung</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <p className="mb-2 text-sm text-stone-500">Reihenfolge und Bezeichnungen erscheinen so auf neuen Rechnungen. Schlüsselwörter helfen der automatischen Zuordnung (kommagetrennt). Der Standardpreis wird eingesetzt, wenn eine Leistung ohne Preis erkannt wird.</p>
          {s.catalog.map((c) => (
            <div key={c.id} className="grid items-center gap-2 rounded-lg border p-2 md:grid-cols-[100px_1fr_1fr_110px_70px_36px]">
              <select className="h-9 rounded-md border bg-white px-2 text-sm" value={c.section} onChange={(e) => updateItem(c.id, { section: e.target.value as CatalogItem["section"] })}>
                <option value="inland">Inland</option><option value="abroad">Ausland</option>
              </select>
              <Input className="h-9" value={c.label} onChange={(e) => updateItem(c.id, { label: e.target.value })} />
              <Input className="h-9 text-xs" value={c.keywords.join(", ")} onChange={(e) => updateItem(c.id, { keywords: e.target.value.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean) })} placeholder="Schlüsselwörter" />
              <Input className="h-9 text-right" type="number" min="0" step="0.01" value={c.defaultPrice || ""} onChange={(e) => updateItem(c.id, { defaultPrice: parseFloat(e.target.value) || 0 })} placeholder="Preis €" />
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!c.taxFree} onChange={(e) => updateItem(c.id, { taxFree: e.target.checked })} />steuerfrei</label>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setS({ ...s, catalog: s.catalog.filter((x) => x.id !== c.id) })}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lock className="h-5 w-5" />PIN-Sperre</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>{s.pinHash ? "Die Buchhaltung ist mit einer PIN gesperrt." : "Optional: Buchhaltung mit einer PIN (4–8 Ziffern) sperren – sinnvoll, wenn andere das Gerät benutzen."}</p>
            <div className="flex gap-2">
              <Input type="password" inputMode="numeric" placeholder={s.pinHash ? "Neue PIN" : "PIN"} value={newPin} onChange={(e) => setNewPin(e.target.value)} />
              <Button onClick={setPin}>{s.pinHash ? "Ändern" : "Setzen"}</Button>
              {s.pinHash && <Button variant="outline" onClick={removePin}>Entfernen</Button>}
            </div>
            <p className="text-xs">PIN vergessen? Browserdaten dieser Seite löschen und die Datensicherung einspielen.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><History className="h-5 w-5" />Bisherige Rechnungen</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>Übernimmt Ihre Rechnungen Nr. 032 (2.344,30 €) und Nr. 44 (3.958,00 €) mit Beträgen als offen. Kundennamen/Adressen und bereits erhaltene Zahlungen danach in der jeweiligen Rechnung ergänzen.</p>
            <Button variant="outline" onClick={() => { const n = importLegacy(); toast.success(n ? `${n} Rechnung(en) übernommen` : "Bereits vorhanden"); }}>032 & 44 übernehmen</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Datensicherung</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-stone-600">
          <p>Alle Daten liegen nur in diesem Browser auf diesem Gerät. Bitte regelmäßig eine Sicherung herunterladen (z. B. in OneDrive/Google Drive ablegen) – damit können Sie die Daten auch auf ein anderes Gerät übertragen.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => download(`buchhaltung-sicherung-${todayISO()}.json`, exportBackup(), "application/json")}><Download className="h-4 w-4" />Sicherung herunterladen</Button>
            <Button variant="outline" className="gap-2" onClick={() => file.current?.click()}><Upload className="h-4 w-4" />Sicherung einspielen</Button>
          </div>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (!window.confirm("Aktuelle Daten durch die Sicherung ersetzen?")) return;
            try { importBackup(await f.text()); toast.success("Sicherung eingespielt"); window.location.reload(); }
            catch (err) { toast.error(err instanceof Error ? err.message : "Datei ungültig"); }
          }} />
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl justify-end px-4 py-3"><Button className="gap-2" onClick={save}><Save className="h-4 w-4" />Einstellungen speichern</Button></div>
      </div>
    </div>
  );
}
