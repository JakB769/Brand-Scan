# Fertige 3D-Hosen als Basis? Empfehlung

**Kurz:** Keins der drei Modelle eignet sich als Basis-Mesh. Wir behalten den prozeduralen Generator und übernehmen nur Zahlen: das Verhältnis Tiefe zu Breite je Höhe (vor allem bei den Beinen), Gesäß, Leibhöhe und Umfangsverhältnisse. Die Feinstruktur (Denim-Köper, Nähte) erzeugen wir im Shader selbst und nehmen keine fremden Texturen. Bei allen drei Modellen ist die Lizenz unbekannt, deshalb dienen sie nur intern als Referenz.

Grundlage: die drei Modellanalysen, dazu `PASSFORM` und der Shader in `app/index.html` (`beinTiefe` 0,8, `G.ql` auf 0,6–1 begrenzt, Becken fest 0,62, Relief kommt aus dem Foto, eine Normal-Map gibt es nicht). Außerdem habe ich grob nachgemessen, an Bildern aus `assets/referenz/videos/clips/v2-02_drehung-360.mp4` (unsere Wide-Leg-Jeans, getragen). Im Generator ist noch nichts davon ausprobiert.

## 1. Basis-Mesh oder Generator?

| | blue-jeans | hosen | camo-pants |
|---|---|---|---|
| Schnitt | slim, etwa W31 | gerade, Cargo | weit, Stoffsimulation (Drape) aus CLO |
| Topologie | 443 Quads in Ringen (20 am Rumpf, 10 je Bein), sehr grob | 2110 Dreiecke, unregelmäßige Retopologie, 8 aufgesetzte Taschen | 5920 Dreiecke, 18 lose Teile, Nähte nicht verschweißt |
| UV | 4 Inseln (je Bein vorne und hinten), schräg im Atlas | 2 Inseln (vorne, hinten), X-förmig aufgeklappt | Schnittteile in Originalgröße, alle übereinander (nur zum Kacheln) |
| Haltung | gerade, A-Stand ±6° | ±4,5°, Unterschenkel 9° nach hinten | gerade, ±3,6° |
| Rig | keins | keins | keins |
| Saum flach (unsere Jeans: 24–28 cm) | 14,8 | 21–22 | 21 |
| Lizenz | unbekannt | unbekannt | unbekannt |

Warum der Generator die bessere Wahl bleibt:
- **Beliebige Händlerhosen:** Ein Basis-Mesh müsste für jede Hose Höhe für Höhe verformt werden. Genau das macht der Generator schon, und zwar direkt aus den Fotos. Ein fremdes Netz bringt dafür keine Information, nur eine feste Passform. Unsere Jeans ist unten viel weiter als alle drei: Das Verhältnis Saum zu Bund (flach) liegt bei 0,55–0,65, bei den Modellen bei 0,37–0,46.
- **UV:** Bei uns liegen die Fotos ohne Umweg auf der Hose. Bei allen drei Netzen müsste man jedes Foto erst über Passpunkte (Bundecken, Schritt, Saumecken) auf schräge Inseln verzerren. Bei camo bräuchte es sogar erst ein neues UV-Layout.
- **Skinning:** Keins der Modelle hat ein Rig. Die Gewichte müssten wir ohnehin selbst rechnen. Dazu müsste alles, was der Generator schon kann, auf das fremde Netz umgebaut werden: Mittelnaht beim Beinheben, Leistenfalte, Shirt über dem Bund, Stoff-Fall auf dem Schuh, Innenbund-Schnitt.
- **Auflösung:** 10 Punkte je Beinring (blue) bzw. 2–3 cm Kantenlänge (hosen, camo) reichen nicht für Kniebeugen. Man müsste unterteilen.
- **Falten:** Bei blue und hosen sind sie fest in die Normal-Map gebacken. Sie gelten nur für diese eine Pose und Passform und bewegen sich beim Skinning nicht mit.
- **Aufwand (Schätzung):** Der Weg über ein Basis-Mesh dauert mehrere Wochen, plus Lizenzklärung. Die Zahlen in den Generator zu übernehmen dauert samt Tests 1–2 Tage.

Für später: camo zeigt, dass ein Schnittmuster-Modell (UV = flaches Schnittteil in cm) die Verbindung zwischen Flachfoto und getragener Form herstellt. Wenn wir das wollen, dann mit einem eigenen Export aus CLO oder Marvelous Designer, nicht mit diesem Modell.

## 2. Proportionen übernehmen

### Tiefe/Breite (T/B) je Höhe

Der Umfang kommt weiter aus dem Foto. T/B legt nur fest, wie viel davon von vorne und wie viel von der Seite zu sehen ist.

| Höhe | blue | hosen | camo | Vorschlag | heute |
|---|---|---|---|---|---|
| Bund | 0,69 | 0,69 | 0,69–0,72 | **0,70** | 0,62 (Becken fest) |
| Gesäß, stärkste Tiefe | 0,71 | 0,72–0,73 | 0,57 | **0,71** (weite Hosen 0,6) | 0,62 |
| Schritt +1 cm | 0,56–0,58 | 0,58 | 0,56 | **0,57** | 0,62 |
| Oberschenkel (2,5 cm unter Schritt) | 1,03–1,06 | 1,07–1,14 | 1,13 | **1,10** | 0,8 |
| Mitte Oberschenkel | 1,08–1,19 | 1,10–1,13 | bis 1,40 | **1,15** | 0,8 |
| Knie | 1,22–1,41 | 1,18–1,27 | 1,27 | **1,25** | 0,8 |
| Wade | 1,25 | 1,24–1,29 | 0,86–0,92 | **1,20** | 0,8 |
| Saum auf dem Schuh | 1,36 | 1,6–1,7 | 1,4–1,5 | nicht vorgeben, Prüfziel 1,4–1,7 | Stoff-Fall |

**Der wichtigste Punkt:** Bei allen drei Hosen sind die Beine tiefer als breit (1,05–1,4). Unser Generator rechnet mit 0,8, und der Abgleich mit dem Model-Foto darf höchstens 1,0 ergeben.
- **Gegenprobe an unserer Jeans (grob):** In den Videobildern von vorne ist ein Bein am Knie etwa 100–120 px breit, von der Seite etwa 165–175 px tief. Das ergibt **T/B ≈ 1,4–1,6**. Weil man bei einer Ellipse, die nicht genau seitlich steht, eher weniger als die volle Tiefe sieht, unterschätzt eine schiefe Drehung den Wert eher. Zu hoch fallen kann er, wenn die Beine leicht versetzt stehen. Das ist eine Augenmessung an Einzelbildern, keine Messung mit Maßstab; die Bilder liegen in `/tmp/modelle-skripte/empfehlung/frames/`. Für eine weite Denim gilt also eher noch mehr Tiefe. Der Code-Kommentar „lose Hosen hängen flacher“ hält beiden Quellen nicht stand.
- **Umsetzung:** `beinTiefe` als Profil statt als feste Zahl (Schritt 1,10 → Knie 1,25 → Wade 1,20). `G.ql` skaliert dieses Profil, die Grenze wird auf 0,6–1,5 erweitert. Zusätzlich mitschreiben, wie oft der Abgleich heute an der Grenze 1 hängen bleibt.
- **Wirkung von vorne:** Die Breite von vorne ist die flache Breite mal einem Faktor. Bei T/B 0,8 ist der Faktor 0,705, bei 1,0 dann 0,637, bei 1,25 dann 0,564 und bei 1,5 dann 0,51. Unser Saum (flach 26 cm) sieht heute von vorne 18,3 cm breit aus, mit 1,25 nur noch 14,7 cm. Die Hose wird von vorne schmaler und von der Seite voller (Thema A5).

### Gesäß, Leibhöhe, Bund

- **Gesäß:** Die stärkste Tiefe liegt 16–17 cm unter der Bundoberkante (blue, hosen), also bei etwa 0,6 der Leibhöhe. Sie ist dort 1,12–1,14-mal so groß wie die Bundtiefe. Unsere Hose sitzt tiefer (auf den Hüftknochen, Bundlinie 8–9 cm über dem Hüftgelenk). `gesaessCm` = 10 ist deshalb rechnerisch plausibel und sollte bleiben. **Weite Hosen (camo) haben kaum eine Gesäßwölbung:** Die Tiefe liegt am ganzen Rumpf bei 23,4–25,3 cm, der Stoff hängt gerade herunter. Darum sollte die Wölbung mit zunehmender Weite schwächer werden.
- **Leibhöhe senkrecht (vorne/hinten):** blue 26,1/27,6 cm, hosen 27,2/28,2 cm, camo 31,6/33,7 cm. Hinten ist der Bund 1,0–2,1 cm höher. Bei hosen liegen die Seiten bis 2,6 cm über der vorderen Mitte. Leibhöhe geteilt durch Außenlänge ergibt 0,25–0,32, als Prüfband für die Fotomessung 0,24–0,33.
- **Schritthöhe:** 68–74 % der Außenlänge über dem Saum (71,5–77,3 cm bei 105 cm).
- **Schrittnaht gesamt:** etwa 1,2–1,4-mal die Summe aus Leibhöhe vorne und hinten (1,26 / 1,39 / 1,17). Damit lassen sich `einrollen` und `bogenSenkrecht` prüfen. Bei hosen ist der Schrittboden über rund 16 cm flach, der Innenbein-Treffpunkt liegt 0,7 cm hinter der Mitte.
- **Bundquerschnitt:** etwa 2 cm vor der Hüftmitte (blue).

### Umfangsverhältnisse (Plausibilität, zum Beispiel für die Realismus-Prüfung)

| | blue | hosen | camo | Band |
|---|---|---|---|---|
| Hüfte / Bund | 1,18 | 1,17 | 1,17 | 1,15–1,20 |
| Oberschenkel / Hüfte | 0,60 | 0,61 | 0,62 | 0,58–0,64 |
| Knie / Oberschenkel | 0,71 | 0,73 | 0,71 | 0,70–0,75 |
| Saum / Knie | 0,74 | 0,87 | 0,85 | gilt nicht für Wide-Leg |

- Für unsere Jeans (Bund flach 41–46 cm) ergibt das eine Hüfte von flach etwa 48–54 cm und einen Oberschenkel von flach etwa 29–33 cm. Knie und Saum dürfen bei Wide-Leg nicht nach der Slim-Regel geprüft werden.
- **Vorderhose zu Hinterhose ≈ 0,82–0,90** (aus dem Schnitt von camo: Saum 19,8/22,5, Knie 23,2/25,9, Hüfte 29,1/33,8, Bund 24,5/27,1 cm). Das hilft, die Rückseite zu schätzen, wenn kein Rückenfoto da ist.
- **Dehnung vom Schnitt zur getragenen Form** (camo): Bund 5–10 %, Gesäß 4–8 %, Beine etwa 1 %. Das sind Startwerte für die geplante Passform-Einfärbung.
- **Ruhepose nicht übernehmen.** Der A-Stand und die schrägen Unterschenkel kommen vom Avatar bzw. vom Schuh. Für das Skinning sind gerade Beine besser. Als Testziel für den Stoff-Fall taugt sie aber: Liegt der Saum auf dem Schuh, ist er vorne bis etwa 3 cm höher als hinten, und der Querschnitt dort hat T/B 1,4–1,7.

## 3. Normal-Maps

| Detail | Quelle | Übernehmen? | Wie | Handy |
|---|---|---|---|---|
| Denim-Köper | nur blue (Periode etwa 2,2 mm, 45°) | nur die Werte | im Shader erzeugen: schräge Rillen, 2,2 mm, 45°, schwach. Erst nach geklärter Lizenz als Alternative: Ausschnitt 256² (etwa 18 × 18 cm), Hochpass, per Versatz und Überblendung kachelbar | 0 KB bzw. 256²-PNG (50–200 KB), mit Mipmaps |
| Nähte | hosen (Doppelnaht 2–3 mm), camo (Wulst an der Seitennaht) | nur die Werte | im Shader entlang unserer bekannten Nahtlinien (Seitennaht, Innenbein, Bund, Saum): Wulst 4–6 mm breit, leicht erhaben; die Farbe kommt aus dem Foto | 0 KB |
| Falten | blue, hosen (Map), camo (Geometrie) | nur Lage und Stärke | als Zielwerte für Stoff-Fall und `fold`/`foldK`. Die Maps selbst nicht, sie hängen am UV, an der Pose und an der Passform | – |
| Taschen, Nieten, Knöpfe, Schlaufen | alle | nein | kommen aus dem Händlerfoto | – |
| Cargo-Gewebe (1,4 mm) | hosen | nein | flimmert, ist kein Denim | – |

- **Köper ist nur von Nahem sichtbar:** Bei ganzem Körper im Bild kommen auf dem Handy etwa 1 px pro mm, eine Periode sind also etwa 2 px. Das erzeugt nur Moiré. Mit einer Laptop-Kamera (720p) sind es etwa 0,4 px pro mm, dann ist das Muster unsichtbar. Darum mit dem Abstand ausblenden und nur in der Nahphase zeigen. Niedrige Priorität.
- **Zielwerte für Falten:**
  - Lage: quer bzw. diagonal vorne am Knie, waagerechte Stauch- und Wabenfalten in der Kniekehle, Zugfalten und Whiskers am Schritt, Stauchfalten in den untersten 10–15 cm (2–6 cm breit), lange Zugfalten an Ober- und Unterschenkel, leichte Raffung unter dem Bund.
  - Stärke: Wellenlänge ab 5 cm, Höhe etwa 1 cm Spitze-Spitze (Standardabweichung etwa 2 mm).
  - Abweichung von der glatten Form: Beinmitte RMS 2,3–3,3 mm (p95 4–6 mm), Schritt RMS 3,5–3,8 mm (p95 8 mm), Saum RMS 6–7 mm (höchstens 1,8 cm).
  - Neigung der Normalen: Median 5–9,5°, p90 11–20°, p99 22–36°. Am Knie 8–9 Wellen rundum, Abstand 5,5–6 cm.
  - Daraus wird ein Test, der diese Werte je Zone an unserer Hose in Ruhehaltung misst.
- **Falls doch eine Normal-Map je Hose gebacken wird:** 512² reicht (5 px/cm bei Falten ab 2 cm Wellenlänge), höchstens 1024², nie 2048². Zum Vergleich: Die Normal-Map von hosen hat 7,3 MB, die ganze Hose bei uns etwa 120 KB. Als PNG oder verlustfreies WebP speichern, nicht als JPEG, und Seitenlängen als Zweierpotenz für Mipmaps.

## 4. Lizenz

- Bei allen drei fehlen Lizenz, Readme und Autor. `assets/pants/LIZENZEN.md` ist leer. Die einzigen Spuren:
  - blue: „Serhii“, 3ds Max 2019, 02.11.2018, Ordneraufbau wie ein Sketchfab-Download (Vermutung).
  - camo: „Badboy17Aiden“, CLO und 3ds Max, Textur von 2017.
  - hosen: Objektname „shtany quadro_014 RETOPO“ (russisch für „Hose“), Assimp-Export von 2022.
- **Bis das geklärt ist, nur intern als Referenz nutzen.** Keine Netze, Texturen oder ausgeschnittenen Kacheln in `app/`, Netlify, Shopify oder an Kunden. Netlify veröffentlicht nur `app/`, die Modelle gehen also nicht mit raus.
- Quelldateien und Texturen sind aber im Git-Repo eingecheckt (`assets/pants/*/source`, `textures`, `blue-jeans.glb`). Ist das Repo öffentlich, werden sie schon weitergegeben. Darum das Repo privat halten oder die Dateien herausnehmen.
- Messwerte (Maße, Verhältnisse, Faltenstärken) sind keine Kopie des Modells. Nach gängiger Auffassung ist es unkritisch, sie in den Generator zu übernehmen (keine Rechtsberatung). Netz, UV, Texturen und daraus geschnittene Kacheln sind es nicht. Köper und Nähte im Shader zu erzeugen umgeht das Problem ganz.
- Herkunft suchen (Sketchfab, CGTrader, TurboSquid, nach Name und Vorschaubild) und das Ergebnis in `LIZENZEN.md` eintragen. Was die üblichen Lizenzen meist bedeuten (im Einzelfall prüfen):
  - CC BY: Namensnennung nötig.
  - CC BY-NC oder „Editorial“: nicht in einer bezahlten App.
  - Sketchfab „Standard“: Nutzung im Produkt in der Regel erlaubt, Weitergabe der Datei selbst nicht.
