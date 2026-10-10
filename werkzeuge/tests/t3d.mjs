import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1600,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()!=='log')errs.push(m.text())});
await p.goto('file:///tmp/claude-0/-home-claude/a804ad08-a614-5654-a75e-ee517163ce6f/scratchpad/t3d.html');
console.log(await p.evaluate(()=>window.run()));
await p.screenshot({path:'/tmp/claude-0/-home-claude/a804ad08-a614-5654-a75e-ee517163ce6f/scratchpad/t3d.png'});
console.log(errs.length?'FEHLER: '+errs.join(' | '):'keine Fehler');
await b.close();
