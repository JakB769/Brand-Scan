// Misst die Freistellung (segGarment aus app/index.html) auf typischen Untergründen.
// Vergleich mit der richtigen Maske: Überdeckung (IoU) und Breite des Hosenbeins am Saum.
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url));
const dir=hier+'../../material/testbilder/freistellung/';
const app=fs.readFileSync(hier+'../../app/index.html','utf8');
const fn=n=>{ const a=app.indexOf('function '+n+'('); let d=0,i=app.indexOf('{',a); for(;;i++){ if(app[i]==='{')d++; if(app[i]==='}'&&--d===0) return app.slice(a,i+1); } };
const helfer=app.match(/^const clamp=.*$/m)[0];
const code=[helfer,...['morph','kmeans','boxBlur','segBright','segColor','finishMask','segGarment'].map(fn)].join('\n');
fs.mkdirSync(hier+'ausgabe',{recursive:true});
const b=await chromium.launch(); const p=await b.newPage(); p.on('console',m=>console.log('  ',m.text()));
await p.setContent('<html><body></body></html>');
await p.addScriptTag({content:code+'\nwindow.segGarment=segGarment;'});
const bild=pfad=>'data:image/'+(pfad.endsWith('png')?'png':'jpeg')+';base64,'+fs.readFileSync(pfad).toString('base64');
const faelle=[['weiss (Original)',hier+'../../material/produktfotos/front.jpg'],...['parkett','teppich','bettdecke','dunkel','fliesen'].map(n=>[n,dir+n+'.jpg'])];
let schlecht=0;
for(const [name,pfad] of faelle){
  const r=await p.evaluate(async([src,wahr])=>{
    const ld=s=>new Promise(ok=>{const i=new Image(); i.onload=()=>ok(i); i.src=s;});
    const im=await ld(src), wm=await ld(wahr);
    const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; c.getContext('2d',{willReadFrequently:true}).drawImage(im,0,0);
    const t=document.createElement('canvas'); t.width=im.width; t.height=im.height; const tx=t.getContext('2d'); tx.drawImage(wm,0,0);
    const td=tx.getImageData(0,0,t.width,t.height).data;
    let S; const t0=performance.now();
    try{ S=segGarment(c); }catch(e){ return {fehler:e.message}; }
    const ms=performance.now()-t0;
    let i=0,u=0; for(let k=0;k<S.w*S.h;k++){ const a=S.m[k], w=td[k*4]>128; if(a&&w)i++; if(a||w)u++; }
    // Breite am Saum (95 % der Höhe) und am Bund
    const brt=(m,y,w)=>{ let lo=-1,hi=-1; for(let x=0;x<w;x++) if(m(x,y)){ if(lo<0)lo=x; hi=x; } return hi-lo; };
    const wy=f=>{ let t0=-1,b0=-1; for(let y=0;y<S.h;y++) for(let x=0;x<S.w;x+=2) if(td[(y*S.w+x)*4]>128){ if(t0<0)t0=y; b0=y; } return Math.round(t0+(b0-t0)*f); };
    const saum=wy(.95), bund=wy(.03);
    const ist=(x,y)=>S.m[y*S.w+x], soll=(x,y)=>td[(y*S.w+x)*4]>128;
    // Maske als Bild zurückgeben
    const o=document.createElement('canvas'); o.width=S.w; o.height=S.h; const ox=o.getContext('2d'); ox.drawImage(im,0,0);
    const od=ox.getImageData(0,0,S.w,S.h); for(let k=0;k<S.w*S.h;k++){ const a=S.m[k],w=td[k*4]>128; if(a&&!w){od.data[k*4]=255;od.data[k*4+1]=0;od.data[k*4+2]=0;} else if(!a&&w){od.data[k*4]=255;od.data[k*4+1]=230;od.data[k*4+2]=0;} }
    ox.putImageData(od,0,0);
    return {iou:i/u, saum:brt(ist,saum,S.w)/brt(soll,saum,S.w), bund:brt(ist,bund,S.w)/brt(soll,bund,S.w), ms, png:o.toDataURL()};
  },[bild(pfad),bild(dir+'wahrheit.png')]);
  if(r.fehler){ console.log(name.padEnd(18),'FEHLER:',r.fehler); schlecht++; continue; }
  fs.writeFileSync(hier+'ausgabe/frei_'+name.split(' ')[0]+'.png',Buffer.from(r.png.split(',')[1],'base64'));
  const ok=r.iou>.95&&Math.abs(r.saum-1)<.04&&Math.abs(r.bund-1)<.04; if(!ok) schlecht++;
  console.log(name.padEnd(18),'IoU',(r.iou*100).toFixed(1)+' %','Bund',(r.bund*100).toFixed(0)+' %','Saum',(r.saum*100).toFixed(0)+' %',Math.round(r.ms)+' ms',ok?'':'  ← schlecht');
}
await b.close();
console.log(schlecht?`FEHLER: ${schlecht} Untergründe nicht sauber freigestellt`:'Freistellung auf allen Untergründen sauber');
if(schlecht) process.exit(1);
