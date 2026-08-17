# Dispose and browser safety

```ts
function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = mesh.material;
    if (!mats) return;
    for (const m of Array.isArray(mats) ? mats : [mats]) {
      for (const key of Object.keys(m) as (keyof THREE.Material)[]) {
        const v = m[key] as unknown;
        if (v && typeof v === "object" && "minFilter" in (v as object)) {
          (v as THREE.Texture).dispose();
        }
      }
      m.dispose();
    }
  });
}
```

Resize: update `camera.aspect`, `updateProjectionMatrix()`, `renderer.setSize`, composer size if present.

Context loss: stop the loop on `webglcontextlost` (`event.preventDefault()`), rebuild renderer/scene on restore. Do not assume GPU resources survived.
