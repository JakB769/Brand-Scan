import { chromium } from 'playwright';
const RIG=JSON.parse(process.argv[2]);
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1500,height:420}});
await p.goto('file:///tmp/claude-0/test.html'); await p.waitForTimeout(1200);
const r=await p.evaluate(async([RIG])=>{
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
  const bc=document.createElement('canvas'); bc.width=1280; bc.height=720; const bx=bc.getContext('2d');
  const bone=[[[560,180],[540,430],[530,660]],[[700,180],[712,430],[720,660]]].map(l=>l.map(([x,y])=>({x,y})));
  rigged(bx,{x:470,y:150,w:430,h:711},bone);
  const t0=performance.now(); for(let i=0;i<300;i++){bx.clearRect(0,0,1280,720);rigged(bx,{x:470,y:150,w:430,h:711},bone);}
  const ms=(performance.now()-t0)/300;
  document.body.innerHTML=''; document.body.style.cssText='margin:0;display:flex;background:#111';
  for(let f=0;f<8;f++){
    const ph=f/8*Math.PI*2;
    const c=document.createElement('canvas'); c.width=186; c.height=420;
    const k=c.getContext('2d'); k.fillStyle='#8c8f94'; k.fillRect(0,0,186,420);
    const k1=Math.sin(ph)*26,a1=Math.sin(ph-.7)*34,k2=Math.sin(ph+Math.PI)*26,a2=Math.sin(ph+Math.PI-.7)*34;
    const l1=Math.max(0,Math.sin(ph))*18,l2=Math.max(0,Math.sin(ph+Math.PI))*18;
    const bn=[[[72,120],[72+k1,218-l1*.4],[72+a1,312-l1]],[[112,120],[112+k2,218-l2*.4],[112+a2,312-l2]]].map(l=>l.map(([x,y])=>({x,y})));
    k.strokeStyle='rgba(0,0,0,.45)';k.lineWidth=4;k.lineCap='round';
    bn.forEach(l=>{k.beginPath();k.moveTo(l[0].x,l[0].y);l.slice(1).forEach(q=>k.lineTo(q.x,q.y));k.stroke();});
    const bx2={x:0,y:104,w:134,h:221}; bx2.x=92-bx2.w*.497;
    const sc=document.createElement('canvas'); sc.width=186; sc.height=420;
    rigged(sc.getContext('2d'),bx2,bn);
    k.globalAlpha=.93; k.drawImage(sc,0,0); k.globalAlpha=1;
    k.fillStyle='#111';k.font='700 12px sans-serif';k.fillText('Bild '+(f+1),8,18);
    c.style.cssText='border-right:1px solid #000'; document.body.appendChild(c);
  }
  return +ms.toFixed(2);
},[RIG]);
await p.screenshot({path:'/home/claude/cut/walk.png'});
console.log(`Skelett-Warp: ${r} ms pro Bild, volle 1280x720 — Budget bei 30 fps ist 33 ms`);
await b.close();
