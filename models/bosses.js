// P4.1 boss voxel definitions. Layers: Y up, bottom first; each string is +X, rows are +Z.
// pivot = joint in local layer space. offset = world voxel of local (0,0,0).
(function (global) {
  "use strict";

  var SCALE = 0.125;
  var C = {
    grass: "#7ec850",
    grassDk: "#5da03e",
    dirt: "#c2a36b",
    stone: "#8a8f98",
    wood: "#6b4a2f",
    red: "#ff4d62",
    magic: "#64d5ff",
    rare: "#ffd374",
    unique: "#ff8ddd",
    boss: "#ff3f4b",
    gold: "#ffe066",
    voidP: "#9b5cff",
    ice: "#40e0d0",
    fire: "#ff7a29",
    poison: "#3ddc64",
    ink: "#1a1a22",
    bone: "#f4f2ea",
    eye: "#ffe066"
  };

  function Vox() {
    this.m = Object.create(null);
    this.n = 0;
  }
  Vox.prototype.set = function (x, y, z, c) {
    if (!c || c === ".") return;
    x = x | 0; y = y | 0; z = z | 0;
    var k = x + "," + y + "," + z;
    if (this.m[k] == null) this.n++;
    this.m[k] = c;
  };
  Vox.prototype.del = function (x, y, z) {
    var k = (x | 0) + "," + (y | 0) + "," + (z | 0);
    if (this.m[k] != null) {
      delete this.m[k];
      this.n--;
    }
  };
  Vox.prototype.box = function (x0, y0, z0, x1, y1, z1, c) {
    var x, y, z;
    if (x0 > x1) { x = x0; x0 = x1; x1 = x; }
    if (y0 > y1) { y = y0; y0 = y1; y1 = y; }
    if (z0 > z1) { z = z0; z0 = z1; z1 = z; }
    for (y = y0; y <= y1; y++)
      for (z = z0; z <= z1; z++)
        for (x = x0; x <= x1; x++) this.set(x, y, z, c);
    return this;
  };
  Vox.prototype.shellBox = function (x0, y0, z0, x1, y1, z1, c, t) {
    var x, y, z, onX, onY, onZ;
    t = t == null ? 1 : t;
    if (x0 > x1) { x = x0; x0 = x1; x1 = x; }
    if (y0 > y1) { y = y0; y0 = y1; y1 = y; }
    if (z0 > z1) { z = z0; z0 = z1; z1 = z; }
    for (y = y0; y <= y1; y++) {
      onY = y <= y0 + t - 1 || y >= y1 - t + 1;
      for (z = z0; z <= z1; z++) {
        onZ = z <= z0 + t - 1 || z >= z1 - t + 1;
        for (x = x0; x <= x1; x++) {
          onX = x <= x0 + t - 1 || x >= x1 - t + 1;
          if (onX || onY || onZ) this.set(x, y, z, c);
        }
      }
    }
    return this;
  };
  Vox.prototype.ellip = function (cx, cy, cz, rx, ry, rz, c, shade, inner) {
    var x, y, z, nx, ny, nz, n2, ch, lim;
    var x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx);
    var y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    var z0 = Math.floor(cz - rz), z1 = Math.ceil(cz + rz);
    lim = inner != null ? inner * inner : 0;
    for (y = y0; y <= y1; y++) {
      ny = (y - cy) / (ry || 1);
      for (z = z0; z <= z1; z++) {
        nz = (z - cz) / (rz || 1);
        for (x = x0; x <= x1; x++) {
          nx = (x - cx) / (rx || 1);
          n2 = nx * nx + ny * ny + nz * nz;
          if (n2 <= 1.02 && n2 >= lim) {
            ch = c;
            if (shade && (nx * 0.3 + ny * 0.75 + nz * 0.45) < -0.12) ch = shade;
            this.set(x, y, z, ch);
          }
        }
      }
    }
    return this;
  };
  Vox.prototype.line = function (x0, y0, z0, x1, y1, z1, r, c, shade) {
    var dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    var n = Math.max(1, Math.ceil(len * 2.2));
    var i, t, cx, cy, cz, x, y, z, ir, rr, ch;
    ir = Math.ceil(r);
    rr = r * r + 0.35;
    for (i = 0; i <= n; i++) {
      t = i / n;
      cx = x0 + dx * t;
      cy = y0 + dy * t;
      cz = z0 + dz * t;
      ch = (shade && t > 0.62) ? shade : c;
      for (y = -ir; y <= ir; y++)
        for (z = -ir; z <= ir; z++)
          for (x = -ir; x <= ir; x++)
            if (x * x + y * y + z * z <= rr)
              this.set(Math.round(cx + x), Math.round(cy + y), Math.round(cz + z), ch);
    }
    return this;
  };
  Vox.prototype.stamp = function (other) {
    var k, p;
    for (k in other.m) {
      p = k.split(",");
      this.set(+p[0], +p[1], +p[2], other.m[k]);
    }
    return this;
  };
  Vox.prototype.toPart = function (px, py, pz, extra) {
    var k, p, x, y, z, minX = 1e9, minY = 1e9, minZ = 1e9, maxX = -1e9, maxY = -1e9, maxZ = -1e9;
    var keys = Object.keys(this.m);
    if (!keys.length) {
      return Object.assign({ layers: [["."]], pivot: [0, 0, 0], origin: [0, 0, 0] }, extra || {});
    }
    for (k = 0; k < keys.length; k++) {
      p = keys[k].split(",");
      x = +p[0]; y = +p[1]; z = +p[2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    var w = maxX - minX + 1, d = maxZ - minZ + 1, h = maxY - minY + 1;
    var layers = [];
    var yi, zi, xi, row, grid;
    for (yi = 0; yi < h; yi++) {
      grid = [];
      for (zi = 0; zi < d; zi++) {
        row = "";
        for (xi = 0; xi < w; xi++) {
          row += this.m[(minX + xi) + "," + (minY + yi) + "," + (minZ + zi)] || ".";
        }
        grid.push(row);
      }
      layers.push(grid);
    }
    var part = {
      layers: layers,
      pivot: [px | 0, py | 0, pz | 0],
      origin: [minX, minY, minZ]
    };
    if (extra) Object.assign(part, extra);
    return part;
  };

  function queueRegister(name, def) {
    global.BOSS_VOXEL_DEFS = global.BOSS_VOXEL_DEFS || {};
    global.BOSS_VOXEL_DEFS[name] = def;
    if (typeof global.registerVoxelModel === "function") {
      global.registerVoxelModel(name, def);
    } else {
      global.__VOXEL_MODEL_QUEUE = global.__VOXEL_MODEL_QUEUE || [];
      global.__VOXEL_MODEL_QUEUE.push([name, def]);
    }
  }

  function countParts(parts) {
    var n = 0, name, part, y, z, x, row;
    for (name in parts) {
      part = parts[name];
      if (!part || !part.layers) continue;
      for (y = 0; y < part.layers.length; y++) {
        for (z = 0; z < part.layers[y].length; z++) {
          row = part.layers[y][z];
          for (x = 0; x < row.length; x++) if (row.charAt(x) !== ".") n++;
        }
      }
    }
    return n;
  }

  function heightParts(parts) {
    var minY = 1e9, maxY = -1e9, name, part, y0, y1;
    for (name in parts) {
      part = parts[name];
      if (!part || !part.layers) continue;
      y0 = (part.origin && part.origin[1]) || 0;
      y1 = y0 + part.layers.length - 1;
      if (y0 < minY) minY = y0;
      if (y1 > maxY) maxY = y1;
    }
    return maxY < minY ? 0 : maxY - minY + 1;
  }

  function clonePart(part) {
    return { layers: part.layers, pivot: part.pivot, origin: part.origin };
  }

  function partsForPhase(all, ph, phase2) {
    var hide = (phase2 && phase2.hide) || [];
    var parts = {};
    var name, part;
    for (name in all) {
      part = all[name];
      if (ph === 2) {
        if (hide.indexOf(name) >= 0) continue;
        if (part.phase === 1) continue;
      } else if (part.phase === 2) continue;
      parts[name] = clonePart(part);
    }
    return parts;
  }

  function finish(name, def) {
    var p1 = partsForPhase(def.parts, 1, def.phase2);
    var p2 = partsForPhase(def.parts, 2, def.phase2);
    var pal2 = Object.assign({}, def.palette, (def.phase2 && def.phase2.palette) || {});
    var d1 = {
      palette: def.palette,
      emissiveKeys: def.emissiveKeys || ["E"],
      parts: p1,
      scale: SCALE,
      anim: def.anim || "biped",
      meta: def.meta,
      phase2Id: name + "_p2"
    };
    d1.voxels = countParts(p1);
    d1.heightVox = heightParts(p1);
    if (d1.voxels > 2500) console.warn("[bosses] " + name + " voxel count " + d1.voxels + " over 2500");
    if (d1.heightVox < 24 || d1.heightVox > 40) console.warn("[bosses] " + name + " height " + d1.heightVox + " outside 24-40");
    var d2 = {
      palette: pal2,
      emissiveKeys: def.emissiveKeys || ["E"],
      parts: p2,
      scale: SCALE,
      anim: def.anim || "biped",
      meta: def.meta
    };
    d2.voxels = countParts(p2);
    d2.heightVox = heightParts(p2);
    queueRegister(name, d1);
    queueRegister(name + "_p2", d2);
    return d1;
  }

  // --- Arachne ----------------------------------------------------------
  function buildArachne() {
    var pal = {
      B: C.wood, S: C.ink, R: C.boss, P: C.red, K: C.unique, E: C.eye, G: C.gold
    };
    var parts = {};
    var ab = new Vox();
    ab.ellip(0, 9, -6, 7, 5, 8, "B", "S", 0.72);
    ab.box(-2, 12, -10, 2, 13, -2, "R");
    ab.box(-1, 13, -9, 1, 14, -3, "P");
    parts.abdomen = ab.toPart(0, 9, -4);

    var th = new Vox();
    th.ellip(0, 10, 4, 4, 3, 4, "B", "S", 0.55);
    parts.thorax = th.toPart(0, 10, 4);

    var hd = new Vox();
    hd.ellip(0, 10, 10, 3.4, 2.8, 3.4, "B", "S", 0);
    hd.box(-3, 10, 12, -2, 11, 13, "E");
    hd.box(2, 10, 12, 3, 11, 13, "E");
    hd.box(-1, 11, 12, 0, 12, 13, "E");
    hd.box(1, 11, 12, 1, 12, 13, "E");
    parts.head = hd.toPart(0, 10, 10);

    var fL = new Vox();
    fL.line(-2, 8, 12, -3, 4, 15, 0.85, "R", "P");
    parts.fangL = fL.toPart(-2, 8, 12);
    var fR = new Vox();
    fR.line(2, 8, 12, 3, 4, 15, 0.85, "R", "P");
    parts.fangR = fR.toPart(2, 8, 12);

    var egg = new Vox();
    egg.ellip(0, 16, -10, 4, 4, 4, "K", "P", 0.45);
    egg.box(-1, 19, -10, 1, 20, -9, "G");
    parts.eggSac = egg.toPart(0, 16, -10, { phase: 1 });

    var open = new Vox();
    open.ellip(0, 15, -10, 4.5, 2.4, 4.5, "R", "S", 0);
    open.ellip(0, 15, -10, 2.4, 1.6, 2.4, "P", "S", 0);
    parts.eggSacOpen = open.toPart(0, 15, -10, { phase: 2 });

    function addLeg(id, hip, knee, foot) {
      var v = new Vox();
      v.line(hip[0], hip[1], hip[2], knee[0], knee[1], knee[2], 0.95, "B", "S");
      v.line(knee[0], knee[1], knee[2], foot[0], foot[1], foot[2], 0.8, "S", "R");
      v.box(foot[0], 0, foot[2], foot[0], 1, foot[2], "R");
      parts[id] = v.toPart(hip[0], hip[1], hip[2]);
    }
    addLeg("legL1", [-4, 10, 7], [-12, 25, 12], [-16, 0, 16]);
    addLeg("legL2", [-5, 10, 4], [-14, 26, 5], [-18, 0, 6]);
    addLeg("legL3", [-5, 10, 1], [-14, 25, -2], [-17, 0, -4]);
    addLeg("legL4", [-4, 10, -2], [-12, 23, -8], [-15, 0, -12]);
    addLeg("legR1", [4, 10, 7], [12, 25, 12], [16, 0, 16]);
    addLeg("legR2", [5, 10, 4], [14, 26, 5], [18, 0, 6]);
    addLeg("legR3", [5, 10, 1], [14, 25, -2], [17, 0, -4]);
    addLeg("legR4", [4, 10, -2], [12, 23, -8], [15, 0, -12]);

    return finish("boss_arachne", {
      palette: pal,
      emissiveKeys: ["E", "G"],
      anim: "crawl",
      parts: parts,
      phase2: { palette: { B: C.ink, S: C.wood, K: C.boss, R: C.fire }, hide: ["eggSac"], show: ["eggSacOpen"] },
      meta: {
        title: "Arachne",
        spawn: "spawnBoss, bossVariant 0",
        telegraph: "fangL/fangR spread down-forward, abdomen chevron pulses",
        animate: "legL1..legL8 (L1-4/R1-4) rotate in sequence; abdomen bobs; fangs flare on attack",
        phase2: "egg sac hides, eggSacOpen crater; palette shifts darker with fire marks"
      }
    });
  }

  // --- Kraken Sapligi ---------------------------------------------------
  function buildKraken() {
    var pal = {
      G: C.poison, D: C.grassDk, B: C.wood, R: C.boss, P: C.red, V: C.voidP,
      E: C.eye, F: C.fire, M: C.unique
    };
    var parts = {};
    var body = new Vox();
    body.ellip(0, 12, 0, 7, 8, 6, "G", "D", 0.8);
    body.ellip(0, 18, 2, 4, 4, 4, "G", "B", 0.62);
    body.ellip(0, 24, 1, 2.5, 3.2, 2.5, "G", "D", 0.45);
    body.box(-1, 27, -1, 1, 29, 1, "R");
    body.line(-4, 8, -5, -8, 1, -10, 0.9, "D", "B");
    body.line(4, 8, -5, 8, 1, -10, 0.9, "D", "B");
    body.line(0, 7, -6, 0, 1, -11, 0.95, "G", "D");
    body.box(-2, 16, 6, -1, 18, 7, "E");
    body.box(1, 16, 6, 2, 18, 7, "E");
    parts.body = body.toPart(0, 12, 0);

    var maw = new Vox();
    maw.box(-3, 10, 8, 3, 13, 11, "R");
    maw.box(-2, 11, 10, 2, 12, 12, "P");
    parts.maw = maw.toPart(0, 12, 10);

    function tent(id, a, phaseTip) {
      var ca = Math.cos(a), sa = Math.sin(a);
      var hx = Math.round(ca * 8), hz = Math.round(sa * 8);
      var mx = Math.round(ca * 14), mz = Math.round(sa * 14);
      var fx = Math.round(ca * 18), fz = Math.round(sa * 20);
      var v = new Vox();
      v.line(hx, 10, hz, mx, 20, mz, 0.95, "G", "D");
      v.line(mx, 20, mz, fx, 4, fz, 0.8, "D", "R");
      v.ellip(fx, 4, fz, 1.5, 1.5, 1.5, "R", "P", 0);
      parts[id] = v.toPart(hx, 10, hz);
      var tip = new Vox();
      tip.ellip(fx, 3, fz, 2.0, 2.6, 2.0, "V", "F", 0);
      tip.line(fx, 5, fz, fx, 9, fz, 0.9, "V", "F");
      parts[id + "Flame"] = tip.toPart(hx, 10, hz, { phase: 2 });
    }
    tent("tentA", -0.55);
    tent("tentB", 0.55);
    tent("tentC", 2.2);
    tent("tentD", -2.2);

    return finish("boss_kraken", {
      palette: pal,
      emissiveKeys: ["E", "F", "V"],
      anim: "hover",
      parts: parts,
      phase2: { palette: { R: C.voidP, P: C.unique, D: C.ink }, hide: [], show: ["tentAFlame", "tentBFlame", "tentCFlame", "tentDFlame"] },
      meta: {
        title: "Kraken Sapligi",
        spawn: "spawnBoss, bossVariant 1",
        telegraph: "maw opens red; tentA-D lift then slam (red undersides)",
        animate: "tentA-D raise-slam in pairs; body squash; maw pulses",
        phase2: "tentacle tip flames appear (void/fire); red marks shift to void purple"
      }
    });
  }

  // --- Kral Slime -------------------------------------------------------
  function buildSlime() {
    var pal = {
      G: C.poison, D: C.grassDk, K: C.gold, B: C.bone, S: C.ink, E: C.eye, R: C.boss, W: C.rare
    };
    var parts = {};
    var blob = new Vox();
    blob.ellip(0, 11, 0, 7, 11, 7, "G", "D", 0.78);
    var wx, wy;
    for (wy = 7; wy <= 15; wy++)
      for (wx = -2; wx <= 2; wx++) {
        blob.del(wx, wy, 6);
        blob.del(wx, wy, 5);
      }
    blob.box(-3, 16, 6, -2, 18, 7, "E");
    blob.box(2, 16, 6, 3, 18, 7, "E");
    parts.blob = blob.toPart(0, 0, 0, { phase: 1 });

    var sk = new Vox();
    sk.box(-2, 8, 4, 2, 14, 6, "B");
    sk.box(-3, 14, 3, 3, 17, 5, "B");
    sk.box(-2, 15, 5, -1, 16, 6, "S");
    sk.box(1, 15, 5, 2, 16, 6, "S");
    sk.box(-4, 11, 3, -3, 12, 4, "B");
    sk.box(3, 11, 3, 4, 12, 4, "B");
    parts.skeleton = sk.toPart(0, 10, 0, { phase: 1 });

    var cr = new Vox();
    cr.box(-3, 20, -3, 3, 21, 3, "K");
    cr.box(-2, 21, -2, 2, 22, 2, "K");
    cr.box(-1, 22, -1, 1, 24, 1, "W");
    cr.box(-4, 21, -1, -4, 23, 1, "K");
    cr.box(4, 21, -1, 4, 23, 1, "K");
    cr.box(-1, 21, -4, 1, 23, -4, "K");
    cr.box(-1, 21, 4, 1, 23, 4, "K");
    parts.crown = cr.toPart(0, 21, 0);

    var maw = new Vox();
    maw.box(-4, 8, 7, 4, 12, 8, "R");
    maw.box(-3, 9, 8, 3, 11, 9, "S");
    parts.maw = maw.toPart(0, 10, 8);

    function half(id, sx) {
      var h = new Vox();
      h.ellip(sx * 5, 8, 0, 5, 7, 5, "G", "D", 0.7);
      h.box(sx * 5 - 1, 12, 5, sx * 5, 14, 6, "E");
      parts[id] = h.toPart(sx * 5, 0, 0, { opacity: 0.7, phase: 2 });
    }
    half("halfL", -1);
    half("halfR", 1);

    return finish("boss_kral_slime", {
      palette: pal,
      emissiveKeys: ["E", "K", "W"],
      anim: "squash",
      parts: parts,
      phase2: { palette: { G: C.boss, D: C.red }, hide: ["blob", "skeleton"], show: ["halfL", "halfR"] },
      meta: {
        title: "Kral Slime",
        spawn: "spawnBoss, bossVariant 2",
        telegraph: "maw crack on front face; crown glow before bounce",
        animate: "blob squash-stretch on hop; crown stays upright; skeleton drifts inside",
        phase2: "blob+skeleton hide, two half slimes show; palette shifts red"
      }
    });
  }

  // --- Golem ------------------------------------------------------------
  function buildGolem() {
    var pal = {
      T: C.stone, D: C.ink, W: C.wood, C: C.fire, M: C.boss, E: C.eye, G: C.gold, L: C.dirt
    };
    var parts = {};
    var body = new Vox();
    body.shellBox(-5, 11, -3, 5, 25, 3, "T", 1);
    body.box(-5, 13, 2, -2, 15, 3, "W");
    body.box(2, 20, 2, 5, 22, 3, "W");
    body.box(-2, 11, -3, 2, 12, 3, "L");
    body.box(-2, 17, 2, 2, 21, 3, "D");
    parts.torso = body.toPart(0, 18, 0);

    var core = new Vox();
    core.box(-2, 17, 2, 2, 21, 5, "C");
    core.box(-1, 18, 4, 1, 20, 6, "M");
    core.box(0, 19, 5, 0, 19, 6, "G");
    parts.core = core.toPart(0, 19, 4);

    var hd = new Vox();
    hd.shellBox(-3, 26, -2, 3, 33, 2, "T", 1);
    hd.box(-2, 30, 2, -1, 31, 3, "E");
    hd.box(1, 30, 2, 2, 31, 3, "E");
    hd.box(-1, 27, 2, 1, 28, 2, "D");
    parts.head = hd.toPart(0, 28, 0);

    var aL = new Vox();
    aL.shellBox(-11, 18, -2, -8, 25, 2, "T", 1);
    aL.shellBox(-12, 8, -2, -8, 18, 2, "T", 1);
    aL.box(-13, 8, -2, -8, 10, 2, "D");
    parts.armL = aL.toPart(-9, 24, 0);
    var aR = new Vox();
    aR.shellBox(8, 18, -2, 11, 25, 2, "T", 1);
    aR.shellBox(8, 8, -2, 12, 18, 2, "T", 1);
    aR.box(8, 8, -2, 13, 10, 2, "D");
    parts.armR = aR.toPart(9, 24, 0);

    var lL = new Vox();
    lL.shellBox(-5, 0, -2, -1, 11, 2, "T", 1);
    lL.box(-6, 0, -3, -1, 2, 3, "D");
    parts.legL = lL.toPart(-3, 11, 0);
    var lR = new Vox();
    lR.shellBox(1, 0, -2, 5, 11, 2, "T", 1);
    lR.box(1, 0, -3, 6, 2, 3, "D");
    parts.legR = lR.toPart(3, 11, 0);

    var drip = new Vox();
    drip.box(-1, 14, 5, 1, 16, 6, "C");
    drip.box(0, 11, 5, 0, 14, 6, "M");
    drip.box(-2, 9, 4, 2, 10, 6, "C");
    parts.magmaDrip = drip.toPart(0, 16, 5, { phase: 2 });

    var shellGone = new Vox();
    shellGone.shellBox(-5, 10, -3, 5, 26, 3, "C", 1);
    shellGone.box(-4, 14, -2, 4, 22, 2, "M");
    shellGone.box(-2, 16, 3, 2, 22, 5, "G");
    parts.magmaBody = shellGone.toPart(0, 18, 0, { phase: 2 });

    return finish("boss_golem", {
      palette: pal,
      emissiveKeys: ["E", "C", "M", "G"],
      anim: "biped",
      parts: parts,
      phase2: { palette: { T: C.dirt, D: C.ink }, hide: ["torso"], show: ["magmaDrip", "magmaBody"] },
      meta: {
        title: "Golem",
        spawn: "spawnBoss, bossVariant 3+",
        telegraph: "core (chest) flares before slam; arms lift",
        animate: "armL/armR overhead slam; legs stomp; core pulse; head tilts",
        phase2: "magmaBody+magmaDrip appear (outer stone reads as shed); stone tints dirt/fire"
      }
    });
  }

  // --- Herobrine --------------------------------------------------------
  function buildHerobrine() {
    var pal = {
      K: C.dirt, N: C.wood, G: C.grassDk, P: C.ink, B: C.magic, E: C.bone, W: C.bone, V: C.voidP, S: C.stone
    };
    var parts = {};
    var hd = new Vox();
    hd.box(-4, 18, -4, 3, 25, 3, "K");
    hd.box(-3, 21, 3, -1, 23, 4, "E");
    hd.box(0, 21, 3, 2, 23, 4, "E");
    hd.box(-3, 21, 4, -1, 23, 4, "W");
    hd.box(0, 21, 4, 2, 23, 4, "W");
    parts.head = hd.toPart(0, 18, 0);

    var bd = new Vox();
    bd.box(-4, 12, -2, 3, 17, 2, "G");
    bd.box(-4, 10, -2, 3, 11, 2, "P");
    parts.body = bd.toPart(0, 14, 0);

    var aL = new Vox();
    aL.box(-7, 10, -2, -5, 17, 1, "K");
    aL.box(-7, 16, -2, -5, 17, 1, "G");
    parts.armL = aL.toPart(-6, 17, 0);
    var aR = new Vox();
    aR.box(4, 12, 0, 6, 17, 3, "K");
    aR.box(4, 16, 0, 6, 17, 3, "G");
    parts.armR = aR.toPart(5, 17, 1);

    var lL = new Vox();
    lL.box(-4, 0, -2, -1, 9, 1, "S");
    lL.box(-4, 0, -2, -1, 1, 2, "P");
    parts.legL = lL.toPart(-3, 9, 0);
    var lR = new Vox();
    lR.box(0, 0, -2, 3, 9, 1, "S");
    lR.box(0, 0, -2, 3, 1, 2, "P");
    parts.legR = lR.toPart(1, 9, 0);

    function cube(id, x, y, z) {
      var v = new Vox();
      v.box(x - 2, y - 2, z - 2, x + 1, y + 1, z + 1, "P");
      v.box(x - 1, y - 1, z - 1, x, y, z, "V");
      parts[id] = v.toPart(x, y, z, { phase: 2 });
    }
    cube("obs1", -10, 14, 0);
    cube("obs2", 10, 18, 2);
    cube("obs3", -6, 22, -8);
    cube("obs4", 6, 8, 8);

    return finish("boss_herobrine", {
      palette: pal,
      emissiveKeys: ["E", "W", "V"],
      anim: "biped",
      parts: parts,
      phase2: { palette: { G: C.ink, K: C.stone }, hide: [], show: ["obs1", "obs2", "obs3", "obs4"] },
      meta: {
        title: "Herobrine",
        spawn: "createHerobrineBoss app.js:6883",
        telegraph: "eyes (E/W) flood white; armR already raised",
        animate: "static-pose idle (tiny head tick); teleport = scatter voxels then reform; armR points",
        phase2: "four obsidian cubes appear and orbit; shirt/skin darken"
      }
    });
  }

  // --- Serafim ----------------------------------------------------------
  function buildSerafim() {
    var pal = {
      W: C.bone, S: C.stone, G: C.gold, R: C.rare, E: C.eye, I: C.ice, D: C.ink, V: C.voidP, P: C.boss
    };
    var parts = {};
    var bd = new Vox();
    bd.shellBox(-4, 8, -2, 4, 24, 2, "W", 1);
    bd.box(-5, 8, -2, 5, 10, 2, "G");
    bd.box(-2, 16, 2, 2, 19, 3, "G");
    parts.body = bd.toPart(0, 16, 0);

    var hd = new Vox();
    hd.ellip(0, 28, 0, 3.2, 3.2, 3.2, "W", "S", 0.35);
    hd.box(-2, 28, 3, -1, 29, 4, "E");
    hd.box(1, 28, 3, 2, 29, 4, "E");
    parts.head = hd.toPart(0, 28, 0);

    var halo = new Vox();
    var a, x, z;
    for (a = 0; a < 24; a++) {
      x = Math.round(Math.cos((a / 24) * Math.PI * 2) * 5);
      z = Math.round(Math.sin((a / 24) * Math.PI * 2) * 5);
      halo.set(x, 32, z, "G");
      halo.set(x, 33, z, "R");
    }
    parts.halo = halo.toPart(0, 33, 0, { phase: 1 });

    var cracked = new Vox();
    for (a = 0; a < 24; a++) {
      if (a === 4 || a === 5 || a === 16) continue;
      x = Math.round(Math.cos((a / 24) * Math.PI * 2) * 5);
      z = Math.round(Math.sin((a / 24) * Math.PI * 2) * 5);
      cracked.set(x, 32, z, "V");
      cracked.set(x, 33, z, "P");
    }
    cracked.box(2, 31, 3, 3, 34, 4, "P");
    parts.haloCrack = cracked.toPart(0, 33, 0, { phase: 2 });

    function wing(id, sx, dark) {
      var v = new Vox();
      var i, yy, h;
      for (i = 1; i <= 11; i++) {
        h = 4 + Math.min(i, 11 - i);
        yy = 11 + i;
        v.box(sx * (5 + i), yy, -1, sx * (5 + i), yy + h, 1, dark ? "D" : "W");
        v.set(sx * (5 + i), yy + h, 0, dark ? "V" : "I");
      }
      for (i = 1; i <= 7; i++) {
        h = 2 + Math.min(i, 7 - i);
        yy = 20 + i;
        v.box(sx * (4 + i), yy, 0, sx * (4 + i), yy + h, 0, dark ? "P" : "S");
      }
      return v.toPart(sx * 5, 18, 0, dark ? { phase: 2 } : { phase: 1 });
    }
    parts.wingL = wing("wingL", -1, false);
    parts.wingR = wing("wingR", 1, false);
    parts.wingLDark = wing("wingLDark", -1, true);
    parts.wingRDark = wing("wingRDark", 1, true);

    var sig = new Vox();
    for (a = 0; a < 20; a++) {
      x = Math.round(Math.cos((a / 20) * Math.PI * 2) * 8);
      z = Math.round(Math.sin((a / 20) * Math.PI * 2) * 8);
      sig.set(x, 0, z, "G");
    }
    sig.box(-1, 0, -1, 1, 1, 1, "R");
    parts.sigil = sig.toPart(0, 0, 0);

    var lgL = new Vox();
    lgL.box(-3, 0, -2, -1, 8, 2, "W");
    parts.legL = lgL.toPart(-2, 8, 0);
    var lgR = new Vox();
    lgR.box(1, 0, -2, 3, 8, 2, "W");
    parts.legR = lgR.toPart(2, 8, 0);

    return finish("boss_serafim", {
      palette: pal,
      emissiveKeys: ["E", "G", "R", "I", "V"],
      anim: "fly",
      parts: parts,
      phase2: {
        palette: { W: C.stone, G: C.voidP, R: C.boss },
        hide: ["halo", "wingL", "wingR"],
        show: ["haloCrack", "wingLDark", "wingRDark"]
      },
      meta: {
        title: "Serafim",
        spawn: "createAngelBoss app.js:6955",
        telegraph: "sigil ring on ground + halo pulse before light columns",
        animate: "wingL/wingR flap (two pairs baked per side); halo spins; body hovers",
        phase2: "wings swap to dark, halo cracks; gold shifts to void/boss"
      }
    });
  }

  // --- Void Efendisi ----------------------------------------------------
  function buildVoid() {
    var pal = {
      V: C.voidP, D: C.ink, E: C.eye, G: C.gold, I: C.ice, R: C.boss, S: C.stone, M: C.magic
    };
    var parts = {};
    var core = new Vox();
    core.ellip(0, 16, 0, 8, 8, 8, "D", "V", 0.8);
    core.line(0, 8, 0, 0, 0, 0, 1.1, "D", "V");
    core.box(-1, 25, -1, 1, 27, 1, "R");
    parts.core = core.toPart(0, 16, 0);

    var iris = new Vox();
    iris.ellip(0, 16, 4, 6.5, 6.5, 2.6, "E", "G", 0.35);
    iris.ellip(0, 16, 7, 2.4, 2.4, 1.4, "D", "D", 0);
    parts.iris = iris.toPart(0, 16, 7);

    var open = new Vox();
    open.ellip(0, 16, 6, 6, 6, 2.4, "E", "I", 0.1);
    open.box(-1, 16, 8, 1, 16, 12, "I");
    parts.eyeOpen = open.toPart(0, 16, 8, { phase: 2 });

    var beam = new Vox();
    beam.box(-1, 15, 8, 1, 17, 22, "I");
    beam.box(0, 16, 10, 0, 16, 24, "E");
    parts.beam = beam.toPart(0, 16, 8, { phase: 2 });

    function orb(id, x, y, z, s) {
      var v = new Vox();
      v.box(x - s, y - s, z - s, x + s, y + s, z + s, "V");
      if (s > 1) v.box(x - s + 1, y - s + 1, z + s, x + s - 1, y + s - 1, z + s, "D");
      v.set(x, y, z, "R");
      parts[id] = v.toPart(x, y, z);
    }
    orb("orb1", -14, 18, 2, 1);
    orb("orb2", 14, 14, -3, 1);
    orb("orb3", -8, 26, -8, 1);
    orb("orb4", 9, 24, 8, 1);
    orb("orb5", -4, 6, 12, 1);
    orb("orb6", 6, 5, -12, 1);

    return finish("boss_void", {
      palette: pal,
      emissiveKeys: ["E", "G", "I", "R"],
      anim: "orbit",
      parts: parts,
      phase2: { palette: { V: C.boss, D: C.ink }, hide: ["iris"], show: ["eyeOpen", "beam"] },
      meta: {
        title: "Void Efendisi",
        spawn: "spawnVoidBossAt app.js:7878",
        telegraph: "iris slit narrows then orbs lean toward player",
        animate: "orb1-6 orbit core; iris pulses; orbs launch then return",
        phase2: "iris hides, eyeOpen+beam show (sweep); void tints toward boss red"
      }
    });
  }

  // --- Tapinak Muhafizi -------------------------------------------------
  function buildTemple() {
    var pal = {
      T: C.stone, D: C.ink, M: C.grassDk, G: C.gold, W: C.dirt, E: C.eye, V: C.voidP, F: C.fire, R: C.boss
    };
    var parts = {};
    var bd = new Vox();
    bd.shellBox(-6, 8, -3, 6, 23, 3, "T", 1);
    bd.box(-6, 12, 2, -3, 15, 3, "M");
    bd.box(3, 18, 2, 6, 20, 3, "M");
    bd.box(-2, 8, -3, 2, 9, 3, "G");
    bd.box(-2, 16, 2, 2, 18, 3, "G");
    parts.body = bd.toPart(0, 16, 0);

    var hd = new Vox();
    hd.shellBox(-3, 23, -3, 3, 32, 3, "T", 1);
    hd.box(-2, 31, -2, 2, 33, 2, "G");
    hd.box(-2, 27, 3, -1, 29, 4, "E");
    hd.box(1, 27, 3, 2, 29, 4, "E");
    hd.box(-1, 24, 3, 1, 25, 3, "D");
    hd.box(-4, 25, -1, -4, 31, 1, "G");
    hd.box(4, 25, -1, 4, 31, 1, "G");
    parts.head = hd.toPart(0, 28, 0);

    var aL = new Vox();
    aL.shellBox(-11, 14, -2, -8, 23, 2, "T", 1);
    aL.shellBox(-12, 10, -2, -8, 14, 2, "T", 1);
    aL.box(-10, 18, 2, -8, 19, 2, "M");
    parts.armL = aL.toPart(-10, 23, 0);

    var aR = new Vox();
    aR.shellBox(8, 18, -2, 11, 25, 2, "T", 1);
    aR.shellBox(8, 25, 0, 10, 31, 6, "T", 1);
    aR.box(7, 29, 5, 11, 32, 8, "D");
    aR.box(8, 30, 7, 10, 31, 9, "G");
    parts.armR = aR.toPart(10, 24, 0, { phase: 1 });

    var lL = new Vox();
    lL.shellBox(-5, 0, -2, -2, 8, 3, "T", 1);
    lL.box(-6, 0, -3, -2, 2, 4, "W");
    lL.box(-5, 4, 2, -3, 5, 3, "M");
    parts.legL = lL.toPart(-4, 8, 0);
    var lR = new Vox();
    lR.shellBox(2, 0, -2, 5, 8, 3, "T", 1);
    lR.box(2, 0, -3, 6, 2, 4, "W");
    parts.legR = lR.toPart(4, 8, 0);

    var whip = new Vox();
    whip.line(11, 22, 2, 14, 16, 10, 1.2, "V", "F");
    whip.line(14, 16, 10, 12, 8, 16, 1.0, "V", "R");
    whip.line(12, 8, 16, 8, 4, 18, 0.9, "F", "G");
    parts.whip = whip.toPart(11, 22, 2, { phase: 2 });
    var stump = new Vox();
    stump.box(9, 18, -3, 12, 24, 3, "T");
    stump.box(10, 22, 2, 12, 24, 4, "R");
    parts.armStump = stump.toPart(11, 23, 0, { phase: 2 });

    return finish("boss_temple", {
      palette: pal,
      emissiveKeys: ["E", "G", "V", "F"],
      anim: "biped",
      parts: parts,
      phase2: { palette: { G: C.voidP, T: C.stone }, hide: ["armR"], show: ["whip", "armStump"] },
      meta: {
        title: "Tapinak Muhafizi",
        spawn: "spawnTempleBossAt app.js:7902",
        telegraph: "raised armR hammer (gold head) before smash",
        animate: "intro: seated (rotate legs/body) then stand; armR smash; armL guard",
        phase2: "armR hides, armStump+whip show; gold tints void"
      }
    });
  }

  // --- ZONK Avatari -----------------------------------------------------
  function buildZonk() {
    var pal = {
      A: C.boss, B: C.voidP, C: C.ink, D: C.gold, E: C.ice, F: C.fire, S: C.bone, G: C.magic, R: C.red, K: C.unique
    };
    var parts = {};
    var hd = new Vox();
    hd.shellBox(-4, 30, -4, 3, 39, 3, "B", 1);
    hd.box(-3, 35, 3, -1, 37, 4, "E");
    hd.box(0, 35, 3, 2, 37, 4, "E");
    hd.del(-4, 33, 0);
    hd.del(3, 36, -2);
    hd.box(5, 34, 1, 6, 36, 2, "A");
    hd.box(-6, 32, -3, -5, 33, -1, "K");
    parts.head = hd.toPart(0, 32, 0);

    var bd = new Vox();
    bd.shellBox(-5, 16, -3, 4, 29, 3, "A", 1);
    bd.box(-4, 18, 3, 3, 24, 4, "D");
    bd.box(-2, 16, -3, 1, 17, 3, "D");
    bd.del(4, 22, 0);
    bd.del(-5, 20, -2);
    bd.box(6, 24, -6, 7, 26, -4, "B");
    bd.box(-7, 18, 5, -6, 20, 6, "C");
    parts.body = bd.toPart(0, 22, 0, { phase: 1 });

    var aL = new Vox();
    aL.shellBox(-9, 14, -2, -6, 28, 1, "B", 1);
    aL.box(-9, 14, -2, -6, 16, 1, "A");
    aL.box(-10, 20, 3, -7, 22, 4, "K");
    parts.armL = aL.toPart(-8, 27, 0);
    var aR = new Vox();
    aR.shellBox(5, 14, -2, 8, 28, 1, "B", 1);
    aR.box(5, 14, -2, 8, 16, 1, "A");
    aR.box(7, 18, 2, 9, 21, 5, "F");
    parts.armR = aR.toPart(7, 27, 0);

    var lL = new Vox();
    lL.shellBox(-5, 0, -2, -1, 16, 2, "C", 1);
    lL.box(-5, 0, -2, -1, 2, 3, "D");
    parts.legL = lL.toPart(-3, 16, 0);
    var lR = new Vox();
    lR.shellBox(0, 0, -2, 4, 16, 2, "C", 1);
    lR.box(0, 0, -2, 4, 2, 3, "D");
    lR.del(4, 8, 0);
    lR.box(6, 6, -2, 7, 8, 0, "B");
    parts.legR = lR.toPart(2, 16, 0);

    var of = new Vox();
    of.ellip(-9, 22, 8, 2, 2, 2, "F", "A", 0);
    parts.orbFire = of.toPart(-9, 22, 8);
    var oi = new Vox();
    oi.ellip(9, 22, 8, 2, 2, 2, "E", "G", 0);
    parts.orbIce = oi.toPart(9, 22, 8);
    var os = new Vox();
    os.box(-1, 26, 8, 1, 32, 9, "S");
    os.box(-2, 31, 7, 2, 32, 10, "D");
    parts.orbSword = os.toPart(0, 28, 8);

    var sk = new Vox();
    sk.box(-4, 16, -2, 3, 28, 2, "S");
    sk.box(-3, 20, -1, 2, 24, 1, "C");
    sk.box(-2, 30, -3, 1, 36, 3, "S");
    sk.box(-2, 33, 3, -1, 34, 4, "E");
    sk.box(0, 33, 3, 1, 34, 4, "E");
    sk.box(-6, 18, -1, -5, 26, 1, "S");
    sk.box(4, 18, -1, 5, 26, 1, "S");
    parts.coreSkel = sk.toPart(0, 22, 0, { phase: 2 });

    return finish("boss_zonk_avatar", {
      palette: pal,
      emissiveKeys: ["E", "F", "G", "D", "K"],
      anim: "biped",
      parts: parts,
      phase2: { palette: { A: C.ink, B: C.voidP }, hide: ["body"], show: ["coreSkel"] },
      meta: {
        title: "ZONK Avatari",
        spawn: "P4.3 boss-room finale (not in code yet)",
        telegraph: "orbFire/orbIce/orbSword (stolen skills) flare before cast",
        animate: "armL/armR skill poses; orbs orbit; glitch cubes jitter; legs run cycle",
        phase2: "body hides, coreSkel remains; speed-up; palette collapses to ink/void"
      }
    });
  }

  buildArachne();
  buildKraken();
  buildSlime();
  buildGolem();
  buildHerobrine();
  buildSerafim();
  buildVoid();
  buildTemple();
  buildZonk();

  var ids = [
    "boss_arachne", "boss_kraken", "boss_kral_slime", "boss_golem",
    "boss_herobrine", "boss_serafim", "boss_void", "boss_temple", "boss_zonk_avatar"
  ];
  global.BOSS_MODEL_IDS = ids;
  global.BOSS_CATALOG = ids.map(function (id) {
    var d = global.BOSS_VOXEL_DEFS[id];
    return {
      id: id,
      title: d.meta && d.meta.title,
      voxels: d.voxels,
      heightVox: d.heightVox,
      parts: Object.keys(d.parts),
      spawn: d.meta && d.meta.spawn,
      telegraph: d.meta && d.meta.telegraph,
      animate: d.meta && d.meta.animate,
      phase2: d.meta && d.meta.phase2
    };
  });
})(typeof window !== "undefined" ? window : globalThis);
