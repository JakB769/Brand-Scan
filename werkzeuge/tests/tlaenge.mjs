// Hosenlänge: Schätzung aus schrägen Fotos, mit und ohne Maßstab, und Vorrang der eingetragenen Länge.
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url)), tb=hier+'../../material/testbilder/', nm=hier+'../../node_modules/';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:1100,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept());
await p.route('**/heic-to@1.6.5/**',r=>r.fulfill({status:200,contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(nm+'heic-to/dist/heic-to.min.js')}));
let fehler=0; const pruefe=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
const bau=async(front,back,{waist='',len='',ref=''}={})=>{
  await p.setInputFiles('#own-front',front); await p.setInputFiles('#own-back',back?[back]:[]);
  await p.fill('#own-waist',waist); await p.fill('#own-len',len); await p.selectOption('#own-ref',ref); await p.click('#own-go');
  await p.waitForFunction(()=>/Fertig|nicht|ließ/.test(document.getElementById('own-msg').textContent),null,{timeout:90000});
  const t=await p.evaluate(()=>document.getElementById('own-msg').textContent), m=t.match(/Länge (\d+) cm/);
  return {t,L:m?+m[1]:null};
};
// 1. Maßstab im Foto: echte Länge 105 cm, gerade und 15° schräg, ohne Neigungsdaten
for(const f of ['a4_0grad','a4_15grad','card_0grad','card_15grad']){
  const r=await bau(tb+'massstab/'+f+'.jpg',null,{ref:f.startsWith('a4')?'a4':'card'});
  pruefe(r.L&&Math.abs(r.L/105-1)<=.05,`${f}: Länge ${r.L} cm (echt 105, ${r.L?((r.L/105-1)*100).toFixed(0):'?'} %)`+(r.L?'':' – '+r.t.slice(0,140)));
}
// 2. Deine Fotos (iPhone, schräg): Vorder- und Rückseite müssen nach dem Geraderechnen dasselbe Verhältnis liefern
const vo=await bau(tb+'echt/vorne_IMG_7264.HEIC',null,{waist:'40'}), hi=await bau(tb+'echt/hinten_IMG_7265.heic',null,{waist:'40'});
pruefe(/schräg fotografiert und wurde gerade gerechnet/.test(vo.t)&&/auf dem Kopf/.test(vo.t),'Vorderseite: Neigung erkannt und herausgerechnet, Foto gedreht');
pruefe(Math.abs(vo.L/hi.L-1)<.07,`Vorderseite ${vo.L} cm, Rückseite ${hi.L} cm bei Bund 40 (vorher 87 und 111)`);
const bd=await bau(tb+'echt/vorne_IMG_7264.HEIC',tb+'echt/hinten_IMG_7265.heic',{waist:'40'});
pruefe(bd.L>=97&&bd.L<=110&&!/Schritt nicht erkannt/.test(bd.t),`beide Fotos: ${bd.L} cm bei Bund 40, Schritt erkannt`);
// 3. Eingetragene Länge hat Vorrang: Modell genau so lang, Bund und Saum gehen mit
const r3=await bau(tb+'echt/vorne_IMG_7264.HEIC',tb+'echt/hinten_IMG_7265.heic',{len:'105'});
pruefe(r3.L===105&&/eingetragen/.test(r3.t),'Länge beim Anlegen eingetragen: '+r3.t.slice(0,90));
await p.click('#quick'); await p.waitForTimeout(3000); await p.click('#clean'); await p.waitForTimeout(800);
const zu=()=>p.evaluate(()=>{ const {g3,g,GARMENTS}=window.__dbg, G=GARMENTS[g.key], M=G.m3;
  return {lenPx:g3.lastLen, ppc:g3.lastPpc, felder:['g-len','g-waist','g-hemw'].map(i=>document.getElementById(i).value), tags:['t-len','t-waist','t-hem'].map(i=>document.getElementById(i).textContent)}; });
let z=await zu();
pruefe(z.tags.join()==='manuell,geschätzt,geschätzt','Kennzeichnung: '+z.tags.join(', '));
pruefe(Math.abs(z.lenPx/z.ppc-105)<1,`gezeichnete Länge ${(z.lenPx/z.ppc).toFixed(1)} cm bei eingetragenen 105 cm`);
const w105=+z.felder[1], h105=+z.felder[2];
await p.fill('#g-len','90'); await p.waitForTimeout(700); z=await zu();
pruefe(Math.abs(z.lenPx/z.ppc-90)<1&&Math.abs(+z.felder[1]/w105-90/105)<.02&&Math.abs(+z.felder[2]/h105-90/105)<.03,
  `Länge 90: gezeichnet ${(z.lenPx/z.ppc).toFixed(1)} cm, Bund ${z.felder[1]} (vorher ${w105}), Saum ${z.felder[2]} (vorher ${h105}) gehen mit`);
await p.fill('#g-waist','42'); await p.waitForTimeout(700); z=await zu();
pruefe(Math.abs(z.lenPx/z.ppc-90)<1&&z.tags.join()==='manuell,manuell,geschätzt','Bund eingetragen: Länge bleibt 90, Kennzeichnung '+z.tags.join(', '));
await p.click('.reset[data-k="len"]'); await p.waitForTimeout(700); z=await zu();
pruefe(z.tags[0]==='geschätzt'&&Math.abs(+z.felder[0]-42/ (w105/105))<3,`Länge zurück auf geschätzt: ${z.felder[0]} cm (aus Bund 42)`);
console.log(errs.length?'FEHLER: '+[...new Set(errs)].slice(0,5).join(' | '):'keine Skriptfehler');
await b.close();
if(fehler||errs.length) process.exit(1);
