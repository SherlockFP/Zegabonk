import bpy
import os
from mathutils import Vector
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SOURCE = os.path.join(ROOT, "assets", "sources")
OUT = os.path.join(ROOT, "assets", "models", "production", "kenney_runner.glb")
PREVIEW = os.path.join(ROOT, "assets", "models", "production", "kenney_runner_preview.png")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for collection in (bpy.data.materials, bpy.data.armatures, bpy.data.meshes, bpy.data.actions):
    for block in list(collection):
        collection.remove(block)

bpy.ops.import_scene.fbx(filepath=os.path.join(SOURCE, "Model", "characterMedium.fbx"))
hero = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
hero.name = "KenneyRunner"
hero.scale = (1.1, 1.1, 1.1)

mesh = next(obj for obj in hero.children_recursive if obj.type == "MESH")
texture_path = os.path.join(SOURCE, "Skins", "skaterMaleA.png")
image = bpy.data.images.load(texture_path, check_existing=True)
material = bpy.data.materials.new("Runner_Cloth")
material.use_nodes = True
bsdf = material.node_tree.nodes.get("Principled BSDF")
texture = material.node_tree.nodes.new("ShaderNodeTexImage")
texture.image = image
material.node_tree.links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.72
mesh.data.materials.clear()
mesh.data.materials.append(material)

for action in list(bpy.data.actions):
    bpy.data.actions.remove(action)
if hero.animation_data is None:
    hero.animation_data_create()

animated_bones = (
    "Hips", "Spine", "Chest", "UpperChest", "Neck", "Head",
    "LeftArm", "LeftForeArm", "RightArm", "RightForeArm",
    "LeftUpLeg", "LeftLeg", "RightUpLeg", "RightLeg",
)

def make_action(name, poses):
    action = bpy.data.actions.new(name)
    hero.animation_data.action = action
    rest_pose = {
        "LeftArm": (1.45, 0, 0), "RightArm": (-1.45, 0, 0),
        "LeftForeArm": (0.18, 0, 0), "RightForeArm": (-0.18, 0, 0),
    }
    for frame, pose_overrides in poses:
        pose = rest_pose | pose_overrides
        bpy.context.scene.frame_set(frame)
        for bone_name in animated_bones:
            bone = hero.pose.bones.get(bone_name)
            if bone is None:
                continue
            bone.rotation_mode = "XYZ"
            bone.rotation_euler = pose.get(bone_name, (0, 0, 0))
            bone.keyframe_insert(data_path="rotation_euler", frame=frame)
    return action

idle = make_action("Idle", (
    (1, {"Spine": (0.02, 0, 0), "Chest": (-0.02, 0, 0), "Head": (0.03, 0, 0)}),
    (15, {"Spine": (-0.025, 0, 0), "Chest": (0.03, 0, 0), "Head": (-0.02, 0, 0)}),
    (30, {"Spine": (0.02, 0, 0), "Chest": (-0.02, 0, 0), "Head": (0.03, 0, 0)}),
))
locomotion = make_action("Locomotion", (
    (1, {"LeftArm": (1.05, 0, 0), "RightArm": (-1.05, 0, 0), "LeftUpLeg": (-0.58, 0, 0), "RightUpLeg": (0.58, 0, 0), "Spine": (0.05, 0, 0)}),
    (8, {"LeftArm": (1.45, 0, 0), "RightArm": (-1.45, 0, 0), "LeftUpLeg": (0, 0, 0), "RightUpLeg": (0, 0, 0)}),
    (15, {"LeftArm": (1.85, 0, 0), "RightArm": (-1.85, 0, 0), "LeftUpLeg": (0.58, 0, 0), "RightUpLeg": (-0.58, 0, 0), "Spine": (0.05, 0, 0)}),
    (22, {"LeftArm": (1.45, 0, 0), "RightArm": (-1.45, 0, 0), "LeftUpLeg": (0, 0, 0), "RightUpLeg": (0, 0, 0)}),
    (30, {"LeftArm": (1.05, 0, 0), "RightArm": (-1.05, 0, 0), "LeftUpLeg": (-0.58, 0, 0), "RightUpLeg": (0.58, 0, 0), "Spine": (0.05, 0, 0)}),
))
air_land = make_action("Air_Land", (
    (1, {"LeftArm": (1.25, 0, 0), "RightArm": (-1.25, 0, 0), "LeftUpLeg": (-0.25, 0, 0), "RightUpLeg": (-0.25, 0, 0)}),
    (6, {"LeftArm": (0.75, 0, 0), "RightArm": (-0.75, 0, 0), "LeftUpLeg": (0.7, 0, 0), "RightUpLeg": (0.7, 0, 0), "Spine": (-0.12, 0, 0)}),
    (14, {"LeftUpLeg": (0, 0, 0), "RightUpLeg": (0, 0, 0), "Spine": (0, 0, 0)}),
))
hero.animation_data.action = idle
corners = [hero.matrix_world @ Vector(corner) for corner in hero.bound_box]
minimum = Vector((min(p.x for p in corners), min(p.y for p in corners), min(p.z for p in corners)))
maximum = Vector((max(p.x for p in corners), max(p.y for p in corners), max(p.z for p in corners)))
center = (minimum + maximum) * 0.5
size = maximum - minimum
bpy.context.scene.render.engine = "BLENDER_EEVEE"
bpy.context.scene.render.resolution_x = 800
bpy.context.scene.render.resolution_y = 800
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.film_transparent = False
bpy.context.scene.world.color = (0.035, 0.05, 0.08)
camera_data = bpy.data.cameras.new("PreviewCamera")
camera = bpy.data.objects.new("PreviewCamera", camera_data)
bpy.context.collection.objects.link(camera)
camera.location = center + Vector((1.4, -2.2, 1.0)).normalized() * max(size.y * 1.5, 5.0)
camera.rotation_euler = ((center - camera.location).to_track_quat("-Z", "Y")).to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = max(size.y, size.x * 1.2, size.z * 1.2) * 1.25
bpy.context.scene.camera = camera
light_data = bpy.data.lights.new("PreviewKey", "AREA")
light_data.energy = 900
light_data.shape = "DISK"
light_data.size = 5
light = bpy.data.objects.new("PreviewKey", light_data)
bpy.context.collection.objects.link(light)
light.location = center + Vector((1.0, -1.2, 1.6)).normalized() * max(size.y, 4.0)
light.rotation_euler = ((center - light.location).to_track_quat("-Z", "Y")).to_euler()
bpy.context.scene.render.filepath = PREVIEW
bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action="DESELECT")
for obj in [hero, *hero.children_recursive]:
    obj.select_set(True)
bpy.context.view_layer.objects.active = hero
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + ".blend")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_animations=True, export_animation_mode="ACTIONS", export_yup=True, export_apply=True)
print(f"EXPORTED {OUT}")
print("CLIPS", [action.name for action in bpy.data.actions])