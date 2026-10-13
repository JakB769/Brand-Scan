/* Vergleich mit der Referenz: die echte Seite mit echter Erkennung (MediaPipe), als Kamerabild nacheinander Referenzfotos und
   Einzelbilder aus den Referenz-Clips (assets/referenz/). Die Hose wird aus Vorder- und Rückseite gebaut (Felder), dann je Bild:
   Bühne ohne Hose (Original), mit Hose, beides gemischt → nebeneinander in docs/vergleich/<zeit>/<name>.jpg.
     node werkzeuge/vergleich.mjs [--liste werkzeuge/vergleich-liste.json] [--nur name,name] [--aus dir] [--groesse 179]
                                  [--hose vorne.jpg,hinten.jpg] [--warten 3500] [--debug] [--seite datei.html]
   Seite: werkzeuge/tests/vergleichsseite.html (node werkzeuge/tests/baue-testseite.mjs --echt). Läuft gegen werkzeuge/server.mjs.
   MediaPipe aus node_modules, Modelle aus werkzeuge/tests/ausgabe/ (wie pruefstand.mjs). Kamera: getUserMedia liefert ein
   Canvas-Video, in das das jeweilige Referenzbild gezeichnet wird (Hochformat 720×1280 wie die Clips, Fotos mit Rand). */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true); };
const jetzt = new Date(), stempel = jetzt.toISOString().slice(0, 16).replace("T", "_").replace(":", "");
const liste = JSON.parse(fs.readFileSync(path.resolve(R, arg("liste", "werkzeuge/vergleich-liste.json")), "utf8"));
const nur = arg("nur", "") ? String(arg("nur")).split(",") : null, OUT = path.resolve(R, arg("aus", "docs/vergleich/" + stempel)) + "/";
const [VORNE, HINTEN] = String(arg("hose", "assets/referenz/fotos/flach-vorne-hinten/vorne.jpg,assets/referenz/fotos/flach-vorne-hinten/hinten.jpg")).split(",").map(f => path.resolve(R, f));
const GROESSE = String(arg("groesse", "179")), WARTEN = +arg("warten", 3500), DEBUG = !!arg("debug", false), SEITE = arg("seite", "werkzeuge/tests/vergleichsseite.html");
fs.mkdirSync(OUT, { recursive: true }); const TMP = fs.mkdtempSync("/tmp/vergleich-");

// Referenzbild als PNG-Daten: Foto direkt, Clip-Bild per ffmpeg
const bildDaten = it => {
  if (it.foto) return "data:image/jpeg;base64," + fs.readFileSync(path.resolve(R, it.foto)).toString("base64");
  const f = TMP + "/" + it.name + ".png";
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(it.t), "-i", path.resolve(R, it.clip), "-frames:v", "1", f]);
  return "data:image/png;base64," + fs.readFileSync(f).toString("base64");
};

const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 760, height: 1500 }, permissions: ["camera"] });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task", "pose_landmarker_lite.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/heic-to@1.6.5/**", r => r.fulfill({ status: 200, contentType: "application/javascript", headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(NM + "heic-to/dist/heic-to.min.js") }));
await ctx.route("**/fonts.g*/**", r => r.abort());
// Kamera = Canvas mit dem aktuellen Referenzbild (Hochformat 720×1280)
await ctx.addInitScript(() => {
  const c = document.createElement("canvas"); c.width = 720; c.height = 1280; const x = c.getContext("2d"); window.__refCanvas = c;
  const zeichne = () => { const im = window.__refImg; if (im) { x.fillStyle = window.__refRand || "#888"; x.fillRect(0, 0, 720, 1280);
      const k = Math.min(720 / im.width, 1280 / im.height), w = im.width * k, h = im.height * k; x.drawImage(im, (720 - w) / 2, (1280 - h) / 2, w, h); }
    else { x.fillStyle = "#777"; x.fillRect(0, 0, 720, 1280); } };
  setInterval(zeichne, 33); zeichne();
  window.__setRef = async src => { const im = new Image(); im.src = src; await im.decode();
    const t = document.createElement("canvas"); t.width = t.height = 1; const tx = t.getContext("2d"); tx.drawImage(im, 0, 0, 4, 4, 0, 0, 1, 1);
    const d = tx.getImageData(0, 0, 1, 1).data; window.__refRand = `rgb(${d[0]},${d[1]},${d[2]})`; window.__refImg = im; zeichne(); };
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = async () => c.captureStream(30);
    navigator.mediaDevices.enumerateDevices = async () => [{ kind: "videoinput", deviceId: "ref", label: "Referenz (front)", groupId: "ref", toJSON() { return this; } }];
  }
  if (!/[?&]debug/.test(location.search)) try { localStorage.removeItem("massScanDebug"); } catch (_) {}
});
if (DEBUG) await ctx.addInitScript(() => { try { localStorage.setItem("massScanDebug", "1"); } catch (_) {} });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/GL Driver|favicon|404/.test(m.text())) errs.push(m.text()); });
await p.goto(`http://localhost:${port}/${SEITE}`); await p.waitForTimeout(600);
// Bühne im Hochformat wie das Video, nicht gespiegelt, keine Ansagen
await p.addStyleTag({ content: ".stage{aspect-ratio:9/16!important;max-height:none!important;width:720px!important}.stage.mirror video,.stage.mirror canvas{transform:none!important}#coachBig,#coachSmall{display:none!important}" });
await p.fill("#height", GROESSE);

// Hose aus Vorder- und Rückseite (Felder), Kartenfenster bestätigen
const t0 = Date.now();
await p.setInputFiles("#slot-vorne input", VORNE); await p.waitForTimeout(400); await p.setInputFiles("#slot-hinten input", HINTEN);
let meldung = "";
for (let t = 0; t < 400; t++) { await p.waitForTimeout(500);
  const dlg = await p.evaluate(() => ["refDlg", "segDlg"].map(i => { const d = document.getElementById(i); return d && !d.hidden ? i + ":" + (document.getElementById(i === "refDlg" ? "refTxt" : "segTxt").innerText || "").slice(0, 90) + (i === "refDlg" && document.getElementById("refOk").disabled ? " [Passt gesperrt]" : "") : ""; }).filter(Boolean).join(" | "));
  if (dlg && process.env.VERGLEICH_LOG) console.log("FENSTER", dlg);
  if (/refDlg/.test(dlg)) { await p.click("#refOk").catch(() => {}); continue; }
  if (/segDlg/.test(dlg)) { await p.click("#segOk").catch(() => {}); continue; }
  meldung = await p.evaluate(() => document.getElementById("drop-msg").innerText.replace(/\n/g, " / "));
  if (/Fertig|keine realistische|fehlt/.test(meldung) && !/berechnet|wird/.test(meldung) && await p.evaluate(() => window.__dbg.UP.items.every(i => i.kind !== "wait"))) break; }
const hose = await p.evaluate(() => { const d = window.__dbg, G = d.GARMENTS[d.g.key]; return G ? { key: d.g.key, len: G.len, waist: G.waist, backEst: !!G.backEst, meas: G.meas || null } : null; });
console.log("HOSE", Math.round((Date.now() - t0) / 1000) + " s:", meldung.slice(0, 220), JSON.stringify(hose));
if (!hose) { console.log("Keine Hose gebaut, Abbruch."); await b.close(); srv.close(); process.exit(1); }

await p.evaluate(src => window.__setRef(src), bildDaten(liste[0]));
await p.click("#start"); await p.waitForTimeout(4000);
if (!DEBUG) await p.click("#clean").catch(() => {});
const st = await p.$("#stage"); await st.scrollIntoViewIfNeeded();
const fertigeListe = [];
for (const it of liste) {
  if (nur && !nur.includes(it.name)) continue;
  await p.evaluate(src => window.__setRef(src), bildDaten(it)); await p.waitForTimeout(WARTEN);
  await p.evaluate(() => { window.__dbg.g.opa = 1; }); await p.waitForTimeout(300);
  const mit = await st.screenshot();
  const info = await p.evaluate(() => { const d = window.__dbg; return { status: document.getElementById("statusText").textContent, yaw: +(d.g.yaw || 0).toFixed(2),
    form: d.g3 && d.g3.form ? { leib: +d.g3.form.leib.toFixed(1), tiefe: d.g3.form.tiefe ? +d.g3.form.tiefe.gesaess.toFixed(1) : null } : null }; });
  await p.evaluate(() => { window.__dbg.g.opa = 0; }); await p.waitForTimeout(450);
  const ohne = await st.screenshot();
  await p.evaluate(() => { window.__dbg.g.opa = 1; });
  // nebeneinander: Original | mit Hose | gemischt
  const jpg = await p.evaluate(async ([a, b2, titel]) => {
    const lade = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + s; });
    const A2 = await lade(a), B2 = await lade(b2), w = A2.width, h = A2.height, c = document.createElement("canvas"); c.width = w * 3; c.height = h + 34;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(A2, 0, 34); x.drawImage(B2, w, 34); x.drawImage(A2, 2 * w, 34); x.globalAlpha = .5; x.drawImage(B2, 2 * w, 34); x.globalAlpha = 1;
    x.fillStyle = "#000"; x.font = "bold 18px sans-serif"; x.fillText("Original · " + titel, 8, 23); x.fillText("3D-Hose", w + 8, 23); x.fillText("gemischt 50 %", 2 * w + 8, 23);
    return c.toDataURL("image/jpeg", .82); }, [ohne.toString("base64"), mit.toString("base64"), it.name]);
  fs.writeFileSync(OUT + it.name + ".jpg", Buffer.from(jpg.split(",")[1], "base64"));
  fertigeListe.push({ ...it, ...info });
  console.log(it.name, JSON.stringify(info));
}
fs.writeFileSync(OUT + "liste.json", JSON.stringify({ zeit: jetzt.toISOString(), hose, meldung, bilder: fertigeListe }, null, 1));
console.log("Ausgabe:", OUT, errs.length ? "Fehler: " + [...new Set(errs)].slice(0, 4).join(" | ") : "");
await b.close(); srv.close(); fs.rmSync(TMP, { recursive: true, force: true });
