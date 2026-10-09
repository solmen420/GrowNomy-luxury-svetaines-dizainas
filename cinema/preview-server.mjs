import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),dist=path.join(root,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:4173');
  if(req.method==='POST'){
   if(req.headers.origin!=='http://127.0.0.1:4173'){res.writeHead(403).end();return}
   const match=url.pathname.match(/^\/__render\/(desktop|mobile)\/(\d{3}\.webp|track\.json)$/);
   if(!match){res.writeHead(404).end();return}
   const chunks=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>5000000)throw Error('Too large');chunks.push(chunk)}
   const dir=path.join(dist,'assets','studio',match[1]);fs.mkdirSync(dir,{recursive:true});
   fs.writeFileSync(path.join(dir,match[2]),Buffer.concat(chunks));res.writeHead(201).end('Saved');return;
  }
  const base=url.pathname.startsWith('/__tools/')?path.join(root,'source','cinema'):dist;
  const relative=url.pathname.startsWith('/__tools/')?url.pathname.slice(9):url.pathname;
  const file=path.resolve(base,'.'+(relative.startsWith('/')?relative:'/'+relative),relative==='/'?'index.html':'');
  if(!file.startsWith(base+path.sep)){res.writeHead(403).end();return}
  const stat=fs.statSync(file);if(!stat.isFile())throw Error('Not found');
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(404).end('Not found')}
});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
