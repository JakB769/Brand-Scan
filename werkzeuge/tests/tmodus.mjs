/* Kunden-/Entwicklermodus (18.11.): Zahnrad-Knopf schaltet um, Einstellung bleibt nach dem Neuladen. Kundenmodus: nur Scan
   starten, Live-Anprobe, Produkt/Größe, Avatar drehen; Hochladen, Testpersonen, Messwerte, Testreihe sind aus.
   Bilder: docs/tests/kundenmodus.png, docs/tests/entwicklermodus.png
     node werkzeuge/tests/tmodus.mjs */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "../server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..") + "/", OUT = R + "docs/tests/";
let fehler = 0; const pruefe = (ok, t) => { console.log((ok ? "ok    " : "FEHLER") + " " + t); if (!ok) fehler++; };
const srv = await starte(0), port = srv.address().port;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 430, height: 1100 }, deviceScaleFactor: 2 });
await ctx.route("**/fonts.g*/**", r => r.abort());
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/werkzeuge/tests/testseite-mit-simulierter-person.html`); await p.waitForTimeout(800);
const sicht = () => p.evaluate(() => { const s = id => { const e = typeof id === "string" && id.startsWith(".") ? document.querySelector(id) : document.getElementById(id); return !!e && e.getClientRects().length > 0; };
  return { hose: s("hoseCard"), oberteil: s("otCard"), test: s(".quickrow"), name: s("person"), scan: s("avOption"), live: s("start"), groesse: s("height"), knopf: s("modusBtn"),
    kunde: document.body.classList.contains("kunde"), text: document.getElementById("modusBtn").textContent }; });
let v = await sicht();
pruefe(!v.kunde && v.hose && v.oberteil && v.test && v.name, `Entwicklermodus zu Beginn: alles sichtbar (Knopf „${v.text}“)`);
await p.screenshot({ path: OUT + "entwicklermodus.png" });
await p.click("#modusBtn"); await p.waitForTimeout(300); v = await sicht();
pruefe(v.kunde && !v.hose && !v.oberteil && !v.test && !v.name, "Kundenmodus: Hochladen, Testpersonen und Name ausgeblendet");
pruefe(v.scan && v.live && v.groesse && v.knopf, "Kundenmodus: Scan starten, Live-Anprobe, Größe und Umschalter da");
await p.screenshot({ path: OUT + "kundenmodus.png" });
await p.reload(); await p.waitForTimeout(800); v = await sicht();
pruefe(v.kunde && !v.hose, "Kundenmodus bleibt nach dem Neuladen");
await p.click("#modusBtn"); await p.waitForTimeout(300); v = await sicht();
pruefe(!v.kunde && v.hose && v.test, "zurück in den Entwicklermodus: alles wieder sichtbar");
pruefe(errs.length === 0, "keine Skriptfehler" + (errs.length ? ": " + [...new Set(errs)].slice(0, 3).join(" | ") : ""));
console.log("Bilder: docs/tests/kundenmodus.png, docs/tests/entwicklermodus.png");
await b.close(); srv.close(); console.log(fehler ? `${fehler} Fehler` : "Modus-Umschalter in Ordnung"); process.exit(fehler ? 1 : 0);
