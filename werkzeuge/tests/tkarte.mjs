// Bankkarte als Maßstab mit den echten Fotos (Karteninneres unkenntlich gemacht). Echte Außenlänge: 105 cm.
// Vorderseite: Karte automatisch gefunden. Rückseite: Ecken von Hand gesetzt (wie Antippen).
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), tb=hier+'../../material/testbilder/echt/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1000,height:950}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
const HINTEN='[[729,525],[805,505],[837,626],[761,646]]';     // von Hand gesetzte Kartenecken auf der Rückseite
const bau=async(front,back,len='')=>{
  await p.setInputFiles('#own-front',tb+front); await p.setInputFiles('#own-back',back?[tb+back]:[]); await p.fill('#own-len',len);
  await p.selectOption('#own-ref','card'); await p.click('#own-go');
  const fenster=[];
  for(let n=0;n<(back?2:1);n++){
    await p.waitForFunction(k=>!document.getElementById('refDlg').hidden&&document.getElementById('refHead').textContent.includes(k),n?'Rückseite':'Vorderseite',{timeout:120000});
    await p.waitForTimeout(200);
    const Q=await p.evaluate(()=>window.__refDlg.Q.length);
    fenster.push(Q);
    if(n===1) await p.evaluate(q=>window.__refDlg.set(JSON.parse(q)),HINTEN);
    await p.click('#refOk');
  }
  await p.waitForFunction(()=>/Fertig|nicht|ließ/.test(document.getElementById('own-msg').textContent),null,{timeout:120000});
  const t=await p.evaluate(()=>document.getElementById('own-msg').textContent), m=t.match(/Länge (\d+) cm/);
  return {t,L:m?+m[1]:null,fenster};
};
const v=await bau('karte_vorne_IMG_7267.jpg');
pruefe(v.fenster[0]===4,'Vorderseite: Karte automatisch gefunden, Ecken vorgeschlagen');
pruefe(/schräg fotografiert/.test(v.t)&&/vermessen/.test(v.t),'Neigung aus dem Foto herausgerechnet, Karte vermessen');
pruefe(Math.abs(v.L-105)<=4,`nur Vorderseite: ${v.L} cm (echt 105)`);
const z=await bau('karte_vorne_IMG_7267.jpg','karte_hinten_IMG_7268.jpg');
pruefe(Math.abs(z.L-105)<=3,`Vorder- und Rückseite: ${z.L} cm (echt 105, Abweichung ${z.L-105} cm)`);
pruefe(/auf dem Kopf/.test(z.t),'Rückenfoto lag auf dem Kopf und wurde gedreht');
const tags=await p.evaluate(()=>['tag-len','tag-waist','tag-hem'].map(i=>document.getElementById(i).textContent).join());
pruefe(tags==='gemessen,gemessen,gemessen','Felder als gemessen gekennzeichnet: '+tags);
// eingetragene Länge hat Vorrang vor der gemessenen
await p.fill('#g-len','105'); await p.waitForTimeout(400);
const t2=await p.evaluate(()=>['tag-len','tag-waist','tag-hem'].map(i=>document.getElementById(i).textContent).join()+' | '+['g-len','g-waist','g-hemw'].map(i=>document.getElementById(i).value).join(', '));
pruefe(/^manuell,geschätzt,geschätzt/.test(t2),'Länge eingetragen: Vorrang, Bund und Saum gehen mit: '+t2);
// Warnung bei verzogener Karte: absichtlich falsche Ecken (nur die gelbe Hälfte)
await p.setInputFiles('#own-front',tb+'karte_hinten_IMG_7268.jpg'); await p.setInputFiles('#own-back',[]); await p.fill('#own-len','');
await p.selectOption('#own-ref','card'); await p.click('#own-go');
await p.waitForSelector('#refDlg:not([hidden])',{timeout:120000}); await p.evaluate(()=>window.__refDlg.set([[749,608],[822,569],[837,626],[761,646]])); await p.click('#refOk');
await p.waitForFunction(()=>/Fertig|nicht|ließ/.test(document.getElementById('own-msg').textContent),null,{timeout:120000});
pruefe(/wirkt verzogen/.test(await p.evaluate(()=>document.getElementById('own-msg').textContent)),'falsch gesetzte Ecken: Warnung „Karte wirkt verzogen“');
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(fehler||errs.length) process.exit(1);
