"""Software-Rasterer (22.10.): posierter Körper aus werkzeuge/avatar-eichen.mjs als Foto (Perspektive, Lambert, Hautfarbe,
Wand und Boden), damit die echte Erkennung (Frontal-Scan) daran geeicht werden kann.
Aufruf: python3 koerper_render.py <koerper.bin> <bild.jpg> [Kamerahöhe cm] [Abstand cm] [Drehung rad]"""
import sys, struct, numpy as np
from PIL import Image
f=open(sys.argv[1],'rb').read(); n,nt=struct.unpack('<II',f[:8]); P=np.frombuffer(f[8:8+n*12],'<f4').reshape(n,3).astype(float); I=np.frombuffer(f[8+n*12:],'<u4').reshape(nt,3)
out=sys.argv[2]; W,H=720,1280; camH=float(sys.argv[3]) if len(sys.argv)>3 else 95; dist=float(sys.argv[4]) if len(sys.argv)>4 else 330
yaw=float(sys.argv[5]) if len(sys.argv)>5 else 0
c,s=np.cos(yaw),np.sin(yaw); X=P[:,0]*c+P[:,2]*s; Z=-P[:,0]*s+P[:,2]*c; P=np.stack([X,P[:,1],Z],1)
# Kamera vor der Person (+Z), Höhe camH, Blick waagrecht; Brennweite so, dass 2 m Höhe ins Bild passen
foc=H*dist/215.0
x=W/2+P[:,0]*foc/(dist-P[:,2]); y=H/2-(P[:,1]-camH)*foc/(dist-P[:,2])+ (camH-95)*foc/dist*0; zc=dist-P[:,2]
img=np.zeros((H,W,3)); img[:]=np.array([205,200,192])/255; img[int(H*.86):]=np.array([150,120,90])/255
zb=np.full((H,W),1e9)
A=P[I[:,0]];B=P[I[:,1]];C=P[I[:,2]]; Nn=np.cross(B-A,C-A); Nn/=np.linalg.norm(Nn,axis=1,keepdims=True)+1e-9
L=np.array([.3,.5,.8]); L/=np.linalg.norm(L); sh=np.clip(np.abs(Nn@L),0,1)*.75+.25
skin=np.array([.86,.70,.58])
for t in range(nt):
    a,b,cc=I[t]; xs=np.array([x[a],x[b],x[cc]]); ys=np.array([y[a],y[b],y[cc]]); zs=np.array([zc[a],zc[b],zc[cc]])
    x0=max(int(np.floor(xs.min())),0); x1=min(int(np.ceil(xs.max())),W-1); y0=max(int(np.floor(ys.min())),0); y1=min(int(np.ceil(ys.max())),H-1)
    if x1<x0 or y1<y0: continue
    gx,gy=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
    d=(ys[1]-ys[2])*(xs[0]-xs[2])+(xs[2]-xs[1])*(ys[0]-ys[2])
    if abs(d)<1e-9: continue
    l0=((ys[1]-ys[2])*(gx-xs[2])+(xs[2]-xs[1])*(gy-ys[2]))/d; l1=((ys[2]-ys[0])*(gx-xs[2])+(xs[0]-xs[2])*(gy-ys[2]))/d; l2=1-l0-l1
    m=(l0>=0)&(l1>=0)&(l2>=0)
    if not m.any(): continue
    z=l0*zs[0]+l1*zs[1]+l2*zs[2]; sub=zb[y0:y1+1,x0:x1+1]; m&=z<sub
    sub[m]=z[m]; img[y0:y1+1,x0:x1+1][m]=skin*sh[t]
Image.fromarray((np.clip(img,0,1)*255).astype(np.uint8)).save(out,quality=92)
print("ok",out)
