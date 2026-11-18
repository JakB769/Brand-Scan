"""Testbilder Shorts (22.10.): Jeans-Shorts flach von oben auf hellem Grund, vorne und hinten. Form gezeichnet (Bund flach
40 cm, Länge 46 cm, Leibhöhe 29 cm, Bein unten 21 cm, Spalt zwischen den Beinen ab dem Schritt), Stoff aus der Bershka-Jeans
(material/produktfotos/front.jpg) gekachelt, Bund, Schlitz, Taschen als Nähte, hinten Gesäßtaschen und Passe.
8 Bildpunkte je cm. Aufruf: python3 werkzeuge/python/testshorts.py  (schreibt material/testbilder/shorts/)"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

os.makedirs("material/testbilder/shorts", exist_ok=True)
PX = 8; W, H = 700, 900; GRUND = (243, 243, 245)
quelle = np.asarray(Image.open("material/produktfotos/front.jpg").convert("RGB")).astype(float)
flick = quelle[610:740, 390:520]                       # Stoff vom Unterschenkel (ganz im Stoff, ruhigste Stelle)

def stoff():
    t = np.tile(flick, (H // flick.shape[0] + 1, W // flick.shape[1] + 1, 1))[:H, :W]
    y, x = np.mgrid[0:H, 0:W]
    return t * (1 + .06 * np.sin(x / 41.0 + y / 67.0))[..., None]

def form(cx, top):
    bw, lg, rise, saum = 20 * PX, 46 * PX, 29 * PX, 21 * PX
    yc, yh = top + rise, top + lg
    aussen = bw + 4 * PX                                   # Hüfte weiter als der Bund
    return [(cx - bw, top), (cx + bw, top), (cx + aussen, top + 14 * PX), (cx + aussen + 1 * PX, yh),
            (cx + aussen + 1 * PX - saum, yh + 1 * PX), (cx + 1.5 * PX, yc), (cx - 1.5 * PX, yc),
            (cx - aussen - 1 * PX + saum, yh + 1 * PX), (cx - aussen - 1 * PX, yh), (cx - aussen, top + 14 * PX)], yc, yh

for seite in ("vorne", "hinten"):
    cx, top = W // 2, 200
    pts, yc, yh = form(cx, top)
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255); m = m.filter(ImageFilter.GaussianBlur(1))
    ma = np.asarray(m)[..., None] / 255.0
    bild = np.array(GRUND, float)[None, None, :] * (1 - ma) + stoff() * ma
    im = Image.fromarray(np.clip(bild, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(im)
    naht = (196, 150, 80)
    d.line([(cx - 20 * PX, top + 4 * PX), (cx + 20 * PX, top + 4 * PX)], fill=(40, 52, 70), width=2)       # Bund
    for k in range(-16, 17, 8):
        d.rectangle([cx + k * PX - 4, top - 2, cx + k * PX + 4, top + 5 * PX], outline=(40, 52, 70))       # Schlaufen
    if seite == "vorne":
        d.line([(cx + 2 * PX, top + 4 * PX), (cx + 2 * PX, yc - 4 * PX)], fill=naht, width=2)            # Schlitz
        d.arc([cx - 19 * PX, top + 2 * PX, cx - 7 * PX, top + 14 * PX], 0, 90, fill=naht, width=2)        # Taschen
        d.arc([cx + 7 * PX, top + 2 * PX, cx + 19 * PX, top + 14 * PX], 90, 180, fill=naht, width=2)
        d.ellipse([cx - 6, top + 1.5 * PX, cx + 6, top + 1.5 * PX + 12], fill=(170, 150, 110))           # Knopf
    else:
        d.line([(cx - 21 * PX, top + 10 * PX), (cx, top + 12 * PX), (cx + 21 * PX, top + 10 * PX)], fill=naht, width=2)   # Passe
        for sx in (-1, 1):
            x0 = cx + sx * 11 * PX
            d.polygon([(x0 - 6 * PX, top + 14 * PX), (x0 + 6 * PX, top + 14 * PX), (x0 + 5 * PX, top + 26 * PX), (x0, top + 28 * PX), (x0 - 5 * PX, top + 26 * PX)], outline=naht)
        d.rectangle([cx - 3 * PX, top + 5, cx + 3 * PX, top + 2.5 * PX], fill=(230, 220, 200))        # Etikett
    im.save(f"material/testbilder/shorts/shorts_{seite}.jpg", quality=92)
print("Testbilder in material/testbilder/shorts/")
