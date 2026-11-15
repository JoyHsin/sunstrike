// ================= RIGGED CHARACTERS (Quaternius SWAT, CC0) =================
const SWAT=(()=>{const src=ASSETS.swat.scene;src.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(src);const h=box.max.y-box.min.y;
  const clips={};for(const c of ASSETS.swat.animations)clips[c.name.split('|').pop()]=c;
  const base={};src.traverse(o=>{if(o.isMesh)base[o.material.name]=o.material;});
  const mk=(name,color,rough)=>{const m=base[name].clone();m.color.set(color);m.roughness=rough;m.metalness=0.05;return m;};
  const mats=[{Swat:mk('Swat',0x3d4a5e,0.8),Swat_Black:mk('Swat_Black',0x1b2029,0.7),Skin:mk('Skin',0xc08f6c,0.6),Visor:mk('Visor',0x0d1116,0.15)},
    {Swat:mk('Swat',0x8e7b58,0.85),Swat_Black:mk('Swat_Black',0x40362a,0.75),Skin:mk('Skin',0xa8785a,0.6),Visor:mk('Visor',0x2a1c12,0.2)}];
  mats[0].Visor.metalness=0.6;mats[1].Visor.metalness=0.5;
  return {scale:1.8/h,clips,mats};})();
// third-person weapon models: forward +X in source → we orient them along -Z
const TPW={};
function prepGun(key,len){const o=ASSETS[key].scene.clone(true);const holder=new THREE.Group();holder.add(o);o.rotation.y=Math.PI/2;holder.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(holder);const sz=b.getSize(new THREE.Vector3());const s=len/sz.z;o.scale.multiplyScalar(s);holder.updateMatrixWorld(true);
  const b2=new THREE.Box3().setFromObject(holder);o.position.sub(new THREE.Vector3((b2.min.x+b2.max.x)/2,(b2.max.y+b2.min.y)/2,0));holder.updateMatrixWorld(true);
  let b3=new THREE.Box3().setFromObject(holder);o.position.z-=b3.max.z;holder.updateMatrixWorld(true);b3=new THREE.Box3().setFromObject(holder);o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.material=propMat(m.material);}});
  holder.userData={front:b3.min.z,rear:b3.max.z,top:b3.max.y,bottom:b3.min.y,len};return holder;}
for(const [k,l] of [['rifle',0.86],['smg',0.6],['sniper',1.15],['pistol',0.22]])TPW[k]=prepGun(k,l);
const _v1=new THREE.Vector3(),_v2=new THREE.Vector3(),_v3=new THREE.Vector3(),_q1=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_q3=new THREE.Quaternion();
function aimBone(bone,child,target){bone.getWorldPosition(_v1);child.getWorldPosition(_v2);const cur=_v2.sub(_v1).normalize();const des=_v3.copy(target).sub(_v1).normalize();
  _q1.setFromUnitVectors(cur,des);bone.getWorldQuaternion(_q2);_q1.multiply(_q2);bone.parent.getWorldQuaternion(_q3).invert();bone.quaternion.copy(_q3.multiply(_q1));bone.updateMatrixWorld(true);}
const _S=new THREE.Vector3(),_E=new THREE.Vector3(),_T=new THREE.Vector3(),_P=new THREE.Vector3(),_D=new THREE.Vector3();
function ik2(up,lo,wr,target,pole){up.getWorldPosition(_S);lo.getWorldPosition(_E);const L1=_E.distanceTo(_S);wr.getWorldPosition(_T);const L2=_T.distanceTo(_E);
  const d=Math.min(target.distanceTo(_S),L1+L2-0.002);_D.copy(target).sub(_S).normalize();const a=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-a*a));
  _P.copy(pole).addScaledVector(_D,-pole.dot(_D)).normalize();const elbow=_E.copy(_S).addScaledVector(_D,a).addScaledVector(_P,h);aimBone(up,lo,elbow);aimBone(lo,wr,target);}
const _G1=new THREE.Vector3(),_G2=new THREE.Vector3(),_PL=new THREE.Vector3();
const LOCO=['Idle_Neutral','Walk','Run','Run_Back','Run_Left','Run_Right'];
function makeModel(team){const root=new THREE.Group();const body=SkeletonUtils.clone(ASSETS.swat.scene);body.scale.setScalar(SWAT.scale);body.rotation.y=Math.PI;root.add(body);
  const bones={};body.traverse(o=>{if(o.isBone)bones[o.name]=o;if(o.isMesh){o.material=SWAT.mats[team][o.material.name]||o.material;o.castShadow=true;o.receiveShadow=false;o.frustumCulled=false;}});
  const mixer=new THREE.AnimationMixer(body);const act={};for(const n of [...LOCO,'Death','HitRecieve']){const c=SWAT.clips[n];if(!c)continue;act[n]=mixer.clipAction(c);}
  act.Death.setLoop(THREE.LoopOnce,1);act.Death.clampWhenFinished=true;act.HitRecieve.setLoop(THREE.LoopOnce,1);
  for(const n of LOCO){act[n].play();act[n].setEffectiveWeight(n==='Idle_Neutral'?1:0);}
  const pivot=new THREE.Group();root.add(pivot);const guns={};for(const k in TPW){guns[k]=TPW[k].clone();guns[k].visible=false;pivot.add(guns[k]);}
  const flash=new THREE.Mesh(new THREE.PlaneGeometry(0.45,0.45),flashMat);flash.visible=false;pivot.add(flash);
  const M={root,body,bones,mixer,act,pivot,guns,flash,cur:'rifle',w:{},dead:false,crouch:0,
    setWeapon(id){if(!guns[id])id='rifle';for(const k in guns)guns[k].visible=k===id;M.cur=id;const u=guns[id].userData;flash.position.set(0,0.03,u.front-0.12);},
    muzzleWorld(out){const u=guns[M.cur].userData;return pivot.localToWorld(out.set(0,0.03,u.front));},
    reset(){M.dead=false;mixer.stopAllAction();for(const n of LOCO){act[n].reset().play();act[n].setEffectiveWeight(n==='Idle_Neutral'?1:0);}pivot.visible=true;M.w={};},
    die(){if(M.dead)return;M.dead=true;for(const n of LOCO)act[n].fadeOut(0.15);act.Death.reset().setEffectiveWeight(1).fadeIn(0.1).play();pivot.visible=false;flash.visible=false;},
    hit(){if(!M.dead){act.HitRecieve.reset().setEffectiveWeight(0.35).play();}},
    // st: {vx,vz (world vel), yaw, pitch, crouch}
    update(dt,st){const hs=Math.hypot(st.vx,st.vz);let target='Idle_Neutral',ts=1;
      if(!M.dead&&hs>0.4){const fx=-Math.sin(st.yaw),fz=-Math.cos(st.yaw);const f=(st.vx*fx+st.vz*fz)/hs,rgt=(st.vx*Math.cos(st.yaw)+st.vz*-Math.sin(st.yaw))/hs;
        if(f>0.6)target=hs<3.2?'Walk':'Run';else if(f<-0.6)target='Run_Back';else target=rgt>0?'Run_Right':'Run_Left';ts=target==='Walk'?hs/1.6:hs/5.2;}
      if(!M.dead){for(const n of LOCO){const cur=M.w[n]??(n==='Idle_Neutral'?1:0);const goal=n===target?1:0;const nw=cur+(goal-cur)*Math.min(1,dt*8);M.w[n]=nw;act[n].setEffectiveWeight(nw);act[n].timeScale=n===target?clamp(ts,0.6,1.6):1;}}
      mixer.update(dt);root.updateMatrixWorld(true);if(M.dead)return;
      const B=bones;// crouch: lower hips, bend knees
      const cr=M.crouch+=(st.crouch?1:0-M.crouch)*Math.min(1,dt*10);
      if(cr>0.01){const hips=B.Hips;hips.position.y-=0.0; body.position.y=-0.42*cr;
        const bend=(b,ang)=>{_q1.setFromAxisAngle(_v1.set(1,0,0),ang*cr);b.quaternion.multiply(_q1);};bend(B.UpperLegL,-1.1);bend(B.UpperLegR,-1.1);bend(B.LowerLegL,1.9);bend(B.LowerLegR,1.9);bend(B.FootL,-0.8);bend(B.FootR,-0.8);root.updateMatrixWorld(true);}
      else body.position.y=0;
      // aim: pitch chest
      const pitch=clamp(st.pitch,-0.9,0.9);_q1.setFromAxisAngle(_v1.set(1,0,0),0);
      // gun pivot follows chest, oriented with aim
      B.Chest.getWorldPosition(_v2);root.worldToLocal(_v2);const u=guns[M.cur].userData;const pistol=M.cur==='pistol';
      if(pistol)pivot.position.set(_v2.x+0.02,_v2.y-0.02,_v2.z-0.34);else pivot.position.set(_v2.x+0.08,_v2.y-0.08,_v2.z-0.07);pivot.rotation.set(pitch,0,0,'YXZ');pivot.updateMatrixWorld(true);
      const gz=pistol?-0.02:-Math.min(0.22,u.len*0.3),fz=pistol?-0.01:-Math.min(0.42,u.len*0.52);
      const grip=pivot.localToWorld(_G1.set(0.0,u.bottom+0.06,gz));
      ik2(B.UpperArmR,B.LowerArmR,B.WristR,grip,_PL.set(1,-1.2,0.6).applyQuaternion(root.quaternion).normalize());
      const fore=pivot.localToWorld(_G2.set(pistol?-0.03:-0.01,pistol?u.bottom+0.05:u.bottom+0.06,fz));
      ik2(B.UpperArmL,B.LowerArmL,B.WristL,fore,_PL.set(-1,-1.2,0).applyQuaternion(root.quaternion).normalize());
      B.Head.rotation.x+=0;}};
  M.setWeapon('rifle');return M;}
