// Erkennung von Screenshots/Fotos: entweder per Claude (sehr genau, eigener API-Schlüssel)
// oder offline-nah per Texterkennung (Tesseract) + Regel-Zuordnung.
import { CatalogItem, Extracted, InvoiceKind, parseInvoiceText } from "./core";

const CLAUDE_MODEL = "claude-opus-5-5";

/** Bild verkleinern (spart Zeit und Kosten) und als Base64-JPEG liefern */
export async function imageToBase64(file: Blob, maxSide = 1800): Promise<{ data: string; mediaType: string; dataUrl: string }> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
      el.src = bitmapUrl;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas nicht verfügbar.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    return { data: dataUrl.split(",")[1], mediaType: "image/jpeg", dataUrl };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

function buildSchema(catalog: CatalogItem[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["customer", "deceased", "kind", "destination", "serviceDate", "items", "discount", "notes"],
    properties: {
      customer: {
        type: "object",
        additionalProperties: false,
        required: ["name", "street", "zip", "city", "phone", "email"],
        properties: {
          name: { type: "string" },
          street: { type: "string" },
          zip: { type: "string" },
          city: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
        },
      },
      deceased: { type: "string" },
      kind: { type: "string", enum: ["Bestattung", "Beisetzung", "Überführung", ""] },
      destination: { type: "string" },
      serviceDate: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["catalogId", "label", "amount"],
          properties: {
            catalogId: { type: "string", enum: [...catalog.map((c) => c.id), "custom"] },
            label: { type: "string" },
            amount: { type: "number" },
          },
        },
      },
      discount: { type: "number" },
      notes: { type: "string" },
    },
  };
}

function buildPrompt(catalog: CatalogItem[]) {
  const list = catalog.map((c) => `- ${c.id} (${c.section === "inland" ? "Inland" : "Ausland"}): ${c.label}`).join("\n");
  return `Du hilfst einem Bestattungsunternehmen (Bestattung, Beisetzung, internationale Überführung, vor allem in kurdische Regionen: Türkei, Irak/Kurdistan, Syrien, Iran) beim Schreiben einer Rechnung.
Das Bild ist ein Screenshot (z. B. WhatsApp-Chat, Notiz, Auftrag, Angebot, alte Rechnung oder Formular). Texte können Deutsch, Türkisch, Kurmancî oder Arabisch sein.

Ordne alle erkennbaren Angaben zu:
- customer: Auftraggeber/Rechnungsempfänger (Angehörige/r), NICHT der Verstorbene und NICHT unsere Firma (Alp GmbH / Mezopotamya).
- deceased: Name der verstorbenen Person.
- kind: "Überführung" wenn ins Ausland überführt wird, "Beisetzung" bei Beerdigung in Deutschland, sonst "Bestattung"; "" wenn unklar.
- destination: Zielland auf Deutsch (z. B. "Türkei", "Irak", "Syrien", "Iran"), "" wenn keins.
- serviceDate: Datum der Leistung/Beisetzung als YYYY-MM-DD, "" wenn unbekannt.
- items: jede Leistung mit Preis als Nettobetrag in Euro. Ordne sie der passenden Katalog-ID zu; nur wenn nichts passt "custom" mit eigener Bezeichnung in label. Leistungen ohne erkennbaren Preis mit amount 0 aufnehmen. Keine Summen, Steuern oder Gesamtbeträge als Position.
- discount: Rabatt in Euro, sonst 0.
- notes: kurze wichtige Hinweise (z. B. Flugnummer, Friedhof, Besonderheiten), sonst "".
Unbekannte Textfelder als "" zurückgeben. Nichts erfinden.

Leistungskatalog:
${list}`;
}

interface ClaudeTextBlock { type: string; text?: string }
interface ClaudeResponse { content?: ClaudeTextBlock[]; stop_reason?: string; error?: { message?: string } }

export async function extractWithClaude(file: Blob, apiKey: string, catalog: CatalogItem[], extraText = ""): Promise<Extracted> {
  const image = await imageToBase64(file);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2026-10-21",
      "anthropic-beta": "server-side-fallback-2026-07-01",
      // Schlüssel bleibt im Browser des Nutzers (localStorage), es gibt keinen eigenen Server
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: buildSchema(catalog) } },
      system: buildPrompt(catalog),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } },
            { type: "text", text: extraText ? `Zusätzliche Angaben vom Bestatter:\n${extraText}` : "Bitte die Rechnungsdaten aus diesem Screenshot zuordnen." },
          ],
        },
      ],
    }),
  });
  const json = (await res.json().catch(() => ({}))) as ClaudeResponse;
  if (!res.ok) {
    if (res.status === 401) throw new Error("Claude-API-Schlüssel ungültig. Bitte in den Einstellungen prüfen.");
    if (res.status === 429) throw new Error("Zu viele Anfragen – bitte kurz warten und erneut versuchen.");
    throw new Error(`Claude-Fehler (${res.status}): ${json.error?.message || "unbekannt"}`);
  }
  if (json.stop_reason === "refusal") throw new Error("Claude hat die Anfrage abgelehnt. Bitte Texterkennung nutzen.");
  const text = json.content?.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Keine Antwort von Claude erhalten.");
  const data = JSON.parse(text);
  return {
    customer: data.customer || {},
    deceased: data.deceased || undefined,
    kind: (data.kind || undefined) as InvoiceKind | undefined,
    destination: data.destination || undefined,
    serviceDate: /^\d{4}-\d{2}-\d{2}$/.test(data.serviceDate || "") ? data.serviceDate : undefined,
    items: Array.isArray(data.items) ? data.items : [],
    discount: data.discount || undefined,
    notes: data.notes || undefined,
  };
}

// ---------------------------------------------------------------- Texterkennung ohne KI

declare global {
  interface Window {
    Tesseract?: { recognize: (image: string | Blob, langs: string, opts?: { logger?: (m: { status: string; progress: number }) => void }) => Promise<{ data: { text: string } }> };
  }
}

const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

function loadTesseract(): Promise<NonNullable<Window["Tesseract"]>> {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TESSERACT_URL;
    s.async = true;
    s.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error("Texterkennung nicht geladen.")));
    s.onerror = () => reject(new Error("Texterkennung konnte nicht geladen werden (Internet prüfen)."));
    document.head.appendChild(s);
  });
}

export async function ocrImage(file: Blob, onProgress?: (p: number, status: string) => void): Promise<string> {
  const T = await loadTesseract();
  const { dataUrl } = await imageToBase64(file, 2400);
  const { data } = await T.recognize(dataUrl, "deu+tur+eng", { logger: (m) => onProgress?.(m.progress, m.status) });
  return data.text;
}

export async function extractWithOCR(file: Blob, catalog: CatalogItem[], onProgress?: (p: number, status: string) => void): Promise<{ extracted: Extracted; text: string }> {
  const text = await ocrImage(file, onProgress);
  return { extracted: parseInvoiceText(text, catalog), text };
}
