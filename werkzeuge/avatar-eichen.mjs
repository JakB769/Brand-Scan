/* Eichung Scan ↔ Avatar (22.10.): zufällige Körper aus dem Körpermodell (MakeHuman, Mann/Frau, alle Regler ±0,7) mit Armen nach
   unten rendern (werkzeuge/python/koerper_render.py) und durch den echten Frontal-Scan schicken (avatar-scan.mjs --nurfrontal,
   MediaPipe auf der CPU). Ausgabe je Maß: Scan ÷ Avatar im Mittel und Streuung, daraus AV_EICH in app/index.html.
     node werkzeuge/avatar-eichen.mjs [--n 12] [--aus <Ordner>]
   Braucht die Vergleichsseite (node werkzeuge/tests/baue-testseite.mjs --echt) und die Modelle in werkzeuge/tests/ausgabe/. */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const N = +arg("n", 12), AUS = path.resolve(arg("aus", R + "werkzeuge/tests/ausgabe/eichung")) + "/"; fs.mkdirSync(AUS, { recursive: true });
// Avatar-Funktionen aus der Seite (ohne Browser)
const html = fs.readFileSync(R + "app/index.html", "utf8"), code = html.slice(html.indexOf("const AV={kd"), html.indexOf("/* Darstellung im Grafik-Kontext"));
globalThis.window = {}; globalThis.atob = s => Buffer.from(s, "base64").toString("latin1");
(0, eval)(fs.readFileSync(R + "app/avatar/koerper.js", "utf8"));
const X = new Function(`const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)); const num=x=>+x; const $=()=>({}); const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
${code}
return {avatarDaten,avatarBauen,avatarKnochen,avatarHaltung};`)();
const kd = await X.avatarDaten();
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const K = ["gewicht", "muskel", "shoulder-dist", "upperarm-length", "lowerarm-length", "napetowaist-dist", "upperleg-height", "lowerleg-height", "waist-circ", "hips-circ", "bust-circ", "upperarm-circ", "thigh-circ"];
const zeilen = [];
for (let i = 0; i < N; i++) {
  const g = i % 2 ? "f" : "m", H = g === "m" ? 168 + Math.round(rnd() * 26) : 152 + Math.round(rnd() * 28), p = Object.fromEntries(K.map(k => [k, +(rnd() * 1.4 - .7).toFixed(2)]));
  const A = X.avatarBauen(kd, g, p, H), Kn = X.avatarKnochen(A.gel, { oaL: [.13, -1, .02], uaL: [.1, -1, .06], oaR: [-.13, -1, .02], uaR: [-.1, -1, .06] });
  const P = X.avatarHaltung(kd.gew, A.P, null, Kn, kd.nK).P, idx = Uint32Array.from(kd.idx);
  const b = Buffer.alloc(8 + kd.nK * 12 + idx.byteLength); b.writeUInt32LE(kd.nK, 0); b.writeUInt32LE(idx.length / 3, 4);
  Buffer.from(P.buffer, P.byteOffset, kd.nK * 12).copy(b, 8); Buffer.from(idx.buffer).copy(b, 8 + kd.nK * 12);
  const bin = AUS + `k${i}.bin`, jpg = AUS + `k${i}.jpg`; fs.writeFileSync(bin, b);
  execFileSync("python3", [R + "werkzeuge/python/koerper_render.py", bin, jpg]);
  const out = execFileSync("node", [R + "werkzeuge/avatar-scan.mjs", "--scanbild", jpg, "--k", "1", "--groesse", String(H), "--nurfrontal"], { cwd: R, timeout: 300000 }).toString();
  const z = out.split("\n").find(l => l.startsWith("Frontal-Scan:")); if (!z) { console.log(`Körper ${i}: kein Scan`); continue; }
  const scan = JSON.parse(z.slice(13)), m = A.m; zeilen.push({ g, H, p, m, scan }); console.log(`Körper ${i} (${g}, ${H} cm) gescannt`);
}
fs.writeFileSync(AUS + "eichung.json", JSON.stringify(zeilen));
const paare = [["shoulder", "shoulder"], ["torso", "torso"], ["leg", "leg"], ["inseam", "inseam"], ["armU", "armU"], ["foreW", "foreW"], ["upperW", "upperW"], ["waistW", "waist"], ["hipW", "hip"], ["kneeW", "kneeL"], ["thighW", "thighL"], ["chestW", "chest"]];
const st = q => { const mu = q.reduce((a, b) => a + b, 0) / q.length; return [mu, Math.sqrt(q.reduce((a, b) => a + (b - mu) ** 2, 0) / q.length)]; };
for (const [mk, sk] of paare.concat([["arm", "arm"]])) {
  const q = zeilen.map(r => mk === "arm" ? (r.scan.armU + r.scan.armL) / (r.m.armU + r.m.armL) : r.scan[sk] / r.m[mk]).filter(x => isFinite(x) && x > 0);
  if (q.length) { const [mu, sd] = st(q); console.log(`${mk.padEnd(9)} n=${q.length}  Scan/Avatar ${mu.toFixed(3)} ± ${sd.toFixed(3)}`); }
}
