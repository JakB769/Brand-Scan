// Folgt die 3D-Hose den erkannten Punkten ohne Verzögerung? Die Attrappe hebt das linke Knie laufend (kneeWave) und mit
// einem Ruck (knee). Gemessen je Bild: erkanntes Knie, Knie des Hosen-Skeletts und Lage des Hosenbeins am Knie (Mitte des
// Rings) und am Saum, daraus die Verzögerung (Kreuzkorrelation) und wie weit das Hosen-Skelett nach einem Ruck noch daneben liegt.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}})).newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
await p.click('#quick'); await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:20000});
await p.waitForTimeout(1500);
// Zeile des Hosenbeins auf Kniehöhe (im Stand): die nächste zum Knie des Skeletts
await p.evaluate(()=>{ window.__lagLog=[]; });
await p.waitForTimeout(400);
await p.evaluate(()=>{ const g3=window.__dbg.g3, M=g3.M, NR=M.nr, C=13, e=window.__lagLog[window.__lagLog.length-1]; let best=0,bd=1e9;
  for(let i=g3.ic;i<NR;i++){ let x=0,y=0; for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const k=((i)*2+f)*C+j; x+=g3.pos[k*3]; y+=g3.pos[k*3+1]; } x/=2*C; y/=2*C;
    const d=Math.hypot(x-e.bone[0],y-e.bone[1]); if(d<bd){ bd=d; best=i; } } window.__lagRow=best; });
const lauf=async(ms,setup)=>{ await p.evaluate(()=>{ window.__lagLog=[]; }); await p.evaluate(setup); await p.waitForTimeout(ms); return p.evaluate(()=>window.__lagLog.filter(e=>e.mesh)); };
// Verzögerung per Kreuzkorrelation (y-Lage), in ms, auf 10 ms gerastert
const verz=(log,key,ref='raw')=>{
  const t0=log[0].t, T=log[log.length-1].t-t0;
  const at=(k,t)=>{ const i=log.findIndex(e=>e.t-t0>=t); if(i<=0) return log[Math.max(0,i)][k][1];
    const a=log[i-1], b2=log[i], u=(t-(a.t-t0))/((b2.t-a.t)||1); return a[k][1]+(b2[k][1]-a[k][1])*u; };
  const ys=k=>{ const o=[]; for(let t=0;t<T;t+=10) o.push(at(k,t)); return o; };
  const R=ys(ref), K=ys(key), m=a=>a.reduce((x,y)=>x+y,0)/a.length, mr=m(R), mk=m(K); let best=0, bv=-1e18;
  for(let d=0;d<=40;d++){ let s=0; for(let i=50;i+d<K.length;i++) s+=(R[i]-mr)*(K[i+d]-mk); if(s>bv){ bv=s; best=d*10; } }
  return best; };
const log=await lauf(5000,()=>{ window.__mode.kneeWave=1.2; });
const fps=log.length/((log[log.length-1].t-log[0].t)/1000);
const dB=verz(log,'bone'), dM=verz(log,'mesh'), dS=verz(log,'saum','ank');
const amp=k=>{ const ys=log.map(e=>e[k][1]); return Math.max(...ys)-Math.min(...ys); };
console.log(`Bildrate ${fps.toFixed(1)}/s, Knie hebt sich um ${amp('raw').toFixed(0)} px; Skelett ${amp('bone').toFixed(0)} px, Hosenbein ${amp('mesh').toFixed(0)} px`);
pruefe(dB<=40,`Hosen-Skelett folgt dem Knie mit ${dB} ms Verzögerung (≤ 40)`);
pruefe(dM<=80,`Hosenbein folgt dem Knie mit ${dM} ms Verzögerung (≤ 80)`);
pruefe(amp('bone')>.9*amp('raw')&&amp('mesh')>.75*amp('raw'),'Hose geht beim Kniehub ganz mit (Ausschlag ≥ 90 % bzw. 75 %)');
// Saum am Knöchel: Stoffphysik schwingt nach, darf aber nicht sichtbar nachziehen
pruefe(dS<=100&&amp('saum')>.7*amp('ank'),`Saum folgt dem Knöchel mit ${dS} ms Verzögerung (≤ 100), Ausschlag ${(100*amp('saum')/amp('ank')).toFixed(0)} %`);
// Ruck: Knie in einem Bild ganz oben; nach 2 Bildern muss das Hosen-Skelett nah dran sein
await p.evaluate(()=>{ window.__mode.kneeWave=0; }); await p.waitForTimeout(1200);
const ruck=await lauf(1500,()=>{ setTimeout(()=>{ window.__mode.knee=1; },300); });   // erst ein paar Bilder im Stand, dann der Ruck
const weg=Math.hypot(ruck[ruck.length-1].raw[0]-ruck[0].raw[0],ruck[ruck.length-1].raw[1]-ruck[0].raw[1]);
const rest=ruck.map(e=>Math.hypot(e.bone[0]-e.raw[0],e.bone[1]-e.raw[1])/weg);
const i0=ruck.findIndex(e=>Math.hypot(e.raw[0]-ruck[0].raw[0],e.raw[1]-ruck[0].raw[1])>.5*weg);
console.log('Ruck: Abstand Skelett↔Knie je Bild (Anteil des Wegs):',rest.slice(i0,i0+5).map(v=>v.toFixed(2)).join(' '));
pruefe(i0>=0&&rest[i0+2]<.15,`Ruck: 2 Bilder danach liegt das Hosen-Knie noch ${(100*rest[i0+2]).toFixed(0)} % des Wegs daneben (< 15 %)`);
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/lag_knie.png'});
await p.evaluate(()=>{ window.__mode.knee=0; });
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
