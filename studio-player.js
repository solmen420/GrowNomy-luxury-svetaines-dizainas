const section=document.querySelector('.cinema');
const pin=section.querySelector('.cinema-pin');
const layer=section.querySelector('.scene-layer');
const portal=section.querySelector('.screen-portal');
const content=portal.querySelector('.screen-content');
const canvas=document.createElement('canvas');
const ctx=canvas.getContext('2d',{alpha:false});
canvas.setAttribute('aria-label','GrowNomy studio camera journey');
layer.append(canvas);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const still=()=>motion.matches||new URLSearchParams(location.search).get('motion')==='still';
const artW=1280,artH=1280/(3.32/2.024);

export function projective(from,to){
 const a=[],b=[];
 for(let i=0;i<4;i++){
  const [x,y]=from[i],[u,v]=to[i];
  a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);
  a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);
 }
 for(let j=0;j<8;j++){
  let k=j;for(let i=j+1;i<8;i++)if(Math.abs(a[i][j])>Math.abs(a[k][j]))k=i;
  [a[j],a[k]]=[a[k],a[j]];[b[j],b[k]]=[b[k],b[j]];
  const d=a[j][j];if(Math.abs(d)<1e-10)throw Error('Degenerate display');
  for(let c=j;c<8;c++)a[j][c]/=d;b[j]/=d;
  for(let r=0;r<8;r++)if(r!==j){const q=a[r][j];for(let c=j;c<8;c++)a[r][c]-=q*a[j][c];b[r]-=q*b[j]}
 }
 return 'matrix3d('+[b[0],b[3],0,b[6],b[1],b[4],0,b[7],0,0,1,0,b[2],b[5],0,1].join(',')+')';
}

let width=0,height=0,data,variant,generation=0;
let position=0,presented=-1,intro=true,progress=0,last=0,raf=0,visible=true,dirty=true;
let serial=0,loading=0,failed=false,frames=new Map(),queue=[],pending=new Set(),errors=new Map();
const frameLimit=()=>variant==='mobile'?12:16;
function schedule(){if(!raf&&!document.hidden&&visible)raf=requestAnimationFrame(tick)}
function trim(){
 while(frames.size>frameLimit()){
  const candidates=[...frames].filter(([i])=>i!==presented).sort((a,b)=>a[1].used-b[1].used);
  if(!candidates.length)break;
  const [i,item]=candidates[0];item.image.close();frames.delete(i);
 }
}
function request(index,priority=false){
 index=clamp(index,0,180);
 if(frames.has(index)||failed)return;
 if(pending.has(index)){
  if(priority){const n=queue.findIndex(job=>job.index===index);if(n>=0)queue.unshift(queue.splice(n,1)[0])}
  return;
 }
 pending.add(index);const job={index,generation,variant};
 if(priority)queue.unshift(job);else queue.push(job);
 // Discard obsolete prefetches after a direction change or fast seek.
 while(queue.length>14){pending.delete(queue.pop().index)}
 drain();
}
function drain(){
 while(loading<3&&queue.length){
  const job=queue.shift();loading++;
  fetch('/assets/studio/'+job.variant+'/'+String(job.index).padStart(3,'0')+'.webp')
   .then(r=>{if(!r.ok)throw Error('Frame unavailable');return r.blob()})
   .then(blob=>createImageBitmap(blob))
   .then(image=>{
    if(job.generation!==generation){image.close();return}
    frames.set(job.index,{image,used:++serial});trim();schedule();
   })
   .catch(()=>{
    if(job.generation!==generation)return;
    const count=(errors.get(job.index)||0)+1;errors.set(job.index,count);
    if(count>=2){failed=true;staticFallback()}
   })
   .finally(()=>{loading--;if(job.generation===generation)pending.delete(job.index);drain();schedule()});
 }
}
function prefetch(index,direction){
 for(let n=1;n<=5;n++)request(clamp(index+n*direction,0,180));
 request(clamp(index-direction,0,180));
}
function layout(t){
 const scale=Math.max(width/artW,height/artH);
 const narrow=width<700,pad=narrow?22:48;
 const safeW=mix(artW-108,(width-2*pad)/scale,t);
 const safeH=mix(artH-92,(height-2*(narrow?30:40))/scale,t);
 content.style.width=safeW+'px';content.style.height=safeH+'px';
 const values={
  'brand-size':mix(24,24/scale,t),
  'meta-size':mix(12,12/scale,t),
  'heading-size':mix(64,(narrow?34:height<650?42:58)/scale,t),
  'heading-gap':mix(25,(height<650?16:24)/scale,t),
  'bubble-size':mix(18,14/scale,t),
  'small-size':mix(13,12/scale,t),
  'chat-width':Math.min(safeW,mix(770,780/scale,t)),
  'chat-height':mix(350,Math.max(170,height-(narrow?295:335))/scale,t),
  'chat-pad':mix(20,16/scale,t)
 };
 for(const [key,value] of Object.entries(values))portal.style.setProperty('--'+key,value+'px');
}
function draw(q){
 const index=Math.round(Math.min(q,2)*90),frame=frames.get(index);
 if(!frame)return false;
 frame.used=++serial;
 const scale=Math.max(width/data.width,height/data.height);
 const fw=data.width*scale,fh=data.height*scale,ox=(width-fw)/2,oy=(height-fh)/2;
 ctx.drawImage(frame.image,0,0,data.width,data.height);
 Object.assign(canvas.style,{width:fw+'px',height:fh+'px',left:ox+'px',top:oy+'px'});
 const native=data.frames[index].map(([x,y])=>[x*fw+ox,y*fh+oy]);
 const t=ease(q-2),targetW=Math.max(width,height*data.screenRatio),targetH=targetW/data.screenRatio;
 const x=(width-targetW)/2,y=(height-targetH)/2;
 const target=[[x,y],[x+targetW,y],[x+targetW,y+targetH],[x,y+targetH]];
 const quad=native.map((point,i)=>point.map((value,j)=>mix(value,target[i][j],t)));
 // Camera plate and HTML use the same displayed frame and the same final transform.
 layer.style.transform=t?projective(native,quad):'none';
 portal.style.transform=projective([[0,0],[artW,0],[artW,artH],[0,artH]],quad);
 layout(t);
 portal.inert=q<2.999;
 portal.style.pointerEvents=q>=2.999?'auto':'none';
 section.style.setProperty('--copy',1-ease((q-1)/.48));
 section.style.setProperty('--journey',clamp((q-1)/2));
 section.classList.add('screen-ready');
 section.dataset.cameraMode=still()?'static':'sequence';
 section.dataset.cameraFrame=String(index);
 section.dataset.cameraPosition=q.toFixed(5);
 section.dataset.cameraSettled=String(q>=2.999);
 section.dataset.decodedFrames=String(frames.size);
 section.dataset.screenCorners=JSON.stringify(quad);
 presented=index;dirty=false;
 return true;
}
function updateChat(){
 const r=pin.getBoundingClientRect(),active=!document.hidden&&position>=2.999&&r.top>=-height*.15&&r.bottom>height*.6;
 window.setCinematicChatVisible?.(active);if(active)window.startCinematicChat?.();
}
function tick(now){
 raf=0;if(!data||failed||document.hidden||!visible)return;
 const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 const target=still()?1:intro?1:1+2*clamp(progress/.78);
 let next=intro?Math.min(1,position+dt/3):position+(target-position)*(1-Math.exp(-dt/.16));
 next=position+clamp(next-position,-1.65*dt,1.65*dt);
 if(Math.abs(target-next)<.0003)next=target;
 if(still())next=1;
 const index=Math.round(Math.min(next,2)*90),direction=next>=position?1:-1;
 if(frames.has(index)){
  if(dirty||next!==position||index!==presented)draw(next);
  position=next;
  if(intro&&position===1)intro=false;
  prefetch(index,direction);
 }else request(index,true);
 updateChat();
 if(Math.abs(target-position)>.00001||dirty)schedule();else last=0;
}
function readScroll(){
 const distance=section.offsetHeight-height;
 progress=distance>0?clamp(-section.getBoundingClientRect().top/distance):0;
 if(progress>.001)intro=false;
 updateChat();schedule();
}
function staticFallback(){
 section.classList.add('studio-static','studio-failed');
 section.dataset.cameraMode='poster';
 portal.inert=true;portal.style.opacity='0';
 layer.style.opacity='0';section.style.setProperty('--copy','1');
 window.setCinematicChatVisible?.(false);
}
async function loadVariant(nextVariant){
 const token=++generation;variant=nextVariant;failed=false;
 frames.forEach(item=>item.image.close());frames.clear();queue=[];pending.clear();errors.clear();
 section.classList.remove('screen-ready','studio-failed');
 section.dataset.cameraMode='loading';layer.style.transform='none';
 try{
  const r=await fetch('/assets/studio/'+variant+'/track.json');
  if(!r.ok)throw Error('Camera unavailable');
  const track=await r.json();if(token!==generation)return;
  data=track;canvas.width=data.width;canvas.height=data.height;
  request(Math.round(Math.min(position,2)*90),true);schedule();
 }catch{if(token===generation){failed=true;staticFallback()}}
}
function resize(){
 width=pin.clientWidth;height=pin.clientHeight;dirty=true;
 const nextVariant=width/height<.85?'mobile':'desktop';
 if(nextVariant!==variant)loadVariant(nextVariant);
 readScroll();schedule();
}
function motionChanged(){
 section.classList.toggle('studio-static',still());position=still()?1:position;
 intro=!still()&&position<1;dirty=true;resize();
}
section.querySelector('.replay-camera').addEventListener('click',()=>{
 window.scrollTo({top:0,behavior:'instant'});position=still()?1:0;progress=0;intro=!still();last=0;dirty=true;
 window.resetCinematicChat?.();schedule();
});
new ResizeObserver(resize).observe(pin);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;if(visible)schedule();else window.setCinematicChatVisible?.(false)}).observe(section);
addEventListener('scroll',readScroll,{passive:true});
document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)schedule();else window.setCinematicChatVisible?.(false)});
motion.addEventListener('change',motionChanged);
motionChanged();
