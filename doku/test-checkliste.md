# Test-Checkliste: viele Hosen, mehrere Geräte

Ziel: herausfinden, wie gut Freistellung, 3D-Modell und Anprobe mit echten Hosen und echten Handys funktionieren.
Was mit „simuliert geprüft“ markiert ist, lief nur in der Testumgebung ohne echte Kamera. Alles andere muss an echten Geräten getestet werden.

## 1. Seite veröffentlichen (einmal)

1. Ordner anlegen, darin `index.html` (aus `app/`). Später kommt `hosen.json` dazu (siehe 3).
2. Auf **app.netlify.com/drop** ziehen. Die Kamera braucht https, das liefert Netlify.
3. Tipp: Mit einem kostenlosen Netlify-Konto bleibt die Adresse gleich. Dann den neuen Ordner im bestehenden Projekt unter „Deploys“ hineinziehen. Gleiche Adresse heißt: Jedes Gerät behält seine gespeicherten Hosen und Einstellungen. Bei neuer Adresse ist der Gerätespeicher leer.

## 2. Hosen anlegen (am besten am Laptop)

**Am schnellsten: „⇪ Dateien hochladen“.** Einfach alles hineinziehen, was der Shop hergibt: Foto vorne flach, Foto hinten (flach
oder mit Model von hinten), ganze Screenshots der Produktseite, Maßtabelle als Screenshot oder als Text (kopieren und mit
Strg+V einfügen). Die Seite sortiert selbst, zeigt die Einordnung (⇄ tauscht vorne/hinten, ✕ entfernt) und sagt, was fehlt.
Hat die Tabelle mehrere Größen, die Größe der Fotos wählen (Vorgabe: die mittlere). Ergibt etwas keine realistische Hose,
wird sie nicht angelegt und der Grund steht da. „Neue Hose“ leert die Liste für die nächste. Röcke werden erkannt (sonst
„⇄ Rock“ tippen); ein Gürtel auf dem Foto, der nicht dazugehört, wird entfernt.

Für eigene Hosen mit Maßband oder Bankkarte weiter das Formular darunter. Je Hose:
- [ ] Zwei Fotos (vorne, hinten) nach `doku/foto-anleitung-haendler.md`: flach, Beine getrennt, ruhiger Untergrund, Handy senkrecht darüber. iPhone-Fotos direkt hochladen, nicht über WhatsApp (sonst fehlt die Neigung).
- [ ] Name, **Material vom Etikett** (z. B. „98 % Baumwolle, 2 % Elasthan“) und mindestens **ein Maß mit dem Maßband** (Länge außen oder Bund flach).
- [ ] Optional „Umriss immer prüfen“ anhaken: Im Fenster sieht man, was als Hose erkannt wurde. Mit „－ weg“ antippen, was nicht dazugehört.
- [ ] Nach dem Erstellen die **3D-Ansicht** unter der Hosenliste drehen. Prüfen: Bund oben, Vorderseite vorne, Länge plausibel, keine Beule, kein Loch, richtige Stoffart.
- [ ] Wenn etwas falsch ist: Foto und Meldung aufheben (siehe 5).

Gut für einen breiten Test (je 2–3 Stück): Baggy-Jeans, Slim/Stretch-Jeans, Chino, Cord, Jogginghose, Anzughose, Leinen, eine sehr dunkle und eine sehr helle Hose, eine kurze Hose. Untergründe: weißes Laken, Parkett, Teppich, Fliesen, dunkler Boden.

## 3. Hosen auf alle Geräte bringen

1. Am Laptop unter der Hosenliste **„⇩ Alle Hosen als Datei“** tippen. So entsteht `hosen.json` (etwa 120 KB je Hose).
2. Die Datei neben `index.html` in den Ordner legen und neu hochladen. Jedes Gerät lädt die Hosen dann beim Öffnen. Im Gerät gespeichert werden sie erst, wenn man an ihnen etwas ändert.
3. Alternative ohne neues Hochladen: die Datei aufs Handy schicken und dort **„⇧ Hosen aus Datei laden“** tippen.
4. Für Shopify oder einen 3D-Betrachter: **„⇩ 3D-Datei (.glb)“** unter der 3D-Ansicht. Die Datei lässt sich in Shopify als 3D-Modell am Produkt hochladen; Shopify macht daraus selbst die AR-Datei fürs iPhone (laut Shopify-Doku, nicht von uns ausprobiert).

Der Gerätespeicher fasst etwa 40 Hosen. Über `hosen.json` gibt es keine feste Grenze. Ab einigen hundert Hosen würde die Seite langsam laden (ungeprüft).

## 4. Anprobe je Gerät

Geräte: iPhone (Safari), Android-Handy (Chrome), Laptop (Chrome und Safari bzw. Edge), wenn möglich ein älteres Handy.

| Prüfpunkt | ok? |
|---|---|
| Kamera startet beim Tippen sofort, hinten die weiteste Linse | |
| Frontal- und Seiten-Scan klappen ohne Hilfe | |
| Hose sitzt auf den Hüftknochen, nicht in der Taille | |
| Hose folgt beim Drehen (vorne, seitlich, Rücken), keine falsche Seite | |
| Saum wird nach unten nicht zu breit | |
| **Hand vor der Hüfte bzw. dem Oberschenkel: die Hand ist zu sehen, die Hose hat dort ein Loch in Handform** (neu, nur simuliert geprüft) | |
| Arme hängen seitlich: kein Flackern am Rand der Hose | |
| Knie hoch: man sieht ins Hosenbein, kein schwarzes Loch, kein Lappen an der Leiste | |
| Näher kommen (Füße aus dem Bild): Hose bleibt senkrecht | |
| Weiter Stoff (Leinen, fließend) schwingt beim Gehen sichtbar, Jeans kaum | |
| Schatten nur auf dem Körper und den Schuhen, nicht auf der Wand dahinter | |
| Hell, Dämmerlicht, Gegenlicht: Hose passt farblich halbwegs | |
| Läuft flüssig, auch nach 5 Minuten (Wärme, Akku) | |

Für Fehlerbilder: den Schalter „Debug-Ansicht“ einschalten. Er zeigt Achsen, Maße und Gelenktiefen.

## 5. Was ihr mir schicken solltet

- **Fotos von hinten mit Person** (Model von hinten, ganze Beine im Bild) samt dem flachen Vorderseitenfoto: das Abwickeln der
  Rückseite ist bisher nur mit einem künstlichen Bild geprüft.
- **Maßtabellen, die nicht erkannt werden** (Screenshot), und Shop-Screenshots, die nicht zerlegt werden.
- **Original-Fotos**, bei denen die Freistellung nicht klappt, direkt aus der Fotomediathek (nicht über WhatsApp). Kartennummern abdecken.
- **Bildschirmaufnahmen** (iPhone: Kontrollzentrum → Bildschirmaufnahme) von allem, was in der Anprobe falsch aussieht. Dazu Gerät, Browser und den Namen der Hose.
- Die `hosen.json`, mit der getestet wurde.
- Je Hose, wenn möglich: echte Länge und echten Bund vom Maßband. Die App zeigt daneben ihre Schätzung.

## 6. Bekannte Grenzen (nicht als Fehler melden)

- Eine Hand **auf** der flach liegenden Hose lässt sich nicht herausrechnen. Bitte neu fotografieren.
- Schräg in der Bildebene gelegte Hosen (nicht 0° oder 90°) werden falsch vermessen.
- Overalls, Kleider und Hosenröcke gehen nicht (Röcke schon).
- Links und rechts können in der Rückenansicht vertauscht sein.
