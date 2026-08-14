import bpy
import math
import os
import sys


def material(name, color, emission=None, roughness=0.78):
    value = bpy.data.materials.new(name)
    value.diffuse_color = (*color, 1.0)
    value.use_nodes = True
    bsdf = value.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 1.35
    return value


def cube(name, location, scale, mat, rotation=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=(0, 0, rotation))
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("ChunkBevel", "BEVEL")
    bevel.width = 0.075
    bevel.segments = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj


def crystal(name, location, scale, mat, tilt=0.0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.58, location=location, rotation=(tilt, 0, tilt * 0.3))
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
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
    sandstone = material("RiftScar_Sandstone", (0.52, 0.27, 0.13), roughness=0.9)
    charcoal = material("RiftScar_Thorn", (0.07, 0.035, 0.08), roughness=0.84)
    magenta = material("RiftScar_Magenta", (0.86, 0.08, 0.74), emission=(0.78, 0.02, 0.5), roughness=0.27)
    root = bpy.data.objects.new("RiftScarArch_Root", None)
    bpy.context.collection.objects.link(root)

    for side in (-1, 1):
        for level in range(4):
            block = cube(
                "Arch_Pillar_%s_%s" % (side, level),
                (side * (2.1 - level * 0.11), 0.6 + level * 0.9, 0),
                (0.58, 0.47, 0.64),
                sandstone,
                side * (0.04 + level * 0.025),
            )
            block.parent = root

    for index in range(7):
        angle = math.radians(22 + index * 22.5)
        block = cube(
            "Arch_Curve_%s" % index,
            (math.cos(angle) * 2.05, 3.0 + math.sin(angle) * 1.85, 0),
            (0.58, 0.44, 0.64),
            sandstone,
            angle - math.pi / 2,
        )
        block.parent = root

    for index in range(7):
        side = -1 if index % 2 == 0 else 1
        shard = crystal(
            "RiftShard_%s" % index,
            (side * (0.22 + (index % 3) * 0.2), 0.72 + index * 0.56, (index % 2 - 0.5) * 0.32),
            (0.25 + (index % 2) * 0.08, 0.72 + (index % 3) * 0.27, 0.25),
            magenta,
            side * 0.22,
        )
        shard.parent = root

    for side in (-1, 1):
        for index in range(3):
            thorn = cube(
                "Thorn_%s_%s" % (side, index),
                (side * (2.7 + index * 0.28), 0.32 + index * 0.18, -0.1 + index * 0.42),
                (0.1, 0.18, 0.9 - index * 0.14),
                charcoal,
                side * (0.55 + index * 0.2),
            )
            thorn.parent = root

    for index in range(9):
        angle = index / 9 * math.tau
        rubble = cube(
            "Rubble_%s" % index,
            (math.cos(angle) * 3.05, 0.18, math.sin(angle) * 1.15),
            (0.22 + (index % 3) * 0.08, 0.16 + (index % 2) * 0.07, 0.28),
            sandstone,
            index * 0.45,
        )
        rubble.parent = root

    join_by_material(root, (sandstone, charcoal, magenta))
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
