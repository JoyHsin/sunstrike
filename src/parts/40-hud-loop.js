// ================= HUD =================
const hud={flash:0,dmgT:0,dmgAng:0,hitT:0,bannerT:0,msgT:0,cache:{}};
function setT(id,v){if(hud.cache[id]!==v){hud.cache[id]=v;$(id).innerHTML=v;}}
function banner(a,b,t){$('banner').textContent=a;$('subbanner').textContent=b||'';hud.bannerT=t;}
function msg(t){$('msg').textContent=t;hud.msgT=2.2;}
function hitMarker(hs){const h=$('hitmark');h.classList.toggle('hs',!!hs);hud.hitT=0.22;}
function addKill(att,v,w,hs){const kf=$('killfeed');const d=document.createElement('div');d.className='kf'+((att&&att.isPlayer)||v.isPlayer?' me':'');
  d.innerHTML=(att?`<span class="c${att.team}">${att.name}</span>`:'')+`<span class="w">[${SHORT[w.id]}]</span>`+(hs?'<span class="hs">爆头</span>':'')+`<span class="c${v.team}">${v.name}</span>`;
  kf.appendChild(d);while(kf.children.length>6)kf.removeChild(kf.firstChild);setTimeout(()=>d.remove(),7000);}
const mm=$('minimap').getContext('2d');const MMS=2.3,MMOX=4,MMOY=6;
const mmBg=(()=>{const c=document.createElement('canvas');c.width=190;c.height=150;const g=c.getContext('2d');
  for(let r=0;r<MH;r++)for(let cc=0;cc<MW;cc++){const k=MAP[r][cc];g.fillStyle=k==='#'?'rgba(20,24,30,0.9)':k==='A'||k==='B'?'rgba(170,120,90,0.55)':'x X w C'.includes(k)?'rgba(90,80,60,0.8)':'rgba(150,150,150,0.45)';
    g.fillRect(MMOX+(cc*CELL)*MMS,MMOY+(r*CELL)*MMS,CELL*MMS+0.6,CELL*MMS+0.6);}
  g.fillStyle='#ff5a4a';g.font='bold 14px sans-serif';g.fillText('A',MMOX+5*CELL*MMS,MMOY+4.6*CELL*MMS);g.fillText('B',MMOX+30.5*CELL*MMS,MMOY+4.6*CELL*MMS);return c;})();
const mmX=x=>MMOX+(x/CELL+MW/2)*CELL*MMS,mmY=z=>MMOY+(z/CELL+MH/2)*CELL*MMS;
function drawMinimap(){mm.clearRect(0,0,190,150);mm.drawImage(mmBg,0,0);
  for(const a of agents){if(a.isPlayer)continue;const x=mmX(a.pos.x),y=mmY(a.pos.z);
    if(a.team===0){mm.fillStyle=a.alive?'#5fa8ff':'rgba(95,168,255,0.35)';}else{if(a.alive&&now-a.spotT>2.5)continue;mm.fillStyle=a.alive?'#ff4b3b':'rgba(255,75,59,0.35)';}
    if(a.alive){mm.beginPath();mm.arc(x,y,3,0,TAU);mm.fill();}else{mm.fillRect(x-2,y-2,4,4);}}
  if(player.alive){const x=mmX(player.pos.x),y=mmY(player.pos.z),yw=player.yaw;mm.fillStyle='#fff';mm.beginPath();
    mm.moveTo(x-Math.sin(yw)*7,y-Math.cos(yw)*7);mm.lineTo(x+Math.cos(yw)*4,y-Math.sin(yw)*4);mm.lineTo(x-Math.cos(yw)*4,y+Math.sin(yw)*4);mm.closePath();mm.fill();}}
function renderBuy(){const ok=canBuy();setT('buy',`<h2>购买菜单　<span style="color:#7dff8a">$${player.money}</span></h2><div class="sub">${ok?'按数字键购买，按 B 关闭':'当前不在购买时间'}</div>`+
  BUYLIST.map(it=>`<div class="bi ${(!ok||player.money<it.price)?'no':''}"><span><span class="k">${it.k}</span>${it.label}</span><span class="p">$${it.price}</span></div>`).join(''));}
function renderScore(){const row=a=>`<tr class="${a.alive?'':'dead'}"><td>${a.name}${a.isPlayer?' ★':''}</td><td>${a.kills}</td><td>${a.deaths}</td><td>${a.alive?a.hp:'阵亡'}</td></tr>`;
  $('scoreboard').innerHTML=`<table><tr><th style="color:#7fb5ff">防守方 ${round.score[0]}</th><th>击杀</th><th>死亡</th><th>生命</th></tr>${agents.filter(a=>a.team===0).map(row).join('')}
  <tr><th style="color:#ffb35c;padding-top:14px">进攻方 ${round.score[1]}</th><th></th><th></th><th></th></tr>${agents.filter(a=>a.team===1).map(row).join('')}</table>`;}
let fpsAcc=0,fpsN=0,fpsShown=0;
function updateHUD(dt){const p=player;const view=p.alive?p:specTarget();
  const t=Math.max(0,Math.ceil(round.t));const tt=round.state==='freeze'?`0:${String(t).padStart(2,'0')}`:`${(t/60)|0}:${String(t%60).padStart(2,'0')}`;setT('timer',tt);$('timer').classList.toggle('warn',round.state==='live'&&round.t<15);
  setT('sct',round.score[0]);setT('st',round.score[1]);setT('alive',`存活 <span style="color:#7fb5ff">${aliveCount(0)}</span> vs <span style="color:#ffb35c">${aliveCount(1)}</span>`);
  if(view){setT('hpval',Math.ceil(view.hp));$('hpval').classList.toggle('low',view.hp<30);setT('arval',Math.ceil(view.armor)+(view.helmet?'<small style="font-size:14px">⛑</small>':''));
    const w=WEAPONS[view.cur];setT('wname',w.name);
    if(w.melee)setT('ammo','—');else{const am=view.ammo[view.cur];setT('ammo',`${am.mag} <small>/ ${view.isPlayer?am.reserve:'∞'}</small>`);}
    setT('reloadtip',view.reloadT>0?'换弹中…':(!w.melee&&view.ammo[view.cur].mag===0?'按 R 换弹':''));}
  setT('money','$'+p.money);
  setT('slots',[['1',p.inv.primary],['2',p.inv.secondary],['3','knife']].map(([k,id])=>id?`<div class="${p.cur===id?'on':''}">${k}　${WEAPONS[id].name}</div>`:`<div>${k}　—</div>`).join(''));
  // crosshair
  const showCH=p.alive&&!scoped;$('crosshair').style.display=showCH?'block':'none';
  if(showCH){const w=WEAPONS[p.cur];const gap=w.melee?4:4+playerSpread()*innerHeight*0.6;const g=Math.min(gap,60);
    $('chl').style.left=(-g-8)+'px';$('chr').style.left=g+'px';$('cht').style.top=(-g-8)+'px';$('chb').style.top=g+'px';}
  $('scope').classList.toggle('hidden',!(scoped&&p.alive));
  hud.hitT-=dt;$('hitmark').style.opacity=hud.hitT>0?1:0;
  hud.flash=Math.max(0,hud.flash-dt*1.5);$('dmgflash').style.opacity=hud.flash;
  hud.dmgT-=dt;if(hud.dmgT>0){$('dmgarc').style.opacity=Math.min(1,hud.dmgT);$('dmgdir').style.transform=`rotate(${(-(hud.dmgAng-p.yaw)+Math.PI)}rad)`;}else $('dmgarc').style.opacity=0;
  hud.bannerT-=dt;$('center').style.opacity=hud.bannerT>0?Math.min(1,hud.bannerT*2):0;
  hud.msgT-=dt;$('msg').style.opacity=hud.msgT>0?Math.min(1,hud.msgT*2):0;
  const sp=$('spect');if(!p.alive&&round.state!=='menu'){sp.classList.remove('hidden');const s=specTarget();sp.innerHTML=s?`你已阵亡 · 正在观战：<b style="color:#7fb5ff">${s.name}</b>（点击切换）`:'你已阵亡 · 队友已全部阵亡';}else sp.classList.add('hidden');
  $('buy').classList.toggle('hidden',!buyOpen);if(buyOpen)renderBuy();
  if(keys.Tab){$('scoreboard').classList.remove('hidden');renderScore();}else $('scoreboard').classList.add('hidden');
  drawMinimap();
  fpsAcc+=dt;fpsN++;if(fpsAcc>0.5){fpsShown=Math.round(fpsN/fpsAcc);fpsAcc=0;fpsN=0;setT('fps',fpsShown+' FPS');}}

// ================= CAMERA / VIEWMODEL =================
function specTarget(){const mates=agents.filter(a=>!a.isPlayer&&a.team===player.team&&a.alive);if(!mates.length)return null;if(specIdx<0||specIdx>=mates.length)specIdx=0;return mates[specIdx];}
function updateCamera(dt){const p=player;agents.forEach(a=>{if(a.model&&a.alive)a.model.root.visible=true;});
  if(round.state==='menu'){const t=now*0.04;camera.position.set(Math.sin(t)*20,20,Math.cos(t)*15);camera.lookAt(0,0,0);return;}
  if(p.alive){camera.position.set(p.pos.x,eyeY(p),p.pos.z);camera.rotation.set(p.pitch+p.recoilP,p.yaw+p.recoilY,0);
    const fov=scoped?(keys._zoom2?12:24):78;camera.fov+=(fov-camera.fov)*Math.min(1,dt*20);if(Math.abs(camera.fov-fov)<0.1)camera.fov=fov;camera.updateProjectionMatrix();}
  else{camera.fov=78;camera.updateProjectionMatrix();
    if(p.deathT<1.6||!specTarget()){const k=Math.min(1,p.deathT*2);camera.position.set(p.pos.x,p.pos.y+1.68-1.3*k,p.pos.z);camera.rotation.set(p.pitch*(1-k)-0.3*k,p.yaw,0.5*k);}
    else{const s=specTarget();s.model.root.visible=false;camera.position.set(s.pos.x,eyeY(s),s.pos.z);camera.rotation.set(s.ai.aimP,s.ai.aimY,0);}}}
const vmSway={x:0,y:0};
function updateViewmodel(dt){vmSway.x*=Math.exp(-dt*8);vmSway.y*=Math.exp(-dt*8);const p=player;for(const k of ['rifle','smg','sniper','pistol','knife'])VM[k].visible=false;VM.flash.visible=false;
  if(!p.alive||round.state==='menu'||scoped)return;const g=VM[p.cur];g.visible=true;
  const hs=Math.hypot(p.vel.x,p.vel.z);const bob=Math.min(1,hs/6)*(p.onGround?1:0.2);vmKick*=Math.exp(-dt*14);knifeSwing=Math.max(0,knifeSwing-dt*3);
  const P0=g.userData.pos;let x=P0[0]+Math.cos(vmPhase)*0.01*bob+vmSway.x,y=P0[1]+Math.abs(Math.sin(vmPhase))*0.012*bob-clamp(p.vel.y*0.002,-0.03,0.03)+vmSway.y,z=P0[2]+vmKick*0.05,rx=vmKick*0.09,ry=0,rz=0;
  if(p.reloadT>0){const w=WEAPONS[p.cur];const k=Math.sin(Math.PI*(1-p.reloadT/w.reload));rx-=k*0.55;y-=k*0.08;rz+=k*0.3;}
  if(p.switchT>0){y-=p.switchT*0.5;rx-=p.switchT*1.2;}
  if(knifeSwing>0){const s=Math.sin(knifeSwing*Math.PI);ry+=s*0.9;rx-=s*0.4;x-=s*0.1;z-=s*0.12;}
  if(p.crouch){y+=0.01;}
  vmRoot.position.set(x,y,z);vmRoot.rotation.set(rx+0.02,ry+(p.cur==='pistol'||p.cur==='knife'?0.03:0.075),rz-0.03);
  if(p.flashT>0&&!WEAPONS[p.cur].melee){VM.flash.visible=true;VM.flash.position.copy(g.userData.muzzle);VM.flash.position.applyEuler(g.rotation).add(g.position);VM.flash.rotation.z=Math.random()*TAU;}}

// ================= INPUT =================
function requestLock(){if(noLock){locked=true;onLockChange();return;}try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{$('pausenote').textContent='鼠标锁定失败，请稍等一秒后再点击';});}catch(e){}}
function releaseLock(){if(document.pointerLockElement)document.exitPointerLock();}
function onLockChange(){if(!noLock)locked=document.pointerLockElement===canvas;const playing=round.state!=='menu'&&round.state!=='over';
  if(locked&&paused){paused=false;$('pause').classList.add('hidden');}
  else if(!locked&&playing&&!paused){pause();}}
document.addEventListener('pointerlockchange',onLockChange);
function pause(){paused=true;$('pause').classList.remove('hidden');$('pausenote').textContent='点击“继续游戏”重新锁定鼠标';mouseDown=false;for(const k in keys)keys[k]=false;}
addEventListener('keydown',e=>{if(e.code==='Tab'||e.code==='Space'||e.code==='Slash')e.preventDefault();
  if(round.state==='menu'||round.state==='over'||paused){return;}
  keys[e.code]=true;const p=player;
  if(buyOpen&&/^Digit[1-6]$/.test(e.code)){buy(+e.code.slice(5)-1);return;}
  if(e.code==='KeyB'){buyOpen=!buyOpen&&canBuy();if(!canBuy()&&!buyOpen)msg('当前不在购买时间');return;}
  if(e.code==='Escape'&&buyOpen){buyOpen=false;return;}
  if(!p.alive)return;
  if(e.code==='Digit1'&&p.inv.primary)switchTo(p.inv.primary);
  if(e.code==='Digit2')switchTo(p.inv.secondary);
  if(e.code==='Digit3')switchTo('knife');
  if(e.code==='KeyQ'){/* quick switch */const last=p.cur==='knife'?(p.inv.primary||'pistol'):(p.cur===p.inv.primary?'pistol':(p.inv.primary||'knife'));switchTo(last);}
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseDown=false;});
document.addEventListener('mousemove',e=>{if(!locked||paused||round.state==='menu')return;const p=player;if(!p.alive)return;const s=0.0022*sens*(scoped?0.38:1);
  p.yaw-=e.movementX*s;p.pitch=clamp(p.pitch-e.movementY*s,-1.5,1.5);vmSway.x=clamp(vmSway.x+e.movementX*0.00004,-0.02,0.02);vmSway.y=clamp(vmSway.y-e.movementY*0.00004,-0.02,0.02);});
canvas.addEventListener('mousedown',e=>{if(round.state==='menu'||round.state==='over')return;if(!locked){if(!paused)requestLock();return;}if(paused)return;
  if(!player.alive){specIdx++;return;}
  if(e.button===0||(e.button===2&&e.ctrlKey)){mouseDown=true;trigger=true;}
  else if(e.button===2){mouseDown2=true;if(WEAPONS[player.cur].scope&&player.reloadT<=0){if(!scoped){scoped=true;keys._zoom2=false;}else if(!keys._zoom2)keys._zoom2=true;else{scoped=false;keys._zoom2=false;}}}});
addEventListener('mouseup',e=>{if(e.button===0||e.button===2&&e.ctrlKey)mouseDown=false;if(e.button===2)mouseDown2=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
// menu
document.querySelectorAll('.diff').forEach(b=>b.onclick=()=>{document.querySelectorAll('.diff').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');diff=b.dataset.d;});
let initialMoney=3000;
document.querySelectorAll('.start-money').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.start-money').forEach(x=>x.classList.remove('sel'));
  b.classList.add('sel');
  initialMoney=+b.dataset.m;
  const cm=$('custom-money');if(cm)cm.value='';
});
const customMoneyInput=$('custom-money');
if(customMoneyInput){
  customMoneyInput.oninput=e=>{
    const v=parseInt(e.target.value,10);
    if(!isNaN(v)&&v>=0){
      document.querySelectorAll('.start-money').forEach(x=>x.classList.remove('sel'));
      initialMoney=clamp(v,0,16000);
    }
  };
}
document.querySelectorAll('.q').forEach(b=>b.onclick=()=>{document.querySelectorAll('.q').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');setQuality(b.dataset.q);});
function setQuality(q){quality=q;applySize();const ms=q==='low'?2048:4096;
  if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}}
$('sens').oninput=e=>{sens=+e.target.value;$('sensv').textContent=sens.toFixed(2);};
function beginGame(){Snd.init();Snd.resume();$('menu').classList.add('hidden');$('hud').classList.remove('hidden');paused=false;startMatch(diff,initialMoney);requestLock();}
$('startbtn').onclick=beginGame;
$('resumebtn').onclick=()=>{Snd.resume();requestLock();};
function toMenu(){round.state='menu';paused=false;$('pause').classList.add('hidden');$('over').classList.add('hidden');$('hud').classList.add('hidden');$('menu').classList.remove('hidden');releaseLock();
  agents.forEach(a=>{if(a.model)a.model.root.visible=false;});}
$('quitbtn').onclick=toMenu;$('menubtn').onclick=toMenu;
$('againbtn').onclick=()=>{$('over').classList.add('hidden');startMatch(diff,initialMoney);requestLock();};
agents.forEach(a=>{if(a.model)a.model.root.visible=false;});

// ================= RENDER PIPELINE =================
let quality='high';
const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:4}));
const rpMain=new RenderPass(scene,camera);composer.addPass(rpMain);
// GTAO ambient occlusion on the world (not on the viewmodel) — high quality only
const gtao=new GTAOPass(scene,camera,innerWidth,innerHeight);gtao.output=GTAOPass.OUTPUT.Default;gtao.blendIntensity=1.0;
gtao.updateGtaoMaterial({radius:1.1,distanceExponent:1.3,thickness:1.5,scale:1.35,samples:12,distanceFallOff:1.0,screenSpaceRadius:false});
gtao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12});composer.addPass(gtao);
// transparent things (sprites, smoke, puddles, clouds, tracers) must not enter GTAO's depth/normal pre-pass
{const hide=[];scene.traverse(o=>{if(o.isSprite||o.isLine||o.isPoints||(o.isMesh&&o.material&&!Array.isArray(o.material)&&o.material.transparent))hide.push(o);});
  const orig=gtao.render.bind(gtao);gtao.render=function(...args){const vis=hide.map(o=>o.visible);for(const o of hide)o.visible=false;orig(...args);hide.forEach((o,i)=>o.visible=vis[i]);};}
const rpVm=new RenderPass(vmScene,vmCam);rpVm.clear=false;rpVm.clearDepth=true;composer.addPass(rpVm);
const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),0.32,0.45,1.05);composer.addPass(bloom);
composer.addPass(new OutputPass());
// colour grading (after tone mapping, in display space): contrast, saturation, split toning, vignette
const GradeShader={uniforms:{tDiffuse:{value:null},contrast:{value:1.07},saturation:{value:1.1},shadowTint:{value:new THREE.Vector3(0.96,1.0,1.06)},highTint:{value:new THREE.Vector3(1.04,1.0,0.94)},vignette:{value:0.28}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float contrast,saturation,vignette;uniform vec3 shadowTint,highTint;varying vec2 vUv;
  void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 col=c.rgb;float l=dot(col,vec3(0.2126,0.7152,0.0722));
    col=mix(vec3(l),col,saturation);col=(col-0.5)*contrast+0.5;col*=mix(shadowTint,highTint,smoothstep(0.15,0.85,l));
    vec2 q=vUv-0.5;col*=1.0-vignette*smoothstep(0.25,0.85,dot(q,q)*2.2);gl_FragColor=vec4(clamp(col,0.0,1.0),c.a);}`};
const grade=new ShaderPass(GradeShader);composer.addPass(grade);
function applySize(){const dpr=quality==='low'?1:Math.min(window.devicePixelRatio||1,2,2880/Math.max(1,innerWidth));renderer.setPixelRatio(dpr);renderer.setSize(innerWidth,innerHeight,false);
  composer.setPixelRatio(dpr);composer.setSize(innerWidth,innerHeight);camera.aspect=vmCam.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();vmCam.updateProjectionMatrix();}
addEventListener('resize',applySize);applySize();
// ================= MAIN LOOP =================
function update(dt){now+=dt;CLOUDS.material.uniforms.time.value+=dt;
  if(round.state!=='menu'&&round.state!=='over'){updatePlayer(dt);for(const a of agents)if(!a.isPlayer)updateBot(a,dt);separate();updateRound(dt);}
  updateFX(dt);}
let last=performance.now();
renderer.info.autoReset=false;
function frame(t){requestAnimationFrame(frame);renderer.info.reset();let dt=(t-last)/1000;last=t;if(dt>0.05)dt=0.05;if(dt<0)dt=0;
  if(!paused)update(dt);else if(round.state==='menu')now+=dt;
  if(round.state==='menu')now+=0;
  updateCamera(dt);updateViewmodel(dt);if(round.state!=='menu')updateHUD(dt);
  if(quality==='high'){composer.render(dt);}else{renderer.clear();renderer.render(scene,camera);renderer.clearDepth();renderer.render(vmScene,vmCam);}}
requestAnimationFrame(frame);

// ================= TEST HOOKS =================
window.GAME={texMs:TEXGEN_MS,SHELLS,DEBRIS,scene,clouds:CLOUDS,gtao:gtao,grade:grade,camera,renderInfo:()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles}),quality:q=>setQuality(q),
  start(d,m){noLock=true;locked=true;Snd.init();$('menu').classList.add('hidden');$('hud').classList.remove('hidden');paused=false;startMatch(d||'normal',m||initialMoney);},
  step(sec,dtS){const dt=dtS||1/60;for(let t=0;t<sec;t+=dt)update(dt);},
  info(){return {state:round.state,num:round.num,score:round.score.slice(),t:round.t,alive:[aliveCount(0),aliveCount(1)],hp:player.hp,money:player.money,
    kills:agents.map(a=>a.name+':'+a.kills+'/'+a.deaths),pos:agents.map(a=>a.name+'@'+toCol(a.pos.x)+','+toRow(a.pos.z)+(a.alive?'':'x'))};},
  look(y,p){player.yaw=y;player.pitch=p||0;},player:()=>player,agents:()=>agents,keys,buy,setGod(v){if(v){player._god=true;}},
  fire(){trigger=true;mouseDown=true;setTimeout(()=>mouseDown=false,300);},buyOpen(v){buyOpen=v;},
};
$('loading').remove();
