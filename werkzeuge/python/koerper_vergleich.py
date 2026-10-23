"""Vergleichsbild (22.10.): Standardkörper und Avatar aus dem Scan, je von vorn und von der Seite (orthografisch, gleicher
Maßstab), dazu beide Umrisse übereinander (Standard rot, Avatar blau). Eingabe: zwei .bin aus werkzeuge/avatar-vergleich.mjs.
Aufruf: python3 koerper_vergleich.py <standard.bin> <avatar.bin> <ausgabe.png> [Beschriftung]"""
import sys, struct
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def lade(f):
    d = open(f, 'rb').read(); n, nt = struct.unpack('<II', d[:8])
    P = np.frombuffer(d[8:8 + n * 12], '<f4').reshape(n, 3).astype(float); I = np.frombuffer(d[8 + n * 12:], '<u4').reshape(nt, 3)
    return P, I

S = 2.6; W, H = int(80 * S), int(200 * S)
def bild(P, I, yaw, farbe):
    c, s = np.cos(yaw), np.sin(yaw); X = P[:, 0] * c + P[:, 2] * s; Z = -P[:, 0] * s + P[:, 2] * c; Y = P[:, 1]
    x = W / 2 + X * S; y = H - 6 - Y * S
    img = np.ones((H, W, 3)) * .96; zb = np.full((H, W), -1e9); mask = np.zeros((H, W), bool)
    A = np.stack([X, Y, Z], 1); a, b, cc = A[I[:, 0]], A[I[:, 1]], A[I[:, 2]]; N = np.cross(b - a, cc - a); N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
    L = np.array([-.35, .5, .8]); L /= np.linalg.norm(L); sh = np.abs(N @ L) * .65 + .35
    for t in range(len(I)):
        i0, i1, i2 = I[t]; xs = np.array([x[i0], x[i1], x[i2]]); ys = np.array([y[i0], y[i1], y[i2]]); zs = np.array([Z[i0], Z[i1], Z[i2]])
        x0 = max(int(xs.min()), 0); x1 = min(int(np.ceil(xs.max())), W - 1); y0 = max(int(ys.min()), 0); y1 = min(int(np.ceil(ys.max())), H - 1)
        if x1 < x0 or y1 < y0: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        dd = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
        if abs(dd) < 1e-9: continue
        l0 = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / dd; l1 = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / dd; l2 = 1 - l0 - l1
        m = (l0 >= 0) & (l1 >= 0) & (l2 >= 0)
        if not m.any(): continue
        zz = l0 * zs[0] + l1 * zs[1] + l2 * zs[2]; sub = zb[y0:y1 + 1, x0:x1 + 1]; m &= zz > sub
        sub[m] = zz[m]; img[y0:y1 + 1, x0:x1 + 1][m] = np.array(farbe) * sh[t]; mask[y0:y1 + 1, x0:x1 + 1][m] = True
    return img, mask

def kante(m):
    k = np.zeros_like(m); k[1:-1, 1:-1] = m[1:-1, 1:-1] & ~(m[:-2, 1:-1] & m[2:, 1:-1] & m[1:-1, :-2] & m[1:-1, 2:]); return k

Ps, Is = lade(sys.argv[1]); Pa, Ia = lade(sys.argv[2]); text = sys.argv[4] if len(sys.argv) > 4 else ''
kacheln = []
for yaw in (0, np.pi / 2):
    a, ma = bild(Ps, Is, yaw, (.80, .72, .66)); b, mb = bild(Pa, Ia, yaw, (.66, .74, .86))
    u = np.ones((H, W, 3)) * .98
    for m, col in ((ma, (.85, .15, .15)), (mb, (.1, .3, .9))):
        k = kante(m); k = k | np.roll(k, 1, 0) | np.roll(k, 1, 1); u[k] = col
    kacheln += [a, b, u]
im = Image.fromarray((np.clip(np.concatenate(kacheln, 1), 0, 1) * 255).astype(np.uint8))
c = Image.new('RGB', (im.width, im.height + 44), 'white'); c.paste(im, (0, 44)); d = ImageDraw.Draw(c)
try: F = ImageFont.truetype('DejaVuSans.ttf', 13)
except Exception: F = None
for i, t in enumerate(['vorn: Standard', 'vorn: Avatar (Scan)', 'vorn: Umrisse rot/blau', 'Seite: Standard', 'Seite: Avatar', 'Seite: Umrisse']):
    d.text((i * W + 6, 4), t, fill='black', font=F)
d.text((6, 24), text, fill=(60, 60, 60), font=F)
c.save(sys.argv[3]); print('Bild', sys.argv[3])
