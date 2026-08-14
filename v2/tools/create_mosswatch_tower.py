import bpy
import math
import os
import sys


def material(name, color, metallic=0.0, roughness=0.75):
    value = bpy.data.materials.new(name)
    value.diffuse_color = (*color, 1.0)
    value.use_nodes = True
    bsdf = value.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return value


def cube(name, location, scale, mat, rotation=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=(0, 0, rotation))
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("SoftChunk", "BEVEL")
    bevel.width = 0.08
    bevel.segments = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj


def cylinder(name, location, radius, depth, mat, vertices=8):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def main():
    output = sys.argv[sys.argv.index("--") + 1]
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    stone = material("Mosswatch_Stone", (0.39, 0.43, 0.38), roughness=0.88)
    moss = material("Mosswatch_Moss", (0.19, 0.39, 0.15), roughness=0.96)
    wood = material("Mosswatch_Wood", (0.25, 0.13, 0.07), roughness=0.9)
    cyan = material("Mosswatch_Cyan", (0.08, 0.85, 0.95), metallic=0.1, roughness=0.28)
    root = bpy.data.objects.new("MosswatchTower_Root", None)
    bpy.context.collection.objects.link(root)
    base = cylinder("Tower_Base", (0, 0.32, 0), 2.1, 0.64, stone, 10)
    base.parent = root
    for level in range(5):
        radius = 1.68 - level * 0.07
        block_height = 0.75
        count = 8
        for index in range(count):
            angle = index / count * math.tau + (level % 2) * 0.18
            block = cube(
                "Tower_Block_%s_%s" % (level, index),
                (math.cos(angle) * radius, 0.88 + level * block_height, math.sin(angle) * radius),
                (0.42, 0.34, 0.33),
                stone,
                angle,
            )
            block.parent = root
    for index in range(4):
        angle = index * math.pi / 2 + 0.25
        buttress = cube("Tower_Buttress_%s" % index, (math.cos(angle) * 1.62, 1.3, math.sin(angle) * 1.62), (0.45, 1.0, 0.45), stone, angle)
        buttress.parent = root
    platform = cylinder("Tower_Platform", (0, 4.85, 0), 1.85, 0.36, wood, 10)
    platform.parent = root
    for index in range(4):
        angle = index * math.pi / 2
        stump = cube("Tower_Parapet_%s" % index, (math.cos(angle) * 1.25, 5.42, math.sin(angle) * 1.25), (0.36, 0.56, 0.36), stone)
        stump.parent = root
    for index in range(7):
        angle = index / 7 * math.tau
        patch = cube("Moss_Patch_%s" % index, (math.cos(angle) * 1.35, 3.15 + (index % 2) * 0.9, math.sin(angle) * 1.35), (0.35, 0.08, 0.38), moss, angle)
        patch.parent = root
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.42, location=(0, 6.05, 0))
    crystal = bpy.context.object
    crystal.name = "Tower_CrownCrystal"
    crystal.scale = (0.85, 1.85, 0.85)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    crystal.data.materials.append(cyan)
    crystal.parent = root
    for mat in (stone, moss, wood, cyan):
        meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.data.materials and obj.data.materials[0] == mat]
        if not meshes:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in meshes:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
        meshes[0].parent = root
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )


main()
