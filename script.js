
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const defaultData = {
  coins:250,level:1,xp:0,kills:0,bestWave:0,passLevel:1,
  skins:["soldier"],skin:"soldier",upgrades:{damage:0,mag:0,reload:0},
  ownedWeapons:["pistol"],weapon:"pistol",claimed:[],achievements:[],
  missionDate:"",missionProgress:{kills:0,waves:0,bosses:0},missionClaimed:[]
};
function readSave(){try{return {...defaultData,...JSON.parse(localStorage.getItem("spmSave")||"{}")}}catch{return {...defaultData}}}
let data=readSave();
data.upgrades={...defaultData.upgrades,...(data.upgrades||{})};
data.missionProgress={...defaultData.missionProgress,...(data.missionProgress||{})};

const skins=[
 {id:"soldier",name:"Żołnierz",icon:"🪖",price:0},
 {id:"blue",name:"Niebieski",icon:"🧑‍🚀",price:100},
 {id:"ninja",name:"Ninja",icon:"🥷",price:250},
 {id:"robot",name:"Robot",icon:"🤖",price:400},
 {id:"alien",name:"Kosmita",icon:"👽",price:650},
 {id:"king",name:"Król",icon:"👑",price:1000}
];
const weapons={
 pistol:{name:"PISTOLET",label:"Pistolet",damage:1,mag:12,reserve:48,rate:330,reload:1100,price:0},
 rifle:{name:"KARABIN",label:"Karabin",damage:1,mag:30,reserve:120,rate:130,reload:1450,price:350},
 shotgun:{name:"STRZELBA",label:"Strzelba",damage:5,mag:6,reserve:36,rate:700,reload:1600,price:500}
};
const missions=[
 {id:"kills",name:"Pokonaj 15 przeciwników",goal:15,reward:150,field:"kills"},
 {id:"waves",name:"Ukończ 3 fale",goal:3,reward:200,field:"waves"},
 {id:"bosses",name:"Pokonaj 1 bossa",goal:1,reward:250,field:"bosses"}
];
const medals=[
 {id:"firstkill",name:"Pierwszy sukces",desc:"Pokonaj pierwszego przeciwnika",test:()=>data.kills>=1,reward:50},
 {id:"tenkills",name:"Łowca",desc:"Pokonaj 10 przeciwników",test:()=>data.kills>=10,reward:100},
 {id:"fifthwave",name:"Wytrwały",desc:"Ukończ 5 fal",test:()=>data.bestWave>=5,reward:150},
 {id:"boss",name:"Pogromca bossów",desc:"Pokonaj pierwszego bossa",test:()=>data.missionProgress.bosses>=1,reward:200},
 {id:"fifty",name:"Legenda areny",desc:"Ukończ 50 fal",test:()=>data.bestWave>=50,reward:1000}
];

function save(){localStorage.setItem("spmSave",JSON.stringify(data));updateUI()}
function updateUI(){
 const skin=skins.find(s=>s.id===data.skin)||skins[0];
 $("avatar").textContent=skin.icon;$("characterPreview").textContent=skin.icon;$("skinName").textContent=skin.name;
 $("playerLevel").textContent=data.level;$("lobbyCoins").textContent=data.coins;
 $("shopCoins").textContent=data.coins;$("coins").textContent=data.coins;
 $("passLevel").textContent=data.passLevel;$("passProgress").style.width=(data.passLevel/50*100)+"%";
}
function screen(id){document.querySelectorAll(".screen").forEach(x=>x.classList.add("hidden"));$(id).classList.remove("hidden")}
function lobby(){stopGame();$("hud").classList.add("hidden");screen("lobby");updateUI()}
function toast(t){$("message").textContent=t;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("message").textContent="",2200)}
function coins(n){data.coins+=n;save()}
function xp(n){data.xp+=n;while(data.xp>=data.level*100){data.xp-=data.level*100;data.level++;data.coins+=50;toast("NOWY POZIOM! +50 MONET")}data.passLevel=Math.min(50,data.passLevel+1);save()}
function refreshDaily(){
 if(data.missionDate!==today()){data.missionDate=today();data.missionProgress={kills:0,waves:0,bosses:0};data.missionClaimed=[];save()}
}
function missionProgress(field,n=1){refreshDaily();data.missionProgress[field]=(data.missionProgress[field]||0)+n;save()}
function checkMedals(){
 medals.forEach(m=>{if(!data.achievements.includes(m.id)&&m.test()){data.achievements.push(m.id);data.coins+=m.reward;toast("MEDAL: "+m.name+" +"+m.reward+" monet")}});save()
}
function renderList(id,items){const root=$(id);root.replaceChildren();items.forEach(el=>root.append(el))}
function row(title,desc,buttonText,action,disabled=false){
 const box=document.createElement("div");box.className="item";
 const left=document.createElement("div");left.innerHTML=`<b>${title}</b><small>${desc||""}</small>`;
 const b=document.createElement("button");b.textContent=buttonText;b.disabled=disabled;b.onclick=action;
 box.append(left,b);return box;
}
function renderSkins(){
 renderList("skinItems",skins.map(s=>{
  const own=data.skins.includes(s.id);
  return row(s.icon+" "+s.name,own?"Posiadasz ten skin":"Cena: "+s.price+" monet",data.skin===s.id?"WYBRANO":own?"WYBIERZ":s.price+" 🪙",()=>{
   if(own){data.skin=s.id;save();renderSkins()}
   else if(data.coins>=s.price){data.coins-=s.price;data.skins.push(s.id);data.skin=s.id;save();renderSkins()}
   else toast("Za mało monet!");
  },!own&&data.coins<s.price);
 }));
}
function renderShop(){
 const arr=[];
 Object.entries(weapons).forEach(([id,w])=>arr.push(row("🔫 "+w.label,data.ownedWeapons.includes(id)?"Broń jest odblokowana":"Odblokuj nową broń",data.ownedWeapons.includes(id)?(data.weapon===id?"AKTYWNA":"WYBIERZ"):w.price+" 🪙",()=>{
  if(data.ownedWeapons.includes(id)){data.weapon=id;save();renderShop()}
  else if(data.coins>=w.price){data.coins-=w.price;data.ownedWeapons.push(id);data.weapon=id;save();renderShop()}
  else toast("Za mało monet!");
 },!data.ownedWeapons.includes(id)&&data.coins<w.price)));
 const upgrades=[
  {id:"damage",name:"Większe obrażenia",price:180,desc:"Każdy poziom wzmacnia strzał"},
  {id:"mag",name:"Większy magazynek",price:140,desc:"Więcej amunicji w magazynku"},
  {id:"reload",name:"Szybsze przeładowanie",price:160,desc:"Krótsza przerwa przy przeładowaniu"}
 ];
 upgrades.forEach(u=>{
  const level=data.upgrades[u.id]||0,price=u.price*(level+1);
  arr.push(row("⬆️ "+u.name,"Poziom "+level+" · "+u.desc,price+" 🪙",()=>{
   if(data.coins<price){toast("Za mało monet!");return}
   data.coins-=price;data.upgrades[u.id]=level+1;save();renderShop();
  },data.coins<price));
 });
 renderList("shopItems",arr);
}
function renderMissions(){
 refreshDaily();$("missionDate").textContent="Nowe zadania: "+data.missionDate;
 renderList("missionItems",missions.map(m=>{
  const p=data.missionProgress[m.field]||0,done=p>=m.goal,claimed=data.missionClaimed.includes(m.id);
  return row(m.name,`${Math.min(p,m.goal)}/${m.goal} · Nagroda ${m.reward} monet`,claimed?"ODEBRANO":done?"ODBIERZ":"W TRAKCIE",()=>{
   if(done&&!claimed){data.missionClaimed.push(m.id);data.coins+=m.reward;save();renderMissions()}
  },!done||claimed);
 }));
}
function renderMedals(){
 renderList("achievementItems",medals.map(m=>{
  const got=data.achievements.includes(m.id);
  return row((got?"🏅 ":"🔒 ")+m.name,m.desc,got?"ZDOBYTO":"NIEZDOBYTY",()=>{},true);
 }));
}
function renderPass(){
 const arr=[];for(let i=1;i<=50;i++){const got=data.claimed.includes(i),available=i<=data.passLevel;
  arr.push(row("Poziom "+i,i%5===0?"Nagroda: 100 monet":"Nagroda: 25 monet",got?"ODEBRANO":available?"ODBIERZ":"ZABLOKOWANE",()=>{
   if(available&&!got){data.claimed.push(i);data.coins+=i%5===0?100:25;save();renderPass()}
  },!available||got));
 }renderList("passItems",arr);
}
function renderStats(){
 $("statsText").innerHTML=`<p>Poziom: ${data.level}</p><p>Pokonani przeciwnicy: ${data.kills}</p><p>Najlepsza fala: ${data.bestWave}</p><p>Monety: ${data.coins}</p><p>Odblokowane bronie: ${data.ownedWeapons.length}/3</p><p>Zdobyte medale: ${data.achievements.length}/${medals.length}</p>`;
}

// THREE.JS – arena
let scene,camera,renderer,raycaster,playing=false,paused=false;
let enemies=[],yaw=0,pitch=0,wave=1,hp=100,ammo=12,reserve=48,lastShot=0,lastFrame=0;
let player=new THREE.Vector3(),keys={},moveX=0,moveY=0,selectedMap="warehouse",reloadTimer=null;
let weaponId="pistol",lookPointer=null,lastTouch={x:0,y:0};
const isTouch=navigator.maxTouchPoints>0;
const mapColors={warehouse:[0x8193a3,0x68717c,0x465568],city:[0x9aa9b9,0x555e69,0x46516a],desert:[0xd7ad75,0xc49a58,0x9e7749],base:[0x687b70,0x485b50,0x34493d]};
function addBox(x,y,z,sx,sy,sz,color){
 const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshStandardMaterial({color}));m.position.set(x,y,z);scene.add(m);return m;
}
function makeMap(){
 const c=mapColors[selectedMap];scene.background=new THREE.Color(c[0]);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:c[1]}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.1;scene.add(floor);
 addBox(0,3,-50,100,6,1,c[2]);addBox(0,3,50,100,6,1,c[2]);
 addBox(-50,3,0,1,6,100,c[2]);addBox(50,3,0,1,6,100,c[2]);
 [[-12,-12],[12,-12],[-12,12],[12,12],[0,-25],[0,25],[-25,0],[25,0],[-27,-25],[27,25]].forEach((p,i)=>addBox(p[0],1.5,p[1],i%2?5:7,3,4,c[2]));
 scene.add(new THREE.HemisphereLight(0xffffff,0x444455,2));
 const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(10,20,10);scene.add(light);
}
function makeEnemy(boss=false){
 const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:boss?0x9c43e8:0xd74747});
 const body=new THREE.Mesh(new THREE.BoxGeometry(boss?1.8:.9,boss?2.4:1.4,.8),mat);body.position.y=boss?1.2:.7;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(boss?.45:.3,12,12),new THREE.MeshStandardMaterial({color:0xffc49c}));head.position.y=boss?2.55:1.6;g.add(head);
 const a=Math.random()*Math.PI*2,d=18+Math.random()*18;g.position.set(player.x+Math.cos(a)*d,0,player.z+Math.sin(a)*d);scene.add(g);
 const ehp=boss?24+wave*5:3+Math.floor(wave/5);
 enemies.push({group:g,body,hp:ehp,boss,speed:boss?1.25:Math.min(1.8+wave*.045,4.5),attack:0});
}
function spawnWave(){
 const boss=wave%5===0,count=Math.min(3+wave*2,65);
 for(let i=0;i<count;i++)makeEnemy(false);
 if(boss)makeEnemy(true);
 $("wave").textContent=wave;toast(boss?"BOSS! FALA "+wave:"FALA "+wave);
}
function activeWeapon(){return weapons[weaponId]||weapons.pistol}
function setWeapon(id){
 if(!data.ownedWeapons.includes(id))return;
 weaponId=id;const w=activeWeapon();ammo=w.mag+data.upgrades.mag*3;reserve=w.reserve;
 $("ammo").textContent=ammo+"/"+reserve;$("weaponLabel").textContent=w.name;
}
function flashShot(){
 const f=$("shotFlash");f.innerHTML='<span style="font-size:46px;color:#ffe46b;text-shadow:0 0 18px #ff6a00">✦</span>';
 f.style.transform=`translate(-50%,-50%) translate(${Math.random()*12-6}px,${Math.random()*12-6}px)`;
 setTimeout(()=>f.replaceChildren(),100);
}
function shoot(){
 if(!playing||paused||!renderer)return;
 const w=activeWeapon(),now=performance.now();if(now-lastShot<w.rate)return;
 if(ammo<=0){toast("BRAK AMUNICJI – NACIŚNIJ R");return}
 lastShot=now;ammo--;updateAmmo();flashShot();
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
 const hits=raycaster.intersectObjects(enemies.map(e=>e.body),false);
 if(!hits.length)return;
 const enemy=enemies.find(e=>e.body===hits[0].object);if(!enemy)return;
 const damage=w.damage+data.upgrades.damage;enemy.hp-=damage;
 const start=camera.position.clone(),end=hits[0].point.clone();
 const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,end]),new THREE.LineBasicMaterial({color:0xffdf65}));
 scene.add(line);setTimeout(()=>{if(scene)scene.remove(line)},90);
 if(enemy.hp<=0){
  scene.remove(enemy.group);enemies=enemies.filter(e=>e!==enemy);
  data.kills++;coins(enemy.boss?120:10);xp(enemy.boss?100:20);missionProgress("kills");
  if(enemy.boss){missionProgress("bosses");toast("BOSS POKONANY! +120 MONET")}
  checkMedals();save();
 }
}
function updateAmmo(){$("ammo").textContent=ammo+"/"+reserve}
function reload(){
 if(!playing||paused||reloadTimer||ammo>=activeWeapon().mag+data.upgrades.mag*3||reserve<=0)return;
 const w=activeWeapon();toast("PRZEŁADOWANIE...");
 reloadTimer=setTimeout(()=>{
  const capacity=w.mag+data.upgrades.mag*3,needed=capacity-ammo,take=Math.min(needed,reserve);
  ammo+=take;reserve-=take;reloadTimer=null;updateAmmo();
 },Math.max(350,w.reload-data.upgrades.reload*120));
}
function stopGame(){
 playing=false;paused=false;if(reloadTimer)clearTimeout(reloadTimer);reloadTimer=null;
 if(renderer){renderer.dispose();renderer.domElement.remove();renderer=null}
 scene=null;camera=null;enemies=[];
}
function startGame(){
 stopGame();$("hud").classList.remove("hidden");document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,150);
 camera.rotation.order="YXZ";camera.position.set(0,1.7,0);scene.add(camera);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));$("game").appendChild(renderer.domElement);
 raycaster=new THREE.Raycaster();yaw=0;pitch=0;player.set(0,0,0);wave=1;hp=100;makeMap();enemies=[];
 setWeapon(data.weapon);reserve=activeWeapon().reserve;ammo=activeWeapon().mag+data.upgrades.mag*3;updateAmmo();
 $("hp").textContent=hp;playing=true;paused=false;lastFrame=performance.now();spawnWave();requestAnimationFrame(loop);
}
function endGame(){
 if(!playing)return;playing=false;data.bestWave=Math.max(data.bestWave,wave-1);save();
 $("finalWave").textContent=wave;$("hud").classList.add("hidden");screen("gameOver");
}
function pauseGame(){if(!playing)return;playing=false;paused=true;screen("pause")}
function resumeGame(){
 if(!paused)return;paused=false;playing=true;lastFrame=performance.now();
 document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
 $("hud").classList.remove("hidden");requestAnimationFrame(loop);
}
function movement(dt){
 if(!isTouch){moveX=(keys.KeyD?1:0)-(keys.KeyA?1:0);moveY=(keys.KeyW?1:0)-(keys.KeyS?1:0)}
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 player.addScaledVector(forward,moveY*7.5*dt);player.addScaledVector(right,moveX*7.5*dt);
 player.x=THREE.MathUtils.clamp(player.x,-46,46);player.z=THREE.MathUtils.clamp(player.z,-46,46);
 camera.position.set(player.x,1.7,player.z);camera.rotation.set(pitch,yaw,0);
}
function updateEnemies(dt){
 for(const e of enemies){
  const dir=new THREE.Vector3(player.x-e.group.position.x,0,player.z-e.group.position.z),dist=dir.length();
  if(dist>2.3){dir.normalize();e.group.position.addScaledVector(dir,e.speed*dt)}
  e.group.lookAt(player.x,0,player.z);e.attack-=dt;
  if(dist<2.5&&e.attack<=0){hp-=e.boss?9:4;e.attack=1;$("hp").textContent=Math.max(0,hp)}
 }
 if(hp<=0)endGame();
}
function drawRadar(){
 const c=$("radar"),ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);
 ctx.fillStyle="#07111d";ctx.beginPath();ctx.arc(75,75,72,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#6a9db7";ctx.beginPath();ctx.arc(75,75,72,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle="#29495a";ctx.beginPath();ctx.moveTo(75,5);ctx.lineTo(75,145);ctx.moveTo(5,75);ctx.lineTo(145,75);ctx.stroke();
 ctx.fillStyle="#53e0a1";ctx.beginPath();ctx.arc(75,75,4,0,Math.PI*2);ctx.fill();
 enemies.forEach(e=>{const dx=e.group.position.x-player.x,dz=e.group.position.z-player.z;
  const x=THREE.MathUtils.clamp(75+dx*.9,8,142),y=THREE.MathUtils.clamp(75+dz*.9,8,142);
  ctx.fillStyle=e.boss?"#c47bff":"#ff5656";ctx.beginPath();ctx.arc(x,y,e.boss?5:3,0,Math.PI*2);ctx.fill();
 });
}
function nextWave(){
 data.bestWave=Math.max(data.bestWave,wave);missionProgress("waves");checkMedals();
 if(wave>=50){data.bestWave=Math.max(data.bestWave,50);checkMedals();toast("UKOŃCZONO 50 FAL! TRYB NIESKOŃCZONY!")}
 wave++;coins(25+wave*3);xp(50);spawnWave();lastFrame=performance.now();requestAnimationFrame(loop);
}
function loop(now){
 if(!playing||!renderer)return;const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
 movement(dt);updateEnemies(dt);if(!playing)return;drawRadar();
 if(enemies.length===0){playing=false;setTimeout(()=>{if(scene&&!paused){playing=true;nextWave()}},1200)}
 renderer.render(scene,camera);if(playing)requestAnimationFrame(loop);
}

// Sterowanie
window.addEventListener("keydown",e=>{
 keys[e.code]=true;if(e.code==="KeyR")reload();
 if(e.code==="Digit1")setWeapon("pistol");if(e.code==="Digit2")setWeapon("rifle");if(e.code==="Digit3")setWeapon("shotgun");
});
window.addEventListener("keyup",e=>keys[e.code]=false);
document.addEventListener("mousedown",e=>{if(e.button===0&&playing&&!isTouch)shoot()});
document.addEventListener("mousemove",e=>{
 if(playing&&!isTouch&&document.pointerLockElement){yaw-=e.movementX*.003;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.003,-1.25,1.25)}
});
$("game").addEventListener("click",()=>{if(playing&&!isTouch)renderer?.domElement.requestPointerLock?.()});
$("game").addEventListener("pointerdown",e=>{if(!playing||!isTouch)return;lookPointer=e.pointerId;lastTouch={x:e.clientX,y:e.clientY}});
$("game").addEventListener("pointermove",e=>{
 if(e.pointerId!==lookPointer)return;yaw-=(e.clientX-lastTouch.x)*.005;
 pitch=THREE.MathUtils.clamp(pitch-(e.clientY-lastTouch.y)*.005,-1.25,1.25);
 lastTouch={x:e.clientX,y:e.clientY};
});
$("game").addEventListener("pointerup",()=>lookPointer=null);
$("game").addEventListener("pointercancel",()=>lookPointer=null);

const joy=$("joystick"),stick=$("stick");
function setStick(e){
 const r=joy.getBoundingClientRect();let x=e.clientX-r.left-58,y=e.clientY-r.top-58,len=Math.hypot(x,y);
 if(len>38){x*=38/len;y*=38/len}
 stick.style.left=29+x+"px";stick.style.top=29+y+"px";moveX=x/38;moveY=-y/38;
}
function resetStick(){moveX=moveY=0;stick.style.left="31px";stick.style.top="31px"}
joy.addEventListener("pointerdown",e=>{joy.setPointerCapture(e.pointerId);setStick(e)});
joy.addEventListener("pointermove",e=>{if(e.buttons)setStick(e)});
joy.addEventListener("pointerup",resetStick);joy.addEventListener("pointercancel",resetStick);
$("fireBtn").addEventListener("pointerdown",e=>{e.preventDefault();shoot()});
$("reloadBtn").addEventListener("pointerdown",e=>{e.preventDefault();reload()});
$("jumpBtn").addEventListener("pointerdown",e=>{
 e.preventDefault();if(camera&&playing){camera.position.y=2.5;setTimeout(()=>{if(camera&&playing)camera.position.y=1.7},280)}
});
$("switchBtn").addEventListener("pointerdown",e=>{
 e.preventDefault();const ids=data.ownedWeapons,i=ids.indexOf(weaponId);setWeapon(ids[(i+1)%ids.length]);
});
window.addEventListener("resize",()=>{
 if(camera&&renderer){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
});

// Menu
$("playBtn").onclick=()=>screen("maps");
$("skinsBtn").onclick=()=>{renderSkins();screen("skins")};
$("shopBtn").onclick=()=>{renderShop();screen("shop")};
$("missionsBtn").onclick=()=>{renderMissions();screen("missions")};
$("achievementsBtn").onclick=()=>{renderMedals();screen("achievements")};
$("passBtn").onclick=()=>{renderPass();screen("battlepass")};
$("statsBtn").onclick=()=>{renderStats();screen("stats")};
document.querySelectorAll("[data-map]").forEach(b=>b.onclick=()=>{selectedMap=b.dataset.map;startGame()});
document.querySelectorAll(".backBtn").forEach(b=>b.onclick=lobby);
$("pauseBtn").onclick=pauseGame;$("resumeBtn").onclick=resumeGame;$("pauseMenuBtn").onclick=lobby;
$("againBtn").onclick=startGame;$("overMenuBtn").onclick=lobby;
refreshDaily();updateUI();
