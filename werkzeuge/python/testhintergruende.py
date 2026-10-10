"""Legt die Jeans aus material/produktfotos/front.jpg auf typische Untergründe von Handyfotos.
Ergebnis: material/testbilder/freistellung/*.jpg und wahrheit.png (richtige Maske). Braucht numpy, scipy, Pillow."""
from PIL import Image, ImageFilter; import numpy as np
from scipy import ndimage as nd
import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'../..'))
ziel='material/testbilder/freistellung'; os.makedirs(ziel,exist_ok=True)
rng=np.random.default_rng(1)
a=np.asarray(Image.open('material/produktfotos/front.jpg').convert('RGB')).astype(float)
H,W,_=a.shape
l=a@[.2126,.7152,.0722]; m=l<244*.63
m=nd.binary_opening(m,iterations=2); m=nd.binary_fill_holes(m)
lab,n=nd.label(m); sz=nd.sum(m,lab,range(1,n+1)); m=lab==(1+np.argmax(sz))
Image.fromarray((m*255).astype(np.uint8)).save(ziel+'/wahrheit.png')
alpha=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1)))/255.
sm=nd.gaussian_filter
yy,xx=np.mgrid[0:H,0:W]
bgs={}
pl=np.zeros((H,W,3)); bw=110
for i in range(0,W+bw,bw):
  off=(i//bw)*97%260
  for j0 in range(-520,H,260):
    sel=(xx>=i)&(xx<i+bw)&(yy>=j0+off)&(yy<j0+off+260)
    pl[sel]=np.array([150,105,62])*rng.uniform(.8,1.15)
pl+=(sm(rng.normal(0,1,(H,W)),(6,.8))*120)[...,None]*np.array([1,.8,.6]); pl[(xx%bw)<2]*=.55
pl[((yy+((xx//bw)*97%260))%260)<2]*=.6
bgs['parkett']=pl
bgs['teppich']=(np.array([118,116,112])+rng.normal(0,18,(H,W,1))+sm(rng.normal(0,1,(H,W)),20)[...,None]*400)*np.ones(3)
f=sm(rng.normal(0,1,(H,W)),35); f=f/np.abs(f).max()
bgs['bettdecke']=np.array([225,212,190])*(0.82+0.18*f)[...,None]
bgs['dunkel']=np.array([55,58,62])+sm(rng.normal(0,1,(H,W)),3)[...,None]*60
t=np.array([205,200,192])*np.ones((H,W,3)); t[((xx%150)<4)|((yy%150)<4)]=[150,145,140]
bgs['fliesen']=t
for k,bg in bgs.items():
  sh=sm(np.roll(np.roll(m.astype(float),12,0),10,1),8)*.35
  bg=bg*(1-sh)[...,None]
  out=a*alpha[...,None]+bg*(1-alpha[...,None])
  out=out*(1-.25*((xx-W/2)**2+(yy-H/2)**2)/(W*W/2+H*H/2))[...,None]+rng.normal(0,3,out.shape)
  Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save(f'{ziel}/{k}.jpg',quality=88)
print('fertig')
