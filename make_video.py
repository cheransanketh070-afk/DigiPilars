import cv2, numpy as np, math, subprocess, os
W,H,FPS,SECONDS=640,360,20,4
out='/mnt/data/digitalpillars-site/assets/hero-cinematic.mp4'
ff=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart',out],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
rng=np.random.default_rng(8)
star=rng.uniform([0,0],[W,H],size=(90,2))
for f in range(FPS*SECONDS):
    t=f/FPS; y,x=np.mgrid[0:H,0:W]; img=np.zeros((H,W,3),np.float32)
    g=np.exp(-(((x-W*.51)/(W*.45))**2+((y-H*.48)/(H*.6))**2)*2.2)
    img[:,:,0]+=2+8*g; img[:,:,1]+=4+12*g; img[:,:,2]+=9+24*g
    haze=np.exp(-((y-H*.76)/(H*.13))**2)*7; img[:,:,1]+=haze*.65; img[:,:,2]+=haze
    for i,(sx,sy) in enumerate(star):
        px=(sx+t*(2+(i%3))*.6)%W; py=(sy+math.sin(t*.6+i)*.8)%H; r=1 if i%8 else 2
        cv2.circle(img,(int(px),int(py)),r,(35,85,130),-1)
    cx,cy=W*.52,H*.49; a=t*.75
    for rr,alpha in [(72,.45),(104,.26),(135,.16)]:
        layer=np.zeros_like(img); cv2.ellipse(layer,(int(cx),int(cy)),(rr,int(rr*.36)),math.degrees(a*0.8),0,360,(55,145,255),1,cv2.LINE_AA); img += layer*alpha
    for idx in range(5):
        ang=idx*2*math.pi/5+a*.35; px=cx+math.cos(ang)*28; py=cy+math.sin(ang)*10; h=150-idx*12+10*math.sin(t*1.2+idx); w=22-idx%2*4
        top=int(py-h*.5); bot=int(py+h*.5); pts=np.array([[px-w/2,top],[px+w/2,top+8],[px+w/2,bot-8],[px,bot],[px-w/2,bot-8]],np.int32); col=(55,135,245) if idx!=1 else (105,195,255)
        cv2.polylines(img,[pts],True,col,1,cv2.LINE_AA); cv2.line(img,(int(px),top+10),(int(px),bot-12),(115,210,255),1,cv2.LINE_AA)
        cap=np.array([[px,top-10],[px+w*.5,top+1],[px,top+12],[px-w*.5,top+1]],np.int32); cv2.polylines(img,[cap],True,(145,220,255),1,cv2.LINE_AA)
    core=np.array([[cx,cy-42],[cx+28,cy],[cx,cy+46],[cx-28,cy]],np.int32); cv2.fillConvexPoly(img,core,(12,42,86)); cv2.polylines(img,[core],True,(126,207,255),1,cv2.LINE_AA)
    cards=[(75,70,130,58,-7),(445,84,120,62,8),(66,250,150,58,5),(438,245,130,64,-5)]
    for j,(x0,y0,w,h,deg) in enumerate(cards):
        layer=np.zeros_like(img); rect=np.array([[x0,y0],[x0+w,y0],[x0+w,y0+h],[x0,y0+h]],np.float32); M=cv2.getRotationMatrix2D((x0+w/2,y0+h/2),deg,1); rr=cv2.transform(rect[None,:,:],M)[0].astype(np.int32)
        cv2.fillPoly(layer,[rr],(9,18,31)); cv2.polylines(layer,[rr],True,(70,115,175),1,cv2.LINE_AA)
        for k in range(5):
            yy=y0+14+k*8; p1=np.array([[x0+12,yy],[x0+w*(.28+.1*k),yy]],np.float32); p2=cv2.transform(p1[None,:,:],M)[0].astype(np.int32); cv2.line(layer,tuple(p2[0]),tuple(p2[1]),(75,145,245),1,cv2.LINE_AA)
        img += layer
    for i in range(8):
        ang=a*1.4+i*.78; r=118+(i%3)*12; px=int(cx+math.cos(ang)*r); py=int(cy+math.sin(ang)*r*.35); cv2.circle(img,(px,py),2,(105,190,255),-1)
    bloom=np.zeros_like(img); cv2.circle(bloom,(int(cx),int(cy)),55,(50,145,255),-1); bloom=cv2.GaussianBlur(bloom,(0,0),34); img+=bloom*.28
    img=np.clip(img,0,255).astype(np.uint8); ff.stdin.write(img.tobytes())
ff.stdin.close(); ff.wait(); print(out,os.path.getsize(out))
