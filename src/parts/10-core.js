'use strict';
const $=id=>document.getElementById(id);
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const TAU=Math.PI*2;
function angDiff(a,b){let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;}
let _seed=1337;const srand=()=>{_seed=(_seed*16807)%2147483647;return (_seed-1)/2147483646;};

// ================= MAP =================
const CELL=2.2, WALL_H=4.4, STEP=0.56, GRAV=20, JUMP_V=7.0;
const MAP=[
"####################################",
"#AAAAAAAAA#.....KKKKKK.....#BBBBBBB#",
"#AxAAAAAAA#.....KKKKKK.....#BBBBXBB#",
"#AXAAAhhsA......KKKKKK......BBxBBBB#",
"#AAAAAhhsA..................BBBBBBB#",
"#AAAAAAAAA######....######BBBBBBBBB#",
"#AAAAwAAAA######....######BBwBBBBBB#",
"#AAAAAAAAA######....######BBBBBBBBB#",
"##...##..#######....######..#...####",
"##...##..#########..######..#...####",
"##...##.....x.........X.....#...####",
"##...##.....................#...####",
"##...###########....#########...####",
"##...###########.ww.#########...####",
"##.x.###########....#########.X.####",
"##...###########..###########...####",
"##...###########....#########...####",
"##...###########......shhs......####",
"##...###########......shhs......####",
"##...###########....#########...####",
"##...###########....#########...####",
"##......X..................x......##",
"##................................##",
"#####.......TTTTTTTTTT.......#######",
"#####.......TTTTTTTTTT.......#######",
"#####.......TTTTTTTTTT.......#######",
"####################################"];
const MH=MAP.length, MW=MAP[0].length;
const cellX=c=>(c-MW/2+0.5)*CELL, cellZ=r=>(r-MH/2+0.5)*CELL;
const toCol=x=>Math.floor(x/CELL+MW/2), toRow=z=>Math.floor(z/CELL+MH/2);
const ch=(c,r)=>(r<0||r>=MH||c<0||c>=MW)?'#':MAP[r][c];
const WALKH={'.':0,'A':0,'B':0,'K':0,'T':0,'s':0.5,'h':1.0};
const walkable=(c,r)=>WALKH[ch(c,r)]!==undefined;
const isWall=(c,r)=>ch(c,r)==='#';

// ================= RENDERER =================
const canvas=$('game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',stencil:false});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.95;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.autoClear=false;
const MAXANISO=renderer.capabilities.getMaxAnisotropy();
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,0.05,600);
camera.rotation.order='YXZ';scene.add(camera);
const vmScene=new THREE.Scene();
const vmCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.01,10);

// ---- sky + environment
const SUN_EL=38,SUN_AZ=215;
const sunDir=new THREE.Vector3().setFromSphericalCoords(1,THREE.MathUtils.degToRad(90-SUN_EL),THREE.MathUtils.degToRad(SUN_AZ));
const sky=new Sky();sky.scale.setScalar(4000);
{const u=sky.material.uniforms;u.turbidity.value=4.5;u.rayleigh.value=1.4;u.mieCoefficient.value=0.004;u.mieDirectionalG.value=0.82;u.sunPosition.value.copy(sunDir);}
scene.add(sky);
{const pm=new THREE.PMREMGenerator(renderer);const envScene=new THREE.Scene();const s2=new Sky();s2.scale.setScalar(1000);s2.material.uniforms.sunPosition.value.copy(sunDir);
  ['turbidity','rayleigh','mieCoefficient','mieDirectionalG'].forEach(k=>s2.material.uniforms[k].value=sky.material.uniforms[k].value);envScene.add(s2);
  const g=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshBasicMaterial({color:0x6b5d4c}));g.rotation.x=-Math.PI/2;g.position.y=-5;envScene.add(g);
  const rt=pm.fromScene(envScene,0.02);scene.environment=rt.texture;vmScene.environment=rt.texture;pm.dispose();}
scene.environmentIntensity=0.55;vmScene.environmentIntensity=0.8;
scene.fog=new THREE.Fog(0xc4cfd8,70,260);
const hemi=new THREE.HemisphereLight(0xcfe0ff,0x7a6248,0.35);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0dc,3.4);
sun.position.copy(sunDir).multiplyScalar(90);sun.target.position.set(0,0,0);
sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
{const sc=sun.shadow.camera;sc.left=-50;sc.right=50;sc.top=44;sc.bottom=-44;sc.near=20;sc.far=200;}
sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.025;sun.shadow.radius=3;
scene.add(sun);scene.add(sun.target);
const flashLight=new THREE.PointLight(0xffb860,0,10,2);scene.add(flashLight);
vmScene.add(new THREE.HemisphereLight(0xe8f0ff,0x6a5540,0.6));
const vmSun=new THREE.DirectionalLight(0xfff2e0,2.2);vmSun.position.set(0.6,1.2,0.4);vmScene.add(vmSun);
const vmFill=new THREE.DirectionalLight(0xb0c8ff,0.6);vmFill.position.set(-1,0.2,-0.5);vmScene.add(vmFill);
const vmFlash=new THREE.PointLight(0xffb860,0,2,2);vmFlash.position.set(0.1,0,-0.6);vmScene.add(vmFlash);

// ================= PROCEDURAL TEXTURES =================
function valueNoiseTile(N,freq,seed){_seed=seed;const g=new Float32Array(freq*freq);for(let i=0;i<g.length;i++)g[i]=srand();const out=new Float32Array(N*N);
  for(let y=0;y<N;y++){const fy=y/N*freq,iy=Math.floor(fy),ty=fy-iy,sy=ty*ty*(3-2*ty);const y0=iy%freq,y1=(iy+1)%freq;
    for(let x=0;x<N;x++){const fx=x/N*freq,ix=Math.floor(fx),tx=fx-ix,sx=tx*tx*(3-2*tx);const x0=ix%freq,x1=(ix+1)%freq;
      const a=g[y0*freq+x0],b=g[y0*freq+x1],c=g[y1*freq+x0],d=g[y1*freq+x1];out[y*N+x]=(a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy;}}return out;}
function fbm(N,oct,f0,seed,gain){gain=gain||0.5;const out=new Float32Array(N*N);let amp=1,tot=0,f=f0;for(let o=0;o<oct;o++){const n=valueNoiseTile(N,f,seed+o*101);for(let i=0;i<out.length;i++)out[i]+=n[i]*amp;tot+=amp;amp*=gain;f*=2;}
  for(let i=0;i<out.length;i++)out[i]/=tot;return out;}
function sampler(field,N){return (x,y)=>{x=((x%1)+1)%1*N;y=((y%1)+1)%1*N;const x0=Math.floor(x),y0=Math.floor(y),tx=x-x0,ty=y-y0,x1=(x0+1)%N,y1=(y0+1)%N;
  const a=field[y0*N+x0],b=field[y0*N+x1],c=field[y1*N+x0],d=field[y1*N+x1];return a+(b-a)*tx+((c+(d-c)*tx)-(a+(b-a)*tx))*ty;};}
function texFromRGBA(S,data,srgb){const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');const id=new ImageData(data,S,S);g.putImageData(id,0,0);
  const t=new THREE.CanvasTexture(c);t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=MAXANISO;
  t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;return t;}
// build PBR texture set from per-pixel callback: fn(x,y,u,v,out) sets out.r,g,b (0..1), out.h (height 0..1), out.ro (roughness)
function makeSurface(S,fn,nStrength){const alb=new Uint8ClampedArray(S*S*4),rough=new Uint8ClampedArray(S*S*4),H=new Float32Array(S*S);const o={r:0,g:0,b:0,h:0,ro:0.8};
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){fn(x,y,x/S,y/S,o);const i=y*S+x,k=i*4;alb[k]=o.r*255;alb[k+1]=o.g*255;alb[k+2]=o.b*255;alb[k+3]=255;const r=o.ro*255;rough[k]=r;rough[k+1]=r;rough[k+2]=r;rough[k+3]=255;H[i]=o.h;}
  const nor=new Uint8ClampedArray(S*S*4);const st=nStrength||2;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const xl=(x-1+S)%S,xr=(x+1)%S,yu=(y-1+S)%S,yd=(y+1)%S;
    const dx=(H[y*S+xr]-H[y*S+xl])*st,dy=(H[yd*S+x]-H[yu*S+x])*st;const l=Math.hypot(dx,dy,1);const k=(y*S+x)*4;
    nor[k]=(-dx/l*0.5+0.5)*255;nor[k+1]=(dy/l*0.5+0.5)*255;nor[k+2]=(1/l*0.5+0.5)*255;nor[k+3]=255;}
  return {map:texFromRGBA(S,alb,true),normalMap:texFromRGBA(S,nor,false),roughnessMap:texFromRGBA(S,rough,false)};}
function drawCracks(S,count,seed){_seed=seed;const m=new Float32Array(S*S);for(let c=0;c<count;c++){let x=srand()*S,y=srand()*S,a=srand()*TAU;const len=60+srand()*260;
  for(let i=0;i<len;i++){a+=(srand()-0.5)*0.5;x+=Math.cos(a);y+=Math.sin(a);const ix=((Math.floor(x)%S)+S)%S,iy=((Math.floor(y)%S)+S)%S;m[iy*S+ix]=1;m[iy*S+(ix+1)%S]=Math.max(m[iy*S+(ix+1)%S],0.4);}}return m;}
const mix=(a,b,t)=>a+(b-a)*t;
const T0=performance.now();
// --- concrete floor (tile = 4 m)
const SURF={};
SURF.concrete=(()=>{const S=1024,N=256;const big=sampler(fbm(N,5,4,11),N),mid=sampler(fbm(N,4,16,23),N),stain=sampler(fbm(N,4,3,37,0.6),N);const cr=drawCracks(S,10,5);
  return makeSurface(S,(x,y,u,v,o)=>{const b=big(u,v),m=mid(u,v),s=stain(u,v),gr=Math.random();const jx=Math.min(x%512,512-x%512),jy=Math.min(y%512,512-y%512);const joint=Math.min(jx,jy)<3?1:0;
    let l=0.62+b*0.18+m*0.08+(gr-0.5)*0.06-(s>0.62?(s-0.62)*0.6:0)-joint*0.25-cr[y*S+x]*0.18;o.r=l*1.02;o.g=l*0.98;o.b=l*0.92;o.h=m*0.5+gr*0.12-joint*0.6-cr[y*S+x]*0.4;o.ro=clamp(0.82+b*0.12-(s>0.62?0.15:0),0,1);},3);})();
// --- site tiles (8x8 tiles per 4 m)
SURF.tiles=(()=>{const S=1024,N=256,T=128;const n=sampler(fbm(N,5,8,51),N),wear=sampler(fbm(N,4,4,63),N);_seed=77;const tint=[];for(let i=0;i<64;i++)tint.push(srand());
  return makeSurface(S,(x,y,u,v,o)=>{const tx=x%T,ty=y%T,id=((y/T)|0)*8+((x/T)|0);const e=Math.min(tx,ty,T-1-tx,T-1-ty);const grout=e<4;const bev=clamp((e-4)/10,0,1);const t=tint[id],nn=n(u,v),w=wear(u,v),gr=Math.random();
    if(grout){const l=0.42+nn*0.1;o.r=l;o.g=l*0.97;o.b=l*0.9;o.h=0;o.ro=0.95;}
    else{const l=0.55+t*0.2+nn*0.12+(gr-0.5)*0.04-(w>0.6?(w-0.6)*0.5:0);o.r=l*1.12;o.g=l*0.86;o.b=l*0.64;o.h=0.6*bev+nn*0.12+gr*0.04;o.ro=0.5+nn*0.25+(w>0.6?0.2:0);}},3);})();
// --- plaster wall (one tile = 4.4 m incl. full height, bottom grime)
SURF.plaster=(()=>{const S=1024,N=256;const big=sampler(fbm(N,5,4,91),N),mid=sampler(fbm(N,5,24,93),N),patch=sampler(fbm(N,4,5,97,0.55),N);const cr=drawCracks(S,7,13);_seed=19;const streak=[];for(let i=0;i<S;i++)streak.push(srand());
  return makeSurface(S,(x,y,u,v,o)=>{const b=big(u,v),m=mid(u,v),p=patch(u,v),gr=Math.random();const vy=1-v;// vy: 0 bottom..1 top
    const exposed=p>0.75;// patches of brick under plaster
    let l,h,ro;if(exposed){const by=Math.floor(y/18),bx=Math.floor((x+(by%2)*26)/52);const mort=(y%18<2)||((x+(by%2)*26)%52<2);l=mort?0.5:0.48+((bx*31+by*17)%7)/40;o.r=l*1.12;o.g=l*0.86;o.b=l*0.74;h=mort?0.1:0.35;ro=0.9;}
    else{l=0.86+b*0.1+m*0.05+(gr-0.5)*0.04;h=0.55+m*0.35+gr*0.06;ro=0.88;o.r=l;o.g=l*0.97;o.b=l*0.92;}
    const edge=exposed?0:clamp((0.75-p)*25,0,1);if(!exposed&&edge<1){o.r*=0.9+0.1*edge;o.g*=0.9+0.1*edge;o.b*=0.9+0.1*edge;}if(!exposed&&edge<1){h+=0.25*(1-edge);}
    const grime=clamp(1-vy/0.16,0,1)*0.35+clamp(1-vy/0.04,0,1)*0.2;const st=streak[x]>0.93?clamp((vy-0.55)*1.4,0,1)*0.12*(0.5+b):0;
    const dk=1-grime-st-cr[y*S+x]*0.2;o.r*=dk;o.g*=dk;o.b*=dk;o.h=h-cr[y*S+x]*0.3;o.ro=ro;},2.5);})();
// --- brick wall
SURF.brick=(()=>{const S=1024,N=256,BH=20,BW=58;const n=sampler(fbm(N,5,12,131),N),big=sampler(fbm(N,4,3,137),N);_seed=31;const bt=[];for(let i=0;i<4096;i++)bt.push(srand());
  return makeSurface(S,(x,y,u,v,o)=>{const row=Math.floor(y/BH),off=(row%2)*BW/2,col=Math.floor((x+off)/BW);const lx=(x+off)%BW,ly=y%BH;const e=Math.min(lx,ly,BW-1-lx,BH-1-ly);const mort=e<2.5;const id=(row*41+col*7)%4096;const t=bt[id],nn=n(u,v),gr=Math.random();const vy=1-v;
    if(mort){const l=0.55+nn*0.1;o.r=l;o.g=l*0.95;o.b=l*0.88;o.h=0.05;o.ro=0.95;}
    else{const l=0.42+t*0.18+nn*0.12+(gr-0.5)*0.05;o.r=l*1.35;o.g=l*(0.62+t*0.12);o.b=l*0.48;o.h=0.45+clamp((e-2.5)/4,0,1)*0.3+nn*0.25;o.ro=0.8+nn*0.15;}
    const grime=clamp(1-vy/0.15,0,1)*0.35+big(u,v)*0.12;o.r*=1-grime;o.g*=1-grime;o.b*=1-grime;},3);})();
// --- wooden crate panel (mapped once per face)
SURF.crate=(()=>{const S=512,N=128;const grain=sampler(fbm(N,4,6,171),N),n=sampler(fbm(N,4,8,173),N);
  return makeSurface(S,(x,y,u,v,o)=>{const fr=0.11;const inFrame=u<fr||u>1-fr||v<fr||v>1-fr;const d1=Math.abs(u-v),d2=Math.abs(u-(1-v));const brace=!inFrame&&(Math.min(d1,d2)<0.075);
    const plank=Math.floor(v*6),pv=(v*6)%1;const gap=!inFrame&&!brace&&(pv<0.025);const gu=brace?(d1<d2?(u+v):(u-v)):(inFrame&&(u<fr||u>1-fr)?v:u);
    const gg=grain(gu*0.6+plank*0.13,(inFrame&&(u<fr||u>1-fr)?u:v)*8+plank);const gr=Math.random();
    let l=0.5+gg*0.25+n(u,v)*0.1+(gr-0.5)*0.05+(plank%2)*0.04;let h=0.5+gg*0.15;if(inFrame||brace){h=0.85+gg*0.1;l*=0.92;}
    const fe=Math.min(Math.abs(u-fr),Math.abs(u-1+fr),Math.abs(v-fr),Math.abs(v-1+fr));if(fe<0.006)h-=0.3;if(gap){h=0.1;l*=0.4;}
    const nail=[[0.055,0.055],[0.945,0.055],[0.055,0.945],[0.945,0.945]].some(p=>Math.hypot(u-p[0],v-p[1])<0.012);if(nail){l=0.25;h=0.95;}
    o.r=l*1.15;o.g=l*0.82;o.b=l*0.5;o.h=h;o.ro=nail?0.4:0.72;},4);})();
// --- corrugated container panel
const metalSurf=(paint,seed)=>{const S=512,N=128;const rust=sampler(fbm(N,5,6,seed),N),n=sampler(fbm(N,4,16,seed+2),N);_seed=seed;const drip=[];for(let i=0;i<S;i++)drip.push(srand());
  return makeSurface(S,(x,y,u,v,o)=>{const fr=0.06;const frame=u<fr||u>1-fr||v<fr||v>1-fr;const rib=Math.sin(u*TAU*14);const r=rust(u,v),nn=n(u,v);const vy=1-v;
    const rusty=r>0.62||(drip[x]>0.9&&vy<0.5+drip[(x*7)%S]*0.4&&r>0.45);let l=0.78+nn*0.08;let h=frame?0.9:0.5+(rib>0?Math.sqrt(rib):-Math.sqrt(-rib))*0.35;
    if(rusty){const t=clamp((r-0.45)*3,0,1);o.r=0.42+t*0.12;o.g=0.25+t*0.04;o.b=0.15;o.ro=0.92;h+=nn*0.1;}else{const f=l*(0.9+nn*0.2);o.r=paint[0]*f;o.g=paint[1]*f;o.b=paint[2]*f;o.ro=0.42+nn*0.15;}
    if(frame){o.r*=0.85;o.g*=0.85;o.b*=0.85;}o.h=h;},3);};
console.log&&void 0;
SURF.contBlue=metalSurf([0.3,0.5,0.66],191);SURF.contRed=metalSurf([0.66,0.3,0.22],291);SURF.contGreen=metalSurf([0.4,0.52,0.34],391);
const TEXGEN_MS=performance.now()-T0;

const STD=(o)=>new THREE.MeshStandardMaterial(o);
const M={
  floor:STD({...SURF.concrete,color:0xd8cfc0,roughness:1}),
  site:STD({...SURF.tiles,color:0xffffff,roughness:1}),
  wallSand:STD({...SURF.plaster,color:0xe3c79a,roughness:1}),
  wallWhite:STD({...SURF.plaster,color:0xe2dccf,roughness:1}),
  wallSage:STD({...SURF.plaster,color:0xc9d6c0,roughness:1}),
  wallBrick:STD({...SURF.brick,color:0xffffff,roughness:1}),
  cap:STD({...SURF.concrete,color:0xb9b4ab,roughness:1}),
  base:STD({...SURF.concrete,color:0x8d877d,roughness:1}),
  plat:STD({...SURF.concrete,color:0xa9a49c,roughness:1}),
  crate:STD({...SURF.crate,color:0xffffff,roughness:1}),
  contBlue:STD({...SURF.contBlue,color:0xffffff,metalness:0.35,roughness:1}),
  contRed:STD({...SURF.contRed,color:0xffffff,metalness:0.35,roughness:1}),
  contGreen:STD({...SURF.contGreen,color:0xffffff,metalness:0.35,roughness:1}),
  steel:STD({color:0x6d7277,metalness:0.85,roughness:0.38}),
  darkSteel:STD({color:0x2e3236,metalness:0.8,roughness:0.45}),
  wood:STD({color:0x6e4a2c,roughness:0.7}),
  glass:STD({color:0x1c2a33,metalness:0.9,roughness:0.08}),
  frame:STD({color:0x4a3f35,roughness:0.6,metalness:0.1}),
  sandbag:STD({...SURF.concrete,color:0xb59d74,roughness:1}),
  lamp:STD({color:0x222222,emissive:0xffd9a0,emissiveIntensity:6,roughness:0.4}),
  far:STD({...SURF.plaster,color:0xd9c9ad,roughness:1}),
  farDark:STD({...SURF.plaster,color:0xa8a090,roughness:1}),
};

// ================= GEOMETRY HELPERS =================
// world-space UV: projects by dominant normal axis. sx,sy,sz = tile size per axis; ox,oy,oz = origin
function worldUV(g,sx,sy,sz,ox,oy,oz){ox=ox||0;oy=oy||0;oz=oz||0;const p=g.attributes.position,n=g.attributes.normal;const uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){const x=p.getX(i)-ox,y=p.getY(i)-oy,z=p.getZ(i)-oz,ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let u,v;
    if(ay>=ax&&ay>=az){u=x/sx;v=-z/sz;}else if(ax>=az){u=(n.getX(i)>0?-z:z)/sz;v=y/sy;}else{u=(n.getZ(i)>0?x:-x)/sx;v=y/sy;}uv[i*2]=u;uv[i*2+1]=v;}
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;}
const BATCH=new Map();// material -> [geometries]
function batch(mat,g,shadow){if(g.index)g=g.toNonIndexed();for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);
  const key=mat.uuid+(shadow===false?'n':'s');if(!BATCH.has(key))BATCH.set(key,{mat,list:[],shadow:shadow!==false});BATCH.get(key).list.push(g);}
function flushBatches(){for(const {mat,list,shadow} of BATCH.values()){const g=mergeGeometries(list,false);const m=new THREE.Mesh(g,mat);m.castShadow=shadow;m.receiveShadow=true;m.matrixAutoUpdate=false;scene.add(m);}BATCH.clear();}
function rbox(x0,y0,z0,x1,y1,z1,r,seg){const w=x1-x0,h=y1-y0,d=z1-z0;r=Math.min(r,w/2-0.001,h/2-0.001,d/2-0.001);const g=r>0.004?new RoundedBoxGeometry(w,h,d,seg||2,r):new THREE.BoxGeometry(w,h,d);g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);return g;}
function cyl(r1,r2,h,seg,x,y,z,axis){const g=new THREE.CylinderGeometry(r1,r2,h,seg||16);if(axis==='x')g.rotateZ(Math.PI/2);if(axis==='z')g.rotateX(Math.PI/2);g.translate(x,y,z);return g;}

// ================= BUILD WORLD =================
const boxes=[];
function colBox(x0,y0,z0,x1,y1,z1){const b={x0,y0,z0,x1,y1,z1};boxes.push(b);return b;}
function wallMat(c,r){if(r>=20)return M.wallBrick;if(c<=10&&r<=11)return M.wallSand;if(c>=25&&r<=11)return M.wallSage;return M.wallWhite;}
// ground
{const g=new THREE.PlaneGeometry(400,400,1,1);g.rotateX(-Math.PI/2);worldUV(g,4,4,4);batch(M.floor,g,false);}
// site tiles
for(let r=0;r<MH;r++)for(let c=0;c<MW;c++)if(ch(c,r)==='A'||ch(c,r)==='B'){const g=new THREE.PlaneGeometry(CELL,CELL);g.rotateX(-Math.PI/2);g.translate(cellX(c),0.006,cellZ(r));worldUV(g,4,4,4);batch(M.site,g,false);}
// walls: row runs
const wallRuns=[];
for(let r=0;r<MH;r++){let c=0;while(c<MW){if(MAP[r][c]==='#'){let c2=c;const mat=wallMat(c,r);while(c2+1<MW&&MAP[r][c2+1]==='#'&&wallMat(c2+1,r)===mat)c2++;
  const x0=cellX(c)-CELL/2,x1=cellX(c2)+CELL/2,z0=cellZ(r)-CELL/2,z1=cellZ(r)+CELL/2;colBox(x0,0,z0,x1,WALL_H,z1);wallRuns.push({c0:c,c1:c2,r,x0,x1,z0,z1,mat});
  const g=rbox(x0,0,z0,x1,WALL_H,z1,0.05,2);worldUV(g,4.4,4.4,4.4);batch(mat,g);
  const cap=rbox(x0-0.07,WALL_H,z0-0.07,x1+0.07,WALL_H+0.16,z1+0.07,0.04,2);worldUV(cap,4,4,4);batch(M.cap,cap);
  const bs=rbox(x0-0.03,0,z0-0.03,x1+0.03,0.26,z1+0.03,0.02,1);worldUV(bs,4,4,4);batch(M.base,bs);
  c=c2+1;}else c++;}}
// lintels over narrow doorways (horizontal & vertical passages)
function lintel(x0,z0,x1,z1){colBox(x0,3.25,z0,x1,WALL_H,z1);const g=rbox(x0,3.25,z0,x1,WALL_H,z1,0.05,2);worldUV(g,4.4,4.4,4.4,0,0,0);batch(M.wallWhite,g);
  const f=rbox(x0-0.02,3.1,z0-0.06,x1+0.02,3.27,z1+0.06,0.03,1);worldUV(f,2,2,2);batch(M.frame,f);}
for(let r=1;r<MH-1;r++){let c=1;while(c<MW-1){if(walkable(c,r)&&isWall(c-1,r)){let c2=c;while(walkable(c2+1,r)&&c2-c<3)c2++;
  if(isWall(c2+1,r)&&c2-c<2&&walkable(c,r-1)&&walkable(c,r+1)&&!(isWall(c-1,r-1)&&isWall(c-1,r+1))){const x0=cellX(c)-CELL/2,x1=cellX(c2)+CELL/2;const z=cellZ(r);lintel(x0,z-0.35,x1,z+0.35);
    for(const xx of [x0+0.08,x1-0.08]){const p=rbox(xx-0.08,0,z-0.42,xx+0.08,3.25,z+0.42,0.03,1);worldUV(p,2,2,2);batch(M.frame,p);}}c=c2+1;}else c++;}}
for(let c=1;c<MW-1;c++){let r=1;while(r<MH-1){if(walkable(c,r)&&isWall(c,r-1)){let r2=r;while(walkable(c,r2+1)&&r2-r<3)r2++;
  if(isWall(c,r2+1)&&r2-r<2&&walkable(c-1,r)&&walkable(c+1,r)&&!(isWall(c-1,r-1)&&isWall(c+1,r-1))){const z0=cellZ(r)-CELL/2,z1=cellZ(r2)+CELL/2;const x=cellX(c);lintel(x-0.35,z0,x+0.35,z1);
    for(const zz of [z0+0.08,z1-0.08]){const p=rbox(x-0.42,0,zz-0.08,x+0.42,3.25,zz+0.08,0.03,1);worldUV(p,2,2,2);batch(M.frame,p);}}r=r2+1;}else r++;}}
// wall-face decoration: windows, lamps, pipes
_seed=4242;
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){if(!isWall(c,r))continue;for(const [dx,dz] of DIRS){if(!walkable(c+dx,r+dz))continue;const along=dz!==0?[1,0]:[0,1];
  // only centre of 3-long straight wall segment
  if(!isWall(c+along[0],r+along[1])||!isWall(c-along[0],r-along[1]))continue;const R=srand();const fx=cellX(c)+dx*CELL/2,fz=cellZ(r)+dz*CELL/2;
  const P=(a,y,o,w,h,t)=>{// a: along offset, o: outward offset
    const cx=fx+along[0]*a+dx*o,cz=fz+along[1]*a+dz*o;const hw=along[0]?w/2:t/2,hd=along[1]?w/2:t/2;return [cx-hw,y-h/2,cz-hd,cx+hw,y+h/2,cz+hd];};
  if(R<0.16){const f=P(0,2.55,0.03,1.3,1.5,0.1);let g=rbox(...f,0.03,1);worldUV(g,2,2,2);batch(M.frame,g);g=rbox(...P(0,2.55,0.06,1.12,1.32,0.04),0.01,1);worldUV(g,2,2,2);batch(M.glass,g);
    g=rbox(...P(0,2.55,0.085,0.05,1.32,0.03),0.01,1);worldUV(g,2,2,2);batch(M.frame,g);g=rbox(...P(0,2.7,0.085,1.12,0.05,0.03),0.01,1);worldUV(g,2,2,2);batch(M.frame,g);
    g=rbox(...P(0,1.76,0.08,1.45,0.08,0.18),0.02,1);worldUV(g,2,2,2);batch(M.cap,g);}
  else if(R<0.24){let g=rbox(...P(0,3.35,0.06,0.28,0.14,0.12),0.03,2);worldUV(g,1,1,1);batch(M.darkSteel,g);g=rbox(...P(0,3.27,0.08,0.22,0.05,0.1),0.02,1);worldUV(g,1,1,1);batch(M.lamp,g,false);}
  else if(R<0.3){const g=cyl(0.06,0.06,WALL_H-0.2,12,fx+dx*0.1,(WALL_H-0.2)/2,fz+dz*0.1);worldUV(g,1,1,1);batch(M.steel,g);for(const y of [0.8,2.2,3.6]){const b=rbox(...P(0,y,0.06,0.16,0.06,0.12),0.01,1);worldUV(b,1,1,1);batch(M.darkSteel,b);}}}}
// long horizontal pipes on some long wall runs
for(const w of wallRuns){if(w.c1-w.c0<4)continue;for(const dz of [1,-1]){let ok=0;for(let c=w.c0;c<=w.c1;c++)if(walkable(c,w.r+dz))ok++;if(ok<4||srand()>0.45)continue;
  const z=dz>0?w.z1+0.13:w.z0-0.13;const len=w.x1-w.x0-0.4;const g=cyl(0.075,0.075,len,14,(w.x0+w.x1)/2,3.75,z,'x');worldUV(g,1,1,1);batch(M.steel,g);
  for(let x=w.x0+0.6;x<w.x1-0.3;x+=2.2){const b=rbox(x-0.04,3.65,Math.min(z,z-dz*0.13)-0.0,x+0.04,3.85,Math.max(z,z-dz*0.13),0.01,1);worldUV(b,1,1,1);batch(M.darkSteel,b);}}}
// props
const AO=[];// footprints for contact-shadow strips
for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){const k=MAP[r][c],x=cellX(c),z=cellZ(r);
  if(k==='x'){const s=0.95;colBox(x-s,0,z-s,x+s,1.1,z+s);const g=rbox(x-s,0,z-s,x+s,1.1,z+s,0.04,2);worldUV(g,2*s,1.1,2*s,x-s,0,z-s);batch(M.crate,g);AO.push([x-s,z-s,x+s,z+s]);
    if(srand()<0.6){const t=0.45;const ox=x+rand(-0.3,0.3),oz=z+rand(-0.3,0.3);colBox(ox-t,1.1,oz-t,ox+t,1.7,oz+t);const g2=rbox(ox-t,1.1,oz-t,ox+t,1.7,oz+t,0.03,2);worldUV(g2,2*t,0.6,2*t,ox-t,1.1,oz-t);batch(M.crate,g2);}}
  else if(k==='X'){const mat=[M.contBlue,M.contRed,M.contGreen][(c+r)%3];colBox(x-1.0,0,z-1.0,x+1.0,2.3,z+1.0);const g=rbox(x-1.0,0,z-1.0,x+1.0,2.3,z+1.0,0.06,3);worldUV(g,2,2.3,2,x-1,0,z-1);batch(mat,g);AO.push([x-1,z-1,x+1,z+1]);
    const bar=cyl(0.02,0.02,2.0,8,x+1.03,1.15,z-0.6,'z');}
  else if(k==='w'){colBox(x-CELL/2,0,z-0.3,x+CELL/2,1.15,z+0.3);AO.push([x-CELL/2,z-0.3,x+CELL/2,z+0.3]);
    // sandbag wall: rows of rounded bags
    for(let row=0;row<4;row++){const n=4,off=(row%2)*0.27;for(let i=0;i<n+(row%2?0:1)-1+1;i++){const bx=x-CELL/2+0.28+i*0.55+off-0.14;if(bx>x+CELL/2-0.2)continue;
      const g=new THREE.CapsuleGeometry(0.14,0.3,4,10);g.rotateZ(Math.PI/2);g.scale(1,0.85,1.9);g.translate(bx,0.14+row*0.27,z+rand(-0.02,0.02));worldUV(g,1,1,1);batch(M.sandbag,g);}}}
  else if(k==='h'||k==='s'){const hh=k==='h'?1.0:0.5;colBox(x-CELL/2,0,z-CELL/2,x+CELL/2,hh,z+CELL/2);const g=rbox(x-CELL/2,0,z-CELL/2,x+CELL/2,hh,z+CELL/2,0.03,1);worldUV(g,4,4,4);batch(M.plat,g);
    const e=rbox(x-CELL/2-0.01,hh-0.05,z-CELL/2-0.01,x+CELL/2+0.01,hh,z+CELL/2+0.01,0.01,1);worldUV(e,1,1,1);batch(k==='s'?M.steel:M.cap,e);}}
// barrels
{const prof=[];for(let i=0;i<=20;i++){const y=i/20;const rib=(Math.abs(y-0.33)<0.02||Math.abs(y-0.66)<0.02)?0.012:0;prof.push(new THREE.Vector2(0.33+rib-(y<0.02||y>0.98?0.015:0),y*1.0));}
 prof.unshift(new THREE.Vector2(0,0));prof.push(new THREE.Vector2(0,1.0));
 const mats=[STD({color:0x8e3b2a,metalness:0.5,roughness:0.5}),STD({color:0x2f5b7c,metalness:0.5,roughness:0.5}),STD({color:0x5f6b3a,metalness:0.5,roughness:0.55})];
 [[12,24],[27,24],[13,1],[26,4],[20,22],[5,22],[23,21],[9,10],[33,14]].forEach(([c,r],i)=>{if(!walkable(c,r))return;const x=cellX(c)+0.45,z=cellZ(r)+0.45;const g=new THREE.LatheGeometry(prof,20);g.translate(x,0,z);worldUV(g,1,1,1);batch(mats[i%3],g);colBox(x-0.33,0,z-0.33,x+0.33,1.0,z+0.33);AO.push([x-0.33,z-0.33,x+0.33,z+0.33]);});}
// distant skyline outside the walls
{_seed=99;const ext=[MW*CELL/2,MH*CELL/2];for(let i=0;i<46;i++){const side=i%4;const t=srand();let x,z;const d=rand(5,26);
  if(side===0){x=mix(-ext[0]-20,ext[0]+20,t);z=-ext[1]-d;}else if(side===1){x=mix(-ext[0]-20,ext[0]+20,t);z=ext[1]+d;}else if(side===2){x=-ext[0]-d;z=mix(-ext[1],ext[1],t);}else{x=ext[0]+d;z=mix(-ext[1],ext[1],t);}
  const w=rand(6,14),dd=rand(6,14),h=rand(7,19);const g=rbox(x-w/2,0,z-dd/2,x+w/2,h,z+dd/2,0.1,1);worldUV(g,4.4,4.4,4.4);batch(srand()<0.5?M.far:M.farDark,g,false);
  const cp=rbox(x-w/2-0.15,h,z-dd/2-0.15,x+w/2+0.15,h+0.3,z+dd/2+0.15,0.05,1);worldUV(cp,4,4,4);batch(M.cap,cp,false);
  if(srand()<0.3){const tk=cyl(0.9,0.9,1.6,14,x+rand(-2,2),h+1.1,z+rand(-2,2));worldUV(tk,2,2,2);batch(M.steel,tk,false);}}}
// contact shadows (fake AO strips) around walls & props
{const c=document.createElement('canvas');c.width=4;c.height=128;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(0,0,0,0.55)');gr.addColorStop(0.35,'rgba(0,0,0,0.22)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,4,128);
 const tex=new THREE.CanvasTexture(c);const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,fog:true});
 const geos=[];const strip=(x0,z0,x1,z1,y,W)=>{// strips on 4 sides
   const add=(ax,az,bx,bz,nx,nz)=>{const p=[ax,y,az,bx,y,bz,bx+nx*W,y,bz+nz*W,ax+nx*W,y,az+nz*W];const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
     geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));geo.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0,0,1,0],3));geo.setIndex([0,2,1,0,3,2]);geos.push(geo.toNonIndexed());};
   add(x0,z0,x1,z0,0,-1);add(x1,z1,x0,z1,0,1);add(x0,z1,x0,z0,-1,0);add(x1,z0,x1,z1,1,0);};
 for(const w of wallRuns)strip(w.x0-0.03,w.z0-0.03,w.x1+0.03,w.z1+0.03,0.012,0.9);for(const a of AO)strip(a[0],a[1],a[2],a[3],0.012,0.55);
 for(let r=0;r<MH;r++)for(let c=0;c<MW;c++)if(ch(c,r)==='h'||ch(c,r)==='s'){}
 const m=new THREE.Mesh(mergeGeometries(geos),mat);m.renderOrder=1;scene.add(m);}
// site letters
function letterTex(L){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.strokeStyle='rgba(190,40,30,0.9)';g.lineWidth=26;g.beginPath();g.arc(256,256,220,0,TAU);g.stroke();
  g.fillStyle='rgba(190,40,30,0.9)';g.font='900 340px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(L,256,276);
  // spray roughness
  const id=g.getImageData(0,0,512,512);for(let i=3;i<id.data.length;i+=4)id.data[i]*=0.75+Math.random()*0.25;g.putImageData(id,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=MAXANISO;return t;}
function siteLetter(L){let c0=99,c1=-1,r0=99,r1=-1;for(let r=0;r<MH;r++)for(let c=0;c<MW;c++)if(MAP[r][c]===L){c0=Math.min(c0,c);c1=Math.max(c1,c);r0=Math.min(r0,r);r1=Math.max(r1,r);}
  const m=new THREE.Mesh(new THREE.PlaneGeometry(4.6,4.6),STD({map:letterTex(L),transparent:true,roughness:0.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));m.rotation.x=-Math.PI/2;m.position.set(cellX((c0+c1)/2),0.02,cellZ((r0+r1)/2));m.receiveShadow=true;scene.add(m);}
siteLetter('A');siteLetter('B');
flushBatches();

// ================= RAY / COLLISION =================
const _hit={t:0,nx:0,ny:0,nz:0};
function rayBox(ox,oy,oz,dx,dy,dz,b,maxT){let tmin=0,tmax=maxT,n=0,nsign=0;
  const o=[ox,oy,oz],d=[dx,dy,dz],lo=[b.x0,b.y0,b.z0],hi=[b.x1,b.y1,b.z1];
  for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-9){if(o[i]<lo[i]||o[i]>hi[i])return Infinity;continue;}
    const inv=1/d[i];let t1=(lo[i]-o[i])*inv,t2=(hi[i]-o[i])*inv,s=-1;if(t1>t2){const tt=t1;t1=t2;t2=tt;s=1;}
    if(t1>tmin){tmin=t1;n=i;nsign=s;}if(t2<tmax)tmax=t2;if(tmin>tmax)return Infinity;}
  _hit.nx=n===0?nsign:0;_hit.ny=n===1?nsign:0;_hit.nz=n===2?nsign:0;return tmin;}
function traceWorld(ox,oy,oz,dx,dy,dz,maxT,out){let best=maxT,bn=[0,1,0];
  if(dy<0){const tg=-oy/dy;if(tg<best){best=tg;bn=[0,1,0];}}
  for(let i=0;i<boxes.length;i++){const t=rayBox(ox,oy,oz,dx,dy,dz,boxes[i],best);if(t<best){best=t;bn=[_hit.nx,_hit.ny,_hit.nz];}}
  if(out){out.t=best;out.n=bn;}return best;}
function losClear(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;const L=Math.hypot(dx,dy,dz);if(L<1e-4)return true;return traceWorld(a.x,a.y,a.z,dx/L,dy/L,dz/L,L)>=L-0.05;}
function raySphere(ox,oy,oz,dx,dy,dz,cx,cy,cz,r){const lx=cx-ox,ly=cy-oy,lz=cz-oz;const tc=lx*dx+ly*dy+lz*dz;if(tc<0)return Infinity;const d2=lx*lx+ly*ly+lz*lz-tc*tc;if(d2>r*r)return Infinity;return tc-Math.sqrt(r*r-d2);}
function collide(x,y,z,h,r){for(let i=0;i<boxes.length;i++){const b=boxes[i];if(x+r>b.x0&&x-r<b.x1&&z+r>b.z0&&z-r<b.z1&&y+h>b.y0+0.001&&y<b.y1-0.001)return b;}return null;}
function moveAgent(a,dt){const r=a.radius,h=a.height;
  for(let axis=0;axis<2;axis++){const v=axis===0?a.vel.x:a.vel.z;if(v===0)continue;
    let nx=a.pos.x,nz=a.pos.z;if(axis===0)nx+=v*dt;else nz+=v*dt;
    for(let iter=0;iter<3;iter++){const b=collide(nx,a.pos.y,nz,h,r);if(!b)break;
      if(a.onGround&&b.y1-a.pos.y<=STEP&&!collide(nx,b.y1+0.002,nz,h,r)){const d=b.y1+0.001-a.pos.y;a.pos.y+=d;a.stepUp=(a.stepUp||0)+d;break;}
      if(axis===0){nx=v>0?b.x0-r-0.001:b.x1+r+0.001;a.vel.x=0;}else{nz=v>0?b.z0-r-0.001:b.z1+r+0.001;a.vel.z=0;}}
    a.pos.x=nx;a.pos.z=nz;}
  a.vel.y-=GRAV*dt;let ny=a.pos.y+a.vel.y*dt;let ground=false;
  if(ny<=0){ny=0;a.vel.y=0;ground=true;}
  else{const b=collide(a.pos.x,ny,a.pos.z,h,r);if(b){if(a.vel.y<=0){ny=b.y1;a.vel.y=0;ground=true;}else{ny=b.y0-h-0.001;a.vel.y=0;}}}
  a.pos.y=ny;a.onGround=ground;}

// ================= NAV (A*) =================
function astar(c0,r0,c1,r1){if(!walkable(c1,r1)||!walkable(c0,r0))return null;const N=MW*MH;const g=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),closed=new Uint8Array(N);
  const heap=[];const push=(i,f)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p;}};
  const pop=()=>{const top=heap[0];const last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,rr=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(rr<heap.length&&heap[rr][0]<heap[m][0])m=rr;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m;}}return top;};
  const s=r0*MW+c0,e=r1*MW+c1;g[s]=0;push(s,0);
  while(heap.length){const [,cur]=pop();if(cur===e)break;if(closed[cur])continue;closed[cur]=1;const cc=cur%MW,cr=(cur/MW)|0;const hc=WALKH[MAP[cr][cc]];
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nc=cc+dx,nr=cr+dz;if(!walkable(nc,nr))continue;const hn=WALKH[MAP[nr][nc]];if(hn-hc>0.55)continue;
      if(dx&&dz&&(!walkable(cc+dx,cr)||!walkable(cc,cr+dz)||Math.abs(WALKH[MAP[cr][cc+dx]]-hc)>0.01||Math.abs(WALKH[MAP[cr+dz][cc]]-hc)>0.01))continue;
      const ni=nr*MW+nc;const ng=g[cur]+(dx&&dz?1.414:1)+(hn!==hc?0.5:0);if(ng<g[ni]){g[ni]=ng;from[ni]=cur;push(ni,ng+Math.hypot(nc-c1,nr-r1));}}}
  if(from[e]<0&&s!==e)return null;const path=[];let k=e;while(k!==s&&k>=0){path.push([k%MW,(k/MW)|0]);k=from[k];}path.reverse();return path;}
