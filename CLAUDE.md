# Regeln

Projektstand, Architektur und Vorgaben: `HANDOFF.md`. Antworten auf Deutsch.

1. Token sparen hat höchste Priorität bei gleicher Qualität. Kurze Antworten, keine Zusammenfassungen dessen, was man im Code sieht.
2. Nur nötige Dateien und Ausschnitte lesen (erst grep/Suche, dann gezielt lesen). Keine großen Logs oder Dateien komplett ausgeben.
3. Screenshots/Renders nur, wenn sie für eine Entscheidung nötig sind, nicht routinemäßig.
4. Funktioniert etwas nach einem Test nicht: nicht endlos wiederholen. Maximal 2 Lösungsversuche, dann kurz melden, was nicht geht und warum.
5. Keine langen PROGRESS-Dateien. Nur `HANDOFF.md` aktuell halten.
6. Hosen (Form, Optik): vorher `werkzeuge/qualitaet.json` lesen (Regeln, guter Stand, Urteile des Nutzers). Jede Änderung mit `werkzeuge/hose-render.mjs bauen` prüfen (Umrissvergleich Foto/3D, `<name>_umriss.png`); wird ein Wert schlechter als der gute Stand, nicht abgeben. Urteile des Nutzers sofort speichern (`--gut`/`--schlecht` bzw. `urteil`).
