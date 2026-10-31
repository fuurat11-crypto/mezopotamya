import { useSyncExternalStore } from "react";
import { CompanySettings, DEFAULT_CATALOG, DEFAULT_SETTINGS, Invoice, legacyInvoices } from "./core";

const KEY = "mezopotamya-buchhaltung-v1";

export interface AccountingData {
  invoices: Invoice[];
  settings: CompanySettings;
  /** Bereits geprüfte Bankbuchungen (zugeordnet oder ignoriert) */
  handledBankRefs: string[];
}

function load(): AccountingData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AccountingData>;
      const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
      // Neue Katalogpositionen aus Updates ergänzen, eigene Preise behalten
      const known = new Set(settings.catalog.map((c) => c.id));
      settings.catalog = [...settings.catalog, ...DEFAULT_CATALOG.filter((c) => !known.has(c.id))];
      return { invoices: parsed.invoices || [], settings, handledBankRefs: parsed.handledBankRefs || [] };
    }
  } catch {
    /* Speicher nicht verfügbar oder beschädigt -> leer starten */
  }
  return { invoices: [], settings: DEFAULT_SETTINGS, handledBankRefs: [] };
}

let state: AccountingData = typeof window === "undefined" ? { invoices: [], settings: DEFAULT_SETTINGS, handledBankRefs: [] } : load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* z. B. privater Modus */
  }
}

export function setData(updater: (prev: AccountingData) => AccountingData) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

export function useAccounting(): AccountingData {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => { if (e.key === KEY) { state = load(); cb(); } };
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
    },
    () => state,
    () => state,
  );
}

export function saveInvoice(inv: Invoice) {
  setData((d) => {
    const exists = d.invoices.some((i) => i.id === inv.id);
    return { ...d, invoices: exists ? d.invoices.map((i) => (i.id === inv.id ? inv : i)) : [...d.invoices, inv] };
  });
}

export function updateInvoice(id: string, fn: (inv: Invoice) => Invoice) {
  setData((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === id ? fn(i) : i)) }));
}

export function deleteInvoice(id: string) {
  setData((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) }));
}

export function saveSettings(settings: CompanySettings) {
  setData((d) => ({ ...d, settings }));
}

export function markBankHandled(refs: string[]) {
  setData((d) => ({ ...d, handledBankRefs: [...new Set([...d.handledBankRefs, ...refs])] }));
}

export function exportBackup(): string {
  return JSON.stringify({ app: "mezopotamya-buchhaltung", version: 1, exportedAt: new Date().toISOString(), ...state, settings: { ...state.settings, claudeApiKey: "" } }, null, 2);
}

export function importBackup(json: string) {
  const parsed = JSON.parse(json);
  if (!parsed || !Array.isArray(parsed.invoices)) throw new Error("Keine gültige Sicherungsdatei.");
  setData((d) => ({
    invoices: parsed.invoices,
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings, claudeApiKey: d.settings.claudeApiKey },
    handledBankRefs: parsed.handledBankRefs || [],
  }));
}

export function download(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Übernimmt die bisherigen Rechnungen (032, 44), sofern ihre Nummern noch frei sind. */
export function importLegacy(): number {
  let added = 0;
  setData((d) => {
    const used = new Set(d.invoices.map((i) => i.number));
    const fresh = legacyInvoices(d.settings).filter((i) => !used.has(i.number));
    added = fresh.length;
    return { ...d, invoices: [...d.invoices, ...fresh] };
  });
  return added;
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`mezopotamya:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
