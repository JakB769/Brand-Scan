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
- **Selbst-Scan → eigener Avatar:** einmal langsam drehen; eigene Scan-Oberfläche mit Fortschritt (Vorne/Seite/Hinten), Mini-Avatar und Ansagen; danach Anprobe am Avatar in 3D.
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
Drehung (Echtzeit-Test mit Clip v2-02: Avatar nach etwa 30 s); Scan-Oberfläche; Kunden-/Entwicklermodus; Größen je Zone; Live-Tracking
mit Ausblenden; Server-Sammlung (Netlify Blobs).

**Offen / nicht gut:**
- Eckige flache Flecken in der Hosen-Textur zwischen den Beinen (Ursache `spaltSchatten`, siehe `werkzeuge/qualitaet.json`).
- Beinbreite im Bildvergleich etwa 2 cm anders als im Foto (prüfen).
- Falten nur angedeutet; echte Falten später per Stoffphysik (nicht von Hand).
- Avatar in weiter Kleidung: Umfänge nur nach oben begrenzt; Eichung an gerenderten Körpern, nicht an echten Personen.
- Oberteile nur an künstlichen Testbildern geprüft; Hoodie, Hemd, Kleid fehlen.
- Shopify: Gerüst und Tests stehen; echter Entwicklungs-Shop, Händler-Seite im Admin und Abrechnung fehlen.
- Safari/echtes iPhone nicht automatisch testbar; Messgenauigkeit mit 20–30 Personen gegen Maßband nicht gemacht.
- Bekannte rote Tests: `tseiten` (Kennzeichnung), `tlag` (Testmaschine zu langsam), `tfreistellung` (Diagnose).
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
- Avatar-Scan endet per Uhr (fast ganze Drehung, spätestens 30 s), nicht nur bei gültigen Bildern.
- Kundenmodus blendet aus statt zu löschen; Standard ist der Entwicklermodus (Tests, Entwicklung).
- Website: „Umfänge“ in „Deine Maße“, „Maßband prüfen“ + „Testreihe“ in einer Karte; Sprache nur per Knopf, Stimme im Bereich „Stimme“.
