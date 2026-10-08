// Prüft, ob die Hose nach unten breiter gezeichnet wird, als sie ist.
// Misst die Breite jedes Hosenbeins am Saum im Bild und vergleicht mit dem Sollwert aus dem Foto.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url));
const fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver|ERR_|Failed to load/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg');
await p.fill('#own-waist','40'); await p.click('#own-go'); await p.waitForTimeout(1500);
await p.click('#quick'); await p.waitForTimeout(3000);
await p.click('#clean'); await p.waitForTimeout(2500);
// Breite eines Beins in cm am Saum und kurz unter dem Schritt, so wie sie im Bild erscheint
const miss=()=>p.evaluate(()=>{
  // Form vor den Stauchfalten (Zustand der Stoffphysik): die Falten am Knöchel beulen den Saum absichtlich etwas aus,
  // geprüft wird hier aber, ob verrauschte Tiefe die Breite verfälscht
  const {g3,cam,GARMENTS,g}=window.__dbg, M=GARMENTS[g.key].m3, C=13, NR=M.nr, pos=g3.cx||g3.pos;
  const vw=1280, vh=720, foc=cam.fk*Math.max(vw,vh), pc=[vw/2,vh/2];
  const cmH=g.flat/M.wf, S=cmH;               // Länge in cm
  const breite=(s,i)=>{ let lo=1e9,hi=-1e9;
    for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const k=(((s*NR+i)*2+f)*C+j)*3; const x=pc[0]+(pos[k]-pc[0])*foc/(foc+pos[k+2]); lo=Math.min(lo,x); hi=Math.max(hi,x); }
    return hi-lo; };
  const ic=g3.ic, i1=Math.min(NR-1,ic+8), i2=NR-1;
  // Bildpunkte je cm aus dem Bund: der liegt genau auf der flachen Bundbreite
  const r=(s,i)=>breite(s,i);
  const soll=i=>2*M.hw[i]*cmH/Math.PI;        // Durchmesser eines Kreises mit Umfang 2·flache Breite
  const ppc=g3.S/cmH;                         // Bildpunkte je cm
  return {oben:[r(0,i1),r(1,i1)].map(v=>v/ppc), saum:[r(0,i2),r(1,i2)].map(v=>v/ppc), sollOben:soll(i1), sollSaum:soll(i2)};
});
const fall=async(name,mode)=>{
  await p.evaluate(m=>Object.assign(window.__mode,{yaw:0,zk:1,zn:0,zr:0,knee:0,wide:0},m),mode); await p.waitForTimeout(1500);
  const r=await miss(); const k=Math.max(...r.saum)/r.sollSaum;
  console.log(name.padEnd(30),'Saum',r.saum.map(v=>v.toFixed(1)).join(' / '),'cm, soll',r.sollSaum.toFixed(1),'→',(k*100).toFixed(0)+' %');
  return k;
};
const ks=[];
ks.push(await fall('Tiefe sauber',{}));
ks.push(await fall('Knöchel scheinbar 0,2 näher',{zn:.2}));
ks.push(await fall('Knöchel scheinbar 0,4 näher',{zn:.4}));
ks.push(await fall('Knöchel scheinbar 0,3 weiter',{zn:-.3}));
ks.push(await fall('Tiefe zittert',{zr:.4}));
await p.screenshot({path:hier+'ausgabe/breite.png'});
const bad=ks.filter(k=>k>1.08||k<.9).length;
console.log(bad?`FEHLER: ${bad} Fälle weichen mehr als 8 % ab`:'Saumbreite stimmt in allen Fällen');
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(bad||errs.length) process.exit(1);
