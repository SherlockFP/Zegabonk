# Stack lock

Default for new and existing vanilla 3D games:

| Layer | Choice | Do not default to |
|-------|--------|-------------------|
| Language | TypeScript | JS-only new files |
| Bundler | Vite | Webpack, raw HTML CDNs |
| Renderer | `THREE.WebGLRenderer` | `WebGPURenderer` (opt-in) |
| Units | 1 unit = 1 meter, Y-up | Mixed DCC scales |
| Models | GLB / glTF 2.0 | FBX/OBJ at runtime |
| Textures | KTX2 when pipeline exists; otherwise compressed JPEG/WebP | 4K PNG everywhere |
| Physics | `@dimforge/rapier3d-compat` | Cannon/Ammo unless already in repo |
| UI | DOM overlay | CSS3D / in-canvas menus |
| Debug | `?debug=1` perf + SpectorJS when GPU-unclear | Always-on Leva panels in prod |

WebGPU: use only when the user asks for TSL, compute particles, or meshlets. Official Three.js guidance (2026): WebGLRenderer is still the production default for typical mesh scenes; WebGPURenderer is the future path and can be slower on many-draw-call games.

Rapier: prefer `rapier3d-compat` so Vite does not need extra WASM plugins.
