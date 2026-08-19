// Classic-map voxel props. Plain script. Requires voxel.js (registerVoxelModel).
// Coords: Y up, +Z face, X right. 1 voxel = 0.125 world.
// Named parts only for chest lid / portal ring.
(function (global) {
  var S = 0.125;

  var PAL = {
    G: "#7ec850", g: "#5da03e",
    D: "#c2a36b",
    S: "#8a8f98", s: "#6e737a", k: "#4e4458",
    W: "#6b4a2f", w: "#3d2a1c",
    R: "#ff4d62",
    A: "#ffe066",
    V: "#9b5cff",
    T: "#40e0d0",
    F: "#ff7a29",
    P: "#3ddc64",
    N: "#1a1a22",
    K: "#f4f2ea",
    E: "#ffe066"
  };

  function R(id, def) {
    def.scale = def.scale == null ? S : def.scale;
    if (!def.anim) def.anim = "static";
    registerVoxelModel(id, def);
  }

  function b(ch, x0, y0, z0, x1, y1, z1) {
    if (x1 == null) return [ch, x0, y0, z0, x0, y0, z0];
    return [ch, x0, y0, z0, x1, y1, z1];
  }

  var IDS = [];
  function add(id, def) {
    R(id, def);
    IDS.push(id);
  }

  // Round crown, thick trunk. Defining read: lollipop blob + one side branch.
  add("tree_oak", {
    palette: { G: PAL.G, g: PAL.g, W: PAL.W, w: PAL.w, D: PAL.D },
    parts: {
      body: {
        pivot: [5, 0, 5],
        boxes: [
          b("W", 4, 0, 4, 5, 9, 5),
          b("w", 3, 0, 4, 6, 1, 6),
          b("W", 7, 7, 4, 9, 8, 5),
          b("G", 8, 8, 3, 10, 10, 6),
          b("G", 2, 8, 2, 6, 11, 6),
          b("g", 3, 12, 3, 5, 12, 5),
          b("G", 0, 9, 3, 1, 11, 5),
          b("G", 3, 9, 0, 5, 10, 1),
          b("G", 3, 9, 7, 5, 10, 8),
          b("g", 1, 8, 4, 1, 8, 5)
        ]
      }
    }
  });

  // Triangle stack, skinny trunk. Defining read: three plus-layers tapering up.
  add("tree_pine", {
    palette: { G: PAL.G, g: PAL.g, W: PAL.W, w: PAL.w },
    parts: {
      body: {
        pivot: [5, 0, 5],
        boxes: [
          b("W", 4, 0, 4, 5, 6, 5),
          b("w", 4, 0, 4, 5, 0, 5),
          b("G", 1, 5, 4, 8, 6, 5),
          b("G", 4, 5, 1, 5, 6, 8),
          b("g", 3, 5, 3, 6, 6, 6),
          b("G", 2, 7, 4, 7, 9, 5),
          b("G", 4, 7, 2, 5, 9, 7),
          b("g", 3, 7, 3, 6, 8, 6),
          b("G", 3, 10, 4, 6, 12, 5),
          b("G", 4, 10, 3, 5, 12, 6),
          b("G", 4, 13, 4, 5, 15, 5),
          b("g", 4, 16, 4, 5, 16, 5)
        ]
      }
    }
  });

  // Small boulder. Darker stone (unwalkable read). Defining: lumpy 1-peak.
  add("rock_s", {
    palette: { S: PAL.s, s: PAL.k, D: PAL.D },
    parts: {
      body: {
        pivot: [2, 0, 2],
        boxes: [
          b("S", 1, 0, 1, 3, 1, 3),
          b("s", 0, 0, 1, 0, 0, 2),
          b("s", 1, 0, 0, 2, 0, 0),
          b("S", 2, 2, 2, 2, 2, 2),
          b("s", 3, 0, 3, 4, 0, 3),
          b("D", 2, 0, 1, 2, 0, 1)
        ]
      }
    }
  });

  // Medium boulder. Two-hump, 20% darker. Defining: wide base + split ridge.
  add("rock_m", {
    palette: { S: PAL.s, s: PAL.k, D: PAL.D },
    parts: {
      body: {
        pivot: [3, 0, 2],
        boxes: [
          b("S", 0, 0, 0, 4, 2, 3),
          b("s", 1, 3, 1, 2, 3, 2),
          b("s", 3, 3, 1, 4, 4, 2),
          b("S", 0, 0, 4, 1, 1, 4),
          b("D", 2, 0, 0, 3, 0, 0)
        ]
      }
    }
  });

  // Closed loot chest. Lid hinge at back (+Z is front).
  add("chest_closed", {
    palette: { W: PAL.W, w: PAL.w, A: PAL.A, N: PAL.N },
    parts: {
      body: {
        pivot: [2, 0, 1],
        boxes: [
          b("W", 0, 0, 0, 4, 2, 2),
          b("w", 0, 0, 0, 4, 0, 2),
          b("A", 0, 1, 0, 4, 1, 2),
          b("A", 2, 2, 2, 2, 2, 2)
        ]
      },
      lid: {
        pivot: [2, 3, 0],
        boxes: [
          b("W", 0, 3, 0, 4, 4, 2),
          b("A", 0, 3, 2, 4, 3, 2),
          b("w", 0, 4, 0, 4, 4, 0)
        ]
      }
    }
  });

  // Open chest: same body, lid swung back around hinge [2,3,0].
  add("chest_open", {
    palette: { W: PAL.W, w: PAL.w, A: PAL.A, N: PAL.N, E: PAL.A },
    emissiveKeys: ["E"],
    parts: {
      body: {
        pivot: [2, 0, 1],
        boxes: [
          b("W", 0, 0, 0, 4, 1, 2),
          b("w", 0, 0, 0, 4, 0, 2),
          b("W", 0, 2, 0, 0, 2, 2),
          b("W", 4, 2, 0, 4, 2, 2),
          b("W", 1, 2, 0, 3, 2, 0),
          b("A", 0, 1, 0, 4, 1, 2),
          b("E", 1, 2, 1, 3, 2, 1)
        ]
      },
      lid: {
        pivot: [2, 3, 0],
        boxes: [
          b("W", 0, 3, -1, 4, 5, 0),
          b("A", 0, 5, -1, 4, 5, 0),
          b("w", 0, 3, -1, 4, 3, -1)
        ]
      }
    }
  });

  // Perk shrine: plinth + planted blade + green orb.
  add("shrine", {
    palette: { S: PAL.S, s: PAL.s, A: PAL.A, R: PAL.R, P: PAL.P, E: PAL.P, w: PAL.w },
    emissiveKeys: ["E"],
    parts: {
      body: {
        pivot: [3, 0, 3],
        boxes: [
          b("S", 1, 0, 1, 5, 0, 5),
          b("A", 1, 0, 1, 1, 0, 1),
          b("A", 5, 0, 1, 5, 0, 1),
          b("A", 1, 0, 5, 1, 0, 5),
          b("A", 5, 0, 5, 5, 0, 5),
          b("s", 2, 1, 2, 4, 1, 4),
          b("w", 3, 2, 3, 3, 3, 3),
          b("A", 2, 4, 3, 4, 4, 3),
          b("R", 3, 5, 3, 3, 7, 3),
          b("R", 3, 6, 2, 3, 7, 2),
          b("E", 2, 8, 2, 4, 9, 4)
        ]
      }
    }
  });

  // Door silhouette. ring = inner cyan frame (spin / pulse later).
  add("portal_frame", {
    palette: { S: PAL.s, k: PAL.k, A: PAL.A, V: PAL.V, E: PAL.T, T: PAL.T },
    emissiveKeys: ["E"],
    parts: {
      body: {
        pivot: [4, 0, 2],
        boxes: [
          b("S", 0, 0, 1, 0, 8, 2),
          b("S", 8, 0, 1, 8, 8, 2),
          b("S", 0, 8, 1, 8, 8, 2),
          b("k", 0, 0, 1, 0, 0, 2),
          b("k", 8, 0, 1, 8, 0, 2),
          b("A", 0, 3, 2, 0, 3, 2),
          b("A", 8, 3, 2, 8, 3, 2),
          b("A", 0, 6, 2, 0, 6, 2),
          b("A", 8, 6, 2, 8, 6, 2),
          b("V", 4, 8, 2, 4, 8, 2)
        ]
      },
      ring: {
        pivot: [4, 5, 3],
        boxes: [
          b("E", 1, 2, 3, 1, 7, 3),
          b("E", 7, 2, 3, 7, 7, 3),
          b("E", 2, 7, 3, 6, 7, 3),
          b("E", 2, 2, 3, 6, 2, 3)
        ]
      }
    }
  });

  // Village lantern: post + warm box. Defining: hanging cube glow.
  add("lamp", {
    palette: { W: PAL.W, w: PAL.w, S: PAL.S, E: PAL.A, F: PAL.F },
    emissiveKeys: ["E"],
    parts: {
      body: {
        pivot: [1, 0, 1],
        boxes: [
          b("S", 0, 0, 0, 2, 0, 2),
          b("w", 1, 1, 1, 1, 8, 1),
          b("W", 1, 8, 1, 3, 8, 1),
          b("w", 3, 6, 0, 4, 8, 2),
          b("E", 3, 6, 1, 4, 7, 1),
          b("F", 3, 8, 1, 4, 8, 1)
        ]
      }
    }
  });

  // Packing crate. Defining: cube + dark frame + gold corner nails.
  add("crate", {
    palette: { W: PAL.W, w: PAL.w, A: PAL.A, N: PAL.N },
    parts: {
      body: {
        pivot: [2, 0, 2],
        boxes: [
          b("W", 0, 0, 0, 3, 3, 3),
          b("w", 0, 0, 0, 3, 0, 3),
          b("w", 0, 0, 3, 0, 3, 3),
          b("w", 3, 0, 3, 3, 3, 3),
          b("w", 0, 3, 3, 3, 3, 3),
          b("A", 0, 3, 0, 0, 3, 0),
          b("A", 3, 3, 0, 3, 3, 0),
          b("A", 0, 3, 3, 0, 3, 3),
          b("A", 3, 3, 3, 3, 3, 3)
        ]
      }
    }
  });

  // One fence panel (two posts + two rails). Instance along village rings.
  add("fence", {
    palette: { W: PAL.W, w: PAL.w },
    parts: {
      body: {
        pivot: [3, 0, 1],
        boxes: [
          b("W", 0, 0, 1, 0, 4, 1),
          b("W", 6, 0, 1, 6, 4, 1),
          b("w", 0, 1, 1, 6, 1, 1),
          b("w", 0, 3, 1, 6, 3, 1),
          b("W", 0, 5, 1, 0, 5, 1),
          b("W", 6, 5, 1, 6, 5, 1)
        ]
      }
    }
  });

  // Village well: stone ring, water, tiny red roof.
  add("well", {
    palette: { S: PAL.S, s: PAL.s, W: PAL.W, w: PAL.w, R: PAL.R, E: PAL.T, D: PAL.D },
    emissiveKeys: ["E"],
    parts: {
      body: {
        pivot: [3, 0, 2],
        boxes: [
          b("S", 1, 0, 0, 5, 2, 0),
          b("S", 1, 0, 1, 1, 2, 4),
          b("S", 5, 0, 1, 5, 2, 4),
          b("S", 2, 0, 4, 4, 0, 4),
          b("E", 2, 0, 2, 4, 1, 3),
          b("W", 2, 3, 2, 2, 5, 2),
          b("W", 4, 3, 2, 4, 5, 2),
          b("w", 3, 4, 2, 3, 4, 2),
          b("R", 2, 6, 1, 4, 6, 3),
          b("R", 3, 7, 2, 3, 7, 2)
        ]
      }
    }
  });

  // TD pad: gold-edge disc + short stem. Gun mesh sits on top later.
  add("turret_base", {
    palette: { S: PAL.S, s: PAL.s, A: PAL.A, E: PAL.T, k: PAL.k },
    emissiveKeys: ["E"],
    parts: {
      body: {
        pivot: [3, 0, 3],
        boxes: [
          b("S", 1, 0, 1, 5, 0, 5),
          b("A", 2, 0, 0, 4, 0, 0),
          b("A", 2, 0, 6, 4, 0, 6),
          b("A", 0, 0, 2, 0, 0, 4),
          b("A", 6, 0, 2, 6, 0, 4),
          b("s", 2, 1, 2, 4, 2, 4),
          b("A", 2, 3, 2, 4, 3, 4),
          b("E", 3, 3, 3, 3, 3, 3),
          b("k", 3, 1, 3, 3, 1, 3)
        ]
      }
    }
  });

  // Landmark mill: stone base, wood shaft, X blades. One part = 1-2 draws instanced.
  add("landmark_mill", {
    palette: { S: PAL.S, s: PAL.s, W: PAL.W, w: PAL.w, A: PAL.A, k: PAL.k },
    parts: {
      body: {
        pivot: [6, 0, 6],
        boxes: [
          b("S", 2, 0, 2, 10, 3, 10),
          b("s", 3, 3, 3, 9, 4, 9),
          b("W", 5, 4, 5, 7, 22, 7),
          b("w", 4, 22, 4, 8, 24, 8),
          b("A", 5, 14, 5, 7, 16, 7),
          b("W", 0, 14, 6, 12, 16, 6),
          b("W", 6, 8, 0, 6, 22, 12),
          b("k", 0, 15, 5, 0, 15, 7),
          b("k", 12, 15, 5, 12, 15, 7)
        ]
      }
    }
  });

  // Landmark tower: tall stone keep, two emissive windows.
  add("landmark_tower", {
    palette: { S: PAL.S, s: PAL.s, k: PAL.k, E: PAL.A, W: PAL.W },
    emissiveKeys: ["E"],
    parts: {
      body: {
        pivot: [5, 0, 5],
        boxes: [
          b("S", 1, 0, 1, 9, 26, 9),
          b("s", 0, 26, 0, 10, 28, 10),
          b("k", 0, 28, 0, 2, 30, 2),
          b("k", 8, 28, 0, 10, 30, 2),
          b("k", 0, 28, 8, 2, 30, 10),
          b("k", 8, 28, 8, 10, 30, 10),
          b("E", 4, 12, 9, 6, 15, 9),
          b("E", 4, 18, 9, 6, 20, 9),
          b("W", 4, 0, 9, 6, 4, 10)
        ]
      }
    }
  });

  global.PROP_MODEL_IDS = IDS.slice();
})(window);
