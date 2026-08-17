---
name: blender-mcp
description: Drive Blender via MCP on localhost:9876 for GLB modeling and export. Use when creating or fixing 3D characters, creatures, weapons, or environments for ZEGABONK / Three.js.
---

# Blender MCP

Blender addon socket: `localhost:9876` (already used by this machine).
Cursor MCP server: `uvx blender-mcp` (project `.cursor/mcp.json` + user `mcp.json`).

## Setup if disconnected

1. In Blender: Edit > Preferences > Add-ons > Install `tools/blender/addon.py`
2. Enable "Blender MCP"
3. N-panel > BlenderMCP > Connect (port 9876)
4. Reload Cursor MCP servers

## Export rules for this game

- Format: GLB (glTF 2.0)
- Apply transforms. Origin at feet. Forward +Y in Blender export "glTF" or bake `rotation.y = PI` in runtime if the model moonwalks
- Names: see `assets/ASSETS_README.md` (`wolf.glb`, `mosswatch_hero.glb`, ...)
- Low poly, one material where possible. No 4k textures
- After export, optional: `npx gltf-transform optimize in.glb out.glb`

Do not keep FBX/OBJ as the runtime format.
