"""Vorher/Nachher der Modellqualität aus zwei Läufen von werkzeuge/ansichten.mjs: je Pose die ganze Hose (verkleinert) und ein
Ausschnitt in Originalgröße (Knie/Oberschenkel), vorher links, nachher rechts.
Aufruf: python3 werkzeuge/python/textur_vergleich.py <vorher-dir> <nachher-dir> <ziel.jpg> [pose,pose,...]"""
import sys
from PIL import Image, ImageDraw

vor, nach, ziel = sys.argv[1].rstrip('/'), sys.argv[2].rstrip('/'), sys.argv[3]
posen = (sys.argv[4] if len(sys.argv) > 4 else 'nah_vorne,nah_hinten,nah_seitlich,vorne').split(',')

def box(im):
    """Umriss der Hose: farbige Bildpunkte (Sättigung), der Hintergrund der Testseite ist grau"""
    sat = im.convert('HSV').split()[1].point(lambda v: 255 if v > 45 else 0)
    return sat.getbbox() or (0, 0, im.width, im.height)

zeilen = []
for n in posen:
    a, b = Image.open(f'{vor}/pose_{n}.png').convert('RGB'), Image.open(f'{nach}/pose_{n}.png').convert('RGB')
    x0, y0, x1, y1 = box(b)
    s = max(x1 - x0, y1 - y0); cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    r = (cx - s // 2, cy - s // 2, cx + s // 2, cy + s // 2)
    ganz = [im.crop(r).resize((360, 360), Image.LANCZOS) for im in (a, b)]
    # Ausschnitt 1:1 am Oberschenkel/Knie (60 % der Höhe der Hose im Bild), auf einem Bein
    w = 180; mx, my = int(x0 + .3 * (x1 - x0)), int(y0 + .6 * (y1 - y0))
    det = [im.crop((mx - w, my - w // 2, mx + w, my + w // 2)).resize((360, 180), Image.NEAREST) for im in (a, b)]
    z = Image.new('RGB', (4 * 360 + 30, 360 + 26), 'white'); dr = ImageDraw.Draw(z)
    for k, im in enumerate(ganz): z.paste(im, (k * 360, 26))
    for k, im in enumerate(det): z.paste(im, (2 * 360 + 30 + k * 360, 26 + 90))
    dr.text((4, 6), f'{n}: vorher', fill='black'); dr.text((364, 6), 'nachher', fill='black')
    dr.text((750, 6), 'Ausschnitt 1:1 (Knie), vorher', fill='black'); dr.text((1110, 6), 'nachher', fill='black')
    zeilen.append(z)
out = Image.new('RGB', (zeilen[0].width, sum(z.height for z in zeilen)), 'white')
y = 0
for z in zeilen: out.paste(z, (0, y)); y += z.height
out.save(ziel, quality=88)
print('Vergleich', ziel)
