// Stoff und Physik: Stoffart aus der Materialangabe, Auswahl je Hose (bleibt nach Neuladen), stabile Physik bei
// langsamer Bildrate, mehr Nachschwingen und Durchhängen bei leichtem Stoff, Bund bleibt am Platz, Falten beim Stauchen.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const seite=process.argv[2]||hier+'testseite-mit-simulierter-person.html';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver|ERR_|Failed to load/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+seite); await p.waitForTimeout(500);
await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('massScanDebug','0'); }); await p.reload(); await p.waitForTimeout(400);

// 1) Stoffart aus Text (Deutsch und Englisch)
const faelle=[['98 % Baumwolle, 2 % Elasthan, Denim','stretch'],['100% cotton denim','jeans'],['100 % Leinen','leinen'],['55% linen 45% viscose','leinen'],
  ['100 % Viskose','fliessend'],['Satin, 97% Polyester 3% Elastane',''],['80% Baumwolle 20% Polyester, Sweat','sweat'],['Jogger fleece','sweat'],
  ['Schurwolle 70 %, Polyester 30 %','anzug'],['Cord, 100 % Baumwolle','cord'],['','jeans'],
  // aus echten Produktseiten (Recherche 8.10.): Schreibweisen, 1 % Elasthan, Futter nicht mitzählen, Viskose-Anteil
  ['Cotton 98%, Elastane 2% · Slim Jeans','stretch'],['94% Baumwolle, 5% Polyester, 1% Elasthan · 511 Slim Jeans','stretch'],
  ['Baumwolle (CO) 97 | Elasthan (EL) 3','stretch'],['Außenmaterial: 100% Schurwolle, Futter: 100% Viskose','anzug'],
  ['41% Baumwolle, 37% Polyester, 20% Viskose · Stoffhose','anzug'],['Linen 59%, Viscose 41%','leinen'],
  ['53% Elastomultiester, 47% recycled polyester · ABC Jogger Warpstreme','anzug'],['Texas Straight Medium Stretch Jean','stretch']];
const erkannt=await p.evaluate(f=>f.map(([t])=>window.__dbg.stoffAusText(t)),faelle);
faelle.forEach(([t,soll],i)=>{ if(soll) pruefe(erkannt[i].key===soll,`„${t||'(leer)'}“ → ${erkannt[i].key} (${erkannt[i].grund})`); });
// Nur „100 % Baumwolle“: Jeans ist am häufigsten, aber nur geraten (Formular zeigt „geraten“, Chino von Hand wählbar)
{ const r=await p.evaluate(()=>window.__dbg.stoffAusText('100 % Baumwolle'));
  pruefe(r.key==='jeans'&&r.sicher===false,`„100 % Baumwolle“ → ${r.key}, ${r.sicher?'sicher':'geraten'}`); }

// 2) Hose mit Material anlegen: automatisch erkannt, von Hand änderbar, bleibt nach Neuladen
await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg'); await p.fill('#own-waist','40');
await p.fill('#own-mat','100 % Viskose'); await p.click('#own-go');
await p.waitForFunction(()=>/Fertig/.test(document.getElementById('own-msg').textContent),null,{timeout:120000});
const k=await p.evaluate(()=>window.__dbg.g.key);
let st=await p.evaluate(()=>({sel:document.getElementById('g-fab').value,tag:document.getElementById('tag-fab').textContent,mat:window.__dbg.GARMENTS[window.__dbg.g.key].material}));
pruefe(st.sel===''&&st.tag==='aus Material'&&st.mat==='100 % Viskose','Material beim Anlegen übernommen, Stoff automatisch: '+JSON.stringify(st));
await p.selectOption('#g-fab','chino'); await p.waitForTimeout(200); await p.reload(); await p.waitForTimeout(600);
await p.click(`#gwrap .gbtn[data-g="${k}"]`); await p.waitForTimeout(300);
st=await p.evaluate(()=>({sel:document.getElementById('g-fab').value,tag:document.getElementById('tag-fab').textContent}));
pruefe(st.sel==='chino'&&st.tag==='manuell','Stoff von Hand gewählt, bleibt nach Neuladen: '+JSON.stringify(st));

// 3) Anprobe: Physik je Stoff
await p.click('#quick'); await p.waitForTimeout(500);
await p.waitForFunction(()=>document.getElementById('step-cal').classList.contains('done'),null,{timeout:30000});
await p.evaluate(()=>{ window.__mode.yaw=1.5; });
await p.waitForFunction(()=>document.getElementById('step-side').classList.contains('done'),null,{timeout:30000});
await p.evaluate(()=>{ window.__mode.yaw=0; }); await p.waitForTimeout(800); await p.click('#clean');
const zeile=(i,feld='pos')=>p.evaluate(([i,feld])=>{ const g3=window.__dbg.g3, NR=g3.nr, C=13, X=g3[feld]; let x=0,y=0,n=0;
  for(let s=0;s<2;s++) for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const q=(((s*NR+i)*2+f)*C+j)*3; x+=X[q]; y+=X[q+1]; n++; } return [x/n,y/n]; },[i,feld]);
const messen=async fab=>{
  await p.selectOption('#g-fab',fab); await p.evaluate(()=>Object.assign(window.__mode,{sway:1,knee:0,yaw:0})); await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>new Promise(res=>{ const g3=window.__dbg.g3, out=[], t0=performance.now();
    const f=()=>{ const NR=g3.nr, C=13, X=g3.cx, T=g3.tg; let dx=0,n=0,bad=false, top=0;
        for(let s=0;s<2;s++) for(let ff=0;ff<2;ff++) for(let j=0;j<C;j++){ const q=(((s*NR+NR-1)*2+ff)*C+j)*3, h=(((s*NR+2)*2+ff)*C+j)*3; dx+=X[q]-X[h]; n++;
          if(!isFinite(X[q])||!isFinite(X[q+1])) bad=true; top=Math.max(top,Math.hypot(X[h]-T[h],X[h+1]-T[h+1])); }
        out.push([dx/n,bad,top]);
      if(performance.now()-t0<3000) requestAnimationFrame(f); else res(out); }; requestAnimationFrame(f); }));
  const d=r.map(v=>v[0]), amp=(Math.max(...d)-Math.min(...d))/2;
  await p.evaluate(()=>Object.assign(window.__mode,{sway:0,knee:1,yaw:.4})); await p.waitForTimeout(2500);
  // Unterseite des angehobenen Oberschenkels (linkes Bein, s=0): wie weit hängt der Stoff dort unter die Form vom Skelett?
  const knie=[0,await p.evaluate(()=>{ const g3=window.__dbg.g3, NR=g3.nr, C=13, X=g3.cx, T=g3.pos0||null; let m=0;
    for(let i=g3.ic;i<g3.ic+18&&i<NR;i++) for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const q=(((0*NR+i)*2+f)*C+j)*3; m=Math.max(m,g3.tg[q+1]-g3.tgRoh[q+1]); } return m; })];
  await p.evaluate(()=>Object.assign(window.__mode,{sway:0,knee:0,yaw:0})); await p.waitForTimeout(600);
  return {amp,nan:r.some(v=>v[1]),bund:Math.max(...r.map(v=>v[2])),saumY:knie[1]};
};
const fest=await messen('stretch'), leicht=await messen('fliessend');
pruefe(!fest.nan&&!leicht.nan,'Physik ohne ungültige Werte');
pruefe(leicht.amp>fest.amp*2,`Fließender Stoff schwingt mehr nach: ±${leicht.amp.toFixed(1)} px statt ±${fest.amp.toFixed(1)} px (Stretch-Jeans)`);
pruefe(leicht.saumY>fest.saumY*2&&leicht.saumY>3,`Knie hoch: fließender Stoff hängt unter dem Oberschenkel weiter durch (${leicht.saumY.toFixed(1)} statt ${fest.saumY.toFixed(1)} px)`);
pruefe(fest.bund<1.5&&leicht.bund<1.5,`Bund bleibt am Platz (größte Abweichung ${Math.max(fest.bund,leicht.bund).toFixed(2)} px)`);

// 4) Langsames Gerät: 10 Bilder pro Sekunde dürfen die Physik nicht aufschaukeln (früher: Bund löste sich)
await p.evaluate(()=>{ const raf=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=cb=>setTimeout(()=>raf(cb),90); });
await p.selectOption('#g-fab','jeans'); await p.evaluate(()=>Object.assign(window.__mode,{sway:0,knee:0,yaw:.8})); await p.waitForTimeout(3000);
const ab=await p.evaluate(()=>{ const g3=window.__dbg.g3, X=g3.cx, T=g3.tg; let m=0; for(let q=0;q<g3.nRing*3;q+=3) m=Math.max(m,Math.hypot(X[q]-T[q],X[q+1]-T[q+1],X[q+2]-T[q+2])); return m/window.__dbg.g3.lastPpc; });
// Steht die Person still, weicht der Stoff nur dort ab, wo die Beinkapseln ihn an der Leiste nach außen schieben (~0,5 cm).
// Die alte, explizite Rechnung schaukelte sich hier bis zur Grenze (3 cm) oder zu ungültigen Werten auf.
pruefe(ab<1,`10 Bilder/s, Person steht still: Stoff liegt ruhig (größte Abweichung ${ab.toFixed(2)} cm)`);

// 5) Falten beim Stauchen: Hose länger als das Bein → Falten am Saum (Normalen wechseln die Richtung)
const falten=await p.evaluate(()=>{ const g3=window.__dbg.g3; return g3.amp?Array.from(g3.amp).filter(a=>Math.abs(a)>.5).length:0; });
pruefe(falten>20,`Stauchfalten am Saum vorhanden (${falten} Punkte ausgelenkt)`);
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/stoff_jeans.png'});

console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(fehler||errs.length) process.exit(1);
