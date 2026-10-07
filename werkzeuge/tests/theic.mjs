// iPhone-Fotos (HEIC) in Chrome: die Seite lädt einen Umwandler nach. Hier kommt er aus node_modules statt vom CDN.
// Geprüft werden beide Wege: heic-to und die Ausweichlösung heic2any.
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), nm=hier+'../../node_modules/';
let schlecht=0;
for(const weg of ['heic-to','heic2any']){
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await (await b.newContext()).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/heic-to@1.6.5/**',r=>weg==='heic-to'?r.fulfill({status:200,contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(nm+'heic-to/dist/heic-to.min.js')}):r.abort());
  await p.route('**/heic2any@0.0.4/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(nm+'heic2any/dist/heic2any.min.js')}));
  await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
  await p.setInputFiles('#own-front',hier+'../../material/testbilder/front.heic'); await p.fill('#own-waist','40'); await p.click('#own-go');
  await p.waitForFunction(()=>/Fertig|nicht/.test(document.getElementById('own-msg').textContent),null,{timeout:60000}).catch(()=>{});
  const t=await p.evaluate(()=>document.getElementById('own-msg').textContent);
  const ok=/Fertig.*Länge 11\d cm/.test(t)&&!errs.length; if(!ok) schlecht++;
  console.log(weg.padEnd(9),ok?'HEIC umgewandelt:':'FEHLER:',t.slice(0,90),errs.join(' | '));
  await b.close();
}
if(schlecht) process.exit(1);
