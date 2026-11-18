/* Passform-Rechnung für die Testprofile: baut die Testhose aus den flachen Fotos mit Bankkarte (wie ein Händler), dann für
   Jakob 1,79 m, Fabian 1,87 m und Philip 1,70 m (Körpermaße nur aus der Größe, wie ohne Scan) je Größe und Zone das Urteil der App.
     node werkzeuge/passform-rechnung.mjs [--vorne <foto>] [--hinten <foto>]
   Ausgabe: Tabelle in der Konsole und werkzeuge/tests/ausgabe/passform-rechnung.json (Hose, Körper, Urteile). Gegenrechnung von
   Ergebnis in der Konsole. */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const VORNE = path.resolve(R, arg("vorne", "assets/referenz/fotos/flach-vorne-hinten/vorne.jpg")), HINTEN = path.resolve(R, arg("hinten", "assets/referenz/fotos/flach-vorne-hinten/hinten.jpg"));
const PROFILE = [["Jakob", 179], ["Fabian", 187], ["Philip", 170]];

const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 1000, height: 1300 } });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
for (const n of ["magic_touch.tflite", "pose_landmarker_full.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
await ctx.route("**/fonts.g*/**", r => r.abort());
await ctx.addInitScript(() => { window.__kiTest = true; });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/werkzeuge/tests/testseite-mit-simulierter-person.html`); await p.waitForTimeout(500);
await p.fill("#height", "179");
const dialoge = async () => { const offen = await p.evaluate(() => ["refDlg", "segDlg"].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(","));
  if (/refDlg/.test(offen)) { await p.click("#refOk").catch(() => {}); return true; } if (/segDlg/.test(offen)) { await p.click("#segOk").catch(() => {}); return true; } return false; };
await p.setInputFiles("#slot-vorne input", VORNE);
for (let t = 0, ruhig = 0; t < 240 && ruhig < 3; t++) { await p.waitForTimeout(500); if (await dialoge()) { ruhig = 0; continue; }
  ruhig = await p.evaluate(() => window.__dbg.UP.items.length > 0 && window.__dbg.UP.items.every(i => i.kind !== "wait")) ? ruhig + 1 : 0; }
await p.setInputFiles("#slot-hinten input", HINTEN);
for (let t = 0; t < 400; t++) { await p.waitForTimeout(500); if (await dialoge()) continue;
  const m = await p.evaluate(() => document.getElementById("drop-msg").innerText); if (/Fertig/.test(m) && !/berechnet|wird/.test(m)) break; }
const hose = await p.evaluate(() => { const d = window.__dbg, G = d.GARMENTS[d.g.key]; if (!G) return null;
  return { label: G.label, meas: G.meas, sizes: G.sizes, size: G.size, cut: d.cutOf(G), msg: document.getElementById("drop-msg").innerText,
    atlasKB: Math.round(G.m3.atlas.length * 3 / 4 / 1024), jsonKB: Math.round(JSON.stringify(G).length / 1024),
    je: (G.sizes || []).map(z => ({ n: z.n, est: !!z.est, ...d.sizeGarment(G, z) })) }; });
if (!hose || !hose.sizes) { console.log("Hose nicht gebaut oder ohne Größen:", hose && hose.msg, errs.slice(0, 3)); await b.close(); srv.close(); process.exit(1); }
const r1 = x => x == null ? null : Math.round(x * 10) / 10;
console.log(`Speicher: Stoffbild ${hose.atlasKB} KB, Hose gesamt ${hose.jsonKB} KB`);
console.log(`Hose: ${hose.label}, Schnitt ${hose.cut}, gemessen ${hose.sizes[hose.size].n} (Länge ${hose.meas ? hose.meas.len : "?"} cm aus ${hose.meas ? hose.meas.ref : "?"})`);
console.log("Größe   Bund  Hüfte  Ober.  Knie   Saum  Länge (Umfänge, cm)");
for (const z of hose.je) console.log(`${(z.est ? "≈" : " ") + z.n.padEnd(6)} ${[z.waist, z.hip, z.thigh, z.knee, z.hem, z.len].map(x => String(r1(x)).padStart(6)).join("")}`);
const aus = { hose, profile: [] };
for (const [name, h] of PROFILE) {
  await p.fill("#height", String(h)); await p.waitForTimeout(200);
  const r = await p.evaluate(() => { const d = window.__dbg, G = d.GARMENTS[d.g.key], B = d.bodyMeas(), A = d.sizeAll(G, B);
    return { B, best: A.best, je: A.V.map((v, k) => ({ n: G.sizes[k].n, f: v.f, Z: v.Z, grund: d.sizeReason(v) })), st: A.V[0].st.t }; });
  aus.profile.push({ name, h, ...r });
  console.log(`\n${name} ${h} cm: Körper Bund-Linie ${r1(r.B.waist + .25 * (r.B.hip - r.B.waist))}, Taille ${r1(r.B.waist)}, Hüfte ${r1(r.B.hip)}, Oberschenkel ${r1(r.B.thigh)}, Knie ${r1(r.B.knee)}, Bund→Boden ${r1(r.B.belt)} (${r.B.src}; ${r.st})`);
  for (const [k, z] of r.je.entries()) console.log(`  ${k === r.best ? "→" : " "} ${z.n.padEnd(6)} Spiel ${["bund", "huefte", "ober", "knie"].map(q => z.Z[q] ? (z.Z[q].e >= 0 ? "+" : "") + r1(z.Z[q].e) : "-").join(" / ")}  Saum ${r1(z.Z.laenge && z.Z.laenge.d)}  · ${z.grund}`);
}
fs.mkdirSync(A, { recursive: true }); fs.writeFileSync(A + "passform-rechnung.json", JSON.stringify(aus, null, 1));
console.log("\nAusgabe:", A + "passform-rechnung.json", errs.length ? "Fehler: " + [...new Set(errs)].slice(0, 3).join(" | ") : "");
await b.close(); srv.close();
