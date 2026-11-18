# Architektur

## Ordner
| Ordner/Datei | Inhalt |
|---|---|
| `app/index.html` | Die ganze Web-App (ein `<script type="module">`, kein Build). Wird so ausgeliefert (Netlify, Shopify-Server). |
| `app/hosen-auswahl.js` | Produkt-Auswahl als Web-Komponenten `<passform-hosen>`, `<passform-produkte>`. |
| `app/avatar/koerper.js` | Körpermodell (MakeHuman CC0, Erzeuger `werkzeuge/python/koerper_bauen.py`). |
| `netlify/functions/` | `holen.mjs` (`/api/holen`: Shop-Seite holen), `hosen.mjs` (`/api/hosen`: Sammlung in Netlify Blobs). |
| `shopify/` | Shopify-App: `shopify.app.toml` (App-Proxy `/apps/passform`, Webhooks), `server/start.mjs` (+ `signatur.mjs`, `grenze.mjs`, `hose-ablegen.mjs`), App-Block `extensions/passform-anprobe/`. |
| `werkzeuge/` | Werkzeuge (Node/Python): lokaler Server, Render- und Messwerkzeuge, Qualitätsgedächtnis. |
| `werkzeuge/tests/` | Tests `t*.mjs`, Attrappe `attrappe.js` (simulierte Person, `window.__mode`), Shop-Attrappen `shop/`; Ausgaben nach `ausgabe/` (nicht im Repo). |
| `assets/referenz/` | Referenzmaterial: Fotos (Testhose `fotos/flach-vorne-hinten/`), Videos und Clips, Mensch „Joe“ (nur intern). |
| `assets/pants/` | Referenz-3D-Modelle (Lizenz unklar, nur intern). |
| `material/` | Testdaten: `testbilder/` (Freistellung, Maßstab, echt, Rock, Oberteile, Shorts), `produktfotos/`, `anhaenge/`. |
| `docs/` | `tests/` (aktuelle Screenshots), `referenz-analyse/` (Spezifikation aus den Referenzen), `foto-anleitung-haendler.md`, `pitch-plan.md`. |

## App (`app/index.html`, Funktionsnamen)
- **Kamera/Scan:** `startCamera`, `analyse` (je Bild: Maßstab, Messwerte, Ansagen `coach`), Messanzeige `draw` (im Kundenmodus und Avatar-Scan aus).
- **Tracking:** MediaPipe Pose + Maske; `emaV`, `jv`, `legHinge`, `bodyYaw`, `trackSure` (ausblenden).
- **Kleidung aus Fotos:** `upAdd`/`classifyFlat`/`upBuild` → `buildGarment` → `photoWithReference` (Bankkarte/A4) → `segGarment` (Farbe + KI, `fuseMasks`, `schattenWeg`) → `garmentProfile` → Modell `G.m3` (Atlas `hiHalf`, `randTextur`, `spaltSchatten`, `randPolster`).
- **3D:** `mesh3d`, `pose3d`, `skin3d`, `draw3d` (WebGL), `produktForm` (Produktansicht/.glb, misst `g3.umriss`), Physik `cloth3d`, `drape3d`, Stoffe `STOFFE`.
- **Oberteile:** `OT_ARTEN`, `otVorlage`, `otFotoProfil`, `otRueckseite`, `otZeichnen`, `oberteilLive`.
- **Größen:** `bodyMeas`, `sizeGarment`, `sizeVerdict`, `renderSizes`, Maßtabelle `parseSizeText`/`tableDims`.
- **Avatar:** `avatarScanStart` → `avatarScanBild` (24 Winkel) → `avatarDrehStand`/`avatarDrehEnde` → `avatarScanFertig` → `avatarBauen`; Scan-Oberfläche `scanUI`/`scanMini`; Eichung `AV_EICH`.
- **Modus:** `modusSetzen` (`MODUS.kunde`, `localStorage` `passformModus`, Klasse `nurdev`).
- **Speicher:** Hosen `localStorage` `massScanHosen` + `/api/hosen`; Oberteile `passformOberteile`; Avatar `passformAvatar` (nur Zahlen).

## Externe Dienste (keine Schlüssel im Repo; Namen in `.env.example`)
| Dienst | Zweck | Variable |
|---|---|---|
| jsDelivr | MediaPipe Tasks Vision 0.10.18, heic-to, heic2any, Tesseract.js | – |
| storage.googleapis.com | Modelle `pose_landmarker_full/lite.task`, `magic_touch.tflite` | – |
| Netlify (Hosting, Functions, Blobs) | Seite, `/api/holen`, `/api/hosen`, Sammlung | `PASSFORM_TEAMCODE` (Schreibschutz), `HOSEN_DIR`, `HOLEN_LOKAL`, `NODE_USE_ENV_PROXY`, `HTTPS_PROXY` |
| Shopify (App-Proxy, Webhooks) | Anprobe unter `/apps/passform/…` | `SHOPIFY_API_SECRET`, `PASSFORM_DATEN`, `PORT`; `client_id` in `shopify/shopify.app.toml` |
Nur Tests: `NEUEHOSE_BILDER`, `DREH_LOG`, `STOFF_LOG`, `VERGLEICH_LOG`. `npm test` prüft zuerst auf Schlüssel im Repo (`werkzeuge/geheimnis-pruefung.mjs`).

## Starten, Deploy
- Lokal: `node werkzeuge/server.mjs` (Seite + `/api/*`, Sammlung in `.hosen-lokal/`). Kamera braucht https oder localhost.
- Netlify (Live-URL: feste `*.netlify.app`-Adresse im Netlify-Konto des Nutzers): mit GitHub verbunden, `netlify.toml` (publish `app/`, Funktionen `netlify/functions/`, kein Build). **Produktions-Branch: `main`** (Netlify → Site configuration → Build & deploy → Branches). Push/Merge auf `main` → nach etwa 1 min online. Team-Code als Umgebungsvariable `PASSFORM_TEAMCODE`.
- Shopify: Partnerkonto + Entwicklungs-Shop; in `shopify/`: `npm install`, `npx shopify app config link`, Server `server/start.mjs` öffentlich per https (oder `npx shopify app dev` mit Tunnel), `npx shopify app deploy`, App im Shop installieren, Hose dem Produkt zuordnen, App-Block „Passform-Anprobe“ im Theme auf die Produktseite. Noch nie mit echtem Shop getestet.

## Tests
- Alles: `npm install && npx playwright install chromium && npm test` (pretest baut die Testseite `werkzeuge/tests/testseite-mit-simulierter-person.html` aus `app/index.html`; nie von Hand ändern).
- Einzeln: `node werkzeuge/tests/baue-testseite.mjs && node werkzeuge/tests/<test>.mjs`. Commit-Haken `.githooks/pre-commit`: ändert ein Commit die Modellerzeugung, läuft `tneuehose`.
- Kernfunktionen: Upload neue Hose `tneuehose` (Pflicht) · Oberteile `tvorlage`, `toutfit`, `toberteil` · Avatar `tavatar` (Attrappe) und `node werkzeuge/avatar-echtzeit.mjs` (Clip v2-02 als Kamera, echte Erkennung) · Live-Anprobe/Tracking `th`, `tscan`, `tnah`, `tbeine`, `tausblenden`, `tkamera` · Größen `tgroessen`, `tvarianten`, `tpassform` · Speichern `tg`, `tsammlung`, `tspeicher` · Shop/Link `tlink`, `tauswahl`, `tshop` · Modus `tmodus` · Bedienung `tbedienung`.
- Werkzeuge: `hose-render.mjs` (3D-Hose bauen, Studio-Renders, Umrissvergleich, `--gut/--schlecht`), `qualitaet.mjs/.json` (Regeln, guter Stand, Urteile), `avatar-scan.mjs` (Avatar Bild für Bild aus Clips), `avatar-echtzeit.mjs`, `avatar-option-handy.mjs`/`avatar-handy.mjs`/`handy.mjs` (Handy-Emulation), `vergleich.mjs` (Referenzfotos als Kamera), `avatar-eichen.mjs`, `avatar-vergleich.mjs`, `mensch-vergleich.mjs`, `drehung.mjs`, `passform-rechnung.mjs`, `ansichten.mjs`; Python: `koerper_bauen.py`, `hose_querschnitt.py`, Testbild-Erzeuger `test*.py`. Ausgaben nach `werkzeuge/tests/ausgabe/`.
