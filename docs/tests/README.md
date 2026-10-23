# Kern-Tests 22.10.2026

Je Test die Bilder in diesem Ordner. Wiederholen: Befehle unten (Testseite vorher mit `node werkzeuge/tests/baue-testseite.mjs`,
für Test 3 und 4 mit `--echt` bauen).

## 1. Testjeans → Jeans-Vorlage (`1_jeans/`)
`NEUEHOSE_BILDER=docs/tests/1_jeans/ node werkzeuge/tests/tneuehose.mjs`
- Fotos `assets/referenz/fotos/flach-vorne-hinten/` (Bankkarte im Bild), Vorder- und Rückseite erkannt, Rückseite aus dem Rückseitenfoto.
- **Länge 106,4 cm** (Maßband 105, also +1,4 cm), **Bund flach 41,3 cm** (W32 ≈ 41,5). Vorher 107,7 cm: Die Hose liegt 1–2 cm höher als
  die Karte und wirkt darum größer; korrigiert über Kameraabstand aus der Brennweite (`PASSFORM.stoffHoehe` 1,2 cm).
- Bein gebeugt (`bein-gebeugt.png`): Knie hoch verformt die Hose am Knie, Stoff schwingt nach und kommt zur Ruhe.

## 2. Oberteil + kurze Hose / Rock (`2a_*`, `2b_*`)
`node werkzeuge/tests/toutfit.mjs`
- T-Shirt (vorne/hinten) im Bereich „Oberteil hochladen“ → als T-Shirt erkannt; Shorts im Bereich „Hose oder Rock“ → als Shorts
  erkannt, Saum 57 cm über dem Boden (erlaubt 43–75: zwischen unter dem Knie und Oberschenkel).
- Trägertop → als Top erkannt; Rock → als Rock erkannt, Saum 20 cm über dem Boden (nie bis zum Boden, mindestens 16 cm).
- Art von Hand umschaltbar (Shorts ↔ Hose ändert den Saumbereich), Shirt liegt über dem Bund.
- Testbilder künstlich (`werkzeuge/python/testoberteile.py`, `testshorts.py`, `testrock.py`), keine echten Fotos.
- Mehr zu Oberteilen (Langarm, Rückseite per Textursynthese, Maßtabelle S–XL, live): `node werkzeuge/tests/tvorlage.mjs`.

## 3. Avatar aus dem Referenzclip v2-02 (`3_avatar_vs_standard.png`, `avatar_3_v2*`)
`node werkzeuge/avatar-scan.mjs --aus docs/tests --name 3_v2` und `node werkzeuge/avatar-vergleich.mjs docs/tests/avatar_3_v2.json docs/tests/3_avatar_vs_standard.png`
- Jakob, 179 cm, weite Kleidung. Avatar gegen Standardkörper derselben Größe: Schultern −2,7, Brust −7,1, Taille −4,5, Hüfte −5,4,
  Oberschenkel −3,0 cm, Rumpf +1,7 cm, Oberarm −2,9 cm; Hüftgelenk gleich hoch. Vorher kam hier genau der Standardkörper heraus.
- Größenempfehlung am Avatar: W31 (vorher am Standardkörper W32).
- Grenzen: in weiter Kleidung sind die Umfänge nicht gemessen, nur nach oben begrenzt; die Form kommt aus Schultern, Längen und
  Armen (Eichung an gerenderten Körpern, nicht an echten Personen). Gegen Maßband nicht geprüft.

## 4. Handy-Emulation (`iphone-13_cpu4*`)
`node werkzeuge/handy.mjs --geraet "iPhone 13" --cpu 4 --sek 10 --oberteil --aus docs/tests`
- Chromium als iPhone 13, CPU 4-fach gedrosselt, Hose + T-Shirt, echte Erkennung auf dem Clip v1-02.
- Zusätzlich für das Oberteil je Bild (nur JavaScript): Haltung Oberteil 1,7 ms, Körper 2,0 ms, Oberteil über der Hose 1,7 ms;
  Vorlage bauen einmal 212 ms. Die Hose selbst (Form + Stoff) 31 ms im Median. Damit reicht der JavaScript-Teil bei 4-fach gedrosselter
  CPU für etwa 25 Bilder/s.
- **Nicht flüssig messbar hier:** Grafik läuft in dieser Umgebung in Software (SwiftShader, 265 ms je Bild der 3D-Ansicht), die Erkennung
  auf der gedrosselten CPU (0,8 Bilder/s, alter Stand gleich: 0,9). Auf einem echten iPhone rechnet beides die Grafikkarte; geprüft ist
  das nicht. Der Frontal-Scan wird in der Emulation nicht fertig, auf dem alten Stand ebenso.
