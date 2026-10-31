// Browser-Test (läuft in GitHub Actions): öffnet Website und Buchhaltung, legt eine Rechnung an.
// Aufruf: NODE_PATH="$(npm root -g)" node tests/smoke.cjs http://localhost:4173
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.argv[2] || "http://localhost:4173";
const OUT = "smoke-screenshots";
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
let step = 0;

async function shot(page, name) {
  step++;
  await page.screenshot({ path: `${OUT}/${String(step).padStart(2, "0")}-${name}.png`, fullPage: true });
}

async function expectText(page, text, where) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
    console.log(`✓ ${where}: „${text}“ sichtbar`);
  } catch {
    errors.push(`${where}: Text „${text}“ nicht gefunden`);
    console.log(`✗ ${where}: „${text}“ fehlt`);
  }
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: "de-DE" });
  page.on("pageerror", (e) => errors.push(`JS-Fehler: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") console.log("console.error:", m.text()); });

  // 1. Öffentliche Startseite
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await expectText(page, "Mezopotamya", "Startseite");
  await shot(page, "startseite");

  // 2. Buchhaltung – Übersicht
  await page.goto(`${BASE}/buchhaltung`, { waitUntil: "networkidle" });
  await expectText(page, "Mezopotamya Buchhaltung", "Buchhaltung");
  await expectText(page, "Alpiroz GmbH i. G.", "Buchhaltung");
  await shot(page, "buchhaltung-uebersicht");

  // 3. Neue Rechnung per Text-Erkennung
  await page.goto(`${BASE}/buchhaltung/neu`, { waitUntil: "networkidle" });
  await expectText(page, "Rechnung Nr. 001", "Neue Rechnung");
  const sample = [
    "Auftraggeber: Leyla Demir",
    "Musterstr. 12",
    "12345 Musterstadt",
    "Verstorbene: Rojin Demir",
    "Überführung nach Qamishli",
    "Sarg 900",
    "Transport 200",
    "Dienstleistung 100",
    "Fracht 750",
    "Ambulanz 1730",
    "Konsulat 50",
  ].join("\n");
  await page.locator("textarea").first().fill(sample);
  await page.getByRole("button", { name: "Text zuordnen" }).click();
  await page.waitForTimeout(500);
  const customer = await page.getByPlaceholder("Vor- und Nachname").first().inputValue();
  if (customer !== "Leyla Demir") errors.push(`Kunde nicht zugeordnet (Feld: „${customer}“)`);
  else console.log("✓ Kunde automatisch zugeordnet");
  await expectText(page, "3.958,00", "Neue Rechnung (Gesamtbetrag)");
  await shot(page, "neue-rechnung-ausgefuellt");

  // 4. Speichern
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForURL(/\/buchhaltung\/rechnung\//, { timeout: 10000 }).catch(() => errors.push("Nach Speichern keine Weiterleitung zur Rechnung"));
  await expectText(page, "Zahlungseingänge", "Gespeicherte Rechnung");
  await shot(page, "rechnung-gespeichert");

  // 5. Zahlung erfassen (Teilzahlung)
  const amountInput = page.getByPlaceholder(/3958|Betrag/).first();
  await amountInput.fill("1000");
  await page.getByRole("button", { name: "Zahlung" }).click();
  await expectText(page, "2.958,00", "Differenz nach Teilzahlung");
  await shot(page, "zahlung-erfasst");

  // 6. Druckansicht
  const url = page.url();
  const id = url.split("/").pop();
  await page.goto(`${BASE}/buchhaltung/druck/${id}`, { waitUntil: "networkidle" });
  await expectText(page, "EUR GESAMT", "Druckansicht");
  await shot(page, "druckansicht");

  // 7. Liste und Übersicht
  await page.goto(`${BASE}/buchhaltung/rechnungen`, { waitUntil: "networkidle" });
  await expectText(page, "Leyla Demir", "Rechnungsliste");
  await shot(page, "rechnungsliste");
  await page.goto(`${BASE}/buchhaltung`, { waitUntil: "networkidle" });
  await shot(page, "uebersicht-mit-daten");

  // 8. Handy-Ansicht
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/buchhaltung/neu`, { waitUntil: "networkidle" });
  await shot(page, "handy-neue-rechnung");

  await browser.close();
  if (errors.length) {
    console.error("\nFEHLER:\n- " + errors.join("\n- "));
    process.exit(1);
  }
  console.log("\nAlle Browser-Prüfungen bestanden.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
