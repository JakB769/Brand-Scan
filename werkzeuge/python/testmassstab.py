"""Testfotos mit Maßstab: Jeans (front.jpg) mit echter Länge 105 cm auf Holz, daneben A4-Blatt bzw. Bankkarte.
Dann wie ein Handyfoto schräg aufgenommen (Neigung, 26-mm-Objektiv), ohne Neigungsdaten im Foto.
Ergebnis: material/testbilder/massstab/*.jpg. Braucht numpy, scipy, Pillow."""
from PIL import Image, ImageDraw; import numpy as np, math, os
from scipy import ndimage as nd
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'../..'))
ziel='material/testbilder/massstab'; os.makedirs(ziel,exist_ok=True)
rng=np.random.default_rng(3)
src=np.asarray(Image.open('material/produktfotos/front.jpg').convert('RGB')).astype(float)
wahr=np.asarray(Image.open('material/testbilder/freistellung/wahrheit.png'))>128
ys,xs=np.where(wahr); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
LAENGE=105.0; PPC=7.0                                   # Szene: 7 Bildpunkte je cm
k=LAENGE*PPC/(y1-y0)
jeans=Image.fromarray(src[y0:y1,x0:x1].astype(np.uint8)).resize((int((x1-x0)*k),int((y1-y0)*k)))
maske=Image.fromarray((wahr[y0:y1,x0:x1]*255).astype(np.uint8)).resize(jeans.size)
W,H=int(110*PPC),int(130*PPC)                          # 110 × 130 cm Boden
yy,xx=np.mgrid[0:H,0:W]
holz=np.array([150,105,62])*(0.85+0.15*np.sin(xx/9+np.sin(yy/40)*2))[...,None]+nd.gaussian_filter(rng.normal(0,1,(H,W)),(8,1))[...,None]*40
for i in range(0,W,int(14*PPC)): holz[:,i:i+2]*=.6
def szene(ref):
    b=Image.fromarray(np.clip(holz,0,255).astype(np.uint8)); d=ImageDraw.Draw(b)
    jx,jy=int(8*PPC),int(12*PPC); b.paste(jeans,(jx,jy),maske)
    if ref=='a4': rw,rh,col=21,29.7,(246,246,242)
    else: rw,rh,col=5.398,8.56,(30,70,150)
    rx,ry=jx+jeans.size[0]+int(6*PPC),int(60*PPC)
    d.rectangle([rx,ry,rx+rw*PPC,ry+rh*PPC],fill=col)
    if ref=='card': d.rectangle([rx+8,ry+15,rx+rw*PPC-8,ry+28],fill=(220,190,60))
    return b
def schraeg(im,neig,f35=26):
    # Kamera über der Mitte, um 'neig' Grad gekippt; Bild 3024×4032 wie iPhone, verkleinert auf 1134×1512
    a=np.asarray(im).astype(np.float32); h,w=a.shape[:2]
    OW,OH=1134,1512; f=f35*math.hypot(OW,OH)/43.27
    t=math.radians(neig); R=np.array([[1,0,0],[0,math.cos(t),-math.sin(t)],[0,math.sin(t),math.cos(t)]])
    D=f*h/(.8*OH)                                        # Abstand so, dass die Szene das Bild gut füllt (in Szenen-Bildpunkten)
    K=np.array([[f,0,OW/2],[0,f,OH/2],[0,0,1]])
    # Kamera zielt auf die Mitte der Szene, aus einer um 'neig' Grad gekippten Richtung: X_kam = R·X_welt + D·e3
    P=K@np.stack([R[:,0],R[:,1],np.array([0,0,D])],1)@np.array([[1,0,-w/2],[0,1,-h/2],[0,0,1]])
    Pi=np.linalg.inv(P)
    v,u=np.mgrid[0:OH,0:OW]; q=Pi@np.stack([u.ravel(),v.ravel(),np.ones(u.size)])
    sx=(q[0]/q[2]).reshape(OH,OW); sy=(q[1]/q[2]).reshape(OH,OW)
    out=np.stack([nd.map_coordinates(a[...,c],[sy,sx],order=1,mode='nearest') for c in range(3)],-1)
    return Image.fromarray(np.clip(out+rng.normal(0,2,out.shape),0,255).astype(np.uint8))
for ref in ['a4','card']:
    s=szene(ref)
    for n in [0,15]:
        schraeg(s,n).save(f'{ziel}/{ref}_{n}grad.jpg',quality=90)
print('fertig: echte Länge',LAENGE,'cm')
