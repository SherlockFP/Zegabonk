import bpy
import math
from pathlib import Path

ROOT = Path(r"C:\Users\Sher\Desktop\zegabonk")
OUT_CREATURES = ROOT / "assets" / "creatures"
OUT_PLAYER = ROOT / "assets" / "models" / "production"
OUT_CREATURES.mkdir(parents=True, exist_ok=True)
OUT_PLAYER.mkdir(parents=True, exist_ok=True)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0:
            bpy.data.materials.remove(block)


def mat(name, color, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    if "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Strength"].default_value = emit
    bsdf.inputs["Roughness"].default_value = 0.45
    return m


def mesh(name, primitive, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), material=None, **kwargs):
    if primitive == "cube":
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    elif primitive == "uv":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=10, ring_count=8, location=loc)
    elif primitive == "ico":
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.5, subdivisions=1, location=loc)
    elif primitive == "cyl":
        bpy.ops.mesh.primitive_cylinder_add(radius=0.5, depth=1, vertices=8, location=loc)
    elif primitive == "cone":
        bpy.ops.mesh.primitive_cone_add(radius1=0.5, depth=1, vertices=6, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = rot
    if material:
        obj.data.materials.append(material)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.location = loc
    return obj


def join_selected(name):
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    min_z = min((obj.matrix_world @ v.co).z for v in obj.data.vertices)
    obj.location.z -= min_z
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def export_glb(obj, path):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_extras=False,
    )


def make_hero():
    body = mat("HeroBody", (0.14, 0.62, 0.88), 0.12)
    skin = mat("HeroSkin", (1.0, 0.78, 0.58))
    armor = mat("HeroArmor", (0.22, 0.42, 0.72), 0.08)
    gold = mat("HeroGold", (1.0, 0.78, 0.22), 0.35)
    cape = mat("HeroCape", (0.12, 0.82, 0.78), 0.2)
    dark = mat("HeroDark", (0.16, 0.2, 0.28))
    mesh("bootL", "cube", loc=(-0.18, 0.12, 0.1), scale=(0.22, 0.32, 0.16), material=armor)
    mesh("bootR", "cube", loc=(0.18, 0.12, 0.1), scale=(0.22, 0.32, 0.16), material=armor)
    mesh("legL", "cyl", loc=(-0.18, 0.0, 0.42), scale=(0.2, 0.2, 0.5), material=dark)
    mesh("legR", "cyl", loc=(0.18, 0.0, 0.42), scale=(0.2, 0.2, 0.5), material=dark)
    mesh("torso", "cube", loc=(0, -0.02, 1.05), scale=(0.62, 0.36, 0.72), material=body)
    mesh("chest", "cube", loc=(0, 0.16, 1.12), scale=(0.5, 0.12, 0.34), material=armor)
    mesh("head", "uv", loc=(0, 0.04, 1.72), scale=(0.56, 0.52, 0.56), material=skin)
    mesh("helm", "uv", loc=(0, 0.0, 1.86), scale=(0.6, 0.56, 0.32), material=armor)
    mesh("eyeL", "uv", loc=(-0.12, 0.24, 1.74), scale=(0.1, 0.08, 0.1), material=mat("EyeW", (1, 1, 1), 0.4))
    mesh("eyeR", "uv", loc=(0.12, 0.24, 1.74), scale=(0.1, 0.08, 0.1), material=mat("EyeW2", (1, 1, 1), 0.4))
    mesh("cape", "cube", loc=(0, -0.28, 1.05), scale=(0.7, 0.08, 1.1), material=cape)
    mesh("hammerHead", "cube", loc=(0.62, 0.22, 1.15), scale=(0.42, 0.42, 0.32), material=gold)
    mesh("hammerHaft", "cyl", loc=(0.42, 0.08, 0.85), scale=(0.08, 0.08, 0.9), rot=(0.6, 0, 0.4), material=dark)
    bpy.ops.object.select_all(action="SELECT")
    return join_selected("CrownBonker")


def make_quadruped(name, color, snout=0.55, ear=True):
    fur = mat(name + "Fur", color, 0.05)
    dark = mat(name + "Dark", (color[0] * 0.45, color[1] * 0.45, color[2] * 0.45))
    mesh("body", "cube", loc=(0, 0, 0.55), scale=(0.55, 0.95, 0.5), material=fur)
    mesh("head", "cube", loc=(0, snout, 0.78), scale=(0.42, 0.42, 0.38), material=fur)
    mesh("snout", "cube", loc=(0, snout + 0.28, 0.68), scale=(0.22, 0.28, 0.18), material=dark)
    if ear:
        mesh("earL", "cone", loc=(-0.18, snout - 0.05, 1.08), scale=(0.12, 0.08, 0.28), material=dark)
        mesh("earR", "cone", loc=(0.18, snout - 0.05, 1.08), scale=(0.12, 0.08, 0.28), material=dark)
    mesh("legFL", "cyl", loc=(-0.22, 0.28, 0.22), scale=(0.12, 0.12, 0.44), material=dark)
    mesh("legFR", "cyl", loc=(0.22, 0.28, 0.22), scale=(0.12, 0.12, 0.44), material=dark)
    mesh("legBL", "cyl", loc=(-0.22, -0.32, 0.22), scale=(0.12, 0.12, 0.44), material=dark)
    mesh("legBR", "cyl", loc=(0.22, -0.32, 0.22), scale=(0.12, 0.12, 0.44), material=dark)
    mesh("tail", "cone", loc=(0, -0.62, 0.62), scale=(0.08, 0.08, 0.4), rot=(1.1, 0, 0), material=fur)
    bpy.ops.object.select_all(action="SELECT")
    return join_selected(name)


def make_slime(name, color):
    g = mat(name + "Goo", color, 0.35)
    mesh("body", "uv", loc=(0, 0, 0.42), scale=(0.9, 0.9, 0.7), material=g)
    mesh("eyeL", "uv", loc=(-0.18, 0.28, 0.55), scale=(0.16, 0.1, 0.16), material=mat(name + "E", (0.05, 0.05, 0.08), 0.2))
    mesh("eyeR", "uv", loc=(0.18, 0.28, 0.55), scale=(0.16, 0.1, 0.16), material=mat(name + "E2", (0.05, 0.05, 0.08), 0.2))
    bpy.ops.object.select_all(action="SELECT")
    return join_selected(name)


def make_humanoid(name, color, extra=None):
    cloth = mat(name + "C", color, 0.08)
    skin = mat(name + "S", (0.95, 0.78, 0.55))
    dark = mat(name + "D", (0.12, 0.12, 0.16))
    mesh("torso", "cube", loc=(0, 0, 0.85), scale=(0.5, 0.28, 0.62), material=cloth)
    mesh("head", "uv", loc=(0, 0.04, 1.38), scale=(0.42, 0.4, 0.42), material=skin if extra != "skeleton" else dark)
    mesh("legL", "cyl", loc=(-0.14, 0, 0.32), scale=(0.14, 0.14, 0.55), material=dark)
    mesh("legR", "cyl", loc=(0.14, 0, 0.32), scale=(0.14, 0.14, 0.55), material=dark)
    mesh("armL", "cyl", loc=(-0.38, 0, 0.9), scale=(0.1, 0.1, 0.5), material=cloth)
    mesh("armR", "cyl", loc=(0.38, 0, 0.9), scale=(0.1, 0.1, 0.5), material=cloth)
    bpy.ops.object.select_all(action="SELECT")
    return join_selected(name)


def make_spider():
    dark = mat("SpDark", (0.12, 0.08, 0.1), 0.05)
    red = mat("SpRed", (0.85, 0.12, 0.1), 0.4)
    mesh("body", "uv", loc=(0, 0, 0.32), scale=(0.7, 0.55, 0.4), material=dark)
    mesh("head", "uv", loc=(0, 0.32, 0.28), scale=(0.38, 0.32, 0.28), material=dark)
    mesh("eye", "uv", loc=(0, 0.46, 0.34), scale=(0.12, 0.08, 0.12), material=red)
    for i, x in enumerate((-0.28, -0.12, 0.12, 0.28)):
        mesh("legL" + str(i), "cyl", loc=(x, 0.1, 0.18), scale=(0.05, 0.05, 0.55), rot=(0.9, 0, 0.5 if x < 0 else -0.5), material=dark)
        mesh("legR" + str(i), "cyl", loc=(x, -0.18, 0.18), scale=(0.05, 0.05, 0.55), rot=(-0.9, 0, 0.5 if x < 0 else -0.5), material=dark)
    bpy.ops.object.select_all(action="SELECT")
    return join_selected("spider")


def make_bat():
    wing = mat("BatW", (0.22, 0.12, 0.28), 0.1)
    body = mat("BatB", (0.18, 0.12, 0.2), 0.08)
    mesh("body", "uv", loc=(0, 0, 0.4), scale=(0.32, 0.28, 0.4), material=body)
    mesh("head", "uv", loc=(0, 0.18, 0.58), scale=(0.24, 0.22, 0.24), material=body)
    mesh("wingL", "cube", loc=(-0.45, 0, 0.42), scale=(0.7, 0.08, 0.32), rot=(0, 0.35, 0.2), material=wing)
    mesh("wingR", "cube", loc=(0.45, 0, 0.42), scale=(0.7, 0.08, 0.32), rot=(0, -0.35, -0.2), material=wing)
    bpy.ops.object.select_all(action="SELECT")
    return join_selected("bat")


def make_ghost():
    g = mat("Ghost", (0.72, 0.88, 0.95), 0.55)
    mesh("body", "uv", loc=(0, 0, 0.7), scale=(0.7, 0.55, 1.1), material=g)
    mesh("eyeL", "uv", loc=(-0.14, 0.22, 0.95), scale=(0.12, 0.08, 0.16), material=mat("GE", (0.05, 0.08, 0.2), 0.3))
    mesh("eyeR", "uv", loc=(0.14, 0.22, 0.95), scale=(0.12, 0.08, 0.16), material=mat("GE2", (0.05, 0.08, 0.2), 0.3))
    bpy.ops.object.select_all(action="SELECT")
    return join_selected("ghost")


reset_scene()
jobs = [
    (make_hero, OUT_PLAYER / "mosswatch_hero.glb"),
    (lambda: make_quadruped("wolf", (0.38, 0.28, 0.2)), OUT_CREATURES / "wolf.glb"),
    (lambda: make_quadruped("bear", (0.32, 0.22, 0.14), snout=0.42), OUT_CREATURES / "bear.glb"),
    (lambda: make_quadruped("boar", (0.28, 0.2, 0.14), snout=0.5, ear=False), OUT_CREATURES / "boar.glb"),
    (lambda: make_quadruped("fox", (0.85, 0.42, 0.16), snout=0.48), OUT_CREATURES / "fox.glb"),
    (lambda: make_quadruped("polarBear", (0.88, 0.9, 0.94), snout=0.4), OUT_CREATURES / "polarBear.glb"),
    (lambda: make_slime("slime", (0.28, 0.82, 0.32)), OUT_CREATURES / "slime.glb"),
    (lambda: make_humanoid("skeleton", (0.86, 0.84, 0.72), extra="skeleton"), OUT_CREATURES / "skeleton.glb"),
    (lambda: make_humanoid("goblin", (0.28, 0.55, 0.22)), OUT_CREATURES / "default.glb"),
    (make_spider, OUT_CREATURES / "spider.glb"),
    (make_bat, OUT_CREATURES / "bat.glb"),
    (make_ghost, OUT_CREATURES / "ghost.glb"),
    (lambda: make_slime("void", (0.18, 0.08, 0.32)), OUT_CREATURES / "void.glb"),
    (lambda: make_humanoid("horror", (0.42, 0.12, 0.12)), OUT_CREATURES / "horror.glb"),
    (lambda: make_quadruped("scorpion", (0.55, 0.28, 0.1), snout=0.5, ear=False), OUT_CREATURES / "scorpion.glb"),
    (lambda: make_humanoid("tree", (0.22, 0.42, 0.16)), OUT_CREATURES / "tree.glb"),
]

exported = []
for fn, path in jobs:
    reset_scene()
    obj = fn()
    export_glb(obj, path)
    exported.append(str(path))

print("EXPORTED", len(exported))
