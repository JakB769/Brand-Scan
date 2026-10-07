import numpy as np, json, base64, io, pickle
from PIL import Image
from scipy import ndimage as ndi
CW,CH,NR=320,640,56
P=pickle.load(open('prof.pkl','rb'))
atlas=Image.open('atlas.png').convert('RGB'); L=np.asarray(atlas.convert('L')).astype(float)
L=ndi.gaussian_filter(L,1.2)
rows0,top0,bot0,_,_=P['front']
VC=round(float(next((y-top0)/(bot0-top0) for y,r in rows0 if len(r)>=2 and (y-top0)/(bot0-top0)>.2))-0.008,3)
print('VC',VC)
m3={'nr':NR,'vc':VC}
geo=None
for name,off in(('front',0),('back',CW)):
    rows,top,bot,hpx,wpx=P[name]
    sx=(wpx+8)/CW; sy=(hpx+8)/CH; H=(bot-top)*sy
    arr=[]; vs=[]
    prevx=None
    for i,(y,runs) in enumerate(rows):
        v=(y-top)/(bot-top); vs.append(y/CH)
        a=runs[0][0]; b=runs[-1][1]
        if len(runs)>=2 and v>VC-.03: li,ri=runs[0][1],runs[-1][0]
        else:
            c=(a+b)/2
            if v<VC: li=ri=c
            else:
                lo=int((prevx if prevx is not None else c)-7); hi=lo+15
                x=lo+int(np.argmin(L[y,off+lo:off+hi])); li=ri=x
            prevx=(li+ri)/2
        arr.append([a,li,ri,b])
    arr=np.array(arr,float)
    arr=ndi.gaussian_filter1d(arr,1.0,axis=0,mode='nearest')
    hwT=(arr[:,3]-arr[:,0])/2*sx/H
    hwL=((arr[:,1]-arr[:,0])+(arr[:,3]-arr[:,2]))/2*sx/H
    vv=np.array([(y-top)/(bot-top) for y,_ in rows])
    hw=np.where(vv<VC,hwT,hwL)
    if name=='front': geo=(hw,vv,H,sx)
    # UV mit kleinem Einzug gegen Randpixel
    uv=arr.copy(); uv[:,0]+=3; uv[:,3]-=3
    gap=(uv[:,2]-uv[:,1]); 
    uv[:,1]-=np.where(vv>VC,1.5,0); uv[:,2]+=np.where(vv>VC,1.5,0)
    uv=(uv+off)/(2*CW)
    m3[name[0]]=[[round(float(x),4) for x in r] for r in uv]
    m3['tv']=[round(float(x),4) for x in vs]
hw,vv,H,sx=geo
hw[-3:]=hw[-4]
m3['hw']=[round(float(x),4) for x in hw]; m3['v']=[round(float(x),4) for x in vv]
m3['wf']=round(float(2*hw[1]),4)
print('wf',m3['wf'],'Länge bei 40.2 cm Bund:',40.2/m3['wf'],'Leibhöhe',VC*40.2/m3['wf'])
ic=int(np.argmax(vv>=VC)); print('hip flat full cm',2*hw[10]*40.2/m3['wf'],'thigh flat cm',hw[ic+2]*40.2/m3['wf'],'hem flat cm',hw[-1]*40.2/m3['wf'])
b=io.BytesIO(); atlas.save(b,'JPEG',quality=84,optimize=True); print('atlas bytes',len(b.getvalue()))
m3['atlas']='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
json.dump(m3,open('m3.json','w')); print(len(json.dumps(m3)))
print(m3['hw'][::6]); print(m3['f'][::8])
