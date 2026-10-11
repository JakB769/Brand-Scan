// Scan-Ablauf (11.10.): hinstellen → nach etwa einer Sekunde gescannt, die Hose liegt sofort auf (auch schon vorher und auch
// nah an der Kamera), kein Pflicht-Drehen; die Seite wird nebenbei gemessen, wenn man sich einmal dreht; näher kommen geht
// sofort, die Hose bleibt richtig groß. Dazu Robustheit: Rumpf geneigt und Handstand (Hose dreht mit), schneller Sprung.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
const cmN=.8/180;
const alpha=(lat,hgt)=>p.evaluate(([lat,hgt])=>{ const c=document.getElementById('overlay'), x=c.getContext('2d');
  const cmN=.8/180, X=Math.round((.5+lat*cmN/(1280/720))*c.width), Y=Math.round((.9-hgt*cmN)*c.height);
  return x.getImageData(X,Y,1,1).data[3]; },[lat,hgt]);
const zustand=()=>p.evaluate(()=>({cal:document.getElementById('step-cal').classList.contains('done'),side:document.getElementById('step-side').classList.contains('done'),
  big:document.getElementById('coachBig').textContent,status:document.getElementById('statusText').textContent,ppc:window.__dbg.g3.lastPpc,
  frame:window.__dbg.g3.frame?{up:window.__dbg.g3.frame.up,top:window.__dbg.g3.frame.top}:null}));

// 1) Nah an der Kamera ins Bild (Füße nicht zu sehen): noch kein Scan, aber die Hose liegt schon auf
await p.evaluate(()=>Object.assign(window.__mode,{zoom:1.7,hueftY:.45,rand:'raten'}));
await p.click('#quick');
await p.waitForTimeout(2500);
let z=await zustand();
pruefe(!z.cal&&/ganz ins Bild/.test(z.status),`nah: kein Scan ohne ganzen Körper, Hinweis „${z.status}“`);
const nahA=await p.evaluate(()=>{ const c=document.getElementById('overlay'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=16) if(d[i]>200) n++; return n; });
pruefe(nahA>500,`nah: Hose liegt trotzdem schon auf (${nahA} deckende Bildpunkte)`);

// 2) Zurücktreten (ganz im Bild): Scan nach kurzer Zeit, ohne Drehen
await p.evaluate(()=>Object.assign(window.__mode,{zoom:1,rand:'raten'}));
const t0=Date.now(); await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:15000});
const dauer=(Date.now()-t0)/1000;
pruefe(dauer<2.5,`ganz im Bild: gescannt nach ${dauer.toFixed(1)} s (Testgerät ohne Grafikkarte, echtes Gerät schneller)`);
await p.waitForTimeout(800); z=await zustand();
pruefe(!z.side&&!/Dreh/.test(z.big),`nach dem Scan keine Aufforderung zum Drehen („${z.big}“), Seite noch offen`);
const a1=await alpha(5,96); pruefe(a1>200,`Hose liegt auf (Deckkraft am Becken ${a1})`);
const ppc1=z.ppc;

// 3) Näher kommen: Maßstab folgt (doppelt so groß im Bild → doppelt so viele Bildpunkte je cm)
await p.evaluate(()=>Object.assign(window.__mode,{zoom:1.8,hueftY:.42,rand:'raten'})); await p.waitForTimeout(3000);
z=await zustand();
pruefe(z.ppc/ppc1>1.6&&z.ppc/ppc1<2.0,`näher (1,8×): Maßstab ${(z.ppc/ppc1).toFixed(2)}×`);
await p.evaluate(()=>Object.assign(window.__mode,{zoom:1,rand:'raten'})); await p.waitForTimeout(3000);
z=await zustand();
pruefe(Math.abs(z.ppc/ppc1-1)<.06,`wieder zurück: Maßstab ${(z.ppc/ppc1).toFixed(2)}×`);

// 3b) Gegenstand im Hintergrund, Arm über dem Kopf: Maßstab bleibt (oben = Kopf, unten = Füße, nur die Person selbst)
for(const m of [{gegenstand:1},{armHoch:1}]){
  await p.evaluate(m=>Object.assign(window.__mode,m),m); await p.waitForTimeout(2500); z=await zustand();
  pruefe(Math.abs(z.ppc/ppc1-1)<.015,`${Object.keys(m)[0]}: Maßstab ${(z.ppc/ppc1).toFixed(3)}×`);
  await p.evaluate(m=>{ for(const k in m) window.__mode[k]=0; },m); await p.waitForTimeout(1500); }

// 4) Einmal zur Seite drehen: Tiefe nebenbei gemessen, Umfänge im Ergebnis
await p.evaluate(()=>{ window.__mode.yaw=1.5; });
await p.waitForFunction(()=>document.getElementById('step-side').classList.contains('done'),null,{timeout:15000}).catch(()=>{});
z=await zustand(); const umf=await p.evaluate(()=>document.getElementById('o-hip').textContent);
pruefe(z.side&&/\d/.test(umf),`seitlich: Tiefe nebenbei gemessen, Hüftumfang ${umf}`);
await p.evaluate(()=>{ window.__mode.yaw=0; }); await p.waitForTimeout(1500);

// 5) Rumpf geneigt: Hose dreht mit (Achse „oben“ entlang Hüfte → Schultern)
for(const r of [.5,-.6,Math.PI]){
  await p.evaluate(r=>{ window.__mode.roll=r; },r); await p.waitForTimeout(2200);
  z=await zustand(); const u=z.frame.up, w=Math.atan2(u[0],-u[1]), d=Math.abs(Math.atan2(Math.sin(w-r),Math.cos(w-r)));
  const bad=await p.evaluate(()=>{ const g=window.__dbg.g3; let n=0; for(let k=0;k<g.nv*3;k++) if(!isFinite(g.pos[k])) n++; return n; });
  pruefe(d<.12&&bad===0,`geneigt um ${(r*180/Math.PI).toFixed(0)}°: Hose um ${(w*180/Math.PI).toFixed(0)}° gedreht, keine ungültigen Werte`);
}
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/scan_handstand.png'});
await p.evaluate(()=>{ window.__mode.roll=0; }); await p.waitForTimeout(2000);

// 6) Schneller Sprung zur Seite: die Hose ist nach wenigen Bildern dort
const x0=(await zustand()).frame.top[0];
await p.evaluate(()=>{ window.__mode.shift=.15; }); await p.waitForTimeout(350);
const x1=(await zustand()).frame.top[0], soll=.15*(await p.evaluate(()=>document.getElementById('overlay').width));
pruefe((x1-x0)/soll>.85,`Sprung um 15 % der Bildbreite: nach 0,35 s ${Math.round((x1-x0)/soll*100)} % gefolgt`);
await p.evaluate(()=>{ window.__mode.shift=0; }); await p.waitForTimeout(800);

pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
