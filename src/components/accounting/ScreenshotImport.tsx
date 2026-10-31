import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ClipboardPaste, ImagePlus, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CatalogItem, Extracted, parseInvoiceText } from "@/accounting/core";
import { extractWithClaude, extractWithOCR } from "@/accounting/recognize";

interface Props {
  catalog: CatalogItem[];
  apiKey: string;
  onExtracted: (ex: Extracted, source: string) => void;
}

export function ScreenshotImport({ catalog, apiKey, onExtracted }: Props) {
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [drag, setDrag] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const run = useCallback(async (img: Blob, extra: string) => {
    try {
      if (apiKey) {
        setBusy("Claude liest den Screenshot …");
        const ex = await extractWithClaude(img, apiKey, catalog, extra);
        onExtracted(ex, "Claude (KI)");
      } else {
        setBusy("Texterkennung läuft …");
        const { extracted, text: ocrText } = await extractWithOCR(img, catalog, (p, status) => setBusy(`Texterkennung: ${status === "recognizing text" ? Math.round(p * 100) + " %" : "lädt …"}`));
        const merged = extra ? parseInvoiceText(`${ocrText}\n${extra}`, catalog) : extracted;
        setText((t) => t || ocrText.trim());
        onExtracted(merged, "Texterkennung");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erkennung fehlgeschlagen");
    } finally {
      setBusy("");
    }
  }, [apiKey, catalog, onExtracted]);

  const accept = useCallback((img: Blob) => {
    setFile(img);
    setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(img); });
    void run(img, "");
  }, [run]);

  // Screenshot direkt mit Strg+V / Einfügen übernehmen
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      const blob = item?.getAsFile();
      if (blob) { e.preventDefault(); accept(blob); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [accept]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find((t) => t.startsWith("image/"));
        if (type) return accept(await it.getType(type));
      }
      const t = await navigator.clipboard.readText();
      if (t) { setText(t); onExtracted(parseInvoiceText(t, catalog), "Text"); return; }
      toast.info("Zwischenablage ist leer.");
    } catch {
      toast.info("Bitte Strg+V (bzw. lange tippen → Einfügen) verwenden.");
    }
  };

  return (
    <Card className="border-dashed border-stone-300 print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-amber-600" />Automatisch ausfüllen aus Screenshot</CardTitle>
        <p className="text-sm text-stone-500">Screenshot einfügen (Strg+V), hineinziehen, Foto machen oder Text einfügen – Kunde, Verstorbene/r, Zielland und Preise werden zugeordnet. {apiKey ? "Modus: Claude-KI (sehr genau)." : "Modus: Texterkennung. Für beste Ergebnisse Claude-Schlüssel in den Einstellungen hinterlegen."}</p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) accept(f); }}
          className={`flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 text-center transition ${drag ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-stone-50"}`}
        >
          {preview ? <img src={preview} alt="Screenshot" className="max-h-56 rounded-lg object-contain shadow" /> : <ImagePlus className="h-10 w-10 text-stone-400" />}
          {busy ? <p className="flex items-center gap-2 text-sm font-medium text-amber-700"><Loader2 className="h-4 w-4 animate-spin" />{busy}</p> : (
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={pasteFromClipboard} className="gap-1"><ClipboardPaste className="h-4 w-4" />Einfügen</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => fileInput.current?.click()} className="gap-1"><ImagePlus className="h-4 w-4" />Bild wählen</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => cameraInput.current?.click()} className="gap-1"><Camera className="h-4 w-4" />Foto</Button>
            </div>
          )}
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f); e.target.value = ""; }} />
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f); e.target.value = ""; }} />
        </div>
        <div className="flex flex-col gap-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder={"Oder Text einfügen, z. B. WhatsApp:\nAuftraggeber: Leyla Demir\nMusterstr. 12, 12345 Musterstadt\nVerstorbene: Rojin Demir\nÜberführung nach Qamishli\nSarg 900, Transport 200, Fracht 750, Ambulanz 1730"} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={!text.trim() || !!busy} onClick={() => onExtracted(parseInvoiceText(text, catalog), "Text")} className="gap-1"><Wand2 className="h-4 w-4" />Text zuordnen</Button>
            {file && <Button type="button" size="sm" variant="outline" disabled={!!busy} onClick={() => run(file, text)}>Screenshot erneut auswerten</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
