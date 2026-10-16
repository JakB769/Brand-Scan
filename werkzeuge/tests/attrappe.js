window.__mode={yaw:0,knee:0,wide:0,sway:0,hand:0,kneeWave:0};
(function(){
  const mc=document.createElement('canvas'); mc.width=256; mc.height=144; const mx=mc.getContext('2d',{willReadFrequently:true});
  function pose(){
    const md=window.__mode, t=performance.now()/1000;
    const A=1280/720, ph=.8, top=.1, cmN=ph/180;            // 1 cm in Höhen-Einheiten
    const yaw=md.yaw, c=Math.cos(yaw), s=Math.sin(yaw), cx=.5+(md.sway?Math.sin(t*2.2)*.03:0);
    // zoom: Person kommt näher (Nahphase); um die Hüfte (95 cm hoch) vergrößert, Hüfte bei hueftY im Bild
    const zm=md.zoom||1, hy0=top+ph-95*cmN, ty=zm!==1?(md.hueftY??.42):hy0;
    // roll: ganze Person um die Hüfte in der Bildebene gedreht (Neigung, Handstand), shift: seitlich versetzt (schneller Sprung)
    const rc=Math.cos(md.roll||0), rs=Math.sin(md.roll||0), sx=(md.shift||0)+(md.zappel?(Math.floor(t*30)%2?md.zappel:-md.zappel):0);   // zappel: Erkennung springt jedes Bild hin und her
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
    // ohneArme: Arme nicht erkannt (Seitenansicht ohne Ausschnitt für den Arm, der im Testbild fehlt)
    if(md.ohneArme) for(let i=13;i<=22;i++) L[i]={...L[i],visibility:0};
    L[23]=P(9,95); L[24]=P(-9,95);
    // kneeWave: linkes Knie hebt und senkt sich laufend (Periode in s), wie beim Gehen auf der Stelle
    const kw=md.kneeWave?(1-Math.cos(2*Math.PI*t/md.kneeWave))/2:0, mixP=(a,b,u)=>({...a,x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u});
    // knee/kneeWave (seit 15.10.): Oberschenkel 40° nach vorn (über 45° wird die Hose ausgeblendet), Unterschenkel schräg zurück
    const kO=P(11,95-45*Math.cos(.7),45*Math.sin(.7)), aO=P(10,95-45*Math.cos(.7)-40,45*Math.sin(.7)-14);
    const kl=md.knee?kO:kw?mixP(P(9,50),kO,kw):P(9+md.wide*14,50), al=md.knee?aO:kw?mixP(P(9,8),aO,kw):P(9+md.wide*30,8);
    L[25]=kl; L[27]=al; L[26]=P(-9-md.wide*14,50); L[28]=P(-9-md.wide*30,8);
    // kneeHigh: linker Oberschenkel waagrecht nach vorn, Unterschenkel senkrecht (Knie ganz hoch, Ferse unter dem Knie)
    // fersePo: linke Ferse zum Gesäß (Oberschenkel senkrecht, Knie ganz gebeugt); kneeHigh und fersePo zusammen: Knie hoch und ganz gebeugt
    if(md.kneeHigh||md.fersePo){ const kh=md.kneeHigh||0, fp=md.fersePo||0;
      const th=kh*Math.PI/2*.95, kx=9+2*kh, kHg=95-45*Math.cos(th), kF=45*Math.sin(th);
      // Unterschenkel gegen die Senkrechte (vorn +): Knie hoch allein → senkrecht, mit fersePo im Knie um 153° gebeugt
      const sa=th-Math.max(th,fp*Math.PI*.85), aHg=kHg-42*Math.cos(sa), aF=kF+42*Math.sin(sa);
      L[25]=P(kx,kHg,kF); L[27]=P(kx-1,aHg,aF); }
    // beugeL/beugeR: Hüftbeugung in Grad (Oberschenkel nach vorn gehoben, gegen die Senkrechte), knieL/knieR: Kniebeugung in Grad
    // (0 = gerades Bein; ohne Angabe hängt der Unterschenkel senkrecht). Links = Punkte 23/25/27, rechts = 24/26/28.
    for(const [b,k,hx,ki,ai,sg] of [['beugeL','knieL',9,25,27,1],['beugeR','knieR',-9,26,28,-1]]){ if(md[b]==null&&md[k]==null) continue;
      const th=(md[b]||0)*Math.PI/180, kb=md[k]==null?th:(md[k]||0)*Math.PI/180, kHg=95-45*Math.cos(th), kF=45*Math.sin(th), sa=th-kb;
      L[ki]=P(hx+sg,kHg,kF); L[ai]=P(hx+sg,kHg-42*Math.cos(sa),kF+42*Math.sin(sa)); }
    // Ganzkörper-Posen (3D-Verbesserung 13.10.): Oberkörper (0–24) um tief cm abgesenkt, Beine neu gesetzt (Höhe, vorn +)
    // ausfall: Ausfallschritt, linkes Bein vorn (Oberschenkel waagrecht zur Kamera, Unterschenkel senkrecht), rechtes Knie
    //   hinten fast am Boden; spagat:1 seitlicher Spagat (Beine waagrecht zur Seite, Becken am Boden); spagat:2 Längsspagat
    //   (links vorn, rechts hinten; mit yaw:1.57 von der Seite); liegestuetz: Körper waagrecht von der Kamera weg (Kopf vorn),
    //   Arme senkrecht, Beine hinter dem Oberkörper, Sicherheit der Beine gering wie bei MediaPipe (beineSicht, sonst .35)
    const senke=(tief)=>{ for(let i=0;i<=24;i++){ const q=L[i]; L[i]={...q,y:q.y+tief*cmN*zm}; } };
    if(md.ausfall){ senke(35);
      L[23]=P(9,60); L[24]=P(-9,60); L[25]=P(10,58,45); L[27]=P(10,12,45); L[26]=P(-10,24,-26); L[28]=P(-10,12,-66); }   // hinterer Oberschenkel 45 cm, 36° nach hinten
    // hocke: tiefe Hocke von vorn (Knie vorn und etwas außen, Fersen unten, Becken hinten auf 45 cm)
    if(md.hocke){ senke(50);
      L[23]=P(9,45,-10); L[24]=P(-9,45,-10); L[25]=P(20,48,34); L[27]=P(15,10,6); L[26]=P(-20,48,34); L[28]=P(-15,10,6); }
    // hockeBreit: halbe Hocke mit weit gespreizten Knien (Referenz halbe-hocke-vorne: Knie weit außen, Oberschenkel zur Seite)
    //   hockeBreit:2 Sumo-Hocke, Knie 58° nach außen (Oberschenkel 43 cm waagrecht, 23 cm nach vorn); hockeBreit:3 Knie 68° nach
    //   außen und 5 cm unter der Hüfte (Oberschenkel fast in der Bildebene: die Hauptschleife setzt keine Tiefe)
    if(md.hockeBreit){ senke(45); const q=md.hockeBreit===3?[48.9,10.1,45]:md.hockeBreit===2?[45.5,17,52]:[42,22,52];
      L[23]=P(9,50,-6); L[24]=P(-9,50,-6); L[25]=P(q[0],q[2],q[1]); L[27]=P(26,9,6); L[26]=P(-q[0],q[2],q[1]); L[28]=P(-26,9,6); }
    if(md.spagat===1){ senke(85);
      L[23]=P(9,10); L[24]=P(-9,10); L[25]=P(54,8); L[27]=P(96,6); L[26]=P(-54,8); L[28]=P(-96,6); }
    if(md.spagat===2){ senke(85);
      L[23]=P(9,10); L[24]=P(-9,10); L[25]=P(9,8,45); L[27]=P(9,6,87); L[26]=P(-9,8,-45); L[28]=P(-9,6,-87); }
    if(md.liegestuetz){ const P2=(lat,hgt,fwd)=>P(lat,hgt,fwd);
      L[0]=P2(0,45,20); L[11]=P2(20,40,0); L[12]=P2(-20,40,0); L[13]=P2(24,20,2); L[14]=P2(-24,20,2); L[15]=P2(25,2,4); L[16]=P2(-25,2,4);
      for(const [i,b] of [[17,15],[19,15],[21,15],[18,16],[20,16],[22,16]]) L[i]={...L[b]};
      L[23]=P2(9,35,-60); L[24]=P2(-9,35,-60); L[25]=P2(9,24,-105); L[26]=P2(-9,24,-105); L[27]=P2(9,12,-148); L[28]=P2(-9,12,-148);
      const vs=md.beineSicht??.35; for(const i of [23,24,25,26,27,28,29,30,31,32]) L[i]={...L[i],visibility:vs}; }
    // hueftSicht: Sicherheit der Hüftpunkte (schlecht erkannt)
    if(md.hueftSicht!=null) for(const i of [23,24]) L[i]={...L[i],visibility:md.hueftSicht};
    // schulterSicht: Sicherheit der rechten Schulter (im Bild, aber verdeckt, z. B. liegend von der Seite)
    if(md.schulterSicht!=null) L[12]={...L[12],visibility:md.schulterSicht};
    // zn: Tiefenfehler wie bei echter Pose-Erkennung (Knie und Knöchel scheinbar näher an der Kamera), zr: zusätzlich zittern
    if(md.zn||md.zr){ for(const [i,k] of [[25,.5],[26,.5],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1]]){
      L[i]={...L[i],z:L[i].z-(md.zn||0)*k+(md.zr||0)*(Math.random()-.5)}; } }
    L[29]=P(9+md.wide*30,3,-4); L[30]=P(-9-md.wide*30,3,-4); L[31]=P(9+md.wide*30,2,14); L[32]=P(-9-md.wide*30,2,14);
    if(md.kneeHigh||md.fersePo){ const a=L[27]; L[29]={...a,y:a.y+3*cmN*zm}; L[31]={...a,x:a.x+(14*s)*cmN/A*zm,z:a.z-14*c*cmN/A*zm}; }
    const ganz=md.ausfall||md.spagat||md.liegestuetz||md.hocke||md.hockeBreit;
    if(ganz) for(const [a,h,t] of [[27,29,31],[28,30,32]]){ const q=L[a]; L[h]={...q,y:q.y+2*cmN*zm}; L[t]={...q,y:q.y+2*cmN*zm,z:q.z-10*cmN/A*zm}; }
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
    seg(mid(L[11],L[12]),mid(L[23],L[24]),36*tw);
    if(ganz){ const k=L[0]; seg({x:k.x,y:k.y-5*cmN*zm},{x:k.x,y:k.y+5*cmN*zm},18); } else seg(P(0,165),P(0,175),18);
    // knieSchmal (tavatar.mjs): Oberschenkel endet vor dem Knie, Knie 13 cm breit wie am Körper (sonst ist es durch das runde
    // Ende des Oberschenkels so breit wie der Oberschenkel, wie bei einer weiten Hose)
    if(md.knieSchmal){ const lp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
      for(const [h,k] of [[23,25],[24,26]]){ seg(L[h],lp(L[h],L[k],.75),17); seg(lp(L[h],L[k],.75),L[k],13); } }
    else { seg(L[23],L[25],17); seg(L[24],L[26],17); }
    seg(L[25],L[27],12); seg(L[26],L[28],12);
    if(ganz){ seg(L[27],L[31],10); seg(L[28],L[32],10); } else { seg(L[27],P(9+md.wide*30,0),10); seg(L[28],P(-9-md.wide*30,0),10); }
    seg(L[15],mid(L[17],L[19]),9); seg(L[16],mid(L[18],L[20]),9); seg(L[11],L[13],9); seg(L[13],L[15],8); seg(L[12],L[14],9); seg(L[14],L[16],8);
    // gegenstand: etwas Hohes im Hintergrund, das die Erkennung fälschlich zur Person zählt (fast vom oberen bis zum unteren Rand)
    if(md.gegenstand) mx.fillRect(8,6,14,130);
    const d=mx.getImageData(0,0,256,144).data, f=new Float32Array(256*144);
    for(let i=0;i<f.length;i++) f[i]=d[i*4]/255;
    // beineOben: Fehlerkennung wie beim Nutzer (12.10., nah an der Kamera, Kind und Hund im Bild): Knie, Knöchel und Füße
    // landen über der Hüfte, die Person (Maske) steht aber normal
    if(md.beineOben){ const hy=(L[23].y+L[24].y)/2; for(const i of [25,26,27,28,29,30,31,32]) L[i]={...L[i],y:2*hy-L[i].y}; }
    return {landmarks:[L],segmentationMasks:[{getAsFloat32Array:()=>f,width:256,height:144}],close(){}};
  }
  window.__mc=mc; window.__stub={FilesetResolver:{forVisionTasks:async()=>({})},
    PoseLandmarker:{createFromOptions:async()=>({detectForVideo:()=>pose()})}};
})();
