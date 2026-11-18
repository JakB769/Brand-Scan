# Referenz-Mensch „Joe“ und Körpermodell des Avatars

## Joe (dieser Ordner)
Vom Nutzer am 16.10. geliefert (`Joe_Realistic_3D_Modell_klein.zip`): Cinema-4D-Szene `source/Joe.c4d`, USD `source/Joe.usdc`
(Maxon Cinema 4D 2024.2, Y oben, Einheit cm, 1,67 m groß) und Texturen. **Keine Lizenzangabe im Paket**, Herkunft unbekannt.
Deshalb nur **visuelle Vorlage** (Proportionen, Gesamteindruck, Vergleichsbilder in `docs/vergleich/`), nicht ausgeliefert, nicht
in der App. Wird die Lizenz nachgereicht und erlaubt sie kommerzielle Nutzung, ändert das nichts am Ansatz: Joe ist eine
bekleidete Figur aus getrennten Teilen (Shorts, T-Shirt, Schuhe, Beine, Arme, Gesicht), kein geschlossener Körper; unter den
Shorts gibt es keine Oberschenkel. Als anpassbares Basis-Mesh für die Hose taugt sie darum nicht.

## Körpermodell des Avatars (`app/avatar/koerper.js`)
MakeHuman hm08: Basis-Mesh, Targets (`macrodetails`, `measure`, `buttocks`) und Skelett-Gewichte (`rigs/default_weights.mhw`)
aus https://github.com/makehumancommunity/makehuman (Ordner `makehuman/data`). Diese Daten sind laut `LICENSE.md` des Projekts
(Abschnitt C) und den Kopfzeilen jeder Datei unter **CC0 1.0** freigegeben („anyone can do whatever they want with it“),
also auch kommerziell nutzbar, ohne Namensnennung. Übernommen wurden nur Daten, kein MakeHuman-Programmcode (der steht unter
AGPL). Aufbereitet mit `werkzeuge/python/koerper_bauen.py`.
