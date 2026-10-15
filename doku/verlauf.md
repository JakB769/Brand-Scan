# Verlauf: Stand der Dinge und Arbeitsnotizen je Sitzung

Aus `CLAUDE.md` ausgelagert (13.10.2026), Inhalt unverändert. Neue Sitzungsnotizen kommen hier ans Ende, nicht in `CLAUDE.md`.

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
9. Hosen mit zwei Beinen und (seit 10.10.) Röcke; Kleider, Overalls, Hosenröcke nicht.
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
- ~~Nahphase: `findCrotch` zählt frei hängende Arme als Beine~~ (11.10. behoben: Suche nur zwischen den Beinachsen); Schritt- und Beinlänge gibt es nur, wenn die Füße im Bild sind.
- Querformat: untere Knopfreihe der Bühne wird bei großen Ansagen abgeschnitten (Schriftgrößen hängen an vw statt an der Bühne).
- ~~Google Fonts wird von Google geladen~~ (11.10.: Systemschrift, nichts mehr von Google Fonts).
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
Danach (10.10.): Röcke und Gürtelentfernung (Anlass: Zalando-Rock mit Gürtel, den der Nutzer schickte). Die vier Shop-Links des
Nutzers (Hollister, Diesel, Jack & Jones, Zalando): Röcke und Gürtel geprüft nur an künstlichen Bildern (`werkzeuge/python/testrock.py`:
schwarzer A-Linien-Rock mit braunem Gürtel, Bershka-Jeans mit aufgemaltem Gürtel).
Nach Freigabe des Netzes (10.10.) Produktbilder von Diesel und Jack & Jones mit Chromium über den Proxy geholt (nur im Scratchpad,
**nicht im Repo**, fremde Bilder) und durch „Dateien hochladen“ geschickt. Diesel 1971 D-Sent: flache Vorderseite (Innenbund erkannt)
+ Model von hinten → Rückseite aus dem getragenen Foto (Taschen oben, Beine sauber abgewickelt), Model von vorne nicht benutzt; vorher
wurde das Rückenfoto als „von vorne“ eingeordnet → neue Merkmale in `personInfo`. Länge 126 cm nur geschätzt (Normbund 40, Model trägt
W26; die Seite nennt „Modell trägt Größe 26 und ist 175 cm“, daraus ließe sich die Länge schätzen, nicht eingebaut). Jack & Jones Shorts:
schwarz auf schwarzem Grund flach erkannt (Länge 67, Bund 40 geschätzt); das Model-Foto ab Hüfte wurde vorher als Rückseite benutzt →
Haut-Regel in `classifyFlat`. Hollister (418) und Zalando (502) sperren automatische Abrufe (Bot-Schutz): dort nur per Screenshot.

### Link einfügen, Größe und Abgleich mit dem Foto mit Model (10.10. abends, Sprachnachricht des Nutzers)

Rückmeldung: „Hose viel zu klein, Saum 30 cm über dem Boden“, Link soll reichen, 3D realistischer, Passform am Foto mit Model
prüfen. Befund: Die Anzeige „Saum … über Boden“ rechnet richtig (Hüfthöhe − Länge, geprüft: 80 cm → 21 cm, 60 → 41); die
**Länge** war ohne Maßtabelle aus dem Normbund 40 cm geschätzt (Diesel 126 statt 107,5; J&J-Shorts 67 statt etwa 48;
Zalando-Rock 87 statt etwa 49). Dazu: eine 3D-Hose mit weniger Umfang als der Körper schwebte zu klein vor dem Becken.
Gemacht (siehe Tabelle oben, Test `tlink.mjs`): Server-Teil, Link-Feld, Shop-Tabellenformate, Model-Größe, Länge am Foto,
Abgleich, flachere Beine, Körper als Mindestweite, Licht, Farbe. Ergebnisse mit den vier echten Links des Nutzers
(nur Scratchpad, **fremde Bilder nicht im Repo**), alle per Link aus der Cloud erreichbar:
- Diesel 1971 D-Sent: Größentabelle (Produktmaße je Größe) gelesen, Größe 26 wie am Model: Bund 36,5, Länge 107,5
  (85 + 22,5), Saum 24,5. 3D auf dem Model-Foto deckungsgleich (Länge, Weite).
- Hollister Baggy: keine Tabelle, „6'2" wearing 32 X 34“ → Länge 114, Bund 42. Farbe angeglichen (vorher 44 % zu dunkel).
- Jack & Jones Shorts: Länge 42 cm am Foto gemessen (Model-Größe unbekannt, 180 angenommen), Weite am Foto angepasst.
- Zalando-Rock: als Rock erkannt (welliger Saum zählte vorher als Kerbe), Länge 49 am Foto, Rock sitzt in der Taille.
Grenzen: Model-Größe oft nicht auf der Seite (J&J nur als Platzhalter, Zalando lädt sie nach) → angenommen; Ghost-Mannequin-
Bilder (Zalando) zeigen die Weite von vorn, nicht flach; Maske am Model-Foto schließt manchmal Oberteil und Haare ein
(Länge davon unberührt). **Mit echter Kamera und auf Netlify nicht geprüft**; der Server-Teil lief nur lokal (`werkzeuge/server.mjs`).

### Messpunkte, Stoff-Fall, Shirt über dem Bund, Größen (11.10., Sprachnachricht des Nutzers)

Wunsch: alle Messpunkte immer richtig; 3D viel realistischer, vor allem die Falten unten; Bund auf den Hüftknochen, Shirt
über der Hose; Beine bis unten (nicht schweben, nicht zu hoch); Deckkraft 100 %; beim Link alle Größen, Größe wählbar,
und dazu, welche passt, welche zu groß/zu klein, welche skinny/baggy sitzt.
Gemacht (siehe Tabelle oben): Messpunkte (`findCrotch`, `legRun`, Hüftband), feineres Netz, Stoff-Fall per Simulation
(`drape3d`), Oberteil über dem Bund (`shirtHem`), Größen mit Urteil, Deckkraft 100 %. Neues Werkzeug **Prüfstand**
(`werkzeuge/pruefstand.mjs`): echte Seite mit echter Erkennung, ein Foto als Kamerabild (Chromium-Testkamera aus .y4m).
Damit an den Model-Fotos der vier Shops geprüft (fremde Bilder nur im Scratchpad): Hüftband über die ganze Hüfte, Schritt
nicht mehr auf Hüfthöhe, Beinbreiten je Bein, 3D-Hose mit Bund an der Bundlinie und Saum am Boden; Hollister-Hose (114 cm bei
188 cm) staucht sich weich auf den Schuhen. Unterwegs gefunden und behoben: Saum klappte in der Simulation wie eine Manschette
um und zeigte hell die Innenseite (flache graue „Lappen“ am Boden).
**Nicht geprüft:** echte Kamera, echte Handys, Rechenzeit der Simulation auf dem Handy (hier 0,8–1 s am Stück, in der Anprobe
verteilt), Shirt-Erkennung bei gemusterten Oberteilen, Händen am Bauch, schlechtem Licht; Größenurteil an echten Anproben
(Schwellen sind Erfahrungswerte). Grenzen: Größenurteil braucht Körpermaße (Scan mit Seite oder Maßband); ohne Tabelle sind die
Größen nur abgeleitet; Länge ändert sich bei W-Größen nur mit der Leibhöhe (Innenbein bleibt).

### Feinschliff, Sicherheit, Shopify (11./12.10., Sprachnachricht des Nutzers)

Wunsch: 3D so gut wie möglich, Erkennung am getragenen Foto besser, Sicherheitslücken prüfen, Shopify-tauglich, aufräumen,
Design wie Apple, Punkte auch bei wilden Bewegungen (Backflip), schneller Scan, nicht zur Seite drehen müssen, sofort näher gehen.
Gemacht (siehe Tabelle oben): Scan-Ablauf, `torsoRoll` bis Handstand, `emaV`, `personBounds`, `wornRefine`, Gesäßfall,
Längenbegrenzung und `fallInnen` im Stoff-Fall, Gestaltung, Kunden-Modus, Shopify-Gerüst.
**Sicherheit** (selbst geprüft; die Prüf-Agenten brachen am Nutzungslimit ab):
- `holen.mjs`: Die Sperre für das eigene Netz ließ IPv4 in IPv6 verpackt durch. Die URL schreibt `[::ffff:127.0.0.1]` als
  `[::ffff:7f00:1]`, der alte Vergleich sah darin keine IPv4. Ebenso NAT64 und 6to4 (z. B. `[::ffff:169.254.169.254]`, Cloud-Metadaten).
  Jetzt zerlegt `v6Bytes` jede IPv6 in 16 Bytes, `privat` prüft die eingebettete IPv4. In `tlink` abgesichert.
  Cookies einer Weiterleitung gehen nur noch an den Shop, der sie gesetzt hat.
- `werkzeuge/server.mjs`: Mit `%2F..%2F` kam man in einen Nachbarordner, dessen Name mit dem Repo-Namen anfängt
  (geprüft: Datei aus `Brand-Scan-x` gelesen). Jetzt ist das gesperrt, ebenso `.git`, und der Server ist nur noch auf diesem Rechner erreichbar.
- Seite: fremde Texte werden beim Anzeigen maskiert (Prüfung bestätigt). Nachgezogen: Schlüssel in der Hosenliste,
  Model-Größe, Name in der Messreihe. `heic2any` vom CDN mit Prüfsumme (`integrity`, sha384, gleich der Datei in node_modules).
  Die übrigen CDN-Teile werden per `import()` geladen; dafür gibt es keine Prüfsumme, die Versionen sind fest.
- Offen: DNS-Rebinding in `holen.mjs` (Adresse wird vor dem Verbinden geprüft, nicht beim Verbinden; auf Netlify nur Port
  80/443 und kein Metadaten-Dienst, auf einem eigenen Server Firewall), `?bild=` ist ein offener Bild-Abruf für öffentliche
  Bilder (Kosten, keine Daten), keine Zugriffsgrenze je Nutzer, keine Content-Security-Policy (Hauptskript ist eingebettet).
**Fehlersuche:** Stoff-Fall nach Neubau derselben Hose (siehe `m3Id`), alle `$("id")` der Seite vorhanden, keine doppelten
ids, keine in Safari fehlenden Funktionen (kein `ctx.filter`, `structuredClone`, `OffscreenCanvas`).
**Aufräumen:** alte Testskripte `t.mjs`–`te.mjs`, tote Coach-Elemente, alte Seiten-Phase. `tbreite` misst ohne Stoff-Fall
(eine zu lange Hose staucht sich gewollt bis 15 % weiter).
**Verworfen:** Glockenfalten im Rock per Anfangswelle im Stoff-Fall. Die Simulation glättet sie wieder weg, auf dem schwarzen
Testrock ist ohnehin nichts zu sehen.
**Nicht geprüft:** echte Kamera und Handys (wie bisher), Shopify mit echtem Shop/CLI/Theme-Editor, Kamera über die Shop-Adresse.

### Sechs Aufgaben (12.10., Auftrag des Nutzers)

1. **3D-Hose hinkt hinterher**: Ursache waren die Filter (Knochen über `emaV` mit Ausreißer-Sperre, Bundlinie und Schritt über den
   langsamen Messwert-Filter). Jetzt `jv` für alles, was die Hose bewegt (siehe Tabelle). Gemessen in `tlag` (Attrappe hebt das Knie
   sinusförmig, Kreuzkorrelation Knie-Punkt ↔ Hosen-Netz): Skelett 20 ms, Hosenbein 30 ms, Ausschlag voll, nach einem Sprung 2 Bilder später am Ziel.
2. **Hüftpunkte**: `hipFix` (Anatomie, Scan). Grundlage: Model-Fotos der Shops am Prüfstand (MediaPipe 1–4 cm zu tief). Mit echter
   Kamera ungeprüft; wenn es noch falsch sitzt, Bildschirmfoto mit Debug-Ansicht.
3. **Handy**: Frontkamera als Vorgabe, Wechsel mit Rückfallwegen (`getCam`, `camBusy`), Tempo (`PERF`). Geprüft in `tkamera` mit
   nachgestelltem `getUserMedia` (belegt, Overconstrained, ganz kaputt, dreifach getippt). **Safari/WebKit ist hier nicht installiert**
   (nur Chromium): iOS-Wege nur nach Doku gebaut, nicht ausgeführt.
4. **Hosen dauerhaft** über Links und Fassungen: Sammlung auf dem Server (`hosen.mjs`, Netlify Blobs), ✕ mit „Löschen?“ (gab es schon,
   löscht jetzt auch oben). Geprüft in `tspeicher` mit zwei Browsern und einem Ordner statt Netlify Blobs; **auf Netlify nicht geprüft**.
5. **Flachfoto nicht erkannt**: Rückschritt ed215a1 (Hautregel), siehe Tabelle. Mit Fotos des Nutzers (Holzboden) und ohne Maßtabelle
   geprüft (`tflach`), dazu Bankkarte beim Hochladen.
6. **Größentabellen anderer Formate**: siehe `sizeSeries` usw. und `holen.mjs: groessen`. Geprüft in `tvarianten` und `tlink`
   (künstliche Shopify-Seite mit 8 Varianten, Maße nur für 32/32). Echte Shopify-Shops, die Maße erst per Skript nach dem Klick laden
   (nicht in Beschreibung oder `.js`), bekommt der Server-Teil nicht: dort Text der Variante einfügen.

### Fünf Aufgaben (12.10. abends, Auftrag des Nutzers mit vier Bildschirmfotos der Anprobe)

1. **Anprobe ließ sich nicht ausschalten**: siehe `camUI`. Geprüft in `tansicht` (dreimal aus/an, Spuren gestoppt, 3D-Ansicht wieder da).
2. **Saum verzogen/nach vorn**: Ursache im Stoff-Fall (Schuh als Kapsel, zu viel Ausstellen), siehe Tabelle. Dazu aus den
   Bildschirmfotos: Hose stand kopf bei falsch erkannten Beinen (`legSanity`, Sprung-Sperre). Geprüft in `tfall` (mit Gegenprobe)
   und `tscan`, Bilder Seite/schräg/vorne/hinten bei 170/179/187 cm. Offen: bei 7 cm Überlänge von hinten ein kleiner dunkler
   Faltenwinkel; ob die Hose in der Seitenansicht live richtig herum gedreht ist (Vorzeichen aus Fußspitzen), ist mit echter
   Kamera ungeprüft (auf einem Bildschirmfoto stand der Saumstapel hinter dem Fuß).
3. **Vorder-/Rückseite**: Felder, `pocketEdges`/`sideCheck`, `plainBack`. Geprüft in `tseiten`. Grenze: Merkmal an drei Paaren
   eingestellt; Hosen ohne aufgesetzte Gesäßtaschen (Chino mit Paspeltaschen, Jogginghose) geben schwache Werte → eher keine
   Warnung als eine falsche. Die Originalfotos IMG_7267/7268 des Nutzers (Kartennummer lesbar) wurden nur im Scratchpad benutzt.
4. **Testprofile** Fabian 1,87 m, Philip 1,70 m (`tbedienung`).
5. **Sprachausgabe** standardmäßig aus, Lautsprecher-Knopf (`tbedienung`).
Wie bisher: nur Chromium (kein Safari/WebKit hier), keine echte Kamera.

### Sechs Aufgaben (12.10. nachts, Auftrag des Nutzers mit Bildschirmfoto: Rückseite als „Foto mit Person“ verworfen)

1. **Rückseite ging verloren** (zweimal nur aus der Vorderseite gebaut): Hautregel in `classifyFlat` (siehe Tabelle), zweites Loch
   beim Hochladen nacheinander, Knopf ↪ und Meldung, dazu `sideSlope` (Passe gegen Vordertaschen). Geprüft mit den HEIC-Originalen
   des Nutzers (Chromium) und wie Safari weich verkleinerten Kopien (nur Scratchpad), zusammen, nacheinander, Rückseite zuerst:
   beide Fotos benutzt, Rückseite zeigt Gesäßtaschen und Passe (Bild `ausgabe/rueckseite_deine_jeans.jpg`, nicht im Repo).
   Zuordnung ohne Namenshinweis: 4 Paare × 2 Reihenfolgen richtig. `tseiten` Abschnitt 7.
2. **Externe 3D-Dienste**: recherchiert, nicht eingebaut (Empfehlung an den Nutzer, Entscheidung und API-Schlüssel offen).
   Tripo H3.1 Multiview (Vorne/Links/Hinten/Rechts als eigene Felder, 0,30–0,40 $ je Modell, ~2 min, Webhooks mit HMAC),
   Rodin Gen-2.5 (Vorne/Hinten beschriftet, ~0,29 $ mit Business-Abo 120 $/Monat, über fal 0,40 $ ohne Beschriftung),
   Meshy 7.1 Multi-Image (nur „Vorne zuerst“, 0,60 $, API erst mit Bezahl-Abo). Hunyuan3D-2mv: Lizenz schließt die EU aus.
   Kein Dienst ist auf Kleidung spezialisiert; alle liefern starre, geschlossene Hüllen ohne Skelett und Stoff, aus flach
   fotografierten Hosen vermutlich flache Hüllen (wie Hunyuan3D früher: 117 × 17 cm). Für die Live-Anprobe müsste man die Hülle
   neu vernetzen, riggen und simulieren; als drehbare Produktansicht taugen sie.
3. **Starke Beinbewegungen**: `legHinge`, Leistenfalte in `skin3d`, vorne kein Hebel über dem Hüftgelenk, `boden`, und die
   Drehung nach dem Scan (`bodyYaw`). Neue Attrappe `kneeHigh`, `fersePo`, `ohneArme`; Test `tbeine` (Gegenprobe mit dem alten
   Stand: Drehung 0,7 → 0,00 und 1,0 → 0,80, Unterschenkel ohne Scharnier, Innenseite bis 1,07 % sichtbar).
4. **Physik**: Was übernommen ist (Vorbilder: Skinning mit Gelenk-Korrekturen wie in Spiel-Engines, PBD/XPBD mit „long range
   attachments“ wie in Snap/Unity-Stoff, Falten aus der Stauchung wie „Wrinkle Maps“, One-Euro-Filter): Winkel-Überblendung
   statt Lage (wie Dual-Quaternion), Scharnier-Knie und Leistenfalte als Gelenk-Korrekturen, Stoff-Fall per PBD mit
   Längenbegrenzung (einmal je Hose, nicht je Bild), live nur Federn zur Form (implizit, stabil bei jeder Bildrate), Stauchfalten
   plus Schatten in den Faltentälern, schneller One-Euro-Filter für die Hose. Gemessen: Saum folgt dem Knöchel mit 60 ms bei
   7 Bildern/s (`tlag`), Rechenzeit je Bild wie vorher (Median 8,7–9 ms statt 8,3–8,8 im Software-Grafiktreiber).
   Eine volle Stoffsimulation je Bild ist weiter nicht eingebaut (am Handy zu teuer).
5. **Seitenansicht zu schmal**: `bodyDepth` (siehe Tabelle), `tdarstellung` prüft Tiefe ≥ Körper.
6. **Orangener Rand** weg (`tbedienung`).
Nicht geprüft: Safari/WebKit (hier nicht installiert), echte Kamera, echte Handys; Bein hoch/Knie/Seite nur mit der Attrappe.


### Usage, Sicherheit, Plugins (13.10., Auftrag des Nutzers aus der Video-Auswertung)

- `CLAUDE.md` von 101 KB auf rund 13 KB gekürzt, ohne Inhalt zu löschen: Code-Stellen nach `doku/code-karte.md`, Stand und
  Sitzungsnotizen hierher, Test-Einzelheiten nach `doku/testen.md`. Geprüft: jede nichtleere Zeile der alten Datei steht in einer der vier Dateien
  (einzige Änderung: Größe von `app/index.html` 330 → 470 KB).
- Rate Limiting: `holen` 120/min, `hosen` 600/min je IP (Netlify `rateLimit`, wirkt erst nach Deploy, im Deploy-Log unter
  „post-processing“ prüfen); Shopify-Server 600/min je Shop (`shopify/server/grenze.mjs`, Test `grenze.test.mjs`).
  Der offene Punkt „keine Zugriffsgrenze je Nutzer“ aus dem 11./12.10. ist damit erledigt. Weiter offen: DNS-Rebinding, CSP.
- Schlüssel-Schutz: `werkzeuge/geheimnis-pruefung.mjs` als erster Schritt von `npm test`, `.gitignore` für `.env`, `*.pem`, `*.key`.
  Der ganze Git-Verlauf (36 Commits) wurde einmal nach Schlüsseln durchsucht: nichts gefunden.
- Plugins in `.claude/settings.json`: `security-guidance`, `frontend-design`, `claude-security`, dazu (Wunsch des Nutzers) `superpowers`, `liquid-skills`, `netlify-skills`.


### 3D-Modell verbessern, Sitzung 13./14.10. (Branch `3d-modell-verbesserung`, selbstständig, Plan und Bewertung in `PROGRESS.md`)

Referenz: Jakob (1,79 m) in der hellblauen Wide-Leg-Jeans (`assets/referenz/`), dieselbe Jeans flach mit Bankkarte.
Neue Werkzeuge: `werkzeuge/vergleich.mjs` (echte Seite, echte MediaPipe, Referenzbild als Kamera, Triptychon je Pose, Umriss-
und Farbmessung), `werkzeuge/ansichten.mjs` (Hose allein in Attrappen-Posen + Blender-Renders der .glb, auch für alte Commits),
`werkzeuge/python/farbvergleich.py`, `werkzeuge/python/render_glb.py`. Modellanalyse der drei 3D-Hosen: `docs/modelle/`.

Schleife 1 (Hocke von vorn und Knie hoch von vorn waren 1/5):
1. `legSanity` verwarf Knie über der Hüfte (Schutz gegen gespiegelte Beine). Bei Kamera am Boden liegen Knie bei Knie hoch und
   Hocke über der Hüfte → Knie gilt, wenn der Knöchel desselben Beins darunter liegt (Fehlerkennung: Knöchel über dem Knie).
2. `bodyYaw`: gekippte Schulter-/Hüftlinie (Arm/Bein gehoben) galt als Drehung (frontal 0,77 rad) → Linienlänge, Mischung mit
   der breiteren Angabe (0,06).
3. Tiefe der Beine: Bezug auch die gelernte Länge von Ober-/Unterschenkel (`legCm`), sonst lagen beide Oberschenkel in der Hocke
   in der Bildebene.
4. `shirtCut` schnitt Oberschenkel vor dem Shirt aus (Rechteck in der Hocke) → Oberschenkel mit Knie über dem Shirtsaum bleiben.
5. `legHinge` spiegelte jeden Oberschenkel > 30° nach hinten → nur noch, wenn die Erkennung das Knie nicht deutlich hinter der
   Hüfte sieht (Ausfallschritt, Längsspagat).
6. Neu: `trackSure` blendet die Hose bei unsicherer Erkennung aus (Liegestütz), Test `tposen` mit neuen Attrappen-Posen.
Unter Last (Analyse + Renders parallel) fallen `tkamera`, `tstoff`, `tlag` aus; einzeln grün (siehe `doku/testen.md`).

Schleife 2 und Feinschliff (14.10.):
1. Seitenvolumen: Umriss-Messung (Personenmaske gegen 3D) über 16 Referenzposen. Bein-Querschnitt als Verlauf
   (`PASSFORM.beinTiefe/Knie/Saum` 1,0/1,1/1,25, vorher fest 0,8): von vorn 1,10 → 0,98, seitlich 0,75 → 0,81–0,96.
2. Saum: Ring saß 3,7 cm neben dem Knöchel (fester Versatz aus der Ruhehaltung) → `offR` je Zeile mit wirklicher Beinlage.
   Weite Hosen: gerade Rückenlinie (Gesäßfall `exB` über die ganze Beinlänge). Stauchfalten am Saum 1–2 große Wülste.
3. Shirt über dem Bund: Hosenfarbe auf den Oberschenkeln, Schwelle aus dem Rauschen, Saum als stärkste Kante → 15/16 Posen.
4. 3D-Export: Normalen und Dreiecks-Umlauf nach außen (Blender zeigte ein Bein schwarz).
5. Allgemeinheit: Slim-Jeans und Cargo aus 3D-Modellen als Händlerfotos gerendert (`werkzeuge/python/flachbilder.py`) und
   gebaut (`docs/nachher/zweite-hose/`). Handy-Emulation `werkzeuge/handy.mjs` (Bildrate ohne GPU nicht aussagekräftig).
6. Breite Hocke schräg: Saum hing 5 cm unter dem Knöchel → „Fuß angehoben“ auch im Bild prüfen (`P.boneImg`).
7. Rückschritt gefunden: Querschnitt-Verlauf hing an der Beinstelle, kürzere Hose wurde am Saum breiter → Stelle in der Hose.
Vorher/Nachher: `docs/vorher/`, `docs/nachher/`, Übersicht `docs/nachher/vorher-nachher_1–4.jpg`. Bewertung je Pose: `PROGRESS.md`.
8. Maßstab: in Hocke und Bücken neigt sich der Rumpf zur Kamera, die Rumpflänge im Bild täuscht (Maßstab 30–50 % zu klein,
   Hose zu klein: Hocke seitlich endete der Saum unter dem Knie, Bücken: Beine wie Strümpfe). Dazu galt im Scan die
   Körperhöhe im Bild als Größe, auch in der Hocke oder im Ausfallschritt (dort wurden auch Bein-Längen falsch gelernt).
   Jetzt: Untergrenze aus Segmenten (kein Segment im Bild länger als in echt, 10 % Spielraum), Körperhöhe nur gerade und
   senkrecht. Unabhängig geprüft (Workflow mit vier Prüfern + Gegenprüfung): eigener Zähler für gelernte Breiten,
   Unterschenkel nur bei unverkürztem Oberschenkel, weiches Lösen der Grenze, Lernen nur mit echtem Körpergrößen-Maßstab,
   Scan misst nur mit ihm. Referenz: Überlappung 0,71 → 0,77, Breitenfehler 19 → 11 %, Seitenansicht stehend Breite 0,81 → 1,0.
9. Gehobenes Bein hing 16 cm unter den Knöchel (keine Stauchung beim freien Hängen) → leicht gestaucht über 30 cm.
10. Shirt-Erkennung in der Hocke: dunkler Schritt galt als Shirt → Suche endet an der Hüftlinie, wenn die Knie hoch sind.
Offen: Perspektive der Bodenkamera (Unterschenkel näher an der Kamera, wirken größer als die Hüfte) ist nicht modelliert;
Hand-Verdeckung auf den Knien größer als die Hand; Gesäß in der Hocke seitlich hängt etwas als Sack.
11. Seitenansicht weiter Hosen: Vorderkante hängt gerade vom Knie (`exF`), statt dem Schienbein nach hinten zu folgen.
12. Drehung (15.10.): Hüpfen beim Drehen kam von der Seitenansicht: der Höhenunterschied der Schulter-/Hüftpunkte blieb als
   Breite stehen (Drehung hing bei 67°, sprang auf 107°). Jetzt nur bei waagrecht breiter Linie; Glättung als Alpha-Beta-Filter
   (Verzögerung 54 → 35 ms, Ruck 14 → 8), Ruhezone hinten weich. Werkzeug `drehung.mjs` repariert (Analysen gezählt, Scan
   vorher, eine Erkennung je Bild) und `drehung-nachrechnen.mjs` zum Prüfen ohne Browser.
13. Modellqualität (15.10.): Textur 1024 aus dem großen Foto (vermessen weiter in 900), Relief vorberechnet als zweite Textur
   (3 statt 10 Zugriffe je Bildpunkt), Mipmaps immer, Handy 512. Netz bleibt (Stoff-Fall soll bleiben). Vorher/Nachher in
   `docs/vergleich/`.
14. Passform je Zone (15.10.): Bund, Hüfte, Oberschenkel, Knie, Länge mit Bewegungszugabe je Schnitt und Stretch, Empfehlung mit
   Begründung (auch als Satz in der Shop-Ansicht), Körper notfalls aus der Größe. Handrechnung für Jakob/Fabian/Philip mit der
   Testhose stimmt mit der App (W33 / W34 / W31, siehe PROGRESS.md).
15. Nachprüfung (15.10.): unabhängige Prüfung des Tagesstands (25 Funde), selbst nachgeprüft und behoben: Abspreizen galt als
   Beugung, „gekippt“ blieb ohne Schultern hängen, Drehung schwang nach Erkennungslücken über, Kontaktschatten in der Luft,
   Boden im Spalt der geschätzten Rückseite, Vorderseiten-Details auf der Rückseite, Handy-Textur kleiner als vorher, mehrere
   Passform-Randfälle (Stretch, Maßband-Taille, Shorts, Röcke, Oberschenkelhöhe, Längen-Wortlaut). Tests, die nicht scheitern
   konnten (`tbeine`, Hysterese und Einzelsprung in `tausblenden`), repariert; neuer Test `tstoffbild`.
16. Zweite Gegenprüfung (15.10.): breite Hocke wieder aus (Beugung in der Ebene vorn/unten, Abspreizen mit Hysterese),
   „gekippt“ nur außerhalb des Bildes gelöst, Drehung nach Lücken (Bild ohne Hüften, vertauschtes erstes Bild, ≤ 10 Bilder/s),
   AO nach Hosenwechsel, großes Foto abgesichert, Rock-Bund an der Taille, Längenurteil je Hose (88 cm), Material aus dem Link.
