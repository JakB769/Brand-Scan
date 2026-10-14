"""Verlauf der Drehung aus werkzeuge/drehung.mjs: g.yaw (Hose) und Rohschätzung je Bild.
Aufruf: python3 werkzeuge/python/drehung_plot.py drehung.json drehung.png"""
import json, sys, math
from PIL import Image, ImageDraw
log = json.load(open(sys.argv[1])); W, H, M = 1000, 420, 40
im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
n = len(log); X = lambda i: M + (W - 2 * M) * i / max(1, n - 1); Y = lambda a: H / 2 - a / math.pi * (H / 2 - M)
for a, t in ((0, 'vorn 0'), (math.pi / 2, '+90°'), (-math.pi / 2, '-90°'), (math.pi, '±180°'), (-math.pi, '')):
    d.line([(M, Y(a)), (W - M, Y(a))], fill=(220, 220, 220)); d.text((2, Y(a) - 6), t, fill='gray')
for key, col in (('roh', (230, 140, 40)), ('yaw', (30, 90, 200))):
    pts = [(X(i), Y(r['roh']['m'] if key == 'roh' and r.get('roh') else r['yaw'])) for i, r in enumerate(log) if key == 'yaw' or r.get('roh')]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if abs(y1 - y0) < H * .4: d.line([(x0, y0), (x1, y1)], fill=col, width=2)
for i, r in enumerate(log):
    if r['trk'] < .5: d.line([(X(i), H - 8), (X(i), H - 2)], fill=(200, 0, 0))
d.text((M, 4), 'blau: Hose (g.yaw), orange: Rohschätzung, rot unten: ausgeblendet', fill='black')
im.save(sys.argv[2]); print('Plot', sys.argv[2])
