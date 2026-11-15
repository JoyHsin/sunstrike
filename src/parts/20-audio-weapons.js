// ================= AUDIO =================
const Snd={ctx:null,master:null,noise:null,
  init(){if(this.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=0.55;this.master.connect(this.ctx.destination);
    const len=this.ctx.sampleRate*1.0;const b=this.ctx.createBuffer(1,len,this.ctx.sampleRate);const d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;this.noise=b;}catch(e){this.ctx=null;}},
  resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();},
  out(pos,vol){const c=this.ctx;const g=c.createGain();g.gain.value=vol;
    if(pos){const dx=pos.x-camera.position.x,dz=pos.z-camera.position.z,dy=pos.y-camera.position.y;const dist=Math.hypot(dx,dy,dz);
      g.gain.value=vol/(1+dist*dist*0.012);if(g.gain.value<0.004)return null;
      const p=c.createStereoPanner?c.createStereoPanner():null;if(p){const rx=Math.cos(camYaw()),rz=-Math.sin(camYaw());p.pan.value=clamp((dx*rx+dz*rz)/(dist+1),-0.85,0.85);g.connect(p);p.connect(this.master);}else g.connect(this.master);}
    else g.connect(this.master);return g;},
  burst(dest,t0,dur,type,freq,q,gain){const c=this.ctx;const s=c.createBufferSource();s.buffer=this.noise;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||1;const g=c.createGain();
    g.gain.setValueAtTime(gain,t0);g.gain.exponentialRampToValueAtTime(0.001,t0+dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t0,Math.random()*0.5);s.stop(t0+dur+0.02);},
  tone(dest,t0,dur,f0,f1,type,gain){const c=this.ctx;const o=c.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f0,t0);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t0+dur);const g=c.createGain();
    g.gain.setValueAtTime(gain,t0);g.gain.exponentialRampToValueAtTime(0.001,t0+dur);o.connect(g);g.connect(dest);o.start(t0);o.stop(t0+dur+0.02);},
  shot(kind,pos){if(!this.ctx)return;const d=this.out(pos,pos?1.4:1);if(!d)return;const t=this.ctx.currentTime;
    const P={rifle:[2200,0.18,1.0,110],smg:[2800,0.12,0.8,140],sniper:[1500,0.45,1.3,70],pistol:[3200,0.11,0.75,160]}[kind]||[2500,0.15,0.8,120];
    this.burst(d,t,P[1],'lowpass',P[0],0.7,P[2]);this.burst(d,t,0.04,'highpass',3000,0.5,P[2]*0.6);this.tone(d,t,P[1]*0.9,P[3],35,'sine',P[2]*0.9);},
  knife(){if(!this.ctx)return;const d=this.out(null,0.5);this.burst(d,this.ctx.currentTime,0.16,'bandpass',2500,2,0.6);},
  click(){if(!this.ctx)return;const d=this.out(null,0.4);this.tone(d,this.ctx.currentTime,0.03,1800,900,'square',0.3);},
  reload(){if(!this.ctx)return;const d=this.out(null,0.45);const t=this.ctx.currentTime;this.burst(d,t+0.25,0.05,'bandpass',1500,3,0.7);this.burst(d,t+0.9,0.06,'bandpass',900,3,0.8);this.burst(d,t+1.5,0.05,'bandpass',2000,3,0.7);},
  hit(head){if(!this.ctx)return;const d=this.out(null,0.5);const t=this.ctx.currentTime;if(head){this.tone(d,t,0.18,1900,1700,'triangle',0.5);this.tone(d,t,0.25,2850,2800,'sine',0.25);}else this.tone(d,t,0.05,950,700,'square',0.18);},
  hurt(){if(!this.ctx)return;const d=this.out(null,0.6);const t=this.ctx.currentTime;this.burst(d,t,0.12,'lowpass',500,1,0.8);this.tone(d,t,0.12,180,90,'sine',0.5);},
  step(pos,vol){if(!this.ctx)return;const d=this.out(pos,vol);if(!d)return;this.burst(d,this.ctx.currentTime,0.07,'lowpass',380+Math.random()*120,1,0.9);},
  jingle(win){if(!this.ctx)return;const d=this.out(null,0.35);const t=this.ctx.currentTime;(win?[523,659,784,1046]:[440,370,311,262]).forEach((f,i)=>this.tone(d,t+i*0.13,0.35,f,0,'triangle',0.35));},
  explode(pos,big){if(!this.ctx)return;const d=this.out(pos,1.6*(big||1));if(!d)return;const t=this.ctx.currentTime;this.burst(d,t,1.2*(big>1?1.6:1),'lowpass',700,0.7,1.4);this.burst(d,t,0.25,'lowpass',2400,0.6,1.0);this.tone(d,t,0.9,90,28,'sine',1.2);},
  flashbang(pos){if(!this.ctx)return;const d=this.out(pos,1.4);if(!d)return;const t=this.ctx.currentTime;this.burst(d,t,0.35,'highpass',1200,0.5,1.2);this.tone(d,t,0.2,160,50,'sine',0.8);},
  ring(a){if(!this.ctx)return;const d=this.out(null,0.25*a);const t=this.ctx.currentTime;this.tone(d,t,1.5+a*2.5,3100,3000,'sine',0.35*a);},
  smokePop(pos){if(!this.ctx)return;const d=this.out(pos,0.8);if(!d)return;const t=this.ctx.currentTime;this.burst(d,t,0.15,'bandpass',900,1,0.6);this.burst(d,t+0.05,2.2,'bandpass',2600,0.6,0.35);},
  nadeThrow(){if(!this.ctx)return;const d=this.out(null,0.35);this.burst(d,this.ctx.currentTime,0.18,'bandpass',800,1.5,0.5);},
  nadeBounce(pos){if(!this.ctx)return;const d=this.out(pos,0.5);if(!d)return;const t=this.ctx.currentTime;this.tone(d,t,0.06,1300+Math.random()*400,600,'triangle',0.4);this.burst(d,t,0.04,'bandpass',2000,2,0.3);},
  bombBeep(pos,k){if(!this.ctx)return;const d=this.out(pos,0.55);if(!d)return;this.tone(d,this.ctx.currentTime,0.09,k<0.25?1900:1500,0,'square',0.25);},
  planted(){if(!this.ctx)return;const d=this.out(null,0.4);const t=this.ctx.currentTime;[0,0.12,0.24].forEach(o=>this.tone(d,t+o,0.08,1600,0,'square',0.2));},
  defuseStart(pos){if(!this.ctx)return;const d=this.out(pos,0.4);if(!d)return;this.burst(d,this.ctx.currentTime,0.08,'bandpass',3000,3,0.5);},
  defused(){if(!this.ctx)return;const d=this.out(null,0.4);const t=this.ctx.currentTime;this.tone(d,t,0.25,700,350,'triangle',0.4);},
  tink(pos){if(!this.ctx)return;const d=this.out(pos,0.16);if(!d)return;const t=this.ctx.currentTime;const f=3800+Math.random()*1800;this.tone(d,t,0.07,f,f*0.97,'sine',0.35);this.tone(d,t+0.004,0.05,f*1.52,0,'sine',0.15);},
  beep(){if(!this.ctx)return;const d=this.out(null,0.3);this.tone(d,this.ctx.currentTime,0.12,880,0,'square',0.15);},
  buy(){if(!this.ctx)return;const d=this.out(null,0.3);const t=this.ctx.currentTime;this.tone(d,t,0.08,1200,0,'square',0.15);this.tone(d,t+0.08,0.1,1600,0,'square',0.15);}
};

// ================= WEAPONS =================
const WEAPONS={
  rifle:{id:'rifle',name:'突击步枪 AR-7',slot:1,dmg:34,rate:0.1,auto:true,mag:30,reserve:90,reload:2.4,spread:0.0035,moveSpread:0.075,recoil:0.0105,pen:0.78,mob:0.9,reward:300,price:2700,snd:'rifle',falloff:0.98},
  smg:{id:'smg',name:'冲锋枪 MK-5',slot:1,dmg:26,rate:0.075,auto:true,mag:30,reserve:120,reload:2.1,spread:0.007,moveSpread:0.025,recoil:0.0075,pen:0.6,mob:1.0,reward:600,price:1250,snd:'smg',falloff:0.86},
  sniper:{id:'sniper',name:'狙击步枪 LR-9',slot:1,dmg:115,headMult:4,rate:1.45,auto:false,mag:5,reserve:20,reload:3.4,spread:0.07,scopeSpread:0.0006,moveSpread:0.16,recoil:0.045,pen:0.97,mob:0.82,reward:100,price:4750,snd:'sniper',falloff:0.99,scope:true},
  pistol:{id:'pistol',name:'手枪 P-12',slot:2,dmg:30,rate:0.15,auto:false,mag:12,reserve:36,reload:2.1,spread:0.006,moveSpread:0.03,recoil:0.02,pen:0.5,mob:1.0,reward:300,price:0,snd:'pistol',falloff:0.85},
  knife:{id:'knife',name:'战术匕首',slot:3,dmg:55,rate:0.5,melee:true,range:2.1,mob:1.08,reward:1500}
};
const BUYLIST=[{k:'1',id:'smg',label:'冲锋枪 MK-5',price:1250},{k:'2',id:'rifle',label:'突击步枪 AR-7',price:2700},{k:'3',id:'sniper',label:'狙击步枪 LR-9',price:4750},
  {k:'4',id:'pistolammo',label:'手枪弹药补满',price:100},{k:'5',id:'kevlar',label:'防弹衣（100 护甲）',price:650},{k:'6',id:'helmet',label:'防弹衣 + 头盔',price:1000}];

