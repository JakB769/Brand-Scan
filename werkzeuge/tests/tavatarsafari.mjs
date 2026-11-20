/* Avatar-Scan in der Safari-Engine (WebKit) mit iPhone-Emulation (20.11.). WebKit hat hier keine Testkamera: die Kamera ist ein
   Canvas-Stream aus Einzelbildern der Referenzclips (Stehen v2-01 → Drehung v2-02 → Stehen). Geprüft: Kundenmodus → Eigenen Avatar
   erstellen → Einwilligung → Kamera → Erkennung läuft ohne Fehler (in WebKit scheiterte MediaPipe mit eigener OffscreenCanvas bei jedem
   Bild an „GLctx.activeTexture“; der Scan kam nie über „zurückgehen“ hinaus) → Scan von vorn → Drehung → „Scan fertig“ → eigener Avatar.
   Braucht WebKit: einmal `npx playwright install webkit && npx playwright install-deps webkit` (ggf. mit PLAYWRIGHT_BROWSERS_PATH).
   Ohne WebKit: Hinweis und Ende ohne Fehler (Exit 0), damit npm test auf Rechnern ohne WebKit weiterläuft.
     node werkzeuge/tests/tavatarsafari.mjs [--geraet "iPhone 13"] [--bilder] */
import { webkit, devices } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "../server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const GERAET = arg("geraet", "iPhone 13"), BILDER = process.argv.includes("--bilder"), OUT = R + "docs/tests/avatar/";
let fehler = 0; const pruefe = (ok, t) => { console.log((ok ? "ok    " : "FEHLER") + " " + t); if (!ok) fehler++; return ok; };
let b; try { b = await webkit.launch(); } catch (e) { console.log("WebKit nicht installiert, Test übersprungen (einmal: npx playwright install webkit && npx playwright install-deps webkit)."); process.exit(0); }

{ const T = R + "werkzeuge/tests/vergleichsseite.html";   // Seite mit Einblick und echter Erkennung, bei Bedarf neu
  if (!fs.existsSync(T) || fs.statSync(R + "app/index.html").mtimeMs > fs.statSync(T).mtimeMs) execFileSync(process.execPath, [R + "werkzeuge/tests/baue-testseite.mjs", "--echt"], { stdio: "inherit" }); }
// Einzelbilder der Kamera (10 Bilder/s): Stehen 3 s → Drehung → Stehen 6 s, verkleinert in die Mitte
const F = A + "safari_bilder/", C = R + "assets/referenz/videos/clips/", K = .76;
if (!fs.existsSync(F + "f140.jpg")) { fs.mkdirSync(F, { recursive: true });
  const sk = `scale=${Math.round(720 * K / 2) * 2}:${Math.round(1280 * K / 2) * 2},pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x8a857d,fps=10,setsar=1`;
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-t", "3", "-i", C + "v2-01_stehen-neutral-vorne.mp4", "-i", C + "v2-02_drehung-360.mp4", "-t", "6", "-i", C + "v2-01_stehen-neutral-vorne.mp4",
    "-filter_complex", `[0:v]${sk}[a];[1:v]${sk}[b];[2:v]${sk}[c];[a][b][c]concat=n=3:v=1[v]`, "-map", "[v]", "-q:v", "4", F + "f%03d.jpg"]); }
const nBilder = fs.readdirSync(F).filter(f => /^f\d+\.jpg$/.test(f)).length;

const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const ctx = await b.newContext({ ...devices[GERAET] });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task", "pose_landmarker_lite.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/fonts.g*/**", r => r.abort());
await ctx.addInitScript(n => { try { localStorage.setItem("passformModus", "kunde"); } catch (_) {}
  window.__gum = [];
  const c = document.createElement("canvas"); c.width = 720; c.height = 1280; const x = c.getContext("2d"), bilder = []; let i = 0;
  for (let k = 1; k <= n; k++) { const im = new Image(); im.src = "/werkzeuge/tests/ausgabe/safari_bilder/f" + String(k).padStart(3, "0") + ".jpg"; bilder.push(im); }
  setInterval(() => { const im = bilder[i % n]; if (im.complete && im.naturalWidth) { x.drawImage(im, 0, 0, 720, 1280); i++; } }, 100);
  const gum = async cons => { window.__gum.push(JSON.stringify(cons)); await new Promise(r => setTimeout(r, 300)); return c.captureStream(30); },
    enu = async () => [{ kind: "videoinput", deviceId: "ersatz", label: "Ersatzkamera (front)", groupId: "e", toJSON() { return this; } }];
  if (window.MediaDevices) { Object.defineProperty(MediaDevices.prototype, "getUserMedia", { value: gum, configurable: true, writable: true });
    Object.defineProperty(MediaDevices.prototype, "enumerateDevices", { value: enu, configurable: true, writable: true }); } }, nBilder);
const p = await ctx.newPage(); const errs = [], erk = [];
p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && /^ANALYSE/.test(m.text())) erk.push(m.text().slice(0, 200)); });
await p.goto(`http://localhost:${port}/werkzeuge/tests/vergleichsseite.html`); await p.waitForTimeout(2000);
pruefe(await p.evaluate(() => document.body.classList.contains("kunde")), `Safari-Engine (${await p.evaluate(() => navigator.userAgent.match(/Version\/[\d.]+/)?.[0] || "?")}), ${GERAET}, Kundenmodus`);
await p.locator("#avCard").scrollIntoViewIfNeeded(); await p.click("#avOption"); await p.waitForTimeout(400); await p.fill("#avGroesse", "179"); await p.click("#avJa");
const zustand = () => p.evaluate(() => { const d = window.__dbg, S = d.AVS || {}, v = document.getElementById("video"), tr = v.srcObject && v.srcObject.getVideoTracks()[0];
  return { stufe: S.stufe || "", on: !!S.on, kamera: !!(tr && tr.readyState === "live" && v.videoWidth > 0), avatar: !!(d.AV && d.AV.form), status: document.getElementById("avStatus").hidden ? "" : document.getElementById("avStatusText").innerText }; });
const warte = async (f, ms) => { const t0 = Date.now(); let z; while (Date.now() - t0 < ms) { z = await zustand(); if (f(z)) return z; await p.waitForTimeout(500); } return null; };
const t0 = Date.now();
let z = await warte(z => z.kamera, 15000); pruefe(!!z, "Kamera läuft");
z = await warte(z => z.stufe === "drehen" || !z.on, 120000); pruefe(!!z && z.stufe === "drehen", `Person erkannt, Scan von vorn fertig (nach ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
if (BILDER && z && z.on) await p.screenshot({ path: OUT + "safari_iphone_scan.jpg", type: "jpeg", quality: 70 });
pruefe(erk.length === 0, `Erkennung ohne Fehler in WebKit (${erk.length} Fehler${erk.length ? ": " + erk[0] : ""})`);
z = await warte(z => z.avatar && !z.on, 90000); pruefe(!!z, `eigener Avatar fertig (nach ${((Date.now() - t0) / 1000).toFixed(0)} s)${z ? "" : ", Hinweis: " + ((await zustand()).status || "–")}`);
if (z) { const m = await p.evaluate(() => { const d = window.__dbg, A = d.AV.form, S = d.avatarBauen(d.AV.kd, A.g, {}, A.H).m; return ["chest", "waist", "hip", "leg"].map(q => Math.abs(A.m[q] - S[q])); });
  pruefe(Math.max(...m) >= 1.5, `Avatar aus dem Scan, nicht der Standardkörper (größte Abweichung ${Math.max(...m).toFixed(1)} cm)`);
  if (BILDER) { await p.waitForTimeout(1500); await p.screenshot({ path: OUT + "safari_iphone_avatar.jpg", type: "jpeg", quality: 70 }); } }
pruefe(errs.length === 0, "keine Skriptfehler" + (errs.length ? ": " + [...new Set(errs)].slice(0, 3).join(" | ") : ""));
await b.close(); srv.close();
console.log(fehler ? `${fehler} Fehler` : "Avatar-Scan in Safari (WebKit) in Ordnung"); process.exit(fehler ? 1 : 0);
