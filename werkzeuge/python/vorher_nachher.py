"""Vorher/Nachher-Übersicht: je Pose Original | 3D vorher | 3D nachher (aus zwei Läufen von werkzeuge/vergleich.mjs).
Aufruf: python3 werkzeuge/python/vorher_nachher.py docs/vorher/vergleich docs/nachher/vergleich docs/nachher/vorher-nachher [je_bild]
Schreibt <ziel>_1.jpg, _2.jpg, … mit je_bild Posen (Standard 4) untereinander."""
import json, sys
from PIL import Image, ImageDraw

vor, nach, ziel = sys.argv[1].rstrip('/'), sys.argv[2].rstrip('/'), sys.argv[3]
je = int(sys.argv[4]) if len(sys.argv) > 4 else 4
namen = [b['name'] for b in json.load(open(nach + '/liste.json'))['bilder']]
zeilen = []
for n in namen:
    try:
        a, b = Image.open(f'{vor}/{n}.jpg'), Image.open(f'{nach}/{n}.jpg')
    except FileNotFoundError:
        continue
    w = a.width // 3
    teile = [a.crop((0, 34, w, a.height)), a.crop((w, 34, 2 * w, a.height)), b.crop((w, 34, 2 * w, b.height))]
    h = 420
    teile = [t.resize((int(t.width * h / t.height), h)) for t in teile]
    z = Image.new('RGB', (sum(t.width for t in teile), h + 26), 'white'); d = ImageDraw.Draw(z); x = 0
    for t, titel in zip(teile, ['Original · ' + n, 'vorher', 'nachher']):
        z.paste(t, (x, 26)); d.text((x + 6, 6), titel, fill='black'); x += t.width
    zeilen.append(z)
for k in range(0, len(zeilen), je):
    teil = zeilen[k:k + je]
    M = Image.new('RGB', (max(z.width for z in teil), sum(z.height for z in teil)), 'white'); y = 0
    for z in teil:
        M.paste(z, (0, y)); y += z.height
    M.save(f'{ziel}_{k // je + 1}.jpg', quality=82)
    print(f'{ziel}_{k // je + 1}.jpg')
