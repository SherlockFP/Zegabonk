# Perf budgets

Desktop prototype targets (adjust if the user sets others):

| Metric | Green | Fix now |
|--------|-------|---------|
| FPS | 60 | <45 sustained |
| Draw calls | <100 play view | >200 |
| Tris on screen | <500k | >1.5M |
| Shadow maps | 1× 1024 | 4K or many casters |
| Post passes | 0–2 | 5+ |
| Texture mem (rough) | <256 MB | unexplained 1 GB+ |

Mobile: halve tris/calls, pixel ratio 1.5, shadows off or 512.

`renderer.info.memory` + `renderer.info.render` in a `?debug=1` overlay is enough. Do not add a telemetry platform for a prototype.
