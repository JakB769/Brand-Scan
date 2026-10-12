// Kamera am Handy: Frontkamera als Standard, Wechsel zuverlässig (iOS: Kamera direkt nach dem Stoppen noch belegt →
// kurz warten und noch einmal; „exact“ gibt es nicht → nächster Weg), scheitert der Wechsel ganz, läuft die vorige Kamera
// weiter statt eines schwarzen Bildes. Dazu die Tempo-Anpassung: Erkennung auf verkleinertem Bild, bei langsamen Bildern
// leichtes Modell und kleinere 3D-Fläche. getUserMedia wird dafür umhüllt (Fehler auf Bestellung).
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:430,height:900},isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{
  window.__gum=[]; window.__gumFail=[];          // Liste der Anfragen; Fehler, die nacheinander kommen sollen
  const md=navigator.mediaDevices, orig=md.getUserMedia.bind(md);
  md.getUserMedia=async c=>{ window.__gum.push(JSON.stringify(c.video)); const f=window.__gumFail.shift();
    if(f){ const e=new Error(f); e.name=f; throw e; }
    if(window.__gumSperre&&JSON.stringify(c.video).includes(window.__gumSperre)){ const e=new Error('belegt'); e.name='NotReadableError'; throw e; }
    return orig(c); };
  // zwei Kameras melden (der Knopf zum Wechseln erscheint nur dann)
  const en=md.enumerateDevices.bind(md);
  md.enumerateDevices=async()=>{ const d=await en(); const v=d.filter(x=>x.kind==='videoinput');
    return v.length>1?d:[...d,{kind:'videoinput',deviceId:'zweite',label:'',groupId:'x',toJSON(){return this;}}]; };
});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
await p.click('#quick'); await p.waitForTimeout(2500);
const zustand=()=>p.evaluate(()=>({gum:window.__gum.slice(),mirror:document.getElementById('stage').classList.contains('mirror'),
  live:!!(document.getElementById('video').srcObject&&document.getElementById('video').srcObject.getVideoTracks()[0]?.readyState==='live'),
  flip:!document.getElementById('flip').hidden,err:document.getElementById('error').hidden?'':document.getElementById('error').textContent}));
let z=await zustand();
pruefe(/"user"/.test(z.gum[0])&&z.mirror&&z.live,'Start mit der Frontkamera, Bild gespiegelt: '+z.gum[0]);
pruefe(z.flip,'Knopf zum Kamerawechsel sichtbar (zwei Kameras, Touch)');
// Wechsel, beim ersten Versuch noch belegt (iOS): zweiter Versuch klappt
await p.evaluate(()=>{ window.__gum.length=0; window.__gumFail.push('NotReadableError'); });
await p.click('#flip'); await p.waitForTimeout(1500); z=await zustand();
pruefe(z.live&&!z.mirror&&z.gum.length>=2&&/environment/.test(z.gum[z.gum.length-1])&&!z.err,`Wechsel nach hinten trotz belegter Kamera (${z.gum.length} Anfragen), nicht gespiegelt`);
// Hinten gibt es nicht als „exact“: nächster Weg
await p.click('#flip'); await p.waitForTimeout(1200);
await p.evaluate(()=>{ window.__gum.length=0; window.__gumFail.push('OverconstrainedError'); });
await p.click('#flip'); await p.waitForTimeout(1500); z=await zustand();
pruefe(z.live&&z.gum.length>=2&&!z.err,'„exact“ nicht möglich: Kamera trotzdem gewechselt ('+z.gum.join(' → ')+')');
// Wechsel scheitert ganz: vorige Kamera läuft weiter, Meldung
await p.click('#flip'); await p.waitForTimeout(1200); const vorher=(await zustand()).mirror;
await p.evaluate(v=>{ window.__gum.length=0; window.__gumSperre=v?'environment':'user'; },vorher);   // die andere Kamera ist dauerhaft belegt
await p.click('#flip'); await p.waitForTimeout(7000); z=await zustand(); await p.evaluate(()=>{ window.__gumSperre=null; });
pruefe(z.live&&z.mirror===vorher&&/nicht geklappt/.test(z.err),'Wechsel unmöglich: bisherige Kamera läuft weiter, Meldung „'+z.err.slice(0,40)+'…“');
// Doppelt tippen während des Wechsels: kein zweiter Wechsel dazwischen
await p.evaluate(()=>{ document.getElementById('error').hidden=true; window.__gum.length=0; window.__gumFail.push('NotReadableError'); });
await p.evaluate(()=>{ const f=document.getElementById('flip'); f.click(); f.click(); f.click(); }); await p.waitForTimeout(2000); z=await zustand();
pruefe(z.live&&z.gum.length<=3,'dreimal schnell getippt: ein Wechsel ('+z.gum.length+' Anfragen)');
// Tempo: Erkennung auf verkleinertem Bild (Handy: lange Seite 640), langsame Bilder → leichtes Modell, kleinere 3D-Fläche
const t=await p.evaluate(async()=>{ const d=window.__dbg; window.__perfTest=true; await new Promise(r=>setTimeout(r,3500));
  return {rs:d.PERF?d.PERF.rs:null,lite:d.PERF?d.PERF.lite:null,ms:d.PERF?Math.round(d.PERF.ms):null,inf:d.PERF&&d.PERF.c?[d.PERF.c.width,d.PERF.c.height]:null,g3w:d.g3.c?d.g3.c.width:null}; });
console.log('Tempo:',JSON.stringify(t));
pruefe(t.inf&&Math.max(...t.inf)===640,'Erkennung am Handy auf 640 px: '+JSON.stringify(t.inf));
pruefe(t.ms>55?(t.lite&&t.rs<1&&t.g3w<1280):true,`langsam (${t.ms} ms je Bild): leichtes Modell ${t.lite}, 3D-Fläche ${t.rs} (${t.g3w} px breit)`);
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
