/* ---------- Blickrichtung: wohin zeigt die Vorderseite der Person? ---------- */
/* Betrag der Drehung aus der sichtbaren Schulter- und Hüftbreite, die Richtung aus Füßen, Nase und Tiefe.
   So hängt nichts allein an der unruhigen Tiefenschätzung. */
const fc={yaw:0,ks:36,kh:18,sgn:1,pend:0,t:0};
const wrapA=a=>{ while(a>Math.PI) a-=2*Math.PI; while(a<-Math.PI) a+=2*Math.PI; return a; };
function facing(L,V,vw,ppc){
  const X=i=>L[i].x*vw, shOk=V(11)&&V(12), hipOk=V(23)&&V(24);
  let c=null;
  if(shOk){ const r=(X(11)-X(12))/ppc; fc.ks=clamp(Math.max(fc.ks*.9997,Math.abs(r)),28,50); c=clamp(r/fc.ks,-1,1); }
  if(hipOk){ const r=(X(23)-X(24))/ppc; fc.kh=clamp(Math.max(fc.kh*.9997,Math.abs(r)),13,27);
    const ch=clamp(r/fc.kh,-1,1); c=c==null?ch:.65*c+.35*ch; }
  const now=performance.now(), dt=clamp((now-(fc.t||now))/1000,0,.1); fc.t=now;
  if(c==null) return fc.yaw;
  let e=0,w=0;
  const foot=(h,t)=>{ if(V(h)&&V(t)){ e+=clamp((X(t)-X(h))/(17*ppc),-1,1)*1.3; w+=1.3; } };
  foot(29,31); foot(30,32);
  if(shOk&&(L[0].visibility??1)>.6&&c>.1){ e+=clamp((X(0)-(X(11)+X(12))/2)/(9*ppc),-1,1)*.8; w+=.8; }
  const dz=((L[23].z||0)-(L[24].z||0))+(shOk?(L[11].z||0)-(L[12].z||0):0);
  e+=clamp(dz*vw/(45*ppc),-1,1)*.5; w+=.5;
  const es=e/w;
  if(es>.12) fc.sgn=1; else if(es<-.12) fc.sgn=-1;
  let m=Math.atan2(fc.sgn*Math.sqrt(1-c*c),c);
  // Ruhezone: steht jemand fast frontal oder fast mit dem Rücken, bleibt die Hose gerade
  const am=Math.abs(m);
  if(am<Math.PI/2) m*=sstep(.15,.5,am); else m=Math.sign(m||1)*(Math.PI-(Math.PI-am)*sstep(.15,.5,Math.PI-am));
  let d=wrapA(m-fc.yaw);
  // Ein Sprung um fast eine halbe Drehung ist meist eine Verwechslung von links und rechts: erst glauben, wenn er anhält
  if(Math.abs(d)>2.2){ if(!fc.pend) fc.pend=now; if(now-fc.pend<350) d=0; } else fc.pend=0;
  const step=clamp(d*(1-Math.exp(-dt/.09)),-8*dt,8*dt);
  fc.yaw=wrapA(fc.yaw+step);
  return fc.yaw;
}

/* ---------- Eigene Hose: aus zwei Produktfotos direkt im Browser ein 3D-Modell bauen ---------- */
const GEN={CW:320,CH:640,NR:56};
async function fileToCanvas(file,maxH=900){
  let src;
  if(self.createImageBitmap){ try{ src=await createImageBitmap(file); }catch(_){ src=null; } }
  if(!src){ src=await new Promise((ok,no)=>{ const im=new Image(); im.onload=()=>ok(im); im.onerror=()=>no(new Error("Bild nicht lesbar")); im.src=URL.createObjectURL(file); }); }
  const w0=src.width||src.naturalWidth, h0=src.height||src.naturalHeight, k=Math.min(1,maxH/h0);
  const c=document.createElement("canvas"); c.width=Math.max(8,Math.round(w0*k)); c.height=Math.max(8,Math.round(h0*k));
  c.getContext("2d",{willReadFrequently:true}).drawImage(src,0,0,c.width,c.height);
  return c;
}
function morph(m,w,h,erode,n){
  let a=m;
  for(let it=0;it<n;it++){
    const b=new Uint8Array(w*h);
    for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
      const i=y*w+x; let s=a[i]+a[i-1]+a[i+1]+a[i-w]+a[i+w]+a[i-w-1]+a[i-w+1]+a[i+w-1]+a[i+w+1];
      b[i]=erode?(s===9?1:0):(s>0?1:0);
    }
    a=b;
  }
  return a;
}
/* Kleidungsstück vom Hintergrund trennen. Schatten sind hintergrundfarben und nur etwas dunkler: die bleiben draußen. */
function segGarment(cv){
  const w=cv.width,h=cv.height, d=cv.getContext("2d",{willReadFrequently:true}).getImageData(0,0,w,h).data;
  let m=new Uint8Array(w*h), tr=0;
  for(let i=0;i<w*h;i+=7) if(d[i*4+3]<200) tr++;
  if(tr>w*h/7*.04){ for(let i=0;i<w*h;i++) m[i]=d[i*4+3]>128?1:0; }      // schon freigestellt
  else{
    const br=[[],[],[]], push=i=>{ br[0].push(d[i*4]); br[1].push(d[i*4+1]); br[2].push(d[i*4+2]); };
    for(let x=0;x<w;x+=3){ push(x); push(w+x); push((h-1)*w+x); push((h-2)*w+x); }
    for(let y=0;y<h;y+=3){ push(y*w); push(y*w+1); push(y*w+w-1); push(y*w+w-2); }
    const bg=br.map(a=>{ a.sort((p,q)=>p-q); return a[a.length>>1]; });
    const bl=.2126*bg[0]+.7152*bg[1]+.0722*bg[2];
    for(let i=0;i<w*h;i++){
      const r=d[i*4],g2=d[i*4+1],b=d[i*4+2], l=.2126*r+.7152*g2+.0722*b;
      const cd=Math.max(Math.abs((r-l)-(bg[0]-bl)),Math.abs((g2-l)-(bg[1]-bl)),Math.abs((b-l)-(bg[2]-bl)));
      m[i]= bl>140 ? ((l<bl*.63||cd>17)?1:0)
                   : ((Math.max(Math.abs(r-bg[0]),Math.abs(g2-bg[1]),Math.abs(b-bg[2]))>42)?1:0);
    }
  }
  m=morph(morph(m,w,h,true,2),w,h,false,2);
  // größte zusammenhängende Fläche
  const lab=new Int32Array(w*h), st=new Int32Array(w*h); let best=0,bestN=0,cur=0;
  for(let s0=0;s0<w*h;s0++){
    if(!m[s0]||lab[s0]) continue;
    cur++; let n=0,sp=0; st[sp++]=s0; lab[s0]=cur;
    while(sp){ const i=st[--sp]; n++; const x=i%w;
      if(x>0&&m[i-1]&&!lab[i-1]){lab[i-1]=cur;st[sp++]=i-1;} if(x<w-1&&m[i+1]&&!lab[i+1]){lab[i+1]=cur;st[sp++]=i+1;}
      if(i>=w&&m[i-w]&&!lab[i-w]){lab[i-w]=cur;st[sp++]=i-w;} if(i<w*h-w&&m[i+w]&&!lab[i+w]){lab[i+w]=cur;st[sp++]=i+w;} }
    if(n>bestN){ bestN=n; best=cur; }
  }
  if(bestN<w*h*.03||bestN>w*h*.9) throw new Error("Hose nicht klar vom Hintergrund zu trennen. Bitte ein Foto auf hellem, einfarbigem Grund.");
  // Löcher schließen: alles, was vom Rand aus nicht erreichbar ist, gehört zum Teil
  const out=new Uint8Array(w*h); let sp=0;
  const seed=i=>{ if(lab[i]!==best&&!out[i]){ out[i]=1; st[sp++]=i; } };
  for(let x=0;x<w;x++){ seed(x); seed((h-1)*w+x); } for(let y=0;y<h;y++){ seed(y*w); seed(y*w+w-1); }
  while(sp){ const i=st[--sp], x=i%w; if(x>0) seed(i-1); if(x<w-1) seed(i+1); if(i>=w) seed(i-w); if(i<w*h-w) seed(i+w); }
  let x0=w,x1=0,y0=h,y1=0;
  for(let i=0;i<w*h;i++){ m[i]=out[i]?0:1; if(m[i]){ const x=i%w,y=(i/w)|0; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } }
  return {m,w,h,x0,x1:x1+1,y0,y1:y1+1};
}
/* Auf einheitliche Größe zuschneiden, Rand mit Stofffarbe auffüllen, Umriss Zeile für Zeile ablesen */
function cropGarment(cv,S,flip){
  const {CW,CH,NR}=GEN, pad=4;
  const bx=S.x0-pad, by=S.y0-pad, bw=S.x1-S.x0+2*pad, bh=S.y1-S.y0+2*pad;
  const c=document.createElement("canvas"); c.width=CW; c.height=CH;
  const x=c.getContext("2d",{willReadFrequently:true});
  x.fillStyle="#888"; x.fillRect(0,0,CW,CH);
  if(flip){ x.translate(CW,0); x.scale(-1,1); }
  x.drawImage(cv,bx,by,bw,bh,0,0,CW,CH); x.setTransform(1,0,0,1,0,0);
  let mm=new Uint8Array(CW*CH);
  for(let y=0;y<CH;y++){ const sy=Math.min(S.h-1,Math.max(0,Math.round(by+(y+.5)*bh/CH-.5)));
    for(let xx=0;xx<CW;xx++){ const u=flip?CW-1-xx:xx, sx=Math.round(bx+(u+.5)*bw/CW-.5);
      mm[y*CW+xx]=(sx>=0&&sx<S.w)?S.m[sy*S.w+sx]:0; } }
  const core=morph(mm,CW,CH,true,3), id=x.getImageData(0,0,CW,CH), d=id.data;
  let sr=0,sg=0,sb=0,sn=0, lastRow=-1;
  for(let y=0;y<CH;y++){
    let any=false; for(let xx=0;xx<CW;xx++) if(core[y*CW+xx]){ any=true; break; }
    if(!any){ if(lastRow>=0) d.copyWithin(y*CW*4,lastRow*CW*4,(lastRow+1)*CW*4); continue; }
    // links und rechts jeweils die nächste Stofffarbe derselben Zeile
    const near=new Int16Array(CW); let last=-1;
    for(let xx=0;xx<CW;xx++){ if(core[y*CW+xx]) last=xx; near[xx]=last; }
    last=-1;
    for(let xx=CW-1;xx>=0;xx--){ if(core[y*CW+xx]) last=xx;
      if(last>=0&&(near[xx]<0||last-xx<xx-near[xx])) near[xx]=last; }
    for(let xx=0;xx<CW;xx++){ const i=(y*CW+xx)*4, j=(y*CW+near[xx])*4;
      if(near[xx]!==xx){ d[i]=d[j]; d[i+1]=d[j+1]; d[i+2]=d[j+2]; }
      else if((xx&3)===0){ sr+=d[i]; sg+=d[i+1]; sb+=d[i+2]; sn++; } d[i+3]=255; }
    lastRow=y;
  }
  for(let y=0;y<CH;y++){ let any=false; for(let xx=0;xx<CW;xx++) if(core[y*CW+xx]){ any=true; break; }
    if(any){ for(let y2=0;y2<y;y2++) d.copyWithin(y2*CW*4,y*CW*4,(y+1)*CW*4); break; } }
  x.putImageData(id,0,0);
  // Zeilenprofil
  let top=CH,bot=0; for(let y=0;y<CH;y++) for(let xx=0;xx<CW;xx++) if(mm[y*CW+xx]){ if(y<top)top=y; if(y>bot)bot=y; }
  const rows=[];
  for(let i=0;i<NR;i++){
    const y=Math.round(top+(bot-top)*(.004+.985*i/(NR-1))), runs=[]; let s=-1;
    for(let xx=0;xx<=CW;xx++){
      const on=xx<CW&&((mm[Math.max(0,y-1)*CW+xx]+mm[y*CW+xx]+mm[Math.min(CH-1,y+1)*CW+xx])>=2);
      if(on&&s<0) s=xx; if(!on&&s>=0){ if(xx-s>4) runs.push([s,xx-1]); s=-1; }
    }
    if(!runs.length) runs.push([CW*.3,CW*.7]);
    rows.push({y,runs});
  }
  return {c,d,rows,top,bot,sx:bw/CW,sy:bh/CH,base:sn?{r:sr/sn,g:sg/sn,b:sb/sn}:{r:120,g:120,b:120}};
}
function garmentProfile(A,VC,off){
  const {CW,CH,NR}=GEN, H=(A.bot-A.top)*A.sy, arr=[], vv=[], tv=[]; let px=null;
  const lum=(y,x)=>{ let s=0; for(let k=-1;k<=1;k++){ const i=(y*CW+clamp(x+k,0,CW-1))*4; s+=.2126*A.d[i]+.7152*A.d[i+1]+.0722*A.d[i+2]; } return s; };
  for(const R of A.rows){
    const v=(R.y-A.top)/(A.bot-A.top), a=R.runs[0][0], b=R.runs[R.runs.length-1][1]; let li,ri;
    if(R.runs.length>=2&&v>VC-.03){ li=R.runs[0][1]; ri=R.runs[R.runs.length-1][0]; }
    else{ const c=(a+b)/2;
      if(v<VC) li=ri=c;
      else{ const lo=Math.round((px==null?c:px)-7); let bx=lo,bl=1e9;       // dunkle Schattenlinie zwischen den Beinen
        for(let xx=lo;xx<lo+15;xx++){ const l=lum(R.y,xx); if(l<bl){bl=l;bx=xx;} } li=ri=bx; }
      px=(li+ri)/2; }
    arr.push([a,li,ri,b]); vv.push(v); tv.push(R.y/CH);
  }
  for(let pass=0;pass<2;pass++) for(let k=0;k<4;k++){ const col=arr.map(r=>r[k]);
    for(let i=0;i<NR;i++) arr[i][k]=.25*col[Math.max(0,i-1)]+.5*col[i]+.25*col[Math.min(NR-1,i+1)]; }
  const hw=arr.map((r,i)=>(vv[i]<VC?(r[3]-r[0])/2:((r[1]-r[0])+(r[3]-r[2]))/2)*A.sx/H);
  const uv=arr.map((r,i)=>{ const e=vv[i]>VC?1.5:0; return [r[0]+3,r[1]-e,r[2]+e,r[3]-3].map(u=>+((u+off)/(2*CW)).toFixed(4)); });
  return {hw,vv,tv,uv,H};
}
async function buildGarment(frontFile,backFile){
  const {CW,CH,NR}=GEN;
  const fcv=await fileToCanvas(frontFile), F=cropGarment(fcv,segGarment(fcv),false);
  let B;
  if(backFile){ const bcv=await fileToCanvas(backFile); B=cropGarment(bcv,segGarment(bcv),false); }
  else B=cropGarment(fcv,segGarment(fcv),true);            // ohne Rückenfoto: Vorderseite gespiegelt
  let VC=null;
  for(const R of F.rows){ const v=(R.y-F.top)/(F.bot-F.top); if(v>.2&&v<.7&&R.runs.length>=2){ VC=v-.008; break; } }
  const split=VC!=null; if(!split) VC=.39;
  const pf=garmentProfile(F,VC,0), pb=garmentProfile(B,VC,CW);
  for(let i=NR-3;i<NR;i++) pf.hw[i]=pf.hw[NR-4];
  const at=document.createElement("canvas"); at.width=2*CW; at.height=CH;
  const ax=at.getContext("2d"); ax.drawImage(F.c,0,0); ax.drawImage(B.c,CW,0);
  const r4=a=>a.map(x=>+x.toFixed(4));
  const m3={nr:NR,vc:+VC.toFixed(3),wf:+(2*pf.hw[1]).toFixed(4),hw:r4(pf.hw),v:r4(pf.vv),tv:r4(pf.tv),tvb:r4(pb.tv),
            f:pf.uv,b:pb.uv,atlas:at.toDataURL("image/jpeg",.85)};
  const th=document.createElement("canvas"); th.width=120; th.height=240; th.getContext("2d").drawImage(F.c,0,0,120,240);
  const cw=CW*F.sx, hip=2*pf.hw[Math.round(NR*.2)];
  const base={...F.base,lum:.2126*F.base.r+.7152*F.base.g+.0722*F.base.b};
  return {G:{label:"Eigene Hose",size:"–",kind:"pants",aspect:pf.H/cw,
             prof:{bund:{y:.015,w:m3.wf*pf.H/cw,c:.5},huefte:{y:.2,w:hip*pf.H/cw,c:.5}},
             elastic:false,estFlat:40,base,rig:null,src:th.toDataURL("image/jpeg",.8),m3,own:true},
          info:{split,hasBack:!!backFile,outline:F}};
}
function addOwnGarment(G,waist){
  GARMENTS.eigen=G; if(typeof g3!=="undefined"&&g3.key==="eigen") g3.key=null;
  buildPicker(); if(g.key==="eigen") g.key=null;
  pickGarment("eigen",false);
  if(waist){ g.flat=waist; g.est=false; $("g-flat").value=waist; updateFit(); }
}
