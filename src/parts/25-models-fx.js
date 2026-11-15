// ================= CLOTH / GEAR MATERIALS =================
function camoSurface(c1,c2,c3,c4,seed){const S=256,N=128;const a=sampler(fbm(N,4,4,seed),N),b=sampler(fbm(N,4,6,seed+7),N);
  return makeSurface(S,(x,y,u,v,o)=>{const A=a(u,v),B=b(u,v);let col=c1;if(A>0.56)col=c2;if(B>0.6)col=c3;if(A<0.38&&B<0.45)col=c4;
    const weave=((x>>1)+(y>>1))%2?0.04:-0.04;const gr=Math.random()*0.05;o.r=col[0]*(1+weave)+gr;o.g=col[1]*(1+weave)+gr;o.b=col[2]*(1+weave)+gr;
    o.h=0.5+weave*4+Math.sin(y*0.8)*0.05;o.ro=0.88;},1.5);}
function weaveSurface(seed){const S=256;return makeSurface(S,(x,y,u,v,o)=>{const w=((x>>2)+(y>>2))%2;const l=0.5+(w?0.06:-0.04)+Math.random()*0.05;o.r=o.g=o.b=l;o.h=0.5+(w?0.25:-0.25)*Math.sin((w?x:y)*Math.PI/4);o.ro=0.8;},2);}
const CAMO=[camoSurface([0.3,0.34,0.4],[0.21,0.24,0.29],[0.42,0.44,0.47],[0.15,0.16,0.18],301),camoSurface([0.62,0.52,0.38],[0.48,0.38,0.26],[0.72,0.64,0.5],[0.35,0.27,0.18],401)];
const WEAVE=weaveSurface(7);
const tile=(set,rx,ry)=>{const o={};for(const k in set){const t=set[k].clone();t.repeat.set(rx,ry);t.needsUpdate=true;o[k]=t;}return o;};
const GEAR={
  skin:STD({color:0xc08f6c,roughness:0.62}),
  leather:STD({color:0x2a2622,roughness:0.55}),
  glove:STD({color:0x26282a,roughness:0.7}),
  rubber:STD({color:0x1b1b1c,roughness:0.85}),
  lens:STD({color:0x080a0c,metalness:0.6,roughness:0.06}),
  gunMetal:STD({color:0x2a2c30,metalness:0.65,roughness:0.42}),
  gunPoly:STD({color:0x1e1f21,roughness:0.62}),
};
const TEAMMAT=[
  {cloth:STD({...tile(CAMO[0],1,1),roughness:1}),vest:STD({...tile(WEAVE,3,3),color:0x2b3442,roughness:1}),helmet:STD({color:0x3a4656,roughness:0.55,metalness:0.1}),pad:STD({color:0x22282f,roughness:0.6})},
  {cloth:STD({...tile(CAMO[1],1,1),roughness:1}),vest:STD({...tile(WEAVE,3,3),color:0x5d5236,roughness:1}),helmet:STD({...tile(WEAVE,4,4),color:0x2a2622,roughness:1}),pad:STD({color:0x4a3d2a,roughness:0.6}),band:STD({color:0x9a2a22,roughness:0.8})}];
// ================= CHARACTER MODEL =================
const CGEO=(()=>{const cap=(r,l,ty)=>{const g=new THREE.CapsuleGeometry(r,l,6,14);g.translate(0,ty,0);return g;};
  const torsoProf=[[0,0],[0.15,0.0],[0.165,0.12],[0.19,0.3],[0.2,0.4],[0.16,0.5],[0.07,0.55],[0,0.55]].map(p=>new THREE.Vector2(p[0],p[1]));
  const torso=new THREE.LatheGeometry(torsoProf,20);torso.scale(1,1,0.68);
  const head=new THREE.SphereGeometry(0.112,24,18);head.scale(0.9,1.08,1.0);
  const helmet=new THREE.SphereGeometry(0.135,24,14,0,TAU,0,Math.PI*0.56);helmet.scale(1,0.92,1.08);
  const beanie=new THREE.SphereGeometry(0.122,24,12,0,TAU,0,Math.PI*0.5);beanie.scale(0.96,0.9,1.04);
  const nose=new THREE.SphereGeometry(0.03,10,8);nose.scale(0.7,1,1);
  return {thigh:cap(0.097,0.25,-0.2),shin:cap(0.076,0.28,-0.2),knee:(()=>{const g=new THREE.SphereGeometry(0.075,14,10);g.scale(1,1.1,0.7);return g;})(),
    boot:new RoundedBoxGeometry(0.14,0.13,0.3,2,0.045),pelvis:new RoundedBoxGeometry(0.33,0.2,0.22,2,0.07),torso,vest:new RoundedBoxGeometry(0.42,0.38,0.3,3,0.08),
    pouch:new RoundedBoxGeometry(0.09,0.11,0.05,2,0.02),pack:new RoundedBoxGeometry(0.3,0.36,0.13,2,0.05),neck:new THREE.CylinderGeometry(0.052,0.06,0.1,14),head,helmet,beanie,nose,
    rim:new THREE.TorusGeometry(0.133,0.012,8,28),goggle:new RoundedBoxGeometry(0.17,0.05,0.05,2,0.02),visor:new RoundedBoxGeometry(0.19,0.05,0.04,2,0.018),
    uarm:cap(0.062,0.17,-0.13),farm:cap(0.05,0.18,-0.13),hand:(()=>{const g=new THREE.SphereGeometry(0.052,12,10);g.scale(0.9,1.1,1);return g;})(),shoulder:(()=>{const g=new THREE.SphereGeometry(0.085,14,10);g.scale(1.1,0.8,1);return g;})(),
    flash:new THREE.PlaneGeometry(0.5,0.5)};})();
// third-person rifle (one shared geometry set)
const TPGUN=(()=>{const g=new THREE.Group();const add=(geo,m,x,y,z,rx)=>{const k=new THREE.Mesh(geo,m);k.position.set(x,y,z);if(rx)k.rotation.x=rx;k.castShadow=true;g.add(k);};
  add(new RoundedBoxGeometry(0.05,0.08,0.4,2,0.015),GEAR.gunMetal,0,0,0);const b=new THREE.CylinderGeometry(0.011,0.011,0.3,10);b.rotateX(Math.PI/2);add(b,GEAR.gunMetal,0,0.01,-0.34);
  add(new RoundedBoxGeometry(0.045,0.06,0.2,2,0.015),GEAR.gunPoly,0,0.0,-0.24);add(new RoundedBoxGeometry(0.035,0.14,0.06,2,0.012),GEAR.gunPoly,0,-0.1,-0.07,0.25);
  add(new RoundedBoxGeometry(0.04,0.1,0.05,2,0.012),GEAR.gunPoly,0,-0.07,0.09,-0.3);add(new RoundedBoxGeometry(0.045,0.08,0.2,2,0.02),GEAR.gunPoly,0,-0.02,0.28);
  add(new RoundedBoxGeometry(0.03,0.045,0.08,2,0.01),GEAR.gunMetal,0,0.065,-0.02);return g;})();
const flashTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,235,1)');gr.addColorStop(0.25,'rgba(255,210,120,0.9)');gr.addColorStop(0.6,'rgba(255,140,40,0.35)');gr.addColorStop(1,'rgba(255,100,0,0)');
  g.fillStyle=gr;g.beginPath();g.arc(64,64,64,0,TAU);g.fill();g.globalCompositeOperation='lighter';for(let i=0;i<7;i++){g.save();g.translate(64,64);g.rotate(i*TAU/7+Math.random()*0.3);const l=g.createLinearGradient(0,0,0,60);l.addColorStop(0,'rgba(255,230,160,0.9)');l.addColorStop(1,'rgba(255,140,40,0)');g.fillStyle=l;g.beginPath();g.moveTo(-5,0);g.lineTo(0,60);g.lineTo(5,0);g.fill();g.restore();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
const flashMat=new THREE.MeshBasicMaterial({map:flashTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,color:new THREE.Color(4,3.2,2.2)});
function nameSprite(text,color){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.font='600 32px -apple-system,"PingFang SC",sans-serif';g.textAlign='center';g.fillStyle='rgba(10,16,26,0.55)';
  g.beginPath();g.roundRect(48,10,160,44,12);g.fill();g.fillStyle=color;g.fillText(text,128,43);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true,toneMapped:false}));s.scale.set(1.0,0.25,1);s.position.y=2.12;s.renderOrder=10;return s;}
// analytic 2-bone IK for static arm poses
function ikArm(parent,S,T,pole,L1,L2,mUp,mFo,mHand,mPad){const d=Math.min(T.clone().sub(S).length(),L1+L2-0.001);const dir=T.clone().sub(S).normalize();
  const a=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-a*a));const pp=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();const E=S.clone().addScaledVector(dir,a).addScaledVector(pp,h);
  const T2=S.clone().addScaledVector(dir,d);const down=new THREE.Vector3(0,-1,0);
  const ua=new THREE.Mesh(CGEO.uarm,mUp);ua.position.copy(S);ua.quaternion.setFromUnitVectors(down,E.clone().sub(S).normalize());ua.scale.y=L1/0.3;ua.castShadow=true;parent.add(ua);
  const fa=new THREE.Mesh(CGEO.farm,mFo);fa.position.copy(E);fa.quaternion.setFromUnitVectors(down,T2.clone().sub(E).normalize());fa.scale.y=L2/0.3;fa.castShadow=true;parent.add(fa);
  const hd=new THREE.Mesh(CGEO.hand,mHand);hd.position.copy(T2);hd.castShadow=true;parent.add(hd);const sp=new THREE.Mesh(CGEO.shoulder,mPad);sp.position.copy(S).add(new THREE.Vector3(0,0.02,0));sp.castShadow=true;parent.add(sp);}
function makeModelProc(team){const T=TEAMMAT[team];const g=new THREE.Group();const add=(geo,mat,x,y,z,parent,sx)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(parent||g).add(m);return m;};
  const legs=[];for(const s of [-1,1]){const hip=new THREE.Group();hip.position.set(s*0.1,0.92,0);g.add(hip);add(CGEO.thigh,T.cloth,0,0,0,hip);
    const knee=new THREE.Group();knee.position.y=-0.42;hip.add(knee);add(CGEO.knee,T.pad,0,0,-0.055,knee);add(CGEO.shin,T.cloth,0,0,0,knee);add(CGEO.boot,GEAR.leather,0,-0.43,-0.05,knee);legs.push(hip,knee);}
  const upper=new THREE.Group();upper.position.y=0.92;g.add(upper);
  add(CGEO.pelvis,T.cloth,0,0.02,0,upper);add(CGEO.torso,T.cloth,0,0.0,0,upper);add(CGEO.vest,T.vest,0,0.32,0,upper);
  for(const x of [-0.12,0,0.12])add(CGEO.pouch,T.vest,x,0.22,-0.17,upper);add(CGEO.pack,T.vest,0,0.33,0.19,upper);
  add(CGEO.neck,GEAR.skin,0,0.58,0,upper);
  const head=new THREE.Group();head.position.y=0.62;upper.add(head);
  if(team===0){add(CGEO.head,GEAR.skin,0,0.08,0,head);add(CGEO.nose,GEAR.skin,0,0.075,-0.105,head);add(CGEO.helmet,T.helmet,0,0.1,0.005,head);add(CGEO.rim,T.helmet,0,0.1,0.005,head).rotation.x=Math.PI/2;
    add(CGEO.goggle,GEAR.lens,0,0.1,-0.105,head);}
  else{add(CGEO.head,T.helmet,0,0.08,0,head);add(CGEO.nose,T.helmet,0,0.075,-0.105,head);add(CGEO.visor,GEAR.lens,0,0.1,-0.1,head);add(CGEO.beanie,T.band,0,0.11,0.003,head);}
  // rifle + arms
  const gun=TPGUN.clone();gun.scale.setScalar(1.3);gun.position.set(0.1,0.36,-0.3);upper.add(gun);
  ikArm(upper,new THREE.Vector3(0.21,0.48,0),new THREE.Vector3(0.1,0.27,-0.19),new THREE.Vector3(1,-1,0.3),0.3,0.29,T.cloth,T.cloth,GEAR.glove,T.pad);
  ikArm(upper,new THREE.Vector3(-0.21,0.48,0),new THREE.Vector3(0.085,0.33,-0.52),new THREE.Vector3(-1,-1,0),0.3,0.3,T.cloth,T.cloth,GEAR.glove,T.pad);
  const flash=new THREE.Mesh(CGEO.flash,flashMat);flash.position.set(0.1,0.375,-0.96);flash.visible=false;upper.add(flash);
  g.updateMatrixWorld(true);mergeRigid(upper,[head,flash]);mergeRigid(head,[]);for(let i=0;i<4;i+=2){mergeRigid(legs[i],[legs[i+1]]);mergeRigid(legs[i+1],[]);}
  return {root:g,hipL:legs[0],kneeL:legs[1],hipR:legs[2],kneeR:legs[3],upper,head,flash,muzzle:new THREE.Vector3(0.1,0.375,-0.93)};}
// merge all rigid meshes under a group (skipping excluded sub-objects) into one mesh per material
function mergeRigid(group,exclude){const inv=group.matrixWorld.clone().invert();const buckets=new Map();const kill=[];
  (function walk(o){for(const c of o.children){if(exclude.includes(c))continue;if(c.isMesh){const m=new THREE.Matrix4().multiplyMatrices(inv,c.matrixWorld);let geo=c.geometry.clone().applyMatrix4(m);if(geo.index)geo=geo.toNonIndexed();
      for(const k of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(k))geo.deleteAttribute(k);if(!geo.attributes.uv)geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
      if(!buckets.has(c.material))buckets.set(c.material,[]);buckets.get(c.material).push(geo);kill.push(c);}else if(!c.isSprite)walk(c);}})(group);
  for(const k of kill)k.parent.remove(k);for(const c of [...group.children])if(c.isGroup&&!exclude.includes(c)&&c.children.length===0)group.remove(c);
  for(const [mat,list] of buckets){const mm=new THREE.Mesh(mergeGeometries(list),mat);mm.castShadow=true;group.add(mm);}}

// ================= VIEWMODEL WEAPONS =================
const vmRoot=new THREE.Group();vmScene.add(vmRoot);const VM={};
(function(){
  const metal=STD({color:0x2b2d31,metalness:0.7,roughness:0.36}),metal2=STD({color:0x3c3f44,metalness:0.8,roughness:0.3}),steel=STD({color:0x8e9399,metalness:1,roughness:0.22}),
    poly=STD({color:0x1c1d1f,roughness:0.6}),tan=STD({color:0x8a7452,roughness:0.62}),wood=STD({color:0x5a3a22,roughness:0.42}),olive=STD({color:0x4c5236,roughness:0.6}),
    glass=STD({color:0x0a1420,metalness:0.4,roughness:0.03}),red=new THREE.MeshBasicMaterial({color:new THREE.Color(6,0.3,0.2)}),
    sleeve=STD({...tile(CAMO[0],1.2,1.2),roughness:1}),glove=STD({...tile(WEAVE,2,2),color:0x3a3c3e,roughness:1}),knuckle=STD({color:0x1c1d1e,roughness:0.5});
  const M_=(geo,mat,x,y,z,parent,rx,ry,rz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.rotation.set(rx||0,ry||0,rz||0);parent.add(m);return m;};
  // extrude a side profile (pts as [forward, up]) to width w; result centered on x
  const ext=(pts,w,bev,mat,parent,x)=>{const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();
    const b=bev==null?0.004:bev;const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(0.001,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:10});
    g.translate(0,0,-(w-2*b)/2);g.rotateY(Math.PI/2);g.computeVertexNormals();return M_(g,mat,x||0,0,0,parent);};
  const cylZ=(r1,r2,len,seg,mat,parent,x,y,z)=>{const g=new THREE.CylinderGeometry(r1,r2,len,seg||20);g.rotateX(Math.PI/2);return M_(g,mat,x,y,z,parent);};
  const rb=(w,h,d,r,mat,parent,x,y,z,rx)=>M_(new RoundedBoxGeometry(w,h,d,3,r),mat,x,y,z,parent,rx);
  // hands
  function gripHand(parent,x,y,z,rx,flip){const h=new THREE.Group();h.position.set(x,y,z);h.rotation.x=rx||0;parent.add(h);
    rb(0.035,0.09,0.075,0.015,glove,h,(flip?-1:1)*0.03,0,0.02);// palm side
    for(let i=0;i<4;i++){const f=new THREE.CapsuleGeometry(0.0115,0.045,4,8);f.rotateZ(Math.PI/2);M_(f,glove,0,0.03-i*0.022,-0.032,h);}
    rb(0.02,0.02,0.04,0.008,knuckle,h,(flip?-1:1)*0.032,0.03,-0.028);
    const th=new THREE.CapsuleGeometry(0.012,0.04,4,8);th.rotateX(Math.PI/2);M_(th,glove,(flip?1:-1)*0.03,0.035,-0.01,h);
    return h;}
  function sleeveArm(parent,from,to,r){const d=to.clone().sub(from);const L=d.length();const g=new THREE.CylinderGeometry(r*0.85,r,L,18);const m=M_(g,sleeve,0,0,0,parent);m.position.copy(from).addScaledVector(d,0.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    const cuffG=new THREE.CylinderGeometry(r*0.88,r*0.88,0.03,18);const cuff=M_(cuffG,glove,0,0,0,parent);cuff.position.copy(from).addScaledVector(d,0.015);cuff.quaternion.copy(m.quaternion);
    const wr=new THREE.CylinderGeometry(r*0.7,r*0.8,0.06,14);const w=M_(wr,glove,0,0,0,parent);w.position.copy(from).addScaledVector(d,-0.02);w.quaternion.copy(m.quaternion);}
  function stdArms(g,gripZ,foreZ,foreY){gripHand(g,0,-0.075,gripZ,0.25);sleeveArm(g,new THREE.Vector3(0.02,-0.12,gripZ+0.04),new THREE.Vector3(0.16,-0.32,gripZ+0.4),0.042);
    const lh=new THREE.Group();lh.position.set(-0.005,foreY,foreZ);g.add(lh);rb(0.07,0.035,0.08,0.015,glove,lh,0,-0.03,0);for(let i=0;i<4;i++){const f=new THREE.CapsuleGeometry(0.011,0.04,4,8);M_(f,glove,0.035,-0.005,-0.03+i*0.02,lh,0,0,0.2);}
    const th=new THREE.CapsuleGeometry(0.011,0.04,4,8);M_(th,glove,-0.035,0,-0.01,lh,0,0,-0.2);
    sleeveArm(g,new THREE.Vector3(-0.02,foreY-0.06,foreZ+0.04),new THREE.Vector3(-0.2,foreY-0.3,foreZ+0.38),0.042);}
  // --- RIFLE (AR-7)
  let g=new THREE.Group();
  ext([[-0.1,0],[0.24,0],[0.24,0.05],[0.02,0.05],[0.0,0.058],[-0.1,0.058]],0.052,0.005,metal,g);// upper receiver
  ext([[-0.08,-0.045],[0.12,-0.045],[0.14,-0.02],[0.14,0.0],[-0.1,0.0],[-0.1,-0.02]],0.05,0.005,metal2,g);// lower
  ext([[-0.02,-0.04],[0.025,-0.04],[0.0,-0.15],[-0.05,-0.155],[-0.055,-0.14]],0.04,0.006,poly,g);// pistol grip
  ext([[-0.1,0.04],[-0.13,0.03],[-0.27,0.0],[-0.28,-0.08],[-0.25,-0.09],[-0.16,-0.04],[-0.1,-0.035]],0.036,0.008,poly,g);// stock
  rb(0.02,0.03,0.06,0.008,metal,g,0.03,0.035,0.05);// charging handle side
  // banana magazine
  {const s=new THREE.Shape();s.moveTo(0.06,-0.04);s.lineTo(0.125,-0.04);s.quadraticCurveTo(0.14,-0.13,0.17,-0.22);s.lineTo(0.11,-0.235);s.quadraticCurveTo(0.085,-0.14,0.06,-0.04);
   const mg=new THREE.ExtrudeGeometry(s,{depth:0.026,bevelEnabled:true,bevelThickness:0.004,bevelSize:0.004,bevelSegments:3,curveSegments:16});mg.translate(0,0,-0.013);mg.rotateY(Math.PI/2);M_(mg,poly,0,0,0,g);
   for(let i=0;i<4;i++)rb(0.036,0.006,0.05,0.002,metal2,g,0,-0.07-i*0.04,-0.105-i*0.016,0.25+i*0.08);}
  // handguard with vents
  {const hg=new THREE.CylinderGeometry(0.031,0.031,0.3,8);hg.rotateX(Math.PI/2);hg.rotateZ(Math.PI/8);M_(hg,tan,0,0.025,-0.39,g);
   for(let i=0;i<5;i++){rb(0.064,0.012,0.03,0.005,poly,g,0,0.025,-0.28-i*0.055);}}
  cylZ(0.0115,0.0115,0.24,16,steel,g,0,0.025,-0.65);cylZ(0.017,0.017,0.06,16,metal,g,0,0.025,-0.78);
  for(let i=0;i<3;i++)rb(0.036,0.006,0.012,0.002,poly,g,0,0.025,-0.765-i*0.014);
  // top rail + optic
  for(let i=0;i<14;i++)rb(0.026,0.008,0.012,0.002,metal2,g,0,0.062,0.0-i*0.02);
  {const o=new THREE.Group();o.position.set(0,0.1,-0.07);g.add(o);cylZ(0.022,0.022,0.09,24,metal,o,0,0,0);cylZ(0.026,0.024,0.02,24,metal,o,0,0,-0.045);cylZ(0.024,0.026,0.02,24,metal,o,0,0,0.045);
   const ln=new THREE.CircleGeometry(0.019,24);M_(ln,glass,0,0,0.056,o);const ln2=new THREE.CircleGeometry(0.019,24);M_(ln2,glass,0,0,-0.056,o,0,Math.PI,0);
   M_(new THREE.SphereGeometry(0.0018,8,6),red,0,0,0.0,o);rb(0.026,0.03,0.05,0.006,metal,o,0,-0.03,0);rb(0.012,0.016,0.016,0.003,metal2,o,0.024,0,0);}
  M_(new THREE.TorusGeometry(0.022,0.004,6,16,Math.PI),metal,0,-0.05,0.05,g,0,Math.PI/2,Math.PI);// trigger guard
  rb(0.006,0.025,0.008,0.002,steel,g,0,-0.055,0.05);
  stdArms(g,0.0,-0.36,-0.01);g.userData.muzzle=new THREE.Vector3(0,0.025,-0.83);g.userData.pos=[0.15,-0.14,-0.47];VM.rifle=g;
  // --- SMG (MK-5)
  g=new THREE.Group();
  ext([[-0.08,-0.03],[0.2,-0.03],[0.22,0.0],[0.22,0.045],[-0.08,0.045]],0.055,0.008,metal,g);
  ext([[-0.01,-0.03],[0.03,-0.03],[0.005,-0.14],[-0.04,-0.14]],0.04,0.006,poly,g);
  ext([[0.07,-0.03],[0.11,-0.03],[0.115,-0.2],[0.08,-0.2]],0.028,0.004,poly,g);
  cylZ(0.024,0.024,0.16,24,metal2,g,0,0.012,-0.3);for(let i=0;i<3;i++)cylZ(0.0255,0.0255,0.005,24,poly,g,0,0.012,-0.24-i*0.05);// suppressor
  ext([[-0.08,0.03],[-0.28,0.02],[-0.28,-0.04],[-0.25,-0.04],[-0.25,0.0],[-0.08,0.005]],0.02,0.004,metal2,g);
  for(let i=0;i<8;i++)rb(0.024,0.007,0.012,0.002,metal2,g,0,0.05,0.04-i*0.022);rb(0.012,0.024,0.012,0.003,metal,g,0,0.06,-0.17);
  stdArms(g,0.0,-0.16,-0.02);g.userData.muzzle=new THREE.Vector3(0,0.012,-0.39);g.userData.pos=[0.14,-0.13,-0.4];VM.smg=g;
  // --- SNIPER (LR-9)
  g=new THREE.Group();
  ext([[-0.38,-0.02],[-0.12,-0.0],[-0.06,-0.06],[0.0,-0.06],[0.02,-0.02],[0.35,-0.02],[0.37,0.02],[-0.1,0.03],[-0.36,0.05],[-0.42,0.06],[-0.43,-0.07],[-0.39,-0.08]],0.055,0.01,olive,g);
  ext([[-0.06,-0.06],[-0.01,-0.06],[-0.04,-0.16],[-0.08,-0.15]],0.04,0.008,olive,g);
  cylZ(0.019,0.019,0.36,20,metal,g,0,0.035,0.03);cylZ(0.012,0.009,0.62,20,metal2,g,0,0.035,-0.52);cylZ(0.016,0.016,0.06,16,metal,g,0,0.035,-0.84);
  {const bolt=new THREE.CylinderGeometry(0.006,0.006,0.06,10);bolt.rotateZ(Math.PI/2);M_(bolt,steel,0.04,0.035,0.08,g);M_(new THREE.SphereGeometry(0.012,12,10),steel,0.072,0.035,0.08,g);}
  {const o=new THREE.Group();o.position.set(0,0.1,-0.0);g.add(o);cylZ(0.019,0.019,0.22,24,metal,o,0,0,0);cylZ(0.034,0.019,0.07,24,metal,o,0,0,-0.14);cylZ(0.019,0.03,0.06,24,metal,o,0,0,0.13);
   M_(new THREE.CylinderGeometry(0.012,0.012,0.03,14),metal2,0,0.03,0,o);M_(new THREE.CylinderGeometry(0.012,0.012,0.03,14),metal2,0.03,0,0,o,0,0,Math.PI/2);
   M_(new THREE.CircleGeometry(0.031,24),glass,0,0,-0.176,o,0,Math.PI,0);rb(0.02,0.05,0.03,0.006,metal,o,0,-0.045,-0.06);rb(0.02,0.05,0.03,0.006,metal,o,0,-0.045,0.06);}
  for(let i=0;i<3;i++)rb(0.03,0.02,0.012,0.003,metal,g,0,-0.02,-0.12-i*0.015);
  stdArms(g,0.0,-0.3,-0.04);g.userData.muzzle=new THREE.Vector3(0,0.035,-0.88);g.userData.pos=[0.15,-0.145,-0.48];VM.sniper=g;
  // --- PISTOL (P-12)
  g=new THREE.Group();
  ext([[-0.04,0.0],[0.17,0.0],[0.17,0.035],[0.16,0.04],[-0.03,0.04],[-0.04,0.03]],0.03,0.004,metal,g);// slide
  for(let i=0;i<6;i++)rb(0.032,0.03,0.003,0.001,metal2,g,0,0.02,0.02+i*0.006);
  ext([[-0.02,-0.025],[0.15,-0.025],[0.15,0.0],[-0.03,0.0]],0.028,0.004,poly,g);
  ext([[-0.03,-0.02],[0.035,-0.02],[0.01,-0.13],[-0.05,-0.13]],0.032,0.006,poly,g);
  M_(new THREE.TorusGeometry(0.018,0.0035,6,14,Math.PI),poly,0,-0.025,-0.035,g,0,Math.PI/2,Math.PI);
  cylZ(0.006,0.006,0.01,12,steel,g,0,0.02,-0.172);rb(0.008,0.008,0.006,0.002,metal,g,0,0.044,-0.15);rb(0.02,0.008,0.006,0.002,metal,g,0,0.044,0.03);
  gripHand(g,0,-0.075,0.0,0.3);sleeveArm(g,new THREE.Vector3(0.02,-0.12,0.04),new THREE.Vector3(0.15,-0.33,0.42),0.042);
  {const lh=new THREE.Group();lh.position.set(-0.03,-0.08,-0.01);lh.rotation.z=0.3;g.add(lh);rb(0.03,0.08,0.07,0.014,glove,lh,0,0,0);for(let i=0;i<4;i++){const f=new THREE.CapsuleGeometry(0.011,0.04,4,8);f.rotateZ(Math.PI/2);M_(f,glove,0.025,0.02-i*0.02,-0.03,lh);}
   sleeveArm(g,new THREE.Vector3(-0.05,-0.12,0.03),new THREE.Vector3(-0.2,-0.34,0.4),0.042);}
  g.userData.muzzle=new THREE.Vector3(0,0.02,-0.18);g.userData.pos=[0.09,-0.1,-0.36];VM.pistol=g;
  // --- KNIFE
  g=new THREE.Group();
  {const s=new THREE.Shape();s.moveTo(0,-0.012);s.lineTo(0.14,-0.012);s.quadraticCurveTo(0.2,-0.005,0.225,0.02);s.quadraticCurveTo(0.17,0.016,0.13,0.02);s.lineTo(0,0.02);s.closePath();
   const bg=new THREE.ExtrudeGeometry(s,{depth:0.002,bevelEnabled:true,bevelThickness:0.0025,bevelSize:0.003,bevelSegments:2});bg.translate(0,0,-0.001);bg.rotateY(Math.PI/2);M_(bg,steel,0,0,0,g);
   rb(0.026,0.05,0.012,0.004,metal,g,0,0.004,0.005);
   const hg=new THREE.CylinderGeometry(0.014,0.016,0.11,16);hg.rotateX(Math.PI/2);M_(hg,poly,0,0.004,0.065,g);for(let i=0;i<4;i++)cylZ(0.0165,0.0165,0.004,16,metal2,g,0,0.004,0.03+i*0.022);
   cylZ(0.017,0.012,0.012,16,metal,g,0,0.004,0.124);}
  gripHand(g,0,-0.0,0.06,1.4);sleeveArm(g,new THREE.Vector3(0.02,-0.04,0.1),new THREE.Vector3(0.14,-0.3,0.42),0.042);
  g.userData.muzzle=new THREE.Vector3(0,0,-0.2);g.userData.pos=[0.12,-0.12,-0.34];VM.knife=g;
  // glTF weapons (Quaternius, CC0) replace the procedural gun bodies; procedural gloves/sleeves kept
  function vmGun(key,len,rearZ,topY,armsFn,pos){const o=ASSETS[key].scene.clone(true);const h=new THREE.Group();h.add(o);o.rotation.y=Math.PI/2;h.updateMatrixWorld(true);
    let b=new THREE.Box3().setFromObject(h);const s=len/(b.max.z-b.min.z);o.scale.multiplyScalar(s);h.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(h);
    o.position.x-=(b.min.x+b.max.x)/2;o.position.y+=topY-b.max.y;o.position.z+=rearZ-b.max.z;h.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(h);
    o.traverse(m=>{if(m.isMesh){const n=m.material.clone();n.roughness=Math.max(0.42,n.roughness??0.6);n.metalness=Math.min(0.55,Math.max(0.25,n.metalness??0.3));n.envMapIntensity=0.9;m.material=n;}});
    const g=new THREE.Group();g.add(h);armsFn(g);g.userData.muzzle=new THREE.Vector3(0,(topY+b.min.y)/2+0.02,b.min.z);g.userData.pos=pos;g.userData.gltf=true;return g;}
  VM.rifle=vmGun('rifle',0.98,0.27,0.075,g=>stdArms(g,0.0,-0.34,-0.02),[0.15,-0.14,-0.47]);
  VM.smg=vmGun('smg',0.5,0.2,0.06,g=>stdArms(g,0.0,-0.17,-0.02),[0.14,-0.13,-0.4]);
  VM.sniper=vmGun('sniper',1.22,0.33,0.15,g=>stdArms(g,0.0,-0.3,-0.04),[0.15,-0.145,-0.48]);
  {const pg=VM.pistol;const arms=pg.children.filter(c=>c.isGroup||c.geometry&&c.geometry.type==='CylinderGeometry');
   VM.pistol=vmGun('pistol',0.22,0.04,0.045,g=>{for(const c of arms)g.add(c);},[0.09,-0.1,-0.36]);}
  for(const k in VM){VM[k].visible=false;vmRoot.add(VM[k]);}
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.2),flashMat);fl.visible=false;vmRoot.add(fl);VM.flash=fl;})();

// ================= EFFECTS =================
function softTex(draw,size){const c=document.createElement('canvas');c.width=c.height=size||128;draw(c.getContext('2d'),size||128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const smokeTex=softTex((g,S)=>{const n=sampler(fbm(64,4,4,555),64);const id=g.createImageData(S,S);for(let y=0;y<S;y++)for(let x=0;x<S;x++){const dx=x/S-0.5,dy=y/S-0.5;const r=Math.hypot(dx,dy)*2;const a=clamp(1-r,0,1)**1.6*clamp(n(x/S,y/S)*1.6-0.25,0,1);const k=(y*S+x)*4;id.data[k]=id.data[k+1]=id.data[k+2]=235;id.data[k+3]=a*255;}g.putImageData(id,0,0);});
const sparkTex=softTex((g,S)=>{const gr=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);gr.addColorStop(0,'rgba(255,255,230,1)');gr.addColorStop(0.3,'rgba(255,200,100,0.8)');gr.addColorStop(1,'rgba(255,120,0,0)');g.fillStyle=gr;g.fillRect(0,0,S,S);},32);
const holeTex=softTex((g,S)=>{const c=S/2;let gr=g.createRadialGradient(c,c,0,c,c,c);gr.addColorStop(0,'rgba(10,8,6,1)');gr.addColorStop(0.12,'rgba(15,12,10,1)');gr.addColorStop(0.22,'rgba(40,34,28,0.85)');gr.addColorStop(0.5,'rgba(60,52,44,0.35)');gr.addColorStop(1,'rgba(60,52,44,0)');
  g.fillStyle=gr;g.fillRect(0,0,S,S);g.strokeStyle='rgba(30,25,20,0.5)';g.lineWidth=1.5;for(let i=0;i<7;i++){const a=Math.random()*TAU;g.beginPath();g.moveTo(c+Math.cos(a)*8,c+Math.sin(a)*8);g.lineTo(c+Math.cos(a+0.2)*rand(18,36),c+Math.sin(a+0.2)*rand(18,36));g.stroke();}});
const FX={tracers:[],decals:[],sparks:[],smoke:[],di:0,si:0,ki:0,ti:0};
{const tm=new THREE.LineBasicMaterial({color:new THREE.Color(3,2.5,1.4),transparent:true,opacity:0.8,toneMapped:false});
 for(let i=0;i<40;i++){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const l=new THREE.Line(g,tm.clone());l.visible=false;l.frustumCulled=false;scene.add(l);FX.tracers.push({l,t:0});}
 const dm=STD({map:holeTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,roughness:0.9});const dg=new THREE.PlaneGeometry(0.11,0.11);
 for(let i=0;i<140;i++){const m=new THREE.Mesh(dg,dm);m.visible=false;m.matrixAutoUpdate=false;scene.add(m);FX.decals.push(m);}
 for(let i=0;i<80;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:sparkTex,color:new THREE.Color(3,2.2,1.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false}));s.visible=false;scene.add(s);FX.sparks.push({s,v:new THREE.Vector3(),t:0,t0:1});}
 for(let i=0;i<60;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,depthWrite:false,transparent:true,opacity:0}));s.visible=false;scene.add(s);FX.smoke.push({s,v:new THREE.Vector3(),t:0,t0:1,size:1,grow:1,a:0.5});}}
function fxTracer(a,b){const T=FX.tracers[FX.ti++%FX.tracers.length];const p=T.l.geometry.attributes.position.array;p[0]=a.x;p[1]=a.y;p[2]=a.z;p[3]=b.x;p[4]=b.y;p[5]=b.z;T.l.geometry.attributes.position.needsUpdate=true;T.l.visible=true;T.t=0.06;T.l.material.opacity=0.8;}
const _q=new THREE.Quaternion(),_nz=new THREE.Vector3(0,0,1),_nv=new THREE.Vector3();
function fxDecal(p,n){const d=FX.decals[FX.di++%FX.decals.length];_nv.set(n[0],n[1],n[2]);d.position.set(p.x+n[0]*0.006,p.y+n[1]*0.006,p.z+n[2]*0.006);d.quaternion.setFromUnitVectors(_nz,_nv);
  _q.setFromAxisAngle(_nz,Math.random()*TAU);d.quaternion.multiply(_q);const s=rand(0.8,1.2);d.scale.set(s,s,1);d.updateMatrix();d.visible=true;}
function fxSmoke(p,n,kind,count){for(let i=0;i<count;i++){const P=FX.smoke[FX.ki++%FX.smoke.length];P.s.position.copy(p);if(n)P.s.position.x+=n[0]*0.05,P.s.position.y+=n[1]*0.05,P.s.position.z+=n[2]*0.05;
  const blood=kind==='blood';P.v.set(rand(-0.3,0.3)+(n?n[0]*0.8:0),rand(0.1,0.5)+(n?n[1]*0.5:0),rand(-0.3,0.3)+(n?n[2]*0.8:0));P.t0=P.t=blood?rand(0.25,0.4):rand(0.8,1.6);P.size=blood?0.18:rand(0.18,0.32);P.grow=blood?1.2:rand(0.6,1.1);
  P.a=blood?0.85:(kind==='muzzle'?0.25:0.45);P.s.material.color.set(blood?0x6a0808:(kind==='dust'?0xb8a990:0xcfcac2));P.s.material.rotation=Math.random()*TAU;P.s.visible=true;}}
function fxSparks(p,n,count){for(let i=0;i<count;i++){const P=FX.sparks[FX.si++%FX.sparks.length];P.s.position.copy(p);P.v.set(rand(-2,2)+n[0]*3,rand(0,3)+n[1]*3,rand(-2,2)+n[2]*3);P.t0=P.t=rand(0.12,0.3);P.s.scale.setScalar(rand(0.025,0.05));P.s.visible=true;}}
function fxParts(p,kind,n,count){if(kind==='spark'){fxSparks(p,n||[0,1,0],count+2);fxSmoke(p,n,'dust',1);}else if(kind==='blood')fxSmoke(p,n,'blood',Math.min(4,Math.ceil(count/2)));else fxSmoke(p,n,'dust',2);}
function updateFX(dt){for(const T of FX.tracers)if(T.t>0){T.t-=dt;T.l.material.opacity=Math.max(0,T.t/0.06)*0.8;if(T.t<=0)T.l.visible=false;}
  for(const P of FX.sparks)if(P.t>0){P.t-=dt;P.v.y-=14*dt;P.s.position.addScaledVector(P.v,dt);if(P.t<=0||P.s.position.y<0)P.s.visible=false;}
  for(const P of FX.smoke)if(P.t>0){P.t-=dt;const k=1-P.t/P.t0;P.s.position.addScaledVector(P.v,dt);P.v.multiplyScalar(Math.exp(-dt*2));P.v.y+=dt*0.15;const sz=P.size*(1+k*P.grow*2.5);P.s.scale.set(sz,sz,1);
    P.s.material.opacity=P.a*Math.min(1,k*6)*(1-k);if(P.t<=0)P.s.visible=false;}}
function clearFX(){FX.decals.forEach(d=>d.visible=false);FX.sparks.forEach(p=>{p.t=0;p.s.visible=false;});FX.smoke.forEach(p=>{p.t=0;p.s.visible=false;});FX.tracers.forEach(t=>{t.t=0;t.l.visible=false;});}
