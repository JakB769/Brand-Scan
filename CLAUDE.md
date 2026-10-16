# Passform-Projekt: Live-Anprobe für Hosen als Shopify-App

Übergabe aus einem Claude-Chat (1.–7. Oktober 2026) an Claude Code. Diese Datei ist der Einstieg (früher auch als `UEBERGABE.md` mitgeliefert, Inhalt identisch).
Antworte dem Nutzer auf **Deutsch**.

## Worum es geht

Ein Dreierteam aus Wien (Fabian führt den Chat; einer kennt Gaussian Splats, einer macht Social-Media-Marketing;
viel KI- und Marketing-Erfahrung, **fast kein JavaScript**) baut eine **Shopify-App mit Abo**:
Kunden sehen per Handy- oder Laptop-Kamera live, wie eine Hose an ihnen sitzt. Kern ist die **Passform**,
gezeigt über die Live-Anprobe. Nische: Hosen und Jeans. Handy und Laptop gleich wichtig.

Zielablauf, den der Nutzer ausdrücklich will:
1. Händler lädt **ein Foto von vorne und eins von hinten** hoch (flach fotografierte Hose).
2. Daraus entsteht **automatisch auf der Seite** ein 3D-Modell. Kein Umweg über andere Websites, kein manueller Schritt.
3. Das Modell liegt live und **perspektivisch richtig** auf dem Körper; beim Drehen sieht man nur die Seite, die zur Kamera zeigt.
4. Alles muss später **in einer Shopify-App** laufen können. Die Seite darf Dinge nachladen (CDN), aber nichts darf einen Extra-Schritt des Nutzers verlangen.

Geschäftsplan, Preise (39 / 99 / 249 € pro Monat, vom Nutzer bestätigt), Konkurrenz und Zeitplan: `doku/pitch-plan.md`.

## Was in diesem Ordner liegt

| Pfad | Inhalt |
|---|---|
| `app/index.html` | **Aktueller Stand.** Eine einzige Datei, rund 470 KB, kein Build-Schritt. |
| `app/avatar/koerper.js` | Körpermodell des Avatars (16.10., MakeHuman CC0, 901 KB, gezippt 482 KB, aus `werkzeuge/python/koerper_bauen.py`). Muss neben `index.html` liegen (Netlify Drop: ganzen Ordner `app/` ziehen). |
| `netlify/functions/holen.mjs`, `netlify.toml` | **Server-Teil für „Link einfügen“** (10.10.): holt Shop-Seite, Bilder, Größentabelle, Model-Größe. Läuft nur, wenn Netlify mit GitHub verbunden ist (Netlify Drop kann keine Funktionen), Anleitung `doku/netlify-einrichten.md`. |
| `netlify/functions/hosen.mjs` | **Sammlung auf dem Server** (12.10.): `/api/hosen` (Liste, holen, speichern, löschen), Netlify Blobs für alle Deploys/Vorschauen/Branch-Links gemeinsam, lokal ein Ordner (`HOSEN_DIR`). Optional Team-Code `PASSFORM_TEAMCODE`. |
| `werkzeuge/server.mjs` | Lokaler Server wie Netlify (Dateien + `/api/holen` + `/api/hosen`, Sammlung in `.hosen-lokal/`), `NODE_USE_ENV_PROXY=1` hinter dem Cloud-Proxy. |
| `shopify/` | **Shopify-Gerüst** (12.10.): App-Block „Live anprobieren“ (Theme App Extension), Server für App-Proxy und Pflicht-Webhooks, Signaturprüfung, Skript zum Zuordnen einer Hose zu einem Produkt. Einrichten und Offenes: `doku/shopify-einrichten.md`. |
| `werkzeuge/pruefstand.mjs` | **Prüfstand**: echte Seite und echte Erkennung mit einem Foto als Kamerabild (`node werkzeuge/pruefstand.mjs foto.jpg 180 [link]`), Bild nach `werkzeuge/tests/ausgabe/pruefstand.png`, Messwerte in der Konsole. Braucht ffmpeg. |
| `prototypen/` | Sieben ältere Stände, nummeriert und datiert. Nur zum Nachschlagen. |
| `werkzeuge/tests/testseite-mit-simulierter-person.html` | Aktuelle Seite mit Attrappe statt MediaPipe (siehe „Testen“). |
| `werkzeuge/tests/t*.mjs` | Playwright-Skripte, siehe „Testen“ (die alten `t.mjs` bis `te.mjs` mit harten Pfaden sind seit 11.10. gelöscht). |
| `werkzeuge/python/` | Der ursprüngliche Python-Weg vom Foto zum Modell. Inzwischen nach JavaScript portiert, als Referenz nützlich. |
| `werkzeuge/bausteine/` | `g3d.js` (3D-Darstellung) und `gen.js` (Generator, Blickrichtung) als Einzelstücke, bevor sie in die Seite kamen. **Nicht mehr ganz aktuell**, die Wahrheit steht in `app/index.html`. |
| `material/produktfotos/` | `front.jpg`, `back.jpg` (Bershka Super Baggy Jeans, 702×900), der fertige Atlas und das Modell als JSON. Gute Testdaten. |
| `material/freisteller-alt/` | Die fünf alten 2D-Freisteller samt `assets.json`. Aus der App entfernt. |
| `material/anhaenge/` | Alles, was der Nutzer im Chat angehängt hat: zehn Bershka-Screenshots, die Ideen-Notiz `attachment.txt`, zwei Bildschirmfotos. |
| `material/testbilder/` | Screenshots aus den Tests (Posen, Drehung, Umriss-Erkennung). |
| `doku/chatverlauf.md` | Der Chat ab dem 5. Oktober als Text. Der Teil davor ist nur noch als Zusammenfassung erhalten (unten eingearbeitet). |
| `doku/pitch-plan.md` | Pitch-Plan als Markdown. |
| `doku/foto-anleitung-haendler.md` | Foto-Anleitung für Händler (steht verkürzt auch in der Seite unter „So fotografierst du richtig“). |
| `doku/netlify-einrichten.md` | Netlify einmal mit GitHub verbinden (feste Adresse, Link einfügen geht). |
| `doku/test-checkliste.md` | Ablauf zum Testen vieler Hosen auf mehreren Geräten (Netlify, `hosen.json`, Prüfpunkte je Gerät, was zurückschicken). |
| `doku/code-karte.md`, `doku/verlauf.md`, `doku/testen.md` | Aus dieser Datei ausgelagert (13.10.), siehe „Wo das ausführliche Wissen steht“. |

**Rechtlicher Hinweis:** Die Bershka-Bilder sind nur interne Testdaten. Für ein echtes Produkt braucht es eigene Fotos oder die Erlaubnis der Marke. Der Nutzer will ab jetzt mit eigenen, selbst fotografierten Hosen arbeiten.

## Wie die Seite funktioniert

Reines HTML mit einem `<script type="module">`. Zur Laufzeit von jsDelivr nachgeladen: MediaPipe Tasks Vision 0.10.18
(Pose-Erkennung mit Segmentierungsmaske, auch für Einzelbilder beim Hochladen), bei Bedarf `heic-to` 1.6.5 für iPhone-Fotos
(Ausweichlösung `heic2any` 0.0.4) und, nur wenn eine Maßtabelle als Bild kommt, Tesseract.js 7.0.0 (Texterkennung,
Programm etwa 3 MB plus deutsche und englische Schrift 4 MB, Apache 2.0).

Ablauf für den Anwender: Größe eingeben → Kamera → Frontal-Scan → Seiten-Scan → Nahphase mit Anprobe.
Hose anlegen (seit 10.10.): **„🔗 Link zur Hose im Shop einfügen“** (Seite wird über `/api/holen` geholt, Bilder, Tabelle,
Model-Größe landen im Upload) oder **„Dateien hochladen“** (Fotos, Shop-Screenshots, Maßtabelle als Bild oder Text,
hineinziehen, antippen oder Strg+V; ein eingefügter Link wird geholt); darunter weiter das Einzel-Formular mit Maßband-Werten
und Maßstab (A4/Bankkarte). Nach dem Bauen mit Foto mit Model: **Abgleich** (Shop-Foto neben derselben Haltung mit 3D-Hose).


## Wo das ausführliche Wissen steht (bei Bedarf lesen)

Diese Datei wird bei jeder Anfrage mitgeladen und ist darum bewusst kurz. Die Details liegen in eigenen Dateien:

| Datei | Wann lesen |
|---|---|
| `doku/code-karte.md` | Vor jeder Arbeit an `app/index.html`: wichtigste Funktionen, Hosenmodell `G.m3`, wo was im Code steht. |
| `doku/verlauf.md` | Wenn es um einen früheren Fehler, eine frühere Aufgabe oder den Stand eines Themas geht: offene Punkte, Gesamtprüfung, Notizen jeder Sitzung. |
| `doku/testen.md` | Vor dem Schreiben oder Ändern von Tests: Steuerung der Attrappe (`window.__mode`), Einblicke der Testseite, was jeder Test prüft. |

**Regel:** Neue Sitzungsnotizen ans Ende von `doku/verlauf.md`, neue Code-Stellen in `doku/code-karte.md`, neue Tests in die Tabelle in
`doku/testen.md`. In `CLAUDE.md` nur, was in jeder Sitzung gebraucht wird (Ziel, Entscheidungen, Vorlieben, Befehle). Ziel: unter 15 KB.

## Entscheidungen und Erkenntnisse, die man nicht noch einmal herausfinden muss

- **Schuh im Stoff-Fall ist eine Höhenform, keine Kapsel.** Der Fuß geht durch die Saumöffnung nach vorn hinaus; eine Kapsel drückt den Saum seitlich weg (nach hinten unter die Ferse oder vorn über die Spitze).
- **Vorne/hinten an flachen Fotos: Gesäßtaschen-Kanten, nicht Bildähnlichkeit.** Zwei Fotos derselben Seite sind sich nicht ähnlicher als Vorder- und Rückseite (beides ≈ 0,5); Knopf, Etikett und Innenbund waren als Merkmal unzuverlässig (Innenbund auch auf Rückseiten erkannt).

- **Hosen dauerhaft: Netlify Blobs, nicht `localStorage`.** Der Browser-Speicher gehört genau einer Adresse; jede Netlify-Vorschau und jeder Drop hat eine eigene. Der Blob-Speicher gehört der Website und gilt für alle Deploys.
- **Safari lässt sich hier nicht testen** (Playwright-WebKit fehlt, kein Download). iPhone-Prüfungen macht der Nutzer.
- **Hosenbewegung und Messwerte brauchen verschiedene Filter**: Messwerte ruhig (`emaV`), Hose schnell (`jv`). Ein Filter für beides gibt entweder Nachlauf oder unruhige Maße.

- **Shopify: Anprobe über den App-Proxy unter der Shop-Adresse, nicht als iframe und nicht als Kopie im App-Block** (Kamera ohne iframe-Freigabe; Liquid-Grenze 100 KB, Seite 330 KB). Hosen als Datei je Shop/Produkt auf dem App-Server, nicht als Metafeld (json-Metafeld max. 128 KB, Hose ≈ 120 KB).
- **Netlify Drop kann keine Server-Funktionen.** Für „Link einfügen“ muss Netlify mit dem GitHub-Repo verbunden sein.
- **Länge am Foto mit Model: Saumposition, nicht sichtbarer Bund.** Bund ist meist unter dem Oberteil, bei weiten Hosen staucht
  der Saum auf dem Schuh und der Schritt hängt tief; gemessen wird ab der Bundlinie der Anprobe, so endet der Saum bei der
  Anprobe dort, wo er am Model endet.

- **3D-Modell statt Gaussian Splat.** Ein Splat braucht viele Ansichten und Training auf einer Grafikkarte; aus zwei Fotos im Browser geht das nicht. Splats auf bewegten Körpern sind Forschungsstand. Das Splat-Wissen im Team taugt später für drehbare Produktansichten.
- **KI-Bild-zu-3D (Hunyuan3D) getestet und verworfen.** Aus flach fotografierten Hosen macht es flache Hosen (117 breit, 17 tief). Getragene Form kommt aus den Maßen, nicht aus der KI.
- **Flache und getragene Fotos lassen sich nicht mischen**; Model-Fotos haben je Bild eine andere Pose.
- **Passform kommt aus Zentimetern.** Größentabellen der Shops (Bershka) nennen nur Körpermaße, Produktfotos haben keinen Maßstab. Mindestens ein Maßband-Wert pro Hose ist nötig.
- **Die Tiefenschätzung von MediaPipe ist unruhig.** Nie allein darauf bauen.
- **Bodenkamera: Knie über der Hüfte ist normal** (Knie hoch, Hocke). Fehlerkennung erkennt man an Knöcheln über den Knien, nicht
  an Knien über der Hüfte. Bein-Tiefe aus der Verkürzung braucht die gelernte Bein-Länge (`legCm`), nicht nur das andere Bein.
- **Maßstab nie allein aus der Rumpflänge**: zur Kamera geneigt wirkt er kürzer (Hocke, Bücken: Hose 30–50 % zu klein). Kein
  Segment ist im Bild länger als in echt → Untergrenze aus Beinen, Rumpf, Schulter-/Hüftbreite (`scaleLim`); Körperhöhe nur gerade und senkrecht.
- **Bein-Querschnitt tiefer als breit** (Schritt 1,0 → Saum 1,25), weite Hosen hinten gerade vom Gesäß zum Boden. 0,8 war zu flach
  (Referenzvideo, alle drei 3D-Modelle 1,05–1,4). Vergleich gegen die Referenz: `werkzeuge/vergleich.mjs`, Plan: `PROGRESS.md`.
- **Kamera braucht https.** Der Nutzer zieht einen Ordner mit `index.html` auf app.netlify.com/drop (ohne Konto, jedes Mal neue Adresse).
- Shopify: Theme App Extension (App-Block), Billing API, 3D-Modelle als Datei am Produkt. Das fertige Hosenmodell ist rund 120 KB.
- **Schlüssel (3D-Dienst, Shopify-Secret) nur als Umgebungsvariable im Server-Teil**, nie in `app/index.html` oder einer Datei im Repo.
  `npm test` prüft das zuerst (`werkzeuge/geheimnis-pruefung.mjs`). Jeder Server-Teil, der einen bezahlten Dienst ruft, braucht eine
  Zugriffsgrenze: Netlify-Funktionen über `rateLimit` in `config` (Gratis-Plan: höchstens 2 Regeln, beide belegt von `holen` und `hosen`),
  der Shopify-Server über `shopify/server/grenze.mjs` (je Shop, nicht je IP, weil alles über Shopify kommt).

## Was der Nutzer mag und nicht mag

- Will Dinge **erledigt bekommen**, nicht selbst basteln („ich werde jetzt nicht Blender öffnen“).
- **Live**, nichts Vorgerendertes.
- **Ruhige Oberfläche**: Texte dürfen nicht schnell wechseln, große lesbare Schrift, Symbole statt Wörter auf Knöpfen.
- Tracking soll **ruhig** sein; Punkte dürfen nicht springen, auch wenn Hände vor der Hüfte sind.
- Hose sitzt auf den **Hüftknochen**, nicht in der Taille.
- Kamera muss beim Tippen **sofort** starten und den weitesten Winkel nehmen.
- Schreibt oft per Spracheingabe; „Buntweite“ heißt Bundweite.
- Antworten kurz, ehrlich, mit klarer Aussage, was geprüft ist und was nicht.
- **Bei jeder Änderung am Ende die Datei anhängen** (Wunsch vom 10.10.): `app/index.html` mit SendUserFile schicken,
  damit sie direkt getestet werden kann (z. B. auf Netlify Drop). Geänderte andere Dateien, die sie zum Testen brauchen, dazu.

## Plugins (`.claude/settings.json`)

Aus dem offiziellen Anthropic-Marktplatz, für alle im Team eingeschaltet:
- `security-guidance`: warnt beim Schreiben vor gefährlichen Mustern (z. B. `innerHTML`, feste Schlüssel) und prüft jeden Commit.
  Die Prüfung nach jeder Antwort ist aus (`ENABLE_STOP_REVIEW=0`) und beide Prüfungen laufen auf Sonnet, um Usage zu sparen.
- `frontend-design`: für Oberfläche und Gestaltung (ruhig, „wie Apple“).
- `claude-security`: gründlicher Sicherheits-Scan auf Abruf, vor dem App Store und vor dem Freelancer-Review laufen lassen.
- `superpowers`: erst planen, dann in kleinen Schritten mit Tests bauen, Review zwischendurch.
- `liquid-skills` (von Shopify): Liquid und Theme-Erweiterungen, z. B. `shopify/extensions/passform-anprobe/blocks/anprobe.liquid`.
- `netlify-skills` (von Netlify): Funktionen, Deploy, Blobs, Rate Limits in `netlify/`.

## Testen

```sh
npm install
npm test          # baut die Testseite neu und prüft alles
npm run diagnose  # Freistellung im Detail und Bildserie mit Knie, Ausgabe in werkzeuge/tests/ausgabe/
```

Die Testseite `werkzeuge/tests/testseite-mit-simulierter-person.html` wird von `baue-testseite.mjs` aus `app/index.html` erzeugt.
**Nie von Hand ändern.** Attrappe, Einblicke und alle Tests im Einzelnen: `doku/testen.md`.

## Vorschlag für die nächsten Schritte

1. Echte Handyfotos des Nutzers besorgen und daran die neue Freistellung prüfen; mit echter Kamera bestätigen, dass die Hose nicht mehr nach unten breiter wird.
2. Die eine Datei in Module zerlegen (Kamera, Pose, Messung, Generator, Darstellung, Oberfläche), mit einem einfachen Build. Erst danach wird es in Claude Code angenehm zu ändern.
3. Passform sichtbar machen: Hose dort einfärben, wo ihr Umfang kleiner ist als der gemessene Körperumfang. Die Körpermaße liegen aus dem Scan schon vor.
4. Shopify: Gerüst steht (`shopify/`). Als Nächstes mit echtem Entwicklungs-Shop ausprobieren, dann Händler-Seite im Admin (App Home mit ID-Token-Anmeldung, Hosen hochladen statt `hose-ablegen.mjs`) und Pläne mit Shopify App Pricing (siehe `doku/shopify-einrichten.md`).
5. Messgenauigkeit mit 20–30 Personen gegen das Maßband prüfen (die Messreihe in der Seite ist dafür da).
