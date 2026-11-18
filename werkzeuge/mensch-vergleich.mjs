/* Avatar neben dem Referenz-Menschen „Joe“ (assets/referenz/mensch, nur Vergleich, keine Lizenz): gleiche Ansichten (vorn,
   Seite, hinten), gleicher Maßstab (cm), gleiches Licht wie die Avatar-Darstellung der Seite (eigene kleine WebGL-Zeichnung).
   Gezeigt: Joe (1,67 m), der Durchschnitts-Avatar in Joes Größe (Mann, alle Regler 0) und, falls vorhanden, der Avatar aus dem
   Scan der Referenzclips (werkzeuge/tests/ausgabe/vergleich/avatar_v2.json, Jakob 1,79 m).
     node werkzeuge/mensch-vergleich.mjs [--aus werkzeuge/tests/ausgabe/vergleich]
   Braucht Python mit usd-core (pip install usd-core) zum Lesen von Joe.usdc. */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "./server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const OUT = path.resolve(R, arg("aus", "werkzeuge/tests/ausgabe/vergleich")) + "/"; fs.mkdirSync(OUT, { recursive: true });
const TMP = fs.mkdtempSync("/tmp/mensch-");
// Joe: alle Meshes in Weltkoordinaten (cm, Y oben), Vielecke als Fächer geteilt
execFileSync("python3", ["-c", `
import json, sys
from pxr import Usd, UsdGeom
st = Usd.Stage.Open(sys.argv[1]); xc = UsdGeom.XformCache(); out = []
for p in st.Traverse():
    if not p.IsA(UsdGeom.Mesh): continue
    m = UsdGeom.Mesh(p); M = xc.GetLocalToWorldTransform(p)
    P = [list(M.Transform(v)) for v in m.GetPointsAttr().Get()]
    I = []; k = 0; idx = m.GetFaceVertexIndicesAttr().Get()
    for n in m.GetFaceVertexCountsAttr().Get():
        for j in range(1, n - 1): I += [idx[k], idx[k + j], idx[k + j + 1]]
        k += n
    out.append({'name': p.GetName(), 'P': [c for v in P for c in v], 'I': I})
json.dump(out, open(sys.argv[2], 'w'))`, R + "assets/referenz/mensch/source/Joe.usdc", TMP + "/joe.json"]);
const joe = JSON.parse(fs.readFileSync(TMP + "/joe.json", "utf8"));
// Füße auf 0, Mitte auf x = z = 0, Blickrichtung: Gesicht vor dem Rumpf → +Z vorn (wie der Avatar)
{ let y0 = 1e9, y1 = -1e9; for (const m of joe) for (let i = 1; i < m.P.length; i += 3) { y0 = Math.min(y0, m.P[i]); y1 = Math.max(y1, m.P[i]); }
  const mitte = n => { const m = joe.find(q => q.name === n), s = [0, 0, 0]; for (let i = 0; i < m.P.length; i += 3) for (let c = 0; c < 3; c++) s[c] += m.P[i + c]; return s.map(v => v / (m.P.length / 3)); };
  const b = mitte("Legs"), f = mitte("Face"), dreh = f[2] < b[2];
  for (const m of joe) for (let i = 0; i < m.P.length; i += 3) { m.P[i] -= b[0]; m.P[i + 1] -= y0; m.P[i + 2] -= b[2]; if (dreh) { m.P[i] = -m.P[i]; m.P[i + 2] = -m.P[i + 2]; } }
  console.log(`Joe: ${(y1 - y0).toFixed(1)} cm hoch, ${joe.length} Teile, Gesicht ${dreh ? "nach −Z (gedreht)" : "nach +Z"}`); }
const HJ = Math.max(...joe.flatMap(m => m.P.filter((_, i) => i % 3 === 1)));
const FARBE = { TShirt: [.42, .47, .58], Shorts: [.25, .27, .3], Shoes: [.9, .9, .88], Hair: [.22, .16, .11], Eyes: [.92, .92, .92] }, HAUT = [.80, .72, .65];

const srv = await starte(0), port = srv.address().port;
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${port}/werkzeuge/tests/testseite-mit-simulierter-person.html`); await p.waitForTimeout(500);
const scan = fs.existsSync(OUT + "avatar_v2.json") ? JSON.parse(fs.readFileSync(OUT + "avatar_v2.json", "utf8")).avatar : null;
// Avatare in der Seite bauen (dieselben Funktionen wie die App), Punkte und Dreiecke zurück
const av = await p.evaluate(async ([HJ, scan]) => { const D = window.__dbg, kd = await D.avatarDaten(), o = [];
  const mk = (g, pp, H, name) => { const A = D.avatarBauen(kd, g, pp, H); o.push({ name, P: Array.from(A.P), I: Array.from(kd.idx), n: kd.nK, m: A.m }); };
  mk("m", {}, HJ, `Avatar Mittel Mann ${Math.round(HJ)} cm`);
  if (scan) mk(scan.g, scan.p, scan.H, `Avatar aus Scan ${scan.H} cm`);
  return o; }, [HJ, scan]);
for (const a of av) console.log(`${a.name}: Taille ${a.m.waist.toFixed(1)}, Hüfte ${a.m.hip.toFixed(1)}, Oberschenkel ${a.m.thigh.toFixed(1)}, Schritt ${a.m.inseam.toFixed(1)} cm`);
// Zeichnen: orthografisch, 1 cm = k Bildpunkte, Boden unten, Licht wie FSA in app/index.html
const figuren = [{ name: `Joe ${HJ.toFixed(0)} cm (Referenz)`, teile: joe.map(m => ({ P: m.P, I: m.I, farbe: FARBE[m.name] || HAUT })) },
  ...av.map(a => ({ name: a.name, teile: [{ P: a.P, I: a.I, farbe: HAUT }] }))];
const bilder = [];
for (const [ansicht, yaw] of [["vorn", 0], ["seite", Math.PI / 2], ["hinten", Math.PI]]) for (const f of figuren) {
  const png = await p.evaluate(([teile, yaw]) => {
    const W = 300, H = 600, k = H / 200, c = document.createElement("canvas"); c.width = W; c.height = H;
    const gl = c.getContext("webgl", { antialias: true, preserveDrawingBuffer: true });
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }, pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, `attribute vec3 p;attribute vec3 n;uniform float yw;uniform vec2 sk;varying vec3 vn;
      void main(){float c=cos(yw),s=sin(yw);vec3 q=vec3(p.x*c+p.z*s,p.y,p.x*s-p.z*c);vn=vec3(n.x*c+n.z*s,-n.y,n.x*s-n.z*c);
      gl_Position=vec4(q.x*sk.x,q.y*sk.y-1.,q.z/400.,1.);}`));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, `precision mediump float;uniform vec3 farbe;varying vec3 vn;void main(){
      vec3 n=normalize(vn);if(n.z>0.)n=-n;vec3 Ld=normalize(vec3(-.38,-.55,-.74));float k=max((dot(n,Ld)+.35)/1.35,0.);
      float f=max(dot(n,normalize(vec3(.65,-.05,-.76))),0.);float sky=.32+.16*(.5-.5*n.y);float rim=pow(1.-min(1.,-n.z),3.)*.18;
      vec3 c=farbe*(.72*k+.16*f+sky)+vec3(rim);c=mix(c,c*vec3(1.04,.97,.93),.5*(1.-k));gl_FragColor=vec4(pow(c,vec3(.95)),1.);}`));
    gl.linkProgram(pr); gl.useProgram(pr);
    gl.clearColor(.95, .95, .96, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    gl.getExtension("OES_element_index_uint");
    gl.uniform1f(gl.getUniformLocation(pr, "yw"), yaw); gl.uniform2f(gl.getUniformLocation(pr, "sk"), 2 * k / W, 2 * k / H);
    for (const t of teile) {
      const P = new Float32Array(t.P), N = new Float32Array(P.length), I = new Uint32Array(t.I);
      for (let i = 0; i < I.length; i += 3) { const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
        const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; } }
      for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
      const buf = (z, d) => { const o = gl.createBuffer(); gl.bindBuffer(z, o); gl.bufferData(z, d, gl.STATIC_DRAW); return o; };
      for (const [nm, d] of [["p", P], ["n", N]]) { buf(gl.ARRAY_BUFFER, d); const l = gl.getAttribLocation(pr, nm); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 3, gl.FLOAT, false, 0, 0); }
      gl.uniform3fv(gl.getUniformLocation(pr, "farbe"), t.farbe); buf(gl.ELEMENT_ARRAY_BUFFER, I); gl.drawElements(gl.TRIANGLES, I.length, gl.UNSIGNED_INT, 0);
    }
    return c.toDataURL("image/png"); }, [f.teile, yaw]);
  const datei = `${TMP}/${ansicht}_${bilder.length}.png`; fs.writeFileSync(datei, Buffer.from(png.split(",")[1], "base64")); bilder.push([ansicht, f.name, datei]);
}
execFileSync("python3", ["-c", `
import sys, json
from PIL import Image, ImageDraw, ImageFont
try: F = ImageFont.truetype('DejaVuSans.ttf', 13)
except Exception: F = None
z = json.loads(sys.argv[2]); n = int(sys.argv[3]); w, h = 300, 600
c = Image.new('RGB', (w * len(z) + 12 * (len(z) // n - 1), h + 40), 'white'); d = ImageDraw.Draw(c)
for i, (ansicht, name, f) in enumerate(z):
    x = i * w + 12 * (i // n); c.paste(Image.open(f).convert('RGB'), (x, 40))
    d.text((x + 6, 3), ansicht, fill='black', font=F); d.text((x + 6, 20), name, fill='black', font=F)
    for cm in range(0, 201, 50): y = 40 + h - int(cm * h / 200); d.line([(x, y), (x + 8, y)], fill=(150, 150, 150))
c.save(sys.argv[1], quality=88)`, OUT + "avatar_vs_joe.jpg", JSON.stringify(bilder), String(figuren.length)]);
console.log("Ausgabe:", OUT + "avatar_vs_joe.jpg", errs.length ? "Fehler: " + errs.slice(0, 2).join(" | ") : "");
await b.close(); srv.close(); fs.rmSync(TMP, { recursive: true, force: true });
