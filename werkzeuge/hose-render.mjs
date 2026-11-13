/* Hose aus Fotos bauen und fotorealistisch vergleichbar rendern (05.11.): Formular „Einzeln mit Maßband“ (Fotos vorne/hinten,
   Bund, Länge), KI-Freistellung wie im Browser, 3D-Datei (.glb) aus der Seite; dazu jede .glb (eigene oder KI-Referenz) in einer
   neutralen Studio-Szene (three.js, gleiches Licht und gleiche Kamera, auf Höhe normiert) von vorn, seitlich, hinten.
     node werkzeuge/hose-render.mjs bauen <name> <vorne.jpg> [hinten.jpg] --bund 40 --laenge 105 [--stoff anzug] --aus <Ordner>
     (bauen mit --json [--label "Name"]: die Hose zusätzlich wie im Gerät gespeichert als <name>.json)
     node werkzeuge/hose-render.mjs glb <datei.glb> --aus <Ordner> [--name x] [--drehen 0] [--three <node_modules mit three>] [--ohne schatten,farbe,normal,textur]
   Ergebnis: <Ordner>/<name>.glb, <name>_vorn.png, _seite.png, _hinten.png (Studio) und <name>_app_*.png (3D-Ansicht der Seite). */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/", NM = R + "node_modules/", A = R + "werkzeuge/tests/ausgabe/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const pos = process.argv.slice(2).filter((x, i, a) => !x.startsWith("--") && !(a[i - 1] || "").startsWith("--"));
const [modus, ...rest] = pos, OUT = path.resolve(arg("aus", A + "hose-render")) + "/"; fs.mkdirSync(OUT, { recursive: true });
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : f.endsWith(".glb") ? "model/gltf-binary" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function studio(glb, name, drehen = 0) {
  const THREE = path.resolve(arg("three", "/tmp/claude-0/-home-user-Brand-Scan/fa1818b3-dd01-5cb2-834e-a2d44f4c409d/scratchpad/npm/node_modules")) + "/three/";
  const ctx = await b.newContext({ viewport: { width: 600, height: 800 } }); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await ctx.route("http://studio/**", r => { const u = new URL(r.request().url()).pathname;
    const f = u === "/modell.glb" ? glb : u.startsWith("/three/") ? THREE + u.slice(7) : null;
    if (u === "/") return r.fulfill({ status: 200, contentType: "text/html", body: SEITE });
    return f && fs.existsSync(f) ? r.fulfill({ status: 200, contentType: typ(f), body: fs.readFileSync(f) }) : r.abort(); });
  await p.goto("http://studio/?ohne=" + arg("ohne", "")); await p.waitForFunction(() => window.__bereit || window.__fehler, null, { timeout: 120000 });
  const fe = await p.evaluate(() => window.__fehler); if (fe) { console.log("Studio-Fehler:", fe); await ctx.close(); return; }
  for (const [n, y] of [["vorn", 0], ["seite", Math.PI / 2], ["hinten", Math.PI]]) {
    await p.evaluate(([y, d]) => window.__zeige(y + d), [y, drehen]); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + `${name}_${n}.png` }); }
  // Nahaufnahmen: Schritt von vorn, Gesäß und Schritt schräg hinten, Saum von vorn
  for (const [n, y, z] of [["nah_schritt", 0, [0, .62, .62, 1.0]], ["nah_gesaess", 2.6, [0, .72, .7, 1.1]], ["nah_saum", 0, [0, .12, .1, 1.0]]]) {
    await p.evaluate(([y, d, z]) => window.__zeige(y + d, z), [y, drehen, z]); await p.waitForTimeout(300); await p.screenshot({ path: OUT + `${name}_${n}.png` }); }
  console.log("Studio:", name, await p.evaluate(() => window.__info), errs.length ? errs.slice(0, 2) : "");
  await ctx.close();
}
// Studio: Licht von oben vorn links (weich), Gegenlicht, Umgebung hell; Boden mit Kontaktschatten; Modell auf 1,6 Bildhöhen
const SEITE = `<!doctype html><html><body style="margin:0;background:#e9e7e3"><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as T from "three"; import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js"; import {RoomEnvironment} from "three/addons/environments/RoomEnvironment.js";
const OH=new URLSearchParams(location.search).get("ohne")||"";
try{
const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); r.setSize(600,800); r.setPixelRatio(1); r.toneMapping=T.ACESFilmicToneMapping; r.toneMappingExposure=1.0;
r.outputColorSpace=T.SRGBColorSpace; r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap; document.body.appendChild(r.domElement);
const s=new T.Scene(); s.background=new T.Color(0xe9e7e3); const pm=new T.PMREMGenerator(r); s.environment=pm.fromScene(new RoomEnvironment(),.04).texture; s.environmentIntensity=.55;
const k=new T.DirectionalLight(0xfff6ec,2.2); k.position.set(-1.2,2.4,2.2); k.castShadow=true; k.shadow.mapSize.set(2048,2048); k.shadow.radius=6; s.add(k);
const f=new T.DirectionalLight(0xe8eeff,.7); f.position.set(2,1,-1.5); s.add(f);
const g=new T.Mesh(new T.PlaneGeometry(10,10),new T.ShadowMaterial({opacity:.22})); g.rotation.x=-Math.PI/2; g.receiveShadow=true; s.add(g);
const gl=await new GLTFLoader().loadAsync("/modell.glb"); const m=gl.scene; const box=new T.Box3().setFromObject(m), sz=box.getSize(new T.Vector3()), c=box.getCenter(new T.Vector3());
const piv=new T.Group(); m.position.sub(c); m.position.y+=sz.y/2; const sk=1/sz.y; piv.add(m); piv.scale.setScalar(sk); s.add(piv);
let tri=0; m.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; tri+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;
  const mm=Array.isArray(o.material)?o.material:[o.material]; for(const q of mm){ q.side=T.DoubleSide;
    // Fehlersuche: --ohne schatten,farbe,normal,textur
    if(OH.includes("farbe")) q.vertexColors=false; if(OH.includes("normal")) q.normalMap=null; if(OH.includes("textur")) q.map=null; if(OH.includes("grau")){ q.map=null; q.color=new T.Color(.25,.3,.45); }
    if(OH.includes("uv")&&q.map){ const c=document.createElement("canvas"); c.width=c.height=1024; const x=c.getContext("2d"); x.font="bold 22px sans-serif";
      for(let i=0;i<16;i++) for(let j=0;j<16;j++){ x.fillStyle=\`hsl(\${i*22},80%,\${35+(j%2)*25}%)\`; x.fillRect(j*64,i*64,64,64); x.fillStyle="#fff"; x.fillText(i.toString(16)+j.toString(16),j*64+14,i*64+40); }
      const t=new T.CanvasTexture(c); t.flipY=false; t.colorSpace=T.SRGBColorSpace; q.map=t; q.normalMap=null; q.vertexColors=false; }
    q.needsUpdate=true; }
  if(OH.includes("nneu")) o.geometry.computeVertexNormals();
  if(OH.includes("schatten")){ o.castShadow=false; o.receiveShadow=false; } } });
const cam=new T.PerspectiveCamera(24,600/800,.1,50); g.position.y=0;
window.__info={hoehe:+sz.y.toFixed(3),breite:+sz.x.toFixed(3),tiefe:+sz.z.toFixed(3),dreiecke:Math.round(tri)};
window.__zeige=(y,z)=>{ piv.rotation.y=y; const Z=z||[0,.55,.5,2.9]; cam.position.set(Z[0],Z[1],Z[3]); cam.lookAt(Z[0],Z[2],0); r.render(s,cam); };
window.__zeige(0); window.__bereit=true;
}catch(e){ window.__fehler=String(e&&e.stack||e); }
</script></body></html>`;

if (modus === "glb") { await studio(path.resolve(rest[0]), arg("name", path.basename(rest[0], ".glb")), +arg("drehen", 0)); await b.close(); process.exit(0); }

// bauen: Hose in der Testseite anlegen (KI-Freistellung aktiv), 3D-Ansicht der Seite und .glb sichern, dann Studio
const [name, vorne, hinten] = rest;
const ctx = await b.newContext({ viewport: { width: 760, height: 1100 }, acceptDownloads: true });
await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
await ctx.route("**/magic_touch.tflite", r => r.fulfill({ status: 200, body: fs.readFileSync(A + "magic_touch.tflite"), headers: { "access-control-allow-origin": "*" } }));
await ctx.route("**/fonts.g*/**", r => r.abort());
if (!process.argv.includes("--ohneKI")) await ctx.addInitScript(() => { window.__kiTest = true; }); else await ctx.addInitScript(() => { window.__innenLog = true; });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("file://" + R + "werkzeuge/tests/testseite-mit-simulierter-person.html"); await p.waitForTimeout(500);
await p.fill("#height", arg("groesse", "179")); await p.dispatchEvent("#height", "change");
await p.evaluate(() => { for (const d of document.querySelectorAll("details")) d.open = true; });
await p.setInputFiles("#own-front", path.resolve(vorne)); if (hinten) await p.setInputFiles("#own-back", path.resolve(hinten));
await p.fill("#own-name", name); if (arg("bund")) await p.fill("#own-waist", arg("bund")); if (arg("laenge")) await p.fill("#own-len", arg("laenge"));
if (arg("material")) await p.fill("#own-mat", arg("material"));
if (arg("vorlage")) await p.evaluate(async ([b64, typ]) => { const r = await fetch(`data:${typ};base64,${b64}`); window.__rueckVorlage = new File([await r.blob()], "vorlage", { type: typ }); },
  [fs.readFileSync(arg("vorlage")).toString("base64"), arg("vorlage").endsWith(".png") ? "image/png" : "image/jpeg"]);
await p.click("#own-go");
for (let t = 0; t < 240; t++) { await p.waitForTimeout(500);
  const o = await p.evaluate(() => ["refDlg", "segDlg"].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(","));
  if (/segDlg/.test(o)) await p.click("#segOk").catch(() => {}); if (/refDlg/.test(o)) await p.click("#refOk").catch(() => {});
  if (/Fertig|nicht|kein/i.test(await p.evaluate(() => document.getElementById("own-msg").textContent))) break; }
console.log("Seite:", (await p.evaluate(() => document.getElementById("own-msg").textContent)).slice(0, +arg("msglen", 220)));
const box = await p.$("#g3dview"); await box.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
for (const [n, y] of [["vorn", 0], ["seite", Math.PI / 2], ["hinten", Math.PI]]) {
  await p.evaluate(y => { const v = window.__dbg.v3d; v.ziel = null; v.yaw = y; v.idle = performance.now() + 1e7; }, y); await p.waitForTimeout(1300);
  await box.screenshot({ path: OUT + `${name}_app_${n}.png` }); }
const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 60000 }), p.click("#g-glb")]);
await dl.saveAs(OUT + name + ".glb"); console.log("Innenbund:", JSON.stringify(await p.evaluate(() => window.__innen || null)), "Produktform:", await p.evaluate(() => window.__dbg.g3.produkt));
// --json: die fertige Hose wie im Gerät gespeichert (für eine Seite mit vorab eingebauten Hosen)
if (process.argv.includes("--json")) fs.writeFileSync(OUT + name + ".json", await p.evaluate(n => { const d = window.__dbg, G = { ...d.GARMENTS[d.g.key] };
  for (const k of ["unsaved", "shared", "prof", "bad"]) delete G[k]; G.label = n; return JSON.stringify({ key: "vorab_" + n.replace(/[^a-z0-9]/gi, "").toLowerCase(), G }); }, arg("label", name)));
if (process.argv.includes("--dump")) fs.writeFileSync(OUT + name + "_netz.json", JSON.stringify(await p.evaluate(() => { const d = window.__dbg, G = d.GARMENTS[d.g.key], M = G.m3, g3 = d.g3;
  return { nr: g3.nr, nv: g3.nv, v: Array.from(M.v), vc: M.vc, f: M.f, b: M.b, tv: M.tv, tvb: M.tvb, mat: G.material || G.mat || null, pos: Array.from(g3.pos.slice(0, g3.nv * 3)) }; }))); console.log("GLB:", OUT + name + ".glb", errs.length ? errs.slice(0, 3) : "");
await ctx.close();
await studio(OUT + name + ".glb", name);
await b.close();
