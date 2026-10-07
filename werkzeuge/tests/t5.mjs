import { chromium } from 'playwright';
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1160,height:470}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///tmp/claude-0/test.html'); await p.waitForTimeout(1200);
await p.evaluate(async()=>{
  const G=[...document.querySelectorAll('.gbtn')].find(b=>b.dataset.g==='jeans');
  const img=new Image(); await new Promise(r=>{img.onload=r; img.src=G.querySelector('img').src;});
  const base=103.5; const clamp=(v,a,c)=>Math.min(c,Math.max(a,v));
  const W=img.naturalWidth,H=img.naturalHeight;
  const tc=document.createElement('canvas'); tc.width=W; tc.height=H; const x=tc.getContext('2d');
  function tint(s){
    let m=clamp(1+.75*(s.lum/Math.max(20,base)-1),.35,1.8);
    const mx=Math.max(s.r,s.g,s.b)||1;
    const cast=[s.r/mx,s.g/mx,s.b/mx].map(v=>1-(1-v)*.45);
    x.clearRect(0,0,W,H); x.globalCompositeOperation='source-over'; x.globalAlpha=1; x.drawImage(img,0,0);
    const col=cast.map(v=>Math.round(clamp(v*Math.min(m,1),0,1)*255));
    x.globalCompositeOperation='multiply'; x.fillStyle=`rgb(${col.join(',')})`; x.fillRect(0,0,W,H);
    x.globalCompositeOperation='destination-in'; x.drawImage(img,0,0);
    if(m>1){ x.globalCompositeOperation='lighter'; x.globalAlpha=clamp(m-1,0,1); x.drawImage(tc,0,0); x.globalAlpha=1; }
    x.globalCompositeOperation='source-over'; return tc;
  }
  document.body.innerHTML=''; document.body.style.cssText='margin:0;display:flex;background:#111';
  const f=[['dunkles Zimmer',{r:38,g:40,b:46},0],['warmes Licht',{r:150,g:120,b:85},0],
           ['Tageslicht',{r:190,g:196,b:205},0],['seitlich, 80 %',{r:105,g:104,b:100},0.8]];
  for(const [name,s,turn] of f){
    s.lum=.2126*s.r+.7152*s.g+.0722*s.b;
    const c=document.createElement('canvas'); c.width=288; c.height=470; const k=c.getContext('2d');
    k.fillStyle=`rgb(${s.r},${s.g},${s.b})`; k.fillRect(0,0,288,470);
    const w=210*(1-.45*turn), hgt=347;
    k.save(); k.globalAlpha=1-.55*turn;
    k.shadowColor='rgba(0,0,0,.45)'; k.shadowBlur=10; k.shadowOffsetY=3;
    k.drawImage(tint(s),144-w/2,55,w,hgt); k.restore();
    k.fillStyle=s.lum>120?'#111':'#fff'; k.font='700 15px sans-serif'; k.fillText(name,12,26);
    c.style.cssText='border-right:1px solid #000'; document.body.appendChild(c);
  }
});
await p.screenshot({path:'/home/claude/cut/final.png'});
console.log(errs.length?'FEHLER: '+errs.join(' | '):'keine Fehler');
await b.close();
