import { chromium } from 'playwright';
const b=await chromium.launch(); const p=await b.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///tmp/claude-0/test.html'); await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{
  // Laden die Freisteller wirklich? Ein stiller Fehler hier zeichnet nichts.
  const srcs=[...document.querySelectorAll('.gbtn img')].map(i=>i.src);
  const load=s=>new Promise(res=>{const im=new Image();
    im.onload=()=>res({ok:true,w:im.naturalWidth,h:im.naturalHeight});
    im.onerror=()=>res({ok:false}); im.src=s;});
  const res=await Promise.all(srcs.map(load));
  // Zeichnen auf eine Testfläche mit den Werten aus dem Nahmodus nachstellen
  const prof={bund:{w:0.590,c:0.497,y:0.015},huefte:{w:0.693}}, aspectG=1.653;
  const vw=1280,vh=720,aspect=vw/vh;
  const refHip=36, hipN=0.40;                       // nah an der Kamera
  const cmPerUnit=refHip/(hipN*aspect), pxPerCm=vw/(aspect*cmPerUnit);
  const Wcm=40.2/prof.bund.w, wPx=Wcm*pxPerCm, hPx=wPx*aspectG;
  const c=document.createElement('canvas'); c.width=vw; c.height=vh;
  const cx2=c.getContext('2d');
  const im=new Image(); await new Promise(r2=>{im.onload=r2; im.src=srcs[1];});
  cx2.drawImage(im, vw*0.5-wPx*prof.bund.c, 0.42*vh-prof.bund.y*hPx, wPx, hPx);
  const d=cx2.getImageData(0,0,vw,vh).data;
  let sichtbar=0; for(let i=3;i<d.length;i+=4*97) if(d[i]>20) sichtbar++;
  return {bilder:res, wPx:Math.round(wPx), hPx:Math.round(hPx), pxPerCm:+pxPerCm.toFixed(2),
          Wcm:+Wcm.toFixed(1), laenge:+(Wcm*aspectG).toFixed(1), sichtbar};
});
console.log('Freisteller geladen:', r.bilder.map(x=>x.ok?`${x.w}x${x.h}`:'FEHLER').join('  '));
console.log(`Maßstab im Nahmodus: ${r.pxPerCm} px/cm`);
console.log(`Jeans: ${r.Wcm} cm breit, ${r.laenge} cm lang → ${r.wPx}x${r.hPx} px gezeichnet`);
console.log(`Sichtbare Bildpunkte auf der Zeichenfläche: ${r.sichtbar} ${r.sichtbar>50?'→ wird dargestellt':'→ LEER'}`);
console.log(errs.length?'FEHLER: '+errs.join(' | '):'keine Seitenfehler');
await b.close();
