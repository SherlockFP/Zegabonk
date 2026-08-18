// Player voxel defs. Plain script. Requires voxel.js (registerVoxelModel).
// Coords: Y up, +Z face, X right. 1 voxel = 0.125 world. Pivot = animation joint.
// Ids match CHARACTERS in app.js: scout brawler mage survivor samurai gorilla monk paladin archer.
// Recolor keys (lobby pickers): B/b = appBodyColor, C/c = appCapeColor, A/a = appArmorColor.
// Shade keys b/c/a are 65% brightness + purple of the parent; recompute on swap.
(function () {
  var S = 0.125;

  function R(id, def) {
    def.scale = def.scale == null ? S : def.scale;
    def.anim = def.anim || "biped";
    def.emissiveKeys = def.emissiveKeys || ["E"];
    registerVoxelModel(id, def);
  }

  function b(ch, x0, y0, z0, x1, y1, z1) {
    if (x1 == null) return [ch, x0, y0, z0, x0, y0, z0];
    return [ch, x0, y0, z0, x1, y1, z1];
  }

  function pal(extra) {
    var p = {
      B: "#2299dd", b: "#1a4a80",
      C: "#4444aa", c: "#2a2870",
      A: "#4488cc", a: "#2a5588",
      S: "#f4f2ea", s: "#c2a36b",
      E: "#ffe066", N: "#1a1a22",
      G: "#ffe066", W: "#6b4a2f", w: "#c2a36b",
      M: "#8a8f98", I: "#64d5ff",
      F: "#ff7a29", P: "#9b5cff",
      R: "#ff3f4b", V: "#40e0d0",
      H: "#5da03e", K: "#ffd374",
      D: "#1a1a22"
    };
    if (extra) for (var k in extra) p[k] = extra[k];
    return p;
  }

  // Shared 15-vox biped. kind: lean | mid | bulk
  function human(kind) {
    var wide = kind === "bulk";
    var thin = kind === "lean";
    var x0 = wide ? 1 : (thin ? 3 : 2);
    var x1 = wide ? 7 : (thin ? 5 : 6);
    var hx0 = thin ? 2 : (wide ? 2 : 2);
    var hx1 = thin ? 6 : (wide ? 6 : 6);
    var axL0 = thin ? 1 : 0;
    var axL1 = thin ? 2 : 1;
    var axR0 = thin ? 6 : 7;
    var axR1 = thin ? 7 : 8;
    var lxL0 = thin ? 3 : 2;
    var lxL1 = thin ? 4 : 3;
    var lxR0 = thin ? 4 : 5;
    var lxR1 = thin ? 5 : 6;
    if (thin) { lxL0 = 2; lxL1 = 3; lxR0 = 5; lxR1 = 6; }
    return {
      legL: {
        pivot: [lxL1, 4, 3],
        boxes: [
          b("A", lxL0, 0, 1, lxL1, 1, 3),
          b("B", lxL0, 1, 2, lxL1, 3, 3),
          b("b", lxL0, 1, 2, lxL1, 1, 3)
        ]
      },
      legR: {
        pivot: [lxR0, 4, 3],
        boxes: [
          b("A", lxR0, 0, 1, lxR1, 1, 3),
          b("B", lxR0, 1, 2, lxR1, 3, 3),
          b("b", lxR0, 1, 2, lxR1, 1, 3)
        ]
      },
      body: {
        pivot: [4, 5, 3],
        boxes: [
          b("B", x0, 4, 1, x1, 9, 4),
          b("b", x0, 4, 1, x1, 5, 4),
          b("A", x0 + (thin ? 0 : 1), 7, 4, x1 - (thin ? 0 : 1), 9, 4),
          b("a", 4, 5, 1, 4, 5, 4)
        ]
      },
      armL: {
        pivot: [x0, 9, 3],
        boxes: [
          b("B", axL0, 5, 2, axL1, 9, 3),
          b("S", axL0, 5, 2, axL1, 5, 3),
          b("A", axL0, 8, 2, axL1, 9, 3)
        ]
      },
      armR: {
        pivot: [x1, 9, 3],
        boxes: [
          b("B", axR0, 5, 2, axR1, 9, 3),
          b("S", axR0, 5, 2, axR1, 5, 3),
          b("A", axR0, 8, 2, axR1, 9, 3)
        ]
      },
      head: {
        pivot: [4, 10, 3],
        boxes: [
          b("S", hx0, 10, 1, hx1, 13, 4),
          b("A", hx0, 12, 1, hx1, 14, 4),
          b("s", hx0, 10, 1, hx1, 10, 3),
          b("E", 2, 11, 4, 3, 12, 4),
          b("E", 5, 11, 4, 6, 12, 4),
          b("N", 3, 10, 4, 5, 10, 4)
        ]
      }
    };
  }

  function capeShort() {
    return {
      pivot: [4, 9, 1],
      boxes: [
        b("C", 2, 5, 0, 6, 9, 0),
        b("c", 2, 5, 0, 6, 5, 0),
        b("C", 1, 6, 0, 1, 8, 1),
        b("C", 7, 6, 0, 7, 8, 1)
      ]
    };
  }

  function capeLong() {
    return {
      pivot: [4, 9, 1],
      boxes: [
        b("C", 1, 1, 0, 7, 9, 0),
        b("c", 1, 1, 0, 7, 2, 0),
        b("C", 0, 2, 0, 0, 8, 1),
        b("C", 8, 2, 0, 8, 8, 1)
      ]
    };
  }

  // --- scout : wrap visor ---
  (function () {
    var p = human("lean");
    p.head.boxes.push(
      b("I", 1, 11, 4, 7, 12, 5),
      b("V", 0, 11, 2, 0, 12, 5),
      b("V", 8, 11, 2, 8, 12, 5),
      b("I", 3, 13, 5, 5, 13, 5),
      b("A", 4, 14, 3, 4, 16, 3),
      b("I", 4, 16, 3, 4, 16, 4)
    );
    p.cape = {
      pivot: [4, 9, 1],
      boxes: [
        b("C", 1, 4, 0, 7, 9, 0),
        b("c", 1, 4, 0, 7, 5, 0),
        b("C", 0, 5, 0, 0, 8, 2),
        b("C", 8, 5, 0, 8, 8, 2)
      ]
    };
    R("scout", { palette: pal(), emissiveKeys: ["E", "I"], parts: p });
  })();

  // --- brawler : giant pauldrons + sword ---
  (function () {
    var p = human("bulk");
    p.body.boxes.push(
      b("A", -1, 8, 0, 1, 11, 5),
      b("A", 7, 8, 0, 9, 11, 5),
      b("a", -1, 8, 0, -1, 11, 5),
      b("a", 9, 8, 0, 9, 11, 5),
      b("G", 3, 6, 4, 5, 6, 4)
    );
    p.armL.boxes.push(b("A", 0, 5, 1, 1, 9, 4));
    p.armR.boxes.push(b("A", 7, 5, 1, 8, 9, 4));
    p.head.boxes.push(b("A", 1, 12, 1, 7, 14, 5));
    p.sword = {
      pivot: [8, 9, 3],
      boxes: [
        b("W", 9, 8, 1, 9, 9, 2),
        b("A", 8, 9, 2, 9, 9, 3),
        b("M", 9, 2, 4, 10, 14, 4),
        b("M", 9, 10, 5, 10, 13, 5),
        b("G", 9, 14, 4, 10, 14, 4)
      ]
    };
    R("brawler", { palette: pal(), parts: p });
  })();

  // --- mage : hat + staff + long cape ---
  (function () {
    var p = human("mid");
    p.body.boxes = [
      b("B", 2, 3, 1, 6, 9, 4),
      b("b", 2, 3, 1, 6, 4, 4),
      b("C", 2, 3, 1, 6, 4, 1),
      b("A", 3, 7, 4, 5, 9, 4)
    ];
    p.head.boxes = [
      b("S", 2, 10, 1, 6, 13, 4),
      b("s", 2, 10, 1, 6, 10, 3),
      b("E", 2, 11, 4, 3, 12, 4),
      b("E", 5, 11, 4, 6, 12, 4),
      b("N", 3, 10, 4, 5, 10, 4),
      b("C", 0, 13, 0, 8, 13, 5),
      b("c", 2, 14, 1, 6, 16, 4),
      b("C", 3, 17, 2, 5, 18, 3),
      b("P", 4, 19, 2, 4, 19, 3)
    ];
    p.cape = capeLong();
    p.staff = {
      pivot: [8, 9, 3],
      boxes: [
        b("W", 10, 0, 3, 10, 13, 3),
        b("w", 10, 13, 3, 10, 13, 3),
        b("P", 9, 14, 2, 11, 16, 4),
        b("F", 10, 15, 3, 10, 15, 3)
      ]
    };
    R("mage", { palette: pal(), emissiveKeys: ["E", "P", "F"], parts: p });
  })();

  // --- survivor : backpack + hood ---
  (function () {
    var p = human("mid");
    p.head.boxes = [
      b("S", 2, 10, 1, 6, 13, 4),
      b("C", 1, 11, 0, 7, 14, 4),
      b("c", 1, 11, 0, 7, 12, 0),
      b("C", 4, 14, 1, 4, 16, 3),
      b("C", 3, 15, 1, 5, 15, 2),
      b("E", 2, 11, 4, 3, 12, 4),
      b("E", 5, 11, 4, 6, 12, 4),
      b("N", 3, 10, 4, 5, 10, 4)
    ];
    p.body.boxes.push(
      b("W", 1, 5, -1, 7, 10, 0),
      b("w", 2, 6, -1, 6, 9, -1),
      b("A", 3, 10, -1, 5, 12, 0),
      b("W", -1, 5, 0, -1, 11, 3),
      b("W", 9, 5, 0, 9, 11, 3),
      b("G", -1, 11, 1, -1, 11, 1)
    );
    p.cape = {
      pivot: [4, 9, 1],
      boxes: [
        b("C", 0, 3, 0, 1, 8, 1),
        b("C", 7, 3, 0, 8, 8, 1)
      ]
    };
    R("survivor", { palette: pal(), parts: p });
  })();

  // --- samurai : kabuto crest + katana ---
  (function () {
    var p = human("mid");
    p.head.boxes = [
      b("S", 2, 10, 1, 6, 12, 4),
      b("A", 1, 12, 1, 7, 14, 5),
      b("a", 1, 12, 1, 7, 12, 5),
      b("N", 4, 14, 2, 4, 17, 3),
      b("R", 3, 17, 2, 5, 17, 3),
      b("R", 4, 18, 2, 4, 18, 3),
      b("A", 2, 14, 2, 6, 14, 5),
      b("E", 2, 11, 4, 3, 12, 4),
      b("E", 5, 11, 4, 6, 12, 4),
      b("N", 3, 10, 4, 5, 10, 4)
    ];
    p.body.boxes.push(
      b("R", 2, 6, 1, 6, 6, 4),
      b("A", 2, 7, 4, 6, 9, 4)
    );
    p.sword = {
      pivot: [8, 9, 3],
      boxes: [
        b("W", 9, 8, 1, 9, 9, 2),
        b("A", 8, 9, 2, 9, 9, 4),
        b("M", 9, 3, 4, 10, 15, 4),
        b("M", 9, 9, 5, 10, 13, 5),
        b("G", 9, 15, 4, 10, 15, 4)
      ]
    };
    p.cape = {
      pivot: [4, 9, 1],
      boxes: [
        b("C", 3, 4, 0, 5, 8, 0)
      ]
    };
    R("samurai", { palette: pal(), parts: p });
  })();

  // --- gorilla : barrel + knuckle arms ---
  R("gorilla", {
    palette: pal(),
    parts: {
      legL: {
        pivot: [3, 4, 4],
        boxes: [
          b("A", 2, 0, 2, 4, 1, 5),
          b("B", 2, 1, 2, 4, 3, 5),
          b("b", 2, 1, 2, 4, 1, 5)
        ]
      },
      legR: {
        pivot: [8, 4, 4],
        boxes: [
          b("A", 7, 0, 2, 9, 1, 5),
          b("B", 7, 1, 2, 9, 3, 5),
          b("b", 7, 1, 2, 9, 1, 5)
        ]
      },
      body: {
        pivot: [6, 5, 4],
        boxes: [
          b("B", 2, 3, 1, 9, 10, 6),
          b("b", 2, 3, 1, 9, 4, 6),
          b("A", 3, 7, 6, 8, 9, 6),
          b("s", 4, 5, 6, 7, 6, 6),
          b("B", 0, 7, 1, 11, 11, 6)
        ]
      },
      armL: {
        pivot: [2, 10, 4],
        boxes: [
          b("B", -1, 1, 1, 1, 10, 6),
          b("b", -1, 1, 1, 1, 2, 6),
          b("S", -1, 0, 0, 2, 2, 7),
          b("A", -1, 8, 2, 1, 10, 5)
        ]
      },
      armR: {
        pivot: [9, 10, 4],
        boxes: [
          b("B", 10, 1, 1, 12, 10, 6),
          b("b", 10, 1, 1, 12, 2, 6),
          b("S", 9, 0, 0, 12, 2, 7),
          b("A", 10, 8, 2, 12, 10, 5)
        ]
      },
      head: {
        pivot: [6, 10, 5],
        boxes: [
          b("B", 3, 10, 3, 8, 13, 7),
          b("s", 4, 10, 7, 7, 11, 9),
          b("S", 3, 10, 6, 8, 12, 9),
          b("b", 3, 10, 3, 8, 10, 5),
          b("E", 3, 12, 9, 4, 13, 9),
          b("E", 7, 12, 9, 8, 13, 9),
          b("N", 5, 10, 9, 6, 10, 9),
          b("N", 2, 13, 5, 2, 13, 6),
          b("N", 9, 13, 5, 9, 13, 6)
        ]
      }
    }
  });

  // --- monk : big bald head + beads ---
  (function () {
    var p = human("lean");
    p.head.boxes = [
      b("S", 1, 9, 1, 7, 14, 5),
      b("s", 1, 9, 1, 7, 9, 4),
      b("S", 2, 14, 2, 6, 15, 4),
      b("E", 2, 11, 5, 3, 12, 5),
      b("E", 5, 11, 5, 6, 12, 5),
      b("N", 3, 10, 5, 5, 10, 5)
    ];
    p.body.boxes.push(
      b("G", -1, 7, 2, 0, 11, 4),
      b("G", 8, 7, 2, 9, 11, 4),
      b("G", -1, 6, 3, -1, 6, 3),
      b("G", 9, 6, 3, 9, 6, 3),
      b("G", 3, 9, 1, 5, 9, 1),
      b("G", 4, 8, 5, 4, 8, 5)
    );
    p.armL.boxes.push(b("S", 0, 4, 1, 2, 6, 4));
    p.armR.boxes.push(b("S", 6, 4, 1, 8, 6, 4));
    p.cape = {
      pivot: [4, 9, 1],
      boxes: [
        b("C", 2, 2, 1, 6, 4, 4),
        b("c", 3, 1, 2, 5, 1, 3),
        b("C", 0, 3, 2, 1, 5, 3),
        b("C", 7, 3, 2, 8, 5, 3)
      ]
    };
    R("monk", { palette: pal(), parts: p });
  })();

  // --- paladin : kite shield + chest cross ---
  (function () {
    var p = human("bulk");
    p.body.boxes.push(
      b("A", 2, 6, 4, 6, 9, 5),
      b("G", 4, 6, 5, 4, 9, 5),
      b("G", 3, 8, 5, 5, 8, 5),
      b("A", 0, 8, 1, 1, 10, 4),
      b("A", 7, 8, 1, 8, 10, 4)
    );
    p.head.boxes.push(
      b("A", 1, 12, 1, 7, 14, 5),
      b("G", 4, 14, 2, 4, 17, 3),
      b("G", 3, 16, 2, 5, 16, 3),
      b("I", 3, 12, 5, 5, 12, 5)
    );
    p.cape = capeLong();
    p.shield = {
      pivot: [1, 9, 3],
      boxes: [
        b("A", -2, 2, 1, 0, 11, 5),
        b("a", -2, 2, 1, -2, 11, 5),
        b("A", -1, 1, 2, -1, 1, 4),
        b("G", -2, 6, 2, -2, 9, 4),
        b("G", -2, 7, 1, -2, 8, 5),
        b("M", -2, 5, 1, 0, 5, 5)
      ]
    };
    R("paladin", { palette: pal(), emissiveKeys: ["E", "I"], parts: p });
  })();

  // --- archer : tall bow + quiver ---
  (function () {
    var p = human("lean");
    p.head.boxes = [
      b("S", 2, 10, 1, 6, 13, 4),
      b("C", 2, 12, 0, 6, 14, 4),
      b("c", 2, 12, 0, 6, 13, 0),
      b("E", 2, 11, 4, 3, 12, 4),
      b("E", 5, 11, 4, 6, 12, 4),
      b("N", 3, 10, 4, 5, 10, 4)
    ];
    p.body.boxes.push(
      b("W", 7, 5, 1, 8, 12, 2),
      b("w", 7, 6, 1, 8, 10, 1),
      b("K", 7, 12, 1, 8, 13, 2)
    );
    p.cape = capeShort();
    p.bow = {
      pivot: [2, 9, 3],
      boxes: [
        b("W", -1, 1, 4, 0, 14, 4),
        b("W", -1, 14, 4, 2, 14, 5),
        b("W", -1, 1, 4, 2, 1, 5),
        b("w", -1, 7, 4, 1, 8, 4),
        b("N", 0, 2, 5, 0, 13, 5),
        b("K", -1, 15, 4, -1, 15, 4)
      ]
    };
    R("archer", { palette: pal(), parts: p });
  })();

  var IDS = ["scout", "brawler", "mage", "survivor", "samurai", "gorilla", "monk", "paladin", "archer"];
  if (typeof window !== "undefined") {
    window.PLAYER_MODEL_IDS = IDS;
    window.PLAYER_RECOLOR = {
      appBodyColor: ["B", "b"],
      appCapeColor: ["C", "c"],
      appArmorColor: ["A", "a"]
    };
  }
})();
