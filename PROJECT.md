# Passform: virtuelle Anprobe für Mode-Shops

## Ziel
Shopify-App mit Abo (Pläne 39 / 99 / 249 € im Monat, `docs/pitch-plan.md`): Kunden probieren Kleidung auf der Produktseite an,
live mit der Kamera oder auf ihrem eigenen 3D-Avatar, und bekommen die passende Größe. Start mit Hosen, jetzt auch Oberteile.

## Feste Vorgaben
- Läuft komplett im Browser auf der Shop-Seite (App-Proxy, kein iframe); externe Dienste im Hintergrund sind ok.
- Handy mit Frontkamera (beim Tippen sofort, weitester Winkel); Laptop gleich wichtig.
- Passform wichtiger als Optik, die Optik muss trotzdem gut sein.
- Immer Vorder- UND Rückseite der Fotos verwenden; Rückseite nur notfalls geschätzt und gekennzeichnet.
- Kleidung sitzt nach Kategorie: Hose auf den Hüftknochen, Rock nie bis zum Boden, Trägertop nicht über den Bauchnabel, T-Shirt verdeckt den Hosenbund.
- Lieber ausblenden als schlecht aussehen (Hüftbeugung über 45°, Liegen, Liegestütz, Sprünge).
- DSGVO: Kamerabilder nie speichern oder senden, nur Zahlen; Einwilligung vor dem Avatar-Scan; Profil und Avatar löschbar; Shopify-Pflicht-Webhooks.
- Keine Schlüssel im Repo; keine Fremdbilder ausliefern (Bershka nur intern); Kartenfotos mit lesbarer Nummer nie committen; keine kostenpflichtigen Abos/Käufe.
- Ruhige Oberfläche, Symbole statt Wörter, Texte wechseln nicht schnell.

## Funktionen
- **Live-Anprobe:** Größe eintragen, ganz ins Bild stellen, nach etwa 1 s sitzt die Hose (3D, Rig, Stoffphysik), Oberteil darüber.
- **Selbst-Scan → eigener Avatar:** Bereich „Eigenen Avatar erstellen“ (auch im Kundenmodus) → Hinweis und Einwilligung → Kamera → warten („Geh zurück, bis du ganz im Bild bist“, kein Fortschritt) → ganzer Körper sicher erkannt und 1 s ruhig → Countdown 3-2-1 → „Dreh dich langsam einmal im Kreis“ (Fortschritt nur aus der erkannten Drehung, 8 Abschnitte zu 45°; Hinweise „Weiter drehen“, „Zurück ins Bild“) → Kamera aus, „Avatar wird erstellt …“ → eigener Avatar in 3D (drehen, zoomen) → Kleidung und Größen. In jedem Schritt „Abbrechen“, Escape und Browser-Zurück führen zur Seite (Kamera aus, nie schwarzes Vollbild, Tab bleibt offen). Fehler (Kamera verweigert/belegt, nicht ganz im Bild, Bau gescheitert, abgebrochen) mit „Nochmal versuchen“.
- **Kleidung hochladen:** Hose/Shorts/Rock oder Oberteil aus Fotos vorne + hinten (Bankkarte oder A4 als Maßstab), Link zur Hose im Shop, Maßtabelle (auch per Texterkennung).
- **Größenempfehlung je Zone** (Bund, Hüfte, Oberschenkel, Knie, Länge; Oberteile Brust usw.), Größenwechsel im 3D.
- **Modelle speichern und löschen** (Gerät, Server-Sammlung, Datei), Avatar nur als Zahlen.
- **Kunden-/Entwicklermodus** (Zahnrad oben rechts): Kunde sieht nur Scan, Live-Anprobe, Produkt/Größe, Avatar drehen.
- **Testprofile:** Jakob 1,79 m, Fabian 1,87 m, Philip 1,70 m.

## Technischer Ansatz
Vorlagen-Meshes je Kategorie (Hose: parametrische Ringe mit Rig Hüfte/Knie; Oberteile auf dem MakeHuman-Körper) + Fotos als Textur
+ Maße skalieren. KI nur für Optik (Freistellung) bzw. fehlende Rückseite (Textursynthese im Browser). Image-to-3D allein
(TRELLIS, Hunyuan3D) hat die Physik nicht gelöst: flache oder zu dicke Hosen, keine Passform; KI-Modelle dienen nur als Optik-Referenz.

## Aktueller Stand
**Funktioniert:** neue Hose aus 2 Fotos mit Bankkarte (Länge 106,4 cm bei Maßband 105); Produktform der Hose nahe an der KI-Referenz
(Umriss wie im Foto geprüft, Qualitätsgedächtnis); Oberteile aus Fotos (Art erkannt, live und am Avatar); Avatar-Scan lädt nach der
Drehung; Avatar-Scan Ende zu Ende im Kundenmodus geprüft (`tavatarscan`: Desktop-Chrome, iPhone- und Android-Emulation, Kamera
verweigert, Körpermodell fehlt, Wechsel mit der Live-Anprobe; zusätzlich in der Safari-Engine WebKit 26 mit iPhone-13-Emulation,
`tavatarsafari`); Scan-Ablauf geprüft (`tavatarablauf` auf der echten Seite `app/index.html`, Desktop/iPhone/Android-Emulation: Countdown erst bei
ganzem Körper, Fortschritt folgt der Drehung, Stehen/halb im Bild/leeres Bild ohne Fortschritt, Abbrechen/Escape/Zurück in jedem Schritt, Fehler beim
Bau); eigener Avatar nach etwa 25–40 s, Brust 9–16 cm, Hüfte/Taille einige cm anders als der
Durchschnitt beim Referenzclip); Scan-Oberfläche; Kunden-/Entwicklermodus; Größen je Zone; Live-Tracking mit Ausblenden;
Server-Sammlung (Netlify Blobs).

**Offen / nicht gut:**
- Eckige flache Flecken in der Hosen-Textur zwischen den Beinen (Ursache `spaltSchatten`, siehe `werkzeuge/qualitaet.json`).
- Beinbreite im Bildvergleich etwa 2 cm anders als im Foto (prüfen).
- Falten nur angedeutet; echte Falten später per Stoffphysik (nicht von Hand).
- Anzughose in Bewegung nur mit der Testhose (Anzugstoff, grau eingefärbt) geprüft: die Fotos der echten Anzughose liegen nicht im
  Repo, am Gerät nachsehen. Beim hohen Knieheben (Hüfte über 45°) blendet die Anprobe jede Hose wie vorgesehen aus; die weicheren
  Kniefalten sieht man bei mäßiger Beugung.
- Avatar in weiter Kleidung: Umfänge nur nach oben begrenzt; Eichung an gerenderten Körpern, nicht an echten Personen.
- Oberteile nur an künstlichen Testbildern geprüft; Hoodie, Hemd, Kleid fehlen.
- Shopify: Gerüst und Tests stehen; echter Entwicklungs-Shop, Händler-Seite im Admin und Abrechnung fehlen.
- Echtes iPhone und Android-Gerät ungeprüft: geprüft in Chromium (Desktop-, iPhone-, Android-Emulation, Testkamera aus Clips) und in
  der Safari-Engine WebKit 26 (iPhone-13-Emulation, Ersatzkamera aus Einzelbildern); Kamera-Freigabe, Leistung und GPU am echten Handy ungeprüft.
- Live-Seite: am 18.11. fehlte `avatar/koerper.js` (nur ein Teil hochgeladen), der Avatar-Scan brach ab. Immer den ganzen Ordner `app/`
  veröffentlichen (Merge in `main` bzw. ganzer Ordner); automatische Live-Prüfung liegt im offenen PR „Live-Prüfung nach jedem Deploy“.
- Avatar-Maße streuen von Scan zu Scan (Referenzclip, weite Kleidung: Taille −6 bis +2 cm, Hüfte −8 bis +4 cm zum Durchschnitt).
- Messgenauigkeit mit 20–30 Personen gegen Maßband nicht gemacht.
- Bekannte rote Tests: `tseiten` (Kennzeichnung), `tlag` (Testmaschine zu langsam), `tfreistellung` (Diagnose), `tfall` (Stoff-Fall der Anprobe-Form: bricht mit „Cannot read properties of null“ ab, vor und nach dem 23.11. gleich).
- Netlify: Produktions-Branch muss `main` sein (der frühere `claude/new-session-fbr0jp` ist gelöscht).

## Entscheidungen (nicht neu herausfinden)
- 3D aus Maßen + Fotos statt Gaussian Splat oder Bild-zu-3D-KI.
- Freistellung uneinig: Punkte nur der KI bleiben außer bei Bodenfarbe, Punkte nur der Farbe nur bei Stofffarbe (`fuseMasks`).
- Vorne/hinten an Gesäßtaschen-Kanten erkennen; Ersatz-Kartensuche nur mit Kartenfarbe vom anderen Foto und fast rechteckig.
- Maßstab nie nur aus der Rumpflänge; MediaPipe-Tiefe nie allein.
- Hosen dauerhaft in Netlify Blobs; im Shop als Datei je Produkt, nicht als Metafeld.
- Körpermodell MakeHuman (CC0); Figur „Joe“ und `assets/pants/` (Lizenz unklar) nur intern als Referenz.
- Rückseite ohne Foto: Textursynthese aus ruhigen Stoffstellen der Vorderseite, oder Rückenfoto einer ähnlichen Hose als Vorlage.
- Weite Kleidung beim Scan: Umriss ist nur Obergrenze. Eichung Scan ↔ Körpermodell an gerenderten Körpern (`werkzeuge/avatar-eichen.mjs`).
- Hose: Innenkanten der Beine als Gerade ab der Spaltöffnung im Foto; Umriss Foto/3D ist das Prüfmaß (Nutzer: „perfekt“).
- Getragen-Look und Falten nicht von Hand modellieren (Nutzer: sah schlecht aus), später per Physik.
- Bewegung des Stoffs über Werte je Stoffart (`STOFFE`), nie je Hose. Anzug (23.11., Nutzer: „sieht gut aus, ist aber zu steif“):
  Eigenfrequenz 1,0 statt 1,4 Hz, Dämpfung 0,24 statt 0,29 (schwingt nach, flattert nicht), unten weniger steif (`steif` 3 statt 5),
  2,5 cm mehr Spiel zum Bein (`spiel`), Kniefalten 4,6 cm × 0,85 statt 3,8 × 0,6, Durchhängen 0,6, Abweichung bis 6 cm. Jeans und
  alle anderen Stoffe unverändert (Vorgaben 5 und 1; geprüft: alle Punkte der Jeans in drei Clips höchstens 0,09 Bildpunkte
  anders). Vergleich `docs/tests/anzughose/` (Knie heben, Drehung, Ausfallschritt).
- Avatar-Scan (23.11., Live-Test des Nutzers: Fortschritt lief, bevor er ganz im Bild war; „fertig“ ohne Drehung; danach schwarzes
  Vollbild ohne Ausweg): Start erst bei ganzem Körper (Sichtbarkeit ≥ 0,75, nicht am Rand, von vorn) und 1 s ruhig (Hüfte < 10 % der
  Körperhöhe bewegt), dann 3-2-1; die Maße von vorn kommen aus den Countdown-Bildern. Fortschritt nur aus der Körperausrichtung
  (MediaPipe-Weltpunkte Schultern + Hüfte; folgt in allen Clips der ganzen Drehung, im Stehen ±15°), 8 Abschnitte zu 45°: einer zählt,
  wenn die Ausrichtung 2 Bilder nah an seiner Mitte (±15°) liegt oder zwischen zwei gültigen Bildern (≤ 45° Schritt) darüber läuft;
  Sprünge über 60° gelten erst nach 0,5 s. Fertig nur mit allen 8 Abschnitten und Proben von hinten und beiden Seiten, keine Uhr.
- Während des Avatar-Scans kein Wechsel auf das leichte Erkennungsmodell (das Laden hielt die Erkennung etwa 5 s an, Winkel fehlten).
- Vollbild endet immer mit der Kamera (auch Escape/Vollbild vom Browser beendet). Verlauf: Einwilligung und Scan sind eigene Einträge;
  Zurück schließt den Dialog bzw. beendet den Scan, der Eintrag wird danach zur Seite (ein Zurück mehr bleibt auf der Seite).
- Tests mit der Fake-Kamera von Chromium: Breite/Höhe-Wünsche weglassen (neuere Chromium schneiden sonst aus dem Hochformat ein
  Quadrat aus, Kopf und Füße fehlen); echte Kameras tun das nicht, die App fragt unverändert.
- „Avatar-Scan starten“ startet immer einen neuen Scan; den gespeicherten Avatar zeigt „Meinen Avatar ansehen“ (vorher öffnete der
  Knopf bei gespeichertem Avatar nur die 3D-Ansicht, die Kamera ging nicht auf).
- Kamera wird beim Tipp zuerst angefragt, ohne Zeitgrenze für die Freigabe (Hinweis nach 4 s; eine 20-s-Grenze verwarf die später
  erlaubte Kamera). Nebenschritte (Geräteliste, Zoom, Abspielen) warten höchstens 1,5–3 s; scheitert das Abspielen, läuft der Start weiter
  (Tipp ins Bild startet es). Tote Kamera nach App-Wechsel wird neu geholt. Fehler stehen im Avatar-Bereich mit „Nochmal versuchen“;
  lädt die Erkennung nicht, heißt es so (nicht „Kamera ließ sich nicht starten“).
- Körpermodell (`avatar/koerper.js`) lädt schon beim Öffnen der Einwilligung; fehlt es, keine Kamera-Frage, sondern ein Hinweis im
  Avatar-Bereich. Vorher: Kamera-Frage, dann Sprung zur „Anprobe in 3D“, Kamera ging nie auf (Fehlerbild des Nutzers, 20.11.).
- MediaPipe bekommt immer eine eigene Zeichenfläche (`canvas`): sonst scheiterte in Safari jede Erkennung („GLctx.activeTexture“) und der
  Scan kam nie über „zurückgehen“ hinaus. Nach 5 Fehlern in Folge Erkennung auf der CPU (für das Gerät gemerkt).
- HTML der Hosen- und Oberteil-Karte repariert (überzählige `</div>` schlossen Karte und Seitenrahmen zu früh).
- Kundenmodus blendet aus statt zu löschen; Standard ist der Entwicklermodus (Tests, Entwicklung).
- Im Shop (Shopify-Seite mit `PASSFORM_KUNDE`) gilt immer der Kundenmodus, ohne Zahnrad (Kunden sollen nicht in den Entwicklermodus).
- Website: „Umfänge“ in „Deine Maße“, „Maßband prüfen“ + „Testreihe“ in einer Karte; Sprache nur per Knopf, Stimme im Bereich „Stimme“.
