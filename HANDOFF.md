# HANDOFF – Passform (Live-Anprobe für Hosen, Shopify-App)

Stand: 22.10.2026, Commit `8454855` + Übergabe. Antworten an den Nutzer auf Deutsch.

## Repo und Branches
- Repo: https://github.com/JakB769/Brand-Scan
- **Aktuell: `claude/new-session-fbr0jp`** (Netlify deployt diesen Branch). `3d-modell-verbesserung` ist identisch (Arbeitsbranch, Fast-Forward auf beide pushen).
- `main` ist älter (10.10.) und in beiden enthalten. `claude/claude-md-schlank` = alter Nebenzweig (13.10.), ignorieren.
- Nie auf `main` force-pushen.

## Starten, testen, deployen
- Kein Build für die App: `app/index.html` ist die ganze App (ca. 590 KB, ein `<script type="module">`).
- Lokal: `node werkzeuge/server.mjs` (Seite + `/api/holen` + `/api/hosen`, Sammlung in `.hosen-lokal/`). Kamera braucht https oder localhost.
- Tests: `npm install && npx playwright install chromium && npm test` (pretest baut `werkzeuge/tests/testseite-mit-simulierter-person.html` aus `app/index.html`; nie von Hand ändern).
- Einzeltest: `node werkzeuge/tests/baue-testseite.mjs && node werkzeuge/tests/<t…>.mjs`.
- Commit-Haken `.githooks/pre-commit` (aktiv nach `npm install`): ändert ein Commit die Modellerzeugung, läuft `tneuehose.mjs`.
- Deploy: Netlify mit GitHub verbunden, `netlify.toml` (publish `app/`, Funktionen `netlify/functions/`). Push auf `claude/new-session-fbr0jp` → nach ca. 1 min online.
- Live-URL: feste `*.netlify.app`-Adresse im Netlify-Konto des Nutzers (nicht im Repo notiert). Alternative: Ordner `app/` auf app.netlify.com/drop ziehen (jedes Mal neue Adresse, ohne Server-Funktionen).
- Shopify: `cd shopify && npm i && shopify app dev` (Server `shopify/server/start.mjs`, Anleitung `doku/shopify-einrichten.md`). Noch nie mit echtem Shop getestet.

## Externe Dienste und Umgebungsvariablen
Schlüssel nur als Umgebungsvariable (Netlify-Konto bzw. App-Server), nie im Repo; `npm test` prüft das zuerst (`werkzeuge/geheimnis-pruefung.mjs`). Es gibt keine `.env`-Datei im Repo.

| Dienst | Zweck | Variable |
|---|---|---|
| jsDelivr CDN | MediaPipe Tasks Vision 0.10.18 (+WASM), heic-to 1.6.5, heic2any 0.0.4, Tesseract.js 7.0.0 | – |
| storage.googleapis.com | Modelle `pose_landmarker_full/lite.task`, `magic_touch.tflite` (Freistellung) | – |
| Netlify Functions | `/api/holen` (Shop-Seite holen), `/api/hosen` (Sammlung) | `PASSFORM_TEAMCODE` (optional Schreibschutz), `HOSEN_DIR` (lokal), `HOLEN_LOKAL`, `NODE_USE_ENV_PROXY` |
| Netlify Blobs | Hosen-Sammlung für alle Deploys | (automatisch durch Netlify) |
| Shopify App-Proxy | Anprobe unter `/apps/passform/…`, Signaturprüfung, Pflicht-Webhooks | `SHOPIFY_API_SECRET`, `PASSFORM_DATEN`, `PORT`; `client_id` in `shopify/shopify.app.toml` (Platzhalter) |

Rate Limits: Netlify `rateLimit` in `config` beider Funktionen (Gratis-Plan max. 2 Regeln, beide belegt); Shopify je Shop in `shopify/server/grenze.mjs`.

## Architektur (alles in `app/index.html`, Funktionsnamen; Details `doku/code-karte.md`)
- **Kamera/Scan**: `startCamera`, `openStream`; `analyse(res)` je Bild (Glätten, Maßstab, Messwerte, Coaching). Start-Anweisung + `ganzGrund` („Weiter zurück · Füße nicht sichtbar“), Scan nach 0,5 s Ruhe (`HOLD_MS`, `scanMedian`). Vor Scan-Ende nichts zeichnen (`zeigen`, Klasse `vorscan`).
- **Tracking**: MediaPipe Pose + Segmentierungsmaske; `emaV` (Messwerte ruhig), `jv` (Hose schnell), `legSanity`, `legHinge`, `scaleLim`, `bodyYaw`, `torsoRoll`, `trackSure` (ausblenden: Hüftbeugung > 45°, Liegen, Sprünge).
- **Hose aus Fotos (Generator)**: `upAdd`/`classifyFlat`/`upBuild` (Dateien hochladen, Vorder-/Rückseite per Gesäßtaschen `sideCheck`) → `buildGarment` → `loadGarmentPhoto`/`photoWithReference` (Bankkarte/A4 als Maßstab: `findReference`, `refineReference`, `askCorners`, Neigung `levelBySensor`) → `segGarment` (Farbe `segClassic` + KI `aiMask`, `fuseMasks`, `bodenImSpalt`) → `garmentProfile`/`normalizeProfile` → Modell `G.m3` (Atlas, Breitenprofil).
- **3D-Hose**: `mesh3d`, `pose3d`, `skin3d` (Rig Hüfte/Knie), `draw3d` (WebGL), `drawGarment` (Live-Overlay), `shadow3d`, `rim3d`.
- **Physik**: `cloth3d` (Federn zur Form, Nachschwingen), `drape3d`/`drapeFor` (Fall, Stauchen am Schuh), `STOFFE`/`stoffVon` (Stoffart).
- **Oberteil**: `shirtHem` (Saumkante in der Personenmaske, Parabel, Hysterese), `shirtCut` (Hose darüber weg). Nur 2D, keine 3D-Oberteile.
- **Größen**: `bodyMeas` (Maßband > Avatar > Scan), `sizeGarment`, `sizeVerdict`, `sizeAll`, `renderSizes`, `autoSizes`, `parseSizeText`/`tableDims` (Maßtabelle, OCR).
- **Avatar**: `avatarScanStart` → `avatarScanBild` (Drehung, 24 Winkelfächer) → `avatarScanZiele` → `avatarBauen` (MakeHuman-Körper aus `app/avatar/koerper.js`, Erzeuger `werkzeuge/python/koerper_bauen.py`) → `avatarPose`/3D-Ansicht `view3dFrame`; Farben `avatarFarbProbe`; `avatarLose` (weite Kleidung).
- **Speicherung**: Hosen in `localStorage` (`massScanHosen`, `saveOwn`/`loadOwn`) + Server-Sammlung `/api/hosen` (Netlify Blobs) + `hosen.json` neben der Seite (optional). Avatar nur als Zahlen in `localStorage` (`passformAvatar`), keine Bilder.
- **Hosen-Auswahl**: Web-Komponente `<passform-hosen>` in `app/hosen-auswahl.js` (Daten per `quelle`-Adresse oder `.produkte`).
- **Server**: `netlify/functions/holen.mjs`, `netlify/functions/hosen.mjs`, `werkzeuge/server.mjs` (lokal), `shopify/server/start.mjs` (+ `signatur.mjs`, `grenze.mjs`, `hose-ablegen.mjs`), App-Block `shopify/extensions/passform-anprobe/`.

## Was gut funktioniert
- Neue Hose aus 2 flachen Fotos mit Bankkarte: zwei getrennte Beine, Tiefe 62 % der Breite, Rückseite aus Rückenfoto, Rig + Stoffphysik aktiv (`tneuehose` grün; Renders `docs/test-neue-hose/`).
- Karte automatisch auf beiden Fotos, Fotos ohne Karte bekommen keine falsche Karte (`tersatzkarte`).
- Live-Scan in ca. 1–2 s, ruhiges Tracking, Ausblenden statt Fehldarstellung, T-Shirt-Kante ohne Flackern.
- Größenempfehlung je Zone, Größenwechsel im 3D; Avatar-Ablauf auf iPhone-13-/Pixel-7-Emulation (`docs/test-avatar/`).
- Testreihe: 43 von 45 grün (Gesamtlauf 19.10.).

## Kaputt / offen
- **Avatar-Scan ungenau**: mit echten Clips (weite Kleidung) wird nur ein Durchschnittskörper; Kamera am Boden streckt die Beine (auf menschliche Werte begrenzt); Kragen-Kante am Hals; Fußfarbe oft nicht bestimmbar. Nutzer will den Avatar-Scan reparieren.
- Länge der Testjeans 107,7 statt 105 cm (Maßband), Ursache unbekannt.
- `tlag` rot: Testmaschine nur 6 statt 10 Bilder/s (auch auf altem Stand rot), nicht gelockert.
- Safari/echtes iPhone nicht testbar; Bildrate am Gerät nicht gemessen.
- Vorschaubilder der Hosen-Auswahl zeigen bei manchen Hosen Boden zwischen den Beinen (Foto, nicht 3D).

## Halb fertig
- Shopify: Gerüst + Tests stehen; fehlt: echter Entwicklungs-Shop, Händler-Seite im Admin, Abo/Billing (Preise 39/99/249 €/Monat, `doku/pitch-plan.md`).
- 3D-Oberteile: nicht vorhanden (gewünscht).
- Messgenauigkeit gegen Maßband mit 20–30 Personen: Messreihe in der Seite vorhanden, nicht durchgeführt.
- `app/index.html` in Module zerlegen: geplant, nicht begonnen.

## Feste Vorgaben
- Läuft komplett im Browser (nur CDN-Nachladen, kein Extra-Schritt für den Nutzer); Ziel ist eine Shopify-App (Anprobe über App-Proxy, nicht iframe).
- Frontkamera, beim Tippen sofort starten, weitester Winkel; Handy und Laptop gleich wichtig.
- Immer Vorder- UND Rückseite verwenden (Rückseite nur notfalls geschätzt und gekennzeichnet).
- Testprofile: Jakob 1,79 m, Fabian 1,87 m, Philip 1,70 m.
- Lieber ausblenden als schlecht aussehen.
- DSGVO: keine Bilder speichern, nur Zahlen; Einwilligung vor Avatar-Scan; Profil löschbar; Shopify-Pflicht-Webhooks.
- Hose sitzt auf den Hüftknochen; ruhige Oberfläche, Symbole statt Wörter, Texte wechseln nicht schnell.
- Keine Schlüssel im Repo; keine Originaldateien des Nutzers löschen; keine kostenpflichtigen Abos/Käufe; keine Fremdbilder ausliefern (Bershka nur intern); Kartenfotos mit lesbarer Nummer nie committen.
- Nach jeder App-Änderung `app/index.html` (und geänderte Laufzeitdateien) dem Nutzer schicken.

## Entscheidungen (nicht neu herausfinden)
- 3D-Modell aus Maßen statt Gaussian Splat oder Bild-zu-3D-KI (Hunyuan3D macht flache Hosen).
- Freistellung uneinig: Punkte nur der KI bleiben außer bei Bodenfarbe, Punkte nur der Farbe nur bei Stofffarbe (`fuseMasks`).
- Vorne/hinten an Gesäßtaschen-Kanten erkennen, nicht an Bildähnlichkeit.
- Ersatz-Kartensuche nur mit Kartenfarbe vom anderen Foto und fast rechteckig.
- Maßstab nie nur aus der Rumpflänge (`scaleLim`); MediaPipe-Tiefe nie allein.
- Bein-Querschnitt tiefer als breit (Schritt 1,0 → Saum 1,25).
- Hosen dauerhaft in Netlify Blobs, nicht nur `localStorage`; Hose im Shop als Datei je Produkt, nicht Metafeld.
- Körpermodell MakeHuman (CC0); Figur „Joe“ und `assets/pants/` haben unklare Lizenz → nicht ausliefern.

## Testdateien und Referenzen
- Tests: `werkzeuge/tests/t*.mjs` (Liste und Inhalt `doku/testen.md`); Attrappe `werkzeuge/tests/attrappe.js` (Steuerung `window.__mode`).
- Pflicht-Test neue Hose: `werkzeuge/tests/tneuehose.mjs` mit `assets/referenz/fotos/flach-vorne-hinten/vorne.jpg`, `hinten.jpg` (Maßband 105 cm, W32).
- Avatar: `werkzeuge/tests/tavatar.mjs`, `werkzeuge/avatar-option-handy.mjs` (iPhone 13/Pixel 7), `werkzeuge/avatar-scan.mjs` mit Clips `assets/referenz/videos/clips/v2-02_drehung-360.mp4`, `v1-04_drehen-seite-hinten.mp4` (Jakob 1,79 m).
- Echte Kamera mit Foto: `werkzeuge/pruefstand.mjs` (braucht ffmpeg); Vergleich gegen Referenz: `werkzeuge/vergleich.mjs` + `werkzeuge/vergleich-liste.json`.
- Testbilder: `material/produktfotos/` (Bershka front/back), `material/testbilder/` (Freistellung, Maßstab, echt, Rock, getragen).
- Referenzen: `assets/referenz/README.md`, Spezifikation `docs/referenz-analyse/spezifikation.md`.
- Archiv (nicht mehr pflegen): `PROGRESS.md`, `doku/verlauf.md`, `doku/chatverlauf.md`, `doku/code-karte.md` (Nachschlagen).
