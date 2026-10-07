import { chromium } from 'playwright';
const RIG=JSON.parse(process.argv[2]);
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1000,height:520}});
await p.goto('file:///tmp/claude-0/test.html'); await p.waitForTimeout(1200);
await p.evaluate(async(RIG)=>{
  const btn=[...document.querySelectorAll('.gbtn')].find(b=>b.dataset.g==='jeans');
  const img=new Image(); await new Promise(r=>{img.onload=r; img.src=btn.querySelector('img').src;});
  const clamp=(v,a,c)=>Math.min(c,Math.max(a,v)), BANDS=26;
  function chainWalk(pts,d){let acc=0;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],L=Math.hypot(b.x-a.x,b.y-a.y);
    if(acc+L>=d||i===pts.length-2){const t=L>1e-6?(d-acc)/L:0;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,ang:Math.atan2(b.y-a.y,b.x-a.x)};}acc+=L;}
    return{x:pts[0].x,y:pts[0].y,ang:Math.PI/2};}
  function distToY(a,b,y){const L=Math.hypot(b.x-a.x,b.y-a.y),dy=b.y-a.y;return Math.abs(dy)<1e-6?0:clamp((y-a.y)/dy,0,1)*L;}
  function rigged(ctx,box,bone){
    const IW=img.naturalWidth,IH=img.naturalHeight,scale=box.w/IW,rise=RIG.rise,E=RIG.ext;
    ctx.drawImage(img,0,0,IW,rise*IH,box.x,box.y,box.w,rise*box.h);
    const legLen=(1-rise)*box.h,yC=box.y+rise*box.h,sh=((1-rise)*IH)/BANDS;
    for(let s=0;s<2;s++){
      let L0=1,R0=0; for(const row of E){L0=Math.min(L0,row[s][0]);R0=Math.max(R0,row[s][1]);}
      const sx=L0*IW,sw=(R0-L0)*IW,ref=RIG.ctr[0][s]*IW; if(sw<1) continue;
      const r0=bone[s],sd=distToY(r0[0],r0[1],yC),s0=chainWalk(r0,sd);
      const ax=box.x+RIG.ctr[0][s]*box.w,dx=ax-s0.x,dy=yC-s0.y;
      const pts=r0.map(q=>({x:q.x+dx,y:q.y+dy})),raw=[],ed=[];
      for(let i=0;i<=BANDS;i++) raw.push(chainWalk(pts,sd+legLen*i/BANDS));
      const o0=(sx-ref)*scale,o1=(sx+sw-ref)*scale;
      for(let i=0;i<=BANDS;i++){let a=0,n=0;
        for(let j=Math.max(0,i-2);j<=Math.min(BANDS,i+2);j++){a+=raw[j].ang;n++;}a/=n;
        const nx=Math.sin(a),ny=-Math.cos(a),q=raw[i];
        ed.push({lx:q.x+nx*o0,ly:q.y+ny*o0,rx:q.x+nx*o1,ry:q.y+ny*o1});}
      for(let i=0;i<BANDS;i++){const t=ed[i],b2=ed[i+1],sy=(rise+(1-rise)*(i/BANDS))*IH;
        const ux=(t.rx-t.lx)/sw,uy=(t.ry-t.ly)/sw,vx=(b2.lx-t.lx)/sh,vy=(b2.ly-t.ly)/sh;
        ctx.save();ctx.setTransform(ux,uy,vx,vy,t.lx-ux*sx-vx*sy,t.ly-uy*sx-vy*sy);
        ctx.drawImage(img,sx,sy,sw,sh+0.75,sx,sy,sw,sh+0.75);ctx.restore();}}
  }
  document.body.innerHTML=''; document.body.style.cssText='margin:0;display:flex;background:#111';
  // Exakt dieselbe gerade Pose, einmal ohne und einmal mit Skelett, stark vergrößert
  const bone=[[[150,120],[149,330],[148,540]],[[250,120],[251,330],[252,540]]].map(l=>l.map(([x,y])=>({x,y})));
  const box={x:0,y:100,w:300,h:496}; box.x=200-box.w*.497;
  for(const mit of [false,true]){
    const big=document.createElement('canvas'); big.width=400; big.height=620;
    const k=big.getContext('2d'); k.fillStyle='#8c8f94'; k.fillRect(0,0,400,620);
    if(mit) rigged(k,box,bone); else k.drawImage(img,box.x,box.y,box.w,box.h);
    // Oberschenkel-Bereich herauszoomen
    const z=document.createElement('canvas'); z.width=480; z.height=520;
    const zk=z.getContext('2d'); zk.imageSmoothingEnabled=false;
    zk.drawImage(big,60,200,240,260,0,0,480,520);
    zk.fillStyle='#fff'; zk.font='700 16px sans-serif';
    zk.fillText(mit?'mit Skelett':'ohne Skelett (nur skaliert)',12,26);
    z.style.cssText='border-right:2px solid #000'; document.body.appendChild(z);
  }
}, RIG);
await p.screenshot({path:'/home/claude/cut/ab.png'});
await b.close();
