/* Avatar-Selbst-Scan in Echtzeit (30.10.): wie am Handy, ohne virtuelle Uhr. Kamera = Referenzclips als Video (Stand-Clip, dann
   Dreh-Clip in Schleife), echte Erkennung (MediaPipe auf der CPU). Ablauf über den Knopf „🧍 Eigener Avatar“ → Einwilligung →
   Frontal-Scan → Drehung → Avatar. Alle 0,5 s: Stufe, Phase, große und kleine Ansage, Drehung, Fortschritt, Bilder/s.
   Ergebnis: ob der Avatar entsteht, nach welcher Zeit, und seine Maße gegen den Standardkörper.
     node werkzeuge/avatar-echtzeit.mjs [--geraet "iPhone 13"] [--cpu 1] [--max 120] [--hose 0|1] [--aus <Ordner>]
   Seite: werkzeuge/tests/vergleichsseite.html (node werkzeuge/tests/baue-testseite.mjs --echt). */
import { chromium, devices } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const GERAET = arg("geraet", ""), CPU = +arg("cpu", 1), MAX = +arg("max", 120), HOSE = arg("hose", "1") === "1";
const SCAN = arg("scan", "assets/referenz/videos/clips/v2-01_stehen-neutral-vorne.mp4"), DREH = arg("dreh", "assets/referenz/videos/clips/v2-02_drehung-360.mp4");
const OUT = path.resolve(R, arg("aus", "werkzeuge/tests/ausgabe/echtzeit")) + "/"; fs.mkdirSync(OUT, { recursive: true });
const TMP = fs.mkdtempSync("/tmp/echtzeit-");
const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
const dev = GERAET ? devices[GERAET] : { viewport: { width: 900, height: 1300 } };
const ctx = await b.newContext({ ...dev, permissions: ["camera"] });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task", "pose_landmarker_lite.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/fonts.g*/**", r => r.abort());
const webm = f => { const z = TMP + "/" + path.basename(f, ".mp4") + ".webm"; if (!fs.existsSync(z)) execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", R + f, "-c:v", "libvpx", "-b:v", "3M", "-an", z]); return z; };
// Stehen: der Stand-Clip ist nur 3 s lang (die erste Sekunde geht man noch zurück); ruhiger Teil ab 1,2 s vor und zurück, 4×
// hintereinander (etwa 14 s Stehen mit natürlichem Schwanken), wie jemand, der nach der Ansage still steht
const steh = () => { const z = TMP + "/steh.webm";
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", "1.2", "-i", R + SCAN, "-filter_complex", "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[c];[c]split=2[c1][c2];[c1][c2]concat=n=2:v=1[d];[d]split=2[d1][d2];[d1][d2]concat=n=2:v=1[o]", "-map", "[o]", "-c:v", "libvpx", "-b:v", "3M", "-an", z]); return z; };
const clips = { "/clip/scan.webm": process.argv.includes("--clipschleife") ? webm(SCAN) : steh(), "/clip/dreh.webm": webm(DREH) };
await ctx.route("**/clip/*.webm", r => { const f = clips[new URL(r.request().url()).pathname]; return f ? r.fulfill({ status: 200, contentType: "video/webm", body: fs.readFileSync(f) }) : r.abort(); });
await ctx.addInitScript(() => {
  const c = document.createElement("canvas"); c.width = 720; c.height = 1280; const x = c.getContext("2d");
  const v = document.createElement("video"); v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = "anonymous";
  // wie avatar-scan.mjs: Bild verkleinert in die Mitte (im Clip ist der Kopf oben angeschnitten), Rand grau
  const k = .82, zeichne = () => { x.fillStyle = "#8a857d"; x.fillRect(0, 0, 720, 1280); if (v.readyState >= 2) x.drawImage(v, 360 * (1 - k), 640 * (1 - k), 720 * k, 1280 * k); requestAnimationFrame(zeichne); };
  requestAnimationFrame(zeichne);
  window.__setClip = async src => { v.src = src; v.currentTime = 0; try { await v.play(); } catch (_) {} };
  window.__nAna = 0;
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = async () => c.captureStream(30);
    navigator.mediaDevices.enumerateDevices = async () => [{ kind: "videoinput", deviceId: "ref", label: "Referenz (front)", groupId: "ref", toJSON() { return this; } }];
  }
});
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" || m.type() === "warning") errs.push(m.type() + ": " + m.text().slice(0, 200)); });
await p.goto(`http://localhost:${port}/werkzeuge/tests/vergleichsseite.html`); await p.waitForTimeout(800);
await p.evaluate(() => { window.__ta = []; });
await p.fill("#height", "179");
if (HOSE) { await p.setInputFiles("#own-front", R + "material/produktfotos/front.jpg"); await p.setInputFiles("#own-back", R + "material/produktfotos/back.jpg"); await p.fill("#own-waist", "40"); await p.click("#own-go");
  await p.waitForFunction(() => /Fertig/.test(document.getElementById("own-msg").textContent), null, { timeout: 120000 }).catch(() => console.log("Hose nicht fertig")); }
const cdp = await ctx.newCDPSession(p); if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
await p.evaluate(src => window.__setClip(src), `http://localhost:${port}/clip/scan.webm`);
// Weg des Nutzers: Knopf oben „Eigener Avatar“ (ohne Hose: Knopf in der 3D-Ansicht)
await p.click("#avOption"); await p.waitForTimeout(400);
const dlg = await p.evaluate(() => !document.getElementById("avDlg").hidden);
console.log("Einwilligung offen:", dlg, "| Meldung:", await p.evaluate(() => (document.getElementById("error").hidden ? "" : document.getElementById("error").textContent).slice(0, 160)));
if (!dlg) { await b.close(); srv.close(); process.exit(1); }
await p.fill("#avGroesse", "179"); await p.click("#avMann"); await p.click("#avJa");
const t0 = Date.now(); let gedreht = false, letzte = "", ende = null;
for (let i = 0; i < MAX * 2; i++) {
  await p.waitForTimeout(500);
  const z = await p.evaluate(() => { const d = window.__dbg, S = d.AVS, P = S.proben || {};
    return { stufe: S.stufe, on: S.on, form: !!d.AV.form, rechnet: !!d.AV.rechnet, fehler: d.AV.fehler || "", big: document.getElementById("coachBig").textContent, small: document.getElementById("coachSmall").textContent,
      status: document.getElementById("statusText").textContent, yaw: +((d.fc.yaw || 0)).toFixed(2), bins: S.bins ? S.bins.size : 0,
      n: Object.values(P).map(a => a.length).join("/"), fps: (() => { const t = window.__ta || [], n = t.length - (window.__taN || 0); window.__taN = t.length; return n * 2; })(), cal: !!d.caps.cal }; });
  const t = ((Date.now() - t0) / 1000).toFixed(1), zeile = `${z.stufe}|${z.big}|${z.small}|${z.status}`;
  if (zeile !== letzte || i % 10 === 0) { console.log(`${t.padStart(5)} s  Stufe ${z.stufe || "-"}  „${z.big}“ / „${z.small}“  [${z.status}]  Drehung ${z.yaw}  Fächer ${z.bins}/24  Proben ${z.n}  ${z.fps} Bilder/s`); letzte = zeile; }
  if (z.stufe === "drehen" && !gedreht) { gedreht = true; await p.evaluate(src => window.__setClip(src), `http://localhost:${port}/clip/dreh.webm`); console.log(`${t.padStart(5)} s  → Dreh-Clip`); }
  if (z.form && !z.rechnet && !z.on) { ende = +t; break; }
  if (z.fehler) { console.log("Fehler:", z.fehler); break; }
}
const erg = await p.evaluate(() => { const d = window.__dbg; return d.AV.daten ? { p: d.AV.daten.p, m: d.AV.daten.m, z: d.AV.daten.z, lose: d.AV.daten.lose, kamera: d.AV.daten.kamera } : null; });
console.log(ende ? `AVATAR fertig nach ${ende} s` : "KEIN AVATAR nach " + MAX + " s");
console.log("Hinweis unter der 3D-Ansicht:", await p.evaluate(() => document.getElementById("avMsg").textContent));
if (erg) { console.log("Regler:", JSON.stringify(erg.p)); console.log("Ziele:", JSON.stringify(erg.z)); console.log("Maße:", JSON.stringify(erg.m)); }
fs.writeFileSync(OUT + "ergebnis.json", JSON.stringify({ geraet: GERAET || "Desktop", cpu: CPU, ende, erg, fehler: [...new Set(errs)].slice(0, 10) }, null, 1));
await (await p.$("#g3dview")).screenshot({ path: OUT + "avatar.png" }).catch(() => {});
console.log("Meldungen:", [...new Set(errs)].slice(0, 8).join(" | ") || "keine");
await b.close(); srv.close(); fs.rmSync(TMP, { recursive: true, force: true });
