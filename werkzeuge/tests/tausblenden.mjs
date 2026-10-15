// Lieber ausblenden als schlecht aussehen (Attrappe): Hüftbeugung 0/30/45° links und rechts (auch mit gebeugtem Knie) sichtbar
// und ruhig, 60° ausgeblendet, an der Grenze kein Flackern (Hysterese), Liegestütz, Hinlegen und Aufstehen, schlecht sichtbare
// Hüfte, zappelnde Erkennung. Gemessen wird g.trk (Deckkraft-Faktor 0–1) in jedem Bild. Aufruf: node tausblenden.mjs [Testseite]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+(process.argv[2]||hier+'testseite-mit-simulierter-person.html')); await p.waitForTimeout(500);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
await p.click('#quick'); await p.waitForTimeout(500);
await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:20000});
await p.waitForTimeout(1000); await p.click('#clean').catch(()=>{});
// g.trk in jedem Bild mitschreiben
await p.evaluate(()=>{ window.__log=[]; const f=()=>{ const d=window.__dbg; window.__log.push([performance.now(),d.g.trk,d.g.unsicher||'',d.trk?d.trk.flexDeg.slice():[0,0]]); requestAnimationFrame(f); }; requestAnimationFrame(f); });
const ruhe={zoom:1,rand:'raten',knee:0,kneeHigh:0,fersePo:0,kneeWave:0,yaw:0,hand:0,sway:0,ohneArme:1,ausfall:0,spagat:0,liegestuetz:0,hocke:0,
  beugeL:null,beugeR:null,knieL:null,knieR:null,roll:0,zappel:0,hueftSicht:null,schulterSicht:null,shift:0,hockeBreit:0};
const lage=m=>p.evaluate(([r,m])=>Object.assign(window.__mode,r,m),[ruhe,m]);
// misst über ms Millisekunden: kleinstes/größtes g.trk, Wechsel über 0,5, Gründe, mittlere Beugung
const messe=async ms=>{ await p.evaluate(()=>{ window.__log.length=0; }); await p.waitForTimeout(ms);
  return p.evaluate(()=>{ const l=window.__log; let mi=1,ma=0,w=0; const gr=new Set();
    l.forEach((e,i)=>{ mi=Math.min(mi,e[1]); ma=Math.max(ma,e[1]); if(i&&(e[1]>.5)!==(l[i-1][1]>.5)) w++; if(e[2]) gr.add(e[2]); });
    const f=l.length?l[l.length-1][3]:[0,0]; return {mi,ma,w,gr:[...gr].join(','),f:f.map(v=>Math.round(v)),n:l.length}; }); };
const zeig=r=>`(g.trk ${r.mi.toFixed(2)}–${r.ma.toFixed(2)}, Beugung L/R ${r.f.join('/')}°${r.gr?', Grund '+r.gr:''}, ${r.n} Bilder)`;

await lage({}); await p.waitForTimeout(1500); let r=await messe(1500);
pruefe(r.mi>.99,'Stand: Hose sichtbar '+zeig(r));
for(const yaw of [0,1.45]) for(const [seite,bk,kk] of [['links','beugeL','knieL'],['rechts','beugeR','knieR']]){
  for(const deg of [0,30,45]){
    await lage({yaw,[bk]:deg}); await p.waitForTimeout(1200); r=await messe(1500);
    pruefe(r.mi>.99&&r.w===0,`${deg}° ${seite}, Drehung ${yaw}: sichtbar und ruhig `+zeig(r));
  }
  await lage({yaw,[bk]:30,[kk]:95}); await p.waitForTimeout(1200); r=await messe(1500);
  pruefe(r.mi>.99,`30° ${seite} mit Knie 95° gebeugt, Drehung ${yaw}: sichtbar `+zeig(r));
  await lage({yaw,[bk]:60}); await p.waitForTimeout(1200); r=await messe(1500);
  pruefe(r.ma<.01,`60° ${seite}, Drehung ${yaw}: ausgeblendet `+zeig(r));
  await lage({yaw}); await p.waitForTimeout(1500); r=await messe(1000);
  pruefe(r.mi>.99,`danach gerade, Drehung ${yaw}: wieder sichtbar `+zeig(r));
}
// Hysterese: von der Seite (dort liest die Seite die Beugung genau) pendelt sie zwischen 41° (über der Grenze zum Einblenden,
// 39°) und 55° (über der zum Ausblenden, 46°), je 700 ms (länger als die Wartezeiten). Mit Hysterese bleibt die Hose nach dem
// ersten Ausblenden aus (ein Wechsel); mit nur einer Grenze wechselte sie bei jedem Schritt
await lage({yaw:1.45}); await p.waitForTimeout(1500); await p.evaluate(()=>{ window.__log.length=0; });
for(let k=0;k<8;k++){ await p.evaluate(v=>{ window.__mode.beugeL=v; },k%2?41:55); await p.waitForTimeout(700); }
r=await p.evaluate(()=>{ const l=window.__log; let w=0; l.forEach((e,i)=>{ if(i&&(e[1]>.5)!==(l[i-1][1]>.5)) w++; }); return {w,mi:Math.min(...l.map(e=>e[1])),ma:Math.max(...l.map(e=>e[1])),f:Math.round(Math.max(...l.map(e=>e[3][0])))}; });
pruefe(r.w===1&&r.ma>.99&&r.mi<.01,`Beugung pendelt 41↔55° (seitlich): ${r.w} Wechsel sichtbar/unsichtbar, bleibt aus (g.trk ${r.mi.toFixed(2)}–${r.ma.toFixed(2)}, höchste Beugung ${r.f}°)`);
// seitlicher Spagat und Bein zur Seite von vorn (Abspreizen ist keine Beugung), nach langem Stand
await lage({}); await p.waitForTimeout(1500);
await lage({spagat:1}); await p.waitForTimeout(1200); r=await messe(1500);
pruefe(r.mi>.99,'seitlicher Spagat von vorn: sichtbar '+zeig(r));
await lage({}); await p.waitForTimeout(1500);
// Hocke, breite Hocke und Sumo-Hocke (Knie weit außen, Oberschenkel waagrecht): Beugung um 90°, auch mit Abspreizen → aus
for(const [n,m] of [['Hocke',{hocke:1}],['breite Hocke (Knie 50° außen)',{hockeBreit:1}],['Sumo-Hocke (Knie 58° außen)',{hockeBreit:2}]]){
  await lage(m); await p.waitForTimeout(1200); r=await messe(1500);
  pruefe(r.ma<.01,`${n} von vorn: ausgeblendet `+zeig(r));
  await lage({}); await p.waitForTimeout(1500); }
// Liegestütz, dann Stand
await lage({liegestuetz:1}); await p.waitForTimeout(1000); r=await messe(1000);
pruefe(r.ma<.01,'Liegestütz: ausgeblendet '+zeig(r));
await lage({}); await p.waitForTimeout(1500); r=await messe(1000);
pruefe(r.mi>.99,'nach dem Liegestütz im Stand wieder sichtbar '+zeig(r));
// Hinlegen (Person kippt in 1,5 s auf die Seite) und Aufstehen
for(let k=0;k<=15;k++){ await p.evaluate(v=>{ window.__mode.roll=v; },1.57*k/15); await p.waitForTimeout(100); }
await p.waitForTimeout(800); r=await messe(1000);
pruefe(r.ma<.01,'hingelegt (waagrecht): ausgeblendet '+zeig(r));
// liegend die ferne Schulter verdeckt (im Bild, Sicherheit 0,3): Neigung nicht mehr messbar, „gekippt“ bleibt (nur außerhalb
// des Bildes wird es nach 0,8 s aufgehoben)
await p.evaluate(()=>{ window.__mode.schulterSicht=.3; }); await p.waitForTimeout(500); r=await messe(1500);
pruefe(r.ma<.01,'hingelegt, ferne Schulter verdeckt: bleibt ausgeblendet '+zeig(r));
await p.evaluate(()=>{ window.__mode.schulterSicht=null; }); await p.waitForTimeout(300);
for(let k=15;k>=0;k--){ await p.evaluate(v=>{ window.__mode.roll=v; },1.57*k/15); await p.waitForTimeout(100); }
await p.waitForTimeout(1500); r=await messe(1000);
pruefe(r.mi>.99,'aufgestanden: wieder sichtbar '+zeig(r));
// schlecht erkannte Hüfte, zappelnde Erkennung
await lage({hueftSicht:.25}); await p.waitForTimeout(1000); r=await messe(1000);
pruefe(r.ma<.01,'Hüfte schlecht erkannt: ausgeblendet '+zeig(r));
await lage({zappel:.08}); await p.waitForTimeout(1000); r=await messe(1000);
pruefe(r.ma<.01,'Erkennung springt jedes Bild: ausgeblendet '+zeig(r));
await lage({}); await p.waitForTimeout(1500);
// ab dem Sprung gemessen; 0,25 Bildbreiten: auch bei wenigen Erkennungen je Sekunde (Testumgebung 8/s) als Sprung erkannt
await p.evaluate(()=>{ window.__log.length=0; window.__t0=performance.now(); }); await lage({shift:.25}); r=await messe(1200);
const erkannt=await p.evaluate(()=>(window.__dbg.trk.jumps||[]).some(t=>t>=window.__t0));
pruefe(erkannt&&r.mi>.99,`ein einzelner Sprung (Person versetzt): ${erkannt?'erkannt':'NICHT erkannt'}, bleibt sichtbar `+zeig(r));
await lage({}); await p.waitForTimeout(1500); r=await messe(800);
pruefe(r.mi>.99,'zum Schluss im Stand sichtbar '+zeig(r));
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
await b.close();
process.exit(fehler?1:0);
