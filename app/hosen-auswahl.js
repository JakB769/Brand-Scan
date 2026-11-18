/* <passform-hosen>: Hosen-Auswahl als eigenständige Komponente (Web Component, keine Abhängigkeiten, 18.10.).
   Wird in der Anprobe-Seite (app/index.html) für den Avatar benutzt und lässt sich genauso auf der Hauptwebsite oder im
   Shopify-Theme mit allen Produkten einbinden:

     <script src="hosen-auswahl.js" defer></script>
     <passform-hosen quelle="/apps/passform/produkte"></passform-hosen>

   Daten (nie fest im Code):
   - Attribut quelle: Adresse einer JSON-Liste, wird beim Einfügen und bei jeder Änderung geladen;
   - oder Eigenschaft .produkte = [...] (z. B. aus einer eigenen Shop-Abfrage).
   Verstanden werden [{id, titel|title|name, bild|image|src, preis?, url?}], Shopify-Produkte ({products:[{id, title, handle,
   images:[{src}]|image:{src}, variants:[{price}]}]}) und {produkte:[...]} bzw. {hosen:[...]}.
   Auswahl: Ereignis "hose-gewaehlt" (detail: {id, produkt}); Eigenschaft .gewaehlt (id) setzt oder liest die Auswahl.
   Attribut leer="…": Text, wenn die Liste leer ist. Normales Skript (kein Modul): läuft auch, wenn die Seite als Datei geöffnet
   wird; window.PassformHosen und window.passformProdukteAus für eigene Seiten.

   <passform-produkte> (22.10.): dieselbe Auswahl für ein ganzes Outfit, Oberteile und Hosen/Röcke in je einer Reihe, je Reihe
   eine Auswahl. Art je Produkt aus typ|type|kategorie|product_type (Shirt, T-Shirt, Top, Langarm, Pullover … = Oberteil,
   sonst Unterteil). Ereignis "produkt-gewaehlt" (detail: {id, typ: "oberteil"|"unterteil", produkt, gewaehlt}); bei Unterteilen
   zusätzlich "hose-gewaehlt" wie oben. .gewaehlt = {oberteil, unterteil} (lesen und setzen; Antippen der Auswahl hebt sie auf). */
(()=>{

const typVon = t => /\b(oberteil|shirt|t-shirt|tshirt|top|tank|langarm|longsleeve|pullover|hoodie|bluse|hemd|sweat|tee)\b/i.test(t) && !/\b(hose|jeans|rock|skirt|shorts|pants|trousers)\b/i.test(t) ? "oberteil" : "unterteil";
function produkteAus(daten) {
  const liste = Array.isArray(daten) ? daten : daten && (daten.products || daten.produkte || daten.hosen || daten.items) || [];
  const txt = v => typeof v === "string" ? v : v == null ? "" : String(v);
  const bildVon = p => { const b = p.bild ?? p.image ?? p.src ?? p.thumbnail ?? (Array.isArray(p.images) && p.images.length ? p.images[0] : null) ?? p.featured_image;
    return txt(b && typeof b === "object" ? b.src || b.url : b); };
  return liste.filter(p => p && typeof p === "object" && (p.id != null || p.handle)).slice(0, 500).map(p => ({
    id: txt(p.id ?? p.handle).slice(0, 80),
    titel: txt(p.titel ?? p.title ?? p.name ?? p.label).slice(0, 120),
    bild: bildVon(p),
    preis: txt(p.preis ?? p.price ?? (Array.isArray(p.variants) && p.variants[0] ? p.variants[0].price : null) ?? "").slice(0, 30),
    url: txt(p.url ?? (p.handle ? "/products/" + p.handle : "")).slice(0, 300),
    typ: typVon(txt(p.typ ?? p.type ?? p.kategorie ?? p.product_type ?? "") + " " + txt(p.titel ?? p.title ?? p.name ?? "")),
  }));
}
// nur Bilder aus sicheren Quellen (http(s), relativ, data:image) – kein javascript: o. ä.
const sicherBild = u => /^(https?:\/\/|\/(?!\/)|\.{0,2}\/|data:image\/(png|jpe?g|webp|gif);base64,)/i.test(u) || /^[\w\-./]+\.(png|jpe?g|webp|gif|avif)$/i.test(u);

const STIL = `:host{display:block;font:inherit;color:inherit}
.reihe{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 8px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
button{flex:0 0 auto;width:112px;scroll-snap-align:start;display:flex;flex-direction:column;align-items:stretch;gap:6px;padding:6px;
  border-radius:14px;border:1.5px solid var(--passform-rand,rgba(127,127,127,.25));background:var(--passform-flaeche,transparent);
  color:inherit;font:inherit;cursor:pointer;text-align:left;min-height:44px}
button[aria-pressed="true"]{border-color:var(--passform-akzent,#0a84ff);box-shadow:0 0 0 2px var(--passform-akzent,#0a84ff) inset}
button:focus-visible{outline:2px solid var(--passform-akzent,#0a84ff);outline-offset:2px}
img,.platz{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:9px;background:rgba(127,127,127,.12)}
.platz{display:grid;place-items:center;font-size:28px}
b{font-size:13.5px;font-weight:600;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
span{font-size:12.5px;opacity:.7}
.leer{font-size:13.5px;opacity:.7;padding:6px 2px}`;

class PassformHosen extends HTMLElement {
  static get observedAttributes() { return ["quelle"]; }
  constructor() { super(); this._p = []; this._g = null; this._laed = 0; this.attachShadow({ mode: "open" }); }
  connectedCallback() { if (this.getAttribute("quelle")) this.laden(); else this.zeichnen(); }
  attributeChangedCallback(n, a, b) { if (n === "quelle" && a !== b && this.isConnected && b) this.laden(); }
  get produkte() { return this._p.slice(); }
  set produkte(v) { this._p = produkteAus(v); if (this._g != null && !this._p.some(p => p.id === this._g)) this._g = null; this.zeichnen(); }
  get gewaehlt() { return this._g; }
  set gewaehlt(id) { this._g = id == null ? null : String(id); for (const b of this.shadowRoot.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.id === this._g)); }
  async laden() {
    const nr = ++this._laed, url = this.getAttribute("quelle");
    try { const r = await fetch(url, { credentials: "same-origin" }); if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json(); if (nr === this._laed) this.produkte = j; }
    catch (e) { if (nr === this._laed) { this._p = []; this.zeichnen("Hosen konnten nicht geladen werden."); }
      this.dispatchEvent(new CustomEvent("hosen-fehler", { detail: { fehler: String(e && e.message || e) } })); }
  }
  zeichnen(meldung) {
    const R = this.shadowRoot; R.textContent = "";
    const st = document.createElement("style"); st.textContent = STIL; R.appendChild(st);
    if (!this._p.length) { const d = document.createElement("div"); d.className = "leer"; d.textContent = meldung || this.getAttribute("leer") || "Noch keine Hosen."; R.appendChild(d); return; }
    const reihe = document.createElement("div"); reihe.className = "reihe"; reihe.setAttribute("role", "group"); reihe.setAttribute("aria-label", this.getAttribute("aria-label") || "Hosen");
    for (const p of this._p) {
      const b = document.createElement("button"); b.type = "button"; b.dataset.id = p.id; b.setAttribute("aria-pressed", String(p.id === this._g));
      if (p.bild && sicherBild(p.bild)) { const im = document.createElement("img"); im.src = p.bild; im.alt = ""; im.loading = "lazy"; im.decoding = "async"; b.appendChild(im); }
      else { const d = document.createElement("div"); d.className = "platz"; d.textContent = "👖"; b.appendChild(d); }
      const t = document.createElement("b"); t.textContent = p.titel || "Hose"; b.appendChild(t);
      if (p.preis) { const s = document.createElement("span"); s.textContent = p.preis; b.appendChild(s); }
      b.addEventListener("click", () => { this.gewaehlt = p.id; this.dispatchEvent(new CustomEvent("hose-gewaehlt", { detail: { id: p.id, produkt: { ...p } }, bubbles: true, composed: true })); });
      reihe.appendChild(b);
    }
    R.appendChild(reihe);
  }
}
if (!customElements.get("passform-hosen")) customElements.define("passform-hosen", PassformHosen);

const GRUPPEN = [["oberteil", "Oberteile", "👕"], ["unterteil", "Hosen und Röcke", "👖"]];
class PassformProdukte extends PassformHosen {
  constructor() { super(); this._w = { oberteil: null, unterteil: null }; }
  set produkte(v) { this._p = produkteAus(v); for (const k in this._w) if (this._w[k] != null && !this._p.some(p => p.id === this._w[k])) this._w[k] = null; this.zeichnen(); }
  get produkte() { return this._p.slice(); }
  get gewaehlt() { return { ...this._w }; }
  set gewaehlt(v) { v = v && typeof v === "object" ? v : {}; for (const k in this._w) if (k in v) this._w[k] = v[k] == null ? null : String(v[k]);
    for (const b of this.shadowRoot.querySelectorAll("button")) b.setAttribute("aria-pressed", String(this._w[b.dataset.typ] === b.dataset.id)); }
  zeichnen(meldung) {
    const R = this.shadowRoot; R.textContent = "";
    const st = document.createElement("style"); st.textContent = STIL + "h4{margin:6px 2px 2px;font-size:13px;font-weight:600;opacity:.75}"; R.appendChild(st);
    if (!this._p.length) { const d = document.createElement("div"); d.className = "leer"; d.textContent = meldung || this.getAttribute("leer") || "Noch keine Produkte."; R.appendChild(d); return; }
    for (const [typ, name, icon] of GRUPPEN) {
      const liste = this._p.filter(p => p.typ === typ); if (!liste.length) continue;
      const h = document.createElement("h4"); h.textContent = name; R.appendChild(h);
      const reihe = document.createElement("div"); reihe.className = "reihe"; reihe.setAttribute("role", "group"); reihe.setAttribute("aria-label", name);
      for (const p of liste) {
        const b = document.createElement("button"); b.type = "button"; b.dataset.id = p.id; b.dataset.typ = typ; b.setAttribute("aria-pressed", String(this._w[typ] === p.id));
        if (p.bild && sicherBild(p.bild)) { const im = document.createElement("img"); im.src = p.bild; im.alt = ""; im.loading = "lazy"; im.decoding = "async"; b.appendChild(im); }
        else { const d = document.createElement("div"); d.className = "platz"; d.textContent = icon; b.appendChild(d); }
        const t = document.createElement("b"); t.textContent = p.titel || name; b.appendChild(t);
        if (p.preis) { const s = document.createElement("span"); s.textContent = p.preis; b.appendChild(s); }
        b.addEventListener("click", () => { const neu = this._w[typ] === p.id ? null : p.id; this.gewaehlt = { [typ]: neu };
          const detail = { id: neu, typ, produkt: { ...p }, gewaehlt: this.gewaehlt };
          this.dispatchEvent(new CustomEvent("produkt-gewaehlt", { detail, bubbles: true, composed: true }));
          if (typ === "unterteil" && neu) this.dispatchEvent(new CustomEvent("hose-gewaehlt", { detail: { id: p.id, produkt: { ...p } }, bubbles: true, composed: true })); });
        reihe.appendChild(b);
      }
      R.appendChild(reihe);
    }
  }
}
if (!customElements.get("passform-produkte")) customElements.define("passform-produkte", PassformProdukte);
window.PassformHosen = PassformHosen; window.PassformProdukte = PassformProdukte; window.passformProdukteAus = produkteAus;
})();
