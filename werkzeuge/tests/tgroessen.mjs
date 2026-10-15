// Größen: alle Größen einer Hose aus der Maßtabelle (oder aus der Größe des Models abgeleitet), Knöpfe zum Wechseln,
// Urteil je Größe aus den Körpermaßen (zu eng / eng / passt / weit / zu weit) und Sitz (skinny … baggy).
// Server wie in tlink.mjs (Seite + /api/holen + künstliche Shop-Seiten aus shop/).
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';
import path from 'path';
process.env.HOLEN_LOKAL='1';
const { default: holen } = await import('../../netlify/functions/holen.mjs');
const hier=fileURLToPath(new URL('.',import.meta.url)), R=path.resolve(hier,'../..')+'/', NM=R+'node_modules/', shop=hier+'shop/';
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };

const TYP={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.wasm':'application/wasm'};
const srv=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/api/holen'){ const r=await holen(new Request(u.href)); res.writeHead(r.status,Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return; }
  let f=u.pathname.startsWith('/shop/')?shop+u.pathname.slice(6):R+decodeURIComponent(u.pathname.slice(1));
  f=path.resolve(f); if(!f.startsWith(R.slice(0,-1))||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200,{'content-type':TYP[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(res);
});
await new Promise(ok=>srv.listen(0,ok)); const B=`http://localhost:${srv.address().port}`;

const modell={}; for(const n of ['magic_touch.tflite','pose_landmarker_full.task']){ const f=hier+'ausgabe/'+n; if(fs.existsSync(f)) modell[n]=fs.readFileSync(f); }
const typ=f=>f.endsWith('.wasm')?'application/wasm':/\.m?js$/.test(f)?'application/javascript':'application/octet-stream';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:1000,height:1200}});
await ctx.route('**/@mediapipe/tasks-vision@0.10.18/**',r=>{ const f=NM+'@mediapipe/tasks-vision/'+decodeURIComponent(r.request().url().split('@0.10.18/')[1].split('?')[0]);
  if(!fs.existsSync(f)) return r.abort(); r.fulfill({status:200,contentType:typ(f),headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(f)}); });
for(const n of ['magic_touch.tflite','pose_landmarker_full.task']) await ctx.route('**/'+n,r=>modell[n]?r.fulfill({status:200,body:modell[n],headers:{'access-control-allow-origin':'*'}}):r.abort());
await ctx.route('**/fonts.googleapis.com/**',r=>r.abort());
if(Object.keys(modell).length===2) await ctx.addInitScript(()=>{ window.__kiTest=true; });
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(B+'/werkzeuge/tests/testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
await p.fill('#height','179');

const warte=async()=>{ for(let t=0;t<240;t++){ await p.waitForTimeout(500);
    const z=await p.evaluate(()=>({m:document.getElementById('drop-msg').textContent,busy:document.getElementById('link-go').disabled,seg:!document.getElementById('segDlg').hidden}));
    if(z.seg){ await p.click('#segOk'); continue; } if(!z.busy&&/Fertig|keine realistische|ließ sich/.test(z.m)&&!/wird|werden|berechnet/.test(z.m)) return z; } };
const link=async u=>{ await p.fill('#link-in',u); await p.click('#link-go'); return warte(); };
const hose=()=>p.evaluate(()=>{ const G=window.__dbg.GARMENTS[window.__dbg.g.key]; return G?{sizes:G.sizes,size:G.size,est:G.sizesEst,waist:G.waist,len:G.len,hem:G.hem}:null; });
const koerper=(w,h)=>p.evaluate(([w,h])=>{ document.getElementById('t-waist').value=w; const e=document.getElementById('t-hip'); e.value=h; e.dispatchEvent(new Event('input')); },[String(w),String(h)]);
const knoepfe=(sel='#g-szrow')=>p.evaluate(sel=>({msg:document.getElementById('g-szmsg').innerText,hidden:document.getElementById('g-sizes').hidden,
  k:[...document.querySelectorAll(sel+' .szchip')].map(b=>({n:b.querySelector('b').textContent,f:+((b.className.match(/ f(-?\d)/)||[])[1]??NaN),best:b.classList.contains('best'),an:b.getAttribute('aria-pressed')==='true'}))}),sel);
const SITZ=['skinny','slim','regular','weit','baggy'];

// 1) Maßtabelle S M L, Model trägt M
await link(B+'/shop/jeans.html'); let G=await hose();
pruefe(G&&G.sizes&&G.sizes.map(z=>z.n).join(' ')==='S M L'&&!G.est,'alle Größen aus der Tabelle: '+(G&&G.sizes?G.sizes.map(z=>`${z.n} ${z.waist}/${z.len}`).join(', '):'keine'));
pruefe(G&&G.size===1&&G.waist===41&&G.sizes[2].waist===43&&G.sizes[2].len===111,'gewählt ist M wie am Model, L hat Bund 43 und Länge 111');
let K=await knoepfe();
pruefe(!K.hidden&&K.k.length===3&&K.k.every(c=>!isNaN(c.f))&&/aus der Körpergröße geschätzt/.test(K.msg),'ohne Scan und Maßband: Urteil aus der Körpergröße (Profil), so gekennzeichnet: '+K.k.map(c=>c.n+' '+c.f).join(', '));

// Körper vom Maßband: Urteil je Größe, wird mit der Größe nicht enger
await koerper(78,96); K=await knoepfe();
const fs1=K.k.map(c=>c.f);
pruefe(K.k.every(c=>c.f>=-2&&c.f<=2)&&fs1.every((f,i)=>!i||f>=fs1[i-1]),'Urteil je Größe, mit der Größe nie enger: '+K.k.map(c=>c.n+' '+c.f).join(', '));
pruefe(K.k.filter(c=>c.best).length===1&&K.k.find(c=>c.best).f===0,'genau eine Empfehlung, und die passt: '+(K.k.find(c=>c.best)||{}).n);
pruefe(/Spiel am Bund/.test(K.msg)&&/Maßband/.test(K.msg),'Meldung nennt Spiel und Herkunft der Körpermaße: '+K.msg.split('\n')[0]);
// jede Größe antippen: Maße wechseln, Sitz wird mit der Größe nicht enger
const sitz=[];
for(let i=0;i<3;i++){ await p.click(`#g-szrow .szchip:nth-child(${i+1})`); await p.waitForTimeout(200);
  const r=await p.evaluate(()=>({G:window.__dbg.GARMENTS[window.__dbg.g.key],f:document.getElementById('g-waist').value,msg:document.getElementById('g-szmsg').innerText}));
  const z=r.G.sizes[i]; sitz.push(SITZ.indexOf((r.msg.match(/sitzt (\w+)/)||[])[1]));
  pruefe(r.G.size===i&&r.G.waist===z.waist&&r.G.len===z.len&&r.f===String(z.waist).replace('.',','),`${z.n} angetippt: Bund ${r.G.waist}, Länge ${r.G.len}, Feld ${r.f}`); }
pruefe(sitz.every(x=>x>=0)&&sitz.every((x,i)=>!i||x>=sitz[i-1]),'Sitz wird mit der Größe nicht enger: '+sitz.map(i=>SITZ[i]).join(', '));
const up=await p.evaluate(()=>({s:window.__dbg.UP.size,v:document.getElementById('drop-size').value}));
pruefe(up.s===2&&up.v==='2','Auswahl beim Hochladen folgt der Größe (L)');
// Zonen (15.10.): Bund, Hüfte, Oberschenkel, Knie, Länge; kurze Begründung wie „Bund passt, Länge 2 cm zu kurz“
const Z=await p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], v=d.sizeVerdict(G,G.sizes[1],d.bodyMeas()); return {z:Object.keys(v.Z),r:d.sizeReason(v),cut:v.cut,st:v.st.t}; });
pruefe(['bund','huefte','ober','knie','laenge'].every(k=>Z.z.includes(k))&&/^Bund (passt|\d+ cm zu (eng|weit)), (.*, )?Länge (passt|\d+ cm zu (kurz|lang))$/.test(Z.r),'je Zone ein Urteil, Begründung: '+Z.r+' ('+Z.cut+', '+Z.st+')');
const groesse=async h=>{ await p.fill('#height',String(h)); await p.waitForTimeout(300); return knoepfe(); };
K=await groesse(150); pruefe(/Länge \d+ cm zu lang/.test(K.msg),'150 cm groß: Länge zu lang: '+K.msg.split('\n')[0]);
K=await groesse(205); pruefe(/Länge \d+ cm zu kurz/.test(K.msg),'205 cm groß: Länge zu kurz: '+K.msg.split('\n')[0]);
// Culotte/Capri (unter 88 cm): kein Längenurteil, für jeden Betrachter und jede Größe gleich; Rock: Bund an der Taille
const kurzR=[];
for(const h of [170,179,187,205]){ await p.fill('#height',String(h)); await p.waitForTimeout(200);
  kurzR.push(await p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], B=d.bodyMeas(), C={...G,len:80,sizes:null}, Lg={...G,len:109,sizes:null};
    const R={...G,sizes:null,m3:{...G.m3,rock:true}}, v=d.sizeVerdict(R,{},B), gm=d.sizeGarment(R,{});
    return {c:!!d.sizeVerdict(C,{},B).Z.laenge, l:!!d.sizeVerdict(Lg,{},B).Z.laenge, cut:v.cut, rockBund:Math.abs(v.Z.bund.e-(gm.waist-B.waist))<.01}; })); }
pruefe(kurzR.every(r=>!r.c&&r.l),'Culotte 80 cm: kein Längenurteil bei 170–205 cm; lange Hose 109 cm: immer eins');
pruefe(kurzR.every(r=>r.cut==='rock'&&r.rockBund),'Rock: Bund gegen die Taille gemessen (nicht die Bundlinie der Hose)');
// im 3D sichtbar: größere Größe breiter, kürzere endet höher über dem Boden (Puppe 215 cm, damit der Saum nicht auf dem Schuh aufliegt)
await groesse(215); await p.evaluate(()=>document.getElementById('g3dbox').scrollIntoView());
const form=async i=>{ await p.click(`#g-szrow .szchip:nth-child(${i+1})`); await p.evaluate(()=>{ const v=window.__dbg.v3d; v.yaw=0; v.idle=performance.now()+1e9; }); await p.waitForTimeout(2500);
  return p.evaluate(()=>{ const d=window.__dbg, P=d.g3.pos, b=d.v3d.boden; let x0=1e9,x1=-1e9,y1=-1e9;
    for(let i=0;i<P.length;i+=3){ x0=Math.min(x0,P[i]); x1=Math.max(x1,P[i]); y1=Math.max(y1,P[i+1]); } return {w:(x1-x0)/b.ppc,gap:(b.floor-y1)/b.ppc}; }); };
const fS=await form(0), fL=await form(2);
pruefe(fL.w>fS.w*1.03&&fS.gap-fL.gap>1,`3D: L breiter (${fS.w.toFixed(1)} → ${fL.w.toFixed(1)} cm) und Saum tiefer (${fS.gap.toFixed(1)} → ${fL.gap.toFixed(1)} cm über dem Boden)`);
await p.fill('#height','179'); await p.click('#g-szrow .szchip:nth-child(3)'); await p.waitForTimeout(300);
// kleiner und großer Körper
await koerper(58,80); K=await knoepfe();
pruefe(K.k[0].best&&K.k[2].f>=1,'schmaler Körper: kleinste Größe empfohlen, L zu weit: '+K.k.map(c=>c.n+' '+c.f).join(', '));
await koerper(118,130); K=await knoepfe();
pruefe(K.k.every(c=>c.f===-2)&&K.k[2].best,'breiter Körper: alles zu eng, Empfehlung die größte: '+K.k.map(c=>c.n+' '+c.f).join(', '));
// Anprobe und Shop-Ansicht: höchstens fünf Knöpfe
const hud=await p.evaluate(()=>[document.querySelectorAll('#szchips .szchip').length,document.querySelectorAll('#szshop .szchip').length]);
pruefe(hud[0]===3&&hud[1]===3,'Knöpfe auch in der Anprobe und in der Shop-Ansicht: '+hud.join('/'));
// Shop-Ansicht: ein Satz mit der Begründung über den Knöpfen (Bild nach ausgabe/groessen_shop.png)
await koerper(84,98);
const why=await p.evaluate(()=>{ const st=document.getElementById('stage'); st.classList.add('shop'); return document.getElementById('szwhy').textContent; });
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/groessen_shop.png'}); await p.evaluate(()=>document.getElementById('stage').classList.remove('shop'));
pruefe(/^(S|M|L): Bund (passt|\d+ cm zu (eng|weit))/.test(why)||/^Empfehlung (S|M|L): Bund/.test(why),'Shop-Ansicht: Begründung über den Knöpfen: '+why);

// 2) Keine Tabelle, nur die US-Größe des Models (32 × 32): Größen abgeleitet
await link(B+'/shop/modell.html'); G=await hose();
const nm=G&&G.sizes?G.sizes.map(z=>z.n):[];
pruefe(G&&G.est&&nm[0]==='W28/L32'&&nm[nm.length-1]==='W38/L32'&&G.sizes[G.size].n==='W32/L32'&&Math.abs(G.waist-41.9)<.2,'abgeleitet: '+nm.join(' ')+', gewählt '+(G&&G.sizes?G.sizes[G.size].n:'-'));
pruefe(G&&G.sizes.every((z,i)=>!i||z.waist>G.sizes[i-1].waist)&&Math.abs(G.sizes[5].waist-G.sizes[4].waist-1.27)<.06,'je W-Größe 1 Zoll Umfang mehr (1,27 cm flach)');
await koerper(84,98); K=await knoepfe('#szchips');
pruefe(K.k.length===5&&K.k.some(c=>c.an),'in der Anprobe fünf Größen um die gewählte: '+K.k.map(c=>c.n).join(' '));
pruefe(/abgeleitet/.test(K.msg),'Hinweis: ohne Tabelle abgeleitet');
await p.$eval('#szchips .szchip:nth-child(5)',b=>b.click()); await p.waitForTimeout(1200); G=await hose();   // ohne Kamera ist die Anprobe ausgeblendet
pruefe(G.sizes[G.size].n==='W34/L32'&&Math.abs(G.waist-44.45)<.15,'in der Anprobe angetippt: '+G.sizes[G.size].n+', Bund '+G.waist);

// 3) Gespeichert und beim Laden geprüft
await p.reload(); await p.waitForTimeout(800);
let geladen=await p.evaluate(()=>Object.values(window.__dbg.GARMENTS).map(G=>({n:G.sizes?G.sizes.length:0,s:G.size,l:G.label})));
pruefe(geladen.some(x=>x.n===11&&x.s===6)&&geladen.some(x=>x.n===3),'nach dem Neuladen: Größen und gewählte Größe noch da: '+JSON.stringify(geladen));
await p.evaluate(()=>{ const a=JSON.parse(localStorage.getItem('massScanHosen')); for(const o of a) if(o.G.sizes) o.G.sizes=[{n:'<b>x</b>',waist:999},{n:5,waist:40},{n:'S'}]; localStorage.setItem('massScanHosen',JSON.stringify(a)); });
await p.reload(); await p.waitForTimeout(800);
geladen=await p.evaluate(()=>Object.values(window.__dbg.GARMENTS).map(G=>({sizes:G.sizes,size:G.size,bad:G.bad})));
pruefe(geladen.length>=2&&geladen.every(x=>x.sizes===null&&x.size===null&&!x.bad),'unsinnige Größen beim Laden verworfen, Hose bleibt');

pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close(); srv.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
