(()=>{
const section=document.querySelector('.cinema'),portal=document.querySelector('.screen-portal'),photo=document.querySelector('.tracked-photo');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,started=performance.now();
// Measured inner display corners in the original 1672 × 941 photograph.
const display=[[856,347],[1223,363],[1171,630],[797,593]];
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
function homography(from,to){
 const a=[],b=[];
 for(let i=0;i<4;i++){const [x,y]=from[i],[u,v]=to[i];a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)}
 for(let j=0;j<8;j++){let pivot=j;for(let k=j+1;k<8;k++)if(Math.abs(a[k][j])>Math.abs(a[pivot][j]))pivot=k;[a[j],a[pivot]]=[a[pivot],a[j]];[b[j],b[pivot]]=[b[pivot],b[j]];const d=a[j][j];for(let k=j;k<8;k++)a[j][k]/=d;b[j]/=d;for(let i=0;i<8;i++)if(i!==j){const q=a[i][j];for(let k=j;k<8;k++)a[i][k]-=q*a[j][k];b[i]-=q*b[j]}}
 return `matrix3d(${b[0]},${b[3]},0,${b[6]},${b[1]},${b[4]},0,${b[7]},0,0,1,0,${b[2]},${b[5]},0,1)`;
}
let queued=false,progress=0;
function render(now){
 queued=false;const w=innerWidth,h=innerHeight,r=section.getBoundingClientRect();const p=clamp(-r.top/(section.offsetHeight-h));
 // A continuous single-photo approach. No shot crossfades or detached overlay.
 const intro=reduced?1:smooth((now-started)/3800),scale=Math.max(w/1672,h/941)*(1.12-.12*intro);
 const ox=(w-1672*scale)/2,oy=(h-941*scale)/2;
 const initial=display.map(([x,y])=>[x*scale+ox,y*scale+oy]);
 const target=[[0,0],[w,0],[w,h],[0,h]],t=smooth(p/.8);
 const quad=initial.map((point,i)=>point.map((v,j)=>v+(target[i][j]-v)*t));
 photo.style.transform=homography(display,quad);
 portal.style.width=w+'px';portal.style.height=h+'px';portal.style.transform=homography(target,quad);
 portal.style.pointerEvents=p>.8?'auto':'none';section.style.setProperty('--copy',1-smooth(p/.18));
 if(p>.80)window.startCinematicChat?.();progress=p;
 if(intro<1&&!reduced){queued=true;requestAnimationFrame(render)}
}
function update(){if(!queued){queued=true;requestAnimationFrame(render)}}
addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
})();
