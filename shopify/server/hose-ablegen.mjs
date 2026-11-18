/* Eine Hose einem Produkt im Shop zuordnen (bis es dafür eine Seite im Shopify-Admin gibt):
     node shopify/server/hose-ablegen.mjs <shop>.myshopify.com <Produkt-ID> hosen.json [Nummer der Hose, ab 1]
   hosen.json kommt aus der Seite („⇩ Alle Hosen als Datei“). Die Produkt-ID steht im Shopify-Admin in der Adresse des
   Produkts (…/products/1234567890). Ergebnis: shopify/server/daten/<shop>/<Produkt-ID>.json (anderer Ordner: PASSFORM_DATEN), die der Server ausliefert. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const [shop, produkt, datei, nr = "1"] = process.argv.slice(2);
const stopp = t => { console.log(t); process.exit(1); };
if (!shop || !/^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/.test(shop)) stopp("Aufruf: node shopify/server/hose-ablegen.mjs <shop>.myshopify.com <Produkt-ID> hosen.json [Nummer]");
if (!/^\d{1,20}$/.test(produkt || "")) stopp("Die Produkt-ID besteht nur aus Ziffern (im Admin in der Adresse des Produkts).");
let daten; try { daten = JSON.parse(fs.readFileSync(datei, "utf8")); } catch { stopp(`${datei} ist keine lesbare hosen.json.`); }
const liste = Array.isArray(daten) ? daten : daten && Array.isArray(daten.hosen) ? daten.hosen : [];
const h = liste[+nr - 1];
// dieselben Mindestregeln wie beim Laden in der Seite (dort prüft checkGarment den Rest)
if (!h || typeof h.key !== "string" || !/^[\w-]{1,40}$/.test(h.key) || !h.G || !h.G.m3 || !Array.isArray(h.G.m3.hw)
  || !/^data:image\/(jpeg|png|webp);base64,/.test(h.G.m3.atlas || "")) stopp(`Hose Nummer ${nr} fehlt oder ist beschädigt (${liste.length} Hosen in der Datei).`);
const inhalt = JSON.stringify({ app: "passform", version: 1, hosen: [{ key: h.key, G: h.G }] });
if (inhalt.length > 2e6) stopp("Die Hose ist größer als 2 MB, das ist zu viel.");
const ziel = path.join(process.env.PASSFORM_DATEN || path.join(HIER, "daten"), shop, produkt + ".json");
fs.mkdirSync(path.dirname(ziel), { recursive: true }); fs.writeFileSync(ziel, inhalt);
console.log(`„${h.G.label || h.key}“ liegt jetzt bei Produkt ${produkt} (${Math.round(inhalt.length / 1024)} KB): ${ziel}`);
