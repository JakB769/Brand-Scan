"""Händlerfotos aus einem 3D-Modell: .glb orthografisch von vorne und von hinten, heller Hintergrund, weiches Licht (wie ein
Produktfoto am unsichtbaren Model). Dazu Breite des Bunds (flach, cm) aus dem Netz, als Eingabe für die App.
Aufruf: /opt/bpyenv/bin/python werkzeuge/python/flachbilder.py modell.glb ausgabe_ordner/ [Höhe_cm]
Ergebnis: vorne.png, hinten.png, masse.json (Höhe, Breite, Bund flach)
Annahme: Y oben (glTF), Vorderseite +Z (in Blender −Y). Höhe_cm skaliert das Modell auf diese Außenlänge (sonst unverändert).
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector

glb, out = sys.argv[1], sys.argv[2].rstrip('/') + '/'
soll = float(sys.argv[3]) if len(sys.argv) > 3 else None
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']


def box():
    lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    return lo, hi


lo, hi = box()
if soll:
    k = soll / 100 / (hi.z - lo.z)
    for o in objs:
        o.scale = o.scale * k
    bpy.context.view_layer.update()
    lo, hi = box()
mid = (lo + hi) / 2; hoehe = hi.z - lo.z
# Bund flach: halber Umfang der obersten 1,5 cm (konvexe Hülle der Punkte in der Ebene, Umfang / 2)
pts = []
for o in objs:
    for v in o.data.vertices:
        w = o.matrix_world @ v.co
        if w.z > hi.z - .015:
            pts.append((w.x, w.y))


def huelle(p):
    p = sorted(set(p))
    if len(p) < 3:
        return p
    def kreuz(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    u, l = [], []
    for q in p:
        while len(l) >= 2 and kreuz(l[-2], l[-1], q) <= 0: l.pop()
        l.append(q)
    for q in reversed(p):
        while len(u) >= 2 and kreuz(u[-2], u[-1], q) <= 0: u.pop()
        u.append(q)
    return l[:-1] + u[:-1]


h = huelle(pts)
umfang = sum(math.dist(h[i], h[(i + 1) % len(h)]) for i in range(len(h))) if len(h) > 2 else 0
masse = {'hoehe_cm': round(hoehe * 100, 1), 'breite_cm': round((hi.x - lo.x) * 100, 1), 'tiefe_cm': round((hi.y - lo.y) * 100, 1),
         'bund_flach_cm': round(umfang * 50, 1)}
print('Maße', masse)
json.dump(masse, open(out + 'masse.json', 'w'))

sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24
try:
    sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception as e:  # noqa: BLE001
    print('Entrauschen aus:', e)
sc.render.resolution_x = 900; sc.render.resolution_y = 1200
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.93, .93, .92, 1); bg.inputs[1].default_value = 1.0
cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
cam.type = 'ORTHO'; cam.ortho_scale = hoehe * 1.18
key = bpy.data.lights.new('key', 'AREA'); key.energy = 60; key.size = 2.0
ko = bpy.data.objects.new('key', key); sc.collection.objects.link(ko)


def look(obj, pos, target):
    obj.location = pos
    obj.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()


for name, dy in (('vorne', -1), ('hinten', 1)):
    look(co, (mid.x, mid.y + dy * 4, mid.z), mid)
    look(ko, (mid.x + .8, mid.y + dy * 2.5, mid.z + 1.2), mid)
    sc.render.filepath = out + name + '.png'
    bpy.ops.render.render(write_still=True)
    print('gespeichert', sc.render.filepath)
