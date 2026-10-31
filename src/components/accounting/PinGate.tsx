import { FormEvent, ReactNode, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hashPin, useAccounting } from "@/accounting/store";

const SESSION_KEY = "mezopotamya-buchhaltung-unlocked";

function readUnlocked(hash: string) {
  try { return sessionStorage.getItem(SESSION_KEY) === hash; } catch { return false; }
}

/**
 * Einfache PIN-Sperre für den Buchhaltungsbereich. Schützt vor neugierigen Blicken
 * am gemeinsam genutzten Gerät – ersetzt aber keine Geräte-/Kontosperre.
 */
export function PinGate({ children }: { children: ReactNode }) {
  const { settings } = useAccounting();
  const [unlockedHash, setUnlockedHash] = useState(() => (readUnlocked(settings.pinHash) ? settings.pinHash : ""));
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!settings.pinHash || unlockedHash === settings.pinHash || readUnlocked(settings.pinHash)) return <>{children}</>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const h = await hashPin(pin);
    if (h === settings.pinHash) {
      try { sessionStorage.setItem(SESSION_KEY, h); } catch { /* ignorieren */ }
      setUnlockedHash(h);
    } else {
      setError("PIN falsch.");
      setPin("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4 rounded-2xl bg-white p-6 text-center shadow-lg">
        <Lock className="mx-auto h-8 w-8 text-stone-500" />
        <p className="font-serif text-xl">Buchhaltung gesperrt</p>
        <Input type="password" inputMode="numeric" autoFocus placeholder="PIN" value={pin} onChange={(e) => { setPin(e.target.value); setError(""); }} className="text-center text-lg tracking-widest" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Entsperren</Button>
      </form>
    </div>
  );
}
