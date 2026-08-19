// Voxel model factory. Plain script. Requires window.THREE.
// Shared toon + emissive + outline materials. Geometry cached per model id.
(function (global) {
  var defs = {};
  var order = [];
  var geoCache = {};
  var mats = null;

  var FACE = [
    { n: [1, 0, 0], v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
    { n: [-1, 0, 0], v: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
    { n: [0, 1, 0], v: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
    { n: [0, -1, 0], v: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]] },
    { n: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
    { n: [0, 0, -1], v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }
  ];

  function THREE() {
    var T = global.THREE;
    if (!T) throw new Error("voxel.js: window.THREE missing");
    return T;
  }

  function key(x, y, z) {
    return x + "," + y + "," + z;
  }

  function parseHex(hex) {
    if (typeof hex === "number") {
      return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
    }
    var h = String(hex || "#ffffff").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function ensureMats() {
    if (mats) return mats;
    var T = THREE();
    var data = new Uint8Array([
      92, 86, 104, 255,
      168, 162, 158, 255,
      255, 250, 240, 255
    ]);
    var grad = new T.DataTexture(data, 3, 1, T.RGBAFormat);
    grad.magFilter = T.NearestFilter;
    grad.minFilter = T.NearestFilter;
    grad.needsUpdate = true;
    if ("encoding" in grad) grad.encoding = T.LinearEncoding;

    var opaque = new T.MeshToonMaterial({
      color: 0xffffff,
      vertexColors: true,
      gradientMap: grad,
      shininess: 0
    });
    if ("specular" in opaque) opaque.specular.set(0, 0, 0);

    var emissive = new T.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true
    });

    var outline = new T.MeshBasicMaterial({
      color: 0x1a1a22,
      side: T.BackSide,
      depthWrite: true
    });

    mats = { opaque: opaque, emissive: emissive, outline: outline, gradientMap: grad };
    return mats;
  }

  function isEmissiveKey(def, ch) {
    var keys = def.emissiveKeys;
    if (!keys) keys = ["E"];
    if (typeof keys === "string") keys = [keys];
    for (var i = 0; i < keys.length; i++) if (keys[i] === ch) return true;
    return false;
  }

  function addVoxel(map, ch, x, y, z) {
    if (!ch || ch === ".") return;
    map[key(x, y, z)] = { x: x, y: y, z: z, ch: ch };
  }

  function stampBoxes(map, boxes, ox, oy, oz) {
    if (!boxes) return;
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      var ch = b[0];
      var x0 = b[1] + ox, y0 = b[2] + oy, z0 = b[3] + oz;
      var x1 = (b.length > 4 ? b[4] : b[1]) + ox;
      var y1 = (b.length > 5 ? b[5] : b[2]) + oy;
      var z1 = (b.length > 6 ? b[6] : b[3]) + oz;
      if (x0 > x1) { var tx = x0; x0 = x1; x1 = tx; }
      if (y0 > y1) { var ty = y0; y0 = y1; y1 = ty; }
      if (z0 > z1) { var tz = z0; z0 = z1; z1 = tz; }
      for (var y = y0; y <= y1; y++) {
        for (var z = z0; z <= z1; z++) {
          for (var x = x0; x <= x1; x++) addVoxel(map, ch, x, y, z);
        }
      }
    }
  }

  function stampDots(map, voxels, ox, oy, oz) {
    if (!voxels) return;
    for (var i = 0; i < voxels.length; i++) {
      var v = voxels[i];
      addVoxel(map, v[0], v[1] + ox, v[2] + oy, v[3] + oz);
    }
  }

  function stampLayers(map, layers, ox, oy, oz) {
    if (!layers) return;
    for (var y = 0; y < layers.length; y++) {
      var slice = layers[y];
      if (typeof slice === "string") slice = [slice];
      for (var z = 0; z < slice.length; z++) {
        var row = slice[z];
        for (var x = 0; x < row.length; x++) addVoxel(map, row.charAt(x), x + ox, y + oy, z + oz);
      }
    }
  }

  function parsePart(part) {
    var o = part.origin || part.offset || [0, 0, 0];
    var map = {};
    stampBoxes(map, part.boxes, o[0], o[1], o[2]);
    stampDots(map, part.voxels, o[0], o[1], o[2]);
    stampLayers(map, part.layers, o[0], o[1], o[2]);
    return map;
  }

  function collectVals(map) {
    var out = [];
    for (var k in map) if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
    return out;
  }

  function buildGeom(voxels, occ, palette, def, emissiveOnly, scale, pivot, inflate) {
    var list = [];
    var i, v, f, n, nx, ny, nz, occKey;
    for (i = 0; i < voxels.length; i++) {
      v = voxels[i];
      if (isEmissiveKey(def, v.ch) !== emissiveOnly) continue;
      list.push(v);
    }
    if (!list.length) return null;

    var faceCount = 0;
    var flags = [];
    for (i = 0; i < list.length; i++) {
      v = list[i];
      var mask = 0;
      for (f = 0; f < 6; f++) {
        n = FACE[f].n;
        occKey = key(v.x + n[0], v.y + n[1], v.z + n[2]);
        if (!occ[occKey]) {
          mask |= (1 << f);
          faceCount++;
        }
      }
      flags.push(mask);
    }
    if (!faceCount) return null;

    var T = THREE();
    var pos = new Float32Array(faceCount * 6 * 3);
    var nor = new Float32Array(faceCount * 6 * 3);
    var col = new Float32Array(faceCount * 6 * 3);
    var pi = 0, ni = 0, ci = 0;
    var px = pivot[0], py = pivot[1], pz = pivot[2];
    var pad = inflate || 0;
    var hx = scale * 0.5 + pad;

    for (i = 0; i < list.length; i++) {
      v = list[i];
      var rgb = parseHex(palette[v.ch] || "#ff00ff");
      var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
      var cxv = (v.x + 0.5 - px) * scale;
      var cyv = (v.y + 0.5 - py) * scale;
      var czv = (v.z + 0.5 - pz) * scale;
      for (f = 0; f < 6; f++) {
        if (!(flags[i] & (1 << f))) continue;
        n = FACE[f].n;
        var corners = FACE[f].v;
        var quad = [];
        var c;
        for (c = 0; c < 4; c++) {
          quad.push([
            cxv + (corners[c][0] * 2 - 1) * hx,
            cyv + (corners[c][1] * 2 - 1) * hx,
            czv + (corners[c][2] * 2 - 1) * hx
          ]);
        }
        var idx = [0, 1, 2, 0, 2, 3];
        for (c = 0; c < 6; c++) {
          var p = quad[idx[c]];
          pos[pi++] = p[0]; pos[pi++] = p[1]; pos[pi++] = p[2];
          nor[ni++] = n[0]; nor[ni++] = n[1]; nor[ni++] = n[2];
          col[ci++] = r; col[ci++] = g; col[ci++] = b;
        }
      }
    }

    var geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    geo.setAttribute("normal", new T.BufferAttribute(nor, 3));
    geo.setAttribute("color", new T.BufferAttribute(col, 3));
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
  }

  function bake(id) {
    var def = defs[id];
    if (!def) throw new Error("voxel.js: unknown model " + id);
    var scale = def.scale == null ? 0.125 : def.scale;
    var palette = def.palette || {};
    var partNames = Object.keys(def.parts || {});
    var globalOcc = {};
    var parsed = [];
    var minX = Infinity, minY = Infinity, minZ = Infinity;
    var maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    var voxelCount = 0;
    var p, k, v, voxels;

    for (p = 0; p < partNames.length; p++) {
      var map = parsePart(def.parts[partNames[p]]);
      voxels = collectVals(map);
      parsed.push({ name: partNames[p], part: def.parts[partNames[p]], voxels: voxels });
      for (k = 0; k < voxels.length; k++) {
        v = voxels[k];
        globalOcc[key(v.x, v.y, v.z)] = 1;
        voxelCount++;
        if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
        if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;
      }
    }
    if (!voxelCount) throw new Error("voxel.js: empty model " + id);

    var width = (maxX - minX + 1) * scale;
    var height = (maxY - minY + 1) * scale;
    var depth = (maxZ - minZ + 1) * scale;
    var body = Math.max(height, 0.6);
    var thickness = Math.max(0.02, body * 0.05);
    if (def.outlineThickness != null) thickness = def.outlineThickness;

    var bakedParts = [];
    for (p = 0; p < parsed.length; p++) {
      var item = parsed[p];
      var pivot = item.part.pivot || [0, 0, 0];
      var localOcc = {};
      for (k = 0; k < item.voxels.length; k++) {
        v = item.voxels[k];
        localOcc[key(v.x, v.y, v.z)] = 1;
      }
      bakedParts.push({
        name: item.name,
        position: [pivot[0] * scale, pivot[1] * scale, pivot[2] * scale],
        opaque: buildGeom(item.voxels, globalOcc, palette, def, false, scale, pivot, 0),
        emissive: buildGeom(item.voxels, globalOcc, palette, def, true, scale, pivot, 0),
        outline: buildGeom(item.voxels, localOcc, palette, def, false, scale, pivot, thickness)
      });
    }

    var lodPivot = [(minX + maxX + 1) * 0.5, minY, (minZ + maxZ + 1) * 0.5];
    var allVox = [];
    for (p = 0; p < parsed.length; p++) {
      voxels = parsed[p].voxels;
      for (k = 0; k < voxels.length; k++) allVox.push(voxels[k]);
    }

    return {
      id: id,
      scale: scale,
      anim: def.anim || "biped",
      voxelCount: voxelCount,
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      width: width,
      height: height,
      depth: depth,
      radius: Math.max(width, depth) * 0.5,
      outlineThickness: thickness,
      parts: bakedParts,
      lodPivot: lodPivot,
      lodOpaque: buildGeom(allVox, globalOcc, palette, def, false, scale, lodPivot, 0),
      lodEmissive: buildGeom(allVox, globalOcc, palette, def, true, scale, lodPivot, 0)
    };
  }

  function getBaked(id) {
    if (!geoCache[id]) geoCache[id] = bake(id);
    return geoCache[id];
  }

  function registerVoxelModel(id, def) {
    if (!id || !def) throw new Error("voxel.js: registerVoxelModel(id, def) required");
    var isNew = !defs[id];
    defs[id] = def;
    if (isNew) order.push(id);
    if (geoCache[id]) delete geoCache[id];
    return id;
  }

  function buildVoxelModel(id, opts) {
    opts = opts || {};
    ensureMats();
    var baked = getBaked(id);
    var T = THREE();
    var root = new T.Group();
    root.name = id;
    var partMap = {};
    var cx = (baked.min[0] + baked.max[0] + 1) * 0.5 * baked.scale;
    var cz = (baked.min[2] + baked.max[2] + 1) * 0.5 * baked.scale;
    var dy = baked.min[1] * baked.scale;
    var i;
    for (i = 0; i < baked.parts.length; i++) {
      var p = baked.parts[i];
      var wrap = new T.Group();
      wrap.name = p.name;
      wrap.position.set(p.position[0], p.position[1], p.position[2]);
      if (p.opaque) {
        var mesh = new T.Mesh(p.opaque, mats.opaque);
        mesh.name = p.name + "_mesh";
        wrap.add(mesh);
      }
      if (p.emissive) {
        var em = new T.Mesh(p.emissive, mats.emissive);
        em.name = p.name + "_emit";
        wrap.add(em);
      }
      if (p.outline && opts.outline !== false) {
        var ol = new T.Mesh(p.outline, mats.outline);
        ol.name = "__outline";
        wrap.add(ol);
      }
      if (opts.center !== false) {
        wrap.position.x -= cx;
        wrap.position.y -= dy;
        wrap.position.z -= cz;
      }
      root.add(wrap);
      partMap[p.name] = wrap;
    }
    if (opts.lod && (baked.lodOpaque || baked.lodEmissive)) {
      var lodWrap = new T.Group();
      lodWrap.name = "__lod";
      lodWrap.visible = false;
      lodWrap.position.set(baked.lodPivot[0] * baked.scale, baked.lodPivot[1] * baked.scale, baked.lodPivot[2] * baked.scale);
      var lodSrc = baked.lodOpaque || baked.lodEmissive;
      var lodMesh = new T.Mesh(lodSrc, baked.lodOpaque ? mats.opaque : mats.emissive);
      lodMesh.name = "__lod_mesh";
      lodWrap.add(lodMesh);
      if (opts.center !== false) {
        lodWrap.position.x -= cx;
        lodWrap.position.y -= dy;
        lodWrap.position.z -= cz;
      }
      root.add(lodWrap);
      root.userData.lod = lodWrap;
    }
    if (opts.fitHeight && baked.height > 0) {
      root.scale.setScalar(opts.fitHeight / baked.height);
    }
    if (opts.scale) root.scale.multiplyScalar(opts.scale);
    root.userData.voxelId = id;
    root.userData.voxelInfo = baked;
    root.userData.parts = partMap;
    root.userData.anim = baked.anim;
    return root;
  }

  function listVoxelModels() {
    return order.slice();
  }

  function getVoxelModelInfo(id) {
    return getBaked(id);
  }

  function getVoxelModelDef(id) {
    return defs[id] || null;
  }

  function getVoxelMaterials() {
    return ensureMats();
  }

  function setVoxelOutlineVisible(root, visible) {
    if (!root || !root.traverse) return;
    root.traverse(function (obj) {
      if (obj.name === "__outline") obj.visible = !!visible;
    });
  }

  function disposeVoxelCache(id) {
    function dump(geo) {
      if (geo && geo.dispose) geo.dispose();
    }
    function dumpOne(baked) {
      for (var i = 0; i < baked.parts.length; i++) {
        dump(baked.parts[i].opaque);
        dump(baked.parts[i].emissive);
        dump(baked.parts[i].outline);
      }
      dump(baked.lodOpaque);
      dump(baked.lodEmissive);
    }
    if (id) {
      if (geoCache[id]) { dumpOne(geoCache[id]); delete geoCache[id]; }
      return;
    }
    for (var k in geoCache) if (Object.prototype.hasOwnProperty.call(geoCache, k)) dumpOne(geoCache[k]);
    geoCache = {};
  }

  global.registerVoxelModel = registerVoxelModel;
  global.buildVoxelModel = buildVoxelModel;
  global.listVoxelModels = listVoxelModels;
  global.getVoxelModelInfo = getVoxelModelInfo;
  global.getVoxelModelDef = getVoxelModelDef;
  global.getVoxelMaterials = getVoxelMaterials;
  global.setVoxelOutlineVisible = setVoxelOutlineVisible;
  global.disposeVoxelCache = disposeVoxelCache;
})(window);
