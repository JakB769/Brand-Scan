import numpy as np, json, base64, io
from PIL import Image
from scipy import ndimage as ndi
CW,CH,NR=320,640,56
def seg(path):
    im=Image.open(path).convert('RGB'); a=np.asarray(im).astype(np.float32)
    bg=np.median(np.concatenate([a[:8,:8].reshape(-1,3),a[:8,-8:].reshape(-1,3)]),axis=0)
    lum=a@np.array([.2126,.7152,.0722]); sat=a.max(axis=2)-a.min(axis=2)
    m=(lum<150)|(sat>34)
    m=ndi.binary_opening(m,iterations=2); 
    lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1)); m=lab==(1+np.argmax(sizes))
    m=ndi.binary_fill_holes(m)
    return a,m,bg
def crop(a,m):
    ys,xs=np.where(m); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    pad=4
    y0-=pad;y1+=pad;x0-=pad;x1+=pad
    a=a[y0:y1,x0:x1]; m=m[y0:y1,x0:x1]
    # Hintergrund mit Stofffarbe auffüllen, damit an den Rändern nichts Helles hineinzieht
    core=ndi.binary_erosion(m,iterations=3)
    idx=ndi.distance_transform_edt(~core,return_distances=False,return_indices=True)
    f=a[idx[0],idx[1]]
    imf=Image.fromarray(f.astype(np.uint8)).resize((CW,CH),Image.LANCZOS)
    mm=np.asarray(Image.fromarray((m*255).astype(np.uint8)).resize((CW,CH),Image.BILINEAR))>127
    return imf,mm,(y1-y0-2*pad),(x1-x0-2*pad)
def profile(mm):
    H,W=mm.shape; ys=np.where(mm.any(axis=1))[0]; top,bot=ys.min(),ys.max()
    rows=[]
    for i in range(NR):
        y=int(round(top+(bot-top)*(0.004+0.985*i/(NR-1))))
        r=mm[max(0,y-1):y+2].sum(axis=0)>=2
        xs=np.where(r)[0]
        # Läufe finden
        runs=[];s=None
        for x in range(W+1):
            on=x<W and r[x]
            if on and s is None: s=x
            if not on and s is not None:
                if x-s>4: runs.append((s,x-1))
                s=None
        rows.append((y,runs))
    return rows,top,bot
out={}
res={}
for name in('front','back'):
    a,m,bg=seg(name+'.jpg'); imf,mm,hpx,wpx=crop(a,m); rows,top,bot=profile(mm)
    res[name]=(imf,mm,rows,top,bot,hpx,wpx)
    print(name,'bbox px',wpx,hpx,[len(r[1]) for r in rows])
json.dump({k:[ (int(y),[(int(a),int(b)) for a,b in runs]) for y,runs in v[2]] for k,v in res.items()},open('rows.json','w'))
atlas=Image.new('RGB',(CW*2,CH)); atlas.paste(res['front'][0],(0,0)); atlas.paste(res['back'][0],(CW,0)); atlas.save('atlas.png')
dbg=atlas.copy()
from PIL import ImageDraw
dr=ImageDraw.Draw(dbg)
for k,off in(('front',0),('back',CW)):
    for y,runs in res[k][2]:
        for a,b in runs: dr.line([(off+a,y),(off+b,y)],fill=(255,60,60))
dbg.save('dbg.png')
import pickle; pickle.dump({k:(v[2],v[3],v[4],v[5],v[6]) for k,v in res.items()},open('prof.pkl','wb'))
