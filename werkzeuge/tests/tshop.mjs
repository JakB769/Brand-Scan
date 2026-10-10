// Anprobe wie im Shop: Knopf öffnet Vollbild mit Kamera und nur der Hose, ✕ / Zurück / Escape schließen und stoppen die Kamera
// Aufruf: node tshop.mjs [Testseite]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({permissions:['camera'],viewport:{width:430,height:860},isMobile:true,hasTouch:true})).newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver/.test(m.text())) errs.push(m.text()); });
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+(process.argv[2]||hier+'testseite-mit-simulierter-person.html')); await p.waitForTimeout(400);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:120000});
await p.fill('#height',''); await p.click('#tryon'); await p.waitForTimeout(300);
const z0=await p.evaluate(()=>({shop:document.getElementById('stage').classList.contains('shop'),msg:document.getElementById('g-msg').textContent,fokus:document.activeElement.id}));
pruefe(!z0.shop&&/Körpergröße/.test(z0.msg)&&z0.fokus==='height','Ohne Körpergröße: kein Vollbild, Hinweis und Feld im Fokus');
await p.fill('#height','179'); await p.click('#tryon'); await p.waitForTimeout(2500);
const zustand=()=>p.evaluate(()=>{ const st=document.getElementById('stage'), r=st.getBoundingClientRect(), x=document.getElementById('shopClose').getBoundingClientRect();
  const c=document.getElementById('overlay'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=16) if(d[i]>100) n++;
  return {full:st.classList.contains('full'),shop:st.classList.contains('shop'),clean:st.classList.contains('clean'),w:r.width,h:r.height,
    x:x.width>40&&x.right<=innerWidth&&x.top>=0, hud:[...document.querySelectorAll('.hud-top,.hud-bottom')].map(e=>getComputedStyle(e).display).join(), ansage:getComputedStyle(document.getElementById('coach')).display, video:!!document.getElementById('video').srcObject,
    hose:n, ansicht:document.getElementById('g3dbox').hidden}; });
const z1=await zustand();
pruefe(z1.full&&z1.shop&&z1.clean&&z1.w>=420&&z1.h>=850&&z1.x&&z1.hud==='none,none'&&z1.ansage!=='none',`Vollbild, nur Kleidung und Ansagen, keine Messwerte/Knöpfe, ✕ sichtbar (${Math.round(z1.w)}×${Math.round(z1.h)})`);
pruefe(z1.video&&z1.hose>500&&z1.ansicht,`Kamera läuft, Hose liegt auf (${z1.hose} Bildpunkte), 3D-Ansicht aus`);
await p.tap('#stage',{position:{x:200,y:400}}); await p.waitForTimeout(300);
pruefe((await zustand()).clean,'Tipp auf das Bild blendet im Shop-Modus nichts ein');
await p.click('#shopClose'); await p.waitForTimeout(1200);
const z2=await zustand();
pruefe(!z2.full&&!z2.shop&&!z2.clean&&!z2.video&&!z2.ansicht,'✕ schließt: kein Vollbild, Kamera aus, 3D-Ansicht wieder da');
await p.click('#tryon'); await p.waitForTimeout(1500); await p.goBack(); await p.waitForTimeout(800);
const z3=await zustand();
pruefe(!z3.shop&&!z3.video,'Zurück-Taste schließt die Anprobe');
await p.click('#tryon'); await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.waitForTimeout(800);
pruefe(!(await zustand()).shop,'Escape schließt die Anprobe');
// Sofort wieder schließen, während die Kamera noch startet: Kamera bleibt aus, 3D-Ansicht kommt wieder
await p.click('#tryon'); await p.keyboard.press('Escape'); await p.waitForTimeout(2500);
const z4=await zustand();
pruefe(!z4.shop&&!z4.video&&!z4.ansicht,'Während des Kamerastarts geschlossen: Kamera bleibt aus, 3D-Ansicht wieder da');
pruefe(errs.length===0,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
await b.close();
if(fehler) process.exit(1);
