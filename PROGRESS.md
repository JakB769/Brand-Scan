# PROGRESS – 3D-Hosenmodell verbessern (Branch `3d-modell-verbesserung`)

Lies diese Datei zuerst, wenn die Sitzung neu startet. Kurz halten. Neueste Einträge unten im Log.

## Ziel
Hose deutlich besser: Form, Volumen, Saum, Falten, Dehnung, Bewegung. Referenz: Jakob (1,79 m) in der hellblauen Wide-Leg-Jeans
(`assets/referenz/`), Testhose = dieselbe Jeans flach mit Bankkarte (`assets/referenz/fotos/flach-vorne-hinten/`).
Fertig: alle Posen ≥ 4/5, Rückseite = Rückseiten-Foto, kein Lag, Spagat geht, flüssig in Handy-Emulation, nichts kaputt.

## Plan
0. Setup: Branch, Referenz, Blender, ffmpeg, PROGRESS.md  ✔
1. Vergleichswerkzeug: echte Seite + echte MediaPipe, Kamera = Referenzbild/-video, Hose aus vorne/hinten → `docs/vergleich/<zeit>/`
2. Vorher-Bilder `docs/vorher/` (3D-Ansicht vorne/seite/hinten, Referenzposen)
3. Referenzanalyse (Falten, Saum, Volumen je Pose) → `docs/referenz-analyse/`
4. 3D-Modelle: Blender → .glb, Maße/Topologie/UV/Normal-Maps, Eignung als Basis → `assets/pants/<name>/glb/`, `docs/modelle/`
5. Schleifen: verbessern → rendern → vergleichen → Bewertung (unten) → schlechteste Pose
6. Tracking-Sync, Ausblenden bei unsicherem Tracking (Liegestütz)
7. Handy-Emulation (iPhone, Pixel, CPU-Drosselung, Fake-Video aus Clips)
8. Zweite Hose (Allgemeinheit)
9. Abschluss: `docs/nachher/`, Tests, Doku

## Umgebung
- Blender 5.0.1 als Python-Modul: `/opt/bpyenv/bin/python` (uv-venv, Python 3.11, `pip install bpy`). Headless.
- ffmpeg vorhanden (`/usr/bin/ffmpeg`). 4 CPUs, 15 GB RAM, kein GPU (Chromium mit swiftshader).
- Einzelbilder der Clips (4 fps) im Scratchpad, nicht im Repo (aus den Clips jederzeit neu erzeugbar).

## Entscheidungen
- Referenz liegt unter `assets/referenz/` (vorher `assets/jeans-referenz/`, umbenannt; die Original-ZIPs bleiben unangetastet).
- Flachlage-Fotos: `vorne.jpg`/`hinten.jpg` = Kopien von `material/testbilder/echt/karte_*` (Karteninneres unkenntlich, Neigungsdaten drin).
  Die HEIC-Originale zeigen die Kartennummer lesbar und kommen NICHT ins Repo.
- `Jeans_Denim_Pants.zip` (JEANS.obj) wurde nicht hochgeladen, fehlt. Weiter mit blue-jeans, camo-pants, hosen.

## Lizenzen der 3D-Modelle
(siehe `assets/pants/LIZENZEN.md`, vom Nutzer auszufüllen; in den ZIPs: siehe Abschnitt 4)

## Bewertung je Pose (1–5)
Werkzeug: `node werkzeuge/vergleich.mjs` (Triptychon Original | 3D | gemischt), Farbe: `python3 werkzeuge/python/farbvergleich.py <dir>`.
„–“ = in der Pose nicht zu beurteilen. Spalte Stand: V = Vorher (`docs/vorher/vergleich/`), Zahl = Schleife.

| Pose | Silhouette | Seitenvolumen | Saum | Falten | Dehnung | Rückseite | Stand |
|---|---|---|---|---|---|---|---|
| stehen vorne | 3 | – | 3 | 2 (Knitter der Flachlage wie Schmutz) | 4 | – | V |
| seitlich stehen | 2 (unten zu schmal) | 2 | 2 (am Fuß verknautscht) | 3 | 4 | 3 | V |
| hinten stehen | 3 | – | 3 | 3 | 4 | 4 (Taschen etwas klein/hoch) | V |
| Knie hoch vorne | 1 (gehobenes Bein fehlt) | – | 1 | 2 | 1 | – | V |
| Knie hoch seitlich | 3 | 3 | 3 | 3 | 3 | – | V |
| Hocke vorne | 1 (Bein unter dem Boden, Rechteck) | – | 1 | 1 | 1 | – | V |
| Hocke seitlich | 3 | 3 | 3 | 2 | 3 | 3 | V |
| halbe Hocke vorne | 2 (Schritt hängt) | – | 3 | 2 | 2 | – | V |
| Ausfallschritt (hinten) | 3 | – | 3 | 3 | 3 | 4 | V |
| Bein seitlich | 4 | – | 3 | 3 | 4 | – | V |
| hinten Bein heben | 3 | – | 3 | 3 | 3 | 4 | V |
| Bücken (hinten) | 3 (Bund über dem Shirt) | – | 3 | 3 | 3 | 4 | V |
| Drehung Seite/hinten | 3 | 3 | 3 | 3 | 4 | 4 | V |

Allgemein vorher: Farbe gelblich-grau und im Stand etwa 14 % zu dunkel (Farbton passt, ΔE ≈ 8), Bund über dem Shirt
(Shirt und Jeans beide blau, Schnitt greift nicht), Länge 109 statt etwa 105 cm.

## Log
- Setup: Branch `3d-modell-verbesserung`, Referenz nach `assets/referenz/`, Flachlage nach `fotos/flach-vorne-hinten/`, bpy 5.0.1, ffmpeg.
- Vergleichswerkzeug fertig (echte MediaPipe, Referenzbild als Kamera, Hose aus Flachlage vorne/hinten mit Karte: Länge 109,
  Bund 42, Saum 25 cm). Vorher-Bilder: 16 Posen in `docs/vorher/vergleich/`.
- Schleife 1 (Hocke, Knie hoch): Ursachen gefunden. (1) `legSanity` verwarf Knie über der Hüfte; bei Kamera am Boden ist das
  bei Knie hoch und Hocke normal → Knie gilt, wenn Knöchel desselben Beins sichtbar, unter Hüfte und Knie liegt und der
  Oberschenkel im Bild ≤ 1,3 Rumpflängen ist (gespiegelte Fehlerkennung bleibt verworfen). (2) `bodyYaw`: waagrechte Schulter-/
  Hüftbreite fiel bei gehobenem Arm/Bein (Linie gekippt) → frontal als 0,77 rad gedreht; jetzt Länge der Linie, Mischung zur
  Hälfte mit der breiteren Angabe → 0,06. (3) Tiefe der Beine: Bezug auch erwartete Länge aus der Größe (0,9·0,245·H), sonst
  lagen in der Hocke beide Oberschenkel gleich verkürzt in der Bildebene. (4) `shirtCut` schnitt Oberschenkel vor dem Shirt
  aus (Rechteck in der Hocke, gehobener Oberschenkel weg) → Kapsel um Oberschenkel mit Knie über dem Shirtsaum bleibt.
- Referenzanalyse fertig (`docs/referenz-analyse/spezifikation.md`, `je-bild.md`), Modellanalyse (`docs/modelle/analyse.md`,
  `empfehlung.md`; Lizenzen aller drei Modelle unbekannt → nur interne Referenz, kein Basis-Mesh).
- Schleife 2 (Seitenvolumen, Saum): Umriss-Messung (Personenmaske gegen 3D zwischen Hüfte und Knöchel) über 16 Posen:
  beinTiefe 0,8 → von vorn 10 % zu breit, seitlich 25 % zu schmal. Verlauf 1,0/1,1/1,25 + gerade Rückenlinie bei weiten Hosen:
  vorn 0,97, seitlich 0,78–0,96. Saumring saß 3,7 cm außerhalb des Knöchels (fester Versatz in der Ruhehaltung) → `offR` je
  Zeile mit wirklicher Beinlage: Saum mittig, hinten am Boden (≤ 0,9 cm), vorn auf dem Rist (5,3 cm), Außenkante senkrecht ±2 cm.
- Farbe über alle Posen: ΔE 8, Helligkeit +2,3 L im Mittel (vorn etwas dunkler, hinten heller) → keine globale Änderung.
  Textur weicher (Albedo gemittelt, feines Relief schwächer).
- 3D-Export: ein Bein hatte nach innen zeigende Normalen (Blender schwarz) → behoben, Blender-Renders in `ansichten.mjs`.
- Shirt über dem Bund: Erkennung griff im Stand von vorn nicht (graues Shirt, helle Jeans: Abstand 31 < 45) und lag bei
  gespreiztem Bein 14 cm unter der Hüfte (Hosenfarbe an der Wand gemessen). Jetzt Hosenfarbe auf den Oberschenkeln,
  Schwelle aus dem Rauschen, Saum als stärkste Kante, glatt (±2,5 cm). Erkannt in 15/16 Posen, Schnitt am Shirtsaum.
- Innenseite des Saumumschlags dunkler (Bodenkamera sah von hinten hell hinein).
- Offen: Gesäßtaschen wirken getragen ~1,5× größer als in 3D (stärker gewölbtes echtes Gesäß); Bodenkamera blickt schräg
  nach oben, der Renderer nimmt eine waagrechte Kamera an (Bund/Passe von hinten unten nicht verkürzt).
- Handy-Emulation (`werkzeuge/handy.mjs`, iPhone-13- und Pixel-7-Profil, CPU ×4, Clip v1-02 als Kamera): läuft, Hose liegt
  auf dem Clip (`docs/nachher/handy/`). Bildrate hier 0,6–1,2/s, weil ohne GPU MediaPipe und WebGL in Software laufen (Profil:
  68 % `drawImage`); nicht übertragbar. Reine Formzeit `pose3d` mit der Attrappe: alt 10,8 ms, neu 11,4 ms je Bild (Median,
  ohne Drosselung) → keine Verschlechterung durch diese Sitzung. Echte Handys: muss der Nutzer prüfen.
- Lange Hängefalten am Unterschenkel weiter Hosen (`laengsFaltenCm` 0,7).
- Zweite und dritte Hose (Allgemeinheit): Slim-Jeans `blue-jeans` und grüne Cargo `camo-pants` aus den 3D-Modellen
  orthografisch als Händlerfotos gerendert (`werkzeuge/python/flachbilder.py`), in der App gebaut (sichtbare Bundbreite
  29,4 bzw. 35 cm: getragene Form, nicht flach; mit flacher Bundweite lehnt die App sie zu Recht ab, Länge 139 cm).
  Ergebnis `docs/nachher/zweite-hose/<name>/`: alle 12 Attrappen-Posen stimmig (schmaler Schnitt bleibt schmal, Hocke,
  Knie hoch, Ausfallschritt, Spagat), Blender-Renders der exportierten .glb.

