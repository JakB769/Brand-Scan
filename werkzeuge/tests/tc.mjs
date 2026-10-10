import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const ctx=await b.newContext({permissions:['camera'],viewport:{width:390,height:780}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///tmp/claude-0/test.html'); await p.waitForTimeout(800);
await p.fill('#height','180');
const t0=Date.now(); await p.click('#start');
await p.waitForFunction(()=>document.querySelector('#video').videoWidth>0,{timeout:8000}).catch(()=>{});
const tCam=Date.now()-t0;
await p.waitForTimeout(2500);
const r=await p.evaluate(()=>({vw:document.querySelector('#video').videoWidth,
  hud:!document.querySelector('#hud').hidden, flipHidden:document.querySelector('#flip').hidden,
  fullSvg:!!document.querySelector('#full svg'), flipSvg:!!document.querySelector('#flip svg'),
  err:document.querySelector('#error').hidden?'':document.querySelector('#error').textContent.slice(0,70),
  big:document.querySelector('#coachBig').textContent}));
console.log(`Kamerabild nach ${tCam} ms (Breite ${r.vw}) · Bedienleiste sichtbar: ${r.hud}`);
console.log(`Wechsel-Knopf am Desktop versteckt: ${r.flipHidden} · Zeichen statt Text: Vollbild ${r.fullSvg}, Wechsel ${r.flipSvg}`);
console.log(`Meldung: "${r.big}" · Fehlerzeile: ${r.err||'–'}`);
await p.screenshot({path:'/home/claude/cut/ui.png'});
console.log(errs.length?'SEITENFEHLER: '+errs.join(' | '):'keine Skriptfehler');
await b.close();
