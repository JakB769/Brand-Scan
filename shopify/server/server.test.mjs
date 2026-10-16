/* Test des Shopify-Servers ohne echten Shop: node shopify/server/server.test.mjs
   Eine kleine „Shopify-Attrappe“ macht, was der App-Proxy macht: /apps/passform/… → /proxy/… mit shop, timestamp und Signatur.
   Geprüft: Signatur Pflicht, alte Zeitstempel und fremde Shops abgelehnt, Kundenseite (echte app/index.html im Kunden-Modus,
   im Browser: Händler-Werkzeuge weg, Hose des Produkts gewählt, Anprobieren-Knopf), Produkt ohne Hose, Pflicht-Webhooks
   (falsche Signatur → 401, shop/redact löscht die Hosen des Shops). Die Hose wird vorher aus den Bershka-Fotos gebaut. */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { erstelleServer } from "./start.mjs";
import { proxySignatur } from "./signatur.mjs";

const HIER = path.dirname(fileURLToPath(import.meta.url)), R = path.resolve(HIER, "../..") + "/";
const SECRET = "test-secret", SHOP = "test-laden.myshopify.com", PRODUKT = "4242";
let fehler = 0; const pruefe = (ok, t) => { console.log((ok ? "ok     " : "FEHLER ") + t); if (!ok) fehler++; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "passform-shop-")), daten = path.join(tmp, "daten");

// 1) Hose bauen und als hosen.json sichern (Testseite, Bershka-Fotos)
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
{
  const p = await (await b.newContext({ acceptDownloads: true })).newPage();
  await p.goto("file://" + R + "werkzeuge/tests/testseite-mit-simulierter-person.html"); await p.waitForTimeout(300);
  await p.setInputFiles("#own-front", R + "material/produktfotos/front.jpg"); await p.setInputFiles("#own-back", R + "material/produktfotos/back.jpg");
  await p.fill("#own-waist", "40"); await p.click("#own-go");
  await p.waitForFunction(() => /Fertig/.test(document.getElementById("own-msg").textContent), null, { timeout: 60000 });
  const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#g-export")]);
  await dl.saveAs(path.join(tmp, "hosen.json")); await p.close();
}
// Händler legt die Hose zum Produkt (Werkzeug wie im Alltag, Ziel: Testordner statt shopify/server/daten)
execFileSync(process.execPath, [path.join(HIER, "hose-ablegen.mjs"), SHOP, PRODUKT, path.join(tmp, "hosen.json")], { env: { ...process.env, PASSFORM_DATEN: daten } });
pruefe(fs.existsSync(path.join(daten, SHOP, PRODUKT + ".json")), "Hose zum Produkt abgelegt");

// 2) Server und Shopify-Attrappe
const app = erstelleServer({ secret: SECRET, daten }); await new Promise(ok => app.listen(0, "127.0.0.1", ok));
const APP = `http://127.0.0.1:${app.address().port}`;
const signiert = (pfad, extra = {}, { shop = SHOP, zeit = Math.floor(Date.now() / 1000) } = {}) => {
  const u = new URL(pfad, "http://x"), q = new URLSearchParams(u.search);
  q.set("shop", shop); q.set("logged_in_customer_id", ""); q.set("path_prefix", "/apps/passform"); q.set("timestamp", String(zeit));
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  q.set("signature", proxySignatur(q, SECRET)); return `${u.pathname}?${q}`;
};
const shopify = http.createServer(async (req, res) => {          // https://<shop>/apps/passform/… → <app>/proxy/…
  const u = new URL(req.url, "http://x");
  if (!u.pathname.startsWith("/apps/passform/")) { res.writeHead(404); return res.end(); }
  const r = await fetch(APP + signiert("/proxy/" + u.pathname.slice(15) + u.search));
  res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "text/plain" }); res.end(Buffer.from(await r.arrayBuffer()));
});
await new Promise(ok => shopify.listen(0, "127.0.0.1", ok)); const SHOPURL = `http://127.0.0.1:${shopify.address().port}`;

// 3) Schutz: ohne Signatur, alt, falsches Secret, fremder Shop, kaputtes Produkt
const st = async u => (await fetch(APP + u)).status;
pruefe(await st(`/proxy/anprobe?produkt=${PRODUKT}&shop=${SHOP}`) === 401, "ohne Signatur: 401");
pruefe(await st(signiert(`/proxy/anprobe?produkt=${PRODUKT}`, {}, { zeit: 1000 })) === 401, "uralter Zeitstempel: 401");
{ const u = signiert(`/proxy/hose?produkt=${PRODUKT}`); pruefe(await st(u.replace("produkt=" + PRODUKT, "produkt=1")) === 401, "Produkt nach dem Signieren geändert: 401"); }
pruefe(await st(signiert(`/proxy/hose?produkt=${PRODUKT}`, {}, { shop: "../../etc" })) === 400, "unsinniger Shop-Name (signiert): 400, kein Pfad nach außen");
pruefe(await st(signiert(`/proxy/hose?produkt=12ab`)) === 400, "Produkt-ID nicht nur Ziffern: 400");
pruefe(await st(signiert(`/proxy/hose?produkt=999`)) === 404, "Produkt ohne Hose: 404");
{ const r = await fetch(APP + signiert(`/proxy/avatar/koerper.js`)), t = await r.text();
  pruefe(r.status === 200 && /javascript/.test(r.headers.get("content-type")) && t.includes("PASSFORM_KOERPER"), "Körpermodell des Avatars über den Proxy (ohne Produkt)");
  pruefe(await st(`/proxy/avatar/koerper.js?shop=${SHOP}`) === 401, "Körpermodell ohne Signatur: 401"); }
{ const r = await fetch(APP + signiert(`/proxy/hose?produkt=${PRODUKT}`)), j = await r.json();
  pruefe(r.status === 200 && j.hosen && j.hosen.length === 1 && /^data:image\//.test(j.hosen[0].G.m3.atlas), "Hose des Produkts kommt als hosen.json"); }

// 4) Kundenseite im Browser (echte app/index.html)
{
  const p = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await p.goto(`${SHOPURL}/apps/passform/anprobe?produkt=${PRODUKT}`);
  await p.waitForFunction(() => document.querySelector("#gwrap .gbtn[aria-pressed='true']"), null, { timeout: 20000 }).catch(() => {});
  const z = await p.evaluate(() => { const sicht = id => { const e = document.getElementById(id); return !!e && e.offsetParent !== null; };
    return { kunde: document.body.classList.contains("kunde"), gewaehlt: !!document.querySelector("#gwrap .gbtn[aria-pressed='true']"),
      knopf: document.getElementById("tryon").textContent.trim(), tryon: sicht("tryon"), hoehe: sicht("height"),
      haendler: ["quick", "link-form", "drop", "gdims", "g-glb", "own-go", "g-export", "person"].filter(sicht), loeschen: [...document.querySelectorAll(".gdel")].some(e => e.offsetParent) }; });
  pruefe(z.kunde && z.gewaehlt, "Kundenseite: Hose des Produkts gleich gewählt");
  pruefe(z.tryon && z.hoehe && z.knopf === "▶ Anprobieren", `Größe und „${z.knopf}“ sichtbar`);
  pruefe(!z.haendler.length && !z.loeschen, "keine Händler-Werkzeuge sichtbar" + (z.haendler.length ? ": " + z.haendler.join(", ") : ""));
  await p.screenshot({ path: R + "werkzeuge/tests/ausgabe/shopify_kunde.png", fullPage: true });
  await p.goto(`${SHOPURL}/apps/passform/anprobe?produkt=999`); await p.waitForTimeout(1500);
  const m = await p.evaluate(() => document.getElementById("g-msg").textContent);
  pruefe(/noch nicht/.test(m), `Produkt ohne Hose: „${m}“`);
  pruefe(!errs.length, "keine Skriptfehler" + (errs.length ? ": " + errs.slice(0, 2).join(" | ") : ""));
}

// 5) Pflicht-Webhooks
const hook = (thema, inhalt, secret = SECRET) => { const roh = JSON.stringify(inhalt);
  return fetch(APP + "/webhooks", { method: "POST", body: roh, headers: { "content-type": "application/json", "x-shopify-topic": thema,
    "x-shopify-hmac-sha256": crypto.createHmac("sha256", secret).update(roh).digest("base64") } }); };
pruefe((await hook("shop/redact", { shop_domain: SHOP }, "falsch")).status === 401, "Webhook mit falscher Signatur: 401");
pruefe(fs.existsSync(path.join(daten, SHOP)), "… und nichts gelöscht");
pruefe((await hook("customers/data_request", { shop_domain: SHOP, customer: { id: 1 } })).status === 200, "customers/data_request: 200 (keine Kundendaten gespeichert)");
pruefe((await hook("customers/redact", { shop_domain: SHOP, customer: { id: 1 } })).status === 200, "customers/redact: 200");
pruefe((await hook("shop/redact", { shop_domain: SHOP })).status === 200 && !fs.existsSync(path.join(daten, SHOP)), "shop/redact: Hosen des Shops gelöscht");

await b.close(); app.close(); shopify.close(); fs.rmSync(tmp, { recursive: true, force: true });
if (fehler) { console.log(fehler + " Fehler"); process.exit(1); }
console.log("Shopify-Server in Ordnung");
