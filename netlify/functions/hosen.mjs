/* Sammlung aller Hosen auf dem Server, damit sie in jeder Fassung der Seite und über jeden Link da sind (Netlify: alle Deploys,
   Vorschauen und Branch-Links einer Website teilen sich denselben Speicher; im Browser gespeicherte Hosen gehören dagegen
   immer genau einer Adresse).

   GET    /api/hosen            → {app, version, hosen:[{key, etag}]}   (nur Kürzel; geänderte holt die Seite einzeln)
   GET    /api/hosen?key=K      → {key, G}
   PUT    /api/hosen?key=K      ← {key, G}  speichern (höchstens 2 MB, Form wie in hosen.json)
   DELETE /api/hosen?key=K      löschen

   Speicher: Netlify Blobs (Website-weit, „strong consistency“: was gespeichert ist, sieht das nächste Gerät sofort). Lokal und
   in Tests ein Ordner (HOSEN_DIR). Schreiben und Löschen verlangen den Team-Code, wenn PASSFORM_TEAMCODE gesetzt ist
   (Kopfzeile x-passform-code); ohne Code kann jeder mit dem Link Hosen anlegen und löschen (für interne Tests gedacht).
   Antworten ohne CORS-Freigabe: nur die eigene Seite liest sie. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const config = { path: "/api/hosen" };
const KEY = /^[\w-]{1,40}$/, MAX = 2e6, ANZAHL = 400;

let st = null;
async function speicher() {
  if (st) return st;
  const dir = process.env.HOSEN_DIR;
  if (dir) {
    fs.mkdirSync(dir, { recursive: true });
    const f = k => path.join(dir, k + ".json");
    return (st = {
      list: async () => fs.readdirSync(dir).filter(n => n.endsWith(".json")).map(n => ({ key: n.slice(0, -5), etag: String(fs.statSync(path.join(dir, n)).mtimeMs) })),
      get: async k => { try { return fs.readFileSync(f(k), "utf8"); } catch { return null; } },
      set: async (k, v) => fs.writeFileSync(f(k), v),
      del: async k => fs.rmSync(f(k), { force: true }),
    });
  }
  const { getStore } = await import("@netlify/blobs");
  // „strong“ braucht in der Umgebung eine uncachedEdgeURL; fehlt sie, gilt der normale Modus (Änderungen nach Sekunden sichtbar)
  let s = getStore({ name: "passform-hosen", consistency: "strong" });
  const mit = async f => { try { return await f(s); } catch (e) {
    if (!/uncachedEdgeURL|consistency/i.test(String(e && e.message))) throw e;
    s = getStore({ name: "passform-hosen" }); return f(s); } };
  return (st = {
    list: () => mit(async x => (await x.list()).blobs.map(b => ({ key: b.key, etag: b.etag }))),
    get: k => mit(x => x.get(k, { type: "text" })),
    set: (k, v) => mit(x => x.set(k, v)),
    del: k => mit(x => x.delete(k)),
  });
}

const antwort = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const gleich = (a, b) => { const h = x => crypto.createHash("sha256").update(String(x)).digest(); return crypto.timingSafeEqual(h(a), h(b)); };

/* dieselben Mindestregeln wie beim Laden in der Seite (dort prüft checkGarment den Rest) */
function pruefe(o, key) {
  return o && o.key === key && o.G && typeof o.G === "object" && o.G.m3 && Array.isArray(o.G.m3.hw)
    && typeof o.G.m3.atlas === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(o.G.m3.atlas);
}

export default async function hosen(req) {
  try {
    const q = new URL(req.url).searchParams, key = q.get("key");
    if (key != null && !KEY.test(key)) return antwort({ ok: false, error: "Ungültiges Kürzel" }, 400);
    const s = await speicher();
    if (req.method === "GET") {
      if (key == null) return antwort({ app: "passform", version: 1, hosen: await s.list() });
      const v = await s.get(key);
      return v == null ? antwort({ ok: false, error: "nicht gefunden" }, 404) : new Response(v, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    }
    if (req.method !== "PUT" && req.method !== "POST" && req.method !== "DELETE") return antwort({ ok: false, error: "Methode nicht erlaubt" }, 405);
    const code = process.env.PASSFORM_TEAMCODE;
    if (code && !gleich(req.headers.get("x-passform-code") || "", code)) return antwort({ ok: false, error: "Team-Code fehlt oder falsch", code: true }, 401);
    if (key == null) return antwort({ ok: false, error: "Es fehlt das Kürzel (?key=…)" }, 400);
    if (req.method === "DELETE") { await s.del(key); return antwort({ ok: true }); }
    const len = +req.headers.get("content-length") || 0;
    if (len > MAX) return antwort({ ok: false, error: "Hose zu groß" }, 413);
    const text = await req.text();
    if (text.length > MAX) return antwort({ ok: false, error: "Hose zu groß" }, 413);
    let o; try { o = JSON.parse(text); } catch { return antwort({ ok: false, error: "Keine Hose (kein JSON)" }, 400); }
    if (!pruefe(o, key)) return antwort({ ok: false, error: "Keine gültige Hose" }, 400);
    const alle = await s.list();
    if (alle.length >= ANZAHL && !alle.some(b => b.key === key)) return antwort({ ok: false, error: `Sammlung voll (${ANZAHL} Hosen)` }, 507);
    await s.set(key, JSON.stringify({ key, G: o.G }));
    const neu = (await s.list()).find(b => b.key === key);
    return antwort({ ok: true, etag: neu ? neu.etag : null });
  } catch (e) {
    return antwort({ ok: false, error: "Speicher nicht erreichbar" }, 503);
  }
}
