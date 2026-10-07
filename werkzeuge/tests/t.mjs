import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const p=await b.newPage();
const errs=[];
p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await p.goto('file:///tmp/claude-0/test.html');
await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{
  const q=s=>document.querySelector(s);
  return {
    gbtn:document.querySelectorAll('.gbtn').length,
    gchips:document.querySelectorAll('#gchips .chip').length,
    chipTexte:[...document.querySelectorAll('#gchips .chip')].map(c=>c.textContent),
    flatVorher:q('#g-flat').value, fitVersteckt:q('#fitRead').hidden
  };
});
console.log('Teile-Kacheln:', r.gbtn, '· Chips im Bild:', r.gchips, r.chipTexte.join(' '));
console.log('Bundfeld vor Auswahl:', JSON.stringify(r.flatVorher), '· Passform versteckt:', r.fitVersteckt);
// Jeans antippen
await p.evaluate(()=>document.querySelector('#gchips .chip[data-g="jeans"]').click());
await p.waitForTimeout(400);
const r2=await p.evaluate(()=>({
  flat:document.querySelector('#g-flat').value,
  fitVersteckt:document.querySelector('#fitRead').hidden,
  gedrueckt:document.querySelector('#gchips .chip[data-g="jeans"]').getAttribute('aria-pressed'),
  kachel:document.querySelector('.gbtn[data-g="jeans"]').getAttribute('aria-pressed'),
  umfang:document.querySelector('#f-gc').textContent
}));
console.log('Nach Auswahl Jeans → Bund:', r2.flat, '· Passform sichtbar:', !r2.fitVersteckt,
            '· Chip aktiv:', r2.gedrueckt, '· Kachel aktiv:', r2.kachel);
console.log('Gerechneter Hüftumfang des Teils:', r2.umfang);
console.log(errs.length? 'FEHLER:\n'+errs.join('\n') : 'keine Konsolenfehler');
await b.close();
