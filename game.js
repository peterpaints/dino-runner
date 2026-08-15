(() => {
'use strict';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height, GROUND = 256;
ctx.imageSmoothingEnabled = false;

const load = (k,d) => { try { const v=localStorage.getItem(k); return v===null?d:v; } catch { return d; } };
const save = (k,v) => { try { localStorage.setItem(k,String(v)); } catch {} };
let hi = parseInt(load('trex.hi','0'),10)||0;
let muted = load('trex.muted','0') === '1';
let state='idle', score=0, speed=6.2, spawn=500, last=0, time=0;
let duckHeld=false, pointerY=0;
const dino={x:72,y:GROUND,vy:0,w:48,h:58,onGround:true,duck:false,step:0};
const obstacles=[], dust=[];
const stars=Array.from({length:45},()=>({x:Math.random()*W,y:Math.random()*170,s:Math.random()<.18?2:1,p:Math.random()*6.28}));
const clouds=Array.from({length:5},()=>({x:Math.random()*W,y:30+Math.random()*85}));

const hiTop=document.getElementById('hiTop');
const netEl=document.getElementById('net'), netTxt=document.getElementById('netTxt');
const btnSound=document.getElementById('btnSound'), btnRestart=document.getElementById('btnRestart');

function syncHi(){ hiTop.textContent=String(hi).padStart(5,'0'); }
function netStatus(){ const on=navigator.onLine; netEl.className='pill '+(on?'on':'off'); netTxt.textContent=on?'ONLINE · WORKS ANYWAY':'OFFLINE · IDEAL CONDITIONS'; }
function toggleMute(){ muted=!muted; save('trex.muted',muted?'1':'0'); btnSound.textContent=muted?'SOUND OFF':'SOUND ON'; }

let ac=null;
function beep(freq=520,dur=.07){
  if(muted) return;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return;
  if(!ac) ac=new AC();
  if(ac.state==='suspended') ac.resume();
  const o=ac.createOscillator(), g=ac.createGain(), t=ac.currentTime;
  o.type='square'; o.frequency.setValueAtTime(freq,t); g.gain.setValueAtTime(.035,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+dur+.02);
}

function restart(){
  obstacles.length=0; dust.length=0; score=0; speed=6.2; spawn=520;
  dino.y=GROUND; dino.vy=0; dino.onGround=true; dino.duck=false; duckHeld=false;
  state='playing';
}
function jump(){
  if(state==='dead') restart();
  else if(state==='paused'){ state='playing'; return; }
  else if(state==='idle') restart();
  if(state==='playing' && dino.onGround){ dino.vy=-12.3; dino.onGround=false; dino.duck=false; beep(620,.08); puff(6); }
}
function jumpRelease(){ if(dino.vy < -4.5) dino.vy=-4.5; }
function duckStart(){ duckHeld=true; if(state==='idle') restart(); }
function duckEnd(){ duckHeld=false; }
function puff(n){ for(let i=0;i<n;i++) dust.push({x:dino.x+8,y:GROUND-2,vx:-2-Math.random()*4,vy:-Math.random()*2,life:1}); }

function spawnObstacle(){
  const bird=score>220 && Math.random()<.22;
  if(bird) obstacles.push({type:'bird',x:W+30,y:score>450&&Math.random()<.5?174:210,w:62,h:28});
  else { const big=score>120&&Math.random()<.4; obstacles.push({type:'cactus',x:W+30,y:big?GROUND-66:GROUND-45,w:big?34:25,h:big?66:45}); }
}
function dbox(){ return dino.duck?{x:dino.x+4,y:GROUND-34,w:70,h:32}:{x:dino.x+9,y:dino.y-55,w:35,h:54}; }
function hit(a,b){ return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }
function die(){ state='dead'; beep(110,.22); const s=Math.floor(score); if(s>hi){hi=s;save('trex.hi',hi);syncHi();} }

function update(dt){
  time+=dt;
  clouds.forEach(c=>{ c.x-=Math.max(.5,speed*.22)*dt; if(c.x<-90){c.x=W+100+Math.random()*150;c.y=30+Math.random()*85;} });
  if(state!=='playing') return;
  speed=Math.min(13.2,speed+.0021*dt); score+=speed*dt*.062;
  dino.duck=duckHeld&&dino.onGround;
  if(!dino.onGround){ dino.vy+=.62*(duckHeld?2.4:1)*dt; dino.y+=dino.vy*dt; if(dino.y>=GROUND){dino.y=GROUND;dino.vy=0;dino.onGround=true;puff(3);} }
  dino.step+=speed*dt;
  spawn-=speed*dt; if(spawn<=0){spawnObstacle();spawn=360+Math.random()*310+speed*10;}
  const db=dbox();
  for(let i=obstacles.length-1;i>=0;i--){ const o=obstacles[i]; o.x-=speed*dt; if(o.x+o.w<-20){obstacles.splice(i,1);continue;} if(hit(db,o)){die();break;} }
  for(let i=dust.length-1;i>=0;i--){ const p=dust[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.08*dt;p.life-=.045*dt;if(p.life<=0)dust.splice(i,1); }
}

function palette(){
  const phase=(score%900)/900;
  if(phase<.25) return {a:'#9ad6d9',b:'#f7e9c9',ink:'#53412f',night:0};
  if(phase<.5) return {a:'#4b3a6b',b:'#f2954f',ink:'#341f22',night:.2};
  if(phase<.75) return {a:'#0c1220',b:'#24324c',ink:'#dfe8e2',night:1};
  return {a:'#31465f',b:'#f4b06a',ink:'#3a2a25',night:.25};
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function drawDino(c){
  const y=dino.duck?GROUND-34:dino.y-58;
  if(dino.duck){ rect(dino.x,y+8,64,26,c); rect(dino.x+52,y,28,20,c); rect(dino.x+10,y+31,12,7,c); rect(dino.x+45,y+31,12,7,c); rect(dino.x+62,y+6,4,4,'#000'); }
  else { rect(dino.x+13,y+16,30,35,c); rect(dino.x+27,y,34,24,c); rect(dino.x+8,y+34,12,10,c); rect(dino.x,y+39,14,6,c); rect(dino.x+20,y+49,9,12,c); rect(dino.x+36,y+49,9,12,c); rect(dino.x+49,y+5,4,4,'#000'); }
}
function draw(){
  const p=palette(), g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,p.a);g.addColorStop(1,p.b);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(p.night>.3){ctx.globalAlpha=p.night;ctx.fillStyle='#eef4ff';stars.forEach(s=>ctx.fillRect(s.x,s.y,s.s,s.s));ctx.globalAlpha=1;}
  ctx.globalAlpha=.65; clouds.forEach(c=>{rect(c.x,c.y,58,10,'#fff');rect(c.x+12,c.y-8,28,10,'#fff');});ctx.globalAlpha=1;
  rect(0,GROUND,W,2,p.ink);
  for(const o of obstacles){
    if(o.type==='bird'){rect(o.x,o.y,o.w,o.h,p.ink);rect(o.x+48,o.y+7,18,8,p.ink);rect(o.x+46,o.y+6,3,3,'#000');}
    else {rect(o.x,o.y,o.w,o.h,p.ink);rect(o.x-8,o.y+15,10,9,p.ink);rect(o.x+o.w-2,o.y+23,10,9,p.ink);}
  }
  drawDino(p.ink);
  dust.forEach(q=>{ctx.globalAlpha=Math.max(0,q.life);rect(q.x,q.y,3,3,p.ink);});ctx.globalAlpha=1;
  ctx.fillStyle=p.ink;ctx.font='700 18px ui-monospace, monospace';ctx.textAlign='right';ctx.fillText('HI '+String(Math.max(hi,Math.floor(score))).padStart(5,'0')+'  '+String(Math.floor(score)).padStart(5,'0'),W-16,26);
  ctx.textAlign='center';ctx.font='700 24px ui-monospace, monospace';
  if(state==='idle') ctx.fillText('TAP TO START + JUMP',W/2,130);
  if(state==='paused') ctx.fillText('PAUSED — TAP TO RESUME',W/2,130);
  if(state==='dead'){ctx.fillText('GAME OVER',W/2,118);ctx.font='700 16px ui-monospace, monospace';ctx.fillText('TAP TO RESTART + JUMP',W/2,151);}
}
function frame(now){ const dt=Math.min((now-last)/16.667,3)||1;last=now;update(dt);draw();requestAnimationFrame(frame); }
requestAnimationFrame(frame);

canvas.addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse'&&e.button!==0)return; e.preventDefault();pointerY=e.clientY;jump(); try{canvas.setPointerCapture(e.pointerId);}catch{} },{passive:false});
canvas.addEventListener('pointermove',e=>{ if(e.clientY-pointerY>28) duckStart(); },{passive:true});
canvas.addEventListener('pointerup',e=>{e.preventDefault();duckEnd();jumpRelease();},{passive:false});
canvas.addEventListener('pointercancel',()=>{duckEnd();jumpRelease();});

addEventListener('keydown',e=>{ if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(!e.repeat)jump();} else if(['ArrowDown','KeyS'].includes(e.code)){e.preventDefault();duckStart();} else if(e.code==='KeyP'){state=state==='playing'?'paused':state==='paused'?'playing':state;} else if(e.code==='KeyM')toggleMute(); });
addEventListener('keyup',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code))jumpRelease();else if(['ArrowDown','KeyS'].includes(e.code))duckEnd();});

window.DinoRunnerControls={jump,jumpRelease,duckStart,duckEnd,restart};
btnSound.textContent=muted?'SOUND OFF':'SOUND ON';
btnSound.addEventListener('click',()=>{toggleMute();btnSound.blur();});
btnRestart.addEventListener('click',()=>{restart();btnRestart.blur();});
addEventListener('online',netStatus);addEventListener('offline',netStatus);
addEventListener('blur',()=>{if(state==='playing')state='paused';duckEnd();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')state='paused';});
syncHi();netStatus();
})();