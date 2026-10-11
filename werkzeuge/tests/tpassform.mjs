// Passform des 3D-Modells (9.10.): Schritt bei gespreizt fotografierten Beinen, Innenbund mit Etikett aus dem Vorderseitenfoto
// entfernt, kein Boden auf dem Bein, Schritt der Hose am Körper statt am Knie, schlanke Oberschenkel, Gesäß an der richtigen
// Stelle, Sitzhöhe als Parameter (PASSFORM). Fotos: echte Jeans des Nutzers mit Bankkarte (Karteninneres unkenntlich),
// Bershka-Produktfotos (ohne Innenbund). Aufruf: node tpassform.mjs [Testseite]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), tb=hier+'../../material/testbilder/echt/', fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1000,height:950}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+(process.argv[2]||hier+'testseite-mit-simulierter-person.html')); await p.waitForTimeout(400);
await p.fill('#height','179');
const HINTEN='[[729,525],[805,505],[837,626],[761,646]]';     // von Hand gesetzte Kartenecken auf der Rückseite (wie tkarte)
const bau=async(name,front,back,karte)=>{
  await p.setInputFiles('#own-front',front); await p.setInputFiles('#own-back',back?[back]:[]); await p.fill('#own-len','');
  await p.fill('#own-name',name); await p.selectOption('#own-ref',karte?'card':''); await p.click('#own-go');
  for(let t=0;t<300;t++){
    const z=await p.evaluate(()=>({m:document.getElementById('own-msg').textContent,r:!document.getElementById('refDlg').hidden,
      s:!document.getElementById('segDlg').hidden,head:document.getElementById('refHead')?.textContent||''}));
    if(z.r){ await p.waitForTimeout(200); if(/Rückseite/.test(z.head)) await p.evaluate(q=>window.__refDlg.set(JSON.parse(q)),HINTEN); await p.click('#refOk'); continue; }
    if(z.s){ await p.click('#segOk'); continue; }
    if(/Fertig|ließ|klappt nicht|nicht klar|zu klein/.test(z.m)) return z.m;
    await p.waitForTimeout(300);
  }
  return '';
};
// Atlas der gewählten Hose untersuchen: Etikett (hell, farblos) oben auf der Vorderseite; Fremdfarbe auf den Beinen
const atlas=()=>p.evaluate(async()=>{
  const {GARMENTS,g}=window.__dbg, G=GARMENTS[g.key], M=G.m3, im=new Image(); im.src=M.atlas; await im.decode();
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const W=c.width, H=c.height, d=x.getImageData(0,0,W,H).data, ic=M.v.findIndex(v=>v>=M.vc);
  let hell=0;                                                // oberste 7 Zeilen, nur innerhalb der Hose
  for(let r=0;r<7;r++) for(let y=Math.round(M.tv[r]*H);y<Math.round(M.tv[r+1]*H);y++)
    for(let xx=Math.round(M.f[r][0]*W)+3;xx<M.f[r][3]*W-3;xx++){ const i=(y*W+xx)*4;
      const l=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2], s=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]); if(l>210&&s<32) hell++; }
  const B=G.base, c1=B.r-B.g, c2=(B.r+B.g)/2-B.b; let fremd=0, n=0;
  for(let r=ic;r<M.nr;r++){ const y=Math.round(M.tv[r]*H), f=M.f[r];
    for(const [u0,u1] of [[f[0],f[1]],[f[2],f[3]]]) for(let xx=Math.round(u0*W)+2;xx<u1*W-2;xx++){ const i=(y*W+xx)*4; n++;
      if(Math.hypot(d[i]-d[i+1]-c1,(d[i]+d[i+1])/2-d[i+2]-c2)>50) fremd++; } }
  return {hell,fremd:fremd/Math.max(1,n),vc:M.vc,innen:!!M.innen};
});
// 3D-Ansicht (Puppe in 179 cm): Kennwerte aus pose3d und die Lage der Punkte
const form=async()=>{ await (await p.$('#g3dview')).scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
  return p.evaluate(()=>{ const {g3,GARMENTS,g}=window.__dbg, M=(g3.M||GARMENTS[g.key].m3), NR=M.nr, C=13, ic=g3.ic, pos=g3.pos, F=g3.frame, ppc=g3.lastPpc;
    const P=k=>[pos[k*3]-F.top[0],pos[k*3+1]-F.top[1],pos[k*3+2]-F.top[2]], dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const id=(s,i,f,j)=>((s*NR+i)*2+f)*C+j;
    // Gesäß: Zeile über dem Schritt, in der die Rückseite am weitesten nach hinten reicht
    let best=-1e9, seat=0; for(let i=0;i<ic;i++) for(let j=0;j<C;j++){ const q=P(id(0,i,1,j)), z=-dot(q,F.fw); if(z>best){ best=z; seat=dot(q,F.up)*-1/ppc; } }
    // Oberschenkel 8 cm unter dem Schritt: Breite des Beins (seitlich) gegen die flache Breite
    const cr=M.vc, leg=[];
    for(let i=ic;i<NR;i++){ let lo=1e9,hi=-1e9, y=0; for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const q=P(id(0,i,f,j)), u=dot(q,F.h); lo=Math.min(lo,u); hi=Math.max(hi,u); y+=-dot(q,F.up)/ppc/(2*C); }
      leg.push({i,y,w:(hi-lo)/(M.hw[i]*g3.S)}); }
    let nan=false; for(let k=0;k<g3.nv*3;k++) if(!isFinite(pos[k])){ nan=true; break; }
    return {...g3.form,seat,leg,nan,top:F.top[1],ppc,len:g3.lastLen/ppc}; }); };

// 1) Echte Jeans (Beine im Foto gespreizt, Innenbund mit Etikett sichtbar)
const m1=await bau('Echt',tb+'karte_vorne_IMG_7267.jpg',tb+'karte_hinten_IMG_7268.jpg',true);
pruefe(/Fertig/.test(m1),'echte Jeans erstellt: '+m1.slice(0,90));
const a1=await atlas();
pruefe(a1.vc<=.40,`Schritt bei gespreizten Beinen bei ${a1.vc} (sichtbarer Spalt erst bei 0,48)`);
pruefe(a1.innen,'Innenbund über dem vorderen Bund erkannt');
pruefe(a1.hell<40,`Etikett nicht mehr im Stoffbild (helle Punkte oben: ${a1.hell}, vorher 169)`);
pruefe(a1.fremd<.002,`kein Boden auf den Beinen (fremde Farbe: ${(a1.fremd*100).toFixed(2)} %, vorher 0,86 %)`);
const f1=await form();
pruefe(!f1.nan,'keine ungültigen Werte im Netz');
const L1=+(m1.match(/Länge (\d+) cm/)||[])[1];
pruefe(Math.abs(f1.len-L1)<=1,`Hose vom Bund bis zum Saum ${f1.len.toFixed(1)} cm lang wie gemessen (${L1} cm), obwohl die Leibhöhe kürzer ist`);
pruefe(f1.leib<f1.flach*.8,`Leibhöhe am Körper ${f1.leib.toFixed(1)} cm statt flach ${f1.flach.toFixed(1)} cm senkrecht`);
pruefe(f1.leib>=f1.koerper-.5&&f1.leib-f1.koerper<=12,`Schritt der Hose ${(f1.leib-f1.koerper).toFixed(1)} cm unter dem Körperschritt (höchstens 12)`);
pruefe(f1.seat>=6&&f1.seat<=20,`Gesäß ${f1.seat.toFixed(1)} cm unter dem Bund (6–20 cm, vorher etwa 35)`);
const th=f1.leg.find(l=>l.y-f1.leib>=8);
pruefe(th&&th.w<.8,`Oberschenkel 8 cm unter dem Schritt: ${th&&(th.w*100).toFixed(0)} % der flachen Breite (rund wären 64 %, höchstens 80 %)`);
// Sitzhöhe ist ein Parameter: 2 cm tiefer → ganze Hose 2 cm tiefer
const s0=f1.top; await p.evaluate(()=>{ window.__dbg.PASSFORM.sitzCm-=2; });
const f2=await form(); await p.evaluate(()=>{ window.__dbg.PASSFORM.sitzCm+=2; });
pruefe(Math.abs((f2.top-s0)/f2.ppc-2)<.05,`PASSFORM.sitzCm wirkt: ${((f2.top-s0)/f2.ppc).toFixed(2)} cm tiefer`);

// 2) Bershka-Produktfotos: kein Innenbund zu sehen, also wird nichts weggeschnitten
const m2=await bau('Bershka',fotos+'front.jpg',fotos+'back.jpg',false);
pruefe(/Fertig/.test(m2),'Bershka-Jeans erstellt');
const a2=await atlas();
pruefe(!a2.innen,'Bershka: kein Innenbund erkannt (keiner zu sehen)');
pruefe(a2.fremd<.002,`Bershka: kein Hintergrund auf den Beinen (${(a2.fremd*100).toFixed(2)} %)`);
const f3=await form();
pruefe(!f3.nan&&f3.seat>=6&&f3.seat<=20,`Bershka: Gesäß ${f3.seat.toFixed(1)} cm unter dem Bund`);
pruefe(f3.leib-f3.koerper<=12,`Bershka: Schritt ${(f3.leib-f3.koerper).toFixed(1)} cm unter dem Körperschritt`);
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(fehler||errs.length) process.exit(1);
