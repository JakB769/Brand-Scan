/* Zwei Läufe von werkzeuge/stoff-bewegung.mjs --dumpPos vergleichen (23.11.): größte Abweichung eines Punktes der Hose über alle
   Bilder (Bildpunkte der Bühne). „Gleich“, wenn höchstens --toleranz (Vorgabe 0,5 px, unter einem Bildpunkt).
     node werkzeuge/stoff-gleich.mjs <a_punkte.bin> <b_punkte.bin> [--toleranz 0.5] */
import fs from "node:fs";
const [a, b] = process.argv.slice(2).filter(x => !x.startsWith("--")), i = process.argv.indexOf("--toleranz"), tol = i > 0 ? +process.argv[i + 1] : .5;
const A = new Float32Array(fs.readFileSync(a).buffer.slice(0)), B = new Float32Array(fs.readFileSync(b).buffer.slice(0));
if (A.length !== B.length) { console.log(`ungleich: ${A.length} gegen ${B.length} Werte`); process.exit(1); }
let mx = 0, sum = 0; for (let k = 0; k < A.length; k++) { const d = Math.abs(A[k] - B[k]); if (d > mx) mx = d; sum += d; }
console.log(`${A.length / 3} Punkte·Bilder, größte Abweichung ${mx.toFixed(3)} px, Mittel ${(sum / A.length).toFixed(4)} px → ${mx <= tol ? "gleich" : "VERSCHIEDEN"}`);
process.exit(mx <= tol ? 0 : 1);
