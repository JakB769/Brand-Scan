// Sammlung: alle Hosen als Datei sichern, auf einem anderen Gerät laden, hosen.json neben der Seite (wie auf Netlify)
// Aufruf: node tsammlung.mjs [Testseite]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import path from 'path';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/', tb=hier+'../../material/testbilder/';
const seite=process.argv[2]||hier+'testseite-mit-simulierter-person.html';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
const neu=async url=>{ const ctx=await b.newContext({viewport:{width:1000,height:950},acceptDownloads:true}); const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver/.test(m.text())&&!/\/api\/hosen/.test((m.location()||{}).url||'')) errs.push(m.text()+' '+((m.location()||{}).url||'')); });   // /api/hosen fehlt hier wie bei Netlify Drop: 404 gewollt
  await p.goto(url); await p.waitForTimeout(500); return {ctx,p,errs}; };
const anlegen=async(p,front,back,name,mat)=>{ await p.setInputFiles('#own-front',front); await p.setInputFiles('#own-back',back?[back]:[]);
  await p.fill('#own-waist','40'); await p.fill('#own-name',name); await p.fill('#own-mat',mat||'');
  await p.evaluate(()=>document.getElementById('own-msg').textContent=''); await p.click('#own-go');
  await p.waitForFunction(()=>/Fertig|Bitte/.test(document.getElementById('own-msg').textContent),null,{timeout:60000}); };
const liste=p=>p.evaluate(()=>Object.values(window.__dbg.GARMENTS).map(G=>G.label+(G.shared?' (Datei)':'')).sort());
const ausgabe=hier+'ausgabe/'; fs.mkdirSync(ausgabe,{recursive:true});

// 1) Gerät A: zwei Hosen anlegen, als Datei sichern
const A=await neu('file://'+seite);
await anlegen(A.p,fotos+'front.jpg',fotos+'back.jpg','Baggy','98 % Baumwolle, 2 % Elasthan');
await anlegen(A.p,tb+'freistellung/parkett.jpg',null,'Parkett','100 % Leinen');
await A.p.fill('#g-len','104'); await A.p.dispatchEvent('#g-len','change');
const [dl]=await Promise.all([A.p.waitForEvent('download'),A.p.click('#g-export')]);
const datei=ausgabe+'hosen.json'; await dl.saveAs(datei);
const J=JSON.parse(fs.readFileSync(datei,'utf8'));
pruefe(dl.suggestedFilename()==='hosen.json'&&J.hosen.length===2&&J.hosen.every(h=>h.G.m3&&!('prof' in h.G)),`Als Datei gesichert: ${J.hosen.length} Hosen, ${Math.round(fs.statSync(datei).size/1024)} KB`);
pruefe(J.hosen.some(h=>h.G.label==='Parkett'&&h.G.len===104&&h.G.material==='100 % Leinen'),'Eingetragene Länge und Material sind in der Datei');
pruefe(A.errs.length===0,'Gerät A ohne Skriptfehler'+(A.errs.length?': '+A.errs.slice(0,2).join(' | '):''));
await A.ctx.close();

// 2) Gerät B (leerer Speicher): Datei laden, Hose wählen, 3D lädt; zweimal laden → nichts doppelt
const B=await neu('file://'+seite);
await B.p.setInputFiles('#g-import',datei); await B.p.waitForTimeout(800);
const l1=await liste(B.p), m1=await B.p.evaluate(()=>document.getElementById('g-msg').textContent);
pruefe(l1.join()==='Baggy,Parkett'&&/2 Hosen geladen/.test(m1),`Aus Datei geladen: ${l1.join(', ')} – ${m1}`);
const d1=await B.p.evaluate(()=>{ const G=Object.values(window.__dbg.GARMENTS).find(G=>G.label==='Parkett'); return {len:G.len,fab:G.material,prof:!!G.prof}; });
pruefe(d1.len===104&&d1.prof,'Werte übernommen und Modell geprüft');
await B.p.setInputFiles('#g-import',datei); await B.p.waitForTimeout(500);
const m2=await B.p.evaluate(()=>document.getElementById('g-msg').textContent);
pruefe((await liste(B.p)).length===2&&/Nichts Neues, 2 schon da/.test(m2),'Noch einmal geladen: '+m2);
await B.p.reload(); await B.p.waitForTimeout(500);
pruefe((await liste(B.p)).length===2,'Nach Neuladen im Gerät gespeichert');
fs.writeFileSync(ausgabe+'kaputt.json','{"hosen":[{"key":"x","G":{"label":"x"}}]}');
await B.p.setInputFiles('#g-import',ausgabe+'kaputt.json'); await B.p.waitForTimeout(300);
pruefe(/keine Hosen/.test(await B.p.evaluate(()=>document.getElementById('g-msg').textContent)),'Falsche Datei: verständliche Meldung, nichts geladen');
pruefe(B.errs.length===0,'Gerät B ohne Skriptfehler'+(B.errs.length?': '+B.errs.slice(0,2).join(' | '):''));
await B.ctx.close();

// 3) hosen.json neben der Seite (wie Netlify): lädt beim Öffnen, liegt nicht doppelt im Speicher, Ändern macht sie zur eigenen,
//    Löschen bleibt gelöscht
const ordner=ausgabe+'netlify/'; fs.mkdirSync(ordner,{recursive:true});
fs.copyFileSync(seite,ordner+'index.html'); fs.copyFileSync(datei,ordner+'hosen.json');
const srv=http.createServer((q,r)=>{ const f=ordner+(q.url.split('?')[0]==='/'?'index.html':decodeURIComponent(q.url.split('?')[0].slice(1)));
  if(!fs.existsSync(f)){ r.writeHead(404); r.end(); return; }
  r.writeHead(200,{'content-type':f.endsWith('.json')?'application/json':'text/html; charset=utf-8'}); r.end(fs.readFileSync(f)); });
await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const url=`http://127.0.0.1:${srv.address().port}/`;
const C=await neu(url); await C.p.waitForTimeout(800);
const l3=await liste(C.p), sp=await C.p.evaluate(()=>JSON.parse(localStorage.getItem('massScanHosen')||'[]').length);
pruefe(l3.join()==='Baggy (Datei),Parkett (Datei)'&&sp===0,`hosen.json neben der Seite geladen: ${l3.join(', ')}, im Gerät gespeichert: ${sp}`);
await C.p.click('.gbtn[data-g]'); await C.p.waitForTimeout(300);
await C.p.fill('#g-len','99'); await C.p.dispatchEvent('#g-len','change'); await C.p.waitForTimeout(300);
const geaendert=await C.p.evaluate(()=>window.__dbg.g.key);
await C.p.evaluate(k=>{ const o=document.querySelector(`.gdel:not([data-del="${k}"])`); o.click(); o.click(); },geaendert);
await C.p.reload(); await C.p.waitForTimeout(900);
const l4=await liste(C.p), sp2=await C.p.evaluate(()=>JSON.parse(localStorage.getItem('massScanHosen')||'[]').map(o=>o.G.len));
pruefe(l4.length===1&&!/Datei/.test(l4[0])&&sp2.join()==='99',`Geänderte Hose gehört jetzt dem Gerät (${l4.join()}, Länge ${sp2.join()}), gelöschte kommt nicht wieder`);
pruefe(C.errs.length===0,'Netlify-Fall ohne Skriptfehler'+(C.errs.length?': '+C.errs.slice(0,2).join(' | '):''));
await C.ctx.close(); srv.close();

// 4) Speicher voll: Datei laden meldet, was nur bis zum Neuladen da ist
const D=await neu('file://'+seite);
await D.p.evaluate(()=>{ let s='x'.repeat(1<<16), i=0; try{ for(;;) localStorage.setItem('fueller'+(i++),s); }catch(_){}
  for(let k=1;k<40;k++){ try{ localStorage.setItem('fuellerK'+k,'x'.repeat(1<<(16-Math.min(k,15)))); }catch(_){} } });
await D.p.setInputFiles('#g-import',datei); await D.p.waitForTimeout(800);
const m4=await D.p.evaluate(()=>document.getElementById('g-msg').textContent);
pruefe(/passen nicht mehr in den Speicher/.test(m4)&&(await liste(D.p)).length===2,'Speicher voll: '+m4.slice(0,90));
await D.ctx.close();
await b.close();
if(fehler) process.exit(1);
