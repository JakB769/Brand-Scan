import { chromium } from 'playwright';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1500,height:560}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///tmp/claude-0/test.html'); await p.waitForTimeout(1200);
await p.evaluate(async()=>{
  const G=JSON.parse(document.getElementById('rigdata')?.textContent||'null');
  const btn=[...document.querySelectorAll('.gbtn')].find(b=>b.dataset.g==='jeans');
  const img=new Image(); await new Promise(r=>{img.onload=r; img.src=btn.querySelector('img').src;});
  const RIG={rise:0.285,ctr:[[0.3058, 0.6908], [0.3, 0.6933], [0.2967, 0.6967], [0.2942, 0.7025], [0.2908, 0.7058], [0.2867, 0.7067], [0.2858, 0.7108], [0.2825, 0.7142], [0.2792, 0.7175], [0.2775, 0.7192], [0.2767, 0.7233], [0.2725, 0.7242], [0.2708, 0.7258], [0.2692, 0.7275], [0.2517, 0.7433], [0.2467, 0.75], [0.2417, 0.755], [0.2367, 0.76], [0.2333, 0.765], [0.2283, 0.7717], [0.2233, 0.775], [0.2183, 0.78], [0.2133, 0.7833], [0.26, 0.73], [0.26, 0.73]]};
  const clamp=(v,a,c)=>Math.min(c,Math.max(a,v));
  function chainWalk(pts,dist){ let acc=0;
    for(let i=0;i<pts.length-1;i++){ const a=pts[i],b2=pts[i+1],L=Math.hypot(b2.x-a.x,b2.y-a.y);
      if(acc+L>=dist||i===pts.length-2){ const t=L>1e-6?(dist-acc)/L:0;
        return {x:a.x+(b2.x-a.x)*t,y:a.y+(b2.y-a.y)*t,ang:Math.atan2(b2.y-a.y,b2.x-a.x)}; } acc+=L; }
    return {x:pts[0].x,y:pts[0].y,ang:Math.PI/2}; }
  function distToY(a,b2,y){ const L=Math.hypot(b2.x-a.x,b2.y-a.y),dy=b2.y-a.y;
    return Math.abs(dy)<1e-6?0:clamp((y-a.y)/dy,0,1)*L; }
  const BANDS=26;
  function rigged(ctx,box,bone,ctr,rise){
    const IW=img.naturalWidth,IH=img.naturalHeight,hw=IW/2,scale=box.w/IW;
    ctx.drawImage(img,0,0,IW,rise*IH,box.x,box.y,box.w,rise*box.h);
    const legLen=(1-rise)*box.h, yC=box.y+rise*box.h, sh=((1-rise)*IH)/BANDS;
    for(let s=0;s<2;s++){ const sx=s?hw:0;
      const raw0=bone[s], startD=distToY(raw0[0],raw0[1],yC), s0=chainWalk(raw0,startD);
      const ax=box.x+ctr[0][s]*box.w, dx=ax-s0.x, dy=yC-s0.y;
      const pts=raw0.map(q=>({x:q.x+dx,y:q.y+dy}));
      const raw=[],ed=[];
      for(let i=0;i<=BANDS;i++) raw.push(chainWalk(pts,startD+legLen*i/BANDS));
      for(let i=0;i<=BANDS;i++){ let a=0,n=0;
        for(let j=Math.max(0,i-2);j<=Math.min(BANDS,i+2);j++){a+=raw[j].ang;n++;} a/=n;
        const nx=Math.sin(a),ny=-Math.cos(a), ci=ctr[Math.round(i/BANDS*24)][s]*IW;
        const o0=(sx-ci)*scale,o1=(sx+hw-ci)*scale,q=raw[i];
        ed.push({lx:q.x+nx*o0,ly:q.y+ny*o0,rx:q.x+nx*o1,ry:q.y+ny*o1}); }
      for(let i=0;i<BANDS;i++){ const t=ed[i],b2=ed[i+1],sy=(rise+(1-rise)*(i/BANDS))*IH;
        const ux=(t.rx-t.lx)/hw,uy=(t.ry-t.ly)/hw,vx=(b2.lx-t.lx)/sh,vy=(b2.ly-t.ly)/sh;
        ctx.save(); ctx.setTransform(ux,uy,vx,vy,t.lx-ux*sx-vx*sy,t.ly-uy*sx-vy*sy);
        ctx.drawImage(img,sx,sy,hw,sh+0.75,sx,sy,hw,sh+0.75); ctx.restore(); } }
  }
  document.body.innerHTML=''; document.body.style.cssText='margin:0;display:flex;background:#111';
  const posen=[
    ['gerade stehen',  [[[95,170],[93,300],[91,430]],[[155,170],[157,300],[159,430]]]],
    ['Knie angehoben', [[[95,170],[75,282],[137,352]],[[155,170],[157,300],[159,430]]]],
    ['im Schritt',     [[[95,170],[67,292],[61,418]],[[155,170],[181,296],[213,404]]]],
  ];
  for(const [name,bn] of posen) for(const mitRig of [false,true]){
    const c=document.createElement('canvas'); c.width=250; c.height=560;
    const k=c.getContext('2d'); k.fillStyle='#8c8f94'; k.fillRect(0,0,250,560);
    const bone=bn.map(l=>l.map(([x,y])=>({x,y})));
    // Knochen zeigen
    k.strokeStyle='rgba(0,0,0,.5)'; k.lineWidth=5; k.lineCap='round';
    bone.forEach(l=>{ k.beginPath(); k.moveTo(l[0].x,l[0].y); l.slice(1).forEach(q=>k.lineTo(q.x,q.y)); k.stroke(); });
    const box={x:170-150/2*2.0,y:150,w:300*0.62,h:496*0.62};
    box.x=125-box.w*0.497;
    k.save(); k.globalAlpha=.92;
    if(mitRig) rigged(k,box,bone,RIG.ctr,RIG.rise);
    else k.drawImage(img,box.x,box.y,box.w,box.h);
    k.restore();
    k.fillStyle='#111'; k.font='700 14px sans-serif';
    k.fillText(name+(mitRig?' · Skelett':' · starr'),10,24);
    c.style.cssText='border-right:1px solid #000'; document.body.appendChild(c);
  }
});
await p.screenshot({path:'/home/claude/cut/rig.png'});
console.log(errs.length?'FEHLER: '+errs.join(' | '):'keine Fehler');
await b.close();
