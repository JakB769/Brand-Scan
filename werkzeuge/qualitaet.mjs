/* Qualitätsgedächtnis der Hosen (17.11.): wie eine Hose sein soll (regeln), der zuletzt gute Stand je Hose (hosen.<name>.gut)
   und die Urteile des Nutzers (urteile: gut/schlecht mit Notiz). Daten: werkzeuge/qualitaet.json.
   Umrissvergleich wie vom Nutzer gewünscht: Umriss im Originalfoto gegen den Umriss der 3D-Hose von vorn (Studio, ohne Schatten),
   beide auf die Länge der Hose skaliert, in cm. regeln gelten für diesen Bildvergleich (hose-render.mjs), regelnApp für die
   Messung in der App (g3.umriss, Fotokanten der Freistellung gegen die Form; tneuehose.mjs). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const QDATEI = path.join(path.dirname(fileURLToPath(import.meta.url)), "qualitaet.json");
export const laden = () => JSON.parse(fs.readFileSync(QDATEI, "utf8"));
const heute = () => new Date().toISOString().slice(0, 10);

/* In der Seite: Kanten je Zeile (N Zeilen vom Bund bis zum Saum) eines Bilds mit einfarbigem Hintergrund, in Bildpunkten
   relativ zur Mitte: [außen links, innen links, innen rechts, außen rechts]; innen null, wo kein Spalt in der Mitte ist. */
export async function bildKanten(url, N = 240) {
  const im = new Image(); im.src = url; await im.decode();
  const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0);
  const W = c.width, H = c.height, d = g.getImageData(0, 0, W, H).data, q = [[], [], []];
  for (let x = 0; x < W; x += 3) for (const y of [0, 1, H - 2, H - 1]) for (let k = 0; k < 3; k++) q[k].push(d[(y * W + x) * 4 + k]);
  for (let y = 0; y < H; y += 3) for (const x of [0, 1, W - 2, W - 1]) for (let k = 0; k < 3; k++) q[k].push(d[(y * W + x) * 4 + k]);
  const bg = q.map(a => { a.sort((m, n) => m - n); return a[a.length >> 1]; });
  const an = (x, y) => { const i = (y * W + x) * 4; return Math.max(Math.abs(d[i] - bg[0]), Math.abs(d[i + 1] - bg[1]), Math.abs(d[i + 2] - bg[2])) > 50; };
  const laeufe = y => { const r = []; let a = -1, lu = -9; for (let x = 0; x < W; x++) if (an(x, y)) { if (a < 0 || x - lu > 3) { if (a >= 0) r.push([a, lu]); a = x; } lu = x; }
    if (a >= 0) r.push([a, lu]); return r.filter(([p, e]) => e - p > 4); };
  let y0 = -1, y1 = -1, x0 = W, x1 = 0;
  for (let y = 0; y < H; y++) { const r = laeufe(y); if (!r.length) continue; const b = r.reduce((m, p) => m + p[1] - p[0], 0); if (b < W * .05) continue;
    if (y0 < 0) y0 = y; y1 = y; x0 = Math.min(x0, r[0][0]); x1 = Math.max(x1, r[r.length - 1][1]); }
  const cx = (x0 + x1) / 2, Z = [];
  for (let k = 0; k < N; k++) { const y = Math.round(y0 + (y1 - y0) * k / (N - 1)), r = laeufe(y); if (!r.length) { Z.push(null); continue; }
    let best = null; for (let j = 0; j + 1 < r.length; j++) { const m = (r[j][1] + r[j + 1][0]) / 2, gw = r[j + 1][0] - r[j][1];
      if (Math.abs(m - cx) < .2 * (x1 - x0) && (!best || gw > best[2])) best = [r[j][1] - cx, r[j + 1][0] - cx, gw]; }
    Z.push([r[0][0] - cx, best ? best[0] : null, best ? best[1] : null, r[r.length - 1][1] - cx]); }
  return { h: y1 - y0, zeilen: Z };
}

/* Foto (F) gegen 3D (M), beide aus bildKanten; Länge der Hose in cm (Höhe des Umrisses). Werte in cm. */
export function vergleichBilder(F, M, laenge) {
  const N = F.zeilen.length, sF = laenge / F.h, sM = laenge / M.h, cm = (Z, s) => Z.map(z => z && z.map(v => v == null ? null : v * s));
  const A = cm(F.zeilen, sF), B = cm(M.zeilen, sM), k95 = Math.round(.95 * (N - 1)), k05 = Math.round(.05 * (N - 1));
  // Spitze des Spalts: vom Saum aufwärts, solange der Spalt durchgeht
  const spitze = Z => { let k = k95; if (!Z[k] || Z[k][1] == null) return null; while (k > 0 && Z[k - 1] && Z[k - 1][1] != null) k--; return k; };
  // Außenkante über dem Schritt (Becken); darunter die Breite jedes Beins: die Form stellt die Beine bewusst gerade (spreizGrad),
  // die Lage der Beinkanten weicht darum vom gespreizt liegenden Foto ab, die Breite nicht
  const pF = spitze(A), pM = spitze(B), dA = [], dI = [], pS = Math.min(pF ?? k95, pM ?? k95);
  // Schrittpunkt (24.11., Nutzer: „zwischen den Beinen eine Stoffverbindung“): Spitze des umgekehrten V der Innenkanten. Flach
  // fotografiert liegt unter dem Schritt zwischen den vorderen Innennähten noch die hintere Lage, der Hintergrund zeigt sich erst
  // tiefer; die 3D-Hose trennt die Beine am Schrittpunkt. Darum beide Innenkanten unter der Spitze des Spalts als Geraden nach oben
  // verlängern, bis sie sich treffen (Foto und 3D gleich gemessen; bis 23.11. zählte die Spitze des sichtbaren Spalts).
  const vSpitze = (Z, p) => { if (p == null) return null; const e = Math.min(k95, p + Math.round(.15 * N)), L = [], Q = [];
    for (let k = p + 1; k <= e; k++) if (Z[k] && Z[k][1] != null && Z[k][2] != null) { L.push([k, Z[k][1]]); Q.push([k, Z[k][2]]); }
    if (L.length < 6) return p;
    const fit = P => { const mk = P.reduce((a, q) => a + q[0], 0) / P.length, mx = P.reduce((a, q) => a + q[1], 0) / P.length; let sxy = 0, sxx = 0;
      for (const [k, x] of P) { sxy += (k - mk) * (x - mx); sxx += (k - mk) ** 2; } const m = sxx ? sxy / sxx : 0; return [m, mx - m * mk]; };
    const [m1, b1] = fit(L), [m2, b2] = fit(Q); if (!(m2 - m1 > 1e-6)) return p;
    return Math.max(p - .2 * N, Math.min(p, (b1 - b2) / (m2 - m1))); };
  const spF = vSpitze(A, pF), spM = vSpitze(B, pM);
  for (let k = k05; k <= k95; k++) { if (!A[k] || !B[k]) continue; if (k < pS) dA.push(Math.abs(A[k][0] - B[k][0]), Math.abs(A[k][3] - B[k][3]));
    if (pF != null && pM != null && k >= Math.max(pF, pM) + 2 && A[k][1] != null && B[k][1] != null)
      dI.push(Math.abs((A[k][1] - A[k][0]) - (B[k][1] - B[k][0])), Math.abs((A[k][3] - A[k][2]) - (B[k][3] - B[k][2]))); }
  const mittel = a => a.length ? a.reduce((p, q) => p + q, 0) / a.length : null, p90 = a => { const b = a.slice().sort((p, q) => p - q); return b.length ? b[Math.floor(.9 * (b.length - 1))] : null; };
  const rest = (Z, j, a, b) => { const P = []; for (let k = a; k <= b; k++) if (Z[k] && Z[k][j] != null) P.push([k, Z[k][j]]); if (P.length < 6) return 0;
    const mk = P.reduce((p, q) => p + q[0], 0) / P.length, mx = P.reduce((p, q) => p + q[1], 0) / P.length; let sxy = 0, sxx = 0;
    for (const [k, x] of P) { sxy += (k - mk) * (x - mx); sxx += (k - mk) ** 2; } const m = sxx ? sxy / sxx : 0; return Math.max(...P.map(([k, x]) => Math.abs(x - mx - m * (k - mk)))); };
  let krumm = null;
  if (pF != null && pM != null) { const a = Math.max(pF, pM), ai = Math.min(k95, a + Math.round(.1 * N)); krumm = -1e9;
    for (const j of [0, 3]) krumm = Math.max(krumm, rest(B, j, a, k95) - rest(A, j, a, k95));
    for (const j of [1, 2]) krumm = Math.max(krumm, rest(B, j, ai, k95) - rest(A, j, ai, k95)); }
  const r1 = x => x == null ? null : Math.round(x * 10) / 10;
  return { aussenCm: r1(mittel(dA)), aussenMaxCm: r1(p90(dA)), beinCm: r1(mittel(dI)), beinMaxCm: r1(p90(dI)),
    schrittCm: spF == null || spM == null ? null : r1((spM - spF) / (N - 1) * laenge), krummCm: r1(krumm), laengeCm: laenge, foto: A, modell: B };
}

/* Prüfen: jede Regel (Grenze) und, wenn es für die Hose einen guten Stand gibt, ob ein Wert deutlich schlechter geworden ist. */
export function bewerten(U, Q, name, satz = "regeln") {
  const zeilen = [], fehler = [], gut = name && Q.hosen[name] && Q.hosen[name].gut;
  for (const [k, r] of Object.entries(Q[satz])) {
    const w = U[k] == null ? null : U[k], b = w == null ? Infinity : r.betrag ? Math.abs(w) : w, ok = b <= r.max;
    let t = `${ok ? "ok    " : "FEHLER"} ${r.text}: ${w == null ? "nicht messbar" : w + " cm"} (Grenze ${r.max})`;
    if (!ok) fehler.push(r.text);
    if (gut && gut.werte[k] != null && w != null) {
      const g = r.betrag ? Math.abs(gut.werte[k]) : gut.werte[k];
      if (b > g + Q.toleranzCm) { t += ` SCHLECHTER als der gute Stand vom ${gut.datum} (${gut.werte[k]} cm)`; fehler.push(r.text + " schlechter als gut"); }
    }
    zeilen.push(t);
  }
  const offen = (Q.urteile || []).filter(u => u.urteil === "schlecht" && u.status === "offen" && (!name || u.hose === name || u.hose === "alle"));
  return { ok: !fehler.length, fehler, zeilen, offen, gut };
}

/* Urteil des Nutzers festhalten. gut: Werte werden der neue gute Stand der Hose (Vergleichsmaß für alle späteren Läufe). */
export function urteilSpeichern(name, urteil, notiz, U) {
  const Q = laden(), werte = U ? Object.fromEntries(Object.keys(Q.regeln).map(k => [k, U[k]])) : null;
  Q.urteile.push({ datum: heute(), hose: name, urteil, ...(urteil === "schlecht" ? { status: "offen" } : {}), notiz, ...(werte ? { werte } : {}) });
  if (urteil === "gut" && werte) (Q.hosen[name] ||= {}).gut = { datum: heute(), notiz, werte };
  fs.writeFileSync(QDATEI, JSON.stringify(Q, null, 2) + "\n");
}

/* In der Seite: Bild zum Umrissvergleich, rot Foto, blau 3D-Hose; Werte als Text darunter. */
export function umrissBild(U) {
  const Z = [U.foto, U.modell], xs = Z.flat().flatMap(z => z ? z.filter(v => v != null) : []), x0 = Math.min(...xs) - 2, x1 = Math.max(...xs) + 2;
  const N = U.foto.length, S = 6, W = Math.round((x1 - x0) * S), H = Math.round(U.laengeCm * S) + 70;
  const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
  Z.forEach((A, n) => { g.strokeStyle = n ? "#22c" : "#d22"; g.lineWidth = 2.5;
    for (let j = 0; j < 4; j++) { g.beginPath(); let an = false;
      A.forEach((z, k) => { if (!z || z[j] == null) { an = false; return; } const x = (z[j] - x0) * S, y = k / (N - 1) * U.laengeCm * S + 4; an ? g.lineTo(x, y) : g.moveTo(x, y); an = true; }); g.stroke(); } });
  g.fillStyle = "#000"; g.font = "15px sans-serif";
  g.fillText("rot: Foto   blau: 3D-Hose", 8, H - 46);
  g.fillText(`Becken außen ${U.aussenCm} cm, Beinbreite ${U.beinCm} cm, Schritt ${U.schrittCm} cm, krumm ${U.krummCm} cm`, 8, H - 24);
  return c.toDataURL("image/png");
}
