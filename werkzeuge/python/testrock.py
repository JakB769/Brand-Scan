"""Testbilder Rock und Gürtel (für tdateien.mjs):
- rock_vorne_guertel.jpg: schwarzer A-Linien-Rock, flach von vorne, mit braunem Ledergürtel (goldene Schnalle, steht seitlich
  über, ein Ende hängt herunter). Der Gürtel gehört nicht zum Rock und muss weg.
- rock_hinten.jpg: derselbe Rock von hinten, ohne Gürtel.
- jeans_guertel.jpg: Bershka-Jeans (material/produktfotos/front.jpg) mit aufgemaltem braunem Gürtel samt Schnalle.
Aufruf: python3 werkzeuge/python/testrock.py  (schreibt material/testbilder/rock/)
"""
import os, random
from PIL import Image, ImageDraw
random.seed(7)
os.makedirs("material/testbilder/rock", exist_ok=True)
def stoff(im, box, farbe, n=7):
    px = im.load(); x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if px[x, y] == farbe:
                k = random.randint(-n, n); px[x, y] = tuple(max(0, c + k) for c in farbe)
schwarz, braun, gold = (28, 28, 32), (122, 70, 38), (214, 178, 70)
def rock(guertel):
    im = Image.new("RGB", (700, 900), (240, 238, 235)); d = ImageDraw.Draw(im)
    # A-Linie: Bund 300 breit, Saum 560, Saum leicht gebogen
    d.polygon([(200, 90), (500, 90), (630, 760), (70, 760)], fill=schwarz)
    d.chord([70, 720, 630, 800], 0, 180, fill=schwarz)
    stoff(im, (60, 80, 640, 810), schwarz)
    d.line([(350, 150), (350, 790)], fill=(40, 40, 46), width=2)               # Mittelnaht
    if guertel:
        d.rectangle([168, 100, 532, 128], fill=braun)                          # Band, steht seitlich 32 px über
        d.rectangle([330, 96, 372, 132], outline=gold, width=5)                # Schnalle
        d.polygon([(380, 128), (404, 128), (398, 300), (386, 300)], fill=braun)  # herunterhängendes Ende
        stoff(im, (160, 90, 540, 310), braun, 9)
    return im
rock(True).save("material/testbilder/rock/rock_vorne_guertel.jpg", quality=92)
rock(False).save("material/testbilder/rock/rock_hinten.jpg", quality=92)
# Jeans mit Gürtel: Bundzeilen suchen (erste Zeile mit viel Stoff)
im = Image.open("material/produktfotos/front.jpg").convert("RGB"); px = im.load(); W, H = im.size
def stoffig(p): return sum(p) < 600
y0 = next(y for y in range(H) if sum(1 for x in range(W) if stoffig(px[x, y])) > W * .25)
xs = [x for x in range(W) if stoffig(px[x, y0 + 6])]; xa, xb = min(xs), max(xs)
d = ImageDraw.Draw(im)
d.rectangle([xa - 22, y0 + 6, xb + 22, y0 + 24], fill=braun)
cx = (xa + xb) // 2; d.rectangle([cx - 18, y0 + 2, cx + 18, y0 + 28], outline=gold, width=4)
stoff(im, (xa - 30, y0, xb + 30, y0 + 30), braun, 9)
im.save("material/testbilder/rock/jeans_guertel.jpg", quality=92)
print("geschrieben", y0, xa, xb)
