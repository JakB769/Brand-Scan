// Größentabellen in anderen Formaten: Shops zeigen Maße oft erst nach Auswahl einer Größe, nur für diese (z. B. 34 oder 28/28)
// und nur zwei, drei Maße. Erkannt werden: Größen aus der Auswahl (auch Weite/Länge „28/30“, „W30/L32“), Maße mit Größe
// davor („Größe 30: Bund 40 cm, Länge 104 cm“, mehrere Maße in einer Zeile), Blöcke je Größe. Fehlende Größen werden über die
// üblichen Größensprünge hochgerechnet und als geschätzt markiert; volle Tabellen bleiben unverändert.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1000,height:1200}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(400);
const reihe=(text,ref=-1)=>p.evaluate(([t,r])=>{ const d=window.__dbg, T=d.parseSizeText(t), S=d.sizeSeries(T,r<0?0:r);
  const f=v=>v==null?null:Math.round(v*10)/10;
  return {sizes:T.sizes,ser:S?S.map(z=>({n:z.n,w:f(z.waist),l:f(z.len),h:f(z.hem),est:Object.keys(z.est).join(",")})):null,dims:T.sizes.map((_,k)=>{ const x=d.tableDims(T,k); return [f(x.waist),f(x.len)]; })}; },[text,ref]);
const z=(r,n)=>r.ser&&r.ser.find(e=>e.n===n);

// 1) Weite/Länge aus der Auswahl, Maße nur für 30/30 (in einer Zeile)
let r=await reihe('Größe auswählen\n28/30 30/30 32/30 34/30\nGröße 30/30: Bundweite 40 cm, Länge 104 cm');
pruefe(r.sizes.join()==='28/30,30/30,32/30,34/30','Größen Weite/Länge erkannt: '+r.sizes.join(' '));
pruefe(z(r,'30/30').w===40&&z(r,'30/30').l===104&&!z(r,'30/30').est,'30/30 gemessen: Bund 40, Länge 104');
pruefe(z(r,'28/30').w===37.5&&z(r,'34/30').w===45.1&&/waist/.test(z(r,'34/30').est),`hochgerechnet: 28/30 Bund ${z(r,'28/30').w}, 34/30 Bund ${z(r,'34/30').w} (1 Zoll Umfang je Weite), geschätzt markiert`);
pruefe(z(r,'34/30').l===107.2,'Länge wächst mit der Weite (Leibhöhe): 34/30 '+z(r,'34/30').l);
// 2) andere Länge L: zählt voll (2,54 cm je Zoll)
r=await reihe('Größen: W30/L30 W30/L32 W30/L34\nMaße für Größe W30/L32: Bundweite 40 cm Länge 106 cm');
pruefe(z(r,'30/30').l===100.9&&z(r,'30/34').l===111.1,`Länge je L: 30/30 ${z(r,'30/30').l}, 30/34 ${z(r,'30/34').l} cm (±5,08)`);
// 3) zwei Größen gemessen: deren Abstand gilt
r=await reihe('Größen 26 28 30 32 34 36\nGröße 28: Bund 38 cm, Länge 102 cm\nGröße 34: Bund 43 cm, Länge 106 cm');
pruefe(z(r,'30').w===39.7&&z(r,'36').w===44.7&&z(r,'26').w===36.3,`zwei Größen gemessen, Abstand daraus: 26 ${z(r,'26').w}, 30 ${z(r,'30').w}, 36 ${z(r,'36').w}`);
// 4) Buchstaben: 4 cm Umfang je Größe
r=await reihe('Größe S M L XL\nGröße M\nTaille (halbe) 40 cm\nLänge 105 cm');
pruefe(z(r,'S').w===38&&z(r,'XL').w===44&&z(r,'L').l===106,`Buchstaben: S ${z(r,'S').w}, XL ${z(r,'XL').w}, Länge L ${z(r,'L').l}`);
// 5) Maß ohne Größe: gilt für die Bezugsgröße, nicht für alle
r=await reihe('Größen 28 30 32\nBundweite 40 cm',1);
pruefe(r.dims.every(d=>d[0]==null)&&z(r,'30').w===40&&z(r,'28').est,'Maß ohne Größe: nicht für alle Größen, sondern für die Bezugsgröße (30), Rest geschätzt');
// 6) „Model trägt Größe 30“ ist keine Angabe, wofür die Maße gelten
r=await reihe('Größen 28 30 32\nDas Model trägt Größe 30.\nBundweite 40 cm',0);
pruefe(z(r,'28').w===40,'Model-Größe nicht als Bezug genommen (Bezug blieb die gewählte Größe)');
// 7) volle Tabelle: nichts geschätzt, Werte wie in der Tabelle
r=await reihe('Größe S M L\nBundweite 38 40 42 cm\nLänge 104 105 106 cm');
pruefe(r.ser.every(e=>!e.est)&&r.ser.map(e=>e.w).join()==='38,40,42','volle Tabelle unverändert, nichts geschätzt');
// 8) zwei Varianten nacheinander eingefügt (je ein Text): zusammengeführt
r=await reihe('Größe 30: Bundweite 40 cm\nGröße 32: Bundweite 42.5 cm');
pruefe(r.sizes.join()==='30,32'&&z(r,'32').w===42.5,'Maße zweier Varianten ohne Größenliste: '+r.sizes.join(' '));

// 9) ganzer Weg: Foto + Text mit Maßen nur für eine Größe → Größenknöpfe, hochgerechnete mit ≈
await p.setInputFiles('#drop-in',[fotos+'front.jpg',fotos+'back.jpg']);
for(let t=0;t<120;t++){ await p.waitForTimeout(500); if(/Fertig/.test(await p.evaluate(()=>document.getElementById('drop-msg').innerText))) break; }
await p.evaluate(()=>{ document.activeElement&&document.activeElement.blur(); const dt=new DataTransfer(); dt.setData('text/plain','Größe auswählen 28/32 30/32 32/32 34/32\nGröße 32/32: Bundweite 42 cm, Länge 108 cm'); document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true})); });
for(let t=0;t<120;t++){ await p.waitForTimeout(500); const m=await p.evaluate(()=>document.getElementById('drop-msg').innerText); if(/Fertig/.test(m)&&/hochgerechnet|Größe/.test(m)) break; }
const ui=await p.evaluate(()=>({chips:[...document.querySelectorAll('#g-szrow .szchip b')].map(e=>e.textContent),msg:document.getElementById('drop-msg').innerText,sz:document.getElementById('g-szmsg').innerText}));
console.log('Knöpfe:',ui.chips.join(' '));
pruefe(ui.chips.length===4&&ui.chips.filter(c=>c.startsWith('≈')).length===3&&ui.chips.includes('32'),'Größenknöpfe (gemeinsame Endung /32 weggelassen): 32 gemessen, drei mit ≈');
pruefe(/hochgerechnet/.test(ui.msg)&&/hochgerechnet/.test(ui.sz),'Hinweis „hochgerechnet (geschätzt)“ beim Hochladen und bei den Größen');
// 10) Screenshot nach Auswahl einer Größe: Maße ohne Größenangabe gelten für die gewählte; andere Größe gewählt → Maße wandern mit
await p.evaluate(()=>document.getElementById('drop-new').click());
await p.setInputFiles('#drop-in',[fotos+'front.jpg',fotos+'back.jpg']);
for(let t=0;t<120;t++){ await p.waitForTimeout(500); if(/Fertig/.test(await p.evaluate(()=>document.getElementById('drop-msg').innerText))) break; }
await p.evaluate(()=>{ document.activeElement&&document.activeElement.blur(); const dt=new DataTransfer(); dt.setData('text/plain','Größe\n28 30 32 34\nBundweite 43 cm\nAußenlänge 107 cm'); document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true})); });
const fertig2=async re=>{ for(let t=0;t<120;t++){ await p.waitForTimeout(500); const m=await p.evaluate(()=>document.getElementById('drop-msg').innerText); if(/Fertig/.test(m)&&re.test(m)) return m; } return p.evaluate(()=>document.getElementById('drop-msg').innerText); };
let m=await fertig2(/ohne Größenangabe/);
const gw=()=>p.evaluate(()=>{ const G=window.__dbg.GARMENTS[window.__dbg.g.key]; return {w:G.waist,l:G.len,est:(G.sizes||[]).map(z=>z.n+(z.est?'≈':'')).join(' ')}; });
let w=await gw();
pruefe(/gelten für Größe 30/.test(m)&&w.w===43&&w.est==='28≈ 30 32≈ 34≈','Maße ohne Größe gelten für die vorgewählte (30), Hinweis da: '+w.est);
await p.selectOption('#drop-size','3'); m=await fertig2(/gelten für Größe 34/); w=await gw();
pruefe(/gelten für Größe 34/.test(m)&&w.w===43&&w.est==='28≈ 30≈ 32≈ 34','andere Größe gewählt (34): Maße gelten jetzt für 34, Rest hochgerechnet: '+w.est);
pruefe(!errs.length,'keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await b.close();
if(fehler){ console.log(`${fehler} Fehler`); process.exit(1); }
