(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer:fine)').matches;
  if (reduce) document.documentElement.classList.add('reduced-motion');

  const menu = document.querySelector('.menu-toggle');
  const mobile = document.querySelector('#mobileNav');
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    mobile.hidden = open;
  });
  mobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobile.hidden = true;
    menu.setAttribute('aria-expanded', 'false');
  }));

  const cursor = document.querySelector('.cursor-orb');
  if (finePointer && !reduce) {
    window.addEventListener('pointermove', e => {
      cursor.style.opacity = '.8';
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    }, { passive:true });
  }

  const canvas = document.querySelector('#hero3d');
  let renderer, scene, camera, rig, core, rings, particles, pulse, raf, ambientObjects;
  const pointer = {x:0,y:0,tx:0,ty:0};
  const modeState = { value:'core' };
  const blue = 0x79b9ff;
  const cyan = 0x9be4ff;
  const violet = 0x8d76ff;

  function mat(color, opacity=1, metalness=.65, roughness=.22, emissive=0x000000, emissiveIntensity=0){
    return new THREE.MeshStandardMaterial({color, transparent:opacity<1, opacity, metalness, roughness, emissive, emissiveIntensity, side:THREE.DoubleSide});
  }
  function addEdges(mesh, opacity=.35){
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 18), new THREE.LineBasicMaterial({color:cyan, transparent:true, opacity}));
    edges.position.copy(mesh.position); edges.rotation.copy(mesh.rotation); edges.scale.copy(mesh.scale);
    mesh.parent.add(edges); return edges;
  }
  function makePillar(h, w, x, y, z, rot=0){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,w*.72), mat(0x12304d,.48,.8,.16,0x4e8eff,.35));
    body.position.set(x,y,z); body.rotation.y=rot; g.add(body);
    const edge = addEdges(body,.5); edge.material.color.setHex(0x8dd9ff);
    const capTop = new THREE.Mesh(new THREE.OctahedronGeometry(w*.54,0), mat(cyan,.62,.7,.14,0x6eabff,.5));
    capTop.scale.y=.55; capTop.position.set(x,y+h/2+.04,z); g.add(capTop);
    const capBottom = capTop.clone(); capBottom.position.y=y-h/2-.04; capBottom.rotation.z=Math.PI; g.add(capBottom);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(w*.12,h*.86,w*.12), mat(0x7fbaff,.55,.4,.1,0x4d8cff,.8));
    inner.position.set(x,y,z); g.add(inner);
    for(let i=0;i<3;i++){
      const line = new THREE.Mesh(new THREE.BoxGeometry(w*.5,.012,w*.5), mat(0x9fe5ff,.5,.2,.2,0x7bbdff,.7));
      line.position.set(x,y-h*.28+i*h*.23,z); g.add(line);
    }
    return g;
  }
  function makeArm(angle, radius, y){
    const g=new THREE.Group();
    g.rotation.y=angle;
    const joint1=new THREE.Mesh(new THREE.SphereGeometry(.18,16,12),mat(cyan,.72,.75,.12,0x6eaaff,.8));
    joint1.position.set(radius,y,0); g.add(joint1);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,radius*.72,10),mat(0x2c5a8b,.75,.8,.2,0x477cff,.45));
    beam.rotation.z=Math.PI/2; beam.position.set(radius*.63,y,0); g.add(beam);
    const joint2=new THREE.Mesh(new THREE.SphereGeometry(.12,14,10),mat(0xb5ebff,.65,.65,.1,0x7dbaff,.9));
    joint2.position.set(radius*1.25,y,0); g.add(joint2);
    return g;
  }

  if (canvas && window.THREE) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38,1,.1,100);
    camera.position.set(0,.15,8.2);
    renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene.add(new THREE.AmbientLight(0x9ab7df,.42));
    const key=new THREE.PointLight(0x75aaff,8,15); key.position.set(3,3,5); scene.add(key);
    const rim=new THREE.PointLight(0x8d76ff,7,13); rim.position.set(-4,-1,2); scene.add(rim);
    const fill=new THREE.PointLight(0x7ee4ff,5,10); fill.position.set(0,-4,3); scene.add(fill);

    rig=new THREE.Group(); rig.position.set(0,.05,0); scene.add(rig);
    core=new THREE.Group(); rig.add(core);

    const heights=[2.65,3.85,2.9,2.2,3.15];
    const positions=[[-1.05,.0,.0],[-.38,.25,.08],[.45,.05,.02],[1.05,-.05,-.03],[0,-.9,.16]];
    heights.forEach((h,i)=>core.add(makePillar(h,.62,positions[i][0],positions[i][1],positions[i][2],i*.22)));
    const heart=new THREE.Mesh(new THREE.OctahedronGeometry(.72,1),mat(0x10233d,.7,.75,.12,0x548eff,.75));
    heart.scale.set(.72,1.15,.72); heart.position.set(0,-.05,.45); core.add(heart); addEdges(heart,.8);

    const arms=new THREE.Group();
    for(let i=0;i<4;i++) arms.add(makeArm(i*Math.PI/2+.25,1.9,(i%2?-.35:.4)));
    core.add(arms);

    rings=new THREE.Group(); core.add(rings);
    [2.15,2.55,3.0].forEach((r,i)=>{
      const tor=new THREE.Mesh(new THREE.TorusGeometry(r,.012+(i===1?.009:0),8,180),new THREE.MeshBasicMaterial({color:i===1?cyan:blue,transparent:true,opacity:i===1?.55:.3,blending:THREE.AdditiveBlending}));
      tor.rotation.x=Math.PI/2+(i*.35); tor.rotation.y=i*.28; rings.add(tor);
    });
    const halo=new THREE.Mesh(new THREE.SphereGeometry(2.25,32,24),new THREE.MeshBasicMaterial({color:0x2c70ff,transparent:true,opacity:.025,blending:THREE.AdditiveBlending}));
    core.add(halo);

    const plates=new THREE.Group(); core.add(plates);
    for(let i=0;i<10;i++){
      const p=new THREE.Mesh(new THREE.BoxGeometry(.08,.32,.05),mat(i%2?cyan:violet,.28,.7,.2,0x477cff,.5));
      const a=i/10*Math.PI*2; const r=2.45;
      p.position.set(Math.cos(a)*r,(Math.sin(a)*r)*.5,Math.sin(a)*r*.18);
      p.lookAt(0,0,0); plates.add(p);
    }

    const count=window.innerWidth<700?380:760;
    const pos=new Float32Array(count*3), sizes=new Float32Array(count);
    for(let i=0;i<count;i++){
      const r=3.2+Math.random()*4.6, a=Math.random()*Math.PI*2, z=(Math.random()-.5)*5.5;
      pos[i*3]=Math.cos(a)*r; pos[i*3+1]=Math.sin(a)*r*.52; pos[i*3+2]=z;
      sizes[i]=Math.random();
    }
    const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(pos,3)); pg.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
    particles=new THREE.Points(pg,new THREE.PointsMaterial({color:0xa8dcff,size:.018,transparent:true,opacity:.5,sizeAttenuation:true,blending:THREE.AdditiveBlending})); scene.add(particles);

    pulse=new THREE.Group(); scene.add(pulse);
    for(let i=0;i<5;i++){
      const s=new THREE.Mesh(new THREE.SphereGeometry(.025,10,8),new THREE.MeshBasicMaterial({color:cyan,transparent:true,opacity:.75,blending:THREE.AdditiveBlending}));
      const a=i/5*Math.PI*2; s.position.set(Math.cos(a)*2.7,(Math.sin(a)*2.7)*.48,.3+Math.sin(a)*.6); pulse.add(s);
    }

    // Secondary orbital hardware: lightweight autonomous objects keep the scene alive
    // without adding another WebGL context. They drift on separate depth planes.
    ambientObjects = new THREE.Group(); scene.add(ambientObjects);
    const droneMat = new THREE.MeshStandardMaterial({color:0x315b91,metalness:.8,roughness:.16,emissive:0x173d75,emissiveIntensity:.65,transparent:true,opacity:.82});
    const glowMat = new THREE.MeshBasicMaterial({color:cyan,transparent:true,opacity:.72,blending:THREE.AdditiveBlending});
    for(let i=0;i<4;i++){
      const drone = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.OctahedronGeometry(.24 + i*.035,0), droneMat.clone());
      shell.rotation.z=.4; drone.add(shell);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.34+i*.02,.008,6,40), new THREE.MeshBasicMaterial({color:i%2?violet:cyan,transparent:true,opacity:.45,blending:THREE.AdditiveBlending}));
      ring.rotation.x=Math.PI/2; drone.add(ring);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),glowMat); eye.position.z=.23; drone.add(eye);
      const a=i/4*Math.PI*2+.5, r=4.1+i*.35;
      drone.position.set(Math.cos(a)*r,(Math.sin(a)*r)*.52,(i-1.5)*.9);
      drone.userData={angle:a,radius:r,depth:drone.position.z,phase:i*1.7,speed:.18+i*.025};
      ambientObjects.add(drone);
    }
    // Larger cinematic satellites make the 3D layer unmistakable while staying lightweight.
    const satelliteMat = new THREE.MeshStandardMaterial({color:0x183b68,metalness:.88,roughness:.12,emissive:0x1c4e9a,emissiveIntensity:.72,transparent:true,opacity:.92});
    for(let i=0;i<3;i++){
      const sat=new THREE.Group();
      const body=new THREE.Mesh(new THREE.OctahedronGeometry(.38+i*.05,1),satelliteMat.clone());
      body.rotation.set(.35,.2,.55); sat.add(body);
      const outer=new THREE.Mesh(new THREE.TorusGeometry(.58+i*.07,.012,8,64),new THREE.MeshBasicMaterial({color:i===1?violet:cyan,transparent:true,opacity:.62,blending:THREE.AdditiveBlending}));
      outer.rotation.x=Math.PI/2; sat.add(outer);
      const inner=new THREE.Mesh(new THREE.TorusGeometry(.32+i*.04,.006,6,48),new THREE.MeshBasicMaterial({color:blue,transparent:true,opacity:.45,blending:THREE.AdditiveBlending}));
      inner.rotation.y=Math.PI/3; sat.add(inner);
      const glow=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending}));
      glow.position.z=.38; sat.add(glow);
      const a=i/3*Math.PI*2+.9, r=3.35+i*.65;
      sat.position.set(Math.cos(a)*r,Math.sin(a)*r*.42,(i-1)*1.15);
      sat.userData={angle:a,radius:r,depth:sat.position.z,phase:2.4+i,speed:.12+i*.018,satellite:true};
      ambientObjects.add(sat);
    }

    const shardGeo = new THREE.IcosahedronGeometry(.12,0);
    for(let i=0;i<16;i++){
      const shard=new THREE.Mesh(shardGeo,new THREE.MeshBasicMaterial({color:i%3?blue:violet,transparent:true,opacity:.28,wireframe:true,blending:THREE.AdditiveBlending}));
      const a=Math.random()*Math.PI*2, r=3.2+Math.random()*3.4;
      shard.position.set(Math.cos(a)*r,(Math.sin(a)*r)*.55,(Math.random()-.5)*4.5);
      shard.userData={phase:Math.random()*Math.PI*2,baseY:shard.position.y,spin:.002+Math.random()*.003};
      ambientObjects.add(shard);
    }

    const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    resize(); window.addEventListener('resize',resize,{passive:true});
    if(finePointer){window.addEventListener('pointermove',e=>{pointer.tx=(e.clientX/innerWidth-.5)*2;pointer.ty=(e.clientY/innerHeight-.5)*2},{passive:true});}

    function render(t){
      const time=t*.001;
      if(!reduce){
        pointer.x+=(pointer.tx-pointer.x)*.045; pointer.y+=(pointer.ty-pointer.y)*.045;
        rig.rotation.y += .0015; rig.rotation.x = pointer.y*.06; rig.position.x=pointer.x*.1; rig.position.y=-pointer.y*.08;
        core.rotation.y += .0021; core.rotation.z=Math.sin(time*.55)*.025;
        rings.rotation.z += .0015; rings.rotation.x=Math.sin(time*.2)*.08;
        particles.rotation.y += .00025; particles.rotation.x=pointer.y*.012;
        pulse.rotation.y -= .004;
        if(ambientObjects){
          ambientObjects.rotation.y += .00018;
          ambientObjects.children.forEach((o,idx)=>{
            const u=o.userData;
            if(u.angle){
              const a=u.angle + time*u.speed;
              o.position.x=Math.cos(a)*u.radius;
              o.position.y=Math.sin(a)*u.radius*.52 + Math.sin(time*.7+u.phase)*.18;
              o.position.z=u.depth + Math.sin(time*.55+u.phase)*.35;
              o.rotation.y += .004 + idx*.00025;
              o.rotation.x += .0018;
            } else {
              o.position.y=u.baseY + Math.sin(time*.55+u.phase)*.28;
              o.rotation.x += u.spin; o.rotation.y += u.spin*.7;
            }
          });
        }
        core.children.forEach((o,idx)=>{if(o.isGroup && idx<5)o.position.y += Math.sin(time*1.1+idx)*.00045;});
      }
      const scroll=window.scrollY/(Math.max(1,document.body.scrollHeight-innerHeight));
      const targetZ=8.2-scroll*.8; camera.position.z += (targetZ-camera.position.z)*.025;
      camera.position.x += ((pointer.x*.35)-camera.position.x)*.015;
      camera.position.y += ((.15-pointer.y*.18)-camera.position.y)*.015;
      renderer.render(scene,camera); raf=requestAnimationFrame(render);
    }
    render(0);
  }

  const moduleData={
    performance:{code:'P-01',metric:'+38.4%',label:'CAMPAIGN LIFT',bar:'92%',state:'OPTIMISATION ACTIVE',stateValue:'92%'},
    presence:{code:'S-02',metric:'+24.6%',label:'ENGAGEMENT VELOCITY',bar:'78%',state:'CONTENT SYSTEM LIVE',stateValue:'78%'},
    web:{code:'W-03',metric:'98',label:'PERFORMANCE INDEX',bar:'98%',state:'CORE WEB READY',stateValue:'98%'},
    strategy:{code:'C-04',metric:'87',label:'CLARITY INDEX',bar:'87%',state:'ROADMAP ALIGNED',stateValue:'87%'}
  };
  function setMode(mode){
    modeState.value=mode;
    if(window.gsap && core && rings && !reduce){
      const presets={
        core:{scale:1,ry:.0,rx:.0,rz:.0},system:{scale:1.04,ry:.35,rx:-.12,rz:.04},modules:{scale:.98,ry:-.5,rx:.08,rz:-.03},
        performance:{scale:1.08,ry:.9,rx:.16,rz:.05},presence:{scale:1.02,ry:-.8,rx:-.08,rz:-.08},web:{scale:.94,ry:.35,rx:.24,rz:.12},
        strategy:{scale:1.1,ry:-.35,rx:-.2,rz:.16},proof:{scale:1.02,ry:.55,rx:.05,rz:-.04},contact:{scale:.88,ry:-.7,rx:.18,rz:0}
      };
      const p=presets[mode]||presets.core;
      gsap.to(core.scale,{x:p.scale,y:p.scale,z:p.scale,duration:.9,ease:'power3.out'});
      gsap.to(core.rotation,{y:p.ry,x:p.rx,z:p.rz,duration:1.1,ease:'power3.out'});
      gsap.to(rings.rotation,{y:-p.ry*.5,x:.15+p.rx*.4,duration:1.1,ease:'power3.out'});
    }
    document.body.dataset.mode=mode;
    const d=moduleData[mode];
    if(d){
      const map={moduleCode:d.code,moduleMetric:d.metric,moduleMetricLabel:d.label,moduleState:d.state,moduleStateValue:d.stateValue};
      Object.entries(map).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=val;});
      const bar=document.getElementById('moduleBar'); if(bar)bar.style.width=d.bar;
    }
    document.querySelectorAll('.module-card').forEach(c=>c.classList.toggle('active',c.dataset.module===mode));
  }

  if(window.gsap && window.ScrollTrigger && !reduce && !document.body.dataset.movie){
    gsap.registerPlugin(ScrollTrigger);
    const lenis=window.Lenis?new Lenis({duration:1.05,smoothWheel:true,syncTouch:false}):null;
    if(lenis){window.DPLenis=lenis;const tick=t=>{lenis.raf(t*1000);requestAnimationFrame(tick)};requestAnimationFrame(tick);lenis.on('scroll',ScrollTrigger.update);}
    gsap.to('.scroll-progress span',{width:'100%',ease:'none',scrollTrigger:{start:'top top',end:'bottom bottom',scrub:true}});
    gsap.utils.toArray('.reveal').forEach((el,i)=>gsap.fromTo(el,{y:34,opacity:0},{y:0,opacity:1,duration:.9,delay:(i%4)*.04,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}}));
    gsap.fromTo('.hero-panel',{x:-40,opacity:0},{x:0,opacity:1,duration:1.05,delay:.12,ease:'power3.out'});
    gsap.utils.toArray('.floating-ui').forEach((el,i)=>gsap.fromTo(el,{y:35,opacity:0,scale:.94},{y:0,opacity:1,scale:1,duration:.95,delay:.35+i*.08,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true}}));
    document.querySelectorAll('.scene-section').forEach(section=>{
      ScrollTrigger.create({trigger:section,start:'top 55%',end:'bottom 45%',onEnter:()=>setMode(section.dataset.mode),onEnterBack:()=>setMode(section.dataset.mode)});
      gsap.to(section.querySelector('.section-inner,.detail-grid,.contact-shell'),{y:-35,scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1}});
    });
    gsap.utils.toArray('.module-card').forEach((card,i)=>gsap.fromTo(card,{x:60,opacity:0},{x:0,opacity:1,duration:.7,delay:i*.06,scrollTrigger:{trigger:'.module-stack',start:'top 78%',once:true}}));
    gsap.utils.toArray('.review-card').forEach((card,i)=>gsap.fromTo(card,{y:30,opacity:0},{y:0,opacity:1,duration:.75,delay:i*.08,scrollTrigger:{trigger:'.review-rail',start:'top 80%',once:true}}));
  } else {
    document.querySelectorAll('.scene-section').forEach(s=>setMode(s.dataset.mode));
  }

  window.addEventListener('dp:scene', e => {
    if(!ambientObjects || reduce) return;
    const mode=e.detail?.mode||'core';
    const turns={core:0,system:.35,modules:-.55,performance:.9,presence:-.8,web:.25,strategy:-.4,proof:.55,contact:-.7};
    const turn=turns[mode]||0;
    gsap?.to?.(ambientObjects.rotation,{y:turn,duration:1.1,ease:'power3.out'});
    const s=(mode==='performance'||mode==='strategy')?1.14:1;
    gsap?.to?.(ambientObjects.scale,{x:s,y:s,z:s,duration:.9,ease:'power3.out'});
  });
  setMode('core');
  document.querySelectorAll('.module-card').forEach(card=>card.addEventListener('mouseenter',()=>setMode(card.dataset.module)));
  document.querySelectorAll('.module-card').forEach(card=>card.addEventListener('click',()=>setMode(card.dataset.module)));

  if(finePointer && !reduce){
    document.querySelectorAll('.tilt-card').forEach(card=>{
      card.addEventListener('pointermove',e=>{
        const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        card.style.transform='perspective(900px) rotateX('+(y*-5)+'deg) rotateY('+(x*7)+'deg) translateZ(6px)';
      });
      card.addEventListener('pointerleave',()=>card.style.transform='');
    });
    document.querySelectorAll('.magnetic').forEach(btn=>{
      btn.addEventListener('pointermove',e=>{
        const r=btn.getBoundingClientRect();
        btn.style.transform='translate('+((e.clientX-(r.left+r.width/2))*.1)+'px,'+((e.clientY-(r.top+r.height/2))*.1)+'px)';
      });
      btn.addEventListener('pointerleave',()=>btn.style.transform='');
    });
  }

  const aiButton=document.querySelector('#aiButton'), aiPanel=document.querySelector('#aiPanel'), aiClose=document.querySelector('#aiClose'), aiTeaser=document.querySelector('#aiTeaser'), aiAnswer=document.querySelector('#aiAnswer');
  const toggleAi=open=>{aiPanel.hidden=!open;aiButton.setAttribute('aria-expanded',String(open));if(open)aiPanel.querySelector('button')?.focus()};
  aiButton?.addEventListener('click',()=>toggleAi(aiPanel.hidden)); aiTeaser?.addEventListener('click',()=>toggleAi(true)); aiClose?.addEventListener('click',()=>toggleAi(false));
  document.querySelectorAll('#aiQuestions button').forEach(q=>q.addEventListener('click',()=>{aiAnswer.textContent=q.dataset.answer||''}));

  document.querySelector('#contactForm')?.addEventListener('submit',e=>{
    e.preventDefault(); const form=e.currentTarget, msg=document.querySelector('#formMessage');
    if(!form.checkValidity()){form.reportValidity();return;}
    msg.textContent='Transmission staged. Connect your inbox/CRM endpoint before launch.';
  });
})();