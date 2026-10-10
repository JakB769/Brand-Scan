// Rückschritte aus der Gesamtprüfung vom 8.10.: Maßband-Taille, Komma, Prüfung beim Anlegen, Drehen beim Hochladen,
// links/rechts bei aufgerichteten Modellen, alter Speicherschlüssel, voller Speicher, Kartenfenster (Escape, kein Viereck),
// Drehknöpfe zurück auf gerade, kurze Hose mit eingetragenem Bund, Grafikspeicher entzogen.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), tb=hier+'../../material/testbilder/', fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver|ERR_|Failed to load/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('massScanDebug','0'); }); await p.reload(); await p.waitForTimeout(400);
const msg=()=>p.evaluate(()=>document.getElementById('own-msg').textContent);
const anzahl=()=>p.evaluate(()=>Object.keys(window.__dbg.GARMENTS).length);
const bau=async(front,back,{waist='',len='',name=''}={})=>{
  await p.setInputFiles('#own-front',front); await p.setInputFiles('#own-back',back?[back]:[]);
  await p.fill('#own-waist',waist); await p.fill('#own-len',len); await p.fill('#own-name',name); await p.selectOption('#own-ref','');
  await p.evaluate(()=>document.getElementById('own-msg').textContent=''); await p.click('#own-go');
  await p.waitForFunction(()=>/Fertig|ließ|klappt|bitte|Bitte|Abgebrochen/.test(document.getElementById('own-msg').textContent),null,{timeout:60000});
  return msg();
};
const setze=(id,v)=>p.evaluate(([id,v])=>{ const e=document.getElementById(id); e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); },[id,v]);

// 1) Maßband-Taille: Feld wird gelesen (früher doppelte id), Komma geht, Speichern ohne Scan stürzt nicht ab
await setze('t-waist','80,5');
const diff=await p.evaluate(()=>document.getElementById('diffBody').innerText);
await p.evaluate(()=>document.getElementById('save').click());
const reihe=await p.evaluate(()=>JSON.parse(localStorage.getItem('massScanSerie')||'[]').pop());
pruefe(/80\.5/.test(diff)&&reihe&&reihe.tapeWaist===80.5&&reihe.scanWaist===null,'Maßband-Taille 80,5 kommt in Vergleich und Messreihe an: '+JSON.stringify(reihe));

// 2) Anlegen: ungültiger Bund wird gemeldet statt still verworfen, Komma wird übernommen
let m=await bau(fotos+'front.jpg',fotos+'back.jpg',{waist:'999'});
pruefe(/Bund: bitte eine Zahl zwischen 20 und 80/.test(m)&&await anzahl()===0,'Bund 999 beim Anlegen: Meldung, keine Hose: '+m.slice(0,80));
m=await bau(fotos+'front.jpg',fotos+'back.jpg',{waist:'40,5',name:'Komma'});
let G=await p.evaluate(()=>{ const G=window.__dbg.GARMENTS[window.__dbg.g.key]; return {waist:G.waist,len:G.len}; });
pruefe(G.waist===40.5,'Bund „40,5“ beim Anlegen: '+G.waist);
await p.fill('#g-len','100,5'); await p.locator('#own-name').focus(); await p.waitForTimeout(300);
const feld=await p.evaluate(()=>[window.__dbg.GARMENTS[window.__dbg.g.key].len,document.getElementById('g-len').value]);
pruefe(feld[0]===100.5&&feld[1]==='100,5','Länge „100,5“ im Maßfeld: gespeichert '+feld[0]+', angezeigt '+feld[1]);
m=await bau(fotos+'front.jpg',null,{waist:'40',len:'200'});
pruefe(/Länge: bitte eine Zahl zwischen 30 und 150/.test(m),'Länge 200 beim Anlegen: Meldung');

// 3) Drehen beim Hochladen: quer → ein Schritt und „quer“; auf dem Kopf mit sich berührenden Säumen → gedreht, Schritt gefunden
m=await bau(tb+'problemfotos/quer.jpg',null,{waist:'40',name:'Quer'});
pruefe(/lag quer/.test(m)&&!/auf dem Kopf/.test(m),'Quer liegende Hose: '+(m.match(/Foto lag[^.]*/)||[''])[0]);
m=await bau(tb+'orientierung/mark_front_saumzu_kopf.jpg',tb+'orientierung/mark_back_saumzu_kopf.jpg',{waist:'40',name:'SaumzuKopf'});
const lh=+((m.match(/Leibhöhe (\d+)/)||[])[1]||0);
pruefe(/auf dem Kopf/.test(m)&&!/Schritt nicht erkannt/.test(m)&&lh>=40&&lh<=48,'Auf dem Kopf, Säume berühren sich: gedreht, Leibhöhe '+lh+' cm');

// 4) Kurze Hose bei eingetragenem Bund: die eingetragene Länge wird trotzdem genau gezeichnet
m=await bau(fotos+'front.jpg',fotos+'back.jpg',{waist:'40',len:'50',name:'Kurz'});
const kurz=await p.evaluate(()=>window.__dbg.GARMENTS[window.__dbg.g.key].len);
await p.click('#quick'); await p.waitForTimeout(500);
await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:30000});
await p.evaluate(()=>{ window.__mode.yaw=1.5; });
await p.waitForFunction(()=>document.getElementById('step-side').classList.contains('done'),null,{timeout:30000});
await p.evaluate(()=>{ window.__mode.yaw=0; }); await p.waitForTimeout(1500); await p.click('#clean'); await p.waitForTimeout(1200);
const gez=await p.evaluate(()=>window.__dbg.g3.lastLen/window.__dbg.g3.lastPpc);
pruefe(kurz===50&&Math.abs(gez-50)<1,`Länge 50 bei Bund 40: gezeichnet ${gez.toFixed(1)} cm`);

// 5) Drehknöpfe: viermal Z 90° ist wieder gerade und zählt nicht als gedreht
for(let i=0;i<4;i++){ await p.click('#g-rot button[data-r="z"]'); await p.waitForTimeout(150); }
const rot=await p.evaluate(()=>[window.__dbg.GARMENTS[window.__dbg.g.key].rot,document.getElementById('g-msg').textContent]);
pruefe(rot[0]===null&&rot[1]==='','Viermal Z 90°: nicht mehr gedreht');

// 6) Grafikspeicher entzogen: Hose wird danach neu angelegt und wieder gezeichnet
await p.evaluate(()=>window.__dbg.g3.gl.getExtension('WEBGL_lose_context').loseContext()); await p.waitForTimeout(1500);
const neu=await p.evaluate(()=>({ok:window.__dbg.g3.ok,tex:window.__dbg.g3.texReady,gl:!!window.__dbg.g3.gl&&!window.__dbg.g3.gl.isContextLost()}));
pruefe(neu.ok&&neu.tex&&neu.gl,'Nach Verlust des Grafikspeichers neu angelegt: '+JSON.stringify(neu));

// 7) Links/rechts: ein auf dem Kopf gespeichertes altes Modell (Atlas um 180° gedreht) wird beim Laden aufgerichtet,
//    der rote Fleck (vorne, linkes Bein des Trägers) liegt danach auf derselben Seite wie bei der richtigen Hose
const rot_x=()=>p.evaluate(()=>{ const c=document.getElementById('overlay'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  let sx=0,n=0; for(let i=0;i<d.length;i+=16){ if(d[i]>190&&d[i+1]<70&&d[i+2]<70){ sx+=(i/4)%c.width; n++; } } return n>20?sx/n/c.width:null; });
m=await bau(tb+'orientierung/mark_front.jpg',tb+'orientierung/mark_back.jpg',{waist:'40',name:'Markiert'});
const kM=await p.evaluate(()=>window.__dbg.g.key);
await p.evaluate(async k=>{
  const G=window.__dbg.GARMENTS[k], M=G.m3;
  const im=await new Promise(r=>{ const i=new Image(); i.onload=()=>r(i); i.src=M.atlas; });
  const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'), W=im.width, H=im.height;
  for(const h of [0,1]){ x.save(); x.translate(h*W/2+W/2,H); x.rotate(Math.PI); x.drawImage(im,h*W/2,0,W/2,H,0,0,W/2,H); x.restore(); }
  const N=JSON.parse(JSON.stringify(M)), rv=a=>a.slice().reverse(), r4=v=>+v.toFixed(4);
  N.atlas=c.toDataURL('image/jpeg',.9);
  N.hw=rv(M.hw); N.tv=rv(M.tv).map(t=>r4(1-t)); N.tvb=rv(M.tvb).map(t=>r4(1-t));
  N.f=rv(M.f).map(q=>[.5-q[3],.5-q[2],.5-q[1],.5-q[0]].map(r4)); N.b=rv(M.b).map(q=>[1.5-q[3],1.5-q[2],1.5-q[1],1.5-q[0]].map(r4));
  N.vc=+(1-M.vc).toFixed(3);
  const all=JSON.parse(localStorage.getItem('massScanHosen')); all.push({key:'altkopf',G:{...JSON.parse(JSON.stringify(G)),label:'AltKopf',m3:N,rot:null}});
  localStorage.setItem('massScanHosen',JSON.stringify(all)); },kM);
await p.reload(); await p.waitForTimeout(600);
await p.click('#quick'); await p.waitForTimeout(500);
await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:30000});
await p.evaluate(()=>{ window.__mode.yaw=1.5; });
await p.waitForFunction(()=>document.getElementById('step-side').classList.contains('done'),null,{timeout:30000});
await p.evaluate(()=>{ window.__mode.yaw=0; }); await p.waitForTimeout(1500); await p.click('#clean');
await p.click(`#gwrap .gbtn[data-g="${kM}"]`); await p.waitForTimeout(2500); const xM=await rot_x();
await p.click('#gwrap .gbtn[data-g="altkopf"]'); await p.waitForTimeout(2500); const xK=await rot_x();
const aufr=await p.evaluate(()=>window.__dbg.GARMENTS.altkopf.repaired);
pruefe(aufr&&xM!=null&&xK!=null&&Math.abs(xM-xK)<.03,`Aufgerichtetes altes Modell: roter Fleck bei ${xK&&xK.toFixed(2)}, richtige Hose ${xM&&xM.toFixed(2)} (Anteil der Bildbreite)`);
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/pruefung_altkopf.png'});

// 8) Kartenfenster: kein Viereck → „Passt“ gesperrt; Escape bricht ab, keine Hose, Knopf wieder frei
const vorher=await anzahl();
await p.setInputFiles('#own-front',tb+'echt/karte_vorne_IMG_7267.jpg'); await p.setInputFiles('#own-back',[]); await p.fill('#own-waist',''); await p.fill('#own-len','');
await p.selectOption('#own-ref','card'); await p.evaluate(()=>document.getElementById('own-msg').textContent=''); await p.click('#own-go');
await p.waitForSelector('#refDlg:not([hidden])',{timeout:120000}); await p.waitForTimeout(300);
const gesperrt=await p.evaluate(()=>document.getElementById('own-go').disabled);
await p.evaluate(()=>window.__refDlg.set([[100,100],[160,100],[220,100],[280,100]]));
const okAus=await p.evaluate(()=>[document.getElementById('refOk').disabled,document.getElementById('refTxt').textContent]);
pruefe(gesperrt&&okAus[0]&&/kein Viereck/.test(okAus[1]),'Vier Punkte auf einer Linie: „Passt“ gesperrt, Hinweis „kein Viereck“; Erstellen-Knopf während des Fensters gesperrt');
await p.keyboard.press('Escape'); await p.waitForTimeout(500);
const ab=await p.evaluate(()=>({zu:document.getElementById('refDlg').hidden,frei:!document.getElementById('own-go').disabled,msg:document.getElementById('own-msg').textContent}));
pruefe(ab.zu&&ab.frei&&/Abgebrochen/.test(ab.msg)&&await anzahl()===vorher,'Escape: Fenster zu, keine Hose, Knopf frei: '+ab.msg);

// 9) Alter Speicherschlüssel (Stand 7.10.) wird einmal übernommen und kommt nach dem Löschen nicht zurück
await p.evaluate(()=>{ const G=Object.values(window.__dbg.GARMENTS)[0]; localStorage.setItem('massScanHosen','[]');
  localStorage.setItem('massScanEigen',JSON.stringify({waist:40,G:{...JSON.parse(JSON.stringify(G)),label:'Alte Hose'}})); });
await p.reload(); await p.waitForTimeout(600);
const alt=await p.evaluate(()=>({n:Object.keys(window.__dbg.GARMENTS).length,eigen:localStorage.getItem('massScanEigen')}));
await p.click('#gwrap .gdel >> nth=0'); await p.click('#gwrap .gdel >> nth=0'); await p.waitForTimeout(300);
await p.reload(); await p.waitForTimeout(600);
pruefe(alt.n===1&&alt.eigen===null&&await anzahl()===0,'Alte Hose übernommen, alter Schlüssel gelöscht, nach dem Löschen bleibt sie weg');

// 10) Voller Speicher: neue Hose passt nicht mehr hinein, Löschen einer anderen wird trotzdem gespeichert
await bau(fotos+'front.jpg',fotos+'back.jpg',{waist:'40',name:'A'}); await bau(fotos+'front.jpg',null,{waist:'40',name:'B'});
await p.evaluate(()=>{ let s='x'.repeat(1<<16), i=0; try{ for(;;) localStorage.setItem('fueller'+(i++),s); }catch(_){}
  for(let k=1;k<40;k++){ try{ localStorage.setItem('fuellerK'+k,'x'.repeat(1<<(16-Math.min(k,15)))); }catch(_){} } });
m=await bau(fotos+'front.jpg',null,{waist:'40',name:'C'});
const voll=/Speicher im Gerät voll/.test(m);
const kA=await p.evaluate(()=>Object.entries(window.__dbg.GARMENTS).find(([,G])=>G.label==='A')[0]);
await p.click(`#gwrap .gdel[data-del="${kA}"]`); await p.click(`#gwrap .gdel[data-del="${kA}"]`); await p.waitForTimeout(300);
await p.reload(); await p.waitForTimeout(600);
const rest=await p.evaluate(()=>Object.values(window.__dbg.GARMENTS).map(G=>G.label).join(','));
pruefe(voll&&rest==='B','Speicher voll: Meldung beim Anlegen, gelöschte Hose bleibt gelöscht (übrig: '+rest+')');
await p.evaluate(()=>{ for(const k of Object.keys(localStorage)) if(k.startsWith('fueller')) localStorage.removeItem(k); });

console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(fehler||errs.length) process.exit(1);
