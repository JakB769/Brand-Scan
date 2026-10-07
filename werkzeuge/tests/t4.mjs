import { chromium } from 'playwright';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1100,height:460}});
await p.goto('file:///tmp/claude-0/test.html'); await p.waitForTimeout(1200);
await p.evaluate(async()=>{
  const src=document.querySelector('.gbtn[data-g="jeans"] img').src;
  const img=new Image(); await new Promise(r=>{img.onload=r; img.src=src;});
  const base={lum:103.5}; const clamp=(v,a,c)=>Math.min(c,Math.max(a,v));
  const W=img.naturalWidth,H=img.naturalHeight;
  const tc=document.createElement('canvas'); tc.width=W; tc.height=H; const x=tc.getContext('2d');
  function tint(s){
    let m=clamp(1+.75*(s.lum/Math.max(20,base.lum)-1),.35,1.8);
    const mx=Math.max(s.r,s.g,s.b)||1;
    const cast=[s.r/mx,s.g/mx,s.b/mx].map(v=>1-(1-v)*.55);
    x.clearRect(0,0,W,H); x.globalCompositeOperation='source-over'; x.globalAlpha=1; x.drawImage(img,0,0);
    const col=cast.map(v=>Math.round(clamp(v*Math.min(m,1),0,1)*255));
    x.globalCompositeOperation='multiply'; x.fillStyle=`rgb(${col.join(',')})`; x.fillRect(0,0,W,H);
    x.globalCompositeOperation='destination-in'; x.drawImage(img,0,0);
    if(m>1){ x.globalCompositeOperation='lighter'; x.globalAlpha=clamp(m-1,0,1); x.drawImage(tc,0,0); x.globalAlpha=1; }
    x.globalCompositeOperation='source-over'; return tc;
  }
  document.body.innerHTML=''; document.body.style.cssText='margin:0;display:flex;background:#111';
  const szenen=[['dunkles Zimmer',{r:38,g:40,b:46}],['warmes Licht',{r:150,g:120,b:85}],
                ['Tageslicht',{r:190,g:196,b:205}],['warmes Licht',{r:150,g:120,b:85}]];
  for(const [name,s] of szenen){
    s.lum=.2126*s.r+.7152*s.g+.0722*s.b;
    for(const mit of [false,true]){
      const c=document.createElement('canvas'); c.width=270; c.height=460;
      const k=c.getContext('2d');
      k.fillStyle=`rgb(${s.r},${s.g},${s.b})`; k.fillRect(0,0,270,460);   // Raum als Hintergrund
      const src2=mit?tint(s):img;
      k.save(); k.shadowColor='rgba(0,0,0,.45)'; k.shadowBlur=10; k.shadowOffsetY=3;
      k.drawImage(src2,25,40,220,364); k.restore();
      k.fillStyle=s.lum>120?'#111':'#fff'; k.font='600 15px sans-serif';
      k.fillText(name+(mit?' · angepasst':' · vorher'),12,24);
      c.style.cssText='width:275px;border-right:1px solid #000';
      document.body.appendChild(c);
    }
  }
});
await p.screenshot({path:'/home/claude/cut/licht.png'});
await b.close();
