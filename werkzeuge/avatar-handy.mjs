/* Avatar-Ansicht auf dem Handy (Emulation): Chromium als iPhone 13 bzw. Pixel 7 (Bildschirm, Pixeldichte, Touch; kein echtes
   Safari), CPU gedrosselt (Emulation.setCPUThrottlingRate). Gemessen je Bild der 3D-Ansicht mit Avatar und Hose, während sie sich
   dreht: Rechenzeit (window.__tv: Form, Stoff, Zeichenbefehle; die Grafik läuft hier in Software, swiftshader, und wird beim
   Kopieren ins Bild mitgezählt, also eher zu viel), davon Form und Stoff (window.__t3d), Bilder je Sekunde (requestAnimationFrame),
   Zeit für einen Größenwechsel (Tippen bis zum nächsten Bild). Dazu Laden und Anpassen des Körpermodells.
     node werkzeuge/avatar-handy.mjs [--geraet "iPhone 13"|"Pixel 7"] [--cpu 4] [--sek 6] [--dpr 1] [--puppe]
   --puppe: zum Vergleich die Puppe statt des Avatars (was kostet der Avatar selbst), --dpr: andere Pixeldichte.
   Seite: Testseite mit Attrappe (keine Kamera nötig). */
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const GERAET = arg("geraet", "Pixel 7"), CPU = +arg("cpu", 4), SEK = +arg("sek", 6), DPR = arg("dpr", null), PUPPE = process.argv.includes("--puppe"), OHNE = process.argv.includes("--ohne-physik");
const srv = await starte(0), port = srv.address().port;
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const dev = devices[GERAET]; if (!dev) { console.log("Unbekanntes Gerät:", GERAET); process.exit(1); }
const ctx = await b.newContext({ ...dev, ...(DPR ? { deviceScaleFactor: +DPR } : {}) }); await ctx.route("**/fonts.g*/**", r => r.abort());
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/werkzeuge/tests/testseite-mit-simulierter-person.html`); await p.waitForTimeout(600);
const fotos = R + "material/produktfotos/";
await p.setInputFiles("#own-front", fotos + "front.jpg"); await p.setInputFiles("#own-back", fotos + "back.jpg"); await p.fill("#own-waist", "40"); await p.click("#own-go");
await p.waitForFunction(() => /Fertig/.test(document.getElementById("own-msg").textContent), null, { timeout: 120000 });
await p.fill("#height", "179");
const cdp = await ctx.newCDPSession(p); await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
// Körpermodell laden und anpassen (gedrosselt, wie am Handy)
const lade = await p.evaluate(async () => { const D = window.__dbg, t0 = performance.now(); const kd = await D.avatarDaten(); const t1 = performance.now();
  const f = D.avatarAnpassen(kd, "m", { H: 179, waistW: 29, waistD: 20, hipW: 33, hipD: 23, thighW: 16, kneeW: 11, leg: 93, inseam: 83 }); const t2 = performance.now();
  await D.avatarAnzeigen({ v: 1, g: "m", H: 179, p: f.p, m: {}, z: {}, rest: f.rest, at: Date.now() }); const t3 = performance.now();
  return { laden: t1 - t0, anpassen: t2 - t1, bauen: t3 - t2 }; });
await p.evaluate(() => document.getElementById("g3dbox").scrollIntoView({ block: "center" })); await p.waitForTimeout(1500);
// drehen lassen und messen
if (PUPPE) await p.evaluate(() => { window.__dbg.v3d.ohneAvatar = true; });
if (OHNE) await p.evaluate(() => { window.__ohnePhysik = true; }); await p.waitForTimeout(800);
const mess = await p.evaluate(async sek => { const v = window.__dbg.v3d; v.ziel = null; v.idle = 0; v.zoom = 1;
  window.__tv = []; window.__t3d = []; const raf = []; let an = true; const tick = t => { raf.push(t); if (an) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  await new Promise(r => setTimeout(r, sek * 1000)); an = false;
  const d = raf.slice(1).map((t, i) => t - raf[i]).sort((a, b) => a - b), q = (a, x) => a.length ? a[Math.min(a.length - 1, Math.floor(x * a.length))] : NaN;
  const tv = window.__tv.slice().sort((a, b) => a - b), t3 = window.__t3d.slice().sort((a, b) => a - b);
  return { fps: 1000 / q(d, .5), fps10: 1000 / q(d, .9), tv50: q(tv, .5), tv90: q(tv, .9), t3_50: q(t3, .5), n: tv.length,
    px: [document.getElementById("g3dview").width, document.getElementById("g3dview").height] }; }, SEK);
// Größenwechsel: Tippen bis zum nächsten gezeichneten Bild
const wechsel = [];
for (const k of [0, 1, 2]) {
  const chips = await p.$$("#g-szrow .szchip"); if (chips.length < 3) break;
  const t = await p.evaluate(async i => { const c = document.querySelectorAll("#g-szrow .szchip")[i], n0 = window.__tv.length, t0 = performance.now(); c.click();
    while (window.__tv.length === n0 && performance.now() - t0 < 5000) await new Promise(r => requestAnimationFrame(r)); return performance.now() - t0; }, [k * 3 % chips.length]);
  wechsel.push(Math.round(t)); await p.waitForTimeout(500);
}
const f = x => isFinite(x) ? x.toFixed(1) : "–";
console.log(`${GERAET}, CPU ${CPU}× gedrosselt, ${PUPPE ? "PUPPE statt Avatar, " : ""}Ansicht ${mess.px.join("×")} Bildpunkte (${DPR || dev.deviceScaleFactor}× Pixeldichte)`);
console.log(`  Körpermodell: laden ${f(lade.laden)} ms, anpassen ${f(lade.anpassen)} ms, bauen ${f(lade.bauen)} ms`);
console.log(`  Drehen: ${f(mess.fps)} Bilder/s (Median), langsamstes Zehntel ${f(mess.fps10)}; Rechenzeit je Bild ${f(mess.tv50)} ms (90 %: ${f(mess.tv90)}), davon Form+Stoff ${f(mess.t3_50)} ms; ${mess.n} Bilder`);
console.log(`  Größenwechsel bis zum nächsten Bild: ${wechsel.join(", ")} ms`);
console.log(errs.length ? "Fehler: " + errs.slice(0, 3).join(" | ") : "keine Skriptfehler");
await b.close(); srv.close();
