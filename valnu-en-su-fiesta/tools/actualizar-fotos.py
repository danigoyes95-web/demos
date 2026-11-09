#!/usr/bin/env python3
"""Regenera data/photos.json con las fotos que haya en assets/fotos/ (cualquier subcarpeta)."""
import os, json
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
base=os.path.join(R,"assets","fotos"); out=[]
for d,_,fs in os.walk(base):
    for f in sorted(fs):
        if f.lower().endswith((".jpg",".jpeg",".png",".webp")):
            p=os.path.relpath(os.path.join(d,f),R).replace(os.sep,"/")
            out.append(dict(path=p,folder=os.path.basename(d),name=f))
out.sort(key=lambda x:(x["folder"],x["name"]))
json.dump(out,open(os.path.join(R,"data","photos.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=1)
print(len(out),"fotos")
