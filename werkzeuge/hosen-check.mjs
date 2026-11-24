/* Hosen-Check (24.11.): gespeicherte Hosen (JSON wie im Gerät, z. B. von hose-render.mjs bauen --json) durch die Qualitäts-Schranke
   der App schicken und von vorn, seitlich und hinten rendern (Produktform und Anprobe an der Puppe).
   Geprüft je Hose: Schranke (G.bad, Mängel), Ausrichtung (Merkmalswert > 0: Schlitz und Vordertaschen vorn, Gesäßtaschen hinten),
   Beine getrennt (in beiden Formen liegen ab 3 cm unter dem Schritt die Punkte des linken und des rechten Beins von vorn gesehen
   getrennt, kein Stoff dazwischen). Mit --falsch zusätzlich je Hose eine absichtlich falsch gedrehte Fassung (Vorder- und Rückseite
   vertauscht): die Schranke muss sie zurücktauschen (mit Rückenfoto) bzw. ausblenden (Rückseite geschätzt, Tauschen unmöglich), dazu
   eine Fassung mit Spitze im Umriss (muss ausgeblendet werden). Mit --modus: Regler „Stoff-Bewegung“ im Entwicklermodus sichtbar und
   wirksam, im Kundenmodus weg; fehlerhafte Hosen im Kundenmodus nicht angeboten, im Entwicklermodus mit Hinweis.
     node werkzeuge/hosen-check.mjs <hose.json> [...] [--aus docs/tests/hosen-check] [--falsch] [--modus] [--ohneBilder]
   Ergebnis: <aus>/<key>_<form>_<ansicht>.jpg und <aus>/hosen-check.json; Seite: werkzeuge/tests/vergleichsseite.html (--echt). */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const flag = n => process.argv.includes("--" + n);
const dateien = process.argv.slice(2).filter((x, i, a) => !x.startsWith("--") && a[i - 1] !== "--aus");
const AUS = path.resolve(R, arg("aus", "docs/tests/hosen-check")) + "/"; fs.mkdirSync(AUS, { recursive: true });
const hosen = dateien.map(f => JSON.parse(fs.readFileSync(path.resolve(f), "utf8")));
let fehler = 0; const pruefe = (ok, text) => { console.log((ok ? "ok    " : "FEHLER") + " " + text); if (!ok) fehler++; return ok; };

const srv = await starte(0), port = srv.address().port;
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 520, height: 1100 } });
await ctx.route("**/fonts.g*/**", r => r.abort());
await ctx.addInitScript(() => { try { localStorage.setItem("massScanPerson", JSON.stringify({ n: "", h: "179" })); localStorage.removeItem("massScanHosen");
  localStorage.setItem("passformModus", "entwickler"); localStorage.removeItem("passformStoffBewegung"); localStorage.removeItem("passformStoffStandard"); } catch (_) {} });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/werkzeuge/tests/vergleichsseite.html`); await p.waitForFunction(() => window.__dbg && window.__dbg.ausrichtungFuer, null, { timeout: 60000 });
// Hosen wie geteilte Hosen (hosen.json bzw. vorab in der Einzeldatei) übernehmen: geprüft wie beim Laden, nicht im Gerät gespeichert
// (16 Hosen passen nicht in den Speicher des Browsers)
const uebernehmen = L => p.evaluate(L => { const d = window.__dbg; for (const { key, G } of L) { const H = JSON.parse(JSON.stringify(G)); d.checkGarment(H); H.shared = true; d.GARMENTS[key] = H; } d.buildPicker(); }, L);
await uebernehmen(hosen);

// absichtlich fehlerhafte Fassungen (in der Seite: Atlas per Canvas tauschen)
if (flag("falsch")) {
  const neu = await p.evaluate(async H => {
    const d = window.__dbg, out = [];
    const lade = src => new Promise((res, rej) => { const m = new Image(); m.onload = () => res(m); m.onerror = rej; m.src = src; });
    for (const h of H) {
      const im = await lade(h.G.m3.atlas), cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext("2d").drawImage(im, 0, 0);
      const G = JSON.parse(JSON.stringify(h.G)); d.seitenTauschen(G.m3, cv); G.m3.atlas = cv.toDataURL("image/jpeg", .9); delete G.m3.ori;
      out.push({ key: h.key + "_falsch", G: { ...G, label: G.label + " (falsch gedreht)" } });
      if (!h.G.backEst) out.push({ key: h.key + "_falschgesch", G: { ...JSON.parse(JSON.stringify(G)), label: G.label + " (falsch gedreht, Rückseite geschätzt)", backEst: true } });
      const S = JSON.parse(JSON.stringify(h.G)); delete S.m3.ori; const i = Math.round(S.m3.nr * .7); S.m3.hw[i] *= 1.7;
      out.push({ key: h.key + "_spitze", G: { ...S, label: S.label + " (Spitze)" } });
    }
    return out; }, hosen);
  await uebernehmen(neu);
  hosen.push(...neu.map(h => ({ ...h, kuenstlich: true })));
}
// Schranke: alle Hosen prüfen lassen (wie beim Laden), dann Ergebnis je Hose
await p.evaluate(async () => { const d = window.__dbg; for (const k of Object.keys(d.GARMENTS)) { const q = d.ausrichtungFuer(k); if (q) await q; } });
const erg = {};
for (const h of hosen) {
  const r = await p.evaluate(k => { const G = window.__dbg.GARMENTS[k]; return G ? { label: G.label, bad: G.bad || null, maengel: G.qMaengel || [], ori: G.m3.ori || null, f0: G.m3.f[30] } : null; }, h.key);
  erg[h.key] = { ...r, kuenstlich: !!h.kuenstlich };
  if (!r) { pruefe(false, `${h.key}: nicht geladen`); continue; }
  const s = r.ori ? r.ori.s : null;
  if (h.key.endsWith("_falsch")) {
    const orig = hosen.find(x => x.key === h.key.replace(/_falsch$/, "")), ok = r.ori && r.ori.getauscht && !r.bad && r.f0.every((u, j) => Math.abs(u - orig.G.m3.f[30][j]) < 2e-3);
    pruefe(ok, `${r.label}: automatisch zurückgetauscht (vorher ${r.ori && r.ori.vorher}, nachher ${s}), angezeigt`);
  } else if (h.key.endsWith("_falschgesch")) pruefe(r.bad && r.maengel.some(m => /Schlitz/.test(m)), `${r.label}: ausgeblendet (${r.maengel.join(", ")})`);
  else if (h.key.endsWith("_spitze")) pruefe(r.bad && r.maengel.length > 0, `${r.label}: ausgeblendet (${r.maengel.join(", ")})`);
  else pruefe(!r.bad, `${r.label}: Schranke bestanden${r.bad ? " – NICHT: " + r.maengel.join(", ") : ""}; Schlitz vorn (Merkmal ${s}${r.ori && r.ori.getauscht ? ", getauscht" : ""})`);
}
// Bilder und Beine-getrennt je angezeigter Hose
let falschGezeigt = 0;
for (const h of hosen) {
  const r = erg[h.key]; if (!r || r.bad) continue;
  if (h.key.endsWith("_falsch") && falschGezeigt++) continue;   // zurückgetauschte Fassung: eine reicht als Bild (gleich dem Original)
  await p.evaluate(k => { const d = window.__dbg; if (d.g.key !== k) d.pickGarment(k, false); }, h.key);
  await p.waitForFunction(k => window.__dbg.g.key === k, h.key, { timeout: 30000 });
  await p.waitForTimeout(1200); await p.locator("#g3dview").scrollIntoViewIfNeeded();
  r.beine = {};
  for (const form of ["produkt", "anprobe"]) {
    await p.evaluate(f => { const d = window.__dbg; d.v3d.produkt = f === "produkt" ? undefined : false; d.g3.cOk = false; }, form);
    for (const [n, yaw] of [["vorn", 0], ["seite", Math.PI / 2], ["hinten", Math.PI]]) {
      await p.evaluate(y => { const v = window.__dbg.v3d; v.yaw = y; v.ziel = null; v.idle = performance.now() + 1e9; }, yaw);
      for (let t = 0; t < 40; t++) { if (await p.evaluate(() => { const c = window.__dbg.g3.drape; return !c || [...c.values()].every(j => j.done); })) break; await p.waitForTimeout(250); }
      await p.waitForTimeout(900);
      if (n === "vorn") r.beine[form] = await p.evaluate(() => {
        // von vorn: je Zeile ab 3 cm unter dem Schritt die Ringpunkte beider Beine (x); getrennt, wenn sie sich nicht überlappen
        const d = window.__dbg, g3 = d.g3, M = g3.M, NR = M.nr, C = 13, pos = g3.pos, ic = M.v.findIndex(v => v >= M.vc);
        const len = d.garmentDims(d.GARMENTS[d.g.key]).len || 100, iA = M.v.findIndex(v => v >= M.vc + 3 / len);
        let zu = 0, n = 0, minSp = 1e9; const ws = [];
        for (let i = Math.max(ic, iA); i < NR - 1; i++) { const xs = [0, 1].map(s => { const a = []; for (let f = 0; f < 2; f++) for (let j = 0; j < C; j++) a.push(pos[(((s * NR + i) * 2 + f) * C + j) * 3]); return [Math.min(...a), Math.max(...a)]; });
          const sp = Math.max(xs[1][0] - xs[0][1], xs[0][0] - xs[1][1]), w = Math.max(xs[0][1], xs[1][1]) - Math.min(xs[0][0], xs[1][0]); n++; ws.push(w);
          if (sp <= 0) zu++; minSp = Math.min(minSp, sp / w); }
        return { zeilen: n, verbunden: zu, kleinsterSpalt: +minSp.toFixed(4) }; });
      if (!flag("ohneBilder")) await (await p.$("#g3dview")).screenshot({ path: `${AUS}${h.key}_${form}_${n}.jpg`, type: "jpeg", quality: 85 });
    }
    const q = r.beine[form]; pruefe(q && q.zeilen > 5 && q.verbunden === 0, `${r.label}, ${form === "produkt" ? "Produktform" : "Anprobe"}: Beine ab 3 cm unter dem Schritt getrennt (${q ? q.verbunden + " von " + q.zeilen + " Zeilen verbunden" : "nicht gemessen"})`);
  }
}
// Modus: Regler und Ausblenden
if (flag("modus")) {
  const sichtbar = () => p.evaluate(() => [...document.querySelectorAll(".stoffbew")].map(e => !!(e.offsetWidth || e.offsetHeight) && getComputedStyle(e).display !== "none"));
  await p.evaluate(() => window.__dbg.modusSetzen(false));
  const sv = await sichtbar(); pruefe(sv.some(Boolean), `Entwicklermodus: Regler „Stoff-Bewegung“ sichtbar (${sv.join(", ")})`);
  const w = await p.evaluate(async () => { const r = document.querySelector("#g3dbox .stoffBewRange"); r.value = "80"; r.dispatchEvent(new Event("input", { bubbles: true }));
    const d = window.__dbg; return { wert: d.STOFFBEW.wert, gespeichert: localStorage.getItem("passformStoffBewegung"), wirkt: d.stoffBewegung() }; });
  pruefe(Math.abs(w.wert - .8) < 1e-6 && w.gespeichert === "0.8" && Math.abs(w.wirkt - .8) < 1e-6, `Regler wirkt sofort und wird gespeichert (${JSON.stringify(w)})`);
  const st = await p.evaluate(() => { document.querySelector("#g3dbox .stoffBewStd").click(); return localStorage.getItem("passformStoffStandard"); });
  pruefe(st === "0.8", `„Als Standard übernehmen“ setzt den Standard für den Kundenmodus (${st})`);
  await p.evaluate(() => { const r = document.querySelector("#g3dbox .stoffBewRange"); r.value = "20"; r.dispatchEvent(new Event("input", { bubbles: true })); window.__dbg.modusSetzen(true); });
  const sk = await sichtbar(), wk = await p.evaluate(() => window.__dbg.stoffBewegung());
  pruefe(!sk.some(Boolean) && Math.abs(wk - .8) < 1e-6, `Kundenmodus: kein Regler (${sk.join(", ")}), es gilt der Standard (${wk})`);
  const bad = Object.entries(erg).filter(([, r]) => r && r.bad).map(([k]) => k);
  if (bad.length) { const ang = await p.evaluate(() => { const d = window.__dbg; d.buildPicker(); const el = document.getElementById("avHosen"); return (el.produkte || []).map(x => x.id); });
    pruefe(bad.every(k => !ang.includes(k)), `Kundenmodus: fehlerhafte Hosen nicht angeboten (${bad.length} ausgeblendet)`);
    await p.evaluate(() => window.__dbg.modusSetzen(false));
    const hin = await p.evaluate(K => K.map(k => { const b = document.querySelector(`#gwrap .gbtn[data-g="${k}"]`); return b ? b.textContent : ""; }), bad);
    pruefe(hin.every(t => t.includes("Modell fehlerhaft – bitte Fotos neu hochladen")), `Entwicklermodus: Hinweis „Modell fehlerhaft – bitte Fotos neu hochladen“ bei ${bad.length} Hosen`); }
}
fs.writeFileSync(AUS + "hosen-check.json", JSON.stringify(erg, (k, v) => k === "f0" ? undefined : v, 1));
pruefe(!errs.length, "keine Seitenfehler" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
console.log(fehler ? `${fehler} FEHLER` : "alles ok");
await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
