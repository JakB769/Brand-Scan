# Analyse der drei 3D-Hosenmodelle

Erstellt mit Blender 5.0.1 (bpy, headless). Bilder und Querschnitte in diesem Ordner, Empfehlung in `empfehlung.md`.

## blue-jeans

**dateien:** Das innere ZIP /home/user/Brand-Scan/assets/pants/blue-jeans/source/model.zip ist mit unzip -n nach /home/user/Brand-Scan/assets/pants/blue-jeans/entpackt/ entpackt. Es enthält 7 Dateien: Jeans_UV.FBX (Binär-FBX 7400, 43 KB, aus 3ds Max 2019, ein einziges Mesh „default“, Material „default“ ohne verknüpfte Bilder) und sechs JPGs zu je 2048×2048: default_Base_Color, default_Normal_OpenGL (Falten und Twill), default_Normal (flach, nur Inselfläche, ohne Detail, unbrauchbar), default_Height (nur Gürtelschlaufen), default_Roughness, default_Metallic (nur Nieten und Knopf). Der Ordner textures/ ist ein zweiter Satz: default_albedo.jpeg ist pixelgleich mit Base_Color (nur neu kodiert, RMSE 0), Roughness und Metallic sind identisch. Normal_2_OpenGL.jpg weicht von default_Normal_OpenGL nur an den Eingriffskanten der beiden vorderen Taschen ab (überarbeitete Fassung, RMSE 0,5 %). Für GLB und Renders habe ich den Satz aus textures/ genommen. source/ und textures/ sind unverändert.

**glb:** /home/user/Brand-Scan/assets/pants/blue-jeans/glb/blue-jeans.glb, 3,03 MB (3.025.532 Byte). Texturen eingebettet in 2048², verkleinern war nicht nötig: Albedo als JPEG, Normal_2_OpenGL als JPEG, metallicRoughness als PNG (der Exporter hat Metallic und Roughness zusammengelegt, 1,24 MB). Maßstab in Metern, auf 105 cm Außenlänge skaliert (Höhe 1,049 m, Breite 0,434 m, Tiefe 0,239 m). Y zeigt nach oben, vorne ist glTF +Z. Der Ursprung liegt in der Mitte der Bund-Oberkante, die Hose hängt also nach −Y. 536 Vertices (durch die UV-Nähte aufgetrennt), 848 Dreiecke, ein Material „Jeans“, doubleSided. Beim Wiedereinlesen in Blender war alles in Ordnung.

**lizenz:** keine Angabe gefunden. Es gibt kein Readme und keine Lizenzdatei. Die FBX-Felder Title, Author und Comment sind leer, die JPGs haben weder EXIF noch XMP. Die einzigen Hinweise stehen in den FBX-Metadaten: Pfad C:\Users\Serhii\Desktop\Jeans_UV.FBX, Projekt C:\Users\Serhii\Documents\3dsMax, erstellt am 02.11.2018 mit 3ds Max 2019 (FBX SDK 2019.0). Die Ordnerstruktur source/model.zip plus textures/ passt zum Download-Format von Sketchfab; das ist eine Vermutung, keine Bestätigung. Die Lizenz muss an der Quelle geprüft werden. Der Eintrag in /home/user/Brand-Scan/assets/pants/LIZENZEN.md ist leer.

**mesh:** Sehr niedrig aufgelöst: 443 Vertices, 868 Kanten, 424 Faces, ausschließlich Quads. Ein Objekt, ein zusammenhängendes Teil, keine Modifier, keine Shape-Keys, keine Vertex-Gruppen und kein Rig. Saubere Ring-Topologie: 23 Ringe à 20 Punkte, im Rumpf 20 Punkte rundum, darunter 10 je Bein; dazu 3 Zusatzpunkte im Schritt. Valenz: 399 Punkte mit 4, 40 Randpunkte mit 3, 4 Pole mit 5 im Schritt. Kantenlänge nach Skalierung: Median 4,6 cm, 1,7 bis 9,1 cm. Das Mesh ist mannigfaltig bis auf 40 Randkanten, das sind drei offene Öffnungen: Bund (20 Kanten, Umfang 79,5 cm) und zwei Säume (je 10 Kanten). Die Saumkante ist nicht eben, sie liegt bis 1,1 cm schräg. Es ist eine einwandige Fläche ohne Stoffdicke: keine Innenseite, kein umgeschlagener Bund, keine doppelten Wände. Taschen, Gürtelschlaufen und Knopf gibt es nur in den Texturen. Alle 424 Normalen zeigen nach außen (geprüft). Aufgeteilte Kanten: 0. Fläche nach Skalierung 8.805 cm².

**uv:** Ein UV-Kanal (UVChannel_1) mit genau 4 Inseln zu je 106 Faces, eine pro Bein vorne und eine pro Bein hinten, also wie ein Schnittmuster. Die Grenzen liegen an der Seitennaht, der Innenbeinnaht und der vorderen und hinteren Mittelnaht. Zuordnung: u 0,02–0,27 hinten +x-Bein mit Gesäßtasche; u 0,29–0,52 vorne −x-Bein mit Eingriffstasche; u 0,50–0,72 vorne +x-Bein mit Hosenschlitz, Knopf und Münztasche; u 0,74–0,98 hinten −x-Bein mit Gesäßtasche. +x ist in der Frontansicht rechts, also das linke Bein des Trägers. Keine Überlappung (Raster-Test 1024², 0 Pixel doppelt). Die Inseln decken 40 % des UV-Quadrats ab. Die Texeldichte ist überall gleich (für alle vier Inseln dasselbe UV/3D-Flächenverhältnis): 13,9 px/cm bei 2048², also 0,72 mm pro Pixel. Die Inseln liegen schräg und gedreht im Atlas. Ein flaches Händlerfoto ließe sich deshalb nicht 1:1 projizieren; man braucht eine Verzerrung je Insel, zum Beispiel über Passpunkte an Bundecken, Schritt und Saumecken. Die Trennung vorne/hinten passt aber genau zu Foto vorne und Foto hinten. Grafik: /home/user/Brand-Scan/docs/modelle/blue-jeans_uv_falten.png

**masse_cm:** Maßstab: Die Seitennaht misst 26,81 bzw. 26,87 Blender-Einheiten (nach FBX-Import mit Faktor 0,0254). Daraus folgt k = 3,912 cm je Einheit, Außenlänge 104,9 bzw. 105,1 cm, im Mittel 105,0. In Rohmaßen ist das Modell 1056 Einheiten hoch; als mm gelesen ist es also schon fast lebensgroß (Faktor 0,9935). Bounding Box skaliert: Breite 43,4 × Tiefe 23,9 × Höhe 104,9 cm.

Alle Werte nach Skalierung, als Breite × Tiefe (horizontaler Schnitt), Umfang und flach = U/2:
- Bund (Öffnungskante): 29,4 × 20,2, U 79,5, flach 39,7, T/B 0,69. 1 cm darunter: 29,7 × 20,5, U 80,3.
- Hüfte 18 cm unter Bund vorne (19,5 cm unter dem höchsten Punkt): 33,7 × 22,6, U 94,0, flach 47,0, T/B 0,67.
- Breitester Schnitt im Schrittbogen (26,3 cm unter Oberkante): 36,3 × 21,2, U 107,4, T/B 0,58. Das ist kein Hüftmaß.
- Oberschenkel 2,5 cm unter Schritt: 17,4 × 19,0 (U 56,7) bzw. 17,5 × 18,1 (U 56,1), flach 28,2, T/B 1,06.
- Knie auf halbem Innenbein (66 cm unter Oberkante): 11,0 × 14,5 (U 40,3) bzw. 10,8 × 14,5 (U 39,8), flach 20,0, T/B 1,33. 5 cm höher: 11,3 × 15,0, U 40,7.
- Wade bei 3/4 Innenbein: 9,7 × 12,1, U 34,1, T/B 1,25.
- Saum (Öffnungskante): 8,3 × 11,0 (U 30,3) bzw. 7,7 × 10,9 (U 29,0), flach 14,8, T/B 1,36.
- Leibhöhe senkrecht: vorne 26,1 cm (Bund vorne bis Schritt), hinten 27,6 cm; der Bund ist hinten 1,5 cm höher. Entlang der Mittelnaht: vorne 31,3 cm, hinten 36,2 cm.
- Schritt: 77,3 cm über der Saumunterkante. Innenbein entlang der Naht 79,2 bzw. 79,9 cm, senkrecht 77,3 cm.
- Passform: schmal/slim, etwa W31.

Tiefe/Breite nach Höhe (cm unter Bund-Oberkante):
- 0–20: 0,67–0,71 (Mittel 0,70)
- 20–28 (Schrittbogen): 0,56–0,66
- 28–35: 1,03–1,10
- 35–50: 1,08–1,19
- 50–60: 1,16–1,30
- 60–70 (Knie): 1,22–1,41
- 70–90: 1,14–1,31
- 90–104: 1,03–1,37

Ab dem Schritt sind die Beine also durchgehend tiefer als breit. Am Bund liegt die Mitte des Schnitts 2 cm vor der Mitte der Hüfte. Volle Tabelle in 1-cm-Schritten: /home/user/Brand-Scan/docs/modelle/blue-jeans_querschnitte.csv. Grafik: /home/user/Brand-Scan/docs/modelle/blue-jeans_querschnitte.png

**haltung:** Stehend getragen, nicht flach gelegt und keine T-Pose. Beine gerade ohne messbare Kniebeuge, leicht gespreizt (A-Stand): Die Beinmitte wandert von x = ±9,9 cm am Oberschenkel nach ±17,5 cm am Saum, also etwa 6° je Bein; die Saummitten liegen 35 cm auseinander. Von der Seite: Ober- und Unterschenkel sind jeweils senkrecht, aber die Schnitte ab der Wade liegen rund 4 cm weiter hinten als die des Oberschenkels; der Übergang liegt in der Kniezone. Der Bund ist nach vorn geneigt, hinten 1,5 cm höher. Links und rechts sind fast symmetrisch (Umfänge ±1 cm).

**falten:** In der Geometrie praktisch keine Falten: Die Clay-Renders ohne Normal-Map zeigen eine glatte Röhre. Bei 10 Punkten pro Beinring und rund 4,6 cm Kantenlänge geht das auch nicht anders; nur die großen Formen (Gesäß, Knie, Wade) sind modelliert. Alle Falten stecken in der Normal-Map, offenbar von einem Hochpoly-Stoffmodell gebacken. Fundorte:
- Schritt: stark, an den Schrittecken der hinteren Teile und als Whiskers vorne.
- Knie vorne: quer liegende Falten.
- Kniekehle: wabenartige Falten auf den hinteren Inseln, etwa auf halber Höhe.
- Saum: Stauchfalten in Querbändern an allen vier Inseln.
- Ober- und Unterschenkel: lange senkrechte Zugfalten, vor allem vorne am −x-Bein.

Stärke: Neigung der tiefpassgefilterten Normalen (3 mm, Twill entfernt) im Mittel 9,5°, p90 20°, p99 36°. Ohne Filter (mit Twill) im Mittel 12,8°, p99 44°. Höhe per Frankot-Chellappa integriert, Band 0,5–6 cm, in 18 × 18 cm großen Feldern: typisch etwa 1,0 cm Spitze-Spitze (Standardabweichung etwa 2 mm), höchstens 1,7 cm. Fein: zusätzlich ein Twill-Muster mit 3 px Periode (etwa 2,2 mm) unter 45°, überall gleich. Vergleich: /home/user/Brand-Scan/docs/modelle/blue-jeans_vorne_geometrie.png gegen ..._vorne_normalmap.png (ebenso hinten und seitlich); Faltenkarte in /home/user/Brand-Scan/docs/modelle/blue-jeans_uv_falten.png.

**texturen:** Alle Texturen 2048×2048, an die 4 UV-Inseln gebunden (Schnittmuster-Atlas, schwarzer Hintergrund, 42 % belegt):
- Albedo (sRGB): hell gewaschener Denim mit Marmor- bzw. Moonwash-Flecken (Mittelwert sRGB 0,53/0,62/0,73), Ziernähten, Taschen, Nieten, Knopf und aufgemalten Gürtelschlaufen. Nicht kachelbar.
- Normal_2_OpenGL (OpenGL, +Y; direkt für glTF/three.js): gebackene Falten und Twill. Die Ränder der Inseln sind mit verschmierten Pixeln aufgefüllt.
- Roughness: Stoff gleichmäßig 0,83–0,84, Nähte und Nieten weichen ab.
- Metallic: nur Nieten und Knopf (0,07 % der Fläche).
- Height (nur im ZIP): nur Gürtelschlaufen.
- default_Normal (nur im ZIP): flach, wertlos.

Ist die Normal-Map als allgemeine Denim-Struktur nutzbar? So wie sie ist nicht: Die Falten gehören zu diesem UV und dieser Pose, die Map ist nicht kachelbar und hat Füllpixel am Rand. Brauchbar ist sie auf zwei Wegen: (a) Wir übernehmen dieses Mesh samt UV; dann passt die Map unverändert als Faltenlage zu jedem Händlerfoto, das auf dieselben Inseln gezogen wird. (b) Aus einem Feld innerhalb einer Insel (zum Beispiel 256² px, etwa 18 × 18 cm) den Hochpass ausschneiden, das ist der Twill mit 3 px Periode unter 45°, und ihn per Versatz und Überblendung kachelbar machen. Das ergibt eine allgemeine Denim-Feinstruktur. Diese Kachel ist noch nicht erstellt.

**renders:** /home/user/Brand-Scan/docs/modelle/blue-jeans_vorne.png, /home/user/Brand-Scan/docs/modelle/blue-jeans_seitlich.png (Kamera von +x, vorne liegt links im Bild), /home/user/Brand-Scan/docs/modelle/blue-jeans_hinten.png, /home/user/Brand-Scan/docs/modelle/blue-jeans_schraeg.png (perspektivisch, 3/4 von vorne). Die drei erstgenannten orthografisch, alle Cycles CPU, 24 Samples, OIDN, 600×800, neutral grauer Hintergrund. Nur Geometrie (Clay ohne Normal-Map): /home/user/Brand-Scan/docs/modelle/blue-jeans_vorne_geometrie.png, ..._seitlich_geometrie.png, ..._hinten_geometrie.png. Clay mit Normal-Map: /home/user/Brand-Scan/docs/modelle/blue-jeans_vorne_normalmap.png, ..._seitlich_normalmap.png, ..._hinten_normalmap.png. Drahtgitter: /home/user/Brand-Scan/docs/modelle/blue-jeans_vorne_netz.png, ..._seitlich_netz.png, ..._hinten_netz.png. UV-Layout und Faltenkarte: /home/user/Brand-Scan/docs/modelle/blue-jeans_uv_falten.png. Querschnitte: /home/user/Brand-Scan/docs/modelle/blue-jeans_querschnitte.png (Profil Breite/Tiefe, Umrisse von oben, Tabelle) und /home/user/Brand-Scan/docs/modelle/blue-jeans_querschnitte.csv. Skripte und Rohdaten: /tmp/modelle-skripte/blue-jeans/ (common.py, measure.py, measure.json, render.py, export_glb.py, check.py, py/nmap.py, nmap.json, py/tiltmap.py, py/plot_sections.py). Workbench rendert headless ebenfalls (EGL-Warnungen, aber Bild kommt), wird hier aber nicht genutzt.

**eignung_basis:** Als Basis-Mesh bedingt geeignet: gut als Gerüst und Vorlage, als fertiges Mesh zu grob. Was dafür spricht:
- UV: Vorder- und Rückseite liegen je Bein auf getrennten, überlappungsfreien Inseln mit gleicher Texeldichte. Foto vorne kommt auf die zwei vorderen Inseln, Foto hinten auf die zwei hinteren; die Nähte liegen an Seite, Innenbein und Mitte, also dort, wo bei der flach fotografierten Hose die Kanten sind.
- Topologie: reine Quad-Ringe (20 Punkte Rumpf, 10 je Bein, 23 Ringe), die unserem Ansatz mit Querschnitten von Bund bis Saum fast 1:1 entsprechen. Man kann die Ringe direkt aus unseren Maßen (Breite, Tiefe, Umfang je Höhe) neu setzen, statt eine Form vorzugeben.
- Pose: gerade stehend im leichten A-Stand mit Hüfte, Knie und Knöchel auf natürlicher Höhe. Gut zum Skinnen auf ein Skelett mit 2 Hüft-, 2 Knie- und 2 Fußgelenken.
- Leicht: 3 MB, 848 Dreiecke, gut fürs Handy.
- Proportionen realistisch: Leibhöhe hinten höher als vorne, plausible Tiefe-zu-Breite-Werte.
- Normal-Map: Wer Mesh und UV übernimmt, bekommt Faltendetail für jede Hose gratis.

Was dagegen spricht:
- Viel zu grob für Silhouette und Verformung: 10 Punkte je Beinring wirken eckig, die Ringe liegen 4–5 cm auseinander. Für sauberes Kniebeugen braucht es 1–2 Stufen Unterteilung (rund 1,7k bzw. 6,8k Quads) oder neu gesetzte Ringe.
- Nur eine Passform (slim, etwa W31, Saum U 29,6). Weite oder Baggy-Hosen verlangen andere Querschnitte; die Ringe skalieren zwar mit, aber die Falten der Normal-Map passen dann nicht mehr.
- Die Falten sind fest in der Normal-Map gebacken, gelten nur für diese Pose und bewegen sich beim Skinnen nicht mit.
- Keine Stoffdicke, kein Bund, keine Innenseite. Beim Blick in die Öffnung sieht man dieselbe Textur von hinten (doubleSided); für die Anprobe ist das meist unkritisch.
- Händlerfotos müssen je Insel verzerrt werden, weil die Inseln als Schnittmuster schräg im Atlas liegen. Das ist ein Zusatzschritt im Generator, lässt sich aber automatisieren.
- Lizenz unklar; vor jeder Übernahme ins Produkt klären.

Fazit: Als Referenz für Proportionen, UV-Aufteilung und Ring-Topologie sehr nützlich. Als echtes Basis-Mesh nur nach Unterteilung bzw. neuem Setzen der Ringe aus unseren Maßen und nur mit geklärter Lizenz.

**uebernehmen:** ["Tiefe/Breite nach Höhe als Vorgabe für die Seitenansicht (Thema A5): Rumpf bis 20 cm unter Bund etwa 0,70, Schrittbogen 0,56–0,66, Oberschenkel 1,05–1,10, mittleres Bein 1,13, Knie 1,3 (bis 1,4), Wade 1,2–1,25, Saum 1,2–1,36. Die Beine sind getragen tiefer als breit.", "Proportionen bei 105 cm Außenlänge: Leibhöhe senkrecht vorne 26,1, hinten 27,6 cm (Bund hinten 1,5 cm höher, also nach vorn geneigt); vordere Leibnaht 31,3, hintere 36,2 cm; Schritt 77,3 cm über dem Saum; Bund-Querschnitt rund 2 cm vor die Hüftmitte versetzt.", "Umfänge als Plausibilitätsreihe für eine Slim-Jeans etwa W31: Bund 79,5, Hüfte (18 cm unter Bund) 94,0, Oberschenkel 56,4, Knie 40,0, Wade 34,1, Saum 29,6 cm (flach 39,7 / 47,0 / 28,2 / 20,0 / 17,0 / 14,8).", "Ring-Topologie als Vorlage für unser Querschnitt-Mesh: 20 Punkte am Rumpf, 10 je Bein, Übergang im Schritt mit 4 Polen der Valenz 5. Die Ringe lassen sich aus unseren Breite/Tiefe/Umfang-Werten neu setzen (für Kniebeugen dichter).", "UV-Aufteilung als Schnittmuster: je Bein eine vordere und eine hintere Insel, Nähte an Seite, Innenbein und vorderer/hinterer Mitte. Foto vorne auf die vorderen Inseln, Foto hinten auf die hinteren, mit Verzerrung über Passpunkte (Bundecken, Schritt, Saumecken).", "Faltenmuster aus der Normal-Map als Vorlage für unsere Drape- und Faltenlogik: Querfalten am Knie vorne, Wabenfalten in der Kniekehle, Whiskers und Zug an den Schrittecken, Stauchfalten am Saum, lange Zugfalten auf Ober- und Unterschenkel. Stärke etwa 1 cm Spitze-Spitze, Standardabweichung etwa 2 mm, mittlere Neigung 9,5°.", "Twill-Feinstruktur aus der Normal-Map (Periode etwa 3 px bzw. 2,2 mm, 45°) als Hochpass ausschneiden und kachelbar machen; ergibt eine allgemeine Denim-Normal-Map für alle Hosen.", "PBR-Werte für Denim: Roughness 0,83–0,84 gleichmäßig, Metallic nur an Nieten und Knopf. Normal-Map im OpenGL-Format passt direkt zu three.js.", "Haltung als Referenz für den Ruhezustand des Skeletts: Beine gerade, je etwa 6° gespreizt, Saummitten 35 cm auseinander, Wadenquerschnitt etwa 4 cm hinter dem Oberschenkel."]

## camo-pants

**dateien:** Das innere ZIP „CAMO PANTS.zip“ wurde mit unzip -n nach /home/user/Brand-Scan/assets/pants/camo-pants/entpackt/ entpackt. Darin liegen 5 Dateien:
- „CAMO PANTS.FBX“, 7,6 MB: binäres FBX 7400, mit FBX SDK 2017.0.1 aus 3ds Max exportiert. Pfad in der Datei: C:\Users\Badboy17Aiden\Desktop\. Die Textur ist eingebettet.
- „Camo 02.jpg“, 7,3 MB, 2048×2048.
- „OUTFIT.obj“, 684 KB, aus dem OBJ-Exporter v1.2 von CLO Virtual Fashion. Das ist das ganze Outfit: dieselbe Hose noch als Quads, dazu ein schwarzes schulterfreies Oberteil.
- „OUTFIT.mtl“ und „OUTFIT_0.mtl“: beide identisch, aus dem CLO-MTL-Exporter.

Ausgewertet wurde das FBX. Seine Rohkoordinaten sind mm, z zeigt nach oben, vorne ist −y. Der Objekt-Maßstab 0.0254 im FBX ist falsch: Damit wäre die Hose 23 m hoch.

„textures/Camo 02.jpeg“ hat die gleichen Pixel wie die JPG im ZIP, nur ohne Metadaten. Quelle und Texturen-Ordner wurden nicht verändert.

**glb:** /home/user/Brand-Scan/assets/pants/camo-pants/glb/camo-pants.glb, 7,50 MB.
- Gleiche Konvention wie blue-jeans.glb: Meter, skaliert auf 1,05 m Außenlänge (Rohmaß in mm × 1,1841). Ursprung ist die Mitte der Bund-Oberkante; oben ist +Y, vorne +Z.
- Die Textur ist als Original-JPEG in 2048 eingebettet (wird nicht neu kodiert). Sampler-Wrap ist REPEAT; das ist nötig, weil die UVs über 0..1 hinausgehen.
- 2 Materialien:
  - stoff_FABRIC_5: baseColorTexture, roughness 0,9, metallic 0, doubleSided.
  - knoepfe: fast schwarz (0,027), roughness 0,5.
- Den leeren Normal-Map-Knoten habe ich entfernt.
- Extras am Knoten: Quelle, Maßstab, Ursprung.
- Gegenprobe: neu importiert in Blender (5920 Dreiecke, Bild 2048², Bounding Box 0,451 × 0,265 × 1,054 m) und gerendert. Textur und Ausrichtung stimmen.
- Skripte liegen in /tmp/modelle-skripte/camo-pants/ (export_glb.py, glbcheck.py).

**lizenz:** Keine Angabe gefunden.
- Weder im ZIP noch in den Ordnern gibt es eine Readme. /home/user/Brand-Scan/assets/pants/LIZENZEN.md hat für camo-pants leere Felder.
- FBX: Autor, Titel und Copyright sind leer. Die einzige Spur ist der Exportpfad „C:\Users\Badboy17Aiden\Desktop\CAMO PANTS.FBX“ und „Badboy17Aiden\Documents\3dsMax“.
- OBJ/MTL: nur der Exporter-Vermerk von CLO Virtual Fashion. Das Modell wurde also in CLO/Marvelous Designer gebaut.
- JPG: Photoshop CS6, erstellt am 01.01.2017. Die XMP-Daten nennen weder Urheber noch Rechte.

Bis die Lizenz geklärt ist, nur intern als Referenz nutzen.

**mesh:** **FBX**
- 3325 Vertices, 5920 Dreiecke, nur Dreiecke.
- Stoff: 3181 Vertices / 5648 Dreiecke. Knöpfe: 144 Vertices / 272 Dreiecke.
- Im OBJ ist dieselbe Hose noch quad-basiert: 2802 Quads + 45 Dreiecke in 11 Pattern2D-Gruppen, ohne Knöpfe.
- 1 Objekt, keine Modifikatoren, keine Vertex-Gruppen, keine Shape-Keys, kein Rig.

**18 getrennte Teile**
- 4 Hauptteile (Vorder- und Hinterhose, je links und rechts, 735–754 Vertices).
- 2 Bundhälften (49/51) und 1 Schlitzbeleg (27).
- 2 Seitenpatten an der Hüfte (26) und 2 Kniepatten (13).
- 4 Knöpfe (je 36 Vertices, eigenes Material).
- 3 lose Einzel-Dreiecke hinten links (z 677–692 mm). Dazu passt ein kleines Loch in der linken Hinterhose.

**Topologie**
- Manifold-artig: 0 Kanten mit mehr als 2 Flächen, keine Drahtkanten.
- 688 offene Randkanten in 15 Randschleifen.
- Die Teile sind an den Nähten nicht verschweißt: 304 deckungsgleiche Vertex-Paare liegen zwischen verschiedenen Teilen. Seitennaht, Innenbein, Schritt und Bundnaht sind also nur aneinandergelegt.
- Bund- und Saumöffnungen sind offen.
- Einlagiger Stoff ohne Dicke und ohne Innenseite: Die Innenseite ist nur die Rückseite der Fläche, darum doubleSided.
- Keine doppelten Wände. Nur dort, wo Patten auf der Hose liegen, gibt es 4,7 % Fläche mit einer zweiten Lage innerhalb von 12 mm.

**Auflösung**
- Kantenlänge im Median 18,8 mm roh, also 2,3 cm bei 105 cm (p5–p95: 1,4–3,2 cm). Das Netz ist grob.

**uv:** Ein UV-Kanal, „UVChannel_1“.
- Typisch für CLO: Jede Insel ist das flache Schnittteil in Originalgröße. 1 UV-Einheit ≈ 71,8 cm Stoff roh (85 cm bei 105 cm). Die 3D-Fläche geteilt durch die UV-Fläche ergibt je Teil ≈ 1,00.
- Jedes Teil liegt für sich mittig bei (0,5|0,5). Alle Inseln überlappen sich also zu 100 % und reichen über 0..1 hinaus (v −0,077 bis 1,128). Die Textur wird nur gekachelt.
- Vorder- und Rückseite sind getrennte Inseln:
  - Vorderhose: 102,2 × 33,1 cm.
  - Hinterhose: 102,5 × 40,6 cm, mit Gesäß-Abnäher.
  - Links und rechts sind spiegelgleich und liegen auf derselben Stelle.
- Weitere Inseln: Bund 2 × (42,8 × 2,4 cm), Schlitzbeleg 17,5 × 3,5, Seitenpatte 12,6 × 7,6, Kniepatte 10,1 × 3,7 cm. Die Knöpfe belegen das ganze Quadrat 0..1, sind aber winzig und ohne Textur.
- Fadenlauf: v läuft das Bein entlang nach oben.
- Texeldichte: 2048 px auf 71,8 cm ergibt 28,5 px/cm roh bzw. 24 px/cm bei 105 cm.

**Dehnung im Drape gegenüber dem Schnitt (linear)**
- Beine: Median 0,9–1,4 %.
- Gesäß und Hüfte: 4–8 %.
- Bund: Median 5,5 %, p95 8–10 %.

Grafik: docs/modelle/camo-pants_uv_schnitt.png.

**masse_cm:** Faktor 1,184 (Original: Außenlänge 88,7 cm, Innenbein 62,7 cm). „Höhe“ heißt über dem tiefsten Saumpunkt. B = Breite (x), T = Tiefe (y).

**Bund (Oberkante)**
- B 35,0, T 24,1, T/B 0,69.
- Umfang der Kante 95,4 cm → flach 47,7 cm.
- Schnitt ungedehnt: 2 × 42,8 = 85,6 cm → flach 42,8 cm. Im Drape ist der Bund ≈ 5,5 % gedehnt.
- Bundhöhe nur 2,0–2,2 cm.
- Oberkante vorne bei 103,1 cm, hinten bei 105,2 cm: hinten 2,1 cm höher.
- Mitte des Bundstreifens: B 35,2, T 25,2, T/B 0,72.

**Hüfte (Schritt + 8 cm, Höhe 79,5)**
- B 43,0, T 24,4, T/B 0,57.
- Maßband 111,6 cm (Maximum 111,9 bei 74 cm) → flach ≈ 55,8 cm.
- Stoffumfang samt Patten 115 cm.

**Schritt + 1 (72,5)**
- B 43,5, T 24,2, T/B 0,56.

**Oberschenkel (2,5 cm unter Schritt, 69,0), je Bein**
- B 20,9, T 23,5, T/B 1,13, Umfang 69,8 → flach 34,9.

**Knie (39,3)**
- B 14,0, T 17,9, T/B 1,27, Umfang 49,3 → flach 24,7.

**Wade (19,7)**
- B 15,3, T 14,2, T/B 0,92, Umfang 45,5.

**Saum (4,3, knapp über dem höchsten Saumpunkt)**
- B 10,8, T 15,7, T/B 1,41–1,50, Umfang 42,9.
- Saumkante 42,1 cm → flach 21,0.
- Der Saum ist schräg: vorne 3,2 cm höher.

**Leibhöhe**
- Vorne senkrecht 31,6 cm, Naht 37,6 cm.
- Hinten senkrecht 33,7 cm, Naht 38,5 cm.

**Schritt**
- 71,5 cm über dem tiefsten Saumpunkt (68 % der Außenlänge).
- Innenbeinnaht 74,3 cm. Außennaht bis zur Bundkante 105,0 cm.

**Bounding Box**
- 45,1 × 26,5 × 105,4 cm.

**Tiefe/Breite über die Höhe (Profil alle 0,5 cm)**
- Saum 1,5 → Wade 0,86 (bei 13 cm) → steigt bis 1,40 (46 cm, über dem Knie) → Knie 1,27 → Oberschenkel 1,14.
- Über dem Schritt: Hüfte 0,55–0,58 → unter dem Bund 0,64–0,72.
- Die Beine sind getragen tiefer als breit.

Vollständige Tabelle: docs/modelle/camo-pants_querschnitte.csv.

**haltung:** Getragener Faltenwurf (Drape) aus CLO auf einem Avatar (vermutlich weiblich, wegen des Oberteils im OBJ). Die Form ist dreidimensional, nicht flach und keine T-Pose. Der Avatar selbst ist nicht enthalten.

- Die Beine sind gerade: Im Seitenprofil weicht das Knie nur 1–3 mm von der Geraden ab, die Neigung ist ≤ 1,2°.
- Leicht gespreizter A-Stand: Jedes Bein steht in der Frontansicht 3,6° nach außen.
- Abstand der Beinmitten: 21,3 cm am Oberschenkel, 26,7 cm am Knie, 29,3 cm am Saum.
- Lücke zwischen den Beinen: 1,8 cm am Oberschenkel, 13,2 cm am Knie, 18,2 cm am Saum.
- Der Saum liegt auf dem Fuß auf: vorne 3,2 cm höher als hinten.
- Die Bund-Oberkante ist hinten 2,1 cm höher als vorne.

**falten:** Nur als Geometrie vorhanden. Es gibt keine Normal-Map (der Normal-Map-Knoten im FBX ist leer).

Gemessen als Abstand zur Taubin-geglätteten Fläche entlang der Normale (bei 105 cm):
- Unterste 15 cm (Saum staucht auf dem Fuß, vorne): RMS 6–7 mm, p95 10–15 mm, max 1,8 cm. Das ist der stärkste Bereich.
- Schritt und Gesäß (68–80 cm): RMS 3,5–3,8 mm, p95 8 mm, max 1,4 cm. Zugfalten im Schritt.
- Beinmitte (21–68 cm): RMS 2,3–3,3 mm, p95 4–6 mm.
- Hüfte bis Bund: RMS 2,2–2,5 mm.
- An den Seitennähten laufen senkrechte Kämme (Nahtwulst wie aus CLO).
- Am Knie liegen 8–9 Kämme > 1 mm rundherum, also etwa alle 5,5–6 cm.

Wegen der Kantenlänge von 2,3 cm gibt es nur weiche, großwellige Falten (Wellenlänge ≥ ~5 cm). Feine Knitter, Nahtdetails oder Stoffstruktur fehlen.

Heatmap: docs/modelle/camo-pants_falten.png.

**texturen:** Eine einzige Textur: „Camo 02.jpg“.
- 2048×2048 RGB-JPEG, Qualität ≈ 100, sRGB, Photoshop CS6. Nur Albedo; es gibt weder Normal- noch Roughness-Map.
- Trotz des Namens **kein Camo-Muster**: einfarbig olivgrüner Melange-Strick- bzw. Webstoff (Mittelwert RGB 84/104/80). Kaum großflächige Helligkeitsunterschiede (Standardabweichung nach Weichzeichnen mit 32 px Radius: 0,6).
- Das Bild ist eine exakte 4×4-Wiederholung einer 512-px-Kachel (Autokorrelation 1,0 bei 512 px). Es ist nahtlos kachelbar: Die Kantensprünge sind so groß wie innen im Bild.
- Eine Kachel entspricht ≈ 18 cm Stoff roh bzw. 21 cm bei 105 cm. Kein Wasserzeichen gefunden.
- Als Normal-Map nicht nutzbar, weil keine vorhanden ist. Die Farbtextur ist als allgemeiner Stoff kachelbar und nicht an dieses UV gebunden: Die UVs sind Schnittteile in echtem Maßstab mit REPEAT.
- Für Denim taugt sie nicht (falsche Farbe und Bindung). Die 512-px-Kachel allein (≈ 0,4 MB) würde reichen.

**renders:** Alle Renders: Cycles auf der CPU mit 24 Samples, 600×800, orthografisch, neutraler Hintergrund und 10-cm-Maßstab.
- /home/user/Brand-Scan/docs/modelle/camo-pants_vorne.png
- /home/user/Brand-Scan/docs/modelle/camo-pants_seitlich.png (von +x, vorne links im Bild)
- /home/user/Brand-Scan/docs/modelle/camo-pants_hinten.png
- /home/user/Brand-Scan/docs/modelle/camo-pants_schraeg.png (35°)

Grafiken und Tabelle:
- /home/user/Brand-Scan/docs/modelle/camo-pants_falten.png: Falten-Heatmap vorne, seitlich, hinten (Workbench).
- /home/user/Brand-Scan/docs/modelle/camo-pants_querschnitte.png: 7 Querschnitte in Draufsicht, dazu Profile für Breite/Tiefe, T/B und Umfang.
- /home/user/Brand-Scan/docs/modelle/camo-pants_querschnitte.csv: 167 Höhen, Trennzeichen ;.
- /home/user/Brand-Scan/docs/modelle/camo-pants_uv_schnitt.png: Schnittteile aus den UVs mit Dehnungskarte.

Prüfbild der .glb: /tmp/modelle-skripte/camo-pants/test/glb_check.png

**eignung_basis:** Technisch bedingt geeignet, rechtlich derzeit nicht (Lizenz unbekannt). Am meisten nützt das Modell als Referenz für Form und Schnitt.

**Dafür**
- Echte getragene 3D-Form aus einer Stoffsimulation, mit plausiblen Querschnitten.
- Kleines, sauberes Netz (5,9k Dreiecke).
- Klare Trennung in Vorder- und Hinterhose.
- Die UVs sind das flache Schnittmuster in Originalmaßstab. Damit gibt es eine direkte Zuordnung „flaches Teil ↔ getragenes 3D“, genau die Brücke zwischen Flachfoto und getragener Form.

**Dagegen**
1. Händlerfotos lassen sich nicht direkt auflegen. Alle UV-Inseln liegen übereinander und sind nur auf Kacheln ausgelegt. Es braucht ein neues UV-Layout: die Vorderteile nebeneinander wie in der Flachlage, darauf das vordere Foto, und die Hinterteile ebenso. Das geht mit den vorhandenen Schnittteil-UVs relativ leicht (Inseln verschieben bzw. spiegeln, normieren).
2. Die Nähte sind nicht verschweißt. Beim Skinning reißen sie auf, also vorher „Merge by Distance“ (0,5 mm, 304 Paare).
3. Kein Rig, keine Gewichte, kein Avatar. Die A-Stellung (±3,6°, Saum 29 cm auseinander) müsste auf unser Skelett umgestellt werden.
4. Cargo-spezifische Teile (4 Patten, 4 Knöpfe, Schlitzbeleg) und 3 lose Dreiecke samt Loch müssten für Jeans weg.
5. Einlagig ohne Dicke und ohne Innenseite. Der Saum liegt schräg auf dem Fuß, der Bund ist sehr schmal (2 cm).
6. Grobes Netz (2,3 cm Kanten): Falten in der Nähe kämen aus einer Normal-Map oder unserem Drape.
7. Die Maße passen nur zu dieser Größe (Original eine Damengröße mit 88,7 cm Außenlänge). Ein Anpassen über Querschnitts-Skalierung je Höhe ist möglich.

**Fazit:** Als Ausgangsnetz für Hosen allgemein nur mit Umbau (Verschweißen, Patten entfernen, neues UV, Rig). Als Messvorlage gut.

**uebernehmen:** ["Tiefe/Breite je Höhe für weite, getragene Hosen: Bund 0,69–0,72, Hüfte/Schritt 0,55–0,58, Oberschenkel 1,13, über dem Knie bis 1,40, Knie 1,27, Wade 0,86–0,92, Saum 1,4–1,5 (Fuß). Unsere festen 0,8 für die Beine sind bei weiten Hosen zu flach; unsere 0,62 fürs Becken liegen nahe an 0,57.", "Proportionen bei 105 cm Außenlänge: Schritthöhe 71,5 cm (68 %), Innenbein 74,3, Leibhöhe vorne 31,6 (Naht 37,6), hinten 33,7 (Naht 38,5), Bundoberkante hinten 2,1 cm höher als vorne.", "Weitenverhältnis Vorder- zu Hinterhose aus dem Schnitt: vorne ≈ 0,82–0,90 der Hinterhose (Saum 19,8 zu 22,5, Knie 23,2 zu 25,9, Hüfte 29,1 zu 33,8, Bund 24,5 zu 27,1 cm). Brauchbar, um die Rückseite aus dem Frontfoto zu schätzen.", "Umfang je Höhe aus dem Schnitt: Vorder- plus Hinterteilbreite ergibt genau den Beinumfang (Saum 42,3 ≈ 42,1 gemessen, Knie 49,1 ≈ 49,3). Bestätigt unsere Rechnung Flachbreite × 2 = Umfang an den Beinen.", "Saumform: Saum vorne 3,2 cm höher als hinten (liegt auf dem Fußrücken), Querschnitt dort T/B ≈ 1,4–1,5; dazu Stauchfalten nur in den untersten 15 cm (RMS 6–7 mm, max 1,8 cm).", "Faltenstärken als Zielwerte für unser Drape bzw. unsere Normal-Map: Beinmitte RMS 2,3–3,3 mm (p95 4–6 mm), Schritt-Zugfalten p95 8 mm, Knie 8–9 Wellen rundherum (Abstand ≈ 5,5–6 cm), dazu Nahtwülste entlang der Seitennähte.", "Dehnungskarte aus Schnitt gegenüber Drape (Bund 5–10 %, Gesäß 4–8 %, Beine ≈ 1 %) als Vorlage für die geplante Passform-Einfärbung (wo die Hose spannt).", "Schnittteilformen (Vorderhose mit Knick in der Seitennaht auf Kniehöhe, Hinterhose mit Abnäher und längerem Schrittzipfel) als Vorlage, falls wir den Generator auf ein Schnittmuster-Modell umstellen.", "Olivgrüne Stoffkachel (512 px, nahtlos) höchstens als neutraler Platzhalter-Stoff; keine Normal-Map zum Übernehmen."]

## hosen

**dateien:** Das innere ZIP (/home/user/Brand-Scan/assets/pants/hosen/source/model.zip, 8,7 MB) ist mit unzip -n nach /home/user/Brand-Scan/assets/pants/hosen/entpackt/model/ entpackt. Darin liegen model.dae (COLLADA 1.4.1, 210 KB, von „Assimp Exporter“ am 2022-08-08 geschrieben, Einheit 0,01 m = cm, Y oben, ein Knoten „shtany quadro_014 RETOPO“ mit Skalierung 1,0025 und Versatz (-0,68 / 71,39 / -1,49) cm) sowie textures/ mit Default_OBJ_albedo.jpg, _AO.jpg, _metallic.jpg, _roughness.jpg und _normal.png. Alle Texturen sind 2048². Sie sind pixelgleich mit den Dateien in assets/pants/hosen/textures/ (dort .jpeg, die PNG unterscheidet sich nur in den Metadaten). Es gibt kein Skelett, keine Gewichte, keine Morphs und ein einziges Material. Blender 5.0 kann COLLADA nicht mehr importieren (Operator entfernt). Darum liest ein eigener Leser die DAE (/tmp/modelle-skripte/hosen/common.py, mit Sperre gegen DOCTYPE/ENTITY). source/ und textures/ sind unverändert.

**glb:** /home/user/Brand-Scan/assets/pants/hosen/glb/hosen.glb, 11,9 MB. Texturen eingebettet in 2048²: Albedo JPEG 0,49 MB, Normal-Map PNG 7,26 MB, AO+Roughness+Metallic gepackt als ORM-PNG 4,1 MB (occlusionTexture und metallicRoughnessTexture). Das Modell hat Originalgröße und -lage in Metern, Y oben, Vorderseite +Z, tiefster Saumpunkt 7,7 cm über dem Ursprung (Boden). Es ist NICHT auf 105 cm skaliert, die Skalierung gilt nur für die Messwerte. Enthalten sind 1304 Vertices (an UV-Nähten getrennt) und 2110 Dreiecke, die Original-Normalen aus der DAE als Custom Normals, Tangenten und ein doppelseitiges Material. Geprüft durch Re-Import in Blender und Render von vorne und hinten.

**lizenz:** Keine Angabe gefunden. Im ZIP liegt nur model.dae plus Texturen, ohne Readme und ohne Lizenzdatei. Im DAE stehen nur author/authoring_tool „Assimp“, Datum 2022-08-08. Die JPEGs haben nur JFIF-Kopf, kein EXIF/XMP, die PNG keine Text-Chunks. In assets/pants/LIZENZEN.md ist die Zeile „hosen“ leer. Hinweise auf die Herkunft: Der Objektname „shtany quadro_014 RETOPO“ ist russisch für „Hose“ und zeigt eine Retopologie. Die Texturnamen „Default_OBJ_*“ folgen dem Muster einer Substance-artigen Export-Vorlage, das ist eine Vermutung. Die ZIP-Zeitstempel 1980 sprechen für ein automatisch erzeugtes Download-Paket. Vor jeder Nutzung über interne Tests hinaus muss die Quelle und Lizenz geklärt werden.

**mesh:** 1304 Vertices in der Datei, 1180 nach Verschmelzen der UV-Naht-Duplikate, 3283 Kanten, 2110 Dreiecke. Alles sind Dreiecke, aber es ist eine triangulierte Quad-Retopo: join_triangles ergibt 1006 Quads plus 98 Dreiecke. Die Topologie ist unregelmäßig und nicht ringförmig je Höhe. Kantenlänge (auf 105 cm skaliert): Median 3,1 cm, min 0,18 cm, max 13,5 cm (Taschenseiten). Dreiecksqualität Median 0,73.

Das Netz besteht aus 9 getrennten Teilen: dem Hauptkörper (1318 Dreiecke, 682 Vertices) und 8 aufgesetzten Schalen (2 Cargotaschen an den Oberschenkeln, 2 Cargoklappen, 2 Gesäßtaschen, 2 Gesäßtaschenklappen).

Es gibt keine Kante mit mehr als 2 Flächen, aber 236 offene Randkanten in 11 Randschleifen:
- Bund: Die Oberkante ist ein 2 cm breiter, waagerechter Ring nach oben (eigene UV-Insel). Die Öffnung innen bleibt offen (Umfang 81,8 cm, 29,6 × 20,9 cm).
- Saum: je ein waagerechter Ring nach unten, der die Öffnung verengt. Außenkante 44,9 / 42,4 cm Umfang, Loch nur 31,7 / 28,4 cm (7,2 × 12,3 bzw. 6,5 × 11,2 cm).
- Die 8 Taschen sind hinten offen (Rand liegt auf der Hosenfläche).

Es ist eine einwandige Fläche: keine Innenseite, kein Futter, kein nach unten gehender Bundbeleg, keine doppelten Wände. Ins Hoseninnere sieht man nur die Rückseite der Außenhaut, deshalb doppelseitiges Material. Die Normalen sind einheitlich nach außen: Die DAE-Vertexnormalen stimmen bei allen 2110 Dreiecken mit der Windungsrichtung überein und sind auch über die UV-Nähte glatt. recalc_face_normals dreht nur eine offene Taschenschale, ein Artefakt der Heuristik. Die Geometrie ist glatt und ohne Faltenrelief.

**uv:** 13 Inseln, keine Überlappung, nichts gespiegelt, 36 % der Fläche belegt, Texeldichte überall gleich 10,6 px/cm bei 2048 (≈ 0,94 mm/px).
- Die beiden großen Inseln sind das Vorderteil (604 Dreiecke, beide Beine plus vorderer Schritt) und das Hinterteil (616 Dreiecke, beide Beine). Die Hose ist also sauber in vorne und hinten getrennt.
- Die Schnitte liegen genau auf den Seitennähten (Länge 107,8 / 106,9 cm roh) und den Innenbeinnähten (eine durchgehende Naht 157,6 cm roh über den Schritt). Die vordere und hintere Mitte sind keine Naht.
- Beide Inseln sind wie ein Schnittmuster aufgeklappt („X“/„<“-Form, Beine schräg). Sie sind keine Planarprojektion; ein flaches Händlerfoto passt nicht 1:1 darauf.
- Dazu kommen 1 Insel Bundkante (Ring), 2 Inseln Saumkante (Ringe, eine liegt im Bundring) und 8 Taschen- und Klappeninseln am unteren Rand.
- Außerhalb der Inseln ist die Textur mit gestreckten Streifen aufgefüllt (Dilation).
Grafik: /home/user/Brand-Scan/docs/modelle/hosen_uv.png

**masse_cm:** Skalierung: Faktor 0,9782 auf das Rohmaß in cm. Die Außenlänge ist die Seitennaht von der Bundoberkante bis zur Saumkante, roh 107,8 / 106,9 cm, im Mittel 107,35 → 105,0. Die Bounding Box ergibt dann 45,6 breit × 28,5 tief × 106,3 hoch (roh 46,6 × 29,1 × 108,7). Geschnitten wird mit waagerechten Ebenen nur durch den Hauptkörper, ohne aufgesetzte Taschen (die tragen höchstens +1,6 cm Breite am Schritt bei). B = Breite (x), T = Tiefe (y), U = Stoffumfang; unter dem Schritt gilt der Wert je Bein (rechts/links).

- **Bund oben:** Umfang der Oberkante 95,0, flach 47,5; B 34,4, T 24,1. Die Oberkante liegt vorne Mitte 103,7, hinten Mitte 104,7 und an den Seiten bis 106,3 über dem tiefsten Saumpunkt.
- **Bund 1 cm unter der Oberkante:** B 35,2, T 24,3, T/B 0,69, U 95,9.
- **Hüfte max** (79,9 über Saum, 3,4 über Schritt): B 42,2, T 25,9, T/B 0,61, U 113,1, Maßband 112,6.
- **Hüfte Schritt+8:** B 40,8, T 27,1, T/B 0,66, U 110,9.
- **Schritt+1:** B 42,8, T 24,9, T/B 0,58.
- **Oberschenkel** (2,5 unter Schritt): rechts B 21,0 T 22,5 (1,07) U 68,2; links B 20,7 T 23,7 (1,14) U 69,2.
- **Knie** (Schritt − ½ Innenbein + 5, also 43,2 über Saum): B 13,3 T 16,9 (1,27) U 49,1 / B 14,7 T 17,4 (1,18) U 50,8.
- **Wade** (23,3): B 13,9 T 18,0 (1,29) U 48,8 / B 13,9 T 17,3 (1,24) U 48,1.
- **Saum** (1 cm über dem höchsten Saumpunkt): B 10,2 T 17,3 (1,70) U 44,4 / B 10,1 T 16,1 (1,60) U 42,7.
- **Saumkante:** U 44,9 / 42,4 (flach 22,4 / 21,2), B 10,0 T 16,9 bzw. 9,9 T 16,3. Hinten liegt die Kante tiefer als vorne (0–3,4 cm).

**Leibhöhe (Bundoberkante bis Schrittpunkt, senkrecht):** vorne Mitte 27,2, hinten Mitte 28,2, Seite (höchster Punkt) 29,8. Bis zum tiefsten Punkt der Schrittkurve: 27,9 / 28,8. Die Schrittnaht in der Mittelebene ist insgesamt 76,8 lang (vorne 39,2 / hinten 37,5, geteilt am Innenbein-Treffpunkt, der 0,7 cm hinter der Mitte liegt).

**Schritt:** 76,5 über dem tiefsten Saumpunkt. Innenbeinnaht 76,0 / 78,2 (Mittel 77,1).

**Tiefe/Breite je Höhe:** Bund 0,69–0,71, Hüfte 0,61–0,66, Schritt 0,58. Darunter je Bein: Oberschenkel 1,1, Knie 1,2–1,3, Wade 1,25–1,3, Saum 1,6–1,7. Die Beine sind also tiefer als breit.

Die Neigung der Beine (4,5° nach außen, Unterschenkel ~9° nach hinten) verfälscht die waagerechten Schnitte um höchstens ~1 %. Volles Profil alle 0,5 cm: /home/user/Brand-Scan/docs/modelle/hosen_querschnitte.csv (Tabelle, alle 2 cm) und …/hosen_querschnitte.png.

**haltung:** Getragene, aufrecht stehende Form. Das ist keine Flachlage und keine T- oder A-Pose eines Riggs: Die Hose ist um einen unsichtbaren Körper geformt, Gesäß und Schritt haben Volumen.
- Die Beine sind gerade und das Knie ist gestreckt, aber leicht gespreizt: Jede Beinachse steht ~4,5° nach außen, die Beinmitten liegen am Schritt bei ±11,5 cm, an den Säumen bei ±17,3 cm (34 cm Abstand roh).
- In der Seitenansicht stehen die Oberschenkel senkrecht (Achse y ≈ −1,4 cm von Schritt bis Knie). Ab dem Knie laufen die Unterschenkel um ~9° nach hinten (Saummitte 6–9 cm hinter der Oberschenkelachse).
- Der Saum fällt hinten tiefer als vorne (0 gegen 3,1–3,4 cm) und ist vorn-hinten lang gezogen (T/B 1,6–1,7). Das ist typisch für Stoff, der über einem Schuh oder auf der Ferse liegt.
- Der Ursprung liegt am Boden: Saum 7,7–11 cm darüber, Bundoberkante 113,7–116,3 cm roh. Der Träger war vermutlich etwa 185–190 cm groß, das ist eine Schätzung.

**falten:** **Geometrie:** keine Falten. Das Netz ist glatt und grob (Kanten ~3 cm, 1180 Vertices) und trägt nur die Großform: Gesäß, Schrittbogen, leichte Kniewölbung, Saumaufweitung und die aufgesetzten Taschen.

**Normal-Map:** Alle Falten stecken hier, als UV-spezifischer Bake vom High-Poly. Die Grüne-Kanal-Konvention ist OpenGL/Y+, geprüft an einem erhabenen Knopf. Wo die Falten liegen:
- Unterschenkel und Saumzone, untere 10–15 cm: unregelmäßige Stauch- und Knickfalten, je 2–6 cm breit.
- Knie vorne: diagonale Zugfalten um die Knieschoner.
- Kniekehle hinten: waagerechte Stauchfalten an den X-Riegeln.
- Schritt und Hosenschlitz: radiale Zugfalten zur Oberschenkel-Innenseite.
- Unter dem Gürtel: leichte Raffung. Dazu weiche Diagonalfalten an Schienbein und Gesäß.

Stärke, gemessen als Neigung der Map-Normale innerhalb der Inseln:
- Großfalten (Glättung ~2,3 cm): Median 5°, p90 11°, p99 22°.
- Bei ~0,8 cm Glättung: p90 21°, p99 32°. Das ist flach bis mittel.

Feindetail:
- Steppnähte (Doppelnaht, 2–3 mm), Taschenkanten, Knöpfe, Gürtelschlaufen, Rippen der Knieschoner, X-Riegel.
- Ein Webmuster mit ~1,5 px Periode (≈ 1,4 mm), also fast an der Pixelgrenze. Es erscheint teils als waagerechte Streifen und ist pixelweise stark (Median-Neigung 26°, Rest unter 0,2 cm mit RMS 0,35). Aus der Nähe wirkt das rauschig oder aliasartig.

Bilder: /home/user/Brand-Scan/docs/modelle/hosen_falten.png sowie *_normalmap.png und *_geometrie.png im Vergleich.

**texturen:** Alle Texturen 2048×2048, alle an dieses eine UV gebunden.
- **Albedo** (JPEG sRGB): olivgrüner Baumwoll-Twill (Cargo/Tactical, kein Denim), braune gerippte Leder-Knieschoner, dunkle Fersen- oder Wadenflicken hinten, schwarzer Gürtel, eingebackene Schmutzflecken, gestreckte Füllstreifen außerhalb der Inseln.
- **AO** (JPEG grau, Mittel 238/255): deutliche Verdunkelung in Schritt, Kniekehle und Taschen. Im GLB als occlusionTexture.
- **Roughness** (JPEG grau, 32–241, Mittel ≈ 0,84): Stoff matt, Knieschoner und Gürtel glatter.
- **Metallic** (JPEG): fast schwarz (Mittel 1,2/255), nur Knöpfe, Schnalle und Nahtringe der Knieschoner weiß.
- **Normal** (PNG 8 bit RGB, 7,3 MB, Tangentenraum OpenGL).

Als allgemeine Denim-Struktur ist die Normal-Map nicht nutzbar. Sie ist nicht kachelbar, sondern ein Bake nur für dieses UV: Falten, Nähte, Taschen und Knieschoner sitzen fest. Der Stoff ist Cargo-Twill statt Denim-Köper, das Webmuster liegt bei ~1,4 mm am Auflösungslimit und flimmert. Man könnte höchstens ein faltenfreies Stück von ca. 12 × 12 cm herausschneiden, hochpassfiltern und kachelbar machen. Das ergibt nur eine grobe, unruhige Mikrostruktur; eine eigene Denim-Normal-Map wäre besser.

**renders:** Alle Renders in Cycles CPU, 24 Samples, Denoise, 600×800, orthografisch, grauer Hintergrund, Maßstab 105 cm. Alle Dateien liegen in /home/user/Brand-Scan/docs/modelle/.
- **Mit Texturen:** hosen_vorne.png, hosen_seitlich.png (von +x, linke Körperseite), hosen_hinten.png, hosen_seitlich_links.png, hosen_schraeg.png (perspektivisch), hosen_unten.png (Untersicht mit Saumringen).
- **Nur Geometrie:** hosen_vorne_geometrie.png, hosen_seitlich_geometrie.png, hosen_hinten_geometrie.png.
- **Grau mit Normal-Map:** hosen_vorne_normalmap.png, hosen_seitlich_normalmap.png, hosen_hinten_normalmap.png.
- **Drahtgitter:** hosen_vorne_netz.png, hosen_seitlich_netz.png.
- **Falten-Nahaufnahmen und Normal-Map-Ausschnitte:** hosen_falten.png.
- **UV-Layout:** hosen_uv.png.
- **Querschnitte:** hosen_querschnitte.png (Grafik) und hosen_querschnitte.csv (Tabelle).

Die Skripte liegen in /tmp/modelle-skripte/hosen/: common.py, inspect.py, uv.py, measure.py → mass.json, normals.py, topo.py, render.py, export_glb.py, glbcheck.py, chart.py, uvplot.py.

**eignung_basis:** Nur bedingt geeignet. Als Proportions- und Querschnitts-Referenz ist das Modell gut; direkt als Basis-Mesh nur nach viel Umbau, und vorher muss die Lizenz geklärt sein.

**Dafür spricht:**
- Echte getragene 3D-Form: Gesäß, Schrittbogen, Beinquerschnitte, Saum über dem Schuh.
- Sauber und leicht: einwandig, keine nicht-mannigfaltigen Kanten, Normalen einheitlich, 1180 Vertices (fürs Handy gut).
- Vorder- und Rückteil sind schon als eigene UV-Inseln getrennt, geschnitten an Seiten- und Innennaht. Das passt zum Ablauf mit Händlerfoto vorne und hinten.

**Dagegen spricht:**
1. Lizenz unbekannt.
2. Es ist eine Cargohose: 8 aufgesetzte Taschenschalen (leicht zu löschen, eigene Teile), und Albedo und Normal-Map enthalten Knieschoner, Riegel und Taschen. Die Texturen sind für uns wertlos, nur die Geometrie zählt.
3. Die UV-Inseln sind aufgeklappte Schnittmuster in X-Form, keine Front- und Rückprojektion. Für Händlerfotos braucht es neue Planar-UVs (vorne/hinten) oder ein 2D-Warping jedes Fotos auf die Insel.
4. Die Topologie ist unregelmäßig trianguliert statt Ringe je Höhe. Unsere Maßanpassung (Querschnitte Bund→Saum) lässt sich darauf nur über eine Verformung je Vertex abbilden (Höhe, Winkel um die Beinachse, radial skalieren). Das ist machbar, aber ungleichmäßig; besser wäre Remesh in Ringe oder einmal Unterteilen.
5. Bei ~3 cm Kantenlänge hat das Knie nur 4–5 Kantenreihen. Gebeugt wird es eckig, ohne Subdivision (ca. 4,7k Vertices) geht es nicht.
6. Kein Skelett und keine Gewichte. Die Ruhepose ist leicht gespreizt (±4,5°) mit Unterschenkeln 9° nach hinten. Gewichte müssten wir selbst berechnen (Abstand zur Knochenkette Hüfte–Knie–Knöchel) und die Pose vorher geradeziehen.
7. Bund- und Saumränder sind waagerechte Deckelringe. Die Saumöffnung ist auf 28–32 cm Umfang verengt, für Fuß und Bewegung müsste man sie wegschneiden. Eine Innenseite und Wandstärke (wie unser Bundbeleg und Saumumschlag) fehlen.
8. Die Größe ist fest (Bund 95, Hüfte 113, nach Skalierung 105 cm Außenlänge). Anpassen heißt ungleichmäßig skalieren je Höhe, mit sichtbarer Verzerrung an den Taschenstellen.

**Fazit:** Die Zahlen in unseren Generator übernehmen statt das Netz: Querschnittsformen, Tiefe/Breite und Saumform.

**uebernehmen:** ["Tiefe/Breite der Beine: Bei dieser Hose sind die Beine tiefer als breit: Oberschenkel 1,07–1,14, Knie 1,18–1,27, Wade 1,24–1,29. Unser Generator nimmt 0,8 (Ellipse flacher als breit). Das deckt sich mit camo-pants (1,13 / 1,26) und blue-jeans (1,05–1,34). Die Beine auf etwa 1,1–1,25 umstellen, das hilft auch gegen die zu schmale Seitenansicht (A5).", "Becken: T/B 0,58–0,66 zwischen Schritt und Hüfte, Bund 0,69–0,71. Unser Becken-Wert 0,62 passt. Zum Bund hin auf etwa 0,7 steigen lassen.", "Saumquerschnitt über dem Schuh: vorn-hinten lang gezogen (B 10, T 16–17, T/B 1,6–1,7). Hinten fällt der Saum 3 cm tiefer als vorne, die Saummitte liegt 6–9 cm hinter der Oberschenkelachse. Das ist ein Vorbild für unseren Saum auf dem Fuß.", "Bundoberkante: vorne Mitte am tiefsten (103,7), hinten Mitte 1 cm höher, an den Seiten bis 2,6 cm höher (106,3). Leibhöhe senkrecht vorne 27,2 / hinten 28,2 / Seite 29,8 cm.", "Schrittkurve in der Mittelebene: flacher Boden über ~16 cm (von y −9 bis +5 cm, Höhenunterschied nur ~1,7 cm), Innenbein-Treffpunkt 0,7 cm hinter der Mitte. Schrittnaht insgesamt 76,8 cm (vorne 39,2 / hinten 37,5). Vorlage für unseren Schrittbogen.", "Hüfte max liegt nur 3,4 cm über dem Schritt (U 113, Maßband 112,6), Schritt+8 ist mit 110,9 kaum kleiner. Der Umfang verläuft vom Schritt bis knapp unter den Bund fast linear zum Bund (95,9) hin.", "Umfangsverlauf je Bein: Oberschenkel 68–69, Knie 49–51, Wade 48–49, Saum 43–44 cm. Unterhalb des Knies ist die Hose fast zylindrisch; das Verhältnis taugt als Plausibilitätsprüfung für eine gerade Cargo- oder Chino-Form.", "Beinachse der Ruhepose als Referenz: Oberschenkel senkrecht, Unterschenkel ~9° nach hinten, Spreizung ±4,5°. Nur übernehmen, wenn unsere Ruhepose die getragene Schuhhaltung nachbilden soll; für das Skinning sind gerade Beine besser.", "Faltenmuster aus der Normal-Map als Vorlage, wo Falten hingehören: Kniekehle mit waagerechten Stauchfalten, Knie vorne diagonal, Saumzone mit unregelmäßigen 2–6 cm breiten Stauchfalten in den unteren 10–15 cm, radiale Zugfalten vom Schritt, Raffung unter dem Bund. Stärke: Großfalten bis ~20° Normalenneigung, im Median nur 5°. Die Map selbst nicht übernehmen (UV-gebunden, Cargo-Details, Webmuster flimmert).", "Technik: eine glatte, grobe Form plus Falten nur in der Normal-Map ist ein sinnvolles, leichtes Muster fürs Handy. Dazu ein Bund- und Saumrand als 2 cm breiter Ring, der Dicke vortäuscht; unser Bundbeleg und Saumumschlag macht das schon besser."]
