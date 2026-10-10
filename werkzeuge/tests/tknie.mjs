// Bildserie: Knie zur Kamera, gespreizt, gedreht. Ergebnis in ausgabe/knie_*.png
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url));
const fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver|ERR_|Failed to load/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg');
await p.fill('#own-waist','40'); await p.click('#own-go'); await p.waitForTimeout(1500);
await p.click('#quick'); await p.waitForTimeout(3000);
await p.click('#clean'); await p.waitForTimeout(2500);
for(const [n,m] of Object.entries({gerade:{},knie:{knee:1},knie_rauschen:{knee:1,zn:.3},knie_ohneTiefe:{knee:1,zk:0},breit:{wide:1},knie_gedreht:{knee:1,yaw:.8}})){
  await p.evaluate(m=>Object.assign(window.__mode,{yaw:0,zk:1,zn:0,zr:0,knee:0,wide:0},m),m); await p.waitForTimeout(1800);
  await (await p.$('#stage')).screenshot({path:hier+'ausgabe/knie_'+n+'.png'});
}
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
