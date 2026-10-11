/* Prüfstand: die echte Seite (app/index.html, echte MediaPipe-Erkennung) mit einem Foto als Kamerabild.
   So lässt sich ohne Handy prüfen, wo die Messpunkte liegen und wie die 3D-Hose an einer echten Person sitzt.
     node werkzeuge/pruefstand.mjs <foto.jpg|png> [größe_cm] [link] [sekunden] [debug 0|1]
   debug 1: Messlinien, Achsen und Messwerte; debug 0: nur die Hose (wie im Shop).
   Das Foto wird mit einfarbigem Rand auf 1280×720 gebracht (Farbe der Bildecke) und mit ffmpeg zu einem Video (.y4m),
   das Chromium als Kamera benutzt. Läuft gegen einen lokalen Server (werkzeuge/server.mjs, wird hier gestartet).
   Ergebnis: werkzeuge/tests/ausgabe/pruefstand.png und die Messwerte (window.__messung) in der Konsole.
   MediaPipe kommt aus node_modules, das Modell aus werkzeuge/tests/ausgabe/ (wie in tdateien.mjs); mit „link“ braucht der
   Server-Teil Netz (Shop-Seite holen). Fremde Fotos nur lokal benutzen, nicht ins Repo legen. */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const [foto, groesse = "175", link = "", sek = "12", debug = "1"] = process.argv.slice(2);
if (!foto || !fs.existsSync(foto)) { console.log("Aufruf: node werkzeuge/pruefstand.mjs <foto> [größe_cm] [link] [sekunden] [debug 0|1]"); process.exit(1); }
fs.mkdirSync(A, { recursive: true });
for (const n of ["pose_landmarker_full.task"]) if (!fs.existsSync(A + n)) { console.log(`Es fehlt ${A + n} (siehe tdateien.mjs, Modell von storage.googleapis.com).`); process.exit(1); }

const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
// 1) Bild auf 1280×720 bringen: Person 90 % der Höhe, Rand in der Farbe der oberen linken Ecke
const bild = await (await b.newContext()).newPage();
const png = await bild.evaluate(async data => {
  const im = new Image(); im.src = data; await im.decode();
  const c = document.createElement("canvas"); c.width = 1280; c.height = 720; const x = c.getContext("2d");
  const k = 648 / im.height, w = im.width * k; x.drawImage(im, 0, 0, 4, 4, 0, 0, 1280, 720);
  x.drawImage(im, (1280 - w) / 2, 36, w, 648); return c.toDataURL("image/png");
}, "data:image/" + (/\.png$/i.test(foto) ? "png" : "jpeg") + ";base64," + fs.readFileSync(foto).toString("base64"));
fs.writeFileSync(A + "pruefstand_bild.png", Buffer.from(png.split(",")[1], "base64"));
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-loop", "1", "-i", A + "pruefstand_bild.png", "-t", "1", "-r", "5", "-pix_fmt", "yuv420p", A + "pruefstand.y4m"]);
await b.close();

// 2) Seite mit diesem Bild als Kamera
const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b2 = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${A}pruefstand.y4m`, "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b2.newContext({ viewport: { width: 1100, height: 1300 }, permissions: ["camera"] });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/fonts.g*/**", r => r.abort());
if (debug === "1") await ctx.addInitScript(() => { try { localStorage.setItem("massScanDebug", "1"); } catch (_) {} });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/app/index.html`); await p.waitForTimeout(500);
await p.fill("#height", groesse);
if (link) { await p.fill("#link-in", link); await p.click("#link-go");
  for (let t = 0; t < 240; t++) { await p.waitForTimeout(500); const m = await p.evaluate(() => document.getElementById("drop-msg").innerText);
    if (/Fertig|keine realistische|lässt keine|ließ sich|geht hier noch nicht/.test(m) && !/wird|berechnet/.test(m)) { console.log("HOSE:", m.replace(/\n/g, " / ").slice(0, 400)); break; } } }
await p.addStyleTag({ content: "#coachBig,#coachSmall,#coachCount,#coachTurn{display:none!important}" });
await p.click("#start"); await p.waitForTimeout(+sek * 1000);
if (debug !== "1") await p.click("#clean");
const st = await p.$("#stage"); await st.scrollIntoViewIfNeeded(); await st.screenshot({ path: A + "pruefstand.png" });
const ms = await p.evaluate(() => { const m = window.__messung; if (!m) return null; const r = v => v == null ? v : +(+v).toFixed(3);
  return { status: document.getElementById("statusText").textContent, hueftY: r(m.hipY), bundY: r(m.beltY), schrittY: r(m.crotchY), shirt: m.shirt ? m.shirt.ys.map(r) : null,
    huefte: m.hipBand ? r(m.hipBand.w) : null, oberschenkel: m.legs.map(l => l.thigh ? r(l.thigh.w) : null), knie: m.legs.map(l => l.knee ? r(l.knee.w) : null) }; });
console.log("MESSUNG", JSON.stringify(ms));
console.log("Bild:", A + "pruefstand.png", errs.length ? "Fehler: " + errs.slice(0, 3).join(" | ") : "");
await b2.close(); srv.close();
