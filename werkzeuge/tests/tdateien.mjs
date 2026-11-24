// „Dateien hochladen“: alles auf einmal hineinwerfen, die Seite sortiert selbst (flach vorne/hinten, Shop-Screenshot,
// Foto mit Person, Maßtabelle als Text oder Bild), sagt, was fehlt, und lehnt unrealistische Hosen ab.
// MediaPipe (Personenerkennung, KI-Freistellung) und Tesseract (Texterkennung) kommen aus node_modules, die zwei Modelle
// von MediaPipe einmal von storage.googleapis.com (zwischengespeichert in ausgabe/). Ohne diese Modelle wird der Teil
// mit der Person übersprungen. Das getragene Rückenfoto ist künstlich (werkzeuge/python/testgetragen.py), seine
// Körperpunkte werden statt der Erkennung vorgegeben.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';
const hier=fileURLToPath(new URL('.',import.meta.url)), R=hier+'../../', NM=R+'node_modules/';
const fotos=R+'material/produktfotos/', anh=R+'material/anhaenge/', tb=R+'material/testbilder/';
const MOD={'magic_touch.tflite':'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite',
  'pose_landmarker_full.task':'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'};
const modell={};
for(const [n,u] of Object.entries(MOD)){ const f=hier+'ausgabe/'+n; try{ if(!fs.existsSync(f)) execSync(`curl -sSLf -m 180 -o "${f}" ${u}`,{stdio:'ignore'}); modell[n]=fs.readFileSync(f); }catch(_){} }
const ki=!!(modell['magic_touch.tflite']&&modell['pose_landmarker_full.task']);
const typ=f=>f.endsWith('.wasm')?'application/wasm':/\.m?js$/.test(f)?'application/javascript':'application/octet-stream';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:1000,height:1000}});
const serve=(pat,base,cut)=>ctx.route(pat,r=>{ const f=base+decodeURIComponent(r.request().url().split(cut)[1].split('?')[0]);
  if(!fs.existsSync(f)) return r.abort(); r.fulfill({status:200,contentType:typ(f),headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(f)}); });
await serve('**/@mediapipe/tasks-vision@0.10.18/**',NM+'@mediapipe/tasks-vision/','@0.10.18/');
await serve('**/tesseract.js@7.0.0/**',NM+'tesseract.js/','tesseract.js@7.0.0/');
await serve('**/tesseract.js-core@7.0.0/**',NM+'tesseract.js-core/','tesseract.js-core@7.0.0/');
await serve('**/@tesseract.js-data/**',NM+'@tesseract.js-data/','@tesseract.js-data/');
for(const n of Object.keys(MOD)) await ctx.route('**/'+n,r=>modell[n]?r.fulfill({status:200,body:modell[n],headers:{'access-control-allow-origin':'*'}}):r.abort());
if(ki) await ctx.addInitScript(()=>{ window.__kiTest=true; });
// künstliches Foto von hinten: Körperpunkte vorgeben (nur für dieses Bild, 600 × 1200)
const punkte=JSON.parse(fs.readFileSync(tb+'getragen/hinten_getragen_punkte.json','utf8'));
await ctx.addInitScript(L=>{ window.__poseMock=cv=>cv.width===600&&cv.height===1200?L:null; },punkte);
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+(process.argv[2]||hier+'testseite-mit-simulierter-person.html')); await p.waitForTimeout(400);
await p.fill('#height','179');
// Dateien hochladen und warten, bis alles eingeordnet und (wenn möglich) gebaut ist
const lage=()=>p.evaluate(()=>({m:document.getElementById('drop-msg').textContent,l:[...document.querySelectorAll('.ditem .dtxt b')].map(e=>e.textContent),
  n:Object.keys(window.__dbg.GARMENTS).length,seg:!document.getElementById('segDlg').hidden}));
const warte=async()=>{ for(let t=0;t<240;t++){ await p.waitForTimeout(500); const z=await lage();
    if(z.seg){ await p.click('#segOk'); continue; }
    if(!z.l.some(x=>/geprüft|gelesen/.test(x))&&!/berechnet|geprüft|übernommen …|wird/.test(z.m)&&z.m) return z; }
  return lage(); };
const hoch=async(...f)=>{ await p.setInputFiles('#drop-in',f); return warte(); };
const neu=()=>p.click('#drop-new');
const modell3=()=>p.evaluate(()=>{ const G=window.__dbg.GARMENTS[window.__dbg.g.key]; return G?{len:G.len,waist:G.waist,label:G.label,mat:G.material,D:null}:null; });

// 1) Zwei flache Produktfotos: vorne/hinten richtig, Modell sofort, ohne Tabelle „geschätzt“
let z=await hoch(fotos+'back.jpg',fotos+'front.jpg');
pruefe(z.l.join('|')==='Rückseite, flach|Vorderseite, flach','back.jpg und front.jpg richtig eingeordnet (Reihenfolge egal): '+z.l.join(', '));
pruefe(/Fertig/.test(z.m)&&/nur geschätzt/.test(z.m),'Modell sofort gebaut, Größe als geschätzt gemeldet: '+z.m.slice(0,140));
const n0=z.n;
// 2) Ganzer Shop-Screenshot: zwei Hosen herausgeschnitten (links vorne, rechts hinten)
await neu(); z=await hoch(anh+'082eaae0-image.png');
pruefe(z.l.length===2&&/Vorderseite/.test(z.l[0])&&/Rückseite/.test(z.l[1]),'Screenshot zerlegt: '+z.l.join(', '));
pruefe(/Fertig/.test(z.m)&&z.n===n0+1,'Hose aus dem Screenshot gebaut');
// 3) Maßtabelle als Text dazu: Größe M (Mitte) übernommen, andere Größe gewählt → neue Maße, dieselbe Hose
fs.writeFileSync(hier+'ausgabe/tabelle.txt','Größe: XS S M L XL\nBundweite (flach): 36 38 40 42 44\nAußenlänge: 104 105 106 107 108\nInnenbeinlänge: 76 77 78 79 80\nMaterial: 98% Baumwolle, 2% Elasthan\n');
z=await hoch(hier+'ausgabe/tabelle.txt');
let m=await modell3();
pruefe(/Größe M/.test(z.m)&&m.len===106&&m.waist===40,`Tabelle gelesen, Größe M: Länge ${m.len}, Bund ${m.waist}`);
pruefe(/Elasthan/.test(m.mat||''),'Material aus der Tabelle übernommen: '+m.mat);
pruefe(z.n===n0+1,'Tabelle dazu ändert dieselbe Hose (keine zweite)');
await p.selectOption('#drop-size','4'); z=await warte(); m=await modell3();
pruefe(m.len===108&&m.waist===44&&/Größe XL/.test(z.m),`Größe XL gewählt: Länge ${m.len}, Bund ${m.waist}`);
// 4) Größentabelle als Bild (nur Körpermaße, Texterkennung): Bund aus dem Taillenumfang geschätzt
await neu(); z=await hoch(fotos+'front.jpg',anh+'48de005b-image.png'); m=await modell3();
pruefe(z.l.some(x=>/nur Körpermaße/.test(x)),'Bild der Größentabelle als Körpermaße erkannt: '+z.l.join(', '));
pruefe(m&&m.waist===43&&/Körpermaß Taille 82/.test(z.m),`Bund aus Taillenumfang 82 cm geschätzt: ${m&&m.waist} cm`);
// 5) Nur eine Tabelle: es fehlt das flache Foto
await neu(); z=await hoch(hier+'ausgabe/tabelle.txt');
pruefe(/fehlt ein flaches Foto/.test(z.m),'Nur Tabelle: „'+z.m.slice(0,60)+'…“');
// 6) Foto mit Person (Model von vorne, Beine nicht ganz im Bild): erkannt, nicht als Hose benutzt
if(ki){ await neu(); z=await hoch(tb+'getragen/model_vorne_bershka.jpg');
  pruefe(/Person, von vorne/.test(z.l[0]||'')&&/fehlt ein flaches Foto/.test(z.m),'Model-Foto: '+z.l[0]+' → '+z.m.slice(0,50)); }
else console.log('übersprungen: Personenerkennung (Modelle nicht erreichbar)');
// 6b) Model-Foto nur von der Hüfte abwärts (wie bei Shops üblich, kein Gesicht): Haut im Umriss → angeschnitten, nicht als Vorderseite benutzt
await neu(); z=await hoch(fotos+'front.jpg',tb+'getragen/model_ausschnitt_bershka.jpg');
pruefe(z.l[0]==='Vorderseite, flach'&&/angeschnitten/.test(z.l[1]||'')&&/Fertig/.test(z.m),'angeschnittenes Model-Foto nicht benutzt: '+z.l.join(', '));
// 7) Flach vorne + getragen hinten: Rückseite aus dem Foto mit Person, Taschen oben, Kniefleck auf Kniehöhe
await neu(); z=await hoch(fotos+'front.jpg',tb+'getragen/hinten_getragen.jpg');
pruefe(/Person, von hinten/.test(z.l[1]||'')&&/Rückseite: aus dem Foto mit Person/.test(z.m)&&/Fertig/.test(z.m),'getragenes Rückenfoto benutzt: '+z.l.join(', '));
const at=await p.evaluate(async()=>{ const M=window.__dbg.GARMENTS[window.__dbg.g.key].m3, im=new Image(); im.src=M.atlas; await im.decode();
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const W=c.width, H=c.height, d=x.getImageData(0,0,W,H).data, ic=M.v.findIndex(v=>v>=M.vc);
  const row=v=>{ let k=0; while(k<M.nr-2&&M.v[k+1]<v) k++; return M.tvb[k]*H; };
  let orange=[], gelb=[];
  for(let y=0;y<H;y++) for(let xx=W/2;xx<W;xx++){ const i=(y*W+xx)*4, r=d[i],g=d[i+1],b=d[i+2];
    if(r>190&&g>90&&g<170&&b<90) orange.push(y); if(r>190&&g>170&&b<110) gelb.push(y); }
  const med=a=>a.length?a.sort((p,q)=>p-q)[a.length>>1]:-1, yC=row(M.vc), yE=row(.985);
  return {orange:orange.length,oY:med(orange),gelb:gelb.length,gY:med(gelb),yC,yE};});
pruefe(at.orange>100&&at.oY<at.yC,`Gesäßtaschen oben auf der Rückseite (${at.orange} Punkte, Zeile ${at.oY}, Schritt bei ${Math.round(at.yC)})`);
const kf=(at.gY-at.yC)/(at.yE-at.yC);
pruefe(at.gelb>40&&Math.abs(kf-.43)<.08,`Kniefleck bei ${(kf*100).toFixed(0)} % der Beinlänge (im Foto 43 %)`);
// 8) Unrealistisch: ein Bein doppelt so breit, Handtuch mit Schlitz → abgelehnt, nichts angelegt
await neu(); const vor=(await lage()).n; z=await hoch(tb+'unecht/schief_bein.jpg');
pruefe(/keine realistische Hose/.test(z.m)&&/breiter als das andere/.test(z.m)&&z.n===vor,'schiefes Bein abgelehnt: '+z.m.slice(0,90));
await neu(); z=await hoch(tb+'unecht/handtuch.jpg');
pruefe(/keine realistische Hose|keine Hose erkannt|fehlt ein flaches Foto/.test(z.m)&&z.n===vor,'Handtuch abgelehnt: '+z.m.slice(0,90));
// 9a) Rock mit Gürtel (Gürtel gehört nicht dazu): als Rock erkannt, Gürtel aus Stoffbild und Umriss, 3D ohne ungültige Werte
await neu(); z=await hoch(tb+'rock/rock_vorne_guertel.jpg',tb+'rock/rock_hinten.jpg');
const rk=await p.evaluate(async()=>{ const G=window.__dbg.GARMENTS[window.__dbg.g.key], M=G.m3, im=new Image(); im.src=M.atlas; await im.decode();
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const W=c.width, d=x.getImageData(0,0,W/2,c.height).data; let braun=0;
  for(let i=0;i<d.length;i+=4) if(d[i]-d[i+2]>45&&d[i]>80) braun++;
  return {rock:!!M.rock,braun,wf:M.wf}; });
pruefe(rk.rock&&/Fertig \(Rock\)/.test(z.m),'Rock erkannt: '+z.m.slice(z.m.indexOf('Fertig'),z.m.indexOf('Fertig')+60));
pruefe(/Gürtel erkannt und entfernt/.test(z.m)&&rk.braun<60,`Gürtel entfernt (braune Punkte im Stoffbild vorne: ${rk.braun})`);
const r3=await (async()=>{ const box=await p.$('#g3dview'); await box.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
  return p.evaluate(()=>{ const g3=window.__dbg.g3; let nan=false; for(let k=0;k<g3.nv*3;k++) if(!isFinite(g3.pos[k])){ nan=true; break; } return {nan,rock:g3.form&&g3.form.rock}; }); })();
pruefe(!r3.nan&&r3.rock,'Rock in der 3D-Ansicht ohne ungültige Werte');
// „⇄ Hose“: als Hose bauen lassen, dann wieder Rock
await p.click('#drop-art'); z=await warte();
pruefe(!/Fertig \(Rock\)/.test(z.m)&&/Fertig|realistische|Modell fehlerhaft/.test(z.m),'Umschalter baut ihn als Hose (oder die Schranke lehnt ihn als Hose ab): '+z.m.slice(Math.max(0,z.m.indexOf('Fertig')),Math.max(0,z.m.indexOf('Fertig'))+40));
await p.click('#drop-art'); z=await warte();
pruefe(/Fertig \(Rock\)/.test(z.m),'und wieder als Rock');
// 9b) Jeans mit Gürtel: Gürtel weg, Maße wie ohne Gürtel; ohne Gürtel kein Fehlalarm
await neu(); z=await hoch(tb+'rock/jeans_guertel.jpg',fotos+'back.jpg'); const mg=await p.evaluate(()=>window.__dbg.GARMENTS[window.__dbg.g.key].m3.wf);
pruefe(/Gürtel erkannt und entfernt/.test(z.m)&&!/Rock/.test(z.m),'Jeans mit Gürtel: Gürtel entfernt, bleibt Hose');
await neu(); z=await hoch(fotos+'front.jpg',fotos+'back.jpg'); const m0=await p.evaluate(()=>window.__dbg.GARMENTS[window.__dbg.g.key].m3.wf);
pruefe(!/Gürtel/.test(z.m),'Jeans ohne Gürtel: kein Fehlalarm');
pruefe(Math.abs(mg/m0-1)<.06,`Bund im Verhältnis zur Länge mit Gürtel ${mg.toFixed(3)}, ohne ${m0.toFixed(3)} (überstehende Enden nicht mitgezählt)`);
// 9) Einfügen (Strg+V) einer Tabelle als Text
await neu(); await hoch(fotos+'front.jpg');
await p.evaluate(()=>{ const dt=new DataTransfer(); dt.setData('text/plain','Größe 38\nBundweite 41 cm\nAußenlänge 107 cm');
  document.activeElement&&document.activeElement.blur(); document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true})); });
z=await warte(); m=await modell3();
pruefe(m&&m.len===107&&m.waist===41,`eingefügter Text übernommen: Länge ${m&&m.len}, Bund ${m&&m.waist}`);
// 10) Das alte Einzel-Formular prüft genauso
await p.setInputFiles('#own-front',tb+'unecht/schief_bein.jpg'); await p.setInputFiles('#own-back',[]); await p.click('#own-go');
await p.waitForFunction(()=>/realistische|Fertig|ließ/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
pruefe(/keine realistische Hose/.test(await p.evaluate(()=>document.getElementById('own-msg').textContent)),'Einzel-Formular lehnt das schiefe Bein ebenso ab');
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(fehler||errs.length) process.exit(1);
