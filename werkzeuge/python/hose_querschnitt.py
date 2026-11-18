"""Querschnitte eines Hosenmodells (.glb) messen, um unsere Produktform mit einer Referenz zu vergleichen (11.11.).
Je Höhe (cm über dem Saum, Modell auf die reale Länge skaliert, vorne = +z) und Bein: Breite B, Tiefe T, T/B, Füllgrad
(Fläche / (B·T); Ellipse 0,785, Linse kleiner, Kasten größer), Exponent p der Superellipse, Ausdehnung nach vorn/hinten.
Daraus die Werte PASSFORM.produkt (rL, rH, pL, kB, kS) je Stoffart, z. B. aus KI-Referenzen (TRELLIS).
  python3 werkzeuge/python/hose_querschnitt.py <modell.glb> <Länge cm> [<modell2.glb> <Länge> ...]
"""
import struct, json, sys, numpy as np
from PIL import Image, ImageDraw
def lade(f):
    b=open(f,'rb').read(); jl=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+jl]); B=b[20+jl+8:]
    def acc(i):
        a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]; o=bv.get('byteOffset',0)+a.get('byteOffset',0)
        n={'VEC3':3,'VEC2':2,'SCALAR':1}[a['type']]; dt={5126:np.float32,5125:np.uint32,5123:np.uint16}[a['componentType']]
        return np.frombuffer(B[o:o+a['count']*n*np.dtype(dt).itemsize],dtype=dt).reshape(-1,n) if n>1 else np.frombuffer(B[o:o+a['count']*np.dtype(dt).itemsize],dtype=dt)
    pr=j['meshes'][0]['primitives'][0]; return acc(pr['attributes']['POSITION']).astype(float), acc(pr['indices']).astype(int).reshape(-1,3)
# Superellipse mit diesem Füllgrad, Mitte vorn/hinten. Höhe auf reale Länge skaliert, vorne = +z.
import sys, json, struct, math, numpy as np
def hull(p):
    p=sorted(map(tuple,p)); 
    if len(p)<3: return p
    def cr(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lo=[];  up=[]
    for q in p:
        while len(lo)>=2 and cr(lo[-2],lo[-1],q)<=0: lo.pop()
        lo.append(q)
    for q in reversed(p):
        while len(up)>=2 and cr(up[-2],up[-1],q)<=0: up.pop()
        up.append(q)
    return lo[:-1]+up[:-1]
def flaeche(h): return .5*abs(sum(h[i][0]*h[(i+1)%len(h)][1]-h[(i+1)%len(h)][0]*h[i][1] for i in range(len(h))))
G=lambda p: math.gamma(1+1/p)**2/math.gamma(1+2/p)
def p_aus(f):
    lo,hi=1.5,12
    for _ in range(40):
        m=(lo+hi)/2
        if G(m)<f: lo=m
        else: hi=m
    return (lo+hi)/2
for f,L in zip(sys.argv[1::2],sys.argv[2::2]):
    P,T=lade(f); L=float(L); lo=P.min(0); hi=P.max(0); k=L/(hi[1]-lo[1]); P=(P-lo)*k; P[:,0]-=(P[:,0].max()+P[:,0].min())/2; P[:,2]-=(P[:,2].max()+P[:,2].min())/2
    print(f.split('/')[-1])
    for h in [L-4,L-15,L-25,58,45,30,15,4]:
        A=P[T[:,0]]; B=P[T[:,1]]; C=P[T[:,2]]; seg=[]
        for U,V in [(A,B),(B,C),(C,A)]:
            m=(U[:,1]-h)*(V[:,1]-h)<0; t=(h-U[m,1])/(V[m,1]-U[m,1]); seg.append(U[m]+(V[m]-U[m])*t[:,None])
        Q=np.concatenate(seg)[:,[0,2]]
        if len(Q)<6: continue
        out=[]
        for name,sel in [('L',Q[:,0]<0),('R',Q[:,0]>=0),('alle',np.ones(len(Q),bool))]:
            q=Q[sel]
            if len(q)<6: continue
            W=q[:,0].ptp() if hasattr(q[:,0],'ptp') else q[:,0].max()-q[:,0].min(); D=q[:,1].max()-q[:,1].min(); hh=hull(q); fl=flaeche(hh)/(W*D) if W*D>0 else 0
            out.append(f'{name}: B{W:5.1f} T{D:5.1f} T/B{D/W:4.2f} füll{fl:4.2f} p{p_aus(min(.99,max(.79,fl))):4.1f} vorn{q[:,1].max():5.1f} hinten{-q[:,1].min():5.1f}')
        print(f'  h={h:5.1f} '+' | '.join(out))
