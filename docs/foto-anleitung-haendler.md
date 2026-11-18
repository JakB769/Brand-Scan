# Foto-Anleitung für Händler

Aus zwei Fotos (Vorderseite, Rückseite) baut die App das 3D-Modell der Hose. Je besser die Fotos, desto genauer Passform und Länge.

## Kurzfassung

1. **Hose flach hinlegen**, Bund oben, Beine gerade nach unten. Glatt streichen.
2. **Eine Handbreit Abstand zwischen den Säumen**, die Beine dürfen sich nicht berühren.
3. **Ruhiger Untergrund in anderer Farbe als die Hose**: Jeans auf hellem Laken, Holzboden oder grauem Teppich, helle Hose auf dunklem Boden. Nichts anderes liegt an der Hose (kein Bügel, kein Etikett, keine Hand).
4. **Handy waagrecht und genau über die Mitte der Hose halten**, Hochformat, ohne Zoom. Lieber auf einen Stuhl steigen als schräg fotografieren.
5. **Die ganze Hose im Bild**, rundherum etwas Rand. Nichts abgeschnitten.
6. **Rückseite genauso**: Hose umdrehen, gleicher Platz, gleiche Haltung.
7. **Mindestens eine Länge mit dem Maßband messen** (außen, vom Bund bis zum Saum) und eintragen. Sie hat immer Vorrang vor der Schätzung.

## Warum senkrecht von oben so wichtig ist

Schräg fotografiert erscheint das nahe Ende der Hose größer als das ferne. Schon 10° Neigung machen bei üblichem Abstand rund 20 % Unterschied zwischen Bund und Saum. Da die App die Länge aus dem Verhältnis Bund zu Länge berechnet, wird sie dann deutlich zu kurz oder zu lang geschätzt (Beispiel: 89 statt 105 cm).

**iPhone:** Das Foto enthält, wie das Handy geneigt war. Die App rechnet die Neigung bis etwa 40° heraus. Dafür das Foto **direkt** hochladen (Datei oder Fotomediathek), nicht über WhatsApp, Mail-Verkleinerung oder Screenshots: dabei gehen diese Daten verloren.

**Andere Handys** speichern die Neigung nicht. Dort hilft nur gerade fotografieren oder ein Maßstab im Bild.

## Mit Maßstab im Bild (ohne Maßband)

Eine **Bankkarte** (Normformat ID-1: 85,60 × 53,98 mm, jede EC-, Kredit- oder Kundenkarte) oder ein **A4-Blatt** (21 × 29,7 cm) liefert den Maßstab.

So sieht das Foto aus:
- Hose flach, Kamera möglichst senkrecht darüber, ganze Hose im Bild.
- Karte **flach auf denselben Boden** wie die Hose, **direkt daneben** (zum Beispiel neben den Saum oder zwischen die Beine), ohne sie zu berühren, nicht am Bildrand, ganz sichtbar.
- Kartenseite mit möglichst wenig Glanz nach oben; die Kartennummer muss nicht lesbar sein (Daumen drauf oder Rückseite nach oben ist in Ordnung, solange die vier Ecken frei sind).
- Weißes A4-Blatt nur auf dunklerem Untergrund.

Ablauf in der App: unter „Maßstab im Foto“ Bankkarte oder A4 wählen. Nach dem Hochladen zeigt die App die Karte vergrößert mit vier Kreuzen an den Ecken. Liegen sie richtig, „Passt“. Sonst die Kreuze verschieben, oder „Neu antippen“ und die vier Ecken nacheinander antippen (nach der vierten rasten sie auf die Kartenkanten ein, das sieht man sofort). Findet die App die Karte gar nicht, zeigt sie das ganze Foto: ungefähr auf die Karte tippen, dann wird vergrößert. Bei runden Ecken auf den Punkt tippen, an dem sich die Kanten treffen würden. „Ohne Maßstab“ macht ohne Karte weiter, Escape bricht ab. Die gemessenen Werte stehen danach als „gemessen“ in den Feldern. Eine eingetragene Länge hat immer Vorrang.

Genauigkeit: an Testbildern mit bekannter Länge 1 % (A4 und Karte); an echten iPhone-Fotos einer 105-cm-Hose 107 cm mit Vorder- und Rückseite. Eine Karte ist klein: ein Bildpunkt an ihren Ecken macht etwa 1 % aus. Darum möglichst nah fotografieren (Hose füllt das Bild) und beide Seiten mit Karte.

Die App warnt, wenn die Karte verzogen wirkt (nicht flach oder Ecken falsch), weit von der Hose liegt oder Vorder- und Rückseite verschiedene Längen ergeben.

## Umriss prüfen (wie die Objektauswahl in Photoshop)

Die App trennt die Hose auf zwei Wegen vom Untergrund: nach Farbe und mit einer KI (MediaPipe „magic_touch“, läuft im Browser, kein Foto verlässt das Gerät). Sind sich beide uneinig, öffnet sich das Fenster **„Umriss prüfen“**; mit dem Häkchen „Umriss immer prüfen“ kommt es bei jedem Foto.

- Hell und gelb umrandet ist, was als Hose zählt.
- **－ weg**, dann auf etwas tippen, das nicht zur Hose gehört (Schuh, Karte, Kabel, Teppichkante): es verschwindet.
- **＋ dazu**, dann auf ein fehlendes Stück der Hose tippen.
- **↶** nimmt den letzten Schritt zurück, **Passt** übernimmt.
- Was **auf** der Hose liegt (z. B. eine Hand), lässt sich nicht herausrechnen: der Stoff darunter fehlt im Foto. Bitte neu fotografieren.

## Material angeben

Unter „Material“ die Angabe vom Etikett oder aus der Produktbeschreibung eintragen, z. B. „98 % Baumwolle, 2 % Elasthan“. Daraus wählt die App die Stoffart (fester Denim, Stretch, Chino, Anzugstoff, Sweat, Leinen, fließend) und damit, wie die Hose fällt, schwingt, Falten wirft und glänzt. Die Stoffart lässt sich auch direkt wählen und später an der Hose ändern.

## Was die App prüft und meldet

- Liegt die Hose quer oder auf dem Kopf, dreht die App das Foto.
- Ragt etwas aus der Hose heraus oder ist der Untergrund der Hose zu ähnlich, kommt eine Warnung mit der Bitte, die gelben Umrisslinien zu prüfen.
- Unplausible Maße (z. B. Beine breiter als der Bund) führen dazu, dass die Hose nicht angelegt wird, mit einem Hinweis, woran es liegt.
