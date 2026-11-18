/* Einfache Zugriffsgrenze (Rate Limiting) im Speicher des Servers: höchstens `max` Anfragen je Schlüssel in `fensterMs`.
   Schlüssel ist der Shop: über den App-Proxy kommen alle Anfragen von Shopify, die IP des Kunden ist hier nicht verlässlich.
   Gilt je Server-Prozess; bei mehreren Prozessen braucht es einen gemeinsamen Speicher (z. B. Redis). */
export function zugriffsGrenze({ max = 600, fensterMs = 60_000, jetzt = () => Date.now() } = {}) {
  const zaehler = new Map();
  return function erlaubt(schluessel) {
    const t = jetzt();
    let z = zaehler.get(schluessel);
    if (!z || t - z.start >= fensterMs) { z = { start: t, n: 0 }; zaehler.set(schluessel, z); }
    z.n++;
    if (zaehler.size > 10_000) for (const [k, v] of zaehler) if (t - v.start >= fensterMs) zaehler.delete(k);   // alte Einträge aufräumen
    return z.n <= max;
  };
}
