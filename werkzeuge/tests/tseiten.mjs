// Vorder- und Rückseite: zwei beschriftete Felder, automatische Prüfung (Gesäßtaschen = hinten; vertauscht, zweimal dieselbe
// Seite, zweimal dasselbe Foto), Zuordnung ohne Hinweis im Dateinamen, nur Vorderseite → Rückseite geschätzt (ohne Schlitz,
// Knopf, Vordertaschen) und gekennzeichnet, auch nach dem Neuladen. Fotos: Bershka (vorne/hinten) und die Kartenfotos des
// Nutzers (Kartennummer unkenntlich, vorne/hinten derselben Jeans) und sein Foto IMG_7264 (vorne, HEIC). Dazu: Rückseite geht
// nicht verloren (nacheinander hochgeladen, weichgezeichnet → ↪), Rückseite im Modell zeigt das Rückenfoto.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import path from 'path';
const hier=fileURLToPath(new URL('.',import.meta.url)), R=hier+'../../', nm=R+'node_modules/', fotos=R+'material/produktfotos/', echt=R+'material/testbilder/echt/';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1000,height:1300}})).newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver|ERR_|Failed to load/.test(m.text())) errs.push(m.text()); });
await p.route('**/heic-to@1.6.5/**',r=>r.fulfill({status:200,contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(nm+'heic-to/dist/heic-to.min.js')}));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
await p.fill('#height','179');
const msg=()=>p.evaluate(()=>document.getElementById('drop-msg').innerText.replace(/\n/g,' / '));
const fertig=async()=>{ for(let t=0;t<240;t++){ await p.waitForTimeout(500);
    if(await p.evaluate(()=>!document.getElementById('refDlg').hidden)){ await p.click('#refOk'); continue; }
    const m=await msg(); if(/Fertig|fehlt|keine realistische/.test(m)&&!/berechnet|wird/.test(m)&&await p.evaluate(()=>window.__dbg.UP.items.every(i=>i.kind!=='wait'))) return m; } return msg(); };
// wartet, bis das Foto im Feld angekommen ist (sonst las fertig() manchmal noch den Stand mit nur einem Foto)
const feld=async(side,f)=>{ const n=await p.evaluate(()=>window.__dbg.UP.gen||0); await p.setInputFiles(`#slot-${side} input`,f);
  await p.waitForFunction(([side,n])=>window.__dbg.UP.items.some(i=>i.fix===side)&&(window.__dbg.UP.gen||0)>n,[side,n],{timeout:30000}).catch(()=>{}); };
const neu=()=>p.evaluate(()=>document.getElementById('drop-new').click());
const slots=()=>p.evaluate(()=>['vorne','hinten'].map(s=>{ const e=document.getElementById('slot-'+s); return {txt:e.innerText.replace(/\n/g,' '),img:!!e.querySelector('img'),est:e.classList.contains('est')}; }));
const liste=()=>p.evaluate(()=>[...document.querySelectorAll('#drop-list .dtxt b')].map(e=>e.textContent));

// 1) Zwei Felder, richtig befüllt: keine Warnung, beide Bilder in den Feldern
let s=await slots(); pruefe(/Vorderseite/.test(s[0].txt)&&/Rückseite/.test(s[1].txt)&&!s[0].img&&!s[1].img,'zwei Felder: „Vorderseite“ und „Rückseite“');
await feld('vorne',fotos+'front.jpg'); await feld('hinten',fotos+'back.jpg'); let m=await fertig(); s=await slots();
pruefe(/Fertig/.test(m)&&!/vertauscht|Beide|dasselbe/.test(m)&&s[0].img&&s[1].img&&!s[1].est,'Bershka vorne/hinten in den Feldern: gebaut, keine Warnung, Bilder in den Feldern');
{ const sl=await p.evaluate(()=>{ const I=window.__dbg.UP.items, v=I.find(i=>i.side==='vorne'), h=I.find(i=>i.side==='hinten'); return [v&&v.dbg?v.dbg.slope:null,h&&h.dbg?h.dbg.slope:null]; });
  pruefe(sl[0]!=null&&sl[1]!=null&&sl[1]>sl[0]+.08,`Passe/Vordertaschen (Bershka): hinten ${sl[1]?.toFixed(2)}, vorne ${sl[0]?.toFixed(2)}`); }
// 2) vertauscht: Warnung
await neu(); await feld('vorne',fotos+'back.jpg'); await feld('hinten',fotos+'front.jpg'); m=await fertig();
pruefe(/vertauscht/.test(m),'vertauscht (Bershka): '+(m.match(/Vorder- und Rückseite vertauscht[^/]*/)||['keine Warnung'])[0]);
await neu(); await feld('vorne',echt+'karte_hinten_IMG_7268.jpg'); await feld('hinten',echt+'karte_vorne_IMG_7267.jpg'); m=await fertig();
pruefe(/vertauscht/.test(m),'vertauscht (Fotos des Nutzers): Warnung');
// ⇄ tauscht und die Warnung ist weg
await p.click('#drop-list .dsw'); m=await fertig(); pruefe(/Fertig/.test(m)&&!/vertauscht/.test(m),'nach ⇄: richtig herum, keine Warnung');
// 3) zweimal vorne (zwei verschiedene Fotos derselben Seite), zweimal hinten, zweimal dasselbe Foto
await neu(); await feld('vorne',echt+'vorne_IMG_7264.HEIC'); await feld('hinten',echt+'karte_vorne_IMG_7267.jpg'); m=await fertig();
pruefe(/Beide Fotos sehen wie die Vorderseite/.test(m),'zweimal vorne: Warnung');
await neu(); await feld('vorne',fotos+'back.jpg'); await feld('hinten',echt+'karte_hinten_IMG_7268.jpg'); m=await fertig();
pruefe(/Beide Fotos sehen wie die Rückseite|vertauscht/.test(m),'zweimal hinten: Warnung ('+(m.match(/(Beide[^/.]*|Vorder- und Rückseite vertauscht)/)||['keine'])[0]+')');
await neu(); await feld('vorne',fotos+'front.jpg'); await feld('hinten',fotos+'front.jpg'); m=await fertig();
pruefe(/dasselbe Foto/.test(m),'zweimal dasselbe Foto: Warnung');
// 4) ohne Hinweis im Dateinamen, Rückseite zuerst: Gesäßtaschen ordnen richtig zu
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'seiten-')); fs.copyFileSync(echt+'karte_hinten_IMG_7268.jpg',tmp+'/IMG_A.jpg'); fs.copyFileSync(echt+'karte_vorne_IMG_7267.jpg',tmp+'/IMG_B.jpg');
await neu(); await p.setInputFiles('#drop-in',[tmp+'/IMG_A.jpg',tmp+'/IMG_B.jpg']); m=await fertig(); let l=await liste();
// seit 19.10. findet die Ersatzsuche die Karte auch hinten (gleiche Karte wie vorne): „· Bankkarte als Maßstab“ dahinter erlaubt
pruefe(/^Rückseite, flach( · Bankkarte als Maßstab)?$/.test(l[0])&&/^Vorderseite, flach/.test(l[1])&&!/vertauscht/.test(m),'ohne Namen, Rückseite zuerst: richtig zugeordnet ('+l.join(' | ')+')');
// Passe (hinten) gegen Eingriff der Vordertaschen (sideSlope): schräge Nähte oben laufen hinten zur Mitte nach unten
const slope=()=>p.evaluate(()=>{ const I=window.__dbg.UP.items, v=I.find(i=>i.side==='vorne'), h=I.find(i=>i.side==='hinten'); return [v&&v.dbg?v.dbg.slope:null,h&&h.dbg?h.dbg.slope:null]; });
let sl=await slope(); pruefe(sl[0]!=null&&sl[1]!=null&&sl[1]>sl[0]+.08,`Passe/Vordertaschen (Fotos des Nutzers): hinten ${sl[1]?.toFixed(2)}, vorne ${sl[0]?.toFixed(2)}`);
fs.rmSync(tmp,{recursive:true,force:true});
// 5) nur Vorderseite: Rückseite geschätzt, ohne Schlitz/Knopf/Taschen, gekennzeichnet
await neu(); await feld('vorne',fotos+'front.jpg'); m=await fertig(); s=await slots();
const G=await p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key]; return {est:G.backEst,key:d.g.key,sub:document.getElementById('g3dSub').textContent,msg:document.getElementById('g-msg').textContent}; });
pruefe(/Rückseite: geschätzt/.test(m)&&s[1].est&&/geschätzt/.test(s[1].txt)&&G.est===true,'nur Vorderseite: Rückseite „geschätzt“ (Meldung, Feld, Hose)');
pruefe(/Rückseite geschätzt/.test(G.sub)&&/Rückseite geschätzt/.test(G.msg),'Kennzeichnung an der 3D-Ansicht und in der Hosenkarte');
// Atlas: über dem Schritt ist die geschätzte Rückseite keine Kopie der Vorderseite (Schlitz, Knopf, Vordertaschen weg). Seit 10.11.
// hat sie eigene Details und volle Körnung (rueckseiteHoch), Kanten allein sagen darum nichts mehr: Ähnlichkeit (Korrelation der
// Helligkeit) mit der gespiegelten Vorderseite muss gering sein, und Struktur muss da sein (nicht verwaschen)
const k=await p.evaluate(async()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], im=new Image(); im.src=G.m3.atlas; await im.decode();
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const W=im.width/2, H=im.height, D=x.getImageData(0,0,im.width,H).data, Y=(xx,yy)=>{ const i=(yy*im.width+xx)*4; return .3*D[i]+.59*D[i+1]+.11*D[i+2]; };
  const kant=(x0)=>{ let s=0,n=0; for(let yy=Math.round(.05*H);yy<Math.round(.3*H);yy++) for(let xx=x0+Math.round(.2*W);xx<x0+Math.round(.8*W);xx++){ s+=Math.abs(Y(xx+1,yy)-Y(xx-1,yy))+Math.abs(Y(xx,yy+1)-Y(xx,yy-1)); n++; } return s/n; };
  const a=[],b=[]; for(let yy=Math.round(.05*H);yy<Math.round(.3*H);yy+=2) for(let xx=Math.round(.2*W);xx<Math.round(.8*W);xx+=2){ a.push(Y(W-2-xx,yy)-Y(W-xx,yy)); b.push(Y(W+xx+1,yy)-Y(W+xx-1,yy)); }   // Ableitung: nur Einzelheiten, nicht der große Verlauf (Waschung bleibt gespiegelt)
  const m=v=>v.reduce((p,q)=>p+q,0)/v.length, ma=m(a), mb=m(b); let sab=0,saa=0,sbb=0; for(let i=0;i<a.length;i++){ sab+=(a[i]-ma)*(b[i]-mb); saa+=(a[i]-ma)**2; sbb+=(b[i]-mb)**2; }
  return {vorne:kant(0),hinten:kant(W),korr:sab/Math.sqrt(saa*sbb||1)}; });
pruefe(k.korr<.5&&k.hinten>.3*k.vorne,`geschätzte Rückseite über dem Schritt eigene Details, keine Kopie der Vorderseite: Ähnlichkeit ${k.korr.toFixed(2)}, Kanten ${k.hinten.toFixed(1)} gegen ${k.vorne.toFixed(1)} vorne`);
await p.reload(); await p.waitForTimeout(600);
const nach=await p.evaluate(k=>{ const G=window.__dbg.GARMENTS[k]; return G&&G.backEst; },G.key);
pruefe(nach===true,'Kennzeichnung bleibt nach dem Neuladen');
// 6) Rückseite ins Feld nachgereicht: dieselbe Hose, jetzt mit echter Rückseite
await p.fill('#height','179'); await feld('vorne',fotos+'front.jpg'); await fertig(); const k1=await p.evaluate(()=>window.__dbg.g.key);
await feld('hinten',fotos+'back.jpg'); m=await fertig(); const z=await p.evaluate(()=>{ const d=window.__dbg; return {k:d.g.key,est:d.GARMENTS[d.g.key].backEst,n:d.UP.items.length}; });
pruefe(z.k===k1&&!z.est&&/Rückseite: flach/.test(m),'Rückseite nachgereicht: dieselbe Hose, Rückseite jetzt echt');
await (await p.$('#drop-slots')).screenshot({path:hier+'ausgabe/seiten_felder.png'});

// 7) Rückseite darf nicht verloren gehen (12.10. abends: IMG_7268 wurde in Safari als „Foto mit Person, angeschnitten“
//    verworfen, das Modell bekam eine geschätzte Rückseite). Kanten im Gesäßtaschen-Bereich der Rückseite im fertigen Modell
//    (Atlas rechts) gegen die geschätzte Rückseite derselben Vorderseite: die echte zeigt die Taschen.
const taschen=()=>p.evaluate(async()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], im=new Image(); im.src=G.m3.atlas; await im.decode();
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const W=im.width/2, H=im.height, D=x.getImageData(0,0,im.width,H).data, Y=(xx,yy)=>{ const i=(yy*im.width+xx)*4; return .3*D[i]+.59*D[i+1]+.11*D[i+2]; };
  let s=0,n=0; for(let yy=Math.round(.1*H);yy<Math.round(.34*H);yy++) for(const [a,z] of [[.08,.45],[.55,.92]]) for(let xx=W+Math.round(a*W);xx<W+Math.round(z*W);xx++){ s+=Math.abs(Y(xx+1,yy)-Y(xx-1,yy))+Math.abs(Y(xx,yy+1)-Y(xx,yy-1)); n++; }
  return {k:s/n,est:!!G.backEst}; });
await neu(); await feld('vorne',echt+'karte_vorne_IMG_7267.jpg'); await fertig(); const ohne=await taschen();
// nacheinander in die allgemeine Ablage: erst vorne, dann hinten → dieselbe Hose mit echter Rückseite
await neu(); await p.setInputFiles('#drop-in',echt+'karte_vorne_IMG_7267.jpg'); await fertig(); const k7=await p.evaluate(()=>window.__dbg.g.key);
await p.setInputFiles('#drop-in',echt+'karte_hinten_IMG_7268.jpg'); m=await fertig(); l=await liste(); let mit=await taschen();
pruefe(/Rückseite: flach/.test(m)&&!mit.est&&l.length===2&&await p.evaluate(()=>window.__dbg.g.key)===k7,'nacheinander hochgeladen: dieselbe Hose, beide Fotos benutzt ('+l.join(' | ')+')');
// seit 10.11. bekommt auch die geschätzte Rückseite Taschen (rueckseiteHoch): dazu muss sie als geschätzt gekennzeichnet sein
pruefe(!mit.est&&ohne.est&&mit.k>1.1*ohne.k,`Rückseite des Modells zeigt das Rückenfoto: Taschenkanten ${mit.k.toFixed(1)} gegen ${ohne.k.toFixed(1)} bei geschätzter Rückseite (gekennzeichnet: ${mit.est}/${ohne.est})`);
// weichgezeichnetes Rückenfoto (sieht für die Hautregel glatt aus): wird nicht still verworfen, ↪ macht es zur Rückseite
await neu();
await p.evaluate(async(u)=>{ const im=new Image(); im.src=u; await im.decode(); const c=document.createElement('canvas'); c.width=im.width; c.height=im.height;
  const x=c.getContext('2d'); x.filter='blur(4px)'; x.drawImage(im,0,0); const bl=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));
  window.__weich=new File([bl],'IMG_X.jpg',{type:'image/jpeg'}); },'data:image/jpeg;base64,'+fs.readFileSync(echt+'karte_hinten_IMG_7268.jpg').toString('base64'));
await p.setInputFiles('#drop-in',echt+'karte_vorne_IMG_7267.jpg'); await fertig();
await p.evaluate(()=>{ const dt=new DataTransfer(); dt.items.add(window.__weich); window.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true})); });
m=await fertig(); l=await liste();
const weich=await p.evaluate(()=>window.__dbg.UP.items.find(i=>i.name==='IMG_X.jpg')), wk=weich&&weich.kind;
if(wk==='worn'){ pruefe(/als Foto mit Person eingestuft/.test(m)&&/↪/.test(l.join(' ')),'weichgezeichnetes Rückenfoto als Model-Foto eingestuft: Warnung und ↪ statt still verworfen');
  await p.click('#drop-list [data-back]'); m=await fertig(); }
mit=await taschen();
pruefe(/Rückseite: flach/.test(m)&&!mit.est,'weichgezeichnetes Rückenfoto wird Rückseite ('+(wk==='worn'?'nach ↪':'gleich erkannt')+')');
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
