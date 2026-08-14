import bpy
import math
import os
from mathutils import Vector


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "assets", "models", "prototype")
PREVIEW_DIR = os.path.join(ROOT, "docs", "generated")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(PREVIEW_DIR, exist_ok=True)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        pass


def material(name, color, roughness=0.78, metallic=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 2.4
    return mat


MATS = {}


def setup_materials():
    MATS.update({
        "skin": material("HeroSkin", (0.64, 0.34, 0.18)),
        "hair": material("HeroHair", (0.025, 0.035, 0.05)),
        "cloth": material("HeroTeal", (0.02, 0.42, 0.52)),
        "cloth_dark": material("HeroNavy", (0.025, 0.07, 0.15)),
        "leather": material("Leather", (0.22, 0.10, 0.04)),
        "metal": material("HammerStone", (0.17, 0.18, 0.22), 0.48, 0.15),
        "cyan": material("RiftCyan", (0.02, 0.62, 0.92), 0.34, 0.05, (0.0, 0.75, 1.0)),
        "goblin": material("GoblinGreen", (0.24, 0.52, 0.13)),
        "goblin_dark": material("GoblinDark", (0.08, 0.17, 0.06)),
        "bone": material("BoneMask", (0.86, 0.82, 0.68)),
        "orange": material("GoblinOrange", (0.84, 0.27, 0.035)),
        "wood": material("ClubWood", (0.29, 0.13, 0.045)),
        "ground": material("Ground", (0.22, 0.48, 0.12)),
        "rock": material("Rock", (0.27, 0.29, 0.30)),
        "gold": material("CrystalGold", (1.0, 0.52, 0.03), 0.3, 0.05, (1.0, 0.3, 0.01)),
    })


def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj


def cube(name, location, scale, mat, bevel=0.0, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("ChunkyBevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return assign(obj, mat)


def ico(name, location, scale, mat, subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return assign(obj, mat)


def cylinder_between(name, start, end, radius, mat, vertices=8):
    start_v = Vector(start)
    end_v = Vector(end)
    delta = end_v - start_v
    midpoint = (start_v + end_v) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=delta.length, location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = delta.to_track_quat("Z", "Y")
    return assign(obj, mat)


def cone(name, location, radius1, radius2, depth, mat, vertices=6, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    return assign(obj, mat)


def parent_all(objects, root):
    for obj in objects:
        if obj != root:
            obj.parent = root


def build_hero(origin=(0, 0, 0)):
    x, y, z = origin
    parts = []
    root = bpy.data.objects.new("Hero_Root", None)
    bpy.context.collection.objects.link(root)
    root.location = origin
    parts.append(ico("Hero_Torso", (x, y, z + 2.65), (0.72, 0.48, 0.95), MATS["cloth_dark"]))
    parts.append(ico("Hero_Chest", (x, y - 0.03, z + 3.05), (0.8, 0.52, 0.72), MATS["cloth"]))
    parts.append(ico("Hero_Head", (x, y, z + 4.15), (0.62, 0.58, 0.68), MATS["skin"]))
    parts.append(cone("Hero_HairBack", (x, y + 0.18, z + 4.38), 0.7, 0.1, 1.0, MATS["hair"], 7, (math.radians(90), 0, 0)))
    for side in (-1, 1):
        parts.append(cone(f"Hero_HairSpike_{side}", (x + side * 0.38, y + 0.1, z + 4.55), 0.28, 0.0, 0.8, MATS["hair"], 5, (0, math.radians(side * 35), math.radians(side * 18))))
    parts.append(cylinder_between("Hero_Leg_L", (x - 0.33, y, z + 2.1), (x - 0.48, y - 0.06, z + 0.9), 0.25, MATS["cloth_dark"], 7))
    parts.append(cylinder_between("Hero_Leg_R", (x + 0.33, y, z + 2.1), (x + 0.58, y + 0.08, z + 1.0), 0.25, MATS["cloth_dark"], 7))
    parts.append(cube("Hero_Boot_L", (x - 0.5, y - 0.16, z + 0.48), (0.28, 0.48, 0.22), MATS["leather"], 0.08))
    parts.append(cube("Hero_Boot_R", (x + 0.62, y - 0.06, z + 0.58), (0.28, 0.48, 0.22), MATS["leather"], 0.08))
    hand_l = (x - 0.86, y, z + 3.0)
    hand_r = (x + 0.9, y, z + 3.18)
    parts.append(cylinder_between("Hero_Arm_L", (x - 0.55, y, z + 3.25), hand_l, 0.2, MATS["skin"], 7))
    parts.append(cylinder_between("Hero_Arm_R", (x + 0.55, y, z + 3.35), hand_r, 0.2, MATS["skin"], 7))
    parts.append(ico("Hero_Hand_L", hand_l, (0.24, 0.24, 0.24), MATS["skin"]))
    parts.append(ico("Hero_Hand_R", hand_r, (0.24, 0.24, 0.24), MATS["skin"]))
    parts.append(cube("Hero_Scarf", (x, y + 0.32, z + 3.63), (0.62, 0.12, 0.16), MATS["cloth"], 0.05, (math.radians(8), 0, 0)))
    parts.append(cube("Hero_ScarfTail", (x - 0.65, y + 0.35, z + 3.58), (0.62, 0.09, 0.15), MATS["cloth"], 0.04, (0, math.radians(-18), math.radians(-18))))
    handle_start = (x + 0.68, y + 0.12, z + 3.0)
    handle_end = (x + 2.45, y + 0.18, z + 4.65)
    parts.append(cylinder_between("Hammer_Handle", handle_start, handle_end, 0.16, MATS["wood"], 8))
    parts.append(cube("Hammer_Head", (x + 2.58, y + 0.18, z + 4.82), (0.82, 0.68, 0.7), MATS["metal"], 0.18, (0, math.radians(-10), math.radians(-5))))
    parts.append(cube("Hammer_Rune", (x + 2.58, y - 0.515, z + 4.82), (0.27, 0.025, 0.28), MATS["cyan"], 0.04, (math.radians(90), 0, 0)))
    parent_all(parts, root)
    return root, parts


def build_goblin(origin=(0, 0, 0)):
    x, y, z = origin
    parts = []
    root = bpy.data.objects.new("Goblin_Root", None)
    bpy.context.collection.objects.link(root)
    parts.append(ico("Goblin_Body", (x, y, z + 1.45), (0.58, 0.42, 0.72), MATS["goblin_dark"]))
    parts.append(ico("Goblin_Head", (x, y, z + 2.38), (0.7, 0.55, 0.62), MATS["goblin"]))
    parts.append(cone("Goblin_Ear_L", (x - 0.78, y, z + 2.45), 0.34, 0.0, 0.92, MATS["goblin"], 5, (0, math.radians(-90), 0)))
    parts.append(cone("Goblin_Ear_R", (x + 0.78, y, z + 2.45), 0.34, 0.0, 0.92, MATS["goblin"], 5, (0, math.radians(90), 0)))
    mask = ico("Goblin_BoneMask", (x, y - 0.5, z + 2.48), (0.53, 0.12, 0.48), MATS["bone"])
    parts.append(mask)
    parts.append(cone("Goblin_MaskHorn_L", (x - 0.32, y - 0.54, z + 2.94), 0.15, 0.0, 0.6, MATS["orange"], 5, (math.radians(-8), 0, math.radians(-22))))
    parts.append(cone("Goblin_MaskHorn_R", (x + 0.32, y - 0.54, z + 2.94), 0.15, 0.0, 0.6, MATS["orange"], 5, (math.radians(-8), 0, math.radians(22))))
    parts.append(cube("Goblin_Eye_L", (x - 0.2, y - 0.625, z + 2.53), (0.08, 0.03, 0.07), MATS["orange"], 0.02))
    parts.append(cube("Goblin_Eye_R", (x + 0.2, y - 0.625, z + 2.53), (0.08, 0.03, 0.07), MATS["orange"], 0.02))
    for side in (-1, 1):
        parts.append(cylinder_between(f"Goblin_Leg_{side}", (x + side * 0.25, y, z + 1.0), (x + side * 0.38, y, z + 0.35), 0.16, MATS["goblin"], 7))
        parts.append(cylinder_between(f"Goblin_Arm_{side}", (x + side * 0.48, y, z + 1.65), (x + side * 0.82, y - 0.08, z + 1.1), 0.15, MATS["goblin"], 7))
    parts.append(cube("Goblin_Scarf", (x, y + 0.35, z + 1.9), (0.62, 0.12, 0.14), MATS["orange"], 0.04))
    parts.append(cylinder_between("Goblin_Club", (x - 0.76, y - 0.08, z + 1.05), (x - 1.25, y - 0.08, z + 0.1), 0.15, MATS["wood"], 7))
    parts.append(ico("Goblin_ClubHead", (x - 1.3, y - 0.08, z + 0.02), (0.34, 0.3, 0.42), MATS["rock"]))
    parent_all(parts, root)
    return root, parts


def build_crystal(origin=(0, 0, 0)):
    x, y, z = origin
    parts = []
    root = bpy.data.objects.new("Crystal_Root", None)
    bpy.context.collection.objects.link(root)
    parts.append(cone("Crystal_Main", (x, y, z + 1.2), 0.52, 0.0, 2.4, MATS["cyan"], 6))
    parts.append(cone("Crystal_Base", (x, y, z + 0.16), 0.52, 0.0, 0.72, MATS["cyan"], 6, (math.pi, 0, 0)))
    for index, (dx, dy, scale) in enumerate(((-0.55, 0.1, 0.55), (0.48, 0.22, 0.42), (0.2, -0.42, 0.32))):
        parts.append(ico(f"Crystal_Rock_{index}", (x + dx, y + dy, z + 0.18), (scale, scale * 0.75, scale * 0.55), MATS["rock"]))
    parent_all(parts, root)
    return root, parts


def export_root(root, parts, filename):
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for obj in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT_DIR, filename),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )


def setup_preview():
    cube("Preview_Ground", (0, 0, -0.2), (7, 5, 0.2), MATS["ground"], 0.15)
    world = bpy.context.scene.world
    world.color = (0.35, 0.65, 0.9)
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.22, 0.55, 0.92, 1.0)
    bg.inputs["Strength"].default_value = 0.7
    bpy.ops.object.light_add(type="AREA", location=(-4, -6, 9))
    key = bpy.context.object
    key.data.energy = 1500
    key.data.shape = "DISK"
    key.data.size = 6
    key.rotation_euler = (math.radians(24), 0, math.radians(-28))
    bpy.ops.object.light_add(type="AREA", location=(5, 2, 5))
    fill = bpy.context.object
    fill.data.energy = 900
    fill.data.color = (0.2, 0.75, 1.0)
    fill.data.size = 5
    bpy.ops.object.camera_add(location=(10.8, -16.5, 8.2))
    camera = bpy.context.object
    target = Vector((0.4, 0, 2.2))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 55
    bpy.context.scene.camera = camera
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.join(PREVIEW_DIR, "model-vertical-slice-v1.png")
    scene.render.film_transparent = False
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, "zegabonk_vertical_slice_v1.blend"))
    bpy.ops.render.render(write_still=True)


reset_scene()
setup_materials()
hero_root, hero_parts = build_hero((-1.8, 0, 0))
goblin_root, goblin_parts = build_goblin((3.2, 0.2, 0))
crystal_root, crystal_parts = build_crystal((0.8, -1.2, 0))
export_root(hero_root, hero_parts, "hero_hammer_v1.glb")
export_root(goblin_root, goblin_parts, "goblin_mask_v1.glb")
export_root(crystal_root, crystal_parts, "rift_crystal_v1.glb")
setup_preview()
