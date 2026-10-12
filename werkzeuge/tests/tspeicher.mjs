// Sammlung auf dem Server (/api/hosen): eine Hose, die auf einem Gerät angelegt wird, ist auf jedem anderen Gerät und unter
// jeder Adresse da (zwei getrennte Browser = zwei Geräte bzw. zwei Netlify-Links); Ändern kommt an, Löschen mit ✕ und
// Bestätigung löscht überall; mit Team-Code (PASSFORM_TEAMCODE) wird ohne Code nichts hochgeladen, mit Code schon.
// Lokaler Server wie Netlify (werkzeuge/server.mjs), Speicher in einem Testordner statt Netlify Blobs.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import path from 'path';
const hier=fileURLToPath(new URL('.',import.meta.url)), R=path.resolve(hier,'../..')+'/', NM=R+'node_modules/', fotos=R+'material/produktfotos/';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'passform-hosen-')); process.env.HOSEN_DIR=dir;
const { starte }=await import('../server.mjs');
const srv=await starte(0), URL0=`http://localhost:${srv.address().port}/app/index.html`;
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
const typ=f=>f.endsWith('.wasm')?'application/wasm':/\.m?js$/.test(f)?'application/javascript':'application/octet-stream';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const errs=[];
const geraet=async()=>{ const ctx=await b.newContext({viewport:{width:1000,height:1200}});
  await ctx.route('**/@mediapipe/tasks-vision@0.10.18/**',r=>{ const f=NM+'@mediapipe/tasks-vision/'+decodeURIComponent(r.request().url().split('@0.10.18/')[1].split('?')[0]);
    if(!fs.existsSync(f)) return r.abort(); r.fulfill({status:200,contentType:typ(f),headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(f)}); });
  await ctx.route('**/*.tflite',r=>r.abort()); await ctx.route('**/*.task',r=>r.abort());
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.goto(URL0); await p.waitForTimeout(800); return p; };
const dateien=()=>fs.readdirSync(dir).filter(n=>n.endsWith('.json'));
const warte=async(f,ms=8000)=>{ for(let t=0;t<ms/200;t++){ if(await f()) return true; await new Promise(r=>setTimeout(r,200)); } return false; };
const liste=p=>p.evaluate(()=>[...document.querySelectorAll('#gwrap .gbtn span')].map(e=>e.textContent));
const bauen=async(p,name)=>{ await p.evaluate(()=>{ for(const d of document.querySelectorAll('details.adv')) d.open=true; });
  await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg');
  await p.fill('#own-name',name); await p.fill('#own-waist','40'); await p.click('#own-go');
  await p.waitForFunction(()=>/Fertig|nicht/.test(document.getElementById('own-msg').textContent),null,{timeout:90000}); };

// 1) Gerät A legt eine Hose an: sie landet auf dem Server
const A=await geraet(); await bauen(A,'Blaue Baggy');
pruefe(await warte(()=>dateien().length===1),'Hose von Gerät A ist auf dem Server ('+dateien().length+')');
pruefe(/allen Geräten/.test(await A.evaluate(()=>document.getElementById('g-msg').textContent)),'Hinweis „auf allen Geräten und Links da“');
// 2) Gerät B (leerer Speicher, andere Adresse wäre genauso): Hose ist da
const B=await geraet();
pruefe(await warte(async()=>(await liste(B)).some(t=>/Blaue Baggy/.test(t))),'Gerät B sieht die Hose ohne sie anzulegen: '+(await liste(B)).join(' | '));
// 3) Gerät B ändert die Länge: Gerät A bekommt sie beim nächsten Öffnen
const waehle=p=>p.evaluate(()=>{ for(const d of document.querySelectorAll('details.adv')) d.open=true; const b=document.querySelector('#gwrap .gbtn'); if(b&&b.getAttribute('aria-pressed')!=='true') b.click(); });
await waehle(B);
await B.waitForTimeout(500); await B.fill('#g-len','103'); await B.dispatchEvent('#g-len','input'); await B.dispatchEvent('#g-len','change');
await new Promise(r=>setTimeout(r,3500));
await A.reload(); await A.waitForTimeout(800);
const lenA=await (async()=>{ let v=''; await warte(async()=>{ await waehle(A); v=await A.evaluate(()=>document.getElementById('g-len').value); return /103/.test(v); }); return v; })();
pruefe(/103/.test(lenA),'Änderung auf Gerät B kommt auf Gerät A an (Länge '+lenA+')');
// 4) Gerät B löscht mit ✕ (erst „Löschen?“, dann löschen): weg auf dem Server und auf Gerät A
await B.click('#gwrap .gdel'); const frage=await B.evaluate(()=>document.querySelector('#gwrap .gdel').textContent); await B.click('#gwrap .gdel');
pruefe(/Löschen\?/.test(frage),'✕ fragt kurz nach („'+frage+'“)');
pruefe(await warte(()=>dateien().length===0),'gelöscht auf dem Server');
await A.reload(); await A.waitForTimeout(800);
pruefe(await warte(async()=>!(await liste(A)).some(t=>/Blaue Baggy/.test(t))),'auch auf Gerät A weg: '+(await liste(A)).join(' | '));
// 5) Team-Code gesetzt: ohne Code nichts hochladen (Hinweis), mit Code schon
process.env.PASSFORM_TEAMCODE='geheim-123';
await bauen(A,'Schwarze Chino');
await A.waitForTimeout(2500);
pruefe(dateien().length===0&&/Team-Code/.test(await A.evaluate(()=>document.getElementById('g-msg').textContent)),'ohne Team-Code: nichts auf dem Server, Hinweis');
await A.fill('#teamCode','geheim-123'); await A.dispatchEvent('#teamCode','change');
pruefe(await warte(()=>dateien().length===1),'mit Team-Code hochgeladen');
const r=await fetch(`http://localhost:${srv.address().port}/api/hosen?key=x`,{method:'DELETE'});
pruefe(r.status===401,'Löschen ohne Team-Code über die Schnittstelle abgelehnt ('+r.status+')');
const kaputt=await fetch(`http://localhost:${srv.address().port}/api/hosen?key=../x`,{method:'GET'});
pruefe(kaputt.status===400,'ungültiges Kürzel abgelehnt ('+kaputt.status+')');
delete process.env.PASSFORM_TEAMCODE;
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close(); srv.close(); fs.rmSync(dir,{recursive:true,force:true});
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
