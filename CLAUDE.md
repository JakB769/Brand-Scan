# Arbeitsregeln

Wissen: `PROJECT.md` (Ziel, Vorgaben, Stand, Entscheidungen), `ARCHITECTURE.md` (Dateien, Dienste, Starten, Tests, Deploy),
`PROMPTING.md` (wie wir arbeiten). Antworten auf Deutsch.

1. Token sparen bei bester Qualität: erst suchen (grep), dann gezielt Ausschnitte lesen. Keine großen Dateien oder Logs ausgeben. Kurze Antworten, keine Zusammenfassungen. Screenshots und Renders nur, wenn sie für eine Entscheidung nötig sind.
2. Höchstens 2 Lösungsversuche je Problem, dann kurz melden, was nicht geht und warum.
3. Nie nachfragen: vernünftig entscheiden und die Entscheidung in `PROJECT.md` unter „Entscheidungen“ notieren.
4. Vor „fertig“ die Kernfunktion einmal Ende zu Ende testen (Tests: `ARCHITECTURE.md`). Code allein reicht nicht.
5. Nach jedem funktionierenden Schritt committen und pushen. Vor großem Aufräumen eine Sicherung setzen: Tag `backup-<datum>`; aus Cloud-Sitzungen sind Tags gesperrt (HTTP 403), dann Branch `backup-<datum>`.
6. GitHub-Probleme: sofort abbrechen und die genaue Fehlermeldung melden.
7. Hosen (Form, Optik): vorher `werkzeuge/qualitaet.json` lesen (Regeln, guter Stand, Urteile des Nutzers). Jede Änderung mit `node werkzeuge/hose-render.mjs bauen …` prüfen (Umrissvergleich Foto/3D, `<name>_umriss.png`). Ist ein Wert schlechter als der gute Stand, nicht abgeben. Urteile des Nutzers sofort speichern (`--gut`/`--schlecht` bzw. `urteil`).
8. Stand und offene Punkte nur in `PROJECT.md` pflegen, ohne Verlauf. Keine PROGRESS-, HANDOFF- oder Verlaufsdateien.
9. Antwortstil: Deutsch, knapp, am Ende höchstens 5–10 Zeilen (was geht, was nicht, offene Punkte), ohne Code-Wissen verständlich.
10. Der Nutzer will, dass schnell, richtig und gut gearbeitet wird („sonst werde ich gefeuert“).
