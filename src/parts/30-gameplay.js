const _fw=new THREE.Vector3(),_ms=new THREE.Vector3(),_sp=new THREE.Vector3(),_rt=new THREE.Vector3(),_up=new THREE.Vector3();
// ================= AGENTS =================
const agents=[];let player=null;let now=0;let diff='normal';let startMoney=3000;
const SHORT={rifle:'AR-7',smg:'MK-5',sniper:'LR-9',pistol:'P-12',knife:'匕首'};
const NAMES=[['小林','阿杰','老王','大刘'],['毒蛇','猎鹰','铁锤','幽灵','刀锋']];
function makeAgent(team,name,isPlayer){const a={team,name,isPlayer,pos:new THREE.Vector3(),vel:new THREE.Vector3(),yaw:0,pitch:0,hp:100,armor:0,helmet:false,alive:true,radius:0.32,height:1.8,onGround:true,
  inv:{primary:null,secondary:'pistol'},cur:'pistol',ammo:{},fireCD:0,reloadT:0,switchT:0,shots:0,lastShot:-9,recoilP:0,recoilY:0,kills:0,deaths:0,money:800,spotT:-99,noisyT:-99,stepDist:0,eyeOff:0,deadT:0,flashT:0};
  if(!isPlayer){a.model=makeModel(team);a.model.root.rotation.order='YXZ';scene.add(a.model.root);if(team===0)a.model.root.add(nameSprite(name,'#9cc4ff'));a.ai={};}
  agents.push(a);return a;}
player=makeAgent(0,'你',true);
NAMES[0].forEach(n=>makeAgent(0,n,false));NAMES[1].forEach(n=>makeAgent(1,n,false));
function giveWeapon(a,id){const w=WEAPONS[id];if(w.slot===1)a.inv.primary=id;else if(w.slot===2)a.inv.secondary=id;a.ammo[id]={mag:w.mag,reserve:w.reserve};}
const eyeY=a=>a.pos.y+a.height-0.12+(a.eyeOff||0);
const headY=a=>a.pos.y+a.height-0.2;
function dirFrom(yaw,pitch,out){const cp=Math.cos(pitch);return out.set(-Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp);}
const camYaw=()=>camera.rotation.y;
const _o=new THREE.Vector3(),_d=new THREE.Vector3(),_r=new THREE.Vector3(),_u=new THREE.Vector3(),_tmp=new THREE.Vector3(),_out={t:0,n:null};
function fireRay(a,yaw,pitch,spread,range){const o=_o.set(a.pos.x,eyeY(a),a.pos.z);dirFrom(yaw,pitch,_d);
  if(spread>0){_r.set(Math.cos(yaw),0,-Math.sin(yaw));_u.crossVectors(_r,_d);const ang=Math.random()*TAU,rr=spread*Math.sqrt(Math.random());_d.addScaledVector(_r,Math.cos(ang)*rr).addScaledVector(_u,Math.sin(ang)*rr).normalize();}
  let best=traceWorld(o.x,o.y,o.z,_d.x,_d.y,_d.z,range,_out);let victim=null,zone=null;const n=_out.n;
  for(const b of agents){if(b===a||!b.alive||b.team===a.team)continue;const dx=b.pos.x-o.x,dz=b.pos.z-o.z;if(dx*dx+dz*dz>(best+1)*(best+1))continue;
    const th=raySphere(o.x,o.y,o.z,_d.x,_d.y,_d.z,b.pos.x,headY(b),b.pos.z,0.2);
    const bb={x0:b.pos.x-0.27,x1:b.pos.x+0.27,z0:b.pos.z-0.27,z1:b.pos.z+0.27,y0:b.pos.y,y1:b.pos.y+b.height-0.38};const tb=rayBox(o.x,o.y,o.z,_d.x,_d.y,_d.z,bb,best);
    if(th<best&&th<=tb){best=th;victim=b;zone='head';}else if(tb<best){best=tb;victim=b;const hy=o.y+_d.y*tb-b.pos.y;zone=hy<0.8*(b.height/1.8)?'leg':'body';}}
  return {o:o.clone(),d:_d.clone(),t:best,victim,zone,n,end:o.clone().addScaledVector(_d,best),range};}
function damage(v,att,w,zone,dist){if(!v.alive||v._god)return;let dmg=w.dmg*Math.pow(w.falloff||1,dist/10);
  if(zone==='head')dmg*=(w.headMult||2.5);else if(zone==='leg')dmg*=0.75;
  if(!w.melee&&v.armor>0&&zone!=='leg'&&(zone!=='head'||v.helmet)){const hp=dmg*w.pen;v.armor=Math.max(0,v.armor-(dmg-hp)*0.5);dmg=hp;}
  if(v.isPlayer&&att&&!att.isPlayer)dmg*=DIFF[diff].taken;
  dmg=Math.round(dmg);v.hp-=dmg;v.lastAttacker=att;
  if(v.isPlayer){Snd.hurt();hud.flash=0.6;const ang=Math.atan2(att.pos.x-v.pos.x,att.pos.z-v.pos.z);hud.dmgAng=ang;hud.dmgT=1.2;}
  else{const ai=v.ai;ai.alertT=now;if(!ai.targetVisible){ai.lastSeen=att.pos.clone();ai.lastSeenT=now;ai.lookAt=att.pos.clone();}}
  if(v.hp<=0){v.hp=0;kill(v,att,w,zone==='head');}}
function kill(v,att,w,hs){v.alive=false;v.deaths++;v.deadT=0;v.vel.set(0,0,0);if(att){att.kills++;if(att.isPlayer){addMoney(w.reward);msg(`击杀 ${v.name}  +$${w.reward}`);}}
  if(v.model){v.model.die();}
  if(BOMB.state==='carried'&&BOMB.carrier===v)dropBomb(v);
  if(v.isPlayer){scoped=false;player.deathT=0;specIdx=-1;}
  addKill(att,v,w,hs);}

// ================= ROUND / GAME STATE =================
const round={state:'menu',t:0,num:0,score:[0,0],liveT:0,winner:-1,over:false};
let paused=false,locked=false,noLock=false,scoped=false,specIdx=-1,buyOpen=false;
const keys={};let mouseDown=false,trigger=false;let sens=1;
const ROUND_TIME=115,FREEZE=4,BUY_WINDOW=20,WIN_SCORE=8;
function addMoney(v){player.money=clamp(player.money+v,0,16000);}
const SPAWN=[[],[]];for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){if(MAP[r][c]==='K')SPAWN[0].push([c,r]);if(MAP[r][c]==='T')SPAWN[1].push([c,r]);}
const PT={A:[[5,2],[3,5],[7,3],[8,6],[2,6]],B:[[31,2],[30,5],[33,6],[29,3],[33,3]],mid:[[17,11],[18,15],[17,19],[18,6]],longA:[[3,12],[3,18]],tunnel:[[30,12],[30,19]],shortA:[[8,10]],bshort:[[26,10]],lowerB:[[23,17]],ct:[[18,2],[13,4]],t:[[16,24],[8,22]]};
const ALLPTS=[].concat(...Object.values(PT));
const pick=a=>a[(Math.random()*a.length)|0];
const G=(p,hold)=>({c:p[0],r:p[1],hold});
function planRound(){const bots=agents.filter(a=>!a.isPlayer);
  const def=bots.filter(b=>b.team===0),att=bots.filter(b=>b.team===1);
  const holds=[pick(PT.A),pick(PT.B),Math.random()<0.5?pick(PT.mid.slice(3)):pick(PT.A),pick(PT.B)].sort(()=>Math.random()-0.5);
  def.forEach((b,i)=>{const h=holds[i%holds.length];b.ai.goalQ=[G(h,[18,40])];b.ai.wait=rand(0,1);
    if(Math.random()<0.35){const ct=CRATE_TOPS.filter(t=>Math.hypot(t.c-h[0],t.r-h[1])<9);if(ct.length){const t=pick(ct);b.ai.goalQ=[{c:t.adj[0],r:t.adj[1],hold:[15,35],climb:{x:t.x,z:t.z}}];}}});
  const site=Math.random()<0.5?'A':'B';round.site=site;
  const routes=site==='A'?[[PT.longA[1],PT.longA[0]],[PT.mid[2],PT.mid[0],PT.shortA[0]]]:[[PT.tunnel[1],PT.tunnel[0]],[PT.mid[2],PT.lowerB[0],PT.tunnel[0]],[PT.mid[2],PT.mid[0],PT.bshort[0]]];
  att.forEach((b,i)=>{const rt=routes[i%routes.length];b.ai.goalQ=rt.map(p=>G(p,[0,0.6])).concat([G(pick(PT[site]),[3,8])]);b.ai.wait=rand(0,4);});}
function spawnAll(){const used=[[],[]];const free=SPAWN.map(s=>s.slice().sort(()=>Math.random()-0.5));
  for(const a of agents){const cell=free[a.team].pop();a.pos.set(cellX(cell[0])+rand(-0.4,0.4),0,cellZ(cell[1])+rand(-0.4,0.4));a.vel.set(0,0,0);a.yaw=a.team===0?Math.PI:0;a.pitch=0;a.height=1.8;a.eyeOff=0;
    const keep=a.alive&&round.num>1;a.alive=true;a.hp=100;a.reloadT=0;a.switchT=0;a.shots=0;a.recoilP=a.recoilY=0;a.fireCD=0;a.deadT=0;
    a.crouching=false;if(a.isPlayer){if(!keep){a.inv={primary:null,secondary:'pistol'};a.ammo={};a.armor=0;a.helmet=false;a.nades={he:0,fb:0,smoke:0};}a._planting=a._defusing=false;giveWeapon(a,'pistol');if(a.inv.primary)giveWeapon(a,a.inv.primary);a.cur=a.inv.primary||'pistol';}
    else{a.inv={primary:null,secondary:'pistol'};a.ammo={};giveWeapon(a,'pistol');a.cur='pistol';a.armor=0;a.helmet=false;
      if(round.num>1){const r=Math.random();const id=r<0.12?'sniper':(r<0.3?'smg':'rifle');giveWeapon(a,id);a.cur=id;a.armor=100;a.helmet=Math.random()<0.8;}
      else if(Math.random()<0.3){a.armor=100;}
      const ai=a.ai;Object.assign(ai,{path:null,pi:0,goalQ:[],wait:0,think:rand(0,0.2),target:null,targetVisible:false,react:0,errMag:0,phi:rand(0,TAU),lastSeen:null,lastSeenT:-99,alertT:-99,lookAt:null,
        aimY:a.yaw,aimP:0,burst:0,burstPause:0,strafe:1,strafeT:0,stuckT:0,lastPos:a.pos.clone(),headAim:false,jit:[0,0],scan:0,planting:false,defusing:false,climb:null,onCrate:false,blindT:0,nadeCD:rand(4,12),crouchFight:false,smoothT:0});botBuyNades(a);
      a.model.reset();a.model.setWeapon(a.cur);a.model.root.visible=true;a.model.root.rotation.set(0,a.yaw,0);a.model.root.position.copy(a.pos);}}
  planRound();resetBomb();
  if(BOMB.carrier===player)banner(`第 ${round.num} 回合`,'你携带着炸弹 · 到 A 或 B 点按住 E 安放（G 丢弃）',3.5);}
function startMatch(d,m,side){diff=d||diff;if(m!==undefined)startMoney=m;if(side!==undefined)setupRoster(side);round.score=[0,0];round.num=0;round.over=false;for(const a of agents){a.kills=0;a.deaths=0;a.alive=false;}player.money=startMoney;startRound();}
function startRound(){round.num++;clearFX();clearNades();spawnAll();round.state='freeze';round.t=FREEZE;round.liveT=0;round.winner=-1;scoped=false;buyOpen=false;
  if(BOMB.carrier!==player)banner(`第 ${round.num} 回合`,player.team===0?'防守 A / B 包点 · 按 B 购买装备':'进攻：护送炸弹到 A 或 B 点 · 按 B 购买',2.5);Snd.beep();$('over').classList.add('hidden');}
function endRound(w,reason){round.state='end';round.t=5;round.winner=w;round.score[w]++;const win=w===player.team;
  addMoney(win?3250:1900);banner(w===0?'防守方 获胜':'进攻方 获胜',reason+(win?'  +$3250':'  +$1900'),4.5);Snd.jingle(win);
  if(round.score[w]>=WIN_SCORE)round.over=true;}
function aliveCount(t){let n=0;for(const a of agents)if(a.team===t&&a.alive)n++;return n;}
function updateRound(dt){if(round.state==='freeze'){round.t-=dt;if(round.t<=0){round.state='live';round.t=ROUND_TIME;Snd.beep();banner('开始！','',1.2);}}
  else if(round.state==='live'){round.t-=dt;round.liveT+=dt;
    bombRoundCheck();}
  else if(round.state==='end'){round.t-=dt;if(round.t<=0){if(round.over){showOver();}else startRound();}}}
function showOver(){round.state='over';const win=round.score[player.team]>=WIN_SCORE;$('overtitle').textContent=win?'比赛胜利！':'比赛失败';
  $('oversub').textContent=`比分 防守方 ${round.score[0]} : ${round.score[1]} 进攻方 · 你的战绩 ${player.kills} 杀 / ${player.deaths} 死`;$('over').classList.remove('hidden');releaseLock();}
const canBuy=()=>player.alive&&(round.state==='freeze'||(round.state==='live'&&round.liveT<BUY_WINDOW-FREEZE));
function buy(i){const it=BUYLIST[i];if(!it||!canBuy())return;if(player.money<it.price){msg('金钱不足');return;}
  if(it.id==='kevlar'){if(player.armor>=100){msg('护甲已满');return;}player.armor=100;}
  else if(it.id==='helmet'){if(player.armor>=100&&player.helmet){msg('已拥有');return;}player.armor=100;player.helmet=true;}
  else if(NADE_MAX[it.id]){if(player.nades[it.id]>=NADE_MAX[it.id]){msg('已达携带上限');return;}player.nades[it.id]++;}
  else if(it.id==='pistolammo'){player.ammo.pistol.reserve=WEAPONS.pistol.reserve;}
  else{if(player.inv.primary===it.id){msg('已拥有该武器');return;}giveWeapon(player,it.id);switchTo(it.id);}
  player.money-=it.price;Snd.buy();msg(`已购买 ${it.label}`);}

// ================= PLAYER =================
let vmKick=0,vmPhase=0,knifeSwing=0,nadeAnim=0;
function switchTo(id){const p=player;if(!id||p.cur===id&&p.switchT<=0)return;p.cur=id;p.switchT=0.45;p.reloadT=0;scoped=false;p.shots=0;}
function startReload(a){const w=WEAPONS[a.cur];if(w.melee||w.grenade)return;const am=a.ammo[a.cur];if(a.reloadT>0||am.mag>=w.mag||am.reserve<=0)return;a.reloadT=w.reload;scoped=a.isPlayer?false:scoped;if(a.isPlayer)Snd.reload();}
function finishReload(a){const w=WEAPONS[a.cur],am=a.ammo[a.cur];const need=w.mag-am.mag;const take=a.isPlayer?Math.min(need,am.reserve):need;am.mag+=take;if(a.isPlayer)am.reserve-=take;}
function playerSpread(){const p=player,w=WEAPONS[p.cur];const hs=Math.hypot(p.vel.x,p.vel.z);let s=(w.scope&&scoped)?w.scopeSpread:w.spread;
  s+=(w.moveSpread||0)*clamp((hs-1.2)/5,0,1);if(!p.onGround)s+=0.09;if(p.crouch)s*=0.7;if(w.auto)s+=Math.min(p.shots,12)*0.0011;return s;}
function updatePlayer(dt){const p=player;if(!p.alive){p.deathT+=dt;return;}
  const frozen=round.state==='freeze';const w=WEAPONS[p.cur];
  const wantC=keys.KeyC||keys.ControlLeft||keys.ControlRight;const th=wantC?1.25:1.8;
  if(th>p.height){if(!collide(p.pos.x,p.pos.y,p.pos.z,th,p.radius))p.height=Math.min(th,p.height+dt*7);}else p.height=Math.max(th,p.height-dt*7);
  p.crouch=p.height<1.6;
  const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);const y=p.yaw;
  let wx=-Math.sin(y)*f+Math.cos(y)*s,wz=-Math.cos(y)*f-Math.sin(y)*s;const wl=Math.hypot(wx,wz);if(wl>0){wx/=wl;wz/=wl;}
  const walk=keys.ShiftLeft||keys.ShiftRight;let spd=6.2*(w.mob||1)*(walk?0.52:1)*(p.crouch?0.42:1)*(scoped?0.62:1);if(frozen||p._planting||p._defusing)spd=0;
  if(p.onGround){const k=1-Math.exp(-(wl>0?11:9)*dt);p.vel.x+=(wx*spd-p.vel.x)*k;p.vel.z+=(wz*spd-p.vel.z)*k;
    if(keys.Space&&!frozen){p.vel.y=JUMP_V;p.onGround=false;}}
  else{p.vel.x+=wx*spd*2.2*dt;p.vel.z+=wz*spd*2.2*dt;const h=Math.hypot(p.vel.x,p.vel.z),mx=Math.max(spd,6.2*(w.mob||1));if(h>mx){p.vel.x*=mx/h;p.vel.z*=mx/h;}}
  const py=p.pos.y;p.stepUp=0;moveAgent(p,dt);if(p.stepUp)p.eyeOff-=p.stepUp;p.eyeOff*=Math.exp(-dt*14);
  const hs=Math.hypot(p.vel.x,p.vel.z);
  if(p.onGround&&hs>0.5){p.stepDist+=hs*dt;vmPhase+=hs*dt*1.6;if(p.stepDist>2.3){p.stepDist=0;if(!walk&&!p.crouch&&hs>3.6){Snd.step(null,0.25);p.noisyT=now;}}}
  // weapon
  if(p.fireCD>0)p.fireCD-=dt;if(p.switchT>0)p.switchT-=dt;
  if(p.reloadT>0){p.reloadT-=dt;if(p.reloadT<=0)finishReload(p);}
  if(w.melee||w.grenade||now-p.lastShot>w.rate*1.4){const k=Math.exp(-dt*8);p.recoilP*=k;p.recoilY*=k;}
  if(now-p.lastShot>0.35)p.shots=0;
  const want=w.auto?mouseDown:trigger;trigger=false;
  if(want&&p.fireCD<=0&&p.switchT<=0&&p.reloadT<=0&&!frozen&&!buyOpen){
    if(w.grenade){if(p.nades[w.grenade]>0){throwNade(p,w.grenade,p.yaw,p.pitch+0.1,keys._lob?9:15.5);p.nades[w.grenade]--;p.fireCD=0.7;nadeAnim=1;p.noisyT=now;
        setTimeout(()=>{if(p.alive&&WEAPONS[p.cur].grenade){const nt=NADE_TYPES.find(t=>p.nades[t]>0);switchTo(p.nades[p.cur]>0?p.cur:(p.inv.primary||'pistol'));}},450);}}
    else if(w.melee){p.fireCD=w.rate;knifeSwing=1;Snd.knife();const r=fireRay(p,p.yaw+p.recoilY,p.pitch+p.recoilP,0,w.range);
      if(r.victim){let ww=w;const back=Math.cos(r.victim.ai?r.victim.ai.aimY-p.yaw:0)>0.5;damage(r.victim,p,back?Object.assign({},w,{dmg:180}):w,'body',r.t);fxParts(r.end,'blood',null,8);hitMarker(r.victim.alive?false:true);}
      else if(r.t<w.range){fxParts(r.end,'dust',r.n,4);}}
    else{const am=p.ammo[p.cur];if(am.mag<=0){Snd.click();p.fireCD=0.25;if(am.reserve>0)startReload(p);}
      else{am.mag--;p.fireCD=w.rate;p.lastShot=now;p.shots++;vmKick=1;Snd.shot(w.snd);flashLight.position.copy(camera.position);flashLight.intensity=8;vmFlash.intensity=1.5;p.flashT=0.05;p.noisyT=now;
        const sp=playerSpread();const r=fireRay(p,p.yaw+p.recoilY,p.pitch+p.recoilP,sp,250);
        const st=_tmp.set(0.14,-0.12,-0.75).applyQuaternion(camera.quaternion).add(camera.position);fxTracer(st,r.end);
        {const q=camera.quaternion;const fw=_fw.set(0,0,-1).applyQuaternion(q);fxMuzzleSmoke(_ms.copy(st),fw,w.snd==='sniper');
         fxShell(_sp.set(0.1,-0.08,-0.32).applyQuaternion(q).add(camera.position),_rt.set(1,0,0).applyQuaternion(q),_up.set(0,1,0).applyQuaternion(q).addScaledVector(fw,-0.2),w.snd,p.vel);}
        if(r.victim){damage(r.victim,p,w,r.zone,r.t);fxParts(r.end,'blood',null,r.zone==='head'?10:6);hitMarker(r.zone==='head');Snd.hit(r.zone==='head');}
        else if(r.t<250){fxDecal(r.end,r.n);fxParts(r.end,'spark',r.n,3);}
        const rc=w.recoil*(1+Math.random()*0.25)*(p.shots<3?0.75:1);p.recoilP=Math.min(p.recoilP+rc,0.14);p.recoilY+=(Math.random()-0.5)*w.recoil*(p.shots>5?1.6:0.5);p.recoilY=clamp(p.recoilY,-0.06,0.06);
        if(w.scope&&scoped){scoped=false;p.rescope=true;}
        if(am.mag===0&&am.reserve>0)setTimeout(()=>{if(p.alive&&p.cur===w.id)startReload(p);},250);}}}
  if(p.rescope&&p.fireCD<=0){p.rescope=false;if(WEAPONS[p.cur].scope&&mouseDown2)scoped=true;}
  if(p.flashT>0){p.flashT-=dt;if(p.flashT<=0){flashLight.intensity=0;vmFlash.intensity=0;}}
  if(keys.KeyR)startReload(p);}
let mouseDown2=false;

// ================= BOTS =================
const DIFF={easy:{react:0.85,turn:3.0,err:0.17,minErr:0.045,spread:0.04,head:0.05,taken:0.5,burst:3,pause:0.6,fov:0.45,hear:10},
  normal:{react:0.48,turn:5.5,err:0.1,minErr:0.02,spread:0.018,head:0.12,taken:0.7,burst:5,pause:0.35,fov:0.3,hear:15},
  hard:{react:0.25,turn:9,err:0.06,minErr:0.009,spread:0.008,head:0.25,taken:0.9,burst:8,pause:0.2,fov:0.15,hear:20}};
function nearestWalkable(c,r){if(walkable(c,r))return [c,r];for(let d=1;d<5;d++)for(let dz=-d;dz<=d;dz++)for(let dx=-d;dx<=d;dx++)if(walkable(c+dx,r+dz))return [c+dx,r+dz];return null;}
function setPath(b,c,r){const ai=b.ai;const s=nearestWalkable(toCol(b.pos.x),toRow(b.pos.z)),e=nearestWalkable(c,r);if(!s||!e){ai.path=null;return false;}
  ai.path=astar(s[0],s[1],e[0],e[1]);ai.pi=0;ai.jit=[rand(-0.45,0.45),rand(-0.45,0.45)];return !!ai.path;}
function nextGoal(b){const ai=b.ai;let g=null;ai.onCrate=false;
  if(ai.lastSeen&&now-ai.lastSeenT<10){g={c:toCol(ai.lastSeen.x),r:toRow(ai.lastSeen.z),hold:[1,3]};ai.lastSeen=null;}
  else if(ai.goalQ.length)g=ai.goalQ.shift();
  else{const p=pick(ALLPTS);g=G(p,[1,5]);}
  ai.curGoal=g;if(!setPath(b,g.c,g.r))ai.wait=0.5;}
function perceive(b){const ai=b.ai,D=DIFF[diff];if(ai.blindT>0)return;const fx=-Math.sin(ai.aimY),fz=-Math.cos(ai.aimY);const eye=_tmp.set(b.pos.x,eyeY(b),b.pos.z);let best=null,bd=1e9;
  for(const e of agents){if(e.team===b.team||!e.alive)continue;const dx=e.pos.x-b.pos.x,dz=e.pos.z-b.pos.z;const dist=Math.hypot(dx,dz);if(dist>75)continue;
    const dot=(dx*fx+dz*fz)/(dist+1e-6);const alerted=now-ai.alertT<2.5;if(!(dot>D.fov||dist<3||alerted||e===ai.target&&ai.targetVisible))continue;
    const vis=visClear(eye,{x:e.pos.x,y:headY(e),z:e.pos.z})||visClear(eye,{x:e.pos.x,y:e.pos.y+e.height*0.55,z:e.pos.z});
    if(vis&&dist<bd){bd=dist;best=e;}}
  if(best){if(ai.target!==best||!ai.targetVisible){const dx=best.pos.x-b.pos.x,dz=best.pos.z-b.pos.z;const dot=(dx*fx+dz*fz)/(bd+1e-6);
      ai.react=D.react*rand(0.8,1.3)*(dot<0.8?1.35:1)*(ai.target===best?0.5:1);ai.errMag=D.err*(1+bd/45)*(dot<0.8?1.5:1);ai.headAim=Math.random()<D.head;ai.burst=0;ai.crouchFight=Math.random()<(WEAPONS[b.cur].scope?0.7:0.35);}
    const fresh=ai.target!==best||!ai.targetVisible;ai.target=best;ai.targetVisible=true;ai.lastSeen=best.pos.clone();ai.lastSeenT=now;if(b.team===player.team)best.spotT=now;
    // share info with nearby teammates
    if(fresh)for(const m of agents)if(!m.isPlayer&&m.alive&&m.team===b.team&&m!==b&&!m.ai.targetVisible&&m.pos.distanceTo(b.pos)<18&&Math.random()<0.35){m.ai.lastSeen=best.pos.clone();m.ai.lastSeenT=now;m.ai.path=null;m.ai.wait=0;}}
  else{if(ai.targetVisible){ai.targetVisible=false;ai.path=null;ai.wait=rand(0.2,0.8);}
    if(ai.target&&!ai.target.alive)ai.target=null;
    for(const e of agents){if(e.team===b.team||!e.alive)continue;if(now-e.noisyT<0.4&&e.pos.distanceTo(b.pos)<D.hear){ai.alertT=now;ai.lookAt=e.pos.clone();if(Math.random()<0.25){ai.lastSeen=e.pos.clone();ai.lastSeenT=now;ai.path=null;ai.wait=0;}}}}}
function botShoot(b){const ai=b.ai,D=DIFF[diff],w=WEAPONS[b.cur],am=b.ammo[b.cur];
  if(am.mag<=0){b.reloadT=w.reload;return;}
  am.mag--;b.fireCD=w.rate*(w.auto?1:rand(1.3,2.2));b.lastShot=now;
  const hs=Math.hypot(b.vel.x,b.vel.z);let sp=D.spread+(w.scope?0.001:w.spread)+(w.moveSpread||0)*clamp((hs-1.2)/5,0,1)*0.7+(w.auto?Math.min(ai.burst,8)*0.0015:0);
  const r=fireRay(b,ai.aimY,ai.aimP,sp,250);Snd.shot(w.snd,b.pos);b.model.flash.visible=true;b.flashT=0.05;
  const m=b.model.muzzleWorld(_r);fxTracer(m,r.end);
  if(m.distanceToSquared(camera.position)<900){const fw=_fw.set(-Math.sin(ai.aimY),0,-Math.cos(ai.aimY));fxMuzzleSmoke(_ms.copy(m),fw,w.snd==='sniper');
    fxShell(_sp.copy(m).addScaledVector(fw,-0.45).add(_up.set(0,0.03,0)),_rt.set(Math.cos(ai.aimY),0,-Math.sin(ai.aimY)),_up.set(0,1,0),w.snd,b.vel);}
  if(r.victim){damage(r.victim,b,w,r.zone,r.t);if(!r.victim.isPlayer&&r.t>1.5)fxParts(r.end,'blood',null,5);}else if(r.t<250){fxDecal(r.end,r.n);fxParts(r.end,'spark',r.n,2);}
  ai.burst++;if(w.auto&&ai.burst>=D.burst+((Math.random()*3)|0)){ai.burst=0;ai.burstPause=D.pause*rand(0.7,1.4);}
  ai.errMag=Math.max(D.minErr,ai.errMag*0.85);ai.phi+=rand(-1.5,1.5);}
function turnTo(cur,target,rate,dt){const d=angDiff(cur,target);const m=rate*dt;return Math.abs(d)<=m?target:cur+Math.sign(d)*m;}
function updateBot(b,dt){const ai=b.ai,D=DIFF[diff],m=b.model;
  if(!b.alive){b.deadT+=dt;const k=Math.min(1,b.deadT*3.5);m.update(dt,{vx:0,vz:0,yaw:b.yaw,pitch:0,crouch:false});return;}
  const frozen=round.state==='freeze';const w=WEAPONS[b.cur];b.crouching=false;
  if(b.fireCD>0)b.fireCD-=dt;if(ai.burstPause>0)ai.burstPause-=dt;
  if(b.reloadT>0){b.reloadT-=dt;if(b.reloadT<=0)finishReload(b);}
  if(b.flashT>0){b.flashT-=dt;if(b.flashT<=0)m.flash.visible=false;}
  ai.think-=dt;if(ai.think<=0&&!frozen){ai.think=rand(0.1,0.17);perceive(b);}
  let wantX=0,wantZ=0,spd=0;const tgt=ai.target;
  if(tgt&&tgt.alive&&ai.targetVisible&&!frozen){
    const ex=b.pos.x,ey=eyeY(b),ez=b.pos.z;const ty=ai.headAim?headY(tgt):tgt.pos.y+tgt.height*0.62;
    const dx=tgt.pos.x-ex,dz=tgt.pos.z-ez,hd=Math.hypot(dx,dz);const dy=ty-ey;
    ai.errMag=Math.max(D.minErr,ai.errMag*Math.exp(-dt*1.6));ai.phi+=dt*rand(-2,2);
    const desY=Math.atan2(-dx,-dz)+Math.cos(ai.phi)*ai.errMag,desP=Math.atan2(dy,hd)+Math.sin(ai.phi)*ai.errMag*0.6;
    ai.aimY=turnTo(ai.aimY,desY,D.turn,dt);ai.aimP+=(desP-ai.aimP)*Math.min(1,dt*D.turn*1.5);
    ai.react-=dt;
    if(ai.react<=0&&Math.abs(angDiff(ai.aimY,desY))<0.06+0.6/(hd+4)&&b.fireCD<=0&&b.reloadT<=0&&ai.burstPause<=0)botShoot(b);
    if(diff!=='easy'&&!w.scope){ai.strafeT-=dt;if(ai.strafeT<=0){ai.strafeT=rand(0.35,1.1);ai.strafe=Math.random()<0.5?-1:(Math.random()<0.4?0:1);}
      const rx=Math.cos(ai.aimY),rz=-Math.sin(ai.aimY);wantX=rx*ai.strafe;wantZ=rz*ai.strafe;spd=diff==='hard'?3.2:2.4;}
    if(ai.crouchFight||ai.onCrate){b.crouching=ai.crouchFight;spd*=ai.onCrate?0:0.35;}
  }else if(!frozen){
    const spx=botSpecial(b,dt);if(spx){wantX=spx[0];wantZ=spx[1];spd=spx[2];}
    else if(ai.wait>0){ai.wait-=dt;ai.scan+=dt;
      if(ai.lookAt){ai.aimY=turnTo(ai.aimY,Math.atan2(-(ai.lookAt.x-b.pos.x),-(ai.lookAt.z-b.pos.z)),D.turn*0.8,dt);if(now-ai.alertT>2)ai.lookAt=null;}
      else ai.aimY+=Math.sin(ai.scan*0.8)*dt*0.6;ai.aimP*=0.95;}
    else if(!ai.path||ai.pi>=ai.path.length){if(ai.path&&ai.curGoal&&ai.curGoal.climb&&!ai.onCrate){ai.climb=Object.assign({t:0,jumped:false,hold:ai.curGoal.hold},ai.curGoal.climb);ai.path=null;ai.curGoal=null;}
      else if(ai.path&&ai.curGoal){ai.wait=ai.curGoal.hold?rand(ai.curGoal.hold[0],ai.curGoal.hold[1]):rand(1,3);ai.path=null;
        const away=b.team===0?Math.PI:0;if(!ai.lookAt)ai.aimY=away+rand(-1.2,1.2);}else nextGoal(b);}
    else{if(now>ai.smoothT){ai.smoothT=now+0.18;advancePath(b);}const n=ai.path[ai.pi];const last=ai.pi===ai.path.length-1;const tx=cellX(n[0])+(last?ai.jit[0]:ai.jit[0]*0.5),tz=cellZ(n[1])+(last?ai.jit[1]:ai.jit[1]*0.5);
      const dx=tx-b.pos.x,dz=tz-b.pos.z,dd=Math.hypot(dx,dz);if(dd<0.55)ai.pi++;else{wantX=dx/dd;wantZ=dz/dd;spd=(w.mob||1)*5.6*(ai.lastSeen?0.85:1);
        const look=ai.lookAt?Math.atan2(-(ai.lookAt.x-b.pos.x),-(ai.lookAt.z-b.pos.z)):Math.atan2(-wantX,-wantZ);ai.aimY=turnTo(ai.aimY,look,D.turn*0.9,dt);ai.aimP*=0.93;if(ai.lookAt&&now-ai.alertT>2)ai.lookAt=null;}
      ai.stuckT+=dt;if(ai.stuckT>1.2){ai.stuckT=0;if(b.pos.distanceTo(ai.lastPos)<0.4){if(b.onGround)b.vel.y=JUMP_V*0.9;ai.path=null;ai.goalQ.unshift(ai.curGoal||G(pick(ALLPTS),[1,3]));}ai.lastPos.copy(b.pos);}}}
  {const th=b.crouching?1.32:1.8;if(th>b.height){if(!collide(b.pos.x,b.pos.y,b.pos.z,th,b.radius))b.height=Math.min(th,b.height+dt*6);}else b.height=Math.max(th,b.height-dt*6);}
  const k=1-Math.exp(-10*dt);b.vel.x+=(wantX*spd-b.vel.x)*k;b.vel.z+=(wantZ*spd-b.vel.z)*k;
  moveAgent(b,dt);
  const hs=Math.hypot(b.vel.x,b.vel.z);b.stepDist+=hs*dt;if(hs>3.5){if(b.stepDist>2.4){b.stepDist=0;b.noisyT=now;Snd.step(b.pos,0.9);}}
  b.walkPhase=(b.walkPhase||0)+hs*dt*2.4;const sw=Math.sin(b.walkPhase)*Math.min(1,hs/3)*0.6;
  m.root.position.copy(b.pos);m.root.rotation.set(0,ai.aimY,0);if(m.cur!==b.cur)m.setWeapon(b.cur);m.update(dt,{vx:b.vel.x,vz:b.vel.z,yaw:ai.aimY,pitch:ai.aimP,crouch:b.height<1.6});
  b.yaw=ai.aimY;}
function separate(){const list=agents.filter(a=>a.alive);for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z;const d=Math.hypot(dx,dz);
  if(d<0.62&&d>1e-4&&Math.abs(a.pos.y-b.pos.y)<1.5){const push=(0.62-d)*0.5,nx=dx/d,nz=dz/d;
    if(!a.isPlayer&&!collide(a.pos.x-nx*push,a.pos.y,a.pos.z-nz*push,a.height,a.radius)){a.pos.x-=nx*push;a.pos.z-=nz*push;}
    if(!b.isPlayer&&!collide(b.pos.x+nx*push,b.pos.y,b.pos.z+nz*push,b.height,b.radius)){b.pos.x+=nx*push;b.pos.z+=nz*push;}}}}
