/* Eigener Avatar in Echtzeit mit einem Clip als Kamera (18.11.): wie am Handy, Bilder kommen in Echtzeit (keine virtuelle Uhr wie
   in avatar-scan.mjs), Erkennung echt (MediaPipe auf der CPU). Kamera: Chromium-Testkamera aus einer MJPEG-Datei, gebaut aus
   Stehen (v2-01, 3 s) → Drehung (Clip) → wieder Stehen (6 s), verkleinert in die Mitte (k, sonst ist der Kopf angeschnitten).
     node werkzeuge/avatar-echtzeit.mjs [--clip assets/referenz/videos/clips/v2-02_drehung-360.mp4] [--k .82] [--sek 120]
       [--knopf avOption|avScan] [--bild <png>] [--scanbild <png>]
   Ausgabe: Verlauf (Stufe, Hinweis, Fortschritt) und am Ende, ob der eigene Avatar in der 3D-Ansicht steht. Braucht ffmpeg. */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const CLIP = path.resolve(R, arg("clip", "assets/referenz/videos/clips/v2-02_drehung-360.mp4")), STEH = R + "assets/referenz/videos/clips/v2-01_stehen-neutral-vorne.mp4";
const K = +arg("k", .82), SEK = +arg("sek", 120), KNOPF = arg("knopf", "avOption"), TMP = fs.mkdtempSync("/tmp/avatar-kamera-"), MJ = TMP + "/kamera.mjpeg";
const sk = `scale=${Math.round(720 * K / 2) * 2}:${Math.round(1280 * K / 2) * 2},pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x8a857d,fps=30,setsar=1`;
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-t", "3", "-i", STEH, "-i", CLIP, "-t", "6", "-i", STEH, "-filter_complex",
  `[0:v]${sk}[a];[1:v]${sk}[b];[2:v]${sk}[c];[a][b][c]concat=n=3:v=1[v]`, "-map", "[v]", "-q:v", "5", "-f", "mjpeg", MJ]);
{ const T = R + "werkzeuge/tests/vergleichsseite.html";   // Seite veraltet? Dann neu erzeugen (echte Erkennung)
  if (!fs.existsSync(T) || fs.statSync(R + "app/index.html").mtimeMs > fs.statSync(T).mtimeMs) execFileSync(process.execPath, [R + "werkzeuge/tests/baue-testseite.mjs", "--echt"], { stdio: "inherit" }); }
const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-video-capture=" + MJ,
  "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 760, height: 1500 }, permissions: ["camera"] });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task", "pose_landmarker_lite.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/fonts.g*/**", r => r.abort());
await ctx.addInitScript(() => { window.__cpu = true; });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/werkzeuge/tests/vergleichsseite.html`); await p.waitForTimeout(800);
await p.click("#" + KNOPF); await p.waitForTimeout(300);
await p.fill("#avGroesse", "179"); await p.click("#avMann"); await p.click("#avJa");
const t0 = Date.now(); let alt = "", fertig = false, scanbild = arg("scanbild");
while (Date.now() - t0 < SEK * 1000) { await p.waitForTimeout(1000);
  const z = await p.evaluate(() => { const d = window.__dbg, S = d.AVS || {}, P = S.proben || {}, t = id => (document.getElementById(id) || {}).innerText || "";
    return { stufe: S.stufe || "-", on: !!S.on, hinweis: (t("coachBig") + " | " + t("coachSmall")).replace(/\s+/g, " ").trim(), sek: S.bins ? S.bins.size : 0,
      proben: P.vorn ? [P.vorn.length, P.hinten.length, P.seiteL.length, P.seiteR.length].join("/") : "", rechnet: !!(d.AV && d.AV.rechnet), avatar: !!(d.AV && d.AV.form), fehler: d.AV && d.AV.fehler || "" }; });
  const s = `${z.stufe}${z.on ? "" : "(aus)"} · ${z.hinweis} · Sektoren ${z.sek}/24 · Proben v/h/sL/sR ${z.proben}${z.rechnet ? " · rechnet" : ""}${z.fehler ? " · FEHLER " + z.fehler : ""}`;
  // Scan-Oberfläche mitten in der Drehung festhalten (Fortschritt, Mini-Avatar)
  if (scanbild && z.stufe === "drehen" && z.sek >= 10) { const ok = await p.evaluate(() => !document.getElementById("scanUI").hidden);
    await (await p.$("#stage")).screenshot({ path: path.resolve(scanbild) }); console.log("Scan-Oberfläche:", ok ? "sichtbar" : "FEHLT", "→", scanbild); scanbild = null; }
  if (s !== alt) { console.log(`${Math.round((Date.now() - t0) / 1000)} s: ${s}`); alt = s; }
  if (z.avatar) { fertig = true; break; } }
await p.waitForTimeout(2500);
const ok = await p.evaluate(() => { const d = window.__dbg; return !!(d.AV && d.AV.form) && !document.getElementById("g3dbox").hidden; });
if (arg("bild")) await p.screenshot({ path: path.resolve(arg("bild")) });
if (ok) console.log("Avatar:", JSON.stringify(await p.evaluate(() => { const d = window.__dbg, A = d.AV.form, D = d.AV.daten, S = d.avatarBauen(d.AV.kd, A.g, {}, A.H).m, r = x => Math.round(x * 10) / 10;
  const k = ["shoulder", "chest", "waist", "hip", "thigh", "knee", "leg"].filter(q => A.m[q] > 0);
  return { np: d.AV.np, lose: D.lose, kamera: D.kamera, ohneTiefe: D.ohneTiefe, rest: D.rest, ziele: D.z, regler: Object.fromEntries(Object.entries(D.p).filter(([, v]) => Math.abs(v) > .01).map(([q, v]) => [q, r(v * 100) / 100])),
    avatar: Object.fromEntries(k.map(q => [q, r(A.m[q])])), standard: Object.fromEntries(k.map(q => [q, r(S[q])])) }; })));
console.log(ok ? `Eigener Avatar steht in der 3D-Ansicht (nach ${Math.round((Date.now() - t0) / 1000)} s)` : "FEHLER: kein eigener Avatar" + (fertig ? " sichtbar" : " berechnet"), errs.length ? "| Skriptfehler: " + [...new Set(errs)].slice(0, 3).join(" | ") : "");
await b.close(); srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); process.exit(ok ? 0 : 1);
