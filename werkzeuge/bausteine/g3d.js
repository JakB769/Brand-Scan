/* ---------- 3D-Hose: aus den Maßen aufgeblasen, live am Skelett ---------- */
const K3=12, BAND3=16;                         // Punkte je Viertelbogen, Übergang Schritt→Bein in cm
const g3={c:null,gl:null,ok:null,prog:null,loc:null,tex:null,texKey:null,texReady:false,
          key:null,nv:0,ni:0,pos:null,nor:null,vb:null,nb:null,row:{},last:0};
const VS3=`attribute vec3 p;attribute vec3 n;attribute vec2 uv;attribute float ao;
uniform vec2 vp;varying vec3 vn;varying vec2 vu;varying float va;
void main(){vn=n;vu=uv;va=ao;gl_Position=vec4(p.x/vp.x*2.-1.,1.-p.y/vp.y*2.,clamp(p.z/vp.x,-.95,.95),1.);}`;
const FS3=`precision mediump float;uniform sampler2D t;uniform vec3 tint;varying vec3 vn;varying vec2 vu;varying float va;
void main(){vec3 n=normalize(vn);if(n.z>.12)discard;
float d=max(dot(n,normalize(vec3(-.28,-.5,-.82))),0.);
float rim=smoothstep(.12,-.35,n.z);
vec3 c=texture2D(t,vu).rgb*tint*(.5+.62*d)*va*mix(.72,1.,rim);
gl_FragColor=vec4(c,1.);}`;
function init3d(){
  if(g3.ok!==null) return g3.ok;
  try{
    g3.c=document.createElement("canvas");
    const o={alpha:true,premultipliedAlpha:true,antialias:true,depth:true};
    const gl=g3.c.getContext("webgl2",o)||g3.c.getContext("webgl",o);
    if(!gl){ g3.ok=false; return false; }
    g3.v2=(typeof WebGL2RenderingContext!=="undefined")&&(gl instanceof WebGL2RenderingContext);
    const sh=(ty,src)=>{ const s=gl.createShader(ty); gl.shaderSource(s,src); gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr=gl.createProgram();
    gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS3)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS3));
    gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    g3.gl=gl; g3.prog=pr;
    g3.loc={p:gl.getAttribLocation(pr,"p"),n:gl.getAttribLocation(pr,"n"),uv:gl.getAttribLocation(pr,"uv"),
            ao:gl.getAttribLocation(pr,"ao"),vp:gl.getUniformLocation(pr,"vp"),tint:gl.getUniformLocation(pr,"tint"),
            t:gl.getUniformLocation(pr,"t")};
    g3.ok=true;
  }catch(e){ console.warn("3D nicht verfügbar",e); g3.ok=false; }
  return g3.ok;
}
/* Feste Teile des Netzes: Dreiecke, Texturkoordinaten, Schattierung zwischen den Beinen */
function mesh3d(key,M){
  if(g3.key===key) return;
  const gl=g3.gl, NR=M.nr, C=K3+1, ic=M.v.findIndex(v=>v>=M.vc);
  const nRing=2*NR*2*C, nWall=2*NR*2;
  const nv=nRing+nWall, uv=new Float32Array(nv*2), ao=new Float32Array(nv), idx=[];
  const id=(s,i,f,j)=>((s*NR+i)*2+f)*C+j, wid=(s,i,f)=>nRing+(s*NR+i)*2+f;
  for(let s=0;s<2;s++) for(let i=0;i<NR;i++){
    // s=0 ist das linke Bein der Person: im Frontfoto rechts, im Rückenfoto links
    const F=M.f[i], B=M.b[i];
    const fr=s===0?[F[2],F[3]]:[F[1],F[0]], bk=s===0?[B[1],B[0]]:[B[2],B[3]];
    const below=i>=ic, dcm=below?(M.v[i]-M.vc):0;
    for(let f=0;f<2;f++) for(let j=0;j<C;j++){
      const t=j/K3, e=f?bk:fr, k=id(s,i,f,j);
      uv[k*2]=e[0]+(e[1]-e[0])*t; uv[k*2+1]=M.tv[i];
      // innen am Oberschenkel etwas dunkler, am Bund ein Hauch Schatten
      ao[k]=(below?1-.22*Math.max(0,1-t/.3)*Math.min(1,dcm*14):1)*(i<1?.9:1);
    }
    for(let f=0;f<2;f++){ const k=wid(s,i,f); uv[k*2]=fr[0]; uv[k*2+1]=M.tv[i]; ao[k]=.62; }
    if(i<NR-1){
      for(let f=0;f<2;f++) for(let j=0;j<K3;j++){
        const a=id(s,i,f,j),b=id(s,i,f,j+1),c=id(s,i+1,f,j+1),d=id(s,i+1,f,j);
        idx.push(a,b,c,a,c,d);
      }
      if(below){ const a=wid(s,i,0),b=wid(s,i,1),c=wid(s,i+1,1),d=wid(s,i+1,0); idx.push(a,b,c,a,c,d); }
    }
  }
  g3.key=key; g3.nv=nv; g3.nRing=nRing; g3.ic=ic; g3.ni=idx.length;
  g3.pos=new Float32Array(nv*3); g3.nor=new Float32Array(nv*3);
  const buf=(data,loc,size)=>{ const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW); return b; };
  g3.ub=buf(uv); g3.ab=buf(ao);
  g3.vb=gl.createBuffer(); g3.nb=gl.createBuffer();
  g3.ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g3.ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
  g3.row={};
  // Textur
  g3.texReady=false;
  const im=new Image();
  im.onload=()=>{
    const tx=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tx);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,im);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    if(g3.v2){ gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    g3.tex=tx; g3.texReady=true;
  };
  im.src=M.atlas;
}
const v3={
  sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k], dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len:a=>Math.hypot(a[0],a[1],a[2]),
  norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
};
/* Punkt auf der Kette Hüfte→Knie→Knöchel, über beide Enden hinaus geradeaus weiter */
function walk3(ch,d){
  let acc=0;
  for(let i=0;i<ch.length-1;i++){
    const a=ch[i],b=ch[i+1],L=v3.len(v3.sub(b,a))||1e-6;
    if(d<acc+L||i===ch.length-2){ const t=(d-acc)/L; return v3.add(a,v3.mul(v3.sub(b,a),t)); }
    acc+=L;
  }
  return ch[0];
}
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
/* Alle Punkte der Hose für dieses Bild berechnen */
function pose3d(M,P){
  const NR=M.nr, C=K3+1, ic=g3.ic, pos=g3.pos, ppc=P.ppc;
  const S=P.cmH*ppc;                                   // Länge der Hose in Bildpunkten
  const h=P.h, up=v3.norm(v3.sub([0,-1,0],v3.mul(h,v3.dot([0,-1,0],h)))), fw=v3.cross(h,up), dn=v3.mul(up,-1);
  const top=v3.add(P.belt,v3.mul(up,.015*S));
  // Leibhöhe: reicht die Hose nicht bis in den Schritt, wird sie leicht gedehnt statt eingeschnitten
  const riseG=M.vc*S, riseB=v3.dot(v3.sub([P.belt[0],P.yCrotch,P.belt[2]],top),dn);
  const rs=clamp(riseB/riseG,1,1.22);
  const cr=v3.add(top,v3.mul(dn,riseG*rs));            // Schrittpunkt der Hose
  const q=.74, ek=Math.PI*(3*(1+q)-Math.sqrt((3+q)*(1+3*q)));
  const ell=hw=>{ const a=4*hw/ek; return [a,a*q]; };
  const now=performance.now(), dt=clamp((now-(g3.last||now))/1000,0,.1); g3.last=now;
  const delta=5*ppc;
  const Rc=M.hw[ic]*S/Math.PI;                         // Radius des Hosenbeins direkt unter dem Schritt
  for(let s=0;s<2;s++){
    const sg=s===0?1:-1, ch=P.bone[s];
    const cl=v3.len(v3.sub(ch[1],ch[0]))+v3.len(v3.sub(ch[2],ch[1]));
    const d0=cl+1*ppc, tau=5*ppc;
    for(let i=0;i<NR;i++){
      const below=i>=ic, hwPx=M.hw[i]*S;
      let cT,a,b,sCm=0;
      if(!below){ cT=v3.add(top,v3.mul(dn,M.v[i]*S*rs)); [a,b]=ell(hwPx); }
      else { const sPx=(M.v[i]-M.vc)*S; sCm=sPx/ppc; cT=v3.add(cr,v3.mul(dn,sPx)); [a,b]=ell(M.hw[ic-1]*S); }
      // Dieselbe Höhe am Bein: so viele Bildpunkte unter dem Hüftgelenk, entlang der Knochen
      let d=v3.dot(v3.sub(cT,ch[0]),dn), cL=null,r=null,fl=null,R=0,wdev=0,wband=below?sstep(0,BAND3,sCm):0;
      const onLeg=d>0;
      if(onLeg){
        if(d>d0) d=d0+tau*(1-Math.exp(-(d-d0)/tau));        // zu lange Beine stauchen sich am Schuh
        const pa=walk3(ch,d-delta), pb=walk3(ch,d+delta);
        cL=v3.mul(v3.add(pa,pb),.5);
        const tg=v3.norm(v3.sub(pb,pa));
        r=v3.norm(v3.sub(h,v3.mul(tg,v3.dot(h,tg)))); fl=v3.cross(tg,r);
        R=below?hwPx/Math.PI:Rc;
        // Steht das Bein, bleibt oben die Beckenform. Hebt oder spreizt es sich, zieht es den Stoff mit.
        const stand=v3.add(ch[0],v3.mul(dn,d));
        wdev=sstep(.15,1,v3.len(v3.sub(cL,stand))/Rc);
        // Stoff schwingt nach: je weiter unten, desto träger folgt er dem Bein
        const key=s*100+i, lag=.11*sstep(0,70,sCm), st=g3.row[key];
        if(st&&lag>0&&dt>0){ const k=1-Math.exp(-dt/lag);
          for(let c=0;c<3;c++) st[c]+=(cL[c]-st[c])*k; cL=[st[0],st[1],st[2]]; }
        else g3.row[key]=[cL[0],cL[1],cL[2]];
      }
      for(let f=0;f<2;f++){ const fs=f?-1:1;
        for(let j=0;j<C;j++){
          const t=j/K3, k=(((s*NR+i)*2+f)*C+j)*3;
          const ps=Math.PI/2*t, ca=a*Math.sin(ps)*sg, cb=b*Math.cos(ps)*fs;
          let x=cT[0]+h[0]*ca+fw[0]*cb, y=cT[1]+h[1]*ca+fw[1]*cb, z=cT[2]+h[2]*ca+fw[2]*cb;
          if(onLeg){
            const wL=Math.max(wband,wdev*sstep(0,.45,t));
            if(wL>0){
              const ph=Math.PI*t, cr_=-Math.cos(ph)*sg*R, cf=Math.sin(ph)*fs*R;
              x+=(cL[0]+r[0]*cr_+fl[0]*cf-x)*wL; y+=(cL[1]+r[1]*cr_+fl[1]*cf-y)*wL; z+=(cL[2]+r[2]*cr_+fl[2]*cf-z)*wL;
            }
          }
          pos[k]=x; pos[k+1]=y; pos[k+2]=z;
        }
        const w=(g3.nRing+(s*NR+i)*2+f)*3, src=(((s*NR+i)*2+f)*C)*3;
        pos[w]=pos[src]; pos[w+1]=pos[src+1]; pos[w+2]=pos[src+2];
      }
    }
  }
  // Normalen aus den Nachbarn im Raster
  const nor=g3.nor;
  for(let s=0;s<2;s++) for(let i=0;i<NR;i++) for(let f=0;f<2;f++){
    const flip=(s===0)!==(f===1)?1:-1;
    for(let j=0;j<C;j++){
      const k=(((s*NR+i)*2+f)*C+j)*3;
      const j0=Math.max(0,j-1), j1=Math.min(K3,j+1), i0=Math.max(0,i-1), i1=Math.min(NR-1,i+1);
      const a=(((s*NR+i)*2+f)*C+j0)*3, b=(((s*NR+i)*2+f)*C+j1)*3;
      const c=(((s*NR+i0)*2+f)*C+j)*3, d=(((s*NR+i1)*2+f)*C+j)*3;
      const tj=[pos[b]-pos[a],pos[b+1]-pos[a+1],pos[b+2]-pos[a+2]];
      const ti=[pos[d]-pos[c],pos[d+1]-pos[c+1],pos[d+2]-pos[c+2]];
      let n=v3.cross(ti,tj); const l=v3.len(n)||1;
      nor[k]=n[0]/l*flip; nor[k+1]=n[1]/l*flip; nor[k+2]=n[2]/l*flip;
    }
    // Innenwand zeigt zum anderen Bein, leicht zur Kamera, damit sie nicht wegfällt
    const sg=s===0?1:-1, w=(g3.nRing+(s*NR+i)*2+f)*3;
    const n=v3.norm([-sg*P.h[0],-sg*P.h[1],-sg*P.h[2]-.35]);
    nor[w]=n[0]; nor[w+1]=n[1]; nor[w+2]=n[2];
  }
  return {top,S,rs};
}
/* Zeichnen: in eine eigene WebGL-Fläche, die dann wie ein Bild aufgelegt wird */
function draw3d(M,P,vw,vh,tint){
  const gl=g3.gl;
  if(g3.c.width!==vw||g3.c.height!==vh){ g3.c.width=vw; g3.c.height=vh; }
  const info=pose3d(M,P);
  gl.viewport(0,0,vw,vh); gl.clearColor(0,0,0,0); gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
  gl.useProgram(g3.prog);
  const at=(b,loc,size,data)=>{ if(loc<0) return; gl.bindBuffer(gl.ARRAY_BUFFER,b);
    if(data) gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0); };
  at(g3.vb,g3.loc.p,3,g3.pos); at(g3.nb,g3.loc.n,3,g3.nor); at(g3.ub,g3.loc.uv,2); at(g3.ab,g3.loc.ao,1);
  gl.uniform2f(g3.loc.vp,vw,vh); gl.uniform3f(g3.loc.tint,tint[0],tint[1],tint[2]);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,g3.tex); gl.uniform1i(g3.loc.t,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g3.ib);
  gl.drawElements(gl.TRIANGLES,g3.ni,gl.UNSIGNED_SHORT,0);
  return info;
}
/* Blickrichtung des Beckens aus Hüfte und Schultern; geglättet, mit Ruhezone bei frontalem Stand */
function pelvisDir(P3){
  const hx=P3.hip[0][0]-P3.hip[1][0], hz=P3.hip[0][2]-P3.hip[1][2];
  const sx=P3.sh[0][0]-P3.sh[1][0],  sz=P3.sh[0][2]-P3.sh[1][2];
  const nh=Math.hypot(hx,hz)||1, ns=Math.hypot(sx,sz)||1;
  let cx=hx/nh+(P3.shOk?sx/ns:hx/nh), cz=hz/nh+(P3.shOk?sz/ns:hz/nh);
  const n=Math.hypot(cx,cz)||1; cx/=n; cz/=n;
  cx=emaV("yawC",cx); cz=emaV("yawS",cz);
  let yaw=Math.atan2(cz,cx);
  const ay=Math.abs(yaw), dead=sstep(.07,.26,Math.min(ay,Math.PI-ay));
  yaw=ay<Math.PI/2?yaw*dead:Math.sign(yaw)*(Math.PI-(Math.PI-ay)*dead);
  const d2=Math.hypot(P3.hip[0][0]-P3.hip[1][0],P3.hip[0][1]-P3.hip[1][1])||1;
  const tilt=clamp((P3.hip[0][1]-P3.hip[1][1])/d2,-.35,.35)*Math.abs(Math.cos(yaw));
  return {h:v3.norm([Math.cos(yaw),tilt,Math.sin(yaw)]),yaw};
}
