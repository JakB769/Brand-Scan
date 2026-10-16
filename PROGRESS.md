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

| stehen vorne | 4 | – | 4 (1–2 Wülste, vorn auf dem Rist) | 3 | 4 | – | N |
| seitlich stehen | 3 (unten noch ~20 % zu schmal) | 3 | 3 | 3 | 4 | 4 | N |
| hinten stehen | 4 | – | 3 (Bodenkamera sieht hinten unter den Saum) | 3 | 4 | 4 (Taschen kleiner als getragen) | N |
| Knie hoch vorne | 3 (beide Beine da, Oberschenkel zur Kamera) | – | 3 | 3 | 3 | – | N |
| Knie hoch seitlich (Einzelbild steht) | 4 | 3 | 4 | 3 | 4 | – | N |
| Hocke vorne | 4 | – | 3 | 3 | 3 | – | N |
| Hocke seitlich | 4 | 3 | 3 | 3 | 3 | 4 | N |
| halbe Hocke vorne | 3 | – | 3 | 2 (Lappen am Oberschenkel oben) | 3 | – | N |
| Ausfallschritt (hinten) | 4 | – | 3 | 3 | 4 | 4 | N |
| Bein seitlich | 4 | – | 4 | 3 | 4 | – | N |
| hinten Bein heben | 4 | – | 3 | 3 | 4 | 4 | N |
| Bücken (hinten) | 4 (Bund unter dem Shirt) | – | 3 | 3 | 4 | 4 | N |
| Drehung Seite/hinten | 4 | 4 | 3 | 3 | 4 | 4 | N |
| Attrappe: Ausfallschritt, Spagat seitlich/längs, Liegestütz (aus) | 4 | – | – | – | 4 | – | N (`tposen`) |

Stand 14.10. abends (nach Maßstab-Untergrenze), nur geänderte Posen:

| Pose | Silhouette | Seitenvolumen | Saum | Falten | Dehnung | Rückseite | Stand |
|---|---|---|---|---|---|---|---|
| seitlich stehen | 4 (Breite 0,81 → 0,97) | 4 | 3 (Vorderkante folgt noch dem Schienbein) | 3 | 4 | 4 | N2 |
| Knie hoch vorne | 3 (Unterschenkel 4 cm neben dem echten) | – | 4 (am Knöchel statt 16 cm darunter) | 3 | 4 | – | N2 |
| Hocke vorne | 4 (Größe stimmt, Breite 0,71 → 0,89) | – | 3 | 3 | 4 | – | N2 |
| Hocke seitlich | 4 (Unterschenkel jetzt da, vorher fehlten sie) | 4 | 4 | 3 (Gesäß hängt etwas) | 4 | 4 | N2 |
| halbe Hocke vorne | 4 (kein Lappen, Schritt da) | – | 3 (unten etwas breit) | 3 | 4 | – | N2 |
| Ausfallschritt (hinten) | 4 | – | 4 | 3 | 4 | 4 | N2 |
| Bücken (hinten) | 4 (vorher Beine wie Strümpfe) | – | 4 | 3 | 4 | 4 | N2 |

N = nachher (`docs/nachher/vergleich/`, Übersicht `docs/nachher/vorher-nachher_*.jpg`). Umriss-Messung (Mittel 16 Posen):
Überlappung 0,692 → 0,697, Breite 3D/echt von vorn 1,10 → 0,98, seitlich 0,75 → 0,81 (Drehung hinten 0,92 → 0,99).

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
- Breite Hocke schräg (Attrappe `hockeBreit`): Saum hing 5 cm unter dem Knöchel, weil der vordere Fuß nach der
  Tiefenkorrektur als gehoben galt → „Fuß angehoben“ auch im Bild prüfen (`P.boneImg`). Saum jetzt am Knöchel.
- Rückschritt aus Schleife 2 gefunden (`thosen`): Querschnitt-Verlauf hing an der Stelle am Bein, eine kürzere Hose wurde am
  Saum 4 % breiter → Verlauf an der Stelle in der Hose (`lpG`). Volle Testreihe danach grün.
- Maßstab (größter Hebel nach dem Abschluss): in Hocke/Bücken/Ausfallschritt war die Hose 30–50 % zu klein (Rumpf zur
  Kamera geneigt, Körperhöhe im Bild nicht die Größe). Untergrenze aus Segmenten, Körperhöhe nur gerade und senkrecht,
  Prüfung durch vier unabhängige Prüfer. Umriss über 14 Referenzposen: Überlappung 0,714 → 0,768, Breitenfehler 0,19 → 0,11 (Lauf schwankt je Pose um bis zu ±0,1).
  Hocke seitlich 0,38 → 0,61 (Unterschenkel jetzt da), Bücken 0,64 → 0,79, Ausfallschritt 0,66 → 0,79, Knie hoch vorn 0,49 → 0,60.
- Weite Hosen von der Seite: Vorderkante gerade vom Knie bis auf den Fuß (seitlich stehen 0,85 → 0,88).
- Gehobenes Bein: Saum am Knöchel statt 16 cm darunter. Shirt-Saum in der Hocke über der Hüfte (Schritt nicht mehr weggeschnitten).
- Vergleichswerkzeug: Hosenbau unter Last stabil, Maßstab und Ringlage je Pose. Wechsel Foto ↔ Clip setzt Gelerntes zurück (andere Kamera; am Foto lernte die Seite sonst 36 cm Unterschenkel). Der Scan lässt sich mit den Referenzclips
  nicht abschließen (Kopf am Bildrand), die Seite bleibt dort in der Scan-Phase.

## Abschluss (Stand 14.10. mittags; danach geht der Feinschliff weiter, siehe Log)

**Vorher/Nachher:** `docs/vorher/` (16 Referenzposen, Ansichten des Stands vor der Sitzung, Blender-Renders) gegen
`docs/nachher/` (dieselben Posen, Ansichten, Renders, zweite Hose, Handy-Emulation). Übersicht je Pose:
`docs/nachher/vorher-nachher_1.jpg` … `_4.jpg` (Original | vorher | nachher).

**Was sich geändert hat (App):**
- Beine bei Kamera am Boden: Knie über der Hüfte gilt (Hocke, Knie hoch), gekippte Schulter-/Hüftlinie ist keine Drehung,
  Tiefe der Beine mit gelernter Bein-Länge, Oberschenkel nach hinten nur bei unsicherer Tiefe gespiegelt (Ausfallschritt,
  Spagat), Oberschenkel vor dem Shirt werden nicht ausgeschnitten.
- Hose bei unsicherer Erkennung ausgeblendet (Liegestütz), weich wieder eingeblendet.
- Form: Bein-Querschnitt als Verlauf (tiefer als breit), gerade Rückenlinie bei weiten Hosen, Außenkante senkrecht, Saum
  mittig über dem Knöchel, hinten am Boden, vorn auf dem Rist.
- Falten: am Saum 1–2 große Wülste statt 4–5 Ringe, lange Hängefalten am Unterschenkel weiter Hosen; Textur weicher.
- Shirt über dem Bund auch bei ähnlichen Farben (15/16 Posen).
- 3D-Export: Normalen nach außen (vorher ein Bein schwarz in Blender).

**Übernommene Techniken und Modelle:** Proportionen (Tiefe/Breite der Beine) aus der Analyse der drei 3D-Modelle
(`docs/modelle/empfehlung.md`); keines als Basis-Mesh übernommen (Lizenz unbekannt, Passform fest, keine Rigs). Zielwerte aus
der Referenzanalyse (`docs/referenz-analyse/spezifikation.md`). Draco/Meshopt/KTX2 nicht eingesetzt: das Live-Modell wird im
Browser erzeugt (nichts zum Komprimieren außer dem Atlas, ~100 KB JPEG); nur die .glb für Shopify (440 KB) käme in Frage.

**Werkzeuge:** `werkzeuge/vergleich.mjs` (+ `vergleich_tabelle.py`, `farbvergleich.py`, `vorher_nachher.py`),
`werkzeuge/ansichten.mjs`, `werkzeuge/handy.mjs`, `werkzeuge/python/render_glb.py`, `flachbilder.py`; Test `tposen`.

**Fertig-Kriterien:** Rückseite zeigt das Rückenfoto (ja, Taschen sichtbar). Kein sichtbarer Nachlauf (`tlag`: 10–30 ms).
Spagat geht (Attrappe, seitlich und längs von der Seite; längs genau von vorn ist eine Grenzlage). Handy-Emulation läuft,
die Bildrate ist hier ohne GPU nicht messbar. Bestehendes: volle Testreihe grün (Abschnitt Log). **Nicht erreicht:** alle
Posen ≥ 4/5 (Seitenansicht 3, halbe Hocke 2–3, Knie hoch von vorn 3).

**Offen / nächste Schritte:**
1. Seitenansicht unten noch ~20 % schmaler als echt; halbe Hocke: Lappen oben am Oberschenkel (Leistenfalte bei seitlich
   gehobenem Oberschenkel); Knie hoch von vorn: Oberschenkel zur Kamera zu dunkel/zu flach.
2. Bodenkamera blickt schräg nach oben, der Renderer nimmt eine waagrechte Kamera an (Bund/Passe von hinten unten).
3. Gesäßtaschen wirken getragen ~1,5× größer als in 3D.
4. Zugfalten (Schritt → gehobenes Knie, Diagonalfalten im Ausfallschritt) fehlen, nur Stauch- und Hängefalten.
5. Echte Handys (Safari, Pixel) prüfen; Bildrate am Gerät messen (`PERF`).
6. Lizenzen der drei 3D-Modelle in `assets/pants/LIZENZEN.md` eintragen (Quelle unbekannt).


## Sitzung 15.10. (Auftrag: Ausblenden, Drehung, Ferse, Modellqualität, Größen)

Branch weiter `3d-modell-verbesserung` (dort liegt der ganze Stand; vom Nutzer früher so festgelegt).

### Entscheidungen
- Hüftbeugung wird **gegen die Senkrechte** gemessen, nicht gegen den Rumpf: „Oberschenkel nach vorne heben“. Bücken mit
  senkrechten Oberschenkeln bleibt sichtbar; Bücken mit gebeugten Knien (Oberschenkel über 45° vor) wird ausgeblendet.
  Zeigt der Oberschenkel bei gestrecktem Knie deutlich mehr zur Seite als nach vorn (seitlicher Spagat, Bein zur Seite),
  zählt nur der Vorwärtsanteil; mit gebeugtem Knie (breite Hocke, Sumo-Hocke, Pferdestand) bleibt es Beugung, aus.
- Grenzen mit Hysterese: Beugung aus über 46°, an unter 39° (von vorn liest die Seite 45° als 41–42°, seitlich als 44°:
  ausgeblendet wird ab etwa 46–50°). Rumpf aus über 55°, an unter 45°.
- Hocke, halbe Hocke, Ausfallschritt und Längsspagat (vorderes Bein 90°) werden damit **ausgeblendet** (gewollt: „lieber
  ausblenden als schlecht aussehen“). Seitlicher Spagat und Bein zur Seite bleiben sichtbar (Abspreizen ist keine Beugung).
- Rückwärts gestrecktes Bein (Bein nach hinten heben) zählt nicht als Beugung.
- Attrappe: „Knie hoch“ (`knee:1`, `kneeWave`) hebt seit heute 40° statt 61°, damit Tests die sichtbare Hose messen.

### 1. Ausblenden
- `trackSure`: Gründe Beugung, gekippt, liegt, verdeckt, Sprung (zweimal in 0,4 s), verzerrtes Netz (`g3.verz`); aus nach
  100 ms in 0,2 s, an nach 350 ms in 0,3 s.
- Gefunden und behoben: `legCm` lernte auch bei gehobenem Bein (verkürzter Oberschenkel 43,6 → 40,5 cm), die Beugung wurde
  dadurch unterschätzt. Lernt jetzt nur bei gleich langen Beinen, danach langsamer.
- Test `tausblenden` (Attrappe): 0/30/45° links und rechts, vorn und seitlich, mit Knie 95°: sichtbar, ruhig. 60°: aus.
  41↔55° seitlich pendelnd: genau ein Wechsel, bleibt aus. Seitlicher Spagat von vorn: sichtbar. Hocke, breite Hocke,
  Sumo-Hocke: aus. Liegend mit verdeckter ferner Schulter: bleibt aus. Ein einzelner Sprung: erkannt, Hose bleibt. Liegestütz, Hinlegen, Aufstehen, schlecht erkannte Hüfte, zappelnde Erkennung: richtig.
- Referenzclips (echte Erkennung): Kniehub, Hocke vorn/seitlich, halbe Hocke, Bücken mit gebeugten Knien → aus;
  Stehen, Drehen, Ausfallschritt von hinten, Bein zur Seite, Bein nach hinten → sichtbar.

### 3. Ferse
- Ursache 1: Die Maske des Flachfotos nimmt den Boden zwischen den Beinen mit, Innennaht und Saum lagen im Stoffbild genau an
  dieser Kante und zogen Bodenfarbe in die Hose. → `fillLegGap` (Spalt mit Stofffarbe, unter dem Saum letzte Zeile fortsetzen).
- Ursache 2: Der Stoffstapel hinten an der Ferse war hell beleuchtet (heller Saum im Foto) und hatte fast die Farbe des
  Bodens. → Kontaktschatten an den untersten 10 cm (hinten stärker), je Bein nur mit Bodenkontakt und nur bei Hosen bis
  zum Boden (nicht am gehobenen Bein, nicht bei Shorts und Röcken).
- Dazu: Fuß-Verdecker von der Ferse bis zu den Zehen (vorher kleine Kapsel); sonst sah man durch den schrägen Saum die
  Innenseite als dunkles Band.
- Geprüft: keine Löcher im Netz (Test `tferse`: 8 Lagen, 0 eingeschlossene durchsichtige Pixel), Referenz von hinten/seitlich.

### 2. Drehung
- Ursache des Hüpfens (Referenzclip `v2-02_drehung-360`, Bild für Bild mit `werkzeuge/drehung.mjs`): seitlich stehend blieb
  der Höhenunterschied der Schulter- und Hüftpunkte als Breite stehen (Ausgleich für gehobene Schulter/Bein). Die Drehung
  hing bei etwa 67° fest und sprang beim Kreuzen der Punkte in wenigen Bildern auf 107°. Jetzt zählt der Höhenunterschied
  nur, solange die Linie waagrecht noch breit ist.
- Glättung als Alpha-Beta-Filter (Lage und Drehgeschwindigkeit) statt reinem Nachlauf: dreht man sich gleichmäßig, läuft die
  Hose ohne Verzögerung mit; Ausreißer werden verteilt. Ruhezone hinten weicher (die alte verdoppelte dort das Rauschen).
- Vorne/hinten: im Clip immer richtig (0 Bilder über 60° daneben), von hinten zeigt die Hose die Rückseite.
- Ergebnis (nach dem Frontal-Scan, wie bei echter Nutzung; Stand nach der Nachprüfung), vorher → nachher: Verzögerung zur
  Rohschätzung 54 → 44 ms, Ruck 14,3 → 7,9 mrad/Bild², größter Schritt 0,20 → 0,16 rad (beim Durchgang durch 180°), Schritte
  über 0,15 rad 2 → 1. Zweiter Clip `v1-04_drehen-seite-hinten`: Verzögerung 62 → 36 ms, Ruck 14,3 → 10,1, größter Schritt
  0,24 → 0,13 rad, Schritte über 0,15 rad 5 → 0. Bei gleichmäßiger Drehung läuft die Hose 23 ms nach (vorher etwa 90 ms). Verläufe: `docs/vergleich/drehung_*.png`.
- Maßstab nicht angefasst: Die Größensprünge beim Drehen im Werkzeug (bis 20 % je Bild) kamen nur vom fehlenden Scan.
  Ein weicheres Wiederkommen der Untergrenze (zwischendurch eingebaut) machte den Saum beim Kniehub träger (`tlag`
  Ausschlag 82 → 65 %) und ist wieder raus.
- Entscheidung: Die Drehung der Hose bleibt aus Breiten (Schulter, Hüfte) und Richtung (Füße, Nase, Tiefe). Frontal liest
  die Breite oft 10–15° Drehung, darum bleibt vorn die Ruhezone wie bisher.
- Werkzeug-Fehler gefunden: `drehung.mjs` zählte die Analysen nicht (wartete je Bild bis zur Zeitgrenze) und ohne Scan blieb
  die Seite in der Scan-Phase (dort Maßstab aus der Körperhöhe ungeglättet: Größensprünge bis 20 %, die es bei echter
  Nutzung nicht gibt). Beides behoben.

### 4. Modellqualität
- Textur: vermessen wird wie bisher im 900-Punkte-Foto, die Textur bekommt die Einzelheiten aus demselben Foto groß (bis
  2000 Punkte, bei Karte das entzerrte 2400er-Bild). Atlas 1024 × 1024 statt 640 × 640 (Bearbeitungen wie gefüllter Spalt,
  Gürtel, geschätzte Rückseite bleiben, dort kommt kein Detail dazu).
- Relief (Normalen aus dem Foto) einmal beim Laden vorberechnet als zweite Textur mit Mipmaps: im Shader 3 statt 10
  Texturzugriffe je Bildpunkt (schneller am Handy), aus der Nähe fein, von weitem ruhig.
- LOD: Stoff überall 1024 (nur dauerhaft langsame Geräte 512), Relief am Handy 512; Desktop mit anisotroper Filterung (8×,
  Handy 2×); immer Mipmaps.
- Netz nicht feiner: 1 cm je Zeile und 15° je Segment weichen auch in der Nahphase unter 2 Bildpunkte von der runden Form
  ab; ein feineres Netz würde den Stoff-Fall (PBD) verändern, der laut Auftrag bleiben soll. **Offen**, falls gewünscht:
  nur zum Zeichnen unterteilen (Physik bleibt).
- Speicher: Stoffbild ≈ 230 KB (vorher ≈ 90 KB), Hose gesamt ≈ 330 KB. Server-Sammlung und Shopify (Datei je Produkt)
  vertragen das; im Browser-Speicher passen etwa 15 Hosen (danach nur noch auf dem Server).
- Vorher/Nachher: `docs/vergleich/textur_vorher_nachher.jpg` (Nahansicht vorne/hinten/seitlich, Ausschnitt 1:1),
  `docs/vergleich/ansichten_vorher.jpg`/`_nachher.jpg` (alle Posen). Nachher sind Nähte, Taschen und Waschung scharf.

### 5. Passform und Größen
- Je Größe und Zone (Bund, Hüfte, Oberschenkel, Knie) das Spiel Hose − Körper gegen die nötige Bewegungszugabe und das
  höchste Spiel je Schnitt; Länge: wo der Saum im Stand endet gegen das Ziel des Schnitts. Werte (cm):

  | Zone | nötig ohne Stretch | nötig mit Stretch | höchstens Skinny / Regular / Wide-Leg |
  |---|---|---|---|
  | Bund (an den Hüftknochen) | −1 | −3 | 6 / 6 / 7 |
  | Hüfte | +2 | −4 | 8 / 12 / 24 |
  | Oberschenkel | +3 | −3 | 9 / 15 / – |
  | Knie | +4 | −1 | 9 / 18 / – |
  | Länge (Saum gegen Boden) | Ziel Skinny −2 (−5…+3), Regular +1 (−2…+4), Wide-Leg +3 (−1…+7) | | |

- Entscheidungen: Schnitt aus der Hose selbst (Knie/Hüfte < 0,40 Skinny, < 0,49 Regular, sonst Wide-Leg). Stretch aus
  Material/Stoffart; ohne Angabe nur bei Skinny angenommen. Ohne Scan und Maßband gelten Körpermaße aus der Größe
  (Taille 0,46 × Größe, Hüfte 0,535 × Größe; grob, so angezeigt). Ein gespeicherter Scan gilt nur für dieselbe Körpergröße
  (sonst bekam Fabian Jakobs Maße). Hose ohne Größenangabe mit Maßstab im Foto: Weiten um die gemessene hochgerechnet
  (W = Bundumfang in Zoll − 1, wie in der Konfektion), die gemessene echt, die anderen „≈ geschätzt“.
- Größenwechsel im 3D: Bund, Länge und Saum der Größe gehen in die Hose (Test: L ist breiter, Saum 2 cm tiefer als S).
  Problemzonen einfärben: nicht gemacht (optional; die Begründung nennt die Zone mit Zentimetern).

#### Passform-Rechnung (Testhose, Körper nur aus der Größe)
Testhose: Flachfotos mit Bankkarte, Länge 109 cm, Bund flach 42 cm (W32 gemessen), Schnitt Wide-Leg, Material unbekannt
→ ohne Stretch angenommen. Zu lang/zu kurz nennt, wie weit der Saum außerhalb des Bereichs liegt (wie bei der Weite). Umfänge W32: Bund 84, Hüfte 115,5, Oberschenkel 66,8, Knie 61,3; je Weite ±2,54 cm Bund, ±0,79 cm Länge.
Ausgabe der App: `node werkzeuge/passform-rechnung.mjs`. Von Hand nachgerechnet (Körper-Bundlinie = Taille + ¼ (Hüfte − Taille),
Bundlinie bis Boden = 0,573 × Größe + 1,5):

| Profil | Körper Bund / Hüfte / Ober. / Knie, Bund→Boden | Hand: Größe, Spiel Bund, Saum | App |
|---|---|---|---|
| Jakob 179 | 85,7 / 95,8 / 57,5 / 37,3, 104,1 | W32: 84 − 85,7 = −1,7 < −1 → 1 cm zu eng; W33: +0,7 passt, Hüfte 118,8 − 95,8 = 23,0 ≤ 24 passt, Saum 109,8 − 104,1 = +5,7 passt; W34: Hüfte 26,5 → 3 cm zu weit | **W33**: „Bund passt, Länge passt“ ✓ |
| Fabian 187 | 89,5 / 100,0 / 60,0 / 39,0, 108,7 | W33: −3,1 → 2 cm zu eng; W34: 89 − 89,5 = −0,5 passt, Hüfte 22,3 passt, Saum 110,6 − 108,7 = +1,9 passt; W35: Hüfte 25,9 → 2 cm zu weit | **W34**: „Bund passt, Länge passt“ ✓ |
| Philip 170 | 81,4 / 91,0 / 54,6 / 35,5, 98,9 | W30: −2,6 → 2 cm zu eng; W31: 81,4 − 81,4 = 0 passt, Hüfte 20,9 passt, Saum 108,2 − 98,9 = +9,3 > 7 → zu lang, 9,3 − 7 = 2 cm über dem Bereich | **W31**: „Bund passt, Länge 2 cm zu lang“ ✓ |

Alle drei stimmen mit der App überein (auch die Nachbargrößen). Hinweis: Jakob trägt diese Jeans (W32) in den Referenzvideos;
aus der Größe allein schätzt die App seine Taille auf 82 cm und rät zu W33. Mit Scan oder Maßband wird das genauer.

### Zusammenfassung 15.10.
**Geändert**
1. Ausblenden: über 45° Hüftbeugung je Bein, gekippter/liegender Körper (Liegestütz, Hinlegen), schlecht erkannte Hüfte,
   Sprünge der Punkte und verzerrtes Netz blenden die Hose aus (mit Hysterese, ohne Flackern); bis 45° folgt sie sauber,
   Abspreizen (seitlicher Spagat) bleibt sichtbar.
2. Drehung: kein Hängenbleiben und Springen an der Seite mehr, Alpha-Beta-Glättung (weniger Verzögerung, weniger Ruck),
   vorne/hinten im Referenzclip immer richtig.
3. Ferse: kein Boden mehr im Stoffbild zwischen den Beinen, Kontaktschatten, Fuß-Verdecker; blickdicht in allen geprüften Lagen.
4. Modellqualität: Textur 1024 aus dem großen Foto (auch am Handy), Relief vorberechnet (schneller am Handy), Mipmaps.
5. Passform: Urteil je Größe und Zone mit Bewegungszugabe je Schnitt/Stretch, Empfehlung mit Begründung (Karte und
   Shop-Ansicht), Körper notfalls aus der Größe, Größen auch für gemessene Hosen ohne Größenangabe.

**Tests**: volle Reihe (`npm test`, 40 Tests) einzeln durchlaufen: alle grün bis auf zwei, beide geklärt: `tferse`
(Fehlalarm, Spalt zwischen sich berührenden Knien schräg von hinten; Test zählt jetzt Ferse und Saum, das untere Viertel)
und `tlag` (unter Last: Saum-Ausschlag 65 %; allein 80–82 %, grün). Neu/erweitert: `tausblenden`, `tferse`, `tgroessen`
(Zonen, Länge, Größenwechsel im 3D, Satz in der Shop-Ansicht). Werkzeuge: `drehung.mjs` (+ `drehung-nachrechnen.mjs`),
`passform-rechnung.mjs`, `ansichten.mjs` mit Nah-Posen, `textur_vergleich.py`.

**Offen**
- Safari/iPhone und echte Kamera: Drehung, Ausblenden und Textur am Gerät prüfen (hier nur Chromium mit Software-Grafik).
- Netz nur zum Zeichnen feiner unterteilen (die Physik bleibt), falls die Falten in der Nahphase eckig wirken.
- Problemzonen im 3D einfärben (optional, nicht gemacht).
- Schwellen der Passform (Bewegungszugabe, Längenziel) an echten Anproben prüfen; Körper nur aus der Größe ist grob.
- Größere Hose im Speicher (≈ 330 statt ≈ 190 KB): im Browser passen etwa 15 Hosen, danach nur noch auf dem Server.

### Nachprüfung 15.10. (unabhängige Prüfung, danach selbst nachgeprüft)
Sechs Prüf-Agenten haben den ganzen Stand des Tages gelesen (25 Funde). Die Gegenprüfung durch weitere Agenten brach am
Nutzungslimit ab; jeder Fund wurde darum hier am Code nachvollziehbar geprüft und, wo echt, behoben und mit Test belegt:
- Ausblenden: Abspreizen galt als Beugung (seitlicher Spagat, Bein zur Seite: aus oder flackernd; atan2 mit dy ≈ 0). Jetzt
  Beugung = wie weit der Oberschenkel aus der Körperebene nach vorn zeigt. Test: Spagat von vorn sichtbar (Beugung 13°/11°).
- Ausblenden: „gekippt“ blieb hängen, wenn die Schultern beim Aufrichten über den Bildrand gingen (Nahphase) → nach 0,8 s
  ohne Schultern nicht mehr „gekippt“. Saumlinie wurde über einer ausgeblendeten Hose gezeichnet → nicht mehr.
- Drehung: nach einer Lücke in der Erkennung lief die Geschwindigkeit bis 7 rad/s auf (13–22° Überschwingen, bis 0,5 rad je
  Bild), der Wächter ließ die Hose 350 ms weiterdrehen → nach einer Lücke direkt auf die Messung, Geschwindigkeit nur aus
  kleinen Abweichungen, Wächter hält still, Vorhersage in der Schrittgrenze, Dämpfung 0,5 (Sprung bis 0,55 rad: höchstens 4°
  Überschwingen). Ruhezone hinten passt bei 90° an (vorher 3,5° Sprung genau an der Seite).
- Ferse: Kontaktschatten lag auch am Saum eines gehobenen Beins, bei Shorts und Röcken in der Luft → je Bein und nur, wenn die
  Hose bis zum Boden reicht. Geschätzte Rückseite (ohne Rückenfoto) hatte noch Boden im Spalt; unter dem Saum wurde die erste
  ungefüllte statt der letzten gefüllten Zeile fortgesetzt → beides behoben. Neuer Test `tstoffbild` (eigene Fotos auf
  Holzboden): mit Fix 0 Bodenzeilen, ohne Fix 8 von 27 (vorn) und 7 von 27 (geschätzte Rückseite).
- Textur: geschätzte Rückseite bekam Einzelheiten der Vorderseite (Taschen, Schlitz) aus dem großen Foto → nur noch bei echtem
  Rückenfoto. Handy hatte 512 statt vorher 640 → Stoff jetzt überall 1024 (nur dauerhaft langsame Geräte 512), Relief am Handy
  512. Das Foto wird nur noch einmal dekodiert (beide Größen aus demselben Bild; HEIC außerhalb Safari dauerte doppelt).
- Passform: Stretch wurde bei Skinny ohne Material nie angenommen (der Name zählte als „Material bekannt“); eine Maßband-Taille
  ging verloren, wenn die Hüfte fehlte; Shorts bekamen „Länge 55 cm zu kurz“; Röcke mit ausgestelltem Saum „Hüfte zu weit“;
  der Oberschenkel aus dem Scan (Mitte) wurde mit der Hose oben am Schritt verglichen; die Länge sprang von „passt“ auf „5 cm
  zu lang“ bei 0,7 cm mehr → alles behoben (Shorts ohne Längenurteil, Rock-Hüfte bis 22 cm unter dem Bund, Hose an derselben
  Stelle gemessen, Länge außerhalb des Bereichs). Empfehlungen der drei Profile unverändert.
- Tests: `tbeine` las bei ausgeblendeter Hose alte Formen → Ausblenden dort aus (geprüft wird die Form). `tausblenden`: die
  Hysterese-Prüfung (43↔49°) konnte nicht scheitern → jetzt 41↔55° seitlich, je 700 ms; der Einzelsprung wird ab dem Sprung
  gemessen. `drehung.mjs`: virtuelle Uhr lief je Aufruf davon (Bilder falsch zugeordnet) → behoben.
- Nicht übernommen: keiner der 25 Funde war falsch; alle sind behoben oder (Werkzeug-Kleinigkeiten) mit erledigt.

### Zweite Gegenprüfung 15.10. (Agenten, nach Ende des Limits)
Fünf Prüfer und fünf Skeptiker haben die Korrekturen der ersten Nachprüfung gelesen: 13 Funde, 12 bestätigt (einer nicht
erreichbar: Maßband-Taille ohne Hüfte gibt es im Ablauf nicht). Behoben und mit Test belegt:
- Ausblenden: Die Beugung als reiner Vorwärtsanteil zeigte die breite Hocke wieder (Knie 50° außen: 40–45° statt 90°). Jetzt
  wieder in der Ebene vorn/unten, nur bei deutlichem Abspreizen (seitlich über 2,5 × vorn, mit Hysterese) der Vorwärtsanteil.
  „Gekippt“ löste sich auch bei verdeckter Schulter im Liegen → nur noch, wenn die Schultern außerhalb des Bildes sind. Die
  Sprung-Prüfung im Test erkannte bei 8 Bildern/s keinen Sprung → größerer Sprung und Nachweis, dass er erkannt wurde.
  Gegenprobe mit dem alten Stand: Sumo-Hocke und verdeckte Schulter scheitern dort.
- Drehung: Ein Bild ohne Hüften direkt nach einer Lücke verdeckte die Lücke (Hose 0,4 s bis 173° daneben, dann sichtbares
  Nachdrehen) → Zeit nur ab gültiger Messung. Ein vertauschtes erstes Bild nach einer Lücke hielt der Wächter fest (167°)
  → kurz nach einer Lücke folgt ein großer Sprung sofort. Bei 10 Bildern/s und weniger lernte die Verfolgung keine
  Geschwindigkeit → behoben (Abweichung zur Sollkurve wieder wie vor dem Tag). Nachgerechnet: normale Aufnahmen unverändert
  (Verzögerung 43 ms, Ruck 7,9), nach Lücke + Bild ohne Hüften höchstens 11°, nach vertauschtem Bild höchstens 17°.
  `drehung-nachrechnen.mjs` rechnete Kennzahlen über Lücken hinweg (größter Schritt 1,38 rad, Verzögerung 0 ms) → nur
  Nachbarn ohne Lücke, neue Optionen `--blind` und `--tausch`.
- Hosenwechsel: AO und Kontaktschatten der vorigen Hose blieben stehen, bis der Stoff-Fall der neuen fertig war → neu gerechnet.
- Großes Foto: scheiterte das Zeichnen der 2000er-Kopie (Safari-Speichergrenze), scheiterte das ganze Foto → abgesichert,
  die Hose entsteht dann ohne Feinheiten; das dekodierte Bild wird immer freigegeben.
- Passform: Röcke sitzen in der Taille, der Bund wurde an der Bundlinie einer Hose gemessen (eine Größe zu groß) → Taille.
  „Kurz“ (kein Längenurteil) hing vom Betrachter und der Größe ab (Culotte 80 cm für Jakob „23 cm zu kurz“, für Fabian ohne
  Urteil) → je Hose (endgültig nach der dritten Runde: laut Name). Material der Shop-Seite ohne Prozent („Baumwolle,
  Elasthan“) ging verloren → übernommen. Empfehlungen der drei Profile unverändert (W33, W34, W31).

### Dritte Gegenprüfung 15.10.
Drei Prüfer lasen die Korrekturen der zweiten Runde (8 Funde; zwei Skeptiker brachen am Limit ab, deren Funde selbst am Code
nachgeprüft, alle erreichbar). Behoben:
- Ausblenden: „gekippt“ blieb im Profil stehen, wenn die ferne Schulter verdeckt war → Neigung auch aus Schulter und Hüfte
  derselben Seite. Bei Oberschenkel fast in voller Länge (Tiefe unbekannt) wurden bis 26° nach vorn erfunden (Spagat mit
  leicht geschätzter Drehung ging aus) → Tiefe 0. Abspreizen rastete beim Absenken aus dem breiten Stand ein (Sumo-Hocke
  sichtbar, 32°) → Abspreizen nur mit gestrecktem Knie (Knie im Bild unter 135°: Beugung). Gegenprobe: gedrehter Spagat
  und Aufstehen mit verdeckter Schulter scheitern mit dem vorigen Stand.
- Drehung: Im Fenster nach einer Lücke klappte jedes einzelne vertauschte Bild die Hose um, abwechselnde ließen sie flackern
  (8–10 Sprünge) → ein großer Sprung braucht ein zweites Bild als Bestätigung. Eine einzeln verdeckte Hüfte (Hose sichtbar)
  galt als Lücke (Sprung bis 1 rad) → nur beide Hüften. Nachgerechnet auf 4 Aufnahmen gegen den ungestörten Lauf:
  vertauschtes erstes Bild nach Lücke 2 Bilder verkehrt (vorher 15), spätere/abwechselnde Vertauschung 0 (wie vor dem Tag),
  eine Hüfte verdeckt wie vor dem Tag. Das Werkzeug wertete gegen die gestörte Rohschätzung aus (belohnte Folgen des
  Fehlers) → gegen einen ungestörten Lauf.
- Passform: „kurz“ über 88 cm nahm Petite-Jeans (86 cm) und Kinderhosen das „zu kurz“ und hing an der gewählten Größe →
  laut Name (Culotte, Capri, 7/8, Cropped, Bermuda, Shorts; endgültig siehe vierte Runde). Rock „zu weit“ erst, wenn er auch an der Bundlinie zu
  weit ist (Hüftrock). Material aus dem Link nur mit Zusammensetzung oder Stretch-Hinweis (ein bloßes „Denim“ schaltete bei
  Skinny „Stretch angenommen“ ab); der Server liest Material-Objekte (vorher „[object Object]“).
- Bewusst so gelassen: bei ≤ 10 Bildern/s schwingt die Drehung nach dem Anhalten 4–6° über, folgt dafür während der Drehung
  enger (Skeptiker: Abwägung, kein Fehler).

### Vierte Gegenprüfung 15.10.
Drei Prüfer, drei Skeptiker, 9 Funde, 6 bestätigt (davon zwei im Werkzeug), alle behoben:
- Ausblenden: „Tiefe 0“ aus der dritten Runde ließ die Sumo-Hocke mit Knien fast in der Bildebene sichtbar (Knie 66° außen:
  14° statt 75°) und verschob die Grenze beim Knieheben schräg von vorn auf 50–53°. Jetzt: Tiefe 0 nur für die Frage
  „Abspreizen?“ und dessen Vorwärtsanteil, der Beugewinkel nimmt wieder die Vorwärtsannahme (in der Ebene vorn/unten exakt).
  Neigung nicht über Kreuz (Schulter der einen, Hüfte der anderen Seite lag bis 29° daneben). Die Attrappe trifft den
  Sumo-Fall nicht genau (dort setzt die Hauptschleife noch Tiefe); nachgerechnet: 74,6° statt 13,9°.
- Drehung: Ein Bild mit nur einer Hüfte direkt nach einer Lücke schloss die Lücke (16 Bilder verkehrt) → bleibt offen (1).
  (Das Schließen des Fensters nach dem ersten bestätigenden Bild aus dieser Runde ist in der fünften wieder raus.)
  Vergleich auf 4 Aufnahmen, 7 Störfälle, gegen 9a22646 / 77c301e / c62f269: der jetzige Stand ist überall am besten oder
  gleich (vertauschtes erstes Bild nach Lücke 2 Bilder verkehrt statt 15; spätere/abwechselnde Vertauschung 0; eine Hüfte
  nach Lücke 1 statt 16; Bild ohne Hüften nach Lücke 0 statt 15). Ohne Störung unverändert (43 ms, Ruck 7,9).
- Passform: Der Name in der Liste ist gekürzt („… in Culotte-Länge“ fiel weg) → „kurz“ zusätzlich aus vollem Shop-Namen und
  Adresse (`G.kurz`); eigene Fotos ohne Namen: Bermudas unter 70 cm ohne Längenurteil, eine Culotte ohne Namen bekommt
  ehrlich „zu kurz“ (offen: Schalter „gewollt kurz“ im Upload). „Ankle“ zählt nicht mehr als kurz („Ankle Zip Skinny“ ist
  lang). Material der Shop-Seite bleibt erhalten (Stoffart: Jersey, Satin, Cord), zählt für „ohne Stretch“ aber nur als
  Zusammensetzung (Prozent, Stretch-Hinweis oder zwei Fasern), ein bloßes „Denim“ nicht.
- Werkzeug: Auswertung ab dem Ende einer Lücke bzw. dem Beginn eines Tauschens, gegen die Hose des ungestörten Laufs.

### Fünfte (letzte) Gegenprüfung 15.10.
Zwei Prüfer, zwei Skeptiker, 6 Funde, 4 bestätigt, behoben:
- Drehung: Das Schließen des Fensters nach dem ersten bestätigenden Bild (vierte Runde) hielt bei zwei vertauschten Bildern
  direkt nach einer Lücke den falschen Wert 0,5 s fest (17 statt 3 Bilder verkehrt) → zurück: das Fenster bleibt 350 ms
  offen. Ergebnis auf 4 Aufnahmen in 7 Störfällen: höchstens 2–4 Bilder verkehrt in jeder Reihenfolge (9a22646 bis 17).
- Ausblenden: Tiefe unbekannt heißt „nach vorn für die Person“; mit dem Rücken zur Kamera ist das von der Kamera weg (vorher
  zur Kamera hin: Knie heben schräg von hinten ging erst bei 54–62° aus). Ein von der Kamera weg abgespreiztes Bein bei
  20–26° Drehung kann dadurch ausgeblendet werden (schmaler Bereich, lieber aus).
- Passform: „kurz“ aus der Adresse nur aus dem letzten Abschnitt (Produkt), nicht aus Sammlungspfad („/collections/
  hosen-shorts/…“) oder Parametern; aus dem Namen nur vor „ | “ / „ – “; „Capri Blue“ ist eine Farbe. „Zwei Fasern“
  zählt verschiedene Faserarten („TENCEL™ Lyocell“, „Baumwolle (Cotton)“ ist je eine).
- Nicht übernommen: Ein alter Link bleibt beim Hineinziehen fremder Fotos ohne „Neue Hose“ gesetzt (älter als heute,
  größerer Umbau; offen). Eine Hüfte über 1 s verdeckt nach einer Lücke: der Skeptiker fand das Ergebnis besser als vorher.
- Testreihe: 41 Befehle; `tlag` war einmal unter Last (parallel rechnende Prüfer) rot und allein zweimal grün (Skelett
  40 ms bei Grenze 40). Er misst einen Weg, den diese Runden nicht berühren.
- Schlusslauf auf 1e1d5f1 ohne parallele Last: alle 41 Befehle grün.

## Sitzung 16.10. (Auftrag: Größenauswahl fertigstellen, 3D-Avatar aus Selbst-Scan)

### Aufgabe 1: Größenauswahl – was gefehlt hat
- **Nicht ausgeliefert:** Netlify baut laut `doku/netlify-einrichten.md` den Branch `claude/new-session-fbr0jp`. Der lag 29 Commits
  hinter `3d-modell-verbesserung`; die ganze Größenarbeit vom 15.10. war dort nicht drin. → Branch per Fast-Forward nachgezogen
  (kein Force, `main` unverändert). Ab jetzt wird jeder Stand auf beide Branches gepusht.
- **Nur bei manchen Hosen sichtbar:** Größen gab es nur mit Maßtabelle, Model-Größe aus dem Link oder Bankkarte/A4. Ohne das
  (Einzel-Formular, Fotos ohne Maßstab, ältere gespeicherte Hosen) blieb der Bereich leer. → `autoSizes`: Größen um die jetzige
  über die Größensprünge (W aus dem Bund; Röcke EU), die anderen „≈ geschätzt“; ohne bekannte Maße alle geschätzt mit Hinweis.
  Bund von Hand ändern rechnet sie neu. Beim Laden ergänzt (`checkGarment`).
- **Shopify-Varianten ohne Maße:** Die Varianten-Namen landeten nur als Text, ohne Tabelle entstand keine Größenliste (es kamen
  W28–W38 statt der Shop-Größen). → `upTable` nimmt die Varianten als Größenliste, `sizeSeries` die gemessene Hose (Bankkarte,
  eingetragener Bund) als Bezugsgröße für die vorgewählte Variante.
- Unverändert und nachgerechnet: Zonen, Urteile, Empfehlung, Begründung, Größenwechsel im 3D. Profile (Körper aus der Größe)
  wie in der Handrechnung oben: Jakob W33 „Bund passt, Länge passt“, Fabian W34 „Bund passt, Länge passt“, Philip W31
  „Bund passt, Länge 2 cm zu lang“ (App-Ausgabe `werkzeuge/passform-rechnung.mjs`, alle 11 Größen je Profil).
- Screenshots (Handy 430 × 932): `docs/groessenauswahl_handy.png` (unter dem 3D-Modell), `docs/groessenauswahl_wechsel_w36.png`
  (W36 gewählt, Hose sichtbar weiter), `docs/groessenauswahl_anprobe.png` (Shop-Anprobe). Werkzeug: `werkzeuge/groessen-bild.mjs`.
- Tests: `tgroessen` (Einzel-Formular, Bund ändern, gespeicherte Hosen), `tlink` (Shopify nur Varianten-Namen + Bankkarte).
