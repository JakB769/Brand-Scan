"""Fotos, aus denen keine realistische Hose werden darf (für tdateien.mjs):
- schief_bein.jpg: hosenförmig, aber ein Bein doppelt so breit wie das andere
- handtuch.jpg: ein Rechteck mit einem schmalen Schlitz unten (sieht von Weitem aus wie zwei Beine)
Aufruf: python3 werkzeuge/python/testunecht.py  (schreibt material/testbilder/unecht/)
"""
import os, random
from PIL import Image, ImageDraw
random.seed(5)
os.makedirs("material/testbilder/unecht", exist_ok=True)
def stoff(im, farbe):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y] == farbe:
                n = random.randint(-8, 8); px[x, y] = tuple(c + n for c in farbe)
blau = (48, 74, 120)
im = Image.new("RGB", (700, 900), (238, 236, 232)); d = ImageDraw.Draw(im)
d.polygon([(200, 60), (480, 60), (500, 380), (180, 380)], fill=blau)              # Leib
d.polygon([(180, 360), (300, 360), (290, 860), (215, 860)], fill=blau)             # schmales Bein
d.polygon([(330, 360), (520, 360), (560, 860), (320, 860)], fill=blau)             # breites Bein
stoff(im, blau); im.save("material/testbilder/unecht/schief_bein.jpg", quality=92)
im = Image.new("RGB", (700, 900), (238, 236, 232)); d = ImageDraw.Draw(im)
d.rectangle([150, 80, 550, 840], fill=(170, 60, 60)); d.rectangle([347, 700, 353, 840], fill=(238, 236, 232))
stoff(im, (170, 60, 60)); im.save("material/testbilder/unecht/handtuch.jpg", quality=92)
print("geschrieben")
