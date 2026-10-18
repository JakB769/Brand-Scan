// Neue Hose aus Fotos, Ende zu Ende (Pflicht vor jedem Commit, der die Modellerzeugung berührt, siehe .githooks/pre-commit):
// die Testfotos des Nutzers (assets/referenz/fotos/flach-vorne-hinten/, Bankkarte im Bild, echte Länge 105 cm laut Maßband)
// per Drag & Drop beide auf einmal ins Feld → Vorder-/Rückseite erkannt → Bankkarte als Maßstab → 3D-Hose → Anprobe.
// Geprüft: Hosenform (zwei getrennte Beine, Seitenverhältnis, genug Punkte, kein Quader), Rückseite aus dem Rückseiten-Foto
// (Gesäßtaschen-Kanten deutlich stärker als bei geschätzter Rückseite), Maße gegen die Karte (Länge 105 ± 2 cm, Bund flach
// 41,5 ± 2 cm, W32), Rig und Physik (Knie hoch verformt die Hose am Knie, der Stoff schwingt nach und kommt zur Ruhe).
// Bilder von vorn, seitlich, hinten und mit gebeugtem Bein nach docs/test-neue-hose/ (zum Ansehen).
//   node werkzeuge/tests/tneuehose.mjs [--fotos vorne.jpg,hinten.jpg]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { starte } from '../server.mjs';
const hier=fileURLToPath(new URL('.',import.meta.url)), R=path.resolve(hier,'../..')+'/', NM=R+'node_modules/', A=hier+'ausgabe/', OUT=R+'docs/test-neue-hose/';
const argF=process.argv.indexOf('--fotos'), FOTOS=argF>0?process.argv[argF+1].split(','):['vorne.jpg','hinten.jpg'].map(n=>R+'assets/referenz/fotos/flach-vorne-hinten/'+n);
const ECHT={len:105,waist:41.5};                 // Länge vom Nutzer mit dem Maßband gemessen; Bund: W32 flach (nicht gemessen)
fs.mkdirSync(OUT,{recursive:true});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
const srv=await starte(0), port=srv.address().port;
const typ=f=>f.endsWith('.wasm')?'application/wasm':/\.m?js$/.test(f)?'application/javascript':'application/octet-stream';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:430,height:932},permissions:['camera']});
// KI-Freistellung wie im Browser des Nutzers (MediaPipe aus node_modules, Modell aus werkzeuge/tests/ausgabe, falls vorhanden)
await ctx.route('**/@mediapipe/tasks-vision@0.10.18/**',r=>{ const f=NM+'@mediapipe/tasks-vision/'+decodeURIComponent(r.request().url().split('@0.10.18/')[1].split('?')[0]);
  if(!fs.existsSync(f)) return r.abort(); r.fulfill({status:200,contentType:typ(f),headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(f)}); });
const KI=fs.existsSync(A+'magic_touch.tflite');
await ctx.route('**/magic_touch.tflite',r=>KI?r.fulfill({status:200,body:fs.readFileSync(A+'magic_touch.tflite'),headers:{'access-control-allow-origin':'*'}}):r.abort());
await ctx.route('**/heic-to@1.6.5/**',r=>r.fulfill({status:200,contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(NM+'heic-to/dist/heic-to.min.js')}));
await ctx.route('**/fonts.g*/**',r=>r.abort());
if(KI) await ctx.addInitScript(()=>{ window.__kiTest=true; });
const p=await ctx.newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver|Failed to load resource|TensorFlow/.test(m.text())) errs.push(m.text()); });
await p.goto(`http://localhost:${port}/werkzeuge/tests/testseite-mit-simulierter-person.html`); await p.waitForTimeout(500);
await p.fill('#height','179');
const msg=()=>p.evaluate(()=>document.getElementById('drop-msg').innerText.replace(/\n/g,' / '));
const fertig=async()=>{ for(let t=0;t<400;t++){ await p.waitForTimeout(500);
    const o=await p.evaluate(()=>['refDlg','segDlg'].filter(i=>{ const d=document.getElementById(i); return d&&!d.hidden; }).join(','));
    if(/refDlg/.test(o)){ await p.click('#refOk').catch(()=>{}); continue; } if(/segDlg/.test(o)){ await p.click('#segOk').catch(()=>{}); continue; }
    const m=await msg(); if(/Fertig|fehlt|keine realistische|ließ sich|nicht gebaut/.test(m)&&!/berechnet|wird/.test(m)) return m; } return msg(); };
// echtes Hineinziehen (DragEvent mit DataTransfer), mehrere Dateien auf einmal
const ziehen=async fotos=>{ const fs2=fotos.map(f=>({n:path.basename(f),t:/heic/i.test(f)?'image/heic':'image/jpeg',b:fs.readFileSync(f).toString('base64')}));
  await p.evaluate(fs2=>{ const dt=new DataTransfer(); for(const f of fs2){ const bin=Uint8Array.from(atob(f.b),c=>c.charCodeAt(0)); dt.items.add(new File([bin],f.n,{type:f.t})); }
    const d=document.getElementById('drop'); for(const t of ['dragenter','dragover','drop']) d.dispatchEvent(new DragEvent(t,{dataTransfer:dt,bubbles:true,cancelable:true})); },fs2); };
// Gesäßtaschen-Kanten im Atlas (rechte Hälfte = Rückseite), wie tseiten
const taschen=()=>p.evaluate(async()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], im=new Image(); im.src=G.m3.atlas; await im.decode();
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const W=im.width/2, H=im.height, D=x.getImageData(0,0,im.width,H).data, Y=(xx,yy)=>{ const i=(yy*im.width+xx)*4; return .3*D[i]+.59*D[i+1]+.11*D[i+2]; };
  let s=0,n=0; for(let yy=Math.round(.1*H);yy<Math.round(.34*H);yy++) for(const [a,z] of [[.08,.45],[.55,.92]]) for(let xx=W+Math.round(a*W);xx<W+Math.round(z*W);xx++){ s+=Math.abs(Y(xx+1,yy)-Y(xx-1,yy))+Math.abs(Y(xx,yy+1)-Y(xx,yy-1)); n++; }
  return s/n; });

// 1) Beide Fotos auf einmal hineinziehen
const t0=Date.now(); await ziehen(FOTOS); const m=await fertig();
pruefe(/Fertig/.test(m),`Hose gebaut in ${((Date.now()-t0)/1000).toFixed(0)} s: ${m.slice(0,160)}`);
const liste=await p.evaluate(()=>[...document.querySelectorAll('#drop-list .dtxt b')].map(e=>e.textContent));
pruefe(liste.length===2&&/Vorderseite/.test(liste.join())&&/Rückseite/.test(liste.join()),`Vorder- und Rückseite erkannt: ${liste.join(' | ')}`);
pruefe(/Vorderseite: flach/.test(m)&&/Rückseite: flach/.test(m),'beide Fotos benutzt (Rückseite nicht geschätzt)');
const G0=await p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], D=d.garmentDims?d.garmentDims(G):null;
  return {key:d.g.key,rock:!!G.m3.rock,bad:G.bad||null,backEst:!!G.backEst,nr:G.m3.nr,vc:G.m3.vc,nv:d.g3.nv||0,meas:G.meas||null,waist:G.waist,len:G.len,D,label:G.label,
    liste:document.querySelector('#gwrap .gbtn[aria-pressed="true"]')?.innerText.replace(/\s+/g,' ')}; });
pruefe(!G0.bad&&!G0.rock,`Hose (kein Rock, nicht verworfen)${G0.bad?': '+G0.bad:''}`);
pruefe(!G0.backEst,'Rückseite aus dem Rückseiten-Foto (nicht geschätzt)');

// 2) Maße gegen die Bankkarte
const D=G0.D||{};
pruefe(Math.abs(D.len-ECHT.len)<=2,`Länge ${D.len?.toFixed(1)} cm (Maßband ${ECHT.len} ± 2)`);
pruefe(Math.abs(D.waist-ECHT.waist)<=2,`Bund flach ${D.waist?.toFixed(1)} cm (W32 ≈ ${ECHT.waist} ± 2)`);
pruefe(!D.est&&G0.meas&&/karte|card|a4/i.test(JSON.stringify(G0.meas)),`Maße aus der Bankkarte (${JSON.stringify(G0.meas)})`);
pruefe(/Bund 4\d/.test(G0.liste||''),`Hosenliste zeigt den gemessenen Bund: „${G0.liste}“`);

// 3) Form in der 3D-Ansicht: von vorn zwei Beine mit Spalt, kein Quader; von der Seite Tiefe
await p.evaluate(()=>document.getElementById('g3dbox').scrollIntoView({block:'start'}));
const ansicht=async(yaw,datei)=>{ await p.evaluate(y=>{ const v=window.__dbg.v3d; v.ziel=null; v.yaw=y; v.zoom=1; v.idle=performance.now()+1e7; },yaw); await p.waitForTimeout(1800);
  const bb=await p.evaluate(()=>{ const r=document.getElementById('g3dview').getBoundingClientRect(); return {x:r.x,y:Math.max(0,r.y),width:r.width,height:r.height}; });
  await p.screenshot({path:OUT+datei,clip:bb});
  // Umriss der Hose (Punkte der Hose im Bild der 3D-Ansicht, nur Hose: g3.c ist die Leinwand der Hose)
  return p.evaluate(()=>{ const c=window.__dbg.g3.c, W=c.width, H=c.height, t=document.createElement('canvas'); t.width=W; t.height=H; const x=t.getContext('2d'); x.drawImage(c,0,0);
    const d=x.getImageData(0,0,W,H).data, a=(i,j)=>d[(j*W+i)*4+3]>40; let y0=H,y1=-1,x0=W,x1=-1,n=0;
    for(let j=0;j<H;j++) for(let i=0;i<W;i++) if(a(i,j)){ n++; if(j<y0) y0=j; if(j>y1) y1=j; if(i<x0) x0=i; if(i>x1) x1=i; }
    const runs=j=>{ let r=0,inn=false; for(let i=0;i<W;i++){ const v=a(i,j); if(v&&!inn) r++; inn=v; } return r; };
    const zeilen=[.55,.65,.75,.85].map(f=>runs(Math.round(y0+f*(y1-y0))));
    return {w:x1-x0+1,h:y1-y0+1,fill:n/Math.max(1,(x1-x0+1)*(y1-y0+1)),zeilen}; }); };
const vorn=await ansicht(0,'vorn.png'), seite=await ansicht(Math.PI/2,'seite.png'), hinten=await ansicht(Math.PI,'hinten.png');
pruefe(vorn.zeilen.filter(z=>z>=2).length>=3,`von vorn zwei getrennte Beine (Teile je Zeile unten: ${vorn.zeilen.join(', ')})`);
pruefe(vorn.fill<.82,`kein Quader: Umriss füllt ${(100*vorn.fill).toFixed(0)} % seines Rahmens`);
pruefe(vorn.h/vorn.w>1.6&&vorn.h/vorn.w<3.6,`Seitenverhältnis von vorn ${(vorn.h/vorn.w).toFixed(2)} (Höhe/Breite)`);
pruefe(seite.w/vorn.w>.35&&seite.w/vorn.w<1.0,`Tiefe von der Seite ${(100*seite.w/vorn.w).toFixed(0)} % der Breite (räumlich, keine Scheibe)`);
pruefe(G0.nv>=1500,`genug Punkte im Netz: ${G0.nv}`);
// Rückseite: Gesäßtaschen deutlich sichtbarer als bei geschätzter Rückseite (gleiche Vorderseite allein gebaut)
const kMit=await taschen();
await p.evaluate(()=>document.getElementById('drop-new').click()); await ziehen([FOTOS[0]]); await fertig();
const kOhne=await taschen();
pruefe(kMit>1.3*kOhne,`Rückseite zeigt das Rückseiten-Foto: Taschenkanten ${kMit.toFixed(1)} gegen ${kOhne.toFixed(1)} geschätzt`);
// die geschätzte Hose wieder weg, die echte gewählt
await p.evaluate(k=>{ const d=window.__dbg; for(const q of Object.keys(d.GARMENTS)) if(q!==k) delete d.GARMENTS[q]; },G0.key);
await p.evaluate(k=>{ const b=document.querySelector(`#gwrap .gbtn[data-g="${k}"]`); if(b) b.click(); },G0.key);

// 4) Rig und Physik in der Anprobe (Attrappe): gerade stehen, dann Knie hoch → Hose am Knie verformt, Stoff schwingt nach
await p.evaluate(()=>Object.assign(window.__mode,{yaw:0,knee:0,kneeHigh:0,fersePo:0}));
await p.click('#quick').catch(async()=>{ await p.click('#start'); });
await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:20000}).catch(()=>{});
await p.waitForTimeout(1500);
const knie=()=>p.evaluate(()=>{ const g3=window.__dbg.g3, NR=g3.nr, C=g3.nRing/(4*NR), i=Math.round(NR*.72); let x=0,y=0,z=0,n=0;
  for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const k=((0*NR+i)*2+f)*C+j; x+=g3.pos[k*3]; y+=g3.pos[k*3+1]; z+=g3.pos[k*3+2]; n++; } return {x:x/n,y:y/n,z:z/n,ok:!!g3.cOk}; });
const gerade=await knie();
await p.evaluate(()=>{ window.__mode.kneeHigh=1; });
const verlauf=[]; for(let t=0;t<10;t++){ await p.waitForTimeout(120); verlauf.push(await knie()); }
await p.waitForTimeout(1500); const gebeugt=await knie();
const st=await p.$('#stage'); if(st) await st.screenshot({path:OUT+'bein-gebeugt.png'});
const weg=Math.hypot(gebeugt.x-gerade.x,gebeugt.y-gerade.y,gebeugt.z-gerade.z);
pruefe(weg>15,`Knie hoch verformt die Hose am Knie um ${weg.toFixed(0)} Bildpunkte (Rig aktiv)`);
// Physik: der Stoff folgt nicht sofort (Zwischenwerte zwischen gerade und gebeugt), kommt aber zur Ruhe
const zwischen=verlauf.filter(v=>{ const a=Math.hypot(v.x-gerade.x,v.y-gerade.y), e=Math.hypot(v.x-gebeugt.x,v.y-gebeugt.y); return a>3&&e>3; }).length;
pruefe(gebeugt.ok&&zwischen>=1,`Stoffphysik aktiv: ${zwischen} Zwischenbilder auf dem Weg, danach ruhig`);
await p.evaluate(()=>{ window.__mode.kneeHigh=0; });

pruefe(errs.length===0,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
console.log(`Bilder: ${path.relative(R,OUT)}/vorn.png, seite.png, hinten.png, bein-gebeugt.png${KI?'':' (ohne KI-Modell: Ersatz-Freistellung)'}`);
await b.close(); srv.close();
console.log(fehler?`${fehler} Fehler`:'Neue Hose in Ordnung'); process.exit(fehler?1:0);
