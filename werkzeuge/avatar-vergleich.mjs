/* Avatar aus dem Scan neben dem Standardkörper derselben Größe (22.10., Kern-Test 3): liest die Ausgabe von avatar-scan.mjs
   (avatar_<name>.json: Geschlecht, Größe, Regler, Maße), baut beide Körper mit dem Körpermodell, zeigt die Unterschiede in cm
   und schreibt ein Bild (vorn, Seite, Umrisse übereinander; werkzeuge/python/koerper_vergleich.py).
     node werkzeuge/avatar-vergleich.mjs <avatar_v2.json> <ausgabe.png> */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/";
const [ein, aus] = process.argv.slice(2), d = JSON.parse(fs.readFileSync(ein, "utf8")), a = d.avatar || d;
const html = fs.readFileSync(R + "app/index.html", "utf8"), code = html.slice(html.indexOf("const AV={kd"), html.indexOf("/* Darstellung im Grafik-Kontext"));
globalThis.window = {}; globalThis.atob = s => Buffer.from(s, "base64").toString("latin1");
(0, eval)(fs.readFileSync(R + "app/avatar/koerper.js", "utf8"));
const X = new Function(`const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)); const num=x=>+x; const $=()=>({}); const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
${code}
return {avatarDaten,avatarBauen};`)();
const kd = await X.avatarDaten(), S = X.avatarBauen(kd, a.g, {}, a.H), A = X.avatarBauen(kd, a.g, a.p, a.H);
const bin = (B, f) => { const idx = Uint32Array.from(kd.idx), b = Buffer.alloc(8 + kd.nK * 12 + idx.byteLength); b.writeUInt32LE(kd.nK, 0); b.writeUInt32LE(idx.length / 3, 4);
  Buffer.from(B.P.buffer, B.P.byteOffset, kd.nK * 12).copy(b, 8); Buffer.from(idx.buffer).copy(b, 8 + kd.nK * 12); fs.writeFileSync(f, b); };
const t0 = aus.replace(/\.png$/, ""); bin(S, t0 + "_std.bin"); bin(A, t0 + "_av.bin");
const K = ["shoulder", "chest", "waist", "hip", "thigh", "torso", "leg", "armU", "armL"], N = { shoulder: "Schulter (Gelenke)", chest: "Brust (Umfang)", waist: "Taille (Umfang)", hip: "Hüfte (Umfang)", thigh: "Oberschenkel (Umfang)", torso: "Rumpf (Schulter–Hüfte)", leg: "Hüftgelenk über Boden", armU: "Oberarm", armL: "Unterarm" };
const zeilen = K.map(k => ({ k, std: +S.m[k].toFixed(1), avatar: +A.m[k].toFixed(1), diff: +(A.m[k] - S.m[k]).toFixed(1) }));
for (const z of zeilen) console.log(`${N[z.k].padEnd(24)} Standard ${String(z.std).padStart(6)}  Avatar ${String(z.avatar).padStart(6)}  ${z.diff >= 0 ? "+" : ""}${z.diff} cm`);
const text = `${a.g === "m" ? "Mann" : "Frau"}, ${a.H} cm · ` + zeilen.filter(z => ["shoulder", "chest", "waist", "hip", "leg"].includes(z.k)).map(z => `${N[z.k].split(" ")[0]} ${z.diff >= 0 ? "+" : ""}${z.diff}`).join(" · ") + " cm";
execFileSync("python3", [R + "werkzeuge/python/koerper_vergleich.py", t0 + "_std.bin", t0 + "_av.bin", aus, text], { stdio: "inherit" });
fs.rmSync(t0 + "_std.bin"); fs.rmSync(t0 + "_av.bin");
fs.writeFileSync(t0 + ".json", JSON.stringify({ g: a.g, H: a.H, p: a.p, masse: zeilen }, null, 1));
