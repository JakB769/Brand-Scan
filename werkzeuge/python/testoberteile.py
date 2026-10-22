"""Künstliche Testfotos für Oberteile (22.10.): flach von oben auf Holzboden, je Vorder- und Rückseite.
T-Shirt (Aufdruck vorne, Rundhals), Langarm (Ärmel schräg nach unten), Trägertop (Träger, tiefer Ausschnitt).
Maße in cm (10 Bildpunkte je cm): T-Shirt M Brust flach 52, Länge 72, Ärmel 21; Langarm Brust 50, Länge 70, Ärmel 64;
Top Brust 42, Länge 58. Stoff: Jersey (feine Maschen, Rauschen), weiche Falten, Schatten am Boden.
Aufruf: python3 werkzeuge/python/testoberteile.py [Zielordner, Vorgabe material/testbilder/oberteile]"""
import os, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ZIEL = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '../../material/testbilder/oberteile')
os.makedirs(ZIEL, exist_ok=True)
PX = 10
W, H = 1300, 1300
rng = np.random.default_rng(3)


def boden():
    y, x = np.mgrid[0:H, 0:W]
    brett = (x // 170) % 2
    mase = np.sin(y / 23.0 + np.sin(x / 41.0) * 2) * .5 + .5
    base = np.stack([150 + 20 * mase - 12 * brett, 112 + 14 * mase - 9 * brett, 78 + 8 * mase - 6 * brett], -1)
    base += rng.normal(0, 4, (H, W, 1))
    fuge = (x % 170) < 3
    base[fuge] *= .55
    return np.clip(base, 0, 255)


def jersey(farbe, hell=1.0):
    y, x = np.mgrid[0:H, 0:W]
    masche = (np.sin(x * 2.1) * .5 + .5) * .06 + (np.sin(y * 1.3 + (x % 2) * 1.5) * .5 + .5) * .03
    rau = rng.normal(0, .035, (H, W))
    falte = .07 * np.sin(x / 57.0 + y / 91.0) * np.sin(y / 133.0) + .05 * np.sin((x - y) / 37.0)
    k = (1 - masche + rau + falte) * hell
    return np.clip(np.array(farbe)[None, None, :] * k[..., None], 0, 255)


def poly_tshirt(cx, top, brust, laenge, aermel, hals_vorn, lang=False, ruecken=False):
    """Umriss eines flach liegenden Shirts (Bildpunkte), Uhrzeigersinn ab Halsausschnitt links"""
    b = brust * PX / 2
    sh = b * 1.04                       # Schulterpunkt
    hw = 9.0 * PX                       # halbe Halsweite
    tief = (hals_vorn if not ruecken else 1.2) * PX
    yS = top + 3.5 * PX                 # Schulterpunkt etwas tiefer als der Hals (Schräge)
    yA = top + 23 * PX                  # Achsel
    yH = top + laenge * PX
    al = aermel * PX
    if lang:   # Ärmel schräg nach unten (55° von waagrecht), Breite 15 → 9 cm
        ang = math.radians(57)
    else:      # kurz, 30° nach unten
        ang = math.radians(28)
    d = (math.cos(ang), math.sin(ang))
    n = (-d[1], d[0])
    w0, w1 = (17 if not lang else 16) * PX, (17 if not lang else 9) * PX
    pts = []
    # rechte Bildseite (Spiegel für links)
    def seite(sg):
        s0 = (cx + sg * sh, yS)
        a0 = (cx + sg * b, yA)
        e_out = (s0[0] + sg * d[0] * al, s0[1] + d[1] * al)
        e_in = (e_out[0] - sg * n[0] * w1 * -1 * 0 + sg * (-d[1]) * 0, e_out[1])
        # Ärmelende: senkrecht zur Ärmelrichtung, Breite w1
        e1 = (s0[0] + sg * d[0] * al, s0[1] + d[1] * al)
        e2 = (e1[0] - sg * d[1] * w1, e1[1] + d[0] * w1)
        return s0, e1, e2, a0
    sR = seite(1); sL = seite(-1)
    # Halsausschnitt (Bogen), links → rechts
    hals = []
    for t in np.linspace(0, 1, 15):
        x = cx - hw + 2 * hw * t
        y = top + tief * math.sin(math.pi * t)
        hals.append((x, y))
    pts += hals
    pts += [sR[0], sR[1], sR[2], sR[3]]
    # Saum leicht gebogen
    for t in np.linspace(0, 1, 15):
        x = cx + b - 2 * b * t
        y = yH + 1.0 * PX * math.sin(math.pi * t)
        pts.append((x, y))
    pts += [sL[3], sL[2], sL[1], sL[0]]
    return pts, dict(yA=yA, yH=yH, yS=yS)


def poly_top(cx, top, brust, laenge, ruecken=False):
    b = brust * PX / 2
    yA = top + 16 * PX
    yH = top + laenge * PX
    tr = 2.4 * PX
    xs = 8.5 * PX                       # Träger-Mitte vom Rand der Mitte
    tief = (15 if not ruecken else 9) * PX
    pts = [(cx - xs - tr / 2, top), (cx - xs + tr / 2, top)]
    for t in np.linspace(0, 1, 17):     # Ausschnitt
        x = cx - xs + tr / 2 + (2 * xs - tr) * t
        y = top + tief * math.sin(math.pi * t) ** .8
        pts.append((x, y))
    pts += [(cx + xs + tr / 2, top)]
    for t in np.linspace(0, 1, 9):      # Armloch rechts: hohl, erst am Träger entlang, unten zur Achsel hinaus
        a = math.pi / 2 * t
        pts.append((cx + xs + tr / 2 + (b - xs - tr / 2) * (1 - math.cos(a)), top + (yA - top) * math.sin(a)))
    for t in np.linspace(0, 1, 15):
        pts.append((cx + b - 2 * b * t, yH + .8 * PX * math.sin(math.pi * t)))
    for t in np.linspace(1, 0, 9):
        a = math.pi / 2 * t
        pts.append((cx - xs - tr / 2 - (b - xs - tr / 2) * (1 - math.cos(a)), top + (yA - top) * math.sin(a)))
    return pts, dict(yA=yA, yH=yH)


def bild(name, pts, farbe, aufdruck=None, bund=None):
    bg = boden()
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(1.2))
    ma = np.asarray(m) / 255.0
    sch = np.asarray(m.filter(ImageFilter.GaussianBlur(14))) / 255.0
    sch = np.roll(np.roll(sch, 9, 0), 6, 1)
    bg = bg * (1 - .35 * sch[..., None])
    st = jersey(farbe)
    # Kante etwas dunkler (Wölbung des liegenden Stoffs)
    rand = 1 - np.asarray(m.filter(ImageFilter.GaussianBlur(10))) / 255.0
    st = st * (1 - .25 * np.clip(rand * 2, 0, 1))[..., None]
    out = bg * (1 - ma[..., None]) + st * ma[..., None]
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    if bund:  # Bündchen: Linien
        for poly, col in bund:
            d.line(poly, fill=col, width=int(1.6 * PX))
    if aufdruck:
        x0, y0 = aufdruck
        d.ellipse([x0 - 70, y0 - 70, x0 + 70, y0 + 70], outline=(235, 120, 40), width=14)
        d.polygon([(x0 - 40, y0 + 35), (x0, y0 - 45), (x0 + 40, y0 + 35)], fill=(235, 120, 40))
        try:
            f = ImageFont.truetype('DejaVuSans-Bold.ttf', 46)
        except Exception:
            f = None
        d.text((x0 - 120, y0 + 85), 'PASSFORM', fill=(245, 240, 230), font=f)
    im.save(os.path.join(ZIEL, name), quality=90)


cx, top = W // 2, 230
# T-Shirt (blau-grau meliert)
for ruecken in (False, True):
    pts, k = poly_tshirt(cx, top, 52, 72, 21, 3.0, ruecken=ruecken)
    hals = [(cx - 9 * PX + 18 * PX * t, top + (3.0 if not ruecken else 1.2) * PX * math.sin(math.pi * t) + 6) for t in np.linspace(0, 1, 15)]
    bild('tshirt_%s.jpg' % ('hinten' if ruecken else 'vorne'), pts, (86, 104, 134),
         aufdruck=None if ruecken else (cx, top + 26 * PX), bund=[(hals, (70, 86, 112))])
# Langarm (dunkelgrün)
for ruecken in (False, True):
    pts, k = poly_tshirt(cx, top - 60, 50, 70, 64, 2.6, lang=True, ruecken=ruecken)
    hals = [(cx - 9 * PX + 18 * PX * t, top - 60 + (2.6 if not ruecken else 1.2) * PX * math.sin(math.pi * t) + 6) for t in np.linspace(0, 1, 15)]
    bild('langarm_%s.jpg' % ('hinten' if ruecken else 'vorne'), pts, (52, 92, 70), bund=[(hals, (40, 74, 55))])
# Trägertop (hellrosa)
for ruecken in (False, True):
    pts, k = poly_top(cx, top + 120, 42, 58, ruecken=ruecken)
    bild('top_%s.jpg' % ('hinten' if ruecken else 'vorne'), pts, (226, 170, 172))
print('Testbilder in', os.path.abspath(ZIEL))
