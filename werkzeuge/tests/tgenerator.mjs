// Ganzer Generator auf allen Testuntergründen: liest er dieselben Maße wie auf weißem Grund?
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url));
const dir=hier+'../../material/testbilder/freistellung/';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext()).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+hier+'testseite-mit-simulierter-person.html'); await p.waitForTimeout(500);
const zahlen=t=>{ const m=t.match(/Länge (\d+) cm, Leibhöhe (\d+) cm, ein Hosenbein flach oben (\d+) cm und unten (\d+) cm/); return m?m.slice(1).map(Number):null; };
let basis=null, schlecht=0;
for(const [n,f] of [['weiß',hier+'../../material/produktfotos/front.jpg'],...['parkett','teppich','bettdecke','dunkel','fliesen'].map(x=>[x,dir+x+'.jpg'])]){
  await p.setInputFiles('#own-front',f); await p.setInputFiles('#own-back',[]);
  await p.fill('#own-name',n); await p.fill('#own-waist','40'); await p.click('#own-go'); await p.waitForTimeout(2500);
  const t=await p.evaluate(()=>document.getElementById('own-msg').textContent), z=zahlen(t);
  if(!z){ console.log(n.padEnd(10),'FEHLER:',t); schlecht++; continue; }
  const warn=/ACHTUNG/.test(t);
  if(!basis) basis=z;
  const ab=z.map((v,i)=>Math.abs(v/basis[i]-1)), max=Math.max(...ab), ok=max<=.06;
  // Bekannte Grenze: dunkle Nähte auf fast schwarzem Boden. Dort muss die Seite wenigstens warnen.
  const grenze=n==='dunkel'&&!ok&&warn;
  if(!ok&&!grenze) schlecht++;
  if(ok&&warn){ schlecht++; console.log('   unnötige Warnung'); }
  console.log(n.padEnd(10),'Länge',z[0],'Leibhöhe',z[1],'Bein oben',z[2],'unten',z[3],'cm  größte Abweichung',(max*100).toFixed(0)+' %',ok?'':grenze?' ← bekannte Grenze, Seite warnt':' ← zu ungenau');
}
await b.close();
console.log(schlecht?`FEHLER: ${schlecht} Untergründe liefern andere Maße`:'Maße auf allen Untergründen wie auf weißem Grund (±6 %)');
console.log(errs.length?'FEHLER: '+errs.join(' | '):'keine Skriptfehler');
if(schlecht||errs.length) process.exit(1);
