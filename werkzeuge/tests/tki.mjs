// KI-Freistellung (MediaPipe Interactive Segmenter „magic_touch“) und Fenster „Umriss prüfen“.
// MediaPipe kommt aus node_modules (statt jsDelivr), das Modell (6 MB) direkt von storage.googleapis.com.
// Ohne Netz zu Google wird der KI-Teil übersprungen; das Fenster wird dann mit dem Zauberstab geprüft.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';
const hier=fileURLToPath(new URL('.',import.meta.url)), tb=hier+'../../material/testbilder/', fotos=hier+'../../material/produktfotos/';
const MP=hier+'../../node_modules/@mediapipe/tasks-vision/';
const MT='https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite';
// Modell einmal holen (curl nutzt den Proxy der Umgebung) und in ausgabe/ zwischenspeichern
const MF=hier+'ausgabe/magic_touch.tflite'; let modell=null;
try{ if(!fs.existsSync(MF)) execSync(`curl -sSLf -m 120 -o "${MF}" ${MT}`,{stdio:'ignore'}); modell=fs.readFileSync(MF); }catch(_){}
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const typ=f=>f.endsWith('.wasm')?'application/wasm':/\.m?js$/.test(f)?'application/javascript':'application/octet-stream';
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
const seite=async ki=>{
  const ctx=await b.newContext({viewport:{width:1000,height:950}});
  await ctx.route('**/@mediapipe/tasks-vision@0.10.18/**',r=>{ if(!ki) return r.abort(); const f=MP+r.request().url().split('@0.10.18/')[1];
    r.fulfill({status:200,contentType:typ(f),headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(f)}); });
  await ctx.route('**/magic_touch.tflite',r=>ki?r.fulfill({status:200,body:modell,headers:{'access-control-allow-origin':'*'}}):r.abort());
  if(ki) await ctx.addInitScript(()=>{ window.__kiTest=true; });
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+(process.argv[2]||hier+'testseite-mit-simulierter-person.html')); await p.waitForTimeout(400);
  return {p,errs,ctx};
};
const bau=async(p,front,{pruefen=false,back=null}={})=>{
  await p.setInputFiles('#own-front',front); await p.setInputFiles('#own-back',back?[back]:[]); await p.fill('#own-waist','40');
  if(pruefen) await p.check('#own-check'); else await p.uncheck('#own-check');
  await p.evaluate(()=>document.getElementById('own-msg').textContent=''); await p.click('#own-go');
};
// Auf das Ergebnis warten; öffnet sich unterwegs das Fenster „Umriss prüfen“ von selbst (Farbe und KI uneinig), mit „Passt“ bestätigen
let fensterAuf=0;
const fertig=async p=>{ fensterAuf=0;
  for(let t=0;t<240;t++){
    const z=await p.evaluate(()=>({m:document.getElementById('own-msg').textContent,d:!document.getElementById('segDlg').hidden}));
    if(z.d){ fensterAuf++; await p.click('#segOk'); await p.waitForTimeout(300); continue; }
    if(/Fertig|ließ|klappt|Bitte|zu klein|nicht klar/.test(z.m)) return z.m;
    await p.waitForTimeout(500); }
  throw new Error('kein Ergebnis'); };
const zahl=(m,re)=>+((m.match(re)||[])[1]||0);

// 1) Mit KI: dunkle Hose auf dunklem Boden (Farbweg allein: 80 cm statt etwa 111)
if(modell){
  const {p,errs,ctx}=await seite(true);
  await bau(p,tb+'freistellung/dunkel.jpg'); let m=await fertig(p);
  pruefe(fensterAuf===1,'Farbe und KI uneinig: Fenster „Umriss prüfen“ öffnet sich von selbst');
  pruefe(/KI-Freistellung/.test(m)&&Math.abs(zahl(m,/Länge (\d+)/)-111)<=4,'Dunkel auf dunkel mit KI: '+(m.match(/Länge \d+ cm/)||[''])[0]+', '+(m.match(/Umriss mit KI[^.]*/)||['ohne KI'])[0]);
  // Weißer Grund: Farbe und KI einig, Ergebnis wie ohne KI
  await bau(p,fotos+'front.jpg',{back:fotos+'back.jpg'}); m=await fertig(p);
  pruefe(!/KI-Freistellung/.test(m)&&zahl(m,/Länge (\d+)/)===112,'Weißer Grund: Farbe und KI einig, '+(m.match(/Länge \d+ cm/)||[''])[0]);
  // Quer liegendes Foto: KI läuft auch nach dem Drehen
  await bau(p,tb+'problemfotos/quer.jpg'); m=await fertig(p);
  pruefe(/lag quer/.test(m)&&Math.abs(zahl(m,/Länge (\d+)/)-111)<=3,'Quer liegend mit KI: '+(m.match(/Länge \d+ cm/)||[''])[0]);
  pruefe(errs.length===0,'keine Skriptfehler mit KI'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
  await ctx.close();
}else console.log('übersprungen: KI-Modell nicht erreichbar (storage.googleapis.com)');

// 2) Fenster „Umriss prüfen“ ohne KI (Zauberstab): Schuh neben dem Bein wegnehmen
{
  const {p,errs,ctx}=await seite(false);
  const schuh=tb+'problemfotos/schuh_seitlich.jpg';   // Produktfoto mit dunklem Fleck rechts am Bein, wie ein Schuh
  await bau(p,schuh,{pruefen:true});
  await p.waitForSelector('#segDlg:not([hidden])',{timeout:60000});
  const n0=await p.evaluate(()=>window.__segDlg.m.reduce((a,v)=>a+v,0));
  await p.evaluate(()=>{ window.__segDlg.mode('sub'); window.__segDlg.tap(.92,.53); });
  const n1=await p.evaluate(()=>window.__segDlg.m.reduce((a,v)=>a+v,0));
  // Fast alles weg wäre falsch: Tipp mitten auf die Hose wird abgelehnt
  await p.evaluate(()=>window.__segDlg.tap(.33,.6));   // linkes Hosenbein
  const n2=await p.evaluate(()=>window.__segDlg.m.reduce((a,v)=>a+v,0)), txt=await p.evaluate(()=>document.getElementById('segTxt').textContent);
  await p.click('#segOk'); const m=await fertig(p);
  pruefe(n1<n0*.995&&n1>n0*.85,`Schuh weggetippt: Fläche ${n0} → ${n1}`);
  pruefe(n2===n1&&/fast die ganze Hose|innerhalb der Hose/.test(txt),'Tipp mitten auf die Hose löscht nichts: '+txt.slice(0,60));
  pruefe(/von Hand geprüft/.test(m)&&Math.abs(zahl(m,/Länge (\d+)/)-111)<=3&&Math.abs(zahl(m,/Leibhöhe (\d+)/)-44)<=2,'Maße danach: '+(m.match(/Länge \d+ cm.*?Leibhöhe \d+ cm/)||[''])[0]);
  // Escape lässt den automatischen Umriss stehen (keine Hose geht verloren)
  await bau(p,fotos+'front.jpg',{pruefen:true}); await p.waitForSelector('#segDlg:not([hidden])',{timeout:60000});
  await p.keyboard.press('Escape'); const m2=await fertig(p);
  pruefe(/Fertig/.test(m2)&&!/von Hand/.test(m2),'Escape im Fenster: automatischer Umriss bleibt');
  pruefe(errs.length===0,'keine Skriptfehler ohne KI'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
  await ctx.close();
}
await b.close();
if(fehler) process.exit(1);
