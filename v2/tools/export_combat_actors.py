import bpy
import os
import sys


def keep_only(prefixes):
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith(prefixes):
            continue
        bpy.data.objects.remove(obj, do_unlink=True)


def prepare_hero():
    keep_only(("Hero_", "Hammer_"))
    hero = bpy.data.objects.get("Hero_Root")
    if hero is None:
        raise RuntimeError("Hero_Root missing")
    hero.name = "Hero_AttackVisual"


def prepare_goblin():
    keep_only(("Goblin_",))
    goblin = bpy.data.objects.get("Goblin_Root")
    if goblin is None:
        raise RuntimeError("Goblin_Root missing")
    goblin.name = "Rattlecap_Actor"


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 2:
        raise RuntimeError("Expected actor and output path")
    actor, output = args
    if actor == "hero":
        prepare_hero()
    elif actor == "rattlecap":
        prepare_goblin()
    else:
        raise RuntimeError("Unknown actor: " + actor)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_normals=True,
        export_tangents=False,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )


main()
