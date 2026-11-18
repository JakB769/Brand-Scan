Ich gebe dir Referenzmaterial für unsere virtuelle Hosen-Anprobe. Bitte NUR einrichten und ablegen, noch nichts im App-Code ändern und noch nicht mit dem Material arbeiten.

## 1. Blender installieren
- Prüfe, ob Homebrew installiert ist. Falls nicht, sag mir Bescheid, bevor du es installierst.
- Installiere Blender über Homebrew: `brew install --cask blender`
- Prüfe danach, dass Blender auch im Hintergrund von der Kommandozeile startet (`blender --background --version` oder über den Pfad in /Applications/Blender.app). Zeig mir die Versionsnummer.
- Prüfe auch, ob ffmpeg installiert ist (brauchen wir später für Einzelbilder aus den Videos). Falls nicht: `brew install ffmpeg`.

## 2. Referenzpaket ablegen
Das Paket besteht aus drei ZIP-Dateien:
- Teil 1 (Texte + Fotos): [PFAD ZU jeans-referenz_teil1_texte-posen.zip]
- Teil 2 (Fotos): [PFAD ZU jeans-referenz_teil2_nahaufnahmen.zip]
- Teil 3 (Videos): [PFAD ZU jeans-referenz_teil3_videos.zip]
- Entpacke alle drei nach `assets/referenz/` im Projekt. Die Ordner fügen sich dabei zusammen. Prüfe danach, dass 8 Fotos in fotos/falten-nahaufnahmen, 4 in fotos/posen und 14 Clips in videos/clips liegen. Die Ordnerstruktur (fotos/posen, fotos/falten-nahaufnahmen, videos/clips) bleibt genau so.
- Zusätzlich gebe ich dir die beiden Original-Videos IMG_7315.MOV und IMG_7316.MOV (1080p): [PFADE]. Lege sie unter `assets/referenz/videos/original/` ab. Die Clips in der ZIP sind verkleinerte Ausschnitte daraus; die Zeitstempel stehen in der README.
- In Teil 1 ist eine README.md mit einer Beschreibung jeder Datei. Lies sie, damit du später weißt, was wo ist.

## 3. Zusätzliche Dateien, die ich dir gebe
Ich ziehe dir gleich noch diese Dateien ins Fenster bzw. nenne dir die Pfade:
- Fotos der flach liegenden Hose von vorne und hinten, mit Kreditkarte als Maßstab
  -> `assets/referenz/fotos/flach-vorne-hinten/` (Namen: `vorne.jpg`, `hinten.jpg`; HEIC bitte nach JPG umwandeln, Original zusätzlich behalten)
- Denim-Textur (Normal-Map und weitere Maps)
  -> `assets/stoff-texturen/denim/` (Dateinamen behalten)
- Maße: Lege `assets/masse.md` an mit diesen Feldern zum Ausfüllen:
  Hose: Bundweite, Hüftweite, Oberschenkelweite, Knieweite, Saumweite, Schrittlänge innen, Gesamtlänge außen, Leibhöhe vorne/hinten.
  Körper (Jakob): Größe 1,79 m, Taille, Hüfte, Oberschenkel, Schrittlänge.
  Kreditkarte als Maßstab: 85,60 × 53,98 mm (ISO/IEC 7810 ID-1).
  Trag die Werte, die ich dir nenne, dort ein; Rest leer lassen.

## Wichtig
- Kopieren, nicht verschieben. Originale bleiben, wo sie sind.
- Nichts analysieren, nichts in den Code einbauen, keine Modelle verändern.
- Falls auf einem Kreditkartenfoto Kartennummer oder Name lesbar sind: sag es mir, bevor du das Foto ablegst.
- Falls Videos/Fotos sehr groß sind und das Projekt in Git liegt: richte Git LFS für `assets/` ein oder trag den Ordner in `.gitignore` ein. Frag mich, was mir lieber ist.

Zeig mir am Ende die fertige Ordnerstruktur unter `assets/` und die Blender-Version.
