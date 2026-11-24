"""Übersicht zum Hosen-Check (24.11.): je angezeigter Hose eine Zeile mit Produktform und Anprobe von vorn, seitlich, hinten
(Bilder von werkzeuge/hosen-check.mjs), daneben Name und Ergebnis der Schranke; ausgeblendete Hosen unten mit Grund.
  python3 werkzeuge/python/hosen_uebersicht.py [docs/tests/hosen-check]"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

ordner = sys.argv[1] if len(sys.argv) > 1 else "docs/tests/hosen-check"
E = json.load(open(os.path.join(ordner, "hosen-check.json")))
def schrift(g):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/freefont/FreeSans.ttf"]:
        if os.path.exists(f): return ImageFont.truetype(f, g)
    return ImageFont.load_default()
ANS = [("produkt", "vorn"), ("produkt", "seite"), ("produkt", "hinten"), ("anprobe", "vorn"), ("anprobe", "seite"), ("anprobe", "hinten")]
H, rand, kopf = 300, 230, 40
def bild(k, f, a):
    p = os.path.join(ordner, f"{k}_{f}_{a}.jpg")
    if not os.path.exists(p): return None
    im = Image.open(p).convert("RGB"); w, h = im.size; im = im.crop((int(w * .12), int(h * .03), int(w * .88), int(h * .97)))
    return im.resize((int(im.width * H / im.height), H))
zeigen = [k for k, r in E.items() if r and not r.get("bad") and os.path.exists(os.path.join(ordner, f"{k}_produkt_vorn.jpg"))]
weg = [k for k, r in E.items() if r and r.get("bad")]
probe = next((bild(k, "produkt", "vorn") for k in zeigen if bild(k, "produkt", "vorn")), None)
W = probe.width if probe else 200
blatt = Image.new("RGB", (rand + 6 * (W + 6), kopf + len(zeigen) * (H + 10) + 40 + 26 * len(weg)), "white"); d = ImageDraw.Draw(blatt)
for j, (f, a) in enumerate(ANS):
    d.text((rand + j * (W + 6) + 6, 10), ("Produkt " if f == "produkt" else "Anprobe ") + a, fill="black", font=schrift(18))
for z, k in enumerate(zeigen):
    r, y = E[k], kopf + z * (H + 10)
    d.text((8, y + 8), r["label"][:26], fill="black", font=schrift(17))
    o = r.get("ori") or {}
    d.text((8, y + 34), f"Schlitz vorn: {'ja' if (o.get('s') or 0) > 0 else 'unsicher'} ({o.get('s')})" + (" getauscht" if o.get("getauscht") else ""), fill="black", font=schrift(14))
    for i, form in enumerate(["produkt", "anprobe"]):
        q = (r.get("beine") or {}).get(form) or {}
        d.text((8, y + 56 + 20 * i), f"Beine getrennt ({'Produkt' if form == 'produkt' else 'Anprobe'}): {'ja' if q.get('zeilen') and not q.get('verbunden') else 'NEIN'}", fill="black", font=schrift(14))
    for j, (f, a) in enumerate(ANS):
        im = bild(k, f, a)
        if im: blatt.paste(im, (rand + j * (W + 6), y))
y = kopf + len(zeigen) * (H + 10) + 6
if weg:
    d.text((8, y), "Ausgeblendet (Schranke):", fill="black", font=schrift(18)); y += 28
    for k in weg:
        d.text((8, y), f"{E[k]['label']}: {', '.join(E[k].get('maengel') or [E[k]['bad']])}", fill=(160, 0, 0), font=schrift(15)); y += 26
blatt.save(os.path.join(ordner, "uebersicht.jpg"), quality=85)
print(os.path.join(ordner, "uebersicht.jpg"), len(zeigen), "angezeigt,", len(weg), "ausgeblendet")
