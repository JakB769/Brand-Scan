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
// 7. KI-Freistellung und Personenerkennung in Einzelbildern nur mit window.__kiTest (tki.mjs, tdateien.mjs: MediaPipe aus node_modules); sonst gar nicht erst
//    laden, damit fehlendes Netz in den anderen Tests keine Fehlermeldungen erzeugt
ersetze('const visionBundle=()=>import(MP_URL+"/vision_bundle.mjs");','const visionBundle=()=>window.__kiTest?import(MP_URL+"/vision_bundle.mjs"):Promise.reject(new Error("KI im Test aus"));');
// 8. Oberteil über dem Bund: das Kamerabild der Testseite ist ein Testmuster; erkannt wird nur in einem gemalten Bild
//    (window.__shirtBild, toberteil.mjs), sonst gar nicht
ersetze('if(V(11)&&V(12)&&V(23)&&V(24)&&video.videoWidth){','if(V(11)&&V(12)&&V(23)&&V(24)&&window.__shirtBild){');
ersetze('vw=video.videoWidth, vh=video.videoHeight;\n      if(!shirt.c)','vw=window.__shirtBild.width, vh=window.__shirtBild.height;\n      if(!shirt.c)');
ersetze('shirt.x.drawImage(video,x0*vw','shirt.x.drawImage(window.__shirtBild,x0*vw');
// 9. Einklappbare Bereiche (Feineinstellungen, Einzel-Formular, Ton) offen: die Tests tippen dort hinein
s=s.replace(/<details class="adv">/g,'<details class="adv" open>');
// 10. Einblick für die Tests
s=s.replace(/loadOwn\(\);\s*buildPicker\(\);/,'loadOwn(); window.__dbg={fc,g,GARMENTS,g3,cam,dbg,STOFFE:typeof STOFFE!=="undefined"?STOFFE:null,stoffAusText:typeof stoffAusText!=="undefined"?stoffAusText:null,PASSFORM:typeof PASSFORM!=="undefined"?PASSFORM:null,UP:typeof UP!=="undefined"?UP:null,findPerson:typeof findPerson!=="undefined"?findPerson:null,loadPoseImg:typeof loadPoseImg!=="undefined"?loadPoseImg:null,sceneParts:typeof sceneParts!=="undefined"?sceneParts:null,twoLegs:typeof twoLegs!=="undefined"?twoLegs:null,v3d:typeof v3d!=="undefined"?v3d:null,drapeFor:typeof drapeFor!=="undefined"?drapeFor:null,shirt:typeof shirt!=="undefined"?shirt:null,wornMask:typeof wornMask!=="undefined"?wornMask:null,wornSeeds:typeof wornSeeds!=="undefined"?wornSeeds:null,loadAiSeg:typeof loadAiSeg!=="undefined"?loadAiSeg:null}; buildPicker();');
if(!s.includes('window.__dbg')) throw new Error('Einblick nicht eingefügt');
fs.writeFileSync(hier+'testseite-mit-simulierter-person.html',s);
console.log('Testseite neu erzeugt.');
