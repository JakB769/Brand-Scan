// „Hose 2 ist ein riesiger Blob“: Problemfotos und ein alter Speicherstand mit kaputter Hose.
// Alle Hosen müssen mit sinnvoller Länge erscheinen oder klar als „neu erstellen“ markiert sein.
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), tb=hier+'../../material/testbilder/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
const len=t=>{ const m=t.match(/Länge (\d+) cm/); return m?+m[1]:null; };
for(const [n,f] of [['normal',hier+'../../material/produktfotos/front.jpg'],['etwas ragt oben heraus',tb+'problemfotos/oben_ding.jpg'],['quer fotografiert',tb+'problemfotos/quer.jpg'],['Fuß am Saum',tb+'problemfotos/fuss_unten.jpg']]){
  await p.setInputFiles('#own-front',f); await p.setInputFiles('#own-back',[]); await p.fill('#own-waist','40'); await p.click('#own-go'); await p.waitForTimeout(2500);
  const t=await p.evaluate(()=>document.getElementById('own-msg').textContent), L=len(t);
  pruefe(L>=106&&L<=118,`${n}: Länge ${L} cm (richtig etwa 113)`);
}
// Alter Speicher (mit dem Stand vor dieser Änderung erzeugt): Hose 1 normal, Hose 2 Blob (518 cm), Hose 3 quer
await p.evaluate(s=>localStorage.setItem('massScanHosen',s),fs.readFileSync(tb+'alter-speicher-mit-blob.json','utf8'));
await p.reload(); await p.waitForTimeout(600);
const L=await p.evaluate(()=>Object.values(window.__dbg.GARMENTS).map(G=>({n:G.label,bad:G.bad,len:Math.round((G.waist||40)/G.m3.wf)})));
for(const x of L) pruefe(x.bad?true:(x.len>=90&&x.len<=125),`alter Speicher, ${x.n}: `+(x.bad?'markiert „bitte neu erstellen“ ('+x.bad+')':`Länge ${x.len} cm`));
pruefe(L[1]&&!L[1].bad,'Blob-Hose aus altem Speicher wird repariert statt verworfen');
await p.click('#quick'); await p.waitForTimeout(3000); await p.click('#clean'); await p.waitForTimeout(500);
for(const [i,x] of L.entries()){ await p.click(`#gwrap .gbtn >> nth=${i}`); await p.waitForTimeout(1500); await (await p.$('#stage')).screenshot({path:hier+`ausgabe/blob_${i}.png`}); await p.evaluate(()=>{ const b=document.querySelector('#gwrap .gbtn[aria-pressed=true]'); if(b) b.click(); }); }   // Hose abwählen, Anprobe läuft weiter
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(fehler||errs.length) process.exit(1);
