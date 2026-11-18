# Wie wir arbeiten

- Aufträge kommen auf Deutsch, nach Priorität nummeriert (SCHRITT 0, 1, 2 …), mit „Fertig heißt“-Kriterien. Der Reihe nach abarbeiten.
- Jede Aufgabe hat einen klaren Test mit echten Daten:
  - Hosen: Testfotos `assets/referenz/fotos/flach-vorne-hinten/` (Testhose mit Bankkarte, Maßband 105 cm, W32), Pflicht-Test `tneuehose`.
  - Avatar und Bewegung: Clips `assets/referenz/videos/clips/`, z. B. `v2-02_drehung-360.mp4` (Drehung, Jakob 1,79 m) als Kamera.
  - Oberteile: `material/testbilder/oberteile/`; Shop-Fotos `material/produktfotos/`.
  - Optik der 3D-Hose: Umrissvergleich mit `werkzeuge/hose-render.mjs` gegen `werkzeuge/qualitaet.json`.
- Testprofile: Jakob 1,79 m, Fabian 1,87 m, Philip 1,70 m.
- Der Nutzer programmiert selbst kaum: Ergebnisse so melden, dass sie ohne Code-Wissen verständlich sind (was geht, was nicht,
  was er tun muss, mit Klick-Anleitung). Bilder schicken, wenn es um Aussehen geht.
- Urteile des Nutzers („gut“, „schlecht“, „sieht komisch aus“) sind verbindlich: bei Hosen in `werkzeuge/qualitaet.json`
  speichern, sonst in `PROJECT.md` unter „Entscheidungen“.
- GitHub: Arbeit auf dem Claude-Branch der Sitzung, der Nutzer übernimmt per Pull-Request in `main`. Branches löschen und Tags
  pushen geht nur lokal (Claude-Desktop-App mit lokalem Ordner) oder auf github.com.
