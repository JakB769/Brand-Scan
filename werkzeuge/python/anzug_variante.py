"""Anzughose (Test) aus einer gespeicherten Hose (24.11.): Atlas und Vorschaubild grau eingefärbt (Anzug-Optik), Stoff „anzug“,
Material Schurwolle/Polyester. Die echte Anzughose liegt nicht im Repo; damit gibt es eine Anzughose mit derselben Form wie die
Testhose (z. B. für werkzeuge/einzeldatei.mjs --hosen).
  python3 werkzeuge/python/anzug_variante.py <hose.json> <aus.json> [--label "Anzughose (Test)"] [--key vorab_anzugtest]"""
import base64, io, json, sys
from PIL import Image

a = sys.argv[1:]
def opt(n, d):
    return a[a.index("--" + n) + 1] if "--" + n in a else d
quelle, ziel = a[0], a[1]
d = json.load(open(quelle)); G = d["G"]
def grau(url):
    kopf, b = url.split(",", 1); im = Image.open(io.BytesIO(base64.b64decode(b))).convert("RGB")
    L = im.convert("L").point(lambda l: int(62 + 125 * (l / 255) ** .9))
    out = Image.merge("RGB", (L, L.point(lambda v: min(255, v + 2)), L.point(lambda v: min(255, v + 7))))
    buf = io.BytesIO(); out.save(buf, "PNG" if "png" in kopf else "JPEG", quality=90)
    return kopf + "," + base64.b64encode(buf.getvalue()).decode()
G2 = json.loads(json.dumps(G)); G2["m3"]["atlas"] = grau(G["m3"]["atlas"])
if isinstance(G2.get("src"), str) and G2["src"].startswith("data:image"): G2["src"] = grau(G2["src"])
G2.update(fabric="anzug", material="Schurwolle 70 %, Polyester 30 %", label=opt("label", "Anzughose (Test)"), base={"r": 112, "g": 114, "b": 119, "lum": 114})
json.dump({"key": opt("key", "vorab_anzugtest"), "G": G2}, open(ziel, "w"))
print(ziel, G2["label"])
