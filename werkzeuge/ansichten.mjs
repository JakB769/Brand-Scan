/* Ansichten der 3D-Hose allein (ohne Kamerabild): Testseite mit Attrappe in festen Posen (vorne, seitlich, hinten, Knie hoch,
   Ferse zum Gesäß, Hocke, Ausfallschritt, Spagat), dazu die exportierte 3D-Datei (.glb) und, wenn Blender da ist, Renders der
   Ruheform von vorne/seitlich/hinten/schräg (werkzeuge/python/render_glb.py). Ergebnis: <aus>/ansichten.jpg (Übersicht),
   <aus>/pose_*.png, <aus>/hose.glb, <aus>/render_*.png.
     node werkzeuge/ansichten.mjs [--aus docs/nachher/ansichten] [--stand <git-rev>] [--hose vorne.jpg,hinten.jpg] [--groesse 179]
                                  [--bund 39.6]   (Bundweite flach in cm, wenn keine Karte im Bild ist: Einzel-Formular)
   --stand: Seite aus einem älteren Commit bauen (app/index.html und baue-testseite.mjs von dort, Attrappe von jetzt), z. B. für
   docs/vorher. --schnell: nur die Posen (keine .glb, keine Blender-Renders). --seite: fertige Testseite nehmen (z. B. aus einer Arbeitskopie, während eine Testreihe läuft). Hose standardmäßig die Flachlage der Referenz-Jeans (assets/referenz/fotos/flach-vorne-hinten/). */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const SCHNELL = process.argv.includes("--schnell"), OUT = path.resolve(R, arg("aus", "docs/nachher/ansichten")) + "/", STAND = arg("stand", null), GROESSE = String(arg("groesse", "179")), BUND = arg("bund", null);
const [VORNE, HINTEN] = String(arg("hose", "assets/referenz/fotos/flach-vorne-hinten/vorne.jpg,assets/referenz/fotos/flach-vorne-hinten/hinten.jpg")).split(",").map(f => path.resolve(R, f));
fs.mkdirSync(OUT, { recursive: true });
const TMP = fs.mkdtempSync("/tmp/ansichten-");

// Testseite bauen: jetziger Stand oder ein älterer Commit (dessen app/index.html + baue-testseite.mjs, Attrappe von jetzt)
let seite = TMP + "/seite.html";
if (arg("seite", null)) seite = path.resolve(arg("seite"));
else if (STAND) {
  fs.mkdirSync(TMP + "/baum/werkzeuge/tests", { recursive: true }); fs.mkdirSync(TMP + "/baum/app", { recursive: true });
  const zeige = f => execFileSync("git", ["-C", R, "show", STAND + ":" + f], { maxBuffer: 64 << 20 });
  fs.writeFileSync(TMP + "/baum/app/index.html", zeige("app/index.html"));
  fs.writeFileSync(TMP + "/baum/werkzeuge/tests/baue-testseite.mjs", zeige("werkzeuge/tests/baue-testseite.mjs"));
  fs.copyFileSync(R + "werkzeuge/tests/attrappe.js", TMP + "/baum/werkzeuge/tests/attrappe.js");
  execFileSync("node", [TMP + "/baum/werkzeuge/tests/baue-testseite.mjs", seite], { stdio: "inherit" });
} else execFileSync("node", [R + "werkzeuge/tests/baue-testseite.mjs", seite], { stdio: "inherit" });

const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ permissions: ["camera"], viewport: { width: 1100, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("file://" + seite); await p.waitForTimeout(500);
await p.fill("#height", GROESSE).catch(() => {});
let meldung = "";
if (BUND) {   // ohne Maßstab im Bild: Einzel-Formular mit Bundweite (flach, cm)
  await p.setInputFiles("#own-front", VORNE); await p.setInputFiles("#own-back", HINTEN); await p.fill("#own-waist", String(BUND)); await p.click("#own-go");
  await p.waitForFunction(() => /Fertig|keine realistische|fehlt/.test(document.getElementById("own-msg").textContent), null, { timeout: 90000 });
  meldung = await p.evaluate(() => document.getElementById("own-msg").textContent);
} else { await p.setInputFiles("#slot-vorne input", VORNE); await p.waitForTimeout(400); await p.setInputFiles("#slot-hinten input", HINTEN); }
for (let t = 0; t < (BUND ? 0 : 300); t++) { await p.waitForTimeout(500);
  const dlg = await p.evaluate(() => ["refDlg", "segDlg"].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(","));
  if (/refDlg/.test(dlg)) { await p.click("#refOk").catch(() => {}); continue; }
  if (/segDlg/.test(dlg)) { await p.click("#segOk").catch(() => {}); continue; }
  meldung = await p.evaluate(() => document.getElementById("drop-msg").innerText.replace(/\n/g, " / "));
  if (/Fertig|keine realistische|fehlt/.test(meldung) && !/berechnet|wird/.test(meldung) && await p.evaluate(() => window.__dbg.UP.items.every(i => i.kind !== "wait"))) break; }
console.log("HOSE:", meldung.slice(0, 200));

// 3D-Datei der Ruheform (mit Stoff-Fall)
await (await p.$("#g3dview")).scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(2500);
if (!SCHNELL) try { const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 20000 }), p.click("#g-glb")]); await dl.saveAs(OUT + "hose.glb"); }
catch (e) { console.log("Keine 3D-Datei:", e.message.split("\n")[0]); }

// Anprobe mit der Attrappe, Posen nacheinander
await p.click("#quick"); await p.waitForTimeout(500);
await p.waitForFunction(() => document.getElementById("step-cal").classList.contains("done"), null, { timeout: 30000 });
await p.waitForTimeout(1500); await p.click("#clean").catch(() => {});
const POSEN = [["vorne", {}], ["schraeg", { yaw: .7 }], ["seitlich", { yaw: 1.45 }], ["hinten", { yaw: 3.1 }], ["knie_hoch", { kneeHigh: 1 }],
  ["knie_hoch_seitlich", { kneeHigh: 1, yaw: 1.45 }], ["ferse_gesaess", { fersePo: 1, yaw: .7 }], ["hocke", { hocke: 1 }], ["hocke_seitlich", { hocke: 1, yaw: 1.45 }],
  ["ausfallschritt", { ausfall: 1, yaw: .7 }], ["spagat_seitlich", { spagat: 1 }], ["spagat_laengs", { spagat: 2, yaw: 1.45 }],
  // nah (Beine füllen das Bild, wie in der Nahphase): Stoff und Relief im Detail, für den Vorher/Nachher-Vergleich der Textur
  ["nah_vorne", { zoom: 2.2 }], ["nah_hinten", { zoom: 2.2, yaw: 3.1 }], ["nah_seitlich", { zoom: 2.2, yaw: 1.2 }]];
const st = await p.$("#stage"); const bilder = [];
for (const [n, m] of POSEN) {
  await p.evaluate(m => Object.assign(window.__mode, { zoom: 1, rand: "raten", knee: 0, kneeHigh: 0, fersePo: 0, kneeWave: 0, yaw: 0, hand: 0, sway: 0, ohneArme: 1,
    ausfall: 0, spagat: 0, liegestuetz: 0, hocke: 0 }, m), m);
  await p.waitForTimeout(2800);
  const f = OUT + "pose_" + n + ".png"; await st.screenshot({ path: f }); bilder.push([n, f]);
}
// Übersicht: Ausschnitt um die Hose (aus dem Bild ohne grauen Hintergrund geschätzt), 4 Spalten
const sheet = await p.evaluate(async liste => {
  const lade = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + s; });
  const ims = await Promise.all(liste.map(([, d]) => lade(d))), w = 300, h = 300, cols = 4, rows = Math.ceil(ims.length / cols);
  const c = document.createElement("canvas"); c.width = cols * w; c.height = rows * (h + 26); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  ims.forEach((im, k) => { const t = document.createElement("canvas"); t.width = im.width; t.height = im.height; const tx = t.getContext("2d"); tx.drawImage(im, 0, 0);
    const d = tx.getImageData(0, 0, im.width, im.height).data, bg = [d[0], d[1], d[2]]; let x0 = im.width, y0 = im.height, x1 = 0, y1 = 0;
    for (let y = 0; y < im.height; y += 2) for (let xx = 0; xx < im.width; xx += 2) { const i = (y * im.width + xx) * 4;
      if (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 60 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 14) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
    if (x1 <= x0) { x0 = 0; y0 = 0; x1 = im.width; y1 = im.height; }
    const s = Math.max(x1 - x0, y1 - y0) * 1.08 + 10, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, X = (k % cols) * w, Y = Math.floor(k / cols) * (h + 26);
    x.fillStyle = "#b9b9b9"; x.fillRect(X, Y + 26, w, h); x.drawImage(im, cx - s / 2, cy - s / 2, s, s, X, Y + 26, w, h);
    x.fillStyle = "#000"; x.font = "bold 15px sans-serif"; x.fillText(liste[k][0], X + 6, Y + 18); });
  return c.toDataURL("image/jpeg", .85); }, bilder.map(([n, f]) => [n, fs.readFileSync(f).toString("base64")]));
fs.writeFileSync(OUT + "ansichten.jpg", Buffer.from(sheet.split(",")[1], "base64"));
await b.close(); fs.rmSync(TMP, { recursive: true, force: true });

// Blender-Renders der 3D-Datei (falls vorhanden)
const PY = "/opt/bpyenv/bin/python";
if (!SCHNELL && fs.existsSync(OUT + "hose.glb") && fs.existsSync(PY)) {
  try { execFileSync(PY, [R + "werkzeuge/python/render_glb.py", OUT + "hose.glb", OUT], { stdio: "inherit", timeout: 900000 }); }
  catch (e) { console.log("Blender-Render fehlgeschlagen:", e.message.split("\n")[0]); }
}
console.log("Ausgabe:", OUT, errs.length ? "Fehler: " + [...new Set(errs)].slice(0, 3).join(" | ") : "");
