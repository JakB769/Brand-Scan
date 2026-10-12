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
// Tempo-Anpassung (leichtes Modell, kleinere 3D-Fläche) nur, wenn ein Test sie ausdrücklich will (tkamera.mjs): sonst
// hinge das Bild von der Rechenzeit der Testmaschine ab
ersetze('function perfTick(ms){','function perfTick(ms){ if(!window.__perfTest) return;');
// Lag-Messung (tlag.mjs): je Bild erkanntes Knie, Knie des Hosen-Skeletts und Lage des Hosenbeins am Knie
ersetze('  const yaw=bodyYaw(L,V,vw,vh,pxPerCm);','  if(window.__lagLog) window.__lagLog.push({t:performance.now(),raw:[L[25].x*vw,L[25].y*vh],bone:[bone[0][1].x,bone[0][1].y],hip:[(L[23].x+L[24].x)/2*vw,(L[23].y+L[24].y)/2*vh]});\n  const yaw=bodyYaw(L,V,vw,vh,pxPerCm);');
ersetze('  if(!clean) draw(L,{topN,botN}','  if(window.__lagLog&&window.__lagLog.length&&g3.pos&&g3.M){ const M=g3.M, NR=M.nr, C=K3+1, i=window.__lagRow??Math.round(NR*.72); let x=0,y=0,n=0; for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const k=((0*NR+i)*2+f)*C+j; x+=g3.pos[k*3]; y+=g3.pos[k*3+1]; n++; } window.__lagLog[window.__lagLog.length-1].mesh=[x/n,y/n]; }\n  if(!clean) draw(L,{topN,botN}');
// 9. Einklappbare Bereiche (Feineinstellungen, Einzel-Formular, Ton) offen: die Tests tippen dort hinein
s=s.replace(/<details class="adv">/g,'<details class="adv" open>');
// 10. Einblick für die Tests
s=s.replace(/loadOwn\(\);\s*buildPicker\(\);/,'loadOwn(); window.__dbg={fc,g,GARMENTS,g3,cam,dbg,parseSizeText:typeof parseSizeText!=="undefined"?parseSizeText:null,sizeSeries:typeof sizeSeries!=="undefined"?sizeSeries:null,tableDims:typeof tableDims!=="undefined"?tableDims:null,PERF:typeof PERF!=="undefined"?PERF:null,HIPF:typeof HIPF!=="undefined"?HIPF:null,segGarment:typeof segGarment!=="undefined"?segGarment:null,isSkin:typeof isSkin!=="undefined"?isSkin:null,kmeans:typeof kmeans!=="undefined"?kmeans:null,fileToCanvas:typeof fileToCanvas!=="undefined"?fileToCanvas:null,STOFFE:typeof STOFFE!=="undefined"?STOFFE:null,stoffAusText:typeof stoffAusText!=="undefined"?stoffAusText:null,PASSFORM:typeof PASSFORM!=="undefined"?PASSFORM:null,UP:typeof UP!=="undefined"?UP:null,findPerson:typeof findPerson!=="undefined"?findPerson:null,loadPoseImg:typeof loadPoseImg!=="undefined"?loadPoseImg:null,sceneParts:typeof sceneParts!=="undefined"?sceneParts:null,twoLegs:typeof twoLegs!=="undefined"?twoLegs:null,v3d:typeof v3d!=="undefined"?v3d:null,drapeFor:typeof drapeFor!=="undefined"?drapeFor:null,shirt:typeof shirt!=="undefined"?shirt:null,wornMask:typeof wornMask!=="undefined"?wornMask:null,wornSeeds:typeof wornSeeds!=="undefined"?wornSeeds:null,loadAiSeg:typeof loadAiSeg!=="undefined"?loadAiSeg:null,cropGarment:typeof cropGarment!=="undefined"?cropGarment:null,findGaps:typeof findGaps!=="undefined"?findGaps:null,flatSideScore:typeof flatSideScore!=="undefined"?flatSideScore:null,GEN:typeof GEN!=="undefined"?GEN:null}; buildPicker();');
if(!s.includes('window.__dbg')) throw new Error('Einblick nicht eingefügt');
fs.writeFileSync(hier+'testseite-mit-simulierter-person.html',s);
console.log('Testseite neu erzeugt.');
