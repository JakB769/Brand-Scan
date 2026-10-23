/* Handy-Emulation mit echtem Video: Chromium als iPhone bzw. Pixel (Bildschirm, Touch, Kennung; kein echtes Safari), CPU
   gedrosselt (Chrome DevTools: Emulation.setCPUThrottlingRate), Kamera = Referenzclip (in einer Schleife abgespielt, 30 Bilder/s).
   Ablauf: Hose aus der Flachlage bauen, mit dem Stand-Clip scannen, dann der Bewegungs-Clip. Gemessen: Bilder je Sekunde der
   Erkennung, Rechenzeit je Bild (PERF.ms, mit Tempo-Anpassung wie am Handy), leichtes Modell an/aus, 3D-Auflösung, Nachlauf der
   Hose gegenüber der rohen Erkennung (Kreuzkorrelation Knie-Höhe roh ↔ Knochen der Hose). Video der Bühne nach <aus>.
     node werkzeuge/handy.mjs [--geraet "iPhone 13"|"Pixel 7"] [--cpu 4] [--clip assets/referenz/videos/clips/v1-02_knie-heben-vorne.mp4]
                              [--sek 12] [--aus docs/nachher/handy] [--oberteil]
   --oberteil (22.10.): dazu ein T-Shirt (material/testbilder/oberteile) anziehen; vorher die 3D-Ansicht (Avatar-Körper, Hose,
   T-Shirt) gedrosselt messen (Bilder/s, Rechenzeit je Bild) und je ein Bild der 3D-Ansicht und der Anprobe sichern.
   Seite: werkzeuge/tests/vergleichsseite.html (node werkzeuge/tests/baue-testseite.mjs --echt). */
import { chromium, devices } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const GERAET = arg("geraet", "Pixel 7"), CPU = +arg("cpu", 4), SEK = +arg("sek", 12);
const CLIP = arg("clip", "assets/referenz/videos/clips/v1-02_knie-heben-vorne.mp4"), SCAN = arg("scan", "assets/referenz/videos/clips/v2-01_stehen-neutral-vorne.mp4");
const OUT = path.resolve(R, arg("aus", "docs/nachher/handy")) + "/", name = GERAET.replace(/\s+/g, "-").toLowerCase() + "_cpu" + CPU;
const [VORNE, HINTEN] = ["assets/referenz/fotos/flach-vorne-hinten/vorne.jpg", "assets/referenz/fotos/flach-vorne-hinten/hinten.jpg"].map(f => R + f);
fs.mkdirSync(OUT, { recursive: true }); const TMP = fs.mkdtempSync("/tmp/handy-");

const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
const dev = devices[GERAET]; if (!dev) { console.log("Unbekanntes Gerät:", GERAET); process.exit(1); }
const ctx = await b.newContext({ ...dev, permissions: ["camera"], recordVideo: { dir: TMP, size: { width: dev.viewport.width, height: dev.viewport.height } } });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task", "pose_landmarker_lite.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/heic-to@1.6.5/**", r => r.fulfill({ status: 200, contentType: "application/javascript", headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(NM + "heic-to/dist/heic-to.min.js") }));
await ctx.route("**/fonts.g*/**", r => r.abort());
// Clips als WebM (Playwrights Chromium spielt kein H.264), über die Route mit richtigem Typ
const webm = f => { const z = TMP + "/" + path.basename(f, ".mp4") + ".webm";
  if (!fs.existsSync(z)) execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", R + f, "-c:v", "libvpx", "-b:v", "3M", "-an", z]); return z; };
const clips = { "/clip/scan.webm": webm(SCAN), "/clip/bewegung.webm": webm(CLIP) };
await ctx.route("**/clip/*.webm", r => { const f = clips[new URL(r.request().url()).pathname];
  return f ? r.fulfill({ status: 200, contentType: "video/webm", body: fs.readFileSync(f) }) : r.abort(); });
// Kamera = Video des Clips, auf eine Leinwand gezeichnet (Hochformat 720×1280); Tempo-Anpassung wie am Handy (__perfTest)
await ctx.addInitScript(() => {
  window.__perfTest = 1; window.__ta = []; window.__t3d = [];
  const c = document.createElement("canvas"); c.width = 720; c.height = 1280; const x = c.getContext("2d");
  const v = document.createElement("video"); v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = "anonymous"; window.__clipVideo = v;
  const zeichne = () => { if (v.readyState >= 2) x.drawImage(v, 0, 0, 720, 1280); else { x.fillStyle = "#777"; x.fillRect(0, 0, 720, 1280); } requestAnimationFrame(zeichne); };
  requestAnimationFrame(zeichne);
  window.__setClip = async src => { v.src = src; v.currentTime = 0; try { await v.play(); } catch (_) {} };
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = async () => c.captureStream(30);
    navigator.mediaDevices.enumerateDevices = async () => [{ kind: "videoinput", deviceId: "ref", label: "Referenz (front)", groupId: "ref", toJSON() { return this; } }];
  }
  try { localStorage.removeItem("massScanDebug"); } catch (_) {}
});
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/werkzeuge/tests/vergleichsseite.html`); await p.waitForTimeout(600);
await p.fill("#height", "179");
await p.setInputFiles("#slot-vorne input", VORNE); await p.waitForTimeout(400); await p.setInputFiles("#slot-hinten input", HINTEN);
for (let t = 0; t < 300; t++) { await p.waitForTimeout(500);
  const dlg = await p.evaluate(() => ["refDlg", "segDlg"].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(","));
  if (/refDlg/.test(dlg)) { await p.click("#refOk").catch(() => {}); continue; }
  if (/segDlg/.test(dlg)) { await p.click("#segOk").catch(() => {}); continue; }
  if (/Fertig/.test(await p.evaluate(() => document.getElementById("drop-msg").innerText)) && await p.evaluate(() => window.__dbg.UP.items.every(i => i.kind !== "wait"))) break; }
// Drosselung erst für die Anprobe (Bau der Hose und Scan sind einmalig und hier nicht gemessen)
const cdp = await ctx.newCDPSession(p);
const OBERTEIL = process.argv.includes("--oberteil"); let ansicht3d = null;
if (OBERTEIL) {
  const ob = R + "material/testbilder/oberteile/";
  await p.setInputFiles("#ot-hinten input", ob + "tshirt_hinten.jpg"); await p.setInputFiles("#ot-vorne input", ob + "tshirt_vorne.jpg");
  await p.waitForFunction(() => /Fertig|nicht/.test(document.getElementById("ot-msg").textContent), null, { timeout: 120000 }).catch(() => console.log("Oberteil nicht fertig"));
  await (await p.$("#g3dview")).scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }); await p.waitForTimeout(1500);
  ansicht3d = await p.evaluate(async () => { const t = []; let l = performance.now(); const t0 = l;
    await new Promise(res => { const f = n => { t.push(n - l); l = n; if (n - t0 < 4000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    const s = t.slice(5).sort((a, b) => a - b); return { fps: +(1000 / s[s.length >> 1]).toFixed(1), bild_ms_p90: +s[Math.floor(s.length * .9)].toFixed(1), rechenzeit_ms: +(window.__dbg.v3d.teuer || 0).toFixed(1) }; });
  // nur JavaScript je Bild (ohne Grafik, die hier in Software rechnet): Haltung von Körper und Oberteil wie live, Oberteil über
  // der Hose, dazu einmal die Vorlage bauen
  ansicht3d.js = await p.evaluate(() => { const d = window.__dbg, A = d.otKoerper(), O = d.otAktiv(), V = d.otFuer(O, A), kd = d.AV.kd, med = a => a.sort((x, y) => x - y)[a.length >> 1];
    const z = { oaL: [.3, -.9, .3], uaL: [.1, -.5, .9], oaR: [-.2, -1, 0], uaR: [-.1, -1, .2], rumpf: [.05, 1, .02] }, th = [], tk = [], tu = [];
    for (let i = 0; i < 25; i++) { let t = performance.now(); const K = d.avatarKnochen(A.gel, z); d.avatarHaltung(V.gew, V.P, V.N, K, V.n); th.push(performance.now() - t);
      t = performance.now(); d.avatarHaltung(kd.gew, A.P, null, K, kd.nV); tk.push(performance.now() - t);
      t = performance.now(); d.otUeberHose(V, 102, { cx: 360, floor: 900, ppc: 4, yw: .4 }); tu.push(performance.now() - t); }
    let t = performance.now(); d.otVorlage(kd, A, "tshirt", {}); const bau = performance.now() - t;
    return { oberteil_haltung_ms: +med(th).toFixed(1), koerper_haltung_ms: +med(tk).toFixed(1), ueber_hose_ms: +med(tu).toFixed(1), vorlage_bauen_ms: Math.round(bau) }; });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await (await p.$("#g3dview")).screenshot({ path: OUT + name + "_3d.png" });
  console.log("3D-Ansicht (Körper, Hose, T-Shirt):", JSON.stringify(ansicht3d));
}
await p.evaluate(src => window.__setClip(src), `http://localhost:${port}/clip/scan.webm`);
await p.click("#start");
await p.waitForFunction(() => document.getElementById("step-cal").classList.contains("done"), null, { timeout: 60000 }).catch(() => console.log("Scan nicht fertig nach 60 s"));
await p.click("#clean").catch(() => {});
await p.evaluate(src => window.__setClip(src), `http://localhost:${port}/clip/bewegung.webm`);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }); await p.waitForTimeout(1500);
await (await p.$("#stage")).scrollIntoViewIfNeeded();
if (OBERTEIL) setTimeout(() => p.$("#stage").then(e => e && e.screenshot({ path: OUT + name + "_anprobe.png" })).catch(() => {}), SEK * 500);
// Messen: je Bild der Erkennung (Wechsel von __Lraw) Zeit, Knie roh, Knie der Hose (Knochen), PERF
const { out: daten, t3d: formZeiten } = await p.evaluate(async ms => {
  const out = []; let last = null; const t0 = performance.now(), vh = () => window.__vw ? window.__vw[1] : 1280;
  await new Promise(res => { const f = () => { const L = window.__Lraw, B = window.__bone;
      if (L && L !== last && B) { last = L; const k = L[25].y < L[26].y ? 0 : 1;   // höheres Knie (das sich hebt)
        const ta = window.__ta || []; out.push({ t: performance.now() - t0, roh: [L[25].y * vh(), L[26].y * vh()], hose: [B[0][1].y, B[1][1].y], ms: window.__dbg.PERF.ms, rs: window.__dbg.PERF.rs, lite: window.__dbg.PERF.lite, trk: window.__dbg.g.trk, eigen: ta.length ? ta[ta.length - 1] : null }); }
      if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  return { out, t3d: (window.__t3d || []).slice(-200) }; }, SEK * 1000);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
const vid = await p.video().path(); await ctx.close(); await b.close(); srv.close();
// Auswertung: Bilder/s, Rechenzeit, Nachlauf (Knie-Höhe der Hose gegen roh, Verschiebung mit der besten Übereinstimmung)
const n = daten.length, dauer = n ? (daten[n - 1].t - daten[0].t) / 1000 : 0, fps = n > 1 ? (n - 1) / dauer : 0;
const lag = s => { const ts = daten.map(d => d.t), r = daten.map(d => d.roh[s]), h = daten.map(d => d.hose[s]);
  const at = (arr, t) => { let i = ts.findIndex(x => x >= t); if (i <= 0) return arr[Math.max(0, i)]; const u = (t - ts[i - 1]) / (ts[i] - ts[i - 1]); return arr[i - 1] + (arr[i] - arr[i - 1]) * u; };
  let best = 0, bv = -1; for (let d = 0; d <= 300; d += 10) { let sab = 0, sa = 0, sb = 0, saa = 0, sbb = 0, m = 0;
    for (let t = ts[0] + 400; t < ts[n - 1] - 400; t += 20) { const a = at(r, t), bb = at(h, t + d); sab += a * bb; sa += a; sb += bb; saa += a * a; sbb += bb * bb; m++; }
    const c = (sab - sa * sb / m) / Math.sqrt((saa - sa * sa / m) * (sbb - sb * sb / m) || 1); if (c > bv) { bv = c; best = d; } }
  const amp = arr => { const s2 = [...arr].sort((x, y) => x - y); return s2[Math.floor(s2.length * .95)] - s2[Math.floor(s2.length * .05)]; };
  return { ms: best, korr: +bv.toFixed(3), ausschlagRoh: Math.round(amp(r)), ausschlagHose: Math.round(amp(h)) }; };
const med = a => { const s2 = [...a].sort((x, y) => x - y); return s2[s2.length >> 1]; };
const eig = daten.map(d => d.eigen).filter(v => v != null), form = formZeiten || [];
const erg = { geraet: GERAET, cpu: CPU, clip: path.basename(CLIP), oberteil: OBERTEIL, ansicht3d, bilder: n, fps: +fps.toFixed(1), rechenzeit_ms: n ? Math.round(med(daten.map(d => d.ms))) : null,
  eigener_code_ms: eig.length ? { median: +med(eig).toFixed(1), p90: +[...eig].sort((x, y) => x - y)[Math.floor(eig.length * .9)].toFixed(1) } : null,
  form_js_ms: form.length ? { median: +med(form).toFixed(1), p90: +[...form].sort((x, y) => x - y)[Math.floor(form.length * .9)].toFixed(1) } : null,
  aufloesung3d: n ? daten[n - 1].rs : null, leichtesModell: n ? daten[n - 1].lite : null, ausgeblendet: daten.filter(d => d.trk < .5).length,
  nachlauf: n > 20 ? [lag(0), lag(1)] : null, fehler: [...new Set(errs)].slice(0, 3) };
console.log(JSON.stringify(erg));
fs.writeFileSync(OUT + name + ".json", JSON.stringify(erg, null, 1));
// Video: webm → mp4 (klein), nur der gemessene Teil am Ende
try { execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-sseof", String(-(SEK + 1)), "-i", vid, "-vf", "scale=360:-2", "-c:v", "libx264", "-crf", "30", "-pix_fmt", "yuv420p", "-an", OUT + name + ".mp4"]); }
catch (e) { console.log("Video nicht umgewandelt:", e.message.split("\n")[0]); }
fs.rmSync(TMP, { recursive: true, force: true });
