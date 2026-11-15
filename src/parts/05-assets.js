// ================= ASSET LOADING =================
const LOADER={el:null,set(p,t){const b=document.getElementById('loadbar'),l=document.getElementById('loadtxt');if(b)b.style.width=Math.round(p*100)+'%';if(l&&t)l.textContent=t;}};
const nextFrame=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
const GLB_SRC={swat:glbSwat,rifle:glbRifle,smg:glbSmg,sniper:glbSniper,pistol:glbPistol,knife:glbKnife,grenade:glbGrenade,crate:glbCrate,crateDark:glbCrateDark,barrel:glbBarrel,
  contRed:glbContRed,contRed2:glbContRed2,contGreen:glbContGreen,sandbags:glbSandbags,pallet:glbPallet};
const ASSETS={};
{const loader=new GLTFLoader();const keys=Object.keys(GLB_SRC);let i=0;
  for(const k of keys){const u8=GLB_SRC[k];LOADER.set(0.05+0.3*i/keys.length,'正在加载模型… '+k);
    ASSETS[k]=await new Promise((res,rej)=>loader.parse(u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength),'',res,rej));i++;}
  LOADER.set(0.35,'正在生成材质…');await nextFrame();}
// clone a static glTF scene, normalise: forward axis -> +X stays, returns {obj, box}
function gltfStatic(key){const o=ASSETS[key].scene.clone(true);o.updateMatrixWorld(true);return o;}
// bake a static glTF instance into the world batches with a transform (pos, yaw, size fit)
function bakeProp(key,x,y,z,yaw,fit,castShadow){const src=ASSETS[key].scene;src.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(src);const sz=box.getSize(new THREE.Vector3());
  // fit: {x,y,z} target size (any omitted -> uniform from others)
  let s=1;if(fit.uniform)s=fit.uniform/Math.max(sz.x,sz.y,sz.z);else if(fit.y)s=fit.y/sz.y;else if(fit.x)s=fit.x/sz.x;
  const sx=fit.sx?fit.sx/sz.x:s,sy=fit.sy?fit.sy/sz.y:s,sz2=fit.sz?fit.sz/sz.z:s;
  const c=box.getCenter(new THREE.Vector3());const M4=new THREE.Matrix4().makeTranslation(x,y,z).multiply(new THREE.Matrix4().makeRotationY(yaw||0)).multiply(new THREE.Matrix4().makeScale(sx,sy,sz2)).multiply(new THREE.Matrix4().makeTranslation(-c.x,-box.min.y,-c.z));
  src.traverse(m=>{if(!m.isMesh)return;const g=m.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(M4,m.matrixWorld));const mat=propMat(m.material,fit.tint);batch(mat,g,castShadow!==false);});
  return {w:sz.x*sx,h:sz.y*sy,d:sz.z*sz2};}
const _propMats=new Map();
function propMat(m,tint){const key=m.uuid+(tint||'');if(_propMats.has(key))return _propMats.get(key);const n=new THREE.MeshStandardMaterial({color:m.color,roughness:Math.max(0.55,m.roughness??0.8),metalness:Math.min(0.6,m.metalness??0),map:m.map||null,vertexColors:false,flatShading:false});
  if(tint)n.color=new THREE.Color(tint).multiplyScalar(0.9).lerp(n.color,0.25);_propMats.set(key,n);return n;}
