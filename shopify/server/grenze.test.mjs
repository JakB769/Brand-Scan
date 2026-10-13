/* Test der Zugriffsgrenze (Rate Limiting): node shopify/server/grenze.test.mjs
   Geprüft: Grenze je Shop, anderer Shop unabhängig, neues Zeitfenster gibt wieder frei, Server antwortet mit 429 und Retry-After. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { zugriffsGrenze } from "./grenze.mjs";
import { erstelleServer } from "./start.mjs";
import { proxySignatur } from "./signatur.mjs";

let fehler = 0; const pruefe = (ok, t) => { console.log((ok ? "ok     " : "FEHLER ") + t); if (!ok) fehler++; };

// 1) Grenze allein, mit eigener Uhr
let t = 0; const erlaubt = zugriffsGrenze({ max: 3, fensterMs: 1000, jetzt: () => t });
pruefe([1, 2, 3].every(() => erlaubt("a.myshopify.com")), "drei Anfragen erlaubt");
pruefe(!erlaubt("a.myshopify.com"), "vierte Anfrage im selben Fenster gesperrt");
pruefe(erlaubt("b.myshopify.com"), "anderer Shop zählt getrennt");
t = 1000; pruefe(erlaubt("a.myshopify.com"), "neues Zeitfenster gibt wieder frei");

// 2) Server mit kleiner Grenze
const SECRET = "test-secret", SHOP = "test-laden.myshopify.com";
const daten = fs.mkdtempSync(path.join(os.tmpdir(), "passform-grenze-"));
const app = erstelleServer({ secret: SECRET, daten, grenzeProMinute: 2 }); await new Promise(ok => app.listen(0, "127.0.0.1", ok));
const APP = `http://127.0.0.1:${app.address().port}`;
const signiert = (shop) => {
  const q = new URLSearchParams({ produkt: "4242", shop, path_prefix: "/apps/passform", timestamp: String(Math.floor(Date.now() / 1000)) });
  q.set("signature", proxySignatur(q, SECRET)); return `${APP}/proxy/hose?${q}`;
};
const s = [];
for (let i = 0; i < 3; i++) s.push(await fetch(signiert(SHOP)));
pruefe(s[0].status === 404 && s[1].status === 404, "erste zwei Anfragen durchgelassen (Produkt ohne Hose: 404)");
pruefe(s[2].status === 429 && s[2].headers.get("retry-after") === "60", "dritte Anfrage: 429 mit Retry-After");
pruefe((await fetch(signiert("anderer-laden.myshopify.com"))).status === 404, "anderer Shop nicht betroffen");
app.close(); fs.rmSync(daten, { recursive: true, force: true });
if (fehler) { console.log(fehler + " Fehler"); process.exit(1); } else console.log("alles ok");
