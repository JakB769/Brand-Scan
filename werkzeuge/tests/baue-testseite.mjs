// Erzeugt die Testseite aus app/index.html: MediaPipe wird durch eine simulierte Person ersetzt.
// Aufruf: node werkzeuge/tests/baue-testseite.mjs (läuft auch automatisch vor npm test)
import fs from 'fs';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url));
let s=fs.readFileSync(hier+'../../app/index.html','utf8');
const ersetze=(alt,neu)=>{ if(!s.includes(alt)) throw new Error('Stelle nicht gefunden: '+alt.slice(0,60)); s=s.replace(alt,neu); };
// 1. Schriften nicht aus dem Netz laden
s=s.replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/g,'');
// 2. Graues Testvideo statt grünem, damit die Lichtanpassung nichts einfärbt
ersetze('</head>','<style>#video{filter:grayscale(1) contrast(.15) brightness(1.5)}</style></head>');
// 3. Attrappe vor das Modul-Skript
ersetze('<script type="module">','<script>\n'+fs.readFileSync(hier+'attrappe.js','utf8')+'</script>\n<script type="module">');
// 4. MediaPipe durch die Attrappe ersetzen
s=s.replace(/const M=await import\("[^"]*vision_bundle\.mjs"\);/,'const M=window.__stub;');
// 5. Fehler bei der Erkennung sichtbar machen
ersetze('catch(_){ setStatus("Fehler bei der Erkennung","bad"); }','catch(e){ console.error("ANALYSE",e&&e.stack||e); setStatus("Fehler bei der Erkennung","bad"); }');
// 6. Feste graue Umgebungsfarbe
ersetze('scn.x.drawImage(video,0,0,24,24);',"scn.x.fillStyle='rgb(150,146,140)'; scn.x.fillRect(0,0,24,24);");
// 7. KI-Freistellung nur in tki.mjs (setzt window.__kiTest und leitet MediaPipe auf node_modules um); sonst gar nicht erst
//    laden, damit fehlendes Netz in den anderen Tests keine Fehlermeldungen erzeugt
ersetze('const V=await import(MP_URL+"/vision_bundle.mjs");','if(!window.__kiTest) throw new Error("KI im Test aus"); const V=await import(MP_URL+"/vision_bundle.mjs");');
// 8. Einblick für die Tests
s=s.replace(/loadOwn\(\);\s*buildPicker\(\);/,'loadOwn(); window.__dbg={fc,g,GARMENTS,g3,cam,dbg,STOFFE:typeof STOFFE!=="undefined"?STOFFE:null,stoffAusText:typeof stoffAusText!=="undefined"?stoffAusText:null,PASSFORM:typeof PASSFORM!=="undefined"?PASSFORM:null}; buildPicker();');
if(!s.includes('window.__dbg')) throw new Error('Einblick nicht eingefügt');
fs.writeFileSync(hier+'testseite-mit-simulierter-person.html',s);
console.log('Testseite neu erzeugt.');
