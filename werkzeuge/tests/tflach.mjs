// Flach fotografierte Hose über „Dateien hochladen“ (Rückschritt vom 10.10., ed215a1): die echten Fotos des Nutzers
// (Jeans auf Holzboden, warmes Zimmerlicht) galten als „Foto mit Person, angeschnitten“, weil ausgewaschenes Denim und Holz
// im Hautfarbenbereich liegen. Geprüft: beide Fotopaare flach erkannt und gebaut, ohne Maßtabelle; Bankkarte im Foto wird als
// Maßstab erkannt, das Fenster zum Bestätigen der Ecken kommt, die Länge stimmt (echt 105 cm); beim Neubauen (andere Größe,
// Tabelle dazu) kommt das Fenster nicht noch einmal; ein Model-Foto ab der Hüfte gilt weiter als angeschnitten.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const hier=fileURLToPath(new URL('.',import.meta.url)), R=hier+'../../', tb=R+'material/testbilder/', nm=R+'node_modules/';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1000,height:1200}})).newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver|ERR_|Failed to load/.test(m.text())) errs.push(m.text()); });
await p.route('**/heic-to@1.6.5/**',r=>r.fulfill({status:200,contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(nm+'heic-to/dist/heic-to.min.js')}));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
const liste=()=>p.evaluate(()=>[...document.querySelectorAll('#drop-list .dtxt b')].map(e=>e.textContent));
const msg=()=>p.evaluate(()=>document.getElementById('drop-msg').innerText.replace(/\n/g,' / '));
const fertig=async()=>{ for(let t=0;t<240;t++){ await p.waitForTimeout(500); const m=await msg(); if(/Fertig|fehlt|keine realistische|nicht/.test(m)&&!/berechnet|wird/.test(m)) return m; } return msg(); };
const neu=()=>p.evaluate(()=>document.getElementById('drop-new').click());

// 1) iPhone-Fotos ohne Karte (HEIC, Holzboden): beide flach, Hose gebaut, ohne Maßtabelle
await p.setInputFiles('#drop-in',[tb+'echt/vorne_IMG_7264.HEIC',tb+'echt/hinten_IMG_7265.heic']);
let m=await fertig(), l=await liste();
pruefe(l.length===2&&l.every(t=>/flach/.test(t))&&!l.some(t=>/Person/.test(t)),'Holzboden-Fotos flach erkannt: '+l.join(' | '));
pruefe(/Fertig/.test(m)&&/keine Maßtabelle/.test(m),'ohne Maßtabelle gebaut: '+m.slice(m.indexOf('Fertig'),m.indexOf('Fertig')+50));

// 2) Fotos mit Bankkarte: Karte erkannt, Ecken bestätigen, Länge gemessen
await neu(); let dlg=0;
await p.setInputFiles('#drop-in',[tb+'echt/karte_vorne_IMG_7267.jpg',tb+'echt/karte_hinten_IMG_7268.jpg']);
for(let t=0;t<240;t++){ await p.waitForTimeout(500);
  if(await p.evaluate(()=>!document.getElementById('refDlg').hidden)){ dlg++; await p.waitForTimeout(200); await p.click('#refOk'); continue; }
  const mm=await msg(); if(/Fertig|fehlt|keine realistische/.test(mm)&&!/berechnet|wird/.test(mm)) break; }
m=await msg(); l=await liste();
const L=+(m.match(/Länge (\d+) cm/)||[])[1];
pruefe(l.some(t=>/Bankkarte als Maßstab/.test(t)),'Bankkarte im Foto erkannt: '+l.join(' | '));
pruefe(dlg>=1,`Fenster zum Bestätigen der Ecken kam (${dlg}×)`);
pruefe(Math.abs(L-105)<=4,`Länge mit Karte gemessen: ${L} cm (echt 105)`);
const tag=await p.evaluate(()=>document.getElementById('tag-len').textContent);
pruefe(tag==='gemessen','Länge als gemessen gekennzeichnet: '+tag);
// Neubau derselben Hose (Maßtabelle als Text dazu): kein zweites Fenster, Maße bleiben gemessen bzw. aus der Tabelle
const vorher=dlg;
await p.evaluate(()=>{ document.activeElement&&document.activeElement.blur(); const dt=new DataTransfer(); dt.setData('text/plain','Größe S M L\nBundweite 38 40 42 cm'); document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true})); });
for(let t=0;t<60;t++){ await p.waitForTimeout(500); if(await p.evaluate(()=>!document.getElementById('refDlg').hidden)){ dlg++; await p.click('#refOk'); }
  const mm=await msg(); if(/Fertig/.test(mm)&&/Tabelle|Maße: /.test(mm)&&!/berechnet|wird/.test(mm)) break; }
pruefe(dlg===vorher,'beim Neubau kein zweites Fenster');

// 3) Model-Foto ab der Hüfte bleibt „angeschnitten“
await neu(); await p.setInputFiles('#drop-in',tb+'getragen/model_ausschnitt_bershka.jpg'); await fertig(); l=await liste();
pruefe(/angeschnitten/.test(l[0]||''),'Model-Foto ab der Hüfte: '+l[0]);
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
