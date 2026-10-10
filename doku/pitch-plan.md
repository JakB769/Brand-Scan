# Pitch-Plan: KI-Anprobe & Passform-App für Shopify

2026-10-01 · Fabian

## Auf einen Blick

|  | Realistische Zahl |
|---|---|
| Zeit bis zur ersten Version | 3–5 Monate (250–400 h bei 15–20 h pro Woche) |
| Kosten im ersten Jahr | ca. 1.500–8.500 €, mit Werbung bis ca. 14.500 € |
| Laufende Kosten am Anfang | ca. 50–400 € pro Monat |
| Gewinnschwelle (laufende Kosten) | ab ca. 2–11 zahlenden Shops |
| Realistisch nach 12 Monaten am Markt | 30–120 Shops, ca. 1.650–8.400 € Umsatz pro Monat |
| Davon nach API-Kosten | ca. 1.150–5.900 € pro Monat |
| Davon eine Person leben | ab ca. 110 zahlenden Shops |

Grobe Schätzungen vor Shopify-Anteil und Steuern, Details in den Abschnitten unten.

## Problem & Lösung

Wir bauen eine Shopify-App, mit der Kunden vor dem Kauf per Handy- oder Laptop-Kamera sehen, welche Größe passt und wie ein Teil an ihnen aussieht. Ziel: weniger Retouren für Modebrands.

**Problem:** Online-Käufer wissen oft nicht, welche Größe passt. Viele bestellen zwei Größen und schicken eine zurück. Jede Retoure kostet den Händler Versand, Bearbeitung und oft Wertverlust der Ware.

**Lösung:** Ein Button auf der Produktseite startet einen kurzen Kamera-Scan. Der Kunde bekommt:

- eine **Größenempfehlung** auf Basis seiner Maße und der Größentabelle der Brand
- eine **Passform-Karte** (grün = passt, gelb = eng/weit, rot = passt nicht) pro Körperbereich
- optional ein **KI-Anprobebild**, das ihn im Kleidungsstück zeigt

**Vision:** Live-3D-Anprobe, bei der man sich vor der Kamera drehen kann und das Kleidungsstück mitbewegt (Gaussian Splatting plus einfache Stoffphysik). Das ist der Wow-Effekt für Investoren, nicht das erste Produkt.

## Produkt

Die App hat zwei Seiten: ein Widget für Kunden im Shop und einen Admin-Bereich für die Brand.

**Ablauf für Kunden:**

1. Klick auf „Meine Größe finden“ auf der Produktseite
2. Körpergröße eingeben, Kamera freigeben
3. Kurzer Scan von vorne und von der Seite (ca. 10 Sekunden)
4. Maße werden direkt im Browser berechnet, kein Foto verlässt das Gerät
5. Ergebnis: empfohlene Größe plus Passform-Karte
6. Optional: KI-Anprobebild, danach wird das Foto sofort gelöscht

**Funktionen für Händler:**

- Installation mit einem Klick aus dem Shopify App Store, kein Programmieren
- Größentabellen pro Produkt hinterlegen
- Statistik: Anzahl Scans, empfohlene Größen, Anprobebilder
- Button-Design passend zum Shop

**Technik:** Shopify-App-Vorlage mit Theme App Extension, MediaPipe Pose für die Maße (läuft gratis im Browser), externe Try-On-API für das Anprobebild, Abrechnung über die Shopify Billing API.

## Markt & Konkurrenz

Der Markt ist nicht leer: Es gibt günstige Shopify-Apps entweder für KI-Anprobebilder oder für Größenempfehlung per Kamera. Unsere Chance ist die Kombination beider plus Passform-Karte, in einer Nische.

| Anbieter | Was es macht | Preis (Shopify, Stand 2026) |
|---|---|---|
| [Genlook](https://nightjar.so/blog/best-tools-ai-virtual-try-on) | KI-Anprobebild aus Kundenfoto | gratis (10/Monat), dann ab 19,99 $ für 100 Anproben |
| [Antla](https://apps.shopify.com/antla) | KI-Anprobebild aus Kundenfoto | ab 19,99 $ (100 Anproben) bis 199,99 $ (2.000 Anproben) |
| [UniMeasureAI](https://apps.shopify.com/unimeasure) | Größenempfehlung per Kamera | laut App-Store-Eintrag |
| [Sizekick](https://www.sizekick.io/shopify-app) | Größenempfehlung per Körpertyp oder Video-Scan | laut Website |
| [Lyfsize](https://apps.shopify.com/lyfsize-app) | Größenempfehlung aus 2 Handyfotos | ab 40 $ |

Dazu kommen große Player wie Google (Try-On in der Suche), Zalando und Fit Analytics, die eher Großkunden bedienen.

**Unsere Lücke:**

- Größenempfehlung **und** Anprobebild **und** Passform-Karte in einer App
- Fokus auf eine Nische, wo Passform entscheidend ist (z. B. Jeans/Hosen oder Sportbekleidung)
- DACH-Markt, deutsche Oberfläche, Datenschutz als Verkaufsargument (Maße lokal berechnet)
- Später: Live-3D-Anprobe als Alleinstellungsmerkmal

**Zielkunden:** kleine bis mittlere Modebrands auf Shopify mit hohen Retourenquoten, besonders in Kategorien wie Jeans, Sportbekleidung, Workwear, Übergrößen.

## Geschäftsmodell & Preise

Monatsabo über Shopify mit einem Kontingent an KI-Anprobebildern. Die Größenempfehlung läuft im Browser des Kunden und kostet uns fast nichts, darum ist sie in allen bezahlten Plänen unbegrenzt.

| Plan | Preis pro Monat | Größenempfehlungen | KI-Anprobebilder | Unsere API-Kosten (bei 5 Cent/Bild) |
|---|---|---|---|---|
| Gratis | 0 € | 100 | 10 | ca. 0,50 € |
| Basic | 39 € | unbegrenzt | 200 | ca. 10 € |
| Pro | 99 € | unbegrenzt | 800 | ca. 40 € |
| Business | 249 € | unbegrenzt | 2.500 | ca. 125 € |
| Zusatzbild | 0,12 € pro Bild |  |  | ca. 0,05 € |

- **Annahme Kosten pro Anprobebild:** 2–10 Cent je nach Anbieter, gerechnet mit 5 Cent. Vor dem Launch mit echten Angeboten prüfen.
- **Gratis-Plan** sorgt für Installationen und Bewertungen im App Store.
- **Enterprise** (größere Brands): individuelles Angebot ab ca. 500 € pro Monat.
- Shopify behält einen Anteil am App-Umsatz; die aktuellen Bedingungen im Shopify-Partnerprogramm prüfen.

## Umsatzszenarien

Nach 12 Monaten am Markt sind je nach Vertriebserfolg rund 1.700 bis 32.000 € Monatsumsatz realistisch. Alle Zahlen sind grobe Annahmen, keine Finanzberatung.

| Szenario nach 12 Monaten | Zahlende Shops | Ø Preis pro Monat | Monatsumsatz | Jahresumsatz | Rohertrag pro Monat (nach ca. 30 % API-Kosten) |
|---|---|---|---|---|---|
| Konservativ | 30 | 55 € | 1.650 € | 19.800 € | ca. 1.150 € |
| Mittel | 120 | 70 € | 8.400 € | 100.800 € | ca. 5.900 € |
| Optimistisch | 400 | 80 € | 32.000 € | 384.000 € | ca. 22.400 € |

- **Break-even der laufenden Kosten** (ca. 50–400 € pro Monat): schon mit 2–11 zahlenden Shops, ohne eure Arbeitszeit.
- **Eine Person bezahlen** (ca. 4.000 € Kosten pro Monat): ab rund 110 zahlenden Shops.
- Shopify-Anteil und Steuern sind hier noch nicht abgezogen.

## Umsetzung

Die erste verkaufbare Version braucht mit KI-Coding-Tools rund 250–400 Stunden, also 3–5 Monate bei 15–20 Stunden pro Woche. Wir haben viel Erfahrung mit KI und Marketing, aber kaum JavaScript.

1. **Vorbereitung** (Woche 0, ca. 10–15 h): JavaScript-Grundkurs, Node.js, Git, VS Code und Claude Code installieren, Shopify-Partner-Konto und Test-Shop
2. **Grundgerüst** (Woche 1–2, ca. 30–40 h): App-Vorlage mit Shopify CLI, Button auf der Produktseite
3. **Kamera & Maße** (Woche 3–6, ca. 80–120 h): MediaPipe einbauen, Maße berechnen, mit 20–30 Personen testen
4. **Größenempfehlung** (Woche 7–8, ca. 40–60 h): Größentabellen im Admin, Passform-Karte
5. **KI-Anprobebild** (Woche 9–10, ca. 30–50 h): Try-On-API anbinden, Fotos sofort löschen
6. **Feinschliff & Launch** (Woche 11–14, ca. 60–100 h): Handy-Tests, Abo-Pläne, Datenschutz, Einreichung im Shopify App Store

Parallel ab Woche 6: 5–10 Stunden pro Woche Marketing und Gespräche mit Pilot-Brands.

**Tools:** Claude Code als Haupt-Coding-Tool, Claude im Chat für Planung und Texte, GitHub für Backups. Ein erfahrener Freelancer prüft den Code zweimal (nach Schritt 3 und vor dem Launch).

## Startkosten & Budget

Das erste Jahr kostet ohne Werbung rund 1.500–8.500 €, mit bezahlter Werbung zusätzlich ca. 1.200–6.000 €.

| Posten | Art | Kosten (geschätzt) |
|---|---|---|
| Datenschutz & Recht (DSGVO-Texte, Vertrag mit Händlern) | einmalig | 500–2.000 € |
| Code-Review durch Freelancer (5–10 h) | einmalig | 400–1.000 € |
| Gründung, Logo, Design | einmalig | 0–1.000 € (GmbH deutlich mehr) |
| KI-Coding-Tool | monatlich | 20–200 € |
| Hosting & Datenbank | monatlich | 0–50 € |
| Try-On-API (Tests und Piloten) | monatlich | 20–100 € |
| Domain & E-Mail | monatlich | 5–15 € |
| Social-Media-Werbung (optional) | monatlich | 100–500 € |

Shopify-Partner-Konto, Test-Shop, MediaPipe und Shopify CLI sind gratis. Ab dem Launch steigen die API-Kosten mit der Nutzung, werden aber über die Abos bezahlt. Mögliche Förderungen in Wien: aws Preseed, Wirtschaftsagentur Wien, INiTS (Bedingungen prüfen).

## Vertrieb & Marketing

Ziel für die ersten 6 Monate nach Launch: 10 zahlende Shops mit echten Retouren-Zahlen als Fallstudien. Grobe Rechnung: 200 Brands anschreiben, davon ca. 40 Antworten, 15 Demos, 8 Piloten und 4 zahlende Kunden.

1. **Personalisierte Demo-Videos:** Ein Produkt der Brand nehmen, Anprobe machen, 30-Sekunden-Video schicken.
2. **Gratis-Piloten** mit 5–10 Brands für 1–2 Monate, im Gegenzug Retourenquote vorher/nachher und ein Zitat.
3. **Social Media** (TikTok, Instagram, LinkedIn): KI-Videos mit eigener oder Partner-Kleidung, als KI gekennzeichnet, keine fremden Marken ohne Erlaubnis.
4. **Shopify App Store:** Gratis-Plan, gute Screenshots, frühe Bewertungen sammeln.
5. **Shopify-Agenturen** als Partner mit Provision pro vermitteltem Kunden.
6. **LinkedIn-Outreach** an E-Commerce-Manager und Gründer von Modebrands.
7. **Events & Netzwerk:** E-Commerce-Konferenzen, Shopify-Meetups und Startup-Programme in Wien.
8. **Empfehlungsprogramm:** ein Freimonat pro vermittelter Brand.

## Risiken & nächste Schritte

Das größte Risiko ist nicht die Technik, sondern ob Brands dafür zahlen. Darum zuerst mit Händlern reden, dann bauen.

| Risiko | Gegenmaßnahme |
|---|---|
| Viele günstige Konkurrenten | Nische wählen, Kombination aus Größe + Passform-Karte + Anprobe |
| Maße zu ungenau | früh mit 20–30 Personen testen, Ergebnisse als Bereich statt exakter Zahl zeigen |
| Datenschutz bei Körperfotos | Maße lokal berechnen, Fotos nicht speichern, Rechtstexte prüfen lassen |
| API-Kosten fressen Marge | Kontingente pro Plan, Kosten pro Bild laufend beobachten |
| Wenig JavaScript-Erfahrung | in kleinen Schritten mit KI bauen, Code-Review durch Freelancer |

**Nächste Schritte:**

- [ ] 5–10 Shopify-Modebrands befragen: Retourenquote, Interesse, Zahlungsbereitschaft
- [ ] Nische festlegen (z. B. Jeans oder Sportbekleidung)
- [ ] Preise der Try-On-APIs vergleichen und testen
- [ ] Tools installieren, Shopify-Partner-Konto und Test-Shop anlegen
- [ ] Social-Media-Account starten und Entwicklung dokumentieren
- [ ] Fördermöglichkeiten in Wien prüfen

## Quellen

- [Nightjar: 10 Best AI Virtual Try-On Tools for Fashion Brands (2026)](https://nightjar.so/blog/best-tools-ai-virtual-try-on)
- [Antla AI Virtual Try On – Shopify App Store](https://apps.shopify.com/antla)
- [UniMeasureAI – Shopify App Store](https://apps.shopify.com/unimeasure)
- [Sizekick Shopify App](https://www.sizekick.io/shopify-app)
- [Lyfsize – Shopify App Store](https://apps.shopify.com/lyfsize-app)

Alle Kosten-, Zeit- und Umsatzzahlen ohne Quelle sind eigene Schätzungen.

Original: https://claude.ai/code/artifact/fbca6f53-122f-41c2-ba09-2e5a99a5df47
