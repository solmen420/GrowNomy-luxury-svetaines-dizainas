import * as THREE from '/assets/vendor/three.module.js';
const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10)};
export async function createStudio(width,height,mobile=false){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.setSize(width,height);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#29382f');
  scene.fog=new THREE.Fog('#17201c',18,42);
  const camera=new THREE.PerspectiveCamera(39,1,.03,70);camera.up.set(0,0,1);
  const mat=(color,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const titanium=mat('#737b76',.48,.65);
  const edgeMetal=mat('#949c93',.4,.7);
  const graphite=mat('#141918',.44,.12);
  const keysMaterial=mat('#252b28',.52,.03);
  const brass=mat('#ad9161',.28,.83);
  const plaster=mat('#68695c',.94);
  const darkPlaster=mat('#26342e',.92);
  const walnut=new THREE.MeshStandardMaterial({color:'#958070',roughness:.42,metalness:0});
  const textureLoader=new THREE.TextureLoader();
  const textures=await Promise.allSettled(['wood-color.jpg','wood-normal.jpg','wood-rough.jpg'].map(name=>textureLoader.loadAsync('/assets/materials/'+name)));
  if(textures[0].status==='fulfilled'){walnut.map=textures[0].value;walnut.map.colorSpace=THREE.SRGBColorSpace}
  if(textures[1].status==='fulfilled'){walnut.normalMap=textures[1].value;walnut.normalScale=new THREE.Vector2(.18,.18)}
  if(textures[2].status==='fulfilled')walnut.roughnessMap=textures[2].value;
  for(const result of textures)if(result.status==='fulfilled'){const tx=result.value;tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(1.3,1.3);tx.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())}

  function rounded(w,h,r){
    const s=new THREE.Shape(),x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
    s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
    s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
  }
  function slab(w,h,d,r,material,x=0,y=0,z=0,parent=scene,bevel=.015){
    const g=new THREE.ExtrudeGeometry(rounded(w,h,r),{depth:d,bevelEnabled:bevel>0,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:12});
    g.translate(0,0,-d/2);const o=new THREE.Mesh(g,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
  }
  function box(w,d,h,material,x,y,z,parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,d,h),material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
  function cylinder(rt,rb,h,material,x,y,z,parent=scene){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,64),material);o.rotation.x=Math.PI/2;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o}

  // An architectural set: oil-finished walnut, stone, blackened bronze and daylight.
  slab(10.8,6.2,.26,.14,walnut,0,0,-.18,scene,.04);
  box(.3,4.6,2.7,graphite,-4.35,0,-1.64);box(.3,4.6,2.7,graphite,4.35,0,-1.64);
  box(32,32,.2,mat('#30372f',.93),0,0,-3.1);
  box(25,.3,13,darkPlaster,0,6,3.1);
  box(.3,20,13,plaster,-7,0,3.1);
  box(6.1,.13,6.7,plaster,1.1,5.79,2.1);
  for(let i=0;i<8;i++)box(.027,.06,6.7,brass,-1.72+i*.805,5.69,2.1);
  box(25,.8,.17,walnut,0,5.4,.13);
  const glow=new THREE.MeshBasicMaterial({color:'#ead5aa'});
  box(23,.024,.025,glow,0,5.38,.24);
  // Window mullions and a soft architectural aperture in the left wall.
  box(.035,7.8,6.4,new THREE.MeshBasicMaterial({color:'#c9d3c4'}),-6.81,-1.4,3.1);
  for(let i=0;i<6;i++)box(.065,.06,6.45,graphite,-6.76,-5.22+i*1.53,3.1);
  box(.075,7.8,.065,graphite,-6.76,-1.4,3.1);
  // A restrained relief composition, inset into the far wall.
  const art=box(3,.11,2.5,mat('#17251e',.82),-4.2,5.72,2.9);
  for(let i=0;i<7;i++){
    const curve=new THREE.EllipseCurve(0,0,.31+i*.13,.5+i*.095,0,Math.PI*1.72,false,.33);
    const pts=curve.getPoints(80).map(p=>vec(p.x-4.2,5.62,p.y+2.9));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#9e916e',transparent:true,opacity:.64})));
  }
  // Desk objects use real geometry, not a stretched photographic keyboard.
  const book=slab(1.55,1.12,.075,.024,mat('#d6cdb8',.8),-3.1,.35,-.002);book.rotation.z=-.13;
  const journal=slab(1.58,1.15,.065,.027,mat('#26342e',.76),-3.1,.35,.08);journal.rotation.z=-.13;
  const pen=cylinder(.024,.024,1.31,brass,-2.21,.02,.035);pen.rotation.set(0,Math.PI/2,-.14);
  cylinder(.24,.22,.34,mat('#d0c3a8',.83),-2.9,-1.15,.12);
  cylinder(.207,.207,.006,mat('#2c2117',.37),-2.9,-1.15,.293);
  cylinder(.43,.47,.065,brass,3.25,1.1,.006);
  cylinder(.025,.025,2.5,brass,3.25,1.1,1.26);
  const shade=new THREE.Mesh(new THREE.SphereGeometry(.67,64,32,0,Math.PI*2,0,Math.PI/2),brass);
  shade.rotation.x=Math.PI/2;shade.position.set(3.25,1.1,2.50);shade.castShadow=true;scene.add(shade);
  const diffuser=new THREE.Mesh(new THREE.CircleGeometry(.64,64),new THREE.MeshBasicMaterial({color:'#f3d59e',side:THREE.DoubleSide}));diffuser.position.set(3.25,1.1,2.496);scene.add(diffuser);
  const practical=new THREE.PointLight('#ffd494',18,8,2);practical.position.set(3.25,1.1,2.35);scene.add(practical);

  // Precision laptop construction. The HTML plane uses these exact four vertices.
  const laptop=new THREE.Group();scene.add(laptop);
  slab(3.64,2.35,.077,.115,titanium,0,0,.014,laptop,.012);
  slab(3.61,2.32,.009,.108,edgeMetal,0,0,.061,laptop,.004);
  slab(3.19,1.16,.008,.054,graphite,0,.37,.074,laptop,.004);
  const keyGeo=new THREE.ExtrudeGeometry(rounded(.177,.149,.017),{depth:.013,bevelEnabled:true,bevelSegments:2,bevelSize:.006,bevelThickness:.005,curveSegments:4});
  const keyMesh=new THREE.InstancedMesh(keyGeo,keysMaterial,56),dummy=new THREE.Object3D();
  for(let r=0;r<4;r++)for(let c=0;c<14;c++){dummy.position.set(-1.435+c*.221,.79-r*.219,.077);dummy.updateMatrix();keyMesh.setMatrixAt(r*14+c,dummy.matrix)}
  keyMesh.castShadow=true;keyMesh.receiveShadow=true;laptop.add(keyMesh);
  slab(1.28,.15,.012,.015,keysMaterial,0,-.075,.088,laptop,.005);
  for(const x of [-1.43,-1.2,-.975,.975,1.2,1.43])slab(.18,.15,.012,.015,keysMaterial,x,-.075,.088,laptop,.005);
  // Crisp, deterministic key legends at every viewing scale.
  const legendCanvas=document.createElement('canvas');legendCanvas.width=2048;legendCanvas.height=780;
  const ink=legendCanvas.getContext('2d');ink.fillStyle='#d8ded5';ink.textAlign='center';ink.textBaseline='middle';
  const rows=['esc 1 2 3 4 5 6 7 8 9 0 − =','tab Q W E R T Y U I O P [ ] \\','caps A S D F G H J K L ; ’ ↵','shift Z X C V B N M , . / ↑ shift'].map(x=>x.split(' '));
  rows.forEach((row,r)=>row.forEach((ch,c)=>{ink.font=(ch.length>1?'19':'29')+'px Arial';ink.fillText(ch,(c+.5)*(2048/14),(r+.5)*(780/4))}));
  const legends=new THREE.CanvasTexture(legendCanvas);legends.colorSpace=THREE.SRGBColorSpace;legends.anisotropy=8;
  const legendPlane=new THREE.Mesh(new THREE.PlaneGeometry(3.094,.876),new THREE.MeshBasicMaterial({map:legends,transparent:true,depthWrite:false,toneMapped:false}));
  legendPlane.position.set(0,.4615,.099);laptop.add(legendPlane);
  slab(1.24,.58,.002,.035,mat('#777e76',.38,.65),0,-.68,.075,laptop,.001);
  slab(1.224,.564,.002,.032,titanium,0,-.68,.078,laptop,.001);
  const holeGeo=new THREE.CircleGeometry(.006,7),holes=new THREE.InstancedMesh(holeGeo,graphite,144);
  let holeIndex=0;for(const side of [-1,1])for(let r=0;r<24;r++)for(let c=0;c<3;c++){dummy.position.set(side*(1.675+c*.025),.85-r*.041,.073);dummy.updateMatrix();holes.setMatrixAt(holeIndex++,dummy.matrix)}laptop.add(holes);
  for(const side of [-1,1])for(let i=0;i<2;i++)box(.008,.18,.018,graphite,side*1.833,.6-i*.31,.015,laptop);
  const hinge=new THREE.Group();hinge.position.set(0,1.083,.094);hinge.rotation.x=-.19;laptop.add(hinge);
  const lid=slab(3.64,2.34,.058,.09,titanium,0,0,1.17,hinge,.012);lid.rotation.x=Math.PI/2;
  const bezel=slab(3.526,2.228,.009,.063,graphite,0,-.037,1.17,hinge,.003);bezel.rotation.x=Math.PI/2;
  const display=new THREE.Mesh(new THREE.PlaneGeometry(3.32,2.024),new THREE.MeshBasicMaterial({color:'#f0ede4',toneMapped:false}));
  display.rotation.x=Math.PI/2;display.position.set(0,-.046,1.17);hinge.add(display);
  const webcam=new THREE.Mesh(new THREE.SphereGeometry(.012,12,8),mat('#0d222d',.1,.6));webcam.position.set(0,-.05,2.263);hinge.add(webcam);
  const hingeBar=cylinder(.045,.045,3.19,titanium,0,1.075,.1,laptop);hingeBar.rotation.set(0,0,Math.PI/2);

  // Studio reflections are generated once, separately from the visible camera.
  const envScene=new THREE.Scene();envScene.background=new THREE.Color('#99968b');
  function panel(w,h,color,x,y,z,rx,ry){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));p.position.set(x,y,z);p.rotation.set(rx,ry,0);envScene.add(p)}
  panel(7,7,'#fff6dc',-5,1,3,0,Math.PI/2);panel(4,9,'#ccd7da',4,2,2,0,-Math.PI/2);panel(12,12,'#ddd9cc',0,0,8,0,0);panel(20,20,'#3c493e',0,0,-4,0,0);
  const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,.035,.1,50).texture;scene.environmentIntensity=.64;pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#dce5d9','#18241c',.7));
  const sun=new THREE.DirectionalLight('#fff0d3',3.1);sun.position.set(-5,-3,8);sun.target.position.set(0,1,0);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.5,far:24});sun.shadow.normalBias=.022;sun.shadow.bias=-.0002;sun.shadow.radius=3;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#c7d9d4',.75);fill.position.set(4,-5,4);scene.add(fill);
  scene.updateMatrixWorld(true);
  const physicalCorners=[vec(-1.66,1.012,0),vec(1.66,1.012,0),vec(1.66,-1.012,0),vec(-1.66,-1.012,0)].map(p=>display.localToWorld(p));
  const center=display.getWorldPosition(new THREE.Vector3());
  const normal=vec(0,0,1).applyQuaternion(display.getWorldQuaternion(new THREE.Quaternion()));

  camera.aspect=width/height;camera.updateProjectionMatrix();
  const fov=Math.tan(THREE.MathUtils.degToRad(19.5));
  const distance=Math.max(2.024/(2*fov*.70),3.32/(2*fov*camera.aspect*.82));
  const front=center.clone().addScaledVector(normal,distance);
  const wide=mobile?vec(3.2,-12.8,7.4):vec(5.7,-8.7,5.8);
  const overhead=mobile?vec(1.6,-5.4,17):vec(3.4,-1.7,12.6);
  const wideLook=mobile?vec(0,.45,3.1):vec(-1.55,.45,.7);
  const overheadLook=mobile?vec(0,0,2.1):vec(-.45,.1,.2);
  const control=mobile?vec(2.6,-9.8,6.1):vec(5.3,-6.7,4.6);
  const look=new THREE.Vector3();
  function render(q){
    if(q<=1){const t=ease(q);camera.position.copy(overhead).lerp(wide,t);look.copy(overheadLook).lerp(wideLook,t)}
    else{const t=ease(q-1);camera.position.copy(wide).multiplyScalar((1-t)**2).addScaledVector(control,2*(1-t)*t).addScaledVector(front,t*t);look.copy(wideLook).lerp(center,t)}
    camera.lookAt(look);camera.updateMatrixWorld();
    renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;
    return physicalCorners.map(point=>{const p=point.clone().project(camera);return [(p.x+1)*.5,(1-p.y)*.5]});
  }
  return {canvas:renderer.domElement,render,dispose:()=>renderer.dispose()};
}
