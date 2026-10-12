// „Link einfügen“: Shop-Seite über den Server-Teil (netlify/functions/holen.mjs) holen, Bilder und Maßtabelle übernehmen.
// Eigener kleiner Server wie auf Netlify (Seite + /api/holen) mit künstlichen Shop-Seiten aus shop/ (Größentabelle im
// Diesel-Format, US-Größe des Models, Shopify, gesperrter Shop, Foto mit Person). Dazu die Schutzregeln des Server-Teils.
// MediaPipe kommt aus node_modules, die Modelle wie in tdateien.mjs aus ausgabe/ (ohne sie fehlt der Teil mit der Person).
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';
import path from 'path';
process.env.HOLEN_LOKAL='1';                         // Links auf diesen Rechner erlauben (nur im Test)
const { default: holen } = await import('../../netlify/functions/holen.mjs');
const hier=fileURLToPath(new URL('.',import.meta.url)), R=path.resolve(hier,'../..')+'/', NM=R+'node_modules/', shop=hier+'shop/';
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };

// 1) Schutzregeln, direkt am Server-Teil
const frag=async(u,env)=>{ const alt=process.env.HOLEN_LOKAL; process.env.HOLEN_LOKAL=env; try{ const r=await holen(new Request('http://x/api/holen?url='+encodeURIComponent(u))); return {s:r.status,j:await r.json()}; } finally{ process.env.HOLEN_LOKAL=alt; } };
let a=await frag('http://127.0.0.1:9/x','0'); pruefe(a.s===400&&/nicht erlaubt/.test(a.j.error),'Adresse im eigenen Netz gesperrt: '+a.j.error);
a=await frag('http://169.254.169.254/latest/meta-data/','0'); pruefe(a.s===400&&/nicht erlaubt/.test(a.j.error),'Metadaten-Adresse gesperrt');
// IPv4 in IPv6 verpackt (die URL schreibt [::ffff:127.0.0.1] als [::ffff:7f00:1]), NAT64, 6to4, Zahlen-Schreibweisen
for(const u of ['http://[::ffff:127.0.0.1]/','http://[::ffff:169.254.169.254]/latest/meta-data/','http://[::127.0.0.1]/','http://[64:ff9b::a9fe:a9fe]/','http://[2002:7f00:1::]/','http://[fe80::1]/','http://0x7f000001/','http://127.1/'])
  { a=await frag(u,'0'); pruefe(a.s===400&&/nicht erlaubt/.test(a.j.error),'gesperrt: '+u); }
a=await frag('file:///etc/passwd','0'); pruefe(a.s===400&&/http/.test(a.j.error),'file:-Link abgelehnt: '+a.j.error);
a=await frag('kein link','0'); pruefe(a.s===400,'Unsinn abgelehnt: '+a.j.error);

// 2) Server wie auf Netlify: Seite, /api/holen, künstliche Shop-Seiten
const TYP={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.wasm':'application/wasm'};
const srv=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/api/holen'){ const r=await holen(new Request(u.href)); res.writeHead(r.status,Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return; }
  if(u.pathname==='/gesperrt'){ res.writeHead(403,{'content-type':'text/html'}); res.end('<html><body>Access denied</body></html>'); return; }
  let f=/^\/products\/test-(jeans|varianten)$/.test(u.pathname)?shop+'shopify.html':u.pathname==='/products/test-jeans.js'?shop+'shopify.json':u.pathname==='/products/test-varianten.js'?shop+'shopify-varianten.json'
    :u.pathname.startsWith('/shop/')?shop+u.pathname.slice(6):R+decodeURIComponent(u.pathname.slice(1));
  f=path.resolve(f); if(!f.startsWith(R.slice(0,-1))||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200,{'content-type':TYP[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(res);
});
await new Promise(ok=>srv.listen(0,ok)); const port=srv.address().port, B=`http://localhost:${port}`;

// 3) Die Seite im Browser
const modell={}; for(const n of ['magic_touch.tflite','pose_landmarker_full.task']){ const f=hier+'ausgabe/'+n; if(fs.existsSync(f)) modell[n]=fs.readFileSync(f); }
const ki=Object.keys(modell).length===2;
const typ=f=>f.endsWith('.wasm')?'application/wasm':/\.m?js$/.test(f)?'application/javascript':'application/octet-stream';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:1000,height:1000}});
await ctx.route('**/@mediapipe/tasks-vision@0.10.18/**',r=>{ const f=NM+'@mediapipe/tasks-vision/'+decodeURIComponent(r.request().url().split('@0.10.18/')[1].split('?')[0]);
  if(!fs.existsSync(f)) return r.abort(); r.fulfill({status:200,contentType:typ(f),headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(f)}); });
for(const n of ['magic_touch.tflite','pose_landmarker_full.task']) await ctx.route('**/'+n,r=>modell[n]?r.fulfill({status:200,body:modell[n],headers:{'access-control-allow-origin':'*'}}):r.abort());
await ctx.route('**/fonts.googleapis.com/**',r=>r.abort());
if(ki) await ctx.addInitScript(()=>{ window.__kiTest=true; });
const punkte=JSON.parse(fs.readFileSync(R+'material/testbilder/getragen/hinten_getragen_punkte.json','utf8'));
await ctx.addInitScript(L=>{ window.__poseMock=cv=>cv.width===600&&cv.height===1200?L:null; },punkte);
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(B+'/werkzeuge/tests/testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
await p.fill('#height','179');
const lage=()=>p.evaluate(()=>({m:document.getElementById('drop-msg').textContent,l:[...document.querySelectorAll('.ditem .dtxt b')].map(e=>e.textContent),
  busy:document.getElementById('link-go').disabled,fit:!document.getElementById('drop-fit').hidden,seg:!document.getElementById('segDlg').hidden}));
const warte=async()=>{ let z; for(let t=0;t<240;t++){ await p.waitForTimeout(500); z=await lage();
    if(z.seg){ await p.click('#segOk'); continue; }
    if(!z.busy&&z.m&&!/wird|werden|geprüft|berechnet|gelesen …/.test(z.m)&&!z.l.some(x=>/geprüft|gelesen/.test(x))) return z; } return z; };
const link=async u=>{ await p.fill('#link-in',u); await p.click('#link-go'); return warte(); };
const hose=()=>p.evaluate(()=>{ const G=window.__dbg.GARMENTS[window.__dbg.g.key]; return G?{label:G.label,len:G.len,waist:G.waist,hem:G.hem,mat:G.material,meas:G.meas,link:G.link}:null; });

// Größentabelle auf eigener Seite, Model-Größe M
let z=await link(B+'/shop/jeans.html'), G=await hose();
pruefe(z.l.includes('Vorderseite, flach')&&z.l.includes('Rückseite, flach'),'Bilder von der Seite geholt und eingeordnet: '+z.l.join(', '));
pruefe(z.l.some(x=>/Maßtabelle \(S M L\)/.test(x)),'verlinkte Größentabelle gelesen (Blöcke je Größe)');
pruefe(G&&G.waist===41&&G.len===110&&G.hem===25,`Größe M wie am Model: Bund ${G&&G.waist}, Länge ${G&&G.len} (Innenbein 81 + Leibhöhe 29), Saum ${G&&G.hem}`);
pruefe(/wie am Model/.test(z.m)&&/Fertig/.test(z.m),'Meldung nennt die Größe des Models: '+z.m.slice(0,120));
pruefe(G&&G.label==='Weite Testjeans'&&/Elasthan/.test(G.mat||'')&&G.link===B+'/shop/jeans.html','Name, Material und Link übernommen: '+(G&&G.label)+' · '+(G&&G.mat));
await p.selectOption('#drop-size','2'); z=await warte(); G=await hose();
pruefe(G&&G.waist===43&&G.len===111,`Größe L gewählt: Bund ${G&&G.waist}, Länge ${G&&G.len}`);

// nur die US-Größe des Models (32 × 32)
z=await link(B+'/shop/modell.html'); G=await hose();
pruefe(G&&Math.abs(G.waist-41.9)<.2&&Math.abs(G.len-(32*2.54+.62*41.9))<.6,`aus „32 X 32“: Bund ${G&&G.waist}, Länge ${G&&G.len}`);

// Shopify: Bilder und Beschreibung aus /products/<name>.js
z=await link(B+'/products/test-jeans'); G=await hose();
pruefe(G&&G.label==='Shopify Testjeans'&&z.l.includes('Vorderseite, flach'),'Shopify-Seite: '+(G&&G.label)+' · '+z.l.join(', '));
pruefe(G&&G.waist===41&&G.len===108,`Tabelle aus der Shopify-Beschreibung: Bund ${G&&G.waist}, Länge ${G&&G.len}`);
// Shopify mit Varianten (Weite/Länge), Maße nur für 32/32: übrige Größen hochgerechnet und als geschätzt markiert
z=await link(B+'/products/test-varianten'); G=await hose();
const sz=await p.evaluate(()=>{ const G=window.__dbg.GARMENTS[window.__dbg.g.key]; return G&&G.sizes?G.sizes.map(z=>({n:z.n,w:z.waist,l:z.len,est:!!z.est})):[]; });
console.log('Größen:',sz.map(z=>`${z.est?'≈':''}${z.n} ${z.w}/${z.l}`).join(' · '));
const s32=sz.find(z=>z.n==='32/32'), s28=sz.find(z=>z.n==='28/30');
pruefe(sz.length===8&&s32&&!s32.est&&s32.w===42&&s32.l===108,'Shopify-Varianten als Größen, 32/32 gemessen (Bund 42, Länge 108)');
pruefe(s28&&s28.est&&Math.abs(s28.w-(42-5.08))<.1&&Math.abs(s28.l-(108-4*.79-5.08))<.2&&sz.filter(z=>z.est).length===7,`übrige hochgerechnet und geschätzt: 28/30 Bund ${s28&&s28.w}, Länge ${s28&&s28.l}`);
pruefe(G&&G.waist===42&&G.len===108&&/hochgerechnet/.test(z.m),'vorgewählt die Größe mit Maßen (32/32), Hinweis „hochgerechnet“: '+(G&&G.waist)+' / '+(G&&G.len));

// Shop sperrt automatische Abrufe
z=await link(B+'/gesperrt'); pruefe(/lässt keine automatischen Abrufe zu/.test(z.m),'gesperrter Shop: '+z.m.slice(0,90));

// Foto mit Person, keine Tabelle: Länge am Foto gemessen, Abgleich mit dem Foto erscheint
if(ki){ z=await link(B+'/shop/getragen.html'); G=await hose();
  pruefe(z.l.some(x=>/Person, von hinten/.test(x)),'Foto mit Person erkannt: '+z.l.join(', '));
  pruefe(G&&G.meas&&G.meas.ref==='model'&&G.meas.len>60&&G.meas.len<140&&/am Foto mit Model gemessen/.test(z.m),`Länge am Foto mit Model gemessen: ${G&&G.meas&&G.meas.len} cm (Model 180 cm laut Seite)`);
  for(let t=0;t<30&&!(await lage()).fit;t++) await p.waitForTimeout(500);
  const f=await p.evaluate(()=>({fit:!document.getElementById('drop-fit').hidden,t:document.getElementById('fit-txt').textContent,src:document.getElementById('fit-b').src.length}));
  pruefe(f.fit&&f.src>5000&&/180 cm laut Shop/.test(f.t),'Abgleich: 3D-Hose auf dem Foto mit Model: '+f.t.slice(0,100)); }
else console.log('übersprungen: Foto mit Person (Modelle nicht erreichbar)');

// Link einfügen per Strg+V auf der Seite
await p.evaluate(u=>{ const d=new DataTransfer(); d.setData('text/plain',u); document.body.dispatchEvent(new ClipboardEvent('paste',{clipboardData:d,bubbles:true})); },B+'/shop/modell.html');
z=await warte(); G=await hose(); pruefe(/Fertig/.test(z.m)&&G&&/^Test Baggy Jeans/.test(G.label),'eingefügter Link wird geholt: '+(G&&G.label));

// Ohne Server-Teil (Datei oder Netlify Drop): klare Meldung
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(300);
await p.fill('#link-in','https://example.com/hose'); await p.click('#link-go'); await p.waitForTimeout(1500);
z=await lage(); pruefe(/geht hier noch nicht/.test(z.m),'ohne Server-Teil: '+z.m.slice(0,80));

pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close(); srv.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
