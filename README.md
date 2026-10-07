# Brand-Scan · Passform

Live-Anprobe für Hosen per Handy- oder Laptop-Kamera, geplant als Shopify-App.

- **Aktueller Stand:** `app/index.html` (eine Datei, kein Build). Kamera braucht https, z. B. über app.netlify.com/drop.
- **Einstieg und Übergabe:** `CLAUDE.md`
- **Geschäftsplan:** `doku/pitch-plan.md`

## Tests

```sh
npm install
npm test
```

Läuft gegen `werkzeuge/tests/testseite-mit-simulierter-person.html` (Attrappe statt MediaPipe).
Screenshots landen in `werkzeuge/tests/ausgabe/`.

Hinweis: Die Bershka-Fotos unter `material/` sind nur interne Testdaten.
