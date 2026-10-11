// Fall des Stoffs (drape3d): einmal in Ruhehaltung simulieren, dann mitbewegen. Geprüft in der drehbaren 3D-Ansicht
// (Puppe 179 cm): zu lange Hose liegt auf dem Boden auf, ohne flache Lappen daneben; kurze Hose hängt frei; Rechnung in
// Stücken (Anprobe ruckelt nicht) gibt dasselbe wie am Stück; ausschaltbar; keine ungültigen Werte.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1100,height:1400}})).newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
await p.fill('#height','179');
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
const box=await p.$('#g3dview'); await box.scrollIntoViewIfNeeded();
const laenge=async l=>{ await p.fill('#g-len',String(l)); await p.dispatchEvent('#g-len','input'); await p.waitForTimeout(400);
  for(let t=0;t<200;t++){ if(await p.evaluate(()=>{ const c=window.__dbg.g3.drape; return !!c&&[...c.values()].every(j=>j.done); })) break; await p.waitForTimeout(300); }
  await p.evaluate(()=>{ const v=window.__dbg.v3d; v.yaw=0; v.idle=1e15; }); await p.waitForTimeout(1200); };
// Lage in der 3D-Ansicht (wie view3dPose, Drehung 0): Höhe über dem Boden und Abstand zur Knöchelachse je Bein, in cm
const form=()=>p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], c=document.getElementById('g3dview'), W=c.width, H=c.height;
  const Hc=179, beltH=.52*Hc+.045*Hc, len=+document.getElementById('g-len').value.replace(',','.'), ppc=H*.9/Math.max(beltH+6,len+10), floor=H*.955, half=.05*Hc*ppc;
  const M=d.g3.M, NR=M.nr, n=d.g3.nRing, C=n/(4*NR), P=d.g3.pos; let ok=true;
  for(let k=0;k<d.g3.nv*3;k++) if(!isFinite(P[k])) ok=false;
  const o={ok,minH:1e9,saumMin:1e9,saumMax:-1e9,rBoden:0,rSaum:0,rOben:0};
  for(let s=0;s<2;s++){ const ax=W/2+(s?-1:1)*half;
    for(let i=0;i<NR;i++) for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const k=((s*NR+i)*2+f)*C+j, h=(floor-P[k*3+1])/ppc, r=Math.hypot(P[k*3]-ax,P[k*3+2])/ppc;
      o.minH=Math.min(o.minH,h);
      if(i===NR-1){ o.saumMin=Math.min(o.saumMin,h); o.saumMax=Math.max(o.saumMax,h); o.rSaum=Math.max(o.rSaum,r); }
      if(h<5) o.rBoden=Math.max(o.rBoden,r);
      if(M.v[i]>.7&&M.v[i]<.75) o.rOben=Math.max(o.rOben,r); } }
  const j=[...d.g3.drape.values()].pop(); o.ms=j&&j.res?j.res.ms:null; o.has=!!(j&&j.res);
  return o; });

// 1) zu lang (112 cm bei 179 cm): liegt auf, staucht sich, keine flachen Lappen
await laenge(112); let F=await form();
await box.screenshot({path:hier+'ausgabe/fall_112.png'});
pruefe(F.ok&&F.has,`Fall gerechnet (${F.ms} ms Rechenzeit), keine ungültigen Werte`);
pruefe(Math.abs(F.minH)<1.2,`Hose reicht bis auf den Boden (tiefster Punkt ${F.minH.toFixed(1)} cm)`);
pruefe(F.saumMax<14,`Saum liegt auf Schuh und Boden (höchster Saumpunkt ${F.saumMax.toFixed(1)} cm, Rist)`);
pruefe(F.rBoden<1.3*F.rOben+1.5,`am Boden nicht weiter als 1,3 × Bein (${F.rBoden.toFixed(1)} cm, Bein ${F.rOben.toFixed(1)} cm): keine Lappen`);

// 2) passende Länge (98 cm): hängt frei über dem Boden
await laenge(98); F=await form();
pruefe(F.ok&&F.has&&F.saumMin>.4&&F.saumMin<8,`kürzere Hose hängt frei: Saum ${F.saumMin.toFixed(1)}–${F.saumMax.toFixed(1)} cm über dem Boden`);

// 3) in Stücken gerechnet = am Stück gerechnet
const st=await p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key]; d.g3.drape.clear();
  const a=d.drapeFor(G,170,4); let n=1, r=a; while(!r&&n<2000){ r=d.drapeFor(G,170,4); n++; }
  d.g3.drape.clear(); const s=d.drapeFor(G,170);
  let diff=0; for(let k=0;k<s.D.length;k++) diff=Math.max(diff,Math.abs(s.D[k]-r.D[k]));
  return {erst:a,n,diff,ms:s.ms}; });
pruefe(st.erst===null&&st.n>3&&st.diff<1e-4,`in ${st.n} Stücken gerechnet wie am Stück (größte Abweichung ${st.diff.toExponential(1)} cm, am Stück ${st.ms} ms)`);

// 4) ausschaltbar
const aus=await p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key]; d.PASSFORM.fall=false; const r=d.drapeFor(G,179); d.PASSFORM.fall=true; return r; });
pruefe(aus===null,'PASSFORM.fall=false: kein Fall');

pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
