import bpy,math,os
from mathutils import Vector
# Blender includes numpy; screen graphic prepared separately.
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.cycles.use_denoising=True;s.render.resolution_x=1280;s.render.resolution_y=720;s.render.resolution_percentage=100;s.render.fps=24;s.frame_start=1;s.frame_end=72;s.render.image_settings.file_format='PNG';s.render.filepath='/tmp/cinematic-render/frames/'
s.world.color=(.17,.17,.17);s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.24,.27,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.35
s.view_settings.view_transform='AgX'
def mat(name,color,metal=0,rough=.45):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Metallic'].default_value=metal;n.inputs['Roughness'].default_value=rough;return m
wood=mat('Natural walnut',(.19,.08,.035),0,.35);ns=wood.node_tree.nodes;lk=wood.node_tree.links;tc=ns.new('ShaderNodeTexCoord');mp=ns.new('ShaderNodeMapping');mp.inputs['Scale'].default_value=(1,45,5);lk.new(tc.outputs['Generated'],mp.inputs['Vector']);noise=ns.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=3.3;noise.inputs['Detail'].default_value=3;lk.new(mp.outputs[0],noise.inputs['Vector']);r=ns.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.22;r.color_ramp.elements[0].color=(.06,.019,.007,1);r.color_ramp.elements[1].position=.78;r.color_ramp.elements[1].color=(.32,.14,.058,1);lk.new(noise.outputs['Fac'],r.inputs['Fac']);lk.new(r.outputs['Color'],ns.get('Principled BSDF').inputs['Base Color']);bump=ns.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.012;lk.new(noise.outputs['Fac'],bump.inputs['Height']);lk.new(bump.outputs[0],ns.get('Principled BSDF').inputs['Normal'])
silver=mat('Brushed silver',(.53,.56,.61),.88,.27);black=mat('Graphite',(.011,.013,.017),.18,.36);brass=mat('Aged champagne brass',(.51,.33,.12),.8,.26);stone=mat('Warm plaster',(.34,.31,.26),0,.85);cream=mat('Ivory book',(.58,.51,.41),0,.7)
def cube(name,loc,size,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:mod=o.modifiers.new('Precision softened edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def cyl(name,loc,radius,depth,material):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(material);o.modifiers.new('Soft normals','WEIGHTED_NORMAL');return o
cube('Walnut desk',(0,0,-.14),(11,7,.25),wood,.06);cube('Desk side support',(-4,0,-1.5),(.18,5,2.7),black,.03);cube('Desk side support',(4,0,-1.5),(.18,5,2.7),black,.03)
cube('Travertine wall',(0,4,3),(18,.2,10),stone);cube('Floor',(0,0,-3),(20,20,.2),wood)
for i in range(12):cube('Walnut architectural slat',(-6+i*1.08,3.84,3),(.045,.16,8),wood,.015)
# Left window soft light, practical lamp.
def area(name,loc,power,color,size,target):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Large daylight window',(-5,-1,5),1800,(1,.86,.7),5,(0,0,0));area('Soft fill',(3,-5,4),450,(.77,.86,1),4,(0,0,1));area('Warm practical',(3,1,2.1),100,(1,.66,.3),1,(3,1,0))
cyl('Lamp base',(3,1,.04),.5,.08,brass);cyl('Lamp stem',(3,1,1.2),.035,2.3,brass);bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,radius=.65,location=(3,1,2.5));lamp=bpy.context.object;lamp.scale=(1,1,.42);lamp.data.materials.append(brass)
cube('Book',(-3.2,.4,.04),(1.5,1,.09),cream,.018);cube('Leather notebook',(-3.25,.4,.12),(1.55,1.03,.08),black,.03)
# Laptop: z up, front camera y negative. Display plane faces negative y.
cube('Aluminium unibody',(0,0,.035),(3.6,2.2,.09),silver,.075);cube('Keyboard recess',(0,.35,.092),(3.12,1.06,.018),black,.04)
for row in range(5):
 for col in range(14):cube('Key',( -1.44+col*.221,.77-row*.205,.112),(.185,.16,.024),black,.019)
cube('Trackpad',(0,-.71,.086),(1.15,.52,.008),silver,.025)
cube('Laptop screen lid',(0,1.03,1.21),(3.59,.07,2.3),silver,.075);cube('Black glass bezel',(0,.985,1.22),(3.43,.015,2.14),black,.035)
image=bpy.data.images.load('/tmp/cinematic-render/screen.png');sm=bpy.data.materials.new('Luminous assistant display');sm.use_nodes=True;nodes=sm.node_tree.nodes;nodes.clear();tex=nodes.new('ShaderNodeTexImage');tex.image=image;em=nodes.new('ShaderNodeEmission');em.inputs['Strength'].default_value=.8;out=nodes.new('ShaderNodeOutputMaterial');sm.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);sm.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
bpy.ops.mesh.primitive_plane_add(size=2,location=(0,.969,1.22),rotation=(math.pi/2,0,0));screen=bpy.context.object;screen.name='Actual display';screen.scale=(1.64,1.01,1);screen.data.materials.append(sm)
cyl('Coffee cup',(-2,-.5,.24),.19,.42,stone)
# Camera track, above desk -> straight-on screen, ending with display filling viewport.
bpy.ops.object.camera_add();cam=bpy.context.object;s.camera=cam;cam.data.lens=36;cam.data.clip_start=.02
for f,loc,target in [(1,(.3,-.3,8.3),(0,0,0)),(20,(4.4,-5.8,4.5),(0,.5,.6)),(48,(1.1,-3.6,2.5),(0,1,1.22)),(68,(0,-2.25,1.22),(0,1,1.22)),(72,(0,-2.20,1.22),(0,1,1.22))]:
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.keyframe_insert(data_path='location',frame=f);cam.keyframe_insert(data_path='rotation_euler',frame=f)
for fc in cam.animation_data.action.fcurves:
 for kp in fc.keyframe_points:kp.interpolation='BEZIER';kp.handle_left_type='AUTO_CLAMPED';kp.handle_right_type='AUTO_CLAMPED'
os.makedirs('/tmp/cinematic-render/frames',exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath='/tmp/cinematic-render/scene.blend');s.frame_set(30);s.render.filepath='/tmp/cinematic-render/test.png';bpy.ops.render.render(write_still=True)
