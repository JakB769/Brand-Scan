// Nahphase wie mit echter Kamera: erst Frontal- und Seiten-Scan, dann kommt die Person näher und die Füße
// verschwinden aus dem Bild. Die Hose muss trotzdem senkrecht hängen (Bund oben, Saum unten, Vorderseite zur Kamera).
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver|ERR_|Failed to load/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
await p.evaluate(()=>{ localStorage.setItem('massScanDebug','1'); }); await p.reload(); await p.waitForTimeout(400);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go'); await p.waitForTimeout(1500);
await p.click('#quick'); await p.waitForTimeout(500);
await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:20000});
await p.evaluate(()=>{ window.__mode.yaw=1.5; });
await p.waitForFunction(()=>document.getElementById('step-side').classList.contains('done'),null,{timeout:20000});
await p.evaluate(()=>{ window.__mode.yaw=0; }); await p.waitForTimeout(1500); await p.click('#clean');
const lage=async(name,m)=>{
  await p.evaluate(m=>Object.assign(window.__mode,{zoom:1,rand:'raten',knee:0,yaw:0},m),m); await p.waitForTimeout(2500);
  await (await p.$('#stage')).screenshot({path:hier+'ausgabe/nah_'+name+'.png'});
  const d=await p.evaluate(()=>window.__dbg.dbg.last);
  // Knie angehoben (die Attrappe hebt es 36 cm nach vorn): dann gehört Tiefe dazu, sonst nicht
  const ok=m.knee?(d&&d.joints[0][1]<-25&&d.joints[0][1]>-50&&Math.abs(d.joints[1][1])<3&&d.dims[1]>80)
                 :(d&&d.tiltPCA<20&&d.dims[1]>80&&d.dims[2]<60);
  pruefe(ok,`${name}: Längsachse ${d?d.tiltPCA.toFixed(0):'?'}° von senkrecht, B×H×T ${d?d.dims.join(' × '):'?'} cm, Gelenktiefe ${d?d.joints.map(c=>c.map(z=>z.toFixed(0)).join('/')).join(' | '):'?'}`);
};
await lage('ganz',{zoom:1});
await lage('nah_fuesse_weg',{zoom:1.7});
await lage('nah_knie_weg',{zoom:2.4});
await lage('nah_am_rand_geklebt',{zoom:1.9,rand:'kleben'});
await lage('nah_knie_hoch',{zoom:1.5,knee:1});
// Notlösung: von Hand drehen. Z 90° legt die Hose quer, Umdrehen stellt Bund nach unten, Zurücksetzen hebt alles auf
await p.evaluate(()=>Object.assign(window.__mode,{zoom:1.7,rand:'raten',knee:0,yaw:0})); await p.waitForTimeout(800);
const winkel=()=>p.evaluate(()=>window.__dbg.dbg.last.tiltPCA);
await p.click('#g-rot button[data-r="z"]'); await p.waitForTimeout(800); const wz=await winkel();
await p.click('#g-rot button[data-r="reset"]'); await p.click('#g-rot button[data-r="flip"]'); await p.waitForTimeout(800); const wf=await winkel();
const tief=await p.evaluate(()=>{ const {g3}=window.__dbg, F=g3.frame, M=(g3.M||window.__dbg.GARMENTS[window.__dbg.g.key].m3), C=13, NR=M.nr; const y=i=>g3.pos[(((0*NR+i)*2)*C)*3+1]; return [y(0),y(NR-1)]; });
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/nah_umgedreht.png'});
await p.click('#g-rot button[data-r="reset"]'); await p.waitForTimeout(800); const wr=await winkel();
pruefe(wz>70&&wf<20&&tief[0]>tief[1]&&wr<20,`Drehknöpfe: Z 90° → ${wz.toFixed(0)}° quer, Umdrehen → Bund unten (${tief[0]>tief[1]}), Zurücksetzen → ${wr.toFixed(0)}°`);
// Automatische Aufrichtung: ein auf dem Kopf gespeichertes Modell wird beim Laden umgedreht
const auf=await p.evaluate(()=>{ const G=Object.values(window.__dbg.GARMENTS)[0], M=JSON.parse(JSON.stringify(G.m3));
  const rv=a=>a.slice().reverse(); M.hw=rv(M.hw); M.tv=rv(M.tv); M.tvb=rv(M.tvb); M.f=rv(M.f); M.b=rv(M.b);
  const key='kopf'; localStorage.setItem('massScanHosen',JSON.stringify([{key,G:{...G,label:'Kopfstand',m3:M}}])); return true; });
await p.reload(); await p.waitForTimeout(600);
const ok2=await p.evaluate(()=>{ const G=window.__dbg.GARMENTS.kopf, M=G.m3; const gap=i=>(M.f[i][2]-M.f[i][1])>.004; return {oben:gap(1),unten:gap(M.nr-2),bad:G.bad}; });
pruefe(!ok2.oben&&ok2.unten&&!ok2.bad,'Modell auf dem Kopf gespeichert: beim Laden aufgerichtet (Beinspalt unten, Bund oben)');
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(fehler||errs.length) process.exit(1);
