// Starke Beinbewegungen: Knie hoch (Oberschenkel waagrecht), Ferse zum Gesäß (Knie ganz gebeugt), beides, halb, je von vorn,
// schräg (0,7) und von der Seite. Geprüft: Drehung der Person wird erkannt (Eichung nach dem Scan), Unterschenkel liegt bei
// gebeugtem Knie hinter dem Oberschenkel (Knie als Scharnier), an der Leiste sieht man nicht in die Hose (Innenseite rot
// eingefärbt, Pixel über dem Knie gezählt), der Stoff klappt an Hüfte und Knie nicht um, angehobenes Bein ohne Bodenstapel (nur leicht gestaucht),
// keine ungültigen Werte. Bilder nach ausgabe/beine_*.png. Aufruf: node tbeine.mjs [Testseite]
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
// Diese Posen (Knie hoch, Ferse zum Gesäß) blendet die Anprobe aus (über 45° Beugung). Geprüft wird hier die Form selbst (sie
// gilt weiter für die 3D-Ansicht, den Abgleich mit Model-Fotos und bis 45°): Ausblenden für diesen Test aus, sonst läse er eine
// alte, nicht gezeichnete Form
await p.evaluate(()=>{ const A=window.__dbg.AUS; A.flexAus=A.flexAn=A.kippAus=A.kippAn=999; });
const lage=async(m,ms=2200)=>{ await p.evaluate(m=>Object.assign(window.__mode,{zoom:1,rand:'raten',knee:0,kneeHigh:0,fersePo:0,kneeWave:0,yaw:0,hand:0,sway:0,ohneArme:1},m),m); await p.waitForTimeout(ms); };

// 1) Drehung nach dem Scan (vorher galt bis etwa 45° alles als frontal: Eichung vor dem Einschwingen der Glättung)
for(const yw of [.7,1]){ await lage({yaw:yw},2500); const y=await p.evaluate(()=>window.__dbg.g.yaw||0);
  pruefe(Math.abs(y-yw)<.15,`Drehung ${yw} wird erkannt: ${y.toFixed(2)}`); }

const mess=()=>p.evaluate(()=>{
  const g3=window.__dbg.g3, M=g3.M, NR=M.nr, C=13, P=g3.pos, ppc=g3.lastPpc, ic=g3.ic;
  let bad=0; for(let k=0;k<g3.nv*3;k++) if(!isFinite(g3.pos[k])) bad++;
  // umgeklappt: entlang einer Spalte läuft der Stoff zurück (> 120°), Hüfte (bis knapp unter den Schritt) und Knie, ohne Saum.
  // Mitte vorn am Schritt (zwischen den Beinen, verdeckt) wird getrennt gezählt
  let hip=0, mitte=0, knee=0; const wo=[];
  for(let s=0;s<2;s++) for(let f=0;f<2;f++) for(let j=0;j<C;j++) for(let i=1;i<NR-1;i++){ if(M.v[i]>.8) continue;
    const k=q=>(((s*NR+q)*2+f)*C+j)*3, a=k(i-1), b=k(i), c=k(i+1);
    const u=[P[b]-P[a],P[b+1]-P[a+1],P[b+2]-P[a+2]], w=[P[c]-P[b],P[c+1]-P[b+1],P[c+2]-P[b+2]], lu=Math.hypot(...u), lw=Math.hypot(...w);
    if(lu<.3*ppc||lw<.3*ppc) continue; if((u[0]*w[0]+u[1]*w[1]+u[2]*w[2])/(lu*lw)<-.5){ wo.push(`${s}${f?'h':'v'}${j}@${M.v[i].toFixed(2)}`); if(M.v[i]>=M.vc+.12) knee++; else if(!f&&j<=3) mitte++; else hip++; } }
  // Innenseite (rot) über dem Knie des Standbeins, als Anteil der Hosenfläche dort
  const o=document.getElementById('overlay'), d=o.getContext('2d').getImageData(0,0,o.width,o.height).data, B=window.__bone, ky=B[1][1].y*o.height/window.__vw[1];
  let rot=0, voll=0; for(let y=0;y<ky;y++) for(let x=0;x<o.width;x++){ const q=(y*o.width+x)*4; if(d[q+3]<200) continue; voll++; if(d[q]>140&&d[q+1]<70&&d[q+2]<70) rot++; }
  // angehobenes Bein (links, s=0): unterste Zeilen nicht gestaucht (g3.cmp: 1 = ungestaucht)
  let st=0, n=0; if(g3.cmp) for(let i=NR-10;i<NR;i++) for(let f=0;f<2;f++) for(let j=0;j<C;j++){ st+=g3.cmp[((0*NR+i)*2+f)*C+j]; n++; }
  // Knie als Scharnier: Unterschenkel des linken Beins in Körper-Koordinaten (vorn, quer)
  const yw=window.__dbg.g.yaw||0, h=[Math.cos(yw),0,Math.sin(yw)], fw=[Math.sin(yw),0,-Math.cos(yw)], Q=window.__B0||null;
  let shin=null; if(Q){ const sv=[Q[0][2][0]-Q[0][1][0],Q[0][2][1]-Q[0][1][1],Q[0][2][2]-Q[0][1][2]], l=Math.hypot(...sv)||1;
    shin={vorn:(sv[0]*fw[0]+sv[2]*fw[2])/l, quer:Math.abs(sv[0]*h[0]+sv[2]*h[2])/l}; }
  return {wo:wo.join(' '),bad,hip,mitte,knee,rot:voll?rot/voll:0,stauch:n?st/n:1,shin,gl:g3.gl.getError()};
});

const lagen=[['hoch',{kneeHigh:1}],['ferse',{fersePo:1}],['hochgebeugt',{kneeHigh:1,fersePo:1}],['halb',{kneeHigh:.6,fersePo:.6}]];
let maxRot=0, maxHip=0, maxMitte=0, maxKnee=0, ok=true;
for(const [n,m] of lagen) for(const yaw of [0,.7,1.45]){
  await lage({...m,yaw}); const r=await mess();
  await (await p.$('#stage')).screenshot({path:`${hier}ausgabe/beine_${n}_${yaw}.png`});
  console.log(`   ${n} ${yaw}: Innenseite ${(100*r.rot).toFixed(2)} %, umgeklappt Hüfte ${r.hip} (Mitte am Schritt ${r.mitte}) Knie ${r.knee}`+(r.shin?`, Unterschenkel vorn ${r.shin.vorn.toFixed(2)} quer ${r.shin.quer.toFixed(2)}`:'')+`, Saum ungestaucht ${r.stauch.toFixed(2)}`+(r.wo?' ['+r.wo+']':''));
  if(r.bad||r.gl) ok=false;
  maxRot=Math.max(maxRot,r.rot); maxHip=Math.max(maxHip,r.hip); maxMitte=Math.max(maxMitte,r.mitte); maxKnee=Math.max(maxKnee,r.knee);
  if(m.fersePo&&!m.kneeHigh&&yaw===.7) pruefe(r.shin&&r.shin.vorn<-.25&&r.shin.quer<.45,`Ferse zum Gesäß, schräg: Unterschenkel hinter dem Oberschenkel und in der Ebene des Beins (vorn ${r.shin?r.shin.vorn.toFixed(2):'?'}, quer ${r.shin?r.shin.quer.toFixed(2):'?'})`);
  // Seit 14.10.: die Überlänge staucht sich leicht über dem Knöchel (höchstens auf 80 %, über 30 cm), statt unter den Fuß zu hängen
  if(m.kneeHigh&&!m.fersePo&&yaw===0) pruefe(r.stauch>.85,`Knie hoch: angehobenes Bein hängt frei, ohne Bodenstapel, nur leicht gestaucht (ungestaucht ${r.stauch.toFixed(2)})`);
}
pruefe(ok,'keine ungültigen Werte, keine WebGL-Fehler');
pruefe(maxRot<.004,`an Leiste und Knie sieht man nicht in die Hose (Innenseite höchstens ${(100*maxRot).toFixed(2)} % der Fläche über dem Knie)`);
pruefe(maxHip<=1&&maxKnee<=2&&maxMitte<=8,`Stoff klappt an Hüfte und Knie nicht um (höchstens ${maxHip} bzw. ${maxKnee} Stellen; Mitte am Schritt zwischen den Beinen ${maxMitte})`);
await lage({}); const st=await mess();
pruefe(st.hip+st.mitte===0&&st.rot<.001,`im Stand nichts umgeklappt, keine Innenseite (${st.hip+st.mitte}, ${(100*st.rot).toFixed(2)} %)`);
pruefe(errs.length===0,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
await b.close();
if(fehler) process.exit(1);
