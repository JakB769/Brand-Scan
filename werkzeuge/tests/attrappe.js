window.__mode={yaw:0,knee:0,wide:0,sway:0,hand:0};
(function(){
  const mc=document.createElement('canvas'); mc.width=256; mc.height=144; const mx=mc.getContext('2d',{willReadFrequently:true});
  function pose(){
    const md=window.__mode, t=performance.now()/1000;
    const A=1280/720, ph=.8, top=.1, cmN=ph/180;            // 1 cm in Höhen-Einheiten
    const yaw=md.yaw, c=Math.cos(yaw), s=Math.sin(yaw), cx=.5+(md.sway?Math.sin(t*2.2)*.03:0);
    // zoom: Person kommt näher (Nahphase); um die Hüfte (95 cm hoch) vergrößert, Hüfte bei hueftY im Bild
    const zm=md.zoom||1, hy0=top+ph-95*cmN, ty=zm!==1?(md.hueftY??.42):hy0;
    // roll: ganze Person um die Hüfte in der Bildebene gedreht (Neigung, Handstand), shift: seitlich versetzt (schneller Sprung)
    const rc=Math.cos(md.roll||0), rs=Math.sin(md.roll||0), sx=md.shift||0;
    const P=(lat,hgt,fwd=0)=>{ let x=cx+(lat*c+fwd*s)*cmN/A*zm, y=ty+(top+ph-hgt*cmN-hy0)*zm;
      if(md.roll){ const dx=(x-cx)*A, dy=y-ty; x=cx+(dx*rc-dy*rs)/A; y=ty+(dx*rs+dy*rc); }
      return {x:x+sx, y, z:(md.zk==null?1:md.zk)*(lat*s-fwd*c)*cmN/A*zm, visibility:1}; };
    const L=Array.from({length:33},()=>({x:cx,y:.5,z:0,visibility:1}));
    L[0]=P(0,170,8);
    L[11]=P(20,148); L[12]=P(-20,148); L[13]=P(26,118); L[14]=P(-26,118); L[15]=P(30,92); L[16]=P(-30,92);
    // Hände (17–22) an den Handgelenken wie bei MediaPipe; hand:1 legt die linke Hand vor den Oberschenkel
    L[17]=P(31,84,1); L[19]=P(30,83,3); L[21]=P(30,86,2); L[18]=P(-31,84,1); L[20]=P(-30,83,3); L[22]=P(-30,86,2);
    if(md.hand){ L[13]=P(25,116,8); L[15]=P(14,90,16); L[17]=P(9,84,17); L[19]=P(7,83,18); L[21]=P(10,86,17); }
    // armHoch: linker Arm über den Kopf gestreckt
    if(md.armHoch){ L[13]=P(24,170); L[15]=P(22,188); L[17]=P(22,193); L[19]=P(21,194); L[21]=P(23,192); }
    L[23]=P(9,95); L[24]=P(-9,95);
    const kl=md.knee?P(11,95-20,36):P(9+md.wide*14,50), al=md.knee?P(10,95-58,22):P(9+md.wide*30,8);
    L[25]=kl; L[27]=al; L[26]=P(-9-md.wide*14,50); L[28]=P(-9-md.wide*30,8);
    // zn: Tiefenfehler wie bei echter Pose-Erkennung (Knie und Knöchel scheinbar näher an der Kamera), zr: zusätzlich zittern
    if(md.zn||md.zr){ for(const [i,k] of [[25,.5],[26,.5],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1]]){
      L[i]={...L[i],z:L[i].z-(md.zn||0)*k+(md.zr||0)*(Math.random()-.5)}; } }
    L[29]=P(9+md.wide*30,3,-4); L[30]=P(-9-md.wide*30,3,-4); L[31]=P(9+md.wide*30,2,14); L[32]=P(-9-md.wide*30,2,14);
    // Gelenke außerhalb des Bildes wie bei MediaPipe: Lage geraten, Sicherheit gering (rand:'raten'),
    // oder an den unteren Bildrand geklebt mit mittlerer Sicherheit (rand:'kleben')
    for(let i=0;i<33;i++){ const q=L[i]; if(q.y<=1) continue;
      L[i]=md.rand==='kleben'?{...q,y:.97+Math.random()*.02,visibility:.55}:{...q,visibility:.08}; }
    // Silhouette
    mx.fillStyle='#000'; mx.fillRect(0,0,256,144); mx.strokeStyle='#fff'; mx.fillStyle='#fff'; mx.lineCap='round';
    const X=p=>p.x*256, Y=p=>p.y*144, W=cm=>cm*cmN*144*(md.zoom||1);
    const seg=(a,b,w)=>{ mx.lineWidth=W(w); mx.beginPath(); mx.moveTo(X(a),Y(a)); mx.lineTo(X(b),Y(b)); mx.stroke(); };
    const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
    const tw=Math.max(.55,Math.abs(c));
    seg(mid(L[11],L[12]),mid(L[23],L[24]),36*tw); seg(P(0,165),P(0,175),18);
    seg(L[23],L[25],17); seg(L[25],L[27],12); seg(L[24],L[26],17); seg(L[26],L[28],12);
    seg(L[27],P(9+md.wide*30,0),10); seg(L[28],P(-9-md.wide*30,0),10);
    seg(L[15],mid(L[17],L[19]),9); seg(L[16],mid(L[18],L[20]),9); seg(L[11],L[13],9); seg(L[13],L[15],8); seg(L[12],L[14],9); seg(L[14],L[16],8);
    // gegenstand: etwas Hohes im Hintergrund, das die Erkennung fälschlich zur Person zählt (fast vom oberen bis zum unteren Rand)
    if(md.gegenstand) mx.fillRect(8,6,14,130);
    const d=mx.getImageData(0,0,256,144).data, f=new Float32Array(256*144);
    for(let i=0;i<f.length;i++) f[i]=d[i*4]/255;
    return {landmarks:[L],segmentationMasks:[{getAsFloat32Array:()=>f,width:256,height:144}],close(){}};
  }
  window.__mc=mc; window.__stub={FilesetResolver:{forVisionTasks:async()=>({})},
    PoseLandmarker:{createFromOptions:async()=>({detectForVideo:()=>pose()})}};
})();
