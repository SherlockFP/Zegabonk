"""Headless Blender authoring for the first shippable Crownfall actor pair.

Run with Blender, not Python. The output intentionally uses named transform
pivots so the lightweight Three.js runtime can animate it without per-enemy
skeletal mixers.
"""

import bpy
import math
import os
import sys
from mathutils import Vector


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def material(name, color, metallic=0.0, roughness=0.72, emission=None):
    value = bpy.data.materials.new(name)
    value.diffuse_color = (*color, 1)
    value.use_nodes = True
    node = value.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*color, 1)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = metallic
    if emission:
        node.inputs["Emission Color"].default_value = (*emission, 1)
        node.inputs["Emission Strength"].default_value = 1.8
    return value


def empty(name, parent=None, location=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_size = 0.25
    obj.empty_display_type = "PLAIN_AXES"
    obj.location = location
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def cube(name, location, scale, mat, parent=None, bevel=0.06, rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    if rotation:
        obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("soft_edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def ico(name, location, radius, mat, parent=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def cone(name, location, radius1, radius2, depth, mat, parent=None, rotation=None):
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=radius1, radius2=radius2, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    if rotation:
        obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def tapered_mass(name, start, end, radius_start, radius_end, mat, parent=None, vertices=10, bevel=0.025):
    start_point = Vector(start)
    end_point = Vector(end)
    direction = end_point - start_point
    if direction.length <= 0:
        raise ValueError("%s requires distinct endpoints" % name)
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_start,
        radius2=radius_end,
        depth=direction.length,
        location=(start_point + end_point) * 0.5,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name + "_Mesh"
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    if bevel:
        modifier = obj.modifiers.new("soft_edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def extruded_profile(name, points, z, depth, mat, parent=None):
    center_x = sum(point[0] for point in points) / len(points)
    center_y = sum(point[1] for point in points) / len(points)
    half_depth = depth * 0.5
    local_points = [(x - center_x, y - center_y) for x, y in points]
    vertices = [(x, y, -half_depth) for x, y in local_points]
    vertices.extend((x, y, half_depth) for x, y in local_points)
    count = len(points)
    faces = [
        tuple(reversed(range(count))),
        tuple(range(count, count * 2)),
    ]
    for index in range(count):
        following = (index + 1) % count
        faces.append((index, following, count + following, count + index))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (center_x, center_y, z)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def crown_badge(name, center, width, height, depth, mat, parent=None):
    center_x, center_y, center_z = center
    outline = (
        (-0.50, -0.42),
        (0.50, -0.42),
        (0.50, -0.02),
        (0.31, 0.08),
        (0.26, 0.48),
        (0.10, 0.12),
        (0.00, 0.58),
        (-0.10, 0.12),
        (-0.26, 0.48),
        (-0.31, 0.08),
        (-0.50, -0.02),
    )
    points = [(center_x + x * width, center_y + y * height) for x, y in outline]
    return extruded_profile(name, points, center_z, depth, mat, parent)


def create_hero(output):
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0

    navy = material("Hero_NavyCloth", (0.035, 0.075, 0.19), roughness=0.76)
    teal = material("Hero_TealCape", (0.02, 0.34, 0.31), roughness=0.7)
    brass = material("Hero_MutedBrass", (0.72, 0.39, 0.075), metallic=0.52, roughness=0.42)
    leather = material("Hero_Leather", (0.16, 0.055, 0.018), roughness=0.82)
    coral = material("Hero_CoralAccent", (0.82, 0.12, 0.035), roughness=0.72)
    skin = material("Hero_Skin", (0.56, 0.26, 0.14), roughness=0.8)
    hair = material("Hero_Hair", (0.045, 0.014, 0.006), roughness=0.9)
    stone = material("Hero_HammerStone", (0.13, 0.17, 0.23), metallic=0.1, roughness=0.82)

    hero_height = 3.84
    root = empty("Hero_Root")
    hip = empty("Hero_Hip", root, (0, 1.53, 0))

    # Overlapping chest, waist, and collar masses establish one broad body.
    ico("Hero_ChestMass", (0, 2.30, 0), 0.78, navy, root, (1.10, 0.75, 0.55))
    cube("Hero_TorsoCore", (0, 2.02, 0), (0.66, 0.66, 0.36), navy, root, 0.16)
    cube("Hero_Waist", (0, 1.65, 0), (0.63, 0.27, 0.35), navy, root, 0.11)
    tapered_mass("Hero_Neck", (0, 2.57, 0), (0, 2.91, 0), 0.29, 0.25, skin, root, vertices=10)
    tapered_mass("Hero_Collar", (0, 2.54, 0.02), (0, 2.79, 0.02), 0.63, 0.48, teal, root, vertices=12, bevel=0.035)

    cube("Hero_Belt", (0, 1.65, 0), (0.72, 0.115, 0.39), leather, root, 0.035)
    cube("Hero_BeltBuckle", (0, 1.65, -0.405), (0.19, 0.16, 0.055), brass, root, 0.025)
    crown_badge("Hero_ChestCrown", (0, 2.37, -0.45), 0.46, 0.39, 0.07, brass, root)
    extruded_profile(
        "Hero_SkirtGuard_L",
        ((-0.64, 1.56), (-0.08, 1.56), (-0.14, 0.98), (-0.54, 1.04)),
        -0.345,
        0.08,
        leather,
        root,
    )
    extruded_profile(
        "Hero_SkirtGuard_R",
        ((0.08, 1.56), (0.64, 1.56), (0.54, 1.04), (0.14, 0.98)),
        -0.345,
        0.08,
        leather,
        root,
    )
    extruded_profile(
        "Hero_CoralSash",
        ((0.05, 1.59), (0.42, 1.59), (0.38, 0.77), (0.24, 0.64), (0.08, 0.79)),
        -0.405,
        0.07,
        coral,
        root,
    )

    head_pivot = empty("Hero_Head", root, (0, 3.09, 0))
    ico("Hero_Face", (0, 3.10, -0.06), 0.43, skin, head_pivot, (0.92, 1.04, 0.88))
    ico("Hero_Beard", (0, 2.95, -0.20), 0.35, hair, head_pivot, (0.90, 0.76, 0.90))
    ico("Hero_HairCap", (0, 3.41, 0), 0.37, hair, head_pivot, (1.16, 0.57, 1.0))
    cube("Hero_CrownBand", (0, 3.52, -0.01), (0.48, 0.09, 0.38), brass, head_pivot, 0.04)
    for index, (x, base, tip, radius) in enumerate((
        (-0.29, 3.55, 3.80, 0.14),
        (0.00, 3.54, 3.94, 0.17),
        (0.28, 3.55, 3.77, 0.135),
    )):
        tapered_mass(
            "Hero_CrownFragment_%d" % index,
            (x, base, -0.01),
            (x, tip, -0.01),
            radius,
            0.022,
            brass,
            head_pivot,
            vertices=6,
            bevel=0.014,
        )

    arm_pivots = {}
    forearm_pivots = {}
    for side, name in ((-1, "L"), (1, "R")):
        shoulder = (side * 0.74, 2.50, 0)
        elbow = (side * 0.88, 1.96, -0.015)
        wrist = (side * 0.94, 1.46, -0.02)
        arm = empty("Hero_Arm_%s" % name, root, shoulder)
        arm_pivots[name] = arm
        ico("Hero_Pauldron_%s" % name, shoulder, 0.43, brass, arm, (1.06, 0.76, 1.0))
        tapered_mass(
            "Hero_UpperArm_%s" % name,
            shoulder,
            elbow,
            0.285,
            0.245,
            navy,
            arm,
            vertices=10,
            bevel=0.035,
        )
        forearm = empty("Hero_Forearm_%s" % name, arm, elbow)
        forearm_pivots[name] = forearm
        tapered_mass(
            "Hero_Bracer_%s" % name,
            elbow,
            wrist,
            0.27,
            0.205,
            brass,
            forearm,
            vertices=10,
            bevel=0.03,
        )
        ico("Hero_Hand_%s" % name, (side * 0.95, 1.34, -0.02), 0.23, skin, forearm, (0.92, 0.80, 0.88))

    for side, name in ((-1, "L"), (1, "R")):
        leg = empty("Hero_Leg_%s" % name, hip, (side * 0.35, 1.47, 0))
        tapered_mass(
            "Hero_UpperLeg_%s" % name,
            (side * 0.35, 1.48, 0),
            (side * 0.37, 0.90, 0),
            0.32,
            0.28,
            navy,
            leg,
            vertices=10,
            bevel=0.035,
        )
        lower_leg = empty("Hero_LowerLeg_%s" % name, leg, (side * 0.37, 0.86, -0.19))
        ico("Hero_KneeGuard_%s" % name, (side * 0.37, 0.86, -0.19), 0.28, brass, leg, (1.02, 0.76, 0.90))
        tapered_mass(
            "Hero_BootShaft_%s" % name,
            (side * 0.37, 0.91, 0),
            (side * 0.37, 0.35, 0),
            0.34,
            0.30,
            leather,
            lower_leg,
            vertices=10,
            bevel=0.035,
        )
        cube("Hero_Boot_%s" % name, (side * 0.37, 0.20, -0.15), (0.34, 0.20, 0.46), leather, lower_leg, 0.095)
        cube("Hero_BootCap_%s" % name, (side * 0.37, 0.21, -0.48), (0.34, 0.16, 0.18), brass, lower_leg, 0.055)

    # Cape geometry uses coordinates local to its shoulder pivot. Keeping the
    # children local avoids exporter parent-inverse transforms turning it into
    # a detached banner when the root is converted from authoring Y-up.
    cape = empty("Hero_Cape")
    cape.parent = root
    cape.location = (0, 2.61, 0.40)
    cape_cloth = extruded_profile(
        "Hero_CapeCloth",
        ((-0.70, 0.04), (0.70, 0.04), (0.61, -0.93), (0.25, -1.10), (0, -0.94), (-0.25, -1.10), (-0.61, -0.93)),
        0.10,
        0.10,
        teal,
    )
    cape_cloth.parent = cape
    cape_badge = crown_badge("Hero_CapeCrown", (0, -0.43, 0.165), 0.48, 0.40, 0.055, brass)
    cape_badge.parent = cape

    # The hammer pivot lives inside the right-hand mass. Its whole assembly is
    # parented to that arm, so locomotion and attack rotations cannot open the grip.
    hammer = empty("Hero_HammerPivot", forearm_pivots["R"], (0.95, 1.35, -0.02))
    tapered_mass(
        "Hero_HammerHandle",
        (0.93, 1.39, -0.02),
        (1.43, 1.02, 0.02),
        0.12,
        0.105,
        leather,
        hammer,
        vertices=8,
        bevel=0.028,
    )
    tapered_mass(
        "Hero_HammerCollar",
        (1.35, 1.08, 0.02),
        (1.53, 0.95, 0.02),
        0.18,
        0.16,
        brass,
        hammer,
        vertices=8,
        bevel=0.028,
    )
    cube("Hero_HammerHead", (1.72, 0.94, 0.03), (0.76, 0.52, 0.54), stone, hammer, 0.13)
    cube("Hero_HammerCapInner", (1.30, 0.94, 0.03), (0.16, 0.54, 0.56), brass, hammer, 0.06)
    cube("Hero_HammerCapOuter", (2.14, 0.94, 0.03), (0.16, 0.54, 0.56), brass, hammer, 0.06)
    cube("Hero_HammerBandTop", (1.72, 1.39, 0.03), (0.78, 0.10, 0.56), brass, hammer, 0.045)
    cube("Hero_HammerBandBottom", (1.72, 0.49, 0.03), (0.78, 0.10, 0.56), brass, hammer, 0.045)
    crown_badge("Hero_HammerCrown", (1.72, 0.94, 0.595), 0.60, 0.46, 0.075, coral, hammer)

    # Author in intuitive Y-up coordinates, rotate into Blender Z-up, then
    # place the top-level gameplay root so the loader's existing +2.84 / 0.74
    # placement puts the lowest boot at world Y=0.
    root.rotation_euler.x = math.pi / 2
    root.location.z = -3.94
    export(output)


def create_rattlecap(output):
    clear_scene()
    cloak = material("Rattlecap_Cloak", (0.025, 0.12, 0.105), roughness=0.84)
    moss = material("Rattlecap_Moss", (0.08, 0.34, 0.24), roughness=0.78)
    cap = material("Rattlecap_Cap", (0.68, 0.16, 0.09), roughness=0.7)
    cap_mark = material("Rattlecap_CapMark", (0.92, 0.48, 0.12), roughness=0.68)
    mask = material("Rattlecap_Mask", (0.86, 0.76, 0.52), roughness=0.76)
    eye = material("Rattlecap_Eye", (1.0, 0.22, 0.025), roughness=0.25, emission=(1.0, 0.08, 0.01))
    leather = material("Rattlecap_Leather", (0.12, 0.045, 0.025), roughness=0.9)
    blade = material("Rattlecap_Blade", (0.62, 0.72, 0.7), metallic=0.68, roughness=0.3)
    root = empty("Rattlecap_Root")

    tapered_mass("Rattlecap_Cloak", (0, 0.28, 0.08), (0, 1.25, 0), 0.58, 0.39, cloak, root, vertices=7, bevel=0.035)
    ico("Rattlecap_Torso", (0, 1.08, -0.02), 0.46, moss, root, (0.94, 1.08, 0.82))
    ico("Rattlecap_Cap", (0, 1.72, 0.02), 0.64, cap, root, (1.22, 0.42, 0.92))
    for index, x in enumerate((-0.38, 0, 0.38)):
        ico("Rattlecap_CapMark_%d" % index, (x, 1.79 + (index % 2) * 0.07, -0.48), 0.12, cap_mark, root, (1.15, 0.48, 0.28))

    cube("Rattlecap_Mask", (0, 1.49, -0.47), (0.32, 0.25, 0.11), mask, root, 0.045)
    cube("Rattlecap_Eyes", (0, 1.54, -0.6), (0.25, 0.07, 0.025), eye, root, 0.012)
    cube("Rattlecap_Belt", (0, 0.91, -0.43), (0.47, 0.085, 0.065), leather, root, 0.025)

    for side, name in ((-1, "L"), (1, "R")):
        arm = empty("Rattlecap_Arm_%s" % name, root, (side * 0.43, 1.16, -0.02))
        tapered_mass("Rattlecap_ArmMesh_%s" % name, (side * 0.43, 1.16, -0.02), (side * 0.68, 0.79, -0.16), 0.17, 0.12, moss, arm, vertices=7)
        ico("Rattlecap_Hand_%s" % name, (side * 0.67, 0.75, -0.18), 0.12, mask, arm, (0.82, 1.0, 0.74))
        leg = empty("Rattlecap_Leg_%s" % name, root, (side * 0.23, 0.56, 0))
        tapered_mass("Rattlecap_LegMesh_%s" % name, (side * 0.23, 0.56, 0), (side * 0.25, 0.2, -0.02), 0.15, 0.13, leather, leg, vertices=7)
        cube("Rattlecap_Boot_%s" % name, (side * 0.25, 0.12, -0.12), (0.18, 0.13, 0.27), leather, leg, 0.04)

    tapered_mass("Rattlecap_CleaverGrip", (0.67, 0.75, -0.18), (0.9, 1.32, -0.2), 0.08, 0.07, leather, root, vertices=8, bevel=0.022)
    cube("Rattlecap_CleaverGuard", (0.87, 1.23, -0.2), (0.22, 0.07, 0.11), cap_mark, root, 0.025, (0, 0, -0.14))
    cube("Rattlecap_Cleaver", (0.96, 1.48, -0.22), (0.25, 0.33, 0.11), blade, root, 0.05, (0, 0, -0.14))

    root.rotation_euler.x = math.pi / 2
    export(output)


def export(output):
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


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 2:
        raise RuntimeError("Expected actor and output path")
    if args[0] == "hero":
        create_hero(args[1])
    elif args[0] == "rattlecap":
        create_rattlecap(args[1])
    else:
        raise RuntimeError("Unknown actor: " + args[0])


main()
