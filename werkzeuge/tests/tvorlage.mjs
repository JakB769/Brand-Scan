// Oberteile als Vorlage (22.10.): Fotos vorne/hinten in „Oberteil hochladen“ → Art erkannt (T-Shirt, Langarm, Top), Rückseite
// aus dem Stoff erzeugt, wenn sie fehlt, 3D am Standardkörper ohne ungültige Werte, Art umschalten, Maßtabelle → Größen mit
// Urteil je Zone, Größenwechsel ändert die Vorlage sichtbar. Testbilder: werkzeuge/python/testoberteile.py
// Aufruf: node tvorlage.mjs [Testseite] [--bilder <Ordner für Renders>]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const hier=fileURLToPath(new URL('.',import.meta.url)), ob=hier+'../../material/testbilder/oberteile/';
const arg=(n,d)=>{ const i=process.argv.indexOf('--'+n); return i<0?d:process.argv[i+1]; };
const AUS=arg('bilder',hier+'ausgabe/')+'/'; fs.mkdirSync(AUS,{recursive:true});
const seite=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:hier+'testseite-mit-simulierter-person.html';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({permissions:['camera'],viewport:{width:900,height:1100}})).newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver|KI im Test/.test(m.text())) errs.push(m.text()); });
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+seite); await p.waitForTimeout(400);
await p.fill('#height','179'); await p.dispatchEvent('#height','change');
const lade=async(vorne,hinten)=>{ await p.evaluate(()=>{ document.getElementById('ot-msg').textContent=''; });
  if(hinten) await p.setInputFiles('#ot-hinten input',ob+hinten);
  await p.setInputFiles('#ot-vorne input',ob+vorne);
  await p.waitForFunction(()=>/Fertig|nicht|fehlt|Hose/.test(document.getElementById('ot-msg').textContent),null,{timeout:90000});
  return p.evaluate(()=>{ const O=window.__dbg.otAktiv(); return {msg:document.getElementById('ot-msg').textContent,art:O&&O.artAuto,backEst:O&&O.backEst,key:O&&O.key}; }); };
const ansicht=async(name,yaw)=>{ await p.evaluate(y=>{ const v=window.__dbg.v3d; v.ziel=null; v.yaw=y; v.idle=performance.now()+1e7; },yaw);
  await p.waitForTimeout(900); const box=await p.$('#g3dview'); await box.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await box.screenshot({path:AUS+name}); };
// Kennwerte der aktuellen Vorlage: Punkte endlich, Saum, Ärmel, Texturkoordinaten im Atlas
const kenn=()=>p.evaluate(()=>{ const d=window.__dbg, O=d.otAktiv(), A=d.otKoerper(); if(!O||!A) return null; const V=d.otFuer(O,A);
  let ok=true; for(const x of V.P) if(!isFinite(x)) ok=false; for(const x of V.uv) if(!(x>=0&&x<=1)) ok=false;
  return {ok,n:V.n,art:V.art,hem:+V.yHem.toFixed(1),top:+V.yTop.toFixed(1),eB:+V.eB.toFixed(1),aermel:V.sleeves.map(s=>+s.sEnd.toFixed(1)),Y:{nabel:+V.Y.nabel.toFixed(1),gesaess:+V.Y.gesaess.toFixed(1),schritt:+V.Y.schritt.toFixed(1),unterbrust:+V.Y.unterbrust.toFixed(1),huefte:+V.Y.huefte.toFixed(1)},
    breite:(()=>{ let a=1e9,b=-1e9; for(let i=0;i<V.n;i++) if(V.tl[i]===0&&Math.abs(V.P[i*3+1]-(V.Y.brust-2))<1.5){ a=Math.min(a,V.P[i*3]); b=Math.max(b,V.P[i*3]); } return +(b-a).toFixed(1); })()}; });
const pix=()=>p.evaluate(()=>{ const c=document.getElementById('g3dview'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=16) if(d[i]>200) n++; return n; });

// 1. T-Shirt vorne + hinten
let r=await lade('tshirt_vorne.jpg','tshirt_hinten.jpg');
await p.waitForFunction(()=>!!(window.__dbg.otKoerper()&&window.__dbg.AV.kd),null,{timeout:30000}).catch(()=>{});
pruefe(r.art==='tshirt'&&!r.backEst,`T-Shirt erkannt, Rückseite aus dem Foto (${r.msg})`);
await p.waitForTimeout(1500); let k=await kenn();
pruefe(k&&k.ok&&k.aermel.length===2&&k.aermel[0]>14&&k.aermel[0]<24,`Vorlage T-Shirt: ${k&&k.n} Punkte, Ärmel ${k&&k.aermel.join('/')} cm ab Schultergelenk, Saum ${k&&k.hem} cm über dem Boden, Werte gültig`);
pruefe(k&&k.hem>=k.Y.schritt-12.1&&k.hem<=k.Y.nabel+.1,`T-Shirt-Saum ${k&&k.hem} zwischen Schritt − 12 (${k&&(k.Y.schritt-12).toFixed(1)}) und Nabel (${k&&k.Y.nabel})`);
await (await p.$('#g3dview')).scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
pruefe(!(await p.evaluate(()=>document.getElementById('g3dbox').hidden))&&await pix()>3000,'3D-Ansicht zeigt Körper und T-Shirt ohne Hose');
await ansicht('tshirt_vorn.png',0); await ansicht('tshirt_seite.png',Math.PI/2); await ansicht('tshirt_hinten.png',Math.PI);
// Maßtabelle → Größen, Wechsel ändert die Vorlage
await p.evaluate(()=>{ document.getElementById('ot-mass').open=true; }); await p.fill('#ot-tab','Größe S M L XL\nBrustumfang 92 100 110 122\nLänge 68 70 72 74'); await p.dispatchEvent('#ot-tab','change'); await p.waitForTimeout(800);
const gr=await p.evaluate(()=>[...document.querySelectorAll('#ot-szrow button')].map(b=>b.textContent));
pruefe(gr.join(',')==='S,M,L,XL',`Größen aus der Maßtabelle: ${gr.join(', ')}`);
const msg=async n=>{ await p.evaluate(n=>[...document.querySelectorAll('#ot-szrow button')].find(b=>b.textContent===n).click(),n); await p.waitForTimeout(700); return {t:await p.evaluate(()=>document.getElementById('ot-szmsg').textContent),k:await kenn()}; };
const S=await msg('S'), XL=await msg('XL');
pruefe(/Brust/.test(S.t)&&/Empfehlung/.test(S.t),`Urteil S: ${S.t}`);
pruefe(XL.k.breite-S.k.breite>3,`Größenwechsel S → XL: Breite an der Brust ${S.k.breite} → ${XL.k.breite} cm`);
await ansicht('tshirt_xl_vorn.png',0);
await msg('M');
// 2. Langarm nur vorne → Rückseite erzeugt
r=await lade('langarm_vorne.jpg',null);
pruefe(r.art==='langarm'&&r.backEst,`Langarm erkannt, Rückseite aus dem Stoff erzeugt (${r.msg})`);
await p.waitForTimeout(1500); k=await kenn();
pruefe(k&&k.ok&&k.aermel[0]>40,`Vorlage Langarm: Ärmel ${k&&k.aermel.join('/')} cm (bis zum Handgelenk)`);
await ansicht('langarm_vorn.png',0); await ansicht('langarm_hinten.png',Math.PI);
// Rückseite nicht einfarbig: Streuung der Helligkeit im Rückenteil des Atlas
const streu=await p.evaluate(()=>new Promise(res=>{ const O=window.__dbg.otAktiv(), im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); c.width=c.height=1024; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const d=x.getImageData(640,400,240,200).data; let s=0,s2=0,n=0; for(let i=0;i<d.length;i+=4){ const l=.3*d[i]+.59*d[i+1]+.11*d[i+2]; s+=l; s2+=l*l; n++; } res(Math.sqrt(s2/n-(s/n)**2)); }; im.src=O.atlas; }));
pruefe(streu>3,`Erzeugte Rückseite hat Stoffstruktur (Streuung der Helligkeit ${streu.toFixed(1)})`);
// 3. Trägertop
r=await lade('top_vorne.jpg','top_hinten.jpg');
pruefe(r.art==='top',`Trägertop erkannt (${r.msg})`);
await p.waitForTimeout(1500); k=await kenn();
pruefe(k&&k.ok&&k.aermel.length===0&&k.hem>=k.Y.gesaess-.1&&k.hem<=k.Y.unterbrust+.1,`Vorlage Top: keine Ärmel, Saum ${k&&k.hem} zwischen Gesäß und Unterbrust`);
await ansicht('top_vorn.png',0); await ansicht('top_hinten.png',Math.PI);
// Art von Hand korrigieren: Top → T-Shirt
await p.click('#ot-art [data-art="tshirt"]'); await p.waitForTimeout(800); k=await kenn();
pruefe(k&&k.art==='tshirt'&&k.aermel.length===2,'Art von Hand umgeschaltet (Top → T-Shirt): Vorlage mit Ärmeln');
await p.click('#ot-art [data-art="top"]'); await p.waitForTimeout(300);
// 4. Hose im Oberteil-Feld → Hinweis
r=await lade('../../produktfotos/front.jpg',null);
pruefe(/Hose/.test(r.msg),`Hose im Oberteil-Feld erkannt: ${r.msg}`);
// 4b. T-Shirt im Hosen-Bereich: wird als Oberteil erkannt und dort angelegt (nicht als Hose)
const nOt=await p.evaluate(()=>Object.keys(window.__dbg.OT.liste).length);
await p.evaluate(()=>{ document.getElementById('ot-msg').textContent=''; });
await p.setInputFiles('#drop-in',[ob+'tshirt_vorne.jpg',ob+'tshirt_hinten.jpg']);
await p.waitForFunction(()=>/Fertig|nicht/.test(document.getElementById('ot-msg').textContent),null,{timeout:120000}).catch(()=>{});
const hb=await p.evaluate(n=>({n:Object.keys(window.__dbg.OT.liste).length-n,liste:document.getElementById('drop-list').innerText.replace(/\n/g,' / ').slice(0,160),art:window.__dbg.otAktiv().artAuto}),nOt);
pruefe(hb.n===1&&hb.art==='tshirt'&&/Oberteil/.test(hb.liste),`T-Shirt im Hosen-Bereich → als Oberteil angelegt (${hb.liste})`);
// 5. Live-Anprobe mit der Attrappe: T-Shirt wählen, Kamera starten, Oberteil liegt auf dem Rumpf, folgt Drehung und Armen
await p.evaluate(()=>{ const d=window.__dbg, k=Object.values(d.OT.liste).find(o=>o.artAuto==='tshirt').key; d.OT.aktiv=k; });
await p.click('#quick'); await p.waitForTimeout(5000); await p.click('#clean').catch(()=>{}); await p.waitForTimeout(1500);
const blau=async(name)=>{ await p.waitForTimeout(1200); const st=await p.$('#stage'); await st.screenshot({path:AUS+name});
  return p.evaluate(()=>{ const c=document.getElementById('overlay'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0,sx=0,sy=0;
    for(let y=0;y<c.height;y+=3) for(let x=0;x<c.width;x+=3){ const i=(y*c.width+x)*4; if(d[i+3]>200&&d[i+2]>d[i]+20&&d[i+2]>70){ n++; sx+=x; sy+=y; } }
    return {n,cx:n?sx/n/c.width:0,cy:n?sy/n/c.height:0}; }); };
let lv=await blau('live_tshirt_vorn.png');
pruefe(lv.n>400&&lv.cy>.15&&lv.cy<.6,`Live: T-Shirt auf dem Oberkörper (${lv.n} Bildpunkte, Mitte bei ${(lv.cy*100).toFixed(0)} % der Bildhöhe)`);
await p.evaluate(()=>{ window.__mode.yaw=1.2; window.__mode.zk=0; }); const ls=await blau('live_tshirt_seite.png');
pruefe(ls.n>150&&ls.n<lv.n,`Live: gedreht schmaler (${ls.n} statt ${lv.n} Bildpunkte)`);
await p.evaluate(()=>{ window.__mode.yaw=0; window.__mode.hand=1; }); const lh=await blau('live_tshirt_hand.png');
pruefe(lh.n>300,`Live: mit Hand vor dem Körper weiter sichtbar (${lh.n} Bildpunkte)`);
await p.evaluate(()=>{ window.__mode.hand=0; });
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
console.log(fehler?`${fehler} FEHLER`:'alles ok'); await b.close(); process.exit(fehler?1:0);
