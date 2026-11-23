/* Stoff in Bewegung (23.11.): eine gespeicherte Hose (JSON wie im Gerät, z. B. von hose-render.mjs bauen --json) mit einem Clip als
   Kamera Bild für Bild anprobieren (echte Erkennung, virtuelle Uhr: 30 Bilder/s, egal wie langsam hier gerechnet wird; dadurch
   gleiche Eingabe → gleiche Physik). Vorher Frontal-Scan mit Stehen von vorn aus demselben Satz Clips.
     node werkzeuge/stoff-bewegung.mjs --hose <hose.json> --clip <clip.mp4> --aus <Ordner> [--name x] [--stoff anzug] [--farbe anthrazit]
                                       [--fps 30] [--bilder 1] [--bis 6] [--dumpPos]
   --k: Clip und Scan verkleinert in die Mitte (Vorgabe 0,82; im Clip ist der Kopf am Rand angeschnitten), --werte '{"hz":1.4}': Werte der Stoffart für diesen Lauf (z. B. die alten für „vorher“), --stoff: Stoffart der Hose für diesen Lauf (sonst wie gespeichert), --farbe anthrazit: Stoff im Atlas dunkelgrau (Anzug-Optik
   für die Testhose), --bilder n: jedes n-te Bild als <name>_NNN.jpg (Bühne), --bis: Sekunden des Clips, --dumpPos: Punkte der Hose je
   Bild (Prüfung „Jeans unverändert“).
   Ergebnis: <aus>/<name>.json je Bild: Schwingen am Saum und am Unterschenkel (cm, Abstand der Hose zur starren Form am Skelett),
   Ruck (cm/s², Flattern), Punkte im Bein (Durchstoßen); dazu die Bilder. Seite: werkzeuge/tests/vergleichsseite.html (--echt). */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const CLIP = path.resolve(R, arg("clip", "assets/referenz/videos/clips/v2-03_knie-heben-vorne.mp4")), FPS = +arg("fps", "30"), JEDES = +arg("bilder", "1"), BIS = +arg("bis", "99");
const KK = +arg("k", ".82");    // Clip wie der Frontal-Scan verkleinert (sonst wirkt die Person im Clip größer: „gebeugt“, Hose aus)
const OUT = path.resolve(R, arg("aus", "werkzeuge/tests/ausgabe/stoff")) + "/", NAME = arg("name", path.basename(CLIP, ".mp4")), STOFF = arg("stoff", ""), FARBE = arg("farbe", "");
const HOSE = JSON.parse(fs.readFileSync(path.resolve(R, arg("hose")), "utf8")), WERTE = JSON.parse(arg("werte", "{}"));
fs.mkdirSync(OUT, { recursive: true }); const TMP = fs.mkdtempSync("/tmp/stoffbew-");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-t", String(BIS), "-i", CLIP, "-vf", `fps=${FPS}`, TMP + "/f%04d.jpg"]);
const frames = fs.readdirSync(TMP).filter(f => /^f\d+\.jpg$/.test(f)).sort();
{ const T = R + "werkzeuge/tests/vergleichsseite.html";
  if (!fs.existsSync(T) || fs.statSync(R + "app/index.html").mtimeMs > fs.statSync(T).mtimeMs || fs.statSync(R + "werkzeuge/tests/baue-testseite.mjs").mtimeMs > fs.statSync(T).mtimeMs)
    execFileSync(process.execPath, [R + "werkzeuge/tests/baue-testseite.mjs", "--echt"], { stdio: "inherit" }); }

const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 760, height: 1500 }, permissions: ["camera"] });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task", "pose_landmarker_lite.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/fonts.g*/**", r => r.abort());
await ctx.addInitScript(([hose]) => {
  try { localStorage.setItem("massScanHosen", JSON.stringify([hose])); localStorage.setItem("passformModus", "entwickler"); } catch (_) {}
  window.__cpu = true; const echt = performance.now.bind(performance); let vt = 0, an = false, eps = 0, frei = 0;
  window.__gate = () => !an || (frei > 0 && (frei--, true)); window.__frei = n => { frei += n; };
  window.__uhr = { an: t => { vt = t ?? echt(); an = true; }, weiter: ms => { vt += ms; eps = 0; } };
  performance.now = () => an ? vt + (eps += 1e-3) : echt();
  const c = document.createElement("canvas"); c.width = 720; c.height = 1280; const x = c.getContext("2d"); let img = null, kk = 1;
  const zeichne = () => { if (!img) return; if (kk < 1) { x.fillStyle = "#8a857d"; x.fillRect(0, 0, 720, 1280); } x.drawImage(img, 360 * (1 - kk), 640 * (1 - kk), 720 * kk, 1280 * kk); };
  window.__setRef = async (src, k = 1) => { const im = new Image(); im.src = src; await im.decode(); img = im; kk = k; zeichne(); };
  setInterval(zeichne, 30);
  navigator.mediaDevices.getUserMedia = async () => c.captureStream(30);
  navigator.mediaDevices.enumerateDevices = async () => [{ kind: "videoinput", deviceId: "ref", label: "Referenz (front)", groupId: "ref", toJSON() { return this; } }];
}, [HOSE]);
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/werkzeuge/tests/vergleichsseite.html`); await p.waitForTimeout(800);
await p.addStyleTag({ content: ".stage{aspect-ratio:9/16!important;max-height:none!important;width:720px!important}.stage.mirror video,.stage.mirror canvas{transform:none!important}#coachBig,#coachSmall{display:none!important}" });
await p.fill("#height", "179");
// Hose wählen, Stoff für diesen Lauf, Farbe des Atlas (nur Optik der Testhose)
const info = await p.evaluate(async ([key, stoff, farbe, werte]) => { const d = window.__dbg, G = d.GARMENTS[key]; if (!G) return { fehler: "Hose fehlt: " + key };
  if (stoff) G.fabric = stoff;
  if (stoff && Object.keys(werte).length) Object.assign(d.STOFFE[stoff], werte);      // z. B. die alten Werte für „vorher“ (gleicher Code)
  if (farbe === "anthrazit") { const im = new Image(); im.src = G.m3.atlas; await im.decode(); const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
    const x = c.getContext("2d"); x.drawImage(im, 0, 0); const D = x.getImageData(0, 0, c.width, c.height), a = D.data;
    for (let i = 0; i < a.length; i += 4) { const l = (.2126 * a[i] + .7152 * a[i + 1] + .0722 * a[i + 2]) / 255, v = 62 + 125 * Math.pow(l, .9); a[i] = v; a[i + 1] = v + 2; a[i + 2] = v + 7; }
    x.putImageData(D, 0, 0); G.m3 = { ...G.m3, atlas: c.toDataURL("image/jpeg", .92) }; G.base = { r: 110, g: 112, b: 117, lum: 112 }; }
  if (d.g.key !== key) d.pickGarment(key, false);          // (Hose ist evtl. schon gewählt; ein zweiter Klick würde sie abwählen)
  return { stoff: d.STOFFE[G.fabric] ? G.fabric : "(aus Material)", label: G.label }; }, [HOSE.key, STOFF, FARBE, WERTE]);
if (info.fehler) { console.log(info.fehler); process.exit(2); }
// Frontal-Scan: Stehen von vorn aus demselben Satz Clips (verkleinert, im Clip ist der Kopf angeschnitten)
const SCAN = path.basename(CLIP).startsWith("v1") ? "assets/referenz/videos/clips/v1-01_stehen-neutral-vorne.mp4" : "assets/referenz/videos/clips/v2-01_stehen-neutral-vorne.mp4";
{ const dauer = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", R + SCAN]).toString();
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(Math.min(1.5, dauer / 2)), "-i", R + SCAN, "-frames:v", "1", TMP + "/scan.jpg"]); }
const bild = f => "data:image/jpeg;base64," + fs.readFileSync(TMP + "/" + f).toString("base64");
// Alles mit virtueller Uhr und genau einer Erkennung je Bild (auch Scan und Stoff-Fall): gleiche Eingabe → gleiches Ergebnis
await p.evaluate(([src, k]) => window.__setRef(src, k), [bild("scan.jpg"), KK]);
await p.evaluate(() => { window.__ta = window.__ta || []; window.__uhr.an(); });
await p.click("#start");
for (let t = 0; t < 240 && !(await p.evaluate(() => document.getElementById("placeholder").hidden)); t++) await p.waitForTimeout(250);   // Kamera und Modell bereit
const nAna = () => p.evaluate(() => window.__ta.length);
const schritt = async () => { const n0 = await nAna(); await p.evaluate(ms => { window.__uhr.weiter(ms); window.__frei(1); }, 1000 / FPS);
  for (let k = 0; k < 400 && (await nAna()) <= n0; k++) await p.waitForTimeout(15); };
let gescannt = false;
for (let t = 0; t < 300 && !gescannt; t++) { await schritt(); gescannt = await p.evaluate(() => document.getElementById("step-cal").classList.contains("done")); }
await p.evaluate(([src, k]) => window.__setRef(src, k), [bild(frames[0]), KK]); await p.waitForTimeout(150); await p.click("#clean").catch(() => {});
for (let t = 0; t < 45; t++) await schritt();                      // 1,5 s einschwingen (Stoff-Fall wird dabei fertig)
if (process.env.STOFF_LOG) console.log("Zeichnen:", JSON.stringify(await p.evaluate(() => { const d = window.__dbg, ov = document.getElementById("overlay"), v = document.getElementById("video");
  const x = ov.getContext("2d"), px = x.getImageData(0, 0, ov.width, ov.height).data; let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 10) n++;
  let g3n = -1; try { const c = d.g3.c; if (c) { const t = document.createElement("canvas"); t.width = c.width; t.height = c.height; const tx = t.getContext("2d"); tx.drawImage(c, 0, 0); const q = tx.getImageData(0, 0, t.width, t.height).data; g3n = 0; for (let i = 3; i < q.length; i += 4) if (q[i] > 10) g3n++; } } catch (e) { g3n = String(e); }
  return { overlayPunkte: n, g3Punkte: g3n, videoFilter: getComputedStyle(v).filter, videoVis: getComputedStyle(v).visibility + "/" + getComputedStyle(v).opacity, ovStyle: getComputedStyle(ov).opacity + "/" + getComputedStyle(ov).visibility }; })));
if (process.env.STOFF_LOG) console.log("Zustand:", JSON.stringify(await p.evaluate(() => { const d = window.__dbg, G = d.GARMENTS[d.g.key] || {}; return { key: d.g.key, M: !!d.g3.M, cx: !!d.g3.cx, tex: d.g3.texReady, img: !!d.g.img, src: typeof G.src, srcLen: (G.src || "").length,
  trk: d.g.trk, unsicher: d.g.unsicher || "", show: d.g.show, clean: document.getElementById("stage").className, gescannt: document.getElementById("step-cal").classList.contains("done"),
  canvases: [...document.querySelectorAll("#stage canvas")].map(c => c.id + ":" + c.width + "x" + c.height + ":" + getComputedStyle(c).display + ":" + getComputedStyle(c).opacity) }; })));
const st = await p.$("#stage"), log = [], DUMP = process.argv.includes("--dumpPos"), hash = crypto.createHash("sha256"), posAlle = [];
let vorher = null;
for (let i = 0; i < frames.length; i++) {
  await p.evaluate(([src, k]) => window.__setRef(src, k), [bild(frames[i]), KK]); await p.waitForTimeout(80);
  await schritt();
  const r = await p.evaluate(dump => { const d = window.__dbg, g3 = d.g3, M = g3.M; if (!M || !g3.cx || !g3.tgRoh) return { leer: true };
    const NR = M.nr, C = 13, ic = g3.ic, X = g3.cx, T = g3.tgRoh, ppc = (g3.ppcL || 0) || null;
    // Abstand zur starren Form je Zeile (Mittel über den Ring, beide Beine), in Bildpunkten
    const ab = i => { let s = 0, n = 0; for (let sd = 0; sd < 2; sd++) for (let f = 0; f < 2; f++) for (let j = 0; j < C; j++) { const q = (((sd * NR + i) * 2 + f) * C + j) * 3; s += Math.hypot(X[q] - T[q], X[q + 1] - T[q + 1], X[q + 2] - T[q + 2]); n++; } return s / n; };
    const saum = (ab(NR - 1) + ab(NR - 2)) / 2, unter = ab(Math.round(ic + (NR - ic) * .7)), knie = ab(Math.round(ic + (NR - ic) * .45));
    // Saum-Mitte (für Ruck/Flattern), je Bein
    const mitte = sd => { let x = 0, y = 0, z = 0, n = 0; for (let f = 0; f < 2; f++) for (let j = 0; j < C; j++) { const q = (((sd * NR + NR - 1) * 2 + f) * C + j) * 3; x += X[q]; y += X[q + 1]; z += X[q + 2]; n++; } return [x / n, y / n, z / n]; };
    return { trk: +(window.__dbg.g.trk ?? 1).toFixed(2), uns: window.__dbg.g.unsicher || "", saum, unter, knie, m0: mitte(0), m1: mitte(1), ppc: window.__dbg.g.ppc || null, pos: dump ? Array.from(g3.pos.subarray(0, g3.nv * 3), v => Math.round(v * 100) / 100) : null }; }, DUMP);
  r.t = +(i / FPS).toFixed(3);
  if (r.pos) { hash.update(JSON.stringify(r.pos)); posAlle.push(...r.pos); delete r.pos; }
  log.push(r);
  if (i % JEDES === 0) await st.screenshot({ path: OUT + `${NAME}_${String(i).padStart(3, "0")}.jpg`, type: "jpeg", quality: 80 });
}
if (DUMP) fs.writeFileSync(OUT + NAME + "_punkte.bin", Buffer.from(new Float32Array(posAlle).buffer));   // alle Punkte der Hose je Bild (Vergleich zweier Läufe)
fs.writeFileSync(OUT + NAME + ".json", JSON.stringify({ clip: path.basename(CLIP), stoff: info.stoff, gescannt, fps: FPS, posHash: DUMP ? hash.digest("hex").slice(0, 16) : null, bilder: log }));
const ok = log.filter(q => !q.leer), mx = k => Math.max(...ok.map(q => q[k])), mean = k => ok.reduce((s, q) => s + q[k], 0) / Math.max(1, ok.length);
const sicht = log.filter(q => (q.trk ?? 1) > .5).length;
console.log(`${NAME}: Stoff ${info.stoff}, Scan ${gescannt ? "ok" : "NICHT fertig"}, ${ok.length}/${log.length} Bilder, Hose sichtbar in ${sicht}; Schwingen Saum Mittel ${mean("saum").toFixed(2)} / max ${mx("saum").toFixed(2)} px, Unterschenkel ${mean("unter").toFixed(2)} / ${mx("unter").toFixed(2)} px${DUMP ? ", Punkte " + JSON.parse(fs.readFileSync(OUT + NAME + ".json")).posHash : ""}${errs.length ? " | Fehler: " + errs.slice(0, 2).join(" | ") : ""}`);
await b.close(); srv.close(); fs.rmSync(TMP, { recursive: true, force: true });
