/* Prüft, dass eine Anfrage wirklich von Shopify kommt. Ohne Abhängigkeiten (nur node:crypto).
   - App-Proxy (Kunde im Shop → /apps/passform/… → unser Server): Parameter „signature“ = HMAC-SHA256 (hex) über alle anderen
     Parameter, je „name=wert“ (mehrfache Werte mit Komma verbunden), sortiert, ohne Trennzeichen aneinandergehängt.
     https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies
   - Webhooks (z. B. die Pflicht-Webhooks zum Datenschutz): Kopfzeile X-Shopify-Hmac-SHA256 = HMAC-SHA256 (base64) über den
     unveränderten Inhalt der Anfrage. https://shopify.dev/docs/apps/build/webhooks/verify-deliveries
   Schlüssel ist in beiden Fällen das „Client secret“ der App (Shopify Dev Dashboard / Partner Dashboard). Vergleiche laufen in
   konstanter Zeit (timingSafeEqual), damit sich die Signatur nicht Zeichen für Zeichen erraten lässt. */
import crypto from "node:crypto";

/* Der signierte Text: alle Parameter außer „signature“, je name=wert (mehrfach → mit Komma), sortiert, aneinandergehängt */
export function proxyText(query) {
  const werte = new Map();
  for (const [k, v] of query) { if (k === "signature") continue; if (!werte.has(k)) werte.set(k, []); werte.get(k).push(v); }
  return [...werte].map(([k, v]) => `${k}=${v.join(",")}`).sort().join("");
}
export const proxySignatur = (query, secret) => crypto.createHmac("sha256", secret).update(proxyText(query)).digest("hex");

export function proxySignaturOk(query, secret) {
  if (!secret) return false;
  const sig = query.get("signature");
  if (!sig || !/^[0-9a-f]{64}$/i.test(sig)) return false;
  const soll = Buffer.from(proxySignatur(query, secret), "hex");
  return crypto.timingSafeEqual(soll, Buffer.from(sig, "hex"));
}

/* Zu alt? Shopify setzt „timestamp“ (Sekunden). Eine abgefangene Adresse soll nicht ewig gelten. */
export function proxyFrisch(query, maxSek = 300, jetzt = Date.now() / 1000) {
  const t = +query.get("timestamp");
  return Number.isFinite(t) && Math.abs(jetzt - t) <= maxSek;
}

export function webhookOk(rohInhalt, kopf, secret) {
  if (!secret || typeof kopf !== "string" || !/^[A-Za-z0-9+/]+=*$/.test(kopf)) return false;
  const soll = crypto.createHmac("sha256", secret).update(rohInhalt).digest(), ist = Buffer.from(kopf, "base64");
  return ist.length === soll.length && crypto.timingSafeEqual(ist, soll);
}
