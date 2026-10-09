import bpy,math,json,os
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
from bpy_extras.object_utils import world_to_camera_view
base=open(os.path.join(ROOT,'base.py')).read();base=base[:base.index('os.makedirs')];base=base.replace("s.render.engine='CYCLES'","s.render.engine='CYCLES'");exec(base.replace('/tmp/cinematic-render/', ROOT+'/'))
s.render.resolution_x=1280;s.render.resolution_y=720;s.render.fps=24;s.frame_end=168;s.render.film_transparent=False;s.cycles.samples=8;s.cycles.use_denoising=True
s.view_settings.view_transform='Standard';s.view_settings.look='None';s.view_settings.exposure=-.5
# Scanned wood grain, roughness and micro-normal instead of procedural stripes.
wood.node_tree.nodes.clear();ns=wood.node_tree.nodes;lk=wood.node_tree.links;out=ns.new('ShaderNodeOutputMaterial');p=ns.new('ShaderNodeBsdfPrincipled');lk.new(p.outputs[0],out.inputs[0]);uv=ns.new('ShaderNodeTexCoord');sep=ns.new('ShaderNodeSeparateXYZ');comb=ns.new('ShaderNodeCombineXYZ');lk.new(uv.outputs['Generated'],sep.inputs[0]);lk.new(sep.outputs['X'],comb.inputs['X']);lk.new(sep.outputs['Y'],comb.inputs['Y']);
for filename,socket in [('wood-color.jpg','Base Color'),('wood-rough.jpg','Roughness')]:
 tex=ns.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(os.path.join(ROOT,'pbr',filename));lk.new(comb.outputs[0],tex.inputs[0]);lk.new(tex.outputs['Color'],p.inputs[socket]);
tex=ns.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(os.path.join(ROOT,'pbr','wood-normal.jpg'));tex.image.colorspace_settings.name='Non-Color';lk.new(comb.outputs[0],tex.inputs[0]);normal=ns.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.18;lk.new(tex.outputs['Color'],normal.inputs['Color']);lk.new(normal.outputs[0],p.inputs['Normal']);p.inputs['Coat Weight'].default_value=.18;p.inputs['Coat Roughness'].default_value=.26
# Darker oil-finished walnut, softly brushed aluminium.
hsv=ns.new('ShaderNodeHueSaturation');hsv.inputs['Saturation'].default_value=.48;hsv.inputs['Value'].default_value=.45
texcolor=[n for n in ns if n.type=='TEX_IMAGE' and 'wood-color' in n.image.filepath][0]
for link in list(lk):
 if link.to_node==p and link.to_socket==p.inputs['Base Color']:lk.remove(link)
lk.new(texcolor.outputs['Color'],hsv.inputs['Color']);lk.new(hsv.outputs[0],p.inputs['Base Color'])
al=silver.node_tree.nodes.get('Principled BSDF');al.inputs['Base Color'].default_value=(.32,.34,.36,1);al.inputs['Metallic'].default_value=.82;al.inputs['Roughness'].default_value=.38
# Photograph-based HDR environment: natural light, reflected room and background.
s.world.node_tree.nodes.clear();wn=s.world.node_tree.nodes;wl=s.world.node_tree.links;env=wn.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(os.path.join(ROOT,'pbr','room.hdr'));bg=wn.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.65;wo=wn.new('ShaderNodeOutputWorld');coord=wn.new('ShaderNodeTexCoord');mapping=wn.new('ShaderNodeMapping');mapping.inputs['Rotation'].default_value[2]=math.radians(95);wl.new(coord.outputs['Generated'],mapping.inputs['Vector']);wl.new(mapping.outputs[0],env.inputs[0]);wl.new(env.outputs[0],bg.inputs[0]);wl.new(bg.outputs[0],wo.inputs[0])
for o in list(bpy.data.objects):
 if o.name.startswith(('Travertine wall','Walnut architectural slat','Floor')):bpy.data.objects.remove(o,do_unlink=True)
brass.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.40
for light in bpy.data.objects:
 if light.type=='LIGHT':light.data.energy*=.65
for image in bpy.data.images:
 if 'wood-rough' in image.name:image.colorspace_settings.name='Non-Color'
# Hinge, tilted display, accurate thin geometry.
base=bpy.data.objects['Aluminium unibody'];base.dimensions.z=.075
lid=bpy.data.objects['Laptop screen lid'];bezel=bpy.data.objects['Black glass bezel'];screen=bpy.data.objects['Actual display']
lid.modifiers['Precision softened edges'].width=.035
base.modifiers['Precision softened edges'].width=.035
screen.scale.x=1.70;screen.scale.y=1.055
bezel.dimensions.x=3.49;bezel.dimensions.z=2.20
# Flush trackpad rather than a raised metallic plaque.
bpy.data.objects['Trackpad'].location.z=.078
for o in list(bpy.data.objects):
 if o.name.startswith('Key') and o.type=='MESH':
  o.dimensions.z=.012;o.location.z=.103
# A continuous spacebar and modifier keys in the bottom row.
for o in list(bpy.data.objects):
 if o.name.startswith('Key') and o.type=='MESH' and o.location.y < .05:bpy.data.objects.remove(o,do_unlink=True)
cube('Space bar',(0,-.05,.103),(1.10,.16,.012),black,.012)
for x in [-1.40,-1.18,-.96,.96,1.18,1.40]:cube('Modifier key',(x,-.05,.103),(.185,.16,.012),black,.012)

bpy.ops.object.empty_add(location=(0,1.03,.06));hinge=bpy.context.object;hinge.name='Physical screen hinge'
for o in [lid,bezel,screen]:
 world=o.matrix_world.copy();o.parent=hinge;o.matrix_world=world
hinge.rotation_euler.x=math.radians(-14)
cyl('Hinge barrel',(0,1.005,.11),.055,3.1,silver).rotation_euler.y=math.pi/2
# Speaker perforations, ports, key legends, trackpad etched outline.
for side in [-1,1]:
 for row in range(12):
  for col in range(3):cyl('Speaker hole',(side*(1.66+col*.018),-.25+row*.075,.083),.007,.003,black)
 for port in range(2):cube('USB C port',(side*1.802,.42-port*.34,.035),(.006,.18,.033),black,.01)
# More convincing key geometry with pale real layout legends.
legendmat=mat('Laser etched legends',(.66,.69,.7),0,.7)
layout=['ESC 1 2 3 4 5 6 7 8 9 0 - = ⌫'.split(),'TAB Q W E R T Y U I O P [ ] \\'.split(),'CAP A S D F G H J K L ; \' ENTER'.split(),'SHIFT Z X C V B N M , . / ↑ SHIFT'.split(),'FN CTRL ALT CMD SPACE SPACE SPACE SPACE CMD ALT ← ↓ →'.split()]
for row in range(4):
 for col,char in enumerate(layout[row][:14]):
  bpy.ops.object.text_add(location=(-1.44+col*.221,.77-row*.205,.113));o=bpy.context.object;o.name='Key legend';o.data.body=char if len(char)<3 else char[:2];o.data.size=.055 if len(char)<3 else .026;o.data.align_x='CENTER';o.data.align_y='CENTER';o.data.extrude=0;o.data.materials.append(legendmat)
# Real rounded lamp shade, not a flattened ball.
old=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('Sphere')];
for o in old:bpy.data.objects.remove(o,do_unlink=True)
verts=[];faces=[];rings=18;segments=64
for j in range(rings+1):
 theta=j/rings*math.pi/2
 for i in range(segments):
  phi=i/segments*2*math.pi;verts.append((3+.65*math.sin(theta)*math.cos(phi),1+.65*math.sin(theta)*math.sin(phi),2.35+.65*math.cos(theta)))
for j in range(rings):
 for i in range(segments):faces.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
mesh=bpy.data.meshes.new('Spun brass dome');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Brass lampshade',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(brass)
for f in o.data.polygons:f.use_smooth=True
solid=o.modifiers.new('Metal wall thickness','SOLIDIFY');solid.thickness=.018
# Desk top has a subtle finished edge and shadow details.
for o in bpy.data.objects:
 if o.type=='MESH':
  for f in o.data.polygons:
   if o.name.startswith(('Lamp','Coffee','Hinge')):f.use_smooth=True
# Matching photographic architecture, softly lit as an interior background.
plate=os.path.join(ROOT,'pbr','room-plate.png')
if os.path.exists(plate):
 m=bpy.data.materials.new('Photographic luxury architecture');m.use_nodes=True;n=m.node_tree.nodes;n.clear();tx=n.new('ShaderNodeTexImage');tx.image=bpy.data.images.load(plate);em=n.new('ShaderNodeEmission');em.inputs['Strength'].default_value=.65;out=n.new('ShaderNodeOutputMaterial');m.node_tree.links.new(tx.outputs['Color'],em.inputs[0]);m.node_tree.links.new(em.outputs[0],out.inputs[0]);bpy.ops.mesh.primitive_plane_add(size=2,location=(-5,7,3),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name='Luxury room photographic wall';o.scale=(18,6,1);o.data.materials.append(m)
 for uv in o.data.uv_layers.active.data:uv.uv.y=.35+uv.uv.y*.65
cube('Walnut room floor',(0,0,-3.2),(35,35,.1),wood)
for ob in list(bpy.data.objects):
 if ob.name.startswith('Coffee cup'):bpy.data.objects.remove(ob,do_unlink=True)
# Photo-projected surface details preserve the chosen laptop's real appearance.
import numpy as np
ref=bpy.data.images.load(os.path.join(ROOT,'pbr','laptop-reference.webp'))
def photo_surface(name,positions,quad):
 # Rectify a photographed quadrilateral onto a subdivided 3D surface via UV.
 src=[(0,0),(1,0),(1,1),(0,1)];a=[];b=[]
 for (x,y),(u,v) in zip(src,quad):
  a.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]);b.extend([u,v])
 H=np.append(np.linalg.solve(np.array(a),np.array(b)),1).reshape(3,3)
 vs=[];fs=[];uvs=[];N=24
 for j in range(N+1):
  v=j/N
  for i in range(N+1):
   u=i/N;P=(1-v)*((1-u)*Vector(positions[0])+u*Vector(positions[1]))+v*((1-u)*Vector(positions[3])+u*Vector(positions[2]));vs.append(tuple(P));q=H@np.array([u,v,1]);q=q/q[2];uvs.append((q[0]/1672,1-q[1]/941))
 for j in range(N):
  for i in range(N):
   k=j*(N+1)+i;fs.append((k,k+1,k+N+2,k+N+1))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.update();uv=mesh.uv_layers.new()
 for poly in mesh.polygons:
  for loop in poly.loop_indices:uv.data[loop].uv=uvs[mesh.loops[loop].vertex_index]
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
 m=bpy.data.materials.new(name+' photographic material');m.use_nodes=True;ns=m.node_tree.nodes;lk=m.node_tree.links;p=ns.get('Principled BSDF');tx=ns.new('ShaderNodeTexImage');tx.image=ref;lk.new(tx.outputs['Color'],p.inputs['Base Color']);lk.new(tx.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=0;p.inputs['Roughness'].default_value=.55;p.inputs['Metallic'].default_value=.10;out=ns.get('Material Output');em=ns.new('ShaderNodeEmission');em.inputs['Strength'].default_value=1.414;lk.new(tx.outputs['Color'],em.inputs[0]);lk.new(em.outputs[0],out.inputs['Surface']);o.data.materials.append(m);return o
for o in list(bpy.data.objects):
 if o.name.startswith(('Key','Modifier','Space bar','Speaker','Trackpad','Keyboard recess','Black glass bezel')):bpy.data.objects.remove(o,do_unlink=True)
# Real photographic keyboard and brushed aluminium palm rest.
photo_surface('Photographic aluminium and keyboard',[(-1.8,1.1,.080),(1.8,1.1,.080),(1.8,-1.1,.080),(-1.8,-1.1,.080)],[(427,684),(1233,684),(1370,864),(285,864)])
# Front frame uses the same source photo, without an invented bezel.
lidplate=photo_surface('Photographic display surround',[(-1.795,.96,2.36),(1.795,.96,2.36),(1.795,.96,.06),(-1.795,.96,.06)],[(452,203),(1223,203),(1233,683),(428,683)])
lidplate.parent=hinge;lidplate.location=(0,-1.03,-.06)
screen.scale=(1.675,1.0,1)
# The browser renders actual HTML on this tracked physical screen.
sm.node_tree.nodes.clear();n=sm.node_tree.nodes;lk=sm.node_tree.links;em=n.new('ShaderNodeEmission');em.inputs[0].default_value=(.83,.83,.80,1);em.inputs[1].default_value=.8;out=n.new('ShaderNodeOutputMaterial');lk.new(em.outputs[0],out.inputs[0])
# Continuous keyframed camera descent, arc, and final approach.
cam.animation_data_clear();cam.data.lens=42
keys=[(1,(1.0,-1.5,15.0),(0,0,.1)),(48,(5.5,-8.0,5.8),(0,.55,.8)),(95,(1.5,-3.7,2.3),(0,1.3,1.25)),(132,(.15,-2.8,1.8),(0,1.28,1.18)),(168,(0,-1.31,1.84),(0,1.31,1.185))]
for f,loc,target in keys:
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.keyframe_insert(data_path='location',frame=f);cam.keyframe_insert(data_path='rotation_euler',frame=f)
for fc in cam.animation_data.action.fcurves:
 for kp in fc.keyframe_points:kp.interpolation='BEZIER';kp.handle_left_type='AUTO_CLAMPED';kp.handle_right_type='AUTO_CLAMPED'
# Vertex order of a Blender plane is bottom-left, bottom-right, top-right, top-left in local UV.
track=[]
for f in range(1,169):
 s.frame_set(f);bpy.context.view_layer.update();corners=[]
 for i in [2,3,1,0]:
  co=world_to_camera_view(s,cam,screen.matrix_world @ screen.data.vertices[i].co);corners.append([co.x,1-co.y])
 track.append(corners)
json.dump({'fps':24,'frames':track,'introFrames':48},open(os.path.join(ROOT,'screen-track.json'),'w'))
os.makedirs('/tmp/cinematic-render/proframes',exist_ok=True);s.render.filepath=os.path.join(ROOT,'frames/')
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'camera-scene.blend'));s.frame_set(1);s.render.filepath=os.path.join(ROOT,'ceiling-control.png');bpy.ops.render.render(write_still=True)
