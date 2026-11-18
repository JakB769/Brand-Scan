// Kern-Test 2 (22.10.): Oberteil und Unterteil zusammen. T-Shirt + Shorts und Trägertop + Rock über die beiden Bereiche
// „Oberteil hochladen“ und „Hose oder Rock hochladen“: Art richtig erkannt, Sitz nach den Metadaten (Shorts-Saum zwischen
// Oberschenkel und Knie, Rock nie bis zum Boden, T-Shirt über dem Bund), 3D am Standardkörper (179 cm) ohne Fehler.
// Renders nach werkzeuge/tests/ausgabe/outfit/ (oder --bilder <Ordner>).
//   node werkzeuge/tests/toutfit.mjs [--bilder <Ordner>]
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
const hier=fileURLToPath(new URL('.',import.meta.url)), R=path.resolve(hier,'../..')+'/', T=R+'material/testbilder/';
const arg=(n,d)=>{ const i=process.argv.indexOf('--'+n); return i<0?d:process.argv[i+1]; };
const AUS=path.resolve(arg('bilder',R+'werkzeuge/tests/ausgabe/outfit'))+'/'; fs.mkdirSync(AUS,{recursive:true});
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:900,height:1100}})).newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/GL Driver|KI im Test|Failed to load/.test(m.text())) errs.push(m.text()); });
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
await p.fill('#height','179'); await p.dispatchEvent('#height','change');
const oberteil=async(v,h)=>{ await p.evaluate(()=>{ document.getElementById('ot-msg').textContent=''; });
  if(h) await p.setInputFiles('#ot-hinten input',T+h); await p.setInputFiles('#ot-vorne input',T+v);
  await p.waitForFunction(()=>/Fertig|nicht|fehlt/.test(document.getElementById('ot-msg').textContent),null,{timeout:90000});
  return p.evaluate(()=>({msg:document.getElementById('ot-msg').textContent,art:window.__dbg.otAktiv()&&window.__dbg.otAktiv().artAuto})); };
const unterteil=async(v,h)=>{ await p.evaluate(()=>{ document.getElementById('drop-new').click(); });
  await p.setInputFiles('#slot-vorne input',T+v); await p.waitForTimeout(800); await p.setInputFiles('#slot-hinten input',T+h);
  // Fenster „Umriss prüfen“/Karte bestätigen, falls sie aufgehen; warten, bis die Hose fertig ist
  for(let t=0;t<240;t++){ await p.waitForTimeout(500);
    const o=await p.evaluate(()=>["refDlg","segDlg"].filter(i=>{ const d=document.getElementById(i); return d&&!d.hidden; }).join(","));
    if(/refDlg/.test(o)) await p.click('#refOk').catch(()=>{}); else if(/segDlg/.test(o)) await p.click('#segOk').catch(()=>{});
    const m=await p.evaluate(()=>document.getElementById('drop-msg').innerText); if(/Fertig/.test(m)&&!/wird|berechnet/.test(m)) break;
    if(t===239) console.log('Meldung:',m); }
  await p.waitForTimeout(600);
  return p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key], D=d.garmentDims(G), H=179, kat=[...document.querySelectorAll('#g-kat [data-kat]')].find(b=>b.getAttribute('aria-pressed')==='true');
    const bund=.5735*H+(G.m3.rock?d.PASSFORM.rockSitzCm:0);
    return {kat:kat&&kat.dataset.kat,rock:!!G.m3.rock,len:+D.len.toFixed(1),saum:+(bund-D.len).toFixed(1),est:D.est,msg:document.getElementById('drop-msg').innerText.split('\n').slice(-2).join(' / ')}; }); };
const ansichten=async(name)=>{ const box=await p.$('#g3dview'); await box.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  for(const [n,y] of [['vorn',0],['seite',Math.PI/2],['hinten',Math.PI]]){ await p.evaluate(y=>{ const v=window.__dbg.v3d; v.ziel=null; v.yaw=y; v.idle=performance.now()+1e7; },y);
    await p.waitForTimeout(1300); await box.screenshot({path:AUS+`${name}_${n}.png`}); } };
const ok3d=()=>p.evaluate(()=>{ const d=window.__dbg, O=d.otAktiv(), A=d.otKoerper(); if(!O||!A) return false; const V=d.otFuer(O,A); for(const x of V.P) if(!isFinite(x)) return false; return true; });

// 1. T-Shirt + Shorts
let o=await oberteil('oberteile/tshirt_vorne.jpg','oberteile/tshirt_hinten.jpg');
pruefe(o.art==='tshirt',`Oberteil-Bereich: ${o.msg}`);
let u=await unterteil('shorts/shorts_vorne.jpg','shorts/shorts_hinten.jpg');
const H=179, knie=.285*H, schritt=.45*H;
pruefe(u.kat==='shorts'&&!u.rock,`Hose-Bereich: als Shorts erkannt (Art „${u.kat}“), Länge ${u.len} cm`);
pruefe(u.saum>=.24*H-.5&&u.saum<=.42*H+.5,`Shorts-Saum ${u.saum} cm über dem Boden: zwischen unter dem Knie (${(.24*H).toFixed(0)}) und Oberschenkel (${(.42*H).toFixed(0)})`);
await p.waitForFunction(()=>!!(window.__dbg.otKoerper()),null,{timeout:30000}).catch(()=>{});
pruefe(await ok3d(),'T-Shirt-Vorlage am Standardkörper ohne ungültige Werte');
await ansichten('2a_tshirt_shorts');
// Art von Hand: Shorts → Hose (nur Metadaten) und zurück
await p.click('#g-kat [data-kat="hose"]'); await p.waitForTimeout(400);
const lang=await p.evaluate(()=>{ const d=window.__dbg, G=d.GARMENTS[d.g.key]; return +d.garmentDims(G).len.toFixed(1); });
pruefe(lang>u.len,`Art von Hand Shorts → Hose: geschätzte Länge ${u.len} → ${lang} cm (Saumbereich einer langen Hose)`);
await p.click('#g-kat [data-kat="shorts"]'); await p.waitForTimeout(300);
// 2. Trägertop + Rock
o=await oberteil('oberteile/top_vorne.jpg','oberteile/top_hinten.jpg');
pruefe(o.art==='top',`Oberteil-Bereich: ${o.msg}`);
u=await unterteil('rock/rock_vorne_guertel.jpg','rock/rock_hinten.jpg');
pruefe(u.kat==='rock'&&u.rock,`Hose-Bereich: als Rock erkannt, Länge ${u.len} cm (${u.est?'geschätzt':'gemessen'})`);
pruefe(u.saum>=.09*H-.5,`Rock-Saum ${u.saum} cm über dem Boden: nie bis zum Boden (mindestens ${(.09*H).toFixed(0)} cm)`);
pruefe(await ok3d(),'Top-Vorlage am Standardkörper ohne ungültige Werte');
await ansichten('2b_top_rock');
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+[...new Set(errs)].slice(0,3).join(' | '):''));
console.log(fehler?`${fehler} FEHLER`:'Outfit in Ordnung'); await b.close(); process.exit(fehler?1:0);
