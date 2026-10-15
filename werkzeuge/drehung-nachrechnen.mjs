/* Drehung nachrechnen ohne Browser: bodyYaw aus app/index.html (oder --datei) auf die aufgenommenen Körperpunkte von
   werkzeuge/drehung.mjs --punkte anwenden. So lässt sich eine neue Drehungs-Logik in Sekunden prüfen.
     node werkzeuge/drehung-nachrechnen.mjs <punkte.json> [--datei app/index.html] [--png aus.png]
       [--luecke 4.0-5.0] [--blind 5.0-5.1] [--blind1 5.0-5.4] [--tausch 5.0,5.2] [--tauschJede 5.0-5.4]
   --luecke: Erkennung fehlt („Keine Person“), --blind: Person erkannt, beide Hüften nicht (Sichtbarkeit 0,2; die Hose ist dann
   ausgeblendet), --blind1: nur die rechte Hüfte (die Hose bleibt sichtbar), --tausch: je Zeit das erste Bild ab dort mit
   vertauschten Seiten (links/rechts), --tauschJede: jedes zweite Bild im Zeitraum vertauscht. Danach: Abstand der Hose zur
   Hose eines Laufs ohne diese Störungen, ab dem Ende einer Lücke/Verdeckung bzw. dem Beginn eines Vertauschens, 1,5 s lang
   (Bilder mehr als 90° daneben = Hose verkehrt herum; Bilder mit beiden Hüften verdeckt zählen nicht, die Hose ist dann aus).
   Ausgabe: größter Schritt je Bild, Schritte > 0,15 rad, Richtungswechsel, Abweichung von der Sollkurve des Referenzclips
   v2-02_drehung-360 (von Hand aus den Bildern: vorn 30° → seitlich 90° bei 1 s → Rücken 175–185° von 2,2 bis 3 s → seitlich
   270° bei 3,9 s → vorn 355° bei 4,9 s, dann vorn), Verzögerung gegen die Sollkurve. */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const log = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const src = fs.readFileSync(path.resolve(R, arg("datei", "app/index.html")), "utf8");
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error(name + " fehlt");
  let k = src.indexOf("{", i), t = 0; for (let j = k; j < src.length; j++) { if (src[j] === "{") t++; else if (src[j] === "}" && --t === 0) return src.slice(i, j + 1); } };
const helfer = ["const clamp=", "const sstep=", "const wrapA=", "const YAW_TAU="].map(h => { const i = src.indexOf(h); return i < 0 ? "" : src.slice(i, src.indexOf("\n", i)); }).join("\n");
const fenster = n => { const a = (arg(n, "") || "").split("-").map(Number); return t => a.length === 2 && t >= a[0] && t < a[1]; };
const inLuecke = fenster("luecke"), inBlind = fenster("blind"), inBlind1 = fenster("blind1"), inJede = fenster("tauschJede");
const TAUSCH = (arg("tausch", "") || "").split(",").filter(Boolean).map(Number);
const STOER = ["luecke", "blind", "blind1", "tausch", "tauschJede"].some(n => arg(n, null) != null);
const PAARE = [[11, 12], [13, 14], [15, 16], [23, 24], [25, 26], [27, 28], [29, 30], [31, 32], [1, 4], [2, 5], [3, 6], [7, 8], [9, 10], [17, 18], [19, 20], [21, 22]];
// ein Lauf über die ganze Aufnahme; mit stoer=false ohne Lücken, Verdecken und Vertauschen (Bezug für die Auswertung)
// je Bild (33,3 ms) der Wert nach der letzten Erkennung des Bildes
function lauf(stoer) {
  const ctx = { Math, Number, console, performance: { now: () => ctx.__t } };
  vm.createContext(ctx);
  vm.runInContext(helfer.replace(/^const /gm, "var ") + "\nvar fc=" + JSON.stringify({ w: 0, ...log[0].fc0 }) + ";\n" + fn("bodyYaw") + "\nthis.bodyYaw=bodyYaw;", ctx);
  const fr = new Map(), offen = TAUSCH.slice(); let jede = 0;
  for (const e of log) {
    const ts = (e.t - log[0].t) / 1000;
    if (stoer && inLuecke(ts)) continue;            // „Keine Person erkannt“: bodyYaw wird nicht gerufen
    ctx.__t = e.t; const L = e.L.map(([x, y, z, v]) => ({ x, y, z, visibility: v })), V = i => (L[i].visibility ?? 1) >= .4;
    if (stoer) {
      if (inBlind(ts)) for (const i of [23, 24]) L[i].visibility = .2;
      if (inBlind1(ts)) L[24].visibility = .2;
      const t1 = offen.findIndex(t => ts >= t), tausch = t1 >= 0 || (inJede(ts) && jede++ % 2 === 1);
      if (t1 >= 0) offen.splice(t1, 1);
      if (tausch) for (const [a, b] of PAARE) [L[a], L[b]] = [L[b], L[a]];
    }
    const yaw = ctx.bodyYaw(L, V, e.vw, e.vh, e.ppc);
    fr.set(Math.round((e.t - log[0].t) / (1000 / 30)), { yaw, roh: ctx.fc.roh ? ctx.fc.roh.m : null, sgn: ctx.fc.sgn, ts });
  }
  return fr;
}
const fr = lauf(true), bezug = STOER ? lauf(false) : fr;
const ks = [...fr.keys()].sort((a, b) => a - b), Y = ks.map(k => fr.get(k).yaw), T = ks.map(k => k / 30);
const wr = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
// Schritte nur zwischen Nachbarn ohne Lücke (bis 0,23 s; über eine Lücke hinweg ist die Hose nicht zu sehen)
const nb = k => k > 0 && ks[k] - ks[k - 1] <= 7;
const d = Y.slice(1).map((y, k) => nb(k + 1) ? wr(y - Y[k]) : 0);
let umk = 0; for (let k = 1; k < d.length; k++) if (nb(k) && Math.abs(d[k]) > .03 && Math.abs(d[k - 1]) > .03 && Math.sign(d[k]) !== Math.sign(d[k - 1])) umk++;
// Sollkurve (Grad), Richtung aus dem Vorzeichen der Hose bei 1 s
const SOLL = [[0, 30], [1, 90], [2.2, 175], [3, 185], [3.9, 270], [4.9, 355], [9, 360]];
const soll = t => { for (let k = 1; k < SOLL.length; k++) if (t <= SOLL[k][0]) { const [t0, a0] = SOLL[k - 1], [t1, a1] = SOLL[k]; return (a0 + (a1 - a0) * (t - t0) / (t1 - t0)) * Math.PI / 180; } return 2 * Math.PI; };
const iS = T.findIndex(t => t >= 1), dir = Math.sign(Y[iS] || 1);
const err = Y.map((y, k) => Math.abs(wr(y - dir * soll(T[k]))));
const imDreh = T.map((t, k) => t > .3 && t < 5.2 ? k : -1).filter(k => k >= 0), ruhig = T.map((t, k) => t > 5.6 && t < 7.2 ? k : -1).filter(k => k >= 0);
const mErr = a => a.reduce((s, k) => s + err[k], 0) / Math.max(1, a.length) * 180 / Math.PI;
const falsch = imDreh.filter(k => err[k] > Math.PI / 3).length;
// Verzögerung: Verschiebung der Sollkurve mit der kleinsten Abweichung während der Drehung
let best = [1e9, 0]; for (let lag = 0; lag <= .6; lag += 1 / 30) { const e = imDreh.reduce((s, k) => s + Math.abs(wr(Y[k] - dir * soll(T[k] - lag))), 0); if (e < best[0]) best = [e, lag]; }
// Verzögerung gegen die Rohschätzung (ungeglättet, Ruhezone eingerechnet) und Ruck (mittlere Änderung des Schritts je Bild)
const M = ks.map(k => fr.get(k).roh), roh = key => fr.has(key) ? fr.get(key).roh : null;
const eL = lag => { let e = 0, n = 0; for (const k of imDreh) { const m = roh(ks[k] - lag); if (m != null) { e += wr(Y[k] - m) ** 2; n++; } } return n ? e / n : 1e9; };
let bestR = [1e9, 0]; for (let lag = 0; lag <= 12; lag++) { const e = eL(lag); if (e < bestR[0]) bestR = [e, lag]; }
{ const l = bestR[1]; if (l > 0 && l < 12) { const a = eL(l - 1), b = eL(l), c = eL(l + 1), q = a - 2 * b + c; if (q > 0) bestR[1] = l + .5 * (a - c) / q; } }   // zwischen den Bildern
const r3 = imDreh.filter(k => k >= 2 && nb(k) && nb(k - 1));
const ruck = r3.reduce((t, k) => t + Math.abs(wr(Y[k] - Y[k - 1]) - wr(Y[k - 1] - Y[k - 2])), 0) / Math.max(1, r3.length);
const ueber = Math.max(0, ...ruhig.map(k => Math.abs(Y[k]))) * 180 / Math.PI;   // nach der Drehung von vorn: Überschwingen
console.log(`Überschwingen danach ${ueber.toFixed(1)}°`);
console.log(`Verzögerung zur Rohschätzung ≈ ${(bestR[1] * 1000 / 30).toFixed(0)} ms | Ruck ${(ruck * 1000).toFixed(1)} mrad/Bild²`);
console.log(`Bilder ${Y.length} | größter Schritt ${Math.max(...d.map(Math.abs)).toFixed(2)} rad | Schritte >0,15: ${d.filter(x => Math.abs(x) > .15).length} | Richtungswechsel: ${umk}`);
if (STOER) {
  // ab dem Ende einer Lücke/Verdeckung bzw. dem Beginn eines Vertauschens 1,5 s lang: Abstand der Hose zur Hose des
  // ungestörten Laufs (nicht zur gestörten Rohschätzung: im vertauschten Bild ist die selbst falsch), Bilder mit der Hose über
  // 90° daneben (verkehrt herum) und über 17°; Bilder mit beiden Hüften verdeckt zählen nicht (Hose ausgeblendet)
  const t0 = Math.min(...["luecke", "blind"].map(n => arg(n, null) ? +arg(n).split("-")[1] : 1e9),
    ...["blind1", "tauschJede"].map(n => arg(n, null) ? +arg(n).split("-")[0] : 1e9), ...TAUSCH);
  const ref = n => { const b = bezug.get(ks[n]); return b ? b.yaw : null; };
  const nach = ks.map((k, n) => n).filter(n => T[n] >= t0 - .05 && T[n] < t0 + 1.5 && ref(n) != null && !inBlind(T[n])), ab = n => Math.abs(wr(Y[n] - ref(n)));
  const ueber17 = nach.filter(n => ab(n) > .3), verkehrt = nach.filter(n => ab(n) > Math.PI / 2);
  const spr = nach.filter(n => n > 0 && nb(n) && Math.abs(wr(Y[n] - Y[n - 1])) > 1.5).length;
  console.log(`ab ${t0.toFixed(2)} s (1,5 s, gegen den ungestörten Lauf): größter Abstand ${(Math.max(0, ...nach.map(ab)) * 180 / Math.PI).toFixed(0)}°, ` +
    `über 17° in ${ueber17.length} Bildern, verkehrt herum (über 90°) in ${verkehrt.length}, Sprünge über 1,5 rad: ${spr}`);
}
console.log(`Abweichung Soll: Drehung ${mErr(imDreh).toFixed(0)}° (über 60° falsch: ${falsch} Bilder), vorn danach ${mErr(ruhig).toFixed(0)}° | Verzögerung ≈ ${(best[1] * 1000).toFixed(0)} ms`);
const out = arg("png");
if (out) { const j = out.replace(/\.png$/, ".json");
  fs.writeFileSync(j, JSON.stringify(ks.map((k, n) => ({ i: n, t: T[n], yaw: Y[n], roh: { m: fr.get(k).roh }, trk: 1, soll: dir * soll(T[n]) }))));
  execFileSync("python3", [R + "werkzeuge/python/drehung_plot.py", j, out], { stdio: "inherit" }); }
