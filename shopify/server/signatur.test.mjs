/* Selbsttest der Signaturprüfung: node shopify/server/signatur.test.mjs
   Die Beispiel-Signaturen in der Shopify-Doku sind mit einem unbekannten Shop-Namen gerechnet (dort steht der Platzhalter
   {shop}), darum wird gegen den Text geprüft, den die Doku als Zwischenergebnis zeigt, und mit selbst gerechneten Signaturen. */
import crypto from "node:crypto";
import { proxyText, proxySignatur, proxySignaturOk, proxyFrisch, webhookOk } from "./signatur.mjs";
let fehler = 0; const pruefe = (ok, t) => { console.log((ok ? "ok     " : "FEHLER ") + t); if (!ok) fehler++; };

// 1) Text wie in der Doku (angemeldeter und anonymer Kunde)
const q1 = "extra=1&extra=2&shop={shop}.myshopify.com&logged_in_customer_id=1&path_prefix=%2Fapps%2Fawesome_reviews&timestamp=1317327555&signature=4c68c8624d737112c91818c11017d24d334b524cb5c2b8ba08daa056f7395ddb";
pruefe(proxyText(new URLSearchParams(q1)) === "extra=1,2logged_in_customer_id=1path_prefix=/apps/awesome_reviewsshop={shop}.myshopify.comtimestamp=1317327555", "signierter Text wie in der Doku (angemeldet)");
const q2 = q1.replace("logged_in_customer_id=1", "logged_in_customer_id=");
pruefe(proxyText(new URLSearchParams(q2)) === "extra=1,2logged_in_customer_id=path_prefix=/apps/awesome_reviewsshop={shop}.myshopify.comtimestamp=1317327555", "signierter Text wie in der Doku (anonym)");

// 2) echte Signatur passt, jede Änderung fällt auf
const ohne = new URLSearchParams("produkt=123&shop=test-laden.myshopify.com&logged_in_customer_id=&path_prefix=%2Fapps%2Fpassform&timestamp=1760000000");
const echt = new URLSearchParams(ohne); echt.set("signature", proxySignatur(ohne, "hush"));
pruefe(proxySignaturOk(echt, "hush"), "richtige Signatur angenommen");
pruefe(!proxySignaturOk(echt, "anderes-secret"), "falsches Secret abgelehnt");
const veraendert = new URLSearchParams(echt); veraendert.set("produkt", "124");
pruefe(!proxySignaturOk(veraendert, "hush"), "geänderter Parameter abgelehnt");
const dazu = new URLSearchParams(echt); dazu.append("shop", "fremd.myshopify.com");
pruefe(!proxySignaturOk(dazu, "hush"), "zusätzlicher Parameter abgelehnt");
pruefe(!proxySignaturOk(ohne, "hush"), "ohne Signatur abgelehnt");
const kaputt = new URLSearchParams(echt); kaputt.set("signature", "xyz");
pruefe(!proxySignaturOk(kaputt, "hush"), "unsinnige Signatur abgelehnt (kein Absturz)");
pruefe(!proxySignaturOk(echt, ""), "ohne Secret nie angenommen");
pruefe(proxyFrisch(echt, 300, 1760000100) && !proxyFrisch(echt, 300, 1760001000), "Zeitstempel: 100 s alt gilt, 1000 s alt nicht");

// 3) Webhook: base64-HMAC über den rohen Inhalt
const inhalt = Buffer.from('{"shop_id":954889,"shop_domain":"test-laden.myshopify.com"}');
const kopf = crypto.createHmac("sha256", "hush").update(inhalt).digest("base64");
pruefe(webhookOk(inhalt, kopf, "hush"), "Webhook mit richtiger Signatur angenommen");
pruefe(!webhookOk(Buffer.from(inhalt.toString().replace("954889", "1")), kopf, "hush"), "Webhook mit geändertem Inhalt abgelehnt");
pruefe(!webhookOk(inhalt, undefined, "hush") && !webhookOk(inhalt, "abc", "hush") && !webhookOk(inhalt, "!!", "hush"), "Webhook ohne oder mit kaputter Signatur abgelehnt");

if (fehler) { console.log(fehler + " Fehler"); process.exit(1); }
console.log("Signaturprüfung in Ordnung");
