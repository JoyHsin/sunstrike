// ================= BOMB MODE · GRENADES · BOT EXTRAS =================
// ---- weapons: grenades (slot 4) ----
WEAPONS.he={id:'he',name:'高爆手雷',slot:4,grenade:'he',mob:1.0,reward:300,dmg:100,pen:0.6};
WEAPONS.fb={id:'fb',name:'闪光弹',slot:4,grenade:'fb',mob:1.0,reward:0,dmg:0};
WEAPONS.smoke={id:'smoke',name:'烟雾弹',slot:4,grenade:'smoke',mob:1.0,reward:0,dmg:0};
const BOMB_W={id:'bomb',name:'C4',dmg:500,pen:1,reward:0};
Object.assign(SHORT,{he:'手雷',fb:'闪光',smoke:'烟雾',bomb:'C4 爆炸'});
BUYLIST.push({k:'7',id:'he',label:'高爆手雷',price:300},{k:'8',id:'fb',label:'闪光弹',price:200},{k:'9',id:'smoke',label:'烟雾弹',price:300});
const NADE_MAX={he:1,fb:2,smoke:1},NADE_TYPES=['he','fb','smoke'];
const NADE_TINT={he:null,fb:0xc4c8cc,smoke:0x5a6650};
const BOMB_TIME=40,PLANT_TIME=3.2,DEFUSE_TIME=6;
for(const a of agents)a.nades={he:0,fb:0,smoke:0};
// ---- roster: 5 bots per side, one benched on the player's side ----
const ALLBOTS=agents.filter(a=>!a.isPlayer);
{const extra=makeAgent(0,'阿明',false);extra.nades={he:0,fb:0,smoke:0};ALLBOTS.splice(4,0,extra);}
for(const b of ALLBOTS){if(!b.nameSpr){b.nameSpr=nameSprite(b.name,b.team===0?'#9cc4ff':'#ffc27a');b.model.root.add(b.nameSpr);}}
// remove the auto-added CT name sprites (added in makeAgent) so each bot has exactly one
for(const b of ALLBOTS){const sp=b.model.root.children.filter(c=>c.isSprite);for(const s of sp)if(s!==b.nameSpr)b.model.root.remove(s);}
function setupRoster(side){player.team=side;agents.length=0;agents.push(player);
  for(const t of [0,1]){const list=ALLBOTS.filter(b=>b.team===t);const use=t===side?list.slice(0,4):list;for(const b of use)agents.push(b);
    for(const b of list)if(!use.includes(b)){b.alive=false;b.model.root.visible=false;}}
  for(const b of ALLBOTS)b.nameSpr.visible=b.team===side;}
setupRoster(0);
// ---- map helpers ----
const siteAt=p=>{const k=ch(toCol(p.x),toRow(p.z));return k==='A'||k==='B'?k:null;};
function walkLine(x0,z0,x1,z1,h0){const dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz);const n=Math.ceil(L/0.35);const px=-dz/(L||1)*0.36,pz=dx/(L||1)*0.36;
  for(let i=1;i<=n;i++){const t=i/n,x=x0+dx*t,z=z0+dz*t;for(const [ox,oz] of [[0,0],[px,pz],[-px,-pz]]){const c=toCol(x+ox),r=toRow(z+oz);if(!walkable(c,r)||Math.abs(WALKH[MAP[r][c]]-h0)>0.01)return false;}}return true;}
function advancePath(b){const ai=b.ai;if(!ai.path)return;const h0=WALKH[ch(toCol(b.pos.x),toRow(b.pos.z))];if(h0===undefined)return;
  for(let j=Math.min(ai.path.length-1,ai.pi+5);j>ai.pi;j--){const n=ai.path[j];if(walkLine(b.pos.x,b.pos.z,cellX(n[0]),cellZ(n[1]),h0)){ai.pi=j;return;}}}
// ---- smoke volumes block bot vision ----
const SMOKES=[];
function smokeBlocks(a,b){for(const s of SMOKES){if(s.t<0.6)continue;const r=s.r*Math.min(1,(16-s.t)/1.2+0.3);
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,L2=dx*dx+dy*dy+dz*dz;let t=((s.x-a.x)*dx+(s.y-a.y)*dy+(s.z-a.z)*dz)/L2;t=clamp(t,0,1);
  const qx=a.x+dx*t-s.x,qy=a.y+dy*t-s.y,qz=a.z+dz*t-s.z;if(qx*qx+qy*qy*1.8+qz*qz<r*r)return true;}return false;}
function visClear(a,b){return losClear(a,b)&&!smokeBlocks(a,b);}
// ---- grenade projectiles ----
const STATS={nades:{he:0,fb:0,smoke:0},plants:0,defuses:0,explodes:0,climbs:0,crouch:0,blinds:0};
const NADES=[];const _nv1=new THREE.Vector3(),_nout={t:0,n:null};
const nadeProto={};for(const t of NADE_TYPES){const o=ASSETS.grenade.scene.clone(true);const h=new THREE.Group();h.add(o);h.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(h);const s=0.11/(b.max.y-b.min.y);o.scale.multiplyScalar(s);
  h.updateMatrixWorld(true);const b2=new THREE.Box3().setFromObject(h);o.position.sub(b2.getCenter(new THREE.Vector3()));
  o.traverse(m=>{if(m.isMesh){m.material=m.material.clone();if(NADE_TINT[t]&&!/pin|ring|lever|metal/i.test(m.material.name))m.material.color.set(NADE_TINT[t]);m.castShadow=true;}});nadeProto[t]=h;}
function throwNade(a,type,yaw,pitch,speed){const o=new THREE.Vector3(a.pos.x,eyeY(a)-0.1,a.pos.z);const d=dirFrom(yaw,pitch,new THREE.Vector3());o.addScaledVector(d,0.35);
  const mesh=nadeProto[type].clone();mesh.position.copy(o);scene.add(mesh);
  NADES.push({type,mesh,p:o,v:d.multiplyScalar(speed).addScaledVector(a.vel,0.6),w:new THREE.Vector3(rand(-12,12),rand(-12,12),rand(-12,12)),t:type==='smoke'?1.6:1.5,owner:a,team:a.team,rest:false,bounces:0});
  STATS.nades[type]++;if(a.isPlayer)Snd.nadeThrow();}
function updateNades(dt){for(let i=NADES.length-1;i>=0;i--){const n=NADES[i];n.t-=dt;
    if(!n.rest){n.v.y-=GRAV*0.8*dt;const L=n.v.length()*dt;if(L>1e-5){_nv1.copy(n.v).normalize();const hit=traceWorld(n.p.x,n.p.y,n.p.z,_nv1.x,_nv1.y,_nv1.z,L+0.06,_nout);
        if(hit<L+0.06){n.p.addScaledVector(_nv1,Math.max(0,hit-0.06));const nn=_nout.n;const vn=n.v.x*nn[0]+n.v.y*nn[1]+n.v.z*nn[2];n.v.x-=2*vn*nn[0];n.v.y-=2*vn*nn[1];n.v.z-=2*vn*nn[2];n.v.multiplyScalar(0.42);n.w.multiplyScalar(0.6);
          if(Math.abs(vn)>1.2&&n.bounces<6){Snd.nadeBounce(n.p);n.bounces++;}if(nn[1]>0.7&&n.v.length()<0.9){n.rest=true;n.v.set(0,0,0);n.p.y+=0.05;}}
        else n.p.addScaledVector(n.v,dt);}
      n.mesh.rotation.x+=n.w.x*dt;n.mesh.rotation.y+=n.w.y*dt;n.mesh.rotation.z+=n.w.z*dt;}
    n.mesh.position.copy(n.p);
    if(n.t<=0){detonate(n);scene.remove(n.mesh);NADES.splice(i,1);}}
  for(let i=SMOKES.length-1;i>=0;i--){const s=SMOKES[i];s.t-=dt;if(s.t<=0)SMOKES.splice(i,1);}
  updateSmokeSprites(dt);if(blindLight.intensity>0)blindLight.intensity=Math.max(0,blindLight.intensity-dt*600);
  if(boomFX.t>0){boomFX.t-=dt;const k=Math.max(0,boomFX.t/0.35);boomFX.s.material.opacity=k;boomFX.s.scale.setScalar(boomFX.size*(1.4-k*0.6));if(boomFX.t<=0)boomFX.s.visible=false;}}
// explosion visuals
const blindLight=new THREE.PointLight(0xfff2d8,0,40,1.6);scene.add(blindLight);
const boomFX={s:new THREE.Sprite(new THREE.SpriteMaterial({map:sparkTex,color:new THREE.Color(6,4,2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false})),t:0,size:4};boomFX.s.visible=false;scene.add(boomFX.s);
function fxExplosion(p,size){boomFX.s.position.copy(p).add(_nv1.set(0,0.4,0));boomFX.size=size;boomFX.t=0.35;boomFX.s.visible=true;blindLight.position.copy(p).add(_nv1.set(0,0.8,0));blindLight.color.set(0xffb060);blindLight.intensity=size*90;
  fxSparks(p,[0,1,0],24);fxDebris(p,[0,1,0],Math.round(size*8));for(let i=0;i<8;i++){const P=FX.smoke[FX.ki++%FX.smoke.length];P.s.position.set(p.x+rand(-0.6,0.6),p.y+rand(0.2,1.2),p.z+rand(-0.6,0.6));
    P.v.set(rand(-1.2,1.2),rand(0.5,1.8),rand(-1.2,1.2));P.t0=P.t=rand(2,3.5);P.size=size*0.35;P.grow=1.6;P.a=0.55;P.s.material.color.set(0x4a4642);P.s.material.rotation=Math.random()*TAU;P.s.visible=true;}
  fxDecal(_nv1.set(p.x,0.002,p.z),[0,1,0]);const d=p.distanceTo(camera.position);hud.shake=Math.max(hud.shake||0,clamp(1-d/(size*6),0,1));}
// persistent smoke cloud sprites
const puffTex=softTex((g,S)=>{for(let i=0;i<9;i++){const x=S/2+rand(-S*0.16,S*0.16),y=S/2+rand(-S*0.16,S*0.16),r=S*rand(0.22,0.34);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(240,240,240,0.8)');gr.addColorStop(0.55,'rgba(225,225,225,0.5)');gr.addColorStop(1,'rgba(220,220,220,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}},128);
const SMOKE_SPR=[];{for(let i=0;i<114;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,depthWrite:false,transparent:true,opacity:0,color:0xb9bcbf}));s.visible=false;scene.add(s);SMOKE_SPR.push({s,t:0,t0:1,base:1,vy:0,ox:0,oz:0,owner:null});}}
let smokeIdx=0;
function spawnSmokeCloud(p){const vol={x:p.x,y:1.3,z:p.z,r:3.3,t:16};SMOKES.push(vol);
  for(let i=0;i<38;i++){const S=SMOKE_SPR[smokeIdx++%SMOKE_SPR.length];const a=rand(0,TAU),rr=Math.sqrt(Math.random())*2.6;S.s.position.set(p.x+Math.cos(a)*rr*0.3,rand(0.4,1.2),p.z+Math.sin(a)*rr*0.3);
    S.ox=Math.cos(a)*rr;S.oz=Math.sin(a)*rr;S.oy=rand(0.5,2.6);S.cx=p.x;S.cz=p.z;S.t0=S.t=rand(14.5,16.5);S.base=rand(2.6,3.9);S.s.material.rotation=Math.random()*TAU;S.s.material.color.setHSL(0.1,0.04,rand(0.5,0.62));S.s.visible=true;}}
function updateSmokeSprites(dt){for(const S of SMOKE_SPR){if(S.t<=0)continue;S.t-=dt;const age=S.t0-S.t;const g=Math.min(1,age/1.4);
  S.s.position.x+=(S.cx+S.ox*g-S.s.position.x)*Math.min(1,dt*3);S.s.position.z+=(S.cz+S.oz*g-S.s.position.z)*Math.min(1,dt*3);S.s.position.y+=(S.oy*g+0.2-S.s.position.y)*Math.min(1,dt*2);
  const sz=S.base*(0.4+0.6*g);S.s.scale.set(sz,sz,1);S.s.material.opacity=Math.min(1,age*3)*Math.min(1,S.t/2.5);S.s.material.rotation+=dt*0.03;if(S.t<=0)S.s.visible=false;}}
function detonate(n){const p=n.p;
  if(n.type==='he'){fxExplosion(p,2.2);Snd.explode(p,1);const R=7.5;
    for(const v of agents){if(!v.alive)continue;if(v.team===n.team&&v!==n.owner)continue;const c=_nv1.set(v.pos.x,v.pos.y+1.0,v.pos.z);const d=c.distanceTo(p);if(d>R)continue;
      if(!losClear({x:p.x,y:p.y+0.25,z:p.z},c)&&d>1.5)continue;const dmg=Math.round(98*Math.pow(1-d/R,1.15));if(dmg<2)continue;
      damage(v,n.owner,Object.assign({},WEAPONS.he,{dmg,falloff:1}),'body',0);if(v.isPlayer)hud.shake=1;}}
  else if(n.type==='fb'){Snd.flashbang(p);blindLight.position.copy(p);blindLight.color.set(0xffffff);blindLight.intensity=500;
    const camP=camera.position;// player
    if(player.alive){const d=p.distanceTo(camP);if(d<32&&visClear(p,camP)){const fw=_nv1.set(0,0,-1).applyQuaternion(camera.quaternion);const to=new THREE.Vector3().subVectors(p,camP).normalize();const dot=fw.dot(to);
      const amt=clamp(1.15-d/32,0,1)*(dot>0.5?1:(dot>-0.2?0.55:0.22));if(amt>0.05){hud.blind=Math.max(hud.blind||0,0.4+amt*4.2);hud.blindMax=hud.blind;Snd.ring(amt);}}}
    for(const b of agents){if(b.isPlayer||!b.alive)continue;const e={x:b.pos.x,y:eyeY(b),z:b.pos.z};const d=Math.hypot(e.x-p.x,e.y-p.y,e.z-p.z);if(d>30||!visClear(p,e))continue;
      const fx=-Math.sin(b.ai.aimY),fz=-Math.cos(b.ai.aimY);const dot=((p.x-e.x)*fx+(p.z-e.z)*fz)/(d+1e-6);const amt=clamp(1.1-d/30,0,1)*(dot>0.3?1:0.35);
      if(amt>0.12){STATS.blinds++;b.ai.blindT=Math.max(b.ai.blindT||0,0.3+amt*3.4);b.ai.targetVisible=false;b.ai.react=Math.max(b.ai.react,0.4);}}}
  else{Snd.smokePop(p);spawnSmokeCloud(p);}}
// ballistic solve for bots: returns pitch for given speed, or null
function lobPitch(dx,dy,speed){const g=GRAV*0.8,s2=speed*speed,disc=s2*s2-g*(g*dx*dx+2*dy*s2);if(disc<0)return null;const lo=Math.atan((s2-Math.sqrt(disc))/(g*dx)),hi=Math.atan((s2+Math.sqrt(disc))/(g*dx));return lo<0.2?Math.min(hi,0.9):lo;}
function botThrow(b,type,tx,tz,ty){const ex=b.pos.x,ez=b.pos.z;const dx=tx-ex,dz=tz-ez,hd=Math.hypot(dx,dz);let speed=Math.min(17,6+hd*0.75);let pitch=lobPitch(hd,(ty||0.3)-(eyeY(b)-0.1),speed);
  if(pitch===null){speed=17;pitch=0.6;}const yaw=Math.atan2(-dx,-dz)+rand(-0.04,0.04);b.ai.aimY=yaw;throwNade(b,type,yaw,pitch+rand(-0.03,0.03),speed);b.nades[type]--;b.ai.nadeCD=now+rand(4,8);}
// ---- the bomb ----
const BOMB={state:'none',carrier:null,pos:new THREE.Vector3(),plantT:0,defuseT:0,planter:null,site:null,beepT:0,planter2:null};
const BOMB_ATT={name:'C4',team:1,pos:BOMB.pos,isPlayer:false,kills:0,ai:null};
const bombMesh=(()=>{const g=new THREE.Group();const body=new THREE.Mesh(new RoundedBoxGeometry(0.34,0.1,0.22,2,0.015),STD({color:0x4b4a3a,roughness:0.7}));body.position.y=0.05;body.castShadow=true;g.add(body);
  for(let i=0;i<3;i++){const st=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.3,12),STD({color:[0xb39c6a,0xa58f60,0xbca575][i],roughness:0.8}));st.rotation.z=Math.PI/2;st.position.set(0,0.13,-0.06+i*0.06);g.add(st);}
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(0.12,0.05),new THREE.MeshBasicMaterial({color:0x7dff6a}));scr.rotation.x=-Math.PI/2;scr.position.set(0.06,0.101,0.06);g.add(scr);
  const led=new THREE.Sprite(new THREE.SpriteMaterial({map:sparkTex,color:new THREE.Color(5,0.3,0.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false}));led.scale.setScalar(0.12);led.position.set(-0.1,0.12,0.07);g.add(led);g.userData.led=led;
  g.visible=false;scene.add(g);return g;})();
function resetBomb(){BOMB.state='none';BOMB.carrier=null;BOMB.plantT=0;BOMB.defuseT=0;BOMB.planter=null;BOMB.site=null;BOMB.defuser=null;bombMesh.visible=false;round.planted=false;
  const att=agents.filter(a=>a.team===1&&a.alive);if(!att.length)return;let c=null;const pl=att.find(a=>a.isPlayer);if(pl&&Math.random()<0.5)c=pl;else c=pick(att.filter(a=>!a.isPlayer))||att[0];
  BOMB.state='carried';BOMB.carrier=c;}
function dropBomb(a){if(BOMB.state!=='carried'||BOMB.carrier!==a)return;BOMB.state='dropped';BOMB.carrier=null;BOMB.pos.set(a.pos.x,Math.max(0,a.pos.y),a.pos.z);bombMesh.position.copy(BOMB.pos);bombMesh.rotation.y=rand(0,TAU);bombMesh.visible=true;
  if(a.isPlayer)msg('你丢下了炸弹');// nearest attacker bot goes to fetch it
  assignFetcher();}
function assignFetcher(){let best=null,bd=1e9;for(const b of agents)if(b.team===1&&b.alive&&!b.isPlayer){const d=b.pos.distanceTo(BOMB.pos);if(d<bd){bd=d;best=b;}}
  BOMB.fetcher=best;if(best){best.ai.goalQ.unshift(G([toCol(BOMB.pos.x),toRow(BOMB.pos.z)],[0.3,0.3]));best.ai.path=null;best.ai.wait=0;}}
function plantBomb(a){BOMB.state='planted';BOMB.carrier=null;BOMB.planter=a;BOMB.site=siteAt(a.pos)||'A';BOMB.pos.set(a.pos.x,a.pos.y,a.pos.z);bombMesh.position.copy(BOMB.pos);bombMesh.rotation.y=a.yaw;bombMesh.visible=true;
  STATS.plants++;round.planted=true;round.t=BOMB_TIME;BOMB.beepT=0;banner('炸弹已安放','',2.5);Snd.planted();if(a.isPlayer)addMoney(300);
  const c=toCol(BOMB.pos.x),r=toRow(BOMB.pos.z);
  for(const b of agents){if(b.isPlayer||!b.alive)continue;const ai=b.ai;ai.planting=false;ai.path=null;ai.wait=0;
    if(b.team===0){ai.goalQ=[{c,r,hold:[0,0.2],defuse:true}];ai.lastSeen=null;}
    else ai.goalQ=[G(pick(PT[BOMB.site]),[25,45])];}}
function endBomb(kind){if(kind==='explode'){fxExplosion(BOMB.pos,5);Snd.explode(BOMB.pos,2.2);BOMB.state='exploded';STATS.explodes++;bombMesh.visible=false;
    for(const v of agents){if(!v.alive)continue;const d=v.pos.distanceTo(BOMB.pos);if(d>18)continue;const dmg=Math.round(500*Math.pow(1-d/18,1.6));if(dmg<1)continue;damage(v,BOMB_ATT,Object.assign({},BOMB_W,{dmg,falloff:1}),'body',0);}
    endRound(1,'炸弹已爆炸');}
  else{BOMB.state='defused';STATS.defuses++;Snd.defused();if(BOMB.defuser&&BOMB.defuser.isPlayer)addMoney(300);endRound(0,'炸弹已被拆除');}}
const prog={t:0,label:''};
function updateBomb(dt){if(round.state==='menu'||round.state==='over')return;
  const led=bombMesh.userData.led;
  if(BOMB.state==='carried'&&(!BOMB.carrier||!BOMB.carrier.alive))dropBomb(BOMB.carrier);
  if(BOMB.state==='dropped'){led.visible=false;if(!BOMB.fetcher||!BOMB.fetcher.alive)assignFetcher();
    for(const a of agents)if(a.team===1&&a.alive&&a.pos.distanceTo(BOMB.pos)<1.3){BOMB.state='carried';BOMB.fetcher=null;BOMB.carrier=a;bombMesh.visible=false;if(a.isPlayer)msg('你捡起了炸弹（按住 E 在 A / B 点安放）');
      else{a.ai.goalQ=[G(pick(PT[round.site||'A']),[0,0])];a.ai.path=null;}break;}}
  if(BOMB.state==='planted'&&round.state==='live'){const k=clamp(round.t/BOMB_TIME,0,1);BOMB.beepT-=dt;const iv=0.12+0.88*k;if(BOMB.beepT<=0){BOMB.beepT=iv;Snd.bombBeep(BOMB.pos,k);led.visible=true;led.userData.on=0.08;}
    if(led.userData.on>0){led.userData.on-=dt;if(led.userData.on<=0)led.visible=false;}
    // defusing
    let def=null;for(const a of agents)if(a.team===0&&a.alive&&(a.isPlayer?a._defusing:a.ai.defusing)&&a.pos.distanceTo(BOMB.pos)<1.7){def=a;break;}
    if(def){if(BOMB.defuser!==def){BOMB.defuser=def;BOMB.defuseT=0;if(!def.isPlayer)Snd.defuseStart(BOMB.pos);}BOMB.defuseT+=dt;if(BOMB.defuseT>=DEFUSE_TIME){endBomb('defuse');return;}}
    else{BOMB.defuser=null;BOMB.defuseT=0;}
    if(round.t<=0){endBomb('explode');return;}}
  // player progress bar (plant / defuse)
  const p=player;prog.t=0;prog.label='';
  if(p.alive&&round.state==='live'){
    if(BOMB.state==='carried'&&BOMB.carrier===p){const s=siteAt(p.pos);if(s&&keys.KeyE&&p.onGround){BOMB.plantT+=dt;p._planting=true;prog.t=BOMB.plantT/PLANT_TIME;prog.label='正在安放炸弹…';if(BOMB.plantT>=PLANT_TIME){plantBomb(p);p._planting=false;}}
      else{BOMB.plantT=p._planting?0:BOMB.plantT;p._planting=false;if(s&&hud.hintT===undefined||s&&now-(hud.hintT||0)>4){hud.hintT=now;msg('按住 E 安放炸弹');}}}
    else p._planting=false;
    if(p.team===0&&BOMB.state==='planted'){const near=p.pos.distanceTo(BOMB.pos)<1.6;p._defusing=near&&keys.KeyE;if(p._defusing&&BOMB.defuser===p){prog.t=BOMB.defuseT/DEFUSE_TIME;prog.label='正在拆除炸弹…';}
      else if(near&&now-(hud.hintT||0)>4){hud.hintT=now;msg('按住 E 拆除炸弹');}}else p._defusing=false;}
  else{p._planting=false;p._defusing=false;}}
// round outcome with the bomb
function bombRoundCheck(){const a0=aliveCount(0),a1=aliveCount(1);
  if(round.planted){if(a0===0)endRound(1,'防守方全部阵亡');return;}
  if(a1===0)endRound(0,'进攻方全部被消灭');else if(a0===0)endRound(1,'防守方全部阵亡');else if(round.t<=0)endRound(0,'时间耗尽，炸弹未安放');}
// ---- bot extras: grenades, crouching, crate climbing, planting / defusing ----
const CRATE_TOPS=[];{for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){if(MAP[r][c]!=='x')continue;let adj=null;for(const [dc,dr] of [[0,1],[0,-1],[1,0],[-1,0]])if(WALKH[ch(c+dc,r+dr)]===0){adj=[c+dc,r+dr];break;}
  if(adj){const top=CRATE_INFO[r*MW+c];CRATE_TOPS.push({c,r,adj,x:top?top.x:cellX(c)-0.55,z:cellZ(r)});}}}
function botBuyNades(b){b.nades={he:0,fb:0,smoke:0};const eco=round.num===1||round.num===9;
  if(eco){if(Math.random()<0.25)b.nades.fb=1;return;}if(Math.random()<0.55)b.nades.he=1;if(Math.random()<0.45)b.nades.fb=1;if(Math.random()<(b.team===1?0.5:0.3))b.nades.smoke=1;}
const SMOKE_SPOT={A:[10,3],B:[27,3]};
// called each frame for live bots; returns [wantX,wantZ,speed] when it takes over movement, or null
function botSpecial(b,dt){const ai=b.ai;
  if(ai.blindT>0){ai.blindT-=dt;ai.aimY+=Math.sin(now*3+b.pos.x)*dt*1.5;ai.aimP*=0.9;ai.targetVisible=false;return [0,0,0];}
  // crate climbing
  if(ai.climb){const cl=ai.climb;cl.t+=dt;const dx=cl.x-b.pos.x,dz=cl.z-b.pos.z,d=Math.hypot(dx,dz);ai.aimY=turnTo(ai.aimY,Math.atan2(-dx,-dz),6,dt);
    if(cl.t>0.15&&!cl.jumped&&b.onGround){b.vel.y=JUMP_V;b.onGround=false;cl.jumped=true;}
    if(b.pos.y>0.9&&b.onGround&&d<0.35){ai.climb=null;ai.onCrate=true;STATS.climbs++;ai.wait=cl.hold?rand(cl.hold[0],cl.hold[1]):rand(8,15);ai.aimY=(b.team===0?Math.PI:0)+rand(-1,1);return [0,0,0];}
    if(cl.t>1.6){ai.climb=null;ai.wait=0.3;return [0,0,0];}return d>0.1?[dx/d,dz/d,3.2]:[0,0,0];}
  // fetch a dropped bomb: steer straight onto it once close
  if(BOMB.state==='dropped'&&BOMB.fetcher===b&&!(ai.target&&ai.targetVisible)){const dx=BOMB.pos.x-b.pos.x,dz=BOMB.pos.z-b.pos.z,d=Math.hypot(dx,dz);if(d<3){ai.aimY=turnTo(ai.aimY,Math.atan2(-dx,-dz),6,dt);return [dx/d,dz/d,4.5];}
    if(!ai.path&&ai.wait<=0&&!ai.goalQ.length)ai.goalQ.unshift(G([toCol(BOMB.pos.x),toRow(BOMB.pos.z)],[0.3,0.3]));}
  // planting
  if(BOMB.state==='carried'&&BOMB.carrier===b&&round.state==='live'){const s=siteAt(b.pos);
    if(s&&!(ai.target&&ai.targetVisible)&&(ai.goalQ.length===0||ai.planting)){if(!ai.planting){ai.planting=true;BOMB.plantT=0;}BOMB.plantT+=dt;b.crouching=true;if(BOMB.plantT>=PLANT_TIME){plantBomb(b);b.crouching=false;}return [0,0,0];}
    ai.planting=false;}
  // defusing
  if(b.team===0&&BOMB.state==='planted'){const d=b.pos.distanceTo(BOMB.pos);
    if(d<1.3&&!(ai.target&&ai.targetVisible)){ai.defusing=true;b.crouching=true;ai.aimP*=0.9;return [0,0,0];}
    ai.defusing=false;if(d<1.3){/* fight first */}
    else if(!ai.goalQ.length&&(!ai.path||ai.pi>=ai.path.length)&&ai.wait<=0.05){ai.goalQ=[{c:toCol(BOMB.pos.x),r:toRow(BOMB.pos.z),hold:[0,0.2],defuse:true}];}}
  else ai.defusing=false;
  // grenades
  if(round.state==='live'&&now>(ai.nadeCD||0)&&!(ai.target&&ai.targetVisible)){
    const ls=ai.lastSeen;
    if(ls&&now-ai.lastSeenT<4){const d=Math.hypot(ls.x-b.pos.x,ls.z-b.pos.z);
      if(d>6&&d<26&&Math.random()<dt*0.9){if(b.nades.he>0){botThrow(b,'he',ls.x,ls.z,0.3);return null;}if(b.nades.fb>0){botThrow(b,'fb',ls.x+rand(-1,1),ls.z+rand(-1,1),1.8);return null;}}}
    if(b.team===1&&b.nades.smoke>0&&!round.planted&&round.site&&ai.goalQ.length<=1){const sp=SMOKE_SPOT[round.site];const tx=cellX(sp[0]),tz=cellZ(sp[1]);const d=Math.hypot(tx-b.pos.x,tz-b.pos.z);
      if(d<24&&d>7&&visClear({x:b.pos.x,y:eyeY(b),z:b.pos.z},{x:tx,y:1.2,z:tz})){botThrow(b,'smoke',tx,tz,0.2);return null;}}
    if(b.team===1&&b.nades.fb>0&&!round.planted&&ai.goalQ.length===1&&Math.random()<dt*0.5&&round.site){const sp=pick(PT[round.site]);botThrow(b,'fb',cellX(sp[0]),cellZ(sp[1]),2.2);return null;}}
  return null;}
function clearNades(){for(const n of NADES)scene.remove(n.mesh);NADES.length=0;SMOKES.length=0;for(const S of SMOKE_SPR){S.t=0;S.s.visible=false;}hud.blind=0;hud.shake=0;blindLight.intensity=0;boomFX.t=0;boomFX.s.visible=false;}
