/* „Link einfügen“: holt eine Shop-Seite und ihre Bilder für die Seite (Netlify Function, Node 18+, ohne Abhängigkeiten).

   GET /api/holen?url=<Produktseite>   → JSON: Name, Bilder der Hose, Text, Maßtabellen-Text, Model-Größe, Damen/Herren
   GET /api/holen?bild=<Bild>&ref=<Seite> → das Bild selbst (der Browser darf fremde Bilder sonst nicht auslesen)

   Ein Browser kann fremde Shop-Seiten nicht selbst lesen (CORS), darum dieser kleine Server-Teil. Er läuft nur, wenn die
   Seite über Netlify mit GitHub verbunden ist (Netlify Drop kann keine Funktionen); lokal über werkzeuge/server.mjs.
   Schutz: nur http(s), keine Adressen im eigenen Netz (außer HOLEN_LOKAL=1 für Tests), höchstens 5 Weiterleitungen,
   Zeit- und Größengrenzen, Bilder nur mit Bild-Inhaltstyp. Shops mit Schutz gegen automatische Abrufe (z. B. Zalando,
   Hollister) werden nicht umgangen: dann kommt eine klare Meldung, und es bleiben Screenshots. */
import dns from "node:dns/promises";
import net from "node:net";

export const config = { path: "/api/holen" };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const lokal = () => process.env.HOLEN_LOKAL === "1";
const fehler = (text, code = 400, extra = {}) => Object.assign(new Error(text), { code, extra });

/* ---------- Abruf mit Schutzregeln ---------- */
function privat(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b < 128) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b < 32) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const s = ip.toLowerCase();
  if (s.startsWith("::ffff:")) return privat(s.slice(7));
  return s === "::" || s === "::1" || s.startsWith("fc") || s.startsWith("fd") || s.startsWith("fe8") || s.startsWith("fe9") ||
    s.startsWith("fea") || s.startsWith("feb") || s.startsWith("ff");
}
async function pruefeUrl(u) {
  let x; try { x = new URL(u); } catch { throw fehler("Das ist kein gültiger Link"); }
  if (!/^https?:$/.test(x.protocol)) throw fehler("Nur Links mit http oder https");
  if (x.username || x.password) throw fehler("Links mit Zugangsdaten gehen nicht");
  if (x.port && !["80", "443"].includes(x.port) && !lokal()) throw fehler("Dieser Port ist nicht erlaubt");
  const host = x.hostname.replace(/^\[|\]$/g, "");
  let ips;
  try { ips = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map(a => a.address); }
  catch {
    // hinter einem Proxy (lokale Cloud-Umgebung) löst erst der Proxy den Namen auf; dort gibt es kein eigenes Netz zu schützen
    if (process.env.NODE_USE_ENV_PROXY === "1" && process.env.HTTPS_PROXY && !net.isIP(host) && host.includes(".")) return x;
    throw fehler(`Den Shop ${host} gibt es nicht (Adresse nicht gefunden)`, 404);
  }
  if (!lokal() && (!ips.length || ips.some(privat))) throw fehler("Diese Adresse ist nicht erlaubt");
  return x;
}
async function lies(r, max) {
  const len = +r.headers.get("content-length") || 0;
  if (len > max) throw fehler("Datei zu groß", 413);
  const reader = r.body.getReader(), teile = []; let n = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    n += value.length; if (n > max) { try { await reader.cancel(); } catch {} throw fehler("Datei zu groß", 413); }
    teile.push(value);
  }
  return Buffer.concat(teile.map(t => Buffer.from(t)));
}
async function hole(u, { accept = "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8", max = 5e6, referer = null } = {}) {
  let url = u; const jar = new Map();
  for (let i = 0; i < 6; i++) {
    const x = await pruefeUrl(url);
    const h = { "user-agent": UA, accept, "accept-language": "de-AT,de;q=0.9,en;q=0.7" };
    if (referer) h.referer = referer;
    if (jar.size) h.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    let r;
    try { r = await fetch(x, { redirect: "manual", headers: h, signal: AbortSignal.timeout(15000) }); }
    catch (e) { throw fehler(`Der Shop antwortet nicht (${e.name === "TimeoutError" ? "Zeitüberschreitung" : "keine Verbindung"})`, 504); }
    for (const c of (r.headers.getSetCookie ? r.headers.getSetCookie() : [])) { const m = /^([^=;\s]+)=([^;]*)/.exec(c); if (m) jar.set(m[1], m[2]); }
    if ([301, 302, 303, 307, 308].includes(r.status)) {
      const loc = r.headers.get("location"); if (!loc) break;
      url = new URL(loc, x).href; continue;
    }
    return { status: r.status, type: (r.headers.get("content-type") || "").toLowerCase(), url: x.href, body: await lies(r, max) };
  }
  throw fehler("Zu viele Weiterleitungen", 508);
}

/* ---------- HTML lesen (ohne Bibliothek, robust genug für Produktseiten) ---------- */
const BENANNT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö",
  Uuml: "Ü", szlig: "ß", eacute: "é", egrave: "è", agrave: "à", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”",
  ldquo: "„", bdquo: "„", hellip: "…", deg: "°", times: "×", frac12: "½", reg: "®", trade: "™", copy: "©", euro: "€", prime: "′", Prime: "″" };
const ent = s => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, k) => k[0] === "#"
  ? String.fromCodePoint(k[1].toLowerCase() === "x" ? parseInt(k.slice(2), 16) : +k.slice(1)) : BENANNT[k] ?? m);
function textOf(html) {
  return ent(String(html)
    .replace(/<(script|style|noscript|svg|template|head)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\s+/g, " ")
    .replace(/<\/?(t[dh])\b[^>]*>/gi, "\t")
    .replace(/<(br|\/tr|\/p|\/div|\/li|\/h\d|\/dt|\/dd|\/section|\/option|\/button|\/span)\b[^>]*>/gi, m => /span/i.test(m) ? " " : "\n")
    .replace(/<[^>]+>/g, " "))
    .split("\n").map(l => l.replace(/[  ]+/g, " ").replace(/\t[ \t]*/g, "\t").replace(/^\s+|\s+$/g, "")).filter(Boolean).join("\n");
}
const attr = (tag, name) => { const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag); return m ? ent(m[2] ?? m[3]) : null; };
function metaTags(html) {
  const o = {};
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) { const p = attr(m[0], "property") || attr(m[0], "name"), c = attr(m[0], "content"); if (p && c && !o[p.toLowerCase()]) o[p.toLowerCase()] = c; }
  return o;
}
function jsonLd(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    let j; try { j = JSON.parse(m[1].trim()); } catch { try { j = JSON.parse(m[1].trim().replace(/,\s*([}\]])/g, "$1")); } catch { continue; } }
    const walk = o => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") {
      const t = [].concat(o["@type"] || []); if (t.some(x => /^(Product|ProductGroup|IndividualProduct)$/.test(x))) out.push(o);
      for (const v of Object.values(o)) if (v && typeof v === "object") walk(v); } };
    walk(j);
  }
  return out;
}
const bildUrls = v => [].concat(v || []).flatMap(x => typeof x === "string" ? [x] : x && typeof x === "object" ? [x.contentUrl || x.url].filter(Boolean) : []);
const absolut = (u, base) => { try { return new URL(String(u).replace(/^\/\//, "https://"), base).href; } catch { return null; } };
const istBild = u => /\.(jpe?g|png|webp|avif)(\?|$)/i.test(u) || /\/(images?|media|img)\//i.test(u) && !/\.(mp4|webm|svg|gif|js|css)(\?|$)/i.test(u);
const unnuetz = u => /logo|icon|sprite|placeholder|swatch|favicon|payment|badge|flag|banner|\.svg|\.gif|\.mp4/i.test(u);
const breiteIn = u => { const m = /[?&](?:w|width|sw|wid|imwidth|resize\.width)=(\d{2,4})/i.exec(u); return m ? +m[1] : null; };
// Schlüssel eines Bildes: die letzten drei Teile des Pfads (dieselbe Datei kommt oft über verschiedene Bildserver-Pfade)
const dateiname = u => { try { return decodeURIComponent(new URL(u).pathname).toLowerCase().split("/").filter(Boolean).slice(-3).join("/"); } catch { return u; } };

/* Größere Fassung desselben Bildes aus dem HTML nehmen, wenn es eine mit 900–2000 Punkten Breite gibt (die Originale sind oft
   mehrere MB groß), sonst das Original. */
function besteFassung(u, alle) {
  const name = dateiname(u), w0 = breiteIn(u);
  if (w0 && w0 >= 900 && w0 <= 2000) return u;
  let best = null, bd = 1e9;
  for (const v of alle) { if (dateiname(v) !== name) continue; const w = breiteIn(v); if (!w || w < 900 || w > 2000) continue; const d = Math.abs(w - 1400); if (d < bd) { bd = d; best = v; } }
  return best || u;
}
function alleBildUrls(html, base) {
  const s = html.replace(/\\u002F/gi, "/").replace(/\\\//g, "/").replace(/&amp;/g, "&");
  const set = new Set();
  for (const m of s.matchAll(/(?:https?:)?\/\/[^\s"'<>()\\,]{1,400}?\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>()\\]{0,400})?/gi)) { const a = absolut(m[0], base); if (a) set.add(a); }
  for (const m of s.matchAll(/\b(?:src|data-src|data-zoom|data-large|href)\s*=\s*["']([^"']+)["']/gi)) { const a = absolut(m[1], base); if (a && istBild(a)) set.add(a); }
  return [...set];
}
function tabellenText(html) {
  const t = [];
  for (const m of html.matchAll(/<table\b[\s\S]*?<\/table>/gi)) { const x = textOf(m[0]); if (/\d/.test(x) && /cm|inch|zoll|gr(ö|oe)(ß|ss)e|size|taille|waist|bund|l(ä|ae)nge|length|h(ü|ue)fte|hip|saum|hem/i.test(x)) t.push(x); }
  return t.join("\n\n");
}
/* Model-Größe: „Das Modell trägt Größe 26 und ist 175 cm“, „Model is 6'1" and wears size 32“, „Größe des Models: 189 cm“ */
function modelInfo(text) {
  const o = {};
  const satz = (text.match(/[^.\n]{0,90}\b(model|modell|models|mannequin|modèle)\b[^.\n]{0,120}/gi) || []);
  for (const s of satz) {
    if (!o.height) { const m = /\b(1[5-9]\d|20\d)\s?cm\b/.exec(s) || /\b(1)[,.](\d{2})\s?m\b/.exec(s);
      if (m) o.height = m[2] ? +(m[1] + m[2]) : +m[1];
      else { const f = /\b([5-6])\s?(?:'|′|ft|foot|feet)\s?(\d{1,2})?\s?(?:"|″|''|in)?/i.exec(s); if (f) o.height = Math.round((+f[1] * 12 + (+f[2] || 0)) * 2.54); } }
    if (!o.size) { const m = /(?:tr(?:ä|ae)gt|tr(?:ä|ae)gt die|wears?|wearing|in)\s+(?:die\s+|a\s+|the\s+)?(?:gr(?:ö|oe)(?:ß|ss)e|size|taglia|taille)\s*:?\s*(W?\d{2}\s?(?:[xX×\/]|\s?L)\s?L?\d{2}\b|[A-Z]{1,4}\b|W?\d{2}|\d{2,3})/i.exec(s)
        || /(?:gr(?:ö|oe)(?:ß|ss)e|size)\s*:?\s*([A-Z]{1,4}|W?\d{2}(?:\/L?\d{2})?)\b[^.]{0,40}\b(?:tr(?:ä|ae)gt|wears)/i.exec(s);
      if (m) { o.size = m[1].replace(/\s/g, "").toUpperCase().replace("×", "X");
        // US-Jeansgrößen „32 X 34“ / „W32 L34“: Bundweite und Innenbein in Zoll
        const wl = /^W?(\d{2})(?:X|\/|L)L?(\d{2})$/.exec(o.size); if (wl && +wl[1] >= 22 && +wl[1] <= 48 && +wl[2] >= 24 && +wl[2] <= 38) { o.w = +wl[1]; o.l = +wl[2]; } } }
    if (o.height && !o.text) o.text = s.trim();
  }
  return o;
}
function geschlecht(...teile) {
  const s = teile.filter(Boolean).join(" ").toLowerCase();
  const w = (s.match(/\b(damen|frauen|women|womens|woman|ladies|femme|donna|mujer|-woman-|\/women\/|\/damen\/)\b/g) || []).length;
  const m = (s.match(/\b(herren|männer|maenner|men|mens|man|homme|uomo|hombre|\/men\/|\/herren\/)\b/g) || []).length;
  return w > m ? "damen" : m > w ? "herren" : null;
}
/* Kennung des Produkts aus Link und JSON-LD (für die Bilder, falls es kein JSON-LD gibt) */
function kennungen(url, ld) {
  const k = new Set();
  for (const p of ld) for (const f of ["sku", "mpn", "productID", "productGroupID"]) if (p[f]) k.add(String(p[f]).toLowerCase());
  for (const t of new URL(url).pathname.split(/[\/_.\-]/)) if (t.length >= 5 && /\d/.test(t) && /^[a-z0-9]+$/i.test(t)) k.add(t.toLowerCase());
  return [...k];
}

async function seite(url) {
  const r = await hole(url, { max: 6e6 });
  const html = r.body.toString("utf8");
  const blockiert = r.status === 403 || r.status === 418 || r.status === 429 || r.status === 503 ||
    (r.status === 200 && html.length < 6000 && /captcha|challenge|access denied|robot|bot detection|enable javascript|_Incapsula|akamai/i.test(html));
  if (blockiert) throw fehler("Der Shop lässt keine automatischen Abrufe zu (Schutz gegen Bots). Bitte die Bilder speichern oder einen Screenshot machen und hineinziehen.", 502, { blocked: true, status: r.status });
  // manche Shops melden einen Fehler und liefern trotzdem die ganze Seite (Hollister: 501 mit Produkt)
  if (r.status >= 400 && !(r.status >= 500 && html.length > 100000)) throw fehler(`Die Seite gibt es nicht (Fehler ${r.status})`, 502, { status: r.status });
  if (!/html|xml|json/.test(r.type) && r.type) throw fehler("Der Link führt nicht zu einer Seite, sondern zu einer Datei. Bilder bitte direkt hineinziehen.");
  const base = r.url, meta = metaTags(html), ld = jsonLd(html), notes = [];
  let name = null, beschreibung = "", material = null, bilder = [], shop = null;

  // Shopify (die Shops unserer Kunden): /products/<name>.js liefert alle Produktbilder und die Beschreibung
  const sp = /\/products\/([^/?#]+)/.exec(new URL(base).pathname);
  if (sp && (/cdn\.shopify\.com|Shopify\.shop|shopify-section/i.test(html) || meta["og:type"] === "product")) {
    try {
      const j = await hole(new URL(`/products/${sp[1]}.js`, base).href, { accept: "application/json", max: 3e6 });
      const p = JSON.parse(j.body.toString("utf8"));
      name = p.title || null; beschreibung = p.description ? textOf(p.description) : "";
      bilder = (p.images || []).map(u => absolut(u, base)).filter(Boolean); shop = "shopify";
      if (beschreibung) notes.push("Shopify-Beschreibung gelesen");
    } catch {}
  }
  for (const p of ld) {
    if (!name && p.name) name = ent(p.name);
    if (!beschreibung && p.description) beschreibung = textOf(String(p.description));
    if (!material && p.material) material = [].concat(p.material).join(", ");
    if (!shop && p.image) bilder.push(...bildUrls(p.image).map(u => absolut(u, base)).filter(Boolean));
    for (const v of [].concat(p.hasVariant || []).slice(0, 3)) if (!shop && v && v.image) bilder.push(...bildUrls(v.image).map(u => absolut(u, base)).filter(Boolean));
  }
  if (!name) name = meta["og:title"] || (/<title[^>]*>([^<]*)/i.exec(html) || [])[1] || null;
  const alle = alleBildUrls(html, base);
  if (!bilder.length) {
    const ks = kennungen(base, ld);
    bilder = alle.filter(u => ks.some(k => u.toLowerCase().includes(k)));
    if (meta["og:image"]) bilder.unshift(absolut(meta["og:image"], base));
  }
  // Bildserver von Adobe (Scene7, „/is/image/…_prod1“): die Geschwister prod1–3 (flach) und model1–4 (getragen) gibt es meist auch
  for (const [i, u] of [...bilder].entries()) {
    const m = /^(https?:\/\/[^?]+\/is\/image\/[^/]+\/[^?/]+?)_(prod|model|life|hover)\d+(\?.*)?$/i.exec(u || "");
    if (!m) continue;
    const q = (m[3] || "").replace(/product-(small|medium)/i, "product-large");
    bilder[i] = u.replace(/product-(small|medium)/i, "product-large");
    for (const k of ["prod1", "prod2", "prod3", "model1", "model2", "model3", "model4"]) bilder.push(`${m[1]}_${k}${q}`);
  }
  // aufräumen: keine Videos/Logos, je Datei nur eine Fassung, in sinnvoller Größe
  const gesehen = new Set(), liste = [];
  for (const u of bilder) {
    if (!u || unnuetz(u) || /\.(mp4|webm|mov)(\?|$)/i.test(u)) continue;
    const k = dateiname(u); if (gesehen.has(k)) continue; gesehen.add(k);
    liste.push(besteFassung(u, alle));
  }
  if (!liste.length) notes.push("keine Produktbilder gefunden");

  // Text: sichtbarer Text der Seite, Tabellen darin, verlinkte Größentabellen (gleicher Shop, höchstens 3)
  const text = textOf(html).slice(0, 60000);
  let tabellen = tabellenText(html);
  const host = new URL(base).hostname.split(".").slice(-2).join(".");
  const links = new Set();
  for (const m of html.matchAll(/\b(?:href|data-href|data-url|data-src|data-link)\s*=\s*["']([^"']+)["']/gi)) {
    const a = absolut(ent(m[1]), base);
    if (a && /size.?(chart|guide)|gr(ö|oe|%c3%b6)(ß|ss|%c3%9f)en.?(tabelle|ratgeber|berater|guide)|measur(ing|ement)|fit.?guide|ma(ß|ss|%c3%9f)tabelle/i.test(a) && new URL(a).hostname.endsWith(host) && !istBild(a) && a.split("#")[0] !== base.split("#")[0]) links.add(a);
  }
  const gelesen = [];
  for (const a of [...links].slice(0, 3)) {
    try {
      const g = await hole(a, { max: 2e6, referer: base }); if (g.status >= 400) continue;
      let s = g.body.toString("utf8");
      if (/json/.test(g.type) || /^\s*[{[]/.test(s)) { try { const j = JSON.parse(s); s = Object.values(j).filter(v => typeof v === "string" && /</.test(v)).join("\n"); } catch {} }
      const t = textOf(s); if (/\d/.test(t)) { tabellen += (tabellen ? "\n\n" : "") + t; gelesen.push(a); }
    } catch {}
  }
  const model = modelInfo([beschreibung, text, tabellen].join("\n"));
  // Material aus dem Seitentext, wenn es nicht im JSON-LD steht: Zeilen mit Prozent und Faser („98% Baumwolle, 2% Elasthan“)
  if (!material) {
    const faser = /baumwolle|cotton|elasth?an|elastane|spandex|polyester|viskose|viscose|leinen|linen|wolle|wool|lyocell|tencel|nylon|polyamid|modal|hanf|hemp|t400|acryl/i;
    const z = (beschreibung + "\n" + text).split("\n").filter(l => /\d{1,3}\s?%/.test(l) && faser.test(l) && l.length < 220);
    if (z.length) material = [...new Set(z)].slice(0, 2).join("; ").replace(/^material\s*:?\s*/i, "");
  }
  return {
    ok: true, url: base, shop, name: name ? String(name).trim().slice(0, 120) : null, beschreibung: beschreibung.slice(0, 4000), material,
    bilder: liste.slice(0, 12), text, tabellen: tabellen.slice(0, 40000), tabellenLinks: gelesen, model,
    geschlecht: geschlecht(base, name, text.slice(0, 3000), [...links].join(" ")), notes
  };
}

async function bild(url, ref) {
  const r = await hole(url, { accept: "image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8", max: 5.5e6, referer: ref || null });
  if (r.status >= 400) throw fehler(`Bild nicht erreichbar (Fehler ${r.status})`, 502);
  if (!/^image\/(jpeg|png|webp|avif|gif|heic|heif)/.test(r.type)) throw fehler("Das ist kein Bild", 415);
  return new Response(r.body, { status: 200, headers: { "content-type": r.type.split(";")[0], "cache-control": "public, max-age=86400", "access-control-allow-origin": "*" } });
}

const antwort = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "no-store" } });

export default async function holen(req) {
  const q = new URL(req.url).searchParams;
  try {
    if (q.get("bild")) return await bild(q.get("bild"), q.get("ref"));
    if (q.get("url")) return antwort(await seite(q.get("url")));
    return antwort({ ok: false, error: "Es fehlt der Link (?url=…)" }, 400);
  } catch (e) {
    return antwort({ ok: false, error: e.message || "Das hat nicht geklappt", ...(e.extra || {}) }, e.code && e.code >= 400 ? e.code : 500);
  }
}
