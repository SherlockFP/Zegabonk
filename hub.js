/* Tac Koyu hub + Yol Tasi gear. Globals from app.js. ASCII only. */
(function () {
  var GEAR_SLOTS = ["helm", "chest", "weapon", "boots", "amulet", "ring"];
  var SLOT_TR = { helm: "Migfer", chest: "Zirh", weapon: "Silah", boots: "Bot", amulet: "Muska", ring: "Yuzuk" };
  var AFFIX = [
    { id: "dmg", stat: "damage", label: "Hasar", kind: "mult", min: 0.04, max: 0.12 },
    { id: "hp", stat: "maxHp", label: "Can", kind: "add", min: 8, max: 28 },
    { id: "spd", stat: "moveSpeed", label: "Hiz", kind: "mult", min: 0.03, max: 0.08 },
    { id: "arm", stat: "armor", label: "Zirh", kind: "add", min: 0.03, max: 0.09 },
    { id: "xp", stat: "xpGainMult", label: "XP", kind: "mult", min: 0.06, max: 0.16 },
    { id: "gold", stat: "coinMult", label: "Altin", kind: "mult", min: 0.08, max: 0.22 },
    { id: "size", stat: "aoe", label: "Boy", kind: "add", min: 0.25, max: 0.8 },
    { id: "pick", stat: "pickupRange", label: "Toplama", kind: "mult", min: 0.08, max: 0.2 }
  ];
  var UNIQUES = [
    { id: "u_tac", name: "Kirik Tac", slot: "helm", color: 0xc9a227, affixes: [{ id: "xp", value: 0.18 }, { id: "size", value: 0.7 }] },
    { id: "u_zirh", name: "Yemin Zirhi", slot: "chest", color: 0x6a8aaa, affixes: [{ id: "arm", value: 0.1 }, { id: "hp", value: 32 }] },
    { id: "u_yol", name: "Yol Yuzugu", slot: "ring", color: 0x5dff88, affixes: [{ id: "gold", value: 0.25 }, { id: "spd", value: 0.08 }] }
  ];
  var townNpcs = [];
  var townHintEl = null;
  var _eLatch = false;
  var selectedStash = -1;

  function rng() { return Math.random(); }
  function uid() { return "g" + Date.now().toString(36) + Math.floor(rng() * 1e5).toString(36); }

  function ensureGearProfile() {
    var p = state.profile || (state.profile = createDefaultPlayerProfile());
    if (!p.equipment || typeof p.equipment !== "object") p.equipment = {};
    for (var i = 0; i < GEAR_SLOTS.length; i++) {
      if (p.equipment[GEAR_SLOTS[i]] === undefined) p.equipment[GEAR_SLOTS[i]] = null;
    }
    if (!Array.isArray(p.stash)) p.stash = [];
    if ((p.runsPlayed || 0) === 0 && p.stash.length === 0) p.stash.push(rollItem(1, "magic"));
    if (!p.dust) p.dust = { cila: 2, damga: 1, kaos: 1 };
    if (p.dust.cila == null) p.dust.cila = 0;
    if (p.dust.damga == null) p.dust.damga = 0;
    if (p.dust.kaos == null) p.dust.kaos = 0;
    GEAR_SLOTS.forEach(function (s) { ensureDur(p.equipment[s]); });
    for (var j = 0; j < p.stash.length; j++) ensureDur(p.stash[j]);
    return p;
  }

  function ensureDur(it) {
    if (!it) return it;
    if (it.maxDurability == null) it.maxDurability = 100;
    if (it.durability == null) it.durability = it.maxDurability;
    return it;
  }

  function durMult(it) {
    if (!it) return 1;
    ensureDur(it);
    return 0.35 + 0.65 * Math.max(0, Math.min(1, it.durability / it.maxDurability));
  }

  function durLabel(it) {
    if (!it) return "";
    ensureDur(it);
    return Math.round(it.durability) + "/" + it.maxDurability;
  }

  function affixLabel(a) {
    var def = AFFIX.filter(function (x) { return x.id === a.id; })[0];
    if (!def) return a.id;
    if (def.kind === "mult") return def.label + " +" + Math.round(a.value * 100) + "%";
    if (def.stat === "armor") return def.label + " +" + Math.round(a.value * 100) + "%";
    return def.label + " +" + Math.round(a.value);
  }

  function rollAffix(ilvl) {
    var def = AFFIX[Math.floor(rng() * AFFIX.length)];
    var t = Math.min(1, (ilvl || 1) / 10);
    var v = def.min + (def.max - def.min) * (0.35 + t * 0.65) * (0.75 + rng() * 0.5);
    return { id: def.id, value: v };
  }

  function rarityOf(ilvl, force) {
    if (force) return force;
    var r = rng();
    var k = Math.max(0, state.mythicKey || (state.profile && state.profile.mythicKey) || 0);
    r -= k * 0.03;
    if (r < 0.03) return "unique";
    if (r < 0.16) return "rare";
    if (r < 0.48) return "magic";
    return "normal";
  }

  function rollItem(ilvl, forceRarity) {
    ilvl = Math.max(1, ilvl || 1);
    var rarity = rarityOf(ilvl, forceRarity);
    if (rarity === "unique") {
      var u = UNIQUES[Math.floor(rng() * UNIQUES.length)];
      return { id: uid(), name: u.name, slot: u.slot, rarity: "unique", ilvl: ilvl, color: u.color, affixes: u.affixes.slice(), durability: 100, maxDurability: 100 };
    }
    var slot = GEAR_SLOTS[Math.floor(rng() * GEAR_SLOTS.length)];
    var n = rarity === "rare" ? 3 + (rng() < 0.4 ? 1 : 0) : rarity === "magic" ? 1 + (rng() < 0.5 ? 1 : 0) : 0;
    var aff = [];
    for (var i = 0; i < n; i++) aff.push(rollAffix(ilvl));
    var tint = rarity === "rare" ? 0xffd45a : rarity === "magic" ? 0x6fdfff : 0xc8c0b0;
    return { id: uid(), name: SLOT_TR[slot] + " +" + ilvl, slot: slot, rarity: rarity, ilvl: ilvl, color: tint, affixes: aff, durability: 100, maxDurability: 100 };
  }

  function applyEquippedGear() {
    var p = ensureGearProfile();
    GEAR_SLOTS.forEach(function (slot) {
      var it = p.equipment[slot];
      if (!it || !it.affixes) return;
      var m = durMult(it);
      it.affixes.forEach(function (a) {
        var def = AFFIX.filter(function (x) { return x.id === a.id; })[0];
        if (!def) return;
        if (def.kind === "mult") stats[def.stat] = (stats[def.stat] || 1) * (1 + a.value * m);
        else stats[def.stat] = (stats[def.stat] || 0) + a.value * m;
      });
    });
    if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;
    var gp = 0;
    GEAR_SLOTS.forEach(function (s) { if (p.equipment[s]) gp += 4 + (p.equipment[s].ilvl || 1); });
    p.gearPower = gp;
  }

  function attachGearVisuals(g) {
    var p = state.profile;
    if (!p || !p.equipment) return;
    var helm = p.equipment.helm;
    if (helm) {
      var hat = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: helm.color || 0xc9a227, roughness: 0.45, metalness: 0.35 }));
      hat.position.y = 1.92;
      g.add(hat);
    }
    var chest = p.equipment.chest;
    if (chest && player.parts && player.parts.body && player.parts.body.material) {
      try { player.parts.body.material.color.setHex(chest.color || 0x6a8aaa); } catch (e) {}
    }
    var weap = p.equipment.weapon;
    if (weap) {
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.12), new THREE.MeshStandardMaterial({ color: weap.color || 0xd8d0c0, metalness: 0.5, roughness: 0.35 }));
      blade.position.set(0.42, 1.05, 0.12);
      blade.rotation.z = -0.4;
      g.add(blade);
    }
    var boots = p.equipment.boots;
    if (boots) {
      var b1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.28), new THREE.MeshStandardMaterial({ color: boots.color || 0x5a4030, roughness: 0.7 }));
      b1.position.set(-0.12, 0.12, 0.06);
      var b2 = b1.clone();
      b2.position.x = 0.12;
      g.add(b1, b2);
    }
  }

  function tryDropGear(pos, source) {
    if (state.inTown) return;
    var key = state.mythicKey || 0;
    var chance = source === "boss" ? 0.55 : source === "elite" ? 0.22 : source === "chest" ? 0.18 : 0.06;
    chance *= 1 + key * 0.08;
    if (rng() > chance) return;
    var item = rollItem(Math.max(1, key || (state.chapter || 1)), source === "boss" ? (rng() < 0.2 ? "unique" : "rare") : null);
    var p = ensureGearProfile();
    if (p.stash.length >= 40) p.stash.shift();
    p.stash.push(item);
    if (rng() < 0.5) p.dust.cila = (p.dust.cila || 0) + 1;
    if (item.rarity === "rare" || item.rarity === "unique") p.dust.damga = (p.dust.damga || 0) + 1;
    if (item.rarity === "unique") p.dust.kaos = (p.dust.kaos || 0) + 1;
    savePlayerProfile();
    if (typeof spawnDamageText === "function") spawnDamageText(pos, item.name, true, item.rarity.toUpperCase());
    if (typeof showGameNotification === "function") showGameNotification("ESYA: " + item.name);
  }

  function rarityClass(r) { return "gear-" + (r || "normal"); }

  function renderGearPanel() {
    var p = ensureGearProfile();
    var eq = document.getElementById("gearEquip");
    var st = document.getElementById("gearStash");
    var dust = document.getElementById("gearDust");
    if (dust) dust.textContent = "Cila " + (p.dust.cila || 0) + " · Damga " + (p.dust.damga || 0) + " · Kaos " + (p.dust.kaos || 0) + " · Gumus " + (p.accountSilver || 0);
    if (eq) {
      eq.innerHTML = GEAR_SLOTS.map(function (slot) {
        var it = p.equipment[slot];
        var broken = it && durMult(it) < 0.55 ? " gear-broken" : "";
        var body = it
          ? ("<strong>" + it.name + "</strong><small>" + (it.affixes || []).map(affixLabel).join(" · ") + " · " + durLabel(it) + "</small>")
          : "<em>bos</em>";
        return "<button type=\"button\" class=\"gearSlot " + rarityClass(it && it.rarity) + broken + "\" data-unequip=\"" + slot + "\"><span>" + SLOT_TR[slot] + "</span>" + body + "</button>";
      }).join("");
    }
    if (st) {
      st.innerHTML = p.stash.map(function (it, i) {
        var broken = durMult(it) < 0.55 ? " gear-broken" : "";
        return "<button type=\"button\" class=\"gearItem " + rarityClass(it.rarity) + broken + (i === selectedStash ? " on" : "") + "\" data-stash=\"" + i + "\"><strong>" + it.name + "</strong><small>" + SLOT_TR[it.slot] + " · " + (it.affixes || []).map(affixLabel).join(" · ") + " · " + durLabel(it) + "</small></button>";
      }).join("") || "<p class=\"gearEmpty\">Sandik bos. Kosuda elit ve sandiklardan dusur.</p>";
    }
  }

  function openGearPanel() {
    ensureGearProfile();
    selectedStash = -1;
    var el = document.getElementById("gearPanel");
    if (el) el.classList.remove("hidden");
    renderGearPanel();
    if (state.inTown) paused = true;
  }
  function closeGearPanel() {
    var el = document.getElementById("gearPanel");
    if (el) el.classList.add("hidden");
    var cr = document.getElementById("craftPanel");
    if (cr) cr.classList.add("hidden");
    var ws = document.getElementById("waystonePanel");
    if (ws) ws.classList.add("hidden");
    if (state.inTown && document.getElementById("lobbyScreen").classList.contains("hidden")) paused = false;
  }

  function equipStash(i) {
    var p = ensureGearProfile();
    var it = p.stash[i];
    if (!it) return;
    var old = p.equipment[it.slot];
    p.equipment[it.slot] = it;
    p.stash.splice(i, 1);
    if (old) p.stash.push(old);
    savePlayerProfile();
    if (typeof refreshRunCosmetics === "function") refreshRunCosmetics();
    renderGearPanel();
  }
  function unequipSlot(slot) {
    var p = ensureGearProfile();
    var it = p.equipment[slot];
    if (!it) return;
    p.equipment[slot] = null;
    p.stash.push(it);
    savePlayerProfile();
    if (typeof refreshRunCosmetics === "function") refreshRunCosmetics();
    renderGearPanel();
  }

  function craftSelected(kind) {
    var p = ensureGearProfile();
    var it = p.stash[selectedStash];
    if (!it) { if (typeof showGameNotification === "function") showGameNotification("Once sandiktan bir esya sec"); return; }
    if (kind === "cila") {
      if ((p.dust.cila || 0) < 1 || (p.accountSilver || 0) < 40) return;
      if (it.rarity !== "normal") return;
      p.dust.cila -= 1; p.accountSilver -= 40;
      it.rarity = "magic"; it.affixes = [rollAffix(it.ilvl)]; it.color = 0x6fdfff;
    } else if (kind === "damga") {
      if ((p.dust.damga || 0) < 1 || (p.accountSilver || 0) < 90) return;
      if (it.rarity !== "magic") return;
      p.dust.damga -= 1; p.accountSilver -= 90;
      it.rarity = "rare"; it.affixes.push(rollAffix(it.ilvl)); it.affixes.push(rollAffix(it.ilvl)); it.color = 0xffd45a;
    } else if (kind === "kaos") {
      if ((p.dust.kaos || 0) < 1 || (p.accountSilver || 0) < 70) return;
      if (!it.affixes || !it.affixes.length) return;
      p.dust.kaos -= 1; p.accountSilver -= 70;
      var n = it.affixes.length;
      it.affixes = [];
      for (var i = 0; i < n; i++) it.affixes.push(rollAffix(it.ilvl));
    }
    savePlayerProfile();
    renderGearPanel();
    if (typeof playSfx === "function") playSfx(480, 0.12, 0.55);
  }

  function repairSelected() {
    var p = ensureGearProfile();
    var targets = [];
    if (selectedStash >= 0 && p.stash[selectedStash]) targets.push(p.stash[selectedStash]);
    else {
      GEAR_SLOTS.forEach(function (s) { if (p.equipment[s]) targets.push(p.equipment[s]); });
    }
    targets = targets.filter(function (it) {
      ensureDur(it);
      return it.durability < it.maxDurability;
    });
    if (!targets.length) {
      if (typeof showGameNotification === "function") showGameNotification("Tamir edilecek parca yok");
      return;
    }
    var cost = 15 * targets.length;
    if ((p.accountSilver || 0) < cost) {
      if (typeof showGameNotification === "function") showGameNotification("Gumus yetmez (" + cost + ")");
      return;
    }
    p.accountSilver -= cost;
    targets.forEach(function (it) { it.durability = it.maxDurability; });
    savePlayerProfile();
    renderGearPanel();
    if (typeof playSfx === "function") playSfx(220, 0.1, 0.5);
    if (typeof showGameNotification === "function") showGameNotification("Tamir edildi");
  }

  function tickGearWear(dmg) {
    if (state.inTown || !(dmg > 0)) return;
    var p = state.profile;
    if (!p || !p.equipment) return;
    var slots = ["helm", "chest", "boots"];
    var dirty = false;
    for (var i = 0; i < slots.length; i++) {
      var it = p.equipment[slots[i]];
      if (!it) continue;
      ensureDur(it);
      it.durability = Math.max(0, it.durability - Math.min(4, dmg * 0.035));
      dirty = true;
    }
    p._wearAcc = (p._wearAcc || 0) + 1;
    if (dirty && p._wearAcc >= 6) {
      p._wearAcc = 0;
      savePlayerProfile();
    }
  }

  function openCraftPanel() {
    openGearPanel();
    var cr = document.getElementById("craftPanel");
    if (cr) cr.classList.remove("hidden");
  }

  function mythicTimeLimit(k) {
    return Math.max(360, 600 - Math.max(0, (k || 2) - 2) * 30);
  }

  function renderWaystone() {
    var p = ensureGearProfile();
    var host = document.getElementById("waystoneKeys");
    if (!host) return;
    var max = Math.max(2, p.mythicKey || p.maxRiftDepth || 2);
    var html = "";
    for (var k = 2; k <= 10; k++) {
      var lock = k > max + 1 && k > 2;
      var sec = mythicTimeLimit(k);
      html += "<button type=\"button\" class=\"waystoneKey" + (lock ? " locked" : "") + "\" data-yol=\"" + k + "\" " + (lock ? "disabled" : "") + ">+" + k + "<small>" + Math.floor(sec / 60) + " dk · x" + (typeof mythicScoreMult === "function" ? mythicScoreMult(k).toFixed(2) : "1") + "</small></button>";
    }
    host.innerHTML = html;
  }

  function openWaystone() {
    var p = state.profile || {};
    if (!p.storyCompleted) {
      if (typeof showGameNotification === "function") showGameNotification("Yol Tasi kilitli. Uc bolgeyi bitir, Ender'i dusur.");
      return;
    }
    renderWaystone();
    var el = document.getElementById("waystonePanel");
    if (el) el.classList.remove("hidden");
    paused = true;
  }

  function startYolTasi(k) {
    closeGearPanel();
    state.requestedStartMode = "rift";
    state.requestedMythicKey = k;
    state.inTown = false;
    startRun(1, "classic");
  }

  var _texCache = {};
  function canvasTex(id, size, draw, repeat) {
    if (_texCache[id]) return _texCache[id];
    var c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d"), size);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat || 1, repeat || 1);
    t.needsUpdate = true;
    _texCache[id] = t;
    return t;
  }
  function grassTex() {
    return canvasTex("grass", 128, function (ctx, s) {
      ctx.fillStyle = "#4f7a3a";
      ctx.fillRect(0, 0, s, s);
      var i;
      for (i = 0; i < 48; i++) {
        ctx.fillStyle = i % 2 ? "#3d6a2e" : "#5c8a44";
        ctx.beginPath();
        ctx.ellipse(Math.random() * s, Math.random() * s, 6 + Math.random() * 10, 4 + Math.random() * 8, Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
    }, 8);
  }
  function cobbleTex() {
    return canvasTex("cobble", 128, function (ctx, s) {
      ctx.fillStyle = "#6e6458";
      ctx.fillRect(0, 0, s, s);
      var x, y;
      for (y = 0; y < s; y += 16) {
        for (x = 0; x < s; x += 18) {
          var ox = (Math.floor(y / 16) % 2) * 8;
          ctx.fillStyle = "rgb(" + (110 + Math.random() * 40) + "," + (100 + Math.random() * 28) + "," + (88 + Math.random() * 20) + ")";
          ctx.fillRect(x + ox + 1, y + 1, 15, 13);
          ctx.strokeStyle = "rgba(40,32,24,0.45)";
          ctx.strokeRect(x + ox + 1, y + 1, 15, 13);
        }
      }
    }, 6);
  }
  function woodTex() {
    return canvasTex("wood", 64, function (ctx, s) {
      var i;
      for (i = 0; i < s; i++) {
        ctx.fillStyle = i % 7 === 0 ? "#3a2818" : (i % 2 ? "#6a4a2c" : "#5a3e24");
        ctx.fillRect(i, 0, 1, s);
      }
    }, 2);
  }

  function house(x, z, rot, col) {
    var g = new THREE.Group();
    var plaster = new THREE.MeshStandardMaterial({ color: col, roughness: 0.88, flatShading: true });
    var timber = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.82, color: 0x8a6a48 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.3, 3.8), plaster);
    body.position.y = 1.65;
    body.castShadow = true;
    body.receiveShadow = true;
    var beam = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.18, 0.18), timber);
    beam.position.set(0, 2.4, 1.92);
    var roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2.05, 4), new THREE.MeshStandardMaterial({ color: 0x7a2a1c, roughness: 0.72, flatShading: true }));
    roof.position.y = 4.25;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    var chimney = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.4, 0.55), new THREE.MeshStandardMaterial({ color: 0x5a5048, roughness: 0.7, flatShading: true }));
    chimney.position.set(1.2, 4.6, -0.4);
    var door = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.55, 0.14), timber);
    door.position.set(0, 0.78, 1.95);
    var paneMat = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffaa44, emissiveIntensity: 0.85, roughness: 0.35 });
    var w1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.08), paneMat);
    w1.position.set(-1.15, 2.05, 1.94);
    var w2 = w1.clone();
    w2.position.x = 1.15;
    var stoop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.7), new THREE.MeshStandardMaterial({ color: 0x6a6460, roughness: 0.8 }));
    stoop.position.set(0, 0.12, 2.25);
    g.add(body, beam, roof, chimney, door, w1, w2, stoop);
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    return g;
  }

  function npcMesh(col) {
    var g = new THREE.Group();
    var cloth = new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, emissive: col, emissiveIntensity: 0.12, flatShading: true });
    var skin = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.55, flatShading: true });
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.85, 0.42), cloth);
    torso.position.y = 1.05;
    var hips = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.38, 0.38), cloth);
    hips.position.y = 0.55;
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), skin);
    head.position.y = 1.68;
    var hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x2a1a10, flatShading: true }));
    hair.position.y = 1.8;
    var armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), cloth);
    armL.position.set(-0.42, 1.0, 0);
    var armR = armL.clone();
    armR.position.x = 0.42;
    var legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.22), new THREE.MeshStandardMaterial({ color: 0x2a2430, flatShading: true }));
    legL.position.set(-0.16, 0.28, 0);
    var legR = legL.clone();
    legR.position.x = 0.16;
    g.add(torso, hips, head, hair, armL, armR, legL, legR);
    g.scale.setScalar(1.2);
    g.traverse(function (c) { if (c.isMesh) c.castShadow = true; });
    return g;
  }

  function nameSprite(text) {
    var c = document.createElement("canvas");
    c.width = 256;
    c.height = 48;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(28,18,10,0.92)";
    ctx.fillRect(8, 6, 240, 36);
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 6, 240, 36);
    ctx.fillStyle = "#ffe789";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 24);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    spr.scale.set(3.4, 0.64, 1);
    spr.position.y = 2.35;
    return spr;
  }

  function lantern(x, z) {
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.15, 6), new THREE.MeshStandardMaterial({ color: 0x2a241c, metalness: 0.35, roughness: 0.55, flatShading: true }));
    pole.position.set(x, 1.08, z);
    pole.castShadow = true;
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.55), pole.material);
    arm.position.set(x, 2.18, z);
    var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xffaa33, emissiveIntensity: 1.6 }));
    lamp.position.set(x, 2.22, z);
    var light = new THREE.PointLight(0xffb060, 1.35, 16);
    light.position.set(x, 2.35, z);
    mapGroup.add(pole, arm, lamp, light);
  }

  function buildTownWorld() {
    mapGroup = new THREE.Group();
    scene.add(mapGroup);
    if (renderer && renderer.shadowMap) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
    }
    var hemi = new THREE.HemisphereLight(0xffe8c4, 0x3a4a28, 0.55);
    var sun = new THREE.DirectionalLight(0xffe0b0, 1.85);
    sun.position.set(-16, 26, 10);
    sun.castShadow = true;
    sun.shadow.bias = -0.001;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 90;
    sun.shadow.camera.left = -38;
    sun.shadow.camera.right = 38;
    sun.shadow.camera.top = 38;
    sun.shadow.camera.bottom = -38;
    mapGroup.add(hemi, sun);
    var groundMat = new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 0.94, color: 0xc8d8a8 });
    ground = new THREE.Mesh(new THREE.CircleGeometry(34, 48), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    var plaza = new THREE.Mesh(new THREE.CircleGeometry(9.2, 40), new THREE.MeshStandardMaterial({ map: cobbleTex(), roughness: 0.86, color: 0xddd0c0 }));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.045;
    plaza.receiveShadow = true;
    mapGroup.add(plaza);
    var curb = new THREE.Mesh(new THREE.TorusGeometry(9.35, 0.12, 6, 40), new THREE.MeshStandardMaterial({ color: 0x5a5248, roughness: 0.8, flatShading: true }));
    curb.rotation.x = Math.PI / 2;
    curb.position.y = 0.08;
    mapGroup.add(curb);
    var pathMat = new THREE.MeshStandardMaterial({ map: cobbleTex(), roughness: 0.88, color: 0xd4c8b0 });
    for (var s = 0; s < 7; s++) {
      var step = new THREE.Mesh(new THREE.CircleGeometry(1.25, 14), pathMat);
      step.rotation.x = -Math.PI / 2;
      step.position.set(0, 0.05, 9.2 + s * 1.85);
      step.receiveShadow = true;
      mapGroup.add(step);
    }
    lantern(6.4, 6.4);
    lantern(-6.4, 6.4);
    lantern(6.4, -6.4);
    lantern(-6.4, -6.4);
    var well = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.85, 14), new THREE.MeshStandardMaterial({ color: 0x6a7278, roughness: 0.55, flatShading: true }));
    well.position.y = 0.42;
    well.castShadow = true;
    var wellWater = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), new THREE.MeshStandardMaterial({ color: 0x3a6a88, roughness: 0.2, metalness: 0.3, emissive: 0x123040, emissiveIntensity: 0.25 }));
    wellWater.rotation.x = -Math.PI / 2;
    wellWater.position.y = 0.78;
    mapGroup.add(well, wellWater);
    var cols = [0xc4a882, 0xb89670, 0x9a7a58, 0xd0b090, 0xa88868, 0x8a6a48, 0xb89078, 0x9a8068];
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2 + 0.2;
      var hx = Math.cos(a) * 18, hz = Math.sin(a) * 18;
      mapGroup.add(house(hx, hz, a + Math.PI, cols[i]));
      colliders.push({ x: hx, z: hz, r: 2.7 });
    }
    var treeMat = new THREE.MeshStandardMaterial({ color: 0x2f6a32, roughness: 0.78, flatShading: true });
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3218, roughness: 0.9, flatShading: true });
    for (var t = 0; t < 12; t++) {
      var ta = (t / 12) * Math.PI * 2 + 0.4;
      var tx = Math.cos(ta) * 25.5, tz = Math.sin(ta) * 25.5;
      var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.5, 6), trunkMat);
      tr.position.set(tx, 0.75, tz);
      tr.castShadow = true;
      var leaf = new THREE.Mesh(new THREE.ConeGeometry(1.25, 2.2, 6), treeMat);
      leaf.position.set(tx, 2.35, tz);
      leaf.castShadow = true;
      var leaf2 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.5, 6), treeMat);
      leaf2.position.set(tx, 3.35, tz);
      mapGroup.add(tr, leaf, leaf2);
      colliders.push({ x: tx, z: tz, r: 0.95 });
    }
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: 0.62, flatShading: true });
    var postL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 5.6, 0.85), stoneMat);
    postL.position.set(-2.85, 2.8, 22);
    postL.castShadow = true;
    var postR = postL.clone();
    postR.position.x = 2.85;
    var capL = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 1.15), stoneMat);
    capL.position.set(-2.85, 5.7, 22);
    var capR = capL.clone();
    capR.position.x = 2.85;
    var lintel = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.55, 1.0), stoneMat);
    lintel.position.set(0, 5.55, 22);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.22, 10, 24), new THREE.MeshStandardMaterial({ color: 0x74e4ff, emissive: 0x2288aa, emissiveIntensity: 1.1 }));
    ring.position.set(0, 3.15, 22);
    ring.rotation.x = Math.PI / 2;
    var veil = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.6), new THREE.MeshBasicMaterial({ color: 0x66e8ff, transparent: true, opacity: 0.42, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    veil.position.set(0, 3.1, 22);
    var pl = new THREE.PointLight(0x66eeff, 2.4, 24);
    pl.position.set(0, 3.5, 22);
    mapGroup.add(postL, postR, capL, capR, lintel, ring, veil, pl);
    townNpcs = [
      { id: "portal", x: 0, z: 22, r: 3.2, label: "E - Buyuk Gecit (kosu)", act: "portal", icon: "assets/icons/icon-portal.png" },
      { id: "smith", x: -12, z: 4, r: 2.6, label: "E - Demirci (onarma / cila)", act: "craft", icon: "assets/icons/icon-smith.png" },
      { id: "stash", x: 12, z: 4, r: 2.6, label: "E - Sandikci (envanter)", act: "stash", icon: "assets/icons/icon-chest.png" },
      { id: "way", x: 0, z: -14, r: 2.8, label: "E - Yol Tasi (Mythic+)", act: "way", icon: "assets/icons/icon-waystone.png" }
    ];
    var smith = npcMesh(0x8a2a22); smith.position.set(-12, 0, 4); smith.add(nameSprite("DEMIRCI")); mapGroup.add(smith);
    var stashN = npcMesh(0x2a7a44); stashN.position.set(12, 0, 4); stashN.add(nameSprite("SANDIKCI")); mapGroup.add(stashN);
    var wayN = npcMesh(0x3a3a6a); wayN.position.set(0, 0, -14); wayN.add(nameSprite("YOL TASI")); mapGroup.add(wayN);
    var gateLabel = nameSprite("BUYUK GECIT");
    gateLabel.scale.set(4.6, 0.86, 1);
    gateLabel.position.set(0, 6.35, 22);
    mapGroup.add(gateLabel);
    var anvil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.62), new THREE.MeshStandardMaterial({ color: 0x4a4a55, metalness: 0.7, roughness: 0.32, flatShading: true }));
    anvil.position.set(-12, 0.42, 5.25);
    anvil.castShadow = true;
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.7, 8), new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.75, color: 0x8a6238 }));
    barrel.position.set(-10.6, 0.35, 4.6);
    mapGroup.add(anvil, barrel);
    var chest = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.62, 0.7), new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.45, metalness: 0.25, flatShading: true }));
    chest.position.set(12, 0.38, 5.25);
    chest.castShadow = true;
    mapGroup.add(chest);
    var stone = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.0, 1.85, 6), new THREE.MeshStandardMaterial({ color: 0x5dff88, emissive: 0x145528, emissiveIntensity: 0.7, flatShading: true }));
    stone.position.set(0, 0.92, -14);
    stone.castShadow = true;
    mapGroup.add(stone);
    if (scene.fog) { scene.fog.color.setHex(0xb8c8b0); scene.fog.density = 0.016; }
    else scene.fog = new THREE.FogExp2(0xb8c8b0, 0.016);
    if (scene.background && scene.background.isColor) scene.background.setHex(0x7aa0c4);
    else if (!scene.background || scene.background.isTexture) scene.background = new THREE.Color(0x7aa0c4);
  }

  function enterTownHub() {
    ensureGearProfile();
    stopBgMusic();
    if (typeof stopMenuMusic === "function") stopMenuMusic();
    state.inTown = true;
    state.currentMapId = "town";
    state.selectedMapId = "town";
    running = true;
    gameOver = false;
    paused = false;
    leveling = false;
    startScreen.classList.add("hidden");
    if (document.body) document.body.classList.add("in-town");
    var lobby = document.getElementById("lobbyScreen");
    if (lobby) lobby.classList.add("hidden");
    if (hud) hud.classList.add("hidden");
    if (canvas) canvas.style.display = "";
    closeGearPanel();
    clearWorld();
    colliders.length = 0;
    buildTownWorld();
    if (!player.mesh && typeof buildPlayer === "function") buildPlayer();
    if (!player.mesh) { setTimeout(enterTownHub, 280); return; }
    if (player.mesh) {
      if (scene && player.mesh.parent !== scene) scene.add(player.mesh);
      player.mesh.position.set(0, 0.1, 2);
      if (player.vel) player.vel.set(0, 0, 0);
      player.aimDir.set(0, 0, 1);
      player.mesh.rotation.y = (player.mesh.userData.faceYaw || 0);
      camYaw = 0;
      camPitch = -0.28;
    }
    if (typeof applyEquippedGear === "function") { /* stats not needed in town */ }
    if (typeof refreshRunCosmetics === "function") refreshRunCosmetics();
    if (player.mixer && player.actions && player.actions.Idle) {
      try {
        player.actions.Idle.reset().fadeIn(0.12).play();
        player.activeAction = player.actions.Idle;
      } catch (e) {}
    }
    if (typeof snapChaseCamera === "function") snapChaseCamera();
    townHintEl = document.getElementById("townHint");
    if (typeof showGameNotification === "function") showGameNotification("TAC KOYU - portal, demirci, sandik, yol tasi");
  }

  function exitTownToMenu() {
    state.inTown = false;
    running = false;
    paused = false;
    if (document.body) document.body.classList.remove("in-town");
    closeGearPanel();
    if (canvas) canvas.style.display = "none";
    startScreen.classList.remove("hidden");
    if (hud) hud.classList.add("hidden");
    if (typeof startMenuMusic === "function") startMenuMusic();
  }

  function updateTownHub() {
    if (!state.inTown || !player.mesh) return;
    var px = player.mesh.position.x, pz = player.mesh.position.z;
    var rad = Math.hypot(px, pz);
    if (rad > 31) {
      player.mesh.position.x *= 31 / rad;
      player.mesh.position.z *= 31 / rad;
    }
    player.mesh.position.y = 0.1;
    var near = null;
    for (var i = 0; i < townNpcs.length; i++) {
      var n = townNpcs[i];
      if (Math.hypot(px - n.x, pz - n.z) < n.r) { near = n; break; }
    }
    if (townHintEl) {
      if (near && !paused) {
        townHintEl.innerHTML = near.icon
          ? '<img class="townHintIcon" alt="" src="' + near.icon + '"><span>' + near.label + "</span>"
          : near.label;
        townHintEl.classList.add("visible");
        townHintEl.style.display = "flex";
      } else {
        townHintEl.classList.remove("visible");
        townHintEl.style.display = "none";
      }
    }
    var eDown = keys && keys.e;
    if (eDown && !_eLatch && near && !paused) {
      _eLatch = true;
      if (near.act === "portal") {
        paused = true;
        openLobby();
      } else if (near.act === "stash") openGearPanel();
      else if (near.act === "craft") openCraftPanel();
      else if (near.act === "way") openWaystone();
    }
    if (!eDown) _eLatch = false;
  }

  document.addEventListener("keydown", function (e) {
    if (e.code === "KeyI" && (state.inTown || running) && !leveling) {
      var panel = document.getElementById("gearPanel");
      if (panel && !panel.classList.contains("hidden")) closeGearPanel();
      else openGearPanel();
    }
    if (e.code === "Escape" && state.inTown) {
      var gp = document.getElementById("gearPanel");
      var ws = document.getElementById("waystonePanel");
      var lb = document.getElementById("lobbyScreen");
      if (gp && !gp.classList.contains("hidden")) { closeGearPanel(); e.stopPropagation(); }
      else if (ws && !ws.classList.contains("hidden")) { closeGearPanel(); e.stopPropagation(); }
      else if (lb && !lb.classList.contains("hidden")) { lb.classList.add("hidden"); paused = false; e.stopPropagation(); }
    }
  });

  document.addEventListener("click", function (ev) {
    var un = ev.target.closest && ev.target.closest("[data-unequip]");
    if (un) { unequipSlot(un.getAttribute("data-unequip")); return; }
    var st = ev.target.closest && ev.target.closest("[data-stash]");
    if (st) {
      selectedStash = parseInt(st.getAttribute("data-stash"), 10);
      if (ev.detail === 2) equipStash(selectedStash);
      else renderGearPanel();
      return;
    }
    var yol = ev.target.closest && ev.target.closest("[data-yol]");
    if (yol && !yol.disabled) startYolTasi(parseInt(yol.getAttribute("data-yol"), 10));
    if (ev.target.id === "gearEquipBtn" && selectedStash >= 0) equipStash(selectedStash);
    if (ev.target.id === "craftCilaBtn") craftSelected("cila");
    if (ev.target.id === "craftDamgaBtn") craftSelected("damga");
    if (ev.target.id === "craftKaosBtn") craftSelected("kaos");
    if (ev.target.id === "craftTamirBtn") repairSelected();
    if (ev.target.id === "gearCloseBtn" || ev.target.id === "waystoneCloseBtn") closeGearPanel();
  });

  window.enterTownHub = enterTownHub;
  window.exitTownToMenu = exitTownToMenu;
  window.updateTownHub = updateTownHub;
  window.applyEquippedGear = applyEquippedGear;
  window.tryDropGear = tryDropGear;
  window.attachGearVisuals = attachGearVisuals;
  window.ensureGearProfile = ensureGearProfile;
  window.openGearPanel = openGearPanel;
  window.closeGearPanel = closeGearPanel;
  window.openCraftPanel = openCraftPanel;
  window.mythicTimeLimit = mythicTimeLimit;
  window.tickGearWear = tickGearWear;
  window.repairSelected = repairSelected;
})();
