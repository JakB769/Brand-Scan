/* Avatar-Scan Ende zu Ende im Kundenmodus (18.11.; Pflicht bei Änderungen am Scan, siehe .githooks/pre-commit).
   Echte Seite mit echter Erkennung (werkzeuge/tests/vergleichsseite.html = app/index.html mit Einblick), Kamera = Chromium-Testkamera
   aus den Referenzclips (Stehen v2-01 → Drehung v2-02_drehung-360 → Stehen, in einer Schleife), echte getUserMedia.
   Je Gerät (Desktop-Chrome, iPhone 13, Pixel 7 als Emulation): Kundenmodus → runterscrollen → „Eigenen Avatar erstellen“ →
   Einwilligung → Kamera (Frontkamera) → Scan-Oberfläche → „Scan fertig“ → eigener Avatar in 3D (messbar anders als der
   Standardkörper, passend zu Jakob 1,79 m) → drehen, zoomen → Hose am Avatar → Größe wechseln → danach Live-Anprobe mit Hose →
   umgekehrt: Live-Anprobe läuft, dann Avatar-Scan (bei gespeichertem Avatar) → Abbruch mit Hinweis. Dazu „Körpermodell fehlt“ (keine Kamera-Frage, Hinweis im Avatar-Bereich), „Kamera verweigert“:
   verständlicher Hinweis, nichts hängt, „Nochmal versuchen“ startet die Kamera. Und „nicht ganz im Bild“ (Kamera zu nah, Kopf und
   Füße abgeschnitten): Hinweis „zurückgehen“, kein Scan, nach der Wartezeit Abbruch mit Hinweis und „Nochmal versuchen“.
   Bilder: docs/tests/avatar/<gerät>_<nr>_<schritt>.jpg
     node werkzeuge/tests/tavatarscan.mjs [--geraete desktop,iphone,android] [--ohneBilder]          Braucht ffmpeg. */
import { chromium, devices } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "../server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const GERAETE = arg("geraete", "desktop,iphone,android").split(",").filter(g => ["desktop", "iphone", "android"].includes(g)),   // „keine“: nur die Fehlerfälle
  BILDER = !process.argv.includes("--ohneBilder"), OUT = R + "docs/tests/avatar/";
const GER = { desktop: { viewport: { width: 1280, height: 900 } }, iphone: devices["iPhone 13"], android: devices["Pixel 7"] };
let fehler = 0; const pruefe = (ok, t) => { console.log((ok ? "ok    " : "FEHLER") + " " + t); if (!ok) fehler++; return ok; };
if (BILDER) { fs.mkdirSync(OUT, { recursive: true }); for (const f of fs.readdirSync(OUT)) if (/\.jpg$/.test(f) && GERAETE.some(g => f.startsWith(g + "_"))) fs.unlinkSync(OUT + f); }

// Seite mit Einblick und echter Erkennung, bei Bedarf neu
{ const T = R + "werkzeuge/tests/vergleichsseite.html";
  if (!fs.existsSync(T) || fs.statSync(R + "app/index.html").mtimeMs > fs.statSync(T).mtimeMs) execFileSync(process.execPath, [R + "werkzeuge/tests/baue-testseite.mjs", "--echt"], { stdio: "inherit" }); }
// Kamera: Stehen 3 s → Drehung → Stehen 6 s, verkleinert in die Mitte (sonst ist der Kopf angeschnitten)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "tavatarscan-")), MJ = TMP + "/kamera.mjpeg", C = R + "assets/referenz/videos/clips/", K = .76;
const sk = `scale=${Math.round(720 * K / 2) * 2}:${Math.round(1280 * K / 2) * 2},pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x8a857d,fps=30,setsar=1`;
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-t", "3", "-i", C + "v2-01_stehen-neutral-vorne.mp4", "-i", C + "v2-02_drehung-360.mp4", "-t", "6", "-i", C + "v2-01_stehen-neutral-vorne.mp4",
  "-filter_complex", `[0:v]${sk}[a];[1:v]${sk}[b];[2:v]${sk}[c];[a][b][c]concat=n=3:v=1[v]`, "-map", "[v]", "-q:v", "5", "-f", "mjpeg", MJ]);

const srv = await starte(0), port = srv.address().port, URL0 = `http://localhost:${port}/werkzeuge/tests/vergleichsseite.html`;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-video-capture=" + MJ,
  "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
async function kontext(opt, extra = {}, br = b) {
  const ctx = await br.newContext({ ...opt, permissions: ["camera"], ...extra });
  await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
    if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
  for (const n of ["magic_touch.tflite", "pose_landmarker_full.task", "pose_landmarker_lite.task"])
    await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.abort());
  await ctx.route("**/fonts.g*/**", r => r.abort());
  // getUserMedia mitschreiben (Aufrufe, Wunsch); window.__verweigern: wie „Kamera nicht erlaubt“. Breite/Höhe-Wünsche gehen nicht an die
  // Fake-Kamera: neuere Chromium schneiden sonst aus dem Hochformat ein Quadrat aus (Kopf und Füße weg), echte Kameras tun das nicht
  await ctx.addInitScript(() => { window.__cpu = true; window.__gum = []; const md = navigator.mediaDevices; if (!md) return; const orig = md.getUserMedia.bind(md);
    md.getUserMedia = c => { window.__gum.push(JSON.stringify(c)); if (window.__verweigern) return Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
      if (c && c.video && typeof c.video === "object") { const v = { ...c.video }; delete v.width; delete v.height; c = { ...c, video: v }; } return orig(c); }; });
  return ctx;
}
const zustand = p => p.evaluate(() => { const d = window.__dbg, S = d.AVS || {}, P = S.proben || {}, t = id => (document.getElementById(id) || {}).innerText || "", sicht = id => { const e = document.getElementById(id); return !!e && e.getClientRects().length > 0; };
  const v = document.getElementById("video"), tr = v.srcObject && v.srcObject.getVideoTracks ? v.srcObject.getVideoTracks()[0] : null;
  return { stufe: S.stufe || "", on: !!S.on, sek: S.sek ? S.sek.size : 0, proben: P.vorn ? [P.vorn.length, P.hinten.length, P.seiteL.length, P.seiteR.length] : [], pct: t("scanPct"),
    kamera: !!(tr && tr.readyState === "live" && v.videoWidth > 0), scanUI: sicht("scanUI"), avatar: !!(d.AV && d.AV.form), karte3d: sicht("g3dcard"), status: sicht("avStatus") ? t("avStatusText") : "",
    nochmal: sicht("avNochmal"), coach: t("coachBig"), gum: window.__gum.length, kunde: document.body.classList.contains("kunde"), trk: d.g ? d.g.trk : 0 }; });
const warte = async (p, f, ms, schritt = 250) => { const t0 = Date.now(); let z; while (Date.now() - t0 < ms) { z = await zustand(p); if (f(z)) return z; await p.waitForTimeout(schritt); } return null; };

// 1) Händler legt die Testhose an (Entwicklermodus, Fotos vorne + hinten, Maßband): Speicherstand für alle Geräte
let speicher;
{ const ctx = await kontext(GER.desktop), p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(URL0); await p.waitForTimeout(800);
  await p.evaluate(() => { for (const d of document.querySelectorAll("details")) d.open = true; });
  const F = R + "assets/referenz/fotos/flach-vorne-hinten/";
  await p.setInputFiles("#own-front", F + "vorne.jpg"); await p.setInputFiles("#own-back", F + "hinten.jpg");
  await p.fill("#own-name", "Testhose"); await p.fill("#own-waist", "41"); await p.fill("#own-len", "105"); await p.fill("#own-mat", "100% Baumwolle Denim"); await p.click("#own-go");
  for (let t = 0; t < 240; t++) { await p.waitForTimeout(500);
    const o = await p.evaluate(() => ["refDlg", "segDlg"].filter(i => { const d = document.getElementById(i); return d && !d.hidden; }).join(","));
    if (/segDlg/.test(o)) await p.click("#segOk").catch(() => {}); if (/refDlg/.test(o)) await p.click("#refOk").catch(() => {});
    if (/Fertig|nicht|kein/i.test(await p.evaluate(() => document.getElementById("own-msg").textContent))) break; }
  const h = await p.evaluate(() => { const d = window.__dbg, G = d.GARMENTS[d.g.key]; return G ? { label: G.label, groessen: (G.sizes || []).length } : null; });
  pruefe(!!h && h.groessen >= 2, `Testhose angelegt (${h ? h.label + ", " + h.groessen + " Größen" : "fehlt"})`);
  speicher = await ctx.storageState(); pruefe(errs.length === 0, "Hose anlegen ohne Skriptfehler" + (errs.length ? ": " + errs.slice(0, 2).join(" | ") : ""));
  await ctx.close(); }

for (const gname of GERAETE) {
  console.log(`\n=== ${gname} ===`);
  const ctx = await kontext(GER[gname], { storageState: speicher }), p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  let nr = 0; const bild = async name => { if (BILDER) await p.screenshot({ path: OUT + `${gname}_${String(++nr).padStart(2, "0")}_${name}.jpg`, type: "jpeg", quality: 70 }); };
  await p.goto(URL0); await p.waitForTimeout(1000);
  await p.click("#modusBtn"); await p.waitForTimeout(300);
  let z = await zustand(p); pruefe(z.kunde, "Kundenmodus eingeschaltet (Zahnrad)");
  await bild("kundenseite");
  // runterscrollen zum Bereich „Eigenen Avatar erstellen“
  const lage = await p.evaluate(() => { const a = document.getElementById("avCard").getBoundingClientRect(), h = document.getElementById("height").getBoundingClientRect(); return { unter: a.top > h.bottom, sicht: a.height > 0 }; });
  pruefe(lage.sicht && lage.unter, "Bereich „Eigenen Avatar erstellen“ sichtbar, unter der Größe");
  await p.locator("#avCard").scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await bild("bereich-avatar");
  await p.click("#avOption"); await p.waitForTimeout(400);
  const dlg = await p.evaluate(() => { const d = document.getElementById("avDlg"); return { offen: !d.hidden, dsgvo: /Datenschutz/.test(d.innerText) }; });
  pruefe(dlg.offen && dlg.dsgvo, "Hinweis und Einwilligung (Datenschutz) erscheinen"); await bild("einwilligung");
  await p.fill("#avGroesse", "179"); await p.click("#avMann"); await p.click("#avJa");
  const t0 = Date.now();
  z = await warte(p, z => z.kamera && z.scanUI, 20000);
  const gum = await p.evaluate(() => window.__gum.slice(0, 2));
  pruefe(!!z, `Kamera läuft mit Scan-Oberfläche (nach ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  pruefe(gum.length > 0 && /"user"/.test(gum[0]), "Frontkamera angefragt (facingMode user)");
  await p.waitForTimeout(800); await bild("kamera-zurueckgehen");
  z = await warte(p, z => z.stufe === "drehen" || !z.on, 120000, 500);
  pruefe(!!z && z.stufe === "drehen", `Scan von vorn fertig, jetzt drehen (nach ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  z = await warte(p, z => z.sek >= 3 || !z.on, 40000, 250); if (z && z.on) await bild("scan-laeuft");
  pruefe(!!z && z.scanUI && /Drehung \d+ %/.test(z.pct), `Fortschritt angezeigt: „${z ? z.pct : "–"}“, Mini-Avatar ${z && z.scanUI ? "da" : "fehlt"}`);
  z = await warte(p, z => z.pct === "Scan fertig" || z.avatar || !z.on, 60000, 150);
  pruefe(!!z && (z.pct === "Scan fertig" || z.avatar), "„Scan fertig“ erscheint"); if (z && z.pct === "Scan fertig") await bild("scan-fertig");
  z = await warte(p, z => z.avatar && z.karte3d && !z.kamera, 30000, 300);
  pruefe(!!z, `eigener Avatar in der 3D-Ansicht, Kamera aus (nach ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  await p.waitForTimeout(1500); await bild("avatar-3d");
  // eigener Avatar statt Standardkörper: Maße gegen den Durchschnitt derselben Größe, Proportionen für Jakob (1,79 m)
  const av = await p.evaluate(() => { const d = window.__dbg, A = d.AV.form, S = d.avatarBauen(d.AV.kd, A.g, {}, A.H).m, r = x => Math.round(x * 10) / 10;
    const k = ["shoulder", "chest", "waist", "hip", "thigh", "leg"].filter(q => A.m[q] > 0 && S[q] > 0);
    return { H: A.H, g: A.g, m: Object.fromEntries(k.map(q => [q, r(A.m[q])])), std: Object.fromEntries(k.map(q => [q, r(S[q])])), ziele: Object.keys(d.AV.daten && d.AV.daten.z || {}).length }; });
  const diff = Object.keys(av.m).map(q => Math.abs(av.m[q] - av.std[q])), anders = diff.filter(x => x >= 1).length, summe = diff.reduce((a, x) => a + x, 0);
  console.log("       Avatar:", JSON.stringify(av.m), "Standard:", JSON.stringify(av.std));
  pruefe(av.H === 179 && av.g === "m" && av.ziele >= 5, `Avatar aus dem Scan (179 cm, Mann, ${av.ziele} Ziele aus dem Scan)`);
  pruefe(Math.max(...diff) >= 3 && summe >= 5, `eigener Avatar unterscheidet sich vom Standardkörper (größte Abweichung ${Math.max(...diff).toFixed(1)} cm, zusammen ${summe.toFixed(1)} cm, ${anders} Maße um ≥ 1 cm)`);
  pruefe(av.m.leg > 80 && av.m.leg < 100 && av.m.waist > 60 && av.m.waist < 100 && av.m.hip > 80 && av.m.hip < 112, `Proportionen passen zu 1,79 m (Bein ${av.m.leg}, Taille ${av.m.waist}, Hüfte ${av.m.hip} cm)`);
  // drehen und zoomen
  const y0 = await p.evaluate(() => window.__dbg.v3d.yaw); await p.click('.avansicht button[data-ansicht="1.5708"]').catch(() => {}); await p.waitForTimeout(1200);
  const zm0 = await p.evaluate(() => window.__dbg.v3d.zoom); await p.click("#avZoomEin").catch(() => {}); await p.waitForTimeout(600);
  const dz = await p.evaluate(() => ({ yaw: window.__dbg.v3d.yaw, zoom: window.__dbg.v3d.zoom }));
  pruefe(Math.abs(dz.yaw - y0) > .5 && dz.zoom > zm0, `Avatar drehen (Seite) und zoomen geht (Zoom ${zm0} → ${(+dz.zoom).toFixed(2)})`); await bild("avatar-seite-zoom");
  await p.click("#avReset").catch(() => {}); await p.click('.avansicht button[data-ansicht="0"]').catch(() => {}); await p.waitForTimeout(800);
  // Hose am Avatar und Größe wechseln
  const hose = await p.evaluate(() => { const d = window.__dbg, G = d.g.key && d.GARMENTS[d.g.key]; return { hose: !!(G && G.m3), name: G ? G.label : "", chips: document.querySelectorAll("#g-szrow .szchip").length }; });
  pruefe(hose.hose && hose.chips >= 2, `Hose „${hose.name}“ am Avatar, ${hose.chips} Größen zur Wahl`); await bild("hose-am-avatar");
  const gr = async () => p.evaluate(() => { const b = document.querySelector('#g-szrow .szchip[aria-pressed="true"]'); return b ? +b.dataset.sz : -1; });
  const n = hose.chips, g0 = await gr(), ziel1 = g0 === 0 ? 1 : 0, ziel2 = Math.min(n - 1, ziel1 + 2);
  await p.click(`#g-szrow .szchip[data-sz="${ziel1}"]`); await p.waitForTimeout(700); const g1 = await gr();
  await p.click(`#g-szrow .szchip[data-sz="${ziel2}"]`); await p.waitForTimeout(900); const g2 = await gr();
  pruefe(g1 === ziel1 && g2 === ziel2, `Größe wechseln am Avatar (${g0} → ${g1} → ${g2})`); await bild("groesse-gewechselt");
  // danach Live-Anprobe: Kamera wieder an, Hose sitzt im Bild
  await p.locator("#start").scrollIntoViewIfNeeded(); await p.click("#start");
  z = await warte(p, z => z.kamera, 20000); pruefe(!!z, "Live-Anprobe nach dem Avatar: Kamera läuft");
  z = await warte(p, z => z.trk > 0, 90000, 500); pruefe(!!z, "Live-Anprobe: Hose sitzt im Kamerabild"); if (z) { await p.waitForTimeout(600); await bild("live-anprobe"); }
  // umgekehrt: Live-Anprobe läuft, dann Avatar-Scan (gespeicherter Avatar: der Knopf startet trotzdem einen neuen Scan)
  await p.locator("#avCard").scrollIntoViewIfNeeded(); await p.click("#avOption"); await p.waitForTimeout(400);
  pruefe(await p.evaluate(() => !document.getElementById("avDlg").hidden), "bei gespeichertem Avatar: „Neu scannen“ öffnet die Einwilligung");
  await p.click("#avJa");
  z = await warte(p, z => z.on && z.kamera && z.scanUI, 15000); pruefe(!!z, "Wechsel Live-Anprobe → Avatar-Scan: Kamera läuft weiter, Scan-Oberfläche da");
  z = await warte(p, z => (z.stufe === "drehen" && z.sek >= 2) || !z.on, 120000, 500); pruefe(!!z && z.stufe === "drehen", "Wechsel: Scan kommt in die Drehung"); if (z && z.on) await bild("wechsel-scan");
  await p.click("#camOff").catch(() => {}); await p.waitForTimeout(600);
  z = await zustand(p); pruefe(!z.on && !z.kamera && /abgebrochen/.test(z.status) && z.nochmal, `Scan abgebrochen: Hinweis „${z.status.slice(0, 60)}…“ mit „Nochmal versuchen“`); await bild("abgebrochen");
  pruefe(errs.length === 0, "keine Skriptfehler" + (errs.length ? ": " + [...new Set(errs)].slice(0, 3).join(" | ") : ""));
  await ctx.close();
}

// Kamera verweigert (Desktop): verständlicher Hinweis, nichts hängt, „Nochmal versuchen“ startet die Kamera
{ console.log("\n=== Kamera verweigert ===");
  const ctx = await kontext(GER.desktop, { storageState: speicher }), p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => { window.__verweigern = true; });
  await p.goto(URL0); await p.waitForTimeout(800); await p.click("#modusBtn"); await p.waitForTimeout(200);
  await p.locator("#avCard").scrollIntoViewIfNeeded(); await p.click("#avOption"); await p.fill("#avGroesse", "179"); await p.click("#avJa");
  let z = await warte(p, z => !!z.status, 10000);
  pruefe(!!z && /nicht erlaubt/.test(z.status) && z.nochmal, `Hinweis: „${z ? z.status.slice(0, 70) : "–"}…“ mit „Nochmal versuchen“`);
  z = await zustand(p); pruefe(!z.on && !z.kamera && !z.scanUI, "nichts hängt: Scan aus, keine Scan-Oberfläche");
  if (BILDER) { await p.locator("#avStatus").scrollIntoViewIfNeeded(); await p.waitForTimeout(600); await p.screenshot({ path: OUT + "desktop_99_kamera-verweigert.jpg", type: "jpeg", quality: 70 }); }
  await p.evaluate(() => { window.__verweigern = false; }); await p.click("#avNochmal");
  z = await warte(p, z => z.kamera && z.on && z.scanUI, 20000); pruefe(!!z, "nach Erlauben: „Nochmal versuchen“ startet Kamera und Scan");
  pruefe(errs.length === 0, "keine Skriptfehler" + (errs.length ? ": " + [...new Set(errs)].slice(0, 3).join(" | ") : ""));
  await ctx.close(); }

// Körpermodell fehlt auf der Website (20.11.: Live-Seite ohne avatar/koerper.js hochgeladen): früher Kamera-Frage, dann Sprung zur
// „Anprobe in 3D“, Kamera nie offen. Jetzt: keine Kamera-Frage, klarer Hinweis im Avatar-Bereich; Datei wieder da → „Nochmal versuchen“ geht
{ console.log("\n=== Körpermodell fehlt ===");
  const ctx = await kontext(GER.iphone, { storageState: speicher }), p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  let fehlt = true; await ctx.route("**/koerper.js*", r => fehlt ? r.fulfill({ status: 404, body: "fehlt" }) : r.fallback());
  await p.goto(URL0); await p.waitForTimeout(800); await p.click("#modusBtn"); await p.waitForTimeout(200);
  await p.locator("#avCard").scrollIntoViewIfNeeded(); await p.click("#avOption"); await p.fill("#avGroesse", "179"); await p.waitForTimeout(500); await p.click("#avJa");
  let z = await warte(p, z => !!z.status && !/Moment/.test(z.status), 10000);
  pruefe(!!z && /koerper\.js/.test(z.status) && z.nochmal, `Hinweis: „${z ? z.status.slice(0, 70) : "–"}…“ mit „Nochmal versuchen“`);
  await p.waitForTimeout(1000); z = await zustand(p);       // sanftes Scrollen zum Hinweis abwarten
  const lage = await p.evaluate(() => { const r = document.getElementById("avStatus").getBoundingClientRect(); return { oben: Math.round(r.top), unten: Math.round(r.bottom), h: innerHeight }; }), imBild = lage.oben < lage.h && lage.unten > 0;
  pruefe(z.gum === 0 && !z.on && !z.kamera && !z.scanUI && imBild, `keine Kamera-Frage (${z.gum}×), kein Scan (${z.on ? "an" : "aus"}, Kamera ${z.kamera ? "an" : "aus"}, Oberfläche ${z.scanUI ? "an" : "aus"}), Hinweis im Bild (${lage.oben}–${lage.unten} von ${lage.h} px, kein Sprung zur 3D-Anprobe)`);
  if (BILDER) await p.screenshot({ path: OUT + "iphone_96_koerpermodell-fehlt.jpg", type: "jpeg", quality: 70 });
  fehlt = false; await p.click("#avNochmal");
  z = await warte(p, z => z.kamera && z.on && z.scanUI, 20000); pruefe(!!z, "Datei wieder da: „Nochmal versuchen“ startet Kamera und Scan");
  pruefe(errs.length === 0, "keine Skriptfehler" + (errs.length ? ": " + [...new Set(errs)].slice(0, 3).join(" | ") : ""));
  await ctx.close(); }

// Nicht ganz im Bild: zweite Testkamera (Ausschnitt ohne Kopf und Füße), Wartezeit für den Test 15 s statt 90 s
{ console.log("\n=== Nicht ganz im Bild ===");
  const MJ2 = TMP + "/nah.mjpeg";
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-t", "8", "-i", C + "v2-01_stehen-neutral-vorne.mp4", "-vf", "crop=iw*0.7:ih*0.62:iw*0.15:ih*0.16,scale=720:1280,fps=30,setsar=1", "-q:v", "5", "-f", "mjpeg", MJ2]);
  const b2 = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-video-capture=" + MJ2, "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await kontext(GER.desktop, { storageState: speicher }, b2), p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => { window.__frontalMaxMs = 15000; });
  await p.goto(URL0); await p.waitForTimeout(800); await p.click("#modusBtn"); await p.waitForTimeout(200);
  await p.locator("#avCard").scrollIntoViewIfNeeded(); await p.click("#avOption"); await p.fill("#avGroesse", "179"); await p.click("#avJa");
  let z = await warte(p, z => z.kamera && /zurück|nicht sichtbar|ins Bild/i.test(z.coach), 20000);
  pruefe(!!z, `Hinweis zum Zurückgehen: „${z ? z.coach : (await zustand(p)).coach}“`); if (BILDER && z) await p.screenshot({ path: OUT + "desktop_97_nicht-ganz-im-bild.jpg", type: "jpeg", quality: 70 });
  z = await zustand(p); pruefe(z.stufe === "warten", "kein Scan, solange nicht ganz im Bild");
  z = await warte(p, z => !!z.status, 30000, 500);
  pruefe(!!z && /nicht ganz im Bild/.test(z.status) && z.nochmal && !z.kamera && !z.on, `nach der Wartezeit: „${z ? z.status.slice(0, 60) : "–"}…“ mit „Nochmal versuchen“, Kamera aus`);
  if (BILDER && z) { await p.locator("#avStatus").scrollIntoViewIfNeeded(); await p.waitForTimeout(600); await p.screenshot({ path: OUT + "desktop_98_abbruch-nicht-im-bild.jpg", type: "jpeg", quality: 70 }); }
  pruefe(errs.length === 0, "keine Skriptfehler" + (errs.length ? ": " + [...new Set(errs)].slice(0, 3).join(" | ") : ""));
  await ctx.close(); await b2.close(); }

await b.close(); srv.close(); fs.rmSync(TMP, { recursive: true, force: true });
if (BILDER) console.log("Bilder: docs/tests/avatar/");
console.log(fehler ? `${fehler} Fehler` : "Avatar-Scan Ende zu Ende in Ordnung"); process.exit(fehler ? 1 : 0);
