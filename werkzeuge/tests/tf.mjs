import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url));
const fotos=hier+'../../material/produktfotos/';
const out=hier+'ausgabe/'; (await import('fs')).mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:760}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
// 1) eigene Hose aus den zwei Fotos erzeugen
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg');
await p.click('#own-go'); await p.waitForTimeout(2500);
console.log('GEN:',await p.evaluate(()=>document.getElementById('own-msg').textContent));
console.log(await p.evaluate(()=>{const m=Object.values(window.__dbg.GARMENTS).find(g=>g.m3).m3; return JSON.stringify({vc:m.vc,wf:m.wf,hw:m.hw.filter((_,i)=>i%6==0),atlasKB:Math.round(m.atlas.length/1024)});}));
await (await p.$('#ownBox')).screenshot({path:out+'f_own.png'});
await p.fill('#height','180'); await p.click('#start'); await p.waitForTimeout(3000);
await p.evaluate(()=>{const m=window.__mc; m.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:.5;mix-blend-mode:multiply;filter:invert(1)'; const v=document.getElementById('video'); v.parentNode.insertBefore(m,v.nextSibling);});
await p.click('#clean'); await p.waitForTimeout(3000);
const shot=async n=>{ await p.waitForTimeout(1500); await (await p.$('#stage')).screenshot({path:out+'f_'+n+'.png'}); return (await p.evaluate(()=>window.__dbg.g.yaw)).toFixed(2); };
const res=[];
for(const zk of [1,0,-1]){
  for(const yaw of [0,.8,1.5,2.4,3.1,-2.4,-1.5,-.8]){
    await p.evaluate(([y,z])=>{window.__mode.yaw=y;window.__mode.zk=z;},[yaw,zk]);
    res.push(`z×${zk} soll ${yaw} ist ${await shot('z'+zk+'_'+yaw)}`);
  }
}
console.log(res.join('\n'));
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(errs.length) process.exit(1);
