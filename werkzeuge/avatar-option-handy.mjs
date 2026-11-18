/* „🧍 Eigener Avatar“ Ende zu Ende in Handy-Emulation (18.10.), mit der Attrappe als Person: Knopf oben → Einwilligung →
   Start („Geh ein paar Schritte zurück …“, zu nah: „Weiter zurück · Füße nicht sichtbar“) → Frontal-Scan → einmal drehen →
   Avatar mit Hose in der 3D-Ansicht → Hosen-Auswahl, Drehen (vorn/Seite/hinten), Zoom, Größe wechseln.
   Bilder je Gerät nach werkzeuge/tests/ausgabe/test-avatar/<gerät>_*.png, Zeiten in der Konsole.
     node werkzeuge/avatar-option-handy.mjs [--geraet "iPhone 13"|"Pixel 7"|alle] */
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", OUT = R + "werkzeuge/tests/ausgabe/test-avatar/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const GER = arg("geraet", "alle") === "alle" ? ["iPhone 13", "Pixel 7"] : [arg("geraet")];
fs.mkdirSync(OUT, { recursive: true });
let fehler = 0; const pruefe = (ok, t) => { console.log((ok ? "ok    " : "FEHLER") + " " + t); if (!ok) fehler++; };
const srv = await starte(0), port = srv.address().port;
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const name of GER) {
  const kurz = name.toLowerCase().replace(/\s+/g, "");
  const ctx = await b.newContext({ ...devices[name], permissions: ["camera"] });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  const bild = async (datei, sel) => { const el = sel ? await p.$(sel) : null; if (el) await el.screenshot({ path: OUT + kurz + "_" + datei }); else await p.screenshot({ path: OUT + kurz + "_" + datei }); };
  await p.goto(`http://localhost:${port}/werkzeuge/tests/testseite-mit-simulierter-person.html`); await p.waitForTimeout(500);
  await p.setInputFiles("#own-front", R + "material/produktfotos/front.jpg"); await p.setInputFiles("#own-back", R + "material/produktfotos/back.jpg");
  await p.fill("#own-waist", "40"); await p.click("#own-go");
  await p.waitForFunction(() => /Fertig/.test(document.getElementById("own-msg").textContent), null, { timeout: 120000 });
  await p.fill("#height", "180"); await p.evaluate(() => { window.__mode.knieSchmal = 1; window.scrollTo(0, 0); });
  await p.waitForTimeout(300); await bild("0_start.png");
  // 1) zweiter Weg oben: „Eigener Avatar“ → Einwilligung
  await p.tap("#avOption"); await p.waitForTimeout(400);
  const dlg = await p.evaluate(() => !document.getElementById("avDlg").hidden);
  pruefe(dlg, `${name}: „Eigener Avatar“ öffnet die Einwilligung`); await bild("1_einwilligung.png");
  await p.evaluate(() => Object.assign(window.__mode, { zoom: 1.7, hueftY: .45, rand: "raten" }));
  await p.fill("#avGroesse", "180"); await p.tap("#avJa"); await p.waitForTimeout(3500);
  const nah = await p.evaluate(() => ({ big: document.getElementById("coachBig").textContent, small: document.getElementById("coachSmall").textContent }));
  pruefe(/zurück/i.test(nah.big) && /nicht sichtbar/.test(nah.small), `${name}: zu nah: „${nah.big} · ${nah.small}“`);
  await bild("2_zu-nah.png", "#stage");
  // 2) ganz ins Bild → Scan, dann drehen
  await p.evaluate(() => Object.assign(window.__mode, { zoom: 1, rand: "raten" }));
  const t0 = Date.now(); let st = "";
  for (let t = 0; t < 80 && st !== "drehen"; t++) { await p.waitForTimeout(250); st = await p.evaluate(() => window.__dbg.AVS.stufe); }
  pruefe(st === "drehen", `${name}: Frontal-Scan nach ${((Date.now() - t0) / 1000).toFixed(1)} s, jetzt drehen`);
  await bild("3_drehen.png", "#stage");
  await p.evaluate(() => { const t0 = performance.now(); window.__dreh = setInterval(() => { let y = ((performance.now() - t0) / 1000 * .55) % (2 * Math.PI); if (y > Math.PI) y -= 2 * Math.PI; window.__mode.yaw = y; }, 30); });
  for (let t = 0; t < 160; t++) { await p.waitForTimeout(250); if (await p.evaluate(() => !!window.__dbg.AV.form)) break; }
  await p.evaluate(() => { clearInterval(window.__dreh); window.__mode.yaw = 0; });
  const fertig = await p.evaluate(() => !!window.__dbg.AV.form);
  pruefe(fertig, `${name}: Avatar fertig nach ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (!fertig) { await ctx.close(); continue; }
  // 3) Ansicht: Hosen-Auswahl über dem Bild, drehen, zoomen, Größe wechseln
  await p.evaluate(() => document.getElementById("g3dbox").scrollIntoView({ block: "start" })); await p.waitForTimeout(1500);
  const n = await p.evaluate(() => document.getElementById("avHosen").shadowRoot.querySelectorAll("button").length);
  pruefe(n >= 1, `${name}: Hosen-Auswahl über der Ansicht (${n})`);
  for (const [k, t] of [["vorn", "0"], ["seite", "1.5708"], ["hinten", "3.1416"]]) {
    await p.tap(`.avansicht [data-ansicht="${t}"]`).catch(() => {}); await p.waitForTimeout(1800); await bild(`4_${k}.png`, "#g3dbox"); }
  await p.tap(`.avansicht [data-ansicht="0"]`).catch(() => {}); await p.tap("#avZoomEin").catch(() => {}); await p.tap("#avZoomEin").catch(() => {});
  await p.waitForTimeout(1500); const z = await p.evaluate(() => window.__dbg.v3d.zoom || 1);
  pruefe(z > 1.3, `${name}: Zoom ${z.toFixed(2)}`); await bild("5_zoom.png", "#g3dbox");
  await p.tap("#avReset").catch(() => {}); await p.waitForTimeout(600);
  const breit = () => p.evaluate(() => { const c = window.__dbg.g3.c; if (!c) return 0; const t = document.createElement("canvas"); t.width = c.width; t.height = c.height; const x = t.getContext("2d"); x.drawImage(c, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; let y0 = -1; for (let y = 0; y < c.height && y0 < 0; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 40) { y0 = y; break; }
    const y = y0 + 12; let x0 = 1e9, x1 = -1; for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 40) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); } return x1 - x0; });
  const groessen = await p.evaluate(() => [...document.querySelectorAll("#g-szrow .szchip")].map(x => x.textContent.trim().split(/\s/)[0]));
  console.log(`       Größen: ${groessen.join(", ")}`);
  if (groessen.length >= 2) {
    const kn = async i => { await p.evaluate(i => document.querySelectorAll("#g-szrow .szchip")[i].click(), i); await p.evaluate(() => document.getElementById("g3dbox").scrollIntoView({ block: "start" })); await p.waitForTimeout(2200); };
    await kn(0); const w0 = await breit(); await bild("6_groesse_klein.png", "#g3dbox");
    await kn(groessen.length - 1); const w1 = await breit(); await bild("6_groesse_gross.png", "#g3dbox");
    pruefe(w1 > w0, `${name}: Größe ${groessen[0]} → ${groessen[groessen.length - 1]} ändert die Hose am Avatar (Bund ${w0} → ${w1} Bildpunkte)`);
  } else pruefe(false, `${name}: Größenknöpfe gefunden`);
  // Ansicht-Knöpfe passen in die Breite (keiner abgeschnitten)
  const knopfRand = await p.evaluate(() => { const r = document.getElementById("g3dbox").getBoundingClientRect(); return [...document.querySelectorAll(".avansicht .chip")].every(b => { const q = b.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1; }); });
  pruefe(knopfRand, `${name}: Ansicht-Knöpfe ganz zu sehen`);
  pruefe(!errs.length, `${name}: keine Skriptfehler` + (errs.length ? ": " + errs.slice(0, 2).join(" | ") : ""));
  await ctx.close();
}
await b.close(); srv.close();
console.log(fehler ? `${fehler} Fehler` : "Eigener Avatar auf dem Handy in Ordnung"); process.exit(fehler ? 1 : 0);
