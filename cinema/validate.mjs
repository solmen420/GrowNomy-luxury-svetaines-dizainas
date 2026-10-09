import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../..');
let bytes=0,count=0;
for(const variant of ['desktop','mobile']){
 const dir=path.join(root,'dist/assets/studio',variant);
 const track=JSON.parse(fs.readFileSync(path.join(dir,'track.json')));
 assert.equal(track.frames.length,181);
 for(let i=0;i<181;i++){
  const quad=track.frames[i];assert.equal(quad.length,4);
  quad.forEach(p=>{assert.equal(p.length,2);assert(p.every(Number.isFinite))});
  const file=path.join(dir,String(i).padStart(3,'0')+'.webp'),image=fs.readFileSync(file);
  assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');
  bytes+=image.length;count++;
 }
 const q=track.frames[180],w=(q[1][0]-q[0][0])*track.width,h=(q[3][1]-q[0][1])*track.height;
 assert(Math.abs(w/h-track.screenRatio)<.00001,'Final physical aspect ratio');
 assert(Math.abs(q[0][1]-q[1][1])<.00001,'Final camera is not level');
 console.log(variant+': 181 frames, valid screen track, front-facing aspect '+(w/h).toFixed(6));
}
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:\?[^"]*)?"/g)){
 assert(fs.existsSync(path.join(root,'dist',match[1])),'Missing asset '+match[1]);
}
assert(!html.includes('luxury-stage.js'),'WebGL stage still active');
assert(!html.includes('video-stage.js'),'Legacy player still active');
console.log(count+' frames / '+(bytes/1048576).toFixed(2)+' MiB. HTML assets verified.');
