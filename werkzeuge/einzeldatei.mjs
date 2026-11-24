/* Die ganze App als EINE HTML-Datei (24.11.; „gib mir die html“): app/index.html mit eingebetteter Produkt-Auswahl
   (app/hosen-auswahl.js) und Körpermodell (app/avatar/koerper.js), dazu auf Wunsch vorab eingebaute Hosen (JSON wie im Gerät
   gespeichert, z. B. von hose-render.mjs bauen --json). Läuft per Doppelklick (file://) und hochgeladen als einzelne Datei.
   MediaPipe und die Modelle kommen wie live aus dem Netz. Ohne Server fehlen nur /api/* (Sammlung, Link-Import).
     node werkzeuge/einzeldatei.mjs [--aus werkzeuge/tests/ausgabe/passform.html] [--hosen a.json,b.json]
   Vorab-Hosen gelten als geteilt (wie hosen.json neben der Seite): sichtbar, aber nicht im Gerät gespeichert. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") + "/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const AUS = path.resolve(R, arg("aus", "werkzeuge/tests/ausgabe/passform.html")), HOSEN = (arg("hosen", "") || "").split(",").filter(Boolean);
const esc = t => t.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");     // nichts darf den Script-Block vorzeitig beenden
let s = fs.readFileSync(R + "app/index.html", "utf8");
const ersetze = (alt, neu) => { if (!s.includes(alt)) throw new Error("Stelle nicht gefunden: " + alt.slice(0, 70)); s = s.replace(alt, () => neu); };

// 1. Produkt-Auswahl eingebettet statt Datei daneben
ersetze('<script src="hosen-auswahl.js" defer></script>', "<script>\n" + esc(fs.readFileSync(R + "app/hosen-auswahl.js", "utf8")) + "\n</script>");
// 2. Körpermodell vor der App (setzt window.PASSFORM_KOERPER; avatarDaten lädt dann keine Datei nach)
const vorab = HOSEN.map(f => JSON.parse(fs.readFileSync(path.resolve(R, f), "utf8")));
for (const h of vorab) if (!h || typeof h.key !== "string" || !h.G || !h.G.m3) throw new Error("keine gespeicherte Hose: " + JSON.stringify(h).slice(0, 80));
ersetze('<script type="module">', "<script>\n" + esc(fs.readFileSync(R + "app/avatar/koerper.js", "utf8")) + "\n</script>\n"
  + (vorab.length ? "<script>window.PASSFORM_VORAB=" + esc(JSON.stringify(vorab)) + ";</script>\n" : "") + '<script type="module">');
// 3. Vorab-Hosen beim Start übernehmen (auch per Doppelklick, wo es kein hosen.json daneben gibt)
if (vorab.length) ersetze('async function loadSharedGarments(){\n', `async function loadSharedGarments(){
  if(window.PASSFORM_VORAB){ const r=mergeGarments(garmentList(window.PASSFORM_VORAB),true); if(r.neu){ buildPicker(); const k=Object.keys(GARMENTS).find(x=>!GARMENTS[x].bad); if(!g.key&&k) pickGarment(k,false); } }
`);
fs.mkdirSync(path.dirname(AUS), { recursive: true }); fs.writeFileSync(AUS, s);
console.log(`${path.relative(R, AUS)}: ${(s.length / 1048576).toFixed(1)} MB, ${vorab.length} Hosen vorab (${vorab.map(h => h.G.label || h.key).join(", ") || "keine"})`);
