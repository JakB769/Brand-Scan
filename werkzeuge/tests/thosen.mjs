// Hosen löschen und Maße je Hose (Länge, Bund, Saum): wirken live, Unsinn wird abgefangen, nichts geht kaputt.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url));
const fotos=hier+'../../material/produktfotos/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/GL Driver|ERR_|Failed to load/.test(m.text()))errs.push(m.text())});
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
for(const [n,w] of [['Erste','40'],['Zweite','44'],['Dritte','38']]){
  await p.setInputFiles('#own-front',fotos+'front.jpg'); await p.setInputFiles('#own-back',fotos+'back.jpg');
  await p.fill('#own-name',n); await p.fill('#own-waist',w); await p.click('#own-go'); await p.waitForTimeout(1500);
}
await p.click('#quick'); await p.waitForTimeout(3000); await p.click('#clean'); await p.waitForTimeout(800);
// Ausgewählt ist die zuletzt erstellte („Dritte“). Gezeichnete Länge und Saumbreite in Bildpunkten messen
const form=()=>p.evaluate(()=>{ const {g3,g,GARMENTS}=window.__dbg, M=(g3.M||GARMENTS[g.key].m3), C=13, NR=M.nr, pos=g3.pos;
  const pt=(s,i,f,j)=>{ const k=(((s*NR+i)*2+f)*C+j)*3; return [pos[k],pos[k+1]]; };
  let lo=1e9,hi=-1e9; for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const x=pt(0,NR-1,f,j)[0]; lo=Math.min(lo,x); hi=Math.max(hi,x); }
  return {len:pt(0,NR-1,0,0)[1]-pt(0,0,0,6)[1], saum:hi-lo, bund:Math.abs(pt(0,0,0,C-1)[0]-pt(1,0,0,C-1)[0]), key:g.key};
});
const felder=()=>p.evaluate(()=>['g-len','g-waist','g-hemw'].map(i=>document.getElementById(i).value.replace(',','.')));
const f0=await felder(); pruefe(f0.every(v=>+v>0),'Felder vorbelegt: Länge '+f0[0]+', Bund '+f0[1]+', Saum '+f0[2]+' cm');
const a=await form();
// Beide Längen enden über dem Boden (bodenlange Hosen stauchen sich absichtlich am Knöchel). Länge ändert nur die Beine:
// erwartet ist also, dass die Strecke vom Schritt zum Saum im selben Verhältnis wächst wie Länge minus Leibhöhe.
const beinS=()=>p.evaluate(()=>{ const {g3,g,GARMENTS}=window.__dbg, M=(g3.M||GARMENTS[g.key].m3), C=13, NR=M.nr, ic=g3.ic, k=i=>(((0*NR+i)*2+0)*C)*3+1; return g3.pos[k(NR-1)]-g3.pos[k(ic)]; });
await p.fill('#g-len','80'); await p.waitForTimeout(600); const l80=await beinS();
await p.fill('#g-len','70'); await p.waitForTimeout(600); const l70=await beinS(); const bL=await form();
// Schritt sitzt am Körper (Leibhöhe wie gezeichnet, g3.form.leib), nicht bei der flachen Leibhöhe aus dem Foto
const soll=await p.evaluate(()=>{ const crow=window.__dbg.g3.form.leib; return (70-crow)/(80-crow); });
pruefe(Math.abs(l70/l80/soll-1)<.03&&Math.abs(bL.saum/a.saum-1)<.03,`Länge 80 → 70 cm: Bein ${(l70/l80*100).toFixed(0)} % (soll ${(soll*100).toFixed(0)} %), Saum bleibt ${(bL.saum/a.saum*100).toFixed(0)} %`);
await p.fill('#g-hemw',String(+f0[2]*1.25)); await p.waitForTimeout(600); const bS=await form();
pruefe(Math.abs(bS.saum/a.saum-1.25)<.06,`Saum +25 %: gezeichnet ${(bS.saum/a.saum*100).toFixed(0)} %`);
await p.fill('#g-waist',String(+f0[1]*1.1)); await p.waitForTimeout(600); const bW=await form();
pruefe(Math.abs(bW.bund/bS.bund-1.1)<.05&&Math.abs(bW.len/bS.len-1)<.03,`Bund +10 %: Bund ${(bW.bund/bS.bund*100).toFixed(0)} %, Länge bleibt ${(bW.len/bS.len*100).toFixed(0)} %`);
for(const [id,v] of [['#g-len',''],['#g-len','-5'],['#g-waist','500'],['#g-hemw','0'],['#g-hemw','abc'],['#g-len','20']]){
  await p.evaluate(([i,x])=>{ const el=document.querySelector(i); el.focus(); el.value=x; el.dispatchEvent(new Event('input')); },[id,v]); await p.waitForTimeout(300); const c=await form();
  const bad=await p.evaluate(i=>document.querySelector(i).classList.contains('bad'),id);
  pruefe(Math.abs(c.len/bW.len-1)<.01&&Math.abs(c.saum/bW.saum-1)<.01&&Math.abs(c.bund/bW.bund-1)<.01&&bad,`ungültig ${id}="${v}": Hose unverändert, Feld rot markiert`);
}
await p.evaluate(()=>{ const b=document.querySelector('#gwrap .gbtn[aria-pressed=true]'); if(b) b.click(); }); await p.waitForTimeout(200);   // Hose abwählen
// andere Hose wählen: eigene Werte, keine von der vorigen
await p.click('#gwrap .gbtn >> nth=0'); await p.waitForTimeout(300); const fE=await felder();
pruefe(fE[1]==='40'&&fE[0]!=='70','Jede Hose hat eigene Werte: Erste hat Bund '+fE[1]+', Länge '+fE[0]);
await p.reload(); await p.waitForTimeout(600);
const nach=await p.evaluate(()=>Object.values(window.__dbg.GARMENTS).map(G=>[G.label,G.waist,G.len,G.hem]));
pruefe(nach[2][2]===70,'Werte bleiben nach Neuladen: '+JSON.stringify(nach));
// Löschen: angezeigte Hose löschen → andere wird angezeigt, Grafik der gelöschten freigegeben
await p.click('#quick'); await p.waitForTimeout(2500); await p.click('#clean');
await p.click('#gwrap .gbtn >> nth=1'); await p.waitForTimeout(1200);
const k1=await p.evaluate(()=>window.__dbg.g.key);
// Erster Tipp fragt nur nach, Verlassen setzt zurück; erst der zweite Tipp löscht
await p.click(`#gwrap .gdel[data-del="${k1}"]`); await p.waitForTimeout(200);
const frage=await p.evaluate(k=>({n:Object.keys(window.__dbg.GARMENTS).length,txt:document.querySelector(`#gwrap .gdel[data-del="${k}"]`).textContent}),k1);
await p.focus('#own-name'); await p.waitForTimeout(100);
const zurueck=await p.evaluate(k=>document.querySelector(`#gwrap .gdel[data-del="${k}"]`).textContent,k1);
pruefe(frage.n===3&&frage.txt==='Löschen?'&&zurueck==='✕','Löschen fragt erst nach und lässt sich abbrechen: '+JSON.stringify(frage)+' danach '+zurueck);
await p.click(`#gwrap .gdel[data-del="${k1}"]`); await p.click(`#gwrap .gdel[data-del="${k1}"]`); await p.waitForTimeout(1200);
const fokus=await p.evaluate(()=>document.activeElement.className);
pruefe(fokus.includes('gdel'),'Fokus bleibt nach dem Löschen in der Liste: '+fokus);
const s1=await p.evaluate(()=>({key:window.__dbg.g.key,n:Object.keys(window.__dbg.GARMENTS).length,g3:window.__dbg.g3.key,liste:document.querySelectorAll('#gwrap .gitem').length,chips:document.querySelectorAll('#gchips .chip').length}));
pruefe(s1.n===2&&s1.liste===2&&s1.chips===3&&s1.key&&s1.key!==k1&&s1.g3===s1.key,'Angezeigte Hose gelöscht: andere wird angezeigt '+JSON.stringify(s1));
for(let n=0;n<2;n++){ await p.click('#gwrap .gdel >> nth=0'); await p.click('#gwrap .gdel >> nth=0'); await p.waitForTimeout(700); }
const s2=await p.evaluate(()=>({key:window.__dbg.g.key,n:Object.keys(window.__dbg.GARMENTS).length,vb:window.__dbg.g3.vb,tex:window.__dbg.g3.tex,speicher:localStorage.getItem('massScanHosen'),felder:document.getElementById('g-len').disabled}));
pruefe(s2.n===0&&!s2.key&&!s2.vb&&!s2.tex&&s2.speicher==='[]'&&s2.felder,'Alle gelöscht: nichts angezeigt, Grafikspeicher frei, Gerätespeicher leer');
await (await p.$('#stage')).screenshot({path:hier+'ausgabe/hosen_leer.png'});
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(fehler||errs.length) process.exit(1);
