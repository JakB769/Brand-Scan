"""Körpermodell für den Avatar aus MakeHuman-Daten (Basis-Mesh hm08, Targets, Skelett-Gewichte; alles CC0 1.0, siehe
assets/referenz/mensch/LIZENZ.md). Nur Daten, kein MakeHuman-Programmcode (der ist AGPL).

Ergebnis: app/avatar/koerper.js mit window.PASSFORM_KOERPER = {meta, b64}. Inhalt (Little Endian, je 4 Byte ausgerichtet):
  idx      Uint16  Dreiecke des Körpers (Gruppe „body“, Vierecke geteilt)
  teil     Uint8   je Vertex: 0 Kopf/Hals, 1 Rumpf, 2 Unterkörper (Becken, Beine, Füße), 3 Arm/Hand (aus den Skelett-Gewichten)
  mitte_m  Int16   Mittelkörper Mann (0,01 cm), Y oben, Z nach vorn
  mitte_f  Int16   Mittelkörper Frau
  je Target: Uint16 Vertex-Indizes, Int8 (b = 8) oder Int16 (b = 16) Verschiebung × Maßstab s (cm), dünn besetzt
Vertices: erst die des Körpers, dahinter die der Gelenk-Würfel (Hüfte, Knie, Knöchel, Becken, Wirbel), deren Mittelpunkt das
Gelenk ist; sie verformen sich mit den Targets mit.

Aufruf: python3 werkzeuge/python/koerper_bauen.py <makehuman/data> [app/avatar/koerper.js]"""
import base64, json, os, sys
import numpy as np

DATA = sys.argv[1]
ZIEL = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '../../app/avatar/koerper.js')
GELENKE = ['joint-l-upper-leg', 'joint-r-upper-leg', 'joint-l-knee', 'joint-r-knee', 'joint-l-ankle', 'joint-r-ankle',
           'joint-pelvis', 'joint-spine-1', 'joint-spine-3', 'joint-neck', 'joint-l-shoulder', 'joint-r-shoulder']

# --- Basis-Mesh ---
V, gruppen, gruppe, flaechen = [], {}, None, []
for z in open(os.path.join(DATA, '3dobjs/base.obj')):
    if z.startswith('v '):
        V.append([float(a) for a in z.split()[1:4]])
    elif z.startswith('g '):
        gruppe = z.split()[1]
    elif z.startswith('f '):
        f = [int(a.split('/')[0]) - 1 for a in z.split()[1:]]
        gruppen.setdefault(gruppe, []).append(f)
V = np.array(V) * 10.0                                    # dm → cm
koerper = gruppen['body']
kv = sorted({i for f in koerper for i in f})
gv = {g: sorted({i for f in gruppen[g] for i in f}) for g in GELENKE}
alle = kv + [i for g in GELENKE for i in gv[g]]
neu = {}
for i in alle:
    if i not in neu: neu[i] = len(neu)
nV = len(neu)
assert nV < 65536
tri = []
for f in koerper:
    a = [neu[i] for i in f]
    tri += [a[0], a[1], a[2]] + ([a[0], a[2], a[3]] if len(a) == 4 else [])
idx = np.array(tri, dtype=np.uint16)
orig = np.array(list(neu.keys()))                         # neuer Index → alter Index

# --- Teile aus den Skelett-Gewichten (stärkster Knochen je Vertex) ---
W = json.load(open(os.path.join(DATA, 'rigs/default_weights.mhw')))['weights']
best = {}
for knochen, liste in W.items():
    for vi, w in liste:
        if vi not in best or w > best[vi][1]: best[vi] = (knochen, w)
def teil(k):
    if k.startswith(('pelvis', 'upperleg', 'lowerleg', 'foot', 'toe', 'root')): return 2
    if k.startswith(('clavicle', 'shoulder', 'upperarm', 'lowerarm', 'wrist', 'metacarpal', 'finger')): return 3
    if k.startswith(('spine', 'breast')): return 1
    return 0
teile = np.array([teil(best.get(int(o), ('root', 0))[0]) for o in orig], dtype=np.uint8)

# --- Targets ---
def target(pfad):
    d = np.zeros((len(V), 3))
    for z in open(os.path.join(DATA, 'targets', pfad)):
        if z.startswith('#') or not z.strip(): continue
        a = z.split(); d[int(a[0])] = [float(a[1]) * 10, float(a[2]) * 10, float(a[3]) * 10]
    return d[orig]
RASSEN = ['african', 'asian', 'caucasian']
mitte = {}
for g, gn in [('m', 'male'), ('f', 'female')]:
    d = sum(target(f'macrodetails/{r}-{gn}-young.target') for r in RASSEN) / 3.0
    mitte[g] = V[orig] + d
TS = []                                                   # (Name, Geschlecht oder None, Pfad)
for g, gn in [('m', 'male'), ('f', 'female')]:
    TS += [('gewicht+', g, f'macrodetails/universal-{gn}-young-averagemuscle-maxweight.target'),
           ('gewicht-', g, f'macrodetails/universal-{gn}-young-averagemuscle-minweight.target'),
           ('muskel+', g, f'macrodetails/universal-{gn}-young-maxmuscle-averageweight.target'),
           ('muskel-', g, f'macrodetails/universal-{gn}-young-minmuscle-averageweight.target')]
# Körpergröße: gleichmäßig skaliert (im Browser), Proportionen über die Beinlängen-Targets; die dichten Größen-Targets
# (alle Vertices, je 108 KB) lohnen sich dafür nicht
for m in ['waist-circ', 'hips-circ', 'thigh-circ', 'knee-circ', 'calf-circ', 'upperleg-height', 'lowerleg-height', 'waisttohip-dist']:
    TS += [(m + '+', None, f'measure/measure-{m}-incr.target'), (m + '-', None, f'measure/measure-{m}-decr.target')]
TS += [('gesaess+', None, 'buttocks/buttocks-volume-incr.target'), ('gesaess-', None, 'buttocks/buttocks-volume-decr.target')]

# --- Packen ---
teile_b, meta_t = [], []
def q16(a):
    q = np.round(np.asarray(a) * 100)
    assert np.abs(q).max() < 32767, 'Wert zu groß für Int16'
    return q.astype('<i2')
blobs, off = [], 0
def blob(arr):
    global off
    b = arr.tobytes(); pad = (-len(b)) % 4
    blobs.append(b + b'\0' * pad); o = off; off += len(b) + pad; return o
meta = {'version': 1, 'quelle': 'MakeHuman hm08 (CC0 1.0)', 'einheit': 'cm, Y oben, Z vorn', 'nV': nV, 'nK': len(kv), 'nT': len(idx) // 3,
        'idx': blob(idx), 'teil': blob(teile), 'mitte': {g: blob(q16(mitte[g]).ravel()) for g in mitte}, 'targets': [],
        'gelenke': {}}
p = len(kv)
for g in GELENKE:
    meta['gelenke'][g.replace('joint-', '')] = [p, len(gv[g])]; p += len(gv[g])
for name, g, pfad in TS:
    d = target(pfad); nz = np.where(np.abs(d).max(1) > 1e-4)[0]
    # Int8 mit eigenem Maßstab je Target, wenn der Rundungsfehler unter 0,3 mm bleibt (größte Verschiebung bis 7,6 cm);
    # sonst Int16 in 0,01 cm (Körpergröße: bis 36 cm)
    mx = np.abs(d[nz]).max(); bits = 8 if mx / 127.0 < .06 else 16
    sk = mx / 127.0 if bits == 8 else .01
    q = np.round(d[nz] / sk).astype('i1' if bits == 8 else '<i2')
    meta['targets'].append({'name': name, 'g': g, 'n': int(len(nz)), 'b': bits, 's': round(float(sk), 7), 'i': blob(nz.astype('<u2')), 'd': blob(q.ravel())})
roh = b''.join(blobs)
os.makedirs(os.path.dirname(os.path.abspath(ZIEL)), exist_ok=True)
with open(ZIEL, 'w') as f:
    f.write('/* Körpermodell für den Avatar: MakeHuman hm08 (Basis-Mesh, Targets, Skelett-Gewichte), CC0 1.0. Erzeugt von\n'
            '   werkzeuge/python/koerper_bauen.py, nicht von Hand ändern. */\n')
    f.write('window.PASSFORM_KOERPER=' + json.dumps({'meta': meta, 'b64': base64.b64encode(roh).decode()}, separators=(',', ':')) + ';\n')
hoehe = {g: mitte[g][:len(kv), 1].max() - mitte[g][:len(kv), 1].min() for g in mitte}
print(f'Vertices {nV} (Körper {len(kv)}), Dreiecke {len(idx)//3}, Targets {len(TS)}, Daten {len(roh)/1024:.0f} KB, '
      f'Datei {os.path.getsize(ZIEL)/1024:.0f} KB, Größe Mann {hoehe["m"]:.1f} cm, Frau {hoehe["f"]:.1f} cm, '
      f'Teile {np.bincount(teile).tolist()}')
