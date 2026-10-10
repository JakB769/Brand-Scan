import { chromium } from 'playwright';
const b=await chromium.launch(); const p=await b.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
await p.goto('file:///tmp/claude-0/test.html'); await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{
  document.querySelector('#gchips .chip[data-g="jeans"]').click();
  return {chips:document.querySelectorAll('#gchips .chip').length,
          flat:document.querySelector('#g-flat').value,
          rigSchalter:!!document.querySelector('#g-rig'),
          rigAn:document.querySelector('#g-rig')?.checked};
});
console.log('Chips:',r.chips,'· Bund:',r.flat,'· Skelett-Schalter:',r.rigSchalter,'· an:',r.rigAn);
console.log(errs.length?'FEHLER: '+errs.join(' | '):'keine Fehler');
await b.close();
