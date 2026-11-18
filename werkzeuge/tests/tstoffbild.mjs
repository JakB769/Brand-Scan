// Stoffbild ohne Boden (15.10.): eigene Testhose flach auf Holzboden mit Bankkarte (wie der Händler sie hochlädt, mit KI-
// Freistellung), einmal mit Rückenfoto und einmal nur von vorn (Rückseite geschätzt). Geprüft je Beinzeile: die Farbe im Spalt
// zwischen den Innennähten (dort liegt im Foto der Boden) gleicht der Farbe des Beins daneben, nicht dem Boden. Ohne fillLegGap
// war der Spalt holzfarben, die Innennaht zog Bodenfarbe in die Hose („Boden scheint an der Ferse durch“). Dazu: die geschätzte
// Rückseite hat keine Einzelheiten aus dem großen Foto der Vorderseite (Gesäß ohne Schlitz/Taschenkanten: weich).
// Aufruf: node werkzeuge/tests/tstoffbild.mjs [Testseite relativ zum Repo]   (braucht die KI-Modelle in ausgabe/, sonst ohne KI)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { starte } from '../server.mjs';

const hier = fileURLToPath(new URL('.', import.meta.url)), R = path.resolve(hier, '../..') + '/', A = hier + 'ausgabe/', NM = R + 'node_modules/';
const VORNE = R + 'assets/referenz/fotos/flach-vorne-hinten/vorne.jpg', HINTEN = R + 'assets/referenz/fotos/flach-vorne-hinten/hinten.jpg';
let fehler = 0; const pruefe = (ok, text) => { console.log((ok ? 'ok    ' : 'FEHLER') + ' ' + text); if (!ok) fehler++; };
const srv = await starte(0), port = srv.address().port;
const typ = f => f.endsWith('.wasm') ? 'application/wasm' : /\.m?js$/.test(f) ? 'application/javascript' : 'application/octet-stream';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1000, height: 1300 } });
await ctx.route('**/@mediapipe/tasks-vision@0.10.18/**', r => { const f = NM + '@mediapipe/tasks-vision/' + decodeURIComponent(r.request().url().split('@0.10.18/')[1].split('?')[0]);
  if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) }); });
for (const n of ['magic_touch.tflite', 'pose_landmarker_full.task']) await ctx.route('**/' + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { 'access-control-allow-origin': '*' } }) : r.abort());
await ctx.route('**/fonts.g*/**', r => r.abort());
if (fs.existsSync(A + 'magic_touch.tflite')) await ctx.addInitScript(() => { window.__kiTest = true; });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${port}/${process.argv[2] || 'werkzeuge/tests/testseite-mit-simulierter-person.html'}`); await p.waitForTimeout(500);
await p.fill('#height', '179');
const dialoge = async () => { const offen = await p.evaluate(() => ['refDlg', 'segDlg'].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(','));
  if (/refDlg/.test(offen)) { await p.click('#refOk').catch(() => {}); return true; } if (/segDlg/.test(offen)) { await p.click('#segOk').catch(() => {}); return true; } return false; };
// fertig: Meldung „Fertig“ und eine andere Hose als vorher gewählt (nach „Neue Hose“ steht noch die alte Meldung da)
const fertig = async alt => { for (let t = 0; t < 400; t++) { await p.waitForTimeout(500); if (await dialoge()) continue;
  const z = await p.evaluate(() => ({ m: document.getElementById('drop-msg').innerText, k: window.__dbg.g.key }));
  if (/Fertig/.test(z.m) && !/berechnet|wird/.test(z.m) && z.k && z.k !== alt) return true; } return false; };
// je Beinzeile: Farbe in der Mitte des Spalts; „Boden“, wenn sie näher an der Bodenfarbe des Fotos (Ecken) liegt als am Bein
// daneben (inneres Viertel, die nähere Seite). Liegen die Beine im Foto übereinander, ist der Spalt Stoff (dunkler, Schatten).
const spalt = () => p.evaluate(async foto => { const d = window.__dbg, G = d.GARMENTS[d.g.key], im = new Image(); im.src = G.m3.atlas; await im.decode();
  const fi = new Image(); fi.src = foto; await fi.decode(); const fc = document.createElement('canvas'); fc.width = 200; fc.height = Math.round(200 * fi.height / fi.width);
  const fx = fc.getContext('2d'); fx.drawImage(fi, 0, 0, fc.width, fc.height); const boden = [0, 0, 0]; let bn = 0;
  for (const [x0, y0] of [[2, 2], [fc.width - 14, 2], [2, fc.height - 14], [fc.width - 14, fc.height - 14]]) { const q = fx.getImageData(x0, y0, 12, 12).data;
    for (let i = 0; i < q.length; i += 4) { boden[0] += q[i]; boden[1] += q[i + 1]; boden[2] += q[i + 2]; bn++; } }
  for (let c = 0; c < 3; c++) boden[c] /= bn;
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const D = x.getImageData(0, 0, c.width, c.height).data, M = G.m3, W = c.width, H = c.height, out = [], zeilen = [];
  const px = (u, y) => { const k = (Math.min(H - 1, Math.max(0, Math.round(y))) * W + Math.min(W - 1, Math.max(0, Math.round(u * W)))) * 4; return [D[k], D[k + 1], D[k + 2]]; };
  for (const [uv, tv] of [[M.f, M.tv], [M.b, M.tvb || M.tv]]) { let weit = 0, n = 0, sum = 0;
    uv.forEach((r, i) => { if (M.v[i] < M.vc + .05 || M.v[i] > .95 || r[2] - r[1] < 6 / W) return; const y = tv[i] * H;
      const g = px((r[1] + r[2]) / 2, y), l = px(r[1] - .25 * (r[1] - r[0]), y), q = px(r[2] + .25 * (r[3] - r[2]), y);
      const dd = Math.min(Math.hypot(g[0] - l[0], g[1] - l[1], g[2] - l[2]), Math.hypot(g[0] - q[0], g[1] - q[1], g[2] - q[2]));
      const db = Math.hypot(g[0] - boden[0], g[1] - boden[1], g[2] - boden[2]), istBoden = db < dd;
      n++; sum += dd; if (istBoden) { weit++; zeilen.push([Math.round(M.v[i] * 100), Math.round(dd), Math.round(db), g]); }
      x.fillStyle = istBoden ? '#f0f' : '#0f0'; x.fillRect(Math.round((r[1] + r[2]) / 2 * W) - 1, Math.round(y) - 1, 3, 3); });
    out.push({ weit, n, mittel: n ? Math.round(sum / n) : 0, zeilen: zeilen.splice(0) }); }
  return { seiten: out, boden: boden.map(Math.round), bild: c.toDataURL('image/png') }; }, '/assets/referenz/fotos/flach-vorne-hinten/vorne.jpg');


// 1) Vorder- und Rückenfoto
await p.setInputFiles('#slot-vorne input', VORNE);
for (let t = 0, ruhig = 0; t < 240 && ruhig < 3; t++) { await p.waitForTimeout(500); if (await dialoge()) { ruhig = 0; continue; }
  ruhig = await p.evaluate(() => window.__dbg.UP.items.length > 0 && window.__dbg.UP.items.every(i => i.kind !== 'wait')) ? ruhig + 1 : 0; }
await p.setInputFiles('#slot-hinten input', HINTEN);
pruefe(await fertig(null), 'Hose aus Vorder- und Rückenfoto gebaut');
let sp = await spalt(), s = sp.seiten; fs.writeFileSync(A + 'stoffbild_spalt.png', Buffer.from(sp.bild.split(',')[1], 'base64'));
if (process.env.STOFF_LOG) console.log(JSON.stringify(s.map(o => o.zeilen)));
for (const [k, n] of [[0, 'Vorderseite'], [1, 'Rückseite']]) pruefe(s[k].n > 10 && s[k].weit <= s[k].n * .05,
  `${n}: Spalt zwischen den Beinen stofffarben (${s[k].weit} von ${s[k].n} Zeilen eher Boden ${sp.boden.join('/')} als Bein; mittlerer Abstand zum Bein ${s[k].mittel})`);

// 2) nur Vorderseite: Rückseite geschätzt (gespiegelte Vorderseite), auch dort kein Boden im Spalt
const alt = await p.evaluate(() => window.__dbg.g.key);
await p.click('#drop-new'); await p.waitForTimeout(500);
await p.setInputFiles('#slot-vorne input', VORNE);
pruefe(await fertig(alt), 'Hose nur aus dem Vorderfoto gebaut (Rückseite geschätzt)');
sp = await spalt(); s = sp.seiten; fs.writeFileSync(A + 'stoffbild_spalt_geschaetzt.png', Buffer.from(sp.bild.split(',')[1], 'base64'));
const back = await p.evaluate(() => { const d = window.__dbg, G = d.GARMENTS[d.g.key]; return !!G.backEst; });
pruefe(back, 'Rückseite ist als geschätzt markiert');
pruefe(s[1].n > 10 && s[1].weit <= s[1].n * .05, `geschätzte Rückseite: Spalt stofffarben (${s[1].weit} von ${s[1].n} Zeilen eher Boden als Bein)`);

pruefe(!errs.length, 'keine Skriptfehler' + (errs.length ? ': ' + [...new Set(errs)].slice(0, 3).join(' | ') : ''));
await b.close(); srv.close();
process.exit(fehler ? 1 : 0);
