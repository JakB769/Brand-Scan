/* Avatar aus dem Selbst-Scan mit echten Clips als Kamera (echte Erkennung, MediaPipe auf der CPU): Knopf „Avatar aus
   Selbst-Scan“ → Einwilligung → Frontal-Scan im Stehen (Standbild aus dem Steh-Clip) → Drehung (Dreh-Clip, Bild für Bild mit
   virtueller Uhr, 30 Bilder/s, bei Bedarf zweimal) → Avatar. Vorher wird die Testhose aus den flachen Fotos gebaut.
     node werkzeuge/avatar-scan.mjs [--clip assets/referenz/videos/clips/v2-02_drehung-360.mp4] [--scan <steh-clip>]
                                    [--k .82] [--groesse 179] [--aus docs/vergleich] [--name v2]
   --k: Bild verkleinert in die Mitte gesetzt (im Clip ist der Kopf am oberen Rand angeschnitten; so steht man „weit genug weg“).
   Ergebnis: Ziele aus dem Scan und Maße des Avatars in der Konsole und in <aus>/avatar_<name>.json; Bilder des Avatars mit Hose
   von vorn, von der Seite und von hinten neben den passenden Bildern aus dem Clip: <aus>/avatar_<name>_hose_vs_foto.jpg.
   Seite: werkzeuge/tests/vergleichsseite.html (node werkzeuge/tests/baue-testseite.mjs --echt). Braucht ffmpeg. */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const CLIP = path.resolve(R, arg("clip", "assets/referenz/videos/clips/v2-02_drehung-360.mp4")), K = +arg("k", .82), H = +arg("groesse", 179);
const SCAN = path.resolve(R, arg("scan", path.basename(CLIP).startsWith("v1") ? "assets/referenz/videos/clips/v1-01_stehen-neutral-vorne.mp4" : "assets/referenz/videos/clips/v2-01_stehen-neutral-vorne.mp4"));
const OUT = path.resolve(R, arg("aus", "docs/vergleich")) + "/", NAME = arg("name", path.basename(CLIP).slice(0, 2)), FPS = 30;
const [VORNE, HINTEN] = ["assets/referenz/fotos/flach-vorne-hinten/vorne.jpg", "assets/referenz/fotos/flach-vorne-hinten/hinten.jpg"].map(f => R + f);
fs.mkdirSync(OUT, { recursive: true }); const TMP = fs.mkdtempSync("/tmp/avatar-scan-");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", CLIP, "-vf", `fps=${FPS}`, TMP + "/f%04d.jpg"]);
const frames = fs.readdirSync(TMP).filter(f => /^f\d+\.jpg$/.test(f)).sort();
{ const d = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", SCAN]).toString();
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(Math.min(2, d / 2)), "-i", SCAN, "-frames:v", "1", TMP + "/scan.jpg"]); }

const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 760, height: 1500 }, permissions: ["camera"] });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task", "pose_landmarker_lite.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/fonts.g*/**", r => r.abort());
await ctx.addInitScript(() => {
  window.__cpu = true;
  // virtuelle Uhr wie in drehung.mjs: eine Erkennung je freigegebenem Bild, 33,3 ms je Bild
  const echt = performance.now.bind(performance); let vt = 0, an = false, eps = 0, frei = 0;
  window.__gate = () => !an || (frei > 0 && (frei--, true)); window.__frei = n => { frei += n; };
  window.__uhr = { an: t => { vt = t ?? echt(); an = true; }, weiter: ms => { vt += ms; eps = 0; }, aus: () => { an = false; } };
  performance.now = () => an ? vt + (eps += 1e-3) : echt();
  const c = document.createElement("canvas"); c.width = 720; c.height = 1280; const x = c.getContext("2d");
  let img = null, kk = 1; const zeichne = () => { if (!img) return; if (kk < 1) { x.fillStyle = "#8a857d"; x.fillRect(0, 0, 720, 1280); }
    x.drawImage(img, 360 * (1 - kk), 640 * (1 - kk), 720 * kk, 1280 * kk); };
  window.__setRef = async (src, k = 1) => { const im = new Image(); im.src = src; await im.decode(); img = im; kk = k; zeichne(); };
  setInterval(zeichne, 30);
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = async () => c.captureStream(30);
    navigator.mediaDevices.enumerateDevices = async () => [{ kind: "videoinput", deviceId: "ref", label: "Referenz (front)", groupId: "ref", toJSON() { return this; } }];
  }
});
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/werkzeuge/tests/vergleichsseite.html`); await p.waitForTimeout(600);
await p.addStyleTag({ content: ".stage{aspect-ratio:9/16!important;max-height:none!important;width:720px!important}.stage.mirror video,.stage.mirror canvas{transform:none!important}" });
await p.fill("#height", String(H));
// Testhose aus den flachen Fotos (wie drehung.mjs)
const dialoge = async () => { const o = await p.evaluate(() => ["refDlg", "segDlg"].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(","));
  if (/refDlg/.test(o)) { await p.click("#refOk").catch(() => {}); return true; } if (/segDlg/.test(o)) { await p.click("#segOk").catch(() => {}); return true; } return false; };
await p.setInputFiles("#slot-vorne input", VORNE);
for (let t = 0, ruhig = 0; t < 240 && ruhig < 3; t++) { await p.waitForTimeout(500); if (await dialoge()) { ruhig = 0; continue; }
  ruhig = await p.evaluate(() => window.__dbg.UP.items.length > 0 && window.__dbg.UP.items.every(i => i.kind !== "wait")) ? ruhig + 1 : 0; }
await p.setInputFiles("#slot-hinten input", HINTEN);
for (let t = 0; t < 400; t++) { await p.waitForTimeout(500); if (await dialoge()) continue;
  const m = await p.evaluate(() => document.getElementById("drop-msg").innerText); if (/Fertig/.test(m) && !/berechnet|wird/.test(m)) break; }
console.log("Hose:", await p.evaluate(() => { const G = window.__dbg.GARMENTS[window.__dbg.g.key]; return G ? G.label + (G.sizes ? ", Größen " + G.sizes.map(z => z.size).join("/") : "") : "keine"; }));

// Scan: Knopf, Einwilligung, Frontal-Scan im Stehen
const bild = f => "data:image/jpeg;base64," + fs.readFileSync(TMP + "/" + f).toString("base64");
await p.evaluate(([src, k]) => window.__setRef(src, k), [bild("scan.jpg"), K]);
await p.click("#avScan"); await p.waitForTimeout(300);
const dlg = await p.evaluate(() => ({ offen: !document.getElementById("avDlg").hidden, text: document.getElementById("avDlg").innerText }));
console.log("Einwilligung:", dlg.offen ? "offen" : "FEHLT", "|", dlg.text.replace(/\s+/g, " ").slice(0, 160));
await p.fill("#avGroesse", String(H)); await p.click("#avMann"); await p.click("#avJa");
let geeicht = false;
for (let t = 0; t < 80; t++) { await p.waitForTimeout(500);
  if (await p.evaluate(() => window.__dbg.AVS.stufe === "drehen")) { geeicht = true; break; } }
console.log(geeicht ? "Frontal-Scan fertig, jetzt drehen" : "Frontal-Scan NICHT fertig geworden");
const cal = await p.evaluate(() => { const c = window.__dbg.caps.cal || {}; const r = v => v == null ? null : Math.round(v * 10) / 10;
  return Object.fromEntries(["waist", "hip", "thighL", "thighR", "kneeL", "kneeR", "leg", "inseam", "torso", "shoulder"].map(k => [k, r(c[k])])); });
console.log("Frontal-Scan:", JSON.stringify(cal));

// Drehung Bild für Bild (virtuelle Uhr), höchstens zwei Durchgänge
await p.evaluate(([src, k]) => window.__setRef(src, k), [bild(frames[0]), K]);
await p.waitForTimeout(1200);
await p.evaluate(() => { window.__ta = window.__ta || []; window.__uhr.an(); });
const nAna = () => p.evaluate(() => (window.__ta || []).length);
const warte = async n => { const n0 = await nAna(); for (let k = 0; k < 400 && (await nAna()) < n0 + n; k++) await p.waitForTimeout(15); };
const log = []; let fertig = false;
for (let durch = 0; durch < 2 && !fertig && geeicht; durch++) for (let i = 0; i < frames.length; i++) {
  await p.evaluate(([src, k]) => window.__setRef(src, k), [bild(frames[i]), K]);
  await p.waitForTimeout(90);
  await p.evaluate(ms => { window.__uhr.weiter(ms); window.__frei(1); }, 1000 / FPS); await warte(1);
  const r = await p.evaluate(() => { const d = window.__dbg, P = d.AVS.proben || {};
    return { yaw: +(d.fc.yaw || 0).toFixed(3), stufe: d.AVS.stufe, w: +(d.AVS.w || 0).toFixed(2), bins: d.AVS.bins ? d.AVS.bins.size : 0,
      n: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, v.length])) }; });
  log.push({ durch, i, ...r });
  if (i % 30 === 0) console.log(`Durchgang ${durch + 1}, Bild ${i}/${frames.length}: Drehung ${r.yaw}, Sektoren ${r.bins}/24, Proben ${JSON.stringify(r.n)}`);
  if (r.stufe !== "drehen") { fertig = true; break; }
}
await p.evaluate(() => window.__uhr.aus());
for (let t = 0; t < 60 && !(await p.evaluate(() => !!window.__dbg.AV.form)); t++) await p.waitForTimeout(500);
const erg = await p.evaluate(() => { const d = window.__dbg, a = d.AV.daten; let roh = null; try { roh = localStorage.getItem("passformAvatar"); } catch (_) {}
  return { daten: a, gespeichert: roh ? roh.length : 0, bilderImSpeicher: roh ? /data:|blob:/.test(roh) : false, proben: Object.fromEntries(Object.entries(d.AVS.proben || {}).map(([k, v]) => [k, v])) }; });
if (!erg.daten) { console.log("KEIN AVATAR", errs.slice(0, 3)); await b.close(); srv.close(); process.exit(1); }
const a = erg.daten, f1 = v => v == null ? "–" : (+v).toFixed(1);
console.log(`Avatar: ${a.g === "m" ? "Mann" : "Frau"}, ${a.H} cm, Restfehler der Anpassung ${a.rest} (in Vielfachen von σ), gespeichert ${erg.gespeichert} Zeichen, Bilder im Speicher: ${erg.bilderImSpeicher ? "JA" : "nein"}`);
console.log("Proben je Blickrichtung:", Object.entries(erg.proben).map(([k, v]) => k + " " + v.length).join(", "));
console.log("                 Ziel(Scan)  Avatar   Abw.");
for (const k of ["waistW", "waistD", "hipW", "hipD", "thighW", "kneeW", "leg", "inseam"]) {
  const z = a.z[k], m = a.m[k]; console.log(`  ${k.padEnd(14)} ${f1(z).padStart(8)} ${f1(m).padStart(8)} ${z == null ? "" : ((m - z >= 0 ? "+" : "") + (m - z).toFixed(1)).padStart(6)}`); }
console.log(`  Umfänge Avatar: Taille ${f1(a.m.waist)}, Hüfte ${f1(a.m.hip)}, Oberschenkel ${f1(a.m.thigh)}, Knie ${f1(a.m.knee)} cm`);
const groessen = await p.evaluate(() => document.getElementById("g-szmsg") ? document.getElementById("g-szmsg").innerText.split("\n").slice(0, 3).join(" / ") : "");
console.log("Größenauswahl mit Avatar:", groessen);

// Bilder: Avatar mit Hose von vorn, Seite, hinten; daneben das Clip-Bild mit der nächsten geschätzten Blickrichtung
await p.evaluate(() => document.getElementById("g3dbox").scrollIntoView({ block: "start" })); await p.waitForTimeout(800);
const ansichten = [["vorn", 0], ["seite", Math.PI / 2], ["hinten", Math.PI]], gemacht = [];
for (const [n, y] of ansichten) {
  await p.evaluate(y => { const v = window.__dbg.v3d; v.ziel = null; v.yaw = y; v.zoom = 1; v.idle = performance.now() + 1e7; }, y);
  await p.waitForTimeout(1500);
  const bb = await p.evaluate(() => { const r = document.getElementById("g3dview").getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  const ziel = OUT + `avatar_${NAME}_${n}.png`; await p.screenshot({ path: ziel, clip: bb });
  const wrap = x => { while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x; };
  const best = log.filter(r => r.durch === 0).reduce((q, r) => Math.abs(wrap(Math.abs(r.yaw) - y)) < Math.abs(wrap(Math.abs(q.yaw) - y)) ? r : q, log[0]);
  gemacht.push([n, ziel, TMP + "/" + frames[best.i], best.yaw]);
}
fs.writeFileSync(OUT + `avatar_${NAME}.json`, JSON.stringify({ clip: path.relative(R, CLIP), scan: path.relative(R, SCAN), k: K, H, frontalScan: cal, avatar: a,
  proben: Object.fromEntries(Object.entries(erg.proben).map(([k, v]) => [k, v.length])), fertigNachBildern: log.length }, null, 1));
execFileSync("python3", ["-c", `
import sys, json
from PIL import Image, ImageDraw, ImageFont
try: F=ImageFont.truetype('DejaVuSans.ttf',14)
except Exception: F=None
out=sys.argv[1]; z=json.loads(sys.argv[2]); h=520
row=[]
for n,av,foto,yw in z:
    a=Image.open(av).convert('RGB'); f=Image.open(foto).convert('RGB')
    a=a.resize((int(a.width*h/a.height),h)); f=f.resize((int(f.width*h/f.height),h))
    t=Image.new('RGB',(a.width+f.width,h+26),'white'); t.paste(f,(0,26)); t.paste(a,(f.width,26))
    ImageDraw.Draw(t).text((6,5),f'{n}: Clip (Drehung geschätzt {yw:+.2f} rad) | Avatar mit Hose',fill='black',font=F); row.append(t)
c=Image.new('RGB',(sum(t.width for t in row)+8*(len(row)-1),row[0].height),'white'); x=0
for t in row: c.paste(t,(x,0)); x+=t.width+8
c.save(out,quality=88)`, OUT + `avatar_${NAME}_hose_vs_foto.jpg`, JSON.stringify(gemacht)]);
console.log("Ausgabe:", OUT + `avatar_${NAME}_hose_vs_foto.jpg`, errs.length ? "Fehler: " + [...new Set(errs)].slice(0, 3).join(" | ") : "keine Skriptfehler");
await b.close(); srv.close(); fs.rmSync(TMP, { recursive: true, force: true });
