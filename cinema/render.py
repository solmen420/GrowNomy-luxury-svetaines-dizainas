import os
ROOT=os.path.dirname(os.path.abspath(__file__))
import bpy,os,time
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'camera-scene.blend'))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=8;s.cycles.use_denoising=True;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.use_persistent_data=True
os.makedirs(os.path.join(ROOT,'frames'),exist_ok=True)
for f in range(1,169):
 path=os.path.join(ROOT,'frames','%04d.png'%f)
 if os.path.exists(path):continue
 s.frame_set(f);s.render.filepath=path;bpy.ops.render.render(write_still=True)
 print('CINEMA_FRAME',f,'OF',168,flush=True)
