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

  function house(x, z, rot, col) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 3.6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.82, flatShading: true }));
    body.position.y = 1.6;
    body.castShadow = true;
    var roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.8, 4), new THREE.MeshStandardMaterial({ color: 0x6a2a22, roughness: 0.7, flatShading: true }));
    roof.position.y = 4.05;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    var door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.12), new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.6 }));
    door.position.set(0, 0.7, 1.85);
    g.add(body, roof, door);
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    return g;
  }

  function npcMesh(col) {
    var g = new THREE.Group();
    var robe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.25, 8), new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, emissive: col, emissiveIntensity: 0.18 }));
    robe.position.y = 0.72;
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.5 }));
    head.position.y = 1.5;
    g.add(robe, head);
    g.scale.setScalar(1.25);
    return g;
  }

  function nameSprite(text) {
    var c = document.createElement("canvas");
    c.width = 256;
    c.height = 48;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(12,18,26,0.82)";
    ctx.fillRect(8, 6, 240, 36);
    ctx.strokeStyle = "rgba(255,231,137,0.55)";
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
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x3a3228, roughness: 0.8 }));
    pole.position.set(x, 1.1, z);
    var cage = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.42), new THREE.MeshStandardMaterial({ color: 0x2a241c, roughness: 0.55, metalness: 0.25 }));
    cage.position.set(x, 2.28, z);
    var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xffaa33, emissiveIntensity: 1.35 }));
    lamp.position.set(x, 2.28, z);
    var light = new THREE.PointLight(0xffaa55, 1.05, 14);
    light.position.set(x, 2.4, z);
    mapGroup.add(pole, cage, lamp, light);
  }

  function buildTownWorld() {
    mapGroup = new THREE.Group();
    scene.add(mapGroup);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x6a8a52, roughness: 0.92 });
    ground = new THREE.Mesh(new THREE.CircleGeometry(34, 48), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    var plaza = new THREE.Mesh(new THREE.CircleGeometry(8.5, 32), new THREE.MeshStandardMaterial({ color: 0x8a7a62, roughness: 0.85 }));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.04;
    mapGroup.add(plaza);
    var pathMat = new THREE.MeshStandardMaterial({ color: 0x9a8a70, roughness: 0.9 });
    for (var s = 0; s < 6; s++) {
      var step = new THREE.Mesh(new THREE.CircleGeometry(1.15, 12), pathMat);
      step.rotation.x = -Math.PI / 2;
      step.position.set(0, 0.05, 9.5 + s * 2.05);
      mapGroup.add(step);
    }
    lantern(6.2, 6.2);
    lantern(-6.2, 6.2);
    lantern(6.2, -6.2);
    lantern(-6.2, -6.2);
    var well = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0x5a6570, roughness: 0.6 }));
    well.position.y = 0.35;
    mapGroup.add(well);
    var cols = [0x8a6a48, 0x7a5a40, 0x6a5040, 0x9a7a58, 0x5a4838, 0x8a6048, 0x704838, 0x6a5848];
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2 + 0.2;
      var hx = Math.cos(a) * 18, hz = Math.sin(a) * 18;
      mapGroup.add(house(hx, hz, a + Math.PI, cols[i]));
      colliders.push({ x: hx, z: hz, r: 2.6 });
    }
    var treeMat = new THREE.MeshStandardMaterial({ color: 0x2f6a32, roughness: 0.8, flatShading: true });
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3218, roughness: 0.9 });
    for (var t = 0; t < 10; t++) {
      var ta = (t / 10) * Math.PI * 2 + 0.5;
      var tx = Math.cos(ta) * 24, tz = Math.sin(ta) * 24;
      var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.4, 6), trunkMat);
      tr.position.set(tx, 0.7, tz);
      var leaf = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 6), treeMat);
      leaf.position.set(tx, 2.4, tz);
      leaf.castShadow = true;
      mapGroup.add(tr, leaf);
      colliders.push({ x: tx, z: tz, r: 0.9 });
    }
    var ring = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.28, 10, 28), new THREE.MeshStandardMaterial({ color: 0x74e4ff, emissive: 0x226688, emissiveIntensity: 0.95 }));
    ring.position.set(0, 3.05, 22);
    ring.rotation.x = Math.PI / 2;
    var postGeo = new THREE.BoxGeometry(0.55, 5.4, 0.55);
    var postMat = new THREE.MeshStandardMaterial({ color: 0x2a3a48, emissive: 0x143048, emissiveIntensity: 0.45 });
    var postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-2.7, 2.7, 22);
    var postR = postL.clone();
    postR.position.x = 2.7;
    var pl = new THREE.PointLight(0x66eeff, 2.1, 22);
    pl.position.set(0, 3.4, 22);
    mapGroup.add(ring, postL, postR, pl);
    townNpcs = [
      { id: "portal", x: 0, z: 22, r: 3.2, label: "E - Buyuk Gecit (kosu)", act: "portal" },
      { id: "smith", x: -12, z: 4, r: 2.6, label: "E - Demirci (onarma / cila)", act: "craft" },
      { id: "stash", x: 12, z: 4, r: 2.6, label: "E - Sandikci (envanter)", act: "stash" },
      { id: "way", x: 0, z: -14, r: 2.8, label: "E - Yol Tasi (Mythic+)", act: "way" }
    ];
    var smith = npcMesh(0x6a2a22); smith.position.set(-12, 0, 4); smith.add(nameSprite("DEMIRCI")); mapGroup.add(smith);
    var stashN = npcMesh(0x2a7a44); stashN.position.set(12, 0, 4); stashN.add(nameSprite("SANDIKCI")); mapGroup.add(stashN);
    var wayN = npcMesh(0x3a3a6a); wayN.position.set(0, 0, -14); wayN.add(nameSprite("YOL TASI")); mapGroup.add(wayN);
    var gateLabel = nameSprite("BUYUK GECIT");
    gateLabel.scale.set(4.4, 0.82, 1);
    gateLabel.position.set(0, 6.05, 22);
    mapGroup.add(gateLabel);
    var anvil = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.55), new THREE.MeshStandardMaterial({ color: 0x555560, metalness: 0.6, roughness: 0.35 }));
    anvil.position.set(-12, 0.4, 5.2);
    mapGroup.add(anvil);
    var chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.6), new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.5 }));
    chest.position.set(12, 0.35, 5.2);
    mapGroup.add(chest);
    var stone = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x5dff88, emissive: 0x145528, emissiveIntensity: 0.55 }));
    stone.position.set(0, 0.8, -14);
    mapGroup.add(stone);
    if (scene.fog) { scene.fog.color.setHex(0xc8dcc8); scene.fog.density = 0.012; }
    if (scene.background && scene.background.isColor) scene.background.setHex(0x8ec4e8);
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
      player.mesh.position.set(0, 0.1, 8);
      if (player.vel) player.vel.set(0, 0, 0);
      player.aimDir.set(0, 0, 1);
      player.mesh.rotation.y = (player.mesh.userData.faceYaw || 0);
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
        townHintEl.textContent = near.label;
        townHintEl.classList.add("visible");
        townHintEl.style.display = "block";
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
