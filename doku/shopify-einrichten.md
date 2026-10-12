# Shopify-App einrichten (Gerüst, Stand 12.10.2026)

## Was es gibt

Im Ordner `shopify/` liegt das Gerüst für die Shopify-App „Passform“:

| Datei | Wozu |
|---|---|
| `shopify/shopify.app.toml` | Einstellungen der App: Adresse, App-Proxy `/apps/passform`, Pflicht-Webhooks. Platzhalter `<…>` ersetzen. |
| `shopify/shopify.web.toml`, `shopify/package.json` | Sagt der Shopify CLI, wie der Server startet (`shopify app dev`). |
| `shopify/extensions/passform-anprobe/` | **App-Block** für die Produktseite: Knopf „▶ Live anprobieren“ (Text, Hinweis und Farbe im Theme-Editor einstellbar). Nur Liquid und CSS, kein JavaScript. |
| `shopify/server/start.mjs` | **Server** (Node 18+, ohne Zusatzpakete): Anprobe-Seite und Hosen über den App-Proxy, Pflicht-Webhooks. |
| `shopify/server/signatur.mjs` | Prüft, dass Anfragen wirklich von Shopify kommen (Signatur des App-Proxys, Signatur der Webhooks). |
| `shopify/server/hose-ablegen.mjs` | Ordnet eine Hose einem Produkt zu (bis es dafür eine Seite im Shopify-Admin gibt). |
| `shopify/server/*.test.mjs` | Tests (laufen mit `npm test` mit). |

## Wie es zusammenspielt

1. Der Händler setzt im Theme-Editor den App-Block „Passform-Anprobe“ auf die Produktseite.
2. Der Kunde tippt auf „▶ Live anprobieren“. Er landet auf `https://<shop>/apps/passform/anprobe?produkt=<ID>`.
3. Shopify leitet das als **App-Proxy** an unseren Server weiter und hängt eine Signatur an. Der Server prüft sie und liefert
   `app/index.html` im **Kunden-Modus** aus: nur Größe, die Hose dieses Produkts, die Größen, „▶ Anprobieren“.
   Die Händler-Werkzeuge (Hochladen, Link, Maße, Export) sind dort ausgeblendet.
4. Die Seite holt die Hose unter `https://<shop>/apps/passform/hose?produkt=<ID>`, wieder über den App-Proxy.

**Warum App-Proxy und kein iframe:** Die Seite läuft so unter der Adresse des Shops, mit https. Die Kamera braucht keine
iframe-Freigabe (`allow="camera"`), und es gibt keine Probleme mit fremden Herkünften.

**Warum die Seite nicht in den App-Block kopiert wird:** Ein App-Block darf insgesamt 10 MB haben, aber nur 100 KB Liquid
und sollte höchstens 10 KB JavaScript direkt laden ([Grenzen](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)).
Die Seite hat rund 330 KB. Der Server liest bei jeder Anfrage `app/index.html`, es gibt also nur eine Fassung, nichts zum Abgleichen.

**Wo die Hosen liegen:** Der Server speichert je Shop und Produkt eine Datei `shopify/server/daten/<shop>/<Produkt-ID>.json`
(gleiches Format wie `hosen.json`). Nicht als Metafeld am Produkt, weil
- eine Hose mit Bild rund 120 KB hat, Metafelder vom Typ `json` bei neuen Apps aber höchstens 128 KB haben dürfen
  ([Metafeld-Grenzen](https://shopify.dev/docs/apps/build/metafields/metafield-limits)), und
- Metafelder zu schreiben eine Anmeldung des Händlers bei der Admin-API braucht, die es noch nicht gibt.

## Was geprüft ist und was nicht

**Geprüft (hier, ohne echten Shop):**
- Signaturprüfung gegen den signierten Text, den die Shopify-Doku zeigt.
  Die Beispiel-Signaturen der Doku passen nicht, weil dort ein Platzhalter-Shop steht.
- Selbst signierte Anfragen: richtig angenommen, geändert, alt oder ohne Signatur abgelehnt.
- Server mit einer „Shopify-Attrappe“, die wie der App-Proxy signiert weiterleitet. Die Kundenseite wurde im Browser geöffnet:
  Hose gewählt, keine Händler-Werkzeuge, Meldung bei Produkt ohne Hose.
- Pflicht-Webhooks: falsche Signatur → 401, `shop/redact` löscht die Hosen des Shops.

**Nicht geprüft:**
- Echter Shop, Shopify CLI und Theme-Editor.
- Ob Shopify bei der Weiterleitung über den App-Proxy Kopfzeilen ändert, die die Seite braucht (Kamera, CDN-Skripte).
- Kamera auf echten Handys über die Shop-Adresse.

## Einrichten, Schritt für Schritt

1. **Konto:** Auf [shopify.dev](https://shopify.dev) ein Partner-/Entwicklerkonto anlegen und dort einen **Entwicklungs-Shop**
   erstellen (kostenlos, zum Testen).
2. **Werkzeuge:** Node.js (Version 20 oder neuer) installieren. Dann im Ordner `shopify/` einmal `npm install`, das holt die
   Shopify CLI.
3. **App anlegen und verbinden:** Im Ordner `shopify/` den Befehl `npx shopify app config link` ausführen. Neue App „Passform“
   anlegen. Danach steht die `client_id` in `shopify.app.toml`.
4. **Server ins Netz:** `shopify/server/start.mjs` muss öffentlich per https erreichbar sein, z. B. bei einem Hoster für
   Node-Programme. Dort zwei Einstellungen setzen:
   - `SHOPIFY_API_SECRET` = Client secret der App (im Dashboard der App, **geheim halten, nie ins Repo**);
   - `PORT` = vom Hoster vorgegeben.

   Die Adresse dann in `shopify.app.toml` an allen Stellen mit `<deine-app-adresse>` eintragen.
   Zum Ausprobieren geht auch `npx shopify app dev`: Die CLI startet den Server und einen Tunnel.
5. **Übertragen:** `npx shopify app deploy`. Damit gehen App-Block, App-Proxy und Webhooks an Shopify.
6. **Im Entwicklungs-Shop installieren** (Link aus der CLI oder dem Dashboard).
7. **Hose einem Produkt zuordnen:** In der Seite (`app/index.html`, z. B. auf Netlify) die Hose bauen und
   „⇩ Alle Hosen als Datei“ wählen. Dann auf dem Server ausführen:
   `node shopify/server/hose-ablegen.mjs <shop>.myshopify.com <Produkt-ID> hosen.json 1`.
   Die Produkt-ID steht im Shopify-Admin in der Adresse des Produkts (`…/products/1234567890`).
8. **Knopf einbauen:** Im Shopify-Admin auf Onlineshop → Themes → Anpassen → Produktseite gehen.
   Dort Block hinzufügen → Apps → „Passform-Anprobe“.

## Was vor dem App Store noch fehlt

1. **Händler-Seite im Shopify-Admin** (App Home): Hosen bauen und Produkten zuordnen direkt im Admin, statt mit dem Skript
   aus Schritt 7. Dafür braucht es:
   - die Anmeldung des Händlers über Sitzungs-Token ([ID-Token](https://shopify.dev/docs/apps/build/authentication-authorization/id-tokens));
   - App Bridge in der Seite;
   - einen Upload-Weg zum Server.

   „Link einfügen“ (`netlify/functions/holen.mjs`) gehört dann auch hinter diese Anmeldung.
2. **Abrechnung:** Mit **Shopify App Pricing** legt man die Pläne (39 / 99 / 249 € im Monat) im Partner Dashboard an. Shopify
   zeigt dann die Planauswahl, es braucht keinen eigenen Abrechnungs-Code
   ([Shopify App Pricing](https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing)).
   Fehlt noch: Die App muss den aktiven Plan abfragen und je Plan begrenzen (z. B. Zahl der Hosen).
3. **Datenschutzerklärung** und Angaben zum Datenschutz im App-Eintrag. Kernaussage, die stimmt:
   - Kamera, Fotos und Körpermaße der Kunden bleiben im Gerät, nichts wird gesendet.
   - Gespeichert werden nur die Hosen der Händler.

   Ausnahme: Die Seite lädt Programmteile von jsDelivr und das Erkennungsmodell von Google (storage.googleapis.com).
   Diese Dienste sehen die IP-Adresse des Kunden. Vor dem Verkauf selbst hosten oder in der Erklärung nennen.
4. **Pflicht-Webhooks:** eingebaut und lokal getestet ([Datenschutz-Webhooks](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)).
   Vor der Einreichung mit echten Aufrufen aus der CLI prüfen (`shopify app webhook trigger`).
5. **App-Store-Anforderungen** ([Liste](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)):
   - Das Theme nur über die Theme App Extension ändern (so gebaut).
   - Eine klare Anleitung zum Einbauen des App-Blocks.
   - Funktionierende Test-Zugänge für die Prüfer.
6. **Betrieb:**
   - Hosting mit https und Sicherung des Ordners `daten/`.
   - Eine Grenze, wie oft je Shop abgerufen werden darf.
   - Falls „Link einfügen“ auf diesem Server läuft: Der Abruf fremder Seiten prüft die Adresse vor dem Verbinden, aber nicht
     beim Verbinden (DNS-Rebinding). Auf einem eigenen Server deshalb den Zugriff auf interne Adressen zusätzlich in der
     Firewall sperren.

## Quellen (shopify.dev, abgerufen am 12.10.2026)

- App-Proxy: [Überblick](https://shopify.dev/docs/apps/build/online-store/app-proxies),
  [Signatur prüfen](https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies)
- [Theme App Extensions, Aufbau und Grenzen](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)
- [App-Konfiguration (shopify.app.toml)](https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration), [App-Aufbau](https://shopify.dev/docs/apps/build/cli-for-apps/app-structure)
- [Metafeld-Grenzen](https://shopify.dev/docs/apps/build/metafields/metafield-limits)
- [Webhooks prüfen](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries), [Datenschutz-Webhooks](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [Shopify App Pricing](https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing)
