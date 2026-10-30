# HANDOFF – Passform (Live-Anprobe für Hosen, Shopify-App)

Stand: 30.10.2026 (Avatar-Selbst-Scan in Echtzeit repariert; davor 22.10.: Oberteile, Avatar aus dem Scan, Sitz-Metadaten). Antworten auf Deutsch.

## Repo und Branches
- Repo: https://github.com/JakB769/Brand-Scan
- **Aktuell: `claude/quirky-euler-jp345b`** (22.10. abends, aufbauend auf `3d-modell-verbesserung`). Netlify deployt weiter
  `claude/new-session-fbr0jp` (Stand vorher): zum Live-Stellen diesen Branch dorthin übernehmen (Entscheidung des Nutzers, nicht automatisch).
- `3d-modell-verbesserung` = `claude/new-session-fbr0jp` = Stand vor dem 22.10. abends.
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

Variablen (Namen in `.env.example`, Werte nur im Netlify-Konto bzw. auf dem App-Server):
- `SHOPIFY_API_SECRET`: Secret der Shopify-App (Proxy-Signatur, Webhooks prüfen). Pflicht für den Shop-Server.
- `PASSFORM_DATEN`: Ordner für Hosen je Shop/Produkt (Standard `shopify/server/daten/`). `PORT`: Port des Shop-Servers (Standard 8081).
- `PASSFORM_TEAMCODE`: optionaler Code zum Schreiben/Löschen in `/api/hosen`.
- `HOSEN_DIR`: lokaler Ordner statt Netlify Blobs (setzt `werkzeuge/server.mjs` auf `.hosen-lokal/`).
- `HOLEN_LOKAL=1`: `/api/holen` darf lokale Adressen holen (nur Tests). `NODE_USE_ENV_PROXY=1` + `HTTPS_PROXY`: hinter einem Proxy.
- Nur Tests/Werkzeuge: `NEUEHOSE_BILDER` (Bildordner tneuehose), `DREH_LOG`, `STOFF_LOG`, `VERGLEICH_LOG` (mehr Ausgabe).

Nicht im Repo (absichtlich): `node_modules/`, Testausgaben und Modell-Cache `werkzeuge/tests/ausgabe/` (KI-Modelle werden von Google nachgeladen), `.hosen-lokal/` (nur von Tests erzeugte „Hose N“), `assets/pants/*/entpackt/` (Inhalt der ZIPs im Repo), Original-Kartenfotos `IMG_7267/7268.HEIC` (Kartennummer lesbar; im Repo nur unkenntlich gemacht als `material/testbilder/echt/karte_*.jpg`).

## Architektur (alles in `app/index.html`, Funktionsnamen; Details `doku/code-karte.md`)
- **Kamera/Scan**: `startCamera`, `openStream`; `analyse(res)` je Bild (Glätten, Maßstab, Messwerte, Coaching). Start-Anweisung + `ganzGrund` („Weiter zurück · Füße nicht sichtbar“), Scan nach 0,5 s Ruhe (`HOLD_MS`, `scanMedian`). Vor Scan-Ende nichts zeichnen (`zeigen`, Klasse `vorscan`).
- **Tracking**: MediaPipe Pose + Segmentierungsmaske; `emaV` (Messwerte ruhig), `jv` (Hose schnell), `legSanity`, `legHinge`, `scaleLim`, `bodyYaw`, `torsoRoll`, `trackSure` (ausblenden: Hüftbeugung > 45°, Liegen, Sprünge).
- **Hose aus Fotos (Generator)**: `upAdd`/`classifyFlat`/`upBuild` (Dateien hochladen, Vorder-/Rückseite per Gesäßtaschen `sideCheck`) → `buildGarment` → `loadGarmentPhoto`/`photoWithReference` (Bankkarte/A4 als Maßstab: `findReference`, `refineReference`, `askCorners`, Neigung `levelBySensor`) → `segGarment` (Farbe `segClassic` + KI `aiMask`, `fuseMasks`, `bodenImSpalt`) → `garmentProfile`/`normalizeProfile` → Modell `G.m3` (Atlas, Breitenprofil).
- **3D-Hose**: `mesh3d`, `pose3d`, `skin3d` (Rig Hüfte/Knie), `draw3d` (WebGL), `drawGarment` (Live-Overlay), `shadow3d`, `rim3d`.
- **Physik**: `cloth3d` (Federn zur Form, Nachschwingen), `drape3d`/`drapeFor` (Fall, Stauchen am Schuh), `STOFFE`/`stoffVon` (Stoffart).
- **Eigenes Oberteil der Person (2D)**: `shirtHem` (Saumkante in der Personenmaske), `shirtCut` (Hose darüber weg).
- **Oberteile als Vorlagen (22.10.)**: Metadaten je Art `OT_ARTEN` (T-Shirt, Langarm, Trägertop: Saumbereich zwischen zwei Körperhöhen
  `otHoehen`, Ärmelende als Anteil des Arms, Ausschnitt, Weite je Zone). `otVorlage` baut die Vorlage auf dem Körper (Avatar oder
  Standardkörper `otKoerper`): Rumpf-Ringe aus dem 0,6 cm aufgeblasenen Körperquerschnitt (`otRing`, Schulterkappe, Schlüsselbein
  zählt zum Rumpf), unter der Brust fällt der Stoff gerade, Ärmel-Ringe entlang Schulter → Ellbogen → Handgelenk (`otArmRing`), Träger
  als Band über die Schulter (`otSchnittX`), Gewichte vom nächsten Körperpunkt (`otGewichte`). Foto: `otFotoProfil` (Rumpfkanten,
  Achsel, Schulter, Ärmel-Ecken, Art, Hose erkannt), `otLoecherZu` (Aufdruck reißt kein Loch), `otAtlasHaelfte` (Atlas 1024², Rand
  mit Stofffarbe), `otRueckseite` (fehlende/unpassende Rückseite per Textursynthese aus ruhigen Stoffstellen der Vorderseite),
  `otUV` (Bogenlänge vorn/hinten, Höhe über 4 Anker Saum/Achsel/Schulter/Hals). Maße `otMasse` (Maßtabelle `otTabelle` > eingetragen >
  Foto), Urteil je Zone `otUrteil`. Darstellung `otZeichnen` (eigener Shader `VSO/FSO`, gleicher Tiefenpuffer), Körper darunter
  ausgeblendet (`otBand`, Uniform `oben`), ohne Hose Slip (`slip`); 3D-Ansicht `figurOhneHose`, Live `oberteilLive` (Haltung aus den
  Armpunkten, Skinning, Körper nur als Tiefe `koerperTiefe`). Speicher `passformOberteile` (localStorage).
- **Unterteile je Art (22.10.)**: `UNTEN_ARTEN`/`unterArt` (Hose, Shorts, Rock: Saumbereich als Anteil der Größe), Chips `#g-kat`;
  nur geschätzte Längen werden begrenzt (`garmentDims`), Rock nie bis zum Boden.
- **Größen**: `bodyMeas` (Maßband > Avatar > Scan), `sizeGarment`, `sizeVerdict`, `sizeAll`, `renderSizes`, `autoSizes`, `parseSizeText`/`tableDims` (Maßtabelle, OCR).
- **Avatar**: `avatarScanStart` → `avatarScanBild` (Drehung, 24 Winkelfächer, Taille/Hüfte/Brust) → `avatarScanZiele` → `avatarAnpassen`
  → `avatarBauen` (MakeHuman-Körper v2 aus `app/avatar/koerper.js`, Erzeuger `werkzeuge/python/koerper_bauen.py`: 17 Regler, Gelenke
  inkl. Ellbogen/Handgelenk/Kopf, Skelett-Gewichte in 16 Gruppen) → `avatarPose`/3D-Ansicht `view3dFrame`; Farben `avatarFarbProbe`.
  Frontal-Scan misst dazu Arme (`armMasse`, `limbWidth`: Oberarm, Unterarm, Breite des nackten Unterarms) und Brust. Eichung
  Scan ↔ Körpermodell `AV_EICH` (aus `werkzeuge/avatar-eichen.mjs`). Weite Kleidung (`avatarLose`): Umriss nur Obergrenze.
  Haltung: `avatarKnochen` (Richtungen je Knochen) + `avatarHaltung` (Linear Blend Skinning, für Körper und Oberteile).
- **Speicherung**: Hosen in `localStorage` (`massScanHosen`, `saveOwn`/`loadOwn`) + Server-Sammlung `/api/hosen` (Netlify Blobs) + `hosen.json` neben der Seite (optional). Avatar nur als Zahlen in `localStorage` (`passformAvatar`), keine Bilder.
- **Produkt-Auswahl**: `app/hosen-auswahl.js`: `<passform-hosen>` (nur Hosen, Shop-Block) und `<passform-produkte>` (Outfit: Oberteile und
  Hosen/Röcke je eine Reihe, Ereignis `produkt-gewaehlt`; in der Seite `#avHosen`). Daten per `quelle`-Adresse oder `.produkte` (Feld `typ`).
- **Server**: `netlify/functions/holen.mjs`, `netlify/functions/hosen.mjs`, `werkzeuge/server.mjs` (lokal), `shopify/server/start.mjs` (+ `signatur.mjs`, `grenze.mjs`, `hose-ablegen.mjs`), App-Block `shopify/extensions/passform-anprobe/`.

## Was gut funktioniert
- Kern-Tests 22.10. mit Renders und Werten: `docs/tests/README.md`.
- Neue Hose aus 2 flachen Fotos mit Bankkarte: zwei getrennte Beine, Tiefe 62 % der Breite, Rückseite aus Rückenfoto, Rig + Stoffphysik aktiv (`tneuehose` grün; Renders `docs/test-neue-hose/`). Länge 106,4 cm (Maßband 105) seit der Parallaxe-Korrektur (`PASSFORM.stoffHoehe`).
- Oberteile aus 2 Fotos (oder nur vorne): Art erkannt, 3D am Avatar/Standardkörper und live, Größen aus Maßtabelle (`tvorlage`, `toutfit`).
- Avatar aus dem Referenzclip v2-02 unterscheidet sich vom Standardkörper (Brust −7,6, Taille −4,8, Hüfte −5,6, Schultern −2,7 cm; `werkzeuge/avatar-vergleich.mjs`).
- Karte automatisch auf beiden Fotos, Fotos ohne Karte bekommen keine falsche Karte (`tersatzkarte`).
- Live-Scan in ca. 1–2 s, ruhiges Tracking, Ausblenden statt Fehldarstellung, T-Shirt-Kante ohne Flackern.
- Größenempfehlung je Zone, Größenwechsel im 3D; Avatar-Ablauf auf iPhone-13-/Pixel-7-Emulation (`docs/test-avatar/`).
- Testreihe: 43 von 45 grün (Gesamtlauf 19.10.).

## Kaputt / offen
- **Avatar-Selbst-Scan in Echtzeit (30.10., `werkzeuge/avatar-echtzeit.mjs`)**: Mit Referenzclip als Kamera in Echtzeit wurde der
  Frontal-Scan teils nie fertig (weite Hose: „Bein angewinkelt“, Schwanken > 3,2 cm). Jetzt im Avatar-Modus: leicht gebeugte Beine
  erlaubt, Schwanken bis 7 cm, nach 8 s ganz im Bild Scan mit dem Median dieser Bilder (`AVS.voll`). Weite Kleidung auch ohne Knie
  erkannt (`avatarLoseArme`: Taille und Hüfte viel breiter als der Durchschnitt, Unterarm nicht). Avatar geht auch ohne Hose
  (vorher „zuerst eine Hose anlegen“). Unter der Ansicht steht, was der Scan verändert hat (`avatarUnterschied`). Körpermodell wird
  auch als `koerper.js` direkt neben der Seite gefunden (flach hochgeladen). Netlify zeigt diese Stände erst, wenn sie auf dem
  dort verbundenen Branch liegen.
- **Avatar-Scan**: in weiter Kleidung bestimmen Längen, Schultern und Arme die Form, Umfänge sind dann nur nach oben begrenzt (nicht gemessen).
  Eichung an gerenderten Körpern, nicht an echten Personen; Brust von vorn unzuverlässig (Arme liegen an). Kamera am Boden streckt die
  Beine (begrenzt); Fußfarbe oft nicht bestimmbar. Mit echten Personen gegen Maßband prüfen.
- Oberteile: nur an künstlichen Testbildern geprüft (`material/testbilder/oberteile/`, `werkzeuge/python/testoberteile.py`); echte Fotos,
  Hemden mit Knopfleiste, Hoodies (Kapuze), Kleider fehlen. Ärmel nur als Rohr (keine Falten), live ohne Stoffphysik (nur Skinning).
  Kragen leicht ausgefranst. Größe ohne Maßtabelle/Maßstab geschätzt (Brust = Körper + Weite der Art).
- Rückseite „per Bild-KI“: umgesetzt als Textursynthese (Image Quilting) im Browser, keine generative KI (bräuchte Dienst und Schlüssel).
- `tlag` rot: Testmaschine nur 6 statt 10 Bilder/s (auch auf altem Stand rot), nicht gelockert.
- Safari/echtes iPhone nicht testbar; Bildrate am Gerät nicht gemessen. Emulation (iPhone 13, CPU 4×, `docs/tests/README.md`):
  Oberteil kostet je Bild ≈ 5 ms JavaScript, die Hose 31 ms; Grafik dort in Software (nicht aussagekräftig). Frontal-Scan wird in der
  Emulation nicht fertig (auch auf dem alten Stand).
- Vorschaubilder der Hosen-Auswahl zeigen bei manchen Hosen Boden zwischen den Beinen (Foto, nicht 3D).

## Halb fertig
- Shopify: Gerüst + Tests stehen; fehlt: echter Entwicklungs-Shop, Händler-Seite im Admin, Abo/Billing (Preise 39/99/249 €/Monat, `doku/pitch-plan.md`).
- 3D-Oberteile: Vorlagen stehen (T-Shirt, Langarm, Top); fehlen Hoodie/Hemd/Kleid, Maßstab (Karte) für Oberteile, Shop-Link für Oberteile.
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
- 22.10. abends (Auftrag „Manus-Version übernehmen, Vorlagen-Ansatz“):
  - **Manus-Version nicht auffindbar**: im Prompt nur ein Platzhalter, in keinem Branch und keinem Repo des Kontos. Avatar-Bereich
    und Oberteile darum selbst gebaut. Liegt sie irgendwo, Pfad nennen; dann vergleichen, ohne die Modellqualität zu verlieren.
  - **Vorlagen aus dem Körpermodell** (MakeHuman CC0, Lizenz frei) statt `assets/pants/` (Lizenz unklar) oder gekauften Modellen.
    Hosen/Shorts/Röcke bleiben auf dem bewährten Hosen-Modell `G.m3` (parametrische Vorlage: Ringe, Rig Hüfte/Knie, Fotos als Textur,
    Maße skalieren) mit Metadaten je Art; neu als Vorlage gebaut sind die Oberteile. So bleibt die Qualität der Hosen erhalten.
  - **Rückseite ohne Foto**: Textursynthese (Image Quilting) aus ruhigen Stoffstellen der Vorderseite, im Browser, ohne Dienst.
  - **Weite Kleidung beim Scan**: Umriss ist nur Obergrenze; ein schwacher Zug „Umriss minus Weite“ machte schlanke Personen schwerer.
  - **Eichung Scan ↔ Körpermodell an gerenderten Körpern** (`werkzeuge/avatar-eichen.mjs`): Erkennung setzt Schulter-, Hüft- und
    Handgelenkpunkte anders als das Skelett; feste Faktoren je Maß mit gemessener Streuung als Gewicht.
  - **Shirt über der Hose**: Oberteil vor den Verdeckern der Hose zeichnen, unter dem Bund per Tiefenversatz vorn (sonst stanzt
    der Rumpf-Verdecker der Hose Löcher in den Rücken des Shirts).

## Testdateien und Referenzen
- Tests: `werkzeuge/tests/t*.mjs` (Liste und Inhalt `doku/testen.md`); Attrappe `werkzeuge/tests/attrappe.js` (Steuerung `window.__mode`).
- Pflicht-Test neue Hose: `werkzeuge/tests/tneuehose.mjs` mit `assets/referenz/fotos/flach-vorne-hinten/vorne.jpg`, `hinten.jpg` (Maßband 105 cm, W32).
- Kern-Tests 22.10. (`docs/tests/README.md`): `tneuehose` (1), `toutfit.mjs` (2: T-Shirt + Shorts, Top + Rock), `avatar-scan.mjs` +
  `avatar-vergleich.mjs` (3), `handy.mjs --oberteil` (4). Dazu `tvorlage.mjs` (Oberteile: Art, Rückseite, Größen, live).
- Testbilder Oberteile/Shorts: `material/testbilder/oberteile/`, `material/testbilder/shorts/` (künstlich, `werkzeuge/python/testoberteile.py`, `testshorts.py`).
- Avatar: `werkzeuge/tests/tavatar.mjs`, `werkzeuge/avatar-option-handy.mjs` (iPhone 13/Pixel 7), `werkzeuge/avatar-scan.mjs` mit Clips `assets/referenz/videos/clips/v2-02_drehung-360.mp4`, `v1-04_drehen-seite-hinten.mp4` (Jakob 1,79 m).
- Echte Kamera mit Foto: `werkzeuge/pruefstand.mjs` (braucht ffmpeg); Vergleich gegen Referenz: `werkzeuge/vergleich.mjs` + `werkzeuge/vergleich-liste.json`.
- Testbilder: `material/produktfotos/` (Bershka front/back), `material/testbilder/` (Freistellung, Maßstab, echt, Rock, getragen).
- Referenzen: `assets/referenz/README.md`, Spezifikation `docs/referenz-analyse/spezifikation.md`.
- Archiv (nicht mehr pflegen): `PROGRESS.md`, `doku/verlauf.md`, `doku/chatverlauf.md`, `doku/code-karte.md` (Nachschlagen).
