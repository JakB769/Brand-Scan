// Drehbare 3D-Ansicht ohne Kamera: erscheint mit der gewählten Hose, dreht sich beim Ziehen, verschwindet während der Anprobe
// Aufruf: node tansicht.mjs [Testseite]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';
const validator=createRequire(import.meta.url)('gltf-validator');
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({permissions:['camera'],viewport:{width:900,height:1000},acceptDownloads:true})).newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver/.test(m.text())) errs.push(m.text()); });
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+(process.argv[2]||hier+'testseite-mit-simulierter-person.html')); await p.waitForTimeout(400);
pruefe(await p.evaluate(()=>document.getElementById('g3dbox').hidden),'Ohne Hose keine 3D-Ansicht');
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
const box=await p.$('#g3dview'); await box.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
// Bild der Ansicht: Anteil der Hosen-Bildpunkte (blau) und ein grober Fingerabdruck, um eine Drehung zu erkennen
const bild=()=>p.evaluate(()=>{ const c=document.getElementById('g3dview'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let blau=0; const f=new Array(12).fill(0);
  for(let y=0;y<c.height;y+=2) for(let x=0;x<c.width;x+=2){ const i=(y*c.width+x)*4; if(d[i+3]>200&&d[i+2]>d[i]+15){ blau++; f[Math.floor(x/c.width*12)]++; } }
  return {blau,f}; });
const a=await bild();
pruefe(!(await p.evaluate(()=>document.getElementById('g3dbox').hidden))&&a.blau>3000,`3D-Ansicht zeigt die Hose (${a.blau} Hosen-Bildpunkte)`);
const bb=await box.boundingBox(); await p.mouse.move(bb.x+bb.width*.3,bb.y+bb.height/2); await p.mouse.down(); await p.mouse.move(bb.x+bb.width*.55,bb.y+bb.height/2,{steps:6}); await p.mouse.up();
await p.waitForTimeout(600); const c=await bild();
const diff=a.f.reduce((s,v,i)=>s+Math.abs(v-c.f[i]),0)/Math.max(1,a.blau);
pruefe(diff>.15&&c.blau>1500,`Ziehen dreht die Hose (Unterschied ${diff.toFixed(2)})`);
await box.screenshot({path:hier+'ausgabe/ansicht_gedreht.png'});
// 3D-Datei: gültiges glTF 2.0 (Khronos-Prüfer), Größe plausibel, Textur und Netz vollständig
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#g-glb')]);
const glb=hier+'ausgabe/hose.glb'; await dl.saveAs(glb);
const rep=await validator.validateBytes(new Uint8Array(fs.readFileSync(glb)));
const acc=JSON.parse(Buffer.from(fs.readFileSync(glb)).subarray(20,20+fs.readFileSync(glb).readUInt32LE(12)).toString()).accessors[0];
const hoch=(acc.max[1]-acc.min[1])*100, breit=(acc.max[0]-acc.min[0])*100, tief=(acc.max[2]-acc.min[2])*100;
pruefe(rep.issues.numErrors===0&&rep.issues.numWarnings===0&&rep.info.hasTextures&&rep.info.totalTriangleCount>4000,
  `3D-Datei ${dl.suggestedFilename()}: ${Math.round(fs.statSync(glb).size/1024)} KB, ${rep.info.totalTriangleCount} Dreiecke, Prüfer: ${rep.issues.numErrors} Fehler, ${rep.issues.numWarnings} Warnungen`);
pruefe(hoch>85&&hoch<120&&breit>35&&breit<90&&tief>15&&tief<60&&acc.min[1]>-0.05,`3D-Datei in Metern, Boden bei 0: ${hoch.toFixed(0)} × ${breit.toFixed(0)} × ${tief.toFixed(0)} cm (Höhe × Breite × Tiefe)`);
await p.click('#quick'); await p.waitForTimeout(1500);
pruefe(await p.evaluate(()=>document.getElementById('g3dbox').hidden),'Während der Anprobe mit Kamera ist die 3D-Ansicht aus');
pruefe(errs.length===0,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
await b.close();
if(fehler) process.exit(1);
