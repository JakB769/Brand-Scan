// 3D-Darstellung: Hand vor der Hose schneidet sie aus (Kamerabild scheint durch), Saumstauchung ohne übereinanderliegende
// Zeilen, Bund hinten höher als vorne, Bund/Saum mit Dicke, Schatten nur auf dem Körper (kein Schleier auf dem Hintergrund),
// keine WebGL-Fehler. Aufruf: node tdarstellung.mjs [Testseite]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+(process.argv[2]||hier+'testseite-mit-simulierter-person.html')); await p.waitForTimeout(500);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
await p.click('#quick'); await p.waitForTimeout(500);
await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:20000});
await p.evaluate(()=>{ window.__mode.yaw=1.5; });
await p.waitForFunction(()=>document.getElementById('step-side').classList.contains('done'),null,{timeout:20000});
await p.evaluate(()=>{ window.__mode.yaw=0; }); await p.waitForTimeout(1500); await p.click('#clean');
const lage=async m=>{ await p.evaluate(m=>Object.assign(window.__mode,{zoom:1,rand:'raten',knee:0,yaw:0,hand:0,sway:0},m),m); await p.waitForTimeout(2500); };
// Punkt der Attrappe (seitlich cm, Höhe cm) → Deckkraft der Überlagerung dort (0 = Kamerabild sichtbar)
const alpha=(lat,hgt)=>p.evaluate(([lat,hgt])=>{ const c=document.getElementById('overlay'), x=c.getContext('2d');
  const cmN=.8/180, X=Math.round((.5+lat*cmN/(1280/720))*c.width), Y=Math.round((.9-hgt*cmN)*c.height);
  return x.getImageData(X,Y,1,1).data[3]; },[lat,hgt]);

// 1) Hand vor dem Oberschenkel
await lage({});
const a0=await alpha(10,86);
await lage({hand:1});
const a1=await alpha(10,86);
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/3d_hand.png'});
pruefe(a0>200&&a1<30,`Hand vor der Hose schneidet sie aus: Deckkraft an der Hand ohne Hand ${a0}, mit Hand ${a1}`);
await lage({});
const a2=await alpha(10,86);
pruefe(a2>200,`Hand wieder weg: Hose wieder geschlossen (${a2})`);

// 2) Rand der Hose zum Hintergrund: harter Übergang, kein Schatten-Schleier daneben (Hintergrund liegt außerhalb der Person)
const rand=await p.evaluate(()=>{ const c=document.getElementById('overlay'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  const y=Math.round((.9-70*.8/180)*c.height); let x=Math.round(c.width/2), e1=-1, e2=-1, voll=d[(y*c.width+x)*4+3];
  for(;x<c.width;x++){ const a=d[(y*c.width+x)*4+3]; if(e1<0&&a<.9*voll) e1=x; if(e1>=0&&a===0){ e2=x; break; } }
  return {e1,e2,w:e2-e1,voll}; });
pruefe(rand.voll>150&&rand.e1>0&&rand.w<=4,`Rand zum Hintergrund: ${rand.w} Bildpunkte Übergang (früher Schatten-Schleier über ~15)`);
// Kontaktschatten unter dem Saum (auf dem Fuß, der zur Person gehört)
const kontakt=await p.evaluate(()=>{ const c=document.getElementById('overlay'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, cmN=.8/180;
  const X=Math.round((.5+9*cmN/(1280/720))*c.width); let y=Math.round((.9-40*cmN)*c.height);
  const voll=d[(y*c.width+X)*4+3]; while(y<c.height-1&&d[(y*c.width+X)*4+3]>=.9*voll) y++;
  const px=1/(cmN*c.height); return [1,2].map(k=>d[(Math.round(y+k*px)*c.width+X)*4+3]); });
pruefe(kontakt[0]>15,`Kontaktschatten unter dem Saum: Deckkraft 1 cm darunter ${kontakt[0]}, 2 cm darunter ${kontakt[1]}`);

// 3) Geometrie: Saum ohne übereinanderliegende Zeilen, Bund hinten höher, Rand mit Dicke, keine ungültigen Werte
const geo=await p.evaluate(()=>{
  const g3=window.__dbg.g3, M=Object.values(window.__dbg.GARMENTS).find(G=>G.m3).m3, NR=M.nr, C=13, ic=g3.ic, T=g3.tgRoh, ppc=g3.lastPpc, F=g3.frame;
  const id=(s,i,f,j)=>((s*NR+i)*2+f)*C+j, P=(A,k)=>[A[k*3],A[k*3+1],A[k*3+2]];
  let minStep=1e9;
  for(let s=0;s<2;s++){ const a=P(T,id(s,ic,0,0)), z=P(T,id(s,NR-1,0,0)), dl=Math.hypot(z[0]-a[0],z[1]-a[1],z[2]-a[2]), dir=[(z[0]-a[0])/dl,(z[1]-a[1])/dl,(z[2]-a[2])/dl];
    for(let f=0;f<2;f++) for(let j=0;j<C;j++) for(let i=ic+1;i<NR;i++){ const q=P(T,id(s,i,f,j)), r=P(T,id(s,i-1,f,j));
      minStep=Math.min(minStep,((q[0]-r[0])*dir[0]+(q[1]-r[1])*dir[1]+(q[2]-r[2])*dir[2])/ppc); } }
  const upOf=k=>{ const q=P(g3.pos,k); return ((q[0]-F.top[0])*F.up[0]+(q[1]-F.top[1])*F.up[1]+(q[2]-F.top[2])*F.up[2])/ppc; };
  const hinten=upOf(id(0,0,1,0))-upOf(id(0,0,0,0));
  let bad=0; for(let k=0;k<g3.nv*3;k++) if(!isFinite(g3.pos[k])||!isFinite(g3.nor[k])) bad++;
  const nRim=g3.nv-g3.nRing-g3.nWall;
  return {minStep,hinten,bad,nRim,glErr:g3.gl.getError()};
});
pruefe(geo.minStep>=.25,`Saum: jede Zeile liegt tiefer als die vorige (kleinster Abstand ${geo.minStep.toFixed(2)} cm)`);
pruefe(geo.hinten>1.5&&geo.hinten<4,`Bund hinten ${geo.hinten.toFixed(1)} cm höher als vorne`);
pruefe(geo.nRim>0&&geo.bad===0,`Bund und Saum mit Dicke (${geo.nRim} Randpunkte), keine ungültigen Werte`);
pruefe(geo.glErr===0,`keine WebGL-Fehler (${geo.glErr})`);

// 4) Knie hoch und seitlich: keine ungültigen Werte, kein WebGL-Fehler
for(const m of [{knee:1,yaw:.3},{yaw:1.5},{yaw:3.14},{zoom:1.8,yaw:.2}]){
  await lage(m);
  const r=await p.evaluate(()=>{ const g3=window.__dbg.g3; let bad=0; for(let k=0;k<g3.nv*3;k++) if(!isFinite(g3.pos[k])) bad++; return {bad,gl:g3.gl.getError()}; });
  pruefe(r.bad===0&&r.gl===0,`Lage ${JSON.stringify(m)}: keine ungültigen Werte, keine WebGL-Fehler`);
}
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/3d_nah.png'});
pruefe(errs.length===0,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
await b.close();
if(fehler) process.exit(1);
