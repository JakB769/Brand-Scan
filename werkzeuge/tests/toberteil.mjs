// Oberteil über dem Bund: endet das Shirt unter dem Bund der 3D-Hose, verschwindet die Hose darunter (Kamerabild = Shirt
// scheint durch). Das Kamerabild für die Erkennung ist hier ein gemaltes Bild (window.__shirtBild) passend zur Attrappe:
// Shirt rot von den Schultern bis zur Saumhöhe, eigene Hose blau darunter. Ohne Bild (alle anderen Tests) bleibt es aus.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
await p.click('#quick'); await p.waitForTimeout(500);
await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:20000});
await p.evaluate(()=>{ window.__mode.yaw=1.5; });
await p.waitForFunction(()=>document.getElementById('step-side').classList.contains('done'),null,{timeout:20000});
await p.evaluate(()=>{ window.__mode.yaw=0; }); await p.waitForTimeout(1500); await p.click('#clean');
const cmN=.8/180, yOf=h=>.9-h*cmN;
// Bild malen: Hintergrund grau, eigene Hose (blau) ab 105 cm Höhe abwärts, Shirt (Farbe) von 150 cm bis zum Saum
const male=(saum,shirt,oben=105)=>p.evaluate(([saum,shirt,oben])=>{ const c=window.__shirtBild||(window.__shirtBild=document.createElement('canvas')); c.width=1280; c.height=720;
  const x=c.getContext('2d'), cmN=.8/180, X=l=>(.5+l*cmN/(1280/720))*1280, Y=h=>(.9-h*cmN)*720;
  x.fillStyle='rgb(200,200,196)'; x.fillRect(0,0,1280,720);
  x.fillStyle='rgb(40,60,140)'; x.fillRect(X(-24),Y(oben),X(24)-X(-24),Y(0)-Y(oben));
  x.fillStyle=shirt; x.fillRect(X(-26),Y(150),X(26)-X(-26),Y(saum)-Y(150)); },[saum,shirt,oben]);
const alpha=(lat,hgt)=>p.evaluate(([lat,hgt])=>{ const c=document.getElementById('overlay'), x=c.getContext('2d');
  const cmN=.8/180, X=Math.round((.5+lat*cmN/(1280/720))*c.width), Y=Math.round((.9-hgt*cmN)*c.height);
  return x.getImageData(X,Y,1,1).data[3]; },[lat,hgt]);
const zustand=()=>p.evaluate(()=>{ const s=window.__dbg.shirt; return s&&s.ys?{show:s.show,ys:s.ys.filter(v=>v!=null)}:{show:s?s.show:0,ys:[]}; });
const med=a=>{ const b=[...a].sort((x,y)=>x-y); return b[b.length>>1]; };

// ohne Bild: nichts erkannt, Hose bis zum Bund zu sehen
const a0=await alpha(5,96), s0=await zustand();
pruefe(a0>200&&s0.show<.02,`ohne Bild keine Erkennung, Hose unter dem Bund sichtbar (Deckkraft ${a0})`);

// Shirt bis 86 cm Höhe: liegt über dem Bund (Bund der 3D-Hose etwa bei 103 cm)
await male(86,'rgb(185,40,40)'); await p.waitForTimeout(1500);
let s=await zustand(), y=s.ys.length?med(s.ys):null;
pruefe(s.show>.9&&y!=null&&Math.abs(y-yOf(86))<.012,`Saum des Shirts erkannt: ${y&&y.toFixed(3)} (gemalt ${yOf(86).toFixed(3)})`);
const a1=await alpha(5,96), a2=await alpha(5,80);
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/oberteil.png'});
pruefe(a1<30,`über dem Shirtsaum ist die 3D-Hose weg (Deckkraft ${a1})`);
pruefe(a2>200,`unter dem Shirtsaum bleibt sie (Deckkraft ${a2})`);

// Shirt kurz (endet über dem Bund, darunter gleich die eigene Hose): 3D-Hose bleibt ganz
await male(112,'rgb(185,40,40)',112); await p.waitForTimeout(1500);
s=await zustand(); y=s.ys.length?med(s.ys):null;
pruefe(y!=null&&y<yOf(104),`kurzes Shirt endet über dem Bund: ${y&&y.toFixed(3)}`);
const a3=await alpha(5,96);
pruefe(a3>200,`Hose bleibt bis zum Bund (Deckkraft ${a3})`);

// Shirt in Hosenfarbe (eingesteckt oder gleich dunkel): keine Erkennung, Hose bleibt
await male(86,'rgb(44,62,138)'); await p.waitForTimeout(2500);
s=await zustand(); const a4=await alpha(5,96);
pruefe(s.show<.02&&a4>200,`gleiche Farbe wie die eigene Hose: nichts weggeschnitten (show ${s.show.toFixed(2)}, Deckkraft ${a4})`);

// ausschaltbar
await male(86,'rgb(185,40,40)'); await p.evaluate(()=>{ window.__dbg.PASSFORM.shirtDarueber=false; }); await p.waitForTimeout(1200);
const a5=await alpha(5,96);
pruefe(a5>200,`PASSFORM.shirtDarueber=false: Hose wie vorher (Deckkraft ${a5})`);

pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
