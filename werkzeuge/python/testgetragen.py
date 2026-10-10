"""Künstliches Foto „Hose getragen, von hinten“ für tdateien.mjs.

Eine Person von hinten (Hinterkopf, weißes Shirt, Schuhe) mit Jeans: Gesäßtaschen mit orangem Rand, ein gelber Fleck
mitten auf jedem Bein auf Kniehöhe. Dazu die Körperpunkte wie von MediaPipe (normiert, 33 Stück), damit der Test die
Personenerkennung ersetzen kann. Prüft, ob Taschen und Knieflecken nach dem Abwickeln an der richtigen Stelle landen.
Aufruf: python3 werkzeuge/python/testgetragen.py  (schreibt material/testbilder/getragen/)
"""
import json, random
from PIL import Image, ImageDraw

W, H = 600, 1200
random.seed(3)
im = Image.new("RGB", (W, H), (214, 210, 202))
d = ImageDraw.Draw(im)
d.rectangle([0, 1000, W, H], fill=(150, 140, 128))                   # Boden
# Kopf (Haare) und Hals
d.ellipse([255, 30, 345, 140], fill=(52, 38, 30)); d.rectangle([285, 130, 315, 165], fill=(206, 160, 130))
# Shirt mit Armen
d.polygon([(220, 160), (380, 160), (395, 480), (205, 480)], fill=(246, 246, 244))
d.polygon([(220, 165), (175, 200), (150, 470), (180, 475), (205, 260)], fill=(246, 246, 244))
d.polygon([(380, 165), (425, 200), (450, 470), (420, 475), (395, 260)], fill=(206, 160, 130))
# Jeans: Becken und zwei Beine
blau = (52, 78, 122)
d.polygon([(205, 470), (395, 470), (405, 640), (195, 640)], fill=blau)
d.polygon([(195, 600), (298, 600), (288, 1050), (212, 1050)], fill=blau)   # linkes Bein (im Bild links)
d.polygon([(302, 600), (405, 600), (388, 1050), (312, 1050)], fill=blau)   # rechtes Bein
# Stoffstruktur
px = im.load()
for y in range(470, 1050):
    for x in range(190, 410):
        r, g, b = px[x, y]
        if (r, g, b) == blau or abs(b - 122) < 3 and abs(r - 52) < 3:
            n = random.randint(-9, 9); px[x, y] = (r + n, g + n, b + n)
# Gesäßtaschen mit orangem Rand
for x0 in (222, 318):
    d.rectangle([x0, 520, x0 + 60, 590], outline=(235, 130, 40), width=5)
# gelbe Kniepflecken
d.rectangle([232, 812, 268, 824], fill=(240, 215, 40)); d.rectangle([332, 812, 368, 824], fill=(240, 215, 40))
# Schuhe
d.rectangle([205, 1050, 292, 1085], fill=(30, 30, 32)); d.rectangle([308, 1050, 395, 1085], fill=(30, 30, 32))
im.save("material/testbilder/getragen/hinten_getragen.jpg", quality=92)

# Körperpunkte (MediaPipe-Reihenfolge), von hinten: Gesicht kaum sichtbar, linke Seite der Person ist im Bild links
P = [None] * 33
def s(i, x, y, v=0.99): P[i] = {"x": x / W, "y": y / H, "z": 0, "visibility": v}
for i in range(11): s(i, 300, 90, 0.05)                              # Gesicht: nicht zu sehen
s(11, 228, 175); s(12, 372, 175); s(13, 175, 320); s(14, 425, 320); s(15, 160, 460); s(16, 440, 460)
for i, (x, y) in zip(range(17, 23), [(158, 480), (442, 480), (160, 485), (440, 485), (162, 478), (438, 478)]): s(i, x, y, .7)
s(23, 250, 560); s(24, 350, 560); s(25, 248, 820); s(26, 352, 820); s(27, 250, 1060); s(28, 350, 1060)
s(29, 248, 1082); s(30, 352, 1082); s(31, 250, 1062); s(32, 350, 1062)   # Fersen tiefer als Fußspitzen: von hinten
json.dump(P, open("material/testbilder/getragen/hinten_getragen_punkte.json", "w"))
print("geschrieben")
