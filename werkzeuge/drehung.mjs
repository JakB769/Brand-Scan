/* Drehung um die eigene Achse mit echtem Clip, Bild für Bild und mit virtueller Uhr (33,3 ms je Bild wie 30 Bilder/s, egal wie
   langsam hier gerechnet wird): je Bild Drehung der Hose (g.yaw), Rohschätzung (fc.roh), Sichtbarkeit; Sprünge zählen.
     node werkzeuge/drehung.mjs [--clip assets/referenz/videos/clips/v2-02_drehung-360.mp4] [--aus <dir>] [--fps 30] [--bilder 8]
   Ergebnis: <aus>/drehung.json (je Bild), <aus>/drehung.png (Verlauf), <aus>/bilder.jpg (Bühne an --bilder Stellen).
   Seite: werkzeuge/tests/vergleichsseite.html (node werkzeuge/tests/baue-testseite.mjs --echt) oder --seite. */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const CLIP = path.resolve(R, arg("clip", "assets/referenz/videos/clips/v2-02_drehung-360.mp4")), FPS = +arg("fps", 30), NB = +arg("bilder", 8);
const OUT = path.resolve(R, arg("aus", "werkzeuge/tests/ausgabe/drehung")) + "/", SEITE = arg("seite", "werkzeuge/tests/vergleichsseite.html");
const [VORNE, HINTEN] = ["assets/referenz/fotos/flach-vorne-hinten/vorne.jpg", "assets/referenz/fotos/flach-vorne-hinten/hinten.jpg"].map(f => R + f);
fs.mkdirSync(OUT, { recursive: true }); const TMP = fs.mkdtempSync("/tmp/drehung-");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", CLIP, "-vf", `fps=${FPS}`, TMP + "/f%04d.jpg"]);
const frames = fs.readdirSync(TMP).filter(f => f.endsWith(".jpg")).sort();

const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 760, height: 1500 }, permissions: ["camera"] });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task", "pose_landmarker_lite.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/fonts.g*/**", r => r.abort());
await ctx.addInitScript(() => {
  // virtuelle Uhr: läuft nur, wenn das Werkzeug sie weiterstellt (+ winzig je Aufruf, damit die Erkennung steigende Zeiten sieht)
  const echt = performance.now.bind(performance); let vt = 0, an = false, eps = 0;
  window.__uhr = { an: t => { vt = t ?? echt(); an = true; }, weiter: ms => { vt += ms; } };
  performance.now = () => an ? vt + (eps += 1e-3) : echt();
  const c = document.createElement("canvas"); c.width = 720; c.height = 1280; const x = c.getContext("2d");
  let img = null; const zeichne = () => { if (img) x.drawImage(img, 0, 0, 720, 1280); };
  window.__setRef = async src => { const im = new Image(); im.src = src; await im.decode(); img = im; zeichne(); };
  setInterval(zeichne, 30);
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = async () => c.captureStream(30);
    navigator.mediaDevices.enumerateDevices = async () => [{ kind: "videoinput", deviceId: "ref", label: "Referenz (front)", groupId: "ref", toJSON() { return this; } }];
  }
});
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/${SEITE}`); await p.waitForTimeout(600);
await p.addStyleTag({ content: ".stage{aspect-ratio:9/16!important;max-height:none!important;width:720px!important}.stage.mirror video,.stage.mirror canvas{transform:none!important}#coachBig,#coachSmall{display:none!important}" });
await p.fill("#height", "179");
await p.setInputFiles("#slot-vorne input", VORNE);
for (let t = 0, ruhig = 0; t < 240 && ruhig < 3; t++) { await p.waitForTimeout(500);
  const offen = await p.evaluate(() => ["refDlg", "segDlg"].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(","));
  if (/refDlg/.test(offen)) { await p.click("#refOk").catch(() => {}); ruhig = 0; continue; }
  if (/segDlg/.test(offen)) { await p.click("#segOk").catch(() => {}); ruhig = 0; continue; }
  ruhig = await p.evaluate(() => window.__dbg.UP.items.length > 0 && window.__dbg.UP.items.every(i => i.kind !== "wait")) ? ruhig + 1 : 0; }
await p.setInputFiles("#slot-hinten input", HINTEN);
for (let t = 0; t < 400; t++) { await p.waitForTimeout(500);
  const offen = await p.evaluate(() => ["refDlg", "segDlg"].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(","));
  if (/refDlg/.test(offen)) { await p.click("#refOk").catch(() => {}); continue; }
  if (/segDlg/.test(offen)) { await p.click("#segOk").catch(() => {}); continue; }
  const m = await p.evaluate(() => document.getElementById("drop-msg").innerText);
  if (/Fertig/.test(m) && !/berechnet|wird/.test(m)) break; }
const bild = f => "data:image/jpeg;base64," + fs.readFileSync(TMP + "/" + f).toString("base64");
await p.evaluate(src => window.__setRef(src), bild(frames[0]));
await p.click("#start"); await p.waitForTimeout(4000); await p.click("#clean").catch(() => {});
await p.evaluate(() => { window.__nA = 0; const a = window.__ta; });
const nAna = () => p.evaluate(() => (window.__ta || []).length);
const warte = async n => { const n0 = await nAna(); for (let k = 0; k < 400 && (await nAna()) < n0 + n; k++) await p.waitForTimeout(15); };
// erstes Bild einschwingen lassen (echte Zeit), dann Uhr anhalten
await p.waitForTimeout(2500); await p.evaluate(() => window.__uhr.an());
const st = await p.$("#stage"), log = [], schnapp = new Set(Array.from({ length: NB }, (_, k) => Math.round(k * (frames.length - 1) / Math.max(1, NB - 1))));
const bilder = [];
for (let i = 0; i < frames.length; i++) {
  await p.evaluate(src => window.__setRef(src), bild(frames[i]));
  await warte(2);                                          // neues Bild in der Erkennung (Uhr steht)
  await p.evaluate(ms => window.__uhr.weiter(ms), 1000 / FPS); await warte(1);
  const r = await p.evaluate(() => { const d = window.__dbg, L = window.__Lraw;
    return { yaw: +(d.g.yaw || 0).toFixed(3), roh: d.fc.roh || null, trk: +(d.g.trk ?? 1).toFixed(2), grund: d.g.unsicher || "",
      sw: L ? +((L[11].x - L[12].x)).toFixed(3) : null, hw: L ? +((L[23].x - L[24].x)).toFixed(3) : null }; });
  r.i = i; r.t = +(i / FPS).toFixed(3); log.push(r);
  if (schnapp.has(i)) { const f = OUT + `b${String(i).padStart(3, "0")}.png`; await st.screenshot({ path: f }); bilder.push([i, f]); }
}
fs.writeFileSync(OUT + "drehung.json", JSON.stringify(log));
// Sprünge: Änderung der Drehung je Bild (rad) und Umkehrungen
const d = log.slice(1).map((r, k) => { let x = r.yaw - log[k].yaw; while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x; });
const big = d.filter(x => Math.abs(x) > .25).length, maxd = Math.max(...d.map(Math.abs));
let umk = 0; for (let k = 2; k < d.length; k++) if (Math.abs(d[k]) > .05 && Math.abs(d[k - 1]) > .05 && Math.sign(d[k]) !== Math.sign(d[k - 1])) umk++;
console.log(`Bilder ${log.length}, größter Schritt ${maxd.toFixed(2)} rad, Schritte > 0,25 rad: ${big}, Richtungswechsel: ${umk}, ausgeblendet: ${log.filter(r => r.trk < .5).length}`);
try { execFileSync("python3", [R + "werkzeuge/python/drehung_plot.py", OUT + "drehung.json", OUT + "drehung.png"], { stdio: "inherit" }); } catch (e) { console.log("Plot:", e.message.split("\n")[0]); }
if (bilder.length) execFileSync("python3", ["-c", `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; ims=[Image.open(f) for f in fs]; w=240; h=int(w*ims[0].height/ims[0].width)
c=Image.new('RGB',(w*len(ims),h+20),'white'); d=ImageDraw.Draw(c)
for k,(f,im) in enumerate(zip(fs,ims)): c.paste(im.resize((w,h)),(k*w,20)); d.text((k*w+4,4),f.split('/')[-1][1:-4],fill='black')
c.save(sys.argv[1])`, OUT + "bilder.jpg", ...bilder.map(x => x[1])]);
console.log("Ausgabe:", OUT, errs.length ? "Fehler: " + [...new Set(errs)].slice(0, 3).join(" | ") : "");
await b.close(); srv.close(); fs.rmSync(TMP, { recursive: true, force: true });
