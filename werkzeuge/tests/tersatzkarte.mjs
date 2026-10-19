// Ersatzsuche der Karte (findReference mit opt.farbe, Gegenprüfung 19.10.): sie darf in Fotos ohne Karte nie eine Karte erfinden,
// auch nicht mit einer Kartenfarbe wie der Jeans (dunkle Karte neben dunkler Jeans: Stücke vom Bund), und muss die echte Karte
// auf der Rückseite der Testjeans finden (helles Holz, die Farb-Freistellung zählt sie zur Hose). Ohne Farbe läuft nur die
// Farb-Freistellung wie vor dem 18.10.
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), R=hier+'../../';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext()).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
// Foto wie in der Seite laden (2400 px, auf Wunsch über die Neigungsdaten gerade gerechnet), dann 900 px hoch wie refInPhoto
const lade=(f,gerade,name)=>p.evaluate(async([b64,gerade,name])=>{ const D=window.__dbg, bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)), file=new File([bin],'x.jpg',{type:'image/jpeg'});
  const meta=await D.readPhotoMeta(file); let hi=await D.fileToCanvas(file,2400); if(gerade){ const l=D.levelBySensor(hi,meta); if(l) hi=l.cv; }
  (window.__C=window.__C||{})[name]=D.scaleCanvas(hi,Math.min(1,900/hi.height)); },[fs.readFileSync(R+f).toString('base64'),gerade,name]);
const V='assets/referenz/fotos/flach-vorne-hinten/';
await lade('material/produktfotos/front.jpg',0,'front'); await lade('material/produktfotos/back.jpg',0,'back');
await lade(V+'vorne.jpg',1,'vorne'); await lade(V+'hinten.jpg',0,'hinten'); await lade(V+'hinten.jpg',1,'hintenG');
const such=(n,kind,farbe)=>p.evaluate(([n,kind,farbe])=>{ const D=window.__dbg, x=D.findReference(window.__C[n],kind,farbe?{farbe}:{});
  return x?{Q:x.Q.map(q=>q.map(Math.round)),farbe:D.refFarbe(window.__C[n],D.orderQuad(x.Q))}:null; },[n,kind,farbe]);

// 1) Ohne Farbe: Bershka ohne Karte → nichts; Testjeans vorne → Karte (Farb-Freistellung), hinten → nichts (Boden zählt zur Hose)
pruefe(!(await such('front','card'))&&!(await such('back','card'))&&!(await such('front','a4'))&&!(await such('back','a4')),'Fotos ohne Karte: keine Karte (ohne Farbe)');
const vo=await such('vorne','card');
pruefe(!!vo,'Testjeans vorne: Karte über die Farb-Freistellung'+(vo?` (Farbe ${vo.farbe.join(', ')})`:''));
pruefe(!(await such('hinten','card')),'Testjeans hinten ohne Farbe: keine Ersatzsuche');
// 2) Mit der Farbe von vorne: echte Karte hinten gefunden, roh (Vorsuche beim Hochladen) und gerade gerechnet (Ecken-Fenster)
if(vo){ for(const n of ['hinten','hintenG']){ const x=await such(n,'card',vo.farbe);
  const mitte=x?[x.Q.reduce((a,q)=>a+q[0],0)/4,x.Q.reduce((a,q)=>a+q[1],0)/4]:null;
  pruefe(!!x,`Testjeans ${n==='hinten'?'hinten roh':'hinten gerade gerechnet'} mit der Farbe von vorne: Karte gefunden`+(mitte?` (Mitte ${mitte.map(Math.round).join(', ')})`:'')); } }
// 3) Fotos ohne Karte mit jeder Kartenfarbe: Farben, die vorher Stücke vom Bund fanden, und ein Raster über den Farbraum
const FARBEN=[[55,60,70],[50,50,50],[60,60,60],[30,50,90],[70,75,86],[120,100,80],[199,166,115]];
for(const r of [40,130,220]) for(const g of [40,130,220]) for(const bb of [40,130,220]) FARBEN.push([r,g,bb]);
const treffer=await p.evaluate(F=>{ const D=window.__dbg, t=[];
  for(const n of ['front','back']) for(const f of F){ const x=D.findReference(window.__C[n],'card',{farbe:f}); if(x) t.push(n+' '+f.join('/')); } return t; },FARBEN);
pruefe(!treffer.length,`Fotos ohne Karte, Ersatzsuche mit ${FARBEN.length} Kartenfarben: ${treffer.length?'falsche Karte bei '+treffer.slice(0,4).join('; '):'nie eine Karte'}`);
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,2).join(' | '):''));
await b.close();
console.log(fehler?`${fehler} Fehler`:'Ersatzsuche der Karte in Ordnung'); process.exit(fehler?1:0);
