// Erzeugt die Testseite aus app/index.html: MediaPipe wird durch eine simulierte Person ersetzt.
// Aufruf: node werkzeuge/tests/baue-testseite.mjs [ziel.html] (läuft auch automatisch vor npm test)
//         node werkzeuge/tests/baue-testseite.mjs --echt [ziel.html]: echte Erkennung (MediaPipe), echtes Kamerabild für Licht
//         und Oberteil, nur die Einblicke für Tests; für werkzeuge/vergleich.mjs (Referenzbilder als Kamera)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const hier=fileURLToPath(new URL('.',import.meta.url));
const argv=process.argv.slice(2), echt=argv.includes('--echt'), ziel=argv.find(a=>!a.startsWith('--'));
let s=fs.readFileSync(hier+'../../app/index.html','utf8');
const ersetze=(alt,neu)=>{ if(!s.includes(alt)) throw new Error('Stelle nicht gefunden: '+alt.slice(0,60)); s=s.replace(alt,neu); };
// 1. Schriften nicht aus dem Netz laden
s=s.replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/g,'');
// 2. Graues Testvideo statt grünem, damit die Lichtanpassung nichts einfärbt
if(!echt){
ersetze('</head>','<style>#video{filter:grayscale(1) contrast(.15) brightness(1.5)}</style></head>');
// 3. Attrappe vor das Modul-Skript
ersetze('<script type="module">','<script>\n'+fs.readFileSync(hier+'attrappe.js','utf8')+'</script>\n<script type="module">');
// 4. MediaPipe durch die Attrappe ersetzen
s=s.replace(/const M=await import\("[^"]*vision_bundle\.mjs"\);/,'const M=window.__stub;');
}
// Werkzeuge (drehung.mjs): mit angehaltener Uhr genau eine Erkennung je freigegebenem Bild (window.__gate)
ersetze('  if(video.videoWidth&&video.currentTime!==lastTime){','  if(video.videoWidth&&video.currentTime!==lastTime&&(!window.__gate||window.__gate())){');
// Werkzeuge (drehung.mjs): Erkennung auf der CPU statt im Software-Grafiktreiber (swiftshader), dort viel schneller
ersetze('const o={baseOptions:{modelAssetPath:POSE_URL,delegate:"GPU"},','const o={baseOptions:{modelAssetPath:POSE_URL,delegate:window.__cpu?"CPU":"GPU"},');
// Rohe Landmarken des letzten Bildes (Vergleich, Tests): vor legSanity/hipFix
ersetze('  let L=res.landmarks&&res.landmarks[0];','  let L=res.landmarks&&res.landmarks[0]; window.__Lraw=L?L.map(p=>({x:p.x,y:p.y,z:p.z,v:p.visibility})):null;');
// Personenmaske des letzten Bildes (Vergleich: Umriss der echten Hose gegen die 3D-Hose)
ersetze('  const m={d:mk.getAsFloat32Array(),w:mk.width,h:mk.height};','  const m={d:mk.getAsFloat32Array(),w:mk.width,h:mk.height}; window.__mask={d:m.d.slice(),w:m.w,h:m.h};');
// Rechenzeit je Bild ohne Erkennung (Glätten, Messen, Form, Stoff, Zeichnen): window.__ta (handy.mjs, Handy-Emulation)
ersetze('function analyse(res){','function analyse(res){ const _ta=performance.now(); analyse0(res); if(window.__ta) window.__ta.push(performance.now()-_ta); }\nfunction analyse0(res){');
// 5. Fehler bei der Erkennung sichtbar machen
ersetze('catch(_){ setStatus("Fehler bei der Erkennung","bad"); }','catch(e){ console.error("ANALYSE",e&&e.stack||e); setStatus("Fehler bei der Erkennung","bad"); }');
if(!echt){
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
ersetze('try{ shirt.x2.drawImage(video,','try{ shirt.x2.drawImage(window.__shirtBild,');
}
// Tempo-Anpassung (leichtes Modell, kleinere 3D-Fläche) nur, wenn ein Test sie ausdrücklich will (tkamera.mjs): sonst
// hinge das Bild von der Rechenzeit der Testmaschine ab
ersetze('function perfTick(ms){','function perfTick(ms){ if(!window.__perfTest) return;');
// Lag-Messung (tlag.mjs): je Bild erkanntes Knie, Knie des Hosen-Skeletts und Lage des Hosenbeins am Knie
ersetze('      legHinge(B0,h,upRef,bone.map(c=>c[0].ok&&c[1].ok),bone.map(c=>c[1].ok&&c[2].ok),ext.zBack);','      legHinge(B0,h,upRef,bone.map(c=>c[0].ok&&c[1].ok),bone.map(c=>c[1].ok&&c[2].ok),ext.zBack); window.__B0=B0.map(c=>c.map(q=>q.slice()));');
// Innenseite rot (Fehlersuche: wo sieht man in die Hose?), Rechenzeit der Form je Bild (window.__t3d)
ersetze('    const ui=P.inner||[.6,.62,.66];','    const ui=window.__innenRot?[1.6,0,0]:P.inner||[.6,.62,.66];');
ersetze('  if(P.physik!==false){ cloth3d(','  if(P.physik!==false&&!window.__ohnePhysik){ cloth3d(');
ersetze('  const info=pose3d(M,P);','  const _t0=performance.now(); const info=pose3d(M,P); if(window.__t3d) window.__t3d.push(performance.now()-_t0);');
ersetze('  const yaw=bodyYaw(L,V,vw,vh,pxPerCm);','  window.__bone=bone.map(c=>c.map(p=>({x:p.x,y:p.y,zr:p.zr,ok:p.ok}))); window.__vw=[vw,vh];\n  if(window.__lagLog) window.__lagLog.push({t:performance.now(),raw:[L[25].x*vw,L[25].y*vh],ank:[L[27].x*vw,L[27].y*vh],bone:[bone[0][1].x,bone[0][1].y],hip:[(L[23].x+L[24].x)/2*vw,(L[23].y+L[24].y)/2*vh]});\n  if(window.__yawLog) window.__yawLog.push({t:performance.now(),L:L.map(p=>[p.x,p.y,p.z||0,p.visibility??1]),vw,vh,ppc:pxPerCm,phase,fc0:{...fc}});\n  const yaw=bodyYaw(L,V,vw,vh,pxPerCm);');
ersetze('  if(zeigen&&!clean) draw(L,{topN,botN}','  if(window.__lagLog&&window.__lagLog.length&&g3.pos&&g3.M){ const M=g3.M, NR=M.nr, C=K3+1, i=window.__lagRow??Math.round(NR*.72); let x=0,y=0,n=0; for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const k=((0*NR+i)*2+f)*C+j; x+=g3.pos[k*3]; y+=g3.pos[k*3+1]; n++; } window.__lagLog[window.__lagLog.length-1].mesh=[x/n,y/n]; x=0; y=0; n=0; for(let f=0;f<2;f++) for(let j=0;j<C;j++){ const k=((0*NR+NR-4)*2+f)*C+j; x+=g3.pos[k*3]; y+=g3.pos[k*3+1]; n++; } window.__lagLog[window.__lagLog.length-1].saum=[x/n,y/n]; }\n  if(zeigen&&!clean) draw(L,{topN,botN}');
// Rechenzeit je Bild der 3D-Ansicht (avatar-handy.mjs): window.__tv
ersetze('function view3dFrame(now){','function view3dFrame(now){ const _tv=performance.now(); view3dFrame0(now); if(window.__tv&&!v3d.ausgelassen) window.__tv.push(performance.now()-_tv); }\nfunction view3dFrame0(now){');
// 9. Einklappbare Bereiche (Feineinstellungen, Einzel-Formular, Ton) offen: die Tests tippen dort hinein
s=s.replace(/<details class="adv">/g,'<details class="adv" open>');
// 10. Einblick für die Tests
s=s.replace(/loadOwn\(\);\s*buildPicker\(\);/,'loadOwn(); window.__dbg={fc,g,GARMENTS,g3,cam,dbg,parseSizeText:typeof parseSizeText!=="undefined"?parseSizeText:null,sizeSeries:typeof sizeSeries!=="undefined"?sizeSeries:null,tableDims:typeof tableDims!=="undefined"?tableDims:null,PERF:typeof PERF!=="undefined"?PERF:null,HIPF:typeof HIPF!=="undefined"?HIPF:null,segGarment:typeof segGarment!=="undefined"?segGarment:null,isSkin:typeof isSkin!=="undefined"?isSkin:null,kmeans:typeof kmeans!=="undefined"?kmeans:null,fileToCanvas:typeof fileToCanvas!=="undefined"?fileToCanvas:null,STOFFE:typeof STOFFE!=="undefined"?STOFFE:null,stoffAusText:typeof stoffAusText!=="undefined"?stoffAusText:null,PASSFORM:typeof PASSFORM!=="undefined"?PASSFORM:null,UP:typeof UP!=="undefined"?UP:null,findPerson:typeof findPerson!=="undefined"?findPerson:null,loadPoseImg:typeof loadPoseImg!=="undefined"?loadPoseImg:null,sceneParts:typeof sceneParts!=="undefined"?sceneParts:null,twoLegs:typeof twoLegs!=="undefined"?twoLegs:null,v3d:typeof v3d!=="undefined"?v3d:null,drapeFor:typeof drapeFor!=="undefined"?drapeFor:null,shirt:typeof shirt!=="undefined"?shirt:null,wornMask:typeof wornMask!=="undefined"?wornMask:null,wornSeeds:typeof wornSeeds!=="undefined"?wornSeeds:null,loadAiSeg:typeof loadAiSeg!=="undefined"?loadAiSeg:null,cropGarment:typeof cropGarment!=="undefined"?cropGarment:null,findGaps:typeof findGaps!=="undefined"?findGaps:null,flatSideScore:typeof flatSideScore!=="undefined"?flatSideScore:null,GEN:typeof GEN!=="undefined"?GEN:null,legCm:typeof legCm!=="undefined"?legCm:null,clearSm:typeof clearSm!=="undefined"?clearSm:null,trk:typeof trk!=="undefined"?trk:null,sizeAll:typeof sizeAll!=="undefined"?sizeAll:null,sizeVerdict:typeof sizeVerdict!=="undefined"?sizeVerdict:null,sizeReason:typeof sizeReason!=="undefined"?sizeReason:null,bodyMeas:typeof bodyMeas!=="undefined"?bodyMeas:null,sizeGarment:typeof sizeGarment!=="undefined"?sizeGarment:null,cutOf:typeof cutOf!=="undefined"?cutOf:null,AUS:typeof AUS!=="undefined"?AUS:null,AV:typeof AV!=="undefined"?AV:null,AVS:typeof AVS!=="undefined"?AVS:null,avatarAnpassen:typeof avatarAnpassen!=="undefined"?avatarAnpassen:null,avatarBauen:typeof avatarBauen!=="undefined"?avatarBauen:null,avatarDaten:typeof avatarDaten!=="undefined"?avatarDaten:null,avatarAnzeigen:typeof avatarAnzeigen!=="undefined"?avatarAnzeigen:null,avMasse:typeof avMasse!=="undefined"?avMasse:null,avatarScanZiele:typeof avatarScanZiele!=="undefined"?avatarScanZiele:null,v3d:typeof v3d!=="undefined"?v3d:null,caps:typeof caps!=="undefined"?caps:null,garmentDims:typeof garmentDims!=="undefined"?garmentDims:null}; buildPicker();');
if(!s.includes('window.__dbg')) throw new Error('Einblick nicht eingefügt');
// 11. Körpermodell des Avatars (app/avatar/koerper.js) relativ zur erzeugten Seite
const zielPfad=ziel||hier+(echt?'vergleichsseite.html':'testseite-mit-simulierter-person.html');
const avUrl=path.relative(path.dirname(path.resolve(zielPfad)),path.resolve(hier,'../../app/avatar/koerper.js')).split(path.sep).join('/');
ersetze('<script type="module">','<script>window.PASSFORM_AVATAR_URL='+JSON.stringify(avUrl)+';</script>\n<script type="module">');
// Hosen-Auswahl (app/hosen-auswahl.js) relativ zur erzeugten Seite
ersetze('<script src="hosen-auswahl.js" defer></script>','<script defer src='+JSON.stringify(path.relative(path.dirname(path.resolve(zielPfad)),path.resolve(hier,'../../app/hosen-auswahl.js')).split(path.sep).join('/'))+'></script>');
fs.writeFileSync(zielPfad,s);   // anderer Ort: z. B. während eine Testreihe läuft
console.log(echt?'Vergleichsseite (echte Erkennung) neu erzeugt.':'Testseite neu erzeugt.');
