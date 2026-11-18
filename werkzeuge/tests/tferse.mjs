// Ferse blickdicht (Attrappe): die 3D-Hose allein (WebGL-Fläche) von hinten, schräg hinten, seitlich, beim Gehen und mit
// gehobenem Knie; gezählt werden durchsichtige Pixel, die ganz von Hose umschlossen sind (vom Bildrand aus nicht erreichbar,
// also nicht der Spalt zwischen den Beinen), im unteren Viertel der Hose (Ferse und Saum). Dazu: Stoffbild ohne Boden zwischen den Beinen.
// Bilder nach ausgabe/ferse_*.png (Löcher rot, eingeschlossener Spalt zwischen den Beinen gelb). Aufruf: node tferse.mjs [Testseite]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'node:fs';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/', A=hier+'ausgabe/';
fs.mkdirSync(A,{recursive:true});
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+(process.argv[2]||hier+'testseite-mit-simulierter-person.html')); await p.waitForTimeout(500);
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
await p.click('#quick'); await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:20000});
await p.waitForTimeout(1000); await p.click('#clean').catch(()=>{});
// Gehen als feste Schrittstellung (vorher kneeWave: je nach Zeitpunkt des Bildes kreuzten sich die Beine von der Seite, der
// Spalt zwischen ihnen war ringsum von Hose umschlossen und zählte als Loch)
const posen=[['hinten',{yaw:3.1}],['hinten_schraeg',{yaw:2.4}],['seitlich',{yaw:1.45}],['seitlich_links',{yaw:-1.45}],['hinten_gehen',{yaw:3.1,beugeL:20,knieL:30}],
  ['seitlich_gehen',{yaw:1.45,beugeL:20,knieL:30}],['hinten_knie',{yaw:3.1,beugeL:40,knieL:70}],['seitlich_knie',{yaw:1.45,beugeR:40,knieR:70}]];
for(const [n,m] of posen){
  await p.evaluate(m=>Object.assign(window.__mode,{yaw:0,ohneArme:1,kneeWave:0,beugeL:null,knieL:null,beugeR:null,knieR:null},m),m); await p.waitForTimeout(2600);
  const r=await p.evaluate(()=>{ const c=window.__dbg.g3.c, w=c.width, h=c.height, t=document.createElement('canvas'); t.width=w; t.height=h; const x=t.getContext('2d'); x.drawImage(c,0,0);
    const id=x.getImageData(0,0,w,h), D=id.data, op=i=>D[i*4+3]>128;
    let y0=h,y1=0; for(let i=0;i<w*h;i++) if(op(i)){ const y=(i/w)|0; if(y<y0) y0=y; if(y>y1) y1=y; }
    // vom Rand aus über durchsichtige Pixel fluten; was übrig bleibt, ist ein Loch im Stoff
    const vis=new Uint8Array(w*h), st=[]; const push=i=>{ if(!vis[i]&&!op(i)){ vis[i]=1; st.push(i); } };
    for(let xx=0;xx<w;xx++){ push(xx); push((h-1)*w+xx); } for(let y=0;y<h;y++){ push(y*w); push(y*w+w-1); }
    while(st.length){ const i=st.pop(), xx=i%w; if(xx>0) push(i-1); if(xx<w-1) push(i+1); if(i>=w) push(i-w); if(i<w*(h-1)) push(i+w); }
    // nur das untere Viertel (Ferse, Saum): weiter oben kann der Spalt zwischen zwei sich berührenden Beinen ringsum
    // eingeschlossen sein (schräg von hinten, in der Höhe der Knie), das ist kein Loch im Stoff
    // Dazu je Bein seine Fläche im Bild (19.10.): Netz des Beins wie im Shader projiziert (Vierecke zwischen benachbarten Ringen).
    // Ein Loch zählt nur, wo ein Bein Stoff haben müsste: berühren sich die gestauchten Säume schräg von hinten, ist der Spalt
    // zwischen den Beinen darüber ringsum eingeschlossen, liegt aber auf keinem Bein (dort sieht man zu Recht durch).
    const g3=window.__dbg.g3, ov=document.getElementById('overlay'), vw=ov.width, vh=ov.height, rs=w/vw, NR=g3.nr, C=g3.nRing/(4*NR), P=g3.pos;
    const foc=window.__dbg.cam.fk*Math.max(vw,vh), pc=[vw/2,vh/2];
    const pr=(s,r,f,j)=>{ const k=(((s*NR+r)*2+f)*C+j)*3, kk=foc/Math.max(1,foc+P[k+2]); return [(pc[0]+(P[k]-pc[0])*kk)*rs,(pc[1]+(P[k+1]-pc[1])*kk)*rs]; };
    const tris=[]; const quad=(a,b,c,d)=>{ tris.push([a,b,c],[b,d,c]); };
    for(let s=0;s<2;s++) for(let r=0;r+1<NR;r++){
      for(let f=0;f<2;f++) for(let j=0;j+1<C;j++) quad(pr(s,r,f,j),pr(s,r,f,j+1),pr(s,r+1,f,j),pr(s,r+1,f,j+1));
      for(const j of [0,C-1]) quad(pr(s,r,0,j),pr(s,r,1,j),pr(s,r+1,0,j),pr(s,r+1,1,j)); }      // Nähte zwischen vorderer und hinterer Hälfte
    const inTri=(x,y,[a,b,c])=>{ const d1=(x-b[0])*(a[1]-b[1])-(a[0]-b[0])*(y-b[1]), d2=(x-c[0])*(b[1]-c[1])-(b[0]-c[0])*(y-c[1]), d3=(x-a[0])*(c[1]-a[1])-(c[0]-a[0])*(y-a[1]);
      return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0)); };
    // mit 1,5 Pixeln Abstand zum Rand des Beins (Rasterung, Kantenglättung und Faltenrelief im Shader verschieben die Kante um
    // etwa einen Pixel): ein Loch im Stoff liegt im Bein, nicht auf seiner Kante
    const drin=(x,y)=>tris.some(t=>inTri(x,y,t));
    const imBein=(x,y)=>[[0,0],[1.5,0],[-1.5,0],[0,1.5],[0,-1.5]].every(([dx,dy])=>drin(x+.5+dx,y+.5+dy));
    let loch=0, spalt=0; const ym=y0+.75*(y1-y0);
    for(let i=0;i<w*h;i++) if(!op(i)&&!vis[i]){ const y=(i/w)|0; if(y<ym) continue;
      if(imBein(i%w,y)){ loch++; D[i*4]=255; D[i*4+1]=0; D[i*4+2]=0; D[i*4+3]=255; } else { spalt++; D[i*4]=255; D[i*4+1]=200; D[i*4+2]=0; D[i*4+3]=255; } }
    x.putImageData(id,0,0); const o=document.createElement('canvas'); o.width=w; o.height=h; const ox=o.getContext('2d'); ox.fillStyle='#8ac'; ox.fillRect(0,0,w,h); ox.drawImage(t,0,0);
    return {loch,spalt,png:o.toDataURL('image/png')}; });
  fs.writeFileSync(A+'ferse_'+n+'.png',Buffer.from(r.png.split(',')[1],'base64'));
  pruefe(r.loch<=3,`${n}: keine Löcher an Ferse und Saum (${r.loch} Pixel durchsichtig${r.spalt?`; ${r.spalt} im Spalt zwischen den Beinen, gelb, kein Loch`:''})`);
}
// Stoffbild: zwischen den Beinen kein Hintergrund (Flachfoto der Testhose auf weißem Grund: Spalt muss stofffarben sein)
const sp=await p.evaluate(async()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], im=new Image(); im.src=G.m3.atlas; await im.decode();
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const D=x.getImageData(0,0,c.width,c.height).data, M=G.m3, W=c.width, H=c.height; let hell=0,n=0;
  // Mitte zwischen den Innennähten jeder Beinzeile (uv f/b: [außen links, innen links, innen rechts, außen rechts])
  for(const uv of [M.f,M.b]) uv.forEach((r,i)=>{ if(M.v[i]<M.vc+.05||M.v[i]>.97) return; const u=(r[1]+r[2])/2, y=Math.round(M.tv?M.tv[i]*H:i);
    const xx=Math.round(u*W), k=(Math.min(H-1,Math.max(0,y))*W+xx)*4, l=.3*D[k]+.59*D[k+1]+.11*D[k+2]; n++; if(l>200) hell++; });
  return {hell,n}; });
pruefe(sp.n>0&&sp.hell<=sp.n*.05,`Stoffbild: Spalt zwischen den Beinen stofffarben, nicht weißer Grund (${sp.hell} von ${sp.n} Zeilen hell)`);
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,2).join(' | '):''));
await b.close(); process.exit(fehler?1:0);
