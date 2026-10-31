# Mezopotamya Buchhaltung

Interner Bereich der Website unter **`/buchhaltung`** (z. B. `https://www.mezopotamya-bestattungen.de/buchhaltung`).
Für Suchmaschinen gesperrt (`noindex` + `robots.txt`).

## Was die App kann

| Bereich | Funktion |
|---|---|
| **Neue Rechnung** | Screenshot einfügen (Strg+V), hineinziehen, Foto machen oder WhatsApp-Text einfügen → Kunde, Adresse, Verstorbene/r, Art (Bestattung/Beisetzung/Überführung), Zielland und Leistungen mit Preisen werden automatisch zugeordnet. |
| **Rechnungsnummer** | Wird automatisch fortlaufend vergeben (Start: 045, nach Ihrer letzten Nr. 44). **Neues Datum = neue Rechnungsnummer**: Ändern Sie das Datum einer bestehenden Rechnung, entsteht beim Speichern eine neue Nummer, die alte wird storniert (Zahlungen werden übernommen). Nummern werden nie doppelt vergeben. |
| **Berechnung** | Inland mit 19 % USt, steuerfreie Auslagen (Sterbeurkunde, amtsärztliche Gebühren, Friedhof) ohne USt, Auslandsleistungen (Fracht, Ambulanz, Konsulat …) standardmäßig umsatzsteuerfrei, Rabatt. Geprüft an Ihren Rechnungen Nr. 032 und Nr. 44. |
| **Drucken / PDF** | A4-Layout wie Ihre bisherigen Rechnungen: Seite 1 Inland, Seite 2 Ausland mit „EUR GESAMT“. Zusätzlich Leistungsdatum (Pflichtangabe § 14 UStG) und Fälligkeit. |
| **Zahlungseingänge** | Zahlungen (Überweisung, Bar, EC, Versicherung) je Rechnung erfassen. Oder Kontoauszug als CSV importieren → Eingänge werden automatisch der richtigen Rechnung zugeordnet (Rechnungs-Nr., Name, Betrag). |
| **Differenzen** | Übersicht mit berechnet / eingegangen / offene Differenz / überfällig, Monatsdiagramm, Filter (offen, teilbezahlt, überfällig, bezahlt, überzahlt, storniert). |
| **Gewinn pro Auftrag** | Eigene Kosten (Luftfracht, Sarg-Einkauf, Friedhof, Partner im Ausland) je Rechnung eintragen → Gewinn und Marge; Jahresgewinn in der Übersicht. Erscheint nicht auf der Rechnung. |
| **Versand** | Rechnung per WhatsApp (Nachricht mit Betrag, IBAN, Rechnungs-Nr.) oder E-Mail vorbereiten. |
| **Mahnwesen** | Zahlungserinnerung → 1. Mahnung → letzte Mahnung als druckbares Schreiben, mit Verlauf; Erinnerung auch per WhatsApp. |
| **Startbestand** | Ein Klick übernimmt Nummern und Beträge der bisherigen Rechnungen 032 und 44 (Kundendaten in der App ergänzen – sie stehen bewusst nicht im Code). |
| **PIN-Sperre** | Optional unter Einstellungen (4–8 Ziffern). Schützt vor neugierigen Blicken, ersetzt keine Gerätesperre. |
| **Export** | CSV für den Steuerberater, JSON-Datensicherung (Import auf anderem Gerät möglich). |

## Screenshot-Erkennung

* **Ohne Einstellung:** eingebaute Texterkennung (Tesseract, Deutsch/Türkisch/Englisch) + Regel-Zuordnung.
* **Empfohlen:** eigenen Claude-API-Schlüssel unter *Einstellungen* eintragen → sehr genaue Zuordnung, auch bei Handschrift, Türkisch, Kurmancî. Der Schlüssel bleibt nur im Browser des Geräts und wird nicht exportiert.

## Wichtig

* Die Daten liegen **lokal im Browser** des jeweiligen Geräts. Regelmäßig *Einstellungen → Sicherung herunterladen*.
* Firmen: Voreingestellt ist die **Alp GmbH** (Plettenberg). Für die neue **Alpiroz GmbH i. G.** (Sitz Köln) gibt es unter *Einstellungen* einen Knopf – Anschrift, IBAN, Steuernummer und HRB nach der Eintragung ergänzen.
* Auf Rechnung 44 steht auf Seite 1 die IBAN ohne Prüfziffer („DE 4506 …“), auf Seite 2 korrekt „DE88 4506 0009 0056 7701 00“ – die App verwendet die vollständige IBAN. Rechnung 032 nennt noch Sparkasse Hagen und eine andere Steuernummer (302/5701/1528); voreingestellt sind die neueren Daten (Märkische Bank, 312/5003/2420).
* Steuerliche Einordnung (z. B. Steuerfreiheit der Auslandsleistungen) bitte einmal mit dem Steuerberater abstimmen – alles ist in der App umstellbar.

## Entwicklung

```bash
pnpm install
pnpm dev          # http://localhost:8080/buchhaltung
pnpm test         # Rechen-, Nummern-, Erkennungs- und Bank-Abgleich-Tests
```

Code: `src/accounting/` (Logik, Speicher, Erkennung), `src/components/accounting/` (Oberfläche), `src/pages/Buchhaltung.tsx` (Routen), `tests/accounting.test.ts`.
