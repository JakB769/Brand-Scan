/* Avatar-Scan-Ablauf (23.11., nach Live-Test des Nutzers: Fortschritt lief, bevor er ganz im Bild war; „fertig“ ohne Drehung;
   danach schwarzes Vollbild „Kamera noch nicht gestartet“, Escape → schwarz, Zurück → Tab zu).
   Echte Seite app/index.html (oder --url: die Live-Adresse), echte Erkennung, Fake-Kamera aus den Referenzclips, Kundenmodus.
   Nur über die Oberfläche geprüft (data-stufe/-abschnitte der Scan-Oberfläche, Texte, localStorage), darum auch live lauffähig.
   - Positiv (Clip Stehen → v2-02_drehung-360 → Stehen): warten ohne Fortschritt → Countdown 3-2-1 → Fortschritt folgt der Drehung
     (beginnt bei 0, steigt in Schritten, nie rückwärts) → Kamera aus, „Avatar wird erstellt …“ → eigener Avatar mit passenden
     Proportionen (Jakob, 1,79 m). Dabei Vollbild an: danach kein schwarzes Vollbild.
   - Negativ 1 (v2-01_stehen-neutral-vorne, steht still): Countdown, dann Drehung bleibt bei 0 %, Hinweis „Weiter drehen“, nie fertig.
   - Negativ 2 (nur halb im Bild / leeres Bild): kein Countdown, kein Fortschritt.
   - Navigation: in jedem Schritt (Einwilligung, warten, Countdown, drehen, Avatar wird erstellt, Ergebnis) „Abbrechen“, Escape und
     Browser-Zurück → wieder auf der Seite, Kamera aus, kein Vollbild, Tab bleibt offen (Seite bleibt geladen). Fehler beim Bau →
     Meldung mit „Nochmal versuchen“.
   Desktop-Chrome, iPhone 13 und Pixel 7 (Emulation). Bilder: docs/tests/avatar-scan/<gerät>_<nr>_<schritt>.jpg
     node werkzeuge/tests/tavatarablauf.mjs [--url https://…/] [--geraete desktop,iphone,android] [--teile positiv,negativ,navigation] [--ohneBilder] [--schnell]
   --schnell (Commit-Haken): Navigation je Schritt nur ein Weg (abwechselnd Abbrechen, Escape, Zurück), sonst alle drei.
   Braucht ffmpeg. Die Fake-Kamera von Chromium schneidet bei Breite/Höhe-Wünschen aus dem Hochformat ein Quadrat aus (Kopf und
   Füße weg): darum werden im Test nur diese zwei Wünsche weggelassen, sonst läuft getUserMedia unverändert. */
import { chromium, devices } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { starte } from "../server.mjs";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..") + "/", A = R + "werkzeuge/tests/ausgabe/", NM = R + "node_modules/";
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : process.argv[i + 1]; };
const LIVE = arg("url", process.env.LIVE_URL || ""), BILDER = !process.argv.includes("--ohneBilder"), OUT = R + "docs/tests/avatar-scan/";
const GERAETE = arg("geraete", "desktop,iphone,android").split(",").filter(g => ["desktop", "iphone", "android"].includes(g));
const TEILE = arg("teile", "positiv,negativ,navigation").split(","), SCHNELL = process.argv.includes("--schnell");
const GER = { desktop: { viewport: { width: 1280, height: 900 } }, iphone: devices["iPhone 13"], android: devices["Pixel 7"] };
let fehler = 0; const pruefe = (ok, t) => { console.log((ok ? "ok    " : "FEHLER") + " " + t); if (!ok) fehler++; return ok; };
if (BILDER) { fs.mkdirSync(OUT, { recursive: true }); for (const f of fs.readdirSync(OUT)) if (/\.jpg$/.test(f) && GERAETE.some(g => f.startsWith(g + "_"))) fs.unlinkSync(OUT + f); }
fs.mkdirSync(A, { recursive: true });
for (const [n, u] of [["pose_landmarker_full.task", "pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"], ["pose_landmarker_lite.task", "pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"]])
  if (!LIVE && !fs.existsSync(A + n)) try { execFileSync("curl", ["-sSLf", "-m", "180", "-o", A + n, "https://storage.googleapis.com/mediapipe-models/" + u]); } catch (_) {}

// Fake-Kameras (Hochformat 720 × 1280, Person verkleinert in der Mitte, sonst ist der Kopf angeschnitten)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "tavatarablauf-")), C = R + "assets/referenz/videos/clips/";
const sk = "scale=548:974,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=0x8a857d,fps=30,setsar=1", ff = a => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...a]);
const CAM = { pos: TMP + "/pos.mjpeg", steh: TMP + "/steh.mjpeg", halb: TMP + "/halb.mjpeg", leer: TMP + "/leer.mjpeg" };
ff(["-i", C + "v2-01_stehen-neutral-vorne.mp4", "-i", C + "v2-02_drehung-360.mp4", "-i", C + "v2-01_stehen-neutral-vorne.mp4",
  "-filter_complex", `[0:v]${sk}[a];[1:v]${sk}[b];[2:v]${sk}[c];[a][b][c]concat=n=3:v=1[v]`, "-map", "[v]", "-q:v", "5", "-f", "mjpeg", CAM.pos]);
ff(["-i", C + "v2-01_stehen-neutral-vorne.mp4", "-vf", sk, "-q:v", "5", "-f", "mjpeg", CAM.steh]);
ff(["-i", C + "v2-01_stehen-neutral-vorne.mp4", "-vf", "crop=iw:ih*0.62:0:0,scale=720:1280,fps=30,setsar=1", "-q:v", "5", "-f", "mjpeg", CAM.halb]);   // Füße fehlen
ff(["-f", "lavfi", "-i", "color=c=0x8a857d:s=720x1280:d=3:r=30", "-q:v", "5", "-f", "mjpeg", CAM.leer]);                                        // niemand im Bild

const srv = LIVE ? null : await starte(0), URL0 = LIVE || `http://localhost:${srv.address().port}/app/index.html`;
const typ = f => f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : "application/octet-stream";
const browser = {}; const holeBrowser = async k => browser[k] || (browser[k] = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream",
  "--use-file-for-fake-video-capture=" + CAM[k], "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] }));
async function seite(gname, kamera, init = {}) {
  const ctx = await (await holeBrowser(kamera)).newContext({ ...GER[gname], permissions: ["camera"] });
  if (!LIVE) {   // lokal: MediaPipe und Modelle aus dem Repo (live: echtes Netz, wie bei Kunden)
    await ctx.route("**/@mediapipe/tasks-vision@0.10.18/**", r => { const f = NM + "@mediapipe/tasks-vision/" + decodeURIComponent(r.request().url().split("@0.10.18/")[1].split("?")[0]);
      if (!fs.existsSync(f)) return r.abort(); r.fulfill({ status: 200, contentType: typ(f), headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(f) }); });
    for (const n of ["pose_landmarker_full.task", "pose_landmarker_lite.task"]) await ctx.route("**/" + n, r => fs.existsSync(A + n) ? r.fulfill({ status: 200, body: fs.readFileSync(A + n), headers: { "access-control-allow-origin": "*" } }) : r.continue());
    await ctx.route("**/fonts.g*/**", r => r.abort());
  }
  await ctx.addInitScript(init => {
    try { localStorage.setItem("passformModus", "kunde"); localStorage.setItem("passformErkennung", "cpu"); } catch (_) {}   // Kundenseite; Erkennung auf der CPU (Test-Grafik ist langsam)
    Object.assign(window, init);
    const md = navigator.mediaDevices; if (!md) return; const orig = md.getUserMedia.bind(md);
    md.getUserMedia = c => { if (c && c.video && typeof c.video === "object") { const v = { ...c.video }; delete v.width; delete v.height; c = { ...c, video: v }; } return orig(c); };
  }, init);
  const p = await ctx.newPage(); p.__errs = []; p.on("pageerror", e => p.__errs.push(e.message));
  if (process.env.ABLAUF_LOG) p.on("console", m => { if (m.type() === "error" || m.type() === "warning") console.log("       Konsole:", m.text().slice(0, 200)); });
  await p.goto(URL0); await p.waitForTimeout(700);
  return p;
}
const zustand = p => p.evaluate(() => { const $ = id => document.getElementById(id), sicht = id => { const e = $(id); return !!e && !e.hidden && e.getClientRects().length > 0; };
  const ui = $("scanUI"), v = $("video"), tr = v.srcObject && v.srcObject.getVideoTracks ? v.srcObject.getVideoTracks()[0] : null; let av = null;
  try { av = JSON.parse(localStorage.getItem("passformAvatar") || "null"); } catch (_) {}
  return { stufe: ui.hidden ? "" : (ui.dataset.stufe || ""), n: +(ui.dataset.abschnitte || 0), countdown: sicht("scanCount") ? $("scanCount").innerText.trim() : "",
    balken: sicht("scanBar"), pct: sicht("scanBar") ? +((($("scanPct").innerText.match(/(\d+) %/)) || [0, 0])[1]) : 0, coach: $("coachBig").innerText.trim(), klein: $("coachSmall").innerText.trim(),
    laden: sicht("scanLaden"), abbrechen: sicht("scanAbbruch"), kamera: !!(tr && tr.readyState === "live"), voll: $("stage").classList.contains("full") || !!document.fullscreenElement,
    gesperrt: document.body.classList.contains("locked"), status: sicht("avStatus") ? $("avStatusText").innerText.trim() : "", nochmal: sicht("avNochmal"), karte3d: sicht("g3dcard"),
    dialog: sicht("avDlg"), avatar: av && av.m ? { H: av.H, m: av.m, p: av.p, at: av.at } : null, url: location.href, seite: !!$("avCard") }; });
const warte = async (p, f, ms, schritt = 200) => { const t0 = Date.now(); let z; while (Date.now() - t0 < ms) { z = await zustand(p); if (f(z)) return z; await p.waitForTimeout(schritt); } return null; };
const bild = async (p, gname, nr, name) => { if (BILDER) await p.screenshot({ path: OUT + `${gname}_${nr}_${name}.jpg`, type: "jpeg", quality: 70 }); };
async function scanStarten(p) {
  await p.locator("#avCard").scrollIntoViewIfNeeded(); await p.click("#avOption"); await p.waitForTimeout(250);
  await p.fill("#avGroesse", "179"); await p.click("#avJa");
}
const zurSeite = z => z.stufe === "" && !z.kamera && !z.voll && !z.gesperrt && z.seite && z.url.split("#")[0] === URL0.split("#")[0];

console.log("Seite:", URL0);
for (const gname of GERAETE) {
  console.log(`\n=== ${gname} ===`);
  // ---------- Positiv: warten → 3-2-1 → Drehung → Avatar ----------
  if (TEILE.includes("positiv")) {
    const p = await seite(gname, "pos", { __avatarVerzoegerung: 1500 });
    await p.locator("#avCard").scrollIntoViewIfNeeded(); await p.click("#avOption"); await p.waitForTimeout(300);
    pruefe((await zustand(p)).dialog, "Einwilligung offen"); await bild(p, gname, "01", "einwilligung");
    await p.fill("#avGroesse", "179"); await p.click("#avJa");
    let z = await warte(p, z => z.stufe === "warten" && z.kamera, 15000);
    pruefe(!!z && !z.balken && !z.countdown && z.abbrechen, `warten: Kamera an, kein Fortschritt, kein Countdown, „Abbrechen“ sichtbar (${z ? z.coach : "-"})`);
    if (z) await bild(p, gname, "02", "warten");
    z = await warte(p, z => !!z.countdown || z.stufe === "drehen", 40000, 100);
    pruefe(!!z && !!z.countdown && !z.balken, `Countdown „${z ? z.countdown : "-"}“ ohne Fortschrittsbalken`); if (z) await bild(p, gname, "03", "countdown");
    // Ziffern 3 → 2 → 1 nacheinander (der Countdown kann beim Drehen im Clip abbrechen und neu beginnen)
    const ziffern = new Set(); let d0 = Date.now();
    while (Date.now() - d0 < 45000) { z = await zustand(p); if (z.countdown) ziffern.add(z.countdown); if (z.stufe === "drehen") break; await p.waitForTimeout(100); }
    const pctStart = z.stufe === "drehen" ? z.pct : -1;      // Stand im Moment des Wechsels ins Drehen (danach kann sich die Person sofort drehen)
    pruefe(["3", "2", "1"].every(c => ziffern.has(c)) && z.stufe === "drehen", `Countdown ${[...ziffern].join("-")} → drehen`);
    await p.click("#full").catch(() => {}); await p.waitForTimeout(300);           // Vollbild wie beim Nutzer
    const verlauf = []; d0 = Date.now(); let sahDrehenBild = false;
    while (Date.now() - d0 < 60000) { z = await zustand(p);
      if (z.stufe === "drehen") { verlauf.push(z.pct); if (!sahDrehenBild && z.pct >= 40) { sahDrehenBild = true; await bild(p, gname, "04", "drehen"); } }
      if (z.stufe === "rechnen" || z.stufe === "") break; await p.waitForTimeout(150); }
    const werte = [...new Set(verlauf)], monoton = verlauf.every((v, i) => !i || v >= verlauf[i - 1]);
    pruefe(pctStart === 0 && monoton && werte.filter(v => v > 0).length >= 5, `Fortschritt folgt der Drehung: ${pctStart} → ${werte.join(" → ")} % (beginnt bei 0, nie rückwärts, in Schritten; Stillstehen ohne Fortschritt prüft „Stehen“)`);
    z = await warte(p, z => z.laden, 8000, 100); if (z) { await p.waitForTimeout(400); z = await zustand(p); }       // Vollbild schließt der Browser kurz danach
    pruefe(!!z && z.laden && !z.kamera && !z.voll && !z.gesperrt && z.abbrechen, "fertig gedreht: Kamera aus, kein Vollbild, „Avatar wird erstellt …“ mit „Abbrechen“"
      + (z ? "" : " | Zustand: " + JSON.stringify(await zustand(p)).slice(0, 300))); if (z) await bild(p, gname, "05", "avatar-wird-erstellt");
    z = await warte(p, z => z.stufe === "" && !!z.avatar, 30000);
    const m = z && z.avatar ? z.avatar.m : {}, H = z && z.avatar ? z.avatar.H : 0, ps = z && z.avatar ? Object.values(z.avatar.p || {}).reduce((s, v) => s + Math.abs(v), 0) : 0;
    if (!pruefe(!!z && z.karte3d && !z.voll && !z.kamera, "eigener Avatar in der 3D-Ansicht, kein schwarzes Vollbild")) console.log("       Zustand:", JSON.stringify(await zustand(p)).slice(0, 400), p.__errs.slice(0, 3));
    pruefe(H === 179 && m.leg / H > .47 && m.leg / H < .57 && m.waist > 62 && m.waist < 100 && m.hip > 82 && m.hip < 112 && m.chest > 82 && m.chest < 118,
      `Proportionen passen zu 1,79 m (Bein ${m.leg}, Taille ${m.waist}, Hüfte ${m.hip}, Brust ${m.chest} cm)`);
    pruefe(ps > .3, `Form aus dem Scan, nicht der Standardkörper (Regler zusammen ${ps.toFixed(2)})`);
    await p.locator("#g3dcard").scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(800); await bild(p, gname, "06", "avatar");
    // Ergebnis: Escape und Zurück lassen die Seite stehen
    await p.keyboard.press("Escape"); await p.waitForTimeout(300); z = await zustand(p);
    pruefe(zurSeite(z) && z.karte3d, "Ergebnis: Escape → Seite mit Avatar bleibt");
    await p.goBack().catch(() => {}); await p.waitForTimeout(500); z = await zustand(p);
    pruefe(zurSeite(z) && z.karte3d, "Ergebnis: Browser-Zurück → bleibt auf der Seite (Tab offen)");
    pruefe(p.__errs.length === 0, "keine Skriptfehler" + (p.__errs.length ? ": " + [...new Set(p.__errs)].slice(0, 3).join(" | ") : ""));
    await p.context().close();
  }
  // ---------- Negativ ----------
  if (TEILE.includes("negativ")) {
    let p = await seite(gname, "steh"); await scanStarten(p);
    let z = await warte(p, z => z.stufe === "drehen", 30000);
    pruefe(!!z, "Stehen: Countdown, dann drehen");
    let weiter = false, maxPct = 0; const d0 = Date.now();
    while (Date.now() - d0 < 14000) { z = await zustand(p); maxPct = Math.max(maxPct, z.pct); if (/Weiter drehen/.test(z.coach)) weiter = true; if (z.stufe !== "drehen") break; await p.waitForTimeout(250); }
    pruefe(z.stufe === "drehen" && maxPct === 0 && z.n <= 1 && !z.avatar, `Stehen 14 s: nicht fertig, Fortschritt ${maxPct} %, ${z.n} Abschnitt(e)`);
    pruefe(weiter, `Hinweis „Weiter drehen“ (${z.coach})`); await bild(p, gname, "07", "stehen-weiter-drehen");
    await p.context().close();
    for (const [kam, nr, name, text] of [["halb", "08", "halb-im-bild", /zurück/i], ["leer", "09", "leeres-bild", /ins Bild/i]]) {
      p = await seite(gname, kam); await scanStarten(p);
      let sahCd = false, sahBalken = false, coachs = new Set(); const t0 = Date.now();
      while (Date.now() - t0 < 12000) { z = await zustand(p); if (z.countdown) sahCd = true; if (z.balken) sahBalken = true; if (z.coach) coachs.add(z.coach); await p.waitForTimeout(250); }
      pruefe(z.stufe === "warten" && !sahCd && !sahBalken && z.kamera, `${name}: 12 s kein Countdown, kein Fortschritt (Hinweis: ${[...coachs].join(" / ")})`);
      pruefe([...coachs].some(c => text.test(c)), `${name}: Hinweis passt`); await bild(p, gname, nr, name);
      await p.context().close();
    }
  }
  // ---------- Navigation: in jedem Schritt Abbrechen, Escape, Browser-Zurück ----------
  if (TEILE.includes("navigation")) {
    const wege = { abbrechen: p => p.click("#scanAbbruch"), escape: p => p.keyboard.press("Escape"), zurueck: p => p.goBack().catch(() => {}) };
    // Einwilligung: Zurück und Escape schließen den Dialog, die Seite bleibt
    for (const w of SCHNELL ? ["zurueck"] : ["escape", "zurueck"]) { const p = await seite(gname, "leer");
      await p.locator("#avCard").scrollIntoViewIfNeeded(); await p.click("#avOption"); await p.waitForTimeout(300); await wege[w](p); await p.waitForTimeout(400);
      const z = await zustand(p); pruefe(!z.dialog && zurSeite(z), `Einwilligung + ${w}: Dialog zu, Seite bleibt`); await p.context().close(); }
    const schritte = [["warten", "halb", z => z.stufe === "warten" && z.kamera, 15000], ["countdown", "steh", z => !!z.countdown, 30000],
      ["drehen", "steh", z => z.stufe === "drehen", 35000], ["avatar-wird-erstellt", "pos", z => z.laden, 90000]];
    for (const [si, [schritt, kam, da, ms]] of schritte.entries()) for (const w of SCHNELL ? [["abbrechen", "escape", "zurueck", "zurueck"][si]] : ["abbrechen", "escape", "zurueck"]) {
      const p = await seite(gname, kam, { __avatarVerzoegerung: 6000 }); await scanStarten(p);
      let z = await warte(p, da, ms, 100);
      if (!pruefe(!!z, `${schritt}: erreicht`)) { await p.context().close(); continue; }
      if (schritt !== "avatar-wird-erstellt") { await p.click("#full").catch(() => {}); await p.waitForTimeout(250); }   // im Vollbild wie beim Nutzer
      await wege[w](p); await p.waitForTimeout(700); z = await zustand(p);
      pruefe(zurSeite(z) && /abgebrochen/.test(z.status) && z.nochmal, `${schritt} + ${w}: zurück auf der Seite, Kamera aus, kein Vollbild, „${z.status.slice(0, 40)}…“ mit „Nochmal versuchen“`);
      if (w === "zurueck" && (schritt === "drehen" || schritt === "avatar-wird-erstellt")) await bild(p, gname, schritt === "drehen" ? "10" : "11", "zurueck-" + schritt);
      if (schritt === "avatar-wird-erstellt") { await p.waitForTimeout(6500); z = await zustand(p); pruefe(!z.avatar, "abgebrochener Bau legt keinen Avatar an"); }
      pruefe(p.__errs.length === 0, "keine Skriptfehler" + (p.__errs.length ? ": " + [...new Set(p.__errs)].slice(0, 3).join(" | ") : ""));
      await p.context().close();
    }
    // Fehler beim Avatar-Bau: verständliche Meldung mit „Nochmal versuchen“, nichts hängt
    { const p = await seite(gname, "pos", { __avatarFehlerTest: "Testfehler" }); await scanStarten(p);
      let z = await warte(p, z => !!z.status, 90000, 250);
      pruefe(!!z && /ließ sich nicht erstellen/.test(z.status) && z.nochmal && zurSeite(z), `Fehler beim Bau: „${z ? z.status.slice(0, 50) : "-"}…“ mit „Nochmal versuchen“, Seite bedienbar`);
      await p.locator("#avStatus").scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(700); await bild(p, gname, "12", "fehler-beim-bau"); await p.context().close(); }
  }
}
for (const b of Object.values(browser)) await b.close();
if (srv) srv.close(); fs.rmSync(TMP, { recursive: true, force: true });
if (BILDER) console.log("Bilder: docs/tests/avatar-scan/");
console.log(fehler ? `${fehler} Fehler` : "Avatar-Scan-Ablauf in Ordnung"); process.exit(fehler ? 1 : 0);
