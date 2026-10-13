# PROGRESS – 3D-Hosenmodell verbessern (Branch `3d-modell-verbesserung`)

Lies diese Datei zuerst, wenn die Sitzung neu startet. Kurz halten. Neueste Einträge unten im Log.

## Ziel
Hose deutlich besser: Form, Volumen, Saum, Falten, Dehnung, Bewegung. Referenz: Jakob (1,79 m) in der hellblauen Wide-Leg-Jeans
(`assets/referenz/`), Testhose = dieselbe Jeans flach mit Bankkarte (`assets/referenz/fotos/flach-vorne-hinten/`).
Fertig: alle Posen ≥ 4/5, Rückseite = Rückseiten-Foto, kein Lag, Spagat geht, flüssig in Handy-Emulation, nichts kaputt.

## Plan
0. Setup: Branch, Referenz, Blender, ffmpeg, PROGRESS.md  ✔
1. Vergleichswerkzeug: echte Seite + echte MediaPipe, Kamera = Referenzbild/-video, Hose aus vorne/hinten → `docs/vergleich/<zeit>/`
2. Vorher-Bilder `docs/vorher/` (3D-Ansicht vorne/seite/hinten, Referenzposen)
3. Referenzanalyse (Falten, Saum, Volumen je Pose) → `docs/referenz-analyse/`
4. 3D-Modelle: Blender → .glb, Maße/Topologie/UV/Normal-Maps, Eignung als Basis → `assets/pants/<name>/glb/`, `docs/modelle/`
5. Schleifen: verbessern → rendern → vergleichen → Bewertung (unten) → schlechteste Pose
6. Tracking-Sync, Ausblenden bei unsicherem Tracking (Liegestütz)
7. Handy-Emulation (iPhone, Pixel, CPU-Drosselung, Fake-Video aus Clips)
8. Zweite Hose (Allgemeinheit)
9. Abschluss: `docs/nachher/`, Tests, Doku

## Umgebung
- Blender 5.0.1 als Python-Modul: `/opt/bpyenv/bin/python` (uv-venv, Python 3.11, `pip install bpy`). Headless.
- ffmpeg vorhanden (`/usr/bin/ffmpeg`). 4 CPUs, 15 GB RAM, kein GPU (Chromium mit swiftshader).
- Einzelbilder der Clips (4 fps) im Scratchpad, nicht im Repo (aus den Clips jederzeit neu erzeugbar).

## Entscheidungen
- Referenz liegt unter `assets/referenz/` (vorher `assets/jeans-referenz/`, umbenannt; die Original-ZIPs bleiben unangetastet).
- Flachlage-Fotos: `vorne.jpg`/`hinten.jpg` = Kopien von `material/testbilder/echt/karte_*` (Karteninneres unkenntlich, Neigungsdaten drin).
  Die HEIC-Originale zeigen die Kartennummer lesbar und kommen NICHT ins Repo.
- `Jeans_Denim_Pants.zip` (JEANS.obj) wurde nicht hochgeladen, fehlt. Weiter mit blue-jeans, camo-pants, hosen.

## Lizenzen der 3D-Modelle
(siehe `assets/pants/LIZENZEN.md`, vom Nutzer auszufüllen; in den ZIPs: siehe Abschnitt 4)

## Bewertung je Pose (1–5)
| Pose | Silhouette | Seitenvolumen | Saum | Falten | Dehnung | Rückseite | Stand |
|---|---|---|---|---|---|---|---|

## Log
- Setup: Branch `3d-modell-verbesserung`, Referenz nach `assets/referenz/`, Flachlage nach `fotos/flach-vorne-hinten/`, bpy 5.0.1, ffmpeg.
