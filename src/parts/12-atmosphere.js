// ================= ATMOSPHERE: clouds + wet patches =================
// procedural cloud dome (fbm noise projected on a virtual cloud plane, drifts slowly, lit from the sun side)
const CLOUDS=(()=>{const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.BackSide,
  uniforms:{time:{value:0},sunDir:{value:sunDir.clone()},cover:{value:0.44}},
  vertexShader:`varying vec3 vDir;void main(){vDir=normalize((modelMatrix*vec4(position,0.0)).xyz);gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform float time;uniform vec3 sunDir;uniform float cover;varying vec3 vDir;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.0,a=0.5;mat2 r=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*n(p);p=r*p;a*=0.5;}return v;}
  void main(){vec3 d=normalize(vDir);if(d.y<0.01)discard;vec2 uv=d.xz/(d.y+0.1)*2.4+vec2(time*0.004,time*0.0015);
    float b=fbm(uv*1.3);float c=smoothstep(cover,cover+0.32,b);if(c<0.003)discard;
    float sh=fbm(uv*1.3+sunDir.xz*0.06);float lit=clamp(0.55+(b-sh)*3.5,0.25,1.0);
    float sunGlow=pow(max(dot(d,sunDir),0.0),8.0);
    vec3 col=mix(vec3(0.62,0.67,0.76),vec3(1.05,1.0,0.94),lit)*(1.7+sunGlow*1.5);
    float a=c*smoothstep(0.01,0.22,d.y)*0.88;gl_FragColor=vec4(col,a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`});
  const m=new THREE.Mesh(new THREE.SphereGeometry(520,32,16),mat);m.renderOrder=-1;m.frustumCulled=false;scene.add(m);
  m.onBeforeRender=(r,s,cam)=>{m.position.copy(cam.position);};return m;})();
// wet patches / puddles: glossy, slightly darker decals that reflect the sky environment
{const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
  const tex=[];for(let v=0;v<3;v++){g.clearRect(0,0,256,256);for(let i=0;i<14;i++){const x=128+rand(-60,60),y=128+rand(-50,50),r=rand(25,70);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,0.95)');gr.addColorStop(0.6,'rgba(255,255,255,0.6)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.NoColorSpace;t.needsUpdate=true;const c2=document.createElement('canvas');c2.width=c2.height=256;c2.getContext('2d').drawImage(cv,0,0);t.image=c2;tex.push(t);}
  const mats=tex.map(t=>new THREE.MeshStandardMaterial({color:0x17191c,roughness:0.03,metalness:0.0,alphaMap:t,transparent:true,opacity:0.72,depthWrite:false,envMapIntensity:2.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  const spots=[];for(let r=1;r<MH-1;r++)for(let c=1;c<MW-1;c++){if(MAP[r][c]==='.'&&srand()<0.035)spots.push([c,r]);}
  for(const [c,r] of spots.slice(0,26)){const s=rand(1.6,3.4);const pg=new THREE.PlaneGeometry(s,s*rand(0.6,1));pg.rotateX(-Math.PI/2);pg.rotateY(rand(0,TAU));const m=new THREE.Mesh(pg,mats[(c+r)%3]);
    m.position.set(cellX(c)+rand(-0.4,0.4),0.006,cellZ(r)+rand(-0.4,0.4));m.receiveShadow=true;m.renderOrder=1;scene.add(m);}}
