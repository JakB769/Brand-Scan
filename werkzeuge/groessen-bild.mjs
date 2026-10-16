// Bildschirmfotos der Größenauswahl (Handy 430 × 932): unter dem 3D-Modell, nach Wechsel auf W36, in der Shop-Anprobe.
// Aufruf: node werkzeuge/groessen-bild.mjs <Zielordner>   (Testhose mit Bankkarte, Körpergröße 179)
// Bildschirmfotos: wo die Größen erscheinen (unter dem 3D-Modell und in der Shop-Anprobe)
import { chromium } from "playwright";
import fs from "node:fs";
import { starte } from "./server.mjs";
const R = new URL("..", import.meta.url).pathname, A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/", OUT = process.argv[2];
const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1.5, permissions: ["camera"] });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/fonts.g*/**", r => r.abort());
await ctx.addInitScript(() => { window.__kiTest = true; });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/werkzeuge/tests/testseite-mit-simulierter-person.html`); await p.waitForTimeout(500);
await p.fill("#height", "179");
const dialoge = async () => { const o = await p.evaluate(() => ["refDlg", "segDlg"].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(","));
  if (/refDlg/.test(o)) { await p.click("#refOk").catch(() => {}); return true; } if (/segDlg/.test(o)) { await p.click("#segOk").catch(() => {}); return true; } return false; };
await p.setInputFiles("#slot-vorne input", R + "assets/referenz/fotos/flach-vorne-hinten/vorne.jpg");
for (let t = 0, ruhig = 0; t < 240 && ruhig < 3; t++) { await p.waitForTimeout(500); if (await dialoge()) { ruhig = 0; continue; }
  ruhig = await p.evaluate(() => window.__dbg.UP.items.length > 0 && window.__dbg.UP.items.every(i => i.kind !== "wait")) ? ruhig + 1 : 0; }
await p.setInputFiles("#slot-hinten input", R + "assets/referenz/fotos/flach-vorne-hinten/hinten.jpg");
for (let t = 0; t < 400; t++) { await p.waitForTimeout(500); if (await dialoge()) continue;
  const m = await p.evaluate(() => document.getElementById("drop-msg").innerText); if (/Fertig/.test(m) && !/berechnet|wird/.test(m)) break; }
await p.waitForTimeout(2500);
// 1) unter dem 3D-Modell: Größen-Knöpfe und Begründung
await p.evaluate(() => document.getElementById("g3dbox").scrollIntoView({ block: "start" }));
await p.waitForTimeout(1500);
const box = await p.evaluate(() => { const a = document.getElementById("g3dbox").getBoundingClientRect(), z = document.getElementById("g-sizes").getBoundingClientRect();
  return { x: 0, y: Math.max(0, a.top + scrollY), w: innerWidth, h: z.bottom - a.top + 12, sizes: !document.getElementById("g-sizes").hidden, txt: document.getElementById("g-szmsg").innerText }; });
console.log("Größen sichtbar:", box.sizes, "|", box.txt.replace(/\n/g, " / "));
await p.screenshot({ path: OUT + "/groessen_unter_3d.png", fullPage: true, clip: { x: 0, y: box.y, width: box.w, height: Math.min(box.h, 1800) } });
// Größe wechseln: W36 antippen, 3D-Hose wird weiter
await p.click('#g-szrow .szchip[data-sz="8"]').catch(()=>{}); await p.waitForTimeout(2500);
const box2 = await p.evaluate(() => { const a = document.getElementById("g3dbox").getBoundingClientRect(), z = document.getElementById("g-sizes").getBoundingClientRect();
  return { y: Math.max(0, a.top + scrollY), h: z.bottom - a.top + 12, txt: document.getElementById("g-szmsg").innerText }; });
console.log("nach Wechsel:", box2.txt.split("\n")[0]);
await p.screenshot({ path: OUT + "/groessen_wechsel_w36.png", fullPage: true, clip: { x: 0, y: box2.y, width: 430, height: Math.min(box2.h, 1800) } });
await p.click('#g-szrow .szchip.best').catch(()=>{}); await p.waitForTimeout(1500);
// Formular oben: wo die Körpergröße steht
await p.evaluate(() => document.getElementById("height").scrollIntoView({ block: "center" }));
await p.waitForTimeout(300);
// 2) Shop-Anprobe
await p.click("#tryon"); await p.waitForTimeout(9000);
const sh = await p.evaluate(() => ({ why: document.getElementById("szwhy").innerText, n: document.querySelectorAll("#szshop .szchip").length }));
console.log("Shop-Ansicht:", sh);
await p.screenshot({ path: OUT + "/groessen_shop_anprobe.png" });
await b.close(); srv.close();
