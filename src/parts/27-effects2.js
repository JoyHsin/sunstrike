// ================= EXTRA EFFECTS: shell casings, impact debris, muzzle smoke =================
const SHELLS=(()=>{const N=90;const g=new THREE.CylinderGeometry(0.0048,0.0048,0.04,8);g.rotateX(Math.PI/2);
  const m=new THREE.MeshStandardMaterial({color:0xd0a64e,metalness:0.95,roughness:0.28,envMapIntensity:1.4});
  const im=new THREE.InstancedMesh(g,m,N);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.frustumCulled=false;im.castShadow=false;scene.add(im);
  const L=[];for(let i=0;i<N;i++)L.push({p:new THREE.Vector3(0,-50,0),v:new THREE.Vector3(),q:new THREE.Quaternion(),w:new THREE.Vector3(),t:0,s:1,b:0,rest:false});
  const M4=new THREE.Matrix4(),S=new THREE.Vector3(),Q=new THREE.Quaternion();for(let i=0;i<N;i++){M4.makeTranslation(0,-50,0);im.setMatrixAt(i,M4);}
  return {im,L,i:0,M4,S,Q,dirty:true};})();
const DEBRIS=(()=>{const N=140;const g=new THREE.DodecahedronGeometry(0.018,0);const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.95,metalness:0});
  const im=new THREE.InstancedMesh(g,m,N);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.frustumCulled=false;scene.add(im);
  const L=[];const M4=new THREE.Matrix4();const c=new THREE.Color();for(let i=0;i<N;i++){L.push({p:new THREE.Vector3(0,-50,0),v:new THREE.Vector3(),q:new THREE.Quaternion(),w:new THREE.Vector3(),t:0,s:1,floor:0});M4.makeTranslation(0,-50,0);im.setMatrixAt(i,M4);im.setColorAt(i,c.set(0x999999));}
  return {im,L,i:0,M4};})();
const _ev=new THREE.Vector3(),_eq=new THREE.Quaternion(),_ee=new THREE.Euler();
const SHELL_SIZE={rifle:1.0,smg:0.6,sniper:1.4,pistol:0.55};
// eject a casing from world point p, with "right" and "up" world vectors and an inherited velocity
function fxShell(p,right,up,kind,inherit){const S=SHELLS,o=S.L[S.i++%S.L.length];o.p.copy(p);o.v.copy(right).multiplyScalar(rand(1.6,2.6)).addScaledVector(up,rand(1.4,2.4));if(inherit)o.v.add(inherit);
  o.v.x+=rand(-0.3,0.3);o.v.z+=rand(-0.3,0.3);o.q.setFromEuler(_ee.set(rand(0,TAU),rand(0,TAU),0));o.w.set(rand(-25,25),rand(-25,25),rand(-25,25));o.t=6;o.s=SHELL_SIZE[kind]||1;o.b=0;o.rest=false;}
// impact chips flying out along the surface normal
const DEBRIS_COL=[0x8d8a84,0x6f6c67,0xa89f8e,0x5e5040,0xb5ab98];
function fxDebris(p,n,count){const D=DEBRIS;const c=new THREE.Color();const up=n[1]>0.6;for(let i=0;i<count;i++){const o=D.L[D.i++%D.L.length];o.p.set(p.x+n[0]*0.02,p.y+n[1]*0.02,p.z+n[2]*0.02);
  o.v.set(n[0]*rand(1.5,4)+rand(-1.4,1.4),n[1]*rand(1.5,4)+rand(0.5,2.4),n[2]*rand(1.5,4)+rand(-1.4,1.4));o.w.set(rand(-20,20),rand(-20,20),rand(-20,20));o.t=rand(0.8,1.6);o.s=rand(0.5,1.4);o.floor=up?p.y:0;
  D.im.setColorAt((D.i-1)%D.L.length,c.set(DEBRIS_COL[(Math.random()*DEBRIS_COL.length)|0]));}D.im.instanceColor.needsUpdate=true;}
// lingering muzzle smoke wisps that drift forward then rise
function fxMuzzleSmoke(p,dir,heavy){const n=heavy?3:1+(Math.random()<0.5?1:0);for(let i=0;i<n;i++){const P=FX.smoke[FX.ki++%FX.smoke.length];P.s.position.copy(p).addScaledVector(dir,0.05+i*0.06);
  P.v.copy(dir).multiplyScalar(rand(0.4,1.4)*(heavy?1.6:1));P.v.y+=rand(0.15,0.4);P.v.x+=rand(-0.12,0.12);P.v.z+=rand(-0.12,0.12);P.t0=P.t=rand(1.2,2.4)*(heavy?1.3:1);
  P.size=rand(0.07,0.12)*(heavy?1.5:1);P.grow=rand(2.0,3.4);P.a=heavy?0.24:0.14;P.s.material.color.set(0xd6d3cf);P.s.material.rotation=Math.random()*TAU;P.s.visible=true;}}
// impact dust cloud along normal (bigger, directional)
function fxImpactDust(p,n){for(let i=0;i<2;i++){const P=FX.smoke[FX.ki++%FX.smoke.length];P.s.position.set(p.x+n[0]*0.06,p.y+n[1]*0.06,p.z+n[2]*0.06);
  P.v.set(n[0]*rand(0.6,1.4)+rand(-0.2,0.2),n[1]*rand(0.6,1.4)+rand(0.05,0.3),n[2]*rand(0.6,1.4)+rand(-0.2,0.2));P.t0=P.t=rand(0.9,1.6);P.size=rand(0.12,0.2);P.grow=rand(1.4,2.2);P.a=0.5;
  P.s.material.color.set(0xb9ae98);P.s.material.rotation=Math.random()*TAU;P.s.visible=true;}}
function updateFX2(dt){const S=SHELLS;let any=false;
  for(let i=0;i<S.L.length;i++){const o=S.L[i];if(o.t<=0)continue;o.t-=dt;any=true;
    if(!o.rest){o.v.y-=9.8*dt;o.p.addScaledVector(o.v,dt);_eq.setFromEuler(_ee.set(o.w.x*dt,o.w.y*dt,o.w.z*dt));o.q.multiply(_eq);
      if(o.p.y<0.006){o.p.y=0.006;if(o.v.y<0){if(o.b<3&&o.p.distanceToSquared(camera.position)<400&&-o.v.y>0.6)Snd.tink(o.p);o.b++;o.v.y*=-0.35;o.v.x*=0.55;o.v.z*=0.55;o.w.multiplyScalar(0.5);
        if(Math.abs(o.v.y)<0.3){o.rest=true;// lie flat on the floor
          _ev.set(0,0,1).applyQuaternion(o.q);const yaw=Math.atan2(_ev.x,_ev.z);o.q.setFromEuler(_ee.set(0,yaw,0));}}}}
    const k=o.t<0.5?o.t/0.5:1;S.M4.compose(o.p,o.q,_ev.setScalar(o.s*k));S.im.setMatrixAt(i,S.M4);
    if(o.t<=0){S.M4.makeTranslation(0,-50,0);S.im.setMatrixAt(i,S.M4);}}
  if(any||S.dirty){S.im.instanceMatrix.needsUpdate=true;S.dirty=any;}
  const D=DEBRIS;let anyD=false;
  for(let i=0;i<D.L.length;i++){const o=D.L[i];if(o.t<=0)continue;o.t-=dt;anyD=true;o.v.y-=12*dt;o.p.addScaledVector(o.v,dt);
    if(o.p.y<o.floor+0.01){o.p.y=o.floor+0.01;if(o.v.y<0){o.v.y*=-0.3;o.v.x*=0.5;o.v.z*=0.5;o.w.multiplyScalar(0.4);}}
    _eq.setFromEuler(_ee.set(o.w.x*dt,o.w.y*dt,o.w.z*dt));o.q.multiply(_eq);const k=o.t<0.3?o.t/0.3:1;D.M4.compose(o.p,o.q,_ev.setScalar(o.s*k));D.im.setMatrixAt(i,D.M4);
    if(o.t<=0){D.M4.makeTranslation(0,-50,0);D.im.setMatrixAt(i,D.M4);}}
  if(anyD||D.dirty){D.im.instanceMatrix.needsUpdate=true;D.dirty=anyD;}}
function clearFX2(){for(const o of SHELLS.L){o.t=0.0001;o.rest=true;}for(const o of DEBRIS.L)o.t=0.0001;}
