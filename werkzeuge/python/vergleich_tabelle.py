"""Kennzahlen eines oder mehrerer Vergleichsläufe (werkzeuge/vergleich.mjs) nebeneinander: Umriss-Überlappung (IoU) und
Breite 3D/echt zwischen Hüfte und Knöchel, Drehung, Status, Shirtsaum. Aufruf: python3 vergleich_tabelle.py dirA [dirB ...]"""
import json, sys

runs = [(d.rstrip('/').split('/')[-1], json.load(open(d.rstrip('/') + '/liste.json'))) for d in sys.argv[1:]]
namen = [b['name'] for b in runs[0][1]['bilder']]
print('Pose'.ljust(22) + ''.join(f'{n[:14]:>30s}' for n, _ in runs))
mittel = {n: [] for n, _ in runs}
for name in namen:
    zeile = name[:22].ljust(22)
    for n, r in runs:
        b = next((x for x in r['bilder'] if x['name'] == name), None)
        u = b and b.get('umriss')
        if u:
            mittel[n].append((u['iou'], u['breite3d']))
        zeile += (f"  IoU {u['iou']:.2f} B {u['breite3d']:.2f} yaw {b['yaw']:+.2f}" if u else '  –'.rjust(30))
    print(zeile)
print('MITTEL'.ljust(22) + ''.join(f"  IoU {sum(a for a, _ in m)/len(m):.3f} B {sum(b for _, b in m)/len(m):.3f}".rjust(30) if m else '' for m in mittel.values()))
