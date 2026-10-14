// Ganzkörper-Posen mit der Attrappe: Ausfallschritt, seitlicher Spagat, Längsspagat (von vorn und von der Seite), Liegestütz.
// Geprüft: keine ungültigen Werte, Hose liegt auf beiden Beinen (Knie und Mitte Unterschenkel im Bild von Hose bedeckt), Stoff
// klappt nicht um, man sieht nicht in die Hose (Innenseite rot), beim Liegestütz wird die Hose ausgeblendet (g.trk → 0) und
// danach im Stand wieder eingeblendet. Bilder nach ausgabe/posen_*.png. Aufruf: node tposen.mjs [Testseite]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.addInitScript(()=>{ window.__innenRot=1; });
await p.goto('file://'+(process.argv[2]||hier+'testseite-mit-simulierter-person.html')); await p.waitForTimeout(500);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
await p.click('#quick'); await p.waitForTimeout(500);
await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:20000});
await p.waitForTimeout(1000); await p.click('#clean').catch(()=>{});
const lage=async(m,ms=2500)=>{ await p.evaluate(m=>Object.assign(window.__mode,{zoom:1,rand:'raten',knee:0,kneeHigh:0,fersePo:0,kneeWave:0,yaw:0,hand:0,sway:0,ohneArme:1,
  ausfall:0,spagat:0,liegestuetz:0},m),m); await p.waitForTimeout(ms); };

const mess=()=>p.evaluate(()=>{
  const g3=window.__dbg.g3, M=g3.M, NR=M.nr, C=13, P=g3.pos, ppc=g3.lastPpc;
  let bad=0; for(let k=0;k<g3.nv*3;k++) if(!isFinite(g3.pos[k])) bad++;
  // umgeklappt wie in tbeine: entlang einer Spalte läuft der Stoff zurück (> 120°), ohne Saum
  // getrennt gezählt wie in tbeine: Hüfte, Mitte vorn am Schritt (zwischen den Beinen, verdeckt), Knie
  let hip=0, mitte=0, knee=0; const wo=[]; for(let s=0;s<2;s++) for(let f=0;f<2;f++) for(let j=0;j<C;j++) for(let i=1;i<NR-1;i++){ if(M.v[i]>.8) continue;
    const k=q=>(((s*NR+q)*2+f)*C+j)*3, a=k(i-1), bb=k(i), c=k(i+1);
    const u=[P[bb]-P[a],P[bb+1]-P[a+1],P[bb+2]-P[a+2]], w=[P[c]-P[bb],P[c+1]-P[bb+1],P[c+2]-P[bb+2]], lu=Math.hypot(...u), lw=Math.hypot(...w);
    if(lu<.3*ppc||lw<.3*ppc) continue; if((u[0]*w[0]+u[1]*w[1]+u[2]*w[2])/(lu*lw)<-.5){ wo.push(`${s}${f?'h':'v'}${j}@${M.v[i].toFixed(2)}`); if(M.v[i]>=M.vc+.12) knee++; else if(!f&&j<=3) mitte++; else hip++; } }
  const um={hip,mitte,knee,wo:wo.join(' ')};
  const o=document.getElementById('overlay'), d=o.getContext('2d').getImageData(0,0,o.width,o.height).data, B=window.__bone, sk=o.width/window.__vw[0];
  let rot=0, voll=0; for(let q=0;q<d.length;q+=4){ if(d[q+3]<200) continue; voll++; if(d[q]>140&&d[q+1]<70&&d[q+2]<70) rot++; }
  // Hose an Knie und Mitte Unterschenkel jedes Beins (3×3-Feld um den Punkt, Deckkraft)
  const deckt=(x,y)=>{ let n=0; for(let dy=-4;dy<=4;dy+=4) for(let dx=-4;dx<=4;dx+=4){ const X=Math.round(x*sk+dx), Y=Math.round(y*sk+dy);
    if(X<0||Y<0||X>=o.width||Y>=o.height) continue; if(d[(Y*o.width+X)*4+3]>150) n++; } return n>=5; };
  const punkte=B.map(c=>[deckt(c[1].x,c[1].y),deckt((c[1].x+c[2].x)/2,(c[1].y+c[2].y)/2)]);
  // Richtung von Ober- und Unterschenkel je Bein in Körper-Koordinaten (vorn, unten; Bild-y nach unten), aus B0 (nach legHinge)
  const yw=window.__dbg.g.yaw||0, fw=[Math.sin(yw),0,-Math.cos(yw)], Q=window.__B0||null;
  const ri=Q?Q.map(c=>[[0,1],[1,2]].map(([a,e])=>{ const v=[c[e][0]-c[a][0],c[e][1]-c[a][1],c[e][2]-c[a][2]], l=Math.hypot(...v)||1;
    return [+((v[0]*fw[0]+v[2]*fw[2])/l).toFixed(2),+(v[1]/l).toFixed(2)]; })):null;
  return {bad,um,rot:voll?rot/voll:0,voll,punkte,ri,legCm:window.__dbg.legCm,trk:window.__dbg.g.trk,gl:g3.gl.getError()};
});

let ok=true;
for(const [n,m] of [['ausfall',{ausfall:1}],['ausfall_schraeg',{ausfall:1,yaw:.7}],['spagat_seitlich',{spagat:1}],['spagat_laengs_vorn',{spagat:2}],['spagat_laengs_seite',{spagat:2,yaw:1.45}]]){
  await lage(m); const r=await mess();
  await (await p.$('#stage')).screenshot({path:`${hier}ausgabe/posen_${n}.png`});
  console.log(`   ${n}: Hose ${r.voll} px, Knie/Unterschenkel bedeckt ${JSON.stringify(r.punkte)}, umgeklappt ${JSON.stringify(r.um)}, Richtung [vorn,unten] ${JSON.stringify(r.ri)}, Innenseite ${(100*r.rot).toFixed(2)} %, trk ${r.trk.toFixed(2)}, Beinlängen ${JSON.stringify(r.legCm)}`);
  if(r.bad||r.gl) ok=false;
  // Längsspagat genau von vorn: das vordere Bein zeigt in die Kamera, man sieht in die Saumöffnung (dort wäre der Fuß), das
  // hintere liegt hinter dem Becken. Das ist eine Grenzlage: dort nur, dass ein Bein bedeckt ist und nichts umklappt.
  const grenz=n==='spagat_laengs_vorn', beide=r.punkte.every(q=>q[0]&&q[1]), eines=r.punkte.some(q=>q[0]&&q[1]);
  pruefe(r.trk>.95&&(grenz||n==='spagat_laengs_seite'?eines:beide),`${n}: Hose sichtbar und auf den Beinen (Knie und Unterschenkel bedeckt: ${JSON.stringify(r.punkte)})`);
  // Oberschenkel 90° nach vorn (Ausfallschritt): an der Leiste knickt der Stoff wirklich (Bild geprüft, Bund bleibt ganz), darum
  // an der Hüfte mehr Stellen als in tbeine (dort ≤ 1 bei Knie hoch ohne zweites, nach hinten gestrecktes Bein)
  pruefe(r.um.hip<=(grenz?12:8)&&r.um.knee<=2&&r.um.mitte<=8&&(grenz||r.rot<.01),`${n}: Stoff klappt an Hüfte und Knie nicht um (${JSON.stringify(r.um)}), kaum Innenseite (${(100*r.rot).toFixed(2)} %)`);
}
pruefe(ok,'keine ungültigen Werte, keine WebGL-Fehler');

// Liegestütz: Hose aus (unsichere Erkennung), danach im Stand wieder da
await lage({liegestuetz:1},1500); const lg=await mess();
await (await p.$('#stage')).screenshot({path:`${hier}ausgabe/posen_liegestuetz.png`});
pruefe(lg.trk<.05&&lg.voll<200,`Liegestütz: Hose ausgeblendet (Deckkraft ${lg.trk.toFixed(2)}, ${lg.voll} px)`);
await lage({liegestuetz:1,beineSicht:.95},1500); const lg2=await mess();
pruefe(lg2.trk<.05,`Liegestütz mit sicher erkannten Beinen (Rumpf und Beine zeigen von der Kamera weg): ausgeblendet (${lg2.trk.toFixed(2)})`);
await lage({},1500); const st=await mess();
pruefe(st.trk>.95&&st.voll>5000,`danach im Stand wieder eingeblendet (Deckkraft ${st.trk.toFixed(2)}, ${st.voll} px)`);
pruefe(errs.length===0,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
await b.close();
if(fehler) process.exit(1);
