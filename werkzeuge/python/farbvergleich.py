"""Farbe und Kontrast: echte Jeans gegen 3D-Hose an festen Stellen am Bein (Mitte Oberschenkel, Mitte Unterschenkel, je Bein).
Liest ein Ausgabeverzeichnis von werkzeuge/vergleich.mjs (liste.json mit den Knochen in Bildpunkten, Triptychen *.jpg).
Aufruf: python3 werkzeuge/python/farbvergleich.py docs/vergleich/<zeit>/ [--groesse 13]
Je Bild: mittlere Farbe (RGB, Lab) echt/3D, ΔE, Helligkeitsstreuung (Struktur, Falten) im Feld echt/3D.
"""
import json, sys, os
import numpy as np
from PIL import Image

def lab(x):
    x = x / 255.0
    x = np.where(x > .04045, ((x + .055) / 1.055) ** 2.4, x / 12.92)
    M = np.array([[.4124, .3576, .1805], [.2126, .7152, .0722], [.0193, .1192, .9505]])
    X = x @ M.T / np.array([.9505, 1, 1.089])
    f = np.where(X > .008856, np.cbrt(X), 7.787 * X + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def main():
    d = sys.argv[1].rstrip('/') + '/'
    r = int(sys.argv[sys.argv.index('--groesse') + 1]) if '--groesse' in sys.argv else 13
    liste = json.load(open(d + 'liste.json'))
    gesamt = []
    for it in liste['bilder']:
        f = d + it['name'] + '.jpg'
        if not it.get('bone') or not os.path.exists(f):
            continue
        im = np.asarray(Image.open(f).convert('RGB')).astype(float)
        H, W, _ = im.shape
        w = W // 3
        echt, drei = im[34:, :w], im[34:, w:2 * w]
        pe, p3 = [], []
        for leg in it['bone']:
            for a, b in ((0, 1), (1, 2)):
                x = int((leg[a][0] + leg[b][0]) / 2)
                y = int((leg[a][1] + leg[b][1]) / 2)
                if r <= x < w - r and r <= y < echt.shape[0] - r:
                    pe.append(echt[y - r:y + r, x - r:x + r].reshape(-1, 3))
                    p3.append(drei[y - r:y + r, x - r:x + r].reshape(-1, 3))
        if not pe:
            continue
        E, D = np.concatenate(pe), np.concatenate(p3)
        le, ld = lab(E), lab(D)
        de = np.linalg.norm(le.mean(0) - ld.mean(0))
        # Struktur: Streuung der Helligkeit je Feld (Mittel über die Felder)
        se = np.mean([lab(q)[:, 0].std() for q in pe])
        sd = np.mean([lab(q)[:, 0].std() for q in p3])
        gesamt.append((de, le.mean(0), ld.mean(0), se, sd))
        print(f"{it['name'][:22]:22s} echt RGB {E.mean(0).round().astype(int)} 3D {D.mean(0).round().astype(int)}  "
              f"Lab echt {le.mean(0).round(1)} 3D {ld.mean(0).round(1)}  ΔE {de:5.1f}  Struktur L echt {se:4.1f} 3D {sd:4.1f}")
    if gesamt:
        g = np.array([x[0] for x in gesamt])
        dl = np.mean([x[2][0] - x[1][0] for x in gesamt]); db = np.mean([x[2][2] - x[1][2] for x in gesamt]); da = np.mean([x[2][1] - x[1][1] for x in gesamt])
        print(f"MITTEL ΔE {g.mean():.1f} (Median {np.median(g):.1f}); 3D minus echt: L {dl:+.1f} a {da:+.1f} b {db:+.1f}; "
              f"Struktur echt {np.mean([x[3] for x in gesamt]):.1f} 3D {np.mean([x[4] for x in gesamt]):.1f}")

main()
