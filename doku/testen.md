# Testen im Detail

Aus `CLAUDE.md` ausgelagert (13.10.2026), Inhalt unverändert. Die Befehle stehen auch in `CLAUDE.md`.


```sh
npm install
npm test          # baut die Testseite neu und prüft alles
npm run diagnose  # Freistellung im Detail und Bildserie mit Knie, Ausgabe in werkzeuge/tests/ausgabe/
```

Die Testseite `werkzeuge/tests/testseite-mit-simulierter-person.html` wird von `baue-testseite.mjs` aus `app/index.html` erzeugt
(Attrappe aus `attrappe.js` statt MediaPipe, feste Umgebungsfarbe, Einblick über `window.__dbg`). **Nie von Hand ändern.**
Steuerung der Attrappe über `window.__mode`: `yaw`, `knee`, `wide`, `sway`, `zk` (Tiefe an/aus/verkehrt), `zn` (Knöchel scheinbar näher),
`zr` (Tiefe zittert), `hand` (linke Hand vor dem Oberschenkel), `roll` (Neigung in der Bildebene, π = Handstand), `shift` (seitlich versetzt),
`gegenstand` (etwas Hohes im Hintergrund in der Maske), `armHoch` (Arm über dem Kopf), `kneeHigh` (0…1, linker Oberschenkel bis
waagrecht nach vorn, Unterschenkel senkrecht), `fersePo` (0…1, Knie bis 153° gebeugt, mit `kneeHigh` zusammen: Knie hoch und
gebeugt), `ohneArme` (Arme nicht erkannt: in der Seitenansicht schneidet der Arm sonst die Hose aus, im Testbild fehlt er).
Ganzkörper-Posen (14.10.): `ausfall` (Ausfallschritt, linkes Bein vorn, hinterer Oberschenkel 36° nach hinten), `spagat` (1 seitlich,
2 längs; mit `yaw:1.45` von der Seite), `liegestuetz` (Körper waagrecht von der Kamera weg, Beine mit Sicherheit `beineSicht`,
sonst 0,35). Oberkörper wird dabei abgesenkt, Kopf und Füße folgen den Punkten.
Die Attrappe setzt die Handpunkte 17–22 an die Handgelenke wie MediaPipe.
Weitere Einblicke der Testseite: `window.__bone` (Knochen im Bild), `window.__B0` (nach `legHinge`), `window.__Lraw` (rohe Landmarken
vor `legSanity`), `window.__mask` (Personenmaske), `__dbg.legCm` (gelernte Bein-Längen), `window.__innenRot`
(Innenseite rot: wo sieht man in die Hose?), `window.__ohnePhysik`, `window.__t3d` (Rechenzeit der Form je Bild).
`baue-testseite.mjs <Datei>` schreibt die Testseite woandershin (z. B. während eine Testreihe läuft; Pfad absolut übergeben).
`baue-testseite.mjs --echt` baut die **Vergleichsseite** (echte MediaPipe, echtes Kamerabild, nur die Einblicke) für
`werkzeuge/vergleich.mjs`: Referenzfotos und Clip-Einzelbilder (`werkzeuge/vergleich-liste.json`) als Kamera, Hose aus
`assets/referenz/fotos/flach-vorne-hinten/`, je Pose Triptychon Original | 3D | gemischt plus `liste.json` (Status, Drehung,
rohe Landmarken, Knochen, Shirtsaum, Umriss-Überlappung `umriss.iou`/`breite3d` zwischen Hüfte und Knöchel).
`python3 werkzeuge/python/farbvergleich.py <dir>` misst Farbe (Lab, ΔE) und Struktur echt gegen 3D an Oberschenkel und Unterschenkel.
Unter Last (parallel laufende Analyse) fallen `tkamera` (Tempo) und `tstoff` (10 Bilder/s) aus; einzeln laufen sie grün.
`node werkzeuge/handy.mjs --geraet "iPhone 13"|"Pixel 7" --cpu 4`: Handy-Emulation (Bildschirm, Touch, Kennung; Chromium, kein
Safari) mit CPU-Drosselung, Kamera = Referenzclip als WebM (Playwrights Chromium spielt kein H.264). Misst Bilder/s, `PERF.ms`,
Zeit des eigenen Codes je Bild (`window.__ta`, um `analyse` gelegt), reine Formzeit (`__t3d`), Nachlauf Knie roh ↔ Hose, Video
nach `docs/nachher/handy/`. **Hier nicht aussagekräftig für die Bildrate**: ohne GPU laufen MediaPipe und WebGL in Software
(68 % der Zeit sind Bildkopien `drawImage`, die am Handy die GPU macht). Aussagekräftig ist die Formzeit (`pose3d`, reines JS).
`node werkzeuge/ansichten.mjs [--stand <commit>]`: Hose allein in Attrappen-Posen und Blender-Renders der .glb. Seit 15.10. mit drei Nah-Posen (`nah_vorne`, `nah_hinten`, `nah_seitlich`, Zoom 2,2) für den Texturvergleich:
`python3 werkzeuge/python/textur_vergleich.py <vorher> <nachher> docs/vergleich/textur_vorher_nachher.jpg`.
`node werkzeuge/drehung.mjs [--clip …] [--punkte] [--scan <clip>|nein]`: Drehung mit echtem Clip, virtuelle Uhr, genau eine
Erkennung je Bild (`window.__gate`, CPU statt swiftshader), vorher Frontal-Scan mit Stehen von vorn aus demselben Clip-Satz
(sonst bleibt die Seite in der Scan-Phase, dort gilt der Maßstab ungeglättet). Gibt Sprünge der Drehung und der Hosengröße
aus; `--punkte` schreibt die Eingaben von `bodyYaw` nach `punkte.json`. `node werkzeuge/drehung-nachrechnen.mjs punkte.json
[--datei <html>] [--png] [--luecke 4.0-5.0]`: dieselbe Drehungs-Logik ohne Browser in Sekunden (Verzögerung, Ruck, größter Schritt, Sollkurve).
`node werkzeuge/passform-rechnung.mjs`: Testhose (Flachfotos mit Bankkarte) bauen, für Jakob/Fabian/Philip je Größe und Zone
das Urteil; Gegenrechnung von Hand in PROGRESS.md.
Die KI-Freistellung lädt in der Testseite nur, wenn `window.__kiTest` gesetzt ist (nur `tki.mjs`); sonst gäbe fehlendes Netz Fehlermeldungen.
Die Shirt-Erkennung arbeitet in der Testseite nur auf `window.__shirtBild` (sonst ist das Kamerabild ein Testmuster).

| Test | prüft |
|---|---|
| `th.mjs` | Schnellstart, Saum, Drehung |
| `tg.mjs` | Anlegen, Speichern, Löschen, HEIC ohne Netz |
| `tf.mjs` | Drehung bei kaputter Tiefe |
| `tbreite.mjs` | Saumbreite im Bild bei verrauschter Tiefe (Soll mit elliptischem Querschnitt `beinTiefe`) |
| `tgenerator.mjs` | Maße aus Fotos auf fünf Untergründen (Testbilder aus `werkzeuge/python/testhintergruende.py`) |
| `theic.mjs` | HEIC-Umwandlung mit heic-to und heic2any |
| `thosen.mjs` | Maßfelder live und mit ungültigen Eingaben, eigene Werte je Hose, Löschen der angezeigten Hose, Grafikspeicher frei |
| `tblob.mjs` | Problemfotos (quer, etwas ragt heraus, Fuß) und alter Speicherstand mit Blob-Hose |
| `tnah.mjs` | Nahphase wie mit echter Kamera (näher kommen, Füße/Knie aus dem Bild, Knie hoch), Debug-Werte, Drehknöpfe, Aufrichten beim Laden |
| `tkarte.mjs` | Bankkarte mit den echten Fotos: automatisch, von Hand, Warnung bei verzogener Karte, Vorrang der eingetragenen Länge |
| `tstoff.mjs` | Stoff aus Materialangabe (DE/EN), Auswahl bleibt, Physik ohne NaN, fließender Stoff schwingt und hängt mehr, Bund bleibt am Platz, stabil bei 10 Bildern/s, Stauchfalten |
| `tdarstellung.mjs` | Tiefe von der Seite ≥ Körper (Gesäß, Oberschenkel), Hand vor der Hose schneidet sie aus und schließt sich wieder, kein Schatten-Schleier am Rand zum Hintergrund, Kontaktschatten unter dem Saum, Saumzeilen monoton (gerechnete Form, ohne Stoff-Fall), Bund hinten höher, Randpunkte, keine WebGL-Fehler/ungültigen Werte in vier Lagen |
| `tsammlung.mjs` | Alle Hosen als Datei sichern (Inhalt, Werte), auf leerem Gerät laden, doppelt laden, falsche Datei, `hosen.json` neben der Seite über einen lokalen Server (nicht im Gerät gespeichert, Ändern macht sie zur eigenen, Löschen bleibt), Speicher voll |
| `tansicht.mjs` | 3D-Ansicht erscheint mit Hose, Ziehen dreht, 3D-Datei gültig (Khronos-Prüfer) und in Metern, Ansicht aus während der Anprobe, Anprobe dreimal aus und an (über „Anprobe aus“, ✕, „Anprobe beenden“): alle Kamera-Spuren gestoppt, 3D-Ansicht wieder da, Doppeltipp schaltet nicht aus |
| `tki.mjs` | KI-Freistellung (dunkel auf dunkel, weißer Grund einig, quer), Fenster „Umriss prüfen“ (öffnet bei Uneinigkeit, Schuh weggetippt → Maße stimmen, Schutz gegen Löschen der Hose, Escape) |
| `tpassform.mjs` | Passform (9.10.) mit den echten Kartenfotos und den Bershka-Fotos: Schritt bei gespreizten Beinen, Innenbund erkannt, Etikett weg, kein Boden auf dem Bein, Leibhöhe am Körper, Schritt höchstens 12 cm unter dem Körperschritt, Gesäß 6–20 cm unter dem Bund, Oberschenkel ≤ 80 % der flachen Breite, `sitzCm` wirkt, Bershka ohne Innenbund. Gegenprobe mit dem alten Stand: Schritt, Innenbund, Etikett und Boden schlagen fehl (3D-Kennwerte gibt es dort nicht) |
| `tlink.mjs` | Link einfügen mit eigenem Server und künstlichen Shop-Seiten (`werkzeuge/tests/shop/`): Größentabelle im Diesel-Format (Blöcke je Größe, cm/Zoll, Innenbein ×3, Auswahlzeilen), Größe wie am Model, andere Größe, Name/Material/Link, US-Größe „32 X 32“, Shopify `.js`, Shopify-Varianten mit Maßen nur für eine Größe (`shopify-varianten.json`: übrige hochgerechnet und geschätzt), gesperrter Shop, Foto mit Person → Länge gemessen und Abgleich sichtbar, Strg+V eines Links, ohne Server-Teil. Schutzregeln des Server-Teils (eigenes Netz, Metadaten-Adresse, file:) |
| `tdateien.mjs` | Dateien hochladen: Rock mit Gürtel (Rock erkannt, Gürtel weg, 3D ohne ungültige Werte, Umschalter), Jeans mit Gürtel (bleibt Hose, Bund unverfälscht), ohne Gürtel kein Fehlalarm, back/front richtig eingeordnet, Bershka-Screenshot zerlegt, Tabelle als Text (Größe M, dann XL), Material, Größentabelle als Bild (Texterkennung, Körpermaß → Bund 43), nur Tabelle → „fehlt“, Model-Foto erkannt und nicht benutzt, Model-Foto ab Hüfte (`model_ausschnitt_bershka.jpg`) als angeschnitten erkannt, getragene Rückseite (künstlich, `werkzeuge/python/testgetragen.py`: Taschen oben, Kniefleck auf Kniehöhe), schiefes Bein und Handtuch abgelehnt (`testunecht.py`), Strg+V, Einzel-Formular lehnt ebenso ab. MediaPipe und Tesseract aus node_modules, Modelle von storage.googleapis.com |
| `tpruefung.mjs` | Rückschritte der Gesamtprüfung: Maßband-Taille, Komma, Prüfung beim Anlegen, quer/Kopfstand mit sich berührenden Säumen (`material/testbilder/orientierung/`), links/rechts beim Aufrichten (roter Fleck), kurze Hose, Drehknöpfe, WebGL-Kontextverlust, Kartenfenster (Escape, kein Viereck), alter Speicherschlüssel, voller Speicher |
| `tfall.mjs` | Stoff-Fall: zu lange Hose liegt auf dem Boden ohne Lappen, unten nicht nach vorn verschoben, Saumring vorn/hinten mittig, hinten am Boden (nicht umgeklappt), vorn auf dem Schuh, Beine nicht ineinander, kürzere hängt frei, in Stücken gerechnet = am Stück, ausschaltbar |
| `toberteil.mjs` | Shirt über dem Bund (gemaltes Kamerabild `window.__shirtBild`): Saum erkannt, Hose darüber weg und darunter da, kurzes Shirt, gleiche Farbe, ausschaltbar |
| `tgroessen.mjs` | Größen aus der Tabelle und aus der US-Größe des Models, Urteil je Größe (nie enger mit der Größe, eine Empfehlung), Antippen setzt die Maße, Sitz, Knöpfe in Anprobe/Shop, Speichern und Prüfen beim Laden **15.10.:** Urteil je Zone (Bund, Hüfte, Oberschenkel, Knie, Länge) mit Begründung, ohne Scan aus der Körpergröße; 150 cm groß → Länge zu lang, 205 cm → zu kurz; im 3D (Puppe 215 cm) ist L breiter und der Saum 2 cm tiefer als S. |
| `tscan.mjs` | Scan-Ablauf: nah ohne Scan aber mit Hose, gescannt in < 2,5 s ohne Drehen, näher/zurück (Maßstab 1,75×/1,00×), Gegenstand im Hintergrund und Arm über dem Kopf ändern den Maßstab nicht, Seite nebenbei, Neigung ±30° und Handstand, Skelett springt auf den Kopf (Hose bleibt erst aufrecht), Knie/Knöchel fälschlich über der Hüfte (Beine hängen trotzdem), schneller Sprung |
| `shopify/server/signatur.test.mjs` | Signatur des App-Proxys (signierter Text wie in der Shopify-Doku, geändert/ohne/kaputt/falsches Secret abgelehnt, Zeitstempel) und der Webhooks |
| `shopify/server/server.test.mjs` | Shopify-Server mit „Shopify-Attrappe“ (signiert wie der App-Proxy): ohne Signatur/alt/geändert 401, unsinniger Shop 400, Hose des Produkts, Kundenseite im Browser (Hose gewählt, keine Händler-Werkzeuge, Meldung ohne Hose), Pflicht-Webhooks |
| `shopify/server/grenze.test.mjs` | Zugriffsgrenze je Shop (Rate Limiting): Grenze, anderer Shop getrennt, neues Zeitfenster, Server antwortet 429 mit Retry-After |
| `werkzeuge/geheimnis-pruefung.mjs` | Läuft zuerst: keine API-Schlüssel, Tokens, privaten Schlüssel oder `.env`-Dateien im Repo |
| `tlag.mjs` | Hose folgt dem Knie ohne Nachlauf (Attrappe `kneeWave`, Kreuzkorrelation ≤ 40 ms bzw. ≤ 80 ms bei 10 Bildern/s, voller Ausschlag, Sprung sofort), Saum folgt dem Knöchel (≤ 100 ms), Bild `ausgabe/lag_knie.png` |
| `tbeine.mjs` | Starke Beinbewegungen (Knie hoch, Ferse zum Gesäß, beides, halb) von vorn/schräg/Seite: Drehung nach dem Scan erkannt, Unterschenkel hinter dem Oberschenkel in der Ebene des Beins, Innenseite über dem Knie < 0,4 % (rot eingefärbt gezählt), nichts umgeklappt außer verdeckt zwischen den Beinen, angehobenes Bein ohne Bodenstapel (seit 14.10. leicht gestaucht erlaubt, ≥ 85 %); Ausblenden dabei aus (seit 15.10., geprüft wird die Form), Bilder `ausgabe/beine_*.png` |
| `tausblenden.mjs` | Lieber ausblenden als schlecht aussehen (15.10.): Hüftbeugung 0/30/45° links und rechts, von vorn und seitlich (auch mit Knie 95° gebeugt) sichtbar und ruhig, 60° ausgeblendet und danach wieder da; Beugung pendelt seitlich 41↔55° je 700 ms → genau ein Wechsel, bleibt aus; seitlicher Spagat von vorn sichtbar (Abspreizen ist keine Beugung); Liegestütz, Hinlegen (Person kippt auf die Seite) und Aufstehen; Hüfte schlecht erkannt; Erkennung springt jedes Bild; ein einzelner Sprung bleibt sichtbar (ab dem Sprung gemessen). Attrappe `beugeL/beugeR`, `knieL/knieR` (Grad), `hueftSicht`, `zappel`, `roll`. |
| `tferse.mjs` | Ferse blickdicht (15.10.): 3D-Hose allein von hinten, schräg, seitlich (beide Seiten), beim Gehen, mit gehobenem Knie; durchsichtige Pixel, die vom Bildrand nicht erreichbar sind (Löcher), in der unteren Hälfte ≤ 3. Stoffbild: Spalt zwischen den Beinen stofffarben. Bilder `ausgabe/ferse_*.png` (Löcher rot) Gehen als feste Schrittstellung (Hüfte 20°, Knie 30°): mit `kneeWave` kreuzten sich die Beine von der Seite je nach Zeitpunkt, der Spalt zwischen ihnen zählte als Loch. |
| `tstoffbild.mjs` | Stoffbild ohne Boden (15.10.): eigene Testhose auf Holzboden mit Bankkarte über die Felder (mit KI), mit und ohne Rückenfoto; je Beinzeile ist der Spalt zwischen den Innennähten näher am Bein als an der Bodenfarbe des Fotos. Gegenprobe ohne `fillLegGap`: 8/27 bzw. 7/27 Zeilen Boden (Test schlägt an). Bilder `ausgabe/stoffbild_spalt*.png`. Seite als Argument für Gegenproben. |
| `tposen.mjs` | Ganzkörper-Posen (Attrappe): Ausfallschritt und Längsspagat (seit 15.10. nur: ausgeblendet), seitlicher Spagat, Längsspagat von vorn (Grenzlage: vorderes Bein zeigt in die Kamera) und von der Seite: Hose auf beiden Beinen (Knie und Mitte Unterschenkel bedeckt), an Hüfte ≤ 8 (Leistenknick) und Knie ≤ 2 nichts umgeklappt, kaum Innenseite; Liegestütz: Hose ausgeblendet (`g.trk` → 0, auch mit sicher erkannten Beinen), danach im Stand wieder da. Attrappe `hockeBreit` (breite Hocke, Knie nach außen) für Saum-Prüfungen von Hand. Bilder `ausgabe/posen_*.png` |
| `tkamera.mjs` | Frontkamera als Vorgabe, Wechsel mit belegter Kamera (wiederholt), Overconstrained → nächster Weg, alles kaputt → zurück zur alten Kamera mit Meldung, dreifach Tippen, Tempo (640 px, leichtes Modell, Renderauflösung) |
| `tflach.mjs` | Flachfotos des Nutzers (HEIC, Holzboden) ohne Maßtabelle erkannt und gebaut, Bankkarte beim Hochladen (Fenster einmal, Länge ±4 cm), kein zweites Fenster beim Neubau, Model-Foto ab der Hüfte bleibt „angeschnitten“ |
| `tspeicher.mjs` | Sammlung auf dem Server mit zwei Browsern: anlegen → auf dem anderen Gerät da, ändern kommt an, ✕ mit Nachfrage löscht überall, Team-Code, ungültiges Kürzel |
| `tvarianten.mjs` | Maße nur für einzelne Größen: Weite/Länge, Maße in einer Zeile, zwei gemessene Größen, Buchstaben, Maß ohne Größe, Model-Größe kein Bezug, volle Tabelle unverändert, ganzer Weg mit Knöpfen „≈“, Maße ohne Größe wandern mit der gewählten Größe |
| `tbedienung.mjs` | Drei Testpersonen (Knöpfe, Größe, Markierung, Personenwechsel verwirft den Scan), Sprachausgabe aus → nichts gesagt, Lautsprecher im Kamerabild/bei „Du“ an und aus (laufende Ansage abgebrochen), nach Neuladen aus, kein Rahmen ums Kamerabild |
| `tseiten.mjs` | Felder Vorderseite/Rückseite, Warnungen (vertauscht bei Bershka und den Fotos des Nutzers, ⇄ hebt sie auf, zweimal vorne, zweimal hinten, zweimal dasselbe Foto), Zuordnung ohne Namenshinweis, nur Vorderseite → Rückseite geschätzt und gekennzeichnet (auch nach Neuladen), über dem Schritt glatt, Rückseite nachgereicht → dieselbe Hose; nacheinander hochgeladen → beide benutzt, echte Rückseite mit mehr Taschenkanten als die geschätzte, weich verkleinerte Rückseite als Model-Foto eingestuft → Meldung und ↪ machen sie zur Rückseite; Passe/Vordertaschen (`sideSlope`) bei Bershka und den Kartenfotos |
| `tlaenge.mjs` | Länge mit A4/Bankkarte (Testbilder aus `werkzeuge/python/testmassstab.py`, echt 105 cm, gerade und 15° schräg), echte iPhone-Fotos des Nutzers, Vorrang der eingetragenen Länge |

