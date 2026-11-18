# Netlify mit GitHub verbinden (einmalig, etwa 5 Minuten)

Wozu: „Link einfügen“ braucht einen kleinen Server-Teil, der die Shop-Seite holt (ein Browser darf fremde Seiten nicht
selbst lesen). **Netlify Drop (Ordner hineinziehen) kann das nicht.** Mit GitHub verbunden geht es, und es gibt zwei
Vorteile dazu: eine feste Adresse statt jedes Mal einer neuen, und jede Änderung im Repo ist nach etwa einer Minute online.

## Schritte

1. <https://app.netlify.com> öffnen und anmelden (z. B. „Sign up with GitHub“).
2. **Add new project** → **Import an existing project** → **GitHub**.
3. Netlify den Zugriff auf GitHub erlauben und das Repo **jakb769/brand-scan** auswählen.
4. Bei **Branch to deploy**: `claude/new-session-fbr0jp` (dort liegt der aktuelle Stand, gleich `3d-modell-verbesserung`; später `main`).
5. Alles andere so lassen. Die Einstellungen stehen schon in `netlify.toml` (Seite aus `app/`, Server-Teil aus
   `netlify/functions/`, kein Build-Schritt).
6. **Deploy** drücken. Nach 1–2 Minuten steht oben die Adresse, z. B. `https://irgendwas-123.netlify.app`.
   Unter **Site configuration → Change site name** lässt sich ein fester Name wählen (z. B. `passform-test`).
7. Die Adresse auf Handy und Laptop öffnen. Kamera geht (https), „🔗 Link zur Hose im Shop einfügen“ auch.

## Prüfen

- `https://<deine-adresse>/api/holen?url=https://example.com` im Browser öffnen: Es kommt Text mit `"ok":true` oder
  einer Meldung. Kommt „Page not found“, ist der Server-Teil nicht da (meist: doch per Drop hochgeladen).
- `hosen.json` (gemeinsame Hosen für alle Geräte) gehört jetzt in den Ordner `app/` im Repo.
- `https://<deine-adresse>/api/hosen` öffnen: Es kommt `{"app":"passform",…,"hosen":[…]}`. Das ist die **Sammlung**: Jede
  Hose, die auf irgendeinem Gerät angelegt wird, landet dort (Netlify Blobs, nichts einzurichten) und ist danach auf jedem
  Gerät, in jeder neuen Fassung und unter jedem Vorschau- oder Branch-Link derselben Website da. ✕ löscht sie überall.

## Team-Code (empfohlen, sobald der Link herumgeht)

Ohne Code kann jeder, der die Adresse kennt, Hosen anlegen und löschen. Mit Code:
Netlify → **Site configuration → Environment variables → Add a variable**, Name `PASSFORM_TEAMCODE`, Wert ein selbst
gewähltes Wort, dann neu deployen. In der Seite unter **Feineinstellungen → Team-Code** dasselbe Wort eintragen (einmal je
Gerät). Ohne Code werden neue Hosen nur im Gerät gespeichert, und die Seite sagt das.

## Was der Server-Teil darf

Nur Seiten und Bilder über http(s) holen, keine Adressen im eigenen Netz, höchstens 6 MB je Seite und 5,5 MB je Bild,
15 Sekunden Zeit. Beim Holen speichert er nichts; gespeichert werden nur die Hosen der Sammlung (`/api/hosen`, höchstens 400 Hosen à 2 MB). Shops mit Schutz gegen automatische Abrufe werden nicht umgangen; dann sagt die
Seite das, und Screenshots hineinziehen geht weiter. Für Tests reicht der kostenlose Netlify-Plan.
