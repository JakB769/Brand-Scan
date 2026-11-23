"""Vorher/Nachher einer Hose in Bewegung (23.11.): Bilder von werkzeuge/stoff-bewegung.mjs (gleicher Clip, gleiche Bildnummern)
nebeneinander. Ergebnis: <aus>.jpg (ausgewählte Bilder, oben vorher, unten nachher) und <aus>.gif (vorher | nachher als Bewegung).
  python3 werkzeuge/python/stoff_vergleich.py <ordner> <name_vorher> <name_nachher> <aus_ohne_endung> [--titel "..."] [--bilder 6]
      [--zuschnitt 0.28] [--gif-fps 15] [--gif-jedes 2] [--gif-hoehe 300] [--sichtbar <lauf.json>]
--sichtbar: nur Bilder, in denen die Hose gezeigt wird (Anprobe blendet sie z. B. bei hohem Knieheben aus), aus dem JSON des Laufs.
Der Zuschnitt (Anteil oben, der wegfällt) zeigt die Beine größer; die Bilder müssen von derselben Bühne stammen (gleiche Größe)."""
import glob, os, re, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

a = sys.argv[1:]
def opt(n, d):
    return a[a.index("--" + n) + 1] if "--" + n in a else d
ordner, vorher, nachher, aus = a[0], a[1], a[2], a[3]
titel, n_bilder, zu = opt("titel", ""), int(opt("bilder", "6")), float(opt("zuschnitt", "0.28"))
gif_fps, gif_jedes, gif_h = int(opt("gif-fps", "15")), int(opt("gif-jedes", "2")), int(opt("gif-hoehe", "300"))

def bilder(name):
    d = {}
    for f in glob.glob(os.path.join(ordner, name + "_[0-9][0-9][0-9].jpg")):
        d[int(re.search(r"_(\d{3})\.jpg$", f).group(1))] = f
    return d
V, N = bilder(vorher), bilder(nachher)
nr = sorted(set(V) & set(N))
if "--sichtbar" in a:
    import json
    B = json.load(open(opt("sichtbar", "")))["bilder"]; ok = {i for i, q in enumerate(B) if not q.get("leer") and q.get("trk", 1) > .5}
    nr = [i for i in nr if i in ok]
if not nr: sys.exit("keine gemeinsamen Bilder")
def schrift(g):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"]:
        if os.path.exists(f): return ImageFont.truetype(f, g)
    return ImageFont.load_default()
def lade(f, h=None):
    im = Image.open(f).convert("RGB"); w, hh = im.size; im = im.crop((0, int(hh * zu), w, hh))
    if h: im = im.resize((int(im.width * h / im.height), h))
    return im

# 1) Standbilder: gleichmäßig verteilt
wahl = [nr[round(i * (len(nr) - 1) / max(1, n_bilder - 1))] for i in range(n_bilder)]
H = 420; probe = lade(V[wahl[0]], H); W = probe.width; kopf = 46 if titel else 0; rand = 120
blatt = Image.new("RGB", (rand + W * len(wahl) + 6 * (len(wahl) - 1), kopf + 2 * H + 6 + 30), "white"); d = ImageDraw.Draw(blatt)
if titel: d.text((10, 10), titel, fill="black", font=schrift(24))
for zeile, (name, quelle) in enumerate([("vorher", V), ("nachher", N)]):
    y = kopf + zeile * (H + 6); d.text((10, y + H // 2 - 12), name, fill="black", font=schrift(22))
    for k, i in enumerate(wahl):
        blatt.paste(lade(quelle[i], H), (rand + k * (W + 6), y))
for k, i in enumerate(wahl):
    d.text((rand + k * (W + 6) + 4, kopf + 2 * H + 10), f"{i / 30:.1f} s", fill="black", font=schrift(16))
blatt.save(aus + ".jpg", quality=82)

# 2) Bewegung: vorher | nachher nebeneinander als GIF (ffmpeg, eigene Farbpalette)
tmp = tempfile.mkdtemp(prefix="stoffvgl-"); G = gif_h
for k, i in enumerate(nr[::gif_jedes]):
    l, r = lade(V[i], G), lade(N[i], G); c = Image.new("RGB", (l.width + r.width + 4, G + 24), "white")
    c.paste(l, (0, 24)); c.paste(r, (l.width + 4, 24)); dd = ImageDraw.Draw(c)
    dd.text((6, 3), "vorher", fill="black", font=schrift(16)); dd.text((l.width + 10, 3), "nachher", fill="black", font=schrift(16))
    c.save(os.path.join(tmp, f"g{k:04d}.png"))
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(gif_fps), "-i", os.path.join(tmp, "g%04d.png"),
                "-vf", "split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4", aus + ".gif"], check=True)
print(aus + ".jpg", aus + ".gif", f"{len(nr)} Bilder")
