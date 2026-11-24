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
- Echte Anzughose des Nutzers nicht geprüft (Fotos nicht im Repo); „verkehrt herum“ an der Testfassung nicht nachvollziehbar (Schlitz
  vorn in allen Ansichten), der Failsafe prüft jede Hose beim Laden. Bildvergleich Foto/3D (`hose-render`) braucht Fotos mit einfarbigem
  Hintergrund (Shopfotos Jeans/Anzug nur intern); mit den Holzboden-Fotos im Repo misst er Unsinn, dort gilt die Messung in der App.
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
  veröffentlichen (Merge in `main` bzw. ganzer Ordner). Live-Tests (Dateien, Avatar, Scan-Ablauf) laufen als GitHub-Workflow, sobald die
  Repo-Variable `LIVE_URL` mit der Live-Adresse gesetzt ist; die Adresse ist hier nicht bekannt, live getestet ist darum noch nichts.
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
- Hose: Beine trennen sich am Schrittpunkt wie die Innennähte im Foto (umgekehrtes V, Gerade aus dem Schritt mit der Neigung der
  Innenkante darunter, mindestens 0,75 cm je 10 cm). 24.11., Nutzer: „zwischen den Beinen eine Stoffverbindung“; bis dahin lagen die
  Beine bis zur Spaltöffnung im Foto aneinander (dazwischen liegt flach fotografiert die hintere Lage). Die Textur jedes Beins endet an
  der Innennaht (`innenNaht`); unter dem Schritt wird nichts mehr übermalt (die übermalten Stellen waren die grauen, eckigen Flecken).
  Vor dem 24.11. gebaute Hosen: innen am Schritt beginnt die Textur weiter außen (Flecken nicht sichtbar). Umriss Foto/3D bleibt das
  Prüfmaß; der Schritt wird im Bildvergleich an der Spitze des V gemessen.
- Failsafe vorne/hinten nach jeder Modellerzeugung und beim Laden: beide Atlashälften mit denselben Merkmalen wie beim Hochladen
  vergleichen (Gesäßtaschen-Kanten, Passe gegen Eingriff der Vordertaschen), als Vergleich der zwei Seiten derselben Hose. Sicher
  vertauscht (Wert ≤ −1,5) und mit Rückenfoto: Hälften tauschen und erneut prüfen. Ohne Rückenfoto (Rückseite geschätzt, glatter als
  jedes Foto) zählt nur die Vorderseite für sich (Taschenkanten ≥ 0,13 und Passe ≥ 0,15 = Rückseite): dann blendet die Schranke aus.
  Unsicher (|Wert| < 1,5): Zuordnung vom Hochladen bleibt. Gemessen: Testhose, Echt-Jeans 5; Mark-Jeans nur 1,6 (knapp).
- Qualitäts-Schranke vor dem Anzeigen („lieber keine Hose als eine komische“): Zahlen gültig, keine Spitzen im Umriss, keine
  verzerrten Flächen, Beine im Foto unter dem Schritt getrennt, Schritt und Gesäß plausibel, Schlitz vorn. Durchgefallen: im Kundenmodus
  ausgeblendet, im Entwicklermodus „Modell fehlerhaft – bitte Fotos neu hochladen“ mit Grund. Beim Hochladen kommt die genauere
  Meldung „keine realistische Hose“ zuerst. Prüfung: `werkzeuge/hosen-check.mjs` (Bilder `docs/tests/hosen-check/`).
- Übermalen der Textur am Schritt (`spaltSchatten`) ganz aus (24.11.): gab graue, eckige Flecken am Ende des Schlitzes; mit der
  Innennaht nicht mehr nötig (geprüft an Testhose und Mark-Jeans, ohne dunklen Block).
- Stoff-Bewegung (24.11., Nutzer: „die Hosen wackeln zu viel“): ein Regler für alle Stoffe, Vorgabe 35 % (100 % = Stand 23.11.):
  weniger Spiel, höhere Eigenfrequenz, mehr Dämpfung; Jeans bei der Drehung im Mittel etwa 60 % weniger Schwingen am Saum. Regler nur im
  Entwicklermodus (wirkt sofort, gespeichert), „Als Standard übernehmen“ gilt für den Kundenmodus auf diesem Gerät; für alle Geräte
  `PASSFORM.stoffBewegung` im Code.
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
