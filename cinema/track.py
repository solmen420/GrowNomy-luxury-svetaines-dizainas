import os
ROOT=os.path.dirname(os.path.abspath(__file__))
import bpy,json,numpy as np
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'camera-scene.blend'));s=bpy.context.scene;lid=bpy.data.objects['Photographic display surround'];frames=[]
frame_quad=[(452,203),(1223,203),(1233,683),(428,683)];unit=[(0,0),(1,0),(1,1),(0,1)];a=[];b=[]
for (x,y),(u,v) in zip(frame_quad,unit):
 a.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]);b.extend([u,v])
H=np.append(np.linalg.solve(np.array(a),np.array(b)),1).reshape(3,3);points=[]
for x,y in [(468,230),(1204,230),(1217,650),(449,650)]:
 p=H@np.array([x,y,1]);u,v=p[0]/p[2],p[1]/p[2];points.append(Vector((-1.795+3.59*u,.958,2.36-2.3*v)))
for f in range(1,169):
 s.frame_set(f);bpy.context.view_layer.update();quad=[]
 for point in points:
  p=world_to_camera_view(s,s.camera,lid.matrix_world @ point);quad.append([p.x,1-p.y])
 frames.append(quad)
json.dump({'fps':24,'frames':frames,'introFrames':48},open(os.path.join(ROOT,'screen-track.json'),'w'))
