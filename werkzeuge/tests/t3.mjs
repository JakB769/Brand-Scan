import { chromium } from 'playwright';
const b=await chromium.launch(); const p=await b.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///tmp/claude-0/test.html'); await p.waitForTimeout(1200);
const out=await p.evaluate(async()=>{
  const src=document.querySelector('.gbtn[data-g="jeans"] img').src;
  const img=new Image(); await new Promise(r=>{img.onload=r; img.src=src;});
  const base={r:96,g:106,b:112,lum:104.1};            // gemessene Grundwerte der Jeans
  const clamp=(v,a,c)=>Math.min(c,Math.max(a,v));
  const W=img.naturalWidth,H=img.naturalHeight;
  const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  function tint(s){
    let m=clamp(1+.75*(s.lum/Math.max(20,base.lum)-1),.35,1.8);
    const mx=Math.max(s.r,s.g,s.b)||1;
    const cast=[s.r/mx,s.g/mx,s.b/mx].map(v=>1-(1-v)*.55);
    x.clearRect(0,0,W,H); x.globalCompositeOperation='source-over'; x.globalAlpha=1;
    x.drawImage(img,0,0);
    const dark=Math.min(m,1);
    const col=cast.map(v=>Math.round(clamp(v*dark,0,1)*255));
    if(col[0]<254||col[1]<254||col[2]<254){
      x.globalCompositeOperation='multiply'; x.fillStyle=`rgb(${col[0]},${col[1]},${col[2]})`;
      x.fillRect(0,0,W,H);
      x.globalCompositeOperation='destination-in'; x.drawImage(img,0,0);
    }
    if(m>1){ x.globalCompositeOperation='lighter'; x.globalAlpha=clamp(m-1,0,1);
             x.drawImage(c,0,0); x.globalAlpha=1; }
    x.globalCompositeOperation='source-over';
    const d=x.getImageData(0,0,W,H).data;
    let r=0,g2=0,bl=0,n=0,a=0;
    for(let i=0;i<d.length;i+=4){ if(d[i+3]>160){ r+=d[i];g2+=d[i+1];bl+=d[i+2];n++; } a+=d[i+3]; }
    r/=n;g2/=n;bl/=n;
    return {m:+m.toFixed(2), lum:+(0.2126*r+0.7152*g2+0.0722*bl).toFixed(1),
            rgb:[r,g2,bl].map(v=>Math.round(v)), alphaSum:a};
  }
  const szenen=[
    ['dunkles Zimmer',   {r:38,g:40,b:46}],
    ['normale Wohnung',  {r:105,g:104,b:100}],
    ['helles Tageslicht',{r:190,g:196,b:205}],
    ['warmes Kunstlicht',{r:150,g:120,b:85}],
  ];
  return szenen.map(([n,s])=>{ s.lum=.2126*s.r+.7152*s.g+.0722*s.b; return [n,s.lum.toFixed(0),tint(s)]; });
});
console.log('Jeans, Grundhelligkeit 104\n');
console.log('Szene'.padEnd(20),'Licht','Faktor','→ Helligkeit','Farbe');
for(const [n,sl,t] of out)
  console.log(n.padEnd(20), String(sl).padStart(5), String(t.m).padStart(6),
              String(t.lum).padStart(12), '  rgb('+t.rgb.join(',')+')', t.alphaSum>0?'':'ALPHA WEG!');
console.log(errs.length?'FEHLER: '+errs.join(' | '):'\nkeine Seitenfehler');
await b.close();
