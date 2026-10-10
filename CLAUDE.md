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
| `app/index.html` | **Aktueller Stand.** Eine einzige Datei, rund 200 KB, kein Build-Schritt. |
| `prototypen/` | Sieben ältere Stände, nummeriert und datiert. Nur zum Nachschlagen. |
| `werkzeuge/tests/testseite-mit-simulierter-person.html` | Aktuelle Seite mit Attrappe statt MediaPipe (siehe „Testen“). |
| `werkzeuge/tests/t*.mjs` | Playwright-Skripte, siehe „Testen“. Die nicht in `npm test` genannten (`t.mjs` bis `te.mjs`) sind alt und haben noch harte Pfade. |
| `werkzeuge/python/` | Der ursprüngliche Python-Weg vom Foto zum Modell. Inzwischen nach JavaScript portiert, als Referenz nützlich. |
| `werkzeuge/bausteine/` | `g3d.js` (3D-Darstellung) und `gen.js` (Generator, Blickrichtung) als Einzelstücke, bevor sie in die Seite kamen. **Nicht mehr ganz aktuell**, die Wahrheit steht in `app/index.html`. |
| `material/produktfotos/` | `front.jpg`, `back.jpg` (Bershka Super Baggy Jeans, 702×900), der fertige Atlas und das Modell als JSON. Gute Testdaten. |
| `material/freisteller-alt/` | Die fünf alten 2D-Freisteller samt `assets.json`. Aus der App entfernt. |
| `material/anhaenge/` | Alles, was der Nutzer im Chat angehängt hat: zehn Bershka-Screenshots, die Ideen-Notiz `attachment.txt`, zwei Bildschirmfotos. |
| `material/testbilder/` | Screenshots aus den Tests (Posen, Drehung, Umriss-Erkennung). |
| `doku/chatverlauf.md` | Der Chat ab dem 5. Oktober als Text. Der Teil davor ist nur noch als Zusammenfassung erhalten (unten eingearbeitet). |
| `doku/pitch-plan.md` | Pitch-Plan als Markdown. |
| `doku/foto-anleitung-haendler.md` | Foto-Anleitung für Händler (steht verkürzt auch in der Seite unter „So fotografierst du richtig“). |
| `doku/test-checkliste.md` | Ablauf zum Testen vieler Hosen auf mehreren Geräten (Netlify, `hosen.json`, Prüfpunkte je Gerät, was zurückschicken). |

**Rechtlicher Hinweis:** Die Bershka-Bilder sind nur interne Testdaten. Für ein echtes Produkt braucht es eigene Fotos oder die Erlaubnis der Marke. Der Nutzer will ab jetzt mit eigenen, selbst fotografierten Hosen arbeiten.

## Wie die Seite funktioniert

Reines HTML mit einem `<script type="module">`. Zur Laufzeit von jsDelivr nachgeladen: MediaPipe Tasks Vision 0.10.18
(Pose-Erkennung mit Segmentierungsmaske, auch für Einzelbilder beim Hochladen), bei Bedarf `heic-to` 1.6.5 für iPhone-Fotos
(Ausweichlösung `heic2any` 0.0.4) und, nur wenn eine Maßtabelle als Bild kommt, Tesseract.js 7.0.0 (Texterkennung,
Programm etwa 3 MB plus deutsche und englische Schrift 4 MB, Apache 2.0).

Ablauf für den Anwender: Größe eingeben → Kamera → Frontal-Scan → Seiten-Scan → Nahphase mit Anprobe.
Hose anlegen (seit 10.10.): **„Dateien hochladen“** (Fotos, Shop-Screenshots, Maßtabelle als Bild oder Text, hineinziehen,
antippen oder Strg+V); darunter weiter das Einzel-Formular mit Maßband-Werten und Maßstab (A4/Bankkarte).

### Die wichtigsten Stellen im Code

| Funktion | Aufgabe |
|---|---|
| `openStream`, `startCamera` | Kamera zuerst (im Tipp-Ereignis), dann Modell laden. Sucht hinten die Ultraweitwinkel-Linse, fährt den Zoom heraus, setzt `cam.fk` (Brennweite als Anteil der langen Bildseite: 0,8 normal, 0,42 Ultraweit, **geschätzt**). |
| `analyse(res)` | Herzstück je Bild: Landmarken glätten, Maßstab, Messwerte, Coaching, Knochen, Aufruf von `drawGarment`. |
| `emaV`, `emaBand` | One-Euro-Filter mit Ausreißer-Sperre (Sprung > 0,09 wird bis zu 8 Bilder ignoriert). **Nicht für Winkel benutzen**, dafür ist er zu träge. |
| `bodyYaw` | Drehung der Person. Betrag aus Schulter- und Hüftbreite relativ zur Rumpflänge, Vorzeichen aus Fußspitzen, Nase und Tiefe. Wird beim Frontal-Scan geeicht (`fc.cal`). |
| `buildGarment`, `segGarment`, `cropGarment`, `garmentProfile` | **Generator**: zwei Fotos → Modell, komplett im Browser, etwa 0,5 s (mit KI-Freistellung etwa 1 s mehr). |
| `segGarment`, `segClassic`, `loadAiSeg`, `aiMask`, `seedPoints` | **Freistellung**: Farbweg (`segClassic`: Farbmodell + helle Regel) und, wenn geladen, **KI-Freistellung** MediaPipe Interactive Segmenter v1 „magic_touch“ (Apache 2.0, 6 MB, `storage.googleapis.com`, mit tasks-vision 0.10.18 wie die Pose-Erkennung; lädt beim Wählen eines Fotos, höchstens 9 s gewartet). Saatpunkte aus der Farbmaske (Bundmitte, beide Beine). IoU > 0,92 → Farbkante (pixelgenau), sonst KI-Maske (`S.ki`). Ohne Netz: nur Farbweg. |
| `askOutline`, `wandMask` | Fenster **„Umriss prüfen“**: öffnet sich, wenn Farbe und KI uneinig sind (IoU < 0,85) oder „Umriss immer prüfen“ (`#own-check`) gesetzt ist. Teil antippen, ＋ dazu / － weg; KI-Umriss des angetippten Teils, sonst Zauberstab nach Farbe. Schutzregeln: kein Löschen von > 40 % der Hose, nichts, was ganz innen liegt (Hand auf der Hose: Loch ginge wieder zu, neu fotografieren). Escape: automatischer Umriss bleibt. |
| `loadGarmentPhoto`, `garmentTurn`, `trimMask` | Foto gerade rechnen, drehen (quer/auf dem Kopf), Dünnes, das oben/unten herausragt, abschneiden. |
| `readPhotoMeta`, `levelBySensor` | Liest aus iPhone-Fotos (JPEG und HEIC) Brennweite und Schwerkraftvektor (Apple-Herstellerdaten, Eintrag 8) und rechnet das Foto auf „senkrecht von oben“ um. Nur Hochformat, bis 40° Neigung. |
| `photoWithReference`, `askCorners`, `refineReference`, `snapQuadToEdges` | Maßstab im Foto (A4 oder Bankkarte ID-1, 85,60 × 53,98 mm): Foto in 2400 px laden und gerade rechnen, Objekt grob suchen, im großen Bild fein vermessen, **Fenster zum Bestätigen oder Antippen der vier Ecken** (ungefähr tippen → Ecken rasten ein, sonst vergrößern und vier Ecken antippen; Kreuze verschiebbar, bleiben im Ausschnitt; Einrasten nach der 4. Ecke sichtbar, nach „Passt“ nichts Unsichtbares mehr). `refineReference` vereinigt aneinandergrenzende Flecken und sucht zusätzlich in einer geschlossenen Maske (zweifarbige oder fleckige Karte). Escape bricht ab (keine Hose), Tab bleibt im Fenster, Fenster passt sich beim Drehen an, `quadOK` sperrt „Passt“ bei Punkten, die kein Viereck bilden. Ohne Neigungsdaten Homographie aus den vier Ecken, vorher Prüfung des rohen Vierecks (Seitenverhältnis > 20 % oder Winkel > 15° → Warnung). Warnungen: Karte verzogen (Seitenverhältnis > 6 %, Winkel > 6°), weit von der Hose, Vorder-/Rückseite > 6 % auseinander, Länge außerhalb 20–200 cm → Maßstab verworfen. Artikel für Meldungen in `REFS` (nom/akk/dat/gen/pro). |
| `drawDebug3d` (Schalter „Debug-Ansicht“) | Achsen der Hose (X rot, Y grün, Z blau, Ursprung Bundmitte), Box, Maße B × H × T in cm, Neigung der Hauptachse (PCA), Tiefe jedes Gelenks. |
| `uprightProfile` | Beim Laden: Beinspalt oben statt unten → Modell um 180° drehen (Zeilen umkehren und `M.mir`: links/rechts tauschen, siehe `mesh3d`). |
| Knöpfe „↻ X/Y/Z 90°“, „Umdrehen“ (`G.rot`) | Notlösung pro Hose, Drehung um die Mitte der Hose. Z dreht im Uhrzeigersinn; wieder gerade → `G.rot=null`. |
| `garmentTurn`, `buildGarment` | Foto quer → um ±90° drehen (Saumseite hat zwei Beine; +90 im Canvas dreht links nach oben). Kein Schritt gefunden → beide Fotos um 180° gedreht noch einmal suchen (auf dem Kopf mit sich berührenden Säumen). Quer und sich berührende Säume bleibt geraten: Hinweis „Prüfe, ob der Bund oben ist“. |
| `findGaps` | Beinspalt je Zeile aus Umriss oder Farbe (heller Boden zwischen den Beinen, den die Freistellung als Hose zählt); daraus der Schritt. Seit 9.10.: Loch in der Maske und angrenzender Boden zusammen (vorher kam Holzboden als Fleck auf den Oberschenkel). |
| `PASSFORM` (9.10.) | **Alle Stellschrauben für Sitz und Form an einem Ort** (oben bei `K3`, jede mit Kommentar): `sitzCm` (Bundoberkante relativ zum Hüftknochen, −0,5 = etwas tiefer; vorher fest +1,5 % der Länge darüber), `einrollen`/`bogenSenkrecht` (Schrittbogen), `schrittTiefe`/`schrittTiefeRest` (wie tief der Schritt unter dem Körperschritt hängen darf), `schrittKoerper`/`schrittOhne` (anatomische Grenzen für den erkannten Körperschritt), `schrittFotoMax` (Schritt bei V-förmig gespreizten Beinen im Foto), `hueftWeiteMax`, `bandCm` (Übergang Becken→Beine, vorher 16), `gesaessCm`, `innenSuche`/`innenMax`/`innenKante`/`innenZug` (Innenbund). Im Test über `window.__dbg.PASSFORM` änderbar. |
| `vSpread`, `alignRows` (9.10.) | Spalt öffnet sich als V (Beine im Foto gespreizt, oben übereinander): wahrer Schritt höher als der sichtbare, Schritt auf `schrittFotoMax` begrenzt. Rückseite mit eigenem Schritt vermessen und Zeile für Zeile auf den Schritt des Modells gezogen (vorher Gesäß und Taschen nach unten gezogen). |
| `innerTopCut`, `applyInnerCut` (9.10.) | **Innenbund mit Etikett weg**: flach von vorne sieht man über dem vorderen Bund die Innenseite des höheren hinteren Bunds. Weg von Seitennaht zu Seitennaht (DP, Farbwechsel „unähnlich → ähnlich dem Außenstoff“), am Originalfoto geprüft: liegt auf der Oberkante des vorderen Bunds (ein Feinschliff auf die nächste Helligkeitsstufe darunter war schlechter und ist wieder raus). Nur wenn klar (Tiefe 1,2–11 % der Länge, Farbwechsel ≥ `innenKante` = 40: echter Innenbund 73, normaler Bund auf sechs Untergründen 16–26), sonst bleibt das Foto unverändert. Darüber wird abgeschnitten, der Bund nach oben gezogen (Dehnung über `innenZug` = 25 % der Länge verteilt); Ergebnis `m3.innen`. Nur Vorderseite. |
| `innerColor`, `uin` (9.10.) | Innenflächen (Bund-/Saumbeleg, ins Hosenbein) zeigen nie das Außenfoto, sondern eine einheitliche Stoffrückseite aus der Grundfarbe (Denim heller und grauer). Vorher erschienen Taschen und Etiketten innen. |
| `upAdd`, `upAnalyse`, `classifyFlat`, `upAssign`, `upBuild`, `UP` (10.10.) | **Dateien hochladen**: jede Datei einordnen (Text/CSV → Tabelle; Bild: Shop-Screenshot mit Hosen → zerlegen; tabellenartig → Texterkennung; Person → getragen; sonst flache Hose prüfen), Übersicht mit ⇄ (vorne/hinten tauschen) und ✕, Fehlendes sofort melden („Es fehlt ein flaches Foto der Hose“, „Es fehlt die Vorderseite flach“), sonst sofort bauen. Jede Änderung (Tabelle dazu, andere Größe) baut dieselbe Hose neu (`UP.key`); eine zweite flache Vorderseite oder „Neue Hose“ beginnt eine neue. Maße: Tabelle > Körpermaß (Bund = (Taille+4)/2) > geschätzt; Innenbein → Länge über den Schritt; Material aus dem Tabellentext. |
| `sceneParts`, `findProducts`, `twoLegs`, `tableLike` (10.10.) | Bild verkleinert in Hintergrund (häufigste Farbe) und Teile zerlegen. **Shop-Screenshot**: hosenförmige Teile (zwei Beine, nicht am Rand, Füllgrad 0,33–0,93) einzeln ausschneiden, links = vorne, rechts = hinten. **Tabelle**: ruhiger Grund, viele kleine Zeichen, nichts Großes. Ganze Bershka-Seiten (Jeans, Jogginghose, Bermudas, Shorts) geprüft; die Seiten mit verschwommenen (noch ladenden) Bildern werden nicht zerlegt. |
| `findPerson`, `personInfo`, `loadPoseImg` (10.10.) | Person im Bild (MediaPipe Pose, Einzelbild-Modus, dasselbe Modell wie die Kamera): Gesicht deutlich oder Schultern und Hüfte im Bild. Von vorne/hinten aus Gesicht und Fußspitzen/Fersen. Für die Rückseite nur, wenn Hüfte und Knie im Bild sind (`legs`). Model-Fotos ohne Kopf mit abgeschnittenen Schultern werden nicht erkannt (dann als „keine Hose“). Test-Einblick `window.__poseMock`. |
| `pantsShape`, `flatSideScore` (10.10.) | Flache Hose? Zwei Beine (auch nur unten getrennt, Shorts) oder Füllgrad/Seitenverhältnis. Vorne/hinten: Innenbund mit Etikett (+2), Lederpatch oben seitlich (−1,5), Dateiname vorne/front/hinten/back (±3), Lage im Screenshot (±1), sonst Reihenfolge. Ein Knopf-Merkmal war unbrauchbar (helle Etiketten hinten) und ist raus. |
| `loadOcr`, `ocrText`, `parseSizeText`, `tableDims` (10.10.) | **Maßtabelle**: Texterkennung (Tesseract, `deu+eng`, Bild auf ≥ 1400 px vergrößert), dann Größenzeile (XS…XL, 24…60, W30) und Maßzeilen (Bundweite/Taillenumfang/Hüfte/Länge/Innenbein/Saum/Oberschenkel/Leibhöhe, DE und EN), Abschnitt „Körper“ vs. „Artikel“, Bereiche „76-80“, Zoll → cm, Umfang → flach. Größe wählbar (`#drop-size`, Vorgabe: mittlere). Bershka-Größenleitfaden (nur Körpermaße) wird richtig gelesen. |
| `wornMask`, `paintWornBack` (10.10.) | **Rückseite getragen**: Form aus dem flachen Foto (gespiegelte Vorderseite), Stoff aus dem Foto mit Person: Hose freistellen (KI mit Saatpunkten an Oberschenkeln/Schienbeinen, sonst Farbe + Löcher füllen), Bund oben und Schritt entlang der Körperachse, über dem Schritt quer zum Körper von Rand zu Rand, darunter je Bein quer zum Bein entlang Hüfte → Knie → Knöchel bis zum Saum. Nur mit dem künstlichen Testbild geprüft (Taschen am Gesäß, Kniefleck 38–43 % statt 43 %). |
| `realismus`, `realText` (10.10.) | **Ist das eine echte Hose?** Länge 25–135 cm, Bund 22–75 cm, Länge/Bund 1,7–3,9 (Shorts 0,7–2,3), Leibhöhe 14–58 cm, ein Bein oben 0,42–1,12 × Bund, Saum 0,28–1,4 × oben, Beine gleich breit (≤ 40 % Unterschied), Umriss ohne Sprünge (≤ 30 % je Zeile), kein Rechteck (Füllgrad ≤ 0,93). Fällt etwas durch, wird nichts angelegt; die Meldung nennt die Gründe und Warnungen (z. B. „Karte wirkt verzogen“). Gilt für Hochladen und Einzel-Formular. |
| `normalizeProfile` | Prüft jedes Modell (neu und beim Laden): schmale Zeilen am Bund/Saum weg, neu auf 0..1 verteilen, Plausibilität (`G.bad`). Seit 10.10. auch Shorts (Bund bis 1,15 × Länge, Schritt bis 0,8; Schritt bei gespreizten Beinen höchstens `schrittFotoMaxKurz`). |
| `mesh3d`, `pose3d`, `draw3d` | 3D-Netz, Lage je Bild, WebGL-Darstellung in eine eigene Fläche, die dann auf das 2D-Overlay gelegt wird. |
| `skin3d`, `axisAngle`, `rotAbout` | **Skinning**: Hose wird in Ruhepose (Beine gerade nach unten, Knochenlängen von jetzt) gebaut, dann drehen Oberschenkel (Gewicht ab 0,2·Lt über bis 0,45·Lt unter dem Hüftgelenk) und Unterschenkel (0,8–1,15·Lt) sie in die Haltung. Mittelnaht vorne/hinten bleibt am Becken (sonst Riss, wenn nur ein Bein sich hebt). Seit 9.10. wird der Drehwinkel überblendet statt der Lage (wie Dual-Quaternion-Skinning bei einem Gelenk): kein Einfallen an Leiste und Kniekehle mehr. |
| `cloth3d`, `closestOnChain`, `STOFFE`, `stoffAusText`, `stoffVon` | **Stoffphysik**: je Punkt eine Feder zur Form vom Skelett (Eigenfrequenz am Saum `hz`, zum Bund bis 6× steifer, Dämpfung `zeta` relativ zur Bewegung der Form), **implizit** gerechnet (bei jeder Bildrate stabil; die alte explizite Fassung schaukelte sich bei 10 Bildern/s auf). Loser Stoff mit Unterseite nach unten hängt um `hang`·Abstand zum Bein durch, höchstens `dev` cm; Beine als Kapseln (Radien aus Körpergröße); Sprung im Tracking → neu ansetzen. Stoffarten jeans/stretch/chino/cord/anzug/sweat/leinen/fliessend mit Fall, Nachschwingen, Faltenlänge `fold`, Relief `bump`, Glanz `gloss` (Werte 9.10. aus der Stoff-Recherche: Flächengewicht, Biegelänge, Pendel- und Luftdämpfung; Herleitung im Kommentar). Seit 9.10.: Spiel je Punkt = min(`dev`, Abstand zum Bein + 1 cm), Geschwindigkeit nach außen fällt beim Begrenzen weg, Länge je Spalte höchstens +3 %, Umfang je Ring ±2 % (vorher dehnte sich fließender Stoff bis 112 %), Pause > 0,25 s → neu ansetzen. Erkennung `stoffAusText` aus Material **und Name** (`stoffText`): liest „98% cotton“, „cotton 98%“, „Baumwolle (CO) 97“, „46/38/16% Cotton/T400/Polyester“, zählt Futter/Besatz nicht, Stretch ab 1 % Elasthan oder 5 % T400, Bauart (Denim, Cord, Chino, Sweat, Satin) vor Faser; an 52 + 18 echten Angaben geprüft (mit Name 0 falsch). Nur „100 % Baumwolle“ → Jeans, „geraten“. Auswahl `#own-fab`/`#g-fab`, Material `#own-mat`, gespeichert als `G.fabric`/`G.material`. |
| `normals3d`, Stauchfalten in `pose3d` | Normalen und Relief-Richtungen (`tu`, `tw`). Stauchfalten: Stauchung c der Zeilen (jetzt/Ruhe) → Faltentiefe a = λ/π·√(c(1−c)) entlang der Normale, λ = `fold` des Stoffs; erscheinen an Knöchel (zu lange Hose), Kniekehle, Leiste. Seit 9.10.: zu lange Hose wird gleichmäßig auf die untersten 10 cm über dem Schuh verteilt (vorher lagen die letzten 8 Zeilen auf 1,6 cm übereinander), jede Zeile ≥ 0,3 cm unter der vorigen; Faltenwinkel rundherum stetig (vorher klafften die Falten an den Nähten), Tiefe und Lage schwanken um das Bein (keine gleichmäßigen Ringe). |
| `rim3d`, `occl3d`, `draw3d`, `shadow3d`, `psiArc` (9.10.) | **Bund und Saum mit Dicke** (Lippe 0,45 cm, innen Bundbeleg 4 cm, Saumumschlag 3 cm). **Körper als unsichtbarer Tiefenverdecker** (Becken aus der oberen Hose auf 93 %, Beine als Kegelstümpfe, Füße) statt Wegwerfen abgewandter Flächen: vier Durchgänge (Arme nur Tiefe → Außenseite → Körper nur Tiefe → Innenseite), man sieht ins Hosenbein und in den Bund. **Arme/Hände** (Landmarken 11–20) schneiden die Hose aus, wenn sicher erkannt und vor dem Becken (Tiefe relativ zur Hüftmitte ≤ 0,02, aus erst ab > 0,06: Hysterese gegen Flackern). **Schatten** nur auf der Person (Maske der Erkennung): weiche Hosenform 0,6 cm tiefer plus Kontaktschatten unter jedem Saum, kein Schleier mehr auf dem Hintergrund. Querschnitt über dem Schritt mit Gesäß (hinten tiefer, vorne flacher, Umfang bleibt 4·hw), Punkte nach Bogenlänge (`psiArc`, Textur nicht mehr verzerrt), hinterer Bund 2 cm höher, vorderer 0,8 cm tiefer. |
| `matchHalves`, Shader `VS3`/`FS3` | Rückseite farblich an die Vorderseite angeglichen (80 % Mittelwert, 50 % Kontrast). Shader: Relief aus dem Helligkeitsgefälle des Fotos in zwei Größen, Hauptlicht oben vorn links (umhüllend), Gegenlicht, Himmel oben heller, Kantenabdunklung, Glanz; an der Seitennaht halb Vorder-, halb Rückseite (`uv2`, `sd`). |
| `drawGarment` | Entscheidet 3D oder alter 2D-Weg, rechnet Gelenke perspektivisch zurück, Lichtanpassung. |
| `coach`, `cue`, `say`, `pickVoice` | Ansagen: große Texte mit Trägheit, Sprachausgabe, Stimmenauswahl. |
| `saveOwn`, `saveSoon`, `loadOwn`, `addOwnGarment`, `deleteGarment` | Eigene Hosen in `localStorage` (Schlüssel `massScanHosen`). Löschen: erster Tipp auf ✕ zeigt „Löschen?“, zweiter löscht (kein `confirm()`, das in eingebetteten Seiten gesperrt sein kann); gibt mit `free3d` Geometrie und Textur frei, Fokus bleibt in der Liste. Passt eine neue Hose nicht mehr in den Speicher, wird sie als `unsaved` ausgelassen, die anderen werden weiter gespeichert; jeder Fehlschlag wird gemeldet. Maßfelder speichern 0,8 s nach dem Tippen, beim Verlassen und beim Schließen der Seite. `loadOwn` übernimmt `massScanEigen` (Stand 7.10.) einmal und löscht den Schlüssel, und setzt beschädigte Felder zurück. |
| `garmentDims`, `fillDims`, `setDim`, `dimWhy`, `resetDim`, `num` | Maße je Hose: Länge (`G.len`), Bund (`G.waist`), Saum (`G.hem`); `null` heißt „geschätzt“. Länge: **eingetragen > gemessen (Maßstab, `G.meas`) > aus Bund > Normbund 40 cm**; ohne eingetragenen Bund gehen Bund und Saum im Verhältnis des Fotos mit. Felder sind `type="text"` mit Dezimaltastatur, Komma und Punkt gehen (`num`), Anzeige auf 0,1 mit Komma. `dimWhy` prüft Bereich und Verhältnis in beide Richtungen, auch beim Anlegen (ungültig → Meldung, nichts still verworfen). Kennzeichnungen `tag-len`/`tag-waist`/`tag-hem` („manuell“/„gemessen“/„geschätzt“; `t-waist` usw. sind die Maßband-Felder der Messreihe). `pose3d` zeichnet auch sehr kurze eingetragene Längen genau (Leibhöhe wird dann gekürzt). |

| `exportGarments`, `importGarmentFile`, `loadSharedGarments`, `mergeGarments`, `checkGarment`, `plainG`, `ownIt` (9.10.) | **Sammlung**: „⇩ Alle Hosen als Datei“ schreibt `hosen.json` ({app, version, hosen:[{key, G}]}), „⇧ Hosen aus Datei laden“ übernimmt sie (gleiche Schlüssel werden übersprungen, beschädigte gemeldet, Speicher voll → „nur bis zum Neuladen“). Liegt `hosen.json` neben `index.html` (z. B. Netlify), lädt jedes Gerät sie beim Öffnen; diese Hosen (`G.shared`) werden nicht im Gerät gespeichert, außer man ändert etwas (`ownIt`). Gelöschte Hosen aus der Datei merkt sich `massScanWeg`. `checkGarment` ist die gemeinsame Prüfung für Speicher und Datei. |
| `view3dFrame`, `view3dPose`, `exportGLB` (9.10.) | **Drehbare 3D-Ansicht** ohne Kamera unter der Hosenliste: dieselbe Hose, Physik und Darstellung an einer Puppe (Gelenke als Anteil der eingegebenen Größe), ziehen zum Drehen, dreht sich sonst langsam. Läuft nur, wenn die Kamera aus und die Ansicht zu sehen ist (teilt sich `g3` mit der Anprobe). „⇩ 3D-Datei (.glb)“: glTF 2.0 binär, Meter, Y oben, Vorderseite +Z, Boden 0, Textur (Atlas) und Innenseiten als Vertex-Farbe; geprüft mit dem Khronos-Prüfer (`gltf-validator`, 0 Fehler) und in three.js angesehen. |

Weitere `localStorage`-Schlüssel: `massScanSerie` (Messreihe), `massScanPerson`, `massScanStimme`, `massScanDebug`, `massScanWeg` (gelöschte Hosen aus `hosen.json`).

Sonst noch: `fillT` schreibt Text auf die Überlagerung und spiegelt ihn bei der Selfie-Kamera zurück; `drawDebug3d` passt die Schrift an den sichtbaren Ausschnitt an. Geht der WebGL-Kontext verloren (`webglcontextlost`), wird beim nächsten Bild alles neu angelegt. Lädt die Erkennung nicht, steht das auch auf der Bühne. `fileToCanvas` begrenzt die Fläche auf 6 MP und gibt das dekodierte Bild frei.

### Das Hosenmodell (`G.m3`)

Kein fertiges Netz, sondern ein Maßprofil, aus dem das Netz je Bild neu berechnet wird:

```
nr   56 Zeilen von Bund bis Saum
v    Höhe jeder Zeile, 0..1
vc   Höhe des Schritts (etwa 0,39)
hw   über dem Schritt: halbe flache Gesamtbreite; darunter: flache Breite EINES Beins. Einheit: Anteil der Hosenlänge
wf   flache Bundbreite als Anteil der Hosenlänge → Länge in cm = Bund in cm / wf
f, b Texturkoordinaten je Zeile für Vorder- und Rückseite: [außen, innen, innen, außen]
tv, tvb  senkrechte Texturkoordinate je Zeile (vorne, hinten)
atlas    JPEG 640×640 als Data-URI: links Vorderseite, rechts Rückseite, Rand mit Stofffarbe aufgefüllt
innen    true, wenn oben im Vorderseitenfoto der Innenbund erkannt und weggeschnitten wurde (9.10.)
```

Dazu am Kleidungsstück: `waist` (Bund flach in cm), `len` (Außenlänge in cm, entlang der Außennaht; `m3.lo` = Außenlänge / senkrechte Länge im Foto; das Modell ist dann vom Bund bis zum Saum genau so lang, die Beine füllen auf, was nach der Leibhöhe übrig ist), `meas` (Länge aus Maßstab im Foto), `hem` (ein Bein unten in cm, optional, korrigiert die Weite linear vom Schritt zum Saum), `estFlat` (40 cm, Notwert), `bad` (Grund, warum das Modell nicht gezeigt wird), `repaired` (beim Laden repariert).

Geometrie: flach gemessene Breite wird in **Umfang** umgerechnet. Über dem Schritt eine Ellipse mit Umfang 4·hw und Tiefe/Breite 0,62. Darunter je Bein ein Kreis mit Umfang 2·hw entlang der Knochenkette Hüfte→Knie→Knöchel, so weit nach außen versetzt (`off`), dass der Stoff gerade von der Hüfte fällt (vorher gab es eine Beule an der Hüfte). In den ersten 6 cm unter dem Schritt (`PASSFORM.bandCm`) wird zwischen beidem übergeblendet. Seit 9.10. sitzt der Schritt **am Körper**: Die flache Leibhöhe wird nicht mehr ganz senkrecht gezeichnet (der unterste Teil läuft als Schrittbogen zwischen den Beinen nach hinten, Mitte vorne/hinten rollen dort ein), der Schritt der Hose hängt nur so weit unter dem Körperschritt, wie die Hose länger ist (bis `schrittTiefe` ganz, darüber zur Hälfte); innen (Schritt) und außen (Seitennaht) haben eigene Höhen (`yIn`, `yOut`), die Außenlänge bleibt wie gemessen. Über dem Schritt höchstens 8 % weiter als die weiteste Hüftstelle. Kennwerte je Bild in `g3.form` (cm). Das alles in der **Ruhepose** (Beine gerade); in die Haltung kommt die Hose per Skinning (`skin3d`), Nachschwingen und Durchhängen macht die Stoffphysik (`cloth3d`), zu lange Beine stauchen sich am Knöchel und werfen dort Falten.

Darstellung: orthografische Lage plus Perspektive im Vertex-Shader (`foc`, `pc`), Tiefenpuffer. Seit 9.10. zwei Seiten: Außenseite (`upass` 0) und Innenseite (`upass` 1, abgewandte Flächen und Innenbeleg, eigen schattiert), dazwischen der Körper als unsichtbarer Tiefenverdecker. So sieht man die abgewandte Seite nur dort, wo sie wirklich zu sehen wäre (durch Bund- und Saumöffnung), und eine Hand vor der Hose schneidet sie aus. WebGL1: genau 8 Punkt-Attribute (`ao` ist jetzt vec2: Verdeckung, Offenheit innen).

## Stand der Dinge, ehrlich

**Funktioniert in der Simulation** (Attrappe statt Kamera): Generator aus den zwei Jeans-Fotos, volle Drehung auch ohne brauchbare Tiefendaten, Saumkorrektur, mehrere Hosen anlegen, speichern, löschen, Schnellstart „Jakob · 179 cm“.

**Nie mit echter Kamera von mir geprüft.** Alle Rückmeldungen zum echten Verhalten kommen vom Nutzer (iPhone 13 und Laptop).

Offene Punkte, nach Dringlichkeit (Stand 7.10. nachts, nach der ersten Claude-Code-Sitzung):

1. **Hose wird nach unten zu breit**: Ursache gefunden und behoben, mit echter Kamera **nicht bestätigt**. Die Tiefe von Knie und Knöchel
   kam direkt aus der unruhigen Tiefenschätzung; lagen die Knöchel scheinbar 0,2–0,4 näher an der Kamera, wurde der Saum 16–35 % zu breit
   (nachgestellt in `tbreite.mjs`). Jetzt kommt der Betrag der Tiefe aus der Verkürzung der Beine im Bild (`segLen` in `analyse`),
   von der Tiefenschätzung nur die Richtung. Zweite mögliche Ursache bleibt: schräg fotografierte Hose (Punkt 4).
2. **Freistellung echter Handyfotos**: neues Farbmodell (`segColor`): Untergrundfarben vom Bildrand per k-Means, Schatten als abgedunkelte
   Untergrundfarbe, Hosenfarben nachgelernt, Kante mit feiner Farbe nachgeschärft. Auf hellem Grund gilt weiter die alte Regel (`segBright`),
   wenn beide übereinstimmen. Getestet auf künstlichen Untergründen (Parkett, Teppich, Bettdecke, Fliesen: Maße ±5 %).
   **Grenze:** dunkle Nähte auf fast schwarzem Boden. Dort warnt die Seite (Plausibilitätsprüfung über `wf`). Echte Handyfotos fehlen weiter.
3. **HEIC**: geprüft in Chromium mit beiden Umwandlern (`theic.mjs`, Umwandler lokal aus node_modules). Nicht geprüft: echte iPhone-Datei
   mit Kachelaufbau und Drehung.
4. **Schräg aufgenommene Fotos** (Trapezverzerrung) werden nicht korrigiert. Nur ein Hinweis in der Oberfläche („Handy senkrecht über die Mitte“).
5. Knie zur Kamera: das schwarze Loch an der Innennaht ist weg (Innenwand heller schattiert). Bei angehobenem Knie und stark verrauschter
   Tiefe kann der Unterschenkel noch in die falsche Richtung kippen.
6. **Links/rechts-Verwechslung** bei Rückenansicht: unverändert, ohne echte Kameradaten nicht sinnvoll zu lösen.
7. **Stimme**: unverändert (Auswahl der Systemstimmen). Nächster Schritt wären aufgenommene Ansagen.
8. Alter 2D-Weg: entfernt. Ohne WebGL wird nur noch das flache Vorschaubild gezeigt.
9. Nur Hosen mit zwei Beinen.
12. **Hose falsch orientiert, Beinöffnungen zur Kamera** (8.10.): Ursache in `analyse()` beim Anlegen, nicht bei der Erzeugung.
    Die Tiefe von Knie/Knöchel kam aus der Verkürzung gegenüber einer gemerkten Beinlänge in cm (von mir in der ersten Sitzung
    eingebaut). In der Nahphase stimmt der cm-Maßstab nicht und die Füße sind aus dem Bild → Beine galten als bis 82 cm zur
    Kamera gerichtet. Jetzt: Verkürzung gegenüber dem anderen Bein im selben Bild, Gelenke außerhalb des Bildes ohne Tiefe und
    gerade fortgesetzt, Tiefe begrenzt. Nachgestellt in `tnah.mjs` (Attrappe kann jetzt `zoom` und `rand`). Mit echter Kamera ungeprüft.
13. **Länge mit Bankkarte** (Fotos IMG_7267/7268, 105 cm): Vorderseite 108–109, Rückseite 106 (Ecken von Hand), beide 107 cm (+2).
    Gefundene Ursachen unterwegs: Länge war senkrechte Ausdehnung statt Außennaht (jetzt `Hout`, entlang beider Außenkanten,
    je Bein bis zu dessen Ende); Kartenecken auf der Rundung statt auf der gedachten Ecke; Kanten an inneren Mustern statt am Rand;
    zweifarbige Karte auf der Rückseite nicht automatisch gefunden (grauer Teil ähnelt dem Jeansstoff). Restfehler: 1 Bildpunkt
    an der Karte ≈ 1,3 %. **Die Originalfotos zeigen die Kartennummer und liegen NICHT im Repo**; Testkopien mit unkenntlichem
    Karteninneren in `material/testbilder/echt/karte_*.jpg` (mit Neigungsdaten).
11. **Länge zu kurz geschätzt (89 statt 105 cm, Fotos IMG_7264/7265)** (8.10.): Ursachen: (a) Vorderseiten-Foto ~11° schräg,
    Bund näher an der Kamera und darum ~20 % zu breit → Länge zu kurz; (b) Foto lag auf dem Kopf; (c) Säume berühren sich, die
    Lücke zwischen den Beinen wurde als Loch gefüllt, Schritt nicht gefunden; (d) helle Dielen zwischen den Beinen als Stoff erkannt.
    Behoben mit Neigungsdaten des iPhones, zweitem Freistellungsdurchgang (Untergrund rund um die Hose), Beinspalt aus Farbe,
    Mittel aus Vorder- und Rückseite. Ergebnis bei Bund 41 cm: 104 cm (−1 %), nur Vorderseite 102, nur Rückseite 107.
    **Der wahre flache Bund des Nutzers ist nicht bekannt**; 41 cm ist aus seinen 89 cm zurückgerechnet. Testfotos: `material/testbilder/echt/`.
    Dunkel auf dunkel ist dadurch schlechter geworden (bekannte Grenze, warnt weiter).
10. **„Hose 2 ist ein riesiger Blob“** (8.10.): Die ganze Größe hing an der obersten Fotozeile. Ragte oben etwas Dünnes heraus
    (Kabel, Bügel, Hand, Etikett) oder lag ein Gegenstand am Bildrand, war der „Bund“ nur ein paar cm breit und die Hose 5 m lang.
    Quer fotografierte Hosen ergaben riesige Beine. Behoben im Generator (`trimMask`, `garmentTurn`, seltene Randfarben ignorieren)
    und beim Laden (`normalizeProfile`). Alte kaputte Modelle: abstehende Teile werden abgeschnitten (Länge dann nur ungefähr, Hinweis
    zum Nachmessen); quer erzeugte lassen sich nicht reparieren und sind als „bitte neu erstellen“ markiert. Die echte Hose 2 des Nutzers
    habe ich nie gesehen; nachgestellt in `tblob.mjs` mit einem Speicherstand des alten Generators.

### Gesamtprüfung 8.10. (sieben Bereiche, Prüfer-Agenten, Gegenprüfung nur für Bereich 1 vollständig)

Behoben und in `tpruefung.mjs` bzw. den bestehenden Tests abgesichert: doppelte id `t-waist` (Maßband-Taille kam nie an, Rückschritt
vom 7.10.), Absturz beim Speichern der Messreihe ohne Scan, Reihenfolge Maßstab/Bund bei der Länge, Komma in allen Zahlenfeldern,
Prüfung beim Anlegen, Kreuzprüfung Bund↔Länge, Speichern erst nach dem Tippen, kurze Hosen mit eingetragenem Bund, Vorzeichen in
`garmentTurn` (quer → erst Saum nach oben, Meldung „auf dem Kopf“), Kopfstand mit sich berührenden Säumen, Spiegelung links/rechts in
`uprightProfile` (Schwelle 0,008 statt 0,004), Löschen ohne `confirm()`, Fokus nach dem Löschen, einsamer „Aus“-Knopf, Vorschau der
gelöschten Hose, alter Schlüssel `massScanEigen` holte gelöschte Hosen zurück, voller Speicher, Textur-Leck beim schnellen Umschalten,
Kartenfenster (Teilfleck beim Antippen, Neu antippen, Kreuze aus dem Bild, Drehen, Escape, Doppelstart, kein Viereck, Länge 82 m,
rohes Viereck ohne Neigungsdaten, Grammatik), Z-Drehung und Einheitsmatrix, Maßstab in der Nahphase beim Drehen, Erkennung lädt nicht,
Freistellung bei jeansfarbenem Gegenstand am Rand (`segBright` als Rückfall), eigene Meldung für zu kleine Hose, Debug-Text abgeschnitten
und gespiegelt, flaches Bild blitzt beim Umschalten auf, WebGL-Kontextverlust, AudioContext je Neustart, große Bilder, tote Funktion
`levelByReference` und ungenutzte Felder.

Offen (gefunden, nicht behoben):
- Rückseite `karte_hinten_IMG_7268.jpg`: Karte wird weder automatisch noch durch ungefähres Tippen gefunden (Maske zerfällt am
  unkenntlich gemachten Inneren); Vergrößern und vier Ecken antippen geht. Ob das an der echten, nicht verwischten Karte auch so ist: ungeprüft.
- Gegenstand seitlich an der Hose (Schuh am Bein) wird Teil der Hose; Hand auf der Hose zählt als Beinspalt; Hose in der Bildebene
  5–30° schräg gelegt → Saum −18 bis −46 % (nur 90°-Schritte werden gerade gerechnet).
- Quer fotografiert UND Säume berühren sich: Drehrichtung geraten (Hinweis erscheint). Gleiches gilt aufrecht/auf dem Kopf, wenn auch
  gedreht kein Schritt zu finden ist.
- Ohne Neigungsdaten kosten 1–2 px an den Kartenecken ±15 % Länge (kleine Karte bestimmt die Perspektive der ganzen Hose).
- Nahphase: `findCrotch` zählt frei hängende Arme als Beine (Schritt auf Hüfthöhe), Schritt- und Beinlänge zu kurz, wenn die Füße aus dem Bild sind.
- Querformat: untere Knopfreihe der Bühne wird bei großen Ansagen abgeschnitten (Schriftgrößen hängen an vw statt an der Bühne).
- Google Fonts wird von Google geladen (DSGVO-Frage für die EU, vor dem Verkauf selbst hosten).
- Doppelte Logik (Flutfüllung dreimal, Geraden-Schnitt zweimal), Test-Einblick `window.__refDlg` im Produktcode (nur solange das Fenster offen ist).

### 3D, Physik, KI-Freistellung (8.10. abends, Sprachnachricht des Nutzers)

Wunsch: Freistellung wie Photoshop, „echtes“ 3D statt Foto auf Röhre, Skelett und Physik, Stoffart bestimmt den Fall.
Umgesetzt und gemessen (Testseite, Chromium/swiftshader): siehe Tabelle oben (Licht/Relief, Seitennaht, Stauchfalten, Skinning,
Stoffphysik, Stoffarten, KI-Freistellung, „Umriss prüfen“). Rechenzeit `pose3d` ≈ 3 ms je Bild (vorher 1,6 ms), Bildzeit im
Software-Grafiktreiber 50–60 ms statt 36 ms (echte GPU deutlich schneller, ungeprüft). Dunkle Hose auf dunklem Boden: Farbweg 80 cm,
mit KI 113 cm (richtig etwa 111). Schuh am Bein: ein Tipp im Fenster → 111 cm statt 102. Die echten Fotos des Nutzers: Farbe und KI
einig, Ergebnis unverändert. Tests: `tstoff.mjs`, `tki.mjs` (KI mit MediaPipe aus node_modules und dem Modell von Google).
Offen: Hand AUF der Hose (Textur verdeckt, nur neues Foto hilft); Hose in der Bildebene schräg; KI nur v1 (v2 und MobileSAM
genauer, aber 30 MB bzw. eigene Bibliothek); echte Kamera, echte Handys und iPhone-Safari weiter ungeprüft.

9.10. (Recherche-Agenten: 3D-Aussehen, Stoffphysik): Innenseite und Körper als Verdecker, Hände vor der Hose, Bund/Saum mit Dicke,
Gesäß-Querschnitt, Bogenlänge, Schatten nur auf der Person, Saumstauchung ohne übereinanderliegende Zeilen, Stoffphysik mit Längen- und
Umfangsschutz, neue Stoffwerte und Stofferkennung. Gemessen in `tdarstellung.mjs` und `tstoff.mjs`; Gegenprobe mit dem alten Stand: 5 Prüfungen
schlagen dort fehl. Nicht gelöst: echte Stoffsimulation (XPBD, im Node-Prototyp 3–10 ms je Bild, nicht eingebaut); in der Attrappe fehlt der
Arm im Kamerabild, daher sehen die Ausschnitte für Hände/Arme dort wie Löcher aus (mit echter Kamera ist dort der Arm).
Schnellprüfung 9.10. (zwei Prüfer, nur Code): behoben sind Faltenring am Schritt (falscher Ruheabstand über den Schritt), Faltensprung an der
Schrittzeile, Nahtrisse durch Falten (Normalen auf Nähten gemittelt), Stoffzustand der alten Hose nach Hosenwechsel, unvollständiger Reset nach
Kontextverlust, Kamera lief weiter, wenn die Shop-Anprobe während des Starts geschlossen wurde (`camGen`), gelöschte Hose aus `hosen.json` kam
wieder, fremde Dateien konnten HTML einschleusen (nur `data:image`-Bilder und einfache Schlüssel, Escaping in der Liste), toter Verlaufseintrag
bei verweigerter Kamera, GLB beim Hosenwechsel während des Exports, Stoffanzeige ohne Name.

### Passform des 3D-Modells (9.10. nachts, Auftrag des Nutzers: Proportionen, Sitzhöhe, Gesäß, Innenteile)

Ursachen (gemessen an den Kartenfotos des Nutzers, IMG_7267/7268, und den Bershka-Fotos):
- **Oberschenkel zu lang, Unterschenkel zu kurz**: Die ganze flache Leibhöhe (52 cm!) wurde senkrecht gezeichnet, der Schritt hing
  fast am Knie. Zwei Gründe: (a) der Schritt im Foto lag am oberen Ende des sichtbaren Spalts, bei V-förmig gespreizten Beinen aber
  10 % der Länge zu tief (0,48 statt etwa 0,37); (b) flach gemessen ist die Leibhöhe länger als am Körper senkrecht (Schrittbogen).
- **Oberschenkel zu dick**: die Zeilen knapp über dem sichtbaren Spalt enthielten beide gespreizten Beine (Ballon, Hüftumfang bis
  130 cm), dazu 16 cm Überblendung von der Beckenellipse in die Beine. Jetzt Hüftweite begrenzt, 6 cm Übergang, Beine rund.
- **Sitzhöhe**: Bund saß 1,5 % der Länge (≈ 1,6 cm) über dem Hüftknochen; jetzt `PASSFORM.sitzCm` = −0,5 cm.
- **Gesäß nach unten gezogen**: Rückseite hatte ihren Schritt tiefer als die Vorderseite und das Gesäß lag bei 68 % der (zu langen)
  Leibhöhe, also etwa 35 cm unter dem Bund. Jetzt Rückseite ausgerichtet (`alignRows`), Gesäß `gesaessCm` unter dem Bund.
- **Innenetikett vorne oben**: siehe `innerTopCut`. Drei Ansätze erwogen: (A) Bildanalyse im Vorderseitenfoto (gewählt, automatisch,
  kein Netz nötig), (B) Innenbereich aus dem Vergleich mit dem Rückseitenfoto (die Rückseite zeigt den hinteren Bund von außen;
  nicht gewählt, weil Lage, Neigung und Licht beider Fotos verschieden sind; nicht ausprobiert), (C) KI-Segmentierung von
  Etiketten (eigenes Modell und Trainingsdaten nötig, mehrere MB mehr; nicht ausprobiert). Zusätzlich
  zeigen Innenflächen nie mehr das Außenfoto (`uin`).
- Nebenbei gefunden: Holzboden im Beinspalt als Fleck auf dem Oberschenkel (Spalt zu schmal, `findGaps`); Knick in der Seitenansicht
  am Schritt (Schrittbogen hörte am Schritt schlagartig auf).
- Unterwegs selbst eingebaut und wieder behoben: (a) Etikett-Erkennung schnitt auf künstlichen Untergründen (`tgenerator`) den
  normalen Bund weg → Schwelle `innenKante`; (b) gestauchte Leibhöhe machte die ganze Hose kürzer als gemessen (100 statt 107 cm)
  → Beine füllen wieder bis zur Länge auf (`tpassform` prüft das).

Ergebnis an den Fotos des Nutzers (Puppe 179 cm): Leibhöhe am Körper 27 statt 52 cm, Schritt der Hose 10 cm unter dem Körperschritt
(Super-Baggy), Gesäß 18 cm unter dem Bund (vorher ≈ 35), Oberschenkel von vorn 63 % der flachen Breite. Vorher/Nachher-Bilder
wurden erzeugt, liegen aber nicht im Repo. **Mit echter Kamera nicht geprüft.** Grenzen: Etikett-Erkennung nur an einem echten
Foto erprobt (dazu Bershka: richtig nichts erkannt); helle Hose mit hellem Etikett oder dunkler Innenbund auf dunkler Hose ungeprüft;
gerade Hosen (nicht Baggy) nur über Bershka geprüft.

### Dateien hochladen (10.10., Sprachnachricht des Nutzers)

Wunsch: zum Testen einfach Dateien aus Shops hineinwerfen (Foto vorne flach, hinten flach oder getragen, Maßtabelle), die
Seite erkennt selbst, was was ist, sagt sofort, was fehlt, und lehnt ab, was keine realistische Hose ergibt.
Umgesetzt (siehe Tabelle oben, Test `tdateien.mjs`). Geprüft an zehn Bershka-Screenshots des Nutzers, den Bershka-Produktfotos,
seinen Kartenfotos und künstlichen Bildern. **Nicht geprüft:** echte Fotos von hinten mit Person (keine vorhanden; das Abwickeln
ist nur am künstlichen Bild gemessen), echte Maßtabellen mit Hosenmaßen als Bild (nur Text und der Bershka-Leitfaden mit
Körpermaßen), andere Shops, Handy-Safari. Bankkarte/A4 im Foto wird beim Hochladen nicht benutzt (dafür das Einzel-Formular).
Bekannt: verschwommene (noch ladende) Bilder in Screenshots werden nicht zerlegt; ein Jeans-Hosenrock gilt nicht als Hose.

## Entscheidungen und Erkenntnisse, die man nicht noch einmal herausfinden muss

- **3D-Modell statt Gaussian Splat.** Ein Splat braucht viele Ansichten und Training auf einer Grafikkarte; aus zwei Fotos im Browser geht das nicht. Splats auf bewegten Körpern sind Forschungsstand. Das Splat-Wissen im Team taugt später für drehbare Produktansichten.
- **KI-Bild-zu-3D (Hunyuan3D) getestet und verworfen.** Aus flach fotografierten Hosen macht es flache Hosen (117 breit, 17 tief). Getragene Form kommt aus den Maßen, nicht aus der KI.
- **Flache und getragene Fotos lassen sich nicht mischen**; Model-Fotos haben je Bild eine andere Pose.
- **Passform kommt aus Zentimetern.** Größentabellen der Shops (Bershka) nennen nur Körpermaße, Produktfotos haben keinen Maßstab. Mindestens ein Maßband-Wert pro Hose ist nötig.
- **Die Tiefenschätzung von MediaPipe ist unruhig.** Nie allein darauf bauen.
- **Kamera braucht https.** Der Nutzer zieht einen Ordner mit `index.html` auf app.netlify.com/drop (ohne Konto, jedes Mal neue Adresse).
- Shopify: Theme App Extension (App-Block), Billing API, 3D-Modelle als Datei am Produkt. Das fertige Hosenmodell ist rund 120 KB.

## Was der Nutzer mag und nicht mag

- Will Dinge **erledigt bekommen**, nicht selbst basteln („ich werde jetzt nicht Blender öffnen“).
- **Live**, nichts Vorgerendertes.
- **Ruhige Oberfläche**: Texte dürfen nicht schnell wechseln, große lesbare Schrift, Symbole statt Wörter auf Knöpfen.
- Tracking soll **ruhig** sein; Punkte dürfen nicht springen, auch wenn Hände vor der Hüfte sind.
- Hose sitzt auf den **Hüftknochen**, nicht in der Taille.
- Kamera muss beim Tippen **sofort** starten und den weitesten Winkel nehmen.
- Schreibt oft per Spracheingabe; „Buntweite“ heißt Bundweite.
- Antworten kurz, ehrlich, mit klarer Aussage, was geprüft ist und was nicht.

## Testen

```sh
npm install
npm test          # baut die Testseite neu und prüft alles
npm run diagnose  # Freistellung im Detail und Bildserie mit Knie, Ausgabe in werkzeuge/tests/ausgabe/
```

Die Testseite `werkzeuge/tests/testseite-mit-simulierter-person.html` wird von `baue-testseite.mjs` aus `app/index.html` erzeugt
(Attrappe aus `attrappe.js` statt MediaPipe, feste Umgebungsfarbe, Einblick über `window.__dbg`). **Nie von Hand ändern.**
Steuerung der Attrappe über `window.__mode`: `yaw`, `knee`, `wide`, `sway`, `zk` (Tiefe an/aus/verkehrt), `zn` (Knöchel scheinbar näher),
`zr` (Tiefe zittert), `hand` (linke Hand vor dem Oberschenkel). Die Attrappe setzt die Handpunkte 17–22 an die Handgelenke wie MediaPipe.
Die KI-Freistellung lädt in der Testseite nur, wenn `window.__kiTest` gesetzt ist (nur `tki.mjs`); sonst gäbe fehlendes Netz Fehlermeldungen.

| Test | prüft |
|---|---|
| `th.mjs` | Schnellstart, Saum, Drehung |
| `tg.mjs` | Anlegen, Speichern, Löschen, HEIC ohne Netz |
| `tf.mjs` | Drehung bei kaputter Tiefe |
| `tbreite.mjs` | Saumbreite im Bild bei verrauschter Tiefe |
| `tgenerator.mjs` | Maße aus Fotos auf fünf Untergründen (Testbilder aus `werkzeuge/python/testhintergruende.py`) |
| `theic.mjs` | HEIC-Umwandlung mit heic-to und heic2any |
| `thosen.mjs` | Maßfelder live und mit ungültigen Eingaben, eigene Werte je Hose, Löschen der angezeigten Hose, Grafikspeicher frei |
| `tblob.mjs` | Problemfotos (quer, etwas ragt heraus, Fuß) und alter Speicherstand mit Blob-Hose |
| `tnah.mjs` | Nahphase wie mit echter Kamera (näher kommen, Füße/Knie aus dem Bild, Knie hoch), Debug-Werte, Drehknöpfe, Aufrichten beim Laden |
| `tkarte.mjs` | Bankkarte mit den echten Fotos: automatisch, von Hand, Warnung bei verzogener Karte, Vorrang der eingetragenen Länge |
| `tstoff.mjs` | Stoff aus Materialangabe (DE/EN), Auswahl bleibt, Physik ohne NaN, fließender Stoff schwingt und hängt mehr, Bund bleibt am Platz, stabil bei 10 Bildern/s, Stauchfalten |
| `tdarstellung.mjs` | Hand vor der Hose schneidet sie aus und schließt sich wieder, kein Schatten-Schleier am Rand zum Hintergrund, Kontaktschatten unter dem Saum, Saumzeilen monoton, Bund hinten höher, Randpunkte, keine WebGL-Fehler/ungültigen Werte in vier Lagen |
| `tsammlung.mjs` | Alle Hosen als Datei sichern (Inhalt, Werte), auf leerem Gerät laden, doppelt laden, falsche Datei, `hosen.json` neben der Seite über einen lokalen Server (nicht im Gerät gespeichert, Ändern macht sie zur eigenen, Löschen bleibt), Speicher voll |
| `tansicht.mjs` | 3D-Ansicht erscheint mit Hose, Ziehen dreht, 3D-Datei gültig (Khronos-Prüfer) und in Metern, Ansicht aus während der Anprobe |
| `tki.mjs` | KI-Freistellung (dunkel auf dunkel, weißer Grund einig, quer), Fenster „Umriss prüfen“ (öffnet bei Uneinigkeit, Schuh weggetippt → Maße stimmen, Schutz gegen Löschen der Hose, Escape) |
| `tpassform.mjs` | Passform (9.10.) mit den echten Kartenfotos und den Bershka-Fotos: Schritt bei gespreizten Beinen, Innenbund erkannt, Etikett weg, kein Boden auf dem Bein, Leibhöhe am Körper, Schritt höchstens 12 cm unter dem Körperschritt, Gesäß 6–20 cm unter dem Bund, Oberschenkel ≤ 80 % der flachen Breite, `sitzCm` wirkt, Bershka ohne Innenbund. Gegenprobe mit dem alten Stand: Schritt, Innenbund, Etikett und Boden schlagen fehl (3D-Kennwerte gibt es dort nicht) |
| `tdateien.mjs` | Dateien hochladen: back/front richtig eingeordnet, Bershka-Screenshot zerlegt, Tabelle als Text (Größe M, dann XL), Material, Größentabelle als Bild (Texterkennung, Körpermaß → Bund 43), nur Tabelle → „fehlt“, Model-Foto erkannt und nicht benutzt, getragene Rückseite (künstlich, `werkzeuge/python/testgetragen.py`: Taschen oben, Kniefleck auf Kniehöhe), schiefes Bein und Handtuch abgelehnt (`testunecht.py`), Strg+V, Einzel-Formular lehnt ebenso ab. MediaPipe und Tesseract aus node_modules, Modelle von storage.googleapis.com |
| `tpruefung.mjs` | Rückschritte der Gesamtprüfung: Maßband-Taille, Komma, Prüfung beim Anlegen, quer/Kopfstand mit sich berührenden Säumen (`material/testbilder/orientierung/`), links/rechts beim Aufrichten (roter Fleck), kurze Hose, Drehknöpfe, WebGL-Kontextverlust, Kartenfenster (Escape, kein Viereck), alter Speicherschlüssel, voller Speicher |
| `tlaenge.mjs` | Länge mit A4/Bankkarte (Testbilder aus `werkzeuge/python/testmassstab.py`, echt 105 cm, gerade und 15° schräg), echte iPhone-Fotos des Nutzers, Vorrang der eingetragenen Länge |

## Vorschlag für die nächsten Schritte

1. Echte Handyfotos des Nutzers besorgen und daran die neue Freistellung prüfen; mit echter Kamera bestätigen, dass die Hose nicht mehr nach unten breiter wird.
2. Die eine Datei in Module zerlegen (Kamera, Pose, Messung, Generator, Darstellung, Oberfläche), mit einem einfachen Build. Erst danach wird es in Claude Code angenehm zu ändern.
3. Passform sichtbar machen: Hose dort einfärben, wo ihr Umfang kleiner ist als der gemessene Körperumfang. Die Körpermaße liegen aus dem Scan schon vor.
4. Shopify-Gerüst: App-Vorlage, Theme App Extension, Modell als Datei am Produkt speichern.
5. Messgenauigkeit mit 20–30 Personen gegen das Maßband prüfen (die Messreihe in der Seite ist dafür da).
