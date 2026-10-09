(async()=>{
  const section=document.querySelector('.cinema'),pin=section.querySelector('.cinema-pin');
  const portal=section.querySelector('.screen-portal'),layer=section.querySelector('.scene-layer');
  const canvas=document.getElementById('cameraCanvas'),ctx=canvas.getContext('2d',{alpha:false});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  function homography(from,to){
    const a=[],b=[];
    for(let i=0;i<4;i++){const [x,y]=from[i],[u,v]=to[i];a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)}
    for(let j=0;j<8;j++){
      let k=j;for(let i=j+1;i<8;i++)if(Math.abs(a[i][j])>Math.abs(a[k][j]))k=i;
      [a[j],a[k]]=[a[k],a[j]];[b[j],b[k]]=[b[k],b[j]];
      const d=a[j][j];if(Math.abs(d)<1e-10)throw Error('Degenerate display projection');
      for(let i=j;i<8;i++)a[j][i]/=d;b[j]/=d;
      for(let r=0;r<8;r++)if(r!==j){const q=a[r][j];for(let c=j;c<8;c++)a[r][c]-=q*a[j][c];b[r]-=q*b[j]}
    }
    return `matrix3d(${b[0]},${b[3]},0,${b[6]},${b[1]},${b[4]},0,${b[7]},0,0,1,0,${b[2]},${b[5]},0,1)`;
  }
  let data;
  try{const response=await fetch('/assets/cinema/sequence.json');if(!response.ok)throw Error('Sequence unavailable');data=await response.json()}
  catch(error){fallback(error);return}
  const end=data.frames.length-1,anchor=140;
  let w=0,h=0,fw=0,fh=0,ox=0,oy=0,progress=0;
  let position=reduced?end:0,presented=-1,introPlaying=!reduced,previousTime=0,dirty=true;
  const blobs=new Map(),requests=new Map(),bitmaps=new Map(),decoding=new Map();
  const queue=[];let active=0,use=0,failed=false;
  function drain(){
    while(active<5&&queue.length){
      const job=queue.shift();active++;
      fetch(`/assets/cinema/frames/${String(job.index).padStart(3,'0')}.webp`)
        .then(response=>{if(!response.ok)throw Error('Camera frame unavailable');return response.blob()})
        .then(blob=>{blobs.set(job.index,blob);job.resolve(blob)})
        .catch(error=>{requests.delete(job.index);job.reject(error)})
        .finally(()=>{active--;drain()});
    }
  }
  function getBlob(index,priority=false){
    if(blobs.has(index))return Promise.resolve(blobs.get(index));
    if(requests.has(index)){
      if(priority){const q=queue.findIndex(job=>job.index===index);if(q>0)queue.unshift(queue.splice(q,1)[0])}
      return requests.get(index);
    }
    const promise=new Promise((resolve,reject)=>{const job={index,resolve,reject};if(priority)queue.unshift(job);else queue.push(job)});
    requests.set(index,promise);drain();return promise;
  }
  function getFrame(index){
    index=clamp(index,0,anchor);
    const cached=bitmaps.get(index);if(cached){cached.used=++use;return Promise.resolve(cached.image)}
    if(decoding.has(index))return decoding.get(index);
    const promise=getBlob(index,true).then(blob=>createImageBitmap(blob)).then(image=>{
      bitmaps.set(index,{image,used:++use});decoding.delete(index);
      while(bitmaps.size>28){
        const oldest=[...bitmaps].filter(([n])=>n!==Math.min(presented,anchor)&&n!==index).sort((a,b)=>a[1].used-b[1].used)[0];
        if(!oldest)break;oldest[1].image.close();bitmaps.delete(oldest[0]);
      }
      return image;
    }).catch(error=>{decoding.delete(index);throw error});
    decoding.set(index,promise);return promise;
  }
  function preloadNear(index,direction){
    for(let n=1;n<=8;n++){const i=clamp(index+n*direction,0,end);getFrame(i).catch(()=>{})}
  }
  function readSize(){
    w=pin.clientWidth;h=pin.clientHeight;
    const scale=Math.max(w/data.width,h/data.height);fw=data.width*scale;fh=data.height*scale;
    ox=(w-fw)*.57;oy=(h-fh)/2;
    Object.assign(canvas.style,{width:fw+'px',height:fh+'px',left:ox+'px',top:oy+'px'});
    dirty=true;readScroll();
  }
  function readScroll(){
    const distance=section.offsetHeight-h;
    progress=distance>1?clamp(-section.getBoundingClientRect().top/distance):0;
    if(progress>.002)introPlaying=false;
    section.style.setProperty('--copy',String(1-smooth(progress/.12)));
  }
  function render(index){
    const cameraIndex=Math.min(index,anchor);
    const cached=bitmaps.get(cameraIndex);if(!cached)return;
    cached.used=++use;ctx.drawImage(cached.image,0,0,data.width,data.height);
    // Both the camera and its physical display use this one presented frame.
    // No independent media seek callback is allowed to move the HTML overlay.
    const native=data.frames[cameraIndex].map(([x,y])=>[x*fw+ox,y*fh+oy]);
    const viewport=[[0,0],[w,0],[w,h],[0,h]];
    // A monotone camera finish keeps the screen growing toward the viewport,
    // instead of letting it overshoot and then shrinking it back into place.
    // The room receives the exact same correction as the physical display.
    const t=clamp((index-anchor)/(end-anchor));
    const settle=reduced?1:smooth(t);
    const anchorQuad=data.frames[anchor].map(([x,y])=>[x*fw+ox,y*fh+oy]);
    const quad=index<=anchor&&!reduced?native:anchorQuad.map((point,i)=>point.map((a,j)=>{
      const b=viewport[i][j],delta=b-a;
      const velocity=(data.frames[anchor+1][i][j]-data.frames[anchor-1][i][j])*.5*(j===0?fw:fh)*(end-anchor);
      const tangent=Math.sign(delta)*clamp(velocity*Math.sign(delta),0,3*Math.abs(delta));
      const u=reduced?1:t;
      return (2*u*u*u-3*u*u+1)*a+(u*u*u-2*u*u+u)*tangent+(-2*u*u*u+3*u*u)*b;
    }));
    layer.style.transform=homography(native,quad);
    const artW=mix(1280,w,settle),artH=mix(720,h,settle);
    const narrow=w<700;
    portal.style.width=artW+'px';portal.style.height=artH+'px';
    portal.style.padding=mix(54,narrow?22:Math.min(48,h*.05),settle)+'px';
    portal.style.setProperty('--brand-size',mix(24,narrow?23:26,settle)+'px');
    portal.style.setProperty('--meta-size',mix(10,narrow?8:10,settle)+'px');
    portal.style.setProperty('--heading-size',mix(54,narrow?Math.min(36,w*.086):Math.min(52,h*.065),settle)+'px');
    portal.style.setProperty('--heading-gap',mix(26,narrow?22:28,settle)+'px');
    portal.style.setProperty('--bubble-size',mix(17,narrow?13:15,settle)+'px');
    portal.style.setProperty('--small-size',mix(12,narrow?10:12,settle)+'px');
    portal.style.setProperty('--chat-width',mix(760,Math.min(780,w-(narrow?44:80)),settle)+'px');
    const chatHeight=clamp(h-(narrow?285:340),230,490);
    portal.style.setProperty('--chat-height',mix(340,chatHeight,settle)+'px');
    portal.style.transform=homography([[0,0],[artW,0],[artW,artH],[0,artH]],quad);
    portal.style.pointerEvents=index===end?'auto':'none';
    section.classList.add('screen-ready');
    section.dataset.cameraFrame=String(index);section.dataset.cameraSettled=String(index===end);
    presented=index;dirty=false;
  }
  function fallback(error){
    console.error('Cinematic sequence:',error);
    section.classList.add('cinema-unavailable','screen-ready');
    portal.style.cssText='width:100%;height:100%;padding:24px;transform:none;pointer-events:auto;--chat-width:min(780px,100%);--chat-height:45svh;--heading-size:36px;--heading-gap:20px';
    window.setCinematicChatVisible?.(true);window.startCinematicChat?.();
  }
  function tick(now){
    const dt=previousTime?Math.min((now-previousTime)/1000,.05):0;previousTime=now;
    if(!document.hidden&&!failed){
      const target=reduced?end:introPlaying?data.introFrame:data.introFrame+(end-data.introFrame)*smooth(progress/.72);
      let next;
      if(introPlaying)next=Math.min(data.introFrame,position+data.fps*dt);
      else{const diff=target-position;next=position+clamp(diff*(1-Math.exp(-dt/.12)),-150*dt,150*dt);if(Math.abs(target-next)<.08)next=target}
      const index=clamp(Math.round(next),0,end);
      const direction=next>=position?1:-1;
      if(bitmaps.has(Math.min(index,anchor))){
        position=next;
        if(dirty||index!==presented)render(index);
        if(introPlaying&&position>=data.introFrame)introPlaying=false;
        preloadNear(index,direction);
      }else getFrame(index).catch(error=>{failed=true;fallback(error)});
      const r=pin.getBoundingClientRect();
      const chatVisible=presented===end&&r.top>=-h*.2&&r.bottom>h*.6;
      window.setCinematicChatVisible?.(chatVisible);
      if(chatVisible)window.startCinematicChat?.();
    }
    requestAnimationFrame(tick);
  }
  try{
    await getFrame(Math.round(position));readSize();render(Math.round(position));
    // Preload compressed bytes; keep only a small moving window decoded.
    if(!reduced)for(let i=0;i<=anchor;i++)getBlob(i).catch(()=>{});
    preloadNear(Math.round(position),1);
    new ResizeObserver(readSize).observe(pin);
    addEventListener('scroll',readScroll,{passive:true});
    document.querySelector('.replay-camera').addEventListener('click',()=>{
      window.scrollTo({top:0,behavior:'instant'});progress=0;position=0;introPlaying=true;dirty=true;previousTime=0;readScroll();
    });
    requestAnimationFrame(tick);
  }catch(error){failed=true;fallback(error)}
})();
