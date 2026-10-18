// Hosen-Auswahl als Komponente (app/hosen-auswahl.js, <passform-hosen>, 18.10.): auf einer leeren Seite wie im Shop-Theme oder
// auf der Hauptwebsite eingebunden. Geprüft: Daten nie fest im Code (Liste per .produkte, Shopify-Produkte, Adresse in quelle),
// Bilder nur aus sicheren Quellen, Auswahl per Tippen (Ereignis hose-gewaehlt, aria-pressed), .gewaehlt von außen, Fehler beim
// Laden, Text bei leerer Liste. Dazu in der Anprobe-Seite: die Komponente über der 3D-Ansicht listet die Hosen der Seite, Tippen
// zieht die Hose an, der Knopf „Eigener Avatar“ ist da.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const hier=fileURLToPath(new URL('.',import.meta.url)), app=hier+'../../app/', fotos=hier+'../../material/produktfotos/';
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:430,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
// Leere Seite unter einer erfundenen Shop-Adresse, Skript und Produktliste über Routen (wie der App-Proxy)
const LISTE={products:[{id:101,title:'Baggy Jeans',handle:'baggy',images:[{src:'/bild/a.png'}],variants:[{price:'49.95'}]},
  {id:102,title:'Chino <b>fett</b>',handle:'chino',image:{src:'javascript:alert(1)'}},{id:103,title:'Cargo',handle:'cargo'}]};
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
await ctx.route('https://shop.test/**',r=>{ const u=new URL(r.request().url());
  if(u.pathname==='/') return r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><body><script src="/apps/passform/hosen-auswahl.js" defer></script></body>'});
  if(u.pathname==='/apps/passform/hosen-auswahl.js') return r.fulfill({contentType:'application/javascript',body:fs.readFileSync(app+'hosen-auswahl.js')});
  if(u.pathname==='/apps/passform/produkte') return r.fulfill({contentType:'application/json',body:JSON.stringify(LISTE)});
  if(u.pathname==='/apps/passform/kaputt') return r.fulfill({status:500,body:'x'});
  if(u.pathname.startsWith('/bild/')) return r.fulfill({contentType:'image/png',body:PNG});
  return r.fulfill({status:404,body:''}); });
await p.goto('https://shop.test/'); await p.waitForFunction(()=>!!customElements.get('passform-hosen'));

// 1) Liste über quelle (Shopify-Produkte): drei Knöpfe, Titel als Text (kein HTML), Bild nur, wo die Adresse sicher ist
const r1=await p.evaluate(async()=>{ const el=document.createElement('passform-hosen'); el.id='a'; el.setAttribute('quelle','/apps/passform/produkte'); document.body.appendChild(el);
  for(let t=0;t<50&&!el.shadowRoot.querySelector('button');t++) await new Promise(r=>setTimeout(r,50));
  const B=[...el.shadowRoot.querySelectorAll('button')];
  return {n:B.length,titel:B.map(x=>x.querySelector('b').textContent),bilder:B.map(x=>{ const i=x.querySelector('img'); return i?i.getAttribute('src'):null; }),
    preis:B[0]&&B[0].querySelector('span')?.textContent,alles:el.shadowRoot.textContent+B.map(x=>x.querySelector('img')?.getAttribute('src')||'').join(' '),html:el.shadowRoot.innerHTML.includes('<b>fett</b>'),produkte:el.produkte.map(q=>q.id)}; });
pruefe(r1.n===3&&r1.produkte.join()==='101,102,103',`Liste aus der Adresse (quelle): ${r1.n} Hosen, ids ${r1.produkte.join(', ')}`);
pruefe(r1.titel[1]==='Chino <b>fett</b>'&&!r1.html,'Titel als Text, kein eingeschleustes HTML');
pruefe(r1.bilder[0]==='/bild/a.png'&&r1.bilder[1]===null,`Bilder nur aus sicheren Quellen (javascript: weggelassen): ${JSON.stringify(r1.bilder)}`);
pruefe(r1.preis==='49.95','Preis aus der ersten Variante');
pruefe(!/false|undefined|null/.test(r1.alles),'keine Platzhalter wie „false“ oder „undefined“ in der Liste (Produkte ohne Preis/Bild)');

// 2) Auswahl: Tippen → Ereignis mit id und Produkt, aria-pressed; .gewaehlt von außen
const r2=await p.evaluate(async()=>{ const el=document.getElementById('a'); let ev=null; document.addEventListener('hose-gewaehlt',e=>{ ev={id:e.detail.id,titel:e.detail.produkt.titel}; });
  el.shadowRoot.querySelectorAll('button')[2].click(); await new Promise(r=>setTimeout(r,20));
  const gedrueckt=[...el.shadowRoot.querySelectorAll('button')].map(x=>x.getAttribute('aria-pressed'));
  el.gewaehlt='101'; const nachher=[...el.shadowRoot.querySelectorAll('button')].map(x=>x.getAttribute('aria-pressed'));
  return {ev,gedrueckt,nachher,g:el.gewaehlt}; });
pruefe(r2.ev&&r2.ev.id==='103'&&r2.ev.titel==='Cargo','Tippen meldet die Hose (Ereignis hose-gewaehlt, auch außerhalb der Komponente)');
pruefe(r2.gedrueckt.join()==='false,false,true'&&r2.nachher.join()==='true,false,false'&&r2.g==='101','Auswahl sichtbar (aria-pressed) und von außen setzbar (.gewaehlt)');

// 3) Liste direkt (eigenes Format, z. B. aus einer eigenen Shop-Abfrage), leere Liste, Ladefehler
const r3=await p.evaluate(async()=>{ const el=document.createElement('passform-hosen'); el.setAttribute('leer','Keine Hosen im Shop.'); document.body.appendChild(el);
  const leer=el.shadowRoot.textContent.includes('Keine Hosen im Shop.');
  el.produkte=[{id:'x1',titel:'Eigene',bild:'data:image/png;base64,iVBORw0KGgo='},{titel:'ohne id'}]; const n=el.shadowRoot.querySelectorAll('button').length;
  const k=document.createElement('passform-hosen'); let fehlerEv=null; k.addEventListener('hosen-fehler',e=>{ fehlerEv=e.detail.fehler; }); k.setAttribute('quelle','/apps/passform/kaputt'); document.body.appendChild(k);
  for(let t=0;t<40&&!fehlerEv;t++) await new Promise(r=>setTimeout(r,50));
  return {leer,n,fehlerEv,txt:k.shadowRoot.textContent}; });
pruefe(r3.leer,'leere Liste: eigener Text (Attribut leer)');
pruefe(r3.n===1,'Liste per Eigenschaft .produkte, Einträge ohne id weggelassen');
pruefe(r3.fehlerEv&&/nicht geladen/.test(r3.txt),`Ladefehler: Hinweis und Ereignis hosen-fehler (${r3.fehlerEv})`);
pruefe(await p.evaluate(()=>typeof window.passformProdukteAus==='function'&&window.passformProdukteAus({produkte:[{id:1,name:'A'}]})[0].titel==='A'),'window.passformProdukteAus für eigene Seiten');

// 4) In der Anprobe-Seite: Komponente über der 3D-Ansicht mit den Hosen der Seite, Tippen zieht an; Knopf „Eigener Avatar“
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:90000});
// zweite Hose (andere Bundweite), damit es etwas zu wählen gibt
await p.evaluate(()=>{ document.getElementById('own-msg').textContent=''; }); await p.fill('#own-waist','46'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:90000}); await p.waitForTimeout(300);
const r4=await p.evaluate(()=>{ const el=document.getElementById('avHosen'), B=[...el.shadowRoot.querySelectorAll('button')], d=window.__dbg;
  return {n:B.length,ids:B.map(x=>x.dataset.id),gew:el.gewaehlt,key:d.g.key,avOption:!!document.getElementById('avOption')&&!document.getElementById('avOption').hidden}; });
pruefe(r4.n>=1&&r4.gew===r4.key,`Anprobe-Seite: ${r4.n} Hose(n) in der Komponente, gewählt ist die angezogene`);
pruefe(r4.avOption,'Knopf „Eigener Avatar“ sichtbar');
pruefe(r4.n>=2,`zwei Hosen zur Auswahl (${r4.n})`);
if(r4.n>=2){ const ziel=r4.ids.find(i=>i!==r4.key);
  await p.evaluate(z=>[...document.getElementById('avHosen').shadowRoot.querySelectorAll('button')].find(x=>x.dataset.id===z).click(),ziel); await p.waitForTimeout(300);
  const k=await p.evaluate(()=>window.__dbg.g.key); pruefe(k===ziel,'Tippen in der Komponente zieht die Hose an'); }

pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
console.log(fehler?`${fehler} Fehler`:'Hosen-Auswahl in Ordnung'); process.exit(fehler?1:0);
