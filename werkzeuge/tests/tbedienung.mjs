// Bedienung: drei Testpersonen in der Schnellauswahl (Jakob 1,79 m, Fabian 1,87 m, Philip 1,70 m), Personenwechsel verwirft
// den alten Scan; Sprachausgabe standardmäßig aus, Lautsprecher-Knopf (bei „Du“ und im Kamerabild) schaltet sie an und wieder aus.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url));
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({permissions:['camera'],viewport:{width:900,height:1000}})).newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver/.test(m.text())) errs.push(m.text()); });
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
// Sprachausgabe mitschreiben (gesprochen wird nicht)
await p.addInitScript(()=>{ window.__gesagt=[]; window.__abgebrochen=0;
  try{ speechSynthesis.speak=u=>window.__gesagt.push(u.text); const c=speechSynthesis.cancel.bind(speechSynthesis); speechSynthesis.cancel=()=>{ window.__abgebrochen++; c(); }; }catch(_){} });
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
const z=()=>p.evaluate(()=>({h:document.getElementById('height').value,n:document.getElementById('person').value,
  gedr:[...document.querySelectorAll('.quickp')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.n),
  an:!document.getElementById('hud').hidden,cal:document.getElementById('v-cal').textContent,
  voice:document.getElementById('voice').checked,vb:document.getElementById('voiceBtn').getAttribute('aria-pressed'),vh:document.getElementById('voiceHud').getAttribute('aria-pressed'),
  gesagt:window.__gesagt.slice()}));

// 1) Schnellauswahl
const knoepfe=await p.evaluate(()=>[...document.querySelectorAll('.quickp')].map(b=>b.querySelector('b').textContent+' · '+b.querySelector('span').textContent));
pruefe(knoepfe.join('|')==='Jakob · 1,79 m|Fabian · 1,87 m|Philip · 1,70 m','drei Testpersonen: '+knoepfe.join(', '));
let s=await z(); pruefe(!s.voice&&s.vb==='false','Sprachausgabe am Anfang aus');
await p.click('.quickp[data-n=Fabian]'); await p.waitForTimeout(2500); s=await z();
pruefe(s.h==='187'&&s.n==='Fabian'&&s.gedr.join()==='Fabian'&&s.an,`Fabian: Größe ${s.h}, Kamera an, Knopf markiert`);
// scannen lassen (Attrappe steht ruhig und gerade), dann Person wechseln: Scan verworfen
for(let t=0;t<30&&!/cm|✓|erfasst/.test((await z()).cal);t++) await p.waitForTimeout(300);
const vorher=(await z()).cal;
await p.click('.quickp[data-n=Philip]'); await p.waitForTimeout(500); s=await z();
pruefe(s.h==='170'&&s.n==='Philip'&&s.gedr.join()==='Philip'&&s.an,`Philip während der Anprobe: Größe ${s.h}, Kamera bleibt an`);
pruefe(vorher!=='offen'&&s.cal==='offen',`Personenwechsel verwirft den Scan („${vorher}“ → „${s.cal}“)`);
await p.click('#quick'); await p.waitForTimeout(300); s=await z(); pruefe(s.h==='179'&&s.gedr.join()==='Jakob','Jakob: 179');
await p.fill('#height','180'); s=await z(); pruefe(!s.gedr.length,'eigene Größe getippt: kein Testknopf markiert');
await p.fill('#height','179');

// 2) Sprachausgabe: aus → nichts gesagt, obwohl die Anprobe Ansagen macht
await p.waitForTimeout(2000); s=await z();
pruefe(!s.gesagt.length,'Sprachausgabe aus: nichts gesagt ('+s.gesagt.length+' Ansagen)');
await p.click('#voiceHud'); await p.waitForTimeout(300); s=await z();
pruefe(s.voice&&s.vb==='true'&&s.vh==='true'&&s.gesagt.includes('Ton an'),'Lautsprecher im Kamerabild: an, „Ton an“ gesagt, beide Knöpfe zeigen an');
await p.click('#stage',{position:{x:200,y:300}}); await p.waitForTimeout(200); s=await z();
pruefe(s.gesagt.length>=2,'Ansage wird gesprochen: '+s.gesagt.slice(-1)[0]);
const n=s.gesagt.length, ab=await p.evaluate(()=>window.__abgebrochen);
await p.click('#voiceBtn'); await p.waitForTimeout(200);
await p.click('#stage',{position:{x:200,y:300}}); await p.waitForTimeout(1500); s=await z();
pruefe(!s.voice&&s.vh==='false'&&s.gesagt.length===n&&await p.evaluate(()=>window.__abgebrochen)>ab,'Knopf bei „Du“: wieder aus, laufende Ansage abgebrochen, danach nichts mehr gesagt');
// neu laden: wieder aus (nicht gespeichert)
await p.click('#voiceBtn'); await p.reload(); await p.waitForTimeout(400); s=await z();
pruefe(!s.voice&&s.vb==='false','nach dem Neuladen wieder aus');
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
