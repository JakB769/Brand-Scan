/* Server der Shopify-App (ohne Abhängigkeiten, nur Node 18+). Siehe doku/shopify-einrichten.md.

   Kunde im Shop                       Shopify (App-Proxy, signiert)              dieser Server
   /apps/passform/anprobe?produkt=ID → /proxy/anprobe?produkt=ID&shop=…&signature=… → app/index.html im Kunden-Modus
   /apps/passform/hose?produkt=ID    → /proxy/hose?produkt=ID&shop=…&signature=…    → Hose dieses Produkts (JSON)
   Shopify-Pflicht-Webhooks (Datenschutz)                                   → POST /webhooks

   Warum über den App-Proxy: die Seite läuft dann unter der Adresse des Shops (https, gleiche Herkunft wie der Shop). Die
   Kamera braucht so keine iframe-Freigabe, und die Hosen-Datei kommt ohne CORS. Die Seite wird bei jeder Anfrage frisch aus
   app/index.html gelesen: es gibt nur eine Fassung, keine Kopie, die veralten kann.

   Gespeichert wird je Shop und Produkt eine Datei daten/<shop>/<produkt>.json (Format wie hosen.json). Ablegen mit
   node shopify/server/hose-ablegen.mjs. Warum nicht als Metafeld am Produkt: eine Hose ist mit Bild etwa 120 KB, Metafelder
   vom Typ json dürfen bei neuen Apps höchstens 128 KB haben (https://shopify.dev/docs/apps/build/metafields/metafield-limits),
   und Metafelder schreiben braucht Zugriff auf die Admin-API (Anmeldung des Händlers), den es hier noch nicht gibt.

   Start: SHOPIFY_API_SECRET=… node shopify/server/start.mjs   (Port aus PORT, sonst 8081)
   UNGEPRÜFT gegen einen echten Shop: nur mit selbst signierten Anfragen getestet (shopify/server/server.test.mjs). */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { proxySignaturOk, proxyFrisch, webhookOk } from "./signatur.mjs";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const SEITE = path.resolve(HIER, "../../app/index.html");
const SHOP = /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/, PRODUKT = /^\d{1,20}$/;

const json = (res, status, o) => { res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(o)); };
const text = (res, status, t) => { res.writeHead(status, { "content-type": "text/plain; charset=utf-8" }); res.end(t); };

function lies(req, max) {
  return new Promise((ok, nein) => {
    const teile = []; let n = 0;
    req.on("data", d => { n += d.length; if (n > max) { nein(Object.assign(new Error("zu groß"), { status: 413 })); req.destroy(); } else teile.push(d); });
    req.on("end", () => ok(Buffer.concat(teile))); req.on("error", nein);
  });
}

/* Seite im Kunden-Modus: vor das Hauptskript kommt die Adresse der Hose dieses Produkts (relativ: bleibt unter /apps/passform/) */
export function kundenSeite(html, produkt) {
  const marke = '<script type="module">';
  if (!html.includes(marke)) throw new Error("app/index.html hat kein Modul-Skript");
  const cfg = JSON.stringify({ hosen: "hose?produkt=" + produkt }).replace(/</g, "\\u003c");
  return html.replace(marke, `<script>window.PASSFORM_KUNDE=${cfg};</script>\n${marke}`);
}

export function erstelleServer({ secret, daten = path.join(HIER, "daten"), seite = SEITE, maxAlterSek = 3600 } = {}) {
  if (!secret) throw new Error("SHOPIFY_API_SECRET fehlt (Client secret der App)");
  return http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, "http://x"), q = u.searchParams;

      // Kunde im Shop, über den App-Proxy: nur mit gültiger, frischer Signatur von Shopify
      if (u.pathname.startsWith("/proxy/") && req.method === "GET") {
        if (!proxySignaturOk(q, secret) || !proxyFrisch(q, maxAlterSek)) return text(res, 401, "Nicht von Shopify signiert");
        const shop = q.get("shop") || "", produkt = q.get("produkt") || "";
        if (!SHOP.test(shop) || !PRODUKT.test(produkt)) return text(res, 400, "Shop oder Produkt fehlt");
        if (u.pathname === "/proxy/anprobe") {
          const html = kundenSeite(await fs.promises.readFile(seite, "utf8"), produkt);
          res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }); return res.end(html);
        }
        if (u.pathname === "/proxy/hose") {
          const f = path.join(daten, shop, produkt + ".json");
          try { const b = await fs.promises.readFile(f); res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); return res.end(b); }
          catch { return json(res, 404, { app: "passform", hosen: [] }); }
        }
        return text(res, 404, "nicht gefunden");
      }

      // Pflicht-Webhooks zum Datenschutz (customers/data_request, customers/redact, shop/redact)
      if (u.pathname === "/webhooks" && req.method === "POST") {
        const roh = await lies(req, 1e6);
        if (!webhookOk(roh, req.headers["x-shopify-hmac-sha256"], secret)) return text(res, 401, "Signatur falsch");
        const thema = String(req.headers["x-shopify-topic"] || "");
        let inhalt = {}; try { inhalt = JSON.parse(roh.toString("utf8")); } catch {}
        if (thema === "shop/redact") {
          // 48 h nach der Deinstallation: alle Hosen dieses Shops löschen
          const shop = String(inhalt.shop_domain || "");
          if (SHOP.test(shop)) await fs.promises.rm(path.join(daten, shop), { recursive: true, force: true });
        }
        // customers/data_request und customers/redact: die App speichert keine Kundendaten (Fotos, Video und Körpermaße
        // bleiben im Gerät des Kunden), es gibt also nichts herauszugeben oder zu löschen
        return text(res, 200, "ok");
      }
      return text(res, 404, "nicht gefunden");
    } catch (e) { text(res, e.status || 500, "Fehler"); }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = +process.env.PORT || 8081;
  erstelleServer({ secret: process.env.SHOPIFY_API_SECRET, ...(process.env.PASSFORM_DATEN ? { daten: process.env.PASSFORM_DATEN } : {}) }).listen(port, () => console.log(`Passform-Server auf Port ${port}`));
}
