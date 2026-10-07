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
| `app/index.html` | **Aktueller Stand.** Eine einzige Datei, rund 94 KB, kein Build-Schritt. |
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

**Rechtlicher Hinweis:** Die Bershka-Bilder sind nur interne Testdaten. Für ein echtes Produkt braucht es eigene Fotos oder die Erlaubnis der Marke. Der Nutzer will ab jetzt mit eigenen, selbst fotografierten Hosen arbeiten.

## Wie die Seite funktioniert

Reines HTML mit einem `<script type="module">`. Zwei Dinge werden zur Laufzeit von jsDelivr nachgeladen:
MediaPipe Tasks Vision 0.10.18 (Pose-Erkennung mit Segmentierungsmaske) und bei Bedarf `heic-to` 1.6.5 für iPhone-Fotos
(Ausweichlösung `heic2any` 0.0.4).

Ablauf für den Anwender: Größe eingeben → Kamera → Frontal-Scan → Seiten-Scan → Nahphase mit Anprobe.

### Die wichtigsten Stellen im Code

| Funktion | Aufgabe |
|---|---|
| `openStream`, `startCamera` | Kamera zuerst (im Tipp-Ereignis), dann Modell laden. Sucht hinten die Ultraweitwinkel-Linse, fährt den Zoom heraus, setzt `cam.fk` (Brennweite als Anteil der langen Bildseite: 0,8 normal, 0,42 Ultraweit, **geschätzt**). |
| `analyse(res)` | Herzstück je Bild: Landmarken glätten, Maßstab, Messwerte, Coaching, Knochen, Aufruf von `drawGarment`. |
| `emaV`, `emaBand` | One-Euro-Filter mit Ausreißer-Sperre (Sprung > 0,09 wird bis zu 8 Bilder ignoriert). **Nicht für Winkel benutzen**, dafür ist er zu träge. |
| `bodyYaw` | Drehung der Person. Betrag aus Schulter- und Hüftbreite relativ zur Rumpflänge, Vorzeichen aus Fußspitzen, Nase und Tiefe. Wird beim Frontal-Scan geeicht (`fc.cal`). |
| `buildGarment`, `segGarment`, `cropGarment`, `garmentProfile` | **Generator**: zwei Fotos → Modell, komplett im Browser, etwa 0,3 s. |
| `mesh3d`, `pose3d`, `draw3d` | 3D-Netz, Lage je Bild, WebGL-Darstellung in eine eigene Fläche, die dann auf das 2D-Overlay gelegt wird. |
| `drawGarment` | Entscheidet 3D oder alter 2D-Weg, rechnet Gelenke perspektivisch zurück, Lichtanpassung. |
| `coach`, `cue`, `say`, `pickVoice` | Ansagen: große Texte mit Trägheit, Sprachausgabe, Stimmenauswahl. |
| `saveOwn`, `loadOwn`, `addOwnGarment` | Eigene Hosen in `localStorage` (Schlüssel `massScanHosen`). |

Weitere `localStorage`-Schlüssel: `massScanSerie` (Messreihe), `massScanPerson`, `massScanStimme`.

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
```

Dazu am Kleidungsstück: `waist` (Bund flach in cm, **der einzige Maßstab**), `hem` (ein Bein unten in cm, optional, korrigiert die Weite linear vom Schritt zum Saum), `estFlat` (40 cm, Notwert).

Geometrie: flach gemessene Breite wird in **Umfang** umgerechnet. Über dem Schritt eine Ellipse mit Umfang 4·hw und Tiefe/Breite 0,62. Darunter je Bein ein Kreis mit Umfang 2·hw um die Knochenkette Hüfte→Knie→Knöchel. In den ersten 16 cm unter dem Schritt wird zwischen beidem übergeblendet. Hebt oder spreizt sich ein Bein, zieht es den Stoff oberhalb des Schritts mit (`wdev`). Untere Zeilen folgen träger (Nachschwingen), zu lange Beine stauchen sich am Knöchel.

Darstellung: orthografische Lage plus Perspektive im Vertex-Shader (`foc`, `pc`), Tiefenpuffer, und im Fragment-Shader wird alles verworfen, was von der Kamera wegzeigt. Dadurch sieht man nie die abgewandte Seite.

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
`zr` (Tiefe zittert).

| Test | prüft |
|---|---|
| `th.mjs` | Schnellstart, Saum, Drehung |
| `tg.mjs` | Anlegen, Speichern, Löschen, HEIC ohne Netz |
| `tf.mjs` | Drehung bei kaputter Tiefe |
| `tbreite.mjs` | Saumbreite im Bild bei verrauschter Tiefe |
| `tgenerator.mjs` | Maße aus Fotos auf fünf Untergründen (Testbilder aus `werkzeuge/python/testhintergruende.py`) |
| `theic.mjs` | HEIC-Umwandlung mit heic-to und heic2any |

## Vorschlag für die nächsten Schritte

1. Echte Handyfotos des Nutzers besorgen und daran die neue Freistellung prüfen; mit echter Kamera bestätigen, dass die Hose nicht mehr nach unten breiter wird.
2. Die eine Datei in Module zerlegen (Kamera, Pose, Messung, Generator, Darstellung, Oberfläche), mit einem einfachen Build. Erst danach wird es in Claude Code angenehm zu ändern.
3. Passform sichtbar machen: Hose dort einfärben, wo ihr Umfang kleiner ist als der gemessene Körperumfang. Die Körpermaße liegen aus dem Scan schon vor.
4. Shopify-Gerüst: App-Vorlage, Theme App Extension, Modell als Datei am Produkt speichern.
5. Messgenauigkeit mit 20–30 Personen gegen das Maßband prüfen (die Messreihe in der Seite ist dafür da).
