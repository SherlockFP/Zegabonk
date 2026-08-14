"""Headless Blender authoring for the Crownfall final boss, King Grom.

Run through Blender (not CPython):
  blender --background --python create_crownfall_grom.py -- <output.glb>

Authoring is Blender Z-up with the boss facing Blender -Y.  The GLB exporter
converts it to glTF/Three.js Y-up.  The render root remains on ground contact
at Blender Z=0 before export and at glTF Y=0 after export.
"""

import bpy
import math
import os
import sys


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.materials, bpy.data.meshes, bpy.data.curves):
        for block in collection:
            collection.remove(block)


def make_material(name, color, metallic=0.0, roughness=0.7, emission=None):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = (*color, 1.0)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 2.2
    return material


def parent_preserving_world(child, parent):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()
    return child


def empty(name, location=(0, 0, 0), parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.28
    obj.location = location
    if parent:
        parent_preserving_world(obj, parent)
    return obj


def cube(name, location, scale, material, parent=None, bevel=0.0, rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    if rotation:
        obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Facet_Bevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(material)
    if parent:
        parent_preserving_world(obj, parent)
    return obj


def ico(name, location, radius, material, parent=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if parent:
        parent_preserving_world(obj, parent)
    return obj


def cone(name, location, radius1, radius2, depth, material, parent=None, rotation=None, vertices=6):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    if rotation:
        obj.rotation_euler = rotation
    obj.data.materials.append(material)
    if parent:
        parent_preserving_world(obj, parent)
    return obj


def stone_lump(name, location, scale, material, parent, rotation=(0, 0, 0)):
    lump = ico(name, location, 1.0, material, parent, scale)
    lump.rotation_euler = rotation
    return lump


def main(output):
    clear_scene()

    # Five shared materials: clear silhouette values, no texture dependency.
    stone = make_material("Grom_CharcoalStone", (0.075, 0.10, 0.15), roughness=0.83)
    stone_light = make_material("Grom_SlatePlanes", (0.16, 0.21, 0.28), roughness=0.74)
    violet = make_material("Grom_RoyalCape", (0.23, 0.055, 0.37), roughness=0.65)
    gold = make_material("Grom_BrokenGold", (0.70, 0.38, 0.08), metallic=0.58, roughness=0.36)
    rift = make_material("Grom_RiftCyan", (0.02, 0.44, 0.90), roughness=0.25, emission=(0.02, 0.48, 1.0))

    root = empty("CHR_Grom_ROOT")
    root["assetRole"] = "final_boss"
    root["groundOffset"] = 0.0
    root["frontAxis"] = "-Y"
    # Primitive bevels need a small, explicit source-space lift so the GLB root
    # is exactly at ground contact after Y-up conversion.
    model = empty("CHR_Grom_MODEL", (0, 0, 0), root)

    hip = empty("CHR_Grom_HIP", (0, 0, 1.30), model)
    chest = empty("CHR_Grom_CHEST", (0, 0, 2.52), model)
    head = empty("CHR_Grom_HEAD", (0, -0.04, 3.53), model)
    attack_pivot = empty("SOCKET_Grom_ATTACK", (1.67, -0.14, 1.82), model)
    attack_pivot["purpose"] = "staff_and_mace_attack_rotation"

    # Broad grounded lower body. Every boot touches z=0.
    for side, label in ((-1, "L"), (1, "R")):
        x = side * 0.65
        leg = empty("CHR_Grom_LEG_%s" % label, (x, 0.02, 0.96), hip)
        stone_lump("Grom_Thigh_%s" % label, (x, 0.04, 1.15), (0.55, 0.46, 0.86), stone, leg, (0.1, side * 0.12, side * 0.08))
        stone_lump("Grom_Shin_%s" % label, (x, -0.06, 0.54), (0.49, 0.43, 0.64), stone_light, leg, (-0.1, side * 0.08, 0))
        cube("Grom_Boot_%s" % label, (x, -0.22, 0.22), (0.61, 0.72, 0.22), stone, leg, 0.11)
        cone("Grom_BootToe_%s" % label, (x, -0.77, 0.36), 0.36, 0.50, 0.36, stone_light, leg, (math.pi / 2, 0, 0), 5)

    stone_lump("Grom_Pelvis", (0, 0.06, 1.63), (1.05, 0.62, 0.55), stone, hip)
    cube("Grom_Belt", (0, -0.02, 1.74), (1.19, 0.20, 0.38), gold, hip, 0.05)
    cone("Grom_BeltGem", (0, -0.43, 1.73), 0.22, 0.13, 0.12, rift, hip, (math.pi / 2, 0, 0), 4)

    # Clustered rock chest with bright fissures readable at gameplay distance.
    stone_lump("Grom_Torso", (0, 0.07, 2.47), (1.30, 0.72, 1.06), stone, chest)
    stone_lump("Grom_ChestPlate", (0, -0.52, 2.58), (1.02, 0.20, 0.74), stone_light, chest)
    for index, (x, z, angle) in enumerate(((-0.52, 2.78, -0.18), (-0.18, 2.30, 0.09), (0.22, 2.77, -0.11), (0.57, 2.31, 0.16))):
        cube("Grom_RiftFissure_%d" % index, (x, -0.76, z), (0.045, 0.035, 0.33), rift, chest, 0.015, (0, angle, angle))
    cube("Grom_LeftPauldron", (-1.34, 0.05, 2.88), (0.48, 0.58, 0.38), gold, chest, 0.09, (0.12, 0.2, -0.28))
    cube("Grom_RightPauldron", (1.34, 0.05, 2.88), (0.48, 0.58, 0.38), gold, chest, 0.09, (0.12, -0.2, 0.28))

    # Left hand is an open stone fist. Right holds the oversized crown-breaker.
    arm_l = empty("CHR_Grom_ARM_L", (-1.37, -0.02, 2.49), chest)
    stone_lump("Grom_LeftArm", (-1.39, -0.05, 2.23), (0.48, 0.43, 0.88), stone, arm_l, (0.04, 0.15, -0.24))
    cube("Grom_LeftBracer", (-1.47, -0.19, 2.22), (0.51, 0.36, 0.29), gold, arm_l, 0.06, (0.05, 0.10, -0.24))
    stone_lump("Grom_LeftFist", (-1.62, -0.43, 1.71), (0.55, 0.45, 0.48), stone_light, arm_l)
    for index in range(3):
        cube("Grom_LeftKnuckle_%d" % index, (-1.86 + index * 0.22, -0.74, 1.76), (0.10, 0.12, 0.18), stone, arm_l, 0.03)

    arm_r = empty("CHR_Grom_ARM_R", (1.33, -0.03, 2.45), chest)
    stone_lump("Grom_RightArm", (1.40, -0.03, 2.25), (0.48, 0.43, 0.86), stone, arm_r, (0.04, -0.12, 0.18))
    cube("Grom_RightBracer", (1.48, -0.17, 2.20), (0.51, 0.36, 0.29), gold, arm_r, 0.06, (0.03, -0.10, 0.20))
    stone_lump("Grom_RightFist", (1.66, -0.33, 1.87), (0.42, 0.39, 0.45), stone_light, attack_pivot)

    # Staff and massive faceted mace intentionally exceed the shoulder line.
    cube("Grom_StaffShaft", (1.76, -0.11, 2.48), (0.13, 0.13, 1.78), violet, attack_pivot, 0.05)
    cone("Grom_StaffButt", (1.76, -0.11, 0.67), 0.24, 0.13, 0.38, gold, attack_pivot, None, 6)
    cube("Grom_StaffCollar", (1.76, -0.11, 3.70), (0.30, 0.30, 0.13), gold, attack_pivot, 0.04)
    stone_lump("Grom_CrownBreaker", (1.76, -0.10, 4.25), (0.84, 0.68, 0.84), stone, attack_pivot, (0.10, 0.10, 0.08))
    stone_lump("Grom_MaceFacetFront", (1.76, -0.64, 4.25), (0.48, 0.18, 0.48), stone_light, attack_pivot)
    for index, (x, z) in enumerate(((1.16, 4.43), (2.34, 4.43), (1.31, 3.86), (2.21, 3.86))):
        cone("Grom_MaceSpike_%d" % index, (x, -0.10, z), 0.20, 0.04, 0.52, stone_light, attack_pivot, (0, math.pi / 2, 0), 5)
    cube("Grom_MaceRune", (1.76, -0.80, 4.25), (0.19, 0.035, 0.23), rift, attack_pivot, 0.02)

    # Head, brows and glowing eyes form the boss's readable frontal face.
    stone_lump("Grom_HeadCore", (0, -0.10, 3.48), (0.87, 0.66, 0.82), stone, head)
    stone_lump("Grom_Brow_L", (-0.38, -0.60, 3.72), (0.43, 0.18, 0.20), stone_light, head, (0.05, -0.12, -0.20))
    stone_lump("Grom_Brow_R", (0.38, -0.60, 3.72), (0.43, 0.18, 0.20), stone_light, head, (0.05, 0.12, 0.20))
    for side, label in ((-1, "L"), (1, "R")):
        cone("Grom_Eye_%s" % label, (side * 0.31, -0.72, 3.56), 0.115, 0.07, 0.09, rift, head, (math.pi / 2, 0, 0), 6)
    stone_lump("Grom_Beard", (0, -0.52, 3.12), (0.71, 0.24, 0.56), stone_light, head)
    cube("Grom_Nose", (0, -0.78, 3.47), (0.16, 0.13, 0.23), stone_light, head, 0.03)

    # Floating broken crown: a separate named pivot for eventual hover animation.
    crown = empty("SOCKET_Grom_FLOATING_CROWN", (0, 0, 4.25), model)
    crown["purpose"] = "hover_animation"
    cone("Grom_CrownCenter", (0, -0.02, 4.28), 0.35, 0.20, 0.20, gold, crown, None, 5)
    for index, (x, z, tilt) in enumerate(((-0.62, 4.38, -0.32), (-0.30, 4.74, -0.14), (0.31, 4.70, 0.14), (0.65, 4.37, 0.32))):
        cone("Grom_CrownShard_%d" % index, (x, -0.02, z), 0.15, 0.05, 0.44, gold, crown, (0, tilt, tilt), 5)
    cone("Grom_CrownGem", (0, -0.27, 4.30), 0.17, 0.08, 0.14, rift, crown, (math.pi / 2, 0, 0), 4)

    # The cape makes the rear and side silhouette distinct without cloth simulation.
    cape = empty("CHR_Grom_CAPE", (0, 0.48, 2.78), chest)
    cube("Grom_CapeMain", (0, 0.66, 2.35), (1.20, 0.075, 1.30), violet, cape, 0.08, (0.06, 0, 0))
    cube("Grom_CapeHem", (0, 0.76, 1.12), (1.07, 0.11, 0.10), gold, cape, 0.03)
    cone("Grom_CapeCrown", (0, 0.57, 1.59), 0.34, 0.08, 0.42, gold, cape, (math.pi / 2, 0, 0), 3)

    # Low-cost render-side marker. It is intentionally non-visible in Blender and
    # named for runtime collision replacement, not exported as a physics shape.
    root["collisionProxy"] = "COL_Grom_Body capsule r=0.92 h=3.4"
    model.location.z = 0.1662

    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_normals=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
    )


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 1:
        raise RuntimeError("Expected one output .glb path")
    main(os.path.abspath(args[0]))
