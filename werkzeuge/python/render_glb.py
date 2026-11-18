"""Rendert eine Hose als .glb (Export der Seite: Meter, Y oben, Vorderseite +Z, Boden 0) mit Blender (bpy, Cycles auf der CPU)
von vorne, seitlich, hinten und schräg. Neutrales Studiolicht, grauer Hintergrund, 600×800.
Aufruf: /opt/bpyenv/bin/python werkzeuge/python/render_glb.py hose.glb ausgabe_ordner/ [samples]
Ergebnis: render_vorne.png, render_seitlich.png, render_hinten.png, render_schraeg.png
"""
import math
import os
import sys

import bpy
from mathutils import Vector

glb, out = sys.argv[1], sys.argv[2].rstrip('/') + '/'
samples = int(sys.argv[3]) if len(sys.argv) > 3 else 32
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
# Ausdehnung aller Netze (Welt-Koordinaten; Blender: Z oben, glTF +Z vorne wird zu −Y)
lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
for o in objs:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
mid = (lo + hi) / 2; hoehe = hi.z - lo.z
print('Ausdehnung (cm): Breite %.1f Tiefe %.1f Höhe %.1f' % ((hi.x - lo.x) * 100, (hi.y - lo.y) * 100, hoehe * 100))

sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
try:
    sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception as e:  # noqa: BLE001 (ältere Builds ohne OIDN)
    print('Entrauschen aus:', e)
sc.render.resolution_x = 600; sc.render.resolution_y = 800
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
nt = w.node_tree; bg = nt.nodes['Background']; bg.inputs[0].default_value = (1, 1, 1, 1); bg.inputs[1].default_value = .35
cb = nt.nodes.new('ShaderNodeBackground'); cb.inputs[0].default_value = (.62, .62, .62, 1); cb.inputs[1].default_value = 1.0
lp = nt.nodes.new('ShaderNodeLightPath'); mx = nt.nodes.new('ShaderNodeMixShader')
nt.links.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); nt.links.new(bg.outputs[0], mx.inputs[1]); nt.links.new(cb.outputs[0], mx.inputs[2])
nt.links.new(mx.outputs[0], nt.nodes['World Output'].inputs[0])

cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
key = bpy.data.lights.new('key', 'AREA'); key.energy = 90; key.size = 1.0
ko = bpy.data.objects.new('key', key); sc.collection.objects.link(ko)
fill = bpy.data.lights.new('fill', 'AREA'); fill.energy = 30; fill.size = 1.5
fo = bpy.data.objects.new('fill', fill); sc.collection.objects.link(fo)


def look(obj, pos, target):
    obj.location = pos
    obj.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()


# Blickrichtung (x, y) in Blender: vorne = −Y (glTF +Z)
views = {'vorne': (0, -1), 'seitlich': (1, 0), 'hinten': (0, 1), 'schraeg': (.7, -.7)}
for name, (dx, dy) in views.items():
    persp = name == 'schraeg'
    cam.type = 'PERSP' if persp else 'ORTHO'; cam.ortho_scale = hoehe * 1.12; cam.lens = 85
    dist = 3.0 if persp else 4.0
    look(co, (mid.x + dx * dist, mid.y + dy * dist, mid.z + (.35 if persp else 0)), mid)
    a = math.atan2(dy, dx) - math.radians(35); look(ko, (math.cos(a) * 2.5, math.sin(a) * 2.5, mid.z + 1.5), mid)
    a2 = math.atan2(dy, dx) + math.radians(50); look(fo, (math.cos(a2) * 3, math.sin(a2) * 3, mid.z + .3), mid)
    sc.render.filepath = out + 'render_' + name + '.png'
    bpy.ops.render.render(write_still=True)
    print('gespeichert', sc.render.filepath)
