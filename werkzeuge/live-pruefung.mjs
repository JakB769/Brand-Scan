// Prüft nach jedem Deploy die LIVE-Seite: Ist jede Datei, die die App (vor allem der Avatar) braucht, online erreichbar (HTTP 200)
// und auf dem Stand des Repos? Hintergrund (18.11.): Live fehlte avatar/koerper.js, lokal lief alles.
// Aufruf: node werkzeuge/live-pruefung.mjs https://….netlify.app/   (oder LIVE_URL=… node werkzeuge/live-pruefung.mjs)
//         --ohne-extern: CDN- und Modell-Dateien (jsdelivr, Google) nicht prüfen
// Läuft automatisch: GitHub-Workflow live-pruefung (nach Push auf main und täglich, sobald die Repo-Variable LIVE_URL gesetzt ist).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const R=path.resolve(fileURLToPath(new URL('.',import.meta.url)),'..')+'/';
const argv=process.argv.slice(2), ohneExtern=argv.includes('--ohne-extern');
const roh=argv.find(a=>!a.startsWith('--'))||process.env.LIVE_URL;
if(!roh){ console.error('Live-Adresse fehlt: node werkzeuge/live-pruefung.mjs https://….netlify.app/'); process.exit(2); }
const LIVE=new URL(roh).href.replace(/\/?$/,'/');

// 1. Eigene Dateien: alles, was im Repo unter app/ liegt (index.html, hosen-auswahl.js, avatar/koerper.js …)
let eigene;
try{ eigene=execFileSync('git',['ls-files','app'],{cwd:R,encoding:'utf8'}).split('\n').filter(Boolean); }
catch{ eigene=[]; const lauf=d=>{ for(const e of fs.readdirSync(R+d,{withFileTypes:true})) e.isDirectory()?lauf(d+'/'+e.name):eigene.push(d+'/'+e.name); }; lauf('app'); }
// Pflicht für den Avatar, auch wenn sich die Liste oben einmal ändert
for(const f of ['app/index.html','app/avatar/koerper.js']) if(!eigene.includes(f)) eigene.push(f);

// 2. Fremde Dateien, die die Seite lädt (MediaPipe-Bibliothek und -Modelle, Hilfsbibliotheken)
const html=fs.readFileSync(R+'app/index.html','utf8');
const extern=new Set((html.match(/https:\/\/(?:cdn\.jsdelivr\.net|storage\.googleapis\.com)\/[^"'`\s)]+\.(?:mjs|js|task|tflite|wasm)/g)||[]).filter(u=>!/\/npm\/[^/]+$/.test(u)));   // nicht den bloßen Paketnamen (tesseract.js)
for(const m of html.matchAll(/forVisionTasks\("([^"]+\/wasm)"\)/g)) for(const f of ['vision_wasm_internal.js','vision_wasm_internal.wasm']) extern.add(m[1]+'/'+f);
const mp=html.match(/const MP_URL="([^"]+)"/); if(mp) extern.add(mp[1]+'/vision_bundle.mjs');

let fehler=0; const zeile=(ok,text)=>{ console.log((ok?'ok    ':'FEHLER')+' '+text); if(!ok) fehler++; };
const holen=async(url,versuche=3)=>{ for(let i=1;;i++){ try{ return await fetch(url,{cache:'no-store',redirect:'follow'}); }
  catch(e){ if(i>=versuche) throw e; await new Promise(r=>setTimeout(r,2000*i)); } } };
const sha=b=>crypto.createHash('sha256').update(b).digest('hex').slice(0,12);

console.log('Live-Prüfung '+LIVE);
await Promise.all(eigene.map(async f=>{
  const rel=f.replace(/^app\//,''), url=LIVE+(rel==='index.html'?'':rel.split('/').map(encodeURIComponent).join('/'));
  try{
    const r=await holen(url); const live=Buffer.from(await r.arrayBuffer());
    if(r.status!==200) return zeile(false,`${rel}: HTTP ${r.status} (${url})`);
    // Netlify liefert bei unbekannten Pfaden u. U. index.html aus: dann stimmt der Inhalt nicht
    const lokal=fs.existsSync(R+f)?fs.readFileSync(R+f):null;
    if(lokal&&!lokal.equals(live)) return zeile(false,`${rel}: online, aber anderer Stand als im Repo (live ${sha(live)} ${live.length} B, Repo ${sha(lokal)} ${lokal.length} B)`);
    zeile(true,`${rel}: HTTP 200, ${live.length} B, gleich wie im Repo`);
  }catch(e){ zeile(false,`${rel}: nicht erreichbar (${e.message})`); }
}));
if(!ohneExtern) await Promise.all([...extern].map(async url=>{
  try{ const r=await holen(url); await r.arrayBuffer(); zeile(r.status===200,`${url.replace(/^https:\/\//,'')}: HTTP ${r.status}`); }
  catch(e){ zeile(false,`${url}: nicht erreichbar (${e.message})`); }
}));
console.log(fehler?`${fehler} Fehler: Live-Seite unvollständig`:`Live-Seite vollständig (${eigene.length} eigene${ohneExtern?'':`, ${extern.size} fremde`} Dateien)`);
process.exit(fehler?1:0);
