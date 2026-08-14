import bpy
import math
import os
import sys


def material(name, color, emission=None, metallic=0.0, roughness=0.72):
    value = bpy.data.materials.new(name)
    value.diffuse_color = (*color, 1.0)
    value.use_nodes = True
    bsdf = value.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 1.15
    return value


def block(name, location, scale, mat, rotation=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=(0, 0, rotation))
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("SoftStone", "BEVEL")
    bevel.width = 0.065
    bevel.segments = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj


def cylinder(name, location, radius, depth, vertices, mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def join_by_material(root, mats):
    for mat in mats:
        meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.data.materials and obj.data.materials[0] == mat]
        if len(meshes) == 1:
            meshes[0].parent = root
            continue
        if not meshes:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in meshes:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
        meshes[0].parent = root


def main():
    output = sys.argv[sys.argv.index("--") + 1]
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    ivory = material("CrownAscent_Ivory", (0.72, 0.74, 0.76), roughness=0.84)
    gold = material("CrownAscent_Gold", (0.78, 0.53, 0.12), metallic=0.62, roughness=0.32)
    violet = material("CrownAscent_Violet", (0.58, 0.16, 0.92), emission=(0.4, 0.04, 0.9), roughness=0.23)
    root = bpy.data.objects.new("CrownAscentSpire_Root", None)
    bpy.context.collection.objects.link(root)

    base = cylinder("Spire_Base", (0, 0.3, 0), 2.4, 0.6, 8, ivory)
    base.parent = root
    for level in range(6):
        radius = 1.72 - level * 0.12
        for index in range(6):
            angle = index / 6 * math.tau + (level % 2) * 0.17
            part = block(
                "Spire_Block_%s_%s" % (level, index),
                (math.cos(angle) * radius, 0.86 + level * 0.82, math.sin(angle) * radius),
                (0.36, 0.38, 0.34),
                ivory,
                angle,
            )
            part.parent = root
        ring = cylinder("Gold_Ring_%s" % level, (0, 1.24 + level * 0.82, 0), radius + 0.14, 0.1, 8, gold)
        ring.parent = root

    for index in range(4):
        angle = index * math.pi / 2 + 0.22
        support = block("Spire_Support_%s" % index, (math.cos(angle) * 1.62, 1.18, math.sin(angle) * 1.62), (0.32, 0.85, 0.34), ivory, angle)
        support.parent = root
    for index in range(4):
        angle = index * math.pi / 2
        prong = block("Crown_Prong_%s" % index, (math.cos(angle) * 0.94, 6.02, math.sin(angle) * 0.94), (0.12, 0.78, 0.12), gold, angle)
        prong.parent = root

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.66, location=(0, 7.0, 0))
    crown = bpy.context.object
    crown.name = "Crown_Violet_Crystal"
    crown.scale = (0.9, 2.25, 0.9)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    crown.data.materials.append(violet)
    crown.parent = root
    for index in range(4):
        angle = index / 4 * math.tau + 0.3
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.24, location=(math.cos(angle) * 1.15, 6.25, math.sin(angle) * 1.15))
        shard = bpy.context.object
        shard.name = "Crown_Shard_%s" % index
        shard.scale = (0.5, 1.5, 0.5)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        shard.data.materials.append(violet)
        shard.parent = root

    join_by_material(root, (ivory, gold, violet))
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
