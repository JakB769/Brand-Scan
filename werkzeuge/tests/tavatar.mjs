// Avatar aus dem Selbst-Scan (16.10.) mit der Attrappe: Knopf → Einwilligung (Anleitung, Datenschutz, Größe, Mann/Frau) →
// Frontal-Scan → einmal drehen (die Attrappe dreht sich) → Avatar. Geprüft: Ziele aus dem Scan gegen die bekannte Attrappe
// (Rumpf 36 cm breit, von der Seite 0,55 × 36 = 19,8 cm tief, 180 cm groß), Avatar so nah daran, wie das Körpermodell es zulässt,
// Kamera danach aus, gespeichert nur Zahlen (keine Bilder), Ansicht mit Avatar (Knöpfe vorn/Seite/hinten, Mausrad-Zoom, Reset),
// Größenauswahl nimmt die Maße des Avatars, nach dem Neuladen wieder da, Löschen mit zwei Tippern wie bei den Hosen.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';
import path from 'path';
const hier=fileURLToPath(new URL('.',import.meta.url)), R=path.resolve(hier,'../..')+'/', fotos=R+'material/produktfotos/';
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
// über http (nicht file://): das Körpermodell wird als Skript nachgeladen
const TYP={'.json':'application/json','.html':'text/html; charset=utf-8','.js':'application/javascript','.jpg':'image/jpeg','.png':'image/png'};
const srv=http.createServer((req,res)=>{ const f=path.resolve(R+decodeURIComponent(new URL(req.url,'http://x').pathname.slice(1)));
  if(!f.startsWith(R)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end(); }
  res.writeHead(200,{'content-type':TYP[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(res); });
await new Promise(ok=>srv.listen(0,'127.0.0.1',ok)); const URL0=`http://127.0.0.1:${srv.address().port}/werkzeuge/tests/testseite-mit-simulierter-person.html`;
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1000,height:1000}});
const p=await ctx.newPage(); const errs=[];  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver/.test(m.text())) errs.push(m.text()+' '+JSON.stringify(m.location().url||'')); });
await p.goto(URL0); await p.waitForTimeout(400);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
await p.fill('#height','180');
await p.evaluate(()=>{ window.__mode.knieSchmal=1; });          // Körper in enger Kleidung (Knie schmaler als Oberschenkel)
const ui=()=>p.evaluate(()=>({scan:document.getElementById('avScan').textContent,del:!document.getElementById('avDel').hidden,
  ans:[...document.querySelectorAll('.avansicht')].some(e=>!e.hidden),form:!!window.__dbg.AV.form}));
let u=await ui();
pruefe(/Avatar aus Selbst-Scan/.test(u.scan)&&!u.del&&!u.ans&&!u.form,`ohne Avatar: Knopf „${u.scan.trim()}“, kein ✕, keine Ansicht-Knöpfe`);

// 1) Einwilligung
await p.click('#avScan'); await p.waitForTimeout(200);
const dlg=await p.evaluate(()=>({offen:!document.getElementById('avDlg').hidden,t:document.getElementById('avDlg').innerText,g:document.getElementById('avGroesse').value}));
pruefe(dlg.offen&&/abstellen/.test(dlg.t)&&/Enge Kleidung/.test(dlg.t)&&/langsam einmal/.test(dlg.t),'Einwilligung: Anleitung (abstellen, Abstand, enge Kleidung, langsam drehen)');
pruefe(/nichts wird\s+hochgeladen/.test(dlg.t)&&/verworfen/.test(dlg.t)&&/Löschen jederzeit/.test(dlg.t),'Einwilligung: Datenschutz-Hinweis (nur im Browser, Bilder verworfen, löschbar)');
pruefe(dlg.g==='180',`Größe aus dem Formular übernommen (${dlg.g})`);
await p.fill('#avGroesse','18'); await p.click('#avJa'); await p.waitForTimeout(300);
pruefe(await p.evaluate(()=>!document.getElementById('avDlg').hidden&&!window.__dbg.AVS.on),'unsinnige Größe: Dialog bleibt, keine Kamera');
await p.click('#avNein'); await p.waitForTimeout(200);
pruefe(await p.evaluate(()=>document.getElementById('avDlg').hidden&&!window.__dbg.AVS.on),'Abbrechen: Dialog zu, kein Scan');
// Körpermodell fehlt (nur index.html hochgeladen): gleich abgebrochen, Kamera aus, Hinweis im Avatar-Bereich (20.11.: nicht mehr beim
// 3D-Bereich, der Sprung dorthin nach der Kamera-Frage sah aus wie „fertig, aber Kamera geht nicht auf“)
// (die Einwilligung oben hat das Körpermodell schon geladen: hier vergessen, als wäre die Datei nie da gewesen)
await p.evaluate(()=>{ const A=window.__dbg.AV; A.kd=null; A.laed=null; A.kdFehler=null; window.__avUrl=window.PASSFORM_AVATAR_URL; window.PASSFORM_AVATAR_URL='fehlt/koerper.js'; });
await p.click('#avScan'); await p.fill('#avGroesse','180'); await p.click('#avJa'); await p.waitForTimeout(2500);
const fe=await p.evaluate(()=>({on:window.__dbg.AVS.on,cam:!!document.getElementById('video').srcObject,msg:document.getElementById('avStatus').hidden?'':document.getElementById('avStatusText').textContent}));
pruefe(!fe.on&&!fe.cam&&/koerper\.js/.test(fe.msg),`Körpermodell fehlt: Scan abgebrochen, Kamera aus, Hinweis im Avatar-Bereich „${fe.msg.slice(0,60)}…“`);
await p.evaluate(()=>{ window.PASSFORM_AVATAR_URL=window.__avUrl; });
// Kamera verweigert: Avatar-Scan nicht scharf (sonst würde der nächste normale Scan ohne Einwilligung zum Avatar)
await p.evaluate(()=>{ window.__gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('verweigert','NotAllowedError')); });
await p.click('#avScan'); await p.fill('#avGroesse','180'); await p.click('#avJa'); await p.waitForTimeout(2000);
pruefe(await p.evaluate(()=>!window.__dbg.AVS.on&&!document.getElementById('video').srcObject),'Kamera verweigert: kein Avatar-Scan scharf');
await p.evaluate(()=>{ navigator.mediaDevices.getUserMedia=window.__gum; });
errs.length=0;                                                   // 404 und Fehler des Körpermodells waren gewollt

// 2) Scan: Frontal-Scan, dann einmal drehen
await p.click('#avScan'); await p.fill('#avGroesse','180'); await p.click('#avJa');
const t0=Date.now(); let st='';
for(let t=0;t<60&&st!=='drehen';t++){ await p.waitForTimeout(250); st=await p.evaluate(()=>window.__dbg.AVS.stufe); }
pruefe(st==='drehen',`Frontal-Scan fertig nach ${((Date.now()-t0)/1000).toFixed(1)} s, Aufforderung zum Drehen`);
const coach=await p.evaluate(()=>document.getElementById('coachBig').textContent);
pruefe(/drehen/i.test(coach),`Anzeige: „${coach}“`);
// Attrappe dreht sich gleichmäßig (0,55 rad/s, eine Drehung in etwa 11 s)
await p.evaluate(()=>{ const t0=performance.now(); window.__dreh=setInterval(()=>{ let y=((performance.now()-t0)/1000*.55)%(2*Math.PI); if(y>Math.PI) y-=2*Math.PI; window.__mode.yaw=y; },30); });
const hinweise=new Set(), proz=[];
for(let t=0;t<120;t++){ await p.waitForTimeout(250); const z=await p.evaluate(()=>({f:!!window.__dbg.AV.form,c:document.getElementById('coachBig').textContent,s:(document.getElementById('scanPct')||{}).textContent||'',ui:!document.getElementById('scanUI').hidden}));   // Fortschritt seit 18.11. in der Scan-Oberfläche
  if(z.c) hinweise.add(z.c); const q=z.ui&&/Drehung (\d+) %/.exec(z.s); if(q) proz.push(+q[1]); if(z.f) break; }
await p.evaluate(()=>{ clearInterval(window.__dreh); window.__mode.yaw=0; });
const r=await p.evaluate(()=>{ const d=window.__dbg; return {form:!!d.AV.form,daten:d.AV.daten,on:d.AVS.on,cam:!!(document.getElementById('video').srcObject),
  n:Object.fromEntries(Object.entries(d.AVS.proben||{}).map(([k,v])=>[k,v.length]))}; });
pruefe(r.form,`Avatar fertig nach ${((Date.now()-t0)/1000).toFixed(0)} s, Proben ${JSON.stringify(r.n)}`);
pruefe(proz.length>=3&&proz[proz.length-1]>proz[0],`Fortschritt angezeigt (${proz.length} Mal, ${proz[0]} → ${proz[proz.length-1]} %), Hinweise: ${[...hinweise].join(' | ')}`);
pruefe(hinweise.size<=3,`großer Text ruhig (${hinweise.size} verschiedene)`);
pruefe(!r.on&&!r.cam,'danach Kamera aus, Scan beendet');
if(!r.form){ console.log(errs.slice(0,5)); await b.close(); srv.close(); process.exit(1); }
const a=r.daten, z=a.z, m=a.m, f=v=>(+v).toFixed(1);
// Sollwerte: die Attrappe ist mit Kopf und Fußsohlen (runde Enden) etwas größer als 180 cm, der Scan rechnet aber mit 180 cm;
// gemessen wird darum alles im Verhältnis Maßstab des Scans / echter Maßstab der Attrappe (225 cm je Bildhöhe)
const k=await p.evaluate(()=>window.__dbg.caps.cal.cmPerUnit*.8/180), sollB=36*k, sollT=19.8*k;
console.log(`       Maßstab des Scans ${k.toFixed(3)} × echt: Soll Breite ${f(sollB)}, Tiefe ${f(sollT)} cm`);
console.log(`       Ziele: Taille ${f(z.waistW)}×${f(z.waistD)}, Hüfte ${f(z.hipW)}×${f(z.hipD)}, Bein ${f(z.leg)}, Schritt ${f(z.inseam)}`);
console.log(`       Avatar: Taille ${f(m.waistW)}×${f(m.waistD)} (Umfang ${f(m.waist)}), Hüfte ${f(m.hipW)}×${f(m.hipD)} (Umfang ${f(m.hip)}), Bein ${f(m.leg)}, Schritt ${f(m.inseam)}, Restfehler ${a.rest}`);
pruefe(Math.abs(z.hipW-sollB)<2&&Math.abs(z.waistW-sollB)<2,`Scan, Breiten von vorn/hinten: Hüfte ${f(z.hipW)}, Taille ${f(z.waistW)} cm (Soll ${f(sollB)} ± 2)`);
pruefe(Math.abs(z.hipD-sollT)<2&&Math.abs(z.waistD-sollT)<2,`Scan, Tiefen von der Seite: Hüfte ${f(z.hipD)}, Taille ${f(z.waistD)} cm (Soll ${f(sollT)} ± 2)`);
pruefe(Math.abs(m.H-180)<.5,`Avatar ${f(m.H)} cm groß (180)`);
// Das Körpermodell kennt keine so flachen Körper (Tiefe/Breite 0,55, Menschen ≈ 0,65–0,75): Breite trifft es, die Tiefe liegt dazwischen
pruefe(Math.abs(m.hipW-z.hipW)<2&&Math.abs(m.waistW-z.waistW)<2.5,`Avatar trifft die Breiten (Hüfte ${f(m.hipW-z.hipW)}, Taille ${f(m.waistW-z.waistW)} cm)`);
pruefe(m.hipD>=z.hipD-1&&m.hipD<z.hipD+6,`Avatar-Tiefe Hüfte ${f(m.hipD)} cm: nicht flacher als gemessen, höchstens so tief wie ein realer Körper`);
// unter dem Avatar steht seit 30.10. immer, was der Scan verändert hat („Aus deinem Scan …“); Warnungen dürfen keine dabei sein
const avMsg=await p.evaluate(()=>document.getElementById('avMsg').textContent);
pruefe(a.lose===false&&a.kamera===false&&!/Weite Kleidung|unnatürlich|Keine Seitenansicht/.test(avMsg),'enge Silhouette, Beine 53 % der Größe (Attrappe): keine Warnung');
pruefe(/Aus deinem Scan/.test(avMsg)&&/Taille \d+ \(\d+\)/.test(avMsg),`Hinweis zeigt, was der Scan verändert hat: „${avMsg.slice(0,110)}…“`);
// geeicht (22.10., AV_EICH.leg): der Scan misst die Hüftpunkte der Erkennung 4,3 % höher als das Hüftgelenk des Körpermodells
pruefe(Math.abs(m.leg-z.leg/1.043)<2.5,`Hüftgelenk über dem Boden: Avatar ${f(m.leg)}, Scan ${f(z.leg)} cm (geeicht ${f(z.leg/1.043)})`);

// 3) gespeichert, nur Zahlen
const roh=await p.evaluate(()=>localStorage.getItem('passformAvatar')||'');
pruefe(roh.length>50&&roh.length<3000&&!/data:|blob:|base64/.test(roh),`gespeichert: ${roh.length} Zeichen, keine Bilder`);
const keys=Object.keys(JSON.parse(roh)).sort().join(',');
pruefe(keys==='H,at,farben,g,kamera,lose,m,ohneTiefe,p,rest,v,z',`gespeicherte Felder: ${keys}`);

// 4) Ansicht: Avatar in der 3D-Ansicht, Knöpfe, Zoom
u=await ui(); pruefe(/Neu scannen/.test(u.scan)&&u.del&&u.ans,`mit Avatar: „${u.scan.trim()}“, ✕ und Ansicht-Knöpfe sichtbar`);
await p.evaluate(()=>document.getElementById('g3dbox').scrollIntoView({block:'center'})); await p.waitForTimeout(800);
const sub=await p.evaluate(()=>document.getElementById('g3dSub').textContent);
pruefe(/Dein Avatar \(180 cm\)/.test(sub),`Untertitel: „${sub.slice(0,60)}…“`);
await p.click('.avansicht [data-ansicht="3.1416"]').catch(async()=>{ await p.click('.avansicht [data-ansicht]:nth-child(3)'); });
await p.waitForTimeout(1500);
let v=await p.evaluate(()=>({yaw:window.__dbg.v3d.yaw,zoom:window.__dbg.v3d.zoom||1}));
pruefe(Math.abs(Math.abs(((v.yaw%(2*Math.PI))+2*Math.PI)%(2*Math.PI)-Math.PI))<.05,`Knopf „hinten“: Drehung ${v.yaw.toFixed(2)} rad`);
const bb=await p.evaluate(()=>{ const r=document.getElementById('g3dview').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
await p.mouse.move(bb.x,bb.y); await p.mouse.wheel(0,-400); await p.waitForTimeout(300);
v=await p.evaluate(()=>({zoom:window.__dbg.v3d.zoom||1}));
pruefe(v.zoom===1,`Mausrad ohne Strg: kein Zoom (die Seite rollt weiter)`);
await p.evaluate(()=>document.getElementById('g3dbox').scrollIntoView({block:'center'})); await p.waitForTimeout(300);
const bb2=await p.evaluate(()=>{ const r=document.getElementById('g3dview').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
await p.mouse.move(bb2.x,bb2.y); await p.keyboard.down('Control'); await p.mouse.wheel(0,-400); await p.keyboard.up('Control'); await p.waitForTimeout(300);
v=await p.evaluate(()=>({zoom:window.__dbg.v3d.zoom||1}));
pruefe(v.zoom>1.5&&v.zoom<=4,`Strg + Mausrad: Zoom ${v.zoom.toFixed(2)}×`);
await p.click('#avZoomEin'); const z2=await p.evaluate(()=>window.__dbg.v3d.zoom);
await p.click('#avZoomAus'); await p.click('#avZoomAus'); const z3=await p.evaluate(()=>window.__dbg.v3d.zoom);
pruefe(z2>v.zoom&&z3<z2,`Knöpfe + und −: ${v.zoom.toFixed(2)} → ${z2.toFixed(2)} → ${z3.toFixed(2)}`);
// gezoomt nach unten ziehen: Ausschnitt wandert, nie weiter als der Rand; bei Zoom 1 keine Verschiebung
await p.evaluate(()=>{ window.__dbg.v3d.zoom=3; });
await p.mouse.move(bb2.x,bb2.y); await p.mouse.down(); await p.mouse.move(bb2.x,bb2.y+2000,{steps:4}); await p.mouse.up();
const pa=await p.evaluate(()=>({pan:window.__dbg.v3d.pan,H:window.__dbg.AV.form.H}));
const pmax=(1-1/3)*(pa.H+4)/1.8;
pruefe(pa.pan>0&&pa.pan<=pmax+.01,`gezoomt verschieben: ${pa.pan.toFixed(1)} cm (Grenze ${pmax.toFixed(1)})`);
await p.click('#avZoomAus'); await p.click('#avZoomAus'); await p.click('#avZoomAus'); await p.click('#avZoomAus');
const pz=await p.evaluate(()=>({z:window.__dbg.v3d.zoom,pan:window.__dbg.v3d.pan}));
pruefe(pz.z===1&&pz.pan===0,`ganz herausgezoomt: Verschiebung zurück (${pz.pan})`);
await p.click('#avReset'); await p.waitForTimeout(1200);
v=await p.evaluate(()=>({yaw:window.__dbg.v3d.yaw,zoom:window.__dbg.v3d.zoom||1}));
pruefe(v.zoom===1,`Reset: Zoom ${v.zoom}×`);
// Bild: Avatar sichtbar (hautfarbene Punkte oberhalb der Hose), Hose davor
// Avatar im Bild: gezeichnete Punkte in den oberen 40 % (Kopf, Oberkörper; die Hose liegt tiefer)
const px=await p.evaluate(()=>{ const c=document.getElementById('g3dview'), H=Math.round(c.height*.4), x=c.getContext('2d').getImageData(0,0,c.width,H).data; let n=0;
  for(let i=0;i<x.length;i+=4*7) if(x[i+3]>200) n++; return n; });
pruefe(px>300,`Avatar im Bild (${px} gezeichnete Stichproben über der Hose)`);
// Erscheinung: Farben aus dem Kamerabild (Chromiums künstliche Kamera zeigt ein grünes Testbild), nur Zahlen gespeichert.
// Fuß: im einfarbigen Testbild gleich dem Boden vor den Zehen → verworfen (seit 18.10. gewollt, sonst Boden als Socke);
// die Darstellung nimmt dann die Hautfarbe. Ist er da, muss er gültig sein.
const fa=JSON.parse(roh).farben||{}, farbe=c=>Array.isArray(c)&&c.length===3&&c.every(x=>typeof x==='number'&&x>=0&&x<=1);
pruefe(['haut','haare','oberteil'].every(k=>farbe(fa[k]))&&(!('fuss' in fa)||farbe(fa.fuss))&&Object.keys(fa).every(k=>['haut','haare','oberteil','fuss'].includes(k)),
  `Farben aus dem Kamerabild: ${JSON.stringify(fa)}${'fuss' in fa?'':' (Fuß wie der Boden: verworfen)'}`);

// Größenwechsel am Avatar: kleinste und größte Größe antippen → Bund der Hose am Avatar sichtbar weiter, Urteil je Zone da
const bund=()=>p.evaluate(()=>{ const D=window.__dbg, P=D.g3.pos, NR=D.g3.nr, C=D.g3.nRing/(4*NR); let a=1e9,b=-1e9;
  for(let s=0;s<2;s++) for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const k=((s*NR)*2+f)*C+j; a=Math.min(a,P[k*3]); b=Math.max(b,P[k*3]); } return b-a; });
await p.evaluate(()=>{ const v=window.__dbg.v3d; v.ziel=null; v.yaw=0; v.idle=performance.now()+1e7; });
const nChips=await p.$$eval('#g-szrow .szchip',c=>c.length);
const vorn=()=>p.evaluate(()=>{ const v=window.__dbg.v3d; v.ziel=null; v.yaw=0; v.idle=performance.now()+1e7; });   // von vorn messen (dreht sonst weiter)
await p.click('#g-szrow .szchip >> nth=0'); await vorn(); await p.waitForTimeout(2000); const w0=await bund();
await p.click('#g-szrow .szchip >> nth=-1'); await vorn(); await p.waitForTimeout(2000); const w1=await bund();
const zt=await p.evaluate(()=>document.getElementById('g-szmsg').innerText);
pruefe(nChips>=3&&w1>w0*1.1&&/Spiel am Bund/.test(zt),`Größenwechsel am Avatar (${nChips} Größen): Bund ${(100*(w1/w0-1)).toFixed(0)} % breiter von der kleinsten zur größten, Zonen „${(zt.split('\n').find(l=>/Spiel am Bund/.test(l))||'').slice(0,50)}…“`);
await p.click(`#g-szrow .szchip >> nth=${Math.floor(nChips/2)}`); await p.waitForTimeout(500);

// 5) Größenauswahl nimmt den Avatar
const gr=await p.evaluate(()=>document.getElementById('g-szmsg')?document.getElementById('g-szmsg').innerText:'');
pruefe(/Avatar/.test(gr)&&!/Maßband/.test(gr),`Größenauswahl: Maße aus dem Avatar („${gr.split('\n').find(l=>/Avatar/.test(l))||gr.slice(0,80)}“)`);

// 6) Neu laden: wieder da
await p.reload(); await p.waitForTimeout(400);
await p.evaluate(()=>{ const b=document.querySelector('#gwrap .gbtn'); if(b&&b.getAttribute('aria-pressed')!=='true') b.click(); });
for(let t=0;t<40&&!(await p.evaluate(()=>!!(window.__dbg&&window.__dbg.AV.form)));t++) await p.waitForTimeout(250);
u=await ui(); pruefe(u.form&&u.del&&u.ans,'nach dem Neuladen: Avatar wieder da');
const m2=await p.evaluate(()=>window.__dbg.AV.form.m);
pruefe(Math.abs(m2.hip-m.hip)<.3&&Math.abs(m2.inseam-m.inseam)<.3,`gleiche Form wie vorher (Hüfte ${f(m2.hip)} / ${f(m.hip)})`);

// andere Größe oben (andere Person): Puppe statt Avatar, Hinweis, Größenauswahl ohne Avatar
await p.evaluate(()=>document.getElementById('g3dbox').scrollIntoView({block:'center'}));
const groesse=async h=>{ await p.fill('#height',h); await p.dispatchEvent('#height','input');
  await p.evaluate(()=>document.getElementById('g3dbox').scrollIntoView({block:'center'})); await p.waitForTimeout(1200); };
await groesse('172');
const an=await p.evaluate(()=>({sub:document.getElementById('g3dSub').textContent,msg:document.getElementById('avMsg').textContent,gr:document.getElementById('g-szmsg').innerText}));
pruefe(/Puppe/.test(an.sub)&&/für 180 cm/.test(an.msg)&&!/Avatar/.test(an.gr),`andere Größe (172): Puppe, Hinweis „${an.msg.slice(0,50)}…“, Größen ohne Avatar`);
await groesse('180');
pruefe(/Dein Avatar/.test(await p.evaluate(()=>document.getElementById('g3dSub').textContent)),'wieder 180: Avatar');
// ✕ sitzt neben „Neu scannen“ (nicht oben auf der Seite)
const lage=await p.evaluate(()=>{ const a=document.getElementById('avScan').getBoundingClientRect(), b=document.getElementById('avDel').getBoundingClientRect(); return {dy:Math.abs((a.top+a.bottom)/2-(b.top+b.bottom)/2),dx:b.left-a.right}; });
pruefe(lage.dy<10&&lage.dx>=0&&lage.dx<40,`✕ neben „Neu scannen“ (Abstand ${Math.round(lage.dx)} px, Höhe ±${Math.round(lage.dy)} px)`);

// 7) Löschen: erst „Löschen?“, dann weg
await p.click('#avDel'); await p.waitForTimeout(150);
const frag=await p.evaluate(()=>({t:document.getElementById('avDel').textContent,form:!!window.__dbg.AV.form}));
pruefe(/Löschen\?/.test(frag.t)&&frag.form,'erstes Tippen: „Löschen?“, noch nichts gelöscht');
await p.click('#avDel'); await p.waitForTimeout(400);
u=await ui(); const leer=await p.evaluate(()=>localStorage.getItem('passformAvatar'));
pruefe(!u.form&&!u.del&&!u.ans&&leer===null&&/Avatar aus Selbst-Scan/.test(u.scan),'zweites Tippen: Avatar und gespeicherte Maße gelöscht');
await p.evaluate(()=>document.getElementById('g3dbox').scrollIntoView({block:'center'}));
let sub2=''; for(let t=0;t<50&&!/Puppe/.test(sub2);t++){ await p.waitForTimeout(200); sub2=await p.evaluate(()=>document.getElementById('g3dSub').textContent); }
const diag=/Puppe/.test(sub2)?'':await p.evaluate(()=>{ const D=window.__dbg, v=D.v3d, b=document.getElementById('g3dbox'), r=b.getBoundingClientRect();
  return JSON.stringify({vis:v.vis,raf:v.raf,hidden:b.hidden,form:!!D.AV.form,rechnet:D.AV.rechnet,top:Math.round(r.top),h:Math.round(r.height),ih:innerHeight,key:D.g.key,teuer:Math.round(v.teuer||0),ausg:v.ausgelassen}); });
pruefe(/Puppe/.test(sub2),'3D-Ansicht wieder mit der Puppe'+(/Puppe/.test(sub2)?'':': „'+sub2.slice(0,60)+'“ '+diag));

// 8) Weite Kleidung (Attrappe wie sonst: Knie so breit wie der Oberschenkel): erkannt, Umfänge nur als Obergrenze, Hinweis
await p.evaluate(()=>{ window.__mode.knieSchmal=0; window.__mode.yaw=0; });
await p.click('#avScan'); await p.fill('#avGroesse','180'); await p.click('#avJa');
for(let t=0;t<60&&await p.evaluate(()=>window.__dbg.AVS.stufe)!=='drehen';t++) await p.waitForTimeout(250);
await p.evaluate(()=>{ const t0=performance.now(); window.__dreh=setInterval(()=>{ let y=((performance.now()-t0)/1000*.55)%(2*Math.PI); if(y>Math.PI) y-=2*Math.PI; window.__mode.yaw=y; },30); });
for(let t=0;t<120&&!(await p.evaluate(()=>!!window.__dbg.AV.form));t++) await p.waitForTimeout(250);
await p.evaluate(()=>{ clearInterval(window.__dreh); window.__mode.yaw=0; });
const w=await p.evaluate(()=>({d:window.__dbg.AV.daten,msg:document.getElementById('avMsg'),gr:document.getElementById('g-szmsg').innerText}));
const wl=await p.evaluate(()=>({hidden:document.getElementById('avMsg').hidden,t:document.getElementById('avMsg').textContent}));
pruefe(w.d&&w.d.lose===true&&!wl.hidden&&/Weite Kleidung/.test(wl.t),`weite Kleidung erkannt (Knie ${w.d&&f(w.d.z.kneeW)} / Oberschenkel ${w.d&&f(w.d.z.thighW)} cm), Hinweis sichtbar`);
pruefe(w.d&&w.d.m.hipW<=w.d.z.hipW+.5&&w.d.m.waistW<=w.d.z.waistW+.5,`Umfänge nicht über dem Umriss (Hüfte ${w.d&&f(w.d.m.hipW)} ≤ ${w.d&&f(w.d.z.hipW)})`);
pruefe(/weite Kleidung/.test(w.gr),'Größenauswahl sagt, dass die Umfänge geschätzt sind');
await p.click('#avDel'); await p.click('#avDel'); await p.waitForTimeout(300);

// ohne Hosen-Sammlung auf diesem Testserver (hosen.json, /api/hosen): 404 ist dort normal
const errs2=errs.filter(e=>!/404/.test(e)||!/hosen\.json|api\/hosen/.test(e)); errs.length=0; errs.push(...errs2);
pruefe(errs.length===0,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
await b.close(); srv.close();
console.log(fehler?`${fehler} Fehler`:'Avatar in Ordnung'); process.exit(fehler?1:0);
