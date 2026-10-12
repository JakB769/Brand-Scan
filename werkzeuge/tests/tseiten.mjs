// Vorder- und Rückseite: zwei beschriftete Felder, automatische Prüfung (Gesäßtaschen = hinten; vertauscht, zweimal dieselbe
// Seite, zweimal dasselbe Foto), Zuordnung ohne Hinweis im Dateinamen, nur Vorderseite → Rückseite geschätzt (ohne Schlitz,
// Knopf, Vordertaschen) und gekennzeichnet, auch nach dem Neuladen. Fotos: Bershka (vorne/hinten) und die Kartenfotos des
// Nutzers (Kartennummer unkenntlich, vorne/hinten derselben Jeans) und sein Foto IMG_7264 (vorne, HEIC).
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
const feld=async(side,f)=>{ await p.setInputFiles(`#slot-${side} input`,f); };
const neu=()=>p.evaluate(()=>document.getElementById('drop-new').click());
const slots=()=>p.evaluate(()=>['vorne','hinten'].map(s=>{ const e=document.getElementById('slot-'+s); return {txt:e.innerText.replace(/\n/g,' '),img:!!e.querySelector('img'),est:e.classList.contains('est')}; }));
const liste=()=>p.evaluate(()=>[...document.querySelectorAll('#drop-list .dtxt b')].map(e=>e.textContent));

// 1) Zwei Felder, richtig befüllt: keine Warnung, beide Bilder in den Feldern
let s=await slots(); pruefe(/Vorderseite/.test(s[0].txt)&&/Rückseite/.test(s[1].txt)&&!s[0].img&&!s[1].img,'zwei Felder: „Vorderseite“ und „Rückseite“');
await feld('vorne',fotos+'front.jpg'); await feld('hinten',fotos+'back.jpg'); let m=await fertig(); s=await slots();
pruefe(/Fertig/.test(m)&&!/vertauscht|Beide|dasselbe/.test(m)&&s[0].img&&s[1].img&&!s[1].est,'Bershka vorne/hinten in den Feldern: gebaut, keine Warnung, Bilder in den Feldern');
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
pruefe(l[0]==='Rückseite, flach'&&/^Vorderseite, flach/.test(l[1])&&!/vertauscht/.test(m),'ohne Namen, Rückseite zuerst: richtig zugeordnet ('+l.join(' | ')+')');
fs.rmSync(tmp,{recursive:true,force:true});
// 5) nur Vorderseite: Rückseite geschätzt, ohne Schlitz/Knopf/Taschen, gekennzeichnet
await neu(); await feld('vorne',fotos+'front.jpg'); m=await fertig(); s=await slots();
const G=await p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key]; return {est:G.backEst,key:d.g.key,sub:document.getElementById('g3dSub').textContent,msg:document.getElementById('g-msg').textContent}; });
pruefe(/Rückseite: geschätzt/.test(m)&&s[1].est&&/geschätzt/.test(s[1].txt)&&G.est===true,'nur Vorderseite: Rückseite „geschätzt“ (Meldung, Feld, Hose)');
pruefe(/Rückseite geschätzt/.test(G.sub)&&/Rückseite geschätzt/.test(G.msg),'Kennzeichnung an der 3D-Ansicht und in der Hosenkarte');
// Atlas: über dem Schritt hat die geschätzte Rückseite kaum noch starke Kanten (Schlitz, Knopf, Taschen weg)
const k=await p.evaluate(async()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], im=new Image(); im.src=G.m3.atlas; await im.decode();
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const W=im.width/2, H=im.height, D=x.getImageData(0,0,im.width,H).data, Y=(xx,yy)=>{ const i=(yy*im.width+xx)*4; return .3*D[i]+.59*D[i+1]+.11*D[i+2]; };
  const kant=(x0)=>{ let s=0,n=0; for(let yy=Math.round(.05*H);yy<Math.round(.3*H);yy++) for(let xx=x0+Math.round(.2*W);xx<x0+Math.round(.8*W);xx++){ s+=Math.abs(Y(xx+1,yy)-Y(xx-1,yy))+Math.abs(Y(xx,yy+1)-Y(xx,yy-1)); n++; } return s/n; };
  return {vorne:kant(0),hinten:kant(W)}; });
pruefe(k.hinten<.55*k.vorne,`geschätzte Rückseite über dem Schritt glatt: Kanten ${k.hinten.toFixed(1)} gegen ${k.vorne.toFixed(1)} vorne`);
await p.reload(); await p.waitForTimeout(600);
const nach=await p.evaluate(k=>{ const G=window.__dbg.GARMENTS[k]; return G&&G.backEst; },G.key);
pruefe(nach===true,'Kennzeichnung bleibt nach dem Neuladen');
// 6) Rückseite ins Feld nachgereicht: dieselbe Hose, jetzt mit echter Rückseite
await p.fill('#height','179'); await feld('vorne',fotos+'front.jpg'); await fertig(); const k1=await p.evaluate(()=>window.__dbg.g.key);
await feld('hinten',fotos+'back.jpg'); m=await fertig(); const z=await p.evaluate(()=>{ const d=window.__dbg; return {k:d.g.key,est:d.GARMENTS[d.g.key].backEst,n:d.UP.items.length}; });
pruefe(z.k===k1&&!z.est&&/Rückseite: flach/.test(m),'Rückseite nachgereicht: dieselbe Hose, Rückseite jetzt echt');
await (await p.$('#drop-slots')).screenshot({path:hier+'ausgabe/seiten_felder.png'});
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
