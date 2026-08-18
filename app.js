(function() {
  var el = document.getElementById("epilepsyNotice");
  if (el) {
    setTimeout(function() {
      el.style.opacity = "0";
      setTimeout(function() { el.style.display = "none"; }, 400);
    }, 5200);
  }
})();
const canvas = document.getElementById("game");
const startScreen = document.getElementById("startScreen");
const levelupPanel = document.getElementById("levelup");
const gameOverPanel = document.getElementById("gameOver");
const hud = document.getElementById("hud");
const skillsHud = document.getElementById("skillsHud");
const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");

const levelChip = document.getElementById("levelChip");
const killChip = document.getElementById("killChip");
const timeChip = document.getElementById("timeChip");
const stageChip = document.getElementById("stageChip");
const hpFill = document.getElementById("hpFill");
const xpFill = document.getElementById("xpFill");
const xpText = document.getElementById("xpText");
const statsText = document.getElementById("statsText");
const levelInfo = document.getElementById("levelInfo");
const cardRow = document.getElementById("cardRow");
const gameOverText = document.getElementById("gameOverText");
const minimap = document.getElementById("minimap");
const minimapCtx = minimap ? minimap.getContext("2d") : null;
const activeSkillsEl = document.getElementById("activeSkills");
const passiveSkillsEl = document.getElementById("passiveSkills");
const skillBarEl = document.getElementById("skillBar");
const cdEFill = document.getElementById("cdE");
const cdRFill = document.getElementById("cdR");
const cdTFill = document.getElementById("cdT");
const cdXFill = document.getElementById("cdX");
const cdEText = document.getElementById("cdEText");
const cdRText = document.getElementById("cdRText");
const cdTText = document.getElementById("cdTText");
const cdXText = document.getElementById("cdXText");
const cdYFill = document.getElementById("cdY");
const cdYText = document.getElementById("cdYText");
const ultSkillNameEl = document.getElementById("ultSkillName");
const hpText = document.getElementById("hpText");
const shieldText = document.getElementById("shieldText");
const shieldFill = document.getElementById("shieldFill");
const shieldWrap = document.getElementById("shieldWrap");
const rerollBtn = document.getElementById("rerollBtn");
const rerollCountEl = document.getElementById("rerollCount");
const bossBarWrap = document.getElementById("bossBarWrap");
const bossBarName = document.getElementById("bossBarName");
const bossBarFill = document.getElementById("bossBarFill");
const bossBarHp = document.getElementById("bossBarHp");
let gameNotificationTimeout = null;
function showGameNotification(text, options) {
  const el = document.getElementById("gameNotification");
  if (!el) return;
  if (gameNotificationTimeout) clearTimeout(gameNotificationTimeout);
  el.textContent = text;
  el.classList.remove("gameNotificationHidden");
  el.classList.add("gameNotificationVisible");
  if (options && options.rainbow) {
    el.classList.add("gameNotificationRainbow");
  } else {
    el.classList.remove("gameNotificationRainbow");
  }
  gameNotificationTimeout = setTimeout(function() {
    el.classList.remove("gameNotificationVisible");
    el.classList.remove("gameNotificationRainbow");
    el.classList.add("gameNotificationHidden");
    gameNotificationTimeout = null;
  }, 3500);
}
let audioCtx = null;
let activeSfxCount = 0;
const MAX_CONCURRENT_SFX = 10;
let pointerLocked = false;
let skipMouseFramesAfterLock = 0;
let bgMusicPlaying = false;
let bgMusicAudio = null;
let bgMusicLoopHandle = null;
const MAX_LEVEL = 10000;
const GLOBAL_KILL_XP_MULT = 0.55;
function getXpNextForLevel(level) {
  const L = Math.min(level, MAX_LEVEL);
  const XP_HARDER = 1.35;
  const XP_LEVEL11_PLUS = 1.28;
  let xp;
  if (L <= 1) xp = 48 * XP_HARDER;
  else if (L <= 1000) xp = 48 * Math.pow(1.09, L - 1) * XP_HARDER;
  else xp = 48 * Math.pow(1.09, 999) * Math.pow(1.006, L - 1000);
  if (L > 10) xp *= XP_LEVEL11_PLUS;
  if (L > 35) xp *= (1 + (L - 35) * 0.024);
  // Ilk 10 level cok daha hizli: gereken XP yariya yakin
  if (L <= 10) xp *= 0.42;
  return Math.floor(xp);
}
let windAmbientTimer = 0;
let bgMusicGain = null;

// --- Paylasilan geometry/material cache (P1.1) ---
// Yaratik ve efekt fabrikalari her spawn'da yeni geometry+material yaratiyordu.
// Asagidaki katman, sadece o fabrikalar calisirken (shareDepth > 0) ayni parametreli
// geometry/material'i tekrar kullanir. Paylasilan kaynagin dispose'u devre disi
// birakilir, boylece killEnemy/updateEffects icindeki dispose cagrilari baskalarinin
// hala kullandigi buffer'i silmez.
let geoShareDepth = 0;
let matShareDepth = 0;
const GEO_CACHE = new Map();
const MAT_CACHE = new Map();
const SHARED_CACHE_MAX = 1500;
function noopDispose() {}
function markShared(res) { if (res) res.dispose = noopDispose; return res; }
function shareKeyArgs(name, args) {
  let key = name;
  for (let i = 0; i < args.length; i++) {
    const v = args[i];
    const t = typeof v;
    if (t === "number") key += "|" + (Number.isInteger(v) ? v : v.toFixed(3));
    else if (t === "boolean" || t === "string" || v === undefined) key += "|" + v;
    else return null;
  }
  return key;
}
function shareKeyParams(name, p) {
  if (p === undefined || p === null) return name + "|-";
  if (typeof p !== "object") return null;
  const keys = Object.keys(p).sort();
  let key = name;
  for (let i = 0; i < keys.length; i++) {
    const v = p[keys[i]];
    const t = typeof v;
    if (t !== "number" && t !== "boolean" && t !== "string") return null;
    key += "|" + keys[i] + ":" + (t === "number" && !Number.isInteger(v) ? v.toFixed(4) : v);
  }
  return key;
}
const SHARED_GEO_CTORS = ["BoxGeometry", "SphereGeometry", "CylinderGeometry", "ConeGeometry", "RingGeometry", "CircleGeometry", "PlaneGeometry", "TorusGeometry", "DodecahedronGeometry", "IcosahedronGeometry", "OctahedronGeometry", "TetrahedronGeometry", "CapsuleGeometry"];
const SHARED_MAT_CTORS = ["MeshStandardMaterial", "MeshLambertMaterial", "MeshBasicMaterial", "MeshPhongMaterial", "MeshToonMaterial"];
function installSharedCaches() {
  if (typeof THREE === "undefined" || THREE.__sharedCacheReady) return;
  function wrap(name, cache, keyFn, depthFn) {
    const Orig = THREE[name];
    if (typeof Orig !== "function") return;
    function Shared() {
      if (depthFn() <= 0) return new Orig(...arguments);
      const key = keyFn(name, arguments.length ? arguments[0] : undefined, arguments);
      if (key === null) return new Orig(...arguments);
      let res = cache.get(key);
      if (!res) {
        res = new Orig(...arguments);
        if (cache.size < SHARED_CACHE_MAX) { markShared(res); cache.set(key, res); }
      }
      return res;
    }
    Shared.prototype = Orig.prototype;
    THREE[name] = Shared;
    if (THREE[name] !== Shared) return false;
    return true;
  }
  let ok = true;
  SHARED_GEO_CTORS.forEach(function (n) {
    ok = wrap(n, GEO_CACHE, function (name, first, args) { return shareKeyArgs(name, args); }, function () { return geoShareDepth; }) !== false && ok;
  });
  SHARED_MAT_CTORS.forEach(function (n) {
    ok = wrap(n, MAT_CACHE, function (name, first) { return shareKeyParams(name, first); }, function () { return matShareDepth; }) !== false && ok;
  });
  THREE.__sharedCacheReady = ok;
  if (!ok) console.warn("shared cache: THREE namespace yazilamiyor, cache kapali");
}
// Fabrika sarmalayicilari: govdeyi degistirmeden cache'i acip kapatir.
function withSharedGeo(fn) {
  geoShareDepth++;
  try { return fn(); } finally { geoShareDepth--; }
}
function withSharedGeoMat(fn) {
  geoShareDepth++; matShareDepth++;
  try { return fn(); } finally { geoShareDepth--; matShareDepth--; }
}

let scene;
let camera;
let camera2D = null;
let renderer;
let clock;
let ground;
let mapGroup;
let grassField = null;
let ambientParticles = [];
let shrineGroups = [];
let parkourRewards = [];
let shrines = [];
let pondMeshes = [];
let difficultyAltars = [];
let bossShrines = [];
let bossSummonShrines = [];
let transitionAltarPos = null;
const TRANSITION_ALTAR_RADIUS = 8;
const TRANSITION_ALTAR_HOLD_TIME = 4;

const WORLD_HALF = 460;
const ISLAND_RADIUS = 280;
const TEMPLE_HALF = 85;
const TEMPLE_SPIDER_COUNT = 500;
const TEMPLE_PURPLE_COUNT = 180;
let templePlatforms = [];
const ISLAND_WATER_LEVEL = -1.2;
const PLAYER_RADIUS = 0.78;
function getMaxEnemies() {
  const L = state.level || 0;
  const t = state.time || 0;
  const byLevel = 8 + Math.floor(L * 0.9);
  const byTime = 8 + Math.floor(t / 25);
  let cap = Math.min(70, Math.min(byLevel, byTime));
  if (state.hordeSurgeActive) cap = Math.min(90, cap + 18);
  return cap;
}
function hasVoxel(id) {
  return !!(id && typeof getVoxelModelDef === "function" && typeof buildVoxelModel === "function" && getVoxelModelDef(id));
}
function pickEnemyVoxelId(isBoss, beastType, opts) {
  if (opts && opts.voxelId && hasVoxel(opts.voxelId)) return opts.voxelId;
  if (isBoss) {
    const bv = state.currentBossIndex ?? 0;
    const ids = ["boss_arachne", "boss_kraken", "boss_kral_slime", "boss_golem"];
    const id = ids[Math.min(Math.max(0, bv), ids.length - 1)];
    return hasVoxel(id) ? id : null;
  }
  return (beastType && hasVoxel(beastType)) ? beastType : null;
}
function attachVoxelModel(g, id, height, radius, scaleVar) {
  if (!hasVoxel(id)) return false;
  const built = buildVoxelModel(id, { outline: true });
  const info = built.userData.voxelInfo || {};
  const sH = height / Math.max(info.height, 0.01);
  const sR = (radius * 2) / Math.max(info.width, 0.01);
  g.scale.setScalar(Math.min(sH, sR) * (scaleVar == null ? 1 : scaleVar));
  while (built.children.length) g.add(built.children[0]);
  g.userData.voxelId = id;
  g.userData.parts = built.userData.parts;
  g.userData.anim = built.userData.anim;
  g.userData.voxelInfo = info;
  return true;
}
function isVoxelSharedMesh(c) {
  if (!c || typeof getVoxelMaterials !== "function") return false;
  const vm = getVoxelMaterials();
  if (!vm) return false;
  const mats = Array.isArray(c.material) ? c.material : (c.material ? [c.material] : []);
  for (let i = 0; i < mats.length; i++) {
    if (mats[i] === vm.opaque || mats[i] === vm.emissive || mats[i] === vm.outline) return true;
  }
  return false;
}
function disposeMeshDeep(root) {
  if (!root || !root.traverse) return;
  root.traverse(function (c) {
    if (isVoxelSharedMesh(c)) return;
    if (c.geometry && c.geometry.dispose !== noopDispose) c.geometry.dispose();
    const mats = Array.isArray(c.material) ? c.material : (c.material ? [c.material] : []);
    mats.forEach(function (m) {
      if (!m || m.dispose === noopDispose) return;
      if (m.map && m.map.dispose) m.map.dispose();
      m.dispose();
    });
  });
}
function placeVoxelProp(id, x, y, z, fitHeight, outline) {
  if (!hasVoxel(id)) return null;
  const built = buildVoxelModel(id, { outline: outline !== false, fitHeight: fitHeight || undefined });
  built.position.set(x, y, z);
  return built;
}
function addInstancedMesh(geo, mat, count) {
  const inst = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
  inst.frustumCulled = false;
  inst.count = Math.max(0, count);
  return inst;
}
function setInstanceAt(inst, i, x, y, z, rotY, sx, sy, sz) {
  _instDummy.position.set(x, y, z);
  _instDummy.rotation.set(0, rotY || 0, 0);
  _instDummy.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
  _instDummy.updateMatrix();
  inst.setMatrixAt(i, _instDummy.matrix);
}
function setInstanceFull(inst, i, x, y, z, rotX, rotY, rotZ, sx, sy, sz) {
  _instDummy.position.set(x, y, z);
  _instDummy.rotation.set(rotX || 0, rotY || 0, rotZ || 0);
  _instDummy.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
  _instDummy.updateMatrix();
  inst.setMatrixAt(i, _instDummy.matrix);
}
function addInstancedPlacements(geo, mat, list, flags) {
  if (!list || !list.length || !mapGroup) return;
  const inst = addInstancedMesh(geo, mat, list.length);
  if (flags && flags.castShadow) inst.castShadow = true;
  if (flags && flags.receiveShadow) inst.receiveShadow = true;
  const full = flags && flags.fullRot;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (full) setInstanceFull(inst, i, p.x, p.y, p.z, p.rotX || 0, p.rotY || 0, p.rotZ || 0, p.sx, p.sy == null ? p.sx : p.sy, p.sz == null ? p.sx : p.sz);
    else setInstanceAt(inst, i, p.x, p.y, p.z, p.rotY || 0, p.sx, p.sy == null ? p.sx : p.sy, p.sz == null ? p.sx : p.sz);
  }
  inst.instanceMatrix.needsUpdate = true;
  mapGroup.add(inst);
}
function addVoxelPropInstances(id, placements, fitHeight) {
  if (!placements.length || !hasVoxel(id)) return 0;
  const proto = buildVoxelModel(id, { outline: true, fitHeight: fitHeight || undefined });
  proto.updateMatrixWorld(true);
  const slots = [];
  proto.traverse(function (c) {
    if (c.isMesh && c.geometry) slots.push({ geo: c.geometry, mat: c.material, local: c.matrixWorld.clone() });
  });
  const parent = new THREE.Matrix4();
  const finalM = new THREE.Matrix4();
  for (let s = 0; s < slots.length; s++) {
    const inst = addInstancedMesh(slots[s].geo, slots[s].mat, placements.length);
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      _instDummy.position.set(p.x, p.y, p.z);
      _instDummy.rotation.set(0, p.rotY || 0, 0);
      _instDummy.scale.setScalar(p.scale || 1);
      _instDummy.updateMatrix();
      parent.copy(_instDummy.matrix);
      finalM.multiplyMatrices(parent, slots[s].local);
      inst.setMatrixAt(i, finalM);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.count = placements.length;
    mapGroup.add(inst);
  }
  return placements.length;
}
function addInstancedForest(positions) {
  if (!positions || !positions.length || !_chunkTrunkMat) return;
  const n = positions.length;
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 1, 6);
  const coneGeo = new THREE.ConeGeometry(1.8, 3.4, 7);
  const cone2Geo = new THREE.ConeGeometry(1.4, 2.5, 7);
  const crownGeo = new THREE.SphereGeometry(1.9, 7, 6);
  const leafA = _chunkLeafMats[0];
  const leafB = _chunkLeafMats[1] || leafA;
  const trunkInst = addInstancedMesh(trunkGeo, _chunkTrunkMat, n);
  const pine1Inst = addInstancedMesh(coneGeo, leafA, n);
  const pine2Inst = addInstancedMesh(cone2Geo, leafA, n);
  const oakInst = addInstancedMesh(crownGeo, leafB, n);
  let pineN = 0, oakN = 0;
  for (let k = 0; k < n; k++) {
    const pt = positions[k];
    const s = 1.5 + Math.random() * 1.1;
    const hm = 1.0 + Math.random() * 0.7;
    const th = 3.2 * hm;
    const y = sampleTerrainHeight(pt.x, pt.z);
    setInstanceAt(trunkInst, k, pt.x, y + th * 0.5 * s, pt.z, 0, s, th * s, s);
    if ((k & 1) === 0) {
      setInstanceAt(pine1Inst, pineN, pt.x, y + (th + 1.2) * s, pt.z, 0, s, s, s);
      setInstanceAt(pine2Inst, pineN, pt.x, y + (th + 2.8) * s, pt.z, 0, s, s, s);
      pineN++;
    } else {
      setInstanceAt(oakInst, oakN, pt.x, y + (th + 1.5) * s, pt.z, 0, s, s * 0.88, s);
      oakN++;
    }
    colliders.push({ x: pt.x, z: pt.z, r: 1.0 * s });
  }
  trunkInst.instanceMatrix.needsUpdate = true;
  pine1Inst.count = pineN; pine1Inst.instanceMatrix.needsUpdate = true;
  pine2Inst.count = pineN; pine2Inst.instanceMatrix.needsUpdate = true;
  oakInst.count = oakN; oakInst.instanceMatrix.needsUpdate = true;
  mapGroup.add(trunkInst, pine1Inst, pine2Inst, oakInst);
}
function ensureWorldDecorMats() {
  if (!worldDecorRockMats) {
    worldDecorRockMats = [
      new THREE.MeshStandardMaterial({ color: 0x7a8a8a, emissive: 0x3a4a4a, emissiveIntensity: 0.08, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x8a7a6a, emissive: 0x4a3a2a, emissiveIntensity: 0.08, roughness: 0.92 }),
    ];
  }
  if (!worldDecorBushMat) {
    worldDecorBushMat = new THREE.MeshStandardMaterial({ color: 0x2d7a2d, emissive: 0x0d3a0d, emissiveIntensity: 0.1, roughness: 0.88 });
  }
  if (!worldDecorMushroomStemMat) {
    worldDecorMushroomStemMat = new THREE.MeshStandardMaterial({ color: 0xf5e6d3, roughness: 0.9 });
    worldDecorMushroomCapRed = new THREE.MeshStandardMaterial({ color: 0xcc4444, emissive: 0x440808, emissiveIntensity: 0.08, roughness: 0.85 });
    worldDecorMushroomCapBrown = new THREE.MeshStandardMaterial({ color: 0x8b6914, emissive: 0x2a2008, emissiveIntensity: 0.08, roughness: 0.85 });
  }
  if (!worldDecorMiniMats) {
    worldDecorMiniMats = {
      chair: new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.8 }),
      leg: new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.5, roughness: 0.5 }),
      cone: new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x882200, emissiveIntensity: 0.2, roughness: 0.7 }),
      box: new THREE.MeshStandardMaterial({ color: 0xb8956e, roughness: 0.85 }),
      tire: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }),
      ball: new THREE.MeshStandardMaterial({ color: 0xdd4444, roughness: 0.4 }),
    };
  }
  if (!worldDecorFlowerMats) {
    worldDecorFlowerMats = FLOWER_COLOR_LIST.map(function (c) {
      return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.3, roughness: 0.4 });
    });
  }
}
function buildWorldDecorInstances() {
  if (worldDecorInstanced || !worldDecorData.length || !mapGroup) return;
  ensureWorldDecorMats();
  const byType = {};
  for (let i = 0; i < worldDecorData.length; i++) {
    const d = worldDecorData[i];
    const key = d.type === "flower" ? ("flower_" + (d.flowerColor || 0)) : (d.type === "mushroom" ? ("mush_" + (d.variant || "red")) : (d.type === "rock" ? ("rock_" + (d.matIndex || 0)) : d.type));
    if (!byType[key]) byType[key] = [];
    byType[key].push(d);
  }
  const rockGeo = new THREE.DodecahedronGeometry(0.8, 0);
  const bushGeo = new THREE.SphereGeometry(0.55, 6, 5);
  const flowerGeo = new THREE.SphereGeometry(0.1, 5, 5);
  const stemGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.25, 5);
  const capGeo = new THREE.SphereGeometry(0.2, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const coneGeo = new THREE.ConeGeometry(0.2, 0.5, 6);
  const boxGeo = new THREE.BoxGeometry(0.4, 0.35, 0.35);
  const tireGeo = new THREE.TorusGeometry(0.25, 0.08, 6, 12);
  const ballGeo = new THREE.SphereGeometry(0.2, 8, 6);
  const chairGeo = new THREE.BoxGeometry(0.5, 0.4, 0.45);
  function stamp(list, geo, mat, yFn, rotFn, sxFn, syFn, szFn) {
    const inst = addInstancedMesh(geo, mat, list.length);
    for (let i = 0; i < list.length; i++) {
      const d = list[i];
      const y0 = sampleTerrainHeight(d.x, d.z);
      const sx = sxFn ? sxFn(d) : d.s;
      const sy = syFn ? syFn(d) : sx;
      const sz = szFn ? szFn(d) : sx;
      setInstanceAt(inst, i, d.x, yFn(d, y0), d.z, rotFn ? rotFn(d) : 0, sx, sy, sz);
      d.mesh = inst;
    }
    inst.instanceMatrix.needsUpdate = true;
    mapGroup.add(inst);
  }
  Object.keys(byType).forEach(function (key) {
    const list = byType[key];
    if (key.indexOf("rock_") === 0) {
      const mi = list[0].matIndex || 0;
      stamp(list, rockGeo, worldDecorRockMats[mi], function (d, y) { return y + 0.15 * d.s; }, function (d) { return d.rot ? d.rot[1] : 0; }, function (d) { return d.s; }, function (d) { return d.sy || d.s; }, function (d) { return d.s; });
    } else if (key === "bush") {
      stamp(list, bushGeo, worldDecorBushMat, function (d, y) { return y + 0.2 * d.s; }, null, function (d) { return d.s; }, function (d) { return d.s * 0.85; }, function (d) { return d.s; });
    } else if (key.indexOf("flower_") === 0) {
      const fi = FLOWER_COLOR_LIST.indexOf(list[0].flowerColor);
      stamp(list, flowerGeo, worldDecorFlowerMats[fi >= 0 ? fi : 0], function (d, y) { return y + 0.45 * d.s; });
    } else if (key.indexOf("mush_") === 0) {
      const capMat = list[0].variant === "red" ? worldDecorMushroomCapRed : worldDecorMushroomCapBrown;
      stamp(list, stemGeo, worldDecorMushroomStemMat, function (d, y) { return y + 0.125 * d.s; }, null, function (d) { return d.s; }, function (d) { return d.s; }, function (d) { return d.s; });
      stamp(list, capGeo, capMat, function (d, y) { return y + 0.28 * d.s; }, null, function (d) { return d.s; }, function (d) { return d.s; }, function (d) { return d.s; });
    } else if (key === "cone") {
      stamp(list, coneGeo, worldDecorMiniMats.cone, function (d, y) { return y + 0.25 * d.s; }, function (d) { return d.rot || 0; }, function (d) { return d.s; });
    } else if (key === "box" || key === "chair") {
      stamp(list, key === "chair" ? chairGeo : boxGeo, key === "chair" ? worldDecorMiniMats.chair : worldDecorMiniMats.box, function (d, y) { return y + 0.2 * d.s; }, function (d) { return d.rot || 0; }, function (d) { return d.s; });
    } else if (key === "tire") {
      stamp(list, tireGeo, worldDecorMiniMats.tire, function (d, y) { return y + 0.25 * d.s; }, function (d) { return d.rot || 0; }, function (d) { return d.s; });
    } else if (key === "ball") {
      stamp(list, ballGeo, worldDecorMiniMats.ball, function (d, y) { return y + 0.2 * d.s; }, null, function (d) { return d.s; });
    }
  });
  worldDecorInstanced = true;
}
function hex6Color(n) {
  return "#" + ("000000" + ((n >>> 0) & 0xffffff).toString(16)).slice(-6);
}
function shade65Hex(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const rr = Math.min(255, Math.round(r * 0.65 + 18));
  const gg = Math.round(g * 0.55);
  const bb = Math.min(255, Math.round(b * 0.65 + 24));
  return hex6Color((rr << 16) | (gg << 8) | bb);
}
function recolorPlayerVoxel(id, bodyColor, capeColor, armorColor) {
  const def = typeof getVoxelModelDef === "function" ? getVoxelModelDef(id) : null;
  if (!def || !def.palette) return;
  def.palette.B = hex6Color(bodyColor); def.palette.b = shade65Hex(def.palette.B);
  def.palette.C = hex6Color(capeColor); def.palette.c = shade65Hex(def.palette.C);
  def.palette.A = hex6Color(armorColor); def.palette.a = shade65Hex(def.palette.A);
  if (typeof disposeVoxelCache === "function") disposeVoxelCache(id);
}
function applyRimStats(e) {
  if (!e || e._rimApplied || !e.mesh) return;
  e._rimApplied = true;
  const rimT = Math.min(1, Math.hypot(e.mesh.position.x, e.mesh.position.z) / WORLD_HALF);
  const rimMult = 1 + rimT * 0.8;
  e.hp *= rimMult;
  e.maxHp = e.hp;
  e.xp *= rimMult * 1.15;
}
function updateVoxelCreatureAnim(e, dt) {
  const parts = e && e.mesh && e.mesh.userData && e.mesh.userData.parts;
  if (!parts) return;
  const t = (state.time || 0) + (e.wingPhase || 0);
  const anim = e.mesh.userData.anim;
  if (!e.isFlying) {
    const wingL = parts.wingL;
    const wingR = parts.wingR;
    if (wingL && wingR) {
      e.wingPhase = (e.wingPhase || 0) + dt * 7;
      const flap = Math.sin(e.wingPhase) * 0.4;
      wingL.rotation.z = flap;
      wingR.rotation.z = -flap;
    }
  }
  if (anim === "squash" && parts.body) {
    const s = 1 + Math.sin(t * 5) * 0.07;
    parts.body.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
  } else if ((anim === "hover" || anim === "orbit") && parts.body) {
    parts.body.position.y = Math.sin(t * 2.1) * 0.07;
  }
}
const ATTACK_ROUND_MAX_ENEMIES = 130;
const ENEMY_DESPAWN_DISTANCE = 50;
// Uzaktaki dusmanlar icin seyrek AI tick (P1.8)
const ENEMY_FAR_DIST = 34;
const ENEMY_FAR_TICK = 3;
const HP_BAR_DRAW_DIST = 38;
const ATTACK_ROUND_START_TIME = 420;
const ATTACK_ROUND_WAVE1_COUNT = 50;
const ATTACK_ROUND_WAVE2_COUNT = 80;
const MAX_PROJECTILES = 34;
const MAX_EFFECTS = 20;
const MAX_DAMAGE_TEXTS = 6;
const MAX_ORBS = 260;

const keys = { w: false, a: false, s: false, d: false, q: false, e: false, r: false, t: false, x: false, y: false, space: false, f: false, g: false, v: false, shift: false, c: false };
const mouse = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

const v0 = new THREE.Vector3();
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();

let running = false;
let leveling = false;
let gameOver = false;
let paused = false;
let levelupAutoPick = 0;
let camPitch = -1.204;
let _perfFrame = 0;

// Bhop system (CS bhop server style: air strafe gain, friction grace on land)
const bhop = {
  spaceDown: false,
  spacePressedThisFrame: false,
  streak: 0,
  speedBonus: 0,
  maxStreak: 60,
  perfectWindow: 0.16,
  landTime: 0,
  wasGrounded: true,
  lastJumpTime: 0,
  frictionGrace: 0.07,
};
const MAX_BHOP_SPEED_BONUS = 18;
const AIR_ACCEL = 38;
const AIR_SPEED_CAP_MULT = 2.05;
let skillTreeZoom = 1;
let skillTreePanX = 0;
let skillTreePanY = 0;
let skillTreeDragging = false;
let skillTreeLastX = 0;
let skillTreeLastY = 0;
const dodge = { shiftUsed: false };
let autoAttackEnabled = true;

// Ragdoll wobble system - soft, funny, unstable but controllable
const ragdoll = {
  // Joint angles (radians offset from rest)
  torsoTilt: 0, torsoTiltVel: 0,
  torsoLean: 0, torsoLeanVel: 0,
  headBob: 0, headBobVel: 0,
  armLSwing: 0, armRSwing: 0,
  legLSwing: 0, legRSwing: 0,
  capeWave: 0,
  impactForce: new THREE.Vector3(),
  stumbleTimer: 0,
  landSquash: 0,
  // Physics constants
  stiffness: 12,
  damping: 4.5,
  mass: 1.0,
};

// Shadow enemy system
let shadowMode = false;
let shadowModeTimer = 0;

const STAGE_INTERVAL = 300;
const CHAPTER_BOSS_TIME = 600;
const CHAPTER_BOSS_TIME_3MIN = 180;
const CHAPTER_BOSS_TIME_6MIN = 360;
const state = {
  time: 0,
  level: 1,
  xp: 0,
  xpNext: 27,
  kills: 0,
  spawnTimer: 3.8,
  pendingLevels: 0,
  difficultyStage: 1,
  nextDifficultyAt: STAGE_INTERVAL,
  bossesDefeated: 0,
  staticShivCounter: 0,
  chapter: 1,
  chapterTime: 0,
  bossSpawnedThisChapter: [false, false, false],
  bossSlotsSpawnedThisChapter: [false, false, false], // 3min, 6min, 10min
  portalActive: false,
  portalPos: null,
  inMegaArena: false,
  megaBossSpawned: false,
  weather: null,
  weatherEndTime: 0,
  lightningTelegraphs: [],
  windDir: new THREE.Vector3(1, 0, 0),
  endlessMode: false,
  endlessTime: 0,
  endlessWave: 0,
  exileMode: false,
  skillPoints: 0,
  skillTreeUnlocked: ["start"],
  caveXpMult: 1,
  coins: 0,
  mana: 100,
  maxMana: 100,
  stamina: 100,
  maxStamina: 100,
  difficultyMult: 1.0,
  bossDropMult: 1.0,
  hardcoreMode: false,
  randomPortalCooldown: 0,
  bonusTime: false,
  bonusTimeEnd: 0,
  bonusTimeComboCount: 0,
  nextBonusAt: 200,
  playerAppearance: null,
  konamiUnlocked: false,
  bossMusicActive: false,
  auraTriggers: { thunder: 0, ice: 0, ash: 0 },
  heraldStrikesThisSecond: 0,
  heraldLastSecondReset: 0,
  difficultyFirstBumpApplied: false,
  difficultyRampStartTime: 0,
  difficultyRampStepsApplied: 0,
  flickerTeleportTimer: 0,
  breachPoints: 0,
  ritualPoints: 0,
  abyssPoints: 0,
  difficultyPoints: 0,
  breachUpgrades: { speed: 0, quantity: 0, dropRate: 0, maxBreaches: 0 },
  ritualUpgrades: { speed: 0, quantity: 0, dropRate: 0 },
  abyssUpgrades: { speed: 0, quantity: 0, dropRate: 0 },
  difficultyUpgrades: { mult: 0 },
  flickerTargetEnemy: null,
  playerPoisonLeft: 0,
  playerBurnLeft: 0,
  toxicPuddles: [],
  toxicTrailTimer: 0,
  questsProgress: { kills: 0, bosses: 0, coins: 0 },
  soulRoundActive: false,
  soulRoundEndTime: 0,
  nextSoulRoundAt: 285,
  soulRoundSpawnTimer: 0,
  hordeSurgeActive: false,
  hordeSurgeEndTime: 0,
  nextHordeSurgeAt: 300,
  hordeSurgeSpawnTimer: 0,
  attackRoundStarted: false,
  attackRoundActive: false,
  attackRoundPhase: 1,
  instaKillUntil: 0,
};

const QUESTS_KEY = "zegabong_quests";
const DEFAULT_QUESTS = [
  { id: "kill", name: "30 dusman oldur", target: 30, progress: 0, reward: 10, type: "kills" },
  { id: "boss", name: "1 boss kes", target: 1, progress: 0, reward: 15, type: "bosses" },
  { id: "coin", name: "20 coin topla", target: 20, progress: 0, reward: 8, type: "coins" },
];
function getQuestsForToday() {
  const today = new Date().toDateString();
  try {
    const raw = localStorage.getItem(QUESTS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === today && Array.isArray(data.quests) && data.quests.length > 0) return data.quests;
    }
  } catch (e) {}
  return DEFAULT_QUESTS.map(function(q) { return { id: q.id, name: q.name, target: q.target, progress: 0, reward: q.reward, type: q.type, claimed: false }; });
}
function loadQuests() {
  state.quests = getQuestsForToday();
  renderQuestsUI();
}
function saveQuests() {
  if (!state.quests || !state.quests.length) return;
  try { localStorage.setItem(QUESTS_KEY, JSON.stringify({ date: new Date().toDateString(), quests: state.quests })); } catch (e) {}
}
function renderQuestsUI() {
  const listEl = document.getElementById("questsList");
  if (!listEl) return;
  if (!state.quests || !state.quests.length) { listEl.innerHTML = ""; return; }
  listEl.innerHTML = state.quests.map(function(q, i) {
    const done = q.progress >= q.target;
    const claimed = q.claimed;
    const btn = claimed ? "" : (done ? "<button type=\"button\" class=\"btn secondary btnClaim\" data-quest-idx=\"" + i + "\">Odul al (" + q.reward + ")</button>" : "<span class=\"questProgress\">" + (q.progress || 0) + "/" + q.target + "</span>");
    return "<div class=\"questRow\"><span class=\"questName\">" + (claimed ? "[Tamamlandi] " : "") + q.name + "</span>" + btn + "</div>";
  }).join("");
  listEl.querySelectorAll(".btnClaim").forEach(function(btn) {
    btn.addEventListener("click", function() {
      const idx = parseInt(btn.getAttribute("data-quest-idx"), 10);
      claimQuest(idx);
      renderQuestsUI();
    });
  });
}
function claimQuest(index) {
  if (!state.quests || !state.quests[index] || state.quests[index].claimed) return;
  const q = state.quests[index];
  if (q.progress < q.target) return;
  q.claimed = true;
  state.coins = (state.coins || 0) + q.reward;
  saveQuests();
}

function loadPlayerAppearance() {
  try {
    const raw = localStorage.getItem("zaza_player_appearance");
    if (raw) {
      const o = JSON.parse(raw);
      state.playerAppearance = {
        bodyColor: o.bodyColor != null ? o.bodyColor : 0x2299dd,
        capeColor: o.capeColor != null ? o.capeColor : 0x4444aa,
        armorColor: o.armorColor != null ? o.armorColor : 0x4488cc,
        scale: typeof o.scale === "number" ? clamp(o.scale, 0.9, 1.5) : 1.2,
        capeVisible: o.capeVisible !== false,
      };
      return;
    }
  } catch (e) {}
  state.playerAppearance = { bodyColor: 0x2299dd, capeColor: 0x4444aa, armorColor: 0x4488cc, scale: 1.0, capeVisible: true };
  try { if (localStorage.getItem("zaza_konami") === "1") state.konamiUnlocked = true; } catch (e) {}
}
function savePlayerAppearance() {
  if (!state.playerAppearance) return;
  try { localStorage.setItem("zaza_player_appearance", JSON.stringify(state.playerAppearance)); } catch (e) {}
}

const baseStats = {
  maxHp: 120,
  hp: 120,
  damage: 22,
  fireRate: 0.26,
  projectileSpeed: 13,
  moveSpeed: 7.35,
  multiShot: 0,
  pickupRange: 3.4,
  magnetRange: 2.5,
  magnetStrength: 6,
  critChance: 0.06,
  critMult: 1.9,
  critDmgBonus: 0,
  pierce: 0,
  aoe: 0,
  lifesteal: 0,
  knockback: 0,
  slow: 0,
  poison: 0,
  staticShiv: 0,
  thorns: 0,
  healOnKill: 0,
  armor: 0,
  execute: 0,
  berserker: 0,
  doubleJump: 0,
  ricochet: 0,
  globalCdReduction: 0,
  lastStand: false,
  samuraiMelee: false,
  archerBow: false,
  poisonCloud: 0,
  xpGainMult: 1,
  projectileSpeedMult: 1,
  shield: 0,
  maxTurrets: 1,
  gorillaAura: false,
  arrowShock: false,
  arrowBurn: false,
  arrowFreeze: false,
  bleed: 0,
  heraldOfThunder: 0,
  heraldOfIce: 0,
  heraldOfAsh: 0,
  toxicTrail: 0,
  toxicTrailRadius: 2.2,
  toxicTrailPoison: 2.0,
};

const stats = { ...baseStats };
const MAX_MOVE_SPEED = 13.5;
const MAX_ABILITY_UNLOCKS = 7;
const MAX_PASSIVE_SKILLS = 7;
let levelupRerollsLeft = 2;
let levelupPaidRerollCount = 0;
const REROLL_BASE_COIN = 300;
const REROLL_COIN_LOG_FACTOR = 200;

const abilityState = {
  fireball: { level: 0, timer: 0, cooldown: 2.2, damage: 24, speed: 20, aoe: 2.3, shots: 1 },
  comet: { level: 0, timer: 0, cooldown: 3.0, damage: 34, speed: 29, pierce: 2 },
  swords: { level: 0, count: 1, damage: 14, radius: 2.8, spin: 2.7 },
  meteor: { level: 0, timer: 0, cooldown: 5.8, damage: 58, radius: 3.8 },
  frostball: { level: 0, timer: 0, cooldown: 2.8, damage: 20, freeze: 2.2, shards: 3 },
  nova: { level: 0, timer: 0, cooldown: 4.6, damage: 26, radius: 4.2 },
  banana: { level: 0, timer: 0, cooldown: 2.5, damage: 28, speed: 22, stun: 1.2, count: 2, throwCount: 1 },
  swordThrow: { level: 0, timer: 0, cooldown: 3.2, damage: 42, speed: 24, range: 12 },
  boomerang: { level: 0, timer: 0, cooldown: 2.8, damage: 35, speed: 24, range: 14 },
  shuriken: { level: 0, timer: 0, cooldown: 1.8, damage: 18, speed: 28, count: 3 },
  lineShot: { level: 0, timer: 0, cooldown: 2.4, damage: 38, length: 7, width: 0.5, speed: 42 },
  laser: { level: 0, timer: 0, cooldown: 3.0, damage: 48, range: 14, width: 0.35, duration: 0.22 },
  lightBeam: { level: 0, timer: 0, cooldown: 2.8, damage: 42, range: 16, width: 0.5, duration: 0.28 },
  coneBlast: { level: 0, timer: 0, cooldown: 3.2, damage: 35, range: 5, halfAngle: Math.PI / 6 },
  dismantle: { level: 0, timer: 0, cooldown: 3.5, damage: 44, radius: 5, arcAngle: Math.PI / 2 },
  gorillaAura: { level: 0, radius: 3.2, damage: 14, tickRate: 0.45, tickTimer: 0 },
  flickerStrike: { level: 0, cooldown: 2.2, timer: 0, range: 5.5, damage: 38 },
  spark: { level: 0, timer: 0, cooldown: 2.4, damage: 18, speed: 14, count: 5 },
  smite: { level: 0, damageMult: 1.0 },
  kineticBlast: { level: 0, maxTargets: 3, damageMult: 1.0, baseDamage: 32 },
  saturnRings: null,
  chainBolt: { level: 0, timer: 0, cooldown: 2.6, damage: 22, jumps: 4 },
  blackHole: { level: 0, timer: 0, cooldown: 6.8, damage: 48, radius: 7, zone: null },
  poisonTrail: { level: 0, timer: 0, cooldown: 0.32, damage: 9, radius: 2.4 },
};
const MAX_PROJECTILES_PER_SKILL = 5;
const MAX_ARROW_PROJECTILES = 4;
const MAX_DEBRIS = 10;
const MIN_EFFECT_INTERVAL = 0.1;

const ownedSkills = new Set();
const skillLevels = {};
let currentChoices = [];
let acquiredOrder = [];
const companionsData = {
  phoenix: { name: "Phoenix", color: 0xffa35a, damage: 18, cooldown: 1.6, range: 18, burnOnHit: 1.5 },
  drone: { name: "Drone", color: 0x9ad3ff, damage: 12, cooldown: 1.1, range: 16 },
  golem: { name: "Stone Golem", color: 0xb8a58a, damage: 26, cooldown: 2.0, range: 14, stunOnHit: 0.4, speedMult: 0.7 },
  skeleton_minion: { name: "Iskelet Minyon", color: 0xddddcc, damage: 14, cooldown: 1.4, range: 16, meshType: "creature", attackType: "projectile", projectileColor: 0xaa9988, projectileSpeed: 18 },
  wolf_minion: { name: "Kurt Minyon", color: 0x5c4a3a, damage: 20, cooldown: 1.8, range: 12, meshType: "creature", attackType: "melee", slowOnHit: 0.8 },
  goblin_minion: { name: "Goblin Minyon", color: 0x44aa44, damage: 11, cooldown: 1.0, range: 14, meshType: "creature", attackType: "projectile", projectileColor: 0x66cc44, projectileSpeed: 22, poisonOnHit: 1.2 },
  healer_minion: { name: "Sifa Minyonu", color: 0x88ff88, meshType: "creature", healRate: 10, healCooldown: 1.8, healRange: 7 },
  archer_minion: { name: "Okcu Minyon", color: 0x8b7355, damage: 16, cooldown: 1.6, range: 22, meshType: "creature", attackType: "projectile", projectileColor: 0xaa8866, projectileSpeed: 24 },
  mage_minion: { name: "Buyucu Minyon", color: 0xaa66ff, damage: 22, cooldown: 2.2, range: 12, meshType: "creature", attackType: "aoe", aoeRadius: 2.2 },
};

const player = {
  mesh: null,
  vel: new THREE.Vector3(),
  aimDir: new THREE.Vector3(0, 0, 1),
  shootCd: 0,
  healthBar: null,
  vy: 0,
  grounded: true,
  wallJumpCooldown: 0,
  wallNormal: new THREE.Vector3(0, 0, 0),
  wallJumpCoyote: 0,
};

let camYaw = Math.PI;
const camSettings = {
  mouseSensitivity: 1.0,
  cameraDistance: 10,
  cameraHeight: 4.9,
  pitchMin: -1.25,
  pitchMax: 0.5,
  fov: 85,
  soundVolume: 1,
  musicVolume: 1,
  effectVolume: 1,
  screenShake: true,
  particleDensity: "normal",
  weatherIntensity: "normal",
  cameraAngle: "default",
  graphics2D: false,
};
const specialState = {
  frostNova: { cd: 7, timer: 0, radius: 5, damage: 32, freeze: 2.5 },
  dash: { cd: 6, timer: 0, speed: 24, duration: 0.2 },
  meteorUlt: { cd: 18, timer: 0, count: 6, damage: 90, radius: 3.6 },
  explosion: { cd: 8, timer: 0, radius: 5.5, damage: 48 },
};
const specialUnlocks = { frostNova: false, dash: false, meteorUlt: false, turret: false, explosion: false };

const SKILL_TREE_NODES = [
  { id: "start", name: "Baslangic", desc: "Agacin basi", cost: 0, effect: null, x: 0, y: 0 },
  { id: "dmg1", name: "Hasar +5%", desc: "Kalici hasar artisi", cost: 1, effect: { type: "mult", stat: "damage", value: 1.05 }, x: 0, y: 1 },
  { id: "hp1", name: "Max HP +12", desc: "Maksimum can +12", cost: 1, effect: { type: "addHp", value: 12 }, x: -1, y: 0 },
  { id: "spd1", name: "Hiz +4%", desc: "Hareket hizi artisi", cost: 1, effect: { type: "mult", stat: "moveSpeed", value: 1.04 }, x: 1, y: 0 },
  { id: "crit1", name: "Krit %2", desc: "Kritik vurma sansi", cost: 1, effect: { type: "add", stat: "critChance", value: 0.02 }, x: 0, y: -1 },
  { id: "dmg2", name: "Hasar +6%", desc: "Kalici hasar artisi", cost: 1, effect: { type: "mult", stat: "damage", value: 1.06 }, x: 0, y: 2 },
  { id: "hp2", name: "Max HP +15", desc: "Maksimum can +15", cost: 1, effect: { type: "addHp", value: 15 }, x: -2, y: 0 },
  { id: "spd2", name: "Hiz +5%", desc: "Hareket hizi artisi", cost: 1, effect: { type: "mult", stat: "moveSpeed", value: 1.05 }, x: 2, y: 0 },
  { id: "armor1", name: "Zirh %4", desc: "Hasar azaltma (zirh)", cost: 1, effect: { type: "add", stat: "armor", value: 0.04 }, x: -1, y: -1 },
  { id: "fr1", name: "Atis Hizi +6%", desc: "Daha hizli ates", cost: 1, effect: { type: "mult", stat: "fireRate", value: 1.06 }, x: 1, y: -1 },
  { id: "dmg3", name: "Hasar +8%", desc: "Kalici hasar artisi", cost: 1, effect: { type: "mult", stat: "damage", value: 1.08 }, x: 0, y: 3 },
  { id: "hp3", name: "Max HP +20", desc: "Maksimum can +20", cost: 1, effect: { type: "addHp", value: 20 }, x: -2, y: 1 },
  { id: "crit2", name: "Krit Hasar x0.15", desc: "Kritikte ek hasar", cost: 1, effect: { type: "add", stat: "critMult", value: 0.15 }, x: 1, y: 1 },
  { id: "armor2", name: "Zirh %5", desc: "Hasar azaltma (zirh)", cost: 1, effect: { type: "add", stat: "armor", value: 0.05 }, x: -1, y: -2 },
  { id: "magnet1", name: "Magnet +0.5", desc: "XP/coin cekme mesafesi", cost: 1, effect: { type: "add", stat: "magnetRange", value: 0.5 }, x: 2, y: -1 },
  { id: "regen1", name: "Regen 0.4", desc: "Saniyede can yenileme", cost: 1, effect: { type: "add", stat: "regen", value: 0.4 }, x: -2, y: -1 },
  { id: "coin1", name: "Coin +8%", desc: "Dusen coin miktari", cost: 1, effect: { type: "mult", stat: "coinMult", value: 1.08 }, x: 2, y: 1 },
  { id: "proj1", name: "Proje Hasar +6%", desc: "Mermi/skill hasari", cost: 1, effect: { type: "mult", stat: "projectileDamageMult", value: 1.06 }, x: 0, y: -2 },
  { id: "hp4", name: "Max HP +25", desc: "Maksimum can +25", cost: 1, effect: { type: "addHp", value: 25 }, x: -3, y: 0 },
  { id: "dmg4", name: "Hasar +10%", desc: "Kalici hasar artisi", cost: 1, effect: { type: "mult", stat: "damage", value: 1.1 }, x: 0, y: 4 },
  { id: "magnet2", name: "Magnet +0.6", desc: "XP/coin cekme mesafesi", cost: 1, effect: { type: "add", stat: "magnetRange", value: 0.6 }, x: 2, y: -2 },
  { id: "armor3", name: "Zirh %6", desc: "Hasar azaltma (zirh)", cost: 1, effect: { type: "add", stat: "armor", value: 0.06 }, x: -1, y: -3 },
  { id: "regen2", name: "Regen 0.6", desc: "Saniyede can yenileme", cost: 1, effect: { type: "add", stat: "regen", value: 0.6 }, x: -2, y: -2 },
];
const SKILL_TREE_EDGES = [
  ["start", "dmg1"], ["start", "hp1"], ["start", "spd1"], ["start", "crit1"],
  ["dmg1", "dmg2"], ["hp1", "hp2"], ["spd1", "spd2"], ["hp1", "armor1"], ["spd1", "fr1"],
  ["dmg2", "dmg3"], ["hp2", "hp3"], ["dmg1", "crit2"], ["armor1", "armor2"], ["spd1", "magnet1"],
  ["hp2", "regen1"], ["crit2", "coin1"], ["crit1", "proj1"], ["hp3", "hp4"], ["dmg3", "dmg4"],
  ["magnet1", "magnet2"], ["armor2", "armor3"], ["regen1", "regen2"],
];

const ULT_COOLDOWN = 120;
const ULT_DEFS = {
  mega_explosion: { name: "Mega Patlama", cooldown: ULT_COOLDOWN, radius: 14, damage: 180, color: 0xff6622 },
  ice_apocalypse: { name: "Buz Apokalipsi", cooldown: ULT_COOLDOWN, radius: 12, damage: 120, freeze: 4, color: 0x88ddff },
  lightning_storm: { name: "Yildirim Firtinasi", cooldown: ULT_COOLDOWN, strikes: 8, strikeRadius: 5, damage: 75, color: 0x4488ff },
  inferno: { name: "Inferno", cooldown: ULT_COOLDOWN, radius: 11, damage: 130, burn: 5, color: 0xff3300 },
  void_blast: { name: "Void Patlamasi", cooldown: ULT_COOLDOWN, radius: 13, damage: 160, color: 0x6622aa },
};
let stateUltimate = null;

const colliders = [];
let enemies = [];
let projectiles = [];
let enemyProjectiles = [];
let enemyLasers = [];
let effects = [];
let xpOrbs = [];
let chests = [];
let worldPickups = [];
let bhopTrail = [];
// Biraz daha hafif efekt icin bhop trail limitini kucult
const BHOP_TRAIL_MAX = 10;
let bhopTrailTimer = 0;
let worldChests = [];
let breaches = [];
let abyssPits = [];
let rituals = [];
let worldDecorData = [];
let worldDecorInstanced = false;
let megaArenaWall = null;
let gorillaAuraRingMesh = null;
const _instDummy = new THREE.Object3D();
// Dekor uzakligini ve her karede islenen chunk sayisini biraz kis
const WORLD_DECOR_LOAD_DIST = 34;
const WORLD_DECOR_UNLOAD_DIST = 42;
let worldDecorRockMats = null;
let worldDecorBushMat = null;
let worldDecorMushroomStemMat = null;
let worldDecorMushroomCapRed = null;
let worldDecorMushroomCapBrown = null;
let worldDecorMiniMats = null;
let worldDecorFlowerMats = null;
let worldDecorUpdateOffset = 0;
const WORLD_DECOR_CHUNK = 18;
const FLOWER_COLOR_LIST = [0xff6688, 0xffaa44, 0xdd66ff, 0x66ccff, 0xffff66];
let swordMeshes = [];
let bananaMeshes = [];
let groundSlipHazards = [];
const MAX_GROUND_SLIP = 12;
const SLIP_HAZARD_RADIUS = 0.85;
const SLIP_HAZARD_LIFE = 14;
let saturnRingMeshes = [];
let companions = [];
let placeableTurrets = [];
const TURRET_DURATION = 25;
const TURRET_PLACE_CD = 8;
const MAX_TURRETS_DEFAULT = 1;
let turretPlaceCd = 0;
let portalMesh = null;
let randomTeleportPortals = [];
let hardcorePortalData = null;
let defaultSkyTex = null;
let defaultFogColor = 0x88c8ee;
let defaultFogDensity = 0.0055;
const MAX_CHAPTER = 3;
const MEGA_BOSS_HP_MULT = 25;

const tierConfig = {
  normal: { hp: 42, speed: 4.5, damage: 6, xp: 16, radius: 0.92, height: 2.0 },
  magic: { hp: 80, speed: 4.7, damage: 9, xp: 28, radius: 1.0, height: 2.15 },
  rare: { hp: 155, speed: 4.0, damage: 14, xp: 35, radius: 1.15, height: 2.5 },
  unique: { hp: 320, speed: 3.5, damage: 19, xp: 84, radius: 1.42, height: 3.0 },
  boss: { hp: 1800, speed: 3.0, damage: 26, xp: 380, radius: 1.82, height: 4.0 },
};
const enemyNames = {
  normal: ["Goblin", "Imp", "Scamp", "Grunt", "Scout", "Runner", "Brawler", "Stalker", "Crawler", "Shade", "Noob Bot", "Smol Boi", "Angri Boi", "Skeleton", "Zombie", "Rat", "Slime", "Mushroom", "Spider"],
  wolf: ["Kurt", "Boz Kurt", "Yaban Kurt", "Kurt Sürüsü", "Kızgın Kurt", "Gece Kurdu", "Uluyan Kurt", "Alfa Kurt", "Kurt Sürüsü Lideri"],
  bear: ["Ayı", "Boz Ayı", "Kara Ayı", "Dağ Ayısı", "Orman Ayısı", "Öfkeli Ayı", "Dev Ayı", "Mağara Ayısı", "Kış Uykusundan Uyanan"],
  boar: ["Yaban Domuzu", "Domuz", "Vahşi Domuz", "Dişli Domuz", "Orman Domuzu", "Kızgın Domuz", "Sürü Lideri", "Kıllı Domuz", "Köpek Dişli"],
  fox: ["Tilki", "Kızıl Tilki", "Yaban Tilki", "Gece Tilki", "Kurnaz Tilki", "Orman Tilki", "Gümüş Tilki", "Çöl Tilki", "Hızlı Tilki"],
  ghost: ["Hayalet", "Beyaz Hayalet", "Gece Hayaleti", "Ruh", "Phantom", "Sis Hayaleti", "Uçan Hayalet", "Ağlayan Ruh", "Kaybolmuş Ruh"],
  skeleton: ["İskelet", "Kemik Yaratık", "Skeleton", "Kafatası", "Kemik Savaşçı", "Ölü Asker", "Zombi İskelet", "Kemik Avcı", "Kırık Kemik"],
  bat: ["Yarasa", "Gece Yarasa", "Vampir Yarasa", "Mağara Yarasa", "Küçük Yarasa", "Sürü Yarasa", "Karanlık Yarasa", "Kanatlı Yaratık", "Uçan Fare"],
  scorpion: ["Akrep", "Kum Akrebi", "Zehirli Akrep", "Kara Akrep", "Dev Akrep", "Çöl Akrebi", "İğneli Akrep", "Ölüm Akrebi", "Kral Akrep"],
  spider: ["Örümcek", "Kara Örümcek", "Taraklı Örümcek", "Tünel Örümceği", "Zıplayan Örümcek", "Ağ Örümceği", "Dev Örümcek", "Zehirli Örümcek", "Örümcek Ana"],
  polarBear: ["Kutup Ayisi", "Buz Ayisi", "Kuzey Ayisi", "Beyaz Dev", "Buzul Avcisi", "Kardan Ayi", "Antarktika Ayisi", "Buz Krali", "Kutup Canavari"],
  tree: ["Agac Yaratigi", "Orman Ruhu", "Yuruyen Agac", "Dallar", "Kök Savasci", "Yaprak Canavari", "Asirlik Agac", "Orman Bekcisi", "Ent"],
  void: ["Void Yirtik", "Bosluk Canavari", "Karanlik Ruhu", "Void Avcisi", "Uzay Kurdu", "Void Solucani", "Golge Yirtik", "Abis Yaratigi", "Void Bekcisi"],
  horror: ["Dehset", "Korku Canavari", "Cildiran Goz", "Dislerin Sahibi", "Gece Avcisi", "Kabus Yaratigi", "Uc Gozlu", "Yirtik Agiz", "Karanlik Dehset"],
  slime: ["Balcik", "Yesil Balcik", "Ziplayan Balcik", "Jel Canavari", "Sümüksü", "Orman Balcigi", "Zehirli Balcik", "Koca Balcik", "Balcik Krali"],
  goblin: ["Goblin", "Yesil Goblin", "Orman Goblin", "Kucuk Goblin", "Kizgin Goblin", "Goblin Avcisi", "Goblin Savasci", "Goblin Ceti", "Goblin Krali"],
  flame: ["Alev Yaratigi", "Ates Ruhu", "Kor Canavari", "Yanik Ruh", "Ates Elementali", "Lav Yirtigi", "Kor Avcisi", "Alev Danscisi", "Yanik Hayalet"],
  creeper: ["Creeper", "Patlayici", "Tislayan", "Yesil Patlatici", "Sinsice", "Bomba Yaratigi", "SSSS", "Minecraft Hayrani", "Patlama Uzmani"],
  zombie: ["Zombi", "Yuruyen Olu", "Yesil Zombi", "Gece Zombisi", "Orman Zombisi", "Kemirgen", "Beyin Yiyen", "Rotten", "Minecraft Zombisi", "Olu Asker"],
  shadow: ["Siyah Ruh", "Golge Wraith", "Karanlik Ruh", "Gece Wraith", "Umut Yutan", "Golge Avcisi", "Kara Hayalet", "Void Ruhu", "Karanlik Wraith"],
  breach: ["Breach Yaratigi", "Karanlik Kanatli", "Yirtik Bekcisi", "Void Savasci", "Karanlik Melek", "Breach Canavari", "Kanatli Dehset", "Yirtik Avcisi", "Karanlik Koruyucu"],
  vampire: ["Vampir", "Kan Emici", "Gecenin Avcisi", "Kont", "Nosferatu", "Kan Icicisi", "Pale Avci", "Karanlik Lord", "Vampir Bey"],
  purpleShadow: ["Mor Ruh", "Mor Wraith", "Büyülü Ruh", "Mor Hayalet", "Void Moru", "Karanlik Mor", "Sis Ruhu", "Mor Golge"],
  purpleSkeleton: ["Mor Iskelet", "Guclendirilmis Iskelet", "Büyülü Kemik", "Mor Kemik Savasci", "Karanlik Iskelet", "Void Iskelet", "Mor Kafatasi"],
  purpleSlime: ["Mor Balcik", "Büyülü Balcik", "Zehirli Mor", "Karanlik Balcik", "Void Balcigi", "Mor Jel", "Sümüksü Mor"],
  redBat: ["Kirmizi Yarasa", "Kan Yarasa", "Ates Yarasa", "Öfke Yarasa", "Kizil Kanat", "Vampir Yarasa", "Kirmizi Gece Avcisi"],
  flying: ["Phantom Kus", "Golge Kus", "Vampir Yarasa", "Ucucu Hayalet", "Gece Kargası", "Kanatli Korku", "Sis Kusu", "Ucan Avci"],
  beetle: ["Bogecik", "Kara Bogecik", "Zirhli Bogecik", "Kor Bogecik", "Orman Bogecigi", "Demir Kabuk", "Kizgin Bogecik", "Kral Bogecik", "Dev Bogecik"],
  crow: ["Karga", "Kara Karga", "Gece Kargasi", "Orman Kargasi", "Kanatli Avci", "Gagali Karga", "Sürü Kargasi", "Kuzgun", "Ölüm Kargasi"],
  wraith: ["Wraith", "Sis Ruhu", "Ucucu Wraith", "Gece Wraith", "Karanlik Wraith", "Hayalet Wraith", "Void Wraith", "Ölüm Wraith", "Ebedi Wraith"],
  snake: ["Yilan", "Yesil Yilan", "Col Yilani", "Zehirli Yilan", "Kobra", "Piton", "Engerek", "Kral Yilan", "Ejderha Yilani"],
  snail: ["Salyangoz", "Bahce Salyangozu", "Yavas Yaratik", "Kabuklu", "Cali", "Orman Salyangozu", "Dev Salyangoz", "Zehirli Salyangoz", "Gumus Iz"],
  cactus: ["Kaktus", "Dikenli Kaktus", "Col Kaktusu", "Dev Kaktus", "Zirhli Kaktus", "Kor Kaktus", "Orman Kaktusu", "Kral Kaktus", "Kaktus Canavari"],
  magic: ["Arcane Wisp", "Frost Sprite", "Flame Dancer", "Void Walker", "Storm Caller", "Shadow Weaver", "Crystal Shard", "Mana Beast", "WiFi Stealer", "Laggy Ghost", "Witch", "Necro", "Banshee", "Elemental"],
  rare: ["Elite Warden", "Blood Knight", "Iron Golem", "Frost Reaver", "Chaos Spawn", "Void Hunter", "Storm Lord", "Phoenix Guard", "Karen Manager", "Chad Warrior", "Dark Paladin", "Demon Archer", "Berserker", "Minotaur"],
  unique: ["Champion of Ruin", "Soul Reaper", "Infernal Duke", "Abyssal Lord", "Eclipse", "Doom Herald", "Void Prince", "Ultra Instinct Boi", "Dragon Rider", "Lich King", "Hydra Head"],
  boss: ["Titan", "Overlord", "Colossus", "Behemoth", "Leviathan", "Warlord", "Destroyer", "Annihilator", "Big Chungus", "Final Karen", "Ancient Dragon", "Void Emperor"],
};
const ENEMY_SPEECH_LINES = [
  "Oluceksin lanet olasi!",
  "Kacma!",
  "Seni yiyecegim!",
  "Gel buraya!",
  "Canini alacagim!",
  "Nereye kaciyorsun!",
  "Bitti senin isin!",
  "Avim!",
  "Yok edecegim seni!",
  "Korkuyla titreyin!",
  "Bogazini keserim!",
  "Senden korkmuyorum!",
  "Buraya kadar!",
  "Pesini birakmam!",
  "Canavarin gobegi ac!",
  "Olum senin icin geliyor!",
  "Kemiklerini kirarim!",
  "Sonun geldi!",
  "Lanet olasica!",
  "Geri donme!",
  "Yutacagim seni!",
  "Kacis yok!",
  "Bu senin son savasin!",
  "Feryatlarin bana muzik!",
  "Kanini icecegim!",
  "Kurban sensin!",
  "Etine hasir kaldim!",
  "Senden kacis yok!",
  "Ruhunu alacagim!",
  "Son nefesini ver!",
  "Dizlerinin uzerine!",
  "Yardim cagirma bosuna!",
  "Burada bitiyorsun!",
  "Cesedini birakacagim!",
  "Gucumu gosteriyorum!",
  "Teslim ol!",
  "Savasmak anlamsiz!",
  "Seni parcalayacagim!",
  "Golgen bile korkacak!",
  "Senden oncekiler de boyle dedi!",
  "Hazir ol!",
  "Vedalarini et!",
  "Dusmanim sensin!",
  "Bu dunya benim!",
  "Acı cekeceksin!",
  "sus lan",
  "vay vay vay",
  "nereden buldun beni",
  "oyun mu bu lan",
  "dodge at amk",
  "skill issue",
  "L + ratio + skill diff",
  "git gud noob",
  "ez clap",
  "gg wp (yok aslinda)",
  "sen kimsin la",
  "ben senden gucluyum",
  "bu ne hiz amk",
  "hack mi kullaniyon",
  "adil degil bu",
  "tekrar dene (yapamazsin)",
  "touch grass first",
  "tocu toc degil toc",
  "kac kac kac",
  "bekle lan dur",
  "haksizlik bu",
  "op gg yok burada",
  "nereden vuruyo",
  "bu karakter op",
  "nerf pls",
  "buff bize ver",
  "oyun kirici",
  "report",
  "afk mi kaldin",
  "dc ol lan",
  "ping 999",
  "lag var",
  "fps drop yasadim",
  "seni yedim (gercekten)",
  "mid diff",
  "low elo",
  "ranked atma",
  "casual da zor",
  "tilt oldum",
  "mental boom",
  "ff 15",
  "open mid",
  "jungle diff",
  "top gap",
  "adc main degilim",
  "support seni satti",
  "team diff",
  "1v1 atalim (kacma)",
  "ez real",
  "no cap dedim",
  "fr fr",
  "bussin bussin",
  "sheesh",
  "sus among us",
  "red sus",
  "impostor sen degil ben",
  "task bitirdim seni yedim",
  "skill check failed",
  "critical hit (ben vurdum)",
  "rng blessed (ben)",
  "rng cursed (sen)",
  "one shot one kill",
  "nerf this",
  "genji main",
  "widow diff",
  "tank diff",
  "heal nerde",
  "mana yok",
  "cooldown bekliyorum",
  "ultim yok",
  "flash yok",
  "kac saniye kaldi",
  "respawn geliyorum",
  "camping mi yapiyon",
  "rat",
  "sweaty",
  "tryhard",
  "chill oyun oynuyoruz (yok)",
  "ez pz",
  "wp ama kaybettin",
  "gl hf (h f yok)",
  "nt = not true",
  "clutch degil",
  "throw attin",
  "inting",
  "griefing",
  "toxic degilim (toxicim)",
  "gg ez diff",
  "cope",
  "seethe",
  "mald",
  "touch grass",
  "touch void",
  "skill solution: git",
  "ratio + sen oldun",
  "yikes",
  "oof",
  "big oof",
  "rip bozo",
  "cope harder",
  "seethe more",
  "cry about it",
  "mad cuz bad",
  "stay mad",
  "uninstall",
  "alt f4",
  "delete game",
  "go next (to grave)",
  "ff go next",
  "surrender at 20",
  "enemy missing (ben geldim)",
  "ss (too late)",
  "mia (im here)",
  "care",
  "fall back (yok)",
  "group up (to die)",
  "on my way (to kill u)",
  "omw",
  "brb (bringing real pain)",
  "afk 1 min (1 min to live)",
];
const ENEMY_SPEECH_BOSS = [
  "YOK EDECEGIM SENI!",
  "SONUN GELDI!",
  "KORK!",
  "PES ET!",
  "BEN BURADAYIM!",
  "CANINI ALDIM!",
  "LANET OLASICA!",
  "YOK OL!",
  "BEN BOSS!",
  "BIR DAHA GELME!",
  "BURASI BENIM!",
  "KIMSE KURTARAMAZ!",
  "SON SAVAS!",
  "GUCUM SINIRSIZ!",
  "SEN BIR HICSIN!",
  "UNUTMA BENI!",
  "Ruhunu aldim!",
  "EZ BOSS FIGHT",
  "MID DIFF (BOSS WIN)",
  "SKILL ISSUE VS BOSS",
  "GG NO RE",
  "ONE SHOT ONE KILL",
  "ULT CHECK FAILED",
  "NERF ME (no)",
  "BU PHASE 2 DEGIL BITTI",
  "RESPAWN YOK BURDA",
  "L + RATIO + BOSS",
  "GIT GUD NEXT LIFE",
  "EZ CLAP EZ GAME",
  "REPORT TEAM (just u)",
  "FF 15 ACCEPTED",
  "GO NEXT (to hell)",
];

const MEME_DEATH_MESSAGES = [
  "skill issue tbh",
  "git gud",
  "L + ratio",
  "you forgor to dodge",
  "not stonks",
  "press F in chat",
  "gg ez (said the enemies)",
  "bruh moment",
  "your bhop game was weak",
  "should have bought armor",
  "RIP bozo",
  "no cap you got clapped",
  "built different (the enemies)",
  "Yeniden dene – bir dahaki sefere!",
  "Kahramanlık böyle biter.",
  "Düşmanlar seni unutmayacak.",
  "En azından güzel denedin.",
  "XP bir sonraki run’da seni bekliyor.",
  "Restart’a bas, kalk ayağa!",
];

const ACHIEVEMENTS = [
  { id: "first_blood", name: "İlk Kan", desc: "İlk yaratığı öldür.", condition: (s) => (s.kills || 0) >= 1 },
  { id: "killer_10", name: "Avcı", desc: "10 yaratık öldür.", condition: (s) => (s.kills || 0) >= 10 },
  { id: "killer_50", name: "Savaşçı", desc: "50 yaratık öldür.", condition: (s) => (s.kills || 0) >= 50 },
  { id: "killer_100", name: "Katil Makine", desc: "100 yaratık öldür.", condition: (s) => (s.kills || 0) >= 100 },
  { id: "survivor_60", name: "Hayatta Kalan", desc: "60 saniye hayatta kal.", condition: (s) => (s.time || 0) >= 60 },
  { id: "survivor_300", name: "Dayanıklı", desc: "5 dakika hayatta kal.", condition: (s) => (s.time || 0) >= 300 },
  { id: "level_5", name: "Yükselen", desc: "5. seviyeye ulaş.", condition: (s) => (s.level || 0) >= 5 },
  { id: "level_10", name: "Usta", desc: "10. seviyeye ulaş.", condition: (s) => (s.level || 0) >= 10 },
  { id: "boss_slayer", name: "Boss Avcısı", desc: "Bir boss öldür.", condition: (s) => (s.bossesDefeated || 0) >= 1 },
  { id: "coin_collector", name: "Hazine Avcısı", desc: "100 coin topla.", condition: (s) => (s.coins || 0) >= 100 },
  { id: "combo_master", name: "Kombo Ustası", desc: "x10 kombo yap.", condition: (s) => (s.killCombo || 0) >= 10 },
  { id: "chest_opener", name: "Sandık Açıcı", desc: "Bir sandık aç.", condition: (s) => (s.chestsOpened || 0) >= 1 },
  { id: "chapter_2", name: "İkinci Bölüm", desc: "2. bölüme geç.", condition: (s) => (s.chapter || 0) >= 2 },
  { id: "hardcore_enter", name: "Cesur", desc: "Hardcore portala gir.", condition: (s) => !!(s.hardcoreMode) },
  { id: "mega_arena", name: "Mega Arena", desc: "Mega arenaya ulaş.", condition: (s) => !!(s.inMegaArena) },
];
const ACHIEVEMENT_STORAGE_KEY = "ctb_achievements";
function loadAchievements() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}
function saveAchievements(ids) {
  try {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify([...ids]));
  } catch (e) {}
}
function checkAchievements() {
  if (!state.achievementsUnlocked) state.achievementsUnlocked = loadAchievements();
  for (const a of ACHIEVEMENTS) {
    if (state.achievementsUnlocked.has(a.id)) continue;
    if (a.condition(state)) {
      state.achievementsUnlocked.add(a.id);
      saveAchievements(state.achievementsUnlocked);
      showAchievementPopup(a);
    }
  }
}
function showAchievementPopup(a) {
  let el = document.getElementById("achievementPopup");
  if (!el) {
    el = document.createElement("div");
    el.id = "achievementPopup";
    el.style.cssText = "position:fixed;top:80px;left:50%;transform:translateX(-50%);min-width:280px;max-width:360px;padding:14px 20px;background:linear-gradient(135deg,rgba(20,15,35,0.98),rgba(35,25,55,0.95));border:2px solid rgba(255,215,0,0.6);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);z-index:100;pointer-events:none;font-family:var(--retro-font),monospace;animation:achSlide 0.4s ease-out;";
    document.head.appendChild(document.createElement("style")).textContent = "@keyframes achSlide { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }";
    document.body.appendChild(el);
  }
  el.innerHTML = "<div style=\"font-size:9px;color:rgba(255,215,0,0.9);margin-bottom:4px;letter-spacing:0.1em;\">🏆 BAŞARI AÇILDI</div><div style=\"font-size:11px;color:#fff;font-weight:bold;margin-bottom:2px;\">" + a.name + "</div><div style=\"font-size:8px;color:rgba(200,200,220,0.9);\">" + a.desc + "</div>";
  el.classList.remove("hidden");
  el.style.display = "block";
  playSfx(880, 0.14);
  setTimeout(function() { el.style.opacity = "0"; el.style.transition = "opacity 0.5s"; setTimeout(function() { el.style.display = "none"; el.style.opacity = "1"; }, 500); }, 2800);
}

const orbTier = {
  normal: { color: 0x94ff78, emissive: 0x174413, perOrb: 6, maxCount: 7, size: 0.15 },
  magic: { color: 0x67dcff, emissive: 0x133a4f, perOrb: 8, maxCount: 8, size: 0.16 },
  rare: { color: 0xffd06b, emissive: 0x4a3110, perOrb: 10, maxCount: 10, size: 0.18 },
  unique: { color: 0xff97ff, emissive: 0x4e184e, perOrb: 14, maxCount: 14, size: 0.2 },
};

const orbVisualCache = {};

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

const SOUL_ROUND_INTERVAL = 285;
const SOUL_ROUND_DURATION = 60;
const HORDE_SURGE_INTERVAL = 300;
const HORDE_SURGE_DURATION = 30;
let soulRoundSoundEl = null;
function playSoulRoundSound() {
  if ((camSettings.soundVolume || 0) <= 0) return;
  try {
    if (!soulRoundSoundEl) {
      soulRoundSoundEl = new Audio("Fetch me their souls sound.mp3");
      soulRoundSoundEl.volume = Math.min(1, (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1) * 0.4);
    }
    soulRoundSoundEl.volume = Math.min(1, (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1) * 0.4);
    soulRoundSoundEl.currentTime = 0;
    soulRoundSoundEl.play().catch(() => {});
  } catch (e) {}
}

let creeperSoundEl = null;
let pendingCreeperExplosion = null;

function playCreeperExplodeSound(onEnded) {
  if ((camSettings.soundVolume || 0) <= 0) {
    if (typeof onEnded === "function") onEnded();
    return;
  }
  try {
    if (!creeperSoundEl) {
      creeperSoundEl = new Audio("creeper.mp3");
      creeperSoundEl.volume = Math.min(1, (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1) * 0.6);
    }
    creeperSoundEl.volume = Math.min(1, (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1) * 0.6);
    creeperSoundEl.currentTime = 0;
    creeperSoundEl.onended = null;
    creeperSoundEl.play().catch(function() { if (typeof onEnded === "function") onEnded(); });
    setTimeout(function() {
      try {
        if (creeperSoundEl && !creeperSoundEl.paused) {
          creeperSoundEl.pause();
          creeperSoundEl.currentTime = 0;
        }
      } catch (e2) {}
    }, 1000);
    setTimeout(function() {
      if (typeof onEnded === "function") onEnded();
    }, 1200);
  } catch (e) { if (typeof onEnded === "function") onEnded(); }
}

function playExplosionBoom() {
  ensureAudio();
  playSfx(68, 0.5, 0.88);
  if (typeof audioCtx !== "undefined" && audioCtx) {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.25 * (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1), now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

// Retro 8-bit style sound effects (gainMult: 0.5–1 for attack/skill = kısık, daha yumuşak)
function playSfx(freq, duration = 0.08, gainMult = 1) {
  ensureAudio();
  if (!audioCtx) return;
  if (activeSfxCount >= MAX_CONCURRENT_SFX) return;
  activeSfxCount++;
  const now = audioCtx.currentTime;
  const vol = Math.min(1, (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1)) * (typeof gainMult === "number" ? gainMult : 1);
  const f = Math.max(90, Math.min(3000, freq + (Math.random() - 0.5) * 18));
  const d = Math.max(0.025, Math.min(0.35, duration));
  setTimeout(function() { activeSfxCount = Math.max(0, activeSfxCount - 1); }, (d + 0.05) * 1000);

  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(f, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(55, f * 0.55), now + d);

  const osc2 = audioCtx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(f * 0.98, now);
  osc2.frequency.exponentialRampToValueAtTime(Math.max(50, f * 0.5), now + d);

  const noise = audioCtx.createOscillator();
  noise.type = "sawtooth";
  noise.frequency.setValueAtTime(f * 1.6, now);
  noise.frequency.exponentialRampToValueAtTime(f * 0.35, now + d * 0.25);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(3600, f * 3.2), now);
  filter.frequency.exponentialRampToValueAtTime(480, now + d);
  filter.Q.value = 1.5 + Math.random() * 2;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.052 * vol, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + d);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.012 * vol, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + d * 0.18);

  osc.connect(filter);
  osc2.connect(filter);
  noise.connect(noiseGain);
  noiseGain.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + d + 0.01);
  osc2.start(now); osc2.stop(now + d + 0.01);
  noise.start(now); noise.stop(now + d * 0.25 + 0.01);
}

function playSfxShoot() {
  ensureAudio();
  if (!audioCtx) return;
  if (activeSfxCount >= MAX_CONCURRENT_SFX) return;
  activeSfxCount++;
  setTimeout(function() { activeSfxCount = Math.max(0, activeSfxCount - 1); }, 120);
  const now = audioCtx.currentTime;
  const vol = (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1) * 0.28;
  // Megabonk: tok, derin ates sesi – dusuk frekans + kisa punch
  const baseFreq = 165 + Math.random() * 55;
  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(55, baseFreq * 0.45), now + 0.06);
  const oscGain = audioCtx.createGain();
  oscGain.gain.setValueAtTime(0, now);
  oscGain.gain.linearRampToValueAtTime(0.2 * vol, now + 0.008);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  // Yuksek "tik" – tetik hissi
  const tick = audioCtx.createOscillator();
  tick.type = "sawtooth";
  tick.frequency.setValueAtTime(420 + Math.random() * 80, now);
  tick.frequency.exponentialRampToValueAtTime(120, now + 0.03);
  const tickGain = audioCtx.createGain();
  tickGain.gain.setValueAtTime(0.07 * vol, now);
  tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
  // Dusuk bonk – body
  const bonk = audioCtx.createOscillator();
  bonk.type = "sine";
  bonk.frequency.setValueAtTime(72 + Math.random() * 18, now);
  bonk.frequency.exponentialRampToValueAtTime(40, now + 0.055);
  const bonkGain = audioCtx.createGain();
  bonkGain.gain.setValueAtTime(0.11 * vol, now);
  bonkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(380, now + 0.07);
  filter.Q.value = 1.2;
  osc.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(audioCtx.destination);
  tick.connect(tickGain);
  tickGain.connect(audioCtx.destination);
  bonk.connect(bonkGain);
  bonkGain.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + 0.1);
  tick.start(now); tick.stop(now + 0.04);
  bonk.start(now); bonk.stop(now + 0.075);
}

function playSfxHit(freq = 320) {
  ensureAudio();
  if (!audioCtx) return;
  if (activeSfxCount >= MAX_CONCURRENT_SFX) return;
  activeSfxCount++;
  setTimeout(function() { activeSfxCount = Math.max(0, activeSfxCount - 1); }, 80);
  const now = audioCtx.currentTime;
  const vol = (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1);
  // Retro crunch hit
  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq * 1.5, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.2, now + 0.05);
  const noise = audioCtx.createOscillator();
  noise.type = "sawtooth";
  noise.frequency.setValueAtTime(100, now);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.06 * vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  const noiseG = audioCtx.createGain();
  noiseG.gain.setValueAtTime(0.04 * vol, now);
  noiseG.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  osc.connect(gain); gain.connect(audioCtx.destination);
  noise.connect(noiseG); noiseG.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + 0.08);
  noise.start(now); noise.stop(now + 0.05);
}

function playSfxLevel() {
  ensureAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const vol = (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1);
  // Retro level up fanfare
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = "square";
    const t = now + i * 0.08;
    osc.frequency.setValueAtTime(f, t);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.055 * vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.14);
  });
  // Shimmer
  const shimmer = audioCtx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(2093, now);
  shimmer.frequency.exponentialRampToValueAtTime(4186, now + 0.4);
  const sg = audioCtx.createGain();
  sg.gain.setValueAtTime(0.02 * vol, now);
  sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  shimmer.connect(sg); sg.connect(audioCtx.destination);
  shimmer.start(now); shimmer.stop(now + 0.42);
}

// Arka plan muzigi: Web Audio ile sentezlenen dongu (MP3 yoksa kullanilir)
function startBgMusic() {
  ensureAudio();
  if (gameMusicAudio && !gameMusicAudio.paused) return;
  if (!audioCtx || bgMusicPlaying) return;
  if (audioCtx.state === "suspended") {
    audioCtx.resume().then(() => { startBgMusic(); }).catch(() => {});
    return;
  }
  bgMusicPlaying = true;
  bgMusicGain = audioCtx.createGain();
  bgMusicGain.gain.value = 0.04 * (camSettings.soundVolume || 1) * (camSettings.musicVolume ?? 1);
  bgMusicGain.connect(audioCtx.destination);

  var baseTime = audioCtx.currentTime;
  var barDuration = 2.0;
  var chordFreqs = [220, 261.63, 329.63]; // A3, C4, E4 (Am)
  var melodyFreqs = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25]; // C major scale
  var step = 0;

  function scheduleBar() {
    if (!bgMusicPlaying || !audioCtx || !bgMusicGain) return;
    var now = audioCtx.currentTime;
    var vol = 0.04 * (camSettings.soundVolume || 1) * (camSettings.musicVolume ?? 1);

    // Yumusak pad: uc not
    for (var i = 0; i < chordFreqs.length; i++) {
      var osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(chordFreqs[i] * (0.98 + Math.random() * 0.04), now);
      var g = audioCtx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.12 * vol, now + 0.15);
      g.gain.setValueAtTime(0.12 * vol, now + barDuration * 0.7);
      g.gain.linearRampToValueAtTime(0, now + barDuration);
      osc.connect(g);
      g.connect(bgMusicGain);
      osc.start(now);
      osc.stop(now + barDuration);
    }

    // Hafif melodi: tek not
    var melFreq = melodyFreqs[step % melodyFreqs.length];
    var melOsc = audioCtx.createOscillator();
    melOsc.type = "triangle";
    melOsc.frequency.setValueAtTime(melFreq, now);
    var melG = audioCtx.createGain();
    melG.gain.setValueAtTime(0, now);
    melG.gain.linearRampToValueAtTime(0.2 * vol, now + 0.03);
    melG.gain.linearRampToValueAtTime(0, now + 0.35);
    melOsc.connect(melG);
    melG.connect(bgMusicGain);
    melOsc.start(now);
    melOsc.stop(now + 0.35);
    step++;

    bgMusicLoopHandle = setTimeout(scheduleBar, barDuration * 1000);
  }

  scheduleBar();
}

function stopBgMusic() {
  bgMusicPlaying = false;
  if (bgMusicLoopHandle) {
    clearTimeout(bgMusicLoopHandle);
    bgMusicLoopHandle = null;
  }
  if (bgMusicAudio) {
    try { bgMusicAudio.pause(); bgMusicAudio.currentTime = 0; } catch (e) {}
  }
  if (gameMusicAudio) {
    try { gameMusicAudio.pause(); gameMusicAudio.currentTime = 0; } catch (e) {}
  }
  if (bgMusicGain && audioCtx) {
    try { bgMusicGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5); } catch (e) {}
  }
}

function updateMusicVolume() {
  if (bgMusicGain && audioCtx) {
    bgMusicGain.gain.setValueAtTime(0.04 * (camSettings.soundVolume || 1) * (camSettings.musicVolume ?? 1), audioCtx.currentTime);
  }
  if (gameMusicAudio) {
    gameMusicAudio.volume = GAME_MUSIC_VOLUME * (camSettings.soundVolume || 1) * (camSettings.musicVolume ?? 1);
  }
}

const GAME_MUSIC_FILE = "background.mp3";
const GAME_MUSIC_VOLUME = 0.08;
let gameMusicAudio = null;

function startGameMusic() {
  if (bgMusicPlaying) return;
  bgMusicPlaying = true;
  try {
    if (!gameMusicAudio) gameMusicAudio = new Audio();
    gameMusicAudio.src = GAME_MUSIC_FILE;
    gameMusicAudio.volume = GAME_MUSIC_VOLUME * (camSettings.soundVolume || 1) * (camSettings.musicVolume ?? 1);
    gameMusicAudio.loop = true;
    gameMusicAudio.play().then(function() {}).catch(function() {
      bgMusicPlaying = false;
      startBgMusic();
    });
  } catch (e) {
    bgMusicPlaying = false;
    startBgMusic();
  }
}

const MENU_TRACKS = ["menu1.mp3", "menu2.mp3", "menu3.mp3", "menu4.mp3", "menu5.mp3", "menu6.mp3", "menu7.mp3"];
const MENU_MUSIC_VOLUME = 0.05;
let menuMusicAudio = null;
let menuMusicOnEnded = null;

function playNextMenuTrack() {
  if (!menuMusicAudio) return;
  const src = MENU_TRACKS[Math.floor(Math.random() * MENU_TRACKS.length)];
  menuMusicAudio.src = src;
  menuMusicAudio.volume = MENU_MUSIC_VOLUME * (typeof camSettings !== "undefined" && camSettings ? (camSettings.musicVolume ?? 1) : 1);
  menuMusicAudio.play().catch(function() {});
}

function startMenuMusic() {
  if (typeof stopBgMusic === "function") stopBgMusic();
  stopMenuMusic();
  try {
    menuMusicAudio = new Audio();
    menuMusicOnEnded = function() { playNextMenuTrack(); };
    menuMusicAudio.addEventListener("ended", menuMusicOnEnded);
    playNextMenuTrack();
  } catch (e) {}
}

function stopMenuMusic() {
  if (menuMusicAudio) {
    try {
      if (menuMusicOnEnded) menuMusicAudio.removeEventListener("ended", menuMusicOnEnded);
      menuMusicOnEnded = null;
      menuMusicAudio.pause();
      menuMusicAudio.currentTime = 0;
    } catch (e) {}
  }
}

const skills = [
  { id: "dmg", name: "Hasar +7%", desc: "Tum hasar kaynaklari artar.", max: 8, rarity: "common", tierRange: [2, 10], apply(tv) { const pct = tv != null ? tv : 7; stats.damage *= (1 + pct / 100); } },
  { id: "firerate", name: "Atis hizi +4%", desc: "Daha sik otomatik ates.", max: 8, rarity: "common", tierRange: [2, 7], apply(tv) { const pct = tv != null ? tv : 4; stats.fireRate *= (1 - pct / 100); } },
  { id: "multishot", name: "Coklu Mermi +1", desc: "Ana atista +1 mermi.", max: 4, rarity: "magic", apply() { stats.multiShot += 1; } },
  { id: "speed", name: "Hareket hizi +4%", desc: "WASD daha hizli.", max: 8, rarity: "common", tierRange: [2, 8], apply(tv) { const pct = tv != null ? tv : 4; stats.moveSpeed *= (1 + pct / 100); } },
  { id: "hp", name: "Max HP +12", desc: "Can havuzu buyur.", max: 6, rarity: "common", tierRange: [8, 18], apply(tv) { const v = tv != null ? tv : 12; stats.maxHp += v; stats.hp = Math.min(stats.maxHp, stats.hp + v); } },
  { id: "heal", name: "Can doldur", desc: "Anlik %24 iyilesme.", max: 5, rarity: "magic", tierRange: [16, 32], apply(tv) { const pct = tv != null ? tv : 24; stats.hp = Math.min(stats.maxHp, stats.hp + stats.maxHp * (pct / 100)); } },
  { id: "crit", name: "Kritik sans +8%", desc: "Kritik vurma ihtimali artar. (%0-100 arasi)", max: 12, rarity: "magic", tierRange: [4, 12], apply(tv) { const pct = tv != null ? tv : 8; stats.critChance = Math.min(1, (stats.critChance || 0) + pct / 100); } },
  { id: "crit_dmg", name: "Kritik hasar +25%", desc: "Kritik vurdugunda ekstra hasar carpani.", max: 8, rarity: "rare", tierRange: [15, 35], apply(tv) { const pct = tv != null ? tv : 25; stats.critDmgBonus = (stats.critDmgBonus || 0) + pct / 100; stats.critMult = (stats.critMult || 1.9) + pct / 100; } },
  { id: "pierce", name: "Delme +1", desc: "Mermiler ekstra hedef deler.", max: 4, rarity: "magic", apply() { stats.pierce += 1; } },
  { id: "aoe", name: "Patlama alani", desc: "Vurusta kucuk AOE patlar.", max: 4, rarity: "magic", apply() { stats.aoe += 1; } },
  { id: "pickup", name: "Toplama yaricapi", desc: "XP orb toplama mesafesi artar.", max: 7, rarity: "common", tierRange: [8, 16], apply(tv) { const pct = tv != null ? tv : 12; stats.pickupRange *= (1 + pct / 100); } },
  { id: "magnet", name: "Magnet menzil", desc: "Orblar uzaktan cekilir.", max: 7, rarity: "magic", tierRange: [6, 14], apply(tv) { const pct = tv != null ? tv : 10; stats.magnetRange *= (1 + pct / 100); } },
  { id: "magnet_force", name: "Magnet gucu", desc: "Orblar daha hizli akar.", max: 7, rarity: "magic", tierRange: [10, 24], apply(tv) { const pct = tv != null ? tv : 18; stats.magnetStrength *= (1 + pct / 100); } },
  { id: "unlock_fireball", name: "Fireball", desc: "Otomatik fireball ac.", max: 1, rarity: "rare", apply() { abilityState.fireball.level = 1; ownedSkills.add("fireball"); } },
  { id: "fireball_dmg", name: "Fireball hasar", desc: "Fireball daha guclu olur.", max: 5, rarity: "magic", requires: "fireball", apply() { abilityState.fireball.damage *= 1.1; } },
  { id: "fireball_cd", name: "Fireball hiz", desc: "Fireball daha sik cikar.", max: 4, rarity: "magic", requires: "fireball", apply() { abilityState.fireball.cooldown *= 0.95; } },
  { id: "fireball_proj_speed", name: "Fireball mermi hizi", desc: "Fireball mermisi daha hizli gider.", max: 4, rarity: "magic", requires: "fireball", apply() { abilityState.fireball.speedMult = (abilityState.fireball.speedMult || 1) * 1.15; } },
  { id: "unlock_comet", name: "Comet", desc: "Delici comet ac.", max: 1, rarity: "rare", apply() { abilityState.comet.level = 1; ownedSkills.add("comet"); } },
  { id: "comet_dmg", name: "Comet hasar", desc: "Comet daha sert vurur.", max: 5, rarity: "magic", requires: "comet", apply() { abilityState.comet.damage *= 1.06; } },
  { id: "comet_cd", name: "Comet hiz", desc: "Comet cooldown azalir.", max: 4, rarity: "magic", requires: "comet", apply() { abilityState.comet.cooldown *= 0.94; } },
  { id: "comet_proj_speed", name: "Comet mermi hizi", desc: "Comet mermisi daha hizli.", max: 4, rarity: "magic", requires: "comet", apply() { abilityState.comet.speedMult = (abilityState.comet.speedMult || 1) * 1.12; } },
  { id: "unlock_swords", name: "Kiliclar", desc: "Etrafinda donen kiliclar.", max: 1, rarity: "rare", apply() { abilityState.swords.level = 1; ownedSkills.add("swords"); } },
  { id: "sword_count", name: "Kilic +1", desc: "Bir kilic daha doner.", max: 5, rarity: "rare", requires: "swords", apply() { abilityState.swords.count += 1; } },
  { id: "sword_dmg", name: "Kilic hasar", desc: "Kilic temas hasari artar.", max: 5, rarity: "magic", requires: "swords", apply() { abilityState.swords.damage *= 1.06; } },
  { id: "unlock_meteor", name: "Meteor", desc: "Hedefe meteor dusurur.", max: 1, rarity: "unique", apply() { abilityState.meteor.level = 1; ownedSkills.add("meteor"); } },
  { id: "meteor_dmg", name: "Meteor hasar", desc: "Meteor impact hasari artar.", max: 4, rarity: "rare", requires: "meteor", apply() { abilityState.meteor.damage *= 1.07; } },
  { id: "meteor_radius", name: "Meteor alan", desc: "Meteor alani buyur.", max: 4, rarity: "rare", requires: "meteor", apply() { abilityState.meteor.radius += 0.35; } },
  { id: "meteor_cd", name: "Meteor hiz", desc: "Meteor daha sik gelir.", max: 4, rarity: "rare", requires: "meteor", apply() { abilityState.meteor.cooldown *= 0.94; } },
  { id: "unlock_nova", name: "Nova", desc: "Yakinda patlayan enerji halkasi.", max: 1, rarity: "rare", apply() { abilityState.nova.level = 1; ownedSkills.add("nova"); } },
  { id: "nova_dmg", name: "Nova hasar", desc: "Nova hasari artar.", max: 4, rarity: "magic", requires: "nova", apply() { abilityState.nova.damage *= 1.06; } },
  { id: "nova_radius", name: "Nova alan", desc: "Nova capi buyur.", max: 4, rarity: "magic", requires: "nova", apply() { abilityState.nova.radius += 0.3; } },
  { id: "nova_cd", name: "Nova hiz", desc: "Nova daha sik tetiklenir.", max: 4, rarity: "magic", requires: "nova", apply() { abilityState.nova.cooldown *= 0.94; } },
  { id: "unlock_chain", name: "Zincir Yildirim", desc: "Vuruslar yakin hedefe seker.", max: 1, rarity: "rare", apply() { stats.chain = (stats.chain || 0) + 2; } },
  { id: "chain_plus", name: "Zincir +1", desc: "Ek zincir hedef.", max: 4, rarity: "magic", requires: "unlock_chain", apply() { stats.chain += 1; } },
  { id: "unlock_shield", name: "Enerji Kalkan", desc: "Anlik +50 kalkan.", max: 1, rarity: "magic", apply() { stats.shield = (stats.shield || 0) + 50; } },
  { id: "shield_regen", name: "Kalkan Regen", desc: "Kalkan tazelenir.", max: 4, rarity: "rare", requires: "unlock_shield", apply() { stats.shield = Math.min(stats.maxHp, stats.shield + 25); } },
  { id: "bleed", name: "Kanama", desc: "Vuruslar kanama (bleed) dot birakir.", max: 5, rarity: "magic", apply() { stats.bleed = (stats.bleed || 0) + 0.5; } },
  { id: "impact", name: "Knockback +", desc: "Geri itme artar.", max: 4, rarity: "common", apply() { stats.knockback += 0.6; } },
  { id: "freeze", name: "Freeze Buildup", desc: "Vuruslar %8 freeze stack ekler.", max: 6, rarity: "magic", tierRange: [5, 12], apply(tv) { const v = tv != null ? tv / 100 : 0.08; stats.freeze = (stats.freeze || 0) + v; } },
  { id: "burn", name: "Yanma", desc: "Vuruslar saniyede 6 yanik verir.", max: 6, rarity: "magic", tierRange: [4, 9], apply(tv) { const v = tv != null ? tv : 6; stats.burn = (stats.burn || 0) + v; } },
  { id: "shock", name: "Sok", desc: "Vuruslar %10 ekstra sok hasari.", max: 6, rarity: "magic", tierRange: [6, 14], apply(tv) { const pct = tv != null ? tv : 10; stats.shock = (stats.shock || 0) + pct / 100; } },
  { id: "splash", name: "Splash", desc: "Vuruslar kucuk splash vurur.", max: 4, rarity: "magic", apply() { stats.aoe += 0.8; } },
  { id: "pack_frost", name: "Frost Build", desc: "Freeze etkisi %50 artar.", max: 1, rarity: "unique", apply() { stats.freeze = (stats.freeze || 0) * 1.5 + 0.1; } },
  { id: "pack_fire", name: "Fire Build", desc: "Yanma hasari 2x.", max: 1, rarity: "unique", apply() { stats.burn = (stats.burn || 0) * 2 + 8; } },
  { id: "pack_shock", name: "Shock Build", desc: "Sok %20 crit ekler.", max: 1, rarity: "unique", apply() { stats.critChance = Math.min(1, (stats.critChance || 0) + 0.2); stats.shock = (stats.shock || 0) + 0.15; } },
  { id: "unlock_frostball", name: "Frostball", desc: "Ucarak donma veren orb atar.", max: 1, rarity: "rare", apply() { abilityState.frostball.level = 1; ownedSkills.add("frostball"); } },
  { id: "frostball_dmg", name: "Frostball hasar", desc: "Frostball daha guclu.", max: 4, rarity: "magic", requires: "unlock_frostball", apply() { abilityState.frostball.damage *= 1.1; } },
  { id: "frostball_freeze", name: "Frostball Freeze", desc: "Freeze suresi artar.", max: 3, rarity: "magic", requires: "unlock_frostball", apply() { abilityState.frostball.freeze += 0.6; } },
  { id: "frostball_shards", name: "Frost Shatter", desc: "Patlayinca shard sacar.", max: 3, rarity: "rare", requires: "unlock_frostball", apply() { abilityState.frostball.shards += 1; } },
  { id: "comp_phoenix", name: "Companion: Phoenix", desc: "Ates atan yoldas.", max: 1, rarity: "rare", apply() { addCompanion("phoenix"); } },
  { id: "comp_drone", name: "Companion: Drone", desc: "Hizli tarama drone'u.", max: 1, rarity: "rare", apply() { addCompanion("drone"); } },
  { id: "comp_golem", name: "Companion: Golem", desc: "Yakin tank yoldas.", max: 1, rarity: "rare", apply() { addCompanion("golem"); } },
  { id: "comp_skeleton_minion", name: "Minyon: Iskelet", desc: "Kemik modeli yaratik; uzaktan kemik atar.", max: 1, rarity: "rare", apply() { addCompanion("skeleton_minion"); } },
  { id: "comp_wolf_minion", name: "Minyon: Kurt", desc: "Kurt modeli yaratik; yakin savas vurur.", max: 1, rarity: "rare", apply() { addCompanion("wolf_minion"); } },
  { id: "comp_goblin_minion", name: "Minyon: Goblin", desc: "Zehirli ok atar; vurdugu yaratik zehirlenir.", max: 1, rarity: "magic", apply() { addCompanion("goblin_minion"); } },
  { id: "comp_healer_minion", name: "Minyon: Sifa", desc: "Oyuncuya yakin durur, periyodik can verir.", max: 1, rarity: "magic", apply() { addCompanion("healer_minion"); } },
  { id: "comp_archer_minion", name: "Minyon: Okcu", desc: "Uzun menzil ok atar.", max: 1, rarity: "rare", apply() { addCompanion("archer_minion"); } },
  { id: "comp_mage_minion", name: "Minyon: Buyucu", desc: "Kucuk alan hasari (AoE) vurur.", max: 1, rarity: "rare", apply() { addCompanion("mage_minion"); } },
  { id: "minyon_sayisi", name: "Minyon +1", desc: "Maksimum minyon sayisi +1 (en fazla 6).", max: 3, rarity: "magic", apply() { stats.maxCompanions = Math.min(6, (stats.maxCompanions || 3) + 1); } },
  { id: "unlock_frost_nova", name: "Frost Nova (E)", desc: "Yakin donma alani. E tusu.", max: 1, rarity: "rare", apply() { specialUnlocks.frostNova = true; } },
  { id: "unlock_dash", name: "Dash (R)", desc: "Hizli kacis. R tusu.", max: 1, rarity: "rare", apply() { specialUnlocks.dash = true; } },
  { id: "unlock_sprint", name: "Kosu", desc: "Shift ile kos (stamina tuketir). C ile kacis.", max: 1, rarity: "common", apply() { stats.sprintUnlocked = true; } },
  { id: "unlock_meteor_ult", name: "Meteor Yagmuru (T)", desc: "Coklu meteor. T tusu.", max: 1, rarity: "legendary", apply() { specialUnlocks.meteorUlt = true; } },
  { id: "static_shiv", name: "Statik Hancer", desc: "Her 3 vurusta yildirim zinciri (LoL gibi).", max: 1, rarity: "rare", apply() { stats.staticShiv = (stats.staticShiv || 0) + 1; } },
  { id: "unlock_turret", name: "Turret", desc: "F ile 1 turret yerlestirir (8sn cd).", max: 1, rarity: "rare", apply() { specialUnlocks.turret = true; } },
  { id: "unlock_explosion", name: "Patlama (X)", desc: "X ile AoE patlama. 8sn cd. Patlama sesi.", max: 1, rarity: "rare", apply() { specialUnlocks.explosion = true; } },
  { id: "unlock_ult_mega_explosion", name: "Ulti: Mega Patlama (Y)", desc: "2dk cd. Dev alan patlamasi.", max: 1, rarity: "legendary", apply() { stateUltimate = { id: "mega_explosion", cooldown: ULT_DEFS.mega_explosion.cooldown, timer: 0 }; } },
  { id: "unlock_ult_ice_apocalypse", name: "Ulti: Buz Apokalipsi (Y)", desc: "2dk cd. Buyuk donma + hasar alani.", max: 1, rarity: "legendary", apply() { stateUltimate = { id: "ice_apocalypse", cooldown: ULT_DEFS.ice_apocalypse.cooldown, timer: 0 }; } },
  { id: "unlock_ult_lightning_storm", name: "Ulti: Yildirim Firtinasi (Y)", desc: "2dk cd. Birden fazla yildirim carpar.", max: 1, rarity: "legendary", apply() { stateUltimate = { id: "lightning_storm", cooldown: ULT_DEFS.lightning_storm.cooldown, timer: 0 }; } },
  { id: "unlock_ult_inferno", name: "Ulti: Inferno (Y)", desc: "2dk cd. Ates alani + yanik.", max: 1, rarity: "legendary", apply() { stateUltimate = { id: "inferno", cooldown: ULT_DEFS.inferno.cooldown, timer: 0 }; } },
  { id: "unlock_ult_void_blast", name: "Ulti: Void Patlamasi (Y)", desc: "2dk cd. Karanlik enerji patlamasi.", max: 1, rarity: "legendary", apply() { stateUltimate = { id: "void_blast", cooldown: ULT_DEFS.void_blast.cooldown, timer: 0 }; } },
  { id: "turret_slot_2", name: "Turret +1", desc: "Maksimum 2 turret.", max: 1, rarity: "magic", requires: "unlock_turret", apply() { stats.maxTurrets = Math.max(stats.maxTurrets || 1, 2); } },
  { id: "turret_slot_3", name: "Turret +2", desc: "Maksimum 3 turret.", max: 1, rarity: "magic", requires: "turret_slot_2", apply() { stats.maxTurrets = Math.max(stats.maxTurrets || 1, 3); } },
  { id: "turret_slot_4", name: "Turret +3", desc: "Maksimum 4 turret.", max: 1, rarity: "rare", requires: "turret_slot_3", apply() { stats.maxTurrets = Math.max(stats.maxTurrets || 1, 4); } },
  { id: "turret_master", name: "Turret Ustasi", desc: "Turret suresi +10sn, hasar +20%.", max: 1, rarity: "magic", requires: "unlock_turret", apply() { } },
  { id: "lifesteal", name: "Vampirizm", desc: "Vuruslarin can verir (maks %1).", max: 5, rarity: "magic", tierRange: [0.15, 0.28], apply(tv) { const v = tv != null ? tv / 100 : 0.002; stats.lifesteal = (stats.lifesteal || 0) + v; } },
  { id: "thorns", name: "Dikenli Zirh", desc: "Temas hasarinin %25'ini yansitir.", max: 4, rarity: "rare", tierRange: [18, 32], apply(tv) { const pct = tv != null ? tv : 25; stats.thorns = (stats.thorns || 0) + pct / 100; } },
  { id: "heal_on_kill", name: "Olumle Doy", desc: "Her oldurmede +4 can.", max: 6, rarity: "magic", tierRange: [2, 6], apply(tv) { const v = tv != null ? tv : 4; stats.healOnKill = (stats.healOnKill || 0) + v; } },
  { id: "armor", name: "Zirh", desc: "Alinan hasar %8 azalir.", max: 5, rarity: "common", tierRange: [4, 12], apply(tv) { const pct = tv != null ? tv : 8; stats.armor = (stats.armor || 0) + pct / 100; } },
  { id: "execute", name: "Infaz", desc: "%35 alti cana +%40 hasar.", max: 3, rarity: "rare", tierRange: [28, 50], apply(tv) { const pct = tv != null ? tv : 40; stats.execute = (stats.execute || 0) + pct / 100; } },
  { id: "berserker", name: "Berserker", desc: "Canin %40 altindayken +%35 hasar.", max: 3, rarity: "rare", tierRange: [25, 45], apply(tv) { const pct = tv != null ? tv : 35; stats.berserker = (stats.berserker || 0) + pct / 100; } },
  { id: "double_jump", name: "Cift Ziplama", desc: "Havada bir kez daha zipla.", max: 1, rarity: "magic", apply() { stats.doubleJump = (stats.doubleJump || 0) + 1; } },
  { id: "ricochet", name: "Sekme", desc: "Mermiler bir dusmana sekebilir (LoL RFC gibi).", max: 1, rarity: "rare", apply() { stats.ricochet = (stats.ricochet || 0) + 1; } },
  { id: "runaan", name: "Runaan Firtinasi", desc: "Vuruslar 2 yakin dusmana %60 hasar yansir (LoL Runaan).", max: 1, rarity: "rare", apply() { stats.runaan = (stats.runaan || 0) + 1; } },
  { id: "rapid_fire", name: "Hizli Ates", desc: "Atis hizi +%18, ilk vurus +%25 hasar (LoL Rapid Fire).", max: 3, rarity: "magic", apply() { stats.fireRate *= 0.85; stats.rapidFireFirstHit = (stats.rapidFireFirstHit || 0) + 0.25; } },
  { id: "global_cd", name: "Hizli Eller", desc: "Tum yetenek cooldown %6 azalir.", max: 4, rarity: "magic", apply() { stats.globalCdReduction = (stats.globalCdReduction || 0) + 0.06; } },
  { id: "lucky", name: "Sansli", desc: "Kritik sans +%5, XP +%10.", max: 4, rarity: "magic", apply() { stats.critChance = Math.min(1, (stats.critChance || 0) + 0.05); stats.xpGainMult *= 1.1; } },
  { id: "sans", name: "Sans", desc: "Her seyde biraz sans! Crit +3%, drop +15%, XP +8%.", max: 6, rarity: "common", apply() { stats.critChance = Math.min(1, (stats.critChance || 0) + 0.03); stats.xpGainMult *= 1.08; } },
  { id: "glass_cannon", name: "Cam Top", desc: "Hasar +40% ama max HP -20%.", max: 2, rarity: "unique", apply() { stats.damage *= 1.4; stats.maxHp *= 0.8; stats.hp = Math.min(stats.hp, stats.maxHp); } },
  { id: "tank_mode", name: "Tank Modu", desc: "Max HP +50, Zirh +8%, Hiz -10%.", max: 3, rarity: "rare", apply() { stats.maxHp += 50; stats.hp += 50; stats.armor += 0.08; stats.moveSpeed *= 0.9; } },
  { id: "bhop_master", name: "Bhop Ustasi", desc: "Bhop hiz bonusu +30% daha etkili.", max: 3, rarity: "magic", apply() { /* handled in bhop calc */ } },
  { id: "magnet_aura", name: "Magnet Aura", desc: "XP orblar sana kosar. Magnet +50%.", max: 3, rarity: "common", apply() { stats.magnetRange *= 1.5; stats.magnetStrength *= 1.3; } },
  { id: "last_stand", name: "Son Direnis", desc: "Canin %20 altindayken hasar %25 azalir.", max: 1, rarity: "unique", apply() { stats.lastStand = true; } },
  { id: "poison_cloud", name: "Zehir Bulutu", desc: "Oldurmede kucuk zehir alani.", max: 1, rarity: "magic", apply() { stats.poisonCloud = (stats.poisonCloud || 0) + 1; } },
  { id: "unlock_toxic_trail", name: "Toxic Iz", desc: "Yururken yere yesil zehir birakir.", max: 1, rarity: "magic", apply() { stats.toxicTrail = (stats.toxicTrail || 0) + 1; } },
  { id: "toxic_trail_radius", name: "Toxic Alan", desc: "Toxic iz alani genisler.", max: 3, rarity: "magic", requires: "unlock_toxic_trail", apply() { stats.toxicTrailRadius = (stats.toxicTrailRadius ?? 2.2) + 0.5; } },
  { id: "toxic_trail_poison", name: "Toxic Zehir", desc: "Izdeki zehir suresi ve gucu artar.", max: 3, rarity: "magic", requires: "unlock_toxic_trail", apply() { stats.toxicTrailPoison = (stats.toxicTrailPoison ?? 2.0) + 0.5; } },
  { id: "xp_gain", name: "XP Cekici", desc: "Toplanan XP %15 artar.", max: 5, rarity: "common", tierRange: [8, 22], apply(tv) { const pct = tv != null ? tv : 15; stats.xpGainMult = (stats.xpGainMult || 1) * (1 + pct / 100); } },
  { id: "xp_magnet", name: "Bilgi Magneti", desc: "XP orblari daha hizli gelir.", max: 3, rarity: "magic", tierRange: [8, 16], apply(tv) { const pct = tv != null ? tv : 12; stats.xpGainMult = (stats.xpGainMult || 1) * (1 + pct / 100); stats.magnetStrength *= (1 + pct / 100); } },
  { id: "proj_speed", name: "Mermi Hizi", desc: "Tum mermi ve skill hizi %20 artar.", max: 5, rarity: "magic", tierRange: [12, 28], apply(tv) { const pct = tv != null ? tv : 20; stats.projectileSpeedMult = (stats.projectileSpeedMult || 1) * (1 + pct / 100); } },
  { id: "unlock_banana", name: "Muz Firlatma", desc: "Hedefe muz firlatir, sersemletir.", max: 1, rarity: "rare", apply() { abilityState.banana.level = 1; ownedSkills.add("banana"); } },
  { id: "banana_dmg", name: "Muz Hasar", desc: "Muz daha sert vurur.", max: 4, rarity: "common", requires: "unlock_banana", apply() { abilityState.banana.damage *= 1.12; } },
  { id: "banana_proj_speed", name: "Muz mermi hizi", desc: "Firlatilan muz daha hizli gider.", max: 4, rarity: "magic", requires: "unlock_banana", apply() { abilityState.banana.speedMult = (abilityState.banana.speedMult || 1) * 1.14; } },
  { id: "unlock_sword_throw", name: "Kilic Firlatma", desc: "Donen kilic firlatir, geri doner.", max: 1, rarity: "rare", apply() { abilityState.swordThrow.level = 1; ownedSkills.add("swordThrow"); } },
  { id: "sword_throw_dmg", name: "Firlatma Hasar", desc: "Firlatilan kilic hasari artar.", max: 4, rarity: "magic", requires: "unlock_sword_throw", apply() { abilityState.swordThrow.damage *= 1.12; } },
  { id: "unlock_boomerang", name: "Bumerang", desc: "Bumerang firlatir, geri doner.", max: 1, rarity: "rare", apply() { abilityState.boomerang.level = 1; ownedSkills.add("boomerang"); } },
  { id: "boomerang_dmg", name: "Bumerang Hasar", desc: "Bumerang daha sert vurur.", max: 4, rarity: "magic", requires: "unlock_boomerang", apply() { abilityState.boomerang.damage *= 1.1; } },
  { id: "unlock_shuriken", name: "Shuriken", desc: "Uc shuriken firlatir.", max: 1, rarity: "rare", apply() { abilityState.shuriken.level = 1; ownedSkills.add("shuriken"); } },
  { id: "shuriken_dmg", name: "Shuriken Hasar", desc: "Shuriken daha keskin.", max: 4, rarity: "magic", requires: "unlock_shuriken", apply() { abilityState.shuriken.damage *= 1.12; } },
  { id: "unlock_bomb", name: "Bomba", desc: "Yaratiklara dogru bomba atar, yere dusunce patlar.", max: 1, rarity: "rare", apply() { abilityState.bomb.level = 1; ownedSkills.add("bomb"); } },
  { id: "bomb_dmg", name: "Bomba Hasar", desc: "Patlama hasari artar.", max: 4, rarity: "magic", requires: "unlock_bomb", apply() { abilityState.bomb.damage *= 1.18; } },
  { id: "bomb_radius", name: "Bomba Alani", desc: "Patlama yaricapi genisler.", max: 3, rarity: "magic", requires: "unlock_bomb", apply() { abilityState.bomb.explosionRadius += 0.8; } },
  { id: "banana_orbit", name: "Muz Halkasi", desc: "Etrafinda donen muzlar.", max: 3, rarity: "magic", requires: "unlock_banana", apply() { abilityState.banana.count = Math.min(6, (abilityState.banana.count || 2) + 1); } },
  // NEW CARDS
  { id: "coin_hunter", name: "Coin Avcisi", desc: "Yaratiklar %50 daha fazla coin dusurur.", max: 3, rarity: "common", apply() { stats.coinMult = (stats.coinMult || 1) * 1.5; } },
  { id: "mana_boost", name: "Mana Havuzu", desc: "Max mana +25.", max: 5, rarity: "common", apply() { state.maxMana += 25; state.mana += 25; } },
  { id: "rage_mode", name: "Gazap Modu", desc: "Can %40 altinda +50% hasar (tek stack).", max: 1, rarity: "legendary", apply() { stats.berserkerLegendary = true; } },
  { id: "thorns_plus", name: "Diken Zirh+", desc: "Dikenli zirh %30 daha guclu.", max: 3, rarity: "magic", requires: "thorns", apply() { stats.thorns = (stats.thorns || 0) + 0.3; } },
  { id: "dodge", name: "Kacis Refleksi", desc: "%8 sans ile saldiridan kacinirsin.", max: 4, rarity: "rare", apply() { stats.dodgeChance = (stats.dodgeChance || 0) + 0.08; } },
  { id: "chain_lightning", name: "Zincir Yildirim", desc: "Mermiler %15 sans ile yakin dusmana ziplar.", max: 3, rarity: "unique", apply() { stats.chainLightning = (stats.chainLightning || 0) + 0.15; } },
  { id: "vampiric", name: "Vampir Disi", desc: "Verilen hasarin can olarak doner (maks %1).", max: 4, rarity: "magic", apply() { stats.lifesteal = (stats.lifesteal || 0) + 0.0025; } },
  { id: "explosive_shot", name: "Patlayici Mermi", desc: "Mermiler patlayarak AoE hasar verir.", max: 3, rarity: "rare", apply() { stats.aoe += 0.8; } },
  { id: "frost_aura", name: "Buz Aurasi", desc: "Yakin dusmanlar yavaslar.", max: 2, rarity: "magic", apply() { stats.frostAura = (stats.frostAura || 0) + 1; } },
  { id: "gold_rush", name: "Altin Zamani", desc: "Kill basina ekstra coin + %10 XP.", max: 3, rarity: "common", apply() { stats.coinMult = (stats.coinMult || 1) * 1.2; stats.xpGainMult = (stats.xpGainMult || 1) * 1.1; } },
  { id: "heavy_armor", name: "Agir Zirh", desc: "Max HP +40 ama hiz -%5.", max: 3, rarity: "common", apply() { stats.maxHp += 40; stats.hp += 40; stats.moveSpeed *= 0.95; } },
  { id: "shadow_clone", name: "Golge Kopya", desc: "Bazen mermilerinin kopyasini atar.", max: 2, rarity: "legendary", apply() { stats.multiShot += 1; } },
  { id: "regen", name: "Rejenerasyon", desc: "Saniyede 1 can yenile.", max: 5, rarity: "common", apply() { stats.regen = (stats.regen || 0) + 1; } },
  { id: "critical_master", name: "Krit Ustasi", desc: "Krit sansi +12%, krit hasar carpani +30%.", max: 4, rarity: "rare", apply() { stats.critChance = Math.min(1, (stats.critChance || 0) + 0.12); stats.critMult = (stats.critMult || 1.9) + 0.30; } },
  { id: "fire_trail", name: "Ates Izi", desc: "Yurudugun yerde ates birak, dusmanlar yanar.", max: 2, rarity: "unique", apply() { stats.fireTrail = (stats.fireTrail || 0) + 1; } },
  { id: "bloodlust", name: "Kan Susuzlugu", desc: "Oldurmeden sonra 3 sn +%20 hasar.", max: 3, rarity: "magic", apply() { stats.bloodlust = (stats.bloodlust || 0) + 0.20; } },
  { id: "lucky_coin", name: "Sansli Para", desc: "Coin drop +%25, XP +%5.", max: 4, rarity: "common", apply() { stats.coinMult = (stats.coinMult || 1) * 1.25; stats.xpGainMult = (stats.xpGainMult || 1) * 1.05; } },
  { id: "sharp_edges", name: "Keskin Kenar", desc: "Proje ve skill hasari +%8.", max: 5, rarity: "magic", apply() { stats.projectileDamageMult = (stats.projectileDamageMult || 1) * 1.08; } },
  { id: "second_wind", name: "Ikinci Ruzgar", desc: "Bir kez olumden %30 canla kurtulursun.", max: 1, rarity: "unique", apply() { stats.secondWind = (stats.secondWind || 0) + 1; } },
  { id: "unlock_line_shot", name: "Cizgi Atisi", desc: "Ileri dogru kesen bir cizgi atar, cizgidekileri vurur.", max: 1, rarity: "rare", apply() { abilityState.lineShot.level = 1; ownedSkills.add("lineShot"); } },
  { id: "line_shot_dmg", name: "Cizgi Hasar", desc: "Cizgi atisi daha keskin.", max: 4, rarity: "magic", requires: "unlock_line_shot", apply() { abilityState.lineShot.damage *= 1.14; } },
  { id: "line_shot_range", name: "Cizgi Menzil", desc: "Cizgi daha uzağa gider.", max: 3, rarity: "magic", requires: "unlock_line_shot", apply() { abilityState.lineShot.length += 2; } },
  { id: "unlock_laser", name: "Lazer Silahi", desc: "Kirmizi lazer atar, cizgideki dusmanlari vurur.", max: 1, rarity: "rare", apply() { abilityState.laser.level = 1; ownedSkills.add("laser"); } },
  { id: "laser_dmg", name: "Lazer Hasar", desc: "Lazer daha guclu olur.", max: 4, rarity: "magic", requires: "unlock_laser", apply() { abilityState.laser.damage *= 1.14; } },
  { id: "laser_range", name: "Lazer Menzil", desc: "Lazer daha uzağa gider.", max: 3, rarity: "magic", requires: "unlock_laser", apply() { abilityState.laser.range += 3; } },
  { id: "laser_cd", name: "Lazer Hiz", desc: "Lazer daha sik atilir.", max: 4, rarity: "magic", requires: "unlock_laser", apply() { abilityState.laser.cooldown *= 0.88; } },
  { id: "unlock_light_beam", name: "Isik Huzmesi", desc: "Ileri dogru isik huzmesi, hasar verir.", max: 1, rarity: "rare", apply() { abilityState.lightBeam.level = 1; ownedSkills.add("lightBeam"); } },
  { id: "light_beam_dmg", name: "Huzme Hasar", desc: "Isik huzmesi daha guclu.", max: 4, rarity: "magic", requires: "unlock_light_beam", apply() { abilityState.lightBeam.damage *= 1.12; } },
  { id: "light_beam_range", name: "Huzme Menzil", desc: "Huzme daha uzağa gider.", max: 3, rarity: "magic", requires: "unlock_light_beam", apply() { abilityState.lightBeam.range += 2; } },
  { id: "unlock_cone_blast", name: "Koni Patlama", desc: "Onunde ucgen/koni alan hasari (kisa menzil).", max: 1, rarity: "rare", apply() { abilityState.coneBlast.level = 1; ownedSkills.add("coneBlast"); } },
  { id: "cone_blast_dmg", name: "Koni Hasar", desc: "Koni patlama hasari artar.", max: 4, rarity: "magic", requires: "unlock_cone_blast", apply() { abilityState.coneBlast.damage *= 1.15; } },
  { id: "cone_blast_angle", name: "Koni Acisi", desc: "Koni genisler.", max: 3, rarity: "magic", requires: "unlock_cone_blast", apply() { abilityState.coneBlast.halfAngle += Math.PI / 24; } },
  { id: "unlock_reload_weapon", name: "4 Mermi Silah", desc: "4 mermi atar, sonra yeniden doldurur.", max: 1, rarity: "magic", apply() { state.reloadWeaponUnlocked = true; state.reloadAmmo = 4; state.reloadMax = 4; } },
  { id: "reload_weapon_dmg", name: "4 Mermi Hasar", desc: "4 mermi silah hasari artar.", max: 4, rarity: "common", requires: "unlock_reload_weapon", apply() { stats.reloadWeaponDmg = (stats.reloadWeaponDmg || 0) + 0.08; } },
  { id: "reload_speed", name: "Yeniden Doldurma Hizi", desc: "4 mermi silah daha hizli doldurulur.", max: 4, rarity: "magic", requires: "unlock_reload_weapon", apply() { stats.reloadSpeedMult = (stats.reloadSpeedMult || 0) + 0.25; } },
  { id: "mod_speed_demon", name: "Mod: Hiz Seytani", desc: "Hareket +%8, atis hizi +%5. (Mod icerik)", max: 2, rarity: "magic", apply() { stats.moveSpeed *= 1.08; stats.fireRate *= 0.95; } },
  { id: "mod_bone_breaker", name: "Mod: Kemik Kirici", desc: "Normal yaratiklara +%18 hasar. (Mod icerik)", max: 3, rarity: "rare", apply() { stats.normalEnemyDmgMult = (stats.normalEnemyDmgMult || 1) * 1.18; } },
  { id: "exp_balloon_gun", name: "Balon Silahi", desc: "Su balonu atar; carpinca islak alan birakir, yavaslatir.", max: 1, rarity: "magic", apply() { stats.balloonGun = true; } },
  { id: "exp_vacuum", name: "Vakum", desc: "Yakin dusmanlari hafifce kendine ceker.", max: 1, rarity: "magic", apply() { stats.vacuumAura = (stats.vacuumAura || 0) + 1; } },
  { id: "exp_glue", name: "Yapiskan", desc: "Oldurmede yere yapiskan birakir, dusman yavaslar.", max: 1, rarity: "magic", apply() { stats.glueOnKill = true; } },
  { id: "exp_spring_glove", name: "Yayli Eldiven", desc: "Vuruslarda ekstra geri itme.", max: 1, rarity: "rare", apply() { stats.springGlove = (stats.springGlove || 0) + 1; } },
  { id: "unlock_dismantle", name: "Dismantle", desc: "One dogru ceyrek halka kesme (Sukuna tarzi).", max: 1, rarity: "rare", apply() { abilityState.dismantle.level = 1; ownedSkills.add("dismantle"); } },
  { id: "dismantle_dmg", name: "Dismantle Hasar", desc: "Ceyrek halka hasari artar.", max: 4, rarity: "magic", requires: "unlock_dismantle", apply() { abilityState.dismantle.damage *= 1.12; } },
  { id: "dismantle_radius", name: "Dismantle Menzil", desc: "Kesme yaricapi buyur.", max: 3, rarity: "magic", requires: "unlock_dismantle", apply() { abilityState.dismantle.radius += 0.8; } },
  { id: "dismantle_cd", name: "Dismantle Hiz", desc: "Daha sik kullanilir.", max: 4, rarity: "magic", requires: "unlock_dismantle", apply() { abilityState.dismantle.cooldown *= 0.88; } },
  { id: "dismantle_proj_speed", name: "Dismantle kesme hizi", desc: "Kesme ani daha belirgin/hizli.", max: 3, rarity: "magic", requires: "unlock_dismantle", apply() { abilityState.dismantle.radius *= 1.08; } },
  { id: "unlock_gorilla_aura", name: "Goril Aurasi", desc: "Skill atmaz; etrafinda hasar alani.", max: 1, rarity: "rare", apply() { abilityState.gorillaAura.level = 1; stats.gorillaAura = true; ownedSkills.add("unlock_gorilla_aura"); } },
  { id: "gorilla_radius", name: "Goril Alani", desc: "Hasar alani genisler.", max: 5, rarity: "magic", requires: "unlock_gorilla_aura", apply() { abilityState.gorillaAura.radius += 0.5; } },
  { id: "gorilla_dmg", name: "Goril Hasar", desc: "Alan hasari artar.", max: 5, rarity: "common", requires: "unlock_gorilla_aura", apply() { abilityState.gorillaAura.damage *= 1.12; } },
  { id: "unlock_herald_thunder", name: "Herald of Thunder", desc: "Her vurusunda ek yildirim hasari + efekt.", max: 1, rarity: "rare", apply() { stats.heraldOfThunder = Math.max(1, (stats.heraldOfThunder || 0) + 1); ownedSkills.add("unlock_herald_thunder"); } },
  { id: "herald_thunder_dmg", name: "Yildirim Herald Hasar", desc: "Herald of Thunder ek hasarini artirir.", max: 4, rarity: "magic", requires: "unlock_herald_thunder", apply() { stats.heraldOfThunder = (stats.heraldOfThunder || 1) + 1; } },
  { id: "unlock_herald_ice", name: "Herald of Ice", desc: "Her vurusunda ek buz hasari + yavaslatma.", max: 1, rarity: "rare", apply() { stats.heraldOfIce = Math.max(1, (stats.heraldOfIce || 0) + 1); ownedSkills.add("unlock_herald_ice"); } },
  { id: "herald_ice_dmg", name: "Buz Herald Hasar", desc: "Herald of Ice ek hasarini artirir.", max: 4, rarity: "magic", requires: "unlock_herald_ice", apply() { stats.heraldOfIce = (stats.heraldOfIce || 1) + 1; } },
  { id: "unlock_herald_ash", name: "Herald of Ash", desc: "Her vurusunda ek ates hasari + yanik.", max: 1, rarity: "rare", apply() { stats.heraldOfAsh = Math.max(1, (stats.heraldOfAsh || 0) + 1); ownedSkills.add("unlock_herald_ash"); } },
  { id: "herald_ash_dmg", name: "Ates Herald Hasar", desc: "Herald of Ash ek hasarini artirir.", max: 4, rarity: "magic", requires: "unlock_herald_ash", apply() { stats.heraldOfAsh = (stats.heraldOfAsh || 1) + 1; } },
  { id: "unlock_flicker_strike", name: "Flicker Strike", desc: "Yakindaki dusmana vurur; oldurucu vurus yanina isinlanip patlama ile verilir.", max: 1, rarity: "rare", apply() { abilityState.flickerStrike.level = 1; ownedSkills.add("unlock_flicker_strike"); } },
  { id: "flicker_range", name: "Flicker Menzil", desc: "Flicker alani genisler.", max: 4, rarity: "magic", requires: "unlock_flicker_strike", apply() { abilityState.flickerStrike.range += 1.2; } },
  { id: "flicker_dmg", name: "Flicker Hasar", desc: "Flicker vurus hasari.", max: 4, rarity: "magic", requires: "unlock_flicker_strike", apply() { abilityState.flickerStrike.damage *= 1.1; } },
  { id: "unlock_spark", name: "Spark", desc: "Yer elektrik projektileri atar (PoE2 tarzi), degdigi yaratiklara vurur. 5 projektil.", max: 1, rarity: "rare", apply() { abilityState.spark.level = 1; abilityState.spark.count = 5; ownedSkills.add("spark"); } },
  { id: "spark_count", name: "Spark +2 Projektil", desc: "Spark projektil sayisi artar (max 15).", max: 5, rarity: "magic", requires: "unlock_spark", apply() { abilityState.spark.count = Math.min(15, (abilityState.spark.count || 5) + 2); } },
  { id: "spark_dmg", name: "Spark Hasar", desc: "Spark hasari artar.", max: 5, rarity: "magic", requires: "unlock_spark", apply() { abilityState.spark.damage *= 1.12; } },
  { id: "spark_speed", name: "Spark Hiz", desc: "Spark projektil hizi artar.", max: 4, rarity: "magic", requires: "unlock_spark", apply() { abilityState.spark.speed *= 1.15; } },
  { id: "spark_cd", name: "Spark Bekleme", desc: "Spark daha sik atilir.", max: 4, rarity: "magic", requires: "unlock_spark", apply() { abilityState.spark.cooldown *= 0.92; } },
  { id: "unlock_smite", name: "Smite", desc: "Vurdugun yaratikta yari yukseklikte yuvarlak patlama halkasi.", max: 1, rarity: "rare", apply() { abilityState.smite.level = 1; ownedSkills.add("unlock_smite"); } },
  { id: "smite_dmg", name: "Smite Hasar", desc: "Smite patlama hasari artar.", max: 4, rarity: "magic", requires: "unlock_smite", apply() { abilityState.smite.damageMult = (abilityState.smite.damageMult || 1) * 1.15; } },
  { id: "smite_radius", name: "Smite Yaricap", desc: "Smite halka yaricapi buyur.", max: 3, rarity: "magic", requires: "unlock_smite", apply() { abilityState.smite.radius = (abilityState.smite.radius || 2) + 0.4; } },
  { id: "unlock_kinetic_blast", name: "Kinetic Blast", desc: "Vurdugun yaratikta yari yukseklikte mavi yatay cizgi; ayni anda 3 yaratik vurur.", max: 1, rarity: "unique", apply() { abilityState.kineticBlast.level = 1; abilityState.kineticBlast.maxTargets = 3; ownedSkills.add("unlock_kinetic_blast"); } },
  { id: "kinetic_blast_targets", name: "Kinetic Blast Hedef", desc: "Ayni anda +1 yaratik vurur (max 5).", max: 2, rarity: "rare", requires: "unlock_kinetic_blast", apply() { abilityState.kineticBlast.maxTargets = Math.min(5, (abilityState.kineticBlast.maxTargets || 3) + 1); } },
  { id: "kinetic_blast_dmg", name: "Kinetic Blast Hasar", desc: "Kinetic Blast hasari artar.", max: 4, rarity: "magic", requires: "unlock_kinetic_blast", apply() { abilityState.kineticBlast.damageMult = (abilityState.kineticBlast.damageMult || 1) * 1.18; } },
  { id: "arrow_dmg", name: "Ok Hasar", desc: "Ok hasari artar (Okcu).", max: 6, rarity: "common", apply() { stats.damage *= 1.08; } },
  { id: "arrow_speed", name: "Ok Hizi", desc: "Oklar daha hizli gider.", max: 5, rarity: "magic", apply() { stats.projectileSpeedMult = (stats.projectileSpeedMult || 1) * 1.12; } },
  { id: "unlock_arrow_shock", name: "Sok Oku", desc: "Oklar sok verir.", max: 1, rarity: "magic", apply() { stats.arrowShock = true; } },
  { id: "unlock_arrow_burn", name: "Yakici Ok", desc: "Oklar yakar.", max: 1, rarity: "magic", apply() { stats.arrowBurn = true; } },
  { id: "unlock_arrow_freeze", name: "Donduran Ok", desc: "Oklar dondurur.", max: 1, rarity: "rare", apply() { stats.arrowFreeze = true; } },
  { id: "arrow_multishot", name: "Coklu Ok", desc: "Atista +1 ok (max 4).", max: 3, rarity: "magic", apply() { stats.multiShot = Math.min(4, (stats.multiShot || 0) + 1); } },
  { id: "banana_shots", name: "Muz Sayisi", desc: "Firlatilan muz sayisi artar.", max: 3, rarity: "magic", requires: "unlock_banana", apply() { abilityState.banana.throwCount = Math.min(5, (abilityState.banana.throwCount || 1) + 1); } },
  { id: "unlock_saturn_rings", name: "Saturn Halkalari", desc: "Dikey ve yatay donen halkalar, temas edene hasar.", max: 1, rarity: "rare", apply() { abilityState.saturnRings = abilityState.saturnRings || { level: 1, radius: 3.2, damage: 18, vertical: true, horizontal: true }; ownedSkills.add("unlock_saturn_rings"); } },
  { id: "saturn_radius", name: "Halka Genisligi", desc: "Saturn halkalari buyur.", max: 3, rarity: "magic", requires: "unlock_saturn_rings", apply() { if (abilityState.saturnRings) abilityState.saturnRings.radius += 0.6; } },
  { id: "saturn_dmg", name: "Halka Hasar", desc: "Halka temas hasari.", max: 4, rarity: "magic", requires: "unlock_saturn_rings", apply() { if (abilityState.saturnRings) abilityState.saturnRings.damage *= 1.1; } },
  { id: "synergy_fire_burn", name: "Ates + Yanma", desc: "Fireball ve Yanma varsa Fireball +%25 hasar.", max: 1, rarity: "unique", apply() { stats.fireBurnSynergy = true; } },
  { id: "synergy_frost_slow", name: "Buz + Yavas", desc: "Frostball ve Freeze varsa Freeze suresi +%30.", max: 1, rarity: "unique", apply() { stats.frostSlowSynergy = true; } },
  { id: "synergy_vamp_lifesteal", name: "Vampir Kombo", desc: "Lifesteal + Vampirik varsa ikisi de +%15.", max: 1, rarity: "rare", apply() { stats.vampSynergy = (stats.vampSynergy || 0) + 0.15; } },
  { id: "buff_amplify", name: "Buff Guclendirici", desc: "Tum pasif bufflarin etkisi +%8.", max: 3, rarity: "rare", apply() { stats.buffAmplify = (stats.buffAmplify || 0) + 0.08; } },
  { id: "skill_amplify", name: "Skill Guclendirici", desc: "Tum skill hasarlari +%6.", max: 4, rarity: "magic", apply() { stats.skillAmplify = (stats.skillAmplify || 0) + 0.06; } },
  // Jump/movement cards
  { id: "jump_boost", name: "Ziplama Gucu", desc: "Ziplama yuksekligi +%15.", max: 5, rarity: "common", apply() { stats.jumpPower = (stats.jumpPower || 1) * 1.15; } },
  { id: "triple_jump", name: "Uclu Ziplama", desc: "+1 havada ziplama hakki.", max: 2, rarity: "rare", apply() { stats.doubleJump = (stats.doubleJump || 0) + 1; } },
  { id: "feather_fall", name: "Tuy Dususu", desc: "Yere yavas inersin, fall damage yok.", max: 1, rarity: "magic", apply() { stats.featherFall = true; } },
  { id: "rocket_jump", name: "Roket Ziplama", desc: "Ziplarken etrafina hasar ver.", max: 2, rarity: "rare", apply() { stats.rocketJump = (stats.rocketJump || 0) + 1; } },
  // Boss power cards
  { id: "boss_slayer", name: "Boss Avcisi", desc: "Bosslara +%25 hasar.", max: 3, rarity: "rare", apply() { stats.bossDmgMult = (stats.bossDmgMult || 1) * 1.25; } },
  { id: "elite_hunter", name: "Elit Avci", desc: "Rare+ yaratiklara +%20 hasar.", max: 3, rarity: "magic", apply() { stats.eliteDmgMult = (stats.eliteDmgMult || 1) * 1.20; } },
  { id: "titan_killer", name: "Titan Katili", desc: "Boss HP %5 altindayken infaz et.", max: 1, rarity: "legendary", apply() { stats.titanKiller = true; } },
  { id: "cdr", name: "Beceri Hizi", desc: "Tum skill cooldown %6 azalir.", max: 6, rarity: "magic", apply() { stats.cooldownReduction = (stats.cooldownReduction || 0) + 0.06; } },
  { id: "xp_boost", name: "XP Artisi", desc: "XP kazanci +%12.", max: 5, rarity: "common", apply() { stats.xpGainMult = (stats.xpGainMult || 1) * 1.12; } },
  { id: "gold_finder", name: "Altin Bulucu", desc: "Coin drop +%15.", max: 4, rarity: "magic", apply() { stats.goldGainMult = (stats.goldGainMult || 1) * 1.15; } },
  { id: "thick_skin", name: "Kalın Deri", desc: "Max HP +35, zirh +%4.", max: 4, rarity: "common", apply() { stats.maxHp += 35; stats.hp = Math.min(stats.maxHp, stats.hp + 35); stats.armor = (stats.armor || 0) + 0.04; } },
  { id: "quick_hands", name: "Hizli Eller", desc: "Atis hizi +%8, toplama menzili +%10.", max: 5, rarity: "magic", apply() { stats.fireRate *= 0.92; stats.pickupRange *= 1.1; } },
  { id: "berserker_rage", name: "Berserker", desc: "HP %40 altindayken hasar +%20.", max: 2, rarity: "rare", apply() { stats.berserker = (stats.berserker || 0) + 0.2; } },
  { id: "lucky_strike", name: "Sansli Vurus", desc: "Kritik sans +%5, krit hasar +%15.", max: 4, rarity: "magic", apply() { stats.critChance = Math.min(1, (stats.critChance || 0) + 0.05); stats.critMult = (stats.critMult || 1.9) + 0.15; } },
  { id: "vampiric_touch", name: "Vampirik Dokunus", desc: "Vuruslardan can ceker (maks %1).", max: 5, rarity: "rare", apply() { stats.lifesteal = (stats.lifesteal || 0) + 0.002; } },
  { id: "elemental_affinity", name: "Element Uyumu", desc: "Yanik/Freeze/Sok hasari +%10.", max: 3, rarity: "rare", apply() { stats.elementalMult = (stats.elementalMult || 1) * 1.1; } },
  { id: "unlock_chain_bolt", name: "Zincir Yildirim", desc: "En yakin dusmandan 4 hedefe seken yildirim.", max: 1, rarity: "rare", apply() { abilityState.chainBolt.level = 1; ownedSkills.add("chainBolt"); } },
  { id: "chain_bolt_dmg", name: "Yildirim Hasar", desc: "Zincir yildirim hasari artar.", max: 4, rarity: "magic", requires: "unlock_chain_bolt", apply() { abilityState.chainBolt.damage *= 1.12; } },
  { id: "unlock_black_hole", name: "Kara Delik", desc: "Dusmanlari ceker sonra patlar.", max: 1, rarity: "unique", apply() { abilityState.blackHole.level = 1; ownedSkills.add("blackHole"); } },
  { id: "black_hole_dmg", name: "Kara Delik Hasar", desc: "Patlama hasari artar.", max: 4, rarity: "rare", requires: "unlock_black_hole", apply() { abilityState.blackHole.damage *= 1.12; } },
  { id: "unlock_poison_trail", name: "Zehir Izi", desc: "Yururken zehir izi birakir.", max: 1, rarity: "rare", apply() { abilityState.poisonTrail.level = 1; stats.toxicTrail = Math.max(stats.toxicTrail || 0, 1); ownedSkills.add("poisonTrail"); } },
  { id: "poison_trail_dmg", name: "Zehir Hasar", desc: "Iz hasari artar.", max: 4, rarity: "magic", requires: "unlock_poison_trail", apply() { abilityState.poisonTrail.damage *= 1.12; } },
  { id: "greed", name: "Acgozluluk", desc: "Coin kazanci +%20.", max: 5, rarity: "magic", apply() { stats.goldGainMult = (stats.goldGainMult || 1) * 1.2; stats.coinMult = (stats.coinMult || 1) * 1.2; } },
  { id: "executioner", name: "Cellat", desc: "%15 alti HP dusmani infaz et.", max: 1, rarity: "rare", apply() { stats.executioner = true; } },
];

const skillLookup = {};
skills.forEach((s) => { skillLookup[s.id] = { name: s.name, rarity: s.rarity || "common" }; });

// ============================================================
// WORLD GENERATION - Megabonk-style vibrant terrain system
// ============================================================
const HILLS = [
  { x: 0, z: 0, r: 60, h: 0.3 },
  { x: 120, z: 80, r: 45, h: 2.2 },
  { x: -140, z: 100, r: 50, h: 2.5 },
  { x: -80, z: -160, r: 40, h: 1.8 },
  { x: 200, z: -120, r: 55, h: 2.8 },
  { x: -250, z: -80, r: 48, h: 2.2 },
  { x: 60, z: 250, r: 42, h: 3.2 },
  { x: -200, z: 250, r: 38, h: 2.5 },
  { x: 300, z: 200, r: 50, h: 2 },
  { x: -350, z: -200, r: 55, h: 3 },
  { x: 350, z: -300, r: 45, h: 3.5 },
  { x: -100, z: -350, r: 40, h: 2.2 },
  { x: 400, z: 50, r: 35, h: 1.5 },
  { x: -400, z: 100, r: 42, h: 1.8 },
  { x: 150, z: 380, r: 38, h: 2.5 },
  { x: -300, z: 350, r: 44, h: 2.2 },
];
const PLATEAUS = [
  { x: 120, z: 100, r: 180, h: 4 },
  { x: -200, z: -150, r: 200, h: 4.5 },
  { x: -80, z: 220, r: 175, h: 5 },
  { x: 280, z: -180, r: 190, h: 4 },
  { x: -320, z: 80, r: 175, h: 3.5 },
  { x: 0, z: 350, r: 185, h: 5 },
  { x: -350, z: -250, r: 210, h: 4.5 },
  { x: 400, z: 250, r: 175, h: 3.5 },
  { x: 420, z: -300, r: 230, h: 5 },
  { x: -420, z: 300, r: 220, h: 4.5 },
  { x: -100, z: -400, r: 250, h: 5.5 },
  { x: 350, z: 400, r: 200, h: 4 },
  { x: 180, z: -80, r: 165, h: 3.2 },
  { x: -180, z: 180, r: 195, h: 3.5 },
  { x: 250, z: 280, r: 175, h: 4.5 },
  { x: -280, z: -280, r: 200, h: 4 },
  { x: 80, z: -220, r: 185, h: 2.8 },
  { x: -380, z: 200, r: 168, h: 3.2 },
  { x: 380, z: 80, r: 178, h: 3.5 },
  { x: -120, z: -320, r: 195, h: 4.5 },
  { x: 320, z: -220, r: 185, h: 4 },
  { x: -250, z: 80, r: 158, h: 2.8 },
  { x: 150, z: 120, r: 178, h: 3.2 },
  { x: -60, z: -100, r: 168, h: 2.5 },
  { x: -150, z: -250, r: 172, h: 3.2 },
  { x: 220, z: 80, r: 182, h: 3.5 },
  { x: -330, z: -100, r: 188, h: 4 },
  { x: 100, z: -300, r: 195, h: 4.5 },
  { x: 330, z: -80, r: 170, h: 3.2 },
  { x: -90, z: 320, r: 178, h: 3.5 },
  { x: 280, z: 150, r: 185, h: 4 },
  { x: -270, z: 250, r: 192, h: 4.5 },
  { x: 50, z: -180, r: 165, h: 2.8 },
  { x: -200, z: 50, r: 175, h: 3.2 },
  { x: 380, z: -180, r: 190, h: 4 },
  { x: -400, z: -300, r: 205, h: 5 },
  { x: 200, z: 350, r: 178, h: 3.5 },
  { x: -380, z: 350, r: 188, h: 4 },
  { x: 420, z: 100, r: 172, h: 3.2 },
  { x: -50, z: 250, r: 182, h: 3.5 },
];
const FLAT_ZONES = [
  { x: 80, z: -120, r: 35, baseY: 0 },
  { x: -150, z: 100, r: 40, baseY: 0.1 },
  { x: 200, z: 80, r: 38, baseY: -0.05 },
  { x: -80, z: -200, r: 42, baseY: 0.08 },
  { x: 120, z: 220, r: 36, baseY: 0.12 },
  { x: -280, z: -100, r: 34, baseY: 0 },
  { x: 300, z: -150, r: 38, baseY: 0.05 },
  { x: -100, z: 280, r: 32, baseY: 0.1 },
  { x: 50, z: -80, r: 30, baseY: -0.02 },
  { x: -220, z: -180, r: 36, baseY: 0.06 },
];
const HIGH_PLATEAUS = [
  { x: 180, z: -200, r: 220, h: 7 },
  { x: -250, z: 180, r: 200, h: 6.5 },
  { x: -180, z: -320, r: 210, h: 7.5 },
];

const RAMP_ZONES = [
  { x: 220, z: -5, length: 36, width: 8, angle: Math.PI / 2 },
  { x: 220, z: 85, length: 36, width: 8, angle: -Math.PI / 2 },
  { x: 175, z: 40, length: 36, width: 8, angle: 0 },
  { x: 265, z: 40, length: 36, width: 8, angle: Math.PI },
  { x: -260, z: -178, length: 32, width: 7, angle: Math.PI / 2 },
  { x: -260, z: -102, length: 32, width: 7, angle: -Math.PI / 2 },
  { x: -298, z: -140, length: 32, width: 7, angle: 0 },
  { x: -222, z: -140, length: 32, width: 7, angle: Math.PI },
  { x: 60, z: 128, length: 22, width: 6, angle: Math.PI / 2 },
  { x: 180, z: -78, length: 24, width: 6, angle: Math.PI / 2 },
];
let worldRamps = [];
let classicPlatforms = [];

const RAMP_SURFACE_OFFSET = 0.18;
function getRampHeight(x, z) {
  for (const r of worldRamps) {
    const cosA = Math.cos(-r.angle), sinA = Math.sin(-r.angle);
    const lx = (x - r.x) * cosA - (z - r.z) * sinA;
    const lz = (x - r.x) * sinA + (z - r.z) * cosA;
    if (Math.abs(lx) <= r.length * 0.5 && Math.abs(lz) <= r.width * 0.5) {
      const t = (lx + r.length * 0.5) / r.length;
      return r.lowY + t * (r.highY - r.lowY) + RAMP_SURFACE_OFFSET;
    }
  }
  return null;
}

function addClassicRamps() {
  worldRamps = RAMP_ZONES.map(function (r) {
    const lowX = r.x - Math.cos(r.angle) * r.length * 0.5, lowZ = r.z - Math.sin(r.angle) * r.length * 0.5;
    const highX = r.x + Math.cos(r.angle) * r.length * 0.5, highZ = r.z + Math.sin(r.angle) * r.length * 0.5;
    return { x: r.x, z: r.z, length: r.length, width: r.width, angle: r.angle, lowY: sampleTerrainHeight(lowX, lowZ), highY: sampleTerrainHeight(highX, highZ) };
  });
  if (!mapGroup) return;
  const rampMatF = new THREE.MeshStandardMaterial({ color: 0x5a5048, emissive: 0x1a1815, emissiveIntensity: 0.06, roughness: 0.88, metalness: 0.02 });
  worldRamps.forEach(function (r) {
    const rampGeo = new THREE.BoxGeometry(r.length, 0.35, r.width);
    const rampMesh = new THREE.Mesh(rampGeo, rampMatF);
    rampMesh.position.set(r.x, (r.lowY + r.highY) * 0.5, r.z);
    rampMesh.rotation.order = "YXZ";
    rampMesh.rotation.y = r.angle;
    rampMesh.rotation.x = -Math.atan2(r.highY - r.lowY, r.length);
    rampMesh.receiveShadow = true;
    rampMesh.castShadow = true;
    mapGroup.add(rampMesh);
  });
}

function getIslandHeight(x, z) {
  const d = Math.hypot(x, z);
  if (d >= ISLAND_RADIUS) return ISLAND_WATER_LEVEL;
  const t = 1 - d / ISLAND_RADIUS;
  const islandBase = Math.pow(t, 0.55) * 1.2;
  var h = islandBase;
  var freq = 0.006;
  h += Math.sin(x * freq) * 0.8 + Math.cos(z * freq * 1.1) * 0.7;
  h += Math.sin((x + z) * freq * 0.8) * 0.5 + Math.cos((x - z) * freq * 0.7) * 0.45;
  h += Math.sin(x * 0.002) * 1.4 + Math.cos(z * 0.0022) * 1.2;
  return h;
}

// Duz tepeler: tepelerin ustu genis ve duz (sivri tepeler yok). Classic map tamamen duz (manuel map eklenebilir).
function sampleClassicHeight(x, z) {
  // Classic icin: cogunlukla duz, bazi bolgelerde cikilabilir tepeler
  // Merkez alan (spawn ve ana savas bolgesi) tamamen duz kalsin
  const dCenter = Math.hypot(x, z);
  if (dCenter < 90) return 0;

  // Araba pisti icin ayrilan genis dikdortgen alan (duz kalsin)
  if (x > -130 && x < 130 && z < -180 && z > -360) return 0;

  let h = 0;

  // Buyuk cikilabilir dag/tepe 1 (sag ust taraf)
  (function () {
    const cx = 220, cz = 40;
    const r = 70, maxH = 18;
    const dx = x - cx, dz = z - cz;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < r) {
      const t = d / r;
      const smooth = 1 - t * t * (3 - 2 * t);
      h += smooth * maxH;
    }
  })();

  // Buyuk cikilabilir dag/tepe 2 (sol alt taraf)
  (function () {
    const cx = -260, cz = -140;
    const r = 60, maxH = 14;
    const dx = x - cx, dz = z - cz;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < r) {
      const t = d / r;
      const smooth = 1 - t * t * (3 - 2 * t);
      h += smooth * maxH;
    }
  })();

  // Kucuk tumsekler (her yerde degil, sadece belli noktalarda)
  const bumps = [
    { x: 60, z: 150, r: 22, h: 3.2 },
    { x: -140, z: 190, r: 18, h: 2.6 },
    { x: 180, z: -60, r: 24, h: 3.8 },
    { x: -80, z: -200, r: 20, h: 3.0 },
  ];
  for (const b of bumps) {
    const dx = x - b.x, dz = z - b.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < b.r) {
      const t = d / b.r;
      const smooth = 1 - t * t * (3 - 2 * t);
      h += smooth * b.h;
    }
  }

  return h;
}

// Duz tepeler: tepelerin ustu genis ve duz (sivri tepeler yok). Classic map tamamen duz (manuel map eklenebilir).
function sampleTerrainHeight(x, z) {
  const mapId = state.currentMapId || state.selectedMapId || "classic";
  if (mapId === "classic") return sampleClassicHeight(x, z);
  if (state.currentMapId === "island") return getIslandHeight(x, z);
  var freq = 0.003;
  const h1 = Math.sin(x * freq) * 0.35 + Math.cos(z * freq * 1.05) * 0.32;
  const h2 = Math.sin((x + z) * freq * 0.85) * 0.25 + Math.cos((x - z) * freq * 0.75) * 0.22;
  const h3 = Math.sin(x * 0.0015) * 0.45 + Math.cos(z * 0.0014) * 0.4;
  let mountain = 0;
  for (const p of PLATEAUS) {
    const dx = x - p.x, dz = z - p.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    const rInner = p.r * 0.55;
    if (d < rInner) {
      mountain += p.h * 0.35;
    } else if (d < p.r) {
      const t = (d - rInner) / (p.r - rInner);
      const smooth = 1 - t * t * (3 - 2 * t);
      mountain += smooth * (p.h * 0.35);
    }
  }
  for (const h of HILLS) {
    const dx = x - h.x, dz = z - h.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    const rInner = h.r * 0.5;
    if (d < rInner) {
      mountain += h.h * 0.4;
    } else if (d < h.r) {
      const t = (d - rInner) / (h.r - rInner);
      const smooth = 1 - t * t * (3 - 2 * t);
      mountain += smooth * (h.h * 0.4);
    }
  }
  for (const hp of HIGH_PLATEAUS) {
    const dx = x - hp.x, dz = z - hp.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    const rInner = hp.r * 0.6;
    if (d < rInner) {
      mountain += hp.h * 0.4;
    } else if (d < hp.r) {
      const t = (d - rInner) / (hp.r - rInner);
      const smooth = 1 - t * t * (3 - 2 * t);
      mountain += smooth * (hp.h * 0.4);
    }
  }
  for (const f of FLAT_ZONES) {
    const dx = x - f.x, dz = z - f.z;
    if (dx * dx + dz * dz < f.r * f.r) return f.baseY + h1 * 0.2 + h2 * 0.15;
  }
  return h1 + h2 + h3 + mountain;
}

function getTempleGroundHeight(x, z) {
  let y = 0;
  for (const p of templePlatforms) {
    const hw = p.w * 0.5, hh = p.h * 0.5;
    if (x >= p.x - hw && x <= p.x + hw && z >= p.z - hh && z <= p.z + hh) {
      return p.topY;
    }
  }
  return y;
}

function getGroundHeight(x, z) {
  const mapId = state.currentMapId || state.selectedMapId || "classic";
  if (mapId === "classic") {
    for (const p of classicPlatforms) {
      if (x >= p.x - p.hw && x <= p.x + p.hw && z >= p.z - p.hd && z <= p.z + p.hd) return p.topY;
    }
    let h = sampleClassicHeight(x, z);
    const rampY = getRampHeight(x, z);
    if (rampY != null) h = Math.max(h, rampY);
    return h;
  }
  if (mapId === "temple1" || mapId === "temple2") return getTempleGroundHeight(x, z);
  if (mapId === "arena1" || mapId === "arena2" || mapId === "arena3") {
    if (!state.arenaModel) return 0;
    var origin = new THREE.Vector3(x, 400, z);
    var dir = new THREE.Vector3(0, -1, 0);
    raycaster.set(origin, dir);
    var waterSet = state.waterMeshes ? new Set(state.waterMeshes) : new Set();
    var hits = raycaster.intersectObject(state.arenaModel, true);
    for (var i = 0; i < hits.length; i++) {
      if (waterSet.has(hits[i].object)) continue;
      return hits[i].point.y;
    }
    return 0;
  }
  if (mapId === "island") return getIslandHeight(x, z);
  if (mapId !== "classic" && worldRamps.length > 0) {
    const rampY = getRampHeight(x, z);
    if (rampY != null) return rampY;
  }
  return sampleTerrainHeight(x, z);
}

const CUSTOM_MAPS = {
  arena1: { name: "Arena 1 (GLB)", url: "assets/maps/arena1.glb", scale: 1 },
  arena2: { name: "Arena 2 (GLB)", url: "assets/maps/arena2.glb", scale: 1 },
  arena3: { name: "Arena 3 (Ancient Town)", url: "assets/maps/arena3.glb", scale: 1, hasWater: true },
};

// Opsiyonel GLB modelleri: assets/creatures/<tip>.glb ve assets/player/character.glb
// Dosya yoksa procedural mesh kullanilir. Indirme linkleri: assets/ASSETS_README.md
const CREATURE_GLB_PATHS = {
  wolf: "assets/creatures/wolf.glb", bear: "assets/creatures/bear.glb", spider: "assets/creatures/spider.glb",
  skeleton: "assets/creatures/skeleton.glb", bat: "assets/creatures/bat.glb", slime: "assets/creatures/slime.glb",
  fox: "assets/creatures/fox.glb", ghost: "assets/creatures/ghost.glb", scorpion: "assets/creatures/scorpion.glb",
  boar: "assets/creatures/boar.glb", polarBear: "assets/creatures/polarBear.glb",
  void: "assets/creatures/void.glb", horror: "assets/creatures/horror.glb", default: "assets/creatures/default.glb",
  tree: "assets/creatures/tree.glb",
};
let creatureCache = {};

function ensureGLTFLoader(cb) {
  if (typeof window.GLTFLoader !== "undefined") { cb(); return; }
  const script = document.createElement("script");
  script.type = "module";
  script.textContent = "import { GLTFLoader } from 'https://unpkg.com/three@0.159.0/examples/jsm/loaders/GLTFLoader.js'; window.GLTFLoader = GLTFLoader; window.dispatchEvent(new Event('GLTFLoaderReady'));";
  document.head.appendChild(script);
  window.addEventListener("GLTFLoaderReady", function h() { window.removeEventListener("GLTFLoaderReady", h); cb(); }, { once: true });
}

function resolveAssetUrl(path) {
  return (typeof window !== "undefined" && window.location && window.location.href) ? new URL(path, window.location.href).href : path;
}

function preloadCreatureModels() {
  ensureGLTFLoader(function() {
    const loader = new window.GLTFLoader();
    Object.keys(CREATURE_GLB_PATHS).forEach(function(key) {
      const url = resolveAssetUrl(CREATURE_GLB_PATHS[key]);
      loader.load(url, function(gltf) {
        const scene = gltf.scene;
        scene.traverse(function(c) { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        creatureCache[key] = scene;
      }, undefined, function() { /* 404 veya hata – procedural kullanilacak */ });
    });
  });
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function formatTime(t) { const s = Math.floor(Math.max(0, t)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
function lerpAngle(from, to, t) { let d = (to - from + Math.PI) % (Math.PI * 2) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return from + d * t; }
function init() {
  installSharedCaches();
  stopBgMusic();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6aa8e0);
  scene.fog = new THREE.FogExp2(0xc8e0ff, 0.011);
  defaultFogColor = 0xc8e0ff;
  defaultFogDensity = 0.011;

  camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 4.9 + 0.6, 10);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  const MAX_PIXEL_RATIO = 0.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  window._gameMaxPixelRatio = MAX_PIXEL_RATIO;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.95;
  if (canvas.style) canvas.style.imageRendering = "pixelated";

  clock = new THREE.Clock();

  bindEvents();
  loadQuests();
  updateHud();

  const loadingEl = document.getElementById("loadingOverlay");
  if (loadingEl) loadingEl.classList.add("hidden");
  animate();

  function doHeavyInit() {
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 256; skyCanvas.height = 256;
    const skyCtx = skyCanvas.getContext("2d");
    const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 256);
    skyGrad.addColorStop(0, "#2a5a9a");
    skyGrad.addColorStop(0.06, "#3a6ab0");
    skyGrad.addColorStop(0.15, "#4a8acc");
    skyGrad.addColorStop(0.3, "#5a9ee0");
    skyGrad.addColorStop(0.5, "#7ab8f0");
    skyGrad.addColorStop(0.68, "#9ac8f8");
    skyGrad.addColorStop(0.82, "#b8dcfc");
    skyGrad.addColorStop(0.92, "#d4ecfc");
    skyGrad.addColorStop(1, "#e8f4fc");
    skyCtx.fillStyle = skyGrad;
    skyCtx.fillRect(0, 0, 256, 256);
    const horizonGrad = skyCtx.createRadialGradient(128, 220, 0, 128, 220, 220);
    horizonGrad.addColorStop(0, "rgba(255,245,220,0.45)");
    horizonGrad.addColorStop(0.35, "rgba(255,230,180,0.18)");
    horizonGrad.addColorStop(0.6, "rgba(255,210,150,0.05)");
    horizonGrad.addColorStop(1, "transparent");
    skyCtx.fillStyle = horizonGrad;
    skyCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 256, y = Math.random() * 110;
      const r = Math.random() < 0.15 ? 1.2 : 0.6;
      const a = 0.4 + Math.random() * 0.6;
      skyCtx.fillStyle = "rgba(255,255,255," + a + ")";
      skyCtx.beginPath(); skyCtx.arc(x, y, r, 0, Math.PI * 2); skyCtx.fill();
    }
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.magFilter = THREE.LinearFilter;
    skyTex.minFilter = THREE.LinearMipmapLinearFilter;
    scene.background = skyTex;
    defaultSkyTex = skyTex;

    const hemi = new THREE.HemisphereLight(0xe4f4ff, 0x6aaa6a, 1.75);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfffce8, 2.25);
    sun.position.set(35, 55, -12);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 28;
    sun.shadow.mapSize.height = 28;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 65;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    sun.shadow.bias = -0.001;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb8dcff, 0.65);
    fill.position.set(-20, 15, 20);
    scene.add(fill);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    loadPlayerAppearance();
    try { buildPlayer(); } catch (e) { console.error("buildPlayer:", e); }
    try { setupMenuDiorama(); } catch (e) { console.warn("diorama skip:", e); }
  }

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(doHeavyInit, { timeout: 1200 });
  } else {
    setTimeout(doHeavyInit, 0);
  }
}

let dioramaGroup = null;
let dioramaOn = false;
function setupMenuDiorama() {
  if (dioramaOn || running || mapGroup) return;
  if (typeof hasVoxel !== "function" || typeof buildVoxelModel !== "function") return;
  dioramaGroup = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CircleGeometry(6, 16), new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.92 }));
  pad.rotation.x = -Math.PI / 2;
  dioramaGroup.add(pad);
  const ids = ["goblin", "wolf"];
  const xs = [-2.4, 2.4];
  for (let i = 0; i < ids.length; i++) {
    if (!hasVoxel(ids[i])) continue;
    const m = buildVoxelModel(ids[i], { outline: true, fitHeight: 1.8 });
    m.position.set(xs[i], 0, 0.8);
    m.userData.idleTurn = true;
    dioramaGroup.add(m);
  }
  scene.add(dioramaGroup);
  dioramaOn = true;
  if (player.mesh) player.mesh.position.set(0, 0, 0);
}
function hideMenuDiorama() {
  if (dioramaGroup && scene) scene.remove(dioramaGroup);
  dioramaGroup = null;
  dioramaOn = false;
}

function clearWorld() {
  if (mapGroup) {
    mapGroup.traverse((c) => {
      if (isVoxelSharedMesh(c)) return;
      if (c.geometry && c.geometry.dispose !== noopDispose) c.geometry.dispose();
      if (c.material) { if (Array.isArray(c.material)) c.material.forEach((m) => { if (m && m.dispose !== noopDispose) m.dispose(); }); else if (c.material.dispose !== noopDispose) c.material.dispose(); }
    });
    scene.remove(mapGroup);
    mapGroup = null;
  }
  if (ground) {
    if (ground.geometry) ground.geometry.dispose();
    if (ground.material) {
      if (ground.material.map) ground.material.map.dispose();
      ground.material.dispose();
    }
    scene.remove(ground);
    ground = null;
  }
  colliders.length = 0;
  state.waterMeshes = [];
  state.waterSharks = [];
  state.inWater = false;
  state.arenaModel = null;
  shrineGroups.length = 0;
  shrines.length = 0;
  difficultyAltars.length = 0;
  bossShrines.length = 0;
  bossSummonShrines.length = 0;
  pondMeshes.length = 0;
  randomTeleportPortals = [];
  hardcorePortalData = null;
  bossArenas.length = 0;
  vendingMachines.length = 0;
  worldChests.length = 0;
  worldPickups.length = 0;
  grassField = null;
  worldRamps = [];
  classicPlatforms = [];
  transitionAltarPos = null;
  worldDecorData.forEach(function(d) {
    if (d.mesh) { if (mapGroup) mapGroup.remove(d.mesh); if (d.mesh.geometry) d.mesh.geometry.dispose(); if (d.mesh.material) d.mesh.material.dispose(); d.mesh = null; }
  });
  worldDecorData.length = 0;
  worldDecorInstanced = false;
  if (megaArenaWall) {
    if (mapGroup) mapGroup.remove(megaArenaWall);
    megaArenaWall = null;
  }
  if (worldDecorRockMats) { worldDecorRockMats.forEach(function(m) { m.dispose(); }); worldDecorRockMats = null; }
  if (worldDecorBushMat) { worldDecorBushMat.dispose(); worldDecorBushMat = null; }
  if (gorillaAuraRingMesh && typeof scene !== "undefined") {
    scene.remove(gorillaAuraRingMesh);
    if (gorillaAuraRingMesh.geometry) gorillaAuraRingMesh.geometry.dispose();
    if (gorillaAuraRingMesh.material) gorillaAuraRingMesh.material.dispose();
    gorillaAuraRingMesh = null;
  }
}

function clearCurrentWorld() {
  if (mapGroup) {
    scene.remove(mapGroup);
    mapGroup.traverse((c) => { if (isVoxelSharedMesh(c)) return; if (c.geometry && c.geometry.dispose !== noopDispose) c.geometry.dispose(); if (c.material) { if (Array.isArray(c.material)) c.material.forEach(m => { if (m && m.dispose !== noopDispose) m.dispose(); }); else if (c.material.dispose !== noopDispose) c.material.dispose(); } });
    mapGroup = null;
  }
  if (ground) {
    scene.remove(ground);
    if (ground.geometry) ground.geometry.dispose();
    if (ground.material) ground.material.dispose();
    ground = null;
  }
  colliders.length = 0;
  shrineGroups = []; shrines = [];
  parkourRewards = [];
  bossShrines.length = 0; bossSummonShrines.length = 0;
  worldRamps = [];
  classicPlatforms = [];
  worldDecorInstanced = false;
}

function buildWorldTemple(templeIndex) {
  clearCurrentWorld();
  templePlatforms = [];
  state.currentMapId = "temple" + templeIndex;
  mapGroup = new THREE.Group();
  scene.add(mapGroup);

  const H = TEMPLE_HALF * 2;
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1510, emissive: 0x080504, emissiveIntensity: 0.15, roughness: 0.92, metalness: 0.05 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2218, emissive: 0x0a0806, emissiveIntensity: 0.1, roughness: 0.9, metalness: 0.02 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a3025, emissive: 0x120a08, emissiveIntensity: 0.08, roughness: 0.85, metalness: 0.05 });
  const torchMat = new THREE.MeshStandardMaterial({ color: 0x8a4020, emissive: 0xff6622, emissiveIntensity: 0.9, roughness: 0.6 });
  const stairMat = new THREE.MeshStandardMaterial({ color: 0x2a2520, emissive: 0x0a0806, emissiveIntensity: 0.06, roughness: 0.9 });

  const floorGeo = new THREE.PlaneGeometry(H + 4, H + 4, 16, 16);
  floorGeo.rotateX(-Math.PI / 2);
  ground = new THREE.Mesh(floorGeo, floorMat);
  ground.receiveShadow = true;
  ground.position.set(0, 0, 0);
  scene.add(ground);

  const wallThick = 4;
  const wallHeight = 28;
  [-1, 1].forEach((sx) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, H + wallThick * 2), wallMat);
    w.position.set(sx * (TEMPLE_HALF + wallThick * 0.5), wallHeight * 0.5, 0);
    mapGroup.add(w);
  });
  [-1, 1].forEach((sz) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(H + wallThick * 2, wallHeight, wallThick), wallMat);
    w.position.set(0, wallHeight * 0.5, sz * (TEMPLE_HALF + wallThick * 0.5));
    mapGroup.add(w);
  });

  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      if (i === 0 && j === 0) continue;
      const px = i * 32, pz = j * 32;
      if (Math.abs(px) > TEMPLE_HALF - 12 || Math.abs(pz) > TEMPLE_HALF - 12) continue;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, wallHeight - 2, 8), pillarMat);
      pillar.position.set(px, (wallHeight - 2) * 0.5, pz);
      mapGroup.add(pillar);
    }
  }

  const torchPositions = [];
  for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
      const px = i * 24, pz = j * 24;
      if (Math.abs(px) > TEMPLE_HALF - 8 || Math.abs(pz) > TEMPLE_HALF - 8) continue;
      torchPositions.push({ x: px, z: pz });
    }
  }
  torchPositions.forEach(({ x, z }) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 3.5, 6), pillarMat);
    pole.position.set(x, 1.75, z);
    mapGroup.add(pole);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), torchMat);
    flame.position.set(x, 3.8, z);
    mapGroup.add(flame);
    const light = new THREE.PointLight(0xff8844, 2.5, 18);
    light.position.set(x, 4, z);
    mapGroup.add(light);
  });

  const platformData = [
    { x: -50, z: -50, w: 18, h: 18, topY: 2.5 },
    { x: 50, z: -50, w: 18, h: 18, topY: 2.2 },
    { x: -50, z: 50, w: 18, h: 18, topY: 2.8 },
    { x: 50, z: 50, w: 18, h: 18, topY: 2.4 },
    { x: 0, z: -60, w: 14, h: 12, topY: 1.8 },
    { x: -60, z: 0, w: 12, h: 14, topY: 2.0 },
    { x: 60, z: 0, w: 12, h: 14, topY: 2.2 },
  ];
  platformData.forEach(({ x, z, w, h, topY }) => {
    const plat = new THREE.Mesh(new THREE.BoxGeometry(w, topY * 0.5, h), stairMat);
    plat.position.set(x, topY * 0.25, z);
    mapGroup.add(plat);
    templePlatforms.push({ x, z, w, h, topY });
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      const stepW = w * (1 - s * 0.15), stepH = topY / steps;
      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH * 0.5, 2.5), stairMat);
      step.position.set(x + (s % 2 === 0 ? 0 : 2), (s + 0.5) * stepH * 0.5, z - h * 0.5 - 1.25 - s * 1.2);
      mapGroup.add(step);
    }
  });

  const ambient = new THREE.AmbientLight(0x442218, 0.5);
  ambient.name = "templeAmbient";
  mapGroup.add(ambient);
  const dirLight = new THREE.DirectionalLight(0x886644, 0.4);
  dirLight.position.set(20, 40, 20);
  dirLight.name = "templeDir";
  mapGroup.add(dirLight);
}

function buildWorld(mapId) {
  state.currentMapId = mapId || "classic";
  if (mapId === "forest") { clearCurrentWorld(); buildWorldForest(); return; }
  if (mapId === "desert") { clearCurrentWorld(); buildWorldDesert(); return; }
  if (mapId === "ice") { clearCurrentWorld(); buildWorldIce(); return; }
  if (mapId === "swamp") { clearCurrentWorld(); buildWorldSwamp(); return; }
  if (mapId === "island") { clearCurrentWorld(); buildWorldIsland(); return; }
  if (mapId === "arena1" || mapId === "arena2" || mapId === "arena3") { clearCurrentWorld(); buildWorldChunked("classic", progressCb, doneCb); return; }
  clearCurrentWorld();
  buildWorldClassic();
}

function buildWorldFromGLBSync(mapId) {
  mapGroup = new THREE.Group();
  scene.add(mapGroup);
  const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2.2, WORLD_HALF * 2.2, 32, 32);
  groundGeo.rotateX(-Math.PI / 2);
  ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9, metalness: 0.05 }));
  ground.receiveShadow = true;
  scene.add(ground);
  addShrines();
  addLamppostsAndWells();
  addBoundaryWalls();
  addVillages();
  addDifficultyAltars();
  addVendingMachines();
  addBossArenas();
  addRandomTeleportPortals();
  addHardcorePortal();
}

function buildWorldFromGLB(mapId, report, onDone) {
  const cfg = CUSTOM_MAPS[mapId];
  if (!cfg) { report(100, "Hata"); if (onDone) onDone(); return; }
  state.currentMapId = mapId;
  function doLoad() {
    if (typeof window.GLTFLoader === "undefined") {
      report(5, "Loader yukleniyor");
      setTimeout(doLoad, 80);
      return;
    }
    mapGroup = new THREE.Group();
    scene.add(mapGroup);
    const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2.2, WORLD_HALF * 2.2, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9, metalness: 0.05 }));
    ground.receiveShadow = true;
    ground.position.y = -200;
    ground.visible = false;
    scene.add(ground);
    report(15, "Harita yukleniyor");
    const loader = new window.GLTFLoader();
    loader.load(resolveAssetUrl(cfg.url), function(gltf) {
      const model = gltf.scene;
      state.waterMeshes = [];
      state.arenaModel = model;
      model.traverse(function(c) {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.visible = true;
          var mats = Array.isArray(c.material) ? c.material : (c.material ? [c.material] : []);
          mats.forEach(function(m) {
            if (!m) return;
            m.depthWrite = true;
            m.depthTest = true;
            if (m.transparent && m.opacity < 0.99) m.opacity = 0.95;
          });
        }
      });
      if (cfg.hasWater) {
        model.traverse(function(c) {
          if (c.isMesh) {
            var name = (c.name || "").toLowerCase();
            var isWaterName = name.indexOf("water") >= 0 || name.indexOf("su") >= 0 || name.indexOf("sea") >= 0 || name.indexOf("ocean") >= 0;
            var isBlue = false;
            if (c.material) {
              var mat = Array.isArray(c.material) ? c.material[0] : c.material;
              if (mat && mat.color) {
                var r = mat.color.r, g = mat.color.g, b = mat.color.b;
                if (b > r && b > g && b > 0.35) isBlue = true;
              }
            }
            if (isWaterName || isBlue) {
              c.userData.isWater = true;
              state.waterMeshes.push(c);
            }
          }
        });
      }
      var box = new THREE.Box3().setFromObject(model);
      var boxCenter = new THREE.Vector3();
      var boxSize = new THREE.Vector3();
      box.getCenter(boxCenter);
      box.getSize(boxSize);
      var maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z, 0.001);
      var fitScale = (WORLD_HALF * 1.4) / maxDim;
      var s = typeof cfg.scale === "number" ? cfg.scale * fitScale * 0.5 : fitScale;
      s = Math.max(2, Math.min(120, s));
      model.scale.setScalar(s);
      model.position.set(-boxCenter.x * s, -boxCenter.y * s, -boxCenter.z * s);
      mapGroup.add(model);
      model.updateMatrixWorld(true);
      var arenaBox = new THREE.Box3();
      var arenaCenter = new THREE.Vector3();
      var arenaSize = new THREE.Vector3();
      model.traverse(function(c) {
        if (!c.isMesh) return;
        if (state.waterMeshes && state.waterMeshes.indexOf(c) >= 0) return;
        arenaBox.setFromObject(c);
        arenaBox.getCenter(arenaCenter);
        arenaBox.getSize(arenaSize);
        var rx = arenaSize.x * 0.5, rz = arenaSize.z * 0.5;
        var r = Math.max(rx, rz) * 1.15;
        if (r < 0.8) r = 0.8;
        if (r > 45) r = 45;
        if (arenaSize.x > 1.2 || arenaSize.z > 1.2) colliders.push({ x: arenaCenter.x, z: arenaCenter.z, r: r });
      });
      addShrines();
      addDifficultyAltars();
      addVendingMachines();
      addBossArenas();
      addRandomTeleportPortals();
      addHardcorePortal();
      report(100, "Hazir");
      if (onDone) onDone();
    }, undefined, function(err) {
      console.warn("Arena GLB yuklenemedi (dosya yok veya hata):", cfg.url, err);
      if (mapGroup) { scene.remove(mapGroup); mapGroup.traverse(function(c) { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); mapGroup = null; }
      if (ground) { scene.remove(ground); ground.geometry.dispose(); ground.material.dispose(); ground = null; }
      state.arenaModel = null;
      buildWorldFromGLBSync("classic");
      state.currentMapId = "classic";
      report(100, "Hazir (varsayilan - arena dosyasi kontrol et)");
      if (onDone) onDone();
    });
  }
  if (typeof window.GLTFLoader === "undefined") {
    report(5, "Loader yukleniyor");
    var waitStart = Date.now();
    function checkLoader() {
      if (typeof window.GLTFLoader !== "undefined") { doLoad(); return; }
      if (Date.now() - waitStart > 15000) {
        report(100, "Loader hatasi");
        buildWorldFromGLBSync("classic");
        state.currentMapId = "classic";
        if (onDone) onDone();
        return;
      }
      setTimeout(checkLoader, 80);
    }
    window.addEventListener("GLTFLoaderReady", function h() { window.removeEventListener("GLTFLoaderReady", h); doLoad(); }, { once: true });
    setTimeout(checkLoader, 100);
  } else {
    doLoad();
  }
}

let _chunkTreePositions = [];
let _chunkTrunkMat = null;
let _chunkLeafMats = null;
let _chunkGroundGeo = null;

function buildWorldChunked(mapId, onProgress, onDone) {
  state.currentMapId = mapId || "classic";
  if (mapId === "classic") worldRamps = [];
  const loadingEl = document.getElementById("loadingOverlay");
  const progressEl = document.getElementById("loadingProgress");
  function report(pct, text) {
    if (progressEl) progressEl.textContent = text ? text + " " + Math.round(pct) + "%" : Math.round(pct) + "%";
    if (onProgress) onProgress(pct);
  }
  if (mapId === "arena1" || mapId === "arena2" || mapId === "arena3") {
    buildWorldFromGLB(mapId, report, function() {
      if (loadingEl) loadingEl.classList.add("hidden");
      if (onDone) onDone();
    });
    return;
  }
  if (mapId !== "classic") {
    try { buildWorld(mapId); } catch (e) { console.error("buildWorld:", e); }
    report(100, "Hazir");
    if (loadingEl) loadingEl.classList.add("hidden");
    if (onDone) onDone();
    return;
  }
  report(1, "Hazirlaniyor");
  let step = 0;
  let step0Phase = 0;
  function next() {
    if (step === 0 && step0Phase === 0) {
      report(2, "Zemin");
      mapGroup = new THREE.Group();
      scene.add(mapGroup);
      const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2.2, WORLD_HALF * 2.2, 96, 96);
      groundGeo.rotateX(-Math.PI / 2);
      const pos = groundGeo.attributes.position;
      const colors = [];
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const h = sampleTerrainHeight(x, z);
        pos.setY(i, h);
        const r1d = Math.abs(z - Math.sin(x * 0.015) * 40 - 20);
        const r2d = Math.abs(x + 100 - Math.sin(z * 0.012) * 35);
        const nearRiver = Math.min(r1d, r2d) < 12;
        const t = clamp(h / 10, -0.3, 1);
        const n = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.02;
        const rockNoise = Math.sin(x * 0.02) * Math.cos(z * 0.017) * 0.5 + 0.5;
        const dirtNoise = Math.sin((x + z) * 0.01) * 0.5 + 0.5;
        let r, g, b;
        if (nearRiver && h < 0.5) { r = 0.38 + n; g = 0.34 + n; b = 0.24; }
        else if (rockNoise > 0.72) { r = 0.28 + n; g = 0.26 + n; b = 0.22; }
        else if (dirtNoise > 0.65) { r = 0.32 + n; g = 0.28 + n; b = 0.20; }
        else if (t > 0.65) { r = 0.26 + n; g = 0.28 + n; b = 0.24; }
        else if (t > 0.25) { r = 0.14 + n; g = 0.32 + n * 1.2; b = 0.10; }
        else { r = 0.10 + n; g = 0.36 + n * 1.2; b = 0.08; }
        colors.push(clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1));
      }
      pos.needsUpdate = true;
      groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      groundGeo.computeVertexNormals();
      _chunkGroundGeo = groundGeo;
      step0Phase = 1;
      setTimeout(next, 0);
      return;
    }
    if (step === 0 && step0Phase === 1) {
      report(8, "Zemin");
      const grassC = document.createElement("canvas");
      grassC.width = 256; grassC.height = 256;
      const gc = grassC.getContext("2d");
      gc.fillStyle = "#2a3d2a"; gc.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 50; i++) {
        gc.fillStyle = "rgba(" + (35 + Math.random() * 30) + "," + (55 + Math.random() * 40) + "," + (22 + Math.random() * 20) + ",0.35)";
        gc.beginPath(); gc.arc(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 14, 0, Math.PI * 2); gc.fill();
      }
      for (let i = 0; i < 280; i++) {
        const gx = Math.random() * 256, gy = Math.random() * 256;
        gc.strokeStyle = "rgba(" + (22 + Math.random() * 18) + "," + (45 + Math.random() * 35) + "," + (15 + Math.random() * 12) + "," + (0.25 + Math.random() * 0.2) + ")";
        gc.lineWidth = 0.5 + Math.random() * 0.6; gc.beginPath(); gc.moveTo(gx, gy); gc.lineTo(gx + (Math.random() - 0.5) * 2.5, gy - 2 - Math.random() * 4); gc.stroke();
      }
      const grassTex = new THREE.CanvasTexture(grassC);
      grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
      grassTex.repeat.set(100, 100);
      ground = new THREE.Mesh(_chunkGroundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, map: grassTex, color: 0xa8b0a0, roughness: 0.88, metalness: 0.0 }));
      ground.receiveShadow = true;
      scene.add(ground);
      const pathY = 0.04;
      const pathMat = new THREE.MeshStandardMaterial({ color: 0x5a4a38, emissive: 0x2a2018, emissiveIntensity: 0.06, roughness: 0.92, transparent: true, opacity: 0.85 });
      const dirs = [[1, 0.2], [-0.8, 0.6], [0.3, -1], [-0.5, -0.7]];
      for (const [dx, dz] of dirs) {
        const len = Math.hypot(dx, dz);
        for (let t = 15; t < 160; t += 5) {
          const px = dx / len * t + Math.sin(t * 0.08) * 5, pz = dz / len * t + Math.cos(t * 0.06) * 5;
          const p = new THREE.Mesh(new THREE.CircleGeometry(3 + Math.sin(t * 0.2) * 0.8, 10), pathMat);
          p.rotation.x = -Math.PI / 2; p.position.set(px, pathY, pz); mapGroup.add(p);
        }
      }
      step0Phase = 2;
      setTimeout(next, 0);
      return;
    }
    if (step === 0 && step0Phase === 2) {
      report(14, "Su");
      const flatWaterY = 0.01;
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x1a5a6a, emissive: 0x081a28, emissiveIntensity: 0.25, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.78 });
      for (let t = -380; t < 380; t += 18) {
        const rz = Math.sin(t * 0.015) * 40 + 20, ry = flatWaterY;
        const w = new THREE.Mesh(new THREE.CircleGeometry(12, 8), waterMat);
        w.rotation.x = -Math.PI / 2; w.position.set(t, ry, rz); mapGroup.add(w); pondMeshes.push(w);
      }
      for (let t = -380; t < 380; t += 18) {
        const rx = -100 + Math.sin(t * 0.012) * 35, ry = flatWaterY;
        const w = new THREE.Mesh(new THREE.CircleGeometry(10, 8), waterMat);
        w.rotation.x = -Math.PI / 2; w.position.set(rx, ry, t); mapGroup.add(w); pondMeshes.push(w);
      }
      [{x:-300,z:250,r:28},{x:350,z:-250,r:22},{x:0,z:-300,r:18},{x:200,z:300,r:16}].forEach(function(lk) {
        const lake = new THREE.Mesh(new THREE.CircleGeometry(lk.r, 24), waterMat);
        lake.rotation.x = -Math.PI / 2; lake.position.set(lk.x, flatWaterY, lk.z);
        mapGroup.add(lake); pondMeshes.push(lake);
      });
      _chunkTreePositions = [];
      for (let i = 0; i < 650; i++) {
        const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
        const d = Math.hypot(x, z);
        if (d < 18 || d > WORLD_HALF - 2) continue;
        const r1d = Math.abs(z - Math.sin(x * 0.015) * 40 - 20);
        const r2d = Math.abs(x + 100 - Math.sin(z * 0.012) * 35);
        if (r1d < 10 || r2d < 10) continue;
        _chunkTreePositions.push({ x, z });
      }
      _chunkTrunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3220, emissive: 0x1a1208, emissiveIntensity: 0.05, roughness: 0.92 });
      _chunkLeafMats = [
        new THREE.MeshStandardMaterial({ color: 0x2a5030, emissive: 0x0d2012, emissiveIntensity: 0.08, roughness: 0.88 }),
        new THREE.MeshStandardMaterial({ color: 0x1e3d24, emissive: 0x081808, emissiveIntensity: 0.06, roughness: 0.9 }),
        new THREE.MeshStandardMaterial({ color: 0x3a5a38, emissive: 0x142818, emissiveIntensity: 0.1, roughness: 0.86 }),
        new THREE.MeshStandardMaterial({ color: 0x8a6a28, emissive: 0x3a2810, emissiveIntensity: 0.08, roughness: 0.88 }),
      ];
      report(20, "Zemin");
      step = 1;
      step0Phase = 0;
      setTimeout(next, 0);
      return;
    }
    if (step >= 1 && step <= 3) {
      addInstancedForest(_chunkTreePositions);
      report(64, "Agaclar");
      step = 5;
      setTimeout(next, 0);
      return;
    }
    if (step === 5) {
      for (let i = 0; i < 260; i++) {
        const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
        if (Math.hypot(x, z) < 12 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
        const s = 0.5 + Math.random() * 1.4;
        const sy = s * (0.6 + Math.random() * 0.5);
        worldDecorData.push({ type: "rock", x, z, s, sy, rot: [Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.2], matIndex: Math.floor(Math.random() * 2), mesh: null });
        if (s > 0.8) colliders.push({ x, z, r: 0.5 * s });
      }
      const flowerColors = [0xff6688, 0xffaa44, 0xdd66ff, 0x66ccff, 0xffff66];
      for (let i = 0; i < 320; i++) {
        const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
        if (Math.hypot(x, z) < 12 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
        const s = 0.45 + Math.random() * 0.75;
        worldDecorData.push({ type: "bush", x, z, s, mesh: null });
        if (Math.random() < 0.25) {
          const fc = flowerColors[Math.floor(Math.random() * flowerColors.length)];
          worldDecorData.push({ type: "flower", x: x + (Math.random() - 0.5) * 0.3, z: z + (Math.random() - 0.5) * 0.3, s, flowerColor: fc, mesh: null });
        }
      }
      report(70, "Dekor");
      setTimeout(function step5Part2() {
        for (let i = 0; i < 150; i++) {
          const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
          if (Math.hypot(x, z) < 14 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
          const s = 0.25 + Math.random() * 0.5;
          const variant = Math.random() < 0.6 ? "red" : "brown";
          worldDecorData.push({ type: "mushroom", x, z, s, variant, mesh: null });
        }
        const miniTypes = ["chair", "cone", "box", "tire", "ball"];
        for (let i = 0; i < 70; i++) {
          const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
          if (Math.hypot(x, z) < 18 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
          const s = 0.4 + Math.random() * 0.5;
          const type = miniTypes[Math.floor(Math.random() * miniTypes.length)];
          worldDecorData.push({ type, x, z, s, rot: Math.random() * Math.PI * 2, mesh: null });
        }
        const jumpPadMat = new THREE.MeshStandardMaterial({ color: 0x44ff88, emissive: 0x11cc44, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.2 });
        [{x:45,z:45},{x:-90,z:70},{x:150,z:-90},{x:-160,z:-50},{x:0,z:-140},{x:200,z:110},{x:-50,z:-200},{x:90,z:180},{x:-280,z:130},{x:320,z:-40},{x:-130,z:320},{x:260,z:260}].forEach(function(jp) {
          const y = sampleTerrainHeight(jp.x, jp.z);
          colliders.push({ x: jp.x, z: jp.z, r: 1.85 });
          classicPlatforms.push({ x: jp.x, z: jp.z, hw: 1.7, hd: 1.7, topY: y + 0.25 });
          const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.25, 12), jumpPadMat);
          pad.position.set(jp.x, y + 0.12, jp.z); pad.userData.isJumpPad = true; pad.userData.padPos = new THREE.Vector3(jp.x, y, jp.z); mapGroup.add(pad);
          const glow = new THREE.Mesh(new THREE.RingGeometry(1.3, 2.0, 20), new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
          glow.rotation.x = -Math.PI / 2; glow.position.set(jp.x, y + 0.25, jp.z); mapGroup.add(glow);
        });
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, emissive: 0x3d2d08, emissiveIntensity: 0.08, roughness: 0.85 });
        const barrelGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.85, 10);
        const barrelPos = [];
        for (let i = 0; i < 48; i++) {
          const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
          if (Math.hypot(x, z) < 15 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
          barrelPos.push({ x, z });
          colliders.push({ x, z, r: 0.45 });
        }
        if (barrelPos.length) {
          const barrelInst = addInstancedMesh(barrelGeo, barrelMat, barrelPos.length);
          for (let bi = 0; bi < barrelPos.length; bi++) {
            const bp = barrelPos[bi];
            setInstanceAt(barrelInst, bi, bp.x, sampleTerrainHeight(bp.x, bp.z) + 0.42, bp.z, 0, 1, 1, 1);
          }
          barrelInst.instanceMatrix.needsUpdate = true;
          mapGroup.add(barrelInst);
        }
        buildWorldDecorInstances();
        report(85, "Dekor");
        step = 6;
        setTimeout(next, 0);
      }, 0);
      return;
    }
    if (step === 6) {
      const addSteps = [
        [86, "Rampalar", function() { addClassicRamps(); }],
        [88, "Binalar", function() { addBuildings(); }],
        [90, "Tapinaklar", function() { addShrines(); }],
        [92, "Dekor", function() { addDecorativeProps(); addRegionBeacons(); }],
        [94, "Sahne", function() { addLamppostsAndWells(); addGrassField(); }],
        [96, "Duvarlar", function() { addAmbientParticles(); addBoundaryWalls(); }],
        [98, "Noktalar", function() { addVillages(); addDifficultyAltars(); addVendingMachines(); }],
        [100, "Hazir", function() { addBossArenas(); addParkourZones(); addCloudsOnHills(); addRandomTeleportPortals(); addHardcorePortal(); addTransitionAltar(); if (loadingEl) loadingEl.classList.add("hidden"); if (onDone) onDone(); }]
      ];
      let idx = 0;
      function runNext() {
        if (idx >= addSteps.length) return;
        const stepItem = addSteps[idx];
        const pct = stepItem[0];
        const label = stepItem[1];
        const fn = stepItem[2];
        report(pct, label);
        idx++;
        setTimeout(function() {
          try { fn(); } catch (e) { console.error("Load step " + pct + "%:", e); }
          if (pct < 100) setTimeout(runNext, 0);
        }, 0);
      }
      runNext();
      return;
    }
  }
  next();
}

function buildWorldClassic() {
  mapGroup = new THREE.Group();
  scene.add(mapGroup);

  // === GROUND MESH with biome vertex colors ===
  const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2.2, WORLD_HALF * 2.2, 96, 96);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = sampleTerrainHeight(x, z);
    pos.setY(i, h);
    const r1d = Math.abs(z - Math.sin(x * 0.015) * 40 - 20);
    const r2d = Math.abs(x + 100 - Math.sin(z * 0.012) * 35);
    const nearRiver = Math.min(r1d, r2d) < 12;
    const t = clamp(h / 10, -0.3, 1);
    const n = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.025;
    let r, g, b;
    if (nearRiver && h < 0.5) { r = 0.52 + n; g = 0.48 + n; b = 0.32; }
    else if (t > 0.65) { r = 0.38 + n; g = 0.40 + n; b = 0.33; }
    else if (t > 0.25) { r = 0.20 + n; g = 0.48 + n * 2; b = 0.14; }
    else { r = 0.16 + n; g = 0.55 + n * 2; b = 0.10; }
    colors.push(clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1));
  }
  pos.needsUpdate = true;
  groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  const grassC = document.createElement("canvas");
  grassC.width = 256; grassC.height = 256;
  const gc = grassC.getContext("2d");
  gc.fillStyle = "#5a9a5a"; gc.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 50; i++) {
    gc.fillStyle = `rgba(${50 + Math.random() * 40}, ${100 + Math.random() * 60}, ${30 + Math.random() * 30}, 0.3)`;
    gc.beginPath(); gc.arc(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 18, 0, Math.PI * 2); gc.fill();
  }
  for (let i = 0; i < 600; i++) {
    const gx = Math.random() * 256, gy = Math.random() * 256;
    gc.strokeStyle = `rgba(${30 + Math.random() * 25}, ${80 + Math.random() * 70}, ${20 + Math.random() * 20}, ${0.3 + Math.random() * 0.3})`;
    gc.lineWidth = 0.7 + Math.random(); gc.beginPath(); gc.moveTo(gx, gy); gc.lineTo(gx + (Math.random() - 0.5) * 3, gy - 3 - Math.random() * 5); gc.stroke();
  }
  const grassTex = new THREE.CanvasTexture(grassC);
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(100, 100);
  ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, map: grassTex, color: 0xdddddd, roughness: 0.82, metalness: 0.0 }));
  ground.receiveShadow = true;
  scene.add(ground);

  addClassicRamps();

  // === DIRT PATHS from spawn ===
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x9a8060, emissive: 0x4a3a20, emissiveIntensity: 0.1, roughness: 0.9, transparent: true, opacity: 0.8 });
  const dirs = [[1, 0.2], [-0.8, 0.6], [0.3, -1], [-0.5, -0.7]];
  for (const [dx, dz] of dirs) { const len = Math.hypot(dx, dz);
    for (let t = 15; t < 160; t += 5) { const px = dx / len * t + Math.sin(t * 0.08) * 5, pz = dz / len * t + Math.cos(t * 0.06) * 5;
      const p = new THREE.Mesh(new THREE.CircleGeometry(3 + Math.sin(t * 0.2) * 0.8, 10), pathMat);
      p.rotation.x = -Math.PI / 2; p.position.set(px, sampleTerrainHeight(px, pz) + 0.04, pz); mapGroup.add(p);
  }}

  // === WATER (classic: duz zeminde y=0.01, z-fight yok) ===
  const waterYClassic = 0.01;
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x2288bb, emissive: 0x0a3050, emissiveIntensity: 0.35, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.8 });
  for (let t = -380; t < 380; t += 14) {
    const rz = Math.sin(t * 0.015) * 40 + 20, ry = waterYClassic;
    const w = new THREE.Mesh(new THREE.CircleGeometry(12, 10), waterMat);
    w.rotation.x = -Math.PI / 2; w.position.set(t, ry, rz); mapGroup.add(w); pondMeshes.push(w);
  }
  for (let t = -380; t < 380; t += 14) {
    const rx = -100 + Math.sin(t * 0.012) * 35, ry = waterYClassic;
    const w = new THREE.Mesh(new THREE.CircleGeometry(10, 10), waterMat);
    w.rotation.x = -Math.PI / 2; w.position.set(rx, ry, t); mapGroup.add(w); pondMeshes.push(w);
  }
  [{x:-300,z:250,r:28},{x:350,z:-250,r:22},{x:0,z:-300,r:18},{x:200,z:300,r:16}].forEach(lk => {
    const lake = new THREE.Mesh(new THREE.CircleGeometry(lk.r, 28), waterMat);
    lake.rotation.x = -Math.PI / 2; lake.position.set(lk.x, waterYClassic, lk.z);
    mapGroup.add(lake); pondMeshes.push(lake);
  });

  // === TREES / ROCKS / BUSHES (instanced) ===
  _chunkTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, emissive: 0x3a2415, emissiveIntensity: 0.06, roughness: 0.9 });
  _chunkLeafMats = [
    new THREE.MeshStandardMaterial({ color: 0x3ab847, emissive: 0x1a5a22, emissiveIntensity: 0.12, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x2d8a3a, emissive: 0x104a18, emissiveIntensity: 0.1, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x55c855, emissive: 0x2a6a2a, emissiveIntensity: 0.15, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0xd4a030, emissive: 0x6a4a10, emissiveIntensity: 0.1, roughness: 0.85 }),
  ];
  const treePos = [];
  for (let i = 0; i < 1200; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    const d = Math.hypot(x, z);
    if (d < 18 || d > WORLD_HALF - 2) continue;
    const r1d = Math.abs(z - Math.sin(x * 0.015) * 40 - 20);
    const r2d = Math.abs(x + 100 - Math.sin(z * 0.012) * 35);
    if (r1d < 10 || r2d < 10) continue;
    treePos.push({ x, z });
  }
  addInstancedForest(treePos);
  worldDecorData.length = 0;
  worldDecorInstanced = false;
  for (let i = 0; i < 620; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 12 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
    const s = 0.5 + Math.random() * 1.4;
    const sy = s * (0.6 + Math.random() * 0.5);
    worldDecorData.push({ type: "rock", x, z, s, sy, rot: [Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.2], matIndex: Math.floor(Math.random() * 2), mesh: null });
    if (s > 0.8) colliders.push({ x, z, r: 0.5 * s });
  }
  const flowerColors = [0xff6688, 0xffaa44, 0xdd66ff, 0x66ccff, 0xffff66];
  for (let i = 0; i < 780; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 12 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
    const s = 0.45 + Math.random() * 0.75;
    worldDecorData.push({ type: "bush", x, z, s, mesh: null });
    if (Math.random() < 0.25) {
      const fc = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      worldDecorData.push({ type: "flower", x: x + (Math.random() - 0.5) * 0.3, z: z + (Math.random() - 0.5) * 0.3, s, flowerColor: fc, mesh: null });
    }
  }
  buildWorldDecorInstances();

  // === JUMP PADS === (collision: icinden gecmeyelim)
  const jumpPadMat = new THREE.MeshStandardMaterial({ color: 0x44ff88, emissive: 0x11cc44, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.2 });
  [{x:45,z:45},{x:-90,z:70},{x:150,z:-90},{x:-160,z:-50},{x:0,z:-140},{x:200,z:110},{x:-50,z:-200},{x:90,z:180},{x:-280,z:130},{x:320,z:-40},{x:-130,z:320},{x:260,z:260}].forEach(jp => {
    const y = sampleTerrainHeight(jp.x, jp.z);
    colliders.push({ x: jp.x, z: jp.z, r: 1.85 });
    classicPlatforms.push({ x: jp.x, z: jp.z, hw: 1.7, hd: 1.7, topY: y + 0.25 });
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.25, 12), jumpPadMat);
    pad.position.set(jp.x, y + 0.12, jp.z); pad.userData.isJumpPad = true; pad.userData.padPos = new THREE.Vector3(jp.x, y, jp.z); mapGroup.add(pad);
    const glow = new THREE.Mesh(new THREE.RingGeometry(1.3, 2.0, 20), new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(jp.x, y + 0.25, jp.z); mapGroup.add(glow);
  });

  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, emissive: 0x3d2d08, emissiveIntensity: 0.08, roughness: 0.85 });
  const barrelGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.85, 10);
  const barrelPos = [];
  for (let i = 0; i < 48; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 15 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
    barrelPos.push({ x, z });
    colliders.push({ x, z, r: 0.45 });
  }
  if (barrelPos.length) {
    const barrelInst = addInstancedMesh(barrelGeo, barrelMat, barrelPos.length);
    for (let bi = 0; bi < barrelPos.length; bi++) {
      const bp = barrelPos[bi];
      setInstanceAt(barrelInst, bi, bp.x, sampleTerrainHeight(bp.x, bp.z) + 0.42, bp.z, 0, 1, 1, 1);
    }
    barrelInst.instanceMatrix.needsUpdate = true;
    mapGroup.add(barrelInst);
  }

  // Araba pisti + park alanı
  addRaceTrackAndParking();

  addCityZone();
  addBuildings();
  addShrines();
  addDecorativeProps();
  addLamppostsAndWells();
  addGrassField();
  addAmbientParticles();
  addBoundaryWalls();
  addVillages();
  addDifficultyAltars();
  addVendingMachines();
  addBossArenas();
  addParkourZones();
  addCloudsOnHills();
  addRandomTeleportPortals();
  addHardcorePortal();
  addTransitionAltar();
}

// Tepelerde bulutlar (classic harita)
function addCloudsOnHills() {
  if (!mapGroup || (state.currentMapId && state.currentMapId !== "classic")) return;
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
  const positions = [
    { x: 220, z: 40, baseY: 10, scale: 14 },
    { x: -260, z: -140, baseY: 8, scale: 11 },
    { x: 60, z: 150, baseY: 6, scale: 8 },
    { x: 180, z: -60, baseY: 6, scale: 7 },
    { x: -80, z: -200, baseY: 5, scale: 6 },
  ];
  for (const p of positions) {
    const y = typeof getGroundHeight === "function" ? getGroundHeight(p.x, p.z) : 0;
    const cloudY = y + p.baseY;
    const s = p.scale * 0.5;
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), cloudMat);
    cloud.position.set(p.x + (Math.random() - 0.5) * 6, cloudY, p.z + (Math.random() - 0.5) * 6);
    cloud.scale.set(1.4, 0.5, 1.2);
    mapGroup.add(cloud);
    const cloud2 = new THREE.Mesh(new THREE.SphereGeometry(s * 0.8, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), cloudMat);
    cloud2.position.set(p.x - 4, cloudY + 1, p.z + 5);
    cloud2.scale.set(1.2, 0.45, 1.1);
    mapGroup.add(cloud2);
  }
}

function addTransitionAltar() {
  const x = 0, z = 280;
  const y = sampleTerrainHeight(x, z);
  transitionAltarPos = { x, z, y };
  const g = new THREE.Group();
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0x2a3a5a, emissive: 0x0a1525, roughness: 0.7, metalness: 0.2 }));
  platform.position.y = 0.3;
  const ring = new THREE.Mesh(new THREE.RingGeometry(5, 7, 32), new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.35;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0x3a4a6a, emissive: 0x152535, emissiveIntensity: 0.2, roughness: 0.6 }));
  pillar.position.y = 1.25;
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), new THREE.MeshStandardMaterial({ color: 0x66aaff, emissive: 0x2266aa, emissiveIntensity: 0.6, roughness: 0.2 }));
  orb.position.y = 2.8;
  g.add(platform, ring, pillar, orb);
  g.position.set(x, y, z);
  g.userData.isTransitionAltar = true;
  mapGroup.add(g);
}

function buildWorldForest() {
  mapGroup = new THREE.Group();
  scene.add(mapGroup);
  const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2.2, WORLD_HALF * 2.2, 200, 200);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = sampleTerrainHeight(x, z);
    pos.setY(i, h);
    const n = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.03;
    const r = 0.12 + n, g = 0.35 + n, b = 0.12 + n;
    colors.push(clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1));
  }
  pos.needsUpdate = true;
  groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  const grassC = document.createElement("canvas");
  grassC.width = 256; grassC.height = 256;
  const gc = grassC.getContext("2d");
  gc.fillStyle = "#2a4a2a"; gc.fillRect(0, 0, 256, 256);
  const grassTex = new THREE.CanvasTexture(grassC);
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(100, 100);
  ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, map: grassTex, color: 0x3a5a3a, roughness: 0.88, metalness: 0.0 }));
  ground.receiveShadow = true;
  scene.add(ground);
  addClassicRamps();
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x6a5040, emissive: 0x2a2018, emissiveIntensity: 0.1, roughness: 0.9, transparent: true, opacity: 0.7 });
  for (let t = 20; t < 140; t += 8) {
    const px = (Math.random() - 0.5) * 200, pz = (Math.random() - 0.5) * 200;
    const p = new THREE.Mesh(new THREE.CircleGeometry(2.5, 10), pathMat);
    p.rotation.x = -Math.PI / 2; p.position.set(px, sampleTerrainHeight(px, pz) + 0.04, pz); mapGroup.add(p);
  }
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x1a5566, emissive: 0x082830, emissiveIntensity: 0.3, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.8 });
  [{x:-250,z:200,r:20},{x:300,z:-200,r:18},{x:0,z:-250,r:14}].forEach(lk => {
    const lake = new THREE.Mesh(new THREE.CircleGeometry(lk.r, 28), waterMat);
    lake.rotation.x = -Math.PI / 2; lake.position.set(lk.x, sampleTerrainHeight(lk.x, lk.z) - 0.3, lk.z);
    mapGroup.add(lake); pondMeshes.push(lake);
  });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3020, emissive: 0x1a1008, emissiveIntensity: 0.08, roughness: 0.9 });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x2a6a2a, emissive: 0x0d300d, emissiveIntensity: 0.15, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x1a501a, emissive: 0x082008, emissiveIntensity: 0.12, roughness: 0.85 }),
  ];
  for (let i = 0; i < 3600; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 15 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
    const s = 1.2 + Math.random() * 1.0, hm = 0.9 + Math.random() * 0.6;
    const g = new THREE.Group();
    const th = 2.8 * hm;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.38, th, 6), trunkMat);
    trunk.position.y = th * 0.5;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.6, 7, 6), leafMats[Math.floor(Math.random() * leafMats.length)]);
    crown.position.y = th + 1.2; crown.scale.set(1, 0.9, 1);
    g.add(trunk, crown);
    g.scale.setScalar(s); g.position.set(x, sampleTerrainHeight(x, z), z);
    g.userData.isTree = true; g.userData.phase = i * 0.7;
    mapGroup.add(g);
    colliders.push({ x, z, r: 0.9 * s });
  }
  addShrines(); addDecorativeProps(); addLamppostsAndWells(); addBoundaryWalls(); addVillages(); addDifficultyAltars(); addVendingMachines(); addBossArenas(); addParkourZones(); addRandomTeleportPortals(); addHardcorePortal();
  addTransitionAltar();
}

function buildWorldLabyrinth() {
  mapGroup = new THREE.Group();
  scene.add(mapGroup);
  const CELL = 22;
  const GRID = Math.floor((WORLD_HALF * 2) / CELL);
  const maze = [];
  for (let gz = 0; gz < GRID; gz++) {
    maze[gz] = [];
    for (let gx = 0; gx < GRID; gx++) {
      const edge = gx === 0 || gx === GRID - 1 || gz === 0 || gz === GRID - 1;
      maze[gz][gx] = edge || Math.random() < 0.28;
    }
  }
  const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2.2, WORLD_HALF * 2.2, 64, 64);
  groundGeo.rotateX(-Math.PI / 2);
  ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x3a3540, roughness: 0.9, metalness: 0.05 }));
  ground.receiveShadow = true;
  scene.add(ground);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a4555, emissive: 0x1a1825, emissiveIntensity: 0.2, roughness: 0.85 });
  const half = (GRID * CELL) * 0.5;
  for (let gz = 0; gz < GRID; gz++) {
    for (let gx = 0; gx < GRID; gx++) {
      if (!maze[gz][gx]) continue;
      const wx = gx * CELL - half + CELL * 0.5;
      const wz = gz * CELL - half + CELL * 0.5;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.92, 4, CELL * 0.92), wallMat);
      wall.position.set(wx, 2, wz);
      mapGroup.add(wall);
      colliders.push({ x: wx, z: wz, r: CELL * 0.55 });
    }
  }
  addShrines(); addLamppostsAndWells(); addBoundaryWalls(); addVillages(); addDifficultyAltars(); addVendingMachines(); addBossArenas(); addRandomTeleportPortals(); addHardcorePortal();
}

function buildWorldDesert() {
  mapGroup = new THREE.Group();
  scene.add(mapGroup);
  const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2.2, WORLD_HALF * 2.2, 200, 200);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = sampleTerrainHeight(x, z);
    pos.setY(i, h);
    const n = (Math.sin(x * 0.08) * Math.cos(z * 0.08) + 1) * 0.5;
    const r = 0.82 - n * 0.08, g = 0.58 - n * 0.1, b = 0.32 - n * 0.06;
    colors.push(clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1));
  }
  pos.needsUpdate = true;
  groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  const sandC = document.createElement("canvas");
  sandC.width = 256; sandC.height = 256;
  const sc = sandC.getContext("2d");
  sc.fillStyle = "#c49a6c"; sc.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 350; i++) {
    sc.fillStyle = `rgba(${180 + Math.random() * 40},${120 + Math.random() * 35},${60 + Math.random() * 25},${0.4 + Math.random() * 0.4})`;
    sc.beginPath(); sc.arc(Math.random() * 256, Math.random() * 256, 1.5 + Math.random() * 3, 0, Math.PI * 2); sc.fill();
  }
  const sandTex = new THREE.CanvasTexture(sandC);
  sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
  sandTex.repeat.set(90, 90);
  ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, map: sandTex, color: 0xd4a574, roughness: 0.94, metalness: 0.02 }));
  ground.receiveShadow = true;
  scene.add(ground);
  const rockMats = [
    new THREE.MeshStandardMaterial({ color: 0x8a7a6a, emissive: 0x3a3025, emissiveIntensity: 0.1, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0x7a6a5a, emissive: 0x2a2218, emissiveIntensity: 0.08, roughness: 0.92 }),
  ];
  for (let i = 0; i < 450; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 15 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
    const s = 0.6 + Math.random() * 1.2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), rockMats[Math.floor(Math.random() * 2)]);
    rock.scale.set(s, s * (0.5 + Math.random() * 0.5), s);
    rock.position.set(x, getGroundHeight(x, z) + 0.15 * s, z);
    rock.rotation.set(Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.2);
    mapGroup.add(rock);
    if (s > 0.9 && colliders.length < 400) colliders.push({ x, z, r: 0.5 * s });
  }
  const cactusMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a, emissive: 0x0d2a0d, emissiveIntensity: 0.08, roughness: 0.9 });
  const cactusArmMat = new THREE.MeshStandardMaterial({ color: 0x256030, emissive: 0x0a200a, emissiveIntensity: 0.06, roughness: 0.92 });
  for (let i = 0; i < 180; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 18 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
    const y = getGroundHeight(x, z);
    const g = new THREE.Group();
    const main = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.8, 6), cactusMat);
    main.position.y = 0.9;
    g.add(main);
    if (Math.random() < 0.7) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.9, 5), cactusArmMat);
      arm.position.set(0.22, 1.1 + Math.random() * 0.4, 0);
      arm.rotation.z = -0.4;
      g.add(arm);
    }
    if (Math.random() < 0.5) {
      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.6, 5), cactusArmMat);
      arm2.position.set(-0.18, 0.8 + Math.random() * 0.5, 0.15);
      arm2.rotation.z = 0.35;
      g.add(arm2);
    }
    g.position.set(x, y, z);
    g.rotation.y = Math.random() * Math.PI * 2;
    mapGroup.add(g);
    colliders.push({ x, z, r: 0.35 });
  }
  addShrines(); addDecorativeProps(); addLamppostsAndWells(); addBoundaryWalls(); addVillages(); addDifficultyAltars(); addVendingMachines(); addBossArenas(); addParkourZones(); addRandomTeleportPortals(); addHardcorePortal();
  addTransitionAltar();
}

function buildWorldIce() {
  mapGroup = new THREE.Group();
  scene.add(mapGroup);
  const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2.2, WORLD_HALF * 2.2, 128, 128);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = sampleTerrainHeight(x, z);
    pos.setY(i, h);
    const n = (Math.sin(x * 0.06) * Math.cos(z * 0.06) + 1) * 0.5;
    const r = 0.96 - n * 0.02, g = 0.98 - n * 0.02, b = 1.0;
    colors.push(clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1));
  }
  pos.needsUpdate = true;
  groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  const snowC = document.createElement("canvas");
  snowC.width = 256; snowC.height = 256;
  const sc = snowC.getContext("2d");
  sc.fillStyle = "#e8f4fc"; sc.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) {
    sc.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.4})`;
    sc.beginPath(); sc.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 0, Math.PI * 2); sc.fill();
  }
  const snowTex = new THREE.CanvasTexture(snowC);
  snowTex.wrapS = snowTex.wrapT = THREE.RepeatWrapping;
  snowTex.repeat.set(80, 80);
  ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, map: snowTex, color: 0xf0f8ff, roughness: 0.92, metalness: 0.05 }));
  ground.receiveShadow = true;
  scene.add(ground);
  const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 280; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    const s = 0.06 + Math.random() * 0.14;
    const flake = new THREE.Mesh(new THREE.SphereGeometry(s, 4, 4), snowMat);
    flake.position.set(x, sampleTerrainHeight(x, z) + 0.4 + Math.random() * 2.2, z);
    mapGroup.add(flake);
  }
  const iceRockMat = new THREE.MeshStandardMaterial({ color: 0xb8c8d8, roughness: 0.9, metalness: 0.05 });
  for (let i = 0; i < 120; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 1.8, z = (Math.random() - 0.5) * WORLD_HALF * 1.8;
    if (Math.hypot(x, z) < 25) continue;
    const s = 0.4 + Math.random() * 0.9;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), iceRockMat);
    rock.scale.set(s, s * 0.6, s);
    rock.position.set(x, sampleTerrainHeight(x, z) + 0.1, z);
    rock.rotation.set(Math.random() * 0.2, Math.random() * Math.PI * 2, 0);
    mapGroup.add(rock);
  }
  addShrines(); addLamppostsAndWells(); addBoundaryWalls(); addVillages(); addDifficultyAltars(); addVendingMachines(); addBossArenas(); addRandomTeleportPortals(); addHardcorePortal();
}

function buildWorldSwamp() {
  mapGroup = new THREE.Group();
  scene.add(mapGroup);
  const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2.2, WORLD_HALF * 2.2, 200, 200);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = sampleTerrainHeight(x, z);
    pos.setY(i, h);
    const n = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.03;
    const r = 0.12 + n, g = 0.28 + n, b = 0.14 + n;
    colors.push(clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1));
  }
  pos.needsUpdate = true;
  groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  const swampC = document.createElement("canvas");
  swampC.width = 256; swampC.height = 256;
  const gc = swampC.getContext("2d");
  gc.fillStyle = "#1a3a1a"; gc.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) {
    gc.fillStyle = "rgba(40,80,40," + (0.2 + Math.random() * 0.3) + ")";
    gc.beginPath(); gc.arc(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 12, 0, Math.PI * 2); gc.fill();
  }
  const swampTex = new THREE.CanvasTexture(swampC);
  swampTex.wrapS = swampTex.wrapT = THREE.RepeatWrapping;
  swampTex.repeat.set(80, 80);
  ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, map: swampTex, color: 0x2a4a2a, roughness: 0.9, metalness: 0.0 }));
  ground.receiveShadow = true;
  scene.add(ground);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x1a4035, emissive: 0x081a14, emissiveIntensity: 0.25, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.75 });
  [{x:-250,z:200,r:22},{x:280,z:-220,r:18},{x:0,z:-260,r:16},{x:180,z:280,r:14}].forEach(function(lk) {
    const lake = new THREE.Mesh(new THREE.CircleGeometry(lk.r, 24), waterMat);
    lake.rotation.x = -Math.PI / 2; lake.position.set(lk.x, sampleTerrainHeight(lk.x, lk.z) - 0.25, lk.z);
    mapGroup.add(lake); pondMeshes.push(lake);
  });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, emissive: 0x1a1208, emissiveIntensity: 0.08, roughness: 0.92 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, emissive: 0x082008, emissiveIntensity: 0.12, roughness: 0.88 });
  for (let i = 0; i < 2200; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 15 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
    const s = 0.9 + Math.random() * 0.8;
    const th = 2.2 * (0.8 + Math.random() * 0.5);
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, th, 6), trunkMat);
    trunk.position.y = th * 0.5;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 5), leafMat);
    crown.position.y = th + 0.9; crown.scale.set(1, 0.85, 1);
    g.add(trunk, crown);
    g.scale.setScalar(s); g.position.set(x, sampleTerrainHeight(x, z), z);
    g.userData.isTree = true; mapGroup.add(g);
    colliders.push({ x, z, r: 0.7 * s });
  }
  const mushroomMat = new THREE.MeshStandardMaterial({ color: 0xc44a4a, emissive: 0x4a1515, emissiveIntensity: 0.15, roughness: 0.7 });
  const mushroomStem = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9 });
  for (let i = 0; i < 450; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 12 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
    const s = 0.15 + Math.random() * 0.35;
    const y = sampleTerrainHeight(x, z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.3, s * 0.4, s * 1.2, 6), mushroomStem);
    stem.position.set(x, y + s * 0.6, z);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(s * 1.1, 6, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), mushroomMat);
    cap.position.set(x, y + s * 1.4, z);
    mapGroup.add(stem, cap);
  }
  addShrines(); addDecorativeProps(); addLamppostsAndWells(); addBoundaryWalls(); addVillages(); addDifficultyAltars(); addVendingMachines(); addBossArenas(); addParkourZones(); addRandomTeleportPortals(); addHardcorePortal();
  addTransitionAltar();
}

function buildWorldIsland() {
  mapGroup = new THREE.Group();
  scene.add(mapGroup);

  const size = WORLD_HALF * 2.2;
  const ISLAND_LAND_RADIUS = ISLAND_RADIUS - 3;
  const BEACH_INNER = ISLAND_RADIUS - 32;
  const BEACH_OUTER = ISLAND_RADIUS + 2;
  const segs = 140;
  const step = (ISLAND_LAND_RADIUS * 2) / segs;
  const rowLen = segs + 1;
  const positions = [];
  const colors = [];
  const idxMap = [];
  for (let iz = 0; iz <= segs; iz++) {
    for (let ix = 0; ix <= segs; ix++) {
      const x = -ISLAND_LAND_RADIUS + ix * step;
      const z = -ISLAND_LAND_RADIUS + iz * step;
      const d = Math.hypot(x, z);
      if (d > ISLAND_LAND_RADIUS) {
        idxMap.push(-1);
        continue;
      }
      idxMap.push(positions.length / 3);
      const h = getIslandHeight(x, z);
      positions.push(x, h, z);
      const n = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.02;
      const t = 1 - d / ISLAND_LAND_RADIUS;
      if (d > BEACH_INNER) {
        const beachBlend = (d - BEACH_INNER) / (ISLAND_LAND_RADIUS - BEACH_INNER);
        const r = 0.72 + beachBlend * 0.15 + n, g = 0.62 + beachBlend * 0.1 + n, b = 0.38 + n;
        colors.push(clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1));
      } else {
        const r = 0.18 + t * 0.15 + n, g = 0.48 + t * 0.2 + n, b = 0.18 + n;
        colors.push(clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1));
      }
    }
  }
  const indices = [];
  for (let iz = 0; iz < segs; iz++) {
    for (let ix = 0; ix < segs; ix++) {
      const i0 = idxMap[iz * rowLen + ix];
      const i1 = idxMap[iz * rowLen + ix + 1];
      const i2 = idxMap[(iz + 1) * rowLen + ix];
      const i3 = idxMap[(iz + 1) * rowLen + ix + 1];
      if (i0 < 0 || i1 < 0 || i2 < 0 || i3 < 0) continue;
      indices.push(i0, i2, i1, i1, i2, i3);
    }
  }
  const groundGeo = new THREE.BufferGeometry();
  groundGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.setIndex(indices);
  groundGeo.computeVertexNormals();
  const islandC = document.createElement("canvas");
  islandC.width = 256; islandC.height = 256;
  const gc = islandC.getContext("2d");
  gc.fillStyle = "#4a7a4a"; gc.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) {
    gc.fillStyle = "rgba(60,120,50," + (0.25 + Math.random() * 0.3) + ")";
    gc.beginPath(); gc.arc(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 14, 0, Math.PI * 2); gc.fill();
  }
  const islandTex = new THREE.CanvasTexture(islandC);
  islandTex.wrapS = islandTex.wrapT = THREE.RepeatWrapping;
  islandTex.repeat.set(50, 50);
  ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, map: islandTex, color: 0xdddddd, roughness: 0.82, metalness: 0.0 }));
  ground.receiveShadow = true;
  scene.add(ground);

  const sandC = document.createElement("canvas");
  sandC.width = 256; sandC.height = 256;
  const sc = sandC.getContext("2d");
  sc.fillStyle = "#c4a574"; sc.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 120; i++) {
    sc.fillStyle = "rgba(" + (180 + Math.random() * 40) + "," + (160 + Math.random() * 35) + "," + (100 + Math.random() * 30) + "," + (0.4 + Math.random() * 0.4) + ")";
    sc.beginPath(); sc.arc(Math.random() * 256, Math.random() * 256, 1.5 + Math.random() * 4, 0, Math.PI * 2); sc.fill();
  }
  const sandTex = new THREE.CanvasTexture(sandC);
  sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
  sandTex.repeat.set(8, 8);
  const beachMat = new THREE.MeshStandardMaterial({ map: sandTex, color: 0xd4a574, roughness: 0.92, metalness: 0.02 });
  const beachRing = new THREE.Mesh(new THREE.RingGeometry(BEACH_INNER, BEACH_OUTER, 80), beachMat);
  beachRing.rotation.x = -Math.PI / 2;
  beachRing.position.y = ISLAND_WATER_LEVEL + 0.18;
  beachRing.receiveShadow = true;
  mapGroup.add(beachRing);

  const waterMat = new THREE.MeshStandardMaterial({ color: 0x1a6a9a, emissive: 0x082540, emissiveIntensity: 0.4, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.85 });
  const oceanRing = new THREE.Mesh(new THREE.RingGeometry(ISLAND_RADIUS, size * 0.52, 80), waterMat);
  oceanRing.rotation.x = -Math.PI / 2;
  oceanRing.position.y = ISLAND_WATER_LEVEL;
  oceanRing.receiveShadow = true;
  mapGroup.add(oceanRing);
  pondMeshes.push(oceanRing);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, emissive: 0x3a2415, emissiveIntensity: 0.06, roughness: 0.9 });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x3ab847, emissive: 0x1a5a22, emissiveIntensity: 0.12, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x2d8a3a, emissive: 0x104a18, emissiveIntensity: 0.1, roughness: 0.85 }),
  ];
  for (let i = 0; i < 1400; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (ISLAND_RADIUS - 25);
    const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
    if (Math.hypot(x, z) < 20) continue;
    const lm = leafMats[Math.floor(Math.random() * leafMats.length)];
    const s = 1.2 + Math.random() * 0.9, hm = 0.9 + Math.random() * 0.6;
    const g = new THREE.Group();
    const th = 2.8 * hm;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, th, 6), trunkMat);
    trunk.position.y = th * 0.5;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.5, 7, 6), lm);
    crown.position.y = th + 1.2; crown.scale.set(1, 0.88, 1);
    g.add(trunk, crown);
    g.scale.setScalar(s); g.position.set(x, getIslandHeight(x, z), z);
    g.userData.isTree = true; g.userData.phase = i * 0.7;
    mapGroup.add(g);
    colliders.push({ x, z, r: 0.8 * s });
  }

  const rockMats = [
    new THREE.MeshStandardMaterial({ color: 0x7a8a8a, emissive: 0x3a4a4a, emissiveIntensity: 0.08, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0x8a7a6a, emissive: 0x4a3a2a, emissiveIntensity: 0.08, roughness: 0.92 }),
  ];
  for (let i = 0; i < 280; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (ISLAND_RADIUS - 15);
    const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
    if (Math.hypot(x, z) < 15) continue;
    const s = 0.4 + Math.random() * 1.0;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), rockMats[Math.floor(Math.random() * 2)]);
    rock.scale.set(s, s * (0.6 + Math.random() * 0.5), s);
    rock.position.set(x, getIslandHeight(x, z) + 0.12 * s, z);
    rock.rotation.set(Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.2);
    mapGroup.add(rock);
    if (s > 0.7) colliders.push({ x, z, r: 0.45 * s });
  }

  const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d7a2d, emissive: 0x0d3a0d, emissiveIntensity: 0.1, roughness: 0.88 });
  for (let i = 0; i < 400; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (ISLAND_RADIUS - 12);
    const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
    if (Math.hypot(x, z) < 12) continue;
    const s = 0.4 + Math.random() * 0.6;
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), bushMat);
    bush.scale.set(s, s * 0.85, s);
    bush.position.set(x, getIslandHeight(x, z) + 0.18 * s, z);
    mapGroup.add(bush);
  }

  addShrines();
  addLamppostsAndWells();
  addVillages();
  addDifficultyAltars();
  addVendingMachines();
  addBossArenas();
  addRandomTeleportPortals();
  addHardcorePortal();
}

// === CITY ZONE - modern buildings, streets, lamps (chunked for loading) ===
function addCityZone() {
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, emissive: 0x0a1520, emissiveIntensity: 0.05, roughness: 0.7, metalness: 0.2 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, emissive: 0x224466, emissiveIntensity: 0.4, roughness: 0.2 });
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.95, metalness: 0.02 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.4 });
  const lampLightMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
  const positions = [
    { x: -120, z: 80 }, { x: 150, z: -100 }, { x: -200, z: -150 }, { x: 280, z: 120 }, { x: 0, z: -220 },
    { x: -280, z: 50 }, { x: 180, z: 200 }, { x: -80, z: -250 }, { x: 320, z: -80 }, { x: -320, z: -200 },
    { x: 100, z: 280 }, { x: -150, z: 300 }, { x: 250, z: -200 }, { x: -250, z: 180 },
  ];
  const cityBoxes = [];
  const cityWins = [];
  for (const p of positions) {
    const d = Math.hypot(p.x, p.z);
    if (d < 50) continue;
    const y = getGroundHeight(p.x, p.z);
    const w = 8 + Math.random() * 12, depth = 8 + Math.random() * 10, h = 12 + Math.random() * 25;
    cityBoxes.push({ x: p.x, y: y + h * 0.5, z: p.z, sx: w, sy: h, sz: depth });
    colliders.push({ x: p.x, z: p.z, r: Math.max(w, depth) * 0.52 });
    const faceY = p.x > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    for (let wi = 0; wi < 4; wi++) {
      const wx = p.x + (Math.random() - 0.5) * w * 0.6, wz = p.z + (Math.random() - 0.5) * depth * 0.6;
      cityWins.push({ x: wx, y: y + 3 + wi * (h / 4), z: wz, rotY: faceY, sx: 1.2, sy: 1.8, sz: 1 });
    }
  }
  addInstancedPlacements(new THREE.BoxGeometry(1, 1, 1), buildingMat, cityBoxes, { castShadow: true });
  addInstancedPlacements(new THREE.PlaneGeometry(1, 1), windowMat, cityWins);
  const roads = [];
  for (let i = 0; i < 45; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 1.6, z = (Math.random() - 0.5) * WORLD_HALF * 1.6;
    if (Math.hypot(x, z) < 60) continue;
    const y = sampleTerrainHeight(x, z);
    roads.push({ x, y: y + 0.02, z, rotX: -Math.PI / 2, rotY: 0, rotZ: Math.random() * Math.PI * 2, sx: 6 + Math.random() * 4, sy: 20 + Math.random() * 15, sz: 1 });
  }
  addInstancedPlacements(new THREE.PlaneGeometry(1, 1), roadMat, roads, { fullRot: true });
  const posts = [];
  const bulbs = [];
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 1.7, z = (Math.random() - 0.5) * WORLD_HALF * 1.7;
    if (Math.hypot(x, z) < 40) continue;
    const y = sampleTerrainHeight(x, z);
    posts.push({ x, y: y + 2, z, sx: 1, sy: 1, sz: 1 });
    bulbs.push({ x, y: y + 4.2, z, sx: 1, sy: 1, sz: 1 });
    const light = new THREE.PointLight(0xffdd99, 0.5, 12);
    light.position.set(x, y + 4.5, z);
    mapGroup.add(light);
  }
  addInstancedPlacements(new THREE.CylinderGeometry(0.08, 0.12, 4, 6), lampMat, posts);
  addInstancedPlacements(new THREE.SphereGeometry(0.25, 8, 6), lampLightMat, bulbs);
}

// Araba pisti + park yeri (classic map icin)
function addRaceTrackAndParking() {
  if (!mapGroup) return;

  const trackMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.96, metalness: 0.04 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9, metalness: 0.02 });

  // Pistin merkezi: haritanin asagi tarafinda, genis duz alan
  const cx = 0;
  const cz = -260;
  const baseY = sampleTerrainHeight(cx, cz) + 0.02;
  const trackWidth = 16;
  const radiusX = 90;
  const radiusZ = 54;
  const segments = 32;

  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const midA = (a0 + a1) * 0.5;

    const x0 = cx + Math.cos(a0) * radiusX;
    const z0 = cz + Math.sin(a0) * radiusZ;
    const x1 = cx + Math.cos(a1) * radiusX;
    const z1 = cz + Math.sin(a1) * radiusZ;
    const mx = (x0 + x1) * 0.5;
    const mz = (z0 + z1) * 0.5;
    const len = Math.hypot(x1 - x0, z1 - z0);

    const seg = new THREE.Mesh(new THREE.PlaneGeometry(len, trackWidth), trackMat);
    seg.rotation.x = -Math.PI / 2;
    seg.position.set(mx, baseY, mz);
    seg.rotation.z = -midA;
    mapGroup.add(seg);
  }

  // Uzun duz bir kisimda hiz kasmak icin beyaz orta cizgiler
  for (let i = -6; i <= 6; i++) {
    const t = i / 6;
    const x = cx + t * radiusX * 1.4;
    const z = cz - radiusZ;
    const line = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.4), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, baseY + 0.01, z);
    line.rotation.z = 0;
    mapGroup.add(line);
  }

  // Duz kısımda birkac hız tümsegi (goruntu icin, collider eklemiyoruz)
  for (let i = -2; i <= 2; i++) {
    const bx = cx + i * 18;
    const bz = cz - radiusZ + 6;
    const by = baseY + 0.35;
    const bump = new THREE.Mesh(new THREE.BoxGeometry(6, 0.7, trackWidth * 0.7), curbMat);
    bump.position.set(bx, by, bz);
    mapGroup.add(bump);
  }

  // Park alanı: pistin yan tarafinda dikdortgen bir otopark
  const px = 120;
  const pz = -210;
  const py = sampleTerrainHeight(px, pz) + 0.02;
  const lotWidth = 42;
  const lotDepth = 30;

  const lot = new THREE.Mesh(new THREE.PlaneGeometry(lotWidth, lotDepth), trackMat);
  lot.rotation.x = -Math.PI / 2;
  lot.position.set(px, py, pz);
  mapGroup.add(lot);

  // Park yerleri cizgileri
  const slotCount = 8;
  for (let i = 0; i < slotCount; i++) {
    const slotW = lotWidth / slotCount;
    const lx = px - lotWidth * 0.5 + slotW * (i + 0.5);
    const lz = pz - lotDepth * 0.5 + 1.6;
    const line = new THREE.Mesh(new THREE.PlaneGeometry(slotW * 0.8, 0.35), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(lx, py + 0.01, lz);
    mapGroup.add(line);
  }

  // Park alaninin kenarlarina ufak bordur / kaldirim
  const curbH = 0.4;
  const curbW = 0.6;
  const curbY = py + curbH * 0.5;
  // On arka bordur
  for (let i = 0; i < 2; i++) {
    const zOff = (i === 0) ? -lotDepth * 0.5 - curbW * 0.5 : lotDepth * 0.5 + curbW * 0.5;
    const curb = new THREE.Mesh(new THREE.BoxGeometry(lotWidth, curbH, curbW), curbMat);
    curb.position.set(px, curbY, pz + zOff);
    mapGroup.add(curb);
  }
  // Yan bordurlar
  for (let i = 0; i < 2; i++) {
    const xOff = (i === 0) ? -lotWidth * 0.5 - curbW * 0.5 : lotWidth * 0.5 + curbW * 0.5;
    const curb = new THREE.Mesh(new THREE.BoxGeometry(curbW, curbH, lotDepth + curbW * 2), curbMat);
    curb.position.set(px + xOff, curbY, pz);
    mapGroup.add(curb);
  }
}

function addCityZoneChunked(reportFn, onDone) {
  if (!mapGroup) { if (onDone) onDone(); return; }
  if (onDone) onDone();
  return;
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, emissive: 0x0a1520, emissiveIntensity: 0.05, roughness: 0.7, metalness: 0.2 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, emissive: 0x224466, emissiveIntensity: 0.4, roughness: 0.2 });
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.95, metalness: 0.02 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.4 });
  const lampLightMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
  const positions = [
    { x: -120, z: 80 }, { x: 150, z: -100 }, { x: -200, z: -150 }, { x: 280, z: 120 }, { x: 0, z: -220 },
    { x: -280, z: 50 }, { x: 180, z: 200 }, { x: -80, z: -250 }, { x: 320, z: -80 }, { x: -320, z: -200 },
    { x: 100, z: 280 }, { x: -150, z: 300 }, { x: 250, z: -200 }, { x: -250, z: 180 },
  ];
  let idx = 0;
  function doBuildings() {
    const end = Math.min(idx + 4, positions.length);
    for (; idx < end; idx++) {
      const p = positions[idx];
      const d = Math.hypot(p.x, p.z);
      if (d < 50) continue;
      const y = sampleTerrainHeight(p.x, p.z);
      const w = 8 + Math.random() * 12, depth = 8 + Math.random() * 10, h = 12 + Math.random() * 25;
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), buildingMat);
      box.position.set(p.x, y + h * 0.5, p.z);
      box.castShadow = true;
      mapGroup.add(box);
      colliders.push({ x: p.x, z: p.z, r: Math.max(w, depth) * 0.52 });
      for (let wi = 0; wi < 4; wi++) {
        const wx = p.x + (Math.random() - 0.5) * w * 0.6, wz = p.z + (Math.random() - 0.5) * depth * 0.6;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), windowMat);
        win.position.set(wx, y + 3 + wi * (h / 4), wz);
        win.lookAt(wx + (p.x > 0 ? 1 : -1), y, wz);
        mapGroup.add(win);
      }
    }
    if (reportFn) reportFn(86 + (idx / positions.length) * 0.8, "Bolge");
    if (idx < positions.length) { setTimeout(doBuildings, 0); return; }
    setTimeout(doRoads, 0);
  }
  let roadIdx = 0;
  function doRoads() {
    for (let n = 0; n < 15 && roadIdx < 45; n++) {
      let x, z, found = false;
      for (let t = 0; t < 50; t++) {
        x = (Math.random() - 0.5) * WORLD_HALF * 1.6;
        z = (Math.random() - 0.5) * WORLD_HALF * 1.6;
        if (Math.hypot(x, z) >= 60) { found = true; break; }
      }
      if (!found) continue;
      const y = sampleTerrainHeight(x, z);
      const road = new THREE.Mesh(new THREE.PlaneGeometry(6 + Math.random() * 4, 20 + Math.random() * 15), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, y + 0.02, z);
      road.rotation.z = Math.random() * Math.PI * 2;
      mapGroup.add(road);
      roadIdx++;
    }
    if (reportFn) reportFn(87 + (roadIdx / 45) * 0.5, "Bolge");
    if (roadIdx < 45) { setTimeout(doRoads, 0); return; }
    setTimeout(doLamps, 0);
  }
  let lampIdx = 0;
  function doLamps() {
    for (let n = 0; n < 20 && lampIdx < 60; n++) {
      let x, z, found = false;
      for (let t = 0; t < 30; t++) {
        x = (Math.random() - 0.5) * WORLD_HALF * 1.7;
        z = (Math.random() - 0.5) * WORLD_HALF * 1.7;
        if (Math.hypot(x, z) >= 40) { found = true; break; }
      }
      if (!found) continue;
      const y = sampleTerrainHeight(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4, 6), lampMat);
      post.position.set(x, y + 2, z);
      mapGroup.add(post);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), lampLightMat);
      bulb.position.set(x, y + 4.2, z);
      mapGroup.add(bulb);
      const light = new THREE.PointLight(0xffdd99, 0.5, 12);
      light.position.set(x, y + 4.5, z);
      mapGroup.add(light);
      lampIdx++;
    }
    if (reportFn) reportFn(87.5 + (lampIdx / 60) * 0.5, "Bolge");
    if (lampIdx < 60) { setTimeout(doLamps, 0); return; }
    if (onDone) onDone();
  }
  doBuildings();
}

// Boundary walls - segmented to follow terrain
function addBoundaryWalls() {
  if (state.currentMapId === "island") return;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, emissive: 0x1a2530, emissiveIntensity: 0.1, roughness: 0.8, metalness: 0.1 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, emissive: 0x2a3540, emissiveIntensity: 0.08, roughness: 0.7, metalness: 0.15 });
  const wallH = 18, wallThick = 5, half = WORLD_HALF;
  const segLen = 30;
  const edges = [
    { axis: "x", fixed: "z", fixedVal: -half, min: -half, max: half },
    { axis: "x", fixed: "z", fixedVal: half, min: -half, max: half },
    { axis: "z", fixed: "x", fixedVal: -half, min: -half, max: half },
    { axis: "z", fixed: "x", fixedVal: half, min: -half, max: half },
  ];
  const walls = [];
  const trims = [];
  for (const edge of edges) {
    for (let t = edge.min; t < edge.max; t += segLen) {
      const mid = t + segLen * 0.5;
      const wx = edge.axis === "x" ? mid : edge.fixedVal;
      const wz = edge.axis === "z" ? mid : edge.fixedVal;
      const ty = getGroundHeight(wx, wz);
      const sx = edge.axis === "x" ? segLen + 2 : wallThick;
      const sz = edge.axis === "z" ? segLen + 2 : wallThick;
      walls.push({ x: wx, y: ty + wallH * 0.5, z: wz, sx, sy: wallH, sz });
      trims.push({ x: wx, y: ty + wallH + 0.75, z: wz, sx: sx + 1, sy: 1.5, sz: sz + 1 });
    }
  }
  addInstancedPlacements(new THREE.BoxGeometry(1, 1, 1), wallMat, walls, { castShadow: true, receiveShadow: true });
  addInstancedPlacements(new THREE.BoxGeometry(1, 1, 1), topMat, trims);
  const pillars = [];
  for (const cx of [-half, half]) { for (const cz of [-half, half]) {
    const cy = getGroundHeight(cx, cz);
    pillars.push({ x: cx, y: cy + (wallH + 6) * 0.5, z: cz, sx: 1, sy: 1, sz: 1 });
    const torch = new THREE.PointLight(0xff8844, 0.6, 20);
    torch.position.set(cx, cy + wallH + 8, cz); mapGroup.add(torch);
  }}
  addInstancedPlacements(new THREE.CylinderGeometry(3.5, 4.5, wallH + 6, 8), topMat, pillars, { castShadow: true });
}

// NPC Villages
const VILLAGES = [
  { x: -80, z: -80, name: "Kasaba", npcCount: 3 },
  { x: 160, z: -120, name: "Orman Koyu", npcCount: 2 },
  { x: -250, z: 200, name: "Daglarin Koyu", npcCount: 3 },
  { x: 350, z: 200, name: "Ticaret Koyu", npcCount: 4 },
];
let npcMeshes = [];
let npcInteractHint = null;

function addVillages() {
  const houseMat = new THREE.MeshStandardMaterial({ color: 0xc89870, emissive: 0x5a3820, emissiveIntensity: 0.08, roughness: 0.82 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x993030, emissive: 0x441010, emissiveIntensity: 0.1, roughness: 0.78 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.85 });
  const npcSkinMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.5 });
  const clothMats = [
    new THREE.MeshStandardMaterial({ color: 0x3388aa, roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: 0xaa4433, roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: 0x44aa55, roughness: 0.5 }),
  ];
  const npcTypes = ["Silahci", "Sifaci", "Tezgahtar", "Buyucu"];
  const vWalls = [];
  const vRoofs = [];
  const vDoors = [];
  const vFences = [];
  const vGrounds = [];
  for (const village of VILLAGES) {
    if (state.currentMapId === "island" && Math.hypot(village.x, village.z) >= ISLAND_RADIUS - 25) continue;
    const vy = getGroundHeight(village.x, village.z);
    vGrounds.push({ x: village.x, y: vy + 0.06, z: village.z, rotX: -Math.PI / 2, rotY: 0, rotZ: 0, sx: 1, sy: 1, sz: 1 });
    for (let hi = 0; hi < 4; hi++) {
      const angle = (hi / 4) * Math.PI * 2 + 0.3;
      const hx = village.x + Math.cos(angle) * 13, hz = village.z + Math.sin(angle) * 13;
      const hy = getGroundHeight(hx, hz);
      vWalls.push({ x: hx, y: hy + 1.5, z: hz, sx: 1, sy: 1, sz: 1 });
      vRoofs.push({ x: hx, y: hy + 4, z: hz, rotY: Math.PI / 4, sx: 1, sy: 1, sz: 1 });
      vDoors.push({ x: hx, y: hy + 1, z: hz + 2.05, sx: 1, sy: 1, sz: 1 });
      colliders.push({ x: hx, z: hz, r: 2.5 });
    }
    for (let fi = 0; fi < 14; fi++) {
      const fa = (fi / 14) * Math.PI * 2;
      const fx = village.x + Math.cos(fa) * 18, fz = village.z + Math.sin(fa) * 18;
      vFences.push({ x: fx, y: getGroundHeight(fx, fz) + 0.65, z: fz, sx: 1, sy: 1, sz: 1 });
    }
    // NPCs
    for (let ni = 0; ni < village.npcCount; ni++) {
      const na = (ni / village.npcCount) * Math.PI * 2;
      const nx = village.x + Math.cos(na) * 6, nz = village.z + Math.sin(na) * 6;
      const ny = getGroundHeight(nx, nz);
      const npcG = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.2, 8), clothMats[ni % clothMats.length]); body.position.y = 0.9;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), npcSkinMat); head.position.y = 1.8;
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 6), clothMats[ni % clothMats.length]); hat.position.y = 2.15;
      const exc = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffd700 })); exc.position.y = 2.6;
      npcG.add(body, head, hat, exc);
      npcG.position.set(nx, ny, nz);
      npcG.userData.isNpc = true; npcG.userData.npcType = npcTypes[ni % npcTypes.length]; npcG.userData.village = village.name;
      mapGroup.add(npcG); npcMeshes.push(npcG);
    }
    const vLight = new THREE.PointLight(0xffaa44, 0.5, 22);
    vLight.position.set(village.x, vy + 4, village.z); mapGroup.add(vLight);
  }
  addInstancedPlacements(new THREE.CircleGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9 }), vGrounds, { fullRot: true });
  addInstancedPlacements(new THREE.BoxGeometry(4, 3, 4), houseMat, vWalls, { castShadow: true });
  addInstancedPlacements(new THREE.ConeGeometry(3.5, 2, 4), roofMat, vRoofs);
  addInstancedPlacements(new THREE.BoxGeometry(1, 2, 0.1), woodMat, vDoors);
  addInstancedPlacements(new THREE.CylinderGeometry(0.08, 0.1, 1.3, 4), woodMat, vFences);
}

function addDifficultyAltars() {
  const altarMat = new THREE.MeshStandardMaterial({ color: 0x882222, emissive: 0x440808, emissiveIntensity: 0.3, roughness: 0.5, metalness: 0.2 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  [
    { x: 40, z: -60 }, { x: -120, z: -30 }, { x: 80, z: 140 }, { x: -200, z: -50 }, { x: 200, z: -250 }, { x: -100, z: 280 },
    { x: 320, z: 100 }, { x: -320, z: -180 }, { x: 150, z: 330 }, { x: -250, z: 340 }, { x: 400, z: -100 }, { x: -400, z: 100 },
    { x: -60, z: 200 }, { x: 260, z: -80 }, { x: -380, z: -120 }, { x: 180, z: 260 }, { x: -280, z: 180 }, { x: 420, z: 200 }, { x: -420, z: -250 }, { x: 50, z: -350 }
  ].forEach(ap => {
    const ay = getGroundHeight(ap.x, ap.z);
    const g = new THREE.Group();
    const aBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.6, 8), altarMat); aBase.position.y = 0.3; g.add(aBase);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2, 8), altarMat); pillar.position.y = 1.3; g.add(pillar);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.8, roughness: 0.1 }));
    orb.position.y = 2.8; g.add(orb);
    const skullMat = new THREE.MeshStandardMaterial({ color: 0xeeddcc, emissive: 0x332211, emissiveIntensity: 0.15, roughness: 0.85 });
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), skullMat);
    skull.position.y = 3.45; skull.scale.set(1, 1, 0.88);
    g.add(skull);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.5, 16), glowMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1; g.add(ring);
    g.position.set(ap.x, ay, ap.z); g.userData.isAltar = true; g.userData.used = false; g.userData.boost = 0.05;
    mapGroup.add(g); difficultyAltars.push(g);
  });
  addBossShrine();
  addBossSummonShrine();
}

const BOSS_SUMMON_SHRINE_RADIUS = 8;
const BOSS_SUMMON_SHRINE_HOLD = 4;
function addBossSummonShrine() {
  const pos = { x: -38, z: -88 };
  if (state.currentMapId === "island" && Math.hypot(pos.x, pos.z) >= ISLAND_RADIUS - 15) return;
  const y = getGroundHeight(pos.x, pos.z);
  const g = new THREE.Group();
  const purpleGlow = new THREE.MeshBasicMaterial({ color: 0x8822cc, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  const purpleDark = new THREE.MeshStandardMaterial({ color: 0x2a1035, emissive: 0x6610aa, emissiveIntensity: 0.5, roughness: 0.7 });
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x1a0825, emissive: 0x330855, emissiveIntensity: 0.4, roughness: 0.85 }));
  platform.position.y = 0.45; platform.receiveShadow = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.4, 0.5, 12), purpleDark);
  base.position.y = 0.65; base.receiveShadow = true;
  const skullMat = new THREE.MeshStandardMaterial({ color: 0xe8e0e0, emissive: 0x8822cc, emissiveIntensity: 0.7, roughness: 0.6 });
  const skull = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 14), skullMat);
  skull.position.y = 2.4; skull.scale.set(1.2, 1.1, 1); skull.castShadow = true;
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: 0xcc22ff }));
  eyeL.position.set(-0.32, 0.2, 0.42); skull.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: 0xcc22ff }));
  eyeR.position.set(0.32, 0.2, 0.42); skull.add(eyeR);
  const ringGlow = new THREE.Mesh(new THREE.RingGeometry(BOSS_SUMMON_SHRINE_RADIUS - 0.6, BOSS_SUMMON_SHRINE_RADIUS, 40), new THREE.MeshBasicMaterial({ color: 0xaa44ee, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  ringGlow.rotation.x = -Math.PI / 2; ringGlow.position.y = 0.08;
  g.add(platform, base, skull, ringGlow);
  g.position.set(pos.x, y, pos.z);
  g.userData.isBossSummonShrine = true;
  g.userData.insideTime = 0;
  g.userData.used = false;
  mapGroup.add(g); bossSummonShrines.push(g);
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256; labelCanvas.height = 64;
  const lctx = labelCanvas.getContext("2d");
  lctx.font = "bold 36px Segoe UI, sans-serif";
  lctx.textAlign = "center";
  lctx.fillStyle = "#cc66ff";
  lctx.strokeStyle = "#330066";
  lctx.lineWidth = 4;
  lctx.strokeText("BOSS", 128, 42);
  lctx.fillText("BOSS", 128, 42);
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }));
  labelSprite.scale.set(10, 2.5, 1);
  labelSprite.position.y = 4.2;
  g.add(labelSprite);
  const light = new THREE.PointLight(0xaa44ee, 1, BOSS_SUMMON_SHRINE_RADIUS * 2.5);
  light.position.set(0, 3, 0); g.add(light);
}

const BOSS_SHRINE_COOLDOWN = 90;
const BOSS_SHRINE_RADIUS = 7;
function addBossShrine() {
  const pos = { x: 32, z: -95 };
  if (state.currentMapId === "island" && Math.hypot(pos.x, pos.z) >= ISLAND_RADIUS - 15) return;
  const y = getGroundHeight(pos.x, pos.z);
  const g = new THREE.Group();
  const skullMat = new THREE.MeshStandardMaterial({ color: 0xddccaa, emissive: 0x554422, emissiveIntensity: 0.25, roughness: 0.75 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x886600, emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.35 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a2218, emissive: 0x1a0805, emissiveIntensity: 0.35, roughness: 0.85 });
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0x2a1a18, emissive: 0x150808, roughness: 0.8 }));
  platform.position.y = 0.4; platform.receiveShadow = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.4, 12), baseMat);
  base.position.y = 0.6; base.receiveShadow = true;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), skullMat);
  skull.position.y = 1.75; skull.scale.set(1.15, 1, 0.9); skull.castShadow = true;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 5), crownMat);
  crown.position.y = 2.2; crown.rotation.z = Math.PI; crown.castShadow = true;
  skull.add(crown);
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), skullMat);
  hornL.position.set(-0.35, 0.15, 0); hornL.rotation.z = 0.4; skull.add(hornL);
  const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), skullMat);
  hornR.position.set(0.35, 0.15, 0); hornR.rotation.z = -0.4; skull.add(hornR);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(BOSS_SHRINE_RADIUS - 0.5, BOSS_SHRINE_RADIUS, 32), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1;
  const domeMat = new THREE.MeshBasicMaterial({ color: 0xaa4422, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(BOSS_SHRINE_RADIUS, 32, 24), domeMat);
  dome.position.y = 0;
  dome.renderOrder = -1;
  g.add(dome, platform, base, skull, ring);
  g.position.set(pos.x, y, pos.z);
  g.userData.isBossShrine = true;
  g.userData.insideTime = 0;
  g.userData.cooldown = 0;
  mapGroup.add(g); bossShrines.push(g);
  const light = new THREE.PointLight(0xff6622, 0.6, BOSS_SHRINE_RADIUS * 2);
  light.position.set(pos.x, y + 2, pos.z); mapGroup.add(light);
}

function addBuildings() {
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7a8a9a, emissive: 0x2a3540, emissiveIntensity: 0.1, roughness: 0.88 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a4030, emissive: 0x3a2518, emissiveIntensity: 0.08, roughness: 0.92 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.85 });
  const ruinMat = new THREE.MeshStandardMaterial({ color: 0x6b7a6a, emissive: 0x2a3528, emissiveIntensity: 0.12, roughness: 0.9 });
  const bunkerMat = new THREE.MeshStandardMaterial({ color: 0x4a5258, emissive: 0x1a2025, emissiveIntensity: 0.08, roughness: 0.9, metalness: 0.1 });
  const bunkerDark = new THREE.MeshStandardMaterial({ color: 0x3a4248, emissive: 0x12181c, emissiveIntensity: 0.06, roughness: 0.92 });
  const siloMat = new THREE.MeshStandardMaterial({ color: 0x9a8a7a, roughness: 0.9 });
  const buildings = [
    {x:-160,z:120,type:"tower"},{x:200,z:-100,type:"tower"},{x:-250,z:-150,type:"house"},{x:280,z:160,type:"house"},
    {x:100,z:-220,type:"house"},{x:-120,z:250,type:"ruin"},{x:300,z:-250,type:"ruin"},{x:-350,z:50,type:"tower"},
    {x:50,z:350,type:"house"},{x:-400,z:-300,type:"ruin"},{x:380,z:300,type:"tower"},{x:-80,z:-380,type:"house"},
    {x:-30,z:180,type:"house"},{x:140,z:280,type:"tower"},{x:-300,z:-80,type:"house"},{x:420,z:-180,type:"ruin"},
    {x:-180,z:-320,type:"tower"},{x:60,z:-100,type:"house"},{x:-420,z:200,type:"ruin"},{x:250,z:380,type:"house"},
    {x:0,z:-140,type:"bunker"},{x:-200,z:80,type:"farm"},{x:150,z:-180,type:"farm"},{x:-100,z:-280,type:"house"},
    {x:320,z:200,type:"house"},{x:-320,z:-180,type:"farm"},{x:180,z:320,type:"house"},
  ];
  const hBase = [], hRoof = [], hDoor = [];
  const tBase = [], tBody = [], tTop = [];
  const rW1 = [], rW2 = [], rPil = [];
  const fBarn = [], fRoof = [], fSilo = [], fCap = [];
  function yawOff(x, z, lx, lz, rotY) {
    const c = Math.cos(rotY), s = Math.sin(rotY);
    return { x: x + lx * c + lz * s, z: z - lx * s + lz * c };
  }
  for (const p of buildings) {
    const ty = getGroundHeight(p.x, p.z) + 0.02;
    const rotY = (p.type !== "bunker" && p.type !== "farm") ? Math.random() * Math.PI * 2 : 0;
    if (p.type === "farm") {
      fBarn.push({ x: p.x, y: ty + 2.5, z: p.z, sx: 1, sy: 1, sz: 1 });
      fRoof.push({ x: p.x, y: ty + 6, z: p.z, rotY: Math.PI / 4, sx: 1, sy: 1, sz: 1 });
      fSilo.push({ x: p.x + 7, y: ty + 5, z: p.z, sx: 1, sy: 1, sz: 1 });
      fCap.push({ x: p.x + 7, y: ty + 10.75, z: p.z, sx: 1, sy: 1, sz: 1 });
    } else if (p.type === "tower") {
      tBase.push({ x: p.x, y: ty + 1, z: p.z, rotY, sx: 1, sy: 1, sz: 1 });
      tBody.push({ x: p.x, y: ty + 7, z: p.z, rotY, sx: 1, sy: 1, sz: 1 });
      tTop.push({ x: p.x, y: ty + 13.5, z: p.z, rotY, sx: 1, sy: 1, sz: 1 });
    } else if (p.type === "house") {
      hBase.push({ x: p.x, y: ty + 2, z: p.z, rotY, sx: 1, sy: 1, sz: 1 });
      hRoof.push({ x: p.x, y: ty + 5.5, z: p.z, rotY: rotY + Math.PI / 4, sx: 1, sy: 1, sz: 1 });
      const d = yawOff(p.x, p.z, 0, 3.1, rotY);
      hDoor.push({ x: d.x, y: ty + 1.1, z: d.z, rotY, sx: 1, sy: 1, sz: 1 });
    } else if (p.type === "bunker") {
      const g = new THREE.Group();
      const W = 22; const D = 16; const H = 5; const wallThick = 1.8;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(W - wallThick * 2, 0.15, D - wallThick * 2), bunkerDark);
      floor.position.y = 0.075; floor.receiveShadow = true; g.add(floor);
      const wallBack = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, H, wallThick), bunkerMat);
      wallBack.position.set(0, H * 0.5, -(D * 0.5 - wallThick * 0.5)); wallBack.castShadow = true; g.add(wallBack);
      const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(wallThick, H, D), bunkerMat);
      wallLeft.position.set(-(W * 0.5 - wallThick * 0.5), H * 0.5, 0); wallLeft.castShadow = true; g.add(wallLeft);
      const wallRight = new THREE.Mesh(new THREE.BoxGeometry(wallThick, H, D), bunkerMat);
      wallRight.position.set(W * 0.5 - wallThick * 0.5, H * 0.5, 0); wallRight.castShadow = true; g.add(wallRight);
      const wallFrontL = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5 - 3.5, H, wallThick), bunkerMat);
      wallFrontL.position.set(-(W * 0.25 + 1.5), H * 0.5, D * 0.5 - wallThick * 0.5); wallFrontL.castShadow = true; g.add(wallFrontL);
      const wallFrontR = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5 - 3.5, H, wallThick), bunkerMat);
      wallFrontR.position.set(W * 0.25 + 1.5, H * 0.5, D * 0.5 - wallThick * 0.5); wallFrontR.castShadow = true; g.add(wallFrontR);
      const roofPlate = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, wallThick * 0.8, D + 0.4), bunkerDark);
      roofPlate.position.y = H + wallThick * 0.4; roofPlate.castShadow = true; roofPlate.receiveShadow = true; g.add(roofPlate);
      g.position.set(p.x, ty, p.z);
      mapGroup.add(g);
    } else {
      rW1.push({ x: p.x, y: ty + 1.5, z: p.z, rotY, sx: 1, sy: 1, sz: 1 });
      const w2 = yawOff(p.x, p.z, -4, 0, rotY);
      rW2.push({ x: w2.x, y: ty + 1.25, z: w2.z, rotY, sx: 1, sy: 1, sz: 1 });
      const pil = yawOff(p.x, p.z, 2, 2, rotY);
      rPil.push({ x: pil.x, y: ty + 2, z: pil.z, rotY, sx: 1, sy: 1, sz: 1 });
    }
    colliders.push({ x: p.x, z: p.z, r: p.type === "bunker" ? 14 : (p.type === "farm" ? 8 : 5) });
  }
  addInstancedPlacements(new THREE.BoxGeometry(8, 4, 6), stoneMat, hBase, { castShadow: true });
  addInstancedPlacements(new THREE.ConeGeometry(6, 3, 4), roofMat, hRoof);
  addInstancedPlacements(new THREE.BoxGeometry(1.5, 2.2, 0.2), woodMat, hDoor);
  addInstancedPlacements(new THREE.CylinderGeometry(4, 5, 2, 8), stoneMat, tBase);
  addInstancedPlacements(new THREE.CylinderGeometry(3.5, 4, 10, 8), stoneMat, tBody);
  addInstancedPlacements(new THREE.ConeGeometry(4, 3, 8), roofMat, tTop);
  addInstancedPlacements(new THREE.BoxGeometry(10, 3, 1.5), ruinMat, rW1);
  addInstancedPlacements(new THREE.BoxGeometry(1.5, 2.5, 8), ruinMat, rW2);
  addInstancedPlacements(new THREE.CylinderGeometry(0.8, 1, 4, 6), ruinMat, rPil);
  addInstancedPlacements(new THREE.BoxGeometry(12, 5, 8), stoneMat, fBarn, { castShadow: true });
  addInstancedPlacements(new THREE.ConeGeometry(8, 4, 4), roofMat, fRoof);
  addInstancedPlacements(new THREE.CylinderGeometry(3, 3.5, 10, 8), siloMat, fSilo, { castShadow: true });
  addInstancedPlacements(new THREE.ConeGeometry(3.2, 1.5, 8), roofMat, fCap);
}

// === SHRINES ===
const SHRINE_RADIUS = 7;
const SHRINE_HOLD_TIME = 5;

function addShrines() {
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.9, metalness: 0.05 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, emissive: 0x661111, emissiveIntensity: 0.4, roughness: 0.5 });
  const hiltMat = new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0x886622, emissiveIntensity: 0.3, metalness: 0.5 });
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x66ff88, transparent: true, opacity: 0.7 });
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x66ff88, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const positions = [
    { x: -80, z: 120 }, { x: 150, z: -80 }, { x: -200, z: -60 }, { x: 100, z: 200 }, { x: -300, z: 200 },
    { x: 220, z: 80 }, { x: -120, z: -200 }, { x: 280, z: -180 }, { x: -350, z: 60 }, { x: 0, z: 280 },
    { x: 380, z: 120 }, { x: -250, z: -280 }, { x: 90, z: -320 }, { x: -180, z: 320 },
    { x: 120, z: 100 }, { x: -200, z: -150 }, { x: 0, z: 350 }, { x: 400, z: 250 }, { x: -420, z: 300 }, { x: -100, z: -400 }
  ];
  for (let si = 0; si < positions.length; si++) {
    const sp = positions[si];
    if (state.currentMapId === "island" && Math.hypot(sp.x, sp.z) >= ISLAND_RADIUS - 15) continue;
    const y = getGroundHeight(sp.x, sp.z);
    const g = new THREE.Group();
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0x5a6a7a, emissive: 0x1a2530, roughness: 0.75, metalness: 0.15 }));
    platform.position.y = 0.4; platform.receiveShadow = true;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.35, 16), baseMat);
    base.position.y = 0.58; base.receiveShadow = true;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 0.08), bladeMat);
    blade.position.y = 1.65; blade.castShadow = true;
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.14), hiltMat);
    hilt.position.y = 1.05; hilt.castShadow = true;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 6), shaftMat);
    shaft.position.y = 0.75; shaft.castShadow = true;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), glowMat);
    orb.position.y = 2.5;
    const bubble = new THREE.Mesh(new THREE.RingGeometry(SHRINE_RADIUS - 0.5, SHRINE_RADIUS, 32), ringMat);
    bubble.rotation.x = -Math.PI / 2; bubble.position.y = 0.15;
    const domeMat = new THREE.MeshBasicMaterial({ color: 0x44aa66, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(SHRINE_RADIUS, 32, 24), domeMat);
    dome.position.y = 0;
    dome.renderOrder = -1;
    const shrineVoxel = placeVoxelProp("shrine", 0, 0.8, 0, 2.4, true);
    if (shrineVoxel) {
      g.add(dome, platform, shrineVoxel, bubble);
    } else {
      g.add(dome, platform, base, shaft, hilt, blade, orb, bubble);
    }
    g.position.set(sp.x, y, sp.z);
    g.userData.isShrine = true;
    g.userData.used = false;
    g.userData.insideTime = 0;
    g.userData.cooldown = 0;
    g.userData.phase = si * 1.7;
    mapGroup.add(g); shrineGroups.push(g);
    const light = new THREE.PointLight(0x66ff88, 0.5, SHRINE_RADIUS * 2);
    light.position.set(sp.x, y + 2.5, sp.z); mapGroup.add(light);
  }
}

function addDecorativeProps() {
  const cratePlacements = [];
  const crateFallback = [];
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.85 });
  for (let i = 0; i < 70; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 20 || Math.hypot(x, z) > WORLD_HALF - 2) continue;
    const s = 0.5 + Math.random() * 0.55;
    const y = getGroundHeight(x, z);
    if (i % 3 === 0 && hasVoxel("crate")) {
      cratePlacements.push({ x, y, z, rotY: Math.random() * Math.PI, scale: 1 });
    } else {
      crateFallback.push({ x, y: y + s * 0.5, z, s, rotY: Math.random() * Math.PI });
    }
    colliders.push({ x, z, r: s * 0.6 });
  }
  if (cratePlacements.length) addVoxelPropInstances("crate", cratePlacements, 0.85);
  if (crateFallback.length) {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const crateInst = addInstancedMesh(boxGeo, crateMat, crateFallback.length);
    for (let i = 0; i < crateFallback.length; i++) {
      const c = crateFallback[i];
      setInstanceAt(crateInst, i, c.x, c.y, c.z, c.rotY, c.s, c.s, c.s);
    }
    crateInst.instanceMatrix.needsUpdate = true;
    mapGroup.add(crateInst);
  }
  const oakP = [];
  const pineP = [];
  for (let i = 0; i < 28; i++) {
    const x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) < 28 || Math.hypot(x, z) > WORLD_HALF - 8) continue;
    const y = getGroundHeight(x, z);
    const row = { x, y, z, rotY: Math.random() * Math.PI * 2, scale: 1 };
    if (i % 2 === 0) oakP.push(row); else pineP.push(row);
    colliders.push({ x, z, r: 0.7 });
  }
  if (oakP.length) addVoxelPropInstances("tree_oak", oakP, 3.2);
  if (pineP.length) addVoxelPropInstances("tree_pine", pineP, 3.6);
}

function addRegionBeacons() {
  if (!mapGroup) return;
  const spots = [
    { x: 220, z: 40, color: 0x4488ff },
    { x: -260, z: -140, color: 0xaa44ff },
  ];
  for (let i = 0; i < spots.length; i++) {
    const sp = spots[i];
    const y = getGroundHeight(sp.x, sp.z);
    const mat = new THREE.MeshStandardMaterial({ color: sp.color, emissive: sp.color, emissiveIntensity: 0.55, roughness: 0.4 });
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(4, 36, 4), mat);
    shaft.position.set(sp.x, y + 18, sp.z);
    mapGroup.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6, 4), mat);
    tip.position.set(sp.x, y + 39, sp.z);
    mapGroup.add(tip);
    colliders.push({ x: sp.x, z: sp.z, r: 3.2 });
  }
}

function addLamppostsAndWells() {
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.4, roughness: 0.5 });
  const positions = [{ x: 30, z: -30 }, { x: -40, z: 40 }, { x: 70, z: 70 }, { x: -70, z: -70 }];
  for (const lp of positions) {
    const y = getGroundHeight(lp.x, lp.z);
    const lampVoxel = placeVoxelProp("lamp", lp.x, y, lp.z, 3.5, true);
    if (lampVoxel) {
      mapGroup.add(lampVoxel);
    } else {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.5, 6), lampMat);
      post.position.set(lp.x, y + 1.75, lp.z); mapGroup.add(post);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffdd88 }));
      bulb.position.set(lp.x, y + 3.6, lp.z); mapGroup.add(bulb);
    }
    const lamp = new THREE.PointLight(0xffdd88, 0.4, 12);
    lamp.position.set(lp.x, y + 3.8, lp.z); mapGroup.add(lamp);
  }
  const torchMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0.9 });
  const torchPositions = [{ x: 55, z: 20 }, { x: -55, z: -25 }, { x: 25, z: 65 }, { x: -30, z: -60 }, { x: 90, z: -40 }, { x: -90, z: 50 }, { x: 0, z: 85 }, { x: -80, z: -80 }];
  for (const tp of torchPositions) {
    if (Math.hypot(tp.x, tp.z) < 35) continue;
    const y = getGroundHeight(tp.x, tp.z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6), torchMat);
    pole.position.set(tp.x, y + 1.1, tp.z); mapGroup.add(pole);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), flameMat);
    flame.position.set(tp.x, y + 2.4, tp.z); mapGroup.add(flame);
    const torchLight = new THREE.PointLight(0xff8844, 0.25, 8);
    torchLight.position.set(tp.x, y + 2.3, tp.z); mapGroup.add(torchLight);
  }
}

function addGrassField() {
  const count = 5000;
  const geo = new THREE.PlaneGeometry(0.3, 0.9);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3db84d, emissive: 0x1a5a2a, emissiveIntensity: 0.1, roughness: 0.88, side: THREE.DoubleSide });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    let x = (Math.random() - 0.5) * WORLD_HALF * 2, z = (Math.random() - 0.5) * WORLD_HALF * 2;
    if (Math.hypot(x, z) > WORLD_HALF - 4) { x *= 0.8; z *= 0.8; }
    dummy.position.set(x, getGroundHeight(x, z) + 0.02, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.5 + Math.random() * 0.9;
    dummy.scale.set(s, s * (0.7 + Math.random() * 0.5), s);
    dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true; mapGroup.add(inst); grassField = inst;
}

function addAmbientParticles() {
  const pCount = 60;
  const pGeo = new THREE.SphereGeometry(0.06, 3, 3);
  const pMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.35 });
  for (let i = 0; i < pCount; i++) {
    const x = (Math.random() - 0.5) * 150, z = (Math.random() - 0.5) * 150;
    const y = getGroundHeight(x, z) + 1 + Math.random() * 3;
    const p = new THREE.Mesh(pGeo, pMat);
    p.position.set(x, y, z); mapGroup.add(p);
  }
}

function buildPlayer() {
  if (player.mesh) {
    scene.remove(player.mesh);
    player.mesh = null;
  }
  if (!state.playerAppearance) loadPlayerAppearance();
  const app = state.playerAppearance || { bodyColor: 0x2299dd, capeColor: 0x4444aa, armorColor: 0x4488cc, scale: 1.0, capeVisible: true };
  const bodyColor = app.bodyColor != null ? app.bodyColor : 0x2299dd;
  const capeColor = app.capeColor != null ? app.capeColor : 0x4444aa;
  const armorColor = app.armorColor != null ? app.armorColor : 0x4488cc;
  const scale = typeof app.scale === "number" ? clamp(app.scale, 0.9, 1.5) : 1.2;
  const charId = state.selectedCharacter || "scout";

  const g = new THREE.Group();
  let voxelOk = false;
  if (hasVoxel(charId)) {
    recolorPlayerVoxel(charId, bodyColor, capeColor, armorColor);
    const built = buildVoxelModel(charId, { outline: true });
    built.scale.setScalar(scale);
    g.add(built);
    g.userData.parts = built.userData.parts;
    g.userData.anim = built.userData.anim;
    g.userData.voxelId = charId;
    if (app.capeVisible === false && g.userData.parts && g.userData.parts.cape) g.userData.parts.cape.visible = false;
    if (g.userData.parts && g.userData.parts.bow) player.bowGroup = g.userData.parts.bow;
    voxelOk = true;
  }
  if (!voxelOk) {
  g.scale.setScalar(scale);

  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, emissive: (bodyColor & 0xffffff) >> 2, emissiveIntensity: 0.2, roughness: 0.4, metalness: 0.1 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.5 });
  const armorMat = new THREE.MeshStandardMaterial({ color: armorColor, emissive: (armorColor & 0xffffff) >> 2, emissiveIntensity: 0.15, roughness: 0.3, metalness: 0.25 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd37a, emissive: 0x886622, emissiveIntensity: 0.3, roughness: 0.25, metalness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.6, metalness: 0.15 });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111122 });

  // Feet/boots (separate from legs)
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.32), armorMat);
  bootL.position.set(-0.18, 0.08, 0.02);
  const bootR = bootL.clone(); bootR.position.x = 0.18;

  // Legs (properly below torso)
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.55, 8), darkMat);
  legL.position.set(-0.18, 0.43, 0);
  const legR = legL.clone(); legR.position.x = 0.18;

  // Torso (main body, floating above legs)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.65, 10), bodyMat);
  torso.position.y = 1.05;

  // Chest armor (front)
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.35, 0.18), armorMat);
  chestPlate.position.set(0, 1.15, 0.1);

  // Belt
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.1, 10), goldMat);
  belt.position.y = 0.74;

  // Shoulder pads (on top of arms, not overlapping torso)
  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), armorMat);
  shoulderL.position.set(-0.42, 1.35, 0);
  shoulderL.scale.set(1.2, 0.8, 1);
  const shoulderR = shoulderL.clone(); shoulderR.position.x = 0.42;

  // Arms (hanging to the side, not inside torso)
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.5, 8), skinMat);
  armL.position.set(-0.42, 1.0, 0);
  const armR = armL.clone(); armR.position.x = 0.42;

  // Hands
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), skinMat);
  handL.position.set(-0.42, 0.72, 0);
  const handR = handL.clone(); handR.position.x = 0.42;

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 8), skinMat);
  neck.position.y = 1.48;

  // Head (above neck, not overlapping torso)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skinMat);
  head.position.y = 1.72;

  // Helmet/hair
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), armorMat);
  helmet.position.y = 1.76;

  // Eyes - white with pupil for cartoon look
  const eyeWhiteL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeWhiteMat);
  eyeWhiteL.position.set(-0.09, 1.74, 0.2);
  const eyeWhiteR = eyeWhiteL.clone(); eyeWhiteR.position.x = 0.09;
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyePupilMat);
  pupilL.position.set(-0.09, 1.74, 0.25);
  const pupilR = pupilL.clone(); pupilR.position.x = 0.09;

  // Mouth (small line)
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), eyePupilMat);
  mouth.position.set(0, 1.64, 0.22);

  // Visor glow
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: 0x44ddff }));
  visor.position.set(0, 1.82, 0.24);

  // Weapon (sword on back, or bow for archer)
  const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.03), goldMat);
  swordBlade.position.set(0.12, 1.25, -0.25);
  swordBlade.rotation.z = 0.12;
  const swordHilt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.06), darkMat);
  swordHilt.position.set(0.12, 0.82, -0.25);
  const isArcher = state.selectedCharacter === "archer";
  if (isArcher) {
    swordBlade.visible = false;
    swordHilt.visible = false;
    const bowMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, emissive: 0x1a1008, roughness: 0.7, metalness: 0.05 });
    const bowArc = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.72, 8), bowMat);
    bowArc.rotation.z = Math.PI / 2;
    bowArc.position.set(0.38, 1.0, 0.08);
    const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.65, 6), darkMat);
    bowString.rotation.z = Math.PI / 2;
    bowString.position.set(0.38, 1.0, 0.12);
    g.add(bowArc, bowString);
    if (!player.bowGroup) player.bowGroup = { arc: bowArc, string: bowString };
    else { player.bowGroup.arc = bowArc; player.bowGroup.string = bowString; }
  }

  // Cape (flowing behind) – optional
  const capeMat = new THREE.MeshStandardMaterial({ color: capeColor, emissive: (capeColor & 0xffffff) >> 2, emissiveIntensity: 0.15, roughness: 0.7, side: THREE.DoubleSide });
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65), capeMat);
  cape.position.set(0, 1.0, -0.28);
  cape.rotation.x = 0.1;
  if (app.capeVisible === false) cape.visible = false;

  g.add(bootL, bootR, legL, legR, torso, chestPlate, belt, shoulderL, shoulderR, armL, armR, handL, handR, neck, head, helmet, eyeWhiteL, eyeWhiteR, pupilL, pupilR, mouth, visor, swordBlade, swordHilt, cape);
  }
  g.position.set(0, sampleTerrainHeight(0, 0), 0);
  g.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  player.mesh = g;

  const shieldRing = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.6, 32),
    new THREE.MeshBasicMaterial({ color: 0x5dd3ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
  );
  shieldRing.rotation.x = -Math.PI / 2;
  shieldRing.position.y = 0.8;
  shieldRing.renderOrder = 1;
  player.shieldRing = shieldRing;
  g.add(shieldRing);
  const shieldBubbleMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.32, side: THREE.BackSide, depthWrite: false });
  const shieldBubble = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), shieldBubbleMat);
  shieldBubble.position.y = -0.5;
  shieldBubble.renderOrder = 0;
  shieldBubble.visible = false;
  player.shieldBubble = shieldBubble;
  g.add(shieldBubble);
  scene.add(g);
  /* GLB asset yok – sadece default prosedürel karakter kullaniliyor
  loadCustomPlayerModel();
  */
}

function loadCustomPlayerModel() {
  /* Disabled: proje default asset kullaniyor, GLB aramiyoruz
  if (!player.mesh) return;
  ensureGLTFLoader(function() {
    const loader = new window.GLTFLoader();
    loader.load(resolveAssetUrl("assets/player/character.glb"), function(gltf) {
      const oldG = player.mesh;
      if (!oldG) return;
      const ring = player.shieldRing;
      if (ring) oldG.remove(ring);
      const g2 = new THREE.Group();
      g2.scale.copy(oldG.scale);
      const clone = gltf.scene.clone();
      clone.traverse(function(c) { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      const box = new THREE.Box3().setFromObject(clone);
      const size = new THREE.Vector3();
      box.getSize(size);
      const s = 1.2 / Math.max(size.y, 0.01);
      clone.scale.setScalar(s);
      g2.add(clone);
      if (ring) g2.add(ring);
      player.shieldRing = ring;
      scene.remove(oldG);
      player.mesh = g2;
      scene.add(g2);
    }, undefined, function() {});
  });
  */
}

// Ragdoll physics update - applied to player mesh children
function updateRagdoll(dt) {
  if (!player.mesh || !running) return;
  const children = player.mesh.children;
  const speed = Math.hypot(player.vel.x, player.vel.z);
  const inAir = !player.grounded;
  const movePhase = state.time * (4 + speed * 0.5);

  // Spring physics for torso tilt
  const targetTilt = inAir ? 0.1 : Math.sin(movePhase) * 0.04 * Math.min(speed, 8);
  const targetLean = (player.vel.x * Math.cos(player.mesh.rotation.y) + player.vel.z * Math.sin(player.mesh.rotation.y)) * 0.015;
  
  ragdoll.torsoTiltVel += (targetTilt - ragdoll.torsoTilt) * ragdoll.stiffness * dt;
  ragdoll.torsoTiltVel -= ragdoll.torsoTiltVel * ragdoll.damping * dt;
  ragdoll.torsoTiltVel += ragdoll.impactForce.z * 0.5 * dt;
  ragdoll.torsoTilt += ragdoll.torsoTiltVel * dt;
  
  ragdoll.torsoLeanVel += (targetLean - ragdoll.torsoLean) * ragdoll.stiffness * dt;
  ragdoll.torsoLeanVel -= ragdoll.torsoLeanVel * ragdoll.damping * dt;
  ragdoll.torsoLeanVel += ragdoll.impactForce.x * 0.5 * dt;
  ragdoll.torsoLean += ragdoll.torsoLeanVel * dt;

  // Head bob
  ragdoll.headBobVel += (Math.sin(movePhase * 1.3) * 0.05 * speed * 0.3 - ragdoll.headBob) * 18 * dt;
  ragdoll.headBobVel -= ragdoll.headBobVel * 5 * dt;
  ragdoll.headBob += ragdoll.headBobVel * dt;

  // Arm swing (or melee sword swing for Samurai)
  const meleeTimer = state.meleeSwingTimer || 0;
  if (meleeTimer > 0) {
    state.meleeSwingTimer = meleeTimer - dt;
    const progress = 1 - state.meleeSwingTimer / MELEE_SWING_DURATION;
    const swingArm = -1.55 * Math.sin(progress * Math.PI);
    ragdoll.armRSwing = swingArm;
    ragdoll.armLSwing = 0.15 * Math.sin(progress * Math.PI);
    if (progress >= 0.38 && progress <= 0.62 && !state.meleeSwingHit) {
      state.meleeSwingHit = true;
      const origin = player.mesh.position.clone().setY(player.mesh.position.y + 0.95);
      const aimDir = (state.meleeSwingDir || player.aimDir).clone();
      const crit = Math.random() < Math.min(1, stats.critChance || 0);
      const damage = stats.damage * (crit ? (stats.critMult || 1.9) : 1);
      sectorDamageEnemies(origin, aimDir, MELEE_RANGE, MELEE_HALF_ANGLE, damage, crit);
      spawnSlash(player.mesh.position.clone().add(new THREE.Vector3(aimDir.x * 1.2, 0.9, aimDir.z * 1.2)), aimDir, crit ? 0xffe48a : 0xffd700);
      playSfxHit(crit ? 420 : 320);
    }
  } else {
    ragdoll.armLSwing = Math.sin(movePhase) * 0.4 * Math.min(speed * 0.15, 1);
    ragdoll.armRSwing = Math.sin(movePhase + Math.PI) * 0.4 * Math.min(speed * 0.15, 1);
  }

  // Leg swing (yuruyus animasyonu – sprintte daha belirgin)
  const legAmp = 0.35 * Math.min(speed * 0.14, 1.2);
  ragdoll.legLSwing = Math.sin(movePhase) * legAmp;
  ragdoll.legRSwing = Math.sin(movePhase + Math.PI) * legAmp;

  // Land squash
  if (ragdoll.landSquash > 0) ragdoll.landSquash = Math.max(0, ragdoll.landSquash - dt * 6);

  // Cape wave
  ragdoll.capeWave = Math.sin(state.time * 3 + speed * 0.5) * 0.2 + speed * 0.03;

  // Decay impact force
  ragdoll.impactForce.multiplyScalar(Math.exp(-8 * dt));

  // Stumble
  if (ragdoll.stumbleTimer > 0) {
    ragdoll.stumbleTimer -= dt;
    ragdoll.torsoTilt += Math.sin(state.time * 15) * 0.15;
    ragdoll.torsoLean += Math.cos(state.time * 12) * 0.1;
  }

  // Apply to named voxel parts (fallback: old child indices)
  const parts = (player.mesh.userData && player.mesh.userData.parts) || {};
  const torsoN = parts.body || children[4];
  const legLN = parts.legL || children[0];
  const legRN = parts.legR || children[1];
  const armLN = parts.armL || children[9];
  const armRN = parts.armR || children[10];
  const headN = parts.head || children[11];
  const capeN = parts.cape || children[18];
  const squash = 1 - ragdoll.landSquash * 0.3;
  const stretch = 1 + ragdoll.landSquash * 0.15;

  if (torsoN) {
    torsoN.rotation.x = ragdoll.torsoTilt;
    torsoN.rotation.z = ragdoll.torsoLean;
    torsoN.scale.set(stretch, squash, stretch);
  }
  if (legLN) legLN.rotation.x = ragdoll.legLSwing;
  if (legRN) legRN.rotation.x = ragdoll.legRSwing;
  if (armLN) armLN.rotation.x = ragdoll.armLSwing;
  if (armRN) armRN.rotation.x = ragdoll.armRSwing;
  if (headN) {
    headN.rotation.x = ragdoll.headBob;
    headN.rotation.z = ragdoll.torsoLean * 0.5;
  }
  if (capeN) {
    capeN.rotation.x = 0.15 + ragdoll.capeWave;
  }
}

function applyRagdollImpact(forceX, forceZ, stumble = false) {
  ragdoll.impactForce.x += forceX;
  ragdoll.impactForce.z += forceZ;
  if (stumble) ragdoll.stumbleTimer = 0.5;
}

function applyRagdollLand() {
  ragdoll.landSquash = 1;
}

// Flying enemy creation (Phoenix / Anka, Phantom Bird, or Void Moth)
function createFlyingEnemy() {
  return withSharedGeoMat(createFlyingEnemyInner);
}
function createFlyingEnemyInner() {
  const roll = Math.random();
  const isPhoenix = roll < 0.28;
  const isVoidMoth = !isPhoenix && roll < 0.73;
  const g = new THREE.Group();
  const flyId = hasVoxel("flying") ? "flying" : (hasVoxel("crow") ? "crow" : null);
  if (!(flyId && attachVoxelModel(g, flyId, 1.4, 0.7, 1))) {
  let bodyColor, wingColor, mat, wingMat, eyeMat, beakColor;
  if (isPhoenix) {
    bodyColor = 0xcc3311;
    wingColor = 0xff6622;
    mat = new THREE.MeshStandardMaterial({ color: bodyColor, emissive: 0x882208, emissiveIntensity: 0.45, roughness: 0.35 });
    wingMat = new THREE.MeshStandardMaterial({ color: wingColor, emissive: 0xaa3300, emissiveIntensity: 0.35, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    eyeMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    beakColor = 0xffaa22;
  } else {
    bodyColor = isVoidMoth ? 0x2a0a3a : 0x8844cc;
    wingColor = isVoidMoth ? 0x5500aa : 0xaa66ff;
    mat = new THREE.MeshStandardMaterial({ color: bodyColor, emissive: isVoidMoth ? 0x440088 : 0x331155, emissiveIntensity: isVoidMoth ? 0.5 : 0.3, roughness: 0.4 });
    wingMat = new THREE.MeshStandardMaterial({ color: wingColor, emissive: isVoidMoth ? 0x330066 : 0x442288, emissiveIntensity: 0.25, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    eyeMat = new THREE.MeshBasicMaterial({ color: isVoidMoth ? 0xaa44ff : 0xff4444 });
    beakColor = isVoidMoth ? 0x6622aa : 0xffaa22;
  }

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 8), mat);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mat);
  head.position.set(0, 0, 0.7);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), eyeMat);
  eyeL.position.set(-0.12, 0.08, 0.85);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.12;
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), new THREE.MeshStandardMaterial({ color: beakColor, roughness: 0.6 }));
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, -0.02, 1.0);
  const wingL = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), wingMat);
  wingL.position.set(-0.8, 0.1, 0);
  wingL.rotation.y = 0.1;
  const wingR = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), wingMat);
  wingR.position.set(0.8, 0.1, 0);
  wingR.rotation.y = -0.1;
  const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), wingMat);
  tail.position.set(0, 0.1, -0.7);
  tail.rotation.x = 0.3;

  g.add(body, head, eyeL, eyeR, beak, wingL, wingR, tail);
  }

  const hpBar = makeHpBar(false);
  hpBar.position.y = 0.8;
  g.add(hpBar);

  const levelScale = 1 + state.level * 0.04;
  const stageScale = 1 + Math.max(0, state.difficultyStage - 1) * 0.025;
  const hp = (isPhoenix ? 85 : isVoidMoth ? 75 : 65) * levelScale * stageScale;
  const speed = (isPhoenix ? 6.2 : isVoidMoth ? 6 : 5.5) + state.level * 0.08;
  const damage = (isPhoenix ? 13 : isVoidMoth ? 11 : 10) * (1 + state.level * 0.006);
  const xp = (isPhoenix ? 30 : isVoidMoth ? 26 : 22) * (1 + state.level * 0.03);
  const name = isPhoenix ? "Anka Kusu" : (enemyNames.flying && enemyNames.flying[Math.floor(Math.random() * enemyNames.flying.length)]) || "Phantom Kus";

  return {
    mesh: g,
    tier: "magic",
    name,
    hp, maxHp: hp,
    speed, damage, xp,
    radius: 0.7,
    poisonLeft: 0, slowLeft: 0, freezeLeft: 0, burnLeft: 0, shockLeft: 0,
    swordHitCd: 0,
    push: new THREE.Vector3(),
    isBoss: false,
    isFlying: true,
    flyHeight: 4 + Math.random() * 3,
    wingPhase: Math.random() * Math.PI * 2,
    wingIndices: [5, 6],
    specialCd: 999,
    hpBar,
  };
}

// Shadow enemy creation (10 min timeout enemies)
function createShadowEnemy() {
  return withSharedGeoMat(createShadowEnemyInner);
}
function createShadowEnemyInner() {
  const g = new THREE.Group();
  const shadowId = hasVoxel("shadow") ? "shadow" : (hasVoxel("wraith") ? "wraith" : null);
  if (!(shadowId && attachVoxelModel(g, shadowId, 2.5, 0.6, 1))) {
  const shadowMat = new THREE.MeshStandardMaterial({ color: 0x111118, emissive: 0x220033, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

  // Ghostly tall body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 2.5, 8), shadowMat);
  body.position.y = 1.25;
  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), shadowMat);
  head.position.y = 2.7;
  // Glowing eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), eyeMat);
  eyeL.position.set(-0.12, 2.75, 0.28);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.12;
  // Shadow tendrils
  for (let i = 0; i < 4; i++) {
    const tendril = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.02, 1.2, 5), shadowMat);
    const angle = (i / 4) * Math.PI * 2;
    tendril.position.set(Math.cos(angle) * 0.4, 0.6, Math.sin(angle) * 0.4);
    tendril.rotation.z = Math.cos(angle) * 0.4;
    tendril.rotation.x = Math.sin(angle) * 0.4;
    g.add(tendril);
  }
  // Aura ring
  const aura = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.4, 16),
    new THREE.MeshBasicMaterial({ color: 0x440066, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.05;
  // Point light (eerie)
  const light = new THREE.PointLight(0x8800ff, 0.5, 8);
  light.position.y = 1.5;

  g.add(body, head, eyeL, eyeR, aura, light);
  }

  const hpBar = makeHpBar(false);
  hpBar.position.y = 3.2;
  g.add(hpBar);

  const timeFactor = 1 + Math.max(0, state.time - 600) * 0.001;
  const hp = 250 * timeFactor;
  const speed = getUnifiedEnemySpeed ? getUnifiedEnemySpeed() * 1.15 : 5.5;
  const damage = 26 * timeFactor;
  const xp = 45 * timeFactor;

  return {
    mesh: g,
    tier: "unique",
    name: "Shadow Wraith",
    hp, maxHp: hp,
    speed, damage, xp,
    radius: 0.6,
    poisonLeft: 0, slowLeft: 0, freezeLeft: 0, burnLeft: 0, shockLeft: 0,
    swordHitCd: 0,
    push: new THREE.Vector3(),
    isBoss: false,
    isShadow: true,
    specialCd: 999,
    hpBar,
  };
}

// HP bar sprite havuzu (P1.2): her yaratik icin ayri canvas+texture yaratmak yerine
// olen yaratigin barini geri al. Bar icerigi dinamik oldugu icin paylasilamaz, havuzlanir.
const hpBarPool = [];
const ENEMY_MESH_POOL = {};
const ENEMY_MESH_POOL_MAX_PER = 8;
const ENEMY_MESH_POOL_MAX = 80;
let enemyMeshPoolCount = 0;
function acquireEnemyMesh(voxelId) {
  const bucket = ENEMY_MESH_POOL[voxelId];
  if (!bucket || !bucket.length) return null;
  enemyMeshPoolCount--;
  const g = bucket.pop();
  g.visible = true;
  g.position.set(0, 0, 0);
  g.rotation.set(0, 0, 0);
  if (g.quaternion) g.quaternion.identity();
  return g;
}
function stashEnemyMesh(g, voxelId) {
  if (!g || !voxelId) return false;
  const bucket = ENEMY_MESH_POOL[voxelId] || (ENEMY_MESH_POOL[voxelId] = []);
  if (enemyMeshPoolCount >= ENEMY_MESH_POOL_MAX || bucket.length >= ENEMY_MESH_POOL_MAX_PER) {
    disposeMeshDeep(g);
    return false;
  }
  const keep = g.userData.poolKeep || 0;
  while (g.children.length > keep) {
    const c = g.children[g.children.length - 1];
    g.remove(c);
    if (c.isSprite) continue;
    disposeMeshDeep(c);
  }
  if (g.parent) g.parent.remove(g);
  g.visible = false;
  bucket.push(g);
  enemyMeshPoolCount++;
  return true;
}
const PROJ_MESH_POOL = {};
const PROJ_MESH_POOL_MAX = 48;
const PROJ_POOL_SHAPES = { fireball: 1, frostball: 1, comet: 1, banana: 1, boomerang: 1, shuriken: 1, bomb: 1, arrow: 1, arrow_shock: 1, arrow_burn: 1, arrow_freeze: 1 };
let projMeshPoolCount = 0;
function acquireProjMesh(key) {
  const bucket = PROJ_MESH_POOL[key];
  if (!bucket || !bucket.length) return null;
  projMeshPoolCount--;
  const m = bucket.pop();
  m.visible = true;
  m.rotation.set(0, 0, 0);
  if (m.quaternion) m.quaternion.identity();
  return m;
}
function stashProjMesh(mesh, key) {
  if (!mesh || !key || !PROJ_POOL_SHAPES[key]) return false;
  const bucket = PROJ_MESH_POOL[key] || (PROJ_MESH_POOL[key] = []);
  if (projMeshPoolCount >= PROJ_MESH_POOL_MAX || bucket.length >= 12) return false;
  if (mesh.parent) mesh.parent.remove(mesh);
  mesh.visible = false;
  bucket.push(mesh);
  projMeshPoolCount++;
  return true;
}
function makeHpBar(isPlayer) {
  let spr = isPlayer ? null : hpBarPool.pop();
  if (spr) {
    spr.userData.last = -1;
    spr.visible = true;
    spr.material.opacity = 1;
    updateHpBar(spr, 1, 1);
    return spr;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 16;
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  spr = new THREE.Sprite(mat);
  spr.scale.set(isPlayer ? 2.6 : 2.0, 0.35, 1);
  spr.userData = { canvas, ctx: canvas.getContext("2d"), tex, last: -1 };
  updateHpBar(spr, 1, 1);
  return spr;
}
// Olen/silinen yaratigin havuzlanabilir gorsellerini geri al.
function releaseEnemyVisuals(enemy) {
  if (!enemy || enemy._visualsReleased) return;
  enemy._visualsReleased = true;
  const bar = enemy.hpBar;
  if (bar && bar.userData && bar.userData.canvas) {
    if (bar.parent) bar.parent.remove(bar);
    if (hpBarPool.length < 64) hpBarPool.push(bar);
    enemy.hpBar = null;
  }
  const cast = enemy.castLabel;
  if (cast && cast.userData && cast.userData.canvas) {
    if (cast.parent) cast.parent.remove(cast);
    cast.visible = false;
    if (castLabelPool.length < 32) castLabelPool.push(cast);
    enemy.castLabel = null;
  }
  if (enemy.mesh && enemy.mesh.userData && enemy.mesh.userData.poolVoxelId && !enemy.isBoss) {
    enemy._meshPooled = stashEnemyMesh(enemy.mesh, enemy.mesh.userData.poolVoxelId);
  }
}

function updateHpBar(sprite, hp, maxHp) {
  const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  if (Math.abs(sprite.userData.last - ratio) < 0.01) return;
  sprite.userData.last = ratio;
  const ctx = sprite.userData.ctx;
  ctx.clearRect(0, 0, sprite.userData.canvas.width, sprite.userData.canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, 128, 16);
  ctx.fillStyle = "#2aff7a";
  ctx.fillRect(2, 3, (124) * ratio, 10);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(1, 1, 126, 14);
  sprite.userData.tex.needsUpdate = true;
}

// Isim etiketleri sabit; ayni isim+tier icin materyal (ve texture) paylasilir.
const NAME_LABEL_CACHE = new Map();
const NAME_LABEL_CACHE_MAX = 220;
function makeNameLabel(name, tier) {
  const key = (tier || "normal") + "|" + name;
  const cached = NAME_LABEL_CACHE.get(key);
  if (cached) {
    const spr = new THREE.Sprite(cached.mat);
    spr.scale.copy(cached.scale);
    return spr;
  }
  const spr = makeNameLabelInner(name, tier);
  if (NAME_LABEL_CACHE.size < NAME_LABEL_CACHE_MAX) {
    markShared(spr.material);
    NAME_LABEL_CACHE.set(key, { mat: spr.material, scale: spr.scale.clone() });
  }
  return spr;
}
function makeNameLabelInner(name, tier) {
  const w = 256;
  const h = 28;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 14px Arial, sans-serif";
  const tw = Math.min(ctx.measureText(name).width + 16, w - 8);
  const th = 20;
  const x = (w - tw) / 2;
  const y = (h - th) / 2;
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(x, y, tw, th);
  const textColor = { normal: "#fff8dc", magic: "#88ccff", rare: "#ffd700", unique: "#dd88ff", boss: "#ff6666", abyss: "#66ff99" }[tier || "normal"] || "#fff8dc";
  const strokeColor = { normal: "rgba(255,248,220,0.6)", magic: "rgba(136,204,255,0.6)", rare: "rgba(255,215,0,0.7)", unique: "rgba(221,136,255,0.6)", boss: "rgba(255,102,102,0.7)", abyss: "rgba(80,220,120,0.8)" }[tier || "normal"] || "rgba(255,255,255,0.5)";
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, tw, th);
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.length > 20 ? name.slice(0, 18) + "…" : name, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(Math.min(tw / 28, 2.6), 0.32, 1);
  return spr;
}

const castLabelPool = [];
function makeCastLabel() {
  const pooled = castLabelPool.pop();
  if (pooled) { pooled.visible = false; return pooled; }
  return makeCastLabelInner();
}
function makeCastLabelInner() {
  const w = 256;
  const h = 24;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(1.4, 0.22, 1);
  spr.visible = false;
  spr.userData = { canvas, ctx, tex };
  return spr;
}

function updateCastLabel(spr, text) {
  if (!spr || !spr.userData.ctx) return;
  const ctx = spr.userData.ctx;
  const w = spr.userData.canvas.width;
  const h = spr.userData.canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!text) { spr.userData.tex.needsUpdate = true; return; }
  ctx.font = "bold 11px Arial, sans-serif";
  const tw = Math.min(ctx.measureText(text).width + 12, w - 8);
  const th = 16;
  const x = (w - tw) / 2;
  const y = (h - th) / 2;
  ctx.fillStyle = "rgba(80,40,20,0.85)";
  ctx.fillRect(x, y, tw, th);
  ctx.strokeStyle = "rgba(255,180,80,0.8)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, tw, th);
  ctx.fillStyle = "#ffcc66";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.length > 22 ? text.slice(0, 20) + "…" : text, w / 2, h / 2);
  spr.userData.tex.needsUpdate = true;
}

function makeZoneLabel(text, fillColor) {
  const w = 256;
  const h = 32;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 16px Arial, sans-serif";
  const tw = Math.min(ctx.measureText(text).width + 20, w - 8);
  const th = 22;
  const x = (w - tw) / 2;
  const y = (h - th) / 2;
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(x, y, tw, th);
  ctx.strokeStyle = fillColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, tw, th);
  ctx.fillStyle = fillColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(Math.min(tw / 24, 3), 0.4, 1);
  return spr;
}

function bindEvents() {
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    const maxPr = window._gameMaxPixelRatio != null ? window._gameMaxPixelRatio : 0.65;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPr));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.addEventListener("keydown", (e) => {
  if (leveling) {
    if (e.code === "Digit1") chooseLevelCard(0);
    if (e.code === "Digit2") chooseLevelCard(1);
    if (e.code === "Digit3") chooseLevelCard(2);
  }
  if (e.code === "KeyW") keys.w = true;
  if (e.code === "KeyA") keys.a = true;
  if (e.code === "KeyS") keys.s = true;
  if (e.code === "KeyD") keys.d = true;
  if (e.code === "KeyQ") {
    keys.q = true;
    if (running && !leveling && !gameOver) {
      autoAttackEnabled = !autoAttackEnabled;
      const el = document.getElementById("autoAttackIndicator");
      if (el) { el.classList.toggle("visible", !autoAttackEnabled); }
    }
  }
  if (e.code === "KeyE") keys.e = true;
  if (e.code === "KeyR") keys.r = true;
  if (e.code === "KeyT") keys.t = true;
  if (e.code === "KeyY") keys.y = true;
  if (e.code === "Space") {
    if (!bhop.spaceDown) { bhop.spacePressedThisFrame = true; }
    bhop.spaceDown = true;
    keys.space = true;
  }
  if (e.code === "KeyX" && !e.repeat) keys.x = true;
  if (e.code === "KeyF" && !e.repeat) keys.f = true;
  if (e.code === "KeyG") {
    keys.g = true;
    if (running && !leveling && !gameOver && (state.magnetBurstCd || 0) <= 0) {
      state.magnetBurstUntil = state.time + 2.5;
      state.magnetBurstCd = 25;
      if (typeof playSfx === "function") playSfx(660, 0.12);
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), "MAGNET!", true, "magnet");
    }
  }
  if (e.code === "KeyV") {
    keys.v = true;
    if (running && !leveling && !gameOver && (state.rageMeter || 0) >= 100) {
      state.rageUntil = state.time + 12;
      state.rageMeter = 0;
      if (typeof playSfx === "function") playSfx(180, 0.2);
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 2.5, 0)), "RAGE!", true, "rage");
    }
  }
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = true;
  if (e.code === "KeyC") keys.c = true;
  if (e.code === "Tab") {
    e.preventDefault();
    keys.tab = true;
    if (running && !gameOver && !leveling && hud) {
      const tabPanel = document.getElementById("tabPanel");
      if (tabPanel) {
        tabPanel.classList.remove("hidden");
        updateTabPanel();
      }
    }
  }
  if (e.code === "Escape") handleEscape();
  if (e.code === "KeyP" && !e.repeat && running && !gameOver && !leveling) {
    const activityPanel = document.getElementById("activitySkillPanel");
    if (activityPanel && activityPanel.classList.contains("hidden")) openActivitySkillPanel();
    else if (activityPanel) closeActivitySkillPanel();
  }
  const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  if (!window._konamiKeys) window._konamiKeys = [];
  window._konamiKeys.push(e.keyCode);
  if (window._konamiKeys.length > konami.length) window._konamiKeys.shift();
  if (window._konamiKeys.length === konami.length && konami.every((k, i) => window._konamiKeys[i] === k) && !state.konamiUnlocked) {
    state.konamiUnlocked = true;
    try { localStorage.setItem("zaza_konami", "1"); } catch (e) {}
    if (player.mesh && running) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "SECRET: Retro skin!", true, "KONAMI");
    else if (typeof alert !== "undefined") alert("Easter egg! Retro skin unlocked. Check character editor in Lobby.");
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "Space") { keys.space = false; bhop.spaceDown = false; }
  if (e.code === "KeyW") keys.w = false;
  if (e.code === "KeyA") keys.a = false;
  if (e.code === "KeyS") keys.s = false;
  if (e.code === "KeyD") keys.d = false;
  if (e.code === "KeyQ") keys.q = false;
  if (e.code === "KeyE") keys.e = false;
  if (e.code === "KeyR") keys.r = false;
  if (e.code === "KeyT") keys.t = false;
  if (e.code === "KeyY") keys.y = false;
  if (e.code === "KeyX") keys.x = false;
  if (e.code === "KeyF") keys.f = false;
  if (e.code === "KeyG") keys.g = false;
  if (e.code === "KeyV") keys.v = false;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = false;
  if (e.code === "KeyC") { keys.c = false; dodge.shiftUsed = false; }
  if (e.code === "Tab") {
    keys.tab = false;
    const tabPanel = document.getElementById("tabPanel");
    if (tabPanel) tabPanel.classList.add("hidden");
  }
});

  document.addEventListener("mousemove", (e) => {
    const baseSens = 0.0024;
    const sens = baseSens * camSettings.mouseSensitivity;
    if (pointerLocked && !paused) {
      if (skipMouseFramesAfterLock > 0) {
        skipMouseFramesAfterLock--;
      } else {
        camYaw -= e.movementX * sens;
        // Invert Y: mouse yukari -> kamera asagi, mouse asagi -> kamera yukari
        camPitch = clamp(camPitch + e.movementY * sens, camSettings.pitchMin, camSettings.pitchMax);
      }
    }
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  document.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("mousedown", () => {
    canvas.focus();
    if (!pointerLocked) canvas.requestPointerLock();
  });
  document.addEventListener("pointerlockchange", () => {
    const nowLocked = document.pointerLockElement === canvas;
    if (nowLocked && !pointerLocked) skipMouseFramesAfterLock = 5;
    pointerLocked = nowLocked;
    if (nowLocked && running && !bgMusicPlaying && typeof startBgMusic === "function") startBgMusic();
  });

  if (playBtn) playBtn.addEventListener("click", openLobby);
  if (restartBtn) restartBtn.addEventListener("click", () => startRun(1, state.selectedMapId || "classic"));
  const lobbyScreen = document.getElementById("lobbyScreen");
  const lobbyStartBtn = document.getElementById("lobbyStartBtn");
  const lobbyBackBtn = document.getElementById("lobbyBackBtn");
  if (lobbyStartBtn) lobbyStartBtn.addEventListener("click", () => {
    const exileEl = document.getElementById("lobbyExileMode");
    state.exileMode = exileEl ? exileEl.checked : false;
    const radio = document.querySelector('input[name="lobbyMap"]:checked');
    const mapId = radio ? radio.value : "classic";
    startRun(1, mapId);
    if (lobbyScreen) lobbyScreen.classList.add("hidden");
  });
  if (lobbyBackBtn) lobbyBackBtn.addEventListener("click", () => {
    if (lobbyScreen) lobbyScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    stopBgMusic();
    stopMenuMusic();
    startMenuMusic();
  });
  const mainMenuBtn = document.getElementById("mainMenuBtn");
  if (mainMenuBtn) mainMenuBtn.addEventListener("click", () => {
    stopBgMusic();
    stopMenuMusic();
    gameOverPanel.classList.add("hidden");
    startScreen.classList.remove("hidden");
    gameOver = false;
    running = false;
    if (typeof clearFloatingCounters === "function") clearFloatingCounters();
    if (hud) hud.classList.add("hidden");
    if (skillsHud) skillsHud.classList.add("hidden");
    if (levelupPanel) levelupPanel.classList.add("hidden");
    if (bossBarWrap) bossBarWrap.classList.add("hidden");
    if (skillBarEl) skillBarEl.classList.add("hidden");
    loadQuests();
    const lowHp = document.getElementById("lowHpOverlay");
    if (lowHp) lowHp.classList.remove("active");
    if (window.renderQuests) window.renderQuests();
    startMenuMusic();
  });
  if (rerollBtn) rerollBtn.addEventListener("click", doReroll);
  const menuSettingsBtn = document.getElementById("menuSettingsBtn");
  const quitBtnMenu = document.getElementById("quitBtnMenu");
  if (menuSettingsBtn) menuSettingsBtn.addEventListener("click", () => { document.getElementById("startScreen").classList.add("hidden"); document.getElementById("settingsMenu").classList.remove("hidden"); });
  const leaderboardBtn = document.getElementById("leaderboardBtn");
  if (leaderboardBtn) leaderboardBtn.addEventListener("click", () => {
    document.getElementById("startScreen").classList.add("hidden");
    const panel = document.getElementById("leaderboardPanel");
    if (panel) panel.classList.remove("hidden");
    const listEl = document.getElementById("leaderboardList");
    if (!listEl) return;
    const scoreOf = (e) => e.score != null ? e.score : (e.kills || 0) * 100 + Math.floor(e.time || 0);
    const renderList = (list) => {
      listEl.innerHTML = list.length ? list.map((e, i) => `<div class="lbRow"><span>#${i + 1} ${(e.name || "Oyuncu").slice(0, 18)}</span><span>${scoreOf(e)} skor (${e.kills || 0} kill \u2022 ${formatTime(e.time || 0)})</span></div>`).join("") : "<div class=\"lbRow\">Henuz kayit yok.</div>";
    };
    const canFetchApi = typeof location !== "undefined" && (location.protocol === "http:" || location.protocol === "https:");
    if (LEADERBOARD_API_URL && canFetchApi) {
      listEl.innerHTML = "<div class=\"lbRow\">Yukleniyor...</div>";
      fetch(LEADERBOARD_API_URL + "api.php").then(r => r.json()).then(list => { renderList(Array.isArray(list) ? list : []); }).catch(() => { renderList(getLeaderboardList()); });
    } else {
      renderList(getLeaderboardList());
    }
  });
  const leaderboardBackBtn = document.getElementById("leaderboardBackBtn");
  if (leaderboardBackBtn) leaderboardBackBtn.addEventListener("click", () => {
    document.getElementById("leaderboardPanel").classList.add("hidden");
    document.getElementById("startScreen").classList.remove("hidden");
    stopMenuMusic();
    startMenuMusic();
  });
  const playerNameInput = document.getElementById("playerNameInput");
  if (playerNameInput) {
    playerNameInput.value = getPlayerName();
    playerNameInput.addEventListener("change", function() { try { localStorage.setItem(PLAYER_NAME_KEY, (this.value || "").trim().slice(0, 20)); } catch (e) {} });
    playerNameInput.addEventListener("blur", function() { try { localStorage.setItem(PLAYER_NAME_KEY, (this.value || "").trim().slice(0, 20)); } catch (e) {} });
  }
  function renderQuests() {
    loadQuests();
    const listEl = document.getElementById("questsList");
    if (!listEl || !state.quests || !state.quests.length) return;
    listEl.innerHTML = state.quests.map(function(q, i) {
      const done = q.progress >= q.target;
      const claimed = q.claimed;
      const btn = claimed ? "" : (done ? "<button class=\"btn secondary questClaim\" data-quest-idx=\"" + i + "\">Al (" + q.reward + " Coin)</button>" : "<span>" + q.progress + "/" + q.target + "</span>");
      return "<div class=\"questRow\"><span>" + q.name + "</span>" + btn + "</div>";
    }).join("");
    listEl.querySelectorAll(".questClaim").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const idx = parseInt(this.getAttribute("data-quest-idx"), 10);
        claimQuest(idx);
        renderQuests();
      });
    });
  }
  window.renderQuests = renderQuests;
  renderQuests();
  if (quitBtnMenu) quitBtnMenu.addEventListener("click", () => { try { window.close(); } catch (e) { document.getElementById("startScreen").classList.remove("hidden"); if (document.getElementById("settingsMenu")) document.getElementById("settingsMenu").classList.add("hidden"); if (document.getElementById("leaderboardPanel")) document.getElementById("leaderboardPanel").classList.add("hidden"); renderQuests(); stopBgMusic(); stopMenuMusic(); startMenuMusic(); } });
  bindPauseMenu();
  bindSettingsMenu();
  startMenuMusic();
  function tryStartMenuMusicOnFirstInteraction() {
    if (menuMusicAudio && !menuMusicAudio.paused) return;
    const startScreen = document.getElementById("startScreen");
    if (startScreen && startScreen.classList.contains("hidden")) return;
    startMenuMusic();
    document.removeEventListener("click", tryStartMenuMusicOnFirstInteraction);
    document.removeEventListener("keydown", tryStartMenuMusicOnFirstInteraction);
  }
  document.addEventListener("click", tryStartMenuMusicOnFirstInteraction, { once: true });
  document.addEventListener("keydown", tryStartMenuMusicOnFirstInteraction, { once: true });
}

function handleEscape() {
  const settingsMenu = document.getElementById("settingsMenu");
  const skillTreePanel = document.getElementById("skillTreePanel");
  const activitySkillPanel = document.getElementById("activitySkillPanel");
  const pauseMenu = document.getElementById("pauseMenu");
  if (settingsMenu && !settingsMenu.classList.contains("hidden")) {
    settingsMenu.classList.add("hidden");
    return;
  }
  if (activitySkillPanel && !activitySkillPanel.classList.contains("hidden")) {
    closeActivitySkillPanel();
    return;
  }
  if (skillTreePanel && !skillTreePanel.classList.contains("hidden")) {
    closeSkillTreePanel();
    return;
  }
  if (pauseMenu && !pauseMenu.classList.contains("hidden")) {
    closePauseMenu();
    return;
  }
  if (running && !gameOver && !leveling) {
    openPauseMenu();
    return;
  }
  if (pointerLocked) document.exitPointerLock();
}

function openPauseMenu() {
  paused = true;
  if (pointerLocked) document.exitPointerLock();
  document.getElementById("pauseMenu").classList.remove("hidden");
}

function closePauseMenu() {
  paused = false;
  if (player.mesh) {
    player.mesh.rotation.y = camYaw;
    player.aimDir.set(Math.sin(camYaw), 0, Math.cos(camYaw));
  }
  document.getElementById("pauseMenu").classList.add("hidden");
  canvas.focus();
  if (running && !gameOver) canvas.requestPointerLock();
}

function openSkillTreePanel() {
  paused = true;
  if (pointerLocked) document.exitPointerLock();
  skillTreeZoom = 1;
  skillTreePanX = 0;
  skillTreePanY = 0;
  const panel = document.getElementById("skillTreePanel");
  if (panel) panel.classList.remove("hidden");
  const ptsEl = document.getElementById("skillTreePoints");
  if (ptsEl) ptsEl.textContent = state.skillPoints || 0;
  renderSkillTree();
}

function closeSkillTreePanel() {
  paused = false;
  if (player.mesh) {
    player.mesh.rotation.y = camYaw;
    player.aimDir.set(Math.sin(camYaw), 0, Math.cos(camYaw));
  }
  const panel = document.getElementById("skillTreePanel");
  if (panel) panel.classList.add("hidden");
  canvas.focus();
  if (running && !gameOver) canvas.requestPointerLock();
}

const ACTIVITY_UPGRADE_DEFS = {
  breach: [
    { id: "breach_speed", name: "Breach Hızı", desc: "Breach genişleme hızı +%15", cost: 1, key: "speed", max: 5 },
    { id: "breach_quantity", name: "Yaratık Sayısı", desc: "Breach'tan +1 yaratık", cost: 1, key: "quantity", max: 5 },
    { id: "breach_drop", name: "Drop Oranı", desc: "Breach drop +%10", cost: 1, key: "dropRate", max: 5 },
    { id: "breach_max", name: "Breach Sayısı", desc: "Aynı anda +1 breach (max 2→3)", cost: 2, key: "maxBreaches", max: 1 },
  ],
  ritual: [
    { id: "ritual_speed", name: "Ritüel Hızı", desc: "Ritüel dalga aralığı kısalır", cost: 1, key: "speed", max: 5 },
    { id: "ritual_quantity", name: "Yaratık Sayısı", desc: "Ritüelde +1 yaratık", cost: 1, key: "quantity", max: 5 },
    { id: "ritual_drop", name: "Drop Oranı", desc: "Ritüel sandık/drop +%10", cost: 1, key: "dropRate", max: 5 },
  ],
  abyss: [
    { id: "abyss_speed", name: "Abyss Hızı", desc: "Dalga aralığı kısalır", cost: 1, key: "speed", max: 5 },
    { id: "abyss_quantity", name: "Yaratık Sayısı", desc: "Abyss dalgasında +1 yaratık", cost: 1, key: "quantity", max: 5 },
    { id: "abyss_drop", name: "Drop Oranı", desc: "Abyss drop +%10", cost: 1, key: "dropRate", max: 5 },
  ],
  difficulty: [
    { id: "difficulty_mult", name: "Oyun Zorluğu", desc: "Düşman HP/hasari +%5 (daha fazla ödül)", cost: 1, key: "mult", max: 10 },
  ],
};

function getActivityPoints(tab) {
  if (tab === "breach") return state.breachPoints || 0;
  if (tab === "ritual") return state.ritualPoints || 0;
  if (tab === "abyss") return state.abyssPoints || 0;
  if (tab === "difficulty") return state.difficultyPoints || 0;
  return 0;
}

function spendActivityPoint(tab, amount) {
  if (tab === "breach") { state.breachPoints = Math.max(0, (state.breachPoints || 0) - amount); return; }
  if (tab === "ritual") { state.ritualPoints = Math.max(0, (state.ritualPoints || 0) - amount); return; }
  if (tab === "abyss") { state.abyssPoints = Math.max(0, (state.abyssPoints || 0) - amount); return; }
  if (tab === "difficulty") { state.difficultyPoints = Math.max(0, (state.difficultyPoints || 0) - amount); return; }
}

function getActivityUpgradeLevel(tab, key) {
  const u = tab === "breach" ? (state.breachUpgrades || {}) : tab === "ritual" ? (state.ritualUpgrades || {}) : tab === "abyss" ? (state.abyssUpgrades || {}) : (state.difficultyUpgrades || {});
  return u[key] || 0;
}

function setActivityUpgradeLevel(tab, key, level) {
  if (tab === "breach") { if (!state.breachUpgrades) state.breachUpgrades = {}; state.breachUpgrades[key] = level; return; }
  if (tab === "ritual") { if (!state.ritualUpgrades) state.ritualUpgrades = {}; state.ritualUpgrades[key] = level; return; }
  if (tab === "abyss") { if (!state.abyssUpgrades) state.abyssUpgrades = {}; state.abyssUpgrades[key] = level; return; }
  if (tab === "difficulty") { if (!state.difficultyUpgrades) state.difficultyUpgrades = {}; state.difficultyUpgrades.mult = level; return; }
}

function openActivitySkillPanel() {
  paused = true;
  if (pointerLocked) document.exitPointerLock();
  state.activitySkillTab = state.activitySkillTab || "breach";
  const panel = document.getElementById("activitySkillPanel");
  if (panel) panel.classList.remove("hidden");
  document.querySelectorAll(".activityTab").forEach((btn) => btn.classList.toggle("primary", btn.getAttribute("data-tab") === state.activitySkillTab));
  const treeBtn = document.getElementById("activitySkillTreeBtn");
  if (treeBtn) treeBtn.style.display = state.exileMode ? "inline-block" : "none";
  renderActivitySkillTab();
}

function closeActivitySkillPanel() {
  paused = false;
  if (player.mesh) {
    player.mesh.rotation.y = camYaw;
    player.aimDir.set(Math.sin(camYaw), 0, Math.cos(camYaw));
  }
  const panel = document.getElementById("activitySkillPanel");
  if (panel) panel.classList.add("hidden");
  canvas.focus();
  if (running && !gameOver) canvas.requestPointerLock();
}

function renderActivitySkillTab() {
  const tab = state.activitySkillTab || "breach";
  const ptsEl = document.getElementById("activitySkillPoints");
  const contentEl = document.getElementById("activitySkillContent");
  if (!ptsEl || !contentEl) return;
  const points = getActivityPoints(tab);
  const tabNames = { breach: "Breach", ritual: "Ritüel", abyss: "Abyss", difficulty: "Oyun Zorluğu" };
  ptsEl.textContent = tabNames[tab] + " Puanı: " + points;
  const defs = ACTIVITY_UPGRADE_DEFS[tab] || [];
  let html = "";
  for (const d of defs) {
    const current = getActivityUpgradeLevel(tab, d.key);
    const atMax = current >= d.max;
    const canBuy = !atMax && points >= d.cost;
    html += "<div class=\"activityUpgradeRow\" style=\"display:flex;align-items:center;justify-content:space-between;margin:8px 0;padding:6px;background:rgba(0,0,0,0.3);border-radius:6px;\">";
    html += "<div><strong>" + d.name + "</strong> (" + current + "/" + d.max + ")<br><small>" + d.desc + "</small></div>";
    html += "<button type=\"button\" class=\"btn " + (canBuy ? "primary" : "secondary") + "\" data-upgrade-id=\"" + d.id + "\" data-cost=\"" + d.cost + "\" data-key=\"" + d.key + "\" " + (canBuy ? "" : "disabled") + ">+" + d.cost + " puan</button>";
    html += "</div>";
  }
  contentEl.innerHTML = html;
  contentEl.querySelectorAll("button[data-upgrade-id]").forEach((btn) => {
    btn.addEventListener("click", function() {
      const id = this.getAttribute("data-upgrade-id");
      const cost = parseInt(this.getAttribute("data-cost"), 10);
      const key = this.getAttribute("data-key");
      const def = defs.find((x) => x.id === id);
      if (!def || getActivityPoints(tab) < cost) return;
      const current = getActivityUpgradeLevel(tab, key);
      if (current >= def.max) return;
      spendActivityPoint(tab, cost);
      setActivityUpgradeLevel(tab, key, current + 1);
      renderActivitySkillTab();
    });
  });
}

function isSkillTreeNodeUnlocked(id) {
  return (state.skillTreeUnlocked || []).indexOf(id) >= 0;
}

function isSkillTreeNodeAdjacent(id) {
  const unlocked = state.skillTreeUnlocked || ["start"];
  for (let i = 0; i < SKILL_TREE_EDGES.length; i++) {
    const [a, b] = SKILL_TREE_EDGES[i];
    if (a === id && unlocked.indexOf(b) >= 0) return true;
    if (b === id && unlocked.indexOf(a) >= 0) return true;
  }
  return false;
}

function applySkillTreeNode(node) {
  if (!node.effect) return;
  const e = node.effect;
  if (e.type === "mult" && e.stat) stats[e.stat] = (stats[e.stat] || 1) * e.value;
  else if (e.type === "add" && e.stat) stats[e.stat] = (stats[e.stat] || 0) + e.value;
  else if (e.type === "addHp") {
    stats.maxHp = (stats.maxHp || 100) + e.value;
    stats.hp = Math.min(stats.maxHp, (stats.hp || stats.maxHp) + e.value);
  }
}

function applySkillTreeZoomPan() {
  const wrap = document.getElementById("skillTreeZoomWrap");
  if (wrap) wrap.style.transform = "translate(" + skillTreePanX + "px," + skillTreePanY + "px) scale(" + skillTreeZoom + ")";
}

function renderSkillTree() {
  const container = document.getElementById("skillTreeContainer");
  if (!container) return;
  let zoomWrap = document.getElementById("skillTreeZoomWrap");
  if (!zoomWrap) {
    zoomWrap = document.createElement("div");
    zoomWrap.id = "skillTreeZoomWrap";
    zoomWrap.className = "skillTreeZoomWrap";
    zoomWrap.style.cssText = "overflow:hidden;width:100%;height:100%;transform-origin:50% 50%;cursor:grab;";
    container.appendChild(zoomWrap);
    zoomWrap.addEventListener("wheel", function(e) {
      e.preventDefault();
      skillTreeZoom *= (e.deltaY > 0 ? 0.9 : 1.1);
      skillTreeZoom = Math.max(0.5, Math.min(2.5, skillTreeZoom));
      applySkillTreeZoomPan();
    }, { passive: false });
    zoomWrap.addEventListener("mousedown", function(e) {
      if (e.button === 0 && !(e.target.closest && e.target.closest(".skillTreeNode"))) {
        skillTreeDragging = true;
        skillTreeLastX = e.clientX;
        skillTreeLastY = e.clientY;
        zoomWrap.style.cursor = "grabbing";
      }
    });
    document.addEventListener("mouseup", function up() {
      skillTreeDragging = false;
      if (zoomWrap) zoomWrap.style.cursor = "grab";
      document.removeEventListener("mouseup", up);
    });
    document.addEventListener("mousemove", function move(e) {
      if (!skillTreeDragging) return;
      skillTreePanX += e.clientX - skillTreeLastX;
      skillTreePanY += e.clientY - skillTreeLastY;
      skillTreeLastX = e.clientX;
      skillTreeLastY = e.clientY;
      applySkillTreeZoomPan();
    });
  }
  const unlocked = state.skillTreeUnlocked || ["start"];
  const points = state.skillPoints || 0;
  const scale = 72;
  const cx = 330;
  const cy = 210;
  const vbW = 660;
  const vbH = 420;
  const titleEsc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  let svg = "<svg class=\"skillTreeSvg\" viewBox=\"0 0 " + vbW + " " + vbH + "\" width=\"100%\" height=\"100%\" style=\"max-width:" + vbW + "px;max-height:" + vbH + "px;pointer-events:none;\"><g pointer-events=\"none\">";
  for (let i = 0; i < SKILL_TREE_EDGES.length; i++) {
    const [aid, bid] = SKILL_TREE_EDGES[i];
    const na = SKILL_TREE_NODES.find((n) => n.id === aid);
    const nb = SKILL_TREE_NODES.find((n) => n.id === bid);
    if (!na || !nb) continue;
    const x1 = cx + na.x * scale;
    const y1 = cy - na.y * scale;
    const x2 = cx + nb.x * scale;
    const y2 = cy - nb.y * scale;
    const u = unlocked.indexOf(aid) >= 0 && unlocked.indexOf(bid) >= 0;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="skillTreeEdge ${u ? "unlocked" : ""}" stroke="${u ? "#63d4ff" : "#333"}" stroke-width="${u ? 3 : 2}" />`;
  }
  for (let i = 0; i < SKILL_TREE_NODES.length; i++) {
    const n = SKILL_TREE_NODES[i];
    const x = cx + n.x * scale;
    const y = cy - n.y * scale;
    const u = unlocked.indexOf(n.id) >= 0;
    const canBuy = !u && n.cost > 0 && points >= n.cost && isSkillTreeNodeAdjacent(n.id);
    const fill = u ? "#63d4ff" : (canBuy ? "#ffd700" : "#444");
    const stroke = canBuy ? "#ffaa00" : (u ? "#88eeff" : "#555");
    const tip = titleEsc(n.name + (n.desc ? " — " + n.desc : ""));
    svg += `<circle cx="${x}" cy="${y}" r="24" class="skillTreeNode ${u ? "unlocked" : ""} ${canBuy ? "canBuy" : ""}" data-node-id="${n.id}" fill="${fill}" stroke="${stroke}" stroke-width="2" style="cursor:${canBuy ? "pointer" : "default"};pointer-events:auto;" title="${tip}" />`;
    const textFill = u ? "#aaddff" : (canBuy ? "#ffcc44" : "#666");
    svg += `<text x="${x}" y="${y + 38}" text-anchor="middle" font-size="10" fill="${textFill}" class="skillTreeNodeLabel">${titleEsc(n.name)}</text>`;
  }
  svg += "</g></svg>";
  zoomWrap.innerHTML = svg;
  applySkillTreeZoomPan();
  const ptsEl = document.getElementById("skillTreePoints");
  if (ptsEl) ptsEl.textContent = points;
  zoomWrap.querySelectorAll(".skillTreeNode.canBuy").forEach(function(el) {
    el.addEventListener("click", function(e) {
      e.stopPropagation();
      const id = el.getAttribute("data-node-id");
      const node = SKILL_TREE_NODES.find((n) => n.id === id);
      if (!node || node.cost <= 0 || (state.skillPoints || 0) < node.cost || !isSkillTreeNodeAdjacent(id)) return;
      if (!state.skillTreeUnlocked) state.skillTreeUnlocked = ["start"];
      state.skillTreeUnlocked.push(id);
      state.skillPoints = (state.skillPoints || 0) - node.cost;
      applySkillTreeNode(node);
      renderSkillTree();
    });
  });
}

function bindPauseMenu() {
  const resumeBtn = document.getElementById("resumeBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const quitBtn = document.getElementById("quitBtn");
  const skillTreeCloseBtn = document.getElementById("skillTreeCloseBtn");
  const skillMenuBtn = document.getElementById("skillMenuBtn");
  const activitySkillCloseBtn = document.getElementById("activitySkillCloseBtn");
  if (skillTreeCloseBtn) skillTreeCloseBtn.addEventListener("click", () => { closeSkillTreePanel(); });
  if (skillMenuBtn) skillMenuBtn.addEventListener("click", () => { document.getElementById("pauseMenu").classList.add("hidden"); openActivitySkillPanel(); });
  if (activitySkillCloseBtn) activitySkillCloseBtn.addEventListener("click", () => { closeActivitySkillPanel(); });
  const activitySkillTreeBtn = document.getElementById("activitySkillTreeBtn");
  if (activitySkillTreeBtn) activitySkillTreeBtn.addEventListener("click", () => { closeActivitySkillPanel(); openSkillTreePanel(); });
  document.querySelectorAll(".activityTab").forEach((btn) => {
    btn.addEventListener("click", function() {
      state.activitySkillTab = this.getAttribute("data-tab");
      document.querySelectorAll(".activityTab").forEach((b) => b.classList.toggle("primary", b.getAttribute("data-tab") === state.activitySkillTab));
      renderActivitySkillTab();
    });
  });
  if (resumeBtn) resumeBtn.addEventListener("click", () => { closePauseMenu(); });
  if (settingsBtn) settingsBtn.addEventListener("click", () => {
    document.getElementById("pauseMenu").classList.add("hidden");
    document.getElementById("settingsMenu").classList.remove("hidden");
  });
  if (quitBtn) quitBtn.addEventListener("click", () => {
    closePauseMenu();
    running = false;
    gameOver = false;
    leveling = false;
    paused = false;
    stopBgMusic();
    stopMenuMusic();
    if (typeof clearFloatingCounters === "function") clearFloatingCounters();
    hud.classList.add("hidden");
    skillsHud.classList.add("hidden");
    if (skillBarEl) skillBarEl.classList.add("hidden");
    levelupPanel.classList.add("hidden");
    gameOverPanel.classList.add("hidden");
    startScreen.classList.remove("hidden");
  });
}

function bindSettingsMenu() {
  const backBtn = document.getElementById("settingsBackBtn");
  if (backBtn) backBtn.addEventListener("click", () => {
    document.getElementById("settingsMenu").classList.add("hidden");
    if (paused) document.getElementById("pauseMenu").classList.remove("hidden");
    else if (!running && !gameOver) {
      document.getElementById("startScreen").classList.remove("hidden");
      stopMenuMusic();
    }
  });
  const sensSlider = document.getElementById("sensSlider");
  const sensValue = document.getElementById("sensValue");
  if (sensSlider) sensSlider.addEventListener("input", (e) => {
    camSettings.mouseSensitivity = parseFloat(e.target.value);
    if (sensValue) sensValue.textContent = camSettings.mouseSensitivity.toFixed(1);
  });
  const camDistSlider = document.getElementById("camDistSlider");
  const camDistValue = document.getElementById("camDistValue");
  if (camDistSlider) camDistSlider.addEventListener("input", (e) => {
    camSettings.cameraDistance = parseFloat(e.target.value);
    if (camDistValue) camDistValue.textContent = camSettings.cameraDistance.toFixed(1);
  });
  const camHeightSlider = document.getElementById("camHeightSlider");
  const camHeightValue = document.getElementById("camHeightValue");
  if (camHeightSlider) camHeightSlider.addEventListener("input", (e) => {
    camSettings.cameraHeight = parseFloat(e.target.value);
    if (camHeightValue) camHeightValue.textContent = camSettings.cameraHeight.toFixed(1);
  });
  const pitchRangeSlider = document.getElementById("pitchRangeSlider");
  const pitchRangeValue = document.getElementById("pitchRangeValue");
  if (pitchRangeSlider) pitchRangeSlider.addEventListener("input", (e) => {
    const range = parseFloat(e.target.value);
    const half = range / 2;
    camSettings.pitchMin = -half;
    camSettings.pitchMax = half;
    if (pitchRangeValue) pitchRangeValue.textContent = Math.round(range * 57.3) + "\u00B0";
  });
  const fovSlider = document.getElementById("fovSlider");
  const fovValue = document.getElementById("fovValue");
  if (fovSlider) fovSlider.addEventListener("input", (e) => {
    camSettings.fov = parseInt(e.target.value, 10);
    if (fovValue) fovValue.textContent = camSettings.fov;
  });
  const soundSlider = document.getElementById("soundSlider");
  const soundValue = document.getElementById("soundValue");
  if (soundSlider) soundSlider.addEventListener("input", (e) => {
    camSettings.soundVolume = parseInt(e.target.value, 10) / 100;
    if (soundValue) soundValue.textContent = e.target.value + "%";
    updateMusicVolume();
  });
  const musicSlider = document.getElementById("musicSlider");
  const musicValue = document.getElementById("musicValue");
  if (musicSlider) musicSlider.addEventListener("input", (e) => {
    camSettings.musicVolume = parseInt(e.target.value, 10) / 100;
    if (musicValue) musicValue.textContent = e.target.value + "%";
    updateMusicVolume();
  });
  const effectSlider = document.getElementById("effectSlider");
  const effectValue = document.getElementById("effectValue");
  if (effectSlider) effectSlider.addEventListener("input", (e) => {
    camSettings.effectVolume = parseInt(e.target.value, 10) / 100;
    if (effectValue) effectValue.textContent = e.target.value + "%";
  });
  const screenShakeCheck = document.getElementById("screenShakeCheck");
  if (screenShakeCheck) {
    screenShakeCheck.checked = camSettings.screenShake !== false;
    screenShakeCheck.addEventListener("change", (e) => { camSettings.screenShake = e.target.checked; });
  }
  const particleDensitySelect = document.getElementById("particleDensitySelect");
  if (particleDensitySelect) {
    particleDensitySelect.value = camSettings.particleDensity || "normal";
    particleDensitySelect.addEventListener("change", (e) => { camSettings.particleDensity = e.target.value; });
  }
  const weatherIntensitySelect = document.getElementById("weatherIntensitySelect");
  if (weatherIntensitySelect) {
    weatherIntensitySelect.value = camSettings.weatherIntensity || "normal";
    weatherIntensitySelect.addEventListener("change", (e) => { camSettings.weatherIntensity = e.target.value; });
  }
  const cameraAngleSelect = document.getElementById("cameraAngleSelect");
  if (cameraAngleSelect) {
    cameraAngleSelect.value = camSettings.cameraAngle || "default";
    cameraAngleSelect.addEventListener("change", (e) => { camSettings.cameraAngle = e.target.value; });
  }
  const graphics2DCheck = document.getElementById("graphics2DCheck");
  if (graphics2DCheck) {
    graphics2DCheck.checked = !!camSettings.graphics2D;
    graphics2DCheck.addEventListener("change", (e) => { camSettings.graphics2D = e.target.checked; });
  }
  try {
    const saved = JSON.parse(localStorage.getItem("zegabong_settings") || "{}");
    if (saved.screenShake !== undefined) camSettings.screenShake = saved.screenShake;
    if (saved.particleDensity) camSettings.particleDensity = saved.particleDensity;
    if (saved.weatherIntensity) camSettings.weatherIntensity = saved.weatherIntensity;
    if (saved.cameraAngle) camSettings.cameraAngle = saved.cameraAngle;
    if (saved.graphics2D !== undefined) camSettings.graphics2D = saved.graphics2D;
    if (saved.musicVolume !== undefined) camSettings.musicVolume = saved.musicVolume;
    if (saved.effectVolume !== undefined) camSettings.effectVolume = saved.effectVolume;
    if (screenShakeCheck) screenShakeCheck.checked = camSettings.screenShake;
    if (particleDensitySelect) particleDensitySelect.value = camSettings.particleDensity;
    if (weatherIntensitySelect) weatherIntensitySelect.value = camSettings.weatherIntensity;
    if (cameraAngleSelect) cameraAngleSelect.value = camSettings.cameraAngle || "default";
    if (graphics2DCheck) graphics2DCheck.checked = !!camSettings.graphics2D;
    if (musicSlider) { musicSlider.value = Math.round((camSettings.musicVolume ?? 1) * 100); if (musicValue) musicValue.textContent = Math.round((camSettings.musicVolume ?? 1) * 100) + "%"; }
    if (effectSlider) { effectSlider.value = Math.round((camSettings.effectVolume ?? 1) * 100); if (effectValue) effectValue.textContent = Math.round((camSettings.effectVolume ?? 1) * 100) + "%"; }
  } catch (e) {}
  const saveSettingsToStorage = () => { try { localStorage.setItem("zegabong_settings", JSON.stringify({ screenShake: camSettings.screenShake, particleDensity: camSettings.particleDensity, weatherIntensity: camSettings.weatherIntensity, cameraAngle: camSettings.cameraAngle, graphics2D: camSettings.graphics2D, musicVolume: camSettings.musicVolume, effectVolume: camSettings.effectVolume })); } catch (e) {} };
  if (screenShakeCheck) screenShakeCheck.addEventListener("change", () => saveSettingsToStorage());
  if (particleDensitySelect) particleDensitySelect.addEventListener("change", () => saveSettingsToStorage());
  if (weatherIntensitySelect) weatherIntensitySelect.addEventListener("change", () => saveSettingsToStorage());
  if (cameraAngleSelect) cameraAngleSelect.addEventListener("change", () => saveSettingsToStorage());
  if (graphics2DCheck) graphics2DCheck.addEventListener("change", () => saveSettingsToStorage());
  if (musicSlider) musicSlider.addEventListener("change", () => saveSettingsToStorage());
  if (effectSlider) effectSlider.addEventListener("change", () => saveSettingsToStorage());
  if (sensValue) sensValue.textContent = camSettings.mouseSensitivity.toFixed(1);
  if (camDistValue) camDistValue.textContent = camSettings.cameraDistance.toFixed(1);
  if (camHeightValue) camHeightValue.textContent = camSettings.cameraHeight.toFixed(1);
  if (pitchRangeValue) pitchRangeValue.textContent = Math.round((camSettings.pitchMax - camSettings.pitchMin) * 57.3) + "\u00B0";
  if (fovValue) fovValue.textContent = camSettings.fov;
  if (soundValue) soundValue.textContent = Math.round((camSettings.soundVolume ?? 1) * 100) + "%";
  if (soundSlider) soundSlider.value = Math.round((camSettings.soundVolume ?? 1) * 100);
  if (musicValue) musicValue.textContent = Math.round((camSettings.musicVolume ?? 1) * 100) + "%";
  if (effectValue) effectValue.textContent = Math.round((camSettings.effectVolume ?? 1) * 100) + "%";
}

function clearEntities() {
  enemies.forEach((e) => { releaseEnemyVisuals(e); scene.remove(e.mesh); });
  projectiles.forEach((p) => scene.remove(p.mesh));
  effects.forEach((fx) => {
    if (fx.pooled) { releaseDamageSprite(fx.mesh); return; }
    if (fx.mesh && fx.mesh.material) {
      if (fx.mesh.material.map) fx.mesh.material.map.dispose();
      fx.mesh.material.dispose();
    }
    scene.remove(fx.mesh);
  });
  xpOrbs.forEach((o) => scene.remove(o.mesh));
  chests.forEach((c) => scene.remove(c.mesh));
  worldPickups.forEach((p) => scene.remove(p.mesh));
  magnetPickups.forEach((p) => scene.remove(p.mesh));
  magnetPickups = [];
  slowmoPickups.forEach((p) => scene.remove(p.mesh));
  slowmoPickups = [];
  worldChests.forEach((wc) => scene.remove(wc.mesh));
  breaches.forEach((b) => { if (b.group && scene) scene.remove(b.group); });
  breaches = [];
  abyssPits.forEach((a) => { if (a.group && scene) scene.remove(a.group); });
  abyssPits = [];
  rituals.forEach((r) => { if (r.group && scene) scene.remove(r.group); });
  rituals = [];
  state.activeRitual = null;
  state.nearRitual = null;
  swordMeshes.forEach((m) => scene.remove(m));
  bananaMeshes.forEach((m) => scene.remove(m));
  groundSlipHazards.forEach((h) => { if (h.mesh && scene) scene.remove(h.mesh); });
  groundSlipHazards = [];
  saturnRingMeshes.forEach((m) => scene.remove(m));
  companions.forEach((c) => scene.remove(c.mesh));
  placeableTurrets.forEach((t) => scene.remove(t.mesh));
  enemies = [];
  projectiles = [];
  enemyProjectiles.forEach((p) => scene.remove(p.mesh));
  enemyProjectiles = [];
  enemyLasers.forEach((p) => scene.remove(p.mesh));
  enemyLasers = [];
  effects = [];
  xpOrbs = [];
  chests = [];
  worldPickups = [];
  bhopTrail.forEach((t) => { if (t.mesh && scene) scene.remove(t.mesh); if (t.mesh && t.mesh.geometry) t.mesh.geometry.dispose(); if (t.mesh && t.mesh.material) t.mesh.material.dispose(); });
  bhopTrail = [];
  bhopTrailTimer = 0;
  coinPickups.forEach((c) => scene.remove(c.mesh));
  coinPickups = [];
  magnetPickups.forEach((p) => scene.remove(p.mesh));
  magnetPickups = [];
  slowmoPickups.forEach((p) => scene.remove(p.mesh));
  slowmoPickups = [];
  worldChests = [];
  breaches = [];
  breachSpawnTimer = 60;
  abyssPits = [];
  abyssPitSpawnTimer = 55;
  rituals = [];
  ritualSpawnTimer = 60;
  instaKillGroundTimer = 550;
  swordMeshes = [];
  saturnRingMeshes = [];
  companions = [];
  placeableTurrets = [];
}

function openLobby() {
  stopBgMusic();
  startScreen.classList.add("hidden");
  const lobbyScreen = document.getElementById("lobbyScreen");
  if (lobbyScreen) lobbyScreen.classList.remove("hidden");
  bindLobbyCharacterEditor();
  syncLobbyAppearanceToUI();
  /* GLB asset yok – sadece default prosedürel yaratiklar
  preloadCreatureModels();
  */
}
function hexToHash(hex) {
  const n = Math.max(0, Math.min(0xffffff, hex));
  return "#" + n.toString(16).padStart(6, "0");
}
function hashToHex(h) {
  if (typeof h !== "string" || !/^#[0-9a-fA-F]{6}$/.test(h)) return 0x2299dd;
  return parseInt(h.slice(1), 16);
}
function syncLobbyAppearanceToUI() {
  loadPlayerAppearance();
  const app = state.playerAppearance || {};
  const bodyEl = document.getElementById("appBodyColor");
  const capeEl = document.getElementById("appCapeColor");
  const capeVisibleEl = document.getElementById("appCapeVisible");
  const armorEl = document.getElementById("appArmorColor");
  const scaleEl = document.getElementById("appScale");
  const scaleValEl = document.getElementById("appScaleValue");
  if (bodyEl) bodyEl.value = hexToHash(app.bodyColor);
  if (capeEl) capeEl.value = hexToHash(app.capeColor);
  if (capeVisibleEl) capeVisibleEl.checked = app.capeVisible === false;
  if (armorEl) armorEl.value = hexToHash(app.armorColor);
  if (scaleEl) scaleEl.value = String(app.scale != null ? app.scale : 1.2);
  if (scaleValEl) scaleValEl.textContent = (app.scale != null ? app.scale : 1).toFixed(1);
  const retroRow = document.getElementById("retroPresetRow");
  if (retroRow) retroRow.style.display = state.konamiUnlocked ? "block" : "none";
}
function bindLobbyCharacterEditor() {
  const bodyEl = document.getElementById("appBodyColor");
  const capeEl = document.getElementById("appCapeColor");
  const capeVisibleEl = document.getElementById("appCapeVisible");
  const armorEl = document.getElementById("appArmorColor");
  const scaleEl = document.getElementById("appScale");
  const scaleValEl = document.getElementById("appScaleValue");
  function applyAppearance() {
    if (!state.playerAppearance) loadPlayerAppearance();
    state.playerAppearance.bodyColor = bodyEl ? hashToHex(bodyEl.value) : 0x2299dd;
    state.playerAppearance.capeColor = capeEl ? hashToHex(capeEl.value) : 0x4444aa;
    state.playerAppearance.capeVisible = capeVisibleEl ? !capeVisibleEl.checked : true;
    state.playerAppearance.armorColor = armorEl ? hashToHex(armorEl.value) : 0x4488cc;
    state.playerAppearance.scale = scaleEl ? clamp(parseFloat(scaleEl.value), 0.9, 1.5) : 1.2;
    if (scaleValEl) scaleValEl.textContent = state.playerAppearance.scale.toFixed(1);
    savePlayerAppearance();
  }
  if (bodyEl) bodyEl.addEventListener("input", applyAppearance);
  if (capeEl) capeEl.addEventListener("input", applyAppearance);
  if (capeVisibleEl) capeVisibleEl.addEventListener("change", applyAppearance);
  if (armorEl) armorEl.addEventListener("input", applyAppearance);
  if (scaleEl) {
    scaleEl.addEventListener("input", () => { applyAppearance(); if (scaleValEl) scaleValEl.textContent = state.playerAppearance.scale.toFixed(1); });
  }
  const retroBtn = document.getElementById("appRetroBtn");
  if (retroBtn) retroBtn.addEventListener("click", () => {
    if (!state.playerAppearance) loadPlayerAppearance();
    state.playerAppearance.bodyColor = 0x0066cc;
    state.playerAppearance.capeColor = 0x6600cc;
    state.playerAppearance.armorColor = 0x3366aa;
    state.playerAppearance.scale = 1.2;
    savePlayerAppearance();
    syncLobbyAppearanceToUI();
  });
}

function startRun(selectedChapter, selectedMapId) {
  stopBgMusic();
  stopMenuMusic();
  if (document.body) document.body.classList.remove("death-grayscale");
  const lobbyScreen = document.getElementById("lobbyScreen");
  if (lobbyScreen) lobbyScreen.classList.add("hidden");
  state.selectedMapId = selectedMapId || "classic";
  state.chapter = 1;
  state.challengeMode = (document.getElementById("challengeModeSelect") && document.getElementById("challengeModeSelect").value) || "none";
  hideMenuDiorama();
  clearWorld();
  if (canvas) canvas.style.display = "";
  const loadingEl = document.getElementById("loadingOverlay");
  const progressEl = document.getElementById("loadingProgress");
  if (loadingEl) {
    loadingEl.classList.remove("hidden");
    if (progressEl) progressEl.textContent = "0%";
  }
  function onWorldDone() {
    loadPlayerAppearance();
    try { buildPlayer(); } catch (e) { console.error("buildPlayer:", e); }
    applyChallengeMode();
    running = true;
    const pn = (typeof getPlayerName === "function" ? getPlayerName() : "") || "";
    if (pn.toLowerCase().indexOf("herobrine") !== -1 && typeof showGameNotification === "function") {
      setTimeout(() => showGameNotification("Sen mi Herobrine? O.O", { rainbow: true }), 2000);
    }
  leveling = false;
  gameOver = false;
  paused = false;
  levelupAutoPick = 0;
  stopMenuMusic();
  ensureAudio();
  startGameMusic();
  bhop.streak = 0;
  bhop.speedBonus = 0;
  bhop.landTime = 0;
  bhop.wasGrounded = true;
  bhop.lastJumpTime = 0;
  bhop.spaceDown = false;
  bhop.spacePressedThisFrame = false;
  const pauseEl = document.getElementById("pauseMenu");
  const settingsEl = document.getElementById("settingsMenu");
  if (pauseEl) pauseEl.classList.add("hidden");
  if (settingsEl) settingsEl.classList.add("hidden");

  Object.assign(stats, baseStats);
  stats.hp = 120;
  stats.maxHp = 120;
  state.time = 0;
  state.level = 1;
  state.xp = 0;
  state.xpNext = getXpNextForLevel(1);
  state.kills = 0;
  state.killCombo = 0;
  state.lastKillTime = 0;
  state.spawnTimer = 13;
  state.pendingLevels = 0;
  state.difficultyStage = 1;
  state.nextDifficultyAt = STAGE_INTERVAL;
  state.bossesDefeated = 0;
  state.staticShivCounter = 0;
  state.meleeSwingTimer = 0;
  state.meleeSwingHit = false;
  state.auraTriggers = { thunder: 0, ice: 0, ash: 0 };
  state.flickerTeleportTimer = 0;
  state.flickerTargetEnemy = null;
  state.playerPoisonLeft = 0;
  for (const pud of (state.toxicPuddles || [])) { if (pud.mesh && typeof scene !== "undefined") scene.remove(pud.mesh); }
  state.toxicPuddles = [];
  state.slowPuddles = [];
  state.balloonGunTimer = 0;
  state.toxicTrailTimer = 0;
  state.difficultyStage = state.chapter;
  state.unlockedSkillIds = new Set();
  state.achievementsUnlocked = loadAchievements();
  state.chapterTime = 0;
  state.bossSpawnedThisChapter = [false, false, false];
  state.bossSlotsSpawnedThisChapter = [false, false, false];
  state.bossIncomingNotified = false;
  state.realDifficultyNotifiedThisChapter = false;
  state.realDifficultyTier = 0;
  state.portalActive = false;
  state.portalPos = null;
  state.portalUnlocked = false;
  state.portalChargeTime = 0;
  state.portalVoidBossSpawned = false;
  state.portalsEntered = 0;
  state.boss3Defeated = false;
  state.transitionAltarUsed = false;
  state.mapVoidOverlayUntil = 0;
  state.transitionAltarInsideTime = 0;
  state.inMegaArena = false;
  state.megaArenaCenter = null;
  state.megaBossSpawned = false;
  state.inTemple = false;
  state.templeIndex = 0;
  state.weather = null;
  state.weatherEndTime = 0;
  state.lightningTelegraphs = [];
  state.endlessMode = false;
  state.endlessTime = 0;
  state.endlessWave = 0;
  state.caveXpMult = 1;
  state.coins = 0;
  state.mana = 100;
  state.maxMana = 100;
  state.stamina = 100;
  state.maxStamina = 100;
  state.difficultyMult = 1.0;
  state.difficultyFirstBumpApplied = false;
  state.difficultyRampStartTime = 0;
  state.difficultyRampStepsApplied = 0;
  state.heraldStrikesThisSecond = 0;
  state.heraldLastSecondReset = 0;
  state.bossDropMult = 1.0;
  state.hardcoreMode = false;
  state.randomPortalCooldown = 0;
  state.bonusTime = false;
  state.bonusTimeEnd = 0;
  state.bonusTimeComboCount = 0;
  state.nextBonusAt = 200;
  state.invincibleUntil = 0;
  state.rageMeter = 0;
  state.rageUntil = 0;
  state.magnetBurstUntil = 0;
  state.magnetBurstCd = 0;
  state.playerDying = false;
  state.ragdollUntil = 0;
  state.deathRagdollStart = 0;
  state.deathRagdollDuration = 0;
  autoAttackEnabled = true;
  shrineSkillPanelOpen = false;
  shadowMode = false;
  weatherTimer = 0;
  activeWeatherEvent = null;
  poisonZone = null;
  lastDifficultyScaleTime = 0;
  dayNightTime = 60;
  chaosMeteorTimer = 0;
  chaosIceTimer = 0;
  activeVendingBuffs = [];
  bossArenas.forEach(a => a.triggered = false);
  difficultyAltars.forEach(a => { a.userData.used = false; });
  const lowHpEl = document.getElementById("lowHpOverlay");
  if (lowHpEl) lowHpEl.classList.remove("active");
  shadowModeTimer = 0;
  state.soulRoundActive = false;
  state.soulRoundEndTime = 0;
  state.nextSoulRoundAt = SOUL_ROUND_INTERVAL;
  state.soulRoundSpawnTimer = 0;
  state.hordeSurgeActive = false;
  state.hordeSurgeEndTime = 0;
  state.nextHordeSurgeAt = HORDE_SURGE_INTERVAL;
  state.hordeSurgeSpawnTimer = 0;
  state.attackRoundStarted = false;
  state.attackRoundActive = false;
  state.attackRoundPhase = 1;
  state.instaKillUntil = 0;
  state.reloadWeaponUnlocked = false;
  state.reloadAmmo = 4;
  state.reloadMax = 4;
  state.reloadTimer = 0;
  ragdoll.torsoTilt = 0; ragdoll.torsoTiltVel = 0;
  ragdoll.torsoLean = 0; ragdoll.torsoLeanVel = 0;
  ragdoll.headBob = 0; ragdoll.headBobVel = 0;
  ragdoll.impactForce.set(0, 0, 0);
  ragdoll.stumbleTimer = 0; ragdoll.landSquash = 0;
  if (portalMesh) { scene.remove(portalMesh); portalMesh = null; }
  applyMapTheme(state.chapter);

  abilityState.fireball = { level: 0, timer: 0, cooldown: 2.2, damage: 24, speed: 20, aoe: 2.3, shots: 1 };
  abilityState.comet = { level: 0, timer: 0, cooldown: 3.0, damage: 34, speed: 29, pierce: 2 };
  abilityState.swords = { level: 0, count: 1, damage: 14, radius: 2.8, spin: 2.7 };
  abilityState.meteor = { level: 0, timer: 0, cooldown: 5.8, damage: 58, radius: 3.8 };
  abilityState.frostball = { level: 0, timer: 0, cooldown: 2.8, damage: 20, freeze: 2.2, shards: 3 };
  abilityState.nova = { level: 0, timer: 0, cooldown: 4.6, damage: 26, radius: 4.2 };
  abilityState.banana = { level: 0, timer: 0, cooldown: 2.5, damage: 28, speed: 22, stun: 1.2, count: 2, throwCount: 1 };
  abilityState.swordThrow = { level: 0, timer: 0, cooldown: 3.2, damage: 42, speed: 24, range: 12 };
  abilityState.boomerang = { level: 0, timer: 0, cooldown: 2.8, damage: 35, speed: 24, range: 14 };
  abilityState.shuriken = { level: 0, timer: 0, cooldown: 1.8, damage: 18, speed: 28, count: 3 };
  abilityState.bomb = { level: 0, timer: 0, cooldown: 4.0, damage: 55, speed: 14, explosionRadius: 4.0, arcUp: 10 };
  abilityState.lineShot = { level: 0, timer: 0, cooldown: 2.4, damage: 38, length: 7, width: 0.5, speed: 42 };
  abilityState.laser = { level: 0, timer: 0, cooldown: 3.0, damage: 48, range: 14, width: 0.35, duration: 0.22 };
  abilityState.lightBeam = { level: 0, timer: 0, cooldown: 2.8, damage: 42, range: 16, width: 0.5, duration: 0.28 };
  abilityState.coneBlast = { level: 0, timer: 0, cooldown: 3.2, damage: 35, range: 5, halfAngle: Math.PI / 6 };
  abilityState.dismantle = { level: 0, timer: 0, cooldown: 3.5, damage: 44, radius: 5, arcAngle: Math.PI / 2 };
  abilityState.gorillaAura = { level: 0, radius: 3.2, damage: 14, tickRate: 0.45, tickTimer: 0 };
  abilityState.flickerStrike = { level: 0, cooldown: 2.2, timer: 0, range: 5.5, damage: 38 };
  abilityState.spark = { level: 0, timer: 0, cooldown: 2.4, damage: 18, speed: 14, count: 5 };
  abilityState.smite = { level: 0, damageMult: 1.0, radius: 2 };
  abilityState.kineticBlast = { level: 0, maxTargets: 3, damageMult: 1.0, baseDamage: 32 };
  abilityState.saturnRings = null;
  abilityState.chainBolt = { level: 0, timer: 0, cooldown: 2.6, damage: 22, jumps: 4 };
  abilityState.blackHole = { level: 0, timer: 0, cooldown: 6.8, damage: 48, radius: 7, zone: null };
  abilityState.poisonTrail = { level: 0, timer: 0, cooldown: 0.32, damage: 9, radius: 2.4 };
  specialState.frostNova.timer = 0;
  specialState.dash.timer = 0;
  specialState.meteorUlt.timer = 0;
  specialState.explosion.timer = 0;
  specialUnlocks.frostNova = false;
  specialUnlocks.dash = false;
  specialUnlocks.meteorUlt = false;
  specialUnlocks.turret = false;
  specialUnlocks.explosion = false;
  state.dashUntil = null;
  stateUltimate = null;
  turretPlaceCd = 0;

  Object.keys(skillLevels).forEach((k) => delete skillLevels[k]);
  ownedSkills.clear();
  currentChoices = [];
  acquiredOrder.length = 0;
  state.unlockedSkillIds = new Set();
  state.chestsOpened = 0;
  state.lastWaveLullAt = 0;
  resetChestPanel();

  const charRadio = document.querySelector('input[name="lobbyChar"]:checked');
  const charId = charRadio ? charRadio.value : "scout";
  state.selectedCharacter = charId;
  const char = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
  if (char.startStats) Object.assign(stats, char.startStats);
  (char.startSkills || []).forEach((sid) => {
    skillLevels[sid] = 1;
    const s = skills.find((sk) => sk.id === sid);
    if (s && s.apply) s.apply();
  });

  if (state.exileMode) {
    state.skillPoints = 0;
    state.skillTreeUnlocked = ["start"];
  }
  state.breachPoints = 0;
  state.ritualPoints = 0;
  state.abyssPoints = 0;
  state.difficultyPoints = 0;
  state.breachUpgrades = { speed: 0, quantity: 0, dropRate: 0, maxBreaches: 0 };
  state.ritualUpgrades = { speed: 0, quantity: 0, dropRate: 0 };
  state.abyssUpgrades = { speed: 0, quantity: 0, dropRate: 0 };
  state.difficultyUpgrades = { mult: 0 };
  stats.hp = Math.max(0, Math.min(stats.maxHp, stats.hp));
  stats.maxHp = Math.max(1, stats.maxHp);
  clearEntities();
  shrineGroups.forEach((s) => { if (s.userData) { s.userData.used = false; s.userData.cooldown = 0; s.userData.insideTime = 0; s.userData._panelOpened = false; } });

  /* GLB asset yok – sadece default prosedürel yaratiklar
  preloadCreatureModels();
  */

  player.vel.set(0, 0, 0);
  player.vy = 0;
  player.grounded = true;
  player.aimDir.set(0, 0, 1);
  player.shootCd = 0;
  const mapId = state.selectedMapId || state.currentMapId || "classic";
  const maxSpawnR = mapId === "island" ? ISLAND_RADIUS - 15 : WORLD_HALF - 20;
  const spawnRadius = Math.min(maxSpawnR, mapId === "island" ? (ISLAND_RADIUS - 15) : (WORLD_HALF - 20));
  const spawnAngle = Math.random() * Math.PI * 2;
  const spawnX = Math.cos(spawnAngle) * spawnRadius * (0.3 + Math.random() * 0.7);
  const spawnZ = Math.sin(spawnAngle) * spawnRadius * (0.3 + Math.random() * 0.7);
  const groundY = getGroundHeight(spawnX, spawnZ);
  player.mesh.position.set(spawnX, typeof groundY === "number" && isFinite(groundY) ? groundY : 0, spawnZ);
  camYaw = Math.atan2(-spawnX, -spawnZ);
  camPitch = -0.24;
  if (typeof camYaw !== "number" || !isFinite(camYaw)) camYaw = 0;
  if (typeof camPitch !== "number" || !isFinite(camPitch)) camPitch = -0.24;
  player.mesh.rotation.y = camYaw;
  player.mesh.rotation.x = 0;
  player.mesh.rotation.z = 0;
  player.aimDir.set(Math.sin(camYaw), 0, Math.cos(camYaw));
  skipMouseFramesAfterLock = 0;

  for (let i = 0; i < 2; i++) spawnEnemy();

  startScreen.classList.add("hidden");
  levelupPanel.classList.add("hidden");
  gameOverPanel.classList.add("hidden");
  hud.classList.remove("hidden");
  if (skillsHud) skillsHud.style.display = "none";
  if (skillBarEl) skillBarEl.style.display = "none";
  loadQuests();
  }
  var mapId = state.selectedMapId || "classic";
  var worldDoneCalled = false;
  function finishWorld() {
    if (worldDoneCalled) return;
    worldDoneCalled = true;
    if (loadingEl) loadingEl.classList.add("hidden");
    if (onWorldDone) onWorldDone();
  }
  setTimeout(function safetyTimeout() {
    if (loadingEl && !loadingEl.classList.contains("hidden")) {
      console.warn("Yukleme 12 sn asildi, oyun zorla baslatiliyor.");
      finishWorld();
    }
  }, 12000);
  function setProgress(pct, label) {
    if (progressEl) progressEl.textContent = (label ? label + " " : "") + Math.round(pct) + "%";
  }
  function doBuild() {
    if (mapId === "classic") {
      if (progressEl) progressEl.textContent = "50%";
      try { buildWorld("classic"); } catch (e) { console.error("buildWorld classic:", e); }
      finishWorld();
      return;
    }
    buildWorldChunked(mapId, setProgress, finishWorld);
  }
  if (mapId === "classic") {
    requestAnimationFrame(function() { doBuild(); });
  } else {
    var mapScript = document.createElement("script");
    mapScript.src = "maps/" + mapId + ".js";
    mapScript.onload = doBuild;
    mapScript.onerror = doBuild;
    document.head.appendChild(mapScript);
  }
}

function applyChallengeMode() {
  const mode = state.challengeMode || "none";
  state.challengeTimerEnd = null;
  if (mode === "one_life") { stats.maxHp = 1; stats.hp = 1; stats.regen = 0; }
  if (mode === "timer_5") { state.challengeTimerEnd = state.time + 300; }
}

function pickEnemyTier() {
  const t = state.time;
  const lv = state.level;
  const stage = state.difficultyStage;
  const roll = Math.random();
  const uniqueChance = t > 120 ? Math.min(0.06, 0.005 + lv * 0.001 + stage * 0.002) : 0;
  const rareChance = Math.min(0.25, 0.05 + lv * 0.003 + stage * 0.006);
  const magicChance = Math.min(0.55, 0.18 + lv * 0.004 + stage * 0.008);
  if (roll < uniqueChance) return "unique";
  if (roll < uniqueChance + rareChance) return "rare";
  if (roll < uniqueChance + rareChance + magicChance) return "magic";
  return "normal";
}

function addEnemyZoneOverlay(mesh, hexColor, throughWalls) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 1.28, 32),
    new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthTest: !throughWalls, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  mesh.add(ring);
  return ring;
}

function createEnemy(tier, cfg, opts) {
  return withSharedGeoMat(function () { return createEnemyInner(tier, cfg, opts); });
}
function createEnemyInner(tier, cfg, opts) {
  opts = (opts && typeof opts === "object") ? opts : {};
  const isBoss = tier === "boss";
  const r = Math.random();
  const mapId = state.selectedMapId || state.currentMapId || "classic";
  let normalBeastType = opts.forceBeastType || null;
  if (tier === "rare" && (opts.forceBeastType === "shadow" || opts.forceBeastType === "purpleShadow" || opts.forceBeastType === "purpleSkeleton" || opts.forceBeastType === "purpleSlime")) normalBeastType = opts.forceBeastType;
  if (tier === "normal" && normalBeastType == null) {
    const chapterTime = state.chapterTime || 0;
    if (chapterTime > 600) {
      const rr = Math.random();
      if (rr < 0.38) normalBeastType = "shadow";
      else if (rr < 0.58) normalBeastType = "flame";
    }
    if (normalBeastType == null && state.bonusTime) normalBeastType = "skeleton";
    else if (normalBeastType == null && mapId === "desert") {
      normalBeastType = r < 0.22 ? "scorpion" : r < 0.38 ? "snake" : r < 0.50 ? "cactus" : r < 0.60 ? "spider" : r < 0.68 ? "beetle" : r < 0.76 ? "crow" : r < 0.84 ? "skeleton" : r < 0.90 ? "void" : "horror";
    } else if (normalBeastType == null && mapId === "ice") {
      normalBeastType = r < 0.28 ? "polarBear" : r < 0.40 ? "bear" : r < 0.52 ? "ghost" : r < 0.62 ? "skeleton" : r < 0.72 ? "crow" : r < 0.80 ? "bat" : r < 0.88 ? "void" : "horror";
    } else if (normalBeastType == null && mapId === "swamp") {
      normalBeastType = r < 0.12 ? "slime" : r < 0.24 ? "snake" : r < 0.36 ? "scorpion" : r < 0.46 ? "spider" : r < 0.56 ? "ghost" : r < 0.64 ? "skeleton" : r < 0.72 ? "wraith" : r < 0.80 ? "bat" : r < 0.88 ? "wolf" : "void";
    } else if (normalBeastType == null && (mapId === "classic" || mapId === "forest")) {
      const ch = state.chapter || 1;
      if (ch >= 3) {
        const r3 = Math.random();
        if (r3 < 0.20) normalBeastType = "shadow";
        else if (r3 < 0.28) normalBeastType = "vampire";
        else if (r3 < 0.35) normalBeastType = "purpleShadow";
        else if (r3 < 0.42) normalBeastType = "purpleSkeleton";
        else if (r3 < 0.49) normalBeastType = "purpleSlime";
        else if (r3 < 0.56) normalBeastType = "redBat";
        else normalBeastType = r < 0.05 ? "slime" : r < 0.07 ? "tree" : r < 0.09 ? "creeper" : r < 0.11 ? "zombie" : r < 0.13 ? "flame" : r < 0.14 ? "snail" : r < 0.26 ? "goblin" : r < 0.32 ? "scorpion" : r < 0.38 ? "spider" : r < 0.44 ? "wolf" : r < 0.50 ? "bear" : r < 0.56 ? "boar" : r < 0.62 ? "fox" : r < 0.68 ? "ghost" : r < 0.74 ? "skeleton" : r < 0.79 ? "snake" : r < 0.84 ? "beetle" : r < 0.88 ? "crow" : r < 0.92 ? "wraith" : r < 0.96 ? "bat" : r < 0.98 ? "void" : "horror";
      } else if (ch >= 2) {
        if (Math.random() < 0.12) normalBeastType = "vampire";
        else normalBeastType = r < 0.05 ? "slime" : r < 0.07 ? "tree" : r < 0.09 ? "creeper" : r < 0.11 ? "zombie" : r < 0.13 ? "flame" : r < 0.14 ? "snail" : r < 0.26 ? "goblin" : r < 0.32 ? "scorpion" : r < 0.38 ? "spider" : r < 0.44 ? "wolf" : r < 0.50 ? "bear" : r < 0.56 ? "boar" : r < 0.62 ? "fox" : r < 0.68 ? "ghost" : r < 0.74 ? "skeleton" : r < 0.79 ? "snake" : r < 0.84 ? "beetle" : r < 0.88 ? "crow" : r < 0.92 ? "wraith" : r < 0.96 ? "bat" : r < 0.98 ? "void" : "horror";
      } else {
        normalBeastType = r < 0.05 ? "slime" : r < 0.07 ? "tree" : r < 0.09 ? "creeper" : r < 0.11 ? "zombie" : r < 0.13 ? "flame" : r < 0.26 ? "goblin" : r < 0.32 ? "scorpion" : r < 0.38 ? "spider" : r < 0.44 ? "wolf" : r < 0.50 ? "bear" : r < 0.56 ? "boar" : r < 0.62 ? "fox" : r < 0.68 ? "ghost" : r < 0.74 ? "skeleton" : r < 0.79 ? "snake" : r < 0.84 ? "beetle" : r < 0.88 ? "crow" : r < 0.92 ? "wraith" : r < 0.96 ? "bat" : r < 0.98 ? "void" : "horror";
      }
    } else if (normalBeastType == null) {
      normalBeastType = r < 0.04 ? "creeper" : r < 0.05 ? "snail" : r < 0.06 ? "zombie" : r < 0.08 ? "scorpion" : r < 0.14 ? "spider" : r < 0.20 ? "wolf" : r < 0.26 ? "bear" : r < 0.32 ? "boar" : r < 0.38 ? "fox" : r < 0.44 ? "ghost" : r < 0.50 ? "skeleton" : r < 0.56 ? "snake" : r < 0.62 ? "beetle" : r < 0.68 ? "crow" : r < 0.74 ? "wraith" : r < 0.82 ? "bat" : r < 0.90 ? "void" : "horror";
    }
  }
  const names = normalBeastType && enemyNames[normalBeastType] ? enemyNames[normalBeastType] : (enemyNames[tier] || enemyNames.normal);
  let name = Math.random() < 0.002 && tier === "normal" ? "Doge" : names[Math.floor(Math.random() * names.length)];
  const tint = 1 + (Math.random() - 0.5) * 0.2;
  let color = { normal: 0xff4d62, magic: 0x64d5ff, rare: 0xffd374, unique: 0xff8ddd, boss: 0xff3f4b }[tier];
  let emissive = { normal: 0x33080c, magic: 0x143349, rare: 0x4b2e10, unique: 0x3d133b, boss: 0x4f0d16 }[tier];
  if (tier === "normal" && (name === "Goblin" || normalBeastType === "goblin")) { color = 0x44aa44; emissive = 0x1a441a; }
  const scaleVar = 1.18 + Math.random() * 0.12;
  const voxelId = pickEnemyVoxelId(isBoss, normalBeastType, opts);
  let voxelUsed = false;
  let g = null;
  if (!isBoss && voxelId) g = acquireEnemyMesh(voxelId);
  if (g) {
    voxelUsed = true;
    const info = g.userData.voxelInfo || {};
    const sH = cfg.height / Math.max(info.height, 0.01);
    const sR = (cfg.radius * 2) / Math.max(info.width, 0.01);
    g.scale.setScalar(Math.min(sH, sR) * scaleVar);
  } else {
    g = new THREE.Group();
    if (voxelId && attachVoxelModel(g, voxelId, cfg.height, cfg.radius, scaleVar)) {
      voxelUsed = true;
      if (!isBoss) {
        g.userData.poolKeep = g.children.length;
        g.userData.poolVoxelId = voxelId;
      }
    } else {
      g.scale.setScalar(scaleVar);
    }
  }

  if (!voxelUsed) {
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff44 });

  if (isBoss) {
    const bossVariant = state.currentBossIndex ?? 0;
    const r = cfg.radius;
    const h = cfg.height;
    const coreMat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.15 });
    if (bossVariant === 0) {
      const spiderMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, emissive: 0x0a0502, emissiveIntensity: 0.2, roughness: 0.6 });
      const abdomen = new THREE.Mesh(new THREE.SphereGeometry(r * 0.9, 12, 10), spiderMat);
      abdomen.scale.set(1.2, 1, 1.1); abdomen.position.y = h * 0.45;
      const thorax = new THREE.Mesh(new THREE.SphereGeometry(r * 0.5, 10, 8), spiderMat);
      thorax.position.y = h * 0.85;
      const head = new THREE.Mesh(new THREE.SphereGeometry(r * 0.35, 8, 6), spiderMat);
      head.position.y = h * 1.1;
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(r * 0.08, 6, 6), eyeMat);
      eyeL.position.set(-r * 0.15, h * 1.12, r * 0.22);
      const eyeR = eyeL.clone(); eyeR.position.x *= -1;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.06, r * 0.04, h * 0.55, 6), spiderMat);
        leg.position.set(Math.cos(angle) * r * 0.6, h * 0.5, Math.sin(angle) * r * 0.6);
        leg.rotation.z = Math.cos(angle) * 0.5; leg.rotation.x = 0.4;
        g.add(leg);
      }
      g.add(abdomen, thorax, head, eyeL, eyeR);
    } else if (bossVariant === 1) {
      const tentacleMat = new THREE.MeshStandardMaterial({ color: 0x228833, emissive: 0x0a4415, emissiveIntensity: 0.35, roughness: 0.5, metalness: 0.05 });
      const tentacleDark = new THREE.MeshStandardMaterial({ color: 0x1a6622, emissive: 0x062a0a, emissiveIntensity: 0.2, roughness: 0.55 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 14, 12), tentacleMat);
      body.scale.set(1.15, 1.2, 1.15); body.position.y = h * 0.55;
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(r * 0.14, 8, 6), eyeMat);
      eyeL.position.set(-r * 0.35, h * 0.7, r * 0.5);
      const eyeR = eyeL.clone(); eyeR.position.x *= -1;
      g.add(body, eyeL, eyeR);
      const tentacleCount = 8;
      for (let i = 0; i < tentacleCount; i++) {
        const angle = (i / tentacleCount) * Math.PI * 2 + 0.2;
        const dx = Math.cos(angle);
        const dz = Math.sin(angle);
        const armLen = r * 1.4;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.28, armLen, 8), tentacleMat);
        arm.position.set(dx * armLen * 0.5, h * 0.5, dz * armLen * 0.5);
        arm.rotation.x = -Math.PI / 2;
        arm.rotation.z = Math.atan2(dx, dz);
        g.add(arm);
        const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.05, r * 0.1, armLen * 0.6, 6), tentacleDark);
        arm2.position.set(dx * (armLen * 0.5 + armLen * 0.3), h * 0.5, dz * (armLen * 0.5 + armLen * 0.3));
        arm2.rotation.x = -Math.PI / 2;
        arm2.rotation.z = Math.atan2(dx, dz);
        g.add(arm2);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(r * 0.15, 6, 6), tentacleDark);
        tip.position.set(dx * armLen * 1.05, h * 0.5, dz * armLen * 1.05);
        g.add(tip);
      }
    } else if (bossVariant === 2) {
      const slimeMat = new THREE.MeshStandardMaterial({ color: 0x22aa44, emissive: 0x0a330a, emissiveIntensity: 0.3, roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.75 });
      const blob = new THREE.Mesh(new THREE.BoxGeometry(r * 1.4, h * 0.9, r * 1.3), slimeMat);
      blob.position.y = h * 0.5;
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(r * 0.12, 6, 6), eyeMat);
      eyeL.position.set(-r * 0.25, h * 0.75, r * 0.35);
      const eyeR = eyeL.clone(); eyeR.position.x *= -1;
      g.add(blob, eyeL, eyeR);
    } else {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.95, h * 0.9, 12), coreMat);
      body.position.y = h * 0.5;
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(r * 0.55, 1), coreMat);
      head.position.y = h * 1.05;
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(r * 0.08, 6, 6), eyeMat);
      eyeL.position.set(-r * 0.18, h * 1.08, r * 0.38);
      const eyeR = eyeL.clone(); eyeR.position.x *= -1;
      g.add(body, head, eyeL, eyeR);
    }
  } else {
    // Normal/magic/rare/unique - distinct models per tier
    const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: tier === "unique" ? 0.45 : 0.25, roughness: 0.4, metalness: 0.1 });
    const darkLeg = new THREE.MeshStandardMaterial({ color: color * 0.7 & 0xffffff, roughness: 0.6 });

    if (tier === "normal" && normalBeastType && creatureCache[normalBeastType]) {
      const cached = creatureCache[normalBeastType].clone();
      const box = new THREE.Box3().setFromObject(cached);
      const size = new THREE.Vector3();
      box.getSize(size);
      const scale = (cfg.height * 0.95) / Math.max(size.y, 0.01);
      cached.scale.setScalar(scale);
      cached.position.y = cfg.height * 0.5;
      g.add(cached);
    } else if (tier === "normal") {
      if (normalBeastType === "wolf") {
        // Kurt: uzun ince gövde, sivri uzun burun, dik sivri kulaklar, tüylü kuyruk – köpek değil kurt oranı
        const wolfColor = 0x5c4a3a;
        const wolfMat = new THREE.MeshStandardMaterial({ color: wolfColor, emissive: 0x1a1510, emissiveIntensity: 0.2, roughness: 0.5, metalness: 0.05 });
        const wolfDark = new THREE.MeshStandardMaterial({ color: 0x3d3228, roughness: 0.6 });
        const r = cfg.radius * 1.05;
        const h = cfg.height * 1.02;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.38, r * 0.5, h * 0.72, 8), wolfMat);
        body.scale.set(1, 1.05, 1.55);
        body.position.y = h * 0.46;
        const chest = new THREE.Mesh(new THREE.SphereGeometry(r * 0.34, 8, 6), wolfMat);
        chest.position.set(0, h * 0.5, r * 0.22);
        const head = new THREE.Mesh(new THREE.SphereGeometry(r * 0.3, 10, 8), wolfMat);
        head.scale.set(1, 0.95, 1.25);
        head.position.set(0, h * 0.92, r * 0.5);
        const snout = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.07, r * 0.11, r * 0.52, 6), wolfDark);
        snout.position.set(0, h * 0.86, r * 0.82);
        snout.rotation.x = 0.12;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(r * 0.05, 5, 5), eyeMat);
        eyeL.position.set(-r * 0.12, h * 0.94, r * 0.58);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(r * 0.14, r * 0.035, r * 0.07), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        mouth.position.set(0, h * 0.84, r * 0.88);
        const earL = new THREE.Mesh(new THREE.ConeGeometry(r * 0.11, r * 0.38, 4), wolfDark);
        earL.position.set(-r * 0.24, h * 1.14, r * 0.38);
        earL.rotation.z = 0.35;
        earL.rotation.x = -0.25;
        const earR = earL.clone();
        earR.position.x *= -1;
        earR.rotation.z *= -0.35;
        const tail = new THREE.Mesh(new THREE.ConeGeometry(r * 0.09, r * 0.58, 5), wolfMat);
        tail.position.set(0, h * 0.38, -r * 0.72);
        tail.rotation.x = 0.45;
        const legFL = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.075, r * 0.1, h * 0.22, 6), wolfDark);
        legFL.position.set(-r * 0.24, h * 0.11, r * 0.28);
        const legFR = legFL.clone();
        legFR.position.x *= -1;
        const legBL = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.085, r * 0.105, h * 0.20, 6), wolfDark);
        legBL.position.set(-r * 0.22, h * 0.10, -r * 0.24);
        const legBR = legBL.clone();
        legBR.position.x *= -1;
        g.add(body, chest, head, snout, eyeL, eyeR, mouth, earL, earR, tail, legFL, legFR, legBL, legBR);
      } else if (normalBeastType === "bear") {
        // Ayı: tıknaz gövde, yuvarlak kulaklar, kısa burun, kalın bacaklar
        const bearColor = 0x4a3c2e;
        const bearMat = new THREE.MeshStandardMaterial({ color: bearColor, emissive: 0x151008, emissiveIntensity: 0.15, roughness: 0.6, metalness: 0.02 });
        const bearDark = new THREE.MeshStandardMaterial({ color: 0x2d241a, roughness: 0.65 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.55, 10, 8), bearMat);
        body.scale.set(1.15, 1.1, 1.1);
        body.position.y = cfg.height * 0.5;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.38, 10, 8), bearMat);
        head.position.set(0, cfg.height * 0.98, cfg.radius * 0.32);
        const snout = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.14, 6, 6), bearDark);
        snout.position.set(0, cfg.height * 0.92, cfg.radius * 0.5);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.06, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.14, cfg.height * 1.02, cfg.radius * 0.38);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.18, cfg.radius * 0.05, cfg.radius * 0.06), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        mouth.position.set(0, cfg.height * 0.9, cfg.radius * 0.48);
        const earL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.12, 6, 6), bearDark);
        earL.position.set(-cfg.radius * 0.3, cfg.height * 1.2, 0);
        const earR = earL.clone();
        earR.position.x *= -1;
        const legFL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.14, cfg.radius * 0.18, cfg.height * 0.35, 6), bearDark);
        legFL.position.set(-cfg.radius * 0.35, cfg.height * 0.16, cfg.radius * 0.28);
        const legFR = legFL.clone();
        legFR.position.x *= -1;
        const legBL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.15, cfg.radius * 0.2, cfg.height * 0.33, 6), bearDark);
        legBL.position.set(-cfg.radius * 0.32, cfg.height * 0.17, -cfg.radius * 0.25);
        const legBR = legBL.clone();
        legBR.position.x *= -1;
        g.add(body, head, snout, eyeL, eyeR, mouth, earL, earR, legFL, legFR, legBL, legBR);
      } else if (normalBeastType === "boar") {
        // Yaban domuzu: tıknaz gövde, kısa burun, dişler, küçük kulaklar
        const boarColor = 0x3d3228;
        const boarMat = new THREE.MeshStandardMaterial({ color: boarColor, emissive: 0x0f0c08, emissiveIntensity: 0.12, roughness: 0.65, metalness: 0.02 });
        const boarDark = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.7 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.5, 10, 8), boarMat);
        body.scale.set(1.2, 1.05, 1.15);
        body.position.y = cfg.height * 0.48;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.35, 10, 8), boarMat);
        head.position.set(0, cfg.height * 0.9, cfg.radius * 0.38);
        const snout = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.12, cfg.radius * 0.18, cfg.radius * 0.35, 6), boarDark);
        snout.position.set(0, cfg.height * 0.88, cfg.radius * 0.55);
        snout.rotation.x = 0.1;
        const tuskL = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.04, cfg.radius * 0.2, 4), new THREE.MeshStandardMaterial({ color: 0xeeddcc, roughness: 0.5 }));
        tuskL.position.set(-cfg.radius * 0.12, cfg.height * 0.82, cfg.radius * 0.58);
        tuskL.rotation.x = 0.3;
        const tuskR = tuskL.clone();
        tuskR.position.x *= -1;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.055, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.13, cfg.height * 0.94, cfg.radius * 0.4);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.16, cfg.radius * 0.04, cfg.radius * 0.06), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        mouth.position.set(0, cfg.height * 0.86, cfg.radius * 0.52);
        const earL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.1, 6, 6), boarDark);
        earL.position.set(-cfg.radius * 0.28, cfg.height * 1.0, 0);
        const earR = earL.clone();
        earR.position.x *= -1;
        const legFL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.12, cfg.radius * 0.16, cfg.height * 0.32, 6), boarDark);
        legFL.position.set(-cfg.radius * 0.3, cfg.height * 0.15, cfg.radius * 0.3);
        const legFR = legFL.clone();
        legFR.position.x *= -1;
        const legBL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.13, cfg.radius * 0.17, cfg.height * 0.3, 6), boarDark);
        legBL.position.set(-cfg.radius * 0.28, cfg.height * 0.16, -cfg.radius * 0.22);
        const legBR = legBL.clone();
        legBR.position.x *= -1;
        g.add(body, head, snout, tuskL, tuskR, eyeL, eyeR, mouth, earL, earR, legFL, legFR, legBL, legBR);
      } else if (normalBeastType === "fox") {
        // Tilki: ince gövde, sivri burun, büyük kuyruk, dik kulaklar
        const foxColor = 0xc45c2a;
        const foxMat = new THREE.MeshStandardMaterial({ color: foxColor, emissive: 0x2a1008, emissiveIntensity: 0.18, roughness: 0.5, metalness: 0.03 });
        const foxWhite = new THREE.MeshStandardMaterial({ color: 0xe8d8c8, roughness: 0.55 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.38, cfg.radius * 0.48, cfg.height * 0.65, 8), foxMat);
        body.scale.set(1, 1.05, 1.35);
        body.position.y = cfg.height * 0.42;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.3, 10, 8), foxMat);
        head.scale.set(1, 1, 1.15);
        head.position.set(0, cfg.height * 0.88, cfg.radius * 0.42);
        const snout = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.06, cfg.radius * 0.1, cfg.radius * 0.38, 6), foxWhite);
        snout.position.set(0, cfg.height * 0.84, cfg.radius * 0.62);
        snout.rotation.x = 0.12;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.05, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.1, cfg.height * 0.9, cfg.radius * 0.48);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.12, cfg.radius * 0.03, cfg.radius * 0.07), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        mouth.position.set(0, cfg.height * 0.82, cfg.radius * 0.65);
        const earL = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.09, cfg.radius * 0.3, 4), foxMat);
        earL.position.set(-cfg.radius * 0.2, cfg.height * 1.08, cfg.radius * 0.35);
        earL.rotation.z = 0.35;
        earL.rotation.x = -0.15;
        const earR = earL.clone();
        earR.position.x *= -1;
        earR.rotation.z *= -0.35;
        const tail = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.22, 8, 6), foxMat);
        tail.scale.set(1, 1, 1.8);
        tail.position.set(0, cfg.height * 0.45, -cfg.radius * 0.65);
        tail.rotation.x = 0.25;
        const legFL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.065, cfg.radius * 0.09, cfg.height * 0.20, 6), foxWhite);
        legFL.position.set(-cfg.radius * 0.2, cfg.height * 0.10, cfg.radius * 0.22);
        const legFR = legFL.clone();
        legFR.position.x *= -1;
        const legBL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.07, cfg.radius * 0.09, cfg.height * 0.18, 6), foxWhite);
        legBL.position.set(-cfg.radius * 0.18, cfg.height * 0.09, -cfg.radius * 0.18);
        const legBR = legBL.clone();
        legBR.position.x *= -1;
        g.add(body, head, snout, eyeL, eyeR, mouth, earL, earR, tail, legFL, legFR, legBL, legBR);
      } else if (normalBeastType === "ghost") {
        // Hayalet: beyaz yarı saydam, bacaksız, süzülen
        const ghostMat = new THREE.MeshStandardMaterial({ color: 0xe8e8f0, emissive: 0x8899aa, emissiveIntensity: 0.35, roughness: 0.8, metalness: 0, transparent: true, opacity: 0.75 });
        const ghostEye = new THREE.MeshBasicMaterial({ color: 0x88ddff });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.5, 10, 8), ghostMat);
        body.scale.set(1, 1.25, 0.9);
        body.position.y = cfg.height * 0.55;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.38, 10, 8), ghostMat);
        head.position.y = cfg.height * 1.02;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.08, 6, 6), ghostEye);
        eyeL.position.set(-cfg.radius * 0.14, cfg.height * 1.04, cfg.radius * 0.3);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.2, cfg.radius * 0.04, cfg.radius * 0.08), new THREE.MeshBasicMaterial({ color: 0x4466aa, transparent: true, opacity: 0.8 }));
        mouth.position.set(0, cfg.height * 0.94, cfg.radius * 0.32);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.35, cfg.height * 0.6, 6), ghostMat);
        tail.position.set(0, cfg.height * 0.2, -cfg.radius * 0.4);
        tail.rotation.x = 0.5;
        g.add(body, head, eyeL, eyeR, mouth, tail);
      } else if (normalBeastType === "skeleton") {
        // İskelet: kafatası (kutu), kaburga kemikleri, omurga, kol ve bacak kemikleri
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xe8e4d8, emissive: 0x1a1812, roughness: 0.65, metalness: 0.02 });
        const skull = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.5, cfg.radius * 0.42, cfg.radius * 0.38, 1, 1, 1), boneMat);
        skull.position.y = cfg.height * 1.02;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.06, 4, 4), new THREE.MeshBasicMaterial({ color: 0x0a0a0a }));
        eyeL.position.set(-cfg.radius * 0.16, cfg.height * 1.04, cfg.radius * 0.2);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.28, cfg.radius * 0.06, cfg.radius * 0.18), boneMat);
        jaw.position.set(0, cfg.height * 0.88, cfg.radius * 0.22);
        const spine = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.06, cfg.radius * 0.08, cfg.height * 0.45, 5), boneMat);
        spine.position.set(0, cfg.height * 0.38, -cfg.radius * 0.15);
        spine.rotation.x = 0.15;
        const rib1 = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.04, cfg.radius * 0.04, cfg.radius * 0.5, 4), boneMat);
        rib1.position.set(0, cfg.height * 0.62, 0);
        rib1.rotation.z = Math.PI / 2;
        const rib2 = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.035, cfg.radius * 0.035, cfg.radius * 0.42, 4), boneMat);
        rib2.position.set(0, cfg.height * 0.52, 0);
        rib2.rotation.z = Math.PI / 2;
        const rib3 = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.03, cfg.radius * 0.03, cfg.radius * 0.38, 4), boneMat);
        rib3.position.set(0, cfg.height * 0.42, 0);
        rib3.rotation.z = Math.PI / 2;
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.05, cfg.radius * 0.06, cfg.height * 0.32, 5), boneMat);
        armL.position.set(-cfg.radius * 0.42, cfg.height * 0.58, 0);
        armL.rotation.z = 0.4;
        const armR = armL.clone();
        armR.position.x *= -1;
        armR.rotation.z *= -1;
        const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.04, cfg.radius * 0.05, cfg.height * 0.22, 5), boneMat);
        forearmL.position.set(-cfg.radius * 0.52, cfg.height * 0.42, cfg.radius * 0.1);
        forearmL.rotation.z = 0.5;
        const forearmR = forearmL.clone();
        forearmR.position.x *= -1;
        forearmR.rotation.z *= -1;
        const legFL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.06, cfg.radius * 0.08, cfg.height * 0.36, 5), boneMat);
        legFL.position.set(-cfg.radius * 0.2, cfg.height * 0.12, cfg.radius * 0.18);
        const legFR = legFL.clone();
        legFR.position.x *= -1;
        const legBL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.055, cfg.radius * 0.07, cfg.height * 0.34, 5), boneMat);
        legBL.position.set(-cfg.radius * 0.18, cfg.height * 0.13, -cfg.radius * 0.18);
        const legBR = legBL.clone();
        legBR.position.x *= -1;
        g.add(skull, eyeL, eyeR, jaw, spine, rib1, rib2, rib3, armL, armR, forearmL, forearmR, legFL, legFR, legBL, legBR);
      } else if (normalBeastType === "beetle") {
        const beetleMat = new THREE.MeshStandardMaterial({ color: 0x2a2218, emissive: 0x0a0805, roughness: 0.5, metalness: 0.15 });
        const beetleShell = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.5, 6, 6), beetleMat);
        beetleShell.scale.set(1.2, 0.9, 1.4);
        beetleShell.position.y = cfg.height * 0.5;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.22, 6, 5), beetleMat);
        head.position.set(0, cfg.height * 0.88, cfg.radius * 0.45);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.05, 4, 4), eyeMat);
        eyeL.position.set(-cfg.radius * 0.1, cfg.height * 0.9, cfg.radius * 0.52);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const hornL = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.06, cfg.radius * 0.2, 4), beetleMat);
        hornL.position.set(-cfg.radius * 0.18, cfg.height * 0.95, cfg.radius * 0.4);
        hornL.rotation.z = 0.3;
        const hornR = hornL.clone();
        hornR.position.x *= -1;
        hornR.rotation.z *= -1;
        const legFL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.04, cfg.radius * 0.05, cfg.height * 0.28, 4), beetleMat);
        legFL.position.set(-cfg.radius * 0.35, cfg.height * 0.18, cfg.radius * 0.25);
        legFL.rotation.z = 0.25;
        const legFR = legFL.clone();
        legFR.position.x *= -1;
        legFR.rotation.z *= -1;
        const legBL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.04, cfg.radius * 0.05, cfg.height * 0.26, 4), beetleMat);
        legBL.position.set(-cfg.radius * 0.32, cfg.height * 0.2, -cfg.radius * 0.22);
        legBL.rotation.z = -0.2;
        const legBR = legBL.clone();
        legBR.position.x *= -1;
        legBR.rotation.z *= 0.2;
        g.add(beetleShell, head, eyeL, eyeR, hornL, hornR, legFL, legFR, legBL, legBR);
      } else if (normalBeastType === "crow") {
        const crowMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x050505, roughness: 0.8, metalness: 0.05 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.38, 6, 6), crowMat);
        body.scale.set(1.1, 1.2, 1.3);
        body.position.y = cfg.height * 0.52;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.2, 6, 5), crowMat);
        head.position.set(0, cfg.height * 0.88, cfg.radius * 0.35);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.04, cfg.radius * 0.18, 4), new THREE.MeshStandardMaterial({ color: 0x2a2218 }));
        beak.position.set(0, cfg.height * 0.86, cfg.radius * 0.48);
        beak.rotation.x = 0.15;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.04, 4, 4), eyeMat);
        eyeL.position.set(-cfg.radius * 0.08, cfg.height * 0.9, cfg.radius * 0.4);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.85, side: THREE.DoubleSide });
        const wingL = new THREE.Mesh(new THREE.PlaneGeometry(cfg.radius * 0.7, cfg.radius * 0.35), wingMat);
        wingL.position.set(-cfg.radius * 0.4, cfg.height * 0.58, -cfg.radius * 0.05);
        wingL.rotation.y = 0.4;
        wingL.rotation.z = 0.2;
        const wingR = wingL.clone();
        wingR.position.x *= -1;
        wingR.rotation.y *= -1;
        wingR.rotation.z *= -1;
        g.add(body, head, beak, eyeL, eyeR, wingL, wingR);
      } else if (normalBeastType === "wraith") {
        const wraithMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, emissive: 0x1a2535, emissiveIntensity: 0.35, transparent: true, opacity: 0.88, roughness: 0.7, metalness: 0.02 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.35, 6, 6), wraithMat);
        body.scale.set(0.9, 1.3, 0.8);
        body.position.y = cfg.height * 0.55;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.28, 6, 5), wraithMat);
        head.position.set(0, cfg.height * 0.98, cfg.radius * 0.25);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.05, 4, 4), new THREE.MeshBasicMaterial({ color: 0x88aacc }));
        eyeL.position.set(-cfg.radius * 0.12, cfg.height * 1.0, cfg.radius * 0.3);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const tailMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, emissive: 0x152030, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
        const tail = new THREE.Mesh(new THREE.PlaneGeometry(cfg.radius * 0.5, cfg.height * 0.5), tailMat);
        tail.position.set(0, cfg.height * 0.35, -cfg.radius * 0.35);
        tail.rotation.x = 0.35;
        g.add(body, head, eyeL, eyeR, tail);
      } else if (normalBeastType === "snake") {
        const snakeMat = new THREE.MeshStandardMaterial({ color: 0x2a6a2a, emissive: 0x0d2a0d, emissiveIntensity: 0.15, roughness: 0.6, metalness: 0.05 });
        const snakeDark = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.65 });
        const r = cfg.radius;
        const head = new THREE.Mesh(new THREE.SphereGeometry(r * 0.35, 6, 6), snakeMat);
        head.scale.set(1, 0.9, 1.2);
        head.position.set(0, r * 0.28, r * 0.5);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(r * 0.05, 4, 4), eyeMat);
        eyeL.position.set(-r * 0.12, r * 0.32, r * 0.56);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const tongue = new THREE.Mesh(new THREE.ConeGeometry(r * 0.03, r * 0.2, 4), new THREE.MeshBasicMaterial({ color: 0xcc2244 }));
        tongue.position.set(0, r * 0.26, r * 0.68);
        tongue.rotation.x = -0.2;
        const body1 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.28, r * 0.32, cfg.height * 0.35, 6), snakeMat);
        body1.rotation.x = Math.PI / 2;
        body1.position.set(0, r * 0.22, r * 0.12);
        const body2 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.24, r * 0.28, cfg.height * 0.3, 6), snakeDark);
        body2.rotation.x = Math.PI / 2;
        body2.position.set(0, r * 0.18, -r * 0.28);
        const body3 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.24, cfg.height * 0.28, 6), snakeDark);
        body3.rotation.x = Math.PI / 2;
        body3.position.set(0, r * 0.14, -r * 0.58);
        g.add(head, eyeL, eyeR, tongue, body1, body2, body3);
      } else if (normalBeastType === "cactus") {
        const cactusMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a, emissive: 0x0d2a0d, emissiveIntensity: 0.08, roughness: 0.9 });
        const spineMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, roughness: 0.95 });
        const main = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.4, cfg.radius * 0.5, cfg.height * 0.7, 6), cactusMat);
        main.position.y = cfg.height * 0.5;
        g.add(main);
        for (let si = 0; si < 6; si++) {
          const spine = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.06, cfg.radius * 0.2, 4), spineMat);
          spine.position.set(Math.cos(si * Math.PI / 3) * cfg.radius * 0.45, cfg.height * (0.4 + (si % 2) * 0.35), Math.sin(si * Math.PI / 3) * cfg.radius * 0.45);
          spine.rotation.z = (si % 2 === 0 ? 0.3 : -0.3);
          g.add(spine);
        }
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.3, 6, 5), cactusMat);
        head.position.y = cfg.height * 0.88;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.05, 4, 4), eyeMat);
        eyeL.position.set(-cfg.radius * 0.1, cfg.height * 0.9, cfg.radius * 0.28);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        g.add(head, eyeL, eyeR);
      } else if (normalBeastType === "bat") {
        // Yarasa: koyu gövde, kanatlar, küçük kafa, kulaklar
        const batMat = new THREE.MeshStandardMaterial({ color: 0x2a2530, emissive: 0x0a0810, emissiveIntensity: 0.2, roughness: 0.7, metalness: 0.02 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.4, 10, 8), batMat);
        body.scale.set(1, 1.1, 1.2);
        body.position.y = cfg.height * 0.5;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.28, 10, 8), batMat);
        head.position.set(0, cfg.height * 0.92, cfg.radius * 0.35);
        const earL = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.1, cfg.radius * 0.25, 4), batMat);
        earL.position.set(-cfg.radius * 0.2, cfg.height * 1.08, cfg.radius * 0.2);
        earL.rotation.z = 0.4;
        const earR = earL.clone();
        earR.position.x *= -1;
        earR.rotation.z *= -0.4;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.05, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.1, cfg.height * 0.94, cfg.radius * 0.4);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.12, cfg.radius * 0.03, cfg.radius * 0.06), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        mouth.position.set(0, cfg.height * 0.88, cfg.radius * 0.42);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, emissive: 0x080608, roughness: 0.8, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
        const wingL = new THREE.Mesh(new THREE.PlaneGeometry(cfg.radius * 1.1, cfg.radius * 0.6), wingMat);
        wingL.position.set(-cfg.radius * 0.55, cfg.height * 0.6, -cfg.radius * 0.1);
        wingL.rotation.y = 0.5;
        wingL.rotation.z = 0.15;
        const wingR = wingL.clone();
        wingR.position.x *= -1;
        wingR.rotation.y *= -0.5;
        wingR.rotation.z *= -0.15;
        g.add(body, head, earL, earR, eyeL, eyeR, mouth, wingL, wingR);
      } else if (normalBeastType === "vampire") {
        const vampMat = new THREE.MeshStandardMaterial({ color: 0xc8a8b8, emissive: 0x1a0a12, emissiveIntensity: 0.15, roughness: 0.6, metalness: 0.02 });
        const capeMat = new THREE.MeshStandardMaterial({ color: 0x2a0a1a, emissive: 0x180808, roughness: 0.8, metalness: 0 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.35, cfg.radius * 0.45, cfg.height * 0.6, 8), vampMat);
        body.position.y = cfg.height * 0.5;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.32, 10, 8), vampMat);
        head.position.y = cfg.height * 0.98;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.05, 5, 5), new THREE.MeshBasicMaterial({ color: 0xaa2222 }));
        eyeL.position.set(-cfg.radius * 0.12, cfg.height * 1.02, cfg.radius * 0.28);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const fangL = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.04, cfg.radius * 0.12, 4), vampMat);
        fangL.position.set(-cfg.radius * 0.08, cfg.height * 0.88, cfg.radius * 0.38);
        fangL.rotation.x = 0.4;
        const fangR = fangL.clone();
        fangR.position.x *= -1;
        const cape = new THREE.Mesh(new THREE.PlaneGeometry(cfg.radius * 1.4, cfg.height * 0.9), capeMat);
        cape.position.set(0, cfg.height * 0.5, -cfg.radius * 0.4);
        cape.rotation.x = 0.1;
        g.add(body, head, eyeL, eyeR, fangL, fangR, cape);
      } else if (normalBeastType === "purpleShadow") {
        const purpMat = new THREE.MeshStandardMaterial({ color: 0x1a0a2a, emissive: 0x440066, emissiveIntensity: 0.35, roughness: 0.9, metalness: 0, transparent: true, opacity: 0.88 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.35, cfg.radius * 0.5, cfg.height * 0.7, 8), purpMat);
        body.position.y = cfg.height * 0.5;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.35, 8, 8), purpMat);
        head.position.y = cfg.height * 0.98;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.06, 4, 4), new THREE.MeshBasicMaterial({ color: 0xaa66ff }));
        eyeL.position.set(-cfg.radius * 0.12, cfg.height * 1.02, cfg.radius * 0.3);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        g.add(body, head, eyeL, eyeR);
      } else if (normalBeastType === "purpleSkeleton") {
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xb8a0d0, emissive: 0x2a1840, emissiveIntensity: 0.2, roughness: 0.65, metalness: 0.02 });
        const skull = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.5, cfg.radius * 0.42, cfg.radius * 0.38, 1, 1, 1), boneMat);
        skull.position.y = cfg.height * 1.02;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.06, 4, 4), new THREE.MeshBasicMaterial({ color: 0x6611aa }));
        eyeL.position.set(-cfg.radius * 0.16, cfg.height * 1.04, cfg.radius * 0.2);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const spine = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.06, cfg.radius * 0.08, cfg.height * 0.45, 5), boneMat);
        spine.position.set(0, cfg.height * 0.38, -cfg.radius * 0.15);
        spine.rotation.x = 0.15;
        const rib1 = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.04, cfg.radius * 0.04, cfg.radius * 0.5, 4), boneMat);
        rib1.position.set(0, cfg.height * 0.62, 0);
        rib1.rotation.z = Math.PI / 2;
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.05, cfg.radius * 0.06, cfg.height * 0.32, 5), boneMat);
        armL.position.set(-cfg.radius * 0.42, cfg.height * 0.58, 0);
        armL.rotation.z = 0.4;
        const armR = armL.clone();
        armR.position.x *= -1;
        armR.rotation.z *= -1;
        const legFL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.06, cfg.radius * 0.08, cfg.height * 0.36, 5), boneMat);
        legFL.position.set(-cfg.radius * 0.2, cfg.height * 0.12, cfg.radius * 0.18);
        const legFR = legFL.clone();
        legFR.position.x *= -1;
        g.add(skull, eyeL, eyeR, spine, rib1, armL, armR, legFL, legFR);
      } else if (normalBeastType === "purpleSlime") {
        const slimeMat = new THREE.MeshStandardMaterial({ color: 0x6633aa, emissive: 0x220844, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.02, transparent: true, opacity: 0.75 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 1.1, cfg.height * 0.7, cfg.radius * 1.0), slimeMat);
        body.position.y = cfg.height * 0.45;
        body.scale.set(1.05, 1, 1.05);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xaa88ff }));
        eyeL.position.set(-cfg.radius * 0.2, cfg.height * 0.72, cfg.radius * 0.35);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        g.add(body, eyeL, eyeR);
      } else if (normalBeastType === "redBat") {
        const batMat = new THREE.MeshStandardMaterial({ color: 0x6a2020, emissive: 0x330808, emissiveIntensity: 0.35, roughness: 0.7, metalness: 0.02 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.4, 10, 8), batMat);
        body.scale.set(1, 1.1, 1.2);
        body.position.y = cfg.height * 0.5;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.28, 10, 8), batMat);
        head.position.set(0, cfg.height * 0.92, cfg.radius * 0.35);
        const earL = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.1, cfg.radius * 0.25, 4), batMat);
        earL.position.set(-cfg.radius * 0.2, cfg.height * 1.08, cfg.radius * 0.2);
        earL.rotation.z = 0.4;
        const earR = earL.clone();
        earR.position.x *= -1;
        earR.rotation.z *= -0.4;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.05, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.1, cfg.height * 0.94, cfg.radius * 0.4);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x4a1818, emissive: 0x220606, roughness: 0.8, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
        const wingL = new THREE.Mesh(new THREE.PlaneGeometry(cfg.radius * 1.1, cfg.radius * 0.6), wingMat);
        wingL.position.set(-cfg.radius * 0.55, cfg.height * 0.6, -cfg.radius * 0.1);
        wingL.rotation.y = 0.5;
        wingL.rotation.z = 0.15;
        const wingR = wingL.clone();
        wingR.position.x *= -1;
        wingR.rotation.y *= -0.5;
        wingR.rotation.z *= -0.15;
        g.add(body, head, earL, earR, eyeL, eyeR, wingL, wingR);
      } else if (normalBeastType === "polarBear") {
        const polarMat = new THREE.MeshStandardMaterial({ color: 0xe8e8f0, emissive: 0x404060, emissiveIntensity: 0.12, roughness: 0.6, metalness: 0.02 });
        const polarDark = new THREE.MeshStandardMaterial({ color: 0x606070, roughness: 0.65 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.55, 10, 8), polarMat);
        body.scale.set(1.15, 1.1, 1.1);
        body.position.y = cfg.height * 0.5;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.38, 10, 8), polarMat);
        head.position.set(0, cfg.height * 0.98, cfg.radius * 0.32);
        const snout = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.14, 6, 6), polarDark);
        snout.position.set(0, cfg.height * 0.92, cfg.radius * 0.5);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.06, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.14, cfg.height * 1.02, cfg.radius * 0.38);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.18, cfg.radius * 0.05, cfg.radius * 0.06), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        mouth.position.set(0, cfg.height * 0.9, cfg.radius * 0.48);
        const earL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.12, 6, 6), polarDark);
        earL.position.set(-cfg.radius * 0.3, cfg.height * 1.2, 0);
        const earR = earL.clone();
        earR.position.x *= -1;
        const legFL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.14, cfg.radius * 0.18, cfg.height * 0.35, 6), polarDark);
        legFL.position.set(-cfg.radius * 0.35, cfg.height * 0.16, cfg.radius * 0.28);
        const legFR = legFL.clone();
        legFR.position.x *= -1;
        const legBL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.15, cfg.radius * 0.2, cfg.height * 0.33, 6), polarDark);
        legBL.position.set(-cfg.radius * 0.32, cfg.height * 0.17, -cfg.radius * 0.25);
        const legBR = legBL.clone();
        legBR.position.x *= -1;
        g.add(body, head, snout, eyeL, eyeR, mouth, earL, earR, legFL, legFR, legBL, legBR);
      } else if (normalBeastType === "scorpion") {
        const scorpMat = new THREE.MeshStandardMaterial({ color: 0x6a4a3a, emissive: 0x1a1008, emissiveIntensity: 0.15, roughness: 0.65, metalness: 0.05 });
        const scorpDark = new THREE.MeshStandardMaterial({ color: 0x3d2a20, roughness: 0.7 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.45, 10, 8), scorpMat);
        body.scale.set(1.2, 1, 1.4);
        body.position.y = cfg.height * 0.45;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.28, 8, 6), scorpMat);
        head.position.set(0, cfg.height * 0.88, cfg.radius * 0.5);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.055, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.12, cfg.height * 0.9, cfg.radius * 0.55);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const clawL = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.35, cfg.radius * 0.12, cfg.radius * 0.2), scorpDark);
        clawL.position.set(-cfg.radius * 0.5, cfg.height * 0.85, cfg.radius * 0.6);
        clawL.rotation.z = 0.3;
        const clawR = clawL.clone();
        clawR.position.x *= -1;
        clawR.rotation.z *= -0.3;
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.06, cfg.radius * 0.12, cfg.height * 0.5, 6), scorpDark);
        tail.position.set(0, cfg.height * 0.35, -cfg.radius * 0.55);
        tail.rotation.x = 0.6;
        const stinger = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.08, cfg.radius * 0.25, 5), new THREE.MeshStandardMaterial({ color: 0x2a1515, emissive: 0x330808, emissiveIntensity: 0.3 }));
        stinger.position.set(0, cfg.height * 0.15, -cfg.radius * 0.85);
        stinger.rotation.x = 0.4;
        tail.add(stinger);
        const legFL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.05, cfg.radius * 0.07, cfg.height * 0.28, 5), scorpDark);
        legFL.position.set(-cfg.radius * 0.3, cfg.height * 0.12, cfg.radius * 0.25);
        const legFR = legFL.clone();
        legFR.position.x *= -1;
        const legBL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.05, cfg.radius * 0.07, cfg.height * 0.26, 5), scorpDark);
        legBL.position.set(-cfg.radius * 0.28, cfg.height * 0.13, -cfg.radius * 0.2);
        const legBR = legBL.clone();
        legBR.position.x *= -1;
        g.add(body, head, eyeL, eyeR, clawL, clawR, tail, legFL, legFR, legBL, legBR);
      } else if (normalBeastType === "spider") {
        const spiderMat = new THREE.MeshStandardMaterial({ color: 0x2a1a12, emissive: 0x0a0502, emissiveIntensity: 0.2, roughness: 0.75, metalness: 0.02 });
        const abdomen = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.55, 12, 10), spiderMat);
        abdomen.scale.set(1.15, 1.1, 1.25);
        abdomen.position.set(0, cfg.height * 0.42, -cfg.radius * 0.15);
        const thorax = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.38, 10, 8), spiderMat);
        thorax.position.y = cfg.height * 0.58;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.28, 8, 6), spiderMat);
        head.position.set(0, cfg.height * 0.92, cfg.radius * 0.38);
        const eyeMat2 = new THREE.MeshBasicMaterial({ color: 0x222200 });
        for (let ei = 0; ei < 8; ei++) {
          const row = ei < 4 ? 0 : 1;
          const col = ei % 4;
          const ex = (col % 2 === 0 ? -1 : 1) * cfg.radius * (0.08 + col * 0.04);
          const ez = cfg.radius * (0.32 + row * 0.06);
          const eye = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.035, 4, 4), eyeMat2);
          eye.position.set(ex, cfg.height * 0.94 + row * 0.02, ez);
          g.add(eye);
        }
        const legLen = cfg.radius * 0.55;
        for (let li = 0; li < 8; li++) {
          const side = li % 2 === 0 ? -1 : 1;
          const group = (li / 2) | 0;
          const angle = (group / 4) * Math.PI * 0.5 - Math.PI * 0.25;
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.035, cfg.radius * 0.045, legLen, 5), spiderMat);
          const rx = side * cfg.radius * (0.32 + group * 0.08);
          const rz = (group < 2 ? 1 : -1) * cfg.radius * (0.22 + (group % 2) * 0.12);
          leg.position.set(rx, cfg.height * (0.38 - group * 0.04), rz);
          leg.rotation.z = side * (0.5 + group * 0.08);
          leg.rotation.x = (group < 2 ? -0.25 : 0.2) + group * 0.05;
          g.add(leg);
        }
        g.add(abdomen, thorax, head);
      } else if (normalBeastType === "void") {
        const voidMat = new THREE.MeshStandardMaterial({ color: 0x1a0a2a, emissive: 0x440088, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.9 });
        const voidEye = new THREE.MeshBasicMaterial({ color: 0xaa44ff });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.5, 10, 8), voidMat);
        body.scale.set(1.1, 1.2, 0.95);
        body.position.y = cfg.height * 0.55;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.35, 10, 8), voidMat);
        head.position.y = cfg.height * 1.0;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.08, 6, 6), voidEye);
        eyeL.position.set(-cfg.radius * 0.14, cfg.height * 1.04, cfg.radius * 0.32);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const tendrilL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.04, cfg.radius * 0.08, cfg.radius * 0.6, 5), voidMat);
        tendrilL.position.set(-cfg.radius * 0.4, cfg.height * 0.5, -cfg.radius * 0.35);
        tendrilL.rotation.x = 0.4;
        const tendrilR = tendrilL.clone();
        tendrilR.position.x *= -1;
        const tendrilB = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.05, cfg.radius * 0.1, cfg.radius * 0.5, 5), voidMat);
        tendrilB.position.set(0, cfg.height * 0.25, -cfg.radius * 0.5);
        tendrilB.rotation.x = 0.5;
        g.add(body, head, eyeL, eyeR, tendrilL, tendrilR, tendrilB);
      } else if (normalBeastType === "horror") {
        const horrorMat = new THREE.MeshStandardMaterial({ color: 0x0d0a12, emissive: 0x330022, emissiveIntensity: 0.4, roughness: 0.8, metalness: 0.05 });
        const horrorEye = new THREE.MeshBasicMaterial({ color: 0xff2244 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.52, 10, 8), horrorMat);
        body.scale.set(1.15, 1.15, 1.05);
        body.position.y = cfg.height * 0.52;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.38, 10, 8), horrorMat);
        head.position.y = cfg.height * 1.02;
        for (let ei = 0; ei < 3; ei++) {
          const ex = (ei === 0 ? 0 : (ei === 1 ? -1 : 1)) * cfg.radius * 0.22;
          const ey = cfg.height * (1.02 + (ei === 0 ? 0.04 : 0));
          const ez = cfg.radius * 0.38;
          const eye = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.07, 6, 6), horrorEye);
          eye.position.set(ex, ey, ez);
          g.add(eye);
        }
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.35, cfg.radius * 0.08, cfg.radius * 0.15), new THREE.MeshBasicMaterial({ color: 0x220011 }));
        mouth.position.set(0, cfg.height * 0.88, cfg.radius * 0.48);
        const fangL = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.05, cfg.radius * 0.2, 4), new THREE.MeshStandardMaterial({ color: 0xeeddcc }));
        fangL.position.set(-cfg.radius * 0.12, cfg.height * 0.82, cfg.radius * 0.55);
        fangL.rotation.x = 0.4;
        const fangR = fangL.clone();
        fangR.position.x *= -1;
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.1, cfg.radius * 0.14, cfg.height * 0.32, 6), horrorMat);
        legL.position.set(-cfg.radius * 0.25, cfg.height * 0.14, 0);
        const legR = legL.clone();
        legR.position.x *= -1;
        g.add(body, head, mouth, fangL, fangR, legL, legR);
      } else if (normalBeastType === "breach") {
        const breachMat = new THREE.MeshStandardMaterial({ color: 0x0a0812, emissive: 0x220033, emissiveIntensity: 0.5, roughness: 0.6, metalness: 0.1 });
        const breachDark = new THREE.MeshStandardMaterial({ color: 0x080510, emissive: 0x180028, emissiveIntensity: 0.4, roughness: 0.7 });
        const breachEye = new THREE.MeshBasicMaterial({ color: 0xaa3366 });
        const r = cfg.radius;
        const h = cfg.height;
        const torso = new THREE.Mesh(new THREE.BoxGeometry(r * 0.7, h * 0.5, r * 0.5), breachMat);
        torso.position.y = h * 0.5;
        torso.scale.set(1.15, 1, 1.1);
        const shoulders = new THREE.Mesh(new THREE.BoxGeometry(r * 0.9, h * 0.2, r * 0.45), breachDark);
        shoulders.position.y = h * 0.78;
        const head = new THREE.Mesh(new THREE.BoxGeometry(r * 0.45, r * 0.45, r * 0.4), breachMat);
        head.position.y = h * 1.02;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(r * 0.08, 5, 5), breachEye);
        eyeL.position.set(-r * 0.14, h * 1.04, r * 0.22);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x0d0a18, emissive: 0x1a1030, emissiveIntensity: 0.35, roughness: 0.8, side: THREE.DoubleSide });
        const wingL = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.4, h * 0.9), wingMat);
        wingL.position.set(-r * 0.6, h * 0.65, -r * 0.15);
        wingL.rotation.y = 0.4;
        wingL.rotation.z = 0.2;
        const wingR = wingL.clone();
        wingR.position.x *= -wingL.position.x;
        wingR.rotation.y *= -1;
        wingR.rotation.z *= -1;
        const legL = new THREE.Mesh(new THREE.BoxGeometry(r * 0.22, h * 0.38, r * 0.2), breachDark);
        legL.position.set(-r * 0.18, h * 0.16, r * 0.12);
        const legR = legL.clone();
        legR.position.x *= -1;
        g.add(torso, shoulders, head, eyeL, eyeR, wingL, wingR, legL, legR);
      } else if (normalBeastType === "slime") {
        const slimeMat = new THREE.MeshStandardMaterial({ color: 0x22aa44, emissive: 0x0a330a, emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.02, transparent: true, opacity: 0.7 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 1.1, cfg.height * 0.7, cfg.radius * 1.0), slimeMat);
        body.position.y = cfg.height * 0.38;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.1, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.22, cfg.height * 0.55, cfg.radius * 0.28);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        g.add(body, eyeL, eyeR);
      } else if (normalBeastType === "snail") {
        const snailBodyMat = new THREE.MeshStandardMaterial({ color: 0xc4a574, emissive: 0x2a2010, emissiveIntensity: 0.2, roughness: 0.7 });
        const shellMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, emissive: 0x1a1510, emissiveIntensity: 0.15, roughness: 0.6 });
        const r = cfg.radius;
        const h = cfg.height;
        const body = new THREE.Mesh(new THREE.SphereGeometry(r * 0.5, 10, 8), snailBodyMat);
        body.scale.set(1.2, 0.9, 1.1);
        body.position.y = h * 0.45;
        const shell = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.7), shellMat);
        shell.scale.set(1, 1.1, 1);
        shell.position.set(0, h * 0.5, r * 0.35);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(r * 0.08, 6, 6), eyeMat);
        eyeL.position.set(-r * 0.2, h * 0.72, r * 0.4);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const antennaL = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.03, r * 0.05, r * 0.35, 6), snailBodyMat);
        antennaL.position.set(-r * 0.15, h * 0.82, r * 0.35);
        antennaL.rotation.x = 0.3;
        const antennaR = antennaL.clone();
        antennaR.position.x *= -1;
        g.add(body, shell, eyeL, eyeR, antennaL, antennaR);
      } else if (normalBeastType === "creeper") {
        const creeperGreen = new THREE.MeshStandardMaterial({ color: 0x0da70b, emissive: 0x044004, emissiveIntensity: 0.2, roughness: 0.7 });
        const creeperDark = new THREE.MeshStandardMaterial({ color: 0x064a06, emissive: 0x022002, emissiveIntensity: 0.15, roughness: 0.75 });
        const faceMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.5, cfg.height * 0.55, cfg.radius * 0.35), creeperGreen);
        body.position.y = cfg.height * 0.4;
        const head = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.5, cfg.radius * 0.5, cfg.radius * 0.35), creeperGreen);
        head.position.y = cfg.height * 0.88;
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.12, cfg.radius * 0.12, cfg.radius * 0.04), faceMat);
        eyeL.position.set(-cfg.radius * 0.14, cfg.height * 0.92, cfg.radius * 0.2);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.12, cfg.radius * 0.12, cfg.radius * 0.04), faceMat);
        eyeR.position.set(cfg.radius * 0.14, cfg.height * 0.92, cfg.radius * 0.2);
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.2, cfg.radius * 0.06, cfg.radius * 0.04), faceMat);
        mouth.position.set(0, cfg.height * 0.82, cfg.radius * 0.2);
        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.12, cfg.height * 0.2, cfg.radius * 0.12), creeperDark);
        leg1.position.set(-cfg.radius * 0.12, cfg.height * 0.08, cfg.radius * 0.1);
        const leg2 = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.12, cfg.height * 0.2, cfg.radius * 0.12), creeperDark);
        leg2.position.set(cfg.radius * 0.12, cfg.height * 0.08, cfg.radius * 0.1);
        const leg3 = leg1.clone();
        leg3.position.z = -cfg.radius * 0.1;
        const leg4 = leg2.clone();
        leg4.position.z = -cfg.radius * 0.1;
        g.add(body, head, eyeL, eyeR, mouth, leg1, leg2, leg3, leg4);
      } else if (normalBeastType === "zombie") {
        // Voxel / Minecraft-style zombie: blocky, green-gray skin, arms forward
        const r = cfg.radius;
        const h = cfg.height;
        const zombieSkin = new THREE.MeshStandardMaterial({ color: 0x5a7a5a, emissive: 0x0d200d, emissiveIntensity: 0.12, roughness: 0.85 });
        const zombieShirt = new THREE.MeshStandardMaterial({ color: 0x3d5a4a, emissive: 0x0a1810, emissiveIntensity: 0.08, roughness: 0.88 });
        const zombiePant = new THREE.MeshStandardMaterial({ color: 0x2a3540, emissive: 0x080810, emissiveIntensity: 0.06, roughness: 0.9 });
        const zombieEye = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        const head = new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, r * 0.5, r * 0.5), zombieSkin);
        head.position.y = h * 0.875;
        head.castShadow = true;
        const body = new THREE.Mesh(new THREE.BoxGeometry(r * 0.48, h * 0.45, r * 0.32), zombieShirt);
        body.position.y = h * 0.48;
        body.castShadow = true;
        const armL = new THREE.Mesh(new THREE.BoxGeometry(r * 0.14, h * 0.38, r * 0.14), zombieSkin);
        armL.position.set(-r * 0.32, h * 0.58, r * 0.38);
        armL.rotation.x = 0.5;
        armL.rotation.z = 0.15;
        armL.castShadow = true;
        const armR = new THREE.Mesh(new THREE.BoxGeometry(r * 0.14, h * 0.38, r * 0.14), zombieSkin);
        armR.position.set(r * 0.32, h * 0.58, r * 0.38);
        armR.rotation.x = 0.5;
        armR.rotation.z = -0.15;
        armR.castShadow = true;
        const legL = new THREE.Mesh(new THREE.BoxGeometry(r * 0.2, h * 0.32, r * 0.2), zombiePant);
        legL.position.set(-r * 0.12, h * 0.14, r * 0.04);
        legL.castShadow = true;
        const legR = new THREE.Mesh(new THREE.BoxGeometry(r * 0.2, h * 0.32, r * 0.2), zombiePant);
        legR.position.set(r * 0.12, h * 0.14, r * 0.04);
        legR.castShadow = true;
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(r * 0.1, r * 0.1, r * 0.03), zombieEye);
        eyeL.position.set(-r * 0.12, h * 0.92, r * 0.26);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(r * 0.1, r * 0.1, r * 0.03), zombieEye);
        eyeR.position.set(r * 0.12, h * 0.92, r * 0.26);
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(r * 0.14, r * 0.05, r * 0.03), zombieEye);
        mouth.position.set(0, h * 0.82, r * 0.26);
        g.add(head, body, armL, armR, legL, legR, eyeL, eyeR, mouth);
      } else if (normalBeastType === "tree") {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, emissive: 0x1a0f08, emissiveIntensity: 0.12, roughness: 0.9, metalness: 0.02 });
        const branchMat = new THREE.MeshStandardMaterial({ color: 0x3d2a18, emissive: 0x150a05, emissiveIntensity: 0.1, roughness: 0.88 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2a, emissive: 0x0d2a0d, emissiveIntensity: 0.2, roughness: 0.85 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.35, cfg.radius * 0.5, cfg.height * 0.85, 8), trunkMat);
        trunk.position.y = cfg.height * 0.42;
        g.add(trunk);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.5, 8, 6), leafMat);
        crown.position.y = cfg.height * 0.95;
        crown.scale.set(1.1, 1, 1.1);
        g.add(crown);
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.08, cfg.radius * 0.14, cfg.height * 0.5, 6), branchMat);
        armL.position.set(-cfg.radius * 0.5, cfg.height * 0.7, cfg.radius * 0.15);
        armL.rotation.z = 0.5;
        armL.rotation.x = 0.2;
        const handL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.2, 6, 5), leafMat);
        handL.position.set(-cfg.radius * 0.55, cfg.height * 0.45, cfg.radius * 0.35);
        armL.add(handL);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.08, cfg.radius * 0.14, cfg.height * 0.5, 6), branchMat);
        armR.position.set(cfg.radius * 0.5, cfg.height * 0.7, cfg.radius * 0.15);
        armR.rotation.z = -0.5;
        armR.rotation.x = 0.2;
        const handR = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.2, 6, 5), leafMat);
        handR.position.set(cfg.radius * 0.55, cfg.height * 0.45, cfg.radius * 0.35);
        armR.add(handR);
        g.add(armL, armR);
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.06, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.12, cfg.height * 0.98, cfg.radius * 0.42);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        g.add(eyeL, eyeR);
        const rootL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.06, cfg.radius * 0.12, cfg.height * 0.2, 5), branchMat);
        rootL.position.set(-cfg.radius * 0.2, cfg.height * 0.08, cfg.radius * 0.1);
        rootL.rotation.x = 0.4;
        const rootR = rootL.clone();
        rootR.position.x *= -1;
        rootR.rotation.x = 0.4;
        g.add(rootL, rootR);
      } else if (normalBeastType === "flame") {
        const flameMat = new THREE.MeshStandardMaterial({ color: 0xff6622, emissive: 0xff3300, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.05 });
        const flameEye = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.5, 10, 8), flameMat);
        body.scale.set(1, 1.2, 0.95);
        body.position.y = cfg.height * 0.55;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.38, 10, 8), flameMat);
        head.position.y = cfg.height * 1.0;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.08, 6, 6), flameEye);
        eyeL.position.set(-cfg.radius * 0.14, cfg.height * 1.02, cfg.radius * 0.28);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const flameTip = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.25, cfg.height * 0.4, 6), flameMat);
        flameTip.position.set(0, cfg.height * 0.2, -cfg.radius * 0.35);
        flameTip.rotation.x = 0.4;
        g.add(body, head, eyeL, eyeR, flameTip);
      } else if (normalBeastType === "shadow") {
        const shadowMat = new THREE.MeshStandardMaterial({ color: 0x0a0a12, emissive: 0x220022, emissiveIntensity: 0.25, roughness: 0.9, metalness: 0, transparent: true, opacity: 0.88 });
        const shadowEye = new THREE.MeshBasicMaterial({ color: 0x6600aa });
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.48, 10, 8), shadowMat);
        body.scale.set(1, 1.3, 0.9);
        body.position.y = cfg.height * 0.52;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.36, 10, 8), shadowMat);
        head.position.y = cfg.height * 1.0;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.07, 6, 6), shadowEye);
        eyeL.position.set(-cfg.radius * 0.12, cfg.height * 1.04, cfg.radius * 0.3);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const tail = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.2, cfg.height * 0.5, 6), shadowMat);
        tail.position.set(0, cfg.height * 0.18, -cfg.radius * 0.45);
        tail.rotation.x = 0.5;
        g.add(body, head, eyeL, eyeR, tail);
      } else {
        // Normal: round blob + ears + tail
        const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.55, 10, 8), mat);
        body.scale.set(1, 1.2, 1);
        body.position.y = cfg.height * 0.55;
        const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.38, 10, 8), mat);
        head.position.y = cfg.height * 1.0;
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.06, 5, 5), eyeMat);
        eyeL.position.set(-cfg.radius * 0.15, cfg.height * 1.02, cfg.radius * 0.28);
        const eyeR = eyeL.clone();
        eyeR.position.x *= -1;
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.2, cfg.radius * 0.06, cfg.radius * 0.1), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        mouth.position.set(0, cfg.height * 0.9, cfg.radius * 0.3);
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.12, cfg.radius * 0.15, cfg.height * 0.3, 6), darkLeg);
        legL.position.set(-cfg.radius * 0.25, cfg.height * 0.15, 0);
        const legR = legL.clone();
        legR.position.x *= -1;
        const earMat = new THREE.MeshStandardMaterial({ color: color * 0.95 & 0xffffff, roughness: 0.5 });
        const earL = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.12, cfg.radius * 0.35, 4), earMat);
        earL.position.set(-cfg.radius * 0.28, cfg.height * 1.18, 0);
        earL.rotation.z = 0.3;
        const earR = earL.clone();
        earR.position.x *= -1;
        earR.rotation.z *= -0.3;
        const tail = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.1, cfg.radius * 0.4, 4), mat);
        tail.position.set(0, cfg.height * 0.35, -cfg.radius * 0.5);
        tail.rotation.x = 0.4;
        g.add(body, head, eyeL, eyeR, mouth, legL, legR, earL, earR, tail);
      }
    } else if (tier === "rare" && normalBeastType === "shadow") {
      const shadowMat = new THREE.MeshStandardMaterial({ color: 0x0a0a12, emissive: 0x220022, emissiveIntensity: 0.25, roughness: 0.9, metalness: 0, transparent: true, opacity: 0.88 });
      const shadowEye = new THREE.MeshBasicMaterial({ color: 0x6600aa });
      const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.48, 10, 8), shadowMat);
      body.scale.set(1, 1.3, 0.9);
      body.position.y = cfg.height * 0.52;
      const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.36, 10, 8), shadowMat);
      head.position.y = cfg.height * 1.0;
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.07, 6, 6), shadowEye);
      eyeL.position.set(-cfg.radius * 0.12, cfg.height * 1.04, cfg.radius * 0.3);
      const eyeR = eyeL.clone();
      eyeR.position.x *= -1;
      const tail = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.2, cfg.height * 0.5, 6), shadowMat);
      tail.position.set(0, cfg.height * 0.18, -cfg.radius * 0.45);
      tail.rotation.x = 0.5;
      g.add(body, head, eyeL, eyeR, tail);
    } else if (tier === "magic") {
      // Magic: elongated body + floating crystal
      const body = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.45, cfg.radius * 0.55, cfg.height * 0.7, 8), mat);
      body.position.y = cfg.height * 0.45;
      const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.32, 10, 8), mat);
      head.position.y = cfg.height * 0.95;
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.07, 5, 5), eyeMat);
      eyeL.position.set(-cfg.radius * 0.14, cfg.height * 0.98, cfg.radius * 0.25);
      const eyeR = eyeL.clone();
      eyeR.position.x *= -1;
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.18, cfg.radius * 0.05, cfg.radius * 0.08), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      mouth.position.set(0, cfg.height * 0.88, cfg.radius * 0.26);
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.1, cfg.radius * 0.14, cfg.height * 0.28, 6), darkLeg);
      legL.position.set(-cfg.radius * 0.22, cfg.height * 0.14, 0);
      const legR = legL.clone();
      legR.position.x *= -1;
      const crystalMat = new THREE.MeshStandardMaterial({ color: 0xaaffff, emissive: 0x4488aa, emissiveIntensity: 0.7, roughness: 0.2, transparent: true, opacity: 0.9 });
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(cfg.radius * 0.2, 0), crystalMat);
      crystal.position.y = cfg.height * 1.35;
      const horn = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.08, cfg.radius * 0.28, 5), new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 }));
      horn.position.set(0, cfg.height * 1.12, 0);
      g.add(body, head, eyeL, eyeR, mouth, legL, legR, crystal, horn);
    } else if (tier === "rare") {
      // Rare: beast body + big wings + tail + horn
      const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.5, 10, 8), mat);
      body.scale.set(1.1, 1.25, 0.9);
      body.position.y = cfg.height * 0.55;
      const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.36, 10, 8), mat);
      head.position.y = cfg.height * 1.0;
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.07, 5, 5), eyeMat);
      eyeL.position.set(-cfg.radius * 0.16, cfg.height * 1.02, cfg.radius * 0.26);
      const eyeR = eyeL.clone();
      eyeR.position.x *= -1;
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.22, cfg.radius * 0.07, cfg.radius * 0.12), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      mouth.position.set(0, cfg.height * 0.9, cfg.radius * 0.32);
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.13, cfg.radius * 0.16, cfg.height * 0.32, 6), darkLeg);
      legL.position.set(-cfg.radius * 0.28, cfg.height * 0.16, 0);
      const legR = legL.clone();
      legR.position.x *= -1;
      const horn = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.1, cfg.radius * 0.35, 5), new THREE.MeshStandardMaterial({ color: 0xddccaa, roughness: 0.5 }));
      horn.position.set(0, cfg.height * 1.28, 0);
      const wingMat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
      const wingL = new THREE.Mesh(new THREE.PlaneGeometry(cfg.radius * 0.95, cfg.radius * 0.55), wingMat);
      wingL.position.set(-cfg.radius * 0.6, cfg.height * 0.82, -cfg.radius * 0.15);
      wingL.rotation.y = 0.55;
      const wingR = wingL.clone();
      wingR.position.x *= -1;
      wingR.rotation.y *= -1;
      const tail = new THREE.Mesh(new THREE.ConeGeometry(cfg.radius * 0.12, cfg.radius * 0.5, 5), mat);
      tail.position.set(0, cfg.height * 0.4, -cfg.radius * 0.55);
      tail.rotation.x = 0.35;
      g.add(body, head, eyeL, eyeR, mouth, legL, legR, horn, wingL, wingR, tail);
    } else {
      // Unique: armored look + crown + cape
      const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.52, 10, 8), mat);
      body.scale.set(1.05, 1.22, 1);
      body.position.y = cfg.height * 0.54;
      const head = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.36, 10, 8), mat);
      head.position.y = cfg.height * 1.0;
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.065, 5, 5), eyeMat);
      eyeL.position.set(-cfg.radius * 0.15, cfg.height * 1.02, cfg.radius * 0.28);
      const eyeR = eyeL.clone();
      eyeR.position.x *= -1;
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.radius * 0.2, cfg.radius * 0.06, cfg.radius * 0.1), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      mouth.position.set(0, cfg.height * 0.9, cfg.radius * 0.3);
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.12, cfg.radius * 0.16, cfg.height * 0.3, 6), darkLeg);
      legL.position.set(-cfg.radius * 0.26, cfg.height * 0.15, 0);
      const legR = legL.clone();
      legR.position.x *= -1;
      const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x666677, emissive: 0x222233, emissiveIntensity: 0.2, roughness: 0.4, metalness: 0.3 });
      const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 0.22, 6, 6), shoulderMat);
      shoulderL.position.set(-cfg.radius * 0.5, cfg.height * 0.78, 0);
      const shoulderR = shoulderL.clone();
      shoulderR.position.x *= -1;
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x886600, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.3 });
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius * 0.25, cfg.radius * 0.3, cfg.radius * 0.15, 6), crownMat);
      crown.position.y = cfg.height * 1.2;
      const crownSpike1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), crownMat);
      crownSpike1.position.set(-0.1, cfg.height * 1.3, 0);
      const crownSpike2 = crownSpike1.clone();
      crownSpike2.position.x = 0.1;
      const crownSpike3 = crownSpike1.clone();
      crownSpike3.position.set(0, cfg.height * 1.3, 0.1);
      const capeMat = new THREE.MeshStandardMaterial({ color: color * 0.6 & 0xffffff, emissive: emissive, emissiveIntensity: 0.15, roughness: 0.8, side: THREE.DoubleSide });
      const cape = new THREE.Mesh(new THREE.PlaneGeometry(cfg.radius * 0.9, cfg.height * 0.7), capeMat);
      cape.position.set(0, cfg.height * 0.5, -cfg.radius * 0.4);
      cape.rotation.x = 0.1;
      g.add(body, head, eyeL, eyeR, mouth, legL, legR, shoulderL, shoulderR, crown, crownSpike1, crownSpike2, crownSpike3, cape);
    }
  }
  }

  if (tier !== "normal") {
    const aura = new THREE.Mesh(new THREE.RingGeometry(cfg.radius * 1.1, cfg.radius * (isBoss ? 1.9 : 1.45), 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: isBoss ? 0.55 : 0.35, side: THREE.DoubleSide }));
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.08;
    g.add(aura);
  }
  const hpBar = makeHpBar(false);
  hpBar.position.y = cfg.height * (isBoss ? 1.5 : 1.3);
  hpBar.scale.multiplyScalar(isBoss ? 1.35 : 1);
  g.add(hpBar);
  const nameLabel = makeNameLabel(name, isBoss ? "boss" : tier);
  nameLabel.position.y = cfg.height * (isBoss ? 1.85 : 1.58);
  nameLabel.scale.multiplyScalar(isBoss ? 1.2 : 1);
  g.add(nameLabel);
  const isRanged = tier === "magic" && Math.random() < 0.38;
  let castLabel = null;
  if (isRanged) {
    castLabel = makeCastLabel();
    castLabel.position.y = cfg.height * (isBoss ? 1.85 : 1.58) + 0.3;
    g.add(castLabel);
  }
  if (isBoss) addEnemyZoneOverlay(g, 0xff4444, true);

  const plvl = state.level || 0;
  const levelScale = 1 + plvl * 0.058;
  const levelDiffMult = plvl >= 10 ? (1 + (plvl - 10) * 0.024) : 1;
  const levelHpRamp = plvl >= 10 ? (1 + (plvl - 10) * 0.022) : 1;
  const levelDmgRamp = plvl >= 10 ? (1 + (plvl - 10) * 0.004) : 1;
  const first10LevelHpScale = plvl <= 10 ? (0.32 + 0.068 * plvl) : 1;
  const stageScale = 1 + Math.max(0, state.difficultyStage - 1) * 0.025;
  const endlessScale = state.endlessMode ? (1 + (state.endlessWave || 0) * 0.05) : 1;
  const chapterTimeFactor = 0.75 + 0.4 * Math.min(1, (state.chapterTime || 0) / 720);
  const gameTime = state.time || 0;
  const timeScale = 1 + Math.max(0, gameTime - 300) / 900 * 0.04;
  const activityDiffMult = 1 + ((state.difficultyUpgrades && state.difficultyUpgrades.mult) || 0) * 0.05;
  const diffMult = (state.difficultyMult || 1) * activityDiffMult;
  const hardcoreSpeedMult = state.hardcoreMode ? 1.45 : 1;
  const chapterHpMult = getChapterHpMult(state.chapter);
  const chapterDmgMult = getChapterDamageMult(state.chapter);
  const globalEase = 0.75;
  const earlyLevelEase = plvl <= 3 ? 0.62 : plvl <= 10 ? 0.76 : 1;
  let hp = cfg.hp * levelScale * stageScale * endlessScale * diffMult * chapterHpMult * globalEase * earlyLevelEase * levelDiffMult * levelHpRamp * first10LevelHpScale;
  const chapterSpeedMult = getChapterEnemySpeedMult(state.chapter);
  const stageSpeedMult = 1 + Math.max(0, state.difficultyStage - 1) * 0.015;
  let speed = cfg.speed * 0.82 * chapterTimeFactor * timeScale * chapterSpeedMult * stageSpeedMult * hardcoreSpeedMult * (1 + plvl * 0.004 + (state.endlessMode ? (state.endlessWave || 0) * 0.015 : 0)) * (state.endlessMode ? (1 + (state.endlessWave || 0) * 0.015) : 1) * (plvl >= 10 ? (1 + (plvl - 10) * 0.002) : 1);
  if (plvl < 10) speed *= 0.85; else speed *= 0.98;
  if ((state.time || 0) >= 540) speed *= 1.02;
  const enemyDmgMult = 0.92;
  let damage = cfg.damage * timeScale * (1 + plvl * 0.004 + Math.max(0, state.difficultyStage - 1) * 0.04) * endlessScale * diffMult * chapterDmgMult * globalEase * earlyLevelEase * levelDiffMult * levelDmgRamp * enemyDmgMult;
  let xp = cfg.xp * (1 + plvl * 0.04 + Math.max(0, state.difficultyStage - 1) * 0.08) * diffMult * levelDiffMult;
  if (normalBeastType === "polarBear") {
    speed *= 1.4;
    xp *= 1.85;
  }
  if (normalBeastType === "snail") {
    speed *= 0.6;
    xp *= 1.1;
  }
  const chapterTime = state.chapterTime || 0;
  if (chapterTime > 600 && !isBoss) {
    const t = chapterTime - 600;
    const post10Mult = t < 120 ? 1.08 : t < 240 ? 1.18 : 1.3;
    speed *= post10Mult;
    damage *= post10Mult;
    hp *= post10Mult;
    xp *= post10Mult;
  }
  if (normalBeastType === "shadow") {
    speed *= 1.7;
    damage *= 1.45;
    xp *= 1.3;
    if (chapterTime > 600) {
      const shadowRamp = 1 + Math.floor((chapterTime - 600) / 5) * 0.02;
      speed *= shadowRamp;
    }
  }
  if (normalBeastType === "flame") {
    damage *= 1.2;
    xp *= 1.15;
  }
  speed *= 0.95;

  const affixRoll = !isBoss && Math.random() < 0.10;
  const affix = affixRoll ? (Math.random() < 0.6 ? "lifeStealAura" : "slowAura") : null;
  const isBatFlying = tier === "normal" && (normalBeastType === "bat" || normalBeastType === "redBat");
  const isCrowFlying = tier === "normal" && normalBeastType === "crow";
  const isSlime = tier === "normal" && (normalBeastType === "slime" || normalBeastType === "purpleSlime");
  const isShadowType = normalBeastType === "shadow" || normalBeastType === "purpleShadow";
  return {
    mesh: g,
    tier,
    name,
    normalBeastType: normalBeastType || null,
    ...(isShadowType ? { isShadow: true } : {}),
    hp,
    maxHp: hp,
    speed,
    damage,
    xp,
    radius: cfg.radius * scaleVar,
    poisonLeft: 0,
    slowLeft: 0,
    freezeLeft: 0,
    burnLeft: 0,
    bleedLeft: 0,
    shockLeft: 0,
    swordHitCd: 0,
    bananaHitCd: 0,
    push: new THREE.Vector3(),
    isBoss,
    specialCd: isBoss ? 3.2 + Math.random() * 1.4 : tier === "unique" ? 4 + Math.random() * 2 : 999,
    hpBar,
    nameLabel,
    castLabel,
    ranged: isRanged,
    shootCd: isRanged ? 0.8 + Math.random() * 0.6 : 999,
    enemySkillType: isRanged ? (Math.random() < 0.65 ? "fireball" : "projectile") : null,
    affix,
    ...((isBatFlying || isCrowFlying) ? { isFlying: true, flyHeight: 2 + Math.random() * 1.5, wingPhase: Math.random() * Math.PI * 2, wingIndices: isCrowFlying ? [5, 6] : [7, 8] } : {}),
    poisonOnHit: !isBoss && (normalBeastType === "scorpion" || normalBeastType === "spider" || normalBeastType === "snake" || normalBeastType === "void" || normalBeastType === "horror" || normalBeastType === "slime" || normalBeastType === "purpleSlime"),
    burnOnHit: !isBoss && normalBeastType === "flame",
  };
}

function createHerobrineBoss(cfg) {
  return withSharedGeoMat(function () { return createHerobrineBossInner(cfg); });
}
function createHerobrineBossInner(cfg) {
  const g = new THREE.Group();
  const scaleVar = 0.92 + Math.random() * 0.16;
  if (!attachVoxelModel(g, "boss_herobrine", cfg.height, cfg.radius, scaleVar)) {
    g.scale.setScalar(scaleVar);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, emissive: 0x1a1510, emissiveIntensity: 0.1, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2d5016, emissive: 0x0a1505, roughness: 0.8 });
    const pantMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, emissive: 0x050a12, roughness: 0.8 });
    const glowEyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.1 });
    const r = cfg.radius;
    const h = cfg.height;
    const head = new THREE.Mesh(new THREE.BoxGeometry(r * 0.9, r * 0.9, r * 0.9, 1, 1, 1), skinMat);
    head.position.y = h * 1.05;
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(r * 0.28, r * 0.22, r * 0.1, 1, 1, 1), glowEyeMat);
    eyeL.position.set(-r * 0.22, h * 1.08, r * 0.46);
    const eyeR = eyeL.clone();
    eyeR.position.x = r * 0.22;
    const body = new THREE.Mesh(new THREE.BoxGeometry(r * 0.8, h * 0.5, r * 0.4, 1, 1, 1), shirtMat);
    body.position.y = h * 0.55;
    const armL = new THREE.Mesh(new THREE.BoxGeometry(r * 0.2, h * 0.45, r * 0.2, 1, 1, 1), skinMat);
    armL.position.set(-r * 0.55, h * 0.5, 0);
    const armR = armL.clone();
    armR.position.x = r * 0.55;
    const legL = new THREE.Mesh(new THREE.BoxGeometry(r * 0.22, h * 0.4, r * 0.22, 1, 1, 1), pantMat);
    legL.position.set(-r * 0.2, h * 0.18, 0);
    const legR = legL.clone();
    legR.position.x = r * 0.2;
    g.add(head, eyeL, eyeR, body, armL, armR, legL, legR);
  }
  const hpBar = makeHpBar(false);
  hpBar.position.y = cfg.height * 1.5;
  hpBar.scale.multiplyScalar(1.35);
  g.add(hpBar);
  const nameLabel = makeNameLabel("Herobrine", "boss");
  nameLabel.position.y = cfg.height * 1.85;
  nameLabel.scale.multiplyScalar(1.2);
  g.add(nameLabel);
  const chapterHpMult = getChapterHpMult(state.chapter);
  const chapterDmgMult = getChapterDamageMult(state.chapter);
  const hp = cfg.hp * MEGA_BOSS_HP_MULT * chapterHpMult * (state.difficultyMult || 1) * 1.25;
  const speed = cfg.speed * 0.85 * 1.05 * getChapterEnemySpeedMult(state.chapter);
  const damage = cfg.damage * 1.25 * chapterDmgMult * (state.difficultyMult || 1);
  const xp = cfg.xp * 4 * (state.difficultyMult || 1);
  return {
    mesh: g,
    tier: "boss",
    name: "Herobrine",
    hp,
    maxHp: hp,
    speed,
    damage,
    xp,
    radius: cfg.radius * g.scale.x,
    poisonLeft: 0,
    slowLeft: 0,
    freezeLeft: 0,
    burnLeft: 0,
    bleedLeft: 0,
    shockLeft: 0,
    swordHitCd: 0,
    bananaHitCd: 0,
    push: new THREE.Vector3(),
    isBoss: true,
    isHerobrine: true,
    specialCd: 2.8 + Math.random() * 1.2,
    lightningCd: 1.8,
    hpBar,
    nameLabel,
    ranged: false,
    shootCd: 999,
    affix: null,
  };
}

function createAngelBoss(cfg) {
  return withSharedGeoMat(function () { return createAngelBossInner(cfg); });
}
function createAngelBossInner(cfg) {
  const g = new THREE.Group();
  const scaleVar = 0.95 + Math.random() * 0.14;
  if (!attachVoxelModel(g, "boss_serafim", cfg.height, cfg.radius, scaleVar)) {
    g.scale.setScalar(scaleVar);
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffeeaa, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.1 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0xffaa22, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.4 });
    const r = cfg.radius;
    const h = cfg.height;
    const body = new THREE.Mesh(new THREE.BoxGeometry(r * 0.7, h * 0.55, r * 0.4), whiteMat);
    body.position.y = h * 0.5;
    const head = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 12, 10), whiteMat);
    head.position.y = h * 1.02;
    const halo = new THREE.Mesh(new THREE.RingGeometry(r * 0.55, r * 0.7, 16), goldMat);
    halo.position.y = h * 1.35;
    halo.rotation.x = Math.PI / 2;
    g.add(body, head, halo);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xf0f5ff, emissive: 0xaaccff, emissiveIntensity: 0.2, roughness: 0.8, side: THREE.DoubleSide });
    const wingL = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.2, h * 1.1), wingMat);
    wingL.position.set(-r * 0.9, h * 0.6, 0);
    wingL.rotation.z = 0.3;
    const wingR = wingL.clone();
    wingR.position.x = r * 0.9;
    wingR.rotation.z = -0.3;
    g.add(wingL, wingR);
  }
  const hpBar = makeHpBar(false);
  hpBar.position.y = cfg.height * 1.5;
  hpBar.scale.multiplyScalar(1.35);
  g.add(hpBar);
  const nameLabel = makeNameLabel("Angel", "boss");
  nameLabel.position.y = cfg.height * 1.85;
  nameLabel.scale.multiplyScalar(1.2);
  g.add(nameLabel);
  const chapterHpMult = getChapterHpMult(state.chapter);
  const chapterDmgMult = getChapterDamageMult(state.chapter);
  const hp = cfg.hp * MEGA_BOSS_HP_MULT * 0.8 * chapterHpMult * (state.difficultyMult || 1);
  const speed = cfg.speed * 1.05 * getChapterEnemySpeedMult(state.chapter);
  const damage = cfg.damage * 1.15 * chapterDmgMult * (state.difficultyMult || 1);
  const xp = cfg.xp * 3.5 * (state.difficultyMult || 1);
  return {
    mesh: g,
    tier: "boss",
    name: "Angel",
    hp,
    maxHp: hp,
    speed,
    damage,
    xp,
    radius: cfg.radius * g.scale.x,
    poisonLeft: 0,
    slowLeft: 0,
    freezeLeft: 0,
    burnLeft: 0,
    bleedLeft: 0,
    shockLeft: 0,
    swordHitCd: 0,
    bananaHitCd: 0,
    push: new THREE.Vector3(),
    isBoss: true,
    isAngel: true,
    specialCd: 2.5 + Math.random() * 1.2,
    holyCd: 1.6,
    hpBar,
    nameLabel,
    ranged: true,
    shootCd: 0.9,
    enemySkillType: "holy",
    affix: null,
  };
}

const ENEMY_VARIANTS = [
  { id: "mini", name: "Mini", scale: 0.65, speedMult: 1.42, hpMult: 0.72, dmgMult: 0.78 },
  { id: "giant", name: "Dev", scale: 1.38, speedMult: 0.74, hpMult: 1.45, dmgMult: 1.22 },
  { id: "fast", name: "Hızlı", scale: 1.0, speedMult: 1.32, hpMult: 0.88, dmgMult: 0.92 },
  { id: "slow", name: "Yavaş", scale: 1.18, speedMult: 0.68, hpMult: 1.25, dmgMult: 1.08 },
  { id: "normal", name: "Normal", scale: 1.0, speedMult: 1.0, hpMult: 1.0, dmgMult: 1.0 },
];

const CHARACTERS = [
  { id: "scout", name: "İzci", desc: "Hız + Frostball", startStats: { moveSpeed: 7.5 }, startSkills: ["speed", "unlock_frostball"] },
  { id: "brawler", name: "Dövücü", desc: "HP + Kılıçlar", startStats: { maxHp: 155, hp: 155 }, startSkills: ["hp", "unlock_swords", "sword_dmg"] },
  { id: "mage", name: "Büyücü", desc: "Hasar + Fireball", startStats: { damage: 26 }, startSkills: ["dmg", "unlock_fireball", "magnet"] },
  { id: "survivor", name: "Hayatta Kalan", desc: "Kalkan + Regen", startStats: { maxHp: 130, hp: 130 }, startSkills: ["armor", "unlock_shield", "regen"] },
  { id: "samurai", name: "Samuray", desc: "Tam melee • Kılıçla vurur • Kılıç skilleri", startStats: { samuraiMelee: true, damage: 26, moveSpeed: 7.2 }, startSkills: ["unlock_swords", "sword_dmg", "unlock_sword_throw"] },
  { id: "gorilla", name: "Goril", desc: "Skill atmaz • Etrafında hasar alanı", startStats: { gorillaAura: true, moveSpeed: 6.8 }, startSkills: ["unlock_gorilla_aura", "gorilla_radius", "gorilla_dmg"] },
  { id: "monk", name: "Keşiş", desc: "Flicker Strike • Son vuruş ışınlanma + patlama", startStats: { moveSpeed: 7.5, damage: 26 }, startSkills: ["unlock_flicker_strike", "flicker_range", "flicker_dmg"] },
  { id: "paladin", name: "Paladin", desc: "Smite • Kutsal vuruş, yarı yükseklikte halka patlama", startStats: { damage: 24, maxHp: 140, hp: 140, armor: 0.06 }, startSkills: ["unlock_smite", "smite_dmg", "armor"] },
  { id: "archer", name: "Okçu", desc: "Yay + Ok • Şok/Yakıcı/Donduran oklar, max 4 ok", startStats: { archerBow: true, damage: 22, moveSpeed: 7.2, projectileSpeedMult: 1.1 }, startSkills: ["arrow_dmg", "proj_speed", "multishot"] },
];

// Karakter bazli skill onceligi (level 10'a kadar o karakterin skilleri daha sik gelir)
const CHARACTER_SKILL_PRIORITY = {
  scout: new Set(["speed", "unlock_frostball", "frostball_dmg", "frostball_freeze", "frostball_shards", "unlock_frost_nova", "unlock_dash", "multishot", "pierce", "proj_speed"]),
  brawler: new Set(["hp", "unlock_swords", "sword_dmg", "sword_count", "unlock_sword_throw", "sword_throw_dmg", "unlock_meteor", "meteor_dmg", "unlock_nova", "nova_dmg", "berserker", "thick_skin", "regen"]),
  mage: new Set(["dmg", "unlock_fireball", "fireball_dmg", "fireball_cd", "unlock_comet", "comet_dmg", "unlock_meteor", "meteor_dmg", "unlock_nova", "nova_dmg", "magnet", "multishot", "unlock_meteor_ult", "unlock_ult_inferno", "unlock_ult_mega_explosion"]),
  survivor: new Set(["armor", "unlock_shield", "shield_regen", "regen", "hp", "thick_skin", "dodge", "second_wind", "impact", "unlock_sprint"]),
  samurai: new Set(["unlock_swords", "sword_dmg", "sword_count", "unlock_sword_throw", "sword_throw_dmg", "unlock_flicker_strike", "flicker_range", "flicker_dmg", "unlock_dismantle", "dismantle_dmg", "crit", "critical_master", "sharp_edges"]),
  gorilla: new Set(["unlock_gorilla_aura", "gorilla_radius", "gorilla_dmg", "hp", "thick_skin", "regen", "armor", "berserker", "impact"]),
  monk: new Set(["unlock_flicker_strike", "flicker_range", "flicker_dmg", "unlock_swords", "sword_dmg", "unlock_dash", "dmg", "crit", "critical_master", "unlock_saturn_rings", "saturn_radius", "saturn_dmg"]),
  paladin: new Set(["unlock_smite", "smite_dmg", "smite_radius", "armor", "unlock_shield", "shield_regen", "thorns", "lifesteal", "unlock_herald_thunder", "herald_thunder_dmg", "regen", "thick_skin"]),
  archer: new Set(["arrow_dmg", "arrow_speed", "unlock_arrow_shock", "unlock_arrow_burn", "unlock_arrow_freeze", "arrow_multishot", "multishot", "pierce", "proj_speed", "crit", "crit_dmg", "unlock_frostball", "unlock_fireball", "unlock_spark"]),
};
const DEFAULT_CHARACTER_ID = "scout";

function spawnEnemy(angleOverride, forAttackRound) {
  if (enemies.length >= getMaxEnemies()) return;
  const tier = pickEnemyTier();
  const cfg = tierConfig[tier];
  // Ucan / ziplayan yaratık oranını biraz arttir
  const flyingBias = 0.22;
  const jumpingBias = 0.16;
  let opts = {};
  if (Math.random() < flyingBias) {
    const flyTypes = ["bat", "redBat", "flying", "crow", "ghost", "wraith"];
    opts.forceBeastType = flyTypes[Math.floor(Math.random() * flyTypes.length)];
  } else if (Math.random() < jumpingBias) {
    const jumpTypes = ["slime", "spider", "boar", "wolf"];
    opts.forceBeastType = jumpTypes[Math.floor(Math.random() * jumpTypes.length)];
  }
  const e = createEnemy(tier, cfg, opts);
  if (forAttackRound && state.attackRoundActive) {
    e.isAttackRound = true;
    e.attackRoundWave = state.attackRoundPhase || 1;
  }
  if (tier !== "boss") {
    const roll = Math.random();
    const v = roll < 0.14 ? ENEMY_VARIANTS[0] : roll < 0.26 ? ENEMY_VARIANTS[1] : roll < 0.44 ? ENEMY_VARIANTS[2] : roll < 0.59 ? ENEMY_VARIANTS[3] : ENEMY_VARIANTS[4];
    e.mesh.scale.multiplyScalar(v.scale);
    e.speed *= v.speedMult;
    e.hp *= v.hpMult;
    e.maxHp = e.hp;
    e.damage *= v.dmgMult;
    e.radius *= v.scale;
    if (Math.random() < 0.10) {
      e.isElite = true;
      e.hp *= 1.5;
      e.maxHp = e.hp;
      e.xp *= 1.4;
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x886600, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.4 });
      const crown = new THREE.Mesh(new THREE.ConeGeometry(e.radius * 0.2, e.radius * 0.45, 5), crownMat);
      crown.position.y = e.radius * 2.2;
      e.mesh.add(crown);
      if (e.nameLabel) {
        const oldY = e.nameLabel.position.y;
        e.mesh.remove(e.nameLabel);
        e.nameLabel = makeNameLabel(e.name, "rare");
        e.nameLabel.position.y = oldY;
        e.mesh.add(e.nameLabel);
      }
    }
    if (Math.random() < 0.18) {
      const mutations = ["slippery", "jumping", "heavy", "exploding"];
      e.mutation = mutations[Math.floor(Math.random() * mutations.length)];
      if (e.mutation === "heavy") {
        e.speed *= 0.52;
        e.hp *= 2.2;
        e.maxHp = e.hp;
        e.radius *= 1.1;
      } else if (e.mutation === "slippery") {
        e.speed *= 1.28;
      } else if (e.mutation === "jumping") {
        e.jumpTimer = 0.5 + Math.random() * 0.8;
      }
    }
  }

  const a = angleOverride != null ? angleOverride : Math.random() * Math.PI * 2;
  const r = (14 + Math.random() * 14) * 0.95;
  const sBound = (state.currentMapId === "island" ? ISLAND_RADIUS : (state.currentMapId === "temple1" || state.currentMapId === "temple2" ? TEMPLE_HALF : WORLD_HALF)) - 2;
  const x = clamp(player.mesh.position.x + Math.cos(a) * r, -sBound, sBound);
  const z = clamp(player.mesh.position.z + Math.sin(a) * r, -sBound, sBound);
  e.mesh.position.set(x, getGroundHeight(x, z), z);
  e.spawnDelay = 1.1;

  e.flankBias = (Math.random() - 0.5) * 1.4;
  enemies.push(e);
  scene.add(e.mesh);
  return e;
}

function spawnSoulRoundEnemy(angleOverride) {
  if (enemies.length >= getMaxEnemies()) return;
  const cfg = tierConfig.rare;
  const e = createEnemy("rare", cfg, { forceBeastType: "shadow" });
  e.isElite = true;
  e.hp *= 1.2;
  e.maxHp = e.hp;
  e.xp *= 1.3;
  e.speed = (typeof getUnifiedEnemySpeed === "function" ? getUnifiedEnemySpeed() : e.speed) * 1.25;
  e.damage *= 1.25;
  const a = angleOverride != null ? angleOverride : Math.random() * Math.PI * 2;
  const r = (10 + Math.random() * 22) * 0.95;
  const sBound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 2;
  const x = clamp(player.mesh.position.x + Math.cos(a) * r, -sBound, sBound);
  const z = clamp(player.mesh.position.z + Math.sin(a) * r, -sBound, sBound);
  e.mesh.position.set(x, getGroundHeight(x, z), z);
  e.spawnDelay = 1.1;
  e.flankBias = (Math.random() - 0.5) * 0.6;
  enemies.push(e);
  scene.add(e.mesh);
}

function spawnAttackRoundGoblin(wave) {
  if (enemies.length >= ATTACK_ROUND_MAX_ENEMIES) return;
  const cfg = tierConfig.normal;
  const e = createEnemy("normal", cfg, { forceBeastType: "goblin" });
  e.isAttackRound = true;
  e.attackRoundWave = wave;
  const a = Math.random() * Math.PI * 2;
  const r = (8 + Math.random() * 28) * 0.95;
  const sBound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 2;
  const x = clamp(player.mesh.position.x + Math.cos(a) * r, -sBound, sBound);
  const z = clamp(player.mesh.position.z + Math.sin(a) * r, -sBound, sBound);
  e.mesh.position.set(x, getGroundHeight(x, z), z);
  e.spawnDelay = 0.3;
  e.flankBias = (Math.random() - 0.5) * 0.35;
  enemies.push(e);
  scene.add(e.mesh);
}

const HEROBRINE_CHANCE_MEGA = 0.17;
const HEROBRINE_CHANCE_CHAPTER = 0.07;
const ANGEL_BOSS_CHANCE = 0.08;
let bossBarIdCounter = 0;
const BOSS_SUMMON_SHRINE_DAMAGE_MULT = 0.42;
function spawnBoss(bossIndex, allowOverflow, fromSummonShrine, isChapterFinalBoss, spawnSlot) {
  const cap = allowOverflow ? 30 : getMaxEnemies();
  if (enemies.length >= cap) return;
  const cfg = tierConfig.boss;
  const isMega = state.inMegaArena && !state.megaBossSpawned;
  const dmgMult = (fromSummonShrine && !isMega) ? BOSS_SUMMON_SHRINE_DAMAGE_MULT : 1;
  let boss;
  if (isMega) {
    if (hasVoxel("boss_zonk_avatar")) {
      boss = createEnemy("boss", cfg, { voxelId: "boss_zonk_avatar" });
      boss.bossIndex = 2;
      boss.isMegaBoss = true;
      boss.name = "ZONK Avatari";
      const chapterBossHp = getChapterHpMult(state.chapter);
      const chapterBossDmg = getChapterDamageMult(state.chapter);
      boss.hp *= MEGA_BOSS_HP_MULT * chapterBossHp * 1.5;
      boss.maxHp = boss.hp;
      boss.damage *= (1 + 2 * 0.25) * chapterBossDmg * 1.5 * 1.15;
      boss.mesh.scale.multiplyScalar(1.6);
      boss.radius *= 1.6;
      boss.specialCd = 2.5 + Math.random() * 1.5;
      boss.barId = ++bossBarIdCounter;
    } else if (Math.random() < HEROBRINE_CHANCE_MEGA) {
      boss = createHerobrineBoss(cfg);
      boss.bossIndex = 2;
      boss.isMegaBoss = true;
      boss.mesh.scale.multiplyScalar(1.8);
      boss.radius *= 1.8;
      boss.barId = ++bossBarIdCounter;
    } else {
      boss = createEnemy("boss", cfg);
      const chapterBossHp = getChapterHpMult(state.chapter);
      const chapterBossDmg = getChapterDamageMult(state.chapter);
      boss.hp *= MEGA_BOSS_HP_MULT * chapterBossHp * 1.5;
      boss.maxHp = boss.hp;
      boss.damage *= (1 + 2 * 0.25) * chapterBossDmg * 1.5 * 1.15;
      boss.mesh.scale.multiplyScalar(1.8);
      boss.radius *= 1.8;
      boss.bossIndex = 2;
      boss.isMegaBoss = true;
      boss.specialCd = 2.5 + Math.random() * 1.5;
      boss.barId = ++bossBarIdCounter;
    }
  } else {
    const roll = Math.random();
    const tryHerobrine = roll < HEROBRINE_CHANCE_CHAPTER;
    const tryAngel = !tryHerobrine && roll < HEROBRINE_CHANCE_CHAPTER + ANGEL_BOSS_CHANCE;
    if (tryHerobrine) {
      boss = createHerobrineBoss(cfg);
      const chapterBossHp = getChapterHpMult(state.chapter);
      const chapterBossDmg = getChapterDamageMult(state.chapter);
      const hpMult = Math.pow(2, bossIndex + 1) * chapterBossHp * 0.5 * 1.5;
      const sizeMult = (1 + bossIndex * 0.3);
      boss.hp *= hpMult;
      boss.maxHp = boss.hp;
      boss.damage *= (1 + bossIndex * 0.5) * chapterBossDmg * dmgMult * 1.15;
      boss.mesh.scale.multiplyScalar(sizeMult);
      boss.radius *= sizeMult;
      boss.bossIndex = bossIndex;
      boss.isMegaBoss = false;
      boss.isHerobrine = true;
      boss.specialCd = 2.5 + Math.random() * 1.5;
      boss.barId = ++bossBarIdCounter;
    } else if (tryAngel) {
      boss = createAngelBoss(cfg);
      const chapterBossHp = getChapterHpMult(state.chapter);
      const chapterBossDmg = getChapterDamageMult(state.chapter);
      const hpMult = Math.pow(2, bossIndex + 1) * chapterBossHp * 0.5 * 1.5;
      const sizeMult = (1 + bossIndex * 0.3);
      boss.hp *= hpMult;
      boss.maxHp = boss.hp;
      boss.damage *= (1 + bossIndex * 0.5) * chapterBossDmg * dmgMult * 1.12;
      boss.mesh.scale.multiplyScalar(sizeMult);
      boss.radius *= sizeMult;
      boss.bossIndex = bossIndex;
      boss.isMegaBoss = false;
      boss.isAngel = true;
      boss.barId = ++bossBarIdCounter;
    } else {
      state.currentBossIndex = bossIndex;
      boss = createEnemy("boss", cfg);
      state.currentBossIndex = undefined;
      const chapterBossHp = getChapterHpMult(state.chapter);
      const chapterBossDmg = getChapterDamageMult(state.chapter);
      const hpMult = Math.pow(2, bossIndex + 1) * chapterBossHp * 0.5 * 1.5;
      const sizeMult = (1 + bossIndex * 0.3);
      boss.hp *= hpMult;
      boss.maxHp = boss.hp;
      boss.damage *= (1 + bossIndex * 0.5) * chapterBossDmg * dmgMult * 1.15;
      boss.mesh.scale.multiplyScalar(sizeMult);
      boss.radius *= sizeMult;
      boss.bossIndex = bossIndex;
      boss.isMegaBoss = false;
      boss.specialCd = 2.5 + Math.random() * 1.5;
      boss.barId = ++bossBarIdCounter;
    }
  }
  if (!isMega) boss.isChapterFinalBoss = !!isChapterFinalBoss;
  const sizeMult = boss.mesh.scale.x;
  const isHerobrine = !!boss.isHerobrine;
  const isAngel = !!boss.isAngel;
  let a, r;
  if (typeof spawnSlot === "number" && spawnSlot >= 0 && spawnSlot <= 2) {
    a = spawnSlot * (Math.PI * 2 / 3);
    r = 26;
  } else {
    a = Math.random() * Math.PI * 2;
    r = isMega ? 12 : 28 + Math.random() * 20;
  }
  const bBound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 6;
  const x = clamp(player.mesh.position.x + Math.cos(a) * r, -bBound, bBound);
  const z = clamp(player.mesh.position.z + Math.sin(a) * r, -bBound, bBound);
  boss.mesh.position.set(x, getGroundHeight(x, z), z);
  enemies.push(boss);
  scene.add(boss.mesh);

  const label = isHerobrine ? "HEROBRINE" : (isAngel ? "ANGEL" : (isMega ? "MEGA BOSS" : `BOSS ${bossIndex + 1}`));
  spawnDamageText(boss.mesh.position, `âš¡ ${label}`, true, label);
  spawnBurst(boss.mesh.position, isHerobrine ? 0x88ff88 : (isAngel ? 0xffffee : 0xff3f4b), 12);
  spawnRing(boss.mesh.position, 7.2 * sizeMult, isHerobrine ? 0x44aa44 : (isAngel ? 0xffdd88 : 0xff3f4b), 0.5);
  spawnWave(boss.mesh.position, 8.0 * sizeMult, isHerobrine ? 0x66cc66 : (isAngel ? 0xffeeaa : 0xff3f4b));
  playSfx(160, 0.25);
  if (isMega) state.megaBossSpawned = true;
}

function updateSpawning(dt) {
  if (state.inTemple) return;
  if (shadowMode && !state.endlessMode) return; // Shadow mode: no normal spawning
  if (state.attackRoundActive) return;
  if (state.soulRoundActive) {
    state.soulRoundSpawnTimer -= dt;
    if (state.soulRoundSpawnTimer <= 0) {
      state.soulRoundSpawnTimer = 1.2;
      const n = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < n; i++) spawnSoulRoundEnemy((i / Math.max(1, n)) * Math.PI * 2 + (Math.random() - 0.5) * 0.6);
    }
    return;
  }
  if (state.hordeSurgeActive) {
    state.hordeSurgeSpawnTimer -= dt;
    if (state.hordeSurgeSpawnTimer <= 0) {
      state.hordeSurgeSpawnTimer = 0.45;
      const n = Math.random() < 0.4 ? 3 : 2;
      for (let i = 0; i < n; i++) spawnEnemy((i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5);
    }
    return;
  }
  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) return;
  const gameTimeSec = state.time || 0;
  const WAVE_LULL_INTERVAL = 24;
  const WAVE_LULL_DURATION = 3;
  const lastLull = state.lastWaveLullAt != null ? state.lastWaveLullAt : 0;
  if (gameTimeSec - lastLull >= WAVE_LULL_INTERVAL) {
    state.lastWaveLullAt = gameTimeSec;
    state.spawnTimer = WAVE_LULL_DURATION;
    return;
  }
  const stage = state.difficultyStage;
  const chapterT = state.chapterTime || 0;
  const ch = state.chapter || 1;
  const lvl = state.level || 0;
  let baseCd = Math.max(0.6, 5.2 - gameTimeSec * 0.007 - lvl * 0.005 - stage * 0.012);
  if (gameTimeSec < 120) baseCd *= (1.7 - 0.7 * (gameTimeSec / 120));
  if (lvl < 15) baseCd *= 3;
  baseCd *= 1.35;
  if (ch === 2) baseCd *= 0.78;
  if (ch === 3) baseCd *= 0.62;
  if (state.endlessMode) {
    const wave = Math.floor(state.endlessTime / 10);
    if (wave > state.endlessWave) {
      state.endlessWave = wave;
      const n = Math.min(10, 2 + state.endlessWave);
      for (let i = 0; i < n; i++) spawnEnemy(Math.random() * Math.PI * 2);
    }
    baseCd = Math.max(0.4, 1.2 - state.endlessWave * 0.04);
  } else {
    const maxPerSpawn = lvl >= 90 ? 12 : 10;
    const n = lvl < 8 ? 1 : lvl < 16 ? 2 : lvl < 26 ? 3 : Math.min(maxPerSpawn, 3 + Math.floor(lvl / 5));
    for (let i = 0; i < n; i++) spawnEnemy(Math.random() * Math.PI * 2);
  }
  state.spawnTimer = Math.max(0.55, baseCd);
  if (state.selectedMapId === "ice") state.spawnTimer *= 1.55;
}

const WEATHER_DURATION = 30;
const LIGHTNING_STRIKE_DELAY = 3.5;
const LIGHTNING_RADIUS = 4;
const LIGHTNING_DAMAGE = 35;
let snowParticles = [];
let mapSnowParticles = [];
let lastLightningSpawn = 0;
let chaosMeteorTimer = 0;
let chaosIceTimer = 0;

function getChapterMoveMult(ch) {
  return ch === 1 ? 1 : ch === 2 ? 0.9 : 0.8;
}
function getChapterEnemySpeedMult(ch) {
  return ch === 1 ? 0.88 : ch === 2 ? 1.05 : 1.28;
}
function getUnifiedEnemySpeed() {
  const lvl = state.level || 0;
  return 5.6 * (1 + lvl * 0.028);
}
function getChapterHpMult(ch) {
  return (ch === 1 ? 0.88 : ch === 2 ? 1.25 : 2.0) * 1.35;
}
function getChapterDamageMult(ch) {
  return ch === 1 ? 1 : ch === 2 ? 1.12 : 1.55;
}

function applyMapTheme(chapter) {
  if (!scene) return;
  const mapId = state.selectedMapId || state.currentMapId || "classic";
  if (mapId === "temple1" || mapId === "temple2") {
    scene.background = new THREE.Color(0x0a0808);
    scene.fog = new THREE.FogExp2(0x1a1210, 0.018);
    if (ground && ground.material) {
      ground.material.color.setHex(0x1a1510);
      if (ground.material.emissive) ground.material.emissive.setHex(0x080504);
    }
    renderer.toneMappingExposure = 0.72;
    return;
  }
  if (!ground) return;
  mapSnowParticles.forEach((m) => { scene.remove(m); });
  mapSnowParticles = [];

  if (mapId === "ice") {
    scene.background = new THREE.Color(0xa8c8e8);
    scene.fog = new THREE.FogExp2(0xc8e0f8, 0.011);
    ground.material.color.setHex(0xe0f0ff);
    if (ground.material.emissive) ground.material.emissive.setHex(0x6080a0);
    renderer.toneMappingExposure = 1.15;
    for (let i = 0; i < 100; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
      mesh.position.set((Math.random() - 0.5) * WORLD_HALF * 2, 6 + Math.random() * 28, (Math.random() - 0.5) * WORLD_HALF * 2);
      mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.3, -0.5 - Math.random() * 0.4, (Math.random() - 0.5) * 0.3);
      scene.add(mesh);
      mapSnowParticles.push(mesh);
    }
    return;
  }
  if (mapId === "desert") {
    scene.background = new THREE.Color(0xe8d0a0);
    scene.fog = new THREE.FogExp2(0xd8b888, 0.01);
    ground.material.color.setHex(0xd4a574);
    if (ground.material.emissive) ground.material.emissive.setHex(0x3a2818);
    renderer.toneMappingExposure = 1.2;
    for (let i = 0; i < 35; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 3, 3), new THREE.MeshBasicMaterial({ color: 0xc4a060, transparent: true, opacity: 0.7 }));
      mesh.position.set((Math.random() - 0.5) * WORLD_HALF * 2, 5 + Math.random() * 18, (Math.random() - 0.5) * WORLD_HALF * 2);
      mesh.userData.vel = new THREE.Vector3(0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.4);
      scene.add(mesh);
      mapSnowParticles.push(mesh);
    }
    return;
  }
  if (mapId === "forest") {
    scene.background = new THREE.Color(0x0d1a12);
    scene.fog = new THREE.FogExp2(0x1a3025, 0.011);
    ground.material.color.setHex(0x2a4a2a);
    if (ground.material.emissive) ground.material.emissive.setHex(0x081008);
    renderer.toneMappingExposure = 1.0;
    return;
  }
  if (mapId === "swamp") {
    scene.background = new THREE.Color(0x0d1812);
    scene.fog = new THREE.FogExp2(0x1a2820, 0.011);
    ground.material.color.setHex(0x2a4a2a);
    if (ground.material.emissive) ground.material.emissive.setHex(0x081008);
    renderer.toneMappingExposure = 0.92;
    return;
  }

  if (mapId === "classic") {
    if (chapter === 1) {
      scene.background = new THREE.Color(0x0d1812);
      scene.fog = new THREE.FogExp2(0x1a2820, 0.018);
      if (ground.material && !ground.material.vertexColors) {
        ground.material.color.setHex(0x2a4a2a);
        if (ground.material.emissive) ground.material.emissive.setHex(0x081008);
      }
      renderer.toneMappingExposure = 0.95;
    } else if (chapter === 2) {
      scene.background = new THREE.Color(0x251a35);
      scene.fog = new THREE.FogExp2(0x3d2a55, 0.012);
      if (ground.material) {
        ground.material.color.setHex(0x4a3568);
        if (ground.material.emissive) ground.material.emissive.setHex(0x150a22);
      }
      renderer.toneMappingExposure = 1.0;
      for (let i = 0; i < 55; i++) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), new THREE.MeshBasicMaterial({ color: 0xaa88cc }));
        mesh.position.set((Math.random() - 0.5) * WORLD_HALF * 2, 12 + Math.random() * 25, (Math.random() - 0.5) * WORLD_HALF * 2);
        mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.3, -0.5 - Math.random() * 0.4, (Math.random() - 0.5) * 0.3);
        scene.add(mesh);
        mapSnowParticles.push(mesh);
      }
    } else if (chapter === 3) {
      scene.background = new THREE.Color(0x351a1a);
      scene.fog = new THREE.FogExp2(0x4a2525, 0.013);
      if (ground.material) {
        ground.material.color.setHex(0x5a2a2a);
        if (ground.material.emissive) ground.material.emissive.setHex(0x220a0a);
      }
      renderer.toneMappingExposure = 0.88;
    }
  }
}

// === BONUS TIME (disabled: was too long) ===
const BONUS_DURATION = 0;
const BONUS_COOLDOWN = 99999;
let bonusOverlayEl = null;
let bonusCountdownEl = null;
let preBonusExposure = 1.0;
function updateBonusTime(dt) {
  if (!running || gameOver) return;
  const t = state.time;
  if (false && !state.bonusTime && t >= (state.nextBonusAt || 200)) {
    state.bonusTime = true;
    state.bonusTimeEnd = t + BONUS_DURATION;
    state.bonusTimeComboCount = 0;
    state.nextBonusAt = t + BONUS_DURATION + BONUS_COOLDOWN;
    preBonusExposure = renderer.toneMappingExposure;
    renderer.toneMappingExposure = Math.min(1.5, (renderer.toneMappingExposure || 1) * 1.25);
    spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "BONUS ZAMANI!", true, "BONUS ZAMANI!");
    spawnRing(player.mesh.position.clone(), 8, 0xffdd44, 0.6);
    playSfx(440, 0.15);
    if (!bonusOverlayEl) {
      bonusOverlayEl = document.createElement("div");
      bonusOverlayEl.id = "bonusOverlay";
      bonusOverlayEl.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:45;background:linear-gradient(180deg,rgba(180,140,40,0.12),transparent 35%, transparent 65%, rgba(180,120,20,0.1));";
      document.getElementById("hud").appendChild(bonusOverlayEl);
    }
    if (!bonusCountdownEl) {
      bonusCountdownEl = document.createElement("div");
      bonusCountdownEl.id = "bonusCountdown";
      bonusCountdownEl.style.cssText = "position:fixed;top:80px;left:50%;transform:translateX(-50%);font-family:var(--retro-font);font-size:11px;color:#ffdd44;text-shadow:0 0 8px #ffaa00;z-index:46;pointer-events:none;";
      document.getElementById("hud").appendChild(bonusCountdownEl);
    }
    bonusOverlayEl.style.display = "block";
    bonusCountdownEl.style.display = "block";
  }
  if (state.bonusTime) {
    const left = Math.max(0, state.bonusTimeEnd - t);
    if (bonusCountdownEl) bonusCountdownEl.textContent = "BONUS ZAMANI! " + Math.ceil(left) + " sn | Combo x" + (state.bonusTimeComboCount || 0);
    if (t >= state.bonusTimeEnd) {
      state.bonusTime = false;
      renderer.toneMappingExposure = preBonusExposure;
      if (bonusOverlayEl) bonusOverlayEl.style.display = "none";
      if (bonusCountdownEl) bonusCountdownEl.style.display = "none";
    }
  }
}

function updateWeather(dt) {
  if (!running || gameOver) return;
  const t = state.time;

  if (!state.weather && t > 60 && Math.random() < 0.00016) {
    const r = Math.random();
    const hasHeraldThunder = (stats.heraldOfThunder || 0) > 0;
    if (r < 0.35) state.weather = "rain";
    else if (r < 0.65) state.weather = "snow";
    else if (r < 0.85) state.weather = "wind";
    else if (r < 0.95 && hasHeraldThunder) state.weather = "lightning";
    else state.weather = "storm";
    state.weatherEndTime = t + WEATHER_DURATION;
    if (state.weather === "wind") {
      const angle = Math.random() * Math.PI * 2;
      state.windDir.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
    }
    if ((state.weather === "snow" || state.weather === "storm") && scene) {
      const count = state.weather === "storm" ? 120 : 80;
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        mesh.position.set((Math.random() - 0.5) * 80, 15 + Math.random() * 20, (Math.random() - 0.5) * 80);
        mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.5, -0.4 - Math.random() * 0.3, (Math.random() - 0.5) * 0.5);
        scene.add(mesh);
        snowParticles.push(mesh);
      }
    }
    if ((state.weather === "rain" || state.weather === "storm") && scene) {
      const count = state.weather === "storm" ? 100 : 90;
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), new THREE.MeshBasicMaterial({ color: 0x88aacc }));
        mesh.position.set((Math.random() - 0.5) * 70, 12 + Math.random() * 15, (Math.random() - 0.5) * 70);
        mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.25, -1.2 - Math.random() * 0.5, (Math.random() - 0.5) * 0.25);
        scene.add(mesh);
        snowParticles.push(mesh);
      }
    }
  }

  if (state.weather && t >= state.weatherEndTime) {
    state.weather = null;
    snowParticles.forEach((m) => { scene.remove(m); });
    snowParticles = [];
  }

  if (state.weather === "lightning" && (stats.heraldOfThunder || 0) > 0) {
    if (t - lastLightningSpawn >= 4) {
      lastLightningSpawn = t;
      const px = player.mesh.position.x;
      const pz = player.mesh.position.z;
      const pos = new THREE.Vector3(px + (Math.random() - 0.5) * 24, 0, pz + (Math.random() - 0.5) * 24);
      pos.x = clamp(pos.x, -WORLD_HALF + 5, WORLD_HALF - 5);
      pos.z = clamp(pos.z, -WORLD_HALF + 5, WORLD_HALF - 5);
      pos.y = sampleTerrainHeight(pos.x, pos.z) + 0.1;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(LIGHTNING_RADIUS * 0.2, LIGHTNING_RADIUS * 1.05, 32),
        new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(pos);
      scene.add(ring);
      state.lightningTelegraphs.push({ pos: pos.clone(), strikeAt: t + LIGHTNING_STRIKE_DELAY, mesh: ring, createdAt: t });
    }
    for (let i = state.lightningTelegraphs.length - 1; i >= 0; i--) {
      const lt = state.lightningTelegraphs[i];
      const timeLeft = lt.strikeAt - t;
      if (timeLeft > 0 && lt.mesh && lt.mesh.material) {
        const pulse = 0.7 + 0.25 * Math.sin(t * 5);
        lt.mesh.material.opacity = pulse;
        const scale = 0.85 + 0.15 * Math.sin(t * 4);
        lt.mesh.scale.setScalar(scale);
      }
      if (t >= lt.strikeAt) {
        const r = lt.radius ?? LIGHTNING_RADIUS;
        const dmg = lt.damage ?? LIGHTNING_DAMAGE;
        radialDamageEnemies(lt.pos, r, dmg);
        if (!lt.noPlayerDamage && player.mesh.position.distanceTo(lt.pos) < r + 2 && (!state.invincibleUntil || state.time >= state.invincibleUntil)) {
          state.lastAttacker = null;
          state.lastDamageType = "lightning";
          state.invincibleUntil = state.time + 0.22;
          const sh = stats.shield || 0;
          if (sh > 0) stats.shield = Math.max(0, sh - dmg * 0.5);
          else stats.hp -= dmg * 0.5;
          if (typeof triggerCameraShake === "function") triggerCameraShake(0.5);
        }
        spawnRing(lt.pos, r, lt.noPlayerDamage ? 0x4488ff : 0xffdd44, 0.3);
        spawnFlash(lt.pos, lt.noPlayerDamage ? 0x4488ff : 0xffdd44, 2, 0.2);
        playSfx(180, 0.15);
        scene.remove(lt.mesh);
        state.lightningTelegraphs.splice(i, 1);
      }
    }
  }

  if (state.weather === "snow" || state.weather === "storm") {
    snowParticles.forEach((m) => {
      m.position.add(m.userData.vel.clone().multiplyScalar(dt * (state.weather === "storm" ? 12 : 8)));
      if (m.position.y < -2) m.position.y += 25;
      if (Math.abs(m.position.x) > WORLD_HALF + 5) m.position.x *= -0.98;
      if (Math.abs(m.position.z) > WORLD_HALF + 5) m.position.z *= -0.98;
    });
  }
  if (state.weather === "storm" && t - lastLightningSpawn >= 2) {
    lastLightningSpawn = t;
    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;
    const pos = new THREE.Vector3(px + (Math.random() - 0.5) * 28, 0, pz + (Math.random() - 0.5) * 28);
    pos.x = clamp(pos.x, -WORLD_HALF + 5, WORLD_HALF - 5);
    pos.z = clamp(pos.z, -WORLD_HALF + 5, WORLD_HALF - 5);
    pos.y = sampleTerrainHeight(pos.x, pos.z) + 0.1;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(LIGHTNING_RADIUS * 0.2, LIGHTNING_RADIUS * 1.05, 32),
      new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    scene.add(ring);
    state.lightningTelegraphs.push({ pos: pos.clone(), strikeAt: t + LIGHTNING_STRIKE_DELAY * 0.85, mesh: ring, createdAt: t });
  }

  if ((state.selectedMapId || state.currentMapId) === "ice" && mapSnowParticles.length > 0) {
    mapSnowParticles.forEach((m) => {
      m.position.add(m.userData.vel.clone().multiplyScalar(dt * 10));
      if (m.position.y < -3) {
        m.position.y = 20 + Math.random() * 15;
        m.position.x = (Math.random() - 0.5) * WORLD_HALF * 2;
        m.position.z = (Math.random() - 0.5) * WORLD_HALF * 2;
      }
      if (Math.abs(m.position.x) > WORLD_HALF + 10) m.position.x *= -0.99;
      if (Math.abs(m.position.z) > WORLD_HALF + 10) m.position.z *= -0.99;
    });
  }
  const mapId = state.selectedMapId || state.currentMapId;
  if (mapId === "desert" && mapSnowParticles.length > 0) {
    mapSnowParticles.forEach((m) => {
      m.position.add(m.userData.vel.clone().multiplyScalar(dt * 12));
      if (m.position.x > WORLD_HALF + 5) m.position.x = -WORLD_HALF - 5;
      if (m.position.x < -WORLD_HALF - 5) m.position.x = WORLD_HALF + 5;
      if (m.position.z > WORLD_HALF + 5) m.position.z = -WORLD_HALF - 5;
      if (m.position.z < -WORLD_HALF - 5) m.position.z = WORLD_HALF + 5;
      if (m.position.y > 25) m.position.y = 5;
      if (m.position.y < 4) m.position.y = 20 + Math.random() * 8;
    });
  }
  if (mapId === "forest" && !state.weather && t > 12 && Math.random() < 0.0018) {
    state.weather = "rain";
    state.weatherEndTime = t + WEATHER_DURATION * 1.5;
    if (scene) {
      for (let i = 0; i < 140; i++) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 4), new THREE.MeshBasicMaterial({ color: 0x88aacc }));
        mesh.position.set((Math.random() - 0.5) * WORLD_HALF * 2, 10 + Math.random() * 20, (Math.random() - 0.5) * WORLD_HALF * 2);
        mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.25, -1.4 - Math.random() * 0.6, (Math.random() - 0.5) * 0.25);
        scene.add(mesh);
        snowParticles.push(mesh);
      }
    }
  }
  if (!state.weather && mapId !== "ice" && mapId === "classic" && t > 90 && Math.random() < 0.00012) {
    state.weather = "rain";
    state.weatherEndTime = t + WEATHER_DURATION;
    if (scene) {
      for (let i = 0; i < 70; i++) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), new THREE.MeshBasicMaterial({ color: 0x88aacc }));
        mesh.position.set((Math.random() - 0.5) * 70, 12 + Math.random() * 15, (Math.random() - 0.5) * 70);
        mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.2, -1.2 - Math.random() * 0.5, (Math.random() - 0.5) * 0.2);
        scene.add(mesh);
        snowParticles.push(mesh);
      }
    }
  }
  if (state.weather === "rain") {
    snowParticles.forEach((m) => {
      m.position.add(m.userData.vel.clone().multiplyScalar(dt * 10));
      if (m.position.y < -2) {
        m.position.y = 14 + Math.random() * 12;
        m.position.x = (Math.random() - 0.5) * (mapId === "forest" ? WORLD_HALF * 2 : 60);
        m.position.z = (Math.random() - 0.5) * (mapId === "forest" ? WORLD_HALF * 2 : 60);
      }
    });
  }
}

function spawnChaosMeteor() {
  if (projectiles.length >= MAX_PROJECTILES - 5) return;
  const x = (Math.random() - 0.5) * WORLD_HALF * 1.8;
  const z = (Math.random() - 0.5) * WORLD_HALF * 1.8;
  const groundY = sampleTerrainHeight(x, z);
  const impactPos = new THREE.Vector3(x, groundY + 0.15, z);
  const radius = 2.5;
  const telegraphRing = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.3, radius * 1.2, 32),
    new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0.88, side: THREE.DoubleSide })
  );
  telegraphRing.rotation.x = -Math.PI / 2;
  telegraphRing.position.copy(impactPos);
  scene.add(telegraphRing);
  const geo = new THREE.SphereGeometry(0.5, 8, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6b3510, emissive: 0xff3300, emissiveIntensity: 0.6, roughness: 0.7, metalness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 38, z);
  scene.add(mesh);
  projectiles.push({
    mesh, vel: new THREE.Vector3(0, -9, 0), life: 20, isChaosMeteor: true, meteorAge: 0,
    damage: 22 + state.difficultyStage * 4, radius, impacted: false, owner: "env",
    impactPos: impactPos.clone(), telegraphMesh: telegraphRing
  });
}

function spawnChaosIceBall() {
  if (projectiles.length >= MAX_PROJECTILES - 5) return;
  const x = (Math.random() - 0.5) * WORLD_HALF * 1.8;
  const z = (Math.random() - 0.5) * WORLD_HALF * 1.8;
  const geo = new THREE.SphereGeometry(0.4, 8, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x4488cc, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 35, z);
  scene.add(mesh);
  projectiles.push({
    mesh, vel: new THREE.Vector3(0, -22, 0), life: 20, isChaosIce: true, meteorAge: 0,
    damage: 14 + state.difficultyStage * 3, radius: 2.2, impacted: false, owner: "env"
  });
}

function updateChaos(dt) {
  if (!running || gameOver || paused) return;
  const t = state.time || 0;
  if (t < 90) return;
  const chaosScale = 1 + (t - 90) / 180;
  chaosMeteorTimer += dt;
  chaosIceTimer += dt;
  const meteorInterval = Math.max(3.5, 14 - t / 45) / chaosScale;
  const iceInterval = Math.max(2.8, 11 - t / 50) / chaosScale;
  if (chaosMeteorTimer >= meteorInterval) {
    chaosMeteorTimer = 0;
    spawnChaosMeteor();
  }
  if (chaosIceTimer >= iceInterval) {
    chaosIceTimer = 0;
    spawnChaosIceBall();
  }
}

function updateChapterAndBoss(dt) {
  if (state.inMegaArena || state.inTemple) return;
  state.chapterTime += dt;
  state.difficultyStage = state.chapter;

  const ct = state.chapterTime || 0;
  if (ct >= 600 && !state.realDifficultyNotifiedThisChapter) {
    state.realDifficultyNotifiedThisChapter = true;
    state.realDifficultyTier = 1;
    if (typeof showGameNotification === "function") showGameNotification("Iste gercek zorluk basladi! - HARD", { rainbow: true });
  }
  if (ct >= 720 && state.realDifficultyTier < 2) {
    state.realDifficultyTier = 2;
    if (typeof showGameNotification === "function") showGameNotification("HARDEST!", { rainbow: true });
  }
  if (ct >= 840 && state.realDifficultyTier < 3) {
    state.realDifficultyTier = 3;
    if (typeof showGameNotification === "function") showGameNotification("BONK!", { rainbow: true });
  }

  const ch = state.chapter || 1;
  const bossIndex = ch - 1;
  if (bossIndex >= 0 && bossIndex < 3) {
    const slots = [
      { time: CHAPTER_BOSS_TIME_3MIN, slot: 0 },
      { time: CHAPTER_BOSS_TIME_6MIN, slot: 1 },
      { time: CHAPTER_BOSS_TIME, slot: 2 }
    ];
    for (const { time, slot } of slots) {
      if (state.chapterTime >= time && !state.bossSlotsSpawnedThisChapter[slot]) {
        state.bossSlotsSpawnedThisChapter[slot] = true;
        state.bossSpawnedThisChapter[bossIndex] = true;
        spawnBoss(bossIndex, false, false, slot === 2);
      }
    }
    if (ct >= CHAPTER_BOSS_TIME - 25 && ct < CHAPTER_BOSS_TIME && !state.bossIncomingNotified && !state.bossSlotsSpawnedThisChapter[2]) {
      state.bossIncomingNotified = true;
      if (typeof showGameNotification === "function") showGameNotification("BOSS GELİYOR!", { duration: 4 });
    }
  }
}

function spawnPortal(pos) {
  if (portalMesh) { scene.remove(portalMesh); portalMesh = null; }
  const g = new THREE.Group();
  const groundY = getGroundHeight(pos.x, pos.z);
  g.position.set(pos.x, groundY, pos.z);
  const frameW = 10;
  const frameH = 24;
  const thick = 1.4;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a2a22, emissive: 0x061810, emissiveIntensity: 0.4, metalness: 0.5, roughness: 0.45 });
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(thick, frameH, thick * 1.2), frameMat);
  leftPillar.position.set(-frameW / 2 - thick * 0.5, frameH / 2, 0);
  const rightPillar = leftPillar.clone();
  rightPillar.position.x = frameW / 2 + thick * 0.5;
  const portalVoxel = placeVoxelProp("portal_frame", 0, 0, 0, 8, true);
  if (portalVoxel) g.add(portalVoxel);
  else g.add(leftPillar, rightPillar);
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(frameW + thick * 4, thick * 1.2, thick * 1.4), frameMat);
  topBeam.position.y = frameH;
  const bottomBeam = new THREE.Mesh(new THREE.BoxGeometry(frameW + thick * 2, thick * 0.8, thick * 1.2), frameMat);
  bottomBeam.position.y = 0;
  g.add(topBeam, bottomBeam);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0x88ffcc, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const portalFace = new THREE.Mesh(new THREE.PlaneGeometry(frameW - 0.4, frameH - 0.6), innerMat);
  portalFace.position.y = frameH / 2;
  g.add(portalFace);
  g.userData.portalFace = portalFace;
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x88ffcc, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(frameW * 0.4, frameW * 0.7, 45, 16), beamMat);
  beam.position.y = frameH / 2 + 22;
  g.add(beam);
  const light = new THREE.PointLight(0x88ffcc, 3, 80);
  light.position.y = frameH / 2 + 8;
  g.add(light);
  const sunBeamMat = new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const sunBeam = new THREE.Mesh(new THREE.CylinderGeometry(0, 35, 55, 8), sunBeamMat);
  sunBeam.position.y = 50;
  sunBeam.rotation.x = Math.PI / 2;
  g.add(sunBeam);
  const sunTarget = new THREE.Object3D();
  sunTarget.position.set(0, frameH / 2, 0);
  g.add(sunTarget);
  const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  sunLight.position.set(0, 60, 0);
  sunLight.target = sunTarget;
  g.add(sunLight);
  const redRingGeo = new THREE.RingGeometry(8, 14, 32);
  const redRingMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
  const redRing = new THREE.Mesh(redRingGeo, redRingMat);
  redRing.rotation.x = -Math.PI / 2;
  redRing.position.y = 0.02;
  g.add(redRing);
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.9, side: THREE.BackSide });
  const outlineLeft = new THREE.Mesh(new THREE.BoxGeometry(thick + 0.15, frameH + 0.15, thick * 1.2 + 0.15), outlineMat);
  outlineLeft.position.copy(leftPillar.position);
  const outlineRight = new THREE.Mesh(new THREE.BoxGeometry(thick + 0.15, frameH + 0.15, thick * 1.2 + 0.15), outlineMat);
  outlineRight.position.copy(rightPillar.position);
  g.add(outlineLeft, outlineRight);
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256; labelCanvas.height = 64;
  const lctx = labelCanvas.getContext("2d");
  lctx.font = "bold 40px Segoe UI, sans-serif";
  lctx.textAlign = "center";
  lctx.fillStyle = "#88ffcc";
  lctx.strokeStyle = "#000";
  lctx.lineWidth = 4;
  lctx.strokeText("BOLUM GECIDI", 128, 40);
  lctx.fillText("BOLUM GECIDI", 128, 40);
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }));
  labelSprite.scale.set(12, 3, 1);
  labelSprite.position.y = frameH + 4;
  g.add(labelSprite);
  portalMesh = g;
  scene.add(portalMesh);
  state.portalPos = pos.clone();
  state.portalActive = true;
  state.portalUnlocked = false;
  state.portalChargeTime = 0;
  state.portalVoidBossSpawned = false;
  if (typeof showGameNotification === "function") showGameNotification("BOLUM GECIDI ACILDI! Yesil kapidan gec, sonraki bolume gec.");
}

function spawnVoidBossAt(pos) {
  if (enemies.length >= getMaxEnemies()) return;
  const cfg = { ...tierConfig.boss, hp: tierConfig.boss.hp * 1.2, damage: tierConfig.boss.damage * 1.1, xp: tierConfig.boss.xp * 2 };
  const boss = createEnemy("boss", cfg, { voxelId: "boss_void" });
  boss.mesh.position.set(pos.x, getGroundHeight(pos.x, pos.z), pos.z);
  boss.bossIndex = 2;
  boss.isVoidBoss = true;
  boss.name = "Harita Bosu";
  boss.hp *= 0.9 * 1.5;
  boss.maxHp = boss.hp;
  boss.barId = ++bossBarIdCounter;
  boss.mesh.scale.multiplyScalar(1.4);
  boss.radius *= 1.4;
  enemies.push(boss);
  scene.add(boss.mesh);
  spawnDamageText(boss.mesh.position, "HARITA BOSU - KACALIM KESELIM!", true, "HARITA BOSU");
  spawnTelegraph(player.mesh.position.clone(), 4, 25, 1.2, "enemy");
  spawnTelegraph(player.mesh.position.clone().add(new THREE.Vector3(3, 0, 2)), 3.5, 18, 1.4, "enemy");
  spawnTelegraph(player.mesh.position.clone().add(new THREE.Vector3(-2, 0, -3)), 3.5, 18, 1.5, "enemy");
  return boss;
}

function spawnTempleBossAt(pos) {
  if (enemies.length >= getMaxEnemies()) return;
  const cfg = { ...tierConfig.boss, hp: tierConfig.boss.hp * 1.1, damage: tierConfig.boss.damage * 1.05, xp: tierConfig.boss.xp * 1.5 };
  const boss = createEnemy("boss", cfg, { voxelId: "boss_temple" });
  boss.mesh.position.set(pos.x, getGroundHeight(pos.x, pos.z), pos.z);
  boss.bossIndex = state.templeIndex === 1 ? 0 : 1;
  boss.isTempleBoss = true;
  boss.name = "Tapinak Bosu";
  boss.hp *= 1.2;
  boss.maxHp = boss.hp;
  boss.barId = ++bossBarIdCounter;
  boss.mesh.scale.multiplyScalar(1.3);
  boss.radius *= 1.3;
  enemies.push(boss);
  scene.add(boss.mesh);
  spawnDamageText(boss.mesh.position, "TAPINAK BOSU - KES!", true, "TAPINAK BOSU");
  return boss;
}

function enterTemple(templeIndex) {
  state.inTemple = true;
  state.templeIndex = templeIndex;
  for (let i = enemies.length - 1; i >= 0; i--) {
    scene.remove(enemies[i].mesh);
    enemies.splice(i, 1);
  }
  buildWorldTemple(templeIndex);
  applyMapTheme(state.chapter);
  player.mesh.position.set(0, getGroundHeight(0, 0), 0);
  player.vel.set(0, 0, 0);
  player.vy = 0;

  const bound = TEMPLE_HALF - 8;
  if (templeIndex === 1) {
    const cfg = tierConfig.normal;
    for (let i = 0; i < TEMPLE_SPIDER_COUNT; i++) {
      const e = createEnemy("normal", cfg, { forceBeastType: "spider" });
      const x = (Math.random() - 0.5) * 2 * bound;
      const z = (Math.random() - 0.5) * 2 * bound;
      e.mesh.position.set(x, getGroundHeight(x, z), z);
      e.spawnDelay = 0.2;
      e.flankBias = (Math.random() - 0.5) * 0.35;
      enemies.push(e);
      scene.add(e.mesh);
    }
    if (typeof showGameNotification === "function") showGameNotification("TAPINAK 1 - Orumcekler! Bosu cagir, kes, sonra portala gir.");
  } else {
    const purpleTypes = ["purpleShadow", "purpleSkeleton", "purpleSlime"];
    for (let i = 0; i < TEMPLE_PURPLE_COUNT; i++) {
      const cfg = tierConfig.rare;
      const type = purpleTypes[Math.floor(Math.random() * purpleTypes.length)];
      const e = createEnemy("rare", cfg, { forceBeastType: type });
      e.hp *= 1.4;
      e.maxHp = e.hp;
      e.damage *= 1.35;
      e.xp *= 1.5;
      e.speed *= 1.1;
      const x = (Math.random() - 0.5) * 2 * bound;
      const z = (Math.random() - 0.5) * 2 * bound;
      e.mesh.position.set(x, getGroundHeight(x, z), z);
      e.spawnDelay = 0.2;
      e.flankBias = (Math.random() - 0.5) * 0.35;
      enemies.push(e);
      scene.add(e.mesh);
    }
    if (typeof showGameNotification === "function") showGameNotification("TAPINAK 2 - Mor yaratiklar! Bosu kes, portala gir.");
  }

  spawnPortal(new THREE.Vector3(0, 0, 0));
}

function updatePortal(dt) {
  if (!state.portalActive || !portalMesh || !state.portalPos) return;
  portalMesh.rotation.y += dt * 1.2;
  if (portalMesh.userData && portalMesh.userData.portalFace && portalMesh.userData.portalFace.material.opacity !== undefined)
    portalMesh.userData.portalFace.material.opacity = 0.7 + Math.sin(state.time * 4) * 0.2;
  const dx = player.mesh.position.x - state.portalPos.x;
  const dz = player.mesh.position.z - state.portalPos.z;
  const inZone = dx * dx + dz * dz < 49;
  const portalHintEl = document.getElementById("portalHint");
  if (!state.portalVoidBossSpawned) {
    if (inZone) {
      state.portalChargeTime = (state.portalChargeTime || 0) + dt;
      if (portalHintEl) {
        portalHintEl.classList.remove("hidden");
        portalHintEl.classList.add("visible");
        const left = Math.max(0, 3 - state.portalChargeTime);
        const label = state.inTemple ? "Tapinak bosu" : "Harita bosu";
        portalHintEl.textContent = left > 0 ? `Portal: Bekle ${left.toFixed(1)} sn (${label} cagrilacak)` : `${label} doguyor!`;
      }
      if (state.portalChargeTime >= 3) {
        state.portalVoidBossSpawned = true;
        if (state.inTemple) {
          spawnTempleBossAt(state.portalPos.clone());
          if (portalHintEl) portalHintEl.textContent = "TAPINAK BOSU - Kes!";
        } else {
          spawnVoidBossAt(state.portalPos.clone());
          if (portalHintEl) portalHintEl.textContent = "HARITA BOSU - Kacalim keselim!";
        }
      }
    } else {
      state.portalChargeTime = 0;
      if (portalHintEl) { portalHintEl.classList.add("hidden"); portalHintEl.classList.remove("visible"); }
    }
  } else {
    const voidAlive = enemies.some((e) => e.isVoidBoss);
    const templeBossAlive = state.inTemple && enemies.some((e) => e.isTempleBoss);
    if (!voidAlive && !templeBossAlive) state.portalUnlocked = true;
    if (portalHintEl) {
      portalHintEl.classList.remove("hidden");
      portalHintEl.classList.add("visible");
      portalHintEl.textContent = state.portalUnlocked ? "PORTAL ACIK - Iceri gir (Gec!)" : (state.inTemple ? "Tapinak bosunu kes!" : "Harita bosunu kes!");
    }
  }
  if (state.portalUnlocked && inZone) enterPortal();
}

function enterPortal() {
  if (!state.portalActive || !state.portalUnlocked) return;
  state.portalsEntered = (state.portalsEntered || 0) + 1;
  state.portalActive = false;
  state.portalUnlocked = false;
  if (portalMesh) { scene.remove(portalMesh); portalMesh = null; }
  state.portalPos = null;
  playSfxLevel();

  if (state.inTemple) {
    state.inTemple = false;
    state.templeIndex = 0;
    state.chapter += 1;
    state.chapterTime = 0;
    state.bossSpawnedThisChapter = [false, false, false];
    state.bossSlotsSpawnedThisChapter = [false, false, false];
    state.bossIncomingNotified = false;
    state.realDifficultyNotifiedThisChapter = false;
    state.realDifficultyTier = 0;
    for (let i = enemies.length - 1; i >= 0; i--) {
      scene.remove(enemies[i].mesh);
      enemies.splice(i, 1);
    }
    clearCurrentWorld();
    buildWorld(state.selectedMapId || "classic");
    player.mesh.position.set(0, sampleTerrainHeight(0, 0), 0);
    player.vel.set(0, 0, 0);
    player.vy = 0;
    applyMapTheme(state.chapter);
    state.spawnTimer = 1.2;
    const chapterNames = { 1: "BOLUM 1", 2: "BOLUM 2 - KARLI HARITA", 3: "BOLUM 3 - SOĞUK HARITA" };
    const chapterMessages = { 2: "Well played! Bolum 2'ye gectin.", 3: "Bolum 3'e gectin. Son savas!" };
    spawnWave(player.mesh.position, 8, state.chapter === 2 ? 0xe8f4ff : 0x88aacc);
    spawnDamageText(player.mesh.position, chapterNames[state.chapter] || "BOLUM " + state.chapter, true, chapterNames[state.chapter] || "BOLUM " + state.chapter);
    if (typeof showGameNotification === "function" && chapterMessages[state.chapter]) showGameNotification(chapterMessages[state.chapter]);
    const el = document.createElement("div");
    el.className = "chapterTransitionText";
    el.textContent = chapterMessages[state.chapter] || ("Bolum " + state.chapter);
    document.body.appendChild(el);
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 3500);
    return;
  }

  if (state.chapter < MAX_CHAPTER) {
    state.chapter += 1;
  state.chapterTime = 0;
  state.bossSpawnedThisChapter = [false, false, false];
  state.bossSlotsSpawnedThisChapter = [false, false, false];
  state.bossIncomingNotified = false;
  state.realDifficultyNotifiedThisChapter = false;
    state.realDifficultyTier = 0;
    for (let i = enemies.length - 1; i >= 0; i--) {
      scene.remove(enemies[i].mesh);
      enemies.splice(i, 1);
    }
    player.mesh.position.set(0, sampleTerrainHeight(0, 0), 0);
    player.vel.set(0, 0, 0);
    player.vy = 0;
    applyMapTheme(state.chapter);
    state.spawnTimer = 1.2;
    const chapterNames = { 1: "BOLUM 1", 2: "BOLUM 2 - KARLI HARITA", 3: "BOLUM 3 - SOĞUK HARITA" };
    const chapterFlavor = { 2: "Bolum 2'ye adim attin...", 3: "Bolum 3'e adim attin... Son savas yaklasiyor." };
    spawnWave(player.mesh.position, 8, state.chapter === 2 ? 0xe8f4ff : 0x88aacc);
    spawnDamageText(player.mesh.position, chapterNames[state.chapter] || "BOLUM " + state.chapter, true, chapterNames[state.chapter] || "BOLUM " + state.chapter);
    if (chapterFlavor[state.chapter]) {
      const el = document.createElement("div");
      el.className = "chapterTransitionText";
      el.textContent = chapterFlavor[state.chapter];
      document.body.appendChild(el);
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 3500);
    }
  } else {
    state.inMegaArena = true;
    state.megaBossSpawned = false;
    for (let i = enemies.length - 1; i >= 0; i--) {
      scene.remove(enemies[i].mesh);
      enemies.splice(i, 1);
    }
    spawnMegaArenaWall();
    spawnWave(player.mesh.position, 12, 0xff4444);
    spawnDamageText(player.mesh.position, "BOSS ODASI", true, "BOSS ODASI");
    if (typeof showGameNotification === "function") showGameNotification("3 portal: ZONK Avatari!");
    spawnBoss(2);
  }
}

function spawnMegaArenaWall() {
  if (megaArenaWall || !mapGroup || !player.mesh) return;
  const cx = player.mesh.position.x;
  const cz = player.mesh.position.z;
  const R = 58;
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x3a1822, emissive: 0x1a0810, roughness: 0.92 });
  const segs = 20;
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const x = cx + Math.cos(a) * R;
    const z = cz + Math.sin(a) * R;
    const y = getGroundHeight(x, z);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(20, 14, 3.2), mat);
    wall.position.set(x, y + 7, z);
    wall.lookAt(cx, y + 7, cz);
    g.add(wall);
  }
  mapGroup.add(g);
  megaArenaWall = g;
  state.megaArenaCenter = { x: cx, z: cz, r: R - 4 };
}

function trySwapBossPhase2(e) {
  if (!e || e._phase2 || !e.isBoss || !e.mesh) return;
  if (e.hp > (e.maxHp || 1) * 0.5) return;
  const id = e.mesh.userData.voxelId;
  if (!id || /_p2$/.test(id)) { e._phase2 = true; return; }
  const p2 = id + "_p2";
  if (!hasVoxel(p2)) { e._phase2 = true; return; }
  const g = e.mesh;
  const savedScale = g.scale.clone();
  const kids = g.children.slice();
  for (let i = 0; i < kids.length; i++) {
    const c = kids[i];
    if (c === e.hpBar || c === e.nameLabel) continue;
    g.remove(c);
  }
  g.scale.setScalar(1);
  attachVoxelModel(g, p2, e.radius * 2.2, e.radius, 1);
  g.scale.copy(savedScale);
  e._phase2 = true;
  spawnRing(g.position, 6.5, 0xff3344, 0.4);
  spawnDamageText(g.position.clone().add(new THREE.Vector3(0, 3, 0)), "FAZ 2", true, "FAZ 2");
}

function updateAim() {
  const dir = new THREE.Vector3(
    Math.sin(camYaw) * Math.cos(camPitch),
    Math.sin(camPitch),
    Math.cos(camYaw) * Math.cos(camPitch)
  ).normalize();
  player.aimDir.copy(dir.setY(0).normalize());
}

function isPlayerInWater() {
  if (!state.waterMeshes || state.waterMeshes.length === 0) return null;
  var origin = player.mesh.position.clone();
  origin.y += 0.8;
  var dir = new THREE.Vector3(0, -1, 0);
  raycaster.set(origin, dir);
  var hits = raycaster.intersectObjects(state.waterMeshes, true);
  if (hits.length > 0 && hits[0].distance < 2.5) {
    return { inWater: true, waterY: hits[0].point.y };
  }
  return null;
}

function resolvePlayerCollision(nextPos) {
  let bound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 2;
  if (state.currentMapId === "temple1" || state.currentMapId === "temple2") bound = TEMPLE_HALF - 2;
  nextPos.x = clamp(nextPos.x, -bound, bound);
  nextPos.z = clamp(nextPos.z, -bound, bound);
  if (state.inMegaArena && state.megaArenaCenter) {
    const c = state.megaArenaCenter;
    const dx = nextPos.x - c.x, dz = nextPos.z - c.z;
    const d = Math.hypot(dx, dz);
    if (d > c.r) {
      nextPos.x = c.x + dx / d * c.r;
      nextPos.z = c.z + dz / d * c.r;
    }
  }
  var margin = 0.12;
  for (var iter = 0; iter < 6; iter++) {
    var changed = false;
    for (var i = 0; i < colliders.length; i++) {
      var c = colliders[i];
      var dx = nextPos.x - c.x;
      var dz = nextPos.z - c.z;
      var d = Math.hypot(dx, dz);
      var min = c.r + PLAYER_RADIUS + margin;
      if (d < min) {
        if (d < 0.001) {
          nextPos.x += 0.05;
          nextPos.z += 0.05;
          d = Math.hypot(nextPos.x - c.x, nextPos.z - c.z);
        }
        if (d > 0.001) {
          var push = (min - d) / d;
          nextPos.x += dx * push;
          nextPos.z += dz * push;
          changed = true;
        }
      }
    }
    nextPos.x = clamp(nextPos.x, -bound, bound);
    nextPos.z = clamp(nextPos.z, -bound, bound);
    if (!changed) break;
  }
}

function getNearestEnemy(range) {
  let nearest = null;
  let best = range * range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e._dead || (e.hp != null && e.hp <= 0)) continue;
    const ePos = e.mesh.position;
    const dx = ePos.x - player.mesh.position.x;
    const dz = ePos.z - player.mesh.position.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < best) { best = d2; nearest = e; }
  }
  return nearest;
}

function makeBananaMesh(r) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0x886600, emissiveIntensity: 0.2, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.5, r * 1.4, 6), mat);
  body.rotation.z = 0.4;
  body.position.x = r * 0.3;
  g.add(body);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(r * 0.35, 6, 6), mat);
  tip.position.set(r * 0.9, 0, 0);
  g.add(tip);
  return g;
}
function makeBoomerangMesh(r) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xcc9966, emissive: 0x442200, emissiveIntensity: 0.15, roughness: 0.5 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(r * 1.2, r * 0.15, r * 0.4), mat);
  return mesh;
}
function makeShurikenMesh(r) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x888899, emissive: 0x222233, metalness: 0.6, roughness: 0.3 });
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, r * 0.12, r * 0.35), mat);
  for (let i = 0; i < 4; i++) {
    const b = blade.clone();
    b.rotation.y = (i / 4) * Math.PI * 2;
    g.add(b);
  }
  return g;
}

function makeFireballMesh(rad) {
  const g = new THREE.Group();
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xff6622, emissive: 0xff3300, emissiveIntensity: 0.9, roughness: 0.2 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(rad, 10, 8), coreMat);
  g.add(core);
  const outerMat = new THREE.MeshBasicMaterial({ color: 0xff9944, transparent: true, opacity: 0.35 });
  const outer = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.6, 8, 6), outerMat);
  g.add(outer);
  for (let i = 0; i < 3; i++) {
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.4 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.5, rad * 1.2, 4), flameMat);
    flame.position.set(Math.cos(i * 2.09) * rad * 0.5, Math.sin(i * 2.09) * rad * 0.5, -rad * 0.4);
    flame.rotation.x = Math.PI * 0.5;
    g.add(flame);
  }
  return g;
}
function makeCometMesh(rad) {
  const g = new THREE.Group();
  const headMat = new THREE.MeshStandardMaterial({ color: 0x88ddff, emissive: 0x2288cc, emissiveIntensity: 0.8, roughness: 0.15, metalness: 0.2 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(rad, 10, 8), headMat);
  g.add(head);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0x66bbff, transparent: true, opacity: 0.3 });
  const tail = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.7, rad * 3, 6), tailMat);
  tail.position.z = -rad * 1.8;
  tail.rotation.x = Math.PI * 0.5;
  g.add(tail);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xaaeeff, transparent: true, opacity: 0.5 });
  const spark = new THREE.Mesh(new THREE.OctahedronGeometry(rad * 0.4, 0), sparkMat);
  spark.position.z = -rad * 0.6;
  g.add(spark);
  return g;
}
function makeFrostballMesh(rad) {
  const g = new THREE.Group();
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x99ddff, emissive: 0x3388bb, emissiveIntensity: 0.7, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.85 });
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(rad * 1.1, 0), crystalMat);
  g.add(crystal);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  const inner = new THREE.Mesh(new THREE.OctahedronGeometry(rad * 0.5, 0), innerMat);
  inner.rotation.y = Math.PI / 4;
  g.add(inner);
  for (let i = 0; i < 4; i++) {
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xccf0ff, emissive: 0x4499cc, emissiveIntensity: 0.5 });
    const spike = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.15, rad * 0.6, 4), spikeMat);
    const ang = (i / 4) * Math.PI * 2;
    spike.position.set(Math.cos(ang) * rad * 0.9, Math.sin(ang) * rad * 0.9, 0);
    spike.rotation.z = ang - Math.PI / 2;
    g.add(spike);
  }
  return g;
}

function makeArrowMesh(rad, type) {
  const g = new THREE.Group();
  let shaftColor = 0x8b7355, tipColor = 0x555555, emissive = 0x1a1a1a;
  if (type === "arrow_shock") { shaftColor = 0x6688aa; tipColor = 0xaaccff; emissive = 0x224466; }
  else if (type === "arrow_burn") { shaftColor = 0xaa5533; tipColor = 0xff8844; emissive = 0x442208; }
  else if (type === "arrow_freeze") { shaftColor = 0x88aacc; tipColor = 0xccffff; emissive = 0x224466; }
  const shaftMat = new THREE.MeshStandardMaterial({ color: shaftColor, emissive, emissiveIntensity: 0.2, roughness: 0.6, metalness: 0.05 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.12, rad * 0.14, rad * 2.2, 6), shaftMat);
  shaft.rotation.x = Math.PI / 2;
  g.add(shaft);
  const tipMat = new THREE.MeshStandardMaterial({ color: tipColor, emissive: emissive, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.2 });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.2, rad * 0.6, 5), tipMat);
  tip.rotation.x = -Math.PI / 2;
  tip.position.z = rad * 1.4;
  g.add(tip);
  return g;
}

function countArrowProjectiles() {
  let n = 0;
  for (let i = 0; i < projectiles.length; i++) if (projectiles[i].shape && projectiles[i].shape.startsWith("arrow")) n++;
  return n;
}

function spawnProjectile(opts) {
  return withSharedGeo(function () { return spawnProjectileInner(opts); });
}
function spawnProjectileInner(opts) {
  if (projectiles.length >= MAX_PROJECTILES) return;
  if (opts.shape) {
    const isArrow = opts.shape.startsWith("arrow");
    const cap = isArrow ? MAX_ARROW_PROJECTILES : MAX_PROJECTILES_PER_SKILL;
    let sameKind = 0;
    if (isArrow) sameKind = countArrowProjectiles();
    else for (let i = 0; i < projectiles.length; i++) { if (projectiles[i].shape === opts.shape) sameKind++; }
    if (sameKind >= cap) return;
  }
  let baseSpeed = opts.speed ?? stats.projectileSpeed ?? 20;
  const levelScale = 0.62 + 0.38 * Math.min(1, (state.level || 1) / 14);
  baseSpeed = baseSpeed * levelScale;
  const speed = baseSpeed * (stats.projectileSpeedMult || 1);
  const rad = opts.radius || 0.16;
  let mesh = (opts.shape && PROJ_POOL_SHAPES[opts.shape]) ? acquireProjMesh(opts.shape) : null;
  if (mesh) {
    const br = mesh.userData.baseRad || rad;
    const bs = mesh.userData.baseScale != null ? mesh.userData.baseScale : 1;
    mesh.scale.setScalar((rad / br) * bs);
    if (opts.shape === "shuriken") mesh.rotation.x = Math.PI / 2;
  }
  if (!mesh) {
  if (opts.shape === "fireball") {
    mesh = makeFireballMesh(rad);
  } else if (opts.shape === "comet") {
    mesh = makeCometMesh(rad);
  } else if (opts.shape === "frostball") {
    mesh = makeFrostballMesh(rad);
  } else if (opts.shape === "banana") {
    mesh = makeBananaMesh(rad * 5);
    mesh.scale.setScalar(0.2);
  } else if (opts.shape === "balloon") {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.2, 10, 8), new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x2288cc, emissiveIntensity: 0.3, transparent: true, opacity: 0.9 }));
  } else if (opts.shape === "boomerang") {
    mesh = makeBoomerangMesh(rad * 4);
    mesh.scale.setScalar(0.25);
  } else if (opts.shape === "shuriken") {
    mesh = makeShurikenMesh(rad * 3);
    mesh.scale.setScalar(0.35);
    mesh.rotation.x = Math.PI / 2;
  } else if (opts.shape === "bomb") {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.4, 10, 8), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, emissive: 0x441100, emissiveIntensity: 0.25, roughness: 0.85, metalness: 0.15 }));
  } else if (opts.shape && opts.shape.startsWith("arrow")) {
    mesh = makeArrowMesh(rad, opts.shape);
  } else {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(rad, 10, 8), new THREE.MeshStandardMaterial({ color: opts.color || 0xffffff, emissive: opts.emissive || 0x202020, roughness: 0.25, metalness: 0.05 }));
  }
  if (opts.shape && PROJ_POOL_SHAPES[opts.shape]) {
    mesh.userData.poolKey = opts.shape;
    mesh.userData.baseRad = rad;
    mesh.userData.baseScale = mesh.scale.x;
  }
  }
  mesh.position.copy(opts.position);
  // Launch flash at spawn position (skip for arrow to save effects)
  if (opts.shape !== "arrow" && !opts.shape?.startsWith("arrow")) {
    const launchGlow = new THREE.Mesh(new THREE.SphereGeometry(rad * 2.5, 8, 6), new THREE.MeshBasicMaterial({ color: opts.color || 0xffffff, transparent: true, opacity: 0.6 }));
    launchGlow.position.copy(opts.position);
    scene.add(launchGlow);
    effects.push({ type: "flash", mesh: launchGlow, life: 0.12, total: 0.12 });
  }
  scene.add(mesh);
  const trailType = opts.shape === "fireball" ? "fire" : (opts.shape === "frostball" ? "ice" : (opts.shape === "comet" ? "ice" : (opts.shape === "shuriken" ? "electric" : (opts.shape === "arrow_burn" ? "fire" : (opts.shape === "arrow_freeze" ? "ice" : (opts.shape === "arrow_shock" ? "electric" : "default"))))));
  const damageType = opts.shape === "fireball" ? "fire" : (opts.shape === "frostball" || opts.shape === "comet" ? "ice" : (opts.shape === "shuriken" ? "lightning" : (opts.shape === "arrow_burn" ? "fire" : (opts.shape === "arrow_freeze" ? "ice" : (opts.shape === "arrow_shock" ? "lightning" : (opts.damageType || null))))));
  let vel = opts.direction.clone().normalize().multiplyScalar(speed);
  if (opts.shape === "bomb") {
    const arcUp = opts.arcUp ?? 10;
    vel = new THREE.Vector3(opts.direction.x * speed, arcUp, opts.direction.z * speed);
  }
  const proj = { mesh, from: "player", damage: opts.damage, vel, life: opts.life || 2, radius: rad, pierce: opts.pierce || 0, aoe: opts.aoe || 0, crit: opts.crit || false, frost: opts.frost, shards: opts.shards, stun: opts.stun, trailTimer: 0, trailColor: opts.color || 0xffffff, trailType, damageType };
  if (opts.shape) proj.shape = opts.shape;
  if (opts.ricocheted) proj.ricocheted = true;
  if (opts.boomerang) {
    proj.isBoomerang = true;
    proj.origin = opts.position.clone();
    proj.phase = "out";
    proj.range = opts.range || 14;
    proj.speed = speed;
  }
  if (opts.shape === "bomb") {
    proj.shape = "bomb";
    proj.explosionRadius = opts.explosionRadius ?? 4;
  }
  projectiles.push(proj);
  playSfx(440 + Math.random() * 60, 0.04, 0.55);
}

function spawnLineShot(dir, damage, length, width, speed) {
  if (projectiles.length >= MAX_PROJECTILES) return;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, width * 0.6, length),
    new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x2266cc, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.3 })
  );
  mesh.position.copy(player.mesh.position).add(new THREE.Vector3(0, 1.1, 0)).addScaledVector(dir, length * 0.5);
  mesh.lookAt(mesh.position.clone().add(dir));
  scene.add(mesh);
  const vel = dir.clone().multiplyScalar(speed * (stats.projectileSpeedMult || 1));
  projectiles.push({
    mesh,
    vel,
    life: 0.28,
    isLineShot: true,
    damage,
    length,
    width,
    hitEnemies: new Set(),
    owner: "player",
  });
  playSfx(620, 0.08, 0.55);
}

function spawnLaser(dir, damage, range, width, duration) {
  if (projectiles.length >= MAX_PROJECTILES) return;
  const origin = player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0));
  const end = origin.clone().addScaledVector(dir, range);
  const g = new THREE.Group();
  g.position.copy(origin);
  const dirNorm = dir.clone().normalize();
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirNorm);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.4, width * 0.5, range, 12),
    new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.98 })
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(0, range * 0.5, 0);
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.9, width * 1.0, range, 12),
    new THREE.MeshBasicMaterial({ color: 0xff6666, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  glow.rotation.x = Math.PI / 2;
  glow.position.set(0, range * 0.5, 0);
  g.add(mesh);
  g.add(glow);
  scene.add(g);
  projectiles.push({
    mesh: g,
    life: duration,
    isLaser: true,
    damage,
    range,
    width,
    origin,
    dir: dir.clone(),
    hitEnemies: new Set(),
    owner: "player",
  });
}

function spawnLightBeam(dir, damage, range, width, duration) {
  if (projectiles.length >= MAX_PROJECTILES) return;
  const origin = player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0));
  const g = new THREE.Group();
  g.position.copy(origin);
  const dirNorm = dir.clone().normalize();
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirNorm);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.4, width * 0.6, range, 12),
    new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.9 })
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(0, range * 0.5, 0);
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 1.1, width * 1.2, range, 12),
    new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  glow.rotation.x = Math.PI / 2;
  glow.position.set(0, range * 0.5, 0);
  g.add(mesh);
  g.add(glow);
  scene.add(g);
  projectiles.push({
    mesh: g,
    life: duration,
    isLightBeam: true,
    damage,
    range,
    width,
    origin,
    dir: dir.clone(),
    hitEnemies: new Set(),
    owner: "player",
  });
  playSfx(720, 0.07, 0.55);
}

function spawnConeBlast(origin, aimDir, damage, range, halfAngle) {
  sectorDamageEnemies(origin, aimDir, range, halfAngle, damage * (stats.projectileDamageMult || 1));
  const innerR = range * 0.2, outerR = range * 1.0;
  const arcAngle = halfAngle * 2;
  const geom = new THREE.RingGeometry(innerR, outerR, 20, 1, 0, arcAngle);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff8844, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = -Math.atan2(aimDir.x, aimDir.z);
  const group = new THREE.Group();
  group.position.copy(origin).setY((origin.y || 0) + 0.4);
  group.add(mesh);
  scene.add(group);
  effects.push({ type: "coneBlast", mesh: group, life: 0.25, total: 0.25 });
  spawnRing(origin, range * 0.7, 0xff6622, 0.2);
  playSfx(380, 0.1, 0.55);
}

function spawnSmiteRing(enemy) {
  const pos = enemy.mesh.position.clone();
  const halfH = (enemy.radius || 1) * 0.9;
  pos.y += halfH;
  const r = (abilityState.smite && abilityState.smite.radius) || 2;
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.7, r, 24), ringMat);
  ring.position.copy(pos);
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  effects.push({ type: "smiteRing", mesh: ring, life: 0.3, total: 0.3 });
  spawnFlash(pos, 0xffdd44, 0.6, 0.2);
  playSfx(520, 0.08, 0.6);
}

function spawnKineticBlast(sourceEnemy) {
  const kb = abilityState.kineticBlast;
  if (!kb || kb.level <= 0) return;
  const maxTargets = Math.min(5, kb.maxTargets || 3);
  const range = 14;
  const candidates = [];
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e._dead || (e.hp != null && e.hp <= 0)) continue;
    const d = e.mesh.position.distanceTo(sourceEnemy.mesh.position);
    if (d <= range) candidates.push({ e, d });
  }
  candidates.sort((a, b) => a.d - b.d);
  const targets = candidates.slice(0, maxTargets).map((c) => c.e);
  if (targets.length === 0) return;
  const baseDmg = (kb.baseDamage || 32) * (kb.damageMult || 1) * (stats.projectileDamageMult || 1) * (stats.skillAmplify ? 1 + stats.skillAmplify : 1);
  let avgY = 0;
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const e of targets) {
    const halfH = (e.radius || 1) * 0.5;
    avgY += e.mesh.position.y + halfH;
    minX = Math.min(minX, e.mesh.position.x);
    maxX = Math.max(maxX, e.mesh.position.x);
    minZ = Math.min(minZ, e.mesh.position.z);
    maxZ = Math.max(maxZ, e.mesh.position.z);
  }
  avgY /= targets.length;
  const len = Math.max(2, Math.hypot(maxX - minX, maxZ - minZ) + 2);
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const angle = Math.atan2(maxZ - minZ, maxX - minX);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.25), lineMat);
  line.position.set(cx, avgY, cz);
  line.rotation.x = -Math.PI / 2;
  line.rotation.z = -angle;
  scene.add(line);
  effects.push({ type: "kineticBlastLine", mesh: line, life: 0.35, total: 0.35 });
  state._kineticBlastFiring = true;
  for (const e of targets) {
    const dmg = baseDmg * (1 + (Math.random() - 0.5) * 0.1);
    applyDamageEnemy(e, dmg, v0.set(0, 0, 0), false, "kinetic");
    spawnFlash(e.mesh.position.clone().setY(avgY), 0x4488ff, 0.4, 0.12);
  }
  state._kineticBlastFiring = false;
  spawnRing(new THREE.Vector3(cx, avgY, cz), len * 0.4, 0x4488ff, 0.2);
  playSfx(480, 0.07, 0.6);
}

function countSparkProjectiles() {
  let n = 0;
  for (let i = 0; i < projectiles.length; i++) if (projectiles[i].isSpark) n++;
  return n;
}

function spawnSparkProjectiles(count, damage, speed) {
  const current = countSparkProjectiles();
  const toSpawn = Math.min(count, Math.max(0, MAX_PROJECTILES_PER_SKILL - current));
  if (toSpawn <= 0 || projectiles.length + toSpawn > MAX_PROJECTILES) return;
  const origin = player.mesh.position.clone();
  origin.y = getGroundHeight(origin.x, origin.z) + 0.06;
  const fwd = player.aimDir.clone().setY(0);
  if (fwd.lengthSq() < 0.01) fwd.set(0, 0, 1);
  fwd.normalize();
  const spd = speed * (stats.projectileSpeedMult || 1);
  for (let i = 0; i < toSpawn; i++) {
    const spread = (Math.random() - 0.5) * 1.2;
    const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread).normalize();
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8),
      new THREE.MeshBasicMaterial({ color: 0xaaffff, emissive: 0x4488dd, emissiveIntensity: 0.8, transparent: true, opacity: 0.9 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(origin);
    scene.add(mesh);
    const vel = dir.clone().multiplyScalar(spd);
    projectiles.push({
      mesh,
      vel,
      life: 2.2,
      isSpark: true,
      damage: damage * (1 + (stats.skillAmplify || 0)),
      radius: 0.25,
      hitEnemies: new Set(),
      owner: "player",
    });
  }
  playSfx(580 + Math.random() * 80, 0.06, 0.55);
}

const MELEE_SWING_DURATION = 0.28;
const MELEE_RANGE = 2.9;
const MELEE_HALF_ANGLE = 0.65;
function doMeleeSlash(dir) {
  if ((state.meleeSwingTimer || 0) > 0) return;
  state.meleeSwingTimer = MELEE_SWING_DURATION;
  state.meleeSwingDir = dir.clone();
  state.meleeSwingHit = false;
  player.shootCd = 0.38;
}

function getArrowShape() {
  if (stats.arrowFreeze) return "arrow_freeze";
  if (stats.arrowBurn) return "arrow_burn";
  if (stats.arrowShock) return "arrow_shock";
  return "arrow";
}

function fireArrowShot(dir) {
  const arrowCount = countArrowProjectiles();
  if (arrowCount >= MAX_ARROW_PROJECTILES) return;
  const shots = Math.min(1 + (stats.multiShot || 0), MAX_ARROW_PROJECTILES - arrowCount);
  if (shots <= 0) return;
  const shape = getArrowShape();
  const muzzlePos = player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)).addScaledVector(dir, 1.0);
  for (let i = 0; i < shots; i++) {
    const spread = shots > 1 ? ((i / (shots - 1)) - 0.5) * 0.18 : 0;
    const shotDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
    const crit = Math.random() < Math.min(1, stats.critChance || 0);
    const damage = stats.damage * (crit ? (stats.critMult || 1.9) : 1);
    spawnProjectile({
      position: muzzlePos.clone(),
      direction: shotDir,
      speed: (stats.projectileSpeed || 22) * (stats.projectileSpeedMult || 1),
      damage,
      radius: 0.12,
      life: 2.0,
      pierce: stats.pierce || 0,
      shape,
      color: shape === "arrow_shock" ? 0xaaccff : shape === "arrow_burn" ? 0xff8844 : shape === "arrow_freeze" ? 0xaaddff : 0xccccaa,
      emissive: shape === "arrow_shock" ? 0x224466 : shape === "arrow_burn" ? 0x331108 : shape === "arrow_freeze" ? 0x224466 : 0x222218,
      crit,
    });
    playSfxShoot();
  }
}

function fireMainShot(dir) {
  if (stats.gorillaAura) return;
  if (stats.archerBow) {
    fireArrowShot(dir);
    return;
  }
  if (stats.samuraiMelee) {
    doMeleeSlash(dir);
    return;
  }
  if (state.reloadWeaponUnlocked) {
    if ((state.reloadAmmo || 0) <= 0) return;
    state.reloadAmmo = (state.reloadAmmo || 4) - 1;
    if (state.reloadAmmo <= 0) {
      state.reloadTimer = 1.8 / (1 + (stats.reloadSpeedMult || 0) * 0.25);
      state.reloadDuration = state.reloadTimer;
    }
  }
  const shots = 1 + stats.multiShot;
  const muzzlePos = player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)).addScaledVector(dir, 1.2);
  const reloadDmgMult = state.reloadWeaponUnlocked ? (1 + (stats.reloadWeaponDmg || 0)) : 1;
  for (let i = 0; i < shots; i++) {
    const spread = shots > 1 ? ((i / (shots - 1)) - 0.5) * 0.22 : 0;
    const shotDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
    const crit = Math.random() < Math.min(1, stats.critChance || 0);
    let damage = stats.damage * (crit ? (stats.critMult || 1.9) : 1);
    damage *= reloadDmgMult;
    spawnProjectile({
      position: player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)).addScaledVector(shotDir, 1.0),
      direction: shotDir,
      speed: stats.projectileSpeed,
      damage,
      radius: 0.14,
      life: 2.1,
      pierce: stats.pierce,
      aoe: stats.aoe > 0 ? 1.5 + stats.aoe * 0.35 : 0,
      color: crit ? 0xffe48a : 0x75eaff,
      emissive: crit ? 0x4a2d08 : 0x143a4f,
      crit,
    });
    playSfxShoot();
  }
  // Muzzle flash
  if (effects.length < MAX_EFFECTS) {
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe48a, transparent: true, opacity: 0.7 }));
    muzzle.position.copy(muzzlePos);
    scene.add(muzzle);
    effects.push({ type: "flash", mesh: muzzle, life: 0.06, total: 0.06 });
  }
}

var _sharedFlashGeo = null;
function spawnFlash(pos, color, size, life) {
  if (effects.length >= MAX_EFFECTS) return;
  if (!_sharedFlashGeo) _sharedFlashGeo = markShared(new THREE.SphereGeometry(1, 8, 6));
  var mesh = new THREE.Mesh(_sharedFlashGeo, new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.62 }));
  mesh.scale.setScalar(size);
  mesh.position.copy(pos).add(new THREE.Vector3(0, 0.9, 0));
  scene.add(mesh);
  effects.push({ type: "flash", mesh: mesh, life: life, total: life });
}

var _sharedRingSegments = 20;
function spawnRing(pos, radius, color, life) {
  if (effects.length >= MAX_EFFECTS) return;
  const ringGeo = withSharedGeo(function () { return new THREE.RingGeometry(radius * 0.25, radius, _sharedRingSegments); });
  const mesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.52, side: THREE.DoubleSide }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(pos).add(new THREE.Vector3(0, 0.08, 0));
  scene.add(mesh);
  effects.push({ type: "ring", mesh: mesh, life: life, total: life });
}

const HERALD_MAX_PER_SECOND = 9;
const HERALD_THUNDER_BOLT_HEIGHT = 18;
function spawnHeraldThunderBolt(targetPos) {
  if (effects.length >= MAX_EFFECTS) return;
  const bottom = new THREE.Vector3(targetPos.x, targetPos.y + 0.6, targetPos.z);
  const top = new THREE.Vector3(targetPos.x, targetPos.y + HERALD_THUNDER_BOLT_HEIGHT, targetPos.z);
  const length = top.distanceTo(bottom);
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.14, length, 6),
    new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.95, emissive: 0x4488ff })
  );
  cyl.position.copy(bottom).add(top).multiplyScalar(0.5);
  scene.add(cyl);
  effects.push({ type: "herald_bolt", mesh: cyl, life: 0.18, total: 0.18 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 1.8, 16), new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(bottom);
  scene.add(ring);
  effects.push({ type: "ring", mesh: ring, life: 0.2, total: 0.2 });
  spawnFlash(bottom, 0x88ccff, 1.2, 0.15);
  playSfx(680, 0.08, 0.55);
}

var _sharedBurstParticleGeo = null;
function spawnBurst(pos, color, count) {
  if (count == null) count = 6;
  if (effects.length + count >= MAX_EFFECTS) return;
  if (!_sharedBurstParticleGeo) _sharedBurstParticleGeo = markShared(new THREE.SphereGeometry(0.12, 5, 5));
  for (var i = 0; i < count; i++) {
    var angle = (i / count) * Math.PI * 2;
    var speed = 8 + Math.random() * 6;
    var vel = new THREE.Vector3(Math.cos(angle) * speed, 1 + Math.random() * 2, Math.sin(angle) * speed);
    var particle = new THREE.Mesh(_sharedBurstParticleGeo, new THREE.MeshBasicMaterial({ color: color }));
    particle.position.copy(pos).add(new THREE.Vector3(0, 0.5, 0));
    scene.add(particle);
    effects.push({
      type: "particle",
      mesh: particle,
      life: 0.6,
      total: 0.6,
      vel: vel,
      gravity: true
    });
  }
}

function spawnSlash(pos, dir, color = 0xffd700) {
  if (effects.length >= MAX_EFFECTS) return;
  const slashGeo = new THREE.BufferGeometry();
  const positions = new Float32Array([
    -0.3, 0, 0,
    0.3, 0.8, 0,
    0.2, 0.1, 0.3,
    -0.2, 0.9, 0.3
  ]);
  slashGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const slashMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, wireframe: false });
  const slashMesh = new THREE.Mesh(slashGeo, slashMat);
  slashMesh.position.copy(pos);
  slashMesh.rotation.z = Math.atan2(dir.z, dir.x);
  scene.add(slashMesh);
  effects.push({
    type: "slash",
    mesh: slashMesh,
    life: 0.15,
    total: 0.15
  });
}

function spawnWave(pos, radius, color = 0x00ff88) {
  if (effects.length >= MAX_EFFECTS) return;
  const mesh = new THREE.Mesh(
    withSharedGeo(function () { return new THREE.RingGeometry(radius * 0.1, radius, 40); }),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(pos).add(new THREE.Vector3(0, 0.05, 0));
  scene.add(mesh);
  effects.push({
    type: "wave",
    mesh,
    life: 0.4,
    total: 0.4,
    maxRadius: radius
  });
}


const chestBonuses = [
  { name: "HP +40", apply: () => { stats.hp = Math.min(stats.maxHp, stats.hp + 40); } },
  { name: "Shield +35", apply: () => { stats.shield = (stats.shield || 0) + 35; } },
  { name: "DMG +12%", apply: () => { stats.damage *= 1.12; } },
  { name: "FR +10%", apply: () => { stats.fireRate *= 0.9; } },
  { name: "Move +10%", apply: () => { stats.moveSpeed *= 1.1; } },
  { name: "XP +50", apply: () => { gainXp(50); } },
  { name: "Magnet +15%", apply: () => { stats.magnetRange *= 1.15; } },
];

function playBuffSound(type) {
  if ((camSettings.soundVolume || 0) <= 0) return;
  try {
    if (type === "double_points") {
      const el = new Audio("dp.mp3");
      el.volume = Math.min(1, (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1) * 0.18);
      el.play().catch(function() {});
      return;
    }
    if (type === "insta_kill") {
      const el = new Audio("ik.mp3");
      el.volume = Math.min(1, (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1) * 0.18);
      el.play().catch(function() {});
      return;
    }
    const freqs = { heal: 520, magnet: 680, dmg: 580, shield: 600, herald_thunder: 720, herald_ice: 640, herald_ash: 620 };
    const f = freqs[type] || 640;
    if (typeof playSfx === "function") playSfx(f, 0.12, 0.55);
  } catch (e) {}
}

const worldPickupEffects = {
  heal: { color: 0x44ff44, emissive: 0x228822, apply: () => { stats.hp = Math.min(stats.maxHp, stats.hp + 35); spawnDamageText(player.mesh.position, "+35 HP", false, "HP"); playBuffSound("heal"); } },
  magnet: { color: 0x4488ff, emissive: 0x224488, apply: () => { stats.magnetRange *= 1.08; spawnDamageText(player.mesh.position, "Magnet +", false, "MAGNET"); playBuffSound("magnet"); } },
  dmg: { color: 0xff6644, emissive: 0x882222, apply: () => { stats.damage *= 1.1; spawnDamageText(player.mesh.position, "DMG +", false, "DMG"); playBuffSound("dmg"); } },
  shield: { color: 0x44aaff, emissive: 0x2266aa, apply: () => { stats.shield = (stats.shield || 0) + 30; spawnDamageText(player.mesh.position, "+30 Shield", false, "SHIELD"); playBuffSound("shield"); } },
  herald_thunder: { color: 0x4488ff, emissive: 0x2244aa, apply: () => { stats.heraldOfThunder = Math.max(1, (stats.heraldOfThunder || 0) + 1); if (typeof ownedSkills !== "undefined") ownedSkills.add("unlock_herald_thunder"); if (state.unlockedSkillIds) state.unlockedSkillIds.add("unlock_herald_thunder"); spawnDamageText(player.mesh.position, "Herald of Thunder!", true, "HERALD"); playBuffSound("herald_thunder"); } },
  herald_ice: { color: 0x88ddff, emissive: 0x2266aa, apply: () => { stats.heraldOfIce = Math.max(1, (stats.heraldOfIce || 0) + 1); if (typeof ownedSkills !== "undefined") ownedSkills.add("unlock_herald_ice"); if (state.unlockedSkillIds) state.unlockedSkillIds.add("unlock_herald_ice"); spawnDamageText(player.mesh.position, "Herald of Ice!", true, "HERALD"); playBuffSound("herald_ice"); } },
  herald_ash: { color: 0xff8844, emissive: 0xaa4422, apply: () => { stats.heraldOfAsh = Math.max(1, (stats.heraldOfAsh || 0) + 1); if (typeof ownedSkills !== "undefined") ownedSkills.add("unlock_herald_ash"); if (state.unlockedSkillIds) state.unlockedSkillIds.add("unlock_herald_ash"); spawnDamageText(player.mesh.position, "Herald of Ash!", true, "HERALD"); playBuffSound("herald_ash"); } },
  insta_kill: { color: 0xeeeeee, emissive: 0x444444, apply: () => { state.instaKillUntil = (state.time || 0) + 25; if (typeof showGameNotification === "function") showGameNotification("INSTA KILL! 25 sn tek atis!", { rainbow: true }); spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), "INSTA KILL 25sn!", true, "INSTA KILL"); spawnRing(player.mesh.position.clone(), 6, 0xff2222, 0.5); playBuffSound("insta_kill"); } },
  double_points: { color: 0xffdd44, emissive: 0x886622, apply: () => { state.doublePointsUntil = (state.time || 0) + 10; if (typeof showGameNotification === "function") showGameNotification("DOUBLE POINTS! 10 sn XP x2!", { rainbow: true }); spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 2.5, 0)), "2X XP 10sn!", true, "2X"); spawnRing(player.mesh.position.clone(), 4, 0xffdd44, 0.4); playBuffSound("double_points"); } },
};

function makePickupMesh(type, cfg) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.emissive, emissiveIntensity: 0.6, roughness: 0.3 });
  if (type === "heal") {
    // Heart shape: two spheres + cone
    const left = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat);
    left.position.set(-0.12, 0.12, 0);
    const right = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat);
    right.position.set(0.12, 0.12, 0);
    const bottom = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 6), mat);
    bottom.position.set(0, -0.1, 0);
    bottom.rotation.z = Math.PI;
    g.add(left, right, bottom);
    // Cross
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const cV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.06), crossMat);
    cV.position.set(0, 0.06, 0.14);
    const cH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.06), crossMat);
    cH.position.set(0, 0.06, 0.14);
    g.add(cV, cH);
  } else if (type === "magnet") {
    // U-shaped magnet
    const barL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6), mat);
    barL.position.set(-0.12, 0, 0);
    const barR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6), mat);
    barR.position.set(0.12, 0, 0);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.06, 8, 12, Math.PI), mat);
    arc.position.set(0, 0.15, 0);
    arc.rotation.z = Math.PI;
    // Red/blue tips
    const redTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x880000, emissiveIntensity: 0.5 }));
    redTip.position.set(-0.12, -0.18, 0);
    const blueTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshStandardMaterial({ color: 0x4444ff, emissive: 0x000088, emissiveIntensity: 0.5 }));
    blueTip.position.set(0.12, -0.18, 0);
    g.add(barL, barR, arc, redTip, blueTip);
  } else if (type === "dmg") {
    // Sword shape
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.03), mat);
    blade.position.y = 0.08;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: 0xffcc33, emissive: 0x664400, emissiveIntensity: 0.4 }));
    guard.position.y = -0.1;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.8 }));
    grip.position.y = -0.18;
    g.add(blade, guard, grip);
  } else if (type === "shield") {
    // Shield shape - diamond with border
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), mat);
    body.scale.set(1, 1.3, 0.4);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 6, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x4488ff, emissiveIntensity: 0.4, metalness: 0.3 }));
    rim.scale.set(1, 1.3, 1);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    star.position.z = 0.12;
    g.add(body, rim, star);
  } else if (type === "herald_thunder" || type === "herald_ice" || type === "herald_ash") {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.7 }));
    ring.rotation.x = Math.PI / 2;
    g.add(orb, ring);
  } else if (type === "double_points") {
    const starMat = new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0x886622, emissiveIntensity: 0.5, roughness: 0.4 });
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), starMat);
    const twoX = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    twoX.position.z = 0.14;
    g.add(star, twoX);
  } else if (type === "insta_kill") {
    const skullMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, emissive: 0x333333, emissiveIntensity: 0.4, roughness: 0.6 });
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), skullMat);
    skull.scale.set(1, 1.1, 0.85);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    eyeL.position.set(-0.07, 0.05, 0.16);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    eyeR.position.set(0.07, 0.05, 0.16);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.1), skullMat);
    jaw.position.set(0, -0.12, 0.12);
    g.add(skull, eyeL, eyeR, jaw);
  } else {
    // Fallback sphere
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), mat);
    g.add(sphere);
  }
  g.scale.setScalar(1.4);
  return g;
}

function spawnWorldPickup(pos, types) {
  const type = types[Math.floor(Math.random() * types.length)];
  const cfg = worldPickupEffects[type];
  if (!cfg) return;
  const mesh = makePickupMesh(type, cfg);
  const groundY = getGroundHeight(pos.x, pos.z);
  mesh.position.set(pos.x, groundY + 0.35, pos.z);
  scene.add(mesh);
  // Glow ring beneath
  const glow = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.5, 16), new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.3;
  mesh.add(glow);
  worldPickups.push({ mesh, type, cfg, phase: Math.random() * Math.PI * 2 });
}

let instaKillGroundTimer = 550;
function updateWorldPickups(dt) {
  if (running && !gameOver && player.mesh) {
    instaKillGroundTimer -= dt;
    if (instaKillGroundTimer <= 0) {
      instaKillGroundTimer = 550 + Math.random() * 250;
      if (Math.random() < 0.012 && worldPickups.length < 25) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 32 + Math.random() * 38;
        const bound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 10;
        const x = clamp(player.mesh.position.x + Math.cos(angle) * dist, -bound, bound);
        const z = clamp(player.mesh.position.z + Math.sin(angle) * dist, -bound, bound);
        spawnWorldPickup(new THREE.Vector3(x, 0, z), ["insta_kill"]);
      }
    }
  }
  const pickupR = 2.5;
  const pullR = 7;
  const t = state.time || 0;
  for (let i = worldPickups.length - 1; i >= 0; i--) {
    const p = worldPickups[i];
    const baseY = getGroundHeight(p.mesh.position.x, p.mesh.position.z) + 0.35;
    p.mesh.position.y = baseY + Math.sin(t * 3.5 + p.phase) * 0.2;
    p.mesh.rotation.y += dt * 2.8;
    const pulse = 1 + Math.sin(t * 5 + p.phase) * 0.08;
    p.mesh.scale.setScalar(1.4 * pulse);
    const px = player.mesh.position.x, pz = player.mesh.position.z;
    const mx = p.mesh.position.x, mz = p.mesh.position.z;
    const dHoriz = Math.hypot(px - mx, pz - mz);
    if (dHoriz < pullR && dHoriz > pickupR) {
      const pull = v0.set((px - mx) / (dHoriz || 0.001), 0, (pz - mz) / (dHoriz || 0.001)).multiplyScalar(dt * 5);
      p.mesh.position.x += pull.x;
      p.mesh.position.z += pull.z;
    }
    if (dHoriz < pickupR) {
      p.cfg.apply();
      spawnRing(p.mesh.position, 1.5, p.cfg.color, 0.25);
      spawnBurst(p.mesh.position, p.cfg.color, 5);
      scene.remove(p.mesh);
      worldPickups.splice(i, 1);
    }
  }
}

function updateBhopTrail(dt) {
  for (let i = bhopTrail.length - 1; i >= 0; i--) {
    const t = bhopTrail[i];
    t.life -= dt;
    if (t.mesh && t.mesh.material) t.mesh.material.opacity = Math.max(0, t.life / 1.2) * 0.5;
    if (t.life <= 0) {
      if (scene && t.mesh) scene.remove(t.mesh);
      if (t.mesh && t.mesh.geometry) t.mesh.geometry.dispose();
      if (t.mesh && t.mesh.material) t.mesh.material.dispose();
      bhopTrail.splice(i, 1);
    }
  }
}

let worldChestSpawnTimer = 45;
let chestPanelOpen = false;
let chestPanelSkill = null;
let chestRollHandle = null;
function resetChestPanel() {
  chestPanelOpen = false;
  chestPanelSkill = null;
  if (chestRollHandle) { clearInterval(chestRollHandle); chestRollHandle = null; }
  const el = document.getElementById("chestPanel");
  if (el) el.classList.add("hidden");
}
const TIER_ROLL_ORDER = ["common", "magic", "rare", "unique"];
const TIER_REVEAL_FREQ = { common: 520, magic: 660, rare: 820, unique: 1000 };

function makeChestMesh(pos) {
  const mesh = hasVoxel("chest_closed")
    ? buildVoxelModel("chest_closed", { outline: true, fitHeight: 0.9 })
    : (function () {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.9), new THREE.MeshStandardMaterial({ color: 0xffc76a, roughness: 0.4, metalness: 0.15 }));
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.32, 0.92), new THREE.MeshStandardMaterial({ color: 0xffae42, roughness: 0.36, metalness: 0.18 }));
      base.position.y = 0.3;
      lid.position.set(0, 0.76, -0.04);
      g.add(base, lid);
      g.userData.lid = lid;
      return g;
    })();
  const lid = (mesh.userData.parts && mesh.userData.parts.lid) || mesh.userData.lid;
  mesh.userData.lid = lid;
  mesh.userData.opened = false;
  if (hasVoxel("chest_closed") && mesh.userData.voxelId) mesh.position.copy(pos);
  else mesh.position.copy(pos).add(new THREE.Vector3(0, 0.4, 0));
  return mesh;
}

function spawnWorldChestAt(pos) {
  if (worldChests.length >= 20) return;
  const mesh = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.9), new THREE.MeshStandardMaterial({ color: 0xffc76a, roughness: 0.4, metalness: 0.15 }));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.32, 0.92), new THREE.MeshStandardMaterial({ color: 0xffae42, roughness: 0.36, metalness: 0.18 }));
  base.position.y = 0.3;
  lid.position.set(0, 0.76, -0.04);
  mesh.add(base, lid);
  mesh.position.copy(pos).add(new THREE.Vector3(0, 0.4, 0));
  mesh.userData = { lid, opened: false };
  scene.add(mesh);
  const wc = { mesh, pos: pos.clone(), opened: false };
  worldChests.push(wc);
  colliders.push({ x: pos.x, z: pos.z, r: 0.75, chestRef: wc });
}

function spawnRandomWorldChest() {
  const x = (Math.random() - 0.5) * WORLD_HALF * 2;
  const z = (Math.random() - 0.5) * WORLD_HALF * 2;
  const d = Math.hypot(x, z);
  if (d < 15 || d > WORLD_HALF - 2) return;
  if (state.currentMapId === "island" && d >= ISLAND_RADIUS - 15) return;
  if (worldChests.length >= 24) return;
  const pos = new THREE.Vector3(x, getGroundHeight(x, z), z);
  const mesh = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.9), new THREE.MeshStandardMaterial({ color: 0xffc76a, roughness: 0.4, metalness: 0.15 }));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.32, 0.92), new THREE.MeshStandardMaterial({ color: 0xffae42, roughness: 0.36, metalness: 0.18 }));
  base.position.y = 0.3;
  lid.position.set(0, 0.76, -0.04);
  mesh.add(base, lid);
  mesh.position.copy(pos).add(new THREE.Vector3(0, 0.4, 0));
  mesh.userData = { lid, opened: false };
  scene.add(mesh);
  const wc = { mesh, pos: pos.clone(), opened: false };
  worldChests.push(wc);
  colliders.push({ x: pos.x, z: pos.z, r: 0.75, chestRef: wc });
}

function updateWorldChests(dt) {
  if (!running || gameOver) return;
  worldChestSpawnTimer -= dt;
  if (worldChestSpawnTimer <= 0 && worldChests.length < 14) {
    worldChestSpawnTimer = 32 + Math.random() * 28;
    spawnRandomWorldChest();
  }
  const CHEST_INTERACT_R = 3;
  state.nearWorldChest = null;
  for (let i = worldChests.length - 1; i >= 0; i--) {
    const wc = worldChests[i];
    wc.mesh.rotation.y += dt * 1.2;
    if (wc.opened && wc.mesh.userData.lid) {
      wc.mesh.userData.openT = (wc.mesh.userData.openT || 0) + dt;
      wc.mesh.userData.lid.rotation.x = -Math.min(1.2, wc.mesh.userData.openT * 5);
    }
    const d = player.mesh.position.distanceTo(wc.mesh.position);
    if (!wc.opened && d < CHEST_INTERACT_R && !chestPanelOpen) {
      state.nearWorldChest = wc;
      if (keys.f) {
        keys.f = false;
        wc.opened = true;
        chestPanelOpen = true;
        if (wc.mesh.userData.lid) wc.mesh.userData.openT = 0;
        playSfx(260, 0.14, 0.7);
        playSfx(420, 0.1, 0.55);
        openChestPanelWithRoll(wc);
      }
    }
  }
}

let breachSpawnTimer = 120;
const BREACH_TRIGGER_R = 5;
const BREACH_INITIAL_R = 1.8;
const BREACH_MAX_R = 84;
const BREACH_DURATION_MIN = 32;
const BREACH_DURATION_MAX = 42;
const BREACH_ENEMY_INTERVAL = 2.2;
const BREACH_EXPAND_DURATION = 14;
const BREACH_OPEN_HOLD_DURATION = 6.5;
const BREACH_CLOSE_DURATION = 6;
const BREACH_PREDEFINED_COUNT = 6;
const BREACH_HP_MULT = 0.25;
const MIN_ZONE_DISTANCE = 72;
const MIN_ZONE_DISTANCE_FROM_PLAYER = 42;

function getAllZoneCenters() {
  const out = [];
  breaches.forEach((b) => out.push(b.center));
  abyssPits.forEach((a) => out.push(a.center));
  rituals.forEach((r) => out.push(r.center));
  bossShrines.forEach((g) => { if (g.position) out.push({ x: g.position.x, z: g.position.z }); });
  (bossSummonShrines || []).forEach((g) => { if (g.position) out.push({ x: g.position.x, z: g.position.z }); });
  shrineGroups.forEach((g) => { if (g.position) out.push({ x: g.position.x, z: g.position.z }); });
  return out;
}

function getRandomPointInFlatZone() {
  if (!FLAT_ZONES || FLAT_ZONES.length === 0) return null;
  const f = FLAT_ZONES[Math.floor(Math.random() * FLAT_ZONES.length)];
  const innerR = f.r * 0.5;
  const a = Math.random() * Math.PI * 2;
  const d = innerR * Math.sqrt(Math.random());
  return { x: f.x + Math.cos(a) * d, z: f.z + Math.sin(a) * d };
}
function getMaxBreaches() {
  return 2 + (getActivityUpgradeLevel("breach", "maxBreaches") || 0);
}

function spawnBreach() {
  if (breaches.length >= getMaxBreaches()) return;
  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  const bound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 8;
  let x = 0, z = 0;
  let useFlat = false;
  const tryFlatFirst = Math.random() < 0.5 && typeof getRandomPointInFlatZone === "function";
  if (tryFlatFirst) {
    const pt = getRandomPointInFlatZone();
    if (pt) {
      const tx = clamp(pt.x, -bound, bound);
      const tz = clamp(pt.z, -bound, bound);
      if (!getAllZoneCenters().some((c) => Math.hypot(tx - c.x, tz - c.z) < MIN_ZONE_DISTANCE) && Math.hypot(tx - px, tz - pz) >= MIN_ZONE_DISTANCE_FROM_PLAYER) {
        x = tx; z = tz; useFlat = true;
      }
    }
  }
  if (!useFlat) {
    for (let attempt = 0; attempt < 38; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = MIN_ZONE_DISTANCE_FROM_PLAYER + Math.random() * 40;
      x = clamp(px + Math.cos(angle) * dist, -bound, bound);
      z = clamp(pz + Math.sin(angle) * dist, -bound, bound);
      let tooClose = false;
      for (const c of getAllZoneCenters()) {
        if (Math.hypot(x - c.x, z - c.z) < MIN_ZONE_DISTANCE) { tooClose = true; break; }
      }
      if (!tooClose) break;
    }
  }
  if (getAllZoneCenters().some((c) => Math.hypot(x - c.x, z - c.z) < MIN_ZONE_DISTANCE)) return;
  if (!useFlat && Math.hypot(x - px, z - pz) < MIN_ZONE_DISTANCE_FROM_PLAYER) return;
  const gy = getGroundHeight(x, z);
  const purpleRing = new THREE.MeshStandardMaterial({ color: 0x7b3daa, emissive: 0x3a1a4a, emissiveIntensity: 0.85, roughness: 0.5, metalness: 0.15, side: THREE.DoubleSide });
  const purpleInner = new THREE.MeshStandardMaterial({ color: 0x5a2a7a, emissive: 0x2a0a35, emissiveIntensity: 0.7, roughness: 0.6, metalness: 0.08, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const purpleGround = new THREE.MeshBasicMaterial({ color: 0x4a1a5a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: true });
  const groundCircle = new THREE.Mesh(new THREE.CircleGeometry(BREACH_INITIAL_R * 1.1, 64), purpleGround);
  groundCircle.rotation.x = -Math.PI / 2;
  groundCircle.position.y = 0.03;
  const ring = new THREE.Mesh(new THREE.RingGeometry(BREACH_INITIAL_R * 0.52, BREACH_INITIAL_R * 0.58, 64, 1, 0, Math.PI * 2), purpleRing);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.035;
  const interior = new THREE.Mesh(new THREE.RingGeometry(0.01, BREACH_INITIAL_R * 0.5, 64, 1, 0, Math.PI * 2), purpleInner);
  interior.rotation.x = -Math.PI / 2;
  interior.position.y = 0.01;
  interior.visible = false;
  const handMat = new THREE.MeshStandardMaterial({ color: 0x5a3d6a, emissive: 0x3a1a4a, emissiveIntensity: 0.45, roughness: 0.75 });
  const handGroup = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.5), handMat);
  palm.position.y = 0.22;
  const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 0.12), handMat);
  f1.position.set(-0.25, 0.5, 0.1);
  const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.1), handMat);
  f2.position.set(-0.08, 0.54, 0.12);
  const f3 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.1), handMat);
  f3.position.set(0.09, 0.52, 0.1);
  const f4 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.09), handMat);
  f4.position.set(0.25, 0.4, 0.08);
  const palmGlow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: 0xaa66ff, transparent: true, opacity: 0.85 }));
  palmGlow.position.set(0, 0.35, 0.28);
  handGroup.add(palm, f1, f2, f3, f4, palmGlow);
  handGroup.position.y = 0.55;
  handGroup.scale.setScalar(2.0);
  const group = new THREE.Group();
  group.add(groundCircle);
  group.add(ring);
  group.add(interior);
  group.add(handGroup);
  const breachLabel = makeZoneLabel("Breach", "rgba(180,100,220,0.95)");
  breachLabel.position.y = 2.8;
  group.add(breachLabel);
  group.position.set(x, gy, z);
  scene.add(group);
  const quantityUp = getActivityUpgradeLevel("breach", "quantity") || 0;
  breaches.push({
    group,
    groundCircle,
    ring,
    interior,
    handGroup,
    phase: "idle",
    center: { x, z },
    currentRadius: BREACH_INITIAL_R,
    prevRadius: BREACH_INITIAL_R,
    maxRadius: BREACH_MAX_R,
    handCloseTimer: 0,
    expandStart: 0,
    duration: BREACH_DURATION_MIN + Math.random() * (BREACH_DURATION_MAX - BREACH_DURATION_MIN),
    lastSpawn: 0,
    groundY: gy,
    totalEnemies: BREACH_PREDEFINED_COUNT + quantityUp,
    spawnedCount: 0,
  });
}

const BREACH_ENEMY_TYPES = ["breach"];
function spawnBreachEnemy(breach, fromNewRingOnly) {
  if (enemies.length >= getMaxEnemies()) return;
  const forceType = BREACH_ENEMY_TYPES[0];
  const cfg = tierConfig.normal;
  const e = createEnemy("normal", cfg, { forceBeastType: forceType });
  e.hp *= BREACH_HP_MULT;
  e.maxHp = e.hp;
  const scaleVar = 1.0 + Math.random() * 0.15;
  e.mesh.scale.setScalar(scaleVar);
  e.radius *= scaleVar;
  addEnemyZoneOverlay(e.mesh, 0x9966ff, false);
  const angle = Math.random() * Math.PI * 2;
  let dist;
  if (fromNewRingOnly && breach.prevRadius < breach.currentRadius - 0.5) {
    const rMin = breach.prevRadius * 0.7;
    const rMax = breach.currentRadius * 0.88;
    dist = rMin + Math.random() * (rMax - rMin);
  } else {
    dist = Math.random() * breach.currentRadius * 0.88;
  }
  const bx = breach.center.x + Math.cos(angle) * dist;
  const bz = breach.center.z + Math.sin(angle) * dist;
  e.mesh.position.set(bx, getGroundHeight(bx, bz), bz);
  e.spawnDelay = 0.4;
  e.isBreach = true;
  e.breachRef = breach;
  enemies.push(e);
  scene.add(e.mesh);
}

function updateBreaches(dt) {
  if (!running || gameOver) return;
  breachSpawnTimer -= dt;
  if (breachSpawnTimer <= 0 && breaches.length < getMaxBreaches()) {
    breachSpawnTimer = 95 + Math.random() * 70;
    spawnBreach();
  }
  const t = state.time || 0;
  for (let i = breaches.length - 1; i >= 0; i--) {
    const b = breaches[i];
    if (b.phase === "idle") {
      const d = Math.hypot(player.mesh.position.x - b.center.x, player.mesh.position.z - b.center.z);
      if (d < BREACH_TRIGGER_R) {
        b.phase = "hand_closing";
        b.handCloseTimer = 0.45;
      }
    } else if (b.phase === "hand_closing") {
      b.handCloseTimer -= dt;
      if (b.handGroup) b.handGroup.scale.setScalar(Math.max(0, b.handCloseTimer / 0.45) * 2.0);
      if (b.handCloseTimer <= 0) {
        if (b.handGroup && b.group) b.group.remove(b.handGroup);
        b.handGroup = null;
        b.phase = "active";
        b.expandStart = t;
        b.currentRadius = BREACH_INITIAL_R;
        if (b.interior) b.interior.visible = true;
        b.lastSpawn = t;
        if (b.ring) b.ring.scale.setScalar(1);
        if (b.interior) b.interior.scale.setScalar(1);
        const toSpawn = (b.totalEnemies ?? BREACH_PREDEFINED_COUNT) - (b.spawnedCount || 0);
        for (let s = 0; s < toSpawn; s++) spawnBreachEnemy(b, false);
        b.spawnedCount = b.totalEnemies ?? BREACH_PREDEFINED_COUNT;
        if (typeof showGameNotification === "function") showGameNotification("Breach açıldı! Açılış tamamlanınca " + Math.round(BREACH_OPEN_HOLD_DURATION) + " sn açık kalacak.");
      }
    } else if (b.phase === "active") {
      const elapsed = t - (b.expandStart || t);
      const speedUp = getActivityUpgradeLevel("breach", "speed") || 0;
      const expandDuration = BREACH_EXPAND_DURATION / (1 + speedUp * 0.15);
      if (elapsed < expandDuration) {
        const linearT = elapsed / expandDuration;
        const progress = 1 - Math.pow(1 - linearT, 2.4);
        b.currentRadius = BREACH_INITIAL_R + (b.maxRadius - BREACH_INITIAL_R) * progress;
      } else {
        b.currentRadius = b.maxRadius;
        b.phase = "open_hold";
        b.holdStart = t;
        b.holdDuration = BREACH_OPEN_HOLD_DURATION;
        state.breachPoints = (state.breachPoints || 0) + 1;
        if (typeof showGameNotification === "function") showGameNotification("Breach tamamlandi! " + Math.round(BREACH_OPEN_HOLD_DURATION) + " sn sonra kapanacak.", { rainbow: false });
      }
      const ringScale = Math.max(0.01, b.currentRadius / BREACH_INITIAL_R);
      if (b.groundCircle) b.groundCircle.scale.setScalar(ringScale);
      if (b.ring) b.ring.scale.setScalar(ringScale);
      if (b.interior) b.interior.scale.setScalar(ringScale);
    } else if (b.phase === "open_hold") {
      const holdElapsed = t - b.holdStart;
      if (holdElapsed >= (b.holdDuration || BREACH_OPEN_HOLD_DURATION)) {
        b.phase = "closing";
        b.closeStart = t;
        b.closeDuration = BREACH_CLOSE_DURATION;
      }
    } else if (b.phase === "closing") {
      const closeElapsed = t - b.closeStart;
      const closeProgress = Math.min(1, closeElapsed / (b.closeDuration || BREACH_CLOSE_DURATION));
      b.currentRadius = (b.maxRadius || BREACH_MAX_R) * (1 - closeProgress);
      const ringScale = Math.max(0.01, b.currentRadius / BREACH_INITIAL_R);
      if (b.groundCircle) b.groundCircle.scale.setScalar(ringScale);
      if (b.ring) b.ring.scale.setScalar(ringScale);
      if (b.interior) b.interior.scale.setScalar(ringScale);
      if (closeProgress >= 1) {
        enemies.forEach((e) => { if (e.breachRef === b) e.breachRef = null; });
        scene.remove(b.group);
        if (b.groundCircle && b.groundCircle.geometry) b.groundCircle.geometry.dispose();
        if (b.ring && b.ring.geometry) b.ring.geometry.dispose();
        if (b.interior && b.interior.geometry) b.interior.geometry.dispose();
        breaches.splice(i, 1);
      }
    }
  }
}

let abyssPitSpawnTimer = 55;
const ABYSS_TRIGGER_R = 24;
const ABYSS_PIT_R = 24;
const ABYSS_WAVE1_COUNT = 4;
const ABYSS_WAVE2_COUNT = 5;
const ABYSS_XP_MULT = 1.5;
const NORMAL_MOB_XP_MULT = 1.1;

function spawnAbyssPit() {
  if (abyssPits.length >= 2) return;
  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  const bound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 10;
  let x = 0, z = 0;
  let useFlat = false;
  const tryFlatFirst = Math.random() < 0.5 && typeof getRandomPointInFlatZone === "function";
  if (tryFlatFirst) {
    const pt = getRandomPointInFlatZone();
    if (pt) {
      const tx = clamp(pt.x, -bound, bound);
      const tz = clamp(pt.z, -bound, bound);
      if (!getAllZoneCenters().some((c) => Math.hypot(tx - c.x, tz - c.z) < MIN_ZONE_DISTANCE) && Math.hypot(tx - px, tz - pz) >= MIN_ZONE_DISTANCE_FROM_PLAYER) {
        x = tx; z = tz; useFlat = true;
      }
    }
  }
  if (!useFlat) {
    for (let attempt = 0; attempt < 38; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = MIN_ZONE_DISTANCE_FROM_PLAYER + Math.random() * 45;
      x = clamp(px + Math.cos(angle) * dist, -bound, bound);
      z = clamp(pz + Math.sin(angle) * dist, -bound, bound);
      if (!getAllZoneCenters().some((c) => Math.hypot(x - c.x, z - c.z) < MIN_ZONE_DISTANCE)) break;
    }
  }
  if (getAllZoneCenters().some((c) => Math.hypot(x - c.x, z - c.z) < MIN_ZONE_DISTANCE)) return;
  if (!useFlat && Math.hypot(x - px, z - pz) < MIN_ZONE_DISTANCE_FROM_PLAYER) return;
  const gy = getGroundHeight(x, z);
  const greenRing = new THREE.MeshStandardMaterial({ color: 0x2a9a3e, emissive: 0x0a4d1a, emissiveIntensity: 0.85, roughness: 0.5, metalness: 0.08, side: THREE.DoubleSide });
  const greenInner = new THREE.MeshStandardMaterial({ color: 0x1a6a2a, emissive: 0x063a12, emissiveIntensity: 0.7, roughness: 0.6, metalness: 0.05, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const greenGround = new THREE.MeshBasicMaterial({ color: 0x0a4a1a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: true });
  const groundCircle = new THREE.Mesh(new THREE.CircleGeometry(ABYSS_PIT_R * 0.96, 64), greenGround);
  groundCircle.rotation.x = -Math.PI / 2;
  groundCircle.position.y = 0.03;
  const ring = new THREE.Mesh(new THREE.RingGeometry(ABYSS_PIT_R * 0.88, ABYSS_PIT_R * 0.96, 64, 1, 0, Math.PI * 2), greenRing);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.035;
  const interior = new THREE.Mesh(new THREE.RingGeometry(0.01, ABYSS_PIT_R * 0.86, 64, 1, 0, Math.PI * 2), greenInner);
  interior.rotation.x = -Math.PI / 2;
  interior.position.y = 0.01;
  const abyssDomeMat = new THREE.MeshBasicMaterial({ color: 0x1a8a2e, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
  const abyssDome = new THREE.Mesh(new THREE.SphereGeometry(ABYSS_PIT_R * 0.98, 32, 24), abyssDomeMat);
  abyssDome.position.y = 0;
  abyssDome.renderOrder = -1;
  const group = new THREE.Group();
  group.add(groundCircle);
  group.add(abyssDome);
  group.add(ring);
  group.add(interior);
  const abyssLabel = makeZoneLabel("Abyss", "rgba(80,220,120,0.95)");
  abyssLabel.position.y = 2.5;
  group.add(abyssLabel);
  group.position.set(x, gy, z);
  scene.add(group);
  const abyssQ = getActivityUpgradeLevel("abyss", "quantity") || 0;
  abyssPits.push({
    group,
    ring,
    interior,
    phase: "idle",
    center: { x, z },
    killsThisWave: 0,
    wave1Total: ABYSS_WAVE1_COUNT + abyssQ,
    wave2Total: ABYSS_WAVE2_COUNT + abyssQ,
    groundY: gy,
  });
}

const ABYSS_ENEMY_TYPES = ["void", "horror", "wraith", "shadow", "ghost"];
const ABYSS_NAMES = ["Abyss Wraith", "Void Shade", "Abyssal Horror", "Abyss Ghost", "Deep Shadow", "Abyss Spawn", "Void Walker", "Abyssal Stalker", "Abyss Lurker", "Void Dweller", "Abyssal Wraith", "Abyss Horror", "Void Horror", "Abyss Spectre", "Deep Wraith"];
function spawnAbyssEnemy(pit, isBoss) {
  if (enemies.length >= getMaxEnemies()) return false;
  const forceType = ABYSS_ENEMY_TYPES[Math.floor(Math.random() * ABYSS_ENEMY_TYPES.length)];
  const cfg = isBoss ? { ...tierConfig.rare, hp: tierConfig.rare.hp * 2, damage: tierConfig.rare.damage * 1.4, xp: tierConfig.rare.xp * 2.5, radius: 1.2, height: 2.4 } : tierConfig.rare;
  const e = createEnemy("rare", cfg, { forceBeastType: forceType });
  e.isAbyss = true;
  e.abyssPitRef = pit;
  e.xp *= ABYSS_XP_MULT;
  e.name = isBoss ? "Abyss Lord" : ABYSS_NAMES[Math.floor(Math.random() * ABYSS_NAMES.length)];
  e.mesh.remove(e.nameLabel);
  e.nameLabel = makeNameLabel(e.name, "abyss");
  e.nameLabel.position.y = cfg.height * (isBoss ? 1.85 : 1.58);
  e.nameLabel.scale.multiplyScalar(isBoss ? 1.2 : 1);
  e.mesh.add(e.nameLabel);
  addEnemyZoneOverlay(e.mesh, isBoss ? 0xff4444 : 0x22dd88, isBoss);
  if (isBoss) {
    e.isAbyssBoss = true;
    e.hp *= 1.5;
    e.maxHp = e.hp;
    e.xp *= 2.2;
    e.mesh.scale.multiplyScalar(1.25);
    e.radius *= 1.25;
  }
  const angle = Math.random() * Math.PI * 2;
  const dist = (isBoss ? 0.5 : 1) + Math.random() * ABYSS_PIT_R * 0.9;
  const bx = pit.center.x + Math.cos(angle) * dist;
  const bz = pit.center.z + Math.sin(angle) * dist;
  e.mesh.position.set(bx, getGroundHeight(bx, bz), bz);
  e.spawnDelay = 0.4;
  enemies.push(e);
  scene.add(e.mesh);
  return true;
}

function updateAbyssPits(dt) {
  if (!running || gameOver) return;
  abyssPitSpawnTimer -= dt;
  if (abyssPitSpawnTimer <= 0 && abyssPits.length < 2) {
    abyssPitSpawnTimer = 48 + Math.random() * 45;
    spawnAbyssPit();
  }
  for (let i = abyssPits.length - 1; i >= 0; i--) {
    const pit = abyssPits[i];
    if (pit.phase === "idle") {
      const d = Math.hypot(player.mesh.position.x - pit.center.x, player.mesh.position.z - pit.center.z);
      if (d < ABYSS_TRIGGER_R) {
        pit.phase = "wave1";
        pit.killsThisWave = 0;
        pit.wave1Spawned = 0;
        for (let w = 0; w < pit.wave1Total; w++) if (spawnAbyssEnemy(pit, false)) pit.wave1Spawned++;
        if (typeof showGameNotification === "function") showGameNotification("Abyss - Dalga 1!", { rainbow: false });
      }
    } else if (pit.phase === "wave1") {
      if (pit.wave1Spawned < pit.wave1Total && spawnAbyssEnemy(pit, false)) pit.wave1Spawned++;
      if (pit.wave1Spawned > 0 && pit.killsThisWave >= pit.wave1Spawned && pit.wave1Spawned >= pit.wave1Total) {
        pit.phase = "wave2";
        pit.killsThisWave = 0;
        pit.wave2Spawned = 0;
        for (let w = 0; w < pit.wave2Total; w++) if (spawnAbyssEnemy(pit, false)) pit.wave2Spawned++;
        if (typeof showGameNotification === "function") showGameNotification("Abyss - Dalga 2!", { rainbow: false });
      }
    } else if (pit.phase === "wave2") {
      if (pit.wave2Spawned < pit.wave2Total && spawnAbyssEnemy(pit, false)) pit.wave2Spawned++;
      if (pit.wave2Spawned > 0 && pit.killsThisWave >= pit.wave2Spawned && pit.wave2Spawned >= pit.wave2Total) {
        pit.phase = "boss";
        pit.killsThisWave = 0;
        pit.bossSpawned = spawnAbyssEnemy(pit, true);
        if (typeof showGameNotification === "function") showGameNotification("Abyss - Dalga 3 (Boss)!", { rainbow: false });
      }
    } else if (pit.phase === "boss") {
      if (!pit.bossSpawned) pit.bossSpawned = spawnAbyssEnemy(pit, true);
      if (pit.bossSpawned && pit.killsThisWave >= 1) {
        enemies.forEach((e) => { if (e.abyssPitRef === pit) e.abyssPitRef = null; });
        scene.remove(pit.group);
        if (pit.ring && pit.ring.geometry) pit.ring.geometry.dispose();
        if (pit.interior && pit.interior.geometry) pit.interior.geometry.dispose();
        abyssPits.splice(i, 1);
        state.abyssPoints = (state.abyssPoints || 0) + 1;
        if (typeof showGameNotification === "function") showGameNotification("Abyss tamamlandi! +1 Abyss puani (P ile harcayin)", { rainbow: false });
      }
    }
  }
}

let ritualSpawnTimer = 40;
const RITUAL_TRIGGER_R = 24;
const RITUAL_RADIUS = 24;
const RITUAL_DURATION = 30;
const RITUAL_ENEMY_COUNT_BASE = 5;
function getRitualEnemyCount() { return RITUAL_ENEMY_COUNT_BASE + (getActivityUpgradeLevel("ritual", "quantity") || 0); }
const RITUAL_ENEMY_COUNT = 5;
const RITUAL_LEVEL_BONUS = 2;

function spawnRitual() {
  if (rituals.length >= 2) return;
  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  const bound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 12;
  let x = 0, z = 0;
  for (let attempt = 0; attempt < 38; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = MIN_ZONE_DISTANCE_FROM_PLAYER + Math.random() * 48;
    x = clamp(px + Math.cos(angle) * dist, -bound, bound);
    z = clamp(pz + Math.sin(angle) * dist, -bound, bound);
    if (!getAllZoneCenters().some((c) => Math.hypot(x - c.x, z - c.z) < MIN_ZONE_DISTANCE)) break;
  }
  if (getAllZoneCenters().some((c) => Math.hypot(x - c.x, z - c.z) < MIN_ZONE_DISTANCE)) return;
  const gy = getGroundHeight(x, z);
  const bloodRing = new THREE.MeshStandardMaterial({ color: 0x7a2a2a, emissive: 0x3a1010, emissiveIntensity: 0.85, roughness: 0.55, metalness: 0.12, side: THREE.DoubleSide });
  const bloodInner = new THREE.MeshStandardMaterial({ color: 0x4a1515, emissive: 0x1a0808, emissiveIntensity: 0.7, roughness: 0.65, metalness: 0.08, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const bloodGround = new THREE.MeshBasicMaterial({ color: 0x3a0a0a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: true });
  const groundCircle = new THREE.Mesh(new THREE.CircleGeometry(RITUAL_RADIUS * 0.96, 64), bloodGround);
  groundCircle.rotation.x = -Math.PI / 2;
  groundCircle.position.y = 0.03;
  const ring = new THREE.Mesh(new THREE.RingGeometry(RITUAL_RADIUS * 0.88, RITUAL_RADIUS * 0.96, 64, 1, 0, Math.PI * 2), bloodRing);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.035;
  const interior = new THREE.Mesh(new THREE.RingGeometry(0.01, RITUAL_RADIUS * 0.86, 64, 1, 0, Math.PI * 2), bloodInner);
  interior.rotation.x = -Math.PI / 2;
  interior.position.y = 0.01;
  const ritualDomeMat = new THREE.MeshBasicMaterial({ color: 0x5a1a1a, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
  const ritualDome = new THREE.Mesh(new THREE.SphereGeometry(RITUAL_RADIUS * 0.98, 32, 24), ritualDomeMat);
  ritualDome.position.y = 0;
  ritualDome.renderOrder = -1;
  ritualDome.visible = true;
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4a2525, emissive: 0x1a0505, emissiveIntensity: 0.2, roughness: 0.8 });
  const group = new THREE.Group();
  group.add(groundCircle);
  group.add(ritualDome);
  group.add(ring);
  group.add(interior);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.4, 8), pillarMat);
    pillar.position.set(Math.cos(a) * RITUAL_RADIUS * 0.72, 0.7, Math.sin(a) * RITUAL_RADIUS * 0.72);
    group.add(pillar);
  }
  const altarMat = new THREE.MeshStandardMaterial({ color: 0x3d1515, emissive: 0x180505, emissiveIntensity: 0.25, roughness: 0.85 });
  const altar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.2), altarMat);
  altar.position.y = 0.25;
  group.add(altar);
  const skullMat = new THREE.MeshStandardMaterial({ color: 0xddccbb, emissive: 0x221a15, roughness: 0.9 });
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), skullMat);
  skull.position.y = 0.6;
  altar.add(skull);
  const ritualLabel = makeZoneLabel("Ritüel", "rgba(220,80,80,0.95)");
  ritualLabel.position.y = 3.5;
  group.add(ritualLabel);
  group.position.set(x, gy, z);
  scene.add(group);
  rituals.push({
    group,
    ring,
    interior,
    ritualDome,
    phase: "idle",
    center: { x, z },
    killsThisWave: 0,
    totalSpawned: 0,
    groundY: gy,
    doneAt: 0,
  });
}

function spawnRitualEnemy(ritual, isBoss) {
  if (enemies.length >= getMaxEnemies()) return;
  const types = ["void", "horror", "wraith"];
  const forceType = types[Math.floor(Math.random() * types.length)];
  const cfg = isBoss ? { ...tierConfig.normal, hp: tierConfig.normal.hp * 3, damage: tierConfig.normal.damage * 1.6, xp: tierConfig.normal.xp * 2, radius: 1.1, height: 2.1 } : tierConfig.normal;
  const e = createEnemy("normal", cfg, { forceBeastType: forceType });
  e.ritualRef = ritual;
  e.isRitual = true;
  addEnemyZoneOverlay(e.mesh, isBoss ? 0xff4444 : 0xdd4444, isBoss);
  if (isBoss) {
    e.isRitualBoss = true;
    e.hp *= 1.6;
    e.maxHp = e.hp;
    e.xp *= 2.5;
    e.mesh.scale.multiplyScalar(1.2);
    e.radius *= 1.2;
  }
  const angle = Math.random() * Math.PI * 2;
  const dist = 0.5 + Math.random() * RITUAL_RADIUS * 0.6;
  const rx = ritual.center.x + Math.cos(angle) * dist;
  const rz = ritual.center.z + Math.sin(angle) * dist;
  e.mesh.position.set(rx, getGroundHeight(rx, rz), rz);
  e.spawnDelay = 0.4;
  enemies.push(e);
  scene.add(e.mesh);
  ritual.totalSpawned++;
}

function updateRituals(dt) {
  if (!running || gameOver) return;
  ritualSpawnTimer -= dt;
  if (ritualSpawnTimer <= 0 && rituals.length < 2) {
    ritualSpawnTimer = 35 + Math.random() * 50;
    spawnRitual();
  }
  state.nearRitual = null;
  for (let i = rituals.length - 1; i >= 0; i--) {
    const r = rituals[i];
    if (r.phase === "idle") {
      const d = Math.hypot(player.mesh.position.x - r.center.x, player.mesh.position.z - r.center.z);
      if (d < RITUAL_TRIGGER_R) state.nearRitual = r;
      if (state.nearRitual === r && keys.f) {
        keys.f = false;
        r.phase = "active";
        r.startTime = state.time || 0;
        r.killsThisWave = 0;
        r.totalSpawned = 0;
        r.bossSpawned = false;
        if (r.ritualDome) r.ritualDome.visible = true;
        state.activeRitual = { center: { x: r.center.x, z: r.center.z }, radius: RITUAL_RADIUS };
        state._savedBackground = scene.background && scene.background.clone ? scene.background.clone() : (scene.background && scene.background.getHex ? new THREE.Color(scene.background.getHex()) : null);
        for (let w = 0; w < getRitualEnemyCount(); w++) spawnRitualEnemy(r, false);
        if (typeof showGameNotification === "function") showGameNotification("Ritüel başladı! 30 sn. Dışarı çıkamazsın – hepsini kes.");
      }
    } else if (r.phase === "active") {
      const ritualElapsed = (state.time || 0) - (r.startTime || 0);
      if (ritualElapsed >= RITUAL_DURATION) {
        r.phase = "done";
        r.doneAt = state.time || 0;
        state.activeRitual = null;
        if (state._savedBackground) { scene.background = state._savedBackground; state._savedBackground = null; }
        if (scene.fog && defaultFogDensity != null) scene.fog.density = defaultFogDensity;
        if (r.bossSpawned && r.killsThisWave >= r.totalSpawned && r.totalSpawned > 0) {
          const bossPos = new THREE.Vector3(r.center.x, r.groundY + 0.4, r.center.z);
          spawnWorldChestAt(bossPos);
          const xpForTwoLevels = (state.xpNext + getXpNextForLevel(state.level + 1)) / (stats.xpGainMult || 1);
          gainXp(xpForTwoLevels);
          state.ritualPoints = (state.ritualPoints || 0) + 1;
          if (typeof showGameNotification === "function") showGameNotification("RITUAL TAMAMLANDI! +2 Level + Sandik. +1 Ritüel puani (P ile harcayin)");
          spawnDamageText(r.group.position.clone().add(new THREE.Vector3(0, 3, 0)), "+2 LEVEL!", true, "ritual");
        } else {
          if (typeof showGameNotification === "function") showGameNotification("Ritüel süresi bitti!");
        }
        spawnRing(new THREE.Vector3(r.center.x, r.groundY, r.center.z), RITUAL_RADIUS, 0xaa2222, 0.5);
        playSfx(400, 0.15);
      } else {
        if (r.killsThisWave >= r.totalSpawned && r.totalSpawned > 0 && !r.bossSpawned) {
          r.bossSpawned = true;
          spawnRitualEnemy(r, true);
          if (typeof showGameNotification === "function") showGameNotification("RITUAL BOSSU! Kesince sandik duser.");
        }
        if (r.bossSpawned && r.killsThisWave >= r.totalSpawned && r.totalSpawned > 0) {
          r.phase = "done";
          r.doneAt = state.time || 0;
          state.activeRitual = null;
          if (state._savedBackground) { scene.background = state._savedBackground; state._savedBackground = null; }
          if (scene.fog && defaultFogDensity != null) scene.fog.density = defaultFogDensity;
          const bossPos = new THREE.Vector3(r.center.x, r.groundY + 0.4, r.center.z);
          spawnWorldChestAt(bossPos);
          const xpForTwoLevels = (state.xpNext + getXpNextForLevel(state.level + 1)) / (stats.xpGainMult || 1);
          gainXp(xpForTwoLevels);
          state.ritualPoints = (state.ritualPoints || 0) + 1;
          if (typeof showGameNotification === "function") showGameNotification("RITUAL TAMAMLANDI! +2 Level + Sandik. +1 Ritüel puani (P ile harcayin)");
          spawnDamageText(r.group.position.clone().add(new THREE.Vector3(0, 3, 0)), "+2 LEVEL!", true, "ritual");
          spawnRing(new THREE.Vector3(r.center.x, r.groundY, r.center.z), RITUAL_RADIUS, 0xaa2222, 0.5);
          playSfx(400, 0.15);
        }
      }
    } else if (r.phase === "done") {
      if (!r.doneAt) r.doneAt = state.time || 0;
      const doneElapsed = (state.time || 0) - r.doneAt;
      if (doneElapsed >= 2) {
        enemies.forEach((e) => { if (e.ritualRef === r) e.ritualRef = null; });
        if (r.group && scene) scene.remove(r.group);
        if (r.ritualDome && r.ritualDome.geometry) r.ritualDome.geometry.dispose();
        if (r.ring && r.ring.geometry) r.ring.geometry.dispose();
        if (r.interior && r.interior.geometry) r.interior.geometry.dispose();
        rituals.splice(i, 1);
      }
    }
  }
  const ritualHintEl = document.getElementById("ritualHint");
  const zoneTimerEl = document.getElementById("zoneTimer");
  if (ritualHintEl) {
    if (state.nearRitual && state.nearRitual.phase === "idle") {
      ritualHintEl.classList.remove("hidden");
      ritualHintEl.style.display = "block";
      ritualHintEl.textContent = "F - Ritüeli Başlat";
    } else if (!state.activeRitual) {
      ritualHintEl.classList.add("hidden");
      ritualHintEl.style.display = "none";
    }
  }
  if (zoneTimerEl) {
    if (state.activeRitual && rituals.length > 0) {
      const r = rituals.find((rr) => rr.phase === "active");
      if (r && r.startTime != null) {
        const secLeft = Math.max(0, Math.ceil(RITUAL_DURATION - ((state.time || 0) - r.startTime)));
        zoneTimerEl.textContent = "Ritüel: " + secLeft + " sn kaldı";
        zoneTimerEl.classList.remove("hidden");
        zoneTimerEl.style.display = "block";
      } else {
        zoneTimerEl.classList.add("hidden");
        zoneTimerEl.style.display = "none";
      }
    } else if (breaches.length > 0) {
      const b = breaches.find((bb) => bb.phase === "active" || bb.phase === "open_hold" || bb.phase === "closing");
      if (b) {
        const t = state.time || 0;
        if (b.phase === "active") {
          const elapsed = t - (b.expandStart || t);
          const speedUp = getActivityUpgradeLevel("breach", "speed") || 0;
          const expandDuration = BREACH_EXPAND_DURATION / (1 + speedUp * 0.15);
          const secLeft = Math.max(0, Math.ceil(expandDuration - elapsed));
          zoneTimerEl.textContent = "Breach açılıyor: " + secLeft + " sn";
        } else if (b.phase === "open_hold") {
          const holdElapsed = t - b.holdStart;
          const secLeft = Math.max(0, Math.ceil((b.holdDuration || BREACH_OPEN_HOLD_DURATION) - holdElapsed));
          zoneTimerEl.textContent = "Breach açık, " + secLeft + " sn sonra kapanacak.";
        } else if (b.phase === "closing") {
          const closeElapsed = t - b.closeStart;
          const secLeft = Math.max(0, Math.ceil((b.closeDuration || BREACH_CLOSE_DURATION) - closeElapsed));
          zoneTimerEl.textContent = "Breach kapanıyor: " + secLeft + " sn";
        }
        zoneTimerEl.classList.remove("hidden");
        zoneTimerEl.style.display = "block";
      } else {
        zoneTimerEl.classList.add("hidden");
        zoneTimerEl.style.display = "none";
      }
    } else {
      zoneTimerEl.classList.add("hidden");
      zoneTimerEl.style.display = "none";
    }
  }
}

function openChestPanel(skill, chestRef) {
  const el = document.getElementById("chestPanel");
  const cardEl = document.getElementById("chestCard");
  const chestHint = document.getElementById("chestHint");
  if (!el || !cardEl) return;
  el.classList.remove("hidden");
  cardEl.className = "card " + (skill.rarity || "common");
  cardEl.innerHTML = `<span class="cardIcon">ðŸ“¦</span><h3>${skill.name}</h3><span class="badge">${(skill.rarity || "common").toUpperCase()}</span><p>${skill.desc}</p><p class="chestCoins">Mevcut: ${state.coins ?? 0} Coin</p><p class="chestAccept">F veya Tikla - Al</p><button id="chestAcceptBtn" class="btn primary">Al</button>`;
  if (chestHint) chestHint.textContent = "F veya Tikla - Al";
  playSfx(260, 0.12, 0.7);
  playSfx((TIER_REVEAL_FREQ[skill.rarity || "common"] || TIER_REVEAL_FREQ.common), 0.14, 0.55);
  const accept = () => {
    applySkill(skill);
    acquiredOrder.push(skill.id);
    state.chestsOpened = (state.chestsOpened || 0) + 1;
    tryUnlockSkills();
    checkAchievements();
    el.classList.add("hidden");
    chestPanelOpen = false;
    if (chestRef && chestRef.mesh) {
      scene.remove(chestRef.mesh);
      const idx = worldChests.indexOf(chestRef);
      if (idx >= 0) worldChests.splice(idx, 1);
      for (let j = colliders.length - 1; j >= 0; j--) {
        if (colliders[j].chestRef === chestRef) { colliders.splice(j, 1); break; }
      }
    }
    playSfxLevel();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => {
    if (e.code === "Space" || e.code === "KeyF") {
      e.preventDefault();
      accept();
    }
  };
  document.addEventListener("keydown", onKey);
  const btn = document.getElementById("chestAcceptBtn");
  if (btn) btn.addEventListener("click", () => { accept(); document.removeEventListener("keydown", onKey); });
  setTimeout(() => {
    if (chestPanelOpen && chestPanelSkill === skill) accept();
  }, 4000);
}

function openChestPanelWithRoll(chestRef) {
  const el = document.getElementById("chestPanel");
  const cardEl = document.getElementById("chestCard");
  const chestHint = document.getElementById("chestHint");
  if (!el || !cardEl) return;
  const pool = skills.filter(canPickSkill);
  const rolled = pool.length ? pool[Math.floor(Math.random() * pool.length)] : { id: "fallback_heal", name: "Can +35", desc: "Kucuk iyilesme.", rarity: "common", apply() { stats.hp = Math.min(stats.maxHp, stats.hp + 35); } };
  chestPanelSkill = rolled;
  el.classList.remove("hidden");
  playSfx(155, 0.2, 0.5);
  playSfx(220, 0.12, 0.45);
  cardEl.className = "card common";
  cardEl.innerHTML = "<span class=\"cardIcon\">?</span><h3 id=\"chestRollName\">...</h3><p>Aciliyor...</p>";
  if (chestHint) chestHint.textContent = "";
  const nameEl = document.getElementById("chestRollName");
  let step = 0;
  const rollSteps = 6;
  const rollIntervalMs = 72;
  const rollInterval = setInterval(() => {
    step++;
    const tierCycle = TIER_ROLL_ORDER[step % TIER_ROLL_ORDER.length];
    cardEl.className = "card " + tierCycle;
    if (nameEl) nameEl.textContent = step < rollSteps ? (pool[Math.floor(Math.random() * pool.length)]?.name || "?") : rolled.name;
    playSfx(360 + step * 95, 0.11, 0.6);
    if (step >= rollSteps) {
      clearInterval(rollInterval);
      const finalRarity = rolled.rarity || "common";
      cardEl.className = "card " + finalRarity;
      cardEl.innerHTML = "<span class=\"cardIcon\">\uD83D\uDCE6</span><h3>" + rolled.name + "</h3><span class=\"badge rarity-" + finalRarity + "\">" + finalRarity.toUpperCase() + "</span><p>" + rolled.desc + "</p><p class=\"chestCoins\">Mevcut: " + (state.coins ?? 0) + " Coin</p><p class=\"chestReveal\">Gelen bonus</p>";
      if (chestHint) chestHint.textContent = "Kapaniyor...";
      const revealFreq = TIER_REVEAL_FREQ[finalRarity] || TIER_REVEAL_FREQ.common;
      playSfx(revealFreq, 0.2, 0.65);
      playSfx(revealFreq * 1.25, 0.14, 0.5);
      setTimeout(() => {
        if (!chestPanelOpen) return;
        applySkill(rolled);
        acquiredOrder.push(rolled.id);
        state.chestsOpened = (state.chestsOpened || 0) + 1;
        tryUnlockSkills();
        checkAchievements();
        el.classList.add("hidden");
        chestPanelOpen = false;
        if (chestRef && chestRef.mesh) {
          scene.remove(chestRef.mesh);
          const idx = worldChests.indexOf(chestRef);
          if (idx >= 0) worldChests.splice(idx, 1);
          for (let j = colliders.length - 1; j >= 0; j--) {
            if (colliders[j].chestRef === chestRef) { colliders.splice(j, 1); break; }
          }
        }
        playSfxLevel();
      }, 1100);
    }
  }, rollIntervalMs);
}

function spawnChest(pos) {
  const mesh = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.9), new THREE.MeshStandardMaterial({ color: 0xffc76a, roughness: 0.4, metalness: 0.15 }));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.32, 0.92), new THREE.MeshStandardMaterial({ color: 0xffae42, roughness: 0.36, metalness: 0.18 }));
  base.position.y = 0.3;
  lid.position.set(0, 0.76, -0.04);
  mesh.add(base, lid);
  mesh.position.copy(pos).add(new THREE.Vector3(0, 0.4, 0));
  mesh.userData = { lid, opened: false, t: 0, bonus: chestBonuses[Math.floor(Math.random() * chestBonuses.length)] };
  scene.add(mesh);
  chests.push({ mesh });
}

function updateChests(dt) {
  for (let i = chests.length - 1; i >= 0; i--) {
    const c = chests[i];
    const d = c.mesh.position.distanceTo(player.mesh.position);
    c.mesh.rotation.y += dt * 1.2;
    if (!c.mesh.userData.opened && d < 2.2) {
      c.mesh.userData.opened = true;
      playSfx(760, 0.1, 0.55);
      spawnRing(c.mesh.position, 2.8, 0xffd27a, 0.3);
      spawnDamageText(c.mesh.position, c.mesh.userData.bonus.name, false, c.mesh.userData.bonus.name);
      c.mesh.userData.bonus.apply();
    }
    if (c.mesh.userData.opened) {
      c.mesh.userData.t += dt;
      c.mesh.userData.lid.rotation.x = -Math.min(1.2, c.mesh.userData.t * 4);
      if (c.mesh.userData.t > 0.8) {
        scene.remove(c.mesh);
        chests.splice(i, 1);
      }
    }
  }
}

function updateCompanions(dt) {
  const groundY = typeof getGroundHeight === "function" ? getGroundHeight : (x, z) => (typeof sampleTerrainHeight === "function" ? sampleTerrainHeight(x, z) : 0);
  const moveSpeedBase = (c) => (c.data.meshType === "creature" ? 5.5 : 6) * (c.data.speedMult || 1);
  for (let i = companions.length - 1; i >= 0; i--) {
    const c = companions[i];
    c.timer -= dt;
    if (c.kind === "healer_minion") {
      const toPlayer = v0.copy(player.mesh.position).sub(c.mesh.position).setY(0);
      const distToPlayer = toPlayer.length();
      if (toPlayer.lengthSq() > 1) {
        toPlayer.normalize();
        c.mesh.position.addScaledVector(toPlayer, dt * 4);
      }
      c.mesh.position.y = groundY(c.mesh.position.x, c.mesh.position.z) + 0.6;
      if (c.mesh.rotation) c.mesh.rotation.y = Math.atan2(-toPlayer.x, -toPlayer.z);
      c.healTimer = (c.healTimer || 0) - dt;
      if (c.healTimer <= 0 && distToPlayer <= (c.data.healRange || 7)) {
        c.healTimer = c.data.healCooldown || 1.8;
        const heal = (c.data.healRate || 10) * (1 + (c.level - 1) * 0.15);
        stats.hp = Math.min(stats.maxHp, stats.hp + heal);
        if (typeof spawnBurst === "function") spawnBurst(player.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x44ff44, 3);
      }
      continue;
    }
    const range = (c.data.range || 16) * (1 + (c.level - 1) * 0.05);
    const target = typeof getNearestEnemyFromPos === "function" ? getNearestEnemyFromPos(c.mesh.position, range) : getNearestEnemy(range);
    if (target) {
      const dir = v0.copy(target.mesh.position).sub(c.mesh.position).setY(0);
      const dist = Math.max(0.001, dir.length());
      dir.normalize();
      const isProjectile = c.data.attackType === "projectile";
      const isAoe = c.data.attackType === "aoe";
      const attackRange = isProjectile || isAoe ? range : 2.2;
      const speed = moveSpeedBase(c);
      if (dist > attackRange) {
        c.mesh.position.addScaledVector(dir, dt * speed);
      }
      c.mesh.position.y = groundY(c.mesh.position.x, c.mesh.position.z) + (c.data.meshType === "creature" ? 0.6 : 1.2);
      if (c.mesh.rotation) c.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      if (c.timer <= 0) {
        c.timer = c.data.cooldown * (1 - (c.level - 1) * 0.05);
        const dmgMult = 1 + (c.level - 1) * 0.2;
        const dmg = c.data.damage * dmgMult;
        const distNow = c.mesh.position.distanceTo(target.mesh.position);
        if (distNow <= (isProjectile || isAoe ? range : 2.5)) {
          if (isAoe && typeof radialDamageEnemies === "function") {
            const rad = c.data.aoeRadius || 2.2;
            radialDamageEnemies(c.mesh.position.clone().setY(c.mesh.position.y + 0.5), rad, dmg);
            if (typeof spawnRing === "function") spawnRing(c.mesh.position, rad, c.data.color, 0.2);
            if (typeof spawnBurst === "function") spawnBurst(c.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), c.data.color, 4);
          } else if (isProjectile && typeof spawnProjectile === "function") {
            const from = c.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0));
            const toTarget = v1.copy(target.mesh.position).sub(from).setY(0).normalize();
            spawnProjectile({
              position: from,
              direction: toTarget,
              speed: c.data.projectileSpeed || 18,
              damage: dmg,
              radius: 0.14,
              life: 1.8,
              color: c.data.projectileColor || c.data.color,
              emissive: (c.data.projectileColor || c.data.color) >> 1,
            });
            spawnBurst(from, c.data.projectileColor || c.data.color, 2);
          } else {
            applyDamageEnemy(target, dmg, dir.clone(), false);
            spawnFlash(target.mesh.position, c.data.color, 0.4, 0.15);
          }
          if (c.data.burnOnHit && target) target.burnLeft = Math.max(target.burnLeft || 0, c.data.burnOnHit);
          if (c.data.slowOnHit && target) target.slowLeft = Math.max(target.slowLeft || 0, c.data.slowOnHit);
          if (c.data.poisonOnHit && target) target.poisonLeft = Math.max(target.poisonLeft || 0, c.data.poisonOnHit);
          if (c.data.stunOnHit && target) target.stunLeft = Math.max(target.stunLeft || 0, c.data.stunOnHit);
        }
      }
    } else {
      const toPlayer = v0.copy(player.mesh.position).sub(c.mesh.position).setY(0);
      if (toPlayer.lengthSq() > 4) {
        toPlayer.normalize();
        c.mesh.position.addScaledVector(toPlayer, dt * 4 * (c.data.speedMult || 1));
      }
      c.mesh.position.y = groundY(c.mesh.position.x, c.mesh.position.z) + (c.data.meshType === "creature" ? 0.6 : 1.2);
    }
  }
}

function spawnTurret(pos) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8, metalness: 0.3 }));
  base.position.y = 0.2;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7, metalness: 0.4 }));
  body.position.y = 0.8;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshStandardMaterial({ color: 0x63e0ff, emissive: 0x206080, emissiveIntensity: 0.3 }));
  head.position.y = 1.25;
  g.add(base, body, head);
  g.position.copy(pos);
  scene.add(g);
  const duration = (skillLevels.turret_master ? 35 : TURRET_DURATION);
  const dmgMult = (skillLevels.turret_master ? 1.2 : 1);
  placeableTurrets.push({ mesh: g, timer: duration, shootCd: 0, dmgMult });
}

function getNearestEnemyFromPos(pos, range, skip) {
  let nearest = null;
  let best = range * range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e._dead || (e.hp != null && e.hp <= 0)) continue;
    if (skip && skip.has(e)) continue;
    const ePos = e.mesh.position;
    const dx = ePos.x - pos.x;
    const dz = ePos.z - pos.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < best) { best = d2; nearest = e; }
  }
  return nearest;
}
function fireChainLightning(start, damage, jumps) {
  let from = start;
  const hit = new Set();
  let dmg = damage;
  const maxJ = Math.min(jumps || 4, 6);
  for (let n = 0; n < maxJ && from; n++) {
    hit.add(from);
    const dir = v0.copy(from.mesh.position).sub(player.mesh.position).setY(0);
    if (dir.lengthSq() > 0.0001) dir.normalize();
    applyDamageEnemy(from, dmg, dir, false, "lightning");
    spawnFlash(from.mesh.position, 0xaaddff, 0.45, 0.12);
    dmg *= 0.72;
    from = getNearestEnemyFromPos(from.mesh.position, 9, hit);
  }
}

function updateTurrets(dt) {
  for (let i = placeableTurrets.length - 1; i >= 0; i--) {
    const t = placeableTurrets[i];
    t.timer -= dt;
    if (t.timer <= 0) {
      spawnRing(t.mesh.position, 1.5, 0x888888, 0.3);
      scene.remove(t.mesh);
      placeableTurrets.splice(i, 1);
      continue;
    }
    t.shootCd -= dt;
    const target = getNearestEnemyFromPos(t.mesh.position, 18);
    if (target && t.shootCd <= 0) {
      t.shootCd = 0.5;
      const dir = v0.copy(target.mesh.position).sub(t.mesh.position).setY(0).normalize();
      applyDamageEnemy(target, (stats.damage * 0.8) * (t.dmgMult || 1), dir, false);
      spawnFlash(target.mesh.position, 0x63e0ff, 0.3, 0.1);
      if (t.mesh.children[2]) t.mesh.children[2].lookAt(target.mesh.position);
    }
  }
}

// Damage text havuzu (P1.3): her hasar sayisinda yeni canvas+texture+sprite
// yaratiliyordu. Artik texture metne gore onbellekten gelir, sprite havuzdan.
const DMG_TEXT_CACHE = new Map();
const DMG_TEXT_CACHE_MAX = 160;
const dmgSpritePool = [];
function getDamageTexture(text, isCrit, isBig, isCoin, isXp) {
  const key = text + "|" + (isCrit ? "c" : "") + (isBig ? "b" : "") + (isCoin ? "o" : "") + (isXp ? "x" : "");
  let tex = DMG_TEXT_CACHE.get(key);
  if (tex) return tex;
  const cw = 256, ch = 96;
  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d");
  const fontSize = isBig ? 42 : (isCrit ? 34 : (isCoin || isXp ? 34 : 30));
  ctx.font = "900 " + fontSize + 'px "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = cw / 2, cy = ch * 0.52;
  // Stronger shadow for better visibility (XP / Coin popups more readable)
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = isCoin || isXp ? 8 : 5;
  ctx.lineWidth = isBig ? 9 : (isCrit ? 8 : 6);
  ctx.strokeStyle = "#000";
  ctx.strokeText(text, cx, cy);
  ctx.lineWidth = 3;
  ctx.strokeStyle = isCrit ? "#fff" : "#333";
  ctx.strokeText(text, cx, cy);
  // Brighter colors for XP / Coin texts
  ctx.fillStyle = isCoin ? "#ffeb5a" : isXp ? "#8ff4ff" : isCrit ? "#ffdd44" : (isBig ? "#ffffff" : "#f0f8ff");
  ctx.fillText(text, cx, cy);
  tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  if (DMG_TEXT_CACHE.size >= DMG_TEXT_CACHE_MAX) {
    const oldestKey = DMG_TEXT_CACHE.keys().next().value;
    const oldest = DMG_TEXT_CACHE.get(oldestKey);
    DMG_TEXT_CACHE.delete(oldestKey);
    if (oldest) oldest.dispose();
  }
  DMG_TEXT_CACHE.set(key, tex);
  return tex;
}
function releaseDamageSprite(sprite) {
  if (!sprite) return;
  if (sprite.parent) sprite.parent.remove(sprite);
  if (dmgSpritePool.length < 32) dmgSpritePool.push(sprite);
}
function spawnDamageText(pos, amount, isCrit = false, label) {
  if (effects.length >= MAX_EFFECTS) return;
  let dmgTextCount = 0;
  for (let i = 0; i < effects.length; i++) { if (effects[i].type === "dmgText") dmgTextCount++; }
  if (dmgTextCount >= MAX_DAMAGE_TEXTS) return;
  const isBig = !!(label && (label.indexOf("BOOM") !== -1 || label.indexOf("BOSS") !== -1 || label.indexOf("BOLUM") !== -1 || label.indexOf("SHRINE") !== -1));
  const isCoin = !!(label && label.indexOf("Coin") !== -1);
  const isXp = !!(label && label.indexOf("XP") !== -1);
  const text = label || (isCrit ? "CRIT " + Math.round(amount) : "" + Math.round(amount));
  const tex = getDamageTexture(text, isCrit, isBig, isCoin, isXp);
  let sprite = dmgSpritePool.pop();
  if (sprite) {
    sprite.material.map = tex;
    sprite.material.opacity = 0.98;
  } else {
    sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.98, depthTest: false }));
  }
  const scale = isBig ? 4.2 : (isCrit ? 3.4 : 2.9);
  sprite.scale.set(scale, scale * 0.42, 1);
  sprite.position.copy(pos).add(v3.set(0, 2.6, 0));
  scene.add(sprite);
  effects.push({ type: "dmgText", pooled: true, mesh: sprite, vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, 2.2, (Math.random() - 0.5) * 0.6), life: 1.0, total: 1.0 });
}

const MAX_ENEMY_SPEECH_BUBBLES = 3;
const ENEMY_SPEECH_COOLDOWN = 20;
function spawnEnemySpeechBubble(enemy, text) {
  if (!enemy || enemy._dead) return;
  if ((enemy.speechBubbleUntil || 0) > state.time) return;
  if (effects.filter((f) => f.type === "enemySpeech").length >= MAX_ENEMY_SPEECH_BUBBLES) return;
  if (effects.length >= MAX_EFFECTS) return;
  enemy.speechBubbleUntil = state.time + ENEMY_SPEECH_COOLDOWN;
  const canvas = document.createElement("canvas");
  const pad = 14;
  const fontSize = enemy.isBoss ? 28 : 22;
  const ctx = canvas.getContext("2d");
  ctx.font = `bold ${fontSize}px Sora, Segoe UI, sans-serif`;
  const m = ctx.measureText(text);
  const w = Math.min(320, Math.ceil(m.width) + pad * 2);
  const h = fontSize + pad * 2;
  canvas.width = w;
  canvas.height = h;
  ctx.font = `bold ${fontSize}px Sora, Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const r = 12;
  ctx.fillStyle = "rgba(20,12,8,0.92)";
  ctx.strokeStyle = "rgba(220,80,60,0.9)";
  ctx.lineWidth = 3;
  roundRect(ctx, 0, 0, w, h, r);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffeedd";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 4;
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  const yOff = enemy.isBoss ? 4.2 : (enemy.mesh?.position?.y !== undefined ? (enemy.radius || 0.9) + 1.8 : 2.6);
  const scale = enemy.isBoss ? 3.2 : 2.4;
  sprite.scale.set(scale * (w / 120), scale * (h / 120), 1);
  sprite.position.copy(enemy.mesh.position).add(new THREE.Vector3(0, yOff, 0));
  scene.add(sprite);
  effects.push({ type: "enemySpeech", mesh: sprite, life: 2.5, total: 2.5, enemy });
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function spawnTelegraph(pos, radius, damage, delay, source, color) {
  if (effects.length >= MAX_EFFECTS) return;
  const teleColor = color || (source === "enemy" ? 0xff5f88 : 0xffb474);
  const mesh = new THREE.Mesh(new THREE.RingGeometry(radius * 0.25, radius, 40), new THREE.MeshBasicMaterial({ color: teleColor, transparent: true, opacity: 0.42, side: THREE.DoubleSide }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(pos).setY(sampleTerrainHeight(pos.x, pos.z) + 0.09);
  scene.add(mesh);
  effects.push({ type: "telegraph", source, mesh, life: delay, total: delay, radius, damage, triggered: false, color: mesh.material.color.getHex() });
}

let _damageDepth = 0;
function radialDamageEnemies(pos, radius, damage, damageType = null) {
  if (_damageDepth > 2) return; // prevent infinite recursion
  _damageDepth++;
  const r2 = radius * radius;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e || e.hp <= 0) continue;
    if (e.mesh.position.distanceToSquared(pos) > r2) continue;
    const dir = v0.copy(e.mesh.position).sub(pos).setY(0);
    if (dir.lengthSq() > 0.0001) dir.normalize();
    applyDamageEnemy(e, damage, dir, false, damageType);
  }
  _damageDepth--;
}

function sectorDamageEnemies(origin, aimDir, radius, halfAngle, damage, isCrit = false) {
  if (_damageDepth > 2) return;
  _damageDepth++;
  const r2 = radius * radius;
  const ax = aimDir.x, az = aimDir.z;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e || e.hp <= 0) continue;
    const dx = e.mesh.position.x - origin.x, dz = e.mesh.position.z - origin.z;
    if (dx * dx + dz * dz > r2) continue;
    const len = Math.sqrt(dx * dx + dz * dz) || 0.001;
    const dot = (dx * ax + dz * az) / len;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (angle > halfAngle) continue;
    const dir = v0.set(dx / len, 0, dz / len);
    applyDamageEnemy(e, damage, dir, isCrit);
  }
  _damageDepth--;
}

function spawnDismantle(origin, aimDir, damage, radius, arcAngle) {
  const halfAngle = arcAngle * 0.5;
  sectorDamageEnemies(origin, aimDir, radius, halfAngle, damage);
  const innerR = radius * 0.45, outerR = radius * 1.05;
  const geom = new THREE.RingGeometry(innerR, outerR, 24, 1, 0, arcAngle);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.98, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = -Math.atan2(aimDir.x, aimDir.z);
  const glowGeom = new THREE.RingGeometry(innerR * 0.7, outerR * 1.15, 24, 1, 0, arcAngle);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  glow.rotation.copy(mesh.rotation);
  const group = new THREE.Group();
  group.position.copy(origin).setY(origin.y + 0.35);
  group.add(mesh);
  group.add(glow);
  scene.add(group);
  effects.push({ type: "dismantle", mesh: group, life: 0.38, total: 0.38 });
  spawnRing(origin, radius * 0.8, 0xff6622, 0.35);
  spawnRing(origin, radius * 0.5, 0xffdd88, 0.2);
  playSfx(220, 0.12);
}

function spawnFragmentationDebris(pos, count) {
  const current = effects.filter((x) => x.type === "debris").length;
  const toSpawn = Math.min(count, Math.max(0, MAX_DEBRIS - current));
  if (toSpawn <= 0) return;
  const geo = new THREE.SphereGeometry(0.12, 4, 3);
  for (let i = 0; i < toSpawn; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.3 + Math.random() * 0.4;
    const vel = new THREE.Vector3((Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4);
    scene.add(mesh);
    effects.push({ type: "debris", mesh, life: 0.6, total: 0.6, vel });
  }
}

function killEnemy(enemy) {
  if (enemy._dead) return; // prevent double-kill
  enemy._dead = true;
  if (enemy === pendingCreeperExplosion) pendingCreeperExplosion = null;
  const deathPos = enemy.mesh.position.clone();
  if (enemy._frostKill) spawnFragmentationDebris(deathPos, 7);
  if (enemy.mutation === "exploding") {
    radialDamageEnemies(deathPos, 3.5, 25 + (state.difficultyStage || 0) * 3);
    spawnRing(deathPos, 3.5, 0xff6622, 0.4);
    spawnFlash(deathPos, 0xff4400, 0.8, 0.25);
    if (player.mesh && player.mesh.position.distanceTo(deathPos) < 4 && (!state.invincibleUntil || state.time >= state.invincibleUntil)) {
      stats.hp -= 12 * Math.max(0, 1 - (stats.armor || 0));
      state.invincibleUntil = state.time + 0.22;
      triggerCameraShake(0.55);
    }
  }
  for (let i = effects.length - 1; i >= 0; i--) {
    if (effects[i].type === "enemySpeech" && effects[i].enemy === enemy) {
      const m = effects[i].mesh && effects[i].mesh.material;
      if (m) { if (m.map) m.map.dispose(); m.dispose(); }
      scene.remove(effects[i].mesh);
      effects.splice(i, 1);
      break;
    }
  }
  if (stats.healOnKill) stats.hp = Math.min(stats.maxHp, stats.hp + stats.healOnKill);
  if (stats.bloodlust) state._bloodlustUntil = (state.time || 0) + 3;
  // Remove from array FIRST to prevent recursive kills on same enemy
  const idx = enemies.indexOf(enemy);
  if (idx >= 0) enemies.splice(idx, 1);
  releaseEnemyVisuals(enemy);
  if (enemy.mesh && enemy.mesh.parent) scene.remove(enemy.mesh);
  if (!enemy._meshPooled) disposeMeshDeep(enemy.mesh);
  if (!gameOver && !state.attackRoundActive && !state.inTemple && enemies.length < getMaxEnemies() && !enemy.isBoss) spawnEnemy();
  if (stats.poisonCloud) {
    radialDamageEnemies(enemy.mesh.position, 2.5, 8 + (stats.poison || 0) * 2);
    enemies.forEach((o) => { if (o.mesh.position.distanceTo(enemy.mesh.position) < 2.8) o.poisonLeft = Math.max(o.poisonLeft || 0, 1.5); });
    spawnRing(enemy.mesh.position, 2.5, 0x88ff88, 0.25);
  }
  if (stats.glueOnKill) {
    state.slowPuddles = state.slowPuddles || [];
    if (state.slowPuddles.length >= 2) state.slowPuddles.shift();
    state.slowPuddles.push({ x: deathPos.x, z: deathPos.z, radius: 2.5, life: 5 });
  }
  state.kills += 1;
  if (enemy.abyssPitRef) {
    enemy.abyssPitRef.killsThisWave++;
  }
  if (enemy.ritualRef) {
    enemy.ritualRef.killsThisWave++;
  }
  if (enemy.isBreach && enemy.breachRef) {
    spawnBreachEnemy(enemy.breachRef, true);
    enemy.breachRef.prevRadius = enemy.breachRef.currentRadius;
  }
  if (enemy.isAbyssBoss && enemy.abyssPitRef) {
    const pit = enemy.abyssPitRef;
    const bossPos = enemy.mesh.position.clone();
    spawnWorldChestAt(bossPos);
    state.abyssPoints = (state.abyssPoints || 0) + 1;
    if (typeof showGameNotification === "function") showGameNotification("Abyss tamamlandi! +1 Abyss puani (P ile harcayin)", { rainbow: false });
    if (pit.group && scene) scene.remove(pit.group);
    if (pit.ring && pit.ring.geometry) pit.ring.geometry.dispose();
    if (pit.interior && pit.interior.geometry) pit.interior.geometry.dispose();
    const idx = abyssPits.indexOf(pit);
    if (idx >= 0) abyssPits.splice(idx, 1);
    spawnDamageText(bossPos, "ABYSS BOSU - BEDAVA SANDIK!", true, "ABYSS");
    spawnRing(bossPos, 5, 0x1a8a2e, 0.5);
  }
  if (player.mesh) {
    const k = state.kills;
    if (k === 7) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), "7 LUCKY!", true, "7");
    else if (k === 69) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3.5, 0)), "69 NICE!", true, "69");
    else if (k === 100) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3.5, 0)), "100 KILL!", true, "100");
    else if (k === 111) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3.5, 0)), "111 ONES!", true, "111");
    else if (k === 420) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "420 BLAZE IT!", true, "420");
    else if (k === 666) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "666 SEYTAN!", true, "666");
    else if (k === 777) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "777 JACKPOT!", true, "777");
    else if (k === 1337) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "1337 H4X0R!", true, "1337");
    else if (k === 2024) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "2024 FUTURE!", true, "2024");
  }
  const now = state.time || 0;
  if (now - (state.lastKillTime || 0) < 2.2) state.killCombo = (state.killCombo || 0) + 1;
  else state.killCombo = 1;
  state.lastKillTime = now;
  if (state.killCombo >= 3) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3.5, 0)), `x${state.killCombo} COMBO!`, true, "combo");
  const streakMult = state.killCombo >= 10 ? 1.35 : state.killCombo >= 5 ? 1.18 : 1;
  const hardcoreRewardMult = state.hardcoreMode ? 4 : 1;
  const bonusMult = state.bonusTime ? 1.6 : 1;
  if (state.bonusTime) state.bonusTimeComboCount = (state.bonusTimeComboCount || 0) + 1;
  const bonusComboMult = state.bonusTime ? Math.max(1, 1 + (state.bonusTimeComboCount || 0) * 0.12) : 1;
  state.rageMeter = Math.min(100, (state.rageMeter || 0) + 5);
  const doublePointsMult = (state.doublePointsUntil && state.time < state.doublePointsUntil) ? 2 : 1;
  let xpAmount = enemy.xp * streakMult * hardcoreRewardMult * bonusMult * (state.bonusTime ? bonusComboMult : 1) * doublePointsMult * GLOBAL_KILL_XP_MULT;
  if (!enemy.isAbyss && !enemy.isBoss) xpAmount *= NORMAL_MOB_XP_MULT;
  const baseCoin = enemy.isBoss ? (15 + Math.floor(Math.random() * 20)) : (1 + Math.floor(Math.random() * 3));
  let coinDrop = Math.floor(baseCoin * (stats.coinMult || 1) * (stats.goldGainMult || 1) * (state.difficultyMult || 1) * streakMult * (enemy.isElite ? 1.4 : 1) * hardcoreRewardMult * bonusMult * bonusComboMult);
  const luckyDrop = Math.random() < 0.06;
  if (luckyDrop) { coinDrop *= 2; spawnDamageText(enemy.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), "LUCKY!", true, "lucky"); }
  if (Math.random() < 0.14) state.mana = Math.min(state.maxMana, state.mana + 8);
  const coinCount = Math.min(5, Math.max(1, Math.floor(coinDrop / 3)));
  const coinPer = Math.ceil(coinDrop / coinCount);
  for (let ci = 0; ci < coinCount; ci++) spawnCoinPickup(enemy.mesh.position.clone(), coinPer);
  spawnDamageText(enemy.mesh.position.clone().add(new THREE.Vector3(0.5, 2.2, 0)), `+${coinDrop} Coin`, false, "coin");
  const magnetChance = MAGNET_DROP_RATE[enemy.tier] || MAGNET_DROP_RATE.normal;
  if (Math.random() < magnetChance) spawnMagnetPickup(enemy.mesh.position.clone());
  const slowmoChance = SLOWMO_DROP_RATE[enemy.tier] || SLOWMO_DROP_RATE.normal;
  if (Math.random() < slowmoChance) spawnSlowmoPickup(enemy.mesh.position.clone());
    if (enemy.isBoss) {
    state.bossesDefeated += 1;
    const bossPos = enemy.mesh.position.clone();
    spawnChest(bossPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4)));
    spawnDamageText(enemy.mesh.position, "BOSS DOWN", true, enemy.name ? `${enemy.name} DOWN` : "BOSS DOWN");
    spawnRing(enemy.mesh.position, 6.6, 0xff7a6c, 0.45);
    playSfx(240, 0.22);
    if (enemy.isVoidBoss) {
      state.portalUnlocked = true;
      spawnDamageText(enemy.mesh.position, "HARITA BOSU KESILDI - PORTAL ACILDI!", true, "PORTAL ACILDI");
      playSfx(660, 0.2);
    }
    if (enemy.isTempleBoss) {
      state.portalUnlocked = true;
      spawnDamageText(enemy.mesh.position, "TAPINAK BOSU KESILDI - PORTAL ACILDI!", true, "PORTAL ACILDI");
      if (typeof showGameNotification === "function") showGameNotification("TAPINAK BOSU YOK! Portala gir, sonraki bolume gec.");
      playSfx(660, 0.2);
    }
    if ((enemy.bossIndex === 0 || enemy.bossIndex === 1) && !enemy.isVoidBoss && !enemy.isTempleBoss && !state.inMegaArena && enemy.isChapterFinalBoss) {
      if (state.chapter === 1) {
        enterTemple(1);
      } else if (state.chapter === 2) {
        enterTemple(2);
      } else {
        const portalPos = enemy.mesh.position.clone();
        portalPos.y = 0;
        spawnPortal(portalPos);
        state.portalUnlocked = true;
        state.portalPos = portalPos;
        if (typeof showGameNotification === "function") showGameNotification("BOLUM PORTALI ACILDI! Portala girerek sonraki bolume gec.");
        spawnDamageText(enemy.mesh.position, "PORTAL ACILDI!", true, "PORTAL");
      }
    }
    if (enemy.bossIndex === 2 && !state.inMegaArena && enemy.isChapterFinalBoss) {
      state.boss3Defeated = true;
      var mapId = state.currentMapId || "classic";
      var px, pz;
      if (mapId === "island") {
        for (var retries = 0; retries < 50; retries++) {
          var angle = Math.random() * Math.PI * 2;
          var r = 25 + Math.random() * (ISLAND_RADIUS - 55);
          px = Math.cos(angle) * r;
          pz = Math.sin(angle) * r;
          if (Math.hypot(px, pz) < ISLAND_RADIUS - 30) break;
        }
      } else {
        var bound = WORLD_HALF - 35;
        px = (Math.random() - 0.5) * 2 * bound;
        pz = (Math.random() - 0.5) * 2 * bound;
        if (Math.hypot(px, pz) < 25) { px += 30; pz += 30; }
      }
      spawnPortal(new THREE.Vector3(px, 0, pz));
      state.portalUnlocked = false;
      state.portalChargeTime = 0;
      state.portalVoidBossSpawned = false;
    }
    if (enemy.isMegaBoss) {
      state.endlessMode = true;
      state.endlessTime = 0;
      state.endlessWave = 0;
      spawnDamageText(enemy.mesh.position, "SONSUZ MOD!", true, "SONSUZ MOD!");
      spawnRing(enemy.mesh.position, 15, 0xffdd44, 0.8);
    }
  }
  dropXpOrbs(enemy.mesh.position, xpAmount, enemy.tier);
  addFloatingXp(xpAmount);
  addFloatingGold(coinDrop);
  // Show XP gained (use actual xpAmount for accuracy)
  spawnDamageText(enemy.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), `+${Math.floor(xpAmount)} XP`, false, "xp");
  if (Math.random() < (enemy.isBoss ? 0.26 : 0.04)) spawnWorldPickup(enemy.mesh.position.clone(), enemy.isBoss ? ["heal", "magnet", "dmg", "shield"] : ["heal", "magnet", "dmg"]);
  if (Math.random() < 0.0009) spawnWorldPickup(enemy.mesh.position.clone(), ["double_points"]);
  if (!enemy.isBoss && Math.random() < 0.00012) spawnWorldPickup(enemy.mesh.position.clone(), ["insta_kill"]);
  const heraldDropChance = enemy.isBoss ? 0.018 : 0.003;
  if (Math.random() < heraldDropChance) {
    const heraldTypes = ["herald_thunder", "herald_ice", "herald_ash"];
    spawnWorldPickup(enemy.mesh.position.clone(), heraldTypes);
  }
  const chestChance = (enemy.isBoss ? 0.022 : 0.003) * (state.bossDropMult || 1);
  if (Math.random() < chestChance) spawnWorldChestAt(enemy.mesh.position.clone());
  // Death dust cloud
  spawnDustCloud(enemy.mesh.position, enemy.tier === "boss" ? 0xff4444 : 0xaa9977, enemy.isBoss ? 8 : 3);
  spawnFlash(enemy.mesh.position, enemy.tier === "unique" ? 0xff9ef4 : 0xff6a6a, 0.9, 0.22);
  if (enemy.isBoss) {
    triggerBigShake();
    spawnBurst(enemy.mesh.position, 0xff2244, 10);
    playSfx(180, 0.2, 0.4);
    triggerHitFreeze(0.06);
    if (enemy.isHerobrine && typeof showGameNotification === "function") {
      setTimeout(() => showGameNotification("HEROBRINE YOK EDILDI! Efsane!", { rainbow: true }), 800);
    }
  }
  if (enemy.name && enemy.tier !== "normal" && !enemy.isBoss) spawnDamageText(enemy.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), enemy.name, false, enemy.name);
  companions.forEach(function(c) {
    c.xp = (c.xp || 0) + enemy.xp * 0.35;
    const xpToNext = 40 + (c.level || 1) * 25;
    if (c.xp >= xpToNext && (c.level || 1) < 10) {
      c.xp = 0;
      c.level = (c.level || 1) + 1;
      if (player.mesh) spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), "Pet Lv" + c.level + "!", true, "pet");
    }
  });
  if (state.quests && state.quests.length) {
    state.quests.forEach(function(q) {
      if (q.claimed) return;
      if (q.type === "kills") q.progress = Math.min(q.target, state.kills || 0);
      if (q.type === "bosses") q.progress = Math.min(q.target, state.bossesDefeated || 0);
    });
    saveQuests();
  }
  tryUnlockSkills();
  checkAchievements();
}

const SKILL_DAMAGE_TYPES = { fire: 1, ice: 1, frost: 1, lightning: 1 };
function applyDamageEnemy(e, damage, dir, isCrit = false, damageType = null) {
  if (!e || e._dead || e.hp <= 0) return;
  const skipHitEffect = damageType != null && SKILL_DAMAGE_TYPES[damageType];
  let d = damage;
  if (state.instaKillUntil && state.time < state.instaKillUntil) d = e.hp;
  if (e.isBoss && stats.bossDmgMult) d *= stats.bossDmgMult;
  if ((e.tier === "rare" || e.tier === "unique" || e.isBoss) && stats.eliteDmgMult) d *= stats.eliteDmgMult;
  if (e.tier === "normal" && stats.normalEnemyDmgMult) d *= stats.normalEnemyDmgMult;
  if (stats.titanKiller && e.isBoss && e.hp <= (e.maxHp || e.hp) * 0.05) { e.hp = 0; killEnemy(e); return; }
  if (stats.executioner && !e.isBoss && (e.hp - d) <= (e.maxHp || e.hp) * 0.15) { e.hp = 0; killEnemy(e); return; }
  if (stats.execute > 0 && e.hp <= (e.maxHp || e.hp) * 0.35) d *= 1 + stats.execute;
  if (state._bloodlustUntil && state.time < state._bloodlustUntil && stats.bloodlust) d *= 1 + stats.bloodlust;
  if (state.rageUntil && state.time < state.rageUntil) d *= 1.25;
  if (stats.hp <= stats.maxHp * 0.4) {
    if (stats.berserker > 0) d *= 1 + stats.berserker;
    if (stats.berserkerLegendary) d *= 1.5;
  }
  if (state.rageMeter !== undefined) state.rageMeter = Math.min(100, (state.rageMeter || 0) + d * 0.12);
  e.hitCount = (e.hitCount || 0) + 1;
  if (e.hitCount % 4 === 0) e.stunLeft = Math.max(e.stunLeft || 0, 0.35);
  const hot = stats.heraldOfThunder || 0;
  const hoi = stats.heraldOfIce || 0;
  const hoa = stats.heraldOfAsh || 0;
  const hasAnyHerald = hot > 0 || hoi > 0 || hoa > 0;
  if (hasAnyHerald) {
    const now = state.time || 0;
    if (now - (state.heraldLastSecondReset || 0) >= 1) {
      state.heraldStrikesThisSecond = 0;
      state.heraldLastSecondReset = now;
    }
    const heraldAllowed = (state.heraldStrikesThisSecond || 0) < HERALD_MAX_PER_SECOND;
    if (heraldAllowed) {
      state.heraldStrikesThisSecond = (state.heraldStrikesThisSecond || 0) + 1;
      const auraT = state.auraTriggers || { thunder: 0, ice: 0, ash: 0 };
      state.auraTriggers = auraT;
      if (hot > 0) {
        d += d * (0.18 + hot * 0.07);
        auraT.thunder = (auraT.thunder || 0) + 1;
        if (typeof spawnHeraldThunderBolt === "function") spawnHeraldThunderBolt(e.mesh.position.clone());
        if (typeof scene !== "undefined" && state.lightningTelegraphs) {
          const pos = e.mesh.position.clone();
          pos.y = sampleTerrainHeight(pos.x, pos.z) + 0.1;
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 1.2, 24),
            new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.copy(pos);
          scene.add(ring);
          state.lightningTelegraphs.push({ pos: pos.clone(), strikeAt: state.time + 1.0, mesh: ring, createdAt: state.time, radius: 2.8, damage: 22 + hot * 4, noPlayerDamage: true });
        }
        if (!state.lastHeraldLabelTime || (state.time || 0) - state.lastHeraldLabelTime >= 0.6) {
          state.lastHeraldLabelTime = state.time || 0;
          if (typeof spawnDamageText === "function") spawnDamageText(e.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), "HERALD", false, "herald");
        }
      }
      if (hoi > 0) {
        d += d * (0.12 + hoi * 0.05);
        auraT.ice = (auraT.ice || 0) + 1;
        e.slowLeft = Math.max(e.slowLeft || 0, 0.9);
        spawnBurst(e.mesh.position, 0x88ddff, 3);
        spawnRing(e.mesh.position, 1.8, 0x66bbff, 0.2);
        playSfx(340, 0.06, 0.55);
        if (!state.lastHeraldLabelTime || (state.time || 0) - state.lastHeraldLabelTime >= 0.6) {
          state.lastHeraldLabelTime = state.time || 0;
          if (typeof spawnDamageText === "function") spawnDamageText(e.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), "HERALD", false, "herald");
        }
      }
      if (hoa > 0) {
        d += d * (0.1 + hoa * 0.04);
        auraT.ash = (auraT.ash || 0) + 1;
        e.burnLeft = Math.max(e.burnLeft || 0, 1.2);
        spawnFlash(e.mesh.position, 0xff8844, 0.45, 0.1);
        spawnRing(e.mesh.position, 1.5, 0xff6622, 0.16);
        playSfx(380, 0.04, 0.55);
        if (!state.lastHeraldLabelTime || (state.time || 0) - state.lastHeraldLabelTime >= 0.6) {
          state.lastHeraldLabelTime = state.time || 0;
          if (typeof spawnDamageText === "function") spawnDamageText(e.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), "HERALD", false, "herald");
        }
      }
    }
  }
  if (stats.shock) d *= 1 + stats.shock;
  e.hp -= d;
  if (e.hp <= 0 && (damageType === "ice" || damageType === "frost")) e._frostKill = true;
  if (abilityState.smite && abilityState.smite.level > 0) spawnSmiteRing(e);
  if (!state._kineticBlastFiring && abilityState.kineticBlast && abilityState.kineticBlast.level > 0) spawnKineticBlast(e);
  const lifestealMult = 1 + (stats.vampSynergy || 0);
  if (stats.lifesteal > 0) {
    const effectiveLifesteal = Math.min(0.01, (stats.lifesteal || 0) * lifestealMult);
    stats.hp = Math.min(stats.maxHp, stats.hp + d * effectiveLifesteal);
  }
  if (stats.poison > 0) {
    e.poisonLeft = Math.max(e.poisonLeft, 2.0 + stats.poison * 0.8);
    spawnFlash(e.mesh.position.clone().add(new THREE.Vector3(0, 0.9, 0)), 0x44cc44, 0.35, 0.12);
  }
  if (stats.slow > 0) e.slowLeft = Math.max(e.slowLeft, Math.min(0.65, stats.slow));
  const freezeMult = stats.frostSlowSynergy ? 1.3 : 1;
  if (stats.freeze) e.freezeLeft = Math.max(e.freezeLeft, stats.freeze * 1.5 * freezeMult);
  if (stats.burn) e.burnLeft = Math.max(e.burnLeft, 2.0);
  if ((stats.bleed || 0) > 0) e.bleedLeft = Math.max(e.bleedLeft || 0, 1.5 + stats.bleed * 0.5);
  const inRitual = e.ritualRef && state.activeRitual;
  let knockMult = 1;
  if (!inRitual) {
    const speedResist = Math.min(0.7, (e.speed || 4) * 0.08);
    const eliteResist = (e.isElite ? 0.4 : 0) + (e.isBoss ? 0.6 : 0);
    knockMult = Math.max(0.15, 1 - speedResist - eliteResist);
  } else knockMult = 0;
  if (stats.knockback > 0 && dir && knockMult > 0) e.push.add(dir.clone().multiplyScalar((2.2 + stats.knockback * 0.8) * knockMult));
  if ((stats.springGlove || 0) > 0 && dir && knockMult > 0) e.push.add(dir.clone().multiplyScalar((2.8 + (stats.springGlove || 0) * 1.4) * knockMult));
  const ragdollThreshold = (e.maxHp || e.hp) * 0.15;
  if (d > ragdollThreshold) e.ragdollUntil = (state.time || 0) + 0.2;

  if (stats.staticShiv > 0 && _damageDepth < 2) {
    state.staticShivCounter = (state.staticShivCounter || 0) + 1;
    if (state.staticShivCounter >= 3) {
      state.staticShivCounter = 0;
      const chainDamage = damage * 0.5 + 15;
      const chainRange = 8;
      let count = 0;
      _damageDepth++;
      for (let j = 0; j < enemies.length && count < 2; j++) {
        const other = enemies[j];
        if (other === e || other._dead || other.hp <= 0) continue;
        const d2 = other.mesh.position.distanceToSquared(e.mesh.position);
        if (d2 <= chainRange * chainRange) {
          applyDamageEnemy(other, chainDamage, v0.copy(other.mesh.position).sub(e.mesh.position).setY(0).normalize(), false, "lightning");
          spawnFlash(other.mesh.position, 0xaaddff, 0.4, 0.15);
          count++;
        }
      }
      _damageDepth--;
      spawnRing(e.mesh.position, 3, 0x88ccff, 0.2);
      playSfx(600, 0.06, 0.55);
    }
  }

  if ((stats.runaan || 0) > 0 && _damageDepth < 2) {
    const runaanRange = 7;
    const runaanDmg = d * 0.6;
    const runaanDir = dir ? dir.clone() : v0.copy(player.mesh.position).sub(e.mesh.position).setY(0).normalize();
    const nearby = [];
    for (let j = 0; j < enemies.length; j++) {
      const other = enemies[j];
      if (other === e || other._dead || (other.hp != null && other.hp <= 0)) continue;
      const d2 = other.mesh.position.distanceToSquared(e.mesh.position);
      if (d2 <= runaanRange * runaanRange) nearby.push({ e: other, d2 });
    }
    nearby.sort((a, b) => a.d2 - b.d2);
    let count = 0;
    _damageDepth++;
    for (let j = 0; j < nearby.length && count < 2; j++) {
      const other = nearby[j].e;
      const toOther = v1.copy(other.mesh.position).sub(e.mesh.position).setY(0).normalize();
      applyDamageEnemy(other, runaanDmg, toOther, false, damageType);
      spawnFlash(other.mesh.position, 0xffaa66, 0.35, 0.1);
      count++;
    }
    _damageDepth--;
  }

  if (!skipHitEffect) {
    if (typeof triggerCameraShake === "function") triggerCameraShake(0.24);
    if (typeof triggerHitFreeze === "function") triggerHitFreeze(0.022);
  }
  const dmgText = isCrit ? "CRIT! " + Math.floor(d) : "" + Math.floor(d);
  spawnDamageText(e.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), d, isCrit, dmgText);
  if (isCrit && !skipHitEffect) {
    spawnBurst(e.mesh.position, 0xffdd44, 3);
    if (typeof triggerCameraShake === "function") triggerCameraShake(0.48);
    if (typeof triggerHitFreeze === "function") triggerHitFreeze(0.055);
    playSfx(720, 0.12, 0.5);
  }
  if (Math.random() < 0.02 && (e.speechBubbleUntil || 0) <= state.time) {
    const lines = e.isBoss ? ENEMY_SPEECH_BOSS : ENEMY_SPEECH_LINES;
    spawnEnemySpeechBubble(e, lines[Math.floor(Math.random() * lines.length)]);
  }
  if (e.hp <= 0) killEnemy(e);
}
function updatePlayer(dt) {
  updateAim();

  if ((state.playerPoisonLeft || 0) > 0) {
    state.playerPoisonLeft -= dt;
    const dps = 2.5;
    stats.hp -= dps * dt;
    if (state.time % 0.4 < dt) spawnFlash(player.mesh.position.clone().setY(player.mesh.position.y + 0.5), 0x44cc44, 0.2, 0.08);
  }

  if ((state.flickerTeleportTimer || 0) > 0) {
    state.flickerTeleportTimer -= dt;
    if (state.flickerTeleportTimer <= 0 && state.flickerTargetEnemy) {
      const e = state.flickerTargetEnemy;
      const dmg = state.flickerDamage || (abilityState.flickerStrike && abilityState.flickerStrike.damage) || 38;
      const dir = v0.copy(e.mesh.position).sub(player.mesh.position).setY(0);
      if (dir.lengthSq() > 0.0001) dir.normalize();
      player.mesh.position.copy(e.mesh.position).add(dir.clone().multiplyScalar(e.radius + 0.6));
      player.mesh.position.y = sampleTerrainHeight(player.mesh.position.x, player.mesh.position.z);
      player.vel.set(0, 0, 0);
      player.wallJumpCooldown = 0;
      player.wallJumpCoyote = 0;
      if (state.flickerKillingBlow) {
        const halfH = (e.radius || 1) * 0.9;
        const expPos = e.mesh.position.clone();
        expPos.y += halfH;
        spawnRing(expPos, 2.2, 0xffdd88, 0.35);
        spawnFlash(expPos, 0xffcc66, 0.7, 0.25);
        spawnBurst(player.mesh.position, 0xffdd99, 5);
      }
      applyDamageEnemy(e, dmg, dir.clone().negate(), false);
      spawnSlash(player.mesh.position.clone().add(new THREE.Vector3(dir.x * 1.2, 0.9, dir.z * 1.2)), dir, 0xffaa88);
      playSfx(420, 0.1, 0.55);
      state.flickerTargetEnemy = null;
      state.flickerKillingBlow = false;
    }
  }

  // Kamera yonune gore W/A/S/D hareketi
  const inputX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
  const inputZ = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
  const move = v0.set(inputX, 0, inputZ);
  if (move.lengthSq() > 0) move.normalize();

  const angleMode = (typeof camSettings !== "undefined" && camSettings.cameraAngle) || "default";
  const isoMove = angleMode === "isometric" || angleMode === "isometric_angled";
  let forward, right;
  if (isoMove && camera && player.mesh) {
    // Izometrik / LoL: W = ekran yukari (kameradan karaktere yon), hareket kameraya gore
    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;
    const cx = camera.position.x;
    const cz = camera.position.z;
    forward = v1.set(px - cx, 0, pz - cz);
    if (forward.lengthSq() < 0.0001) forward.set(Math.sin(camYaw), 0, Math.cos(camYaw));
    forward.normalize();
    right = v2.set(-forward.z, 0, forward.x);
  } else {
    forward = v1.set(Math.sin(camYaw), 0, Math.cos(camYaw)).normalize();
    right = v2.set(-Math.cos(camYaw), 0, Math.sin(camYaw)).normalize();
  }
  const desired = v3.set(0, 0, 0).addScaledVector(forward, inputZ).addScaledVector(right, inputX);
  if (desired.lengthSq() > 0.0001) desired.normalize();

  if (keys.c && !dodge.shiftUsed && (state.dodgeCooldownUntil || 0) <= state.time) {
    dodge.shiftUsed = true;
    state.dodgeUntil = state.time + 0.28;
    state.dodgeCooldownUntil = state.time + 1.5;
    const dashDir = desired.lengthSq() > 0.001 ? desired.clone() : forward.clone().negate();
    const dashSpeed = 14;
    player.vel.x += dashDir.x * dashSpeed;
    player.vel.z += dashDir.z * dashSpeed;
    if (typeof playSfx === "function") playSfx(320, 0.06);
  }
  if (!keys.c) dodge.shiftUsed = false;

  const groundY = getGroundHeight(player.mesh.position.x, player.mesh.position.z);
  var waterCheck = (state.currentMapId === "arena3") ? isPlayerInWater() : null;
  state.inWater = !!(waterCheck && waterCheck.inWater);
  if (state.inWater) state.waterY = waterCheck.waterY;
  player.grounded = !state.inWater && (player.mesh.position.y <= groundY + 0.22);
  const inAir = !player.grounded;

  // Wall jump zamanlayicilari
  if (player.wallJumpCooldown > 0) player.wallJumpCooldown -= dt;
  if (player.wallJumpCoyote > 0) player.wallJumpCoyote -= dt;

  // Bhop: detect landing
  if (player.grounded && !bhop.wasGrounded) {
    bhop.landTime = state.time;
    applyRagdollLand();
  }
  bhop.wasGrounded = player.grounded;

  // Bhop speed bonus decay and clamp (prevents runaway/NaN and freeze)
  if (player.grounded && bhop.streak === 0) {
    bhop.speedBonus *= Math.exp(-6 * dt);
    if (bhop.speedBonus < 0.1) bhop.speedBonus = 0;
  }
  if (inAir) {
    bhop.speedBonus *= Math.exp(-0.3 * dt); // gentle decay in air
  }
  bhop.speedBonus = Math.max(0, Math.min(50, Number(bhop.speedBonus) || 0));

  const chapterMoveMult = getChapterMoveMult(state.chapter);
  const rageSpeed = (state.rageUntil && state.time < state.rageUntil) ? 1.15 : 1;
  const slowAura = (state.slowAuraUntil && state.time < state.slowAuraUntil) ? 0.88 : 1;
  const maxStamina = state.maxStamina ?? 100;
  const sprinting = (stats.sprintUnlocked && keys.shift && (state.stamina ?? 100) > 0);
  if (sprinting) {
    state.stamina = Math.max(0, (state.stamina ?? 100) - 18 * dt);
  } else {
    state.stamina = Math.min(maxStamina, (state.stamina ?? 100) + 12 * dt);
  }
  const sprintMult = sprinting ? 1.38 : 1;
  const bhopBonus = Math.max(0, Math.min(50, Number(bhop.speedBonus) || 0));
  const baseMove = (Number(stats.moveSpeed) || 6) + bhopBonus;
  const effectiveMoveSpeed = Math.min(100, (baseMove * chapterMoveMult * rageSpeed * slowAura * sprintMult) || 6);
  const cappedMoveSpeed = isFinite(effectiveMoveSpeed) ? effectiveMoveSpeed : 6;
  const airSpeedCap = cappedMoveSpeed * 3.5;
  const isDashing = state.dashUntil != null && state.time < state.dashUntil;

  if (!isDashing) {
    if (desired.lengthSq() > 0.001) {
      if (inAir) {
        // CS bhop air strafing: ileriye ani hiz verme, strafe ile kademeli kazan
        const wishDir = desired.clone().normalize();
        const speedInWish = player.vel.x * wishDir.x + player.vel.z * wishDir.z;
        const headroom = Math.max(0, airSpeedCap - speedInWish);
        const addSpeedRaw = Math.min(AIR_ACCEL * dt, headroom);
        const forwardFactor = Math.max(0.35, 1 - speedInWish / (airSpeedCap + 0.01));
        const addSpeed = addSpeedRaw * forwardFactor;
        player.vel.x += wishDir.x * addSpeed;
        player.vel.z += wishDir.z * addSpeed;
        const speed2Air = player.vel.x * player.vel.x + player.vel.z * player.vel.z;
        if (speed2Air > airSpeedCap * airSpeedCap) {
          const s = airSpeedCap / Math.sqrt(speed2Air);
          player.vel.x *= s;
          player.vel.z *= s;
        }
        if (bhop.streak > 0 && inputX !== 0) {
          bhop.speedBonus += dt * 0.5;
        }
      } else {
        const isIceMap = state.selectedMapId === "ice";
        const accelGround = isIceMap ? 12 * dt : 22 * dt;
        const targetSpeed = cappedMoveSpeed;
        player.vel.x += (desired.x * targetSpeed - player.vel.x) * Math.min(1, accelGround);
        player.vel.z += (desired.z * targetSpeed - player.vel.z) * Math.min(1, accelGround);
      }
    } else {
      const isIceMap = state.selectedMapId === "ice" && player.grounded;
      const slipping = (state.slipUntil || 0) > (state.time || 0);
      const timeSinceLand = state.time - bhop.landTime;
      const bhopGrace = player.grounded && timeSinceLand <= bhop.frictionGrace;
      const damp = slipping ? Math.exp(-2 * dt) : (inAir ? 1 : (bhopGrace ? 1 : (isIceMap ? Math.exp(-3 * dt) : Math.exp(-10 * dt))));
      player.vel.x *= damp;
      player.vel.z *= damp;
      if (inAir && bhop.speedBonus > 0) {
        bhop.speedBonus = Math.max(0, bhop.speedBonus - dt * 4);
      }
    }
  }

  if (state.weather === "wind" && state.windDir) {
    const windStr = 5;
    player.vel.x += state.windDir.x * windStr * dt;
    player.vel.z += state.windDir.z * windStr * dt;
  }

  // Knockback: yaratiklar yaklasinca oyuncuyu ittirir
  const knockRadius = 2.9;
  const knockStrength = 24;
  for (let k = 0; k < enemies.length; k++) {
    const en = enemies[k];
    const dx = player.mesh.position.x - en.mesh.position.x;
    const dz = player.mesh.position.z - en.mesh.position.z;
    const distSq = dx * dx + dz * dz;
    if (distSq < knockRadius * knockRadius && distSq > 0.01) {
      const dist = Math.sqrt(distSq);
      const push = (knockStrength * (1 - dist / knockRadius)) / dist;
      player.vel.x += (dx / dist) * push * dt;
      player.vel.z += (dz / dist) * push * dt;
    }
  }

  const maxRunSpeed = inAir ? airSpeedCap : cappedMoveSpeed * 1.15;
  const speed2 = player.vel.x * player.vel.x + player.vel.z * player.vel.z;
  if (!isDashing && speed2 > maxRunSpeed * maxRunSpeed) {
    const s = maxRunSpeed / Math.sqrt(speed2);
    player.vel.x *= s;
    player.vel.z *= s;
  }

  if ((stats.toxicTrail || 0) > 0 && speed2 > 0.4) {
    state.toxicTrailTimer = (state.toxicTrailTimer || 0) + dt;
    if (state.toxicTrailTimer >= 0.35) {
      state.toxicPuddles = state.toxicPuddles || [];
      if (state.toxicPuddles.length >= 3) {
        const old = state.toxicPuddles.shift();
        if (old.mesh && scene) scene.remove(old.mesh);
        if (old.mesh && old.mesh.geometry) old.mesh.geometry.dispose();
        if (old.mesh && old.mesh.material) old.mesh.material.dispose();
      }
      const rad = stats.toxicTrailRadius ?? 2.2;
      const pud = {
        x: player.mesh.position.x,
        z: player.mesh.position.z,
        radius: rad,
        life: 4,
        totalLife: 4,
      };
      const groundY = sampleTerrainHeight(pud.x, pud.z);
      const mat = new THREE.MeshBasicMaterial({ color: 0x44cc44, transparent: true, opacity: 0.45 });
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(rad, 24), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pud.x, groundY + 0.05, pud.z);
      if (typeof scene !== "undefined") scene.add(mesh);
      pud.mesh = mesh;
      state.toxicPuddles.push(pud);
      state.toxicTrailTimer = 0;
    }
  }

  if (inAir && (bhop.streak > 0 || speed2 > 8)) {
    bhopTrailTimer += dt;
    if (bhopTrailTimer >= 0.07 && bhopTrail.length < BHOP_TRAIL_MAX && typeof scene !== "undefined") {
      const gy = getGroundHeight(player.mesh.position.x, player.mesh.position.z) + 0.02;
      const mat = new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.45, 12), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(player.mesh.position.x, gy, player.mesh.position.z);
      scene.add(mesh);
      bhopTrail.push({ mesh, life: 1.2 });
      bhopTrailTimer = 0;
    }
  } else {
    bhopTrailTimer = 0;
  }

  if (player.grounded) {
    player.jumpsLeft = (stats.doubleJump || 0) > 0 ? Math.floor(stats.doubleJump) : 0;
    player.airJumpUsed = false;
    player.wallJumpCoyote = 0.08; // yere deger demez wall jump icin kucuk bir bosluk
  }

  // BHOP + WALLJUMP: jump on PRESS or hold (auto-bhop). Shrine icindeyken space ziplamayi tetiklemesin.
  let spacePressed = bhop.spacePressedThisFrame;
  let inShrineZone = !!shrineSkillPanelOpen;
  if (!inShrineZone && shrineGroups.length > 0) {
    for (const shrine of shrineGroups) {
      if (shrine.userData?.isShrine && !shrine.userData.used && player.mesh.position.distanceTo(shrine.position) < SHRINE_RADIUS) { inShrineZone = true; break; }
    }
  }

  // Auto-bhop: eger space'e basili tutuluyorsa, yere deger degmez CS tarzinda zipla
  if (!spacePressed && player.grounded && bhop.spaceDown && !inShrineZone) {
    spacePressed = true;
  }
  bhop.spacePressedThisFrame = false;

  // === WALL JUMP ALGILAMA ===
  let didWallJump = false;
  if (spacePressed && !player.grounded && !inShrineZone && player.wallJumpCooldown <= 0) {
    // Duvarda miyiz? Mevcut collider itme mantigini kullan: yakin bir collider bul ve normali hesapla
    const bound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 2;
    const px = clamp(player.mesh.position.x, -bound, bound);
    const pz = clamp(player.mesh.position.z, -bound, bound);
    let best = null;
    let bestD = 9999;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      const dx = px - c.x;
      const dz = pz - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + PLAYER_RADIUS + 0.05;
      if (d < min + 0.4 && d < bestD) {
        bestD = d;
        best = c;
      }
    }
    if (best && bestD < 9999) {
      const nx = (px - best.x) / (bestD || 0.001);
      const nz = (pz - best.z) / (bestD || 0.001);
      player.wallNormal.set(nx, 0, nz);
      // Duvardan ziplama vektoru: duvar normalinden ve yukari bileşenden
      const jumpSide = new THREE.Vector3(nx, 0, nz).multiplyScalar(9.5);
      const forwardBoost = 4.5;
      const moveDir = new THREE.Vector3(player.vel.x, 0, player.vel.z);
      if (moveDir.lengthSq() > 0.0001) moveDir.normalize(); else moveDir.copy(forward);
      jumpSide.addScaledVector(moveDir, forwardBoost);
      const jPow = stats.jumpPower || 1;
      player.vel.x = jumpSide.x;
      player.vel.z = jumpSide.z;
      player.vy = 10.5 * jPow;
      player.grounded = false;
      player.wallJumpCooldown = 0.20;
      player.wallJumpCoyote = 0;
      didWallJump = true;
      spawnDustCloud(player.mesh.position, 0x88ccff, 3);
      spawnRing(player.mesh.position, 1.6, 0x88ccff, 0.25);
      playSfx(520, 0.06, 0.62);
    }
  }

  if (!didWallJump && spacePressed && player.grounded && !inShrineZone) {
    // Check bhop timing: if we just landed, check if press is within perfect window
    const timeSinceLand = state.time - bhop.landTime;
    const isPerfectBhop = timeSinceLand <= bhop.perfectWindow && bhop.landTime > 0 && bhop.streak > 0;
    const isGoodBhop = timeSinceLand <= bhop.perfectWindow * 2 && bhop.landTime > 0;

    if (isPerfectBhop) {
      bhop.streak = Math.min(bhop.streak + 1, bhop.maxStreak);
      bhop.speedBonus += 0.5 + bhop.streak * 0.1;
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 2.8, 0)), `BHOP x${bhop.streak}!`, false, "bhop");
      playSfx(500 + bhop.streak * 40, 0.08);
    } else if (isGoodBhop && bhop.streak > 0) {
      bhop.speedBonus += 0.28;
      playSfx(400, 0.05);
    } else {
      bhop.streak = 1;
      bhop.speedBonus += 0.15;
    }

    bhop.lastJumpTime = state.time;
    const jumpBonus = 0.06 * Math.min(1, Math.hypot(player.vel.x, player.vel.z) / stats.moveSpeed);
    const jPow = stats.jumpPower || 1;
    player.vy = (10.2 + jumpBonus * 1.2) * jPow;
    player.grounded = false;
    // Rocket jump: damage nearby enemies on jump
    if (stats.rocketJump) {
      radialDamageEnemies(player.mesh.position, 3.5, 12 + stats.rocketJump * 8);
      spawnRing(player.mesh.position, 3.5, 0xff6622, 0.2);
      spawnDustCloud(player.mesh.position, 0xff8844, 5);
    } else {
      spawnDustCloud(player.mesh.position, 0xbbaa88, 2);
    }
    playSfx(380, 0.06, 0.58);
  } else if (spacePressed && !player.grounded && !inShrineZone && !player.airJumpUsed && (player.jumpsLeft || 0) > 0 && stats.doubleJump > 0) {
    player.jumpsLeft--;
    player.airJumpUsed = true;
    player.vy = 9 * (stats.jumpPower || 1);
    spawnDustCloud(player.mesh.position, 0xccccff, 2);
    playSfx(420, 0.05, 0.58);
  }

  // If grounded too long without jumping, lose streak
  if (player.grounded && (state.time - bhop.landTime) > 0.5 && bhop.streak > 0) {
    bhop.streak = 0;
    bhop.speedBonus *= 0.5;
  }

  // Yuzme: suda Space yukari (Space burada kullanilir, ziplama tetiklenmez)
  if (state.inWater && state.waterY != null) {
    if (bhop.spacePressedThisFrame) { player.vy = 7; bhop.spacePressedThisFrame = false; }
    player.vy -= 5 * dt;
    if (player.mesh.position.y < state.waterY - 0.3) player.vy += 20 * dt;
    if (player.vy > 10) player.vy = 10;
    if (player.vy < -6) player.vy = -6;
  }

  // Jump pad check
  if (player.grounded) {
    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;
    const jumpPadPositions = [
      { x: 50, z: 50 }, { x: -100, z: 80 }, { x: 160, z: -100 },
      { x: -180, z: -60 }, { x: 0, z: -160 }, { x: 220, z: 120 },
      { x: -60, z: -220 }, { x: 100, z: 200 },
      { x: -300, z: 150 }, { x: 350, z: -50 }, { x: -150, z: 350 },
      { x: 280, z: 280 },
    ];
    for (const jp of jumpPadPositions) {
      if (Math.hypot(px - jp.x, pz - jp.z) < 2.2) {
        player.vy = 18;
        player.grounded = false;
        bhop.streak = Math.min(bhop.streak + 2, bhop.maxStreak);
        bhop.speedBonus += 1.5;
        spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), "LAUNCH!", false, "launch");
        playSfx(600, 0.12);
        spawnRing(player.mesh.position, 3, 0x44ff88, 0.5);
        break;
      }
    }
  }

  if (!state.inWater) player.vy -= 30 * dt;
  const next = player.mesh.position.clone().addScaledVector(player.vel, dt);
  next.y += player.vy * dt;
  resolvePlayerCollision(next);
  if (state.inWater && state.waterY != null) {
    next.y = clamp(next.y, state.waterY - 6, state.waterY + 1.2);
    player.mesh.position.copy(next);
    player.grounded = false;
  } else {
    const nextGroundY = getGroundHeight(next.x, next.z);
    const currentGroundY = groundY;
    const minY = nextGroundY + 0.22;
    const STEP_HEIGHT = 0.9;
    if (next.y < nextGroundY + 0.22) {
      const rise = (nextGroundY + 0.22) - next.y;
      if (rise <= STEP_HEIGHT) {
        next.y = minY;
        if (player.vy < -14) {
          const fallDmg = Math.min(45, (-player.vy - 12) * 2.2);
          state.lastAttacker = null;
          state.lastDamageType = "fall";
          stats.hp -= fallDmg * Math.max(0, 1 - (stats.armor || 0));
          if (fallDmg > 5) spawnDamageText(player.mesh.position.clone().setY(next.y + 1.5), Math.floor(fallDmg) + " fall", false, "fall");
        }
        if (player.vy < -6 && bhop.streak === 0) {
          player.vel.x *= 0.85;
          player.vel.z *= 0.85;
        }
        player.vy = 0;
        player.grounded = true;
      } else {
        next.y = minY;
        player.vel.x *= 0.75;
        player.vel.z *= 0.75;
        player.vy = 0;
        player.grounded = true;
      }
    } else if (next.y <= nextGroundY + 0.15) {
      next.y = minY;
      if (player.vy < -14) {
        const fallDmg = Math.min(45, (-player.vy - 12) * 2.2);
        state.lastAttacker = null;
        state.lastDamageType = "fall";
        stats.hp -= fallDmg * Math.max(0, 1 - (stats.armor || 0));
        if (fallDmg > 5) spawnDamageText(player.mesh.position.clone().setY(next.y + 1.5), Math.floor(fallDmg) + " fall", false, "fall");
      }
      if (player.vy < -6 && bhop.streak === 0) {
        player.vel.x *= 0.85;
        player.vel.z *= 0.85;
      }
      player.vy = 0;
      player.grounded = true;
    }
    player.mesh.position.copy(next);
    const minGroundY = getGroundHeight(player.mesh.position.x, player.mesh.position.z) + 0.2;
    if (player.mesh.position.y < minGroundY) {
      player.mesh.position.y = minGroundY;
      player.vy = 0;
      player.grounded = true;
    }
    if (player.grounded) player.mesh.position.y = Math.max(player.mesh.position.y, minGroundY);
  }
  let bound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 3;
  if (state.activeRitual) {
    const rc = state.activeRitual.center;
    const r = (state.activeRitual.radius || RITUAL_RADIUS) - 1.2;
    const dx = player.mesh.position.x - rc.x;
    const dz = player.mesh.position.z - rc.z;
    const dist = Math.hypot(dx, dz);
    if (dist > r && r > 0.01) {
      player.mesh.position.x = rc.x + (dx / dist) * r;
      player.mesh.position.z = rc.z + (dz / dist) * r;
    }
  }
  const PORTAL_KEEP_OUT = 5;
  if (state.portalPos) {
    const pdx = player.mesh.position.x - state.portalPos.x;
    const pdz = player.mesh.position.z - state.portalPos.z;
    const pdist = Math.hypot(pdx, pdz);
    if (pdist < PORTAL_KEEP_OUT && pdist > 0.01) {
      player.mesh.position.x = state.portalPos.x + (pdx / pdist) * PORTAL_KEEP_OUT;
      player.mesh.position.z = state.portalPos.z + (pdz / pdist) * PORTAL_KEEP_OUT;
    }
  }
  player.mesh.position.x = clamp(player.mesh.position.x, -bound, bound);
  player.mesh.position.z = clamp(player.mesh.position.z, -bound, bound);

  const rot = Math.atan2(player.aimDir.x, player.aimDir.z);
  player.mesh.rotation.y = lerpAngle(player.mesh.rotation.y, rot, Math.min(1, dt * 14));
  const ragdollUntil = state.ragdollUntil || 0;
  const t = state.time || 0;
  if (ragdollUntil > t) {
    const phase = (ragdollUntil - t) / 0.85;
    player.mesh.rotation.x = Math.sin(t * 6) * 0.38 * phase;
    player.mesh.rotation.z = Math.sin(t * 5 + 1) * 0.42 * phase;
  } else {
    player.mesh.rotation.x *= Math.exp(-8 * dt);
    player.mesh.rotation.z *= Math.exp(-8 * dt);
  }

  player.shootCd -= dt;
  const target = getNearestEnemy(26);
  const canShoot = !state.playerDying && !gameOver && stats.hp > 0;
  if (player.shootCd <= 0 && canShoot && autoAttackEnabled && target && state.challengeMode !== "melee_only") {
    const shotDir = v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize();
    fireMainShot(shotDir);
    const level = state.level || 1;
    const fireRateScale = 2.0 - 1.0 * Math.min(1, level / 25);
    player.shootCd = stats.fireRate * fireRateScale;
  }
  if (canShoot && stats.balloonGun && target) {
    state.balloonGunTimer = (state.balloonGunTimer || 0) - dt;
    if (state.balloonGunTimer <= 0) {
      state.balloonGunTimer = 2.5;
      const dir = v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize();
      spawnProjectile({ position: player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), direction: dir, speed: 14 * (stats.projectileSpeedMult || 1), damage: 8, radius: 0.2, life: 1.8, shape: "balloon" });
    }
  }
}

function spawnWaterShark() {
  if (!state.waterSharks) state.waterSharks = [];
  if (state.waterSharks.length >= 4) return;
  var angle = Math.random() * Math.PI * 2;
  var dist = 12 + Math.random() * 10;
  var x = player.mesh.position.x + Math.cos(angle) * dist;
  var z = player.mesh.position.z + Math.sin(angle) * dist;
  var waterY = state.waterY != null ? state.waterY : 0;
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, emissive: 0x1a2530, roughness: 0.7, metalness: 0.1 });
  var bellyMat = new THREE.MeshStandardMaterial({ color: 0x6a7a8a, roughness: 0.8 });
  var g = new THREE.Group();
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), bodyMat);
  body.scale.set(1.4, 0.5, 0.7);
  body.position.y = 0;
  var tail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 6), bodyMat);
  tail.position.set(0, 0, -0.6);
  tail.rotation.x = Math.PI / 2;
  var fin = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 4), bodyMat);
  fin.position.set(0, 0.35, 0);
  fin.rotation.x = -0.4;
  g.add(body, tail, fin);
  g.position.set(x, waterY, z);
  g.rotation.y = Math.atan2(player.mesh.position.x - x, player.mesh.position.z - z);
  scene.add(g);
  state.waterSharks.push({ mesh: g, x: x, z: z, y: waterY, speed: 5.5, damage: 14, hitCooldown: 0, hp: 55 });
}

function updateWaterSharks(dt) {
  if (!state.waterSharks) state.waterSharks = [];
  var mapId = state.currentMapId || state.selectedMapId || "classic";
  if (mapId !== "arena3" || !state.inWater || state.waterY == null) {
    for (var i = 0; i < state.waterSharks.length; i++) {
      if (state.waterSharks[i].mesh && scene) scene.remove(state.waterSharks[i].mesh);
    }
    state.waterSharks.length = 0;
    return;
  }
  if (state.waterSharks.length < 4 && (state.lastSharkSpawn == null || state.time - state.lastSharkSpawn > 8)) {
    state.lastSharkSpawn = state.time;
    spawnWaterShark();
  }
  var px = player.mesh.position.x, pz = player.mesh.position.z, py = player.mesh.position.y;
  var waterY = state.waterY;
  for (var i = state.waterSharks.length - 1; i >= 0; i--) {
    var s = state.waterSharks[i];
    var dx = px - s.x, dz = pz - s.z;
    var d = Math.hypot(dx, dz);
    if (d > 0.01) {
      s.x += (dx / d) * s.speed * dt;
      s.z += (dz / d) * s.speed * dt;
    }
    s.mesh.position.set(s.x, waterY, s.z);
    s.mesh.rotation.y = Math.atan2(dx, dz);
    s.hitCooldown = Math.max(0, s.hitCooldown - dt);
    var distToPlayer = Math.hypot(s.x - px, s.z - pz);
    if (distToPlayer < 1.8 && s.hitCooldown <= 0 && Math.abs(py - waterY) < 2) {
      s.hitCooldown = 1.5;
      state.lastAttacker = "Köpekbalığı";
      state.lastDamageType = "shark";
      var dmg = s.damage * Math.max(0, 1 - (stats.armor || 0));
      var sh = stats.shield || 0;
      if (sh > 0) { stats.shield = Math.max(0, sh - dmg); dmg = Math.max(0, dmg - sh); }
      stats.hp -= dmg;
      spawnDamageText(player.mesh.position.clone().setY(py + 1.2), Math.floor(dmg) + "", false, "shark");
      spawnFlash(player.mesh.position, 0xff4444, 0.5, 0.12);
      if (typeof triggerCameraShake === "function") triggerCameraShake();
    }
  }
}

function updateEnemies(dt) {
  state.toxicPuddles = state.toxicPuddles || [];
  for (let p = state.toxicPuddles.length - 1; p >= 0; p--) {
    const pud = state.toxicPuddles[p];
    pud.life -= dt;
    if (pud.life <= 0) {
      if (pud.mesh && typeof scene !== "undefined") scene.remove(pud.mesh);
      state.toxicPuddles.splice(p, 1);
    }
  }
  state.slowPuddles = state.slowPuddles || [];
  for (let i = state.slowPuddles.length - 1; i >= 0; i--) {
    state.slowPuddles[i].life -= dt;
    if (state.slowPuddles[i].life <= 0) state.slowPuddles.splice(i, 1);
  }

  const worldSlowmo = (state.slowmoUntil && state.time < state.slowmoUntil) ? 0.5 : 1;
  const playerPos = player.mesh.position;
  const aiTick = _perfFrame % ENEMY_FAR_TICK;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    applyRimStats(e);
    if (e.isBoss) trySwapBossPhase2(e);
    const distToPlayer = e.mesh.position.distanceTo(playerPos);
    // Uzaktaki siradan dusmanlar her karede degil, ENEMY_FAR_TICK karede bir islenir.
    let farSkip = 0;
    if (distToPlayer > ENEMY_FAR_DIST && !e.isBoss && e.spawnDelay <= 0) {
      if ((i % ENEMY_FAR_TICK) !== aiTick) continue;
      farSkip = ENEMY_FAR_TICK;
    }
    if (!e.isBoss && !e.isBreach && !e.abyssPitRef && !e.isAttackRound && !e.ritualRef && distToPlayer > ENEMY_DESPAWN_DISTANCE) {
      releaseEnemyVisuals(e);
      if (scene && e.mesh) scene.remove(e.mesh);
      if (e.nameLabel && e.mesh) e.mesh.remove(e.nameLabel);
      enemies.splice(i, 1);
      continue;
    }
    const effectiveDt = dt * worldSlowmo * (farSkip || 1);
    updateVoxelCreatureAnim(e, effectiveDt);
    if (e.spawnDelay > 0) {
      e.spawnDelay -= dt;
      e.mesh.position.y = getGroundHeight(e.mesh.position.x, e.mesh.position.z) + (1 - e.spawnDelay / 1.1) * 0.3;
      continue;
    }

    if (e.normalBeastType === "creeper") {
      const distToPlayer = e.mesh.position.distanceTo(player.mesh.position);
      if (distToPlayer < 4.5 && e.creeperFuseStart == null) {
        e.creeperFuseStart = state.time;
        if (typeof playSfx === "function") { playSfx(220, 0.28, 0.85); playSfx(180, 0.15, 0.7); }
        pendingCreeperExplosion = e;
        playCreeperExplodeSound(function() {
          if (pendingCreeperExplosion && enemies.indexOf(pendingCreeperExplosion) >= 0) {
            const c = pendingCreeperExplosion;
            const pos = c.mesh.position.clone();
            const creeperRadius = 4.5;
            const creeperDamage = 38 + Math.max(0, (state.difficultyStage || 0) * 6);
            if (typeof radialDamageEnemies === "function") radialDamageEnemies(pos, creeperRadius, creeperDamage);
            if (player.mesh && player.mesh.position.distanceTo(pos) < creeperRadius) {
              state.lastAttacker = c.name;
              state.lastDamageType = "creeper";
              let dmg = creeperDamage * 0.85 * Math.max(0, 1 - (stats.armor || 0));
              const sh = stats.shield || 0;
              if (sh > 0) { stats.shield = Math.max(0, sh - dmg); dmg = Math.max(0, dmg - sh); }
              stats.hp -= dmg;
              spawnDamageText(player.mesh.position.clone().setY(player.mesh.position.y + 1.2), Math.floor(dmg) + "", false, "creeper");
              spawnFlash(player.mesh.position, 0xff4422, 0.6, 0.15);
              if (typeof triggerCameraShake === "function") triggerCameraShake(0.35);
            }
            if (typeof playExplosionBoom === "function") playExplosionBoom();
            if (typeof spawnRing === "function") spawnRing(pos, creeperRadius, 0xff4422, 0.45);
            if (typeof spawnBurst === "function") spawnBurst(pos.clone().setY(pos.y + 0.5), 0xff6622, 10);
            killEnemy(c);
          }
          pendingCreeperExplosion = null;
        });
      }
      if (e.creeperFuseStart != null) {
        e.speed = 0;
      }
    }

    for (const pud of (state.slowPuddles || [])) {
      const dx = e.mesh.position.x - pud.x;
      const dz = e.mesh.position.z - pud.z;
      if (dx * dx + dz * dz < pud.radius * pud.radius) {
        e.slowLeft = Math.max(e.slowLeft || 0, 0.85);
        break;
      }
    }
    for (const pud of (state.toxicPuddles || [])) {
      const dx = e.mesh.position.x - pud.x;
      const dz = e.mesh.position.z - pud.z;
      if (dx * dx + dz * dz < pud.radius * pud.radius) {
        const poisonDur = (stats.toxicTrailPoison ?? 2.0) + 0.6;
        e.poisonLeft = Math.max(e.poisonLeft || 0, poisonDur);
        break;
      }
    }

  if (e.poisonLeft > 0) {
    e.poisonLeft -= effectiveDt;
    e.hp -= effectiveDt * (3 + stats.poison * 1.3);
    if (e.hp <= 0) { killEnemy(e); continue; }
  }
    if (e.burnLeft > 0) {
      e.burnLeft -= effectiveDt;
      e.hp -= effectiveDt * (stats.burn || 0);
      if (e.hp <= 0) { killEnemy(e); continue; }
    }
    if ((e.bleedLeft || 0) > 0) {
      e.bleedLeft -= effectiveDt;
      e.hp -= effectiveDt * (4 + (stats.bleed || 0) * 1.2);
      if (e.hp <= 0) { killEnemy(e); continue; }
    }

    e.swordHitCd = Math.max(0, e.swordHitCd - effectiveDt);
    e.bananaHitCd = Math.max(0, (e.bananaHitCd || 0) - effectiveDt);
    e.stunLeft = Math.max(0, (e.stunLeft || 0) - effectiveDt);
    const slowFactor = e.stunLeft > 0 ? 0.5 : Math.max(0.25, 1 - e.slowLeft - (e.freezeLeft > 0 ? 0.4 : 0));
    const moveSpeed = e.isBoss ? (e.speed || 4) : getUnifiedEnemySpeed();
    e.slowLeft = Math.max(0, e.slowLeft - effectiveDt * 0.6);

    e._ritualBlocked = false;
    if (state.activeRitual && !e.ritualRef) {
      const rc = state.activeRitual.center;
      const rr = state.activeRitual.radius;
      const distE = Math.hypot(e.mesh.position.x - rc.x, e.mesh.position.z - rc.z);
      const distP = Math.hypot(player.mesh.position.x - rc.x, player.mesh.position.z - rc.z);
      if (distP < rr && distE > rr) e._ritualBlocked = true;
    }
    if (e._ritualBlocked) {
      const away = v0.set(e.mesh.position.x - state.activeRitual.center.x, 0, e.mesh.position.z - state.activeRitual.center.z);
      if (away.lengthSq() > 0.01) {
        away.normalize();
        e.mesh.position.addScaledVector(away, moveSpeed * 0.6 * effectiveDt);
      }
      e.mesh.rotation.y = lerpAngle(e.mesh.rotation.y, Math.atan2(-away.x, -away.z), Math.min(1, effectiveDt * 6));
      const groundY = getGroundHeight(e.mesh.position.x, e.mesh.position.z);
      e.mesh.position.y = groundY + (e.isFlying ? (e.flyHeight || 0) : Math.sin((e.walkPhase || 0)) * 0.055);
      continue;
    }

    const toPlayer = v0.copy(player.mesh.position).sub(e.mesh.position);
    toPlayer.y = 0;
    const dist = Math.max(0.001, toPlayer.length());
    toPlayer.multiplyScalar(1 / dist);
    if ((stats.vacuumAura || 0) > 0 && dist < 7 && dist > 1.2) {
      e.push.add(toPlayer.clone().multiplyScalar(-2.2 * effectiveDt * (stats.vacuumAura || 1)));
    }

    if (dist > 55) {
      e.mesh.position.addScaledVector(toPlayer, moveSpeed * slowFactor * effectiveDt);
      e.push.multiplyScalar(Math.exp(-10 * effectiveDt));
      e.mesh.position.addScaledVector(e.push, effectiveDt);
      const eBound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 1.5;
      e.mesh.position.x = clamp(e.mesh.position.x, -eBound, eBound);
      e.mesh.position.z = clamp(e.mesh.position.z, -eBound, eBound);
      if (e.ritualRef && state.activeRitual) {
        const rc = state.activeRitual.center;
        const dx = e.mesh.position.x - rc.x;
        const dz = e.mesh.position.z - rc.z;
        const dist = Math.hypot(dx, dz);
        if (dist > RITUAL_RADIUS - 0.8) {
          const r = Math.max(0.01, RITUAL_RADIUS - 0.8);
          e.mesh.position.x = rc.x + (dx / dist) * r;
          e.mesh.position.z = rc.z + (dz / dist) * r;
        }
      }
      if (e.breachRef) {
        const bc = e.breachRef.center;
        const dx = e.mesh.position.x - bc.x;
        const dz = e.mesh.position.z - bc.z;
        const distB = Math.hypot(dx, dz);
        const maxR = (e.breachRef.currentRadius || BREACH_MAX_R) - 0.6;
        if (distB > maxR && maxR > 0.5) {
          e.mesh.position.x = bc.x + (dx / distB) * maxR;
          e.mesh.position.z = bc.z + (dz / distB) * maxR;
        }
      }
      const groundY = getGroundHeight(e.mesh.position.x, e.mesh.position.z);
      if (e.normalBeastType === "slime" || e.normalBeastType === "purpleSlime") {
        e.slimeJumpTimer = (e.slimeJumpTimer ?? 0) - effectiveDt;
        if (e.slimeJumpTimer <= 0) { e.slimeVy = 4.5; e.slimeJumpTimer = 1.1 + Math.random() * 0.5; }
        e.slimeVy = (e.slimeVy ?? 0) - 24 * effectiveDt;
        e.mesh.position.y += (e.slimeVy ?? 0) * effectiveDt;
        if (e.mesh.position.y <= groundY) { e.mesh.position.y = groundY; e.slimeVy = 0; }
      } else if (e.mutation === "jumping") {
        e.jumpTimer = (e.jumpTimer ?? 0) - effectiveDt;
        if (e.jumpTimer <= 0) { e.jumpVy = 5.5; e.jumpTimer = 1.0 + Math.random() * 0.8; }
        e.jumpVy = (e.jumpVy ?? 0) - 22 * effectiveDt;
        e.mesh.position.y += (e.jumpVy ?? 0) * effectiveDt;
        if (e.mesh.position.y <= groundY) { e.mesh.position.y = groundY; e.jumpVy = 0; }
      } else if (!e.isFlying) {
        e.mesh.position.y = groundY;
        e.walkPhase = (e.walkPhase || 0) + effectiveDt * (4 + moveSpeed * 0.3);
        e.mesh.position.y += Math.sin(e.walkPhase) * 0.055;
      }
      e.mesh.rotation.y = lerpAngle(e.mesh.rotation.y, Math.atan2(toPlayer.x, toPlayer.z), Math.min(1, effectiveDt * 8));
      continue;
    }

    const tangent = v1.set(-toPlayer.z, 0, toPlayer.x);
    const flank = (e.flankBias || 0) + (Math.random() - 0.5) * 0.25;
    const moveDir = v2.copy(toPlayer).addScaledVector(tangent, flank);
    if (moveDir.lengthSq() > 0.0001) moveDir.normalize();

    e.mesh.position.addScaledVector(moveDir, moveSpeed * slowFactor * effectiveDt);
    e.push.multiplyScalar(Math.exp(-10 * effectiveDt));
    e.mesh.position.addScaledVector(e.push, effectiveDt);
    const eBound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 1.5;
    e.mesh.position.x = clamp(e.mesh.position.x, -eBound, eBound);
    e.mesh.position.z = clamp(e.mesh.position.z, -eBound, eBound);
    if (e.ritualRef && state.activeRitual) {
      const rc = state.activeRitual.center;
      const dx = e.mesh.position.x - rc.x;
      const dz = e.mesh.position.z - rc.z;
      const dist = Math.hypot(dx, dz);
      if (dist > RITUAL_RADIUS - 0.8) {
        const r = Math.max(0.01, RITUAL_RADIUS - 0.8);
        e.mesh.position.x = rc.x + (dx / dist) * r;
        e.mesh.position.z = rc.z + (dz / dist) * r;
      }
    }
    if (e.breachRef) {
      const bc = e.breachRef.center;
      const dx = e.mesh.position.x - bc.x;
      const dz = e.mesh.position.z - bc.z;
      const dist = Math.hypot(dx, dz);
      const maxR = (e.breachRef.currentRadius || BREACH_MAX_R) - 0.6;
      if (dist > maxR && maxR > 0.5) {
        e.mesh.position.x = bc.x + (dx / dist) * maxR;
        e.mesh.position.z = bc.z + (dz / dist) * maxR;
      }
    }
    const groundY = getGroundHeight(e.mesh.position.x, e.mesh.position.z);
    if (e.normalBeastType === "slime" || e.normalBeastType === "purpleSlime") {
      e.slimeJumpTimer = (e.slimeJumpTimer ?? 0) - effectiveDt;
      if (e.slimeJumpTimer <= 0) {
        e.slimeVy = 4.5;
        e.slimeJumpTimer = 1.1 + Math.random() * 0.5;
      }
      e.slimeVy = (e.slimeVy ?? 0) - 24 * effectiveDt;
      e.mesh.position.y += (e.slimeVy ?? 0) * effectiveDt;
      if (e.mesh.position.y <= groundY) {
        e.mesh.position.y = groundY;
        e.slimeVy = 0;
      }
    } else if (e.mutation === "jumping") {
      e.jumpTimer = (e.jumpTimer ?? 0) - effectiveDt;
      if (e.jumpTimer <= 0) {
        e.jumpVy = 5.5;
        e.jumpTimer = 1.0 + Math.random() * 0.8;
      }
      e.jumpVy = (e.jumpVy ?? 0) - 22 * effectiveDt;
      e.mesh.position.y += (e.jumpVy ?? 0) * effectiveDt;
      if (e.mesh.position.y <= groundY) {
        e.mesh.position.y = groundY;
        e.jumpVy = 0;
      }
    } else if (!e.isFlying) {
      e.mesh.position.y = groundY;
      e.walkPhase = (e.walkPhase || 0) + effectiveDt * (4 + moveSpeed * 0.3);
      e.mesh.position.y += Math.sin(e.walkPhase) * 0.055;
    }

    const yaw = Math.atan2(toPlayer.x, toPlayer.z);
    e.mesh.rotation.y = lerpAngle(e.mesh.rotation.y, yaw, Math.min(1, effectiveDt * 8));
    const ragdollUntil = e.ragdollUntil || 0;
    const st = state.time || 0;
    if (ragdollUntil > st) {
      const phase = (ragdollUntil - st) / 0.2;
      e.mesh.rotation.x = (e.mesh.rotation.x || 0) * 0.97 + Math.sin(st * 3) * 0.014 * phase;
      e.mesh.rotation.z = (e.mesh.rotation.z || 0) * 0.97 + Math.sin(st * 2.5 + 1) * 0.017 * phase;
    } else {
      e.mesh.rotation.x *= Math.exp(-8 * effectiveDt);
      e.mesh.rotation.z *= Math.exp(-8 * effectiveDt);
    }

    if (dist < 10 && (e.speechBubbleUntil || 0) <= state.time && Math.random() < 0.00035) {
      const lines = e.isBoss ? ENEMY_SPEECH_BOSS : ENEMY_SPEECH_LINES;
      spawnEnemySpeechBubble(e, lines[Math.floor(Math.random() * lines.length)]);
    }
    const touch = e.radius + PLAYER_RADIUS + 0.28;
    if (dist < 3.2 && dist >= touch) {
      const knockStr = 4.5 * effectiveDt;
      player.vel.addScaledVector(toPlayer, knockStr);
    }
    if (dist < touch) {
      const invincible = (state.invincibleUntil && state.time < state.invincibleUntil) || (state.dodgeUntil && state.time < state.dodgeUntil);
      if (!invincible) {
        if (Math.random() < 0.03 && (e.speechBubbleUntil || 0) <= state.time) {
          const lines = e.isBoss ? ENEMY_SPEECH_BOSS : ENEMY_SPEECH_LINES;
          spawnEnemySpeechBubble(e, lines[Math.floor(Math.random() * lines.length)]);
        }
        let rawDmg = e.damage * effectiveDt;
        let reduced = rawDmg * Math.max(0, 1 - (stats.armor || 0));
        if (stats.lastStand && stats.hp <= stats.maxHp * 0.2) reduced *= 0.75;
        const totalIncoming = reduced;
        const sh = stats.shield || 0;
        if (sh > 0) {
          stats.shield = Math.max(0, sh - reduced);
          reduced = Math.max(0, reduced - sh);
        }
        state.lastAttacker = e.name;
        state.lastDamageType = "melee";
        stats.hp -= reduced;
        if (reduced > 3) {
          state.invincibleUntil = state.time + 0.22;
          triggerCameraShake(0.5);
        }
        if (e.poisonOnHit) state.playerPoisonLeft = Math.max(state.playerPoisonLeft || 0, 2.5);
        if (e.burnOnHit) state.playerBurnLeft = Math.max(state.playerBurnLeft || 0, 2.0);
        if (stats.thorns > 0 && totalIncoming > 0) applyDamageEnemy(e, totalIncoming * stats.thorns, toPlayer.clone().negate(), false);
        const pushStr = state.time >= 600 ? 15 : 10;
        player.vel.addScaledVector(toPlayer, -pushStr * dt);
        if (state.time >= 600) player.vy = Math.min(player.vy + 6, 14);
        applyRagdollImpact(toPlayer.x * (state.time >= 600 ? -20 : -12), toPlayer.z * (state.time >= 600 ? -20 : -12), reduced > 5);
      }
    }

    if (e.isHerobrine) {
      e.lightningCd = (e.lightningCd || 1.8) - dt;
      if (e.lightningCd <= 0) {
        e.lightningCd = 1.6 + Math.random() * 1.0;
        const angle = Math.random() * Math.PI * 2;
        const dist = 4 + Math.random() * 8;
        const pos = new THREE.Vector3(
          e.mesh.position.x + Math.cos(angle) * dist,
          0,
          e.mesh.position.z + Math.sin(angle) * dist
        );
        pos.x = clamp(pos.x, -WORLD_HALF + 4, WORLD_HALF - 4);
        pos.z = clamp(pos.z, -WORLD_HALF + 4, WORLD_HALF - 4);
        pos.y = sampleTerrainHeight(pos.x, pos.z) + 0.1;
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(LIGHTNING_RADIUS * 0.3, LIGHTNING_RADIUS, 24),
          new THREE.MeshBasicMaterial({ color: 0x88ff88, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(pos);
        scene.add(ring);
        state.lightningTelegraphs.push({ pos: pos.clone(), strikeAt: state.time + LIGHTNING_STRIKE_DELAY, mesh: ring });
      }
      e.specialCd -= dt;
      if (e.specialCd <= 0) {
        e.specialCd = 4.5 + Math.random() * 1.8;
        const targetPos = player.mesh.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4));
        spawnTelegraph(targetPos, 5.7, 32 + state.difficultyStage * 3, 1.55, "enemy", 0x44aa44);
        if (Math.random() < 0.25 && enemies.length < getMaxEnemies() - 2) {
          spawnEnemy();
          spawnEnemy();
        }
      }
    } else if (e.isBoss) {
      if (state.time < 180) continue;
      e.specialCd -= dt;
      if (e.specialCd <= 0) {
        e.specialCd = 5.0 + Math.random() * 2.0;
        const targetPos = player.mesh.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4));
        spawnTelegraph(targetPos, 5.7, 28 + state.difficultyStage * 3, 1.6, "enemy", 0xff425c);
        if (Math.random() < 0.3 && enemies.length < getMaxEnemies() - 2) {
          spawnEnemy();
          spawnEnemy();
        }
      }
    } else if (e.tier === "unique") {
      if (state.time < 120) continue;
      e.specialCd -= dt;
      if (e.specialCd <= 0) {
        e.specialCd = 6.5 + Math.random() * 2.5;
        spawnTelegraph(player.mesh.position.clone(), 4.8, 20 + state.level * 0.4, 1.7, "enemy");
      }
    }
    if (e.ranged) {
      e.shootCd -= dt;
      const skillType = (e.enemySkillType || "projectile") === "laser" ? "projectile" : (e.enemySkillType || "projectile");
      if (e.castLabel) {
        if (e.shootCd <= 0.6 && e.shootCd > 0) {
          updateCastLabel(e.castLabel, skillType === "fireball" ? "Ateş Topu!" : (skillType === "holy" ? "Kutsal!" : "Atış!"));
          e.castLabel.visible = true;
        } else {
          e.castLabel.visible = false;
        }
      }
      if (e.shootCd <= 0) {
        const fromPos = e.mesh.position.clone().setY(e.mesh.position.y + 0.8);
        const dir = v0.copy(player.mesh.position).sub(e.mesh.position).setY(0).normalize();
        if (skillType === "fireball") {
          spawnEnemyProjectile(fromPos, dir, e.damage * 0.7, e.name, "fireball");
          spawnDamageText(e.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0)), "Ateş Topu!", false, "Ateş");
        } else if (skillType === "holy") {
          spawnEnemyProjectile(fromPos, dir, e.damage * 0.85, e.name, "projectile");
          spawnDamageText(e.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0)), "Kutsal!", false, "Kutsal");
        } else {
          spawnEnemyProjectile(fromPos, dir, e.damage * 0.7, e.name, "projectile");
          spawnDamageText(e.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0)), "Atış!", false, "Atış");
        }
        e.shootCd = 1.8 + Math.random() * 1.0;
      }
    }
    if (e.affix === "lifeStealAura" && dist < 4.5) {
      const inv = (state.invincibleUntil && state.time < state.invincibleUntil) || (state.dodgeUntil && state.time < state.dodgeUntil);
      if (!inv) {
        state.lastAttacker = e.name;
        state.lastDamageType = "lifesteal";
        const drain = 2.2 * dt * Math.max(0, 1 - (stats.armor || 0));
        stats.hp -= drain;
        e.hp = Math.min(e.maxHp, e.hp + 1.0 * dt);
      }
    }
    if (e.affix === "slowAura" && dist < 4) {
      if (!state.slowAuraUntil || state.time > state.slowAuraUntil) state.slowAuraUntil = state.time + 0.2;
    }
    // HP bari canvas'a ciziyor; uzaktakileri gizle, yakindakileri seyrek guncelle.
    if (e.hpBar) {
      if (distToPlayer > HP_BAR_DRAW_DIST) {
        if (e.hpBar.visible) e.hpBar.visible = false;
      } else {
        if (!e.hpBar.visible) e.hpBar.visible = true;
        if ((i + _perfFrame) % 2 === 0) updateHpBar(e.hpBar, e.hp, e.maxHp);
      }
    }
  }
}

const MAX_ENEMY_PROJECTILES = 40;
const ENEMY_LASER_RANGE = 12;
const ENEMY_LASER_WIDTH = 0.4;
const ENEMY_LASER_DURATION = 0.25;

function spawnEnemyLaser(fromPos, dir, damage) {
  if (enemyLasers.length >= 8) return;
  const range = ENEMY_LASER_RANGE;
  const width = ENEMY_LASER_WIDTH;
  const end = fromPos.clone().addScaledVector(dir, range);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.6, width * 0.7, range, 6),
    new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.92 })
  );
  mesh.position.copy(fromPos).addScaledVector(dir, range * 0.5);
  mesh.lookAt(end);
  mesh.rotation.x -= Math.PI / 2;
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 1.2, width * 1.3, range, 6),
    new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
  );
  glow.position.copy(mesh.position);
  glow.rotation.copy(mesh.rotation);
  const g = new THREE.Group();
  g.add(mesh);
  g.add(glow);
  scene.add(g);
  enemyLasers.push({
    mesh: g,
    origin: fromPos.clone(),
    dir: dir.clone(),
    range,
    width,
    damage: Math.max(6, damage),
    life: ENEMY_LASER_DURATION,
    hitPlayer: false,
  });
}

function updateEnemyLasers(dt) {
  for (let i = enemyLasers.length - 1; i >= 0; i--) {
    const p = enemyLasers[i];
    p.life -= dt;
    const segStart = p.origin;
    const segEnd = p.origin.clone().addScaledVector(p.dir, p.range);
    const sx = segStart.x, sz = segStart.z;
    const dx = segEnd.x - sx, dz = segEnd.z - sz;
    const px = player.mesh.position.x, pz = player.mesh.position.z;
    const t = Math.max(0, Math.min(1, ((px - sx) * dx + (pz - sz) * dz) / (dx * dx + dz * dz + 1e-8)));
    const nx = sx + t * dx, nz = sz + t * dz;
    const dist = Math.hypot(px - nx, pz - nz);
    if (!p.hitPlayer && dist < p.width + PLAYER_RADIUS) {
      p.hitPlayer = true;
      const inv = (state.invincibleUntil && state.time < state.invincibleUntil) || (state.dodgeUntil && state.time < state.dodgeUntil);
      if (!inv) {
        state.lastAttacker = p.attackerName || null;
        state.lastDamageType = "laser";
        let reduced = p.damage * Math.max(0, 1 - (stats.armor || 0));
        const sh = stats.shield || 0;
        if (sh > 0) { stats.shield = Math.max(0, sh - reduced); reduced = Math.max(0, reduced - sh); }
        stats.hp -= reduced;
        state.invincibleUntil = state.time + 0.22;
        spawnFlash(player.mesh.position, 0xff4444, 0.8, 0.16);
        triggerCameraShake();
      }
    }
    if (p.life <= 0) {
      scene.remove(p.mesh);
      enemyLasers.splice(i, 1);
    }
  }
}

function spawnEnemyProjectile(fromPos, dir, damage, attackerName, damageType) {
  if (enemyProjectiles.length >= MAX_ENEMY_PROJECTILES) return;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xcc4466, transparent: true, opacity: 0.9 })
  );
  mesh.position.copy(fromPos);
  scene.add(mesh);
  const speed = 14;
  enemyProjectiles.push({
    mesh,
    vel: dir.clone().multiplyScalar(speed),
    damage: Math.max(4, damage),
    radius: 0.5,
    life: 1.8,
    attackerName: attackerName || null,
    damageType: damageType || "projectile",
  });
}

function updateEnemyProjectiles(dt) {
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const p = enemyProjectiles[i];
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.position.y = Math.max(p.mesh.position.y, sampleTerrainHeight(p.mesh.position.x, p.mesh.position.z) + 0.2);
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      enemyProjectiles.splice(i, 1);
      continue;
    }
    const dist = player.mesh.position.distanceTo(p.mesh.position);
    if (dist <= PLAYER_RADIUS + p.radius) {
      const inv = (state.invincibleUntil && state.time < state.invincibleUntil) || (state.dodgeUntil && state.time < state.dodgeUntil);
      if (!inv) {
        state.lastAttacker = p.attackerName || null;
        state.lastDamageType = p.damageType || "projectile";
        let reduced = p.damage * Math.max(0, 1 - (stats.armor || 0));
        if (stats.lastStand && stats.hp <= stats.maxHp * 0.2) reduced *= 0.75;
        const sh = stats.shield || 0;
        if (sh > 0) { stats.shield = Math.max(0, sh - reduced); reduced = Math.max(0, reduced - sh); }
        stats.hp -= reduced;
        state.invincibleUntil = state.time + 0.22;
        spawnFlash(player.mesh.position, 0xff6b6b, 0.8, 0.16);
        triggerCameraShake();
      }
      scene.remove(p.mesh);
      enemyProjectiles.splice(i, 1);
    }
  }
}

// Flying enemies - flap wings, fly above ground
function updateFlyingEnemies(dt) {
  if (state.inTemple) return;
  // Spawn flying enemies from chapter 2 onward
  if (state.chapter >= 2 && Math.random() < 0.003 * dt && enemies.length < getMaxEnemies() - 5) {
    const fe = createFlyingEnemy();
    const a = Math.random() * Math.PI * 2;
    const r = 30 + Math.random() * 25;
    const x = clamp(player.mesh.position.x + Math.cos(a) * r, -WORLD_HALF + 5, WORLD_HALF - 5);
    const z = clamp(player.mesh.position.z + Math.sin(a) * r, -WORLD_HALF + 5, WORLD_HALF - 5);
    fe.mesh.position.set(x, sampleTerrainHeight(x, z) + fe.flyHeight, z);
    enemies.push(fe);
    scene.add(fe.mesh);
  }

  for (const e of enemies) {
    if (!e.isFlying) continue;
    // Animate wings
    e.wingPhase += dt * 8;
    const flapAngle = Math.sin(e.wingPhase) * 0.6;
    const parts = e.mesh.userData && e.mesh.userData.parts;
    const namedL = (parts && parts.wingL) || e.mesh.getObjectByName("wingL");
    const namedR = (parts && parts.wingR) || e.mesh.getObjectByName("wingR");
    if (namedL && namedR) {
      namedL.rotation.z = flapAngle;
      namedR.rotation.z = -flapAngle;
    } else {
      const [wL, wR] = e.wingIndices || [5, 6];
      if (e.mesh.children[wL]) e.mesh.children[wL].rotation.z = flapAngle;
      if (e.mesh.children[wR]) e.mesh.children[wR].rotation.z = -flapAngle;
    }
    const groundY = getGroundHeight(e.mesh.position.x, e.mesh.position.z);
    e.mesh.position.y = groundY + e.flyHeight + Math.sin(e.wingPhase * 0.3) * 0.5;
    const dx = player.mesh.position.x - e.mesh.position.x;
    const dz = player.mesh.position.z - e.mesh.position.z;
    e.mesh.rotation.y = Math.atan2(dx, dz);
    if (!e.mesh.userData.voxelId && e.mesh.children[0]) e.mesh.children[0].rotation.z = Math.sin(e.wingPhase * 0.5) * 0.1;
  }
}

// Shadow mode - after 10 minutes per chapter, ONLY shadow wraiths spawn
// Normal/magic/rare/unique enemies get wiped. Resets on new chapter.
const SHADOW_TRIGGER_TIME = 600; // 10 minutes per chapter
let shadowPurgeComplete = false;
function updateShadowMode(dt) {
  if (state.endlessMode || state.inMegaArena || state.inTemple) return;
  const ct = state.chapterTime || 0;
  if (ct >= SHADOW_TRIGGER_TIME) {
    shadowModeTimer += dt;
    if (!shadowMode) {
      shadowMode = true;
      shadowPurgeComplete = false;
      scene.fog = new THREE.FogExp2(0x110022, 0.012);
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "⚠ KARANLIK RUHLAR GELIYOR...", true, "SHADOW");
      spawnWave(player.mesh.position, 15, 0x440088);
      playSfx(180, 0.22);
    }
    // Immediately kill ALL non-shadow non-boss enemies
    if (!shadowPurgeComplete) {
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].isShadow && !enemies[i].isBoss) {
          releaseEnemyVisuals(enemies[i]);
          scene.remove(enemies[i].mesh);
          enemies.splice(i, 1);
        }
      }
      shadowPurgeComplete = true;
    }
    // Spawn shadow enemies aggressively (scaled by chapter + time past 10m)
    if (shadowModeTimer > 1.2) {
      shadowModeTimer = 0;
      const chapterScale = 1 + (state.chapter - 1) * 0.4;
      const minutesPast = (ct - SHADOW_TRIGGER_TIME) / 60;
      const timeScale = 1 + minutesPast * 0.15; // gradually harder
      const count = Math.min(5, 2 + Math.floor(minutesPast * 0.3));
      for (let s = 0; s < count; s++) {
        if (enemies.length >= getMaxEnemies()) break;
        const se = createShadowEnemy();
        se.hp *= chapterScale * timeScale;
        se.maxHp = se.hp;
        se.speed = getUnifiedEnemySpeed() * 1.2 * (1 + minutesPast * 0.012);
        se.damage *= chapterScale * timeScale * 1.25;
        const a = Math.random() * Math.PI * 2;
        const r = 16 + Math.random() * 22;
        const x = clamp(player.mesh.position.x + Math.cos(a) * r, -WORLD_HALF + 5, WORLD_HALF - 5);
        const z = clamp(player.mesh.position.z + Math.sin(a) * r, -WORLD_HALF + 5, WORLD_HALF - 5);
        se.mesh.position.set(x, getGroundHeight(x, z), z);
        enemies.push(se);
        scene.add(se.mesh);
      }
    }
  } else {
    if (shadowMode) {
      shadowMode = false;
      shadowModeTimer = 0;
      shadowPurgeComplete = false;
      // Restore fog
      if (state.chapter === 1) scene.fog = new THREE.FogExp2(defaultFogColor, defaultFogDensity);
    }
  }
  // Animate shadow enemies - ghostly float + pulse
  for (const e of enemies) {
    if (!e.isShadow) continue;
    e.mesh.position.y = getGroundHeight(e.mesh.position.x, e.mesh.position.z) + Math.sin(state.time * 2 + e.mesh.position.x) * 0.3;
    for (const c of e.mesh.children) {
      if (c.material && c.material.opacity !== undefined) {
        c.material.opacity = 0.7 + Math.sin(state.time * 3) * 0.15;
      }
    }
  }
}

function spawnTrailParticle(pos, color, trailType) {
  if (effects.length >= MAX_EFFECTS) return;
  let size, life, vel, opacity;
  if (trailType === "fire") {
    size = 0.08 + Math.random() * 0.08;
    life = 0.3;
    opacity = 0.6;
    vel = new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.5 + Math.random() * 0.8, (Math.random() - 0.5) * 0.8);
  } else if (trailType === "ice") {
    size = 0.04 + Math.random() * 0.05;
    life = 0.35;
    opacity = 0.5;
    vel = new THREE.Vector3((Math.random() - 0.5) * 0.3, -0.2 + Math.random() * 0.2, (Math.random() - 0.5) * 0.3);
  } else if (trailType === "electric") {
    size = 0.03 + Math.random() * 0.04;
    life = 0.15;
    opacity = 0.8;
    vel = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
  } else {
    size = 0.06 + Math.random() * 0.06;
    life = 0.2;
    opacity = 0.55;
    vel = new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.3, (Math.random() - 0.5) * 0.5);
  }
  const geo = trailType === "ice" ? new THREE.OctahedronGeometry(size, 0) : new THREE.SphereGeometry(size, 4, 4);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity }));
  mesh.position.copy(pos);
  scene.add(mesh);
  effects.push({ type: "particle", mesh, life, total: life, vel });
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.life -= dt;
    // Trail particles for all non-meteor projectiles
    if (p.trailTimer !== undefined && !p.isMeteor && !p.isChaosMeteor && !p.isChaosIce && !p.isLineShot && !p.isLaser && !p.isLightBeam) {
      p.trailTimer = (p.trailTimer || 0) + dt;
      const interval = p.trailType === "fire" ? 0.06 : (p.trailType === "electric" ? 0.045 : 0.09);
      if (p.trailTimer > interval) {
        p.trailTimer = 0;
        spawnTrailParticle(p.mesh.position.clone(), p.trailColor || 0xffffff, p.trailType || "default");
      }
    }
    
    // Meteor fizigi
    if (p.isMeteor || p.isChaosMeteor || p.isChaosIce) {
      p.meteorAge = (p.meteorAge || 0) + dt;
      if (p.isMeteor && !p.isChaosMeteor && p.meteorAge > 6) {
        disposeProjectileMesh(p);
        projectiles.splice(i, 1);
        continue;
      }
      if (p.meteorAge > 12) {
        disposeProjectileMesh(p);
        projectiles.splice(i, 1);
        continue;
      }
      const meteorGravity = p.isChaosMeteor ? 7 : (p.isChaosIce ? 18 : 22);
      p.vel.y -= meteorGravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 3;
      p.mesh.rotation.y += dt * 5;
      if (p.telegraphMesh && p.telegraphMesh.material) {
        p.telegraphMesh.material.opacity = 0.72 + 0.22 * Math.sin((state.time || 0) * 4);
      }

      const groundY = sampleTerrainHeight(p.mesh.position.x, p.mesh.position.z);
      const hitGround = p.mesh.position.y <= groundY + 1.5;
      const timeout = p.meteorAge > 5;
      const outOfBounds = Math.abs(p.mesh.position.x) > WORLD_HALF + 16 || Math.abs(p.mesh.position.z) > WORLD_HALF + 16;

      if ((hitGround || timeout || outOfBounds) && !p.impacted) {
        p.impacted = true;
        const impactPos = p.mesh.position.clone();
        if (timeout || outOfBounds) impactPos.y = groundY + 0.3;
        const isIceImpact = p.isChaosIce || p.isComet;
        radialDamageEnemies(impactPos, p.radius, p.damage, isIceImpact ? "ice" : "fire");
        if (p.isComet) {
          spawnRing(impactPos, p.radius, 0x4d9dff, 0.4);
          spawnFlash(impactPos, 0x4d9dff, 0.5, 0.22);
          enemies.forEach(function(e) {
            if (e.mesh.position.distanceTo(impactPos) < p.radius) e.freezeLeft = Math.max(e.freezeLeft || 0, 1.2);
          });
        } else if (p.isChaosMeteor || p.isChaosIce) {
          const distToPlayer = player.mesh.position.distanceTo(impactPos);
          if (distToPlayer < p.radius + 2 && (!state.invincibleUntil || state.time >= state.invincibleUntil)) {
            const dmg = p.damage * (1 - distToPlayer / (p.radius + 2)) * 0.6;
            const sh = stats.shield || 0;
            if (sh > 0) stats.shield = Math.max(0, sh - dmg);
            else stats.hp -= dmg;
            if (dmg > 2) { state.invincibleUntil = state.time + 0.22; triggerCameraShake(0.55); }
          }
        }
        if (p.isChaosIce) {
          spawnRing(impactPos, p.radius, 0x88ddff, 0.35);
          spawnFlash(impactPos, 0x88ddff, 0.5, 0.2);
          enemies.forEach(function(e) {
            if (e.mesh.position.distanceTo(impactPos) < p.radius) e.freezeLeft = Math.max(e.freezeLeft || 0, 1.5);
          });
        } else if (!p.isComet) {
          spawnRing(impactPos, p.radius, 0xff6b4d, 0.4);
          spawnFlash(impactPos, 0xff4500, 0.7, 0.28);
          spawnImpactRock(impactPos.clone().add(new THREE.Vector3(0, 1, 0)), 0xff6b4d);
        }
        playSfx(p.isComet ? 420 : (p.isChaosIce ? 320 : 200), 0.12, 0.55);
        disposeProjectileMesh(p);
        projectiles.splice(i, 1);
        continue;
      }
      if (outOfBounds) {
        disposeProjectileMesh(p);
        projectiles.splice(i, 1);
        continue;
      }
    } else if (p.isLineShot) {
      p.mesh.position.addScaledVector(p.vel, dt);
      const segEnd = p.mesh.position.clone();
      const segStart = segEnd.clone().addScaledVector(p.vel, -dt);
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e._dead || p.hitEnemies.has(e)) continue;
        const ep = e.mesh.position;
        const ex = ep.x, ez = ep.z;
        const sx = segStart.x, sz = segStart.z;
        const dx = segEnd.x - sx, dz = segEnd.z - sz;
        const t = Math.max(0, Math.min(1, ((ex - sx) * dx + (ez - sz) * dz) / (dx * dx + dz * dz + 1e-8)));
        const nx = sx + t * dx, nz = sz + t * dz;
        const dist = Math.hypot(ex - nx, ez - nz);
        if (dist < (p.width || 0.5) + e.radius) {
          p.hitEnemies.add(e);
          const dir = v0.copy(ep).sub(p.mesh.position).setY(0).normalize();
          applyDamageEnemy(e, p.damage, dir, false);
        }
      }
      if (p.life <= 0) {
        disposeProjectileMesh(p);
        projectiles.splice(i, 1);
      }
      continue;
    } else if (p.isSpark) {
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.position.y = getGroundHeight(p.mesh.position.x, p.mesh.position.z) + 0.06;
      if (p.mesh.rotation) p.mesh.rotation.y = Math.atan2(p.vel.x, p.vel.z);
      let hit = false;
      for (let j = enemies.length - 1; j >= 0 && !hit; j--) {
        const e = enemies[j];
        if (e._dead || e.hp <= 0 || p.hitEnemies.has(e)) continue;
        const dist = p.mesh.position.distanceTo(e.mesh.position);
        if (dist < (p.radius || 0.2) + e.radius) {
          p.hitEnemies.add(e);
          const dir = v0.copy(e.mesh.position).sub(p.mesh.position).setY(0).normalize();
          applyDamageEnemy(e, p.damage, dir, false, "lightning");
          const splashPos = p.mesh.position.clone();
          const splashDmg = p.damage * 0.4;
          const splashR = 1.8;
          if (typeof radialDamageEnemies === "function") radialDamageEnemies(splashPos, splashR, splashDmg);
          if (typeof spawnRing === "function") spawnRing(splashPos, splashR, 0x88ddff, 0.25);
          spawnFlash(splashPos, 0x88ddff, 0.4, 0.15);
          hit = true;
        }
      }
      if (p.life <= 0 || hit) {
        if (hit) spawnFlash(p.mesh.position, 0x88ddff, 0.35, 0.12);
        disposeProjectileMesh(p);
        projectiles.splice(i, 1);
      }
      continue;
    } else if (p.isLaser || p.isLightBeam) {
      const segStart = p.origin;
      const segEnd = p.origin.clone().addScaledVector(p.dir, p.range);
      const sx = segStart.x, sz = segStart.z;
      const dx = segEnd.x - sx, dz = segEnd.z - sz;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e._dead || p.hitEnemies.has(e)) continue;
        const ep = e.mesh.position;
        const ex = ep.x, ez = ep.z;
        const t = Math.max(0, Math.min(1, ((ex - sx) * dx + (ez - sz) * dz) / (dx * dx + dz * dz + 1e-8)));
        const nx = sx + t * dx, nz = sz + t * dz;
        const dist = Math.hypot(ex - nx, ez - nz);
        if (dist < (p.width || 0.4) + e.radius) {
          p.hitEnemies.add(e);
          const knock = v0.copy(ep).sub(segStart).setY(0).normalize();
          applyDamageEnemy(e, p.damage, knock, false);
        }
      }
      if (p.life <= 0) {
        disposeProjectileMesh(p);
        projectiles.splice(i, 1);
      }
      continue;
    } else {
      if (p.isBoomerang) {
        if (p.phase === "out" && p.mesh.position.distanceTo(p.origin) >= p.range) {
          p.phase = "return";
        }
        if (p.phase === "return") {
          const toPlayer = v0.copy(player.mesh.position).sub(p.mesh.position).setY(0);
          if (toPlayer.lengthSq() < 0.01) { disposeProjectileMesh(p); projectiles.splice(i, 1); continue; }
          toPlayer.normalize();
          p.vel.copy(toPlayer).multiplyScalar(p.speed);
          if (p.mesh.position.distanceTo(player.mesh.position) < 1.8) {
            disposeProjectileMesh(p);
            projectiles.splice(i, 1);
            continue;
          }
        }
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.y += dt * 14;
        p.mesh.rotation.z += dt * 6;
      } else if (p.shape === "banana") {
        p.vel.y = (p.vel.y ?? 0) - 14 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.y += dt * 8;
        const gy = sampleTerrainHeight(p.mesh.position.x, p.mesh.position.z);
        if (p.mesh.position.y <= gy + 0.4) {
          spawnGroundSlipHazard(p.mesh.position.clone());
          disposeProjectileMesh(p);
          projectiles.splice(i, 1);
          continue;
        }
      } else if (p.shape === "bomb") {
        p.vel.y = (p.vel.y ?? 0) - 22 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.x += dt * 4;
        p.mesh.rotation.y += dt * 6;
        const gy = sampleTerrainHeight(p.mesh.position.x, p.mesh.position.z);
        if (p.mesh.position.y <= gy + 0.35) {
          const impactPos = p.mesh.position.clone();
          impactPos.y = gy + 0.2;
          const explR = p.explosionRadius ?? 4;
          if (typeof radialDamageEnemies === "function") radialDamageEnemies(impactPos, explR, p.damage, "fire");
          if (typeof spawnRing === "function") spawnRing(impactPos, explR, 0xff4422, 0.5);
          if (typeof spawnBurst === "function") spawnBurst(impactPos.clone().setY(impactPos.y + 0.5), 0xff6622, 12);
          if (typeof playExplosionBoom === "function") playExplosionBoom();
          if (player.mesh && player.mesh.position.distanceTo(impactPos) < explR) {
            const dmg = p.damage * 0.7 * (1 - player.mesh.position.distanceTo(impactPos) / explR) * Math.max(0, 1 - (stats.armor || 0));
            let d = dmg;
            const sh = stats.shield || 0;
            if (sh > 0) { stats.shield = Math.max(0, sh - d); d = Math.max(0, d - sh); }
            stats.hp -= d;
            if (d > 2 && typeof triggerCameraShake === "function") triggerCameraShake(0.3);
          }
          disposeProjectileMesh(p);
          projectiles.splice(i, 1);
          continue;
        }
      } else {
        p.mesh.position.addScaledVector(p.vel, dt);
        if (p.shape && p.shape.startsWith("arrow") && p.vel.lengthSq() > 0.01) {
          p.mesh.lookAt(p.mesh.position.clone().add(p.vel));
        } else {
          p.mesh.rotation.y += dt * 8;
        }
      }

      if (p.life <= 0 || Math.abs(p.mesh.position.x) > WORLD_HALF + 16 || Math.abs(p.mesh.position.z) > WORLD_HALF + 16) {
        if (!p.isBoomerang) { disposeProjectileMesh(p); projectiles.splice(i, 1); continue; }
      }

      let consumed = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const hitR = p.radius + e.radius;
        const dx = p.mesh.position.x - e.mesh.position.x;
        const dz = p.mesh.position.z - e.mesh.position.z;
        if (dx * dx + dz * dz > hitR * hitR) continue;

        const dir = v3.copy(p.vel).setY(0).normalize();
        if (dir.lengthSq() < 0.01) dir.set(1, 0, 0);
        else dir.normalize();
        const projDmg = p.damage * (stats.projectileDamageMult || 1);
        const dmgType = p.damageType || (p.shape === "fireball" ? "fire" : (p.shape === "frostball" || p.shape === "comet" ? "ice" : (p.shape === "shuriken" ? "lightning" : (p.shape === "arrow_burn" ? "fire" : (p.shape === "arrow_freeze" ? "ice" : (p.shape === "arrow_shock" ? "lightning" : null))))));
        applyDamageEnemy(e, projDmg, dir, p.crit, dmgType);
        if (p.shape === "banana") {
          e.push.add(dir.clone().multiplyScalar(4));
          spawnGroundSlipHazard(p.mesh.position.clone());
        }
        if (p.shape === "balloon") {
          state.slowPuddles = state.slowPuddles || [];
          if (state.slowPuddles.length >= 2) state.slowPuddles.shift();
          state.slowPuddles.push({ x: p.mesh.position.x, z: p.mesh.position.z, radius: 2.2, life: 4 });
        }
        if (p.frost) e.freezeLeft = Math.max(e.freezeLeft, p.frost);
        if (p.stun) e.stunLeft = Math.max(e.stunLeft || 0, p.stun);
        spawnFlash(p.mesh.position, 0xffcf9a, 0.35, 0.12);
        if (p.aoe > 0) {
          radialDamageEnemies(p.mesh.position, p.aoe, projDmg * 0.56);
          spawnRing(p.mesh.position, p.aoe, 0xffca7c, 0.2);
        }
        if (p.shards && p.shards > 0) {
          for (let s = 0; s < p.shards; s++) {
            const dir2 = new THREE.Vector3(Math.cos((s / p.shards) * Math.PI * 2), 0, Math.sin((s / p.shards) * Math.PI * 2));
            spawnProjectile({ position: p.mesh.position.clone(), direction: dir2, speed: 14, damage: projDmg * 0.4, radius: 0.12, life: 0.8, frost: p.frost ? p.frost * 0.5 : 0 });
          }
        }
        if (stats.ricochet > 0 && !p.ricocheted) {
          let nearest = null; let bestD2 = 9999;
          for (let k = 0; k < enemies.length; k++) {
            const o = enemies[k];
            if (o === e || o.hp <= 0) continue;
            const d2 = o.mesh.position.distanceToSquared(p.mesh.position);
            if (d2 < bestD2 && d2 < 144) { bestD2 = d2; nearest = o; }
          }
          if (nearest) {
            const bounceDir = v0.copy(nearest.mesh.position).sub(p.mesh.position).setY(0).normalize();
            spawnProjectile({ position: p.mesh.position.clone(), direction: bounceDir, speed: p.speed || stats.projectileSpeed, damage: p.damage * 0.7, radius: p.radius, life: 0.6, crit: p.crit, ricocheted: true });
          }
          p.ricocheted = true;
        }

        if (p.pierce > 0) p.pierce -= 1;
        else consumed = true;
        break;
      }

      if (consumed) { disposeProjectileMesh(p); projectiles.splice(i, 1); }
    }
  }
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const fx = effects[i];
    if (typeof fx.life === "number") fx.life -= dt;

    if (fx.type === "flash") {
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      fx.mesh.scale.setScalar(1 + t * 2.6);
      fx.mesh.material.opacity = clamp(0.62 * (1 - t), 0, 1);
    } else if (fx.type === "ring") {
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      fx.mesh.scale.setScalar(1 + t * 1.2);
      fx.mesh.material.opacity = clamp(0.55 * (1 - t), 0, 1);
    } else if (fx.type === "kineticBlastLine") {
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      if (fx.mesh.material) fx.mesh.material.opacity = clamp(0.92 * (1 - t), 0, 1);
    } else if (fx.type === "particle") {
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      if (fx.gravity) fx.vel.y -= 9.8 * dt;
      fx.mesh.position.addScaledVector(fx.vel, dt);
      fx.mesh.material.opacity = 1 - t;
      fx.mesh.scale.setScalar(1 - t * 0.6);
    } else if (fx.type === "debris") {
      if (fx.vel) {
        fx.vel.y -= 12 * dt;
        fx.mesh.position.addScaledVector(fx.vel, dt);
      }
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      if (fx.mesh.material) fx.mesh.material.opacity = 0.85 * (1 - t);
      fx.mesh.scale.setScalar(1 - t * 0.5);
    } else if (fx.type === "wave") {
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      fx.mesh.scale.setScalar(1 + t * 3.5);
      fx.mesh.material.opacity = 0.6 * (1 - t);
    } else if (fx.type === "slash") {
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      fx.mesh.material.opacity = 0.8 * (1 - t);
      fx.mesh.scale.setScalar(1 + t * 1.2);
    } else if (fx.type === "dismantle") {
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      fx.mesh.scale.setScalar(1 + t * 0.6);
      if (fx.mesh.children && fx.mesh.children.length >= 2) {
        if (fx.mesh.children[0].material) fx.mesh.children[0].material.opacity = 0.98 * (1 - t * 0.95);
        if (fx.mesh.children[1].material) fx.mesh.children[1].material.opacity = 0.5 * (1 - t * 0.95);
      } else if (fx.mesh.material) fx.mesh.material.opacity = 0.85 * (1 - t);
    } else if (fx.type === "herald_bolt") {
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      if (fx.mesh.material) fx.mesh.material.opacity = 0.95 * (1 - t);
    } else if (fx.type === "telegraph") {
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      fx.mesh.scale.setScalar(0.9 + t * 0.55);
      fx.mesh.material.opacity = 0.28 + Math.sin(state.time * 8) * 0.1;

      if (fx.life <= 0 && !fx.triggered) {
        fx.triggered = true;
        if (fx.source === "enemy") {
          const noDodge = !state.dodgeUntil || state.time >= state.dodgeUntil;
          if (player.mesh.position.distanceTo(fx.mesh.position) <= fx.radius && (!state.invincibleUntil || state.time >= state.invincibleUntil) && noDodge) {
            stats.hp -= fx.damage;
            state.invincibleUntil = state.time + 0.22;
            if (typeof triggerCameraShake === "function") triggerCameraShake(0.5);
            spawnFlash(player.mesh.position, 0xff6b6b, 0.8, 0.16);
            spawnBurst(player.mesh.position, 0xff3333, 5);
          }
        } else {
          radialDamageEnemies(fx.mesh.position, fx.radius, fx.damage);
          spawnRing(fx.mesh.position, fx.radius, 0xffcf7f, 0.26);
          spawnWave(fx.mesh.position, fx.radius, 0xff8844);
          spawnImpactRock(fx.mesh.position, fx.color || 0xffb474);
        }
      }
    } else if (fx.type === "dmgText") {
      fx.mesh.position.addScaledVector(fx.vel, dt);
      fx.mesh.position.y += dt * 0.8;
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      fx.mesh.material.opacity = 1 - t;
      fx.mesh.scale.setScalar(1 + t * 0.4);
    } else if (fx.type === "enemySpeech") {
      if (fx.enemy && fx.enemy._dead) {
        if (fx.mesh && fx.mesh.material) { if (fx.mesh.material.map) fx.mesh.material.map.dispose(); fx.mesh.material.dispose(); }
        scene.remove(fx.mesh);
        effects.splice(i, 1);
        continue;
      }
      if (fx.enemy && fx.enemy.mesh) {
        const yOff = fx.enemy.isBoss ? 4.2 : (fx.enemy.radius || 0.9) + 1.8;
        fx.mesh.position.copy(fx.enemy.mesh.position).add(v3.set(0, yOff, 0));
      }
      const t = 1 - clamp(fx.life / fx.total, 0, 1);
      fx.mesh.material.opacity = 1 - t * 0.7;
    } else if (fx.type === "impactRock") {
      fx.mesh.userData.life -= dt;
      fx.mesh.position.addScaledVector(fx.mesh.userData.vel, dt);
      fx.mesh.userData.vel.multiplyScalar(0.92);
      if (fx.mesh.position.y <= sampleTerrainHeight(fx.mesh.position.x, fx.mesh.position.z) + 0.3) {
        radialDamageEnemies(fx.mesh.position, 3.2, 50);
        spawnRing(fx.mesh.position, 3.2, 0xffffff, 0.25);
        spawnBurst(fx.mesh.position, 0xffcc88, 6);
        if (fx.mesh.material) fx.mesh.material.dispose();
        scene.remove(fx.mesh);
        effects.splice(i, 1);
        continue;
      }
    }

    if (typeof fx.life === "number" && fx.life <= -0.05) {
      if (fx.pooled) {
        releaseDamageSprite(fx.mesh);
        effects.splice(i, 1);
        continue;
      }
      if (fx.mesh) {
        if (fx.mesh.material) {
          if (fx.mesh.material.map) fx.mesh.material.map.dispose();
          fx.mesh.material.dispose();
        }
        if (fx.mesh.geometry) fx.mesh.geometry.dispose();
      }
      scene.remove(fx.mesh);
      effects.splice(i, 1);
    }
  }
}

function ensureSwordMeshes(count) {
  while (swordMeshes.length < count) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.96, 0.07), new THREE.MeshStandardMaterial({ color: 0xffd56a, emissive: 0x55360e, emissiveIntensity: 0.28, roughness: 0.32 }));
    scene.add(m); swordMeshes.push(m);
  }
  while (swordMeshes.length > count) {
    scene.remove(swordMeshes.pop());
  }
}

function ensureBananaMeshes(count) {
  while (bananaMeshes.length < count) {
    const m = makeBananaMesh(0.35);
    m.scale.setScalar(0.4);
    scene.add(m);
    bananaMeshes.push(m);
  }
  while (bananaMeshes.length > count) {
    scene.remove(bananaMeshes.pop());
  }
}

function spawnGroundSlipHazard(pos) {
  if (groundSlipHazards.length >= MAX_GROUND_SLIP) {
    const old = groundSlipHazards.shift();
    if (old.mesh && scene) scene.remove(old.mesh);
  }
  const groundY = typeof sampleTerrainHeight === "function" ? sampleTerrainHeight(pos.x, pos.z) : 0;
  pos.y = groundY + 0.08;
  const mesh = makeBananaMesh(0.4);
  mesh.scale.setScalar(0.45);
  mesh.position.copy(pos);
  mesh.rotation.x = -Math.PI / 2 * 0.3;
  mesh.rotation.z = Math.random() * 0.4;
  scene.add(mesh);
  groundSlipHazards.push({ mesh, position: pos.clone(), radius: SLIP_HAZARD_RADIUS, life: SLIP_HAZARD_LIFE });
}

function updateGroundSlipHazards(dt) {
  if (!running || gameOver) return;
  const t = state.time || 0;
  for (let i = groundSlipHazards.length - 1; i >= 0; i--) {
    const h = groundSlipHazards[i];
    h.life -= dt;
    if (h.life <= 0) {
      if (h.mesh && scene) scene.remove(h.mesh);
      groundSlipHazards.splice(i, 1);
      continue;
    }
    if (!player.mesh) continue;
    const dx = player.mesh.position.x - h.position.x;
    const dz = player.mesh.position.z - h.position.z;
    if (dx * dx + dz * dz > h.radius * h.radius) continue;
    if ((state.slipUntil || 0) > t) continue;
    state.slipUntil = t + 1.25;
    state.ragdollUntil = t + 0.85;
    const tangent = new THREE.Vector3(-dz, 0, dx).normalize();
    const slipStr = 5.5 + Math.random() * 2;
    player.vel.addScaledVector(tangent, slipStr * (Math.random() > 0.5 ? 1 : -1));
    state.slipDirection = tangent.clone();
    if (typeof triggerCameraShake === "function") triggerCameraShake(0.4);
    playSfx(180, 0.12, 0.6);
    spawnRing(h.position, h.radius, 0xffdd44, 0.25);
  }
}

function ensureSaturnRings(horizontal, vertical) {
  const need = (horizontal ? 1 : 0) + (vertical ? 1 : 0);
  while (saturnRingMeshes.length < need) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.1, 32),
      new THREE.MeshBasicMaterial({ color: 0xffdd99, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    if (saturnRingMeshes.length === 0 && horizontal) {
      ring.rotation.x = -Math.PI / 2;
      ring.userData.axis = "horizontal";
    } else {
      ring.rotation.y = Math.PI / 2;
      ring.userData.axis = "vertical";
    }
    scene.add(ring);
    saturnRingMeshes.push(ring);
  }
  while (saturnRingMeshes.length > need) scene.remove(saturnRingMeshes.pop());
}

function updateAbilities(dt) {
  if (state.challengeMode === "melee_only") return;
  const target = getNearestEnemy(34);
  const cdMult = Math.max(0, 1 - (stats.globalCdReduction || 0));
  updateSpecials(dt, target);

  if (abilityState.gorillaAura && abilityState.gorillaAura.level > 0) {
    const ga = abilityState.gorillaAura;
    if (!gorillaAuraRingMesh && typeof scene !== "undefined") {
      gorillaAuraRingMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.92, 1, 48),
        new THREE.MeshBasicMaterial({ color: 0x884422, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })
      );
      gorillaAuraRingMesh.rotation.x = -Math.PI / 2;
      gorillaAuraRingMesh.renderOrder = -10;
      scene.add(gorillaAuraRingMesh);
    }
    if (gorillaAuraRingMesh) {
      const gx = player.mesh.position.x, gz = player.mesh.position.z;
      const gy = getGroundHeight(gx, gz) + 0.02;
      gorillaAuraRingMesh.position.set(gx, gy, gz);
      gorillaAuraRingMesh.scale.set(ga.radius, ga.radius, 1);
      gorillaAuraRingMesh.visible = true;
    }
    ga.tickTimer = (ga.tickTimer || 0) + dt;
    if (ga.tickTimer >= ga.tickRate) {
      ga.tickTimer = 0;
      const origin = player.mesh.position.clone().setY(player.mesh.position.y + 0.5);
      radialDamageEnemies(origin, ga.radius, ga.damage * (stats.projectileDamageMult || 1));
      if (state.time % 0.9 < dt) spawnRing(player.mesh.position, ga.radius, 0x664422, 0.25);
    }
  } else if (gorillaAuraRingMesh) {
    gorillaAuraRingMesh.visible = false;
  }

  if (abilityState.flickerStrike && abilityState.flickerStrike.level > 0) {
    const fs = abilityState.flickerStrike;
    fs.timer = Math.max(0, (fs.timer || 0) - dt);
    if (fs.timer <= 0 && !state.flickerTargetEnemy) {
      const range = fs.range || 5.5;
      let nearest = null;
      let bestD2 = range * range;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e._dead || e.hp <= 0) continue;
        const d2 = e.mesh.position.distanceToSquared(player.mesh.position);
        if (d2 < bestD2) { bestD2 = d2; nearest = e; }
      }
      if (nearest) {
        const dmg = (fs.damage || 38) * (stats.projectileDamageMult || 1);
        const wouldKill = nearest.hp <= dmg;
        if (wouldKill) {
          state.flickerTargetEnemy = nearest;
          state.flickerKillingBlow = true;
          state.flickerDamage = dmg;
          state.flickerTeleportTimer = 0.14;
        } else {
          const dir = v0.copy(nearest.mesh.position).sub(player.mesh.position).setY(0).normalize();
          applyDamageEnemy(nearest, dmg, dir, false);
          spawnSlash(player.mesh.position.clone().add(new THREE.Vector3(dir.x * 1.2, 0.9, dir.z * 1.2)), dir, 0xffaa88);
        }
        fs.timer = fs.cooldown * cdMult;
      }
    }
  }
  if (abilityState.spark && abilityState.spark.level > 0) {
    const a = abilityState.spark;
    a.timer -= dt;
    if (a.timer <= 0) {
      const cnt = Math.min(a.count || 5, Math.max(0, MAX_PROJECTILES_PER_SKILL - countSparkProjectiles()));
      if (cnt > 0) spawnSparkProjectiles(cnt, a.damage, a.speed || 14);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.chainBolt && abilityState.chainBolt.level > 0 && target) {
    const a = abilityState.chainBolt;
    a.timer -= dt;
    if (a.timer <= 0) {
      fireChainLightning(target, a.damage * (stats.projectileDamageMult || 1), a.jumps || 4);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.blackHole && abilityState.blackHole.level > 0) {
    const a = abilityState.blackHole;
    a.timer -= dt;
    if (a.timer <= 0 && target) {
      a.timer = a.cooldown * cdMult;
      a.zone = {
        x: target.mesh.position.x,
        z: target.mesh.position.z,
        y: target.mesh.position.y,
        age: 0,
        radius: a.radius,
        damage: a.damage * (stats.projectileDamageMult || 1),
        burst: false
      };
      spawnRing(target.mesh.position, a.radius, 0x331155, 1.1);
    }
    if (a.zone) {
      a.zone.age += dt;
      const zx = a.zone.x, zz = a.zone.z, r = a.zone.radius;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e || e._dead) continue;
        const dx = zx - e.mesh.position.x, dz = zz - e.mesh.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < r && dist > 0.25) {
          const pull = 9 * dt;
          e.mesh.position.x += (dx / dist) * pull;
          e.mesh.position.z += (dz / dist) * pull;
        }
      }
      if (!a.zone.burst && a.zone.age >= 0.9) {
        a.zone.burst = true;
        const pos = new THREE.Vector3(a.zone.x, a.zone.y, a.zone.z);
        radialDamageEnemies(pos, a.zone.radius, a.zone.damage);
        spawnFlash(pos, 0x6611aa, 1.3, 0.28);
        spawnRing(pos, a.zone.radius, 0xaa44ff, 0.35);
      }
      if (a.zone.age >= 1.4) a.zone = null;
    }
  }

  if (abilityState.poisonTrail && abilityState.poisonTrail.level > 0) {
    const a = abilityState.poisonTrail;
    a.timer -= dt;
    if (a.timer <= 0) {
      const origin = player.mesh.position.clone().setY(player.mesh.position.y + 0.4);
      radialDamageEnemies(origin, a.radius, a.damage * (stats.projectileDamageMult || 1));
      spawnRing(origin, a.radius, 0x66cc44, 0.22);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.fireball.level > 0 && target) {
    const a = abilityState.fireball;
    a.timer -= dt;
    if (a.timer <= 0) {
      let fireDmg = a.damage;
      if (stats.fireBurnSynergy && stats.burn) fireDmg *= 1.25;
      for (let i = 0; i < a.shots; i++) {
        const dir = target ? v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize() : player.aimDir.clone();
        if (a.shots > 1) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), ((i / (a.shots - 1)) - 0.5) * 0.24);
        spawnProjectile({ position: player.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(dir, 1.0), direction: dir, speed: (a.speed || stats.projectileSpeed) * (a.speedMult || 1), damage: fireDmg, radius: 0.2, life: 2.0, aoe: a.aoe, color: 0xff9d5f, emissive: 0x4b1d0f, shape: "fireball" });
      }
      // Fireball launch burst
      spawnBurst(player.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xff6633, 4);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.comet.level > 0) {
    const a = abilityState.comet;
    a.timer -= dt;
    if (a.timer <= 0) {
      const tgtPos = target ? target.mesh.position.clone() : player.mesh.position.clone().add(player.aimDir.clone().setY(0).normalize().multiplyScalar(18));
      spawnComet(tgtPos, a.damage, a.radius || 2.8);
      spawnBurst(player.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), 0x4d9dff, 5);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.frostball.level > 0 && target) {
    const a = abilityState.frostball;
    a.timer -= dt;
    if (a.timer <= 0) {
      const dir = v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize();
      spawnProjectile({
        position: player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
        direction: dir,
        speed: 16 * (a.speedMult || 1),
        damage: a.damage,
        radius: 0.2,
        life: 2.4,
        pierce: 0,
        aoe: 0,
        color: 0x9ad8ff,
        emissive: 0x18435f,
        frost: a.freeze,
        shards: a.shards,
        shape: "frostball",
      });
      // Frostball launch ice sparkle
      spawnBurst(player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x9ad8ff, 3);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.meteor.level > 0) {
    const a = abilityState.meteor;
    a.timer -= dt;
    if (a.timer <= 0) {
      const aim = player.aimDir.clone().setY(0);
      if (aim.lengthSq() < 0.001) aim.set(0, 0, 1).applyQuaternion(player.mesh.quaternion);
      aim.normalize();
      const tgtPos = target ? target.mesh.position.clone() : player.mesh.position.clone().add(aim.multiplyScalar(18));
      spawnMeteor(tgtPos, a.damage, a.radius);
      spawnBurst(player.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xff4500, 6);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.nova.level > 0) {
    const a = abilityState.nova;
    a.timer -= dt;
    if (a.timer <= 0) {
      radialDamageEnemies(player.mesh.position, a.radius, a.damage);
      spawnRing(player.mesh.position, a.radius, 0x8be6ff, 0.24);
      spawnBurst(player.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x8be6ff, 8);
      spawnWave(player.mesh.position, a.radius * 1.2, 0x8be6ff);
      a.timer = a.cooldown * cdMult;
    }
  }

  const projSpeedMult = stats.projectileSpeedMult || 1;
  if (abilityState.banana.level > 0 && target) {
    const a = abilityState.banana;
    a.timer -= dt;
    if (a.timer <= 0) {
      const shots = Math.max(1, Math.min(5, a.throwCount || 1));
      for (let i = 0; i < shots; i++) {
        const dir = v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize();
        if (shots > 1) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), ((i / (shots - 1)) - 0.5) * 0.28);
        spawnProjectile({ position: player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), direction: dir.clone(), speed: a.speed * (a.speedMult || 1) * projSpeedMult, damage: a.damage, radius: 0.2, life: 1.8, shape: "banana", color: 0xffdd44, emissive: 0x664400, stun: a.stun });
      }
      spawnBurst(player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xffdd44, Math.min(4, shots + 1));
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.boomerang.level > 0 && target) {
    const a = abilityState.boomerang;
    a.timer -= dt;
    if (a.timer <= 0) {
      const dir = v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize();
      spawnProjectile({ position: player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), direction: dir, speed: a.speed * (a.speedMult || 1) * projSpeedMult, damage: a.damage, radius: 0.2, life: 99, shape: "boomerang", boomerang: true, range: a.range });
      spawnBurst(player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xcc9966, 3);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.shuriken.level > 0 && target) {
    const a = abilityState.shuriken;
    a.timer -= dt;
    if (a.timer <= 0) {
      const count = a.count || 3;
      for (let i = 0; i < count; i++) {
        const dir = v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize();
        if (count > 1) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), ((i / (count - 1)) - 0.5) * 0.35);
        spawnProjectile({ position: player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), direction: dir, speed: a.speed * (a.speedMult || 1) * projSpeedMult, damage: a.damage, radius: 0.15, life: 1.4, shape: "shuriken", color: 0x888899, pierce: 1 });
      }
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.bomb.level > 0 && target) {
    const a = abilityState.bomb;
    a.timer -= dt;
    if (a.timer <= 0) {
      const dir = v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize();
      spawnProjectile({ position: player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), direction: dir, speed: a.speed * (a.speedMult || 1), damage: a.damage, radius: 0.22, life: 5, shape: "bomb", explosionRadius: a.explosionRadius, arcUp: a.arcUp ?? 10, color: 0x332211, emissive: 0x221100 });
      spawnBurst(player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x442200, 4);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.swordThrow.level > 0 && target) {
    const a = abilityState.swordThrow;
    a.timer -= dt;
    if (a.timer <= 0) {
      const dir = v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize();
      spawnProjectile({ position: player.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0)), direction: dir, speed: a.speed * (a.speedMult || 1) * projSpeedMult, damage: a.damage, radius: 0.22, life: 2.0, pierce: 2, color: 0xffd37a, emissive: 0x4a3010 });
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.lineShot && abilityState.lineShot.level > 0 && target) {
    const a = abilityState.lineShot;
    a.timer -= dt;
    if (a.timer <= 0) {
      const dir = v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize();
      let dmg = a.damage * (stats.projectileDamageMult || 1);
      if (stats.fireBurnSynergy && ownedSkills.has("unlock_fireball") && stats.burn) dmg *= 1.25;
      spawnLineShot(dir, dmg, a.length, a.width, a.speed);
      a.timer = a.cooldown * cdMult;
    }
  }

  const hasLaserWeapon = (ownedSkills && ownedSkills.has("laser")) || ((skillLevels && skillLevels["unlock_laser"]) > 0);
  if (hasLaserWeapon && abilityState.laser && abilityState.laser.level > 0) {
    const a = abilityState.laser;
    a.timer -= dt;
    if (a.timer <= 0) {
      const dir = target ? v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize() : player.aimDir.clone();
      let dmg = a.damage * (stats.projectileDamageMult || 1);
      spawnLaser(dir, dmg, a.range, a.width, a.duration);
      a.timer = a.cooldown * cdMult;
    }
  }
  if (abilityState.lightBeam && abilityState.lightBeam.level > 0) {
    const a = abilityState.lightBeam;
    a.timer -= dt;
    if (a.timer <= 0) {
      const dir = target ? v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize() : player.aimDir.clone();
      let dmg = a.damage * (stats.projectileDamageMult || 1) * (1 + (stats.skillAmplify || 0));
      spawnLightBeam(dir, dmg, a.range, a.width, a.duration);
      a.timer = a.cooldown * cdMult;
    }
  }
  if (abilityState.coneBlast && abilityState.coneBlast.level > 0) {
    const a = abilityState.coneBlast;
    a.timer -= dt;
    if (a.timer <= 0) {
      const origin = player.mesh.position.clone().setY(player.mesh.position.y + 0.6);
      const aimDir = target ? v0.copy(target.mesh.position).sub(player.mesh.position).setY(0).normalize() : player.aimDir.clone();
      if (aimDir.lengthSq() < 0.01) aimDir.set(0, 0, 1);
      aimDir.normalize();
      const dmg = a.damage * (1 + (stats.skillAmplify || 0));
      spawnConeBlast(origin, aimDir, dmg, a.range, a.halfAngle);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.dismantle && abilityState.dismantle.level > 0) {
    const a = abilityState.dismantle;
    a.timer -= dt;
    if (a.timer <= 0) {
      const origin = player.mesh.position.clone().setY(player.mesh.position.y + 0.5);
      const aimDir = player.aimDir.clone().setY(0);
      if (aimDir.lengthSq() < 0.01) aimDir.set(0, 0, 1);
      aimDir.normalize();
      let dmg = a.damage * (stats.projectileDamageMult || 1);
      spawnDismantle(origin, aimDir, dmg, a.radius, a.arcAngle);
      a.timer = a.cooldown * cdMult;
    }
  }

  if (abilityState.swords.level > 0) {
    ensureSwordMeshes(Math.max(1, abilityState.swords.count));
    const o = player.mesh.position;
    for (let i = 0; i < swordMeshes.length; i++) {
      const a = state.time * abilityState.swords.spin + (i / swordMeshes.length) * Math.PI * 2;
      const x = o.x + Math.sin(a) * abilityState.swords.radius;
      const z = o.z + Math.cos(a) * abilityState.swords.radius;
      swordMeshes[i].position.set(x, sampleTerrainHeight(x, z) + 1.0, z);
      swordMeshes[i].rotation.y = -a + Math.PI * 0.5;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.swordHitCd > 0) continue;
    for (let s = 0; s < swordMeshes.length; s++) {
        const sx = swordMeshes[s].position.x - e.mesh.position.x;
        const sz = swordMeshes[s].position.z - e.mesh.position.z;
        if (sx * sx + sz * sz <= (e.radius + 2.2) * (e.radius + 2.2)) {
          const knock = v0.copy(e.mesh.position).sub(player.mesh.position).setY(0);
          if (knock.lengthSq() > 0.0001) knock.normalize();
          e.push.add(knock.clone().multiplyScalar(7));
          applyDamageEnemy(e, abilityState.swords.damage, knock);
          e.swordHitCd = 0.16;
          if (typeof triggerCameraShake === "function") triggerCameraShake(0.38);
          if (typeof triggerHitFreeze === "function") triggerHitFreeze(0.032);
          spawnBurst(e.mesh.position, 0xffcc88, 2);
          spawnRing(e.mesh.position, 1.4, 0xffaa66, 0.15);
          break;
        }
      }
    }
  } else {
    ensureSwordMeshes(0);
  }

  if (abilityState.banana.level > 0 && abilityState.banana.count > 0) {
    const a = abilityState.banana;
    const bananaCount = Math.min(6, a.count || 2);
    ensureBananaMeshes(bananaCount);
    const o = player.mesh.position;
    const spin = state.time * 2.8 + 0.5;
    for (let i = 0; i < bananaMeshes.length; i++) {
      const angle = spin + (i / bananaMeshes.length) * Math.PI * 2;
      const x = o.x + Math.sin(angle) * 2.4;
      const z = o.z + Math.cos(angle) * 2.4;
      bananaMeshes[i].position.set(x, sampleTerrainHeight(x, z) + 1.0, z);
      bananaMeshes[i].rotation.y = -angle + Math.PI * 0.5;
      bananaMeshes[i].rotation.z = Math.sin(state.time * 4 + i) * 0.2;
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.bananaHitCd > 0) continue;
      for (let b = 0; b < bananaMeshes.length; b++) {
        const bx = bananaMeshes[b].position.x - e.mesh.position.x;
        const bz = bananaMeshes[b].position.z - e.mesh.position.z;
        if (bx * bx + bz * bz <= (e.radius + 0.5) * (e.radius + 0.5)) {
          const knock = v0.copy(e.mesh.position).sub(player.mesh.position).setY(0);
          if (knock.lengthSq() > 0.0001) knock.normalize();
          applyDamageEnemy(e, a.damage * 0.4, knock);
          e.bananaHitCd = 0.2;
          if (a.stun) e.stunLeft = Math.max(e.stunLeft || 0, a.stun * 0.5);
          break;
        }
      }
    }
  } else {
    ensureBananaMeshes(0);
  }

  if (abilityState.saturnRings && abilityState.saturnRings.level > 0) {
    const sr = abilityState.saturnRings;
    const R = sr.radius || 3.2;
    const dmg = (sr.damage || 18) * (stats.projectileDamageMult || 1) * 0.5;
    ensureSaturnRings(sr.vertical !== false, sr.horizontal !== false);
    const o = player.mesh.position;
    const spin = state.time * 1.6;
    let idx = 0;
    if (sr.horizontal !== false && saturnRingMeshes[idx]) {
      saturnRingMeshes[idx].position.set(o.x, o.y + 0.9, o.z);
      saturnRingMeshes[idx].rotation.z = spin;
      saturnRingMeshes[idx].scale.setScalar(R);
      idx++;
    }
    if (sr.vertical !== false && saturnRingMeshes[idx]) {
      saturnRingMeshes[idx].position.set(o.x, o.y + 0.9, o.z);
      saturnRingMeshes[idx].rotation.z = spin * 1.3;
      saturnRingMeshes[idx].scale.setScalar(R);
      idx++;
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.saturnHitCd > 0) continue;
      const ex = e.mesh.position.x - o.x, ey = e.mesh.position.y - (o.y + 0.9), ez = e.mesh.position.z - o.z;
      const distXZ = Math.hypot(ex, ez);
      const distYZ = Math.hypot(ey, ez);
      const hitR = 0.9;
      if ((sr.horizontal !== false && Math.abs(distXZ - R) < hitR && Math.abs(ey) < 1.2) || (sr.vertical !== false && Math.abs(distYZ - R) < hitR && Math.abs(ex) < 1.2)) {
        const knock = v0.copy(e.mesh.position).sub(o).setY(0);
        if (knock.lengthSq() > 0.0001) knock.normalize();
        applyDamageEnemy(e, dmg, knock);
        e.saturnHitCd = 0.25;
      }
    }
  } else if (saturnRingMeshes.length > 0) {
    saturnRingMeshes.forEach((m) => scene.remove(m));
    saturnRingMeshes.length = 0;
  }
}
function getOrbVisual(tier) {
  const key = orbTier[tier] ? tier : "normal";
  if (orbVisualCache[key]) return orbVisualCache[key];
  const cfg = orbTier[key];
  // Star-shaped XP orb: diamond core + 4 spikes
  const geo = new THREE.OctahedronGeometry(cfg.size, 0);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.emissive, emissiveIntensity: 0.65, roughness: 0.15, metalness: 0.15, transparent: true, opacity: 0.9 });
  orbVisualCache[key] = { geo, mat };
  return orbVisualCache[key];
}

function makeXpOrbMesh(tier) {
  return withSharedGeoMat(function () { return makeXpOrbMeshInner(tier); });
}
function makeXpOrbMeshInner(tier) {
  const cfg = orbTier[tier] || orbTier.normal;
  const g = new THREE.Group();
  const coreMat = new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.emissive, emissiveIntensity: 0.7, roughness: 0.1, metalness: 0.15 });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(cfg.size, 0), coreMat);
  g.add(core);
  // Inner glow
  const glowMat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.25 });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(cfg.size * 1.8, 6, 6), glowMat);
  g.add(glow);
  return g;
}

function makeCoinMesh() {
  return withSharedGeoMat(makeCoinMeshInner);
}
function makeCoinMeshInner() {
  const g = new THREE.Group();
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x886600, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.6 });
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 16), coinMat);
  disk.rotation.x = Math.PI / 2;
  g.add(disk);
  // $ symbol - simple cross
  const symMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.02), symMat);
  vBar.position.z = 0.04;
  const sTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.02), symMat);
  sTop.position.set(0, 0.04, 0.04);
  const sBot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.02), symMat);
  sBot.position.set(0, -0.04, 0.04);
  g.add(vBar, sTop, sBot);
  return g;
}

function executeUltimate() {
  if (!stateUltimate || stateUltimate.timer > 0) return;
  const def = ULT_DEFS[stateUltimate.id];
  if (!def) return;
  const pos = player.mesh.position.clone().setY(player.mesh.position.y + 0.5);
  const dmgMult = stats.projectileDamageMult || 1;

  if (stateUltimate.id === "mega_explosion") {
    radialDamageEnemies(pos, def.radius, def.damage * dmgMult);
    spawnRing(pos, def.radius, def.color, 0.6);
    spawnWave(pos, def.radius * 1.2, def.color);
    spawnBurst(pos, def.color, 16);
    if (typeof triggerBigShake === "function") triggerBigShake();
    playExplosionBoom();
    playSfx(180, 0.3, 0.55);
    spawnDamageText(pos, "MEGA PATLAMA", true, "ULT");
  } else if (stateUltimate.id === "ice_apocalypse") {
    radialDamageEnemies(pos, def.radius, def.damage * dmgMult, "ice");
    enemies.forEach((e) => { if (e.mesh.position.distanceTo(pos) < def.radius) e.freezeLeft = Math.max(e.freezeLeft || 0, def.freeze || 3); });
    spawnRing(pos, def.radius, def.color, 0.5);
    spawnBurst(pos, def.color, 12);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      spawnTrailParticle(pos.clone().add(new THREE.Vector3(Math.cos(a) * def.radius * 0.7, 0.5, Math.sin(a) * def.radius * 0.7)), def.color, "ice");
    }
    playSfx(320, 0.25, 0.55);
    spawnDamageText(pos, "BUZ APOKALİPSİ", true, "ULT");
  } else if (stateUltimate.id === "lightning_storm") {
    const n = def.strikes || 8;
    const strikeRadius = def.strikeRadius || 5;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const r = 5 + Math.random() * 8;
      const strikePos = pos.clone().add(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
      radialDamageEnemies(strikePos, strikeRadius, def.damage * dmgMult, "lightning");
      spawnFlash(strikePos, 0x88ccff, 1.2, 0.2);
      spawnRing(strikePos, strikeRadius, 0x4488ff, 0.25);
    }
    spawnRing(pos, 10, 0x4488ff, 0.4);
    playSfx(600, 0.15, 0.55);
    spawnDamageText(pos, "YILDIRIM", true, "ULT");
  } else if (stateUltimate.id === "inferno") {
    radialDamageEnemies(pos, def.radius, def.damage * dmgMult, "fire");
    enemies.forEach((e) => { if (e.mesh.position.distanceTo(pos) < def.radius) e.burnLeft = Math.max(e.burnLeft || 0, def.burn || 4); });
    spawnRing(pos, def.radius, def.color, 0.55);
    spawnWave(pos, def.radius * 1.1, def.color);
    spawnBurst(pos, def.color, 14);
    playSfx(200, 0.28, 0.55);
    spawnDamageText(pos, "INFERNO", true, "ULT");
  } else if (stateUltimate.id === "void_blast") {
    radialDamageEnemies(pos, def.radius, def.damage * dmgMult);
    spawnRing(pos, def.radius, def.color, 0.5);
    spawnBurst(pos, def.color, 12);
    const inner = new THREE.Mesh(new THREE.RingGeometry(def.radius * 0.3, def.radius, 40), new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    inner.rotation.x = -Math.PI / 2;
    inner.position.copy(pos);
    scene.add(inner);
    effects.push({ type: "ring", mesh: inner, life: 0.5, total: 0.5 });
    playExplosionBoom();
    playSfx(140, 0.3, 0.55);
    spawnDamageText(pos, "VOID", true, "ULT");
  }
  stateUltimate.timer = stateUltimate.cooldown;
}

function updateSpecials(dt, target) {
  if (stateUltimate) {
    stateUltimate.timer = Math.max(0, (stateUltimate.timer || 0) - dt);
    if (keys.y && stateUltimate.timer <= 0) executeUltimate();
  }
  specialState.frostNova.timer -= dt;
  specialState.dash.timer -= dt;
  specialState.meteorUlt.timer -= dt;
  specialState.explosion.timer -= dt;

  const cdMult = Math.max(0, 1 - (stats.globalCdReduction || 0));
  if (specialUnlocks.frostNova && specialState.frostNova.timer <= 0) {
    specialState.frostNova.timer = specialState.frostNova.cd * cdMult;
    spawnRing(player.mesh.position, specialState.frostNova.radius, 0x9ad8ff, 0.3);
    radialDamageEnemies(player.mesh.position, specialState.frostNova.radius, specialState.frostNova.damage, "ice");
    enemies.forEach((e) => { if (e.mesh.position.distanceTo(player.mesh.position) < specialState.frostNova.radius) e.freezeLeft = Math.max(e.freezeLeft, specialState.frostNova.freeze); });
    // Ice crystal burst around player
    for (let ic = 0; ic < 8; ic++) {
      const ang = (ic / 8) * Math.PI * 2;
      const r = specialState.frostNova.radius * 0.6;
      spawnTrailParticle(player.mesh.position.clone().add(new THREE.Vector3(Math.cos(ang) * r, 0.8, Math.sin(ang) * r)), 0x99ddff, "ice");
    }
    playSfx(480, 0.12, 0.55);
  }

  if (specialUnlocks.dash && keys.r && specialState.dash.timer <= 0) {
    specialState.dash.timer = specialState.dash.cd * cdMult;
    state.dashUntil = state.time + specialState.dash.duration;
    for (let ai = 0; ai < 2; ai++) {
      if (effects.length >= MAX_EFFECTS) break;
      const ghost = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), new THREE.MeshBasicMaterial({ color: 0x66bbff, transparent: true, opacity: 0.4 }));
      ghost.position.copy(player.mesh.position).add(player.aimDir.clone().multiplyScalar(-ai * 0.8));
      ghost.position.y += 1;
      scene.add(ghost);
      effects.push({ type: "particle", mesh: ghost, life: 0.25 + ai * 0.06, total: 0.25 + ai * 0.06, vel: new THREE.Vector3(0, 0.2, 0) });
    }
    spawnRing(player.mesh.position, 1.5, 0x66bbff, 0.18);
    player.vel.add(player.aimDir.clone().multiplyScalar(specialState.dash.speed));
    stats.shield = (stats.shield || 0) + 20;
    playSfx(360, 0.08, 0.55);
  }

  if (specialUnlocks.meteorUlt && keys.t && specialState.meteorUlt.timer <= 0) {
    specialState.meteorUlt.timer = specialState.meteorUlt.cd * cdMult;
    playSfx(520, 0.14, 0.55);
    for (let i = 0; i < specialState.meteorUlt.count; i++) {
      const tgt = target || getNearestEnemy(50);
      const pos = tgt ? tgt.mesh.position.clone() : player.mesh.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8));
      spawnTelegraph(pos, specialState.meteorUlt.radius, specialState.meteorUlt.damage, 0.7, "player", 0xff4f4f);
      spawnMeteor(pos, specialState.meteorUlt.damage, specialState.meteorUlt.radius);
    }
  }

  if (specialUnlocks.explosion && keys.x && specialState.explosion.timer <= 0) {
    specialState.explosion.timer = specialState.explosion.cd * cdMult;
    const pos = player.mesh.position.clone().setY(player.mesh.position.y + 0.5);
    const dmgMult = stats.projectileDamageMult || 1;
    const dmg = specialState.explosion.damage * dmgMult;
    const rad = specialState.explosion.radius;
    radialDamageEnemies(pos, rad, dmg);
    spawnRing(pos, rad, 0xff6622, 0.45);
    spawnBurst(pos, 0xff6622, 10);
    spawnWave(pos, rad * 1.1, 0xff6622);
    if (typeof triggerCameraShake === "function") triggerCameraShake(0.35);
    playExplosionBoom();
  }
}

const XP_ORB_SPAWN_REDUCTION = 0.62;
function dropXpOrbs(position, xpAmount, tier) {
  const cfg = orbTier[tier] || orbTier.normal;
  const total = Math.max(1, xpAmount);
  const rawCount = Math.ceil(total / cfg.perOrb);
  const count = Math.max(1, Math.min(cfg.maxCount, Math.max(1, Math.floor(rawCount * XP_ORB_SPAWN_REDUCTION))));
  const per = total / count;

  for (let i = 0; i < count; i++) {
    if (xpOrbs.length >= MAX_ORBS) { gainXp(per); continue; }
    const mesh = makeXpOrbMesh(tier);
    const a = Math.random() * Math.PI * 2;
    const spread = 0.75 + Math.random() * 1.35;
    const x = position.x + Math.cos(a) * spread;
    const z = position.z + Math.sin(a) * spread;
    const y = sampleTerrainHeight(x, z) + 0.30;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    xpOrbs.push({ mesh, xp: per, tier: tier || "normal", phase: Math.random() * Math.PI * 2, vel: new THREE.Vector3((Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2), groundY: y, groundTick: 0.0, labelLife: 5.0 });
  }
}

const XP_ORB_MERGE_RADIUS = 2.8;
const XP_ORB_MERGE_INTERVAL = 0.35;
function mergeNearbyXpOrbs() {
  if (xpOrbs.length <= 1) return;
  const merged = new Set();
  const toRemove = [];
  for (let i = 0; i < xpOrbs.length; i++) {
    if (merged.has(i)) continue;
    const orbA = xpOrbs[i];
    const cluster = [i];
    for (let j = i + 1; j < xpOrbs.length; j++) {
      if (merged.has(j)) continue;
      const orbB = xpOrbs[j];
      if (orbA.tier !== orbB.tier) continue;
      const dx = orbA.mesh.position.x - orbB.mesh.position.x;
      const dz = orbA.mesh.position.z - orbB.mesh.position.z;
      if (dx * dx + dz * dz <= XP_ORB_MERGE_RADIUS * XP_ORB_MERGE_RADIUS) {
        cluster.push(j);
        merged.add(j);
      }
    }
    if (cluster.length <= 1) continue;
    merged.add(i);
    let totalXp = 0;
    let cx = 0, cy = 0, cz = 0;
    for (const idx of cluster) {
      const o = xpOrbs[idx];
      totalXp += o.xp;
      cx += o.mesh.position.x;
      cy += o.mesh.position.y;
      cz += o.mesh.position.z;
    }
    const keep = cluster[0];
    const k = xpOrbs[keep];
    k.xp = totalXp;
    k.mesh.position.set(cx / cluster.length, cy / cluster.length, cz / cluster.length);
    k.groundY = sampleTerrainHeight(k.mesh.position.x, k.mesh.position.z) + 0.30;
    for (let c = 1; c < cluster.length; c++) {
      const idx = cluster[c];
      const o = xpOrbs[idx];
      scene.remove(o.mesh);
      if (o.nameLabel && scene.children.includes(o.nameLabel)) scene.remove(o.nameLabel);
      toRemove.push(idx);
    }
  }
  toRemove.sort((a, b) => b - a);
  for (const idx of toRemove) xpOrbs.splice(idx, 1);
}

// Magnet pickup drops (yere düşer, alınca magnet burst)
const MAGNET_DROP_RATE = { normal: 0.012, magic: 0.018, rare: 0.026, unique: 0.038, boss: 0.055 };
const MAGNET_PICKUP_DURATION = 9;
const SLOWMO_DROP_RATE = { normal: 0.004, magic: 0.007, rare: 0.011, unique: 0.018, boss: 0.028 };
const SLOWMO_PICKUP_DURATION = 15;
let slowmoPickups = [];
function makeSlowmoPickupMesh() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaff, emissive: 0x4466cc, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.3 });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8), mat);
  glass.position.y = 0.28;
  g.add(glass);
  return g;
}
function spawnSlowmoPickup(pos) {
  if (slowmoPickups.length >= 15) return;
  const mesh = makeSlowmoPickupMesh();
  mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.4, (Math.random() - 0.5) * 1.2));
  scene.add(mesh);
  slowmoPickups.push({ mesh, phase: Math.random() * Math.PI * 2 });
}
function updateSlowmoPickups(dt) {
  const t = state.time || 0;
  for (let i = slowmoPickups.length - 1; i >= 0; i--) {
    const p = slowmoPickups[i];
    const baseY = sampleTerrainHeight(p.mesh.position.x, p.mesh.position.z) + 0.4;
    p.mesh.position.y = baseY + Math.sin(t * 2.5 + p.phase) * 0.1;
    p.mesh.rotation.y += dt * 1.5;
    const d = player.mesh.position.distanceTo(p.mesh.position);
    if (d < 2.2) {
      state.slowmoUntil = state.time + SLOWMO_PICKUP_DURATION;
      if (typeof showGameNotification === "function") showGameNotification("Agir cekim! Yaratiklar 15 sn yavas.");
      if (typeof playSfx === "function") playSfx(320, 0.1);
      scene.remove(p.mesh);
      slowmoPickups.splice(i, 1);
    }
  }
}
let magnetPickups = [];
function makeMagnetPickupMesh() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x2244aa, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.5 });
  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8), mat);
  left.position.set(-0.18, 0.2, 0);
  left.rotation.z = Math.PI / 2;
  const right = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8), mat);
  right.position.set(0.18, 0.2, 0);
  right.rotation.z = Math.PI / 2;
  g.add(left, right);
  return g;
}
function spawnMagnetPickup(pos) {
  if (magnetPickups.length >= 25) return;
  const mesh = makeMagnetPickupMesh();
  mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.4, (Math.random() - 0.5) * 1.2));
  scene.add(mesh);
  magnetPickups.push({ mesh, phase: Math.random() * Math.PI * 2 });
}
function updateMagnetPickups(dt) {
  const t = state.time || 0;
  for (let i = magnetPickups.length - 1; i >= 0; i--) {
    const p = magnetPickups[i];
    const baseY = sampleTerrainHeight(p.mesh.position.x, p.mesh.position.z) + 0.4;
    p.mesh.position.y = baseY + Math.sin(t * 3 + p.phase) * 0.12;
    p.mesh.rotation.y += dt * 2;
    const d = player.mesh.position.distanceTo(p.mesh.position);
    if (d < 2.2) {
      state.magnetBurstUntil = state.time + MAGNET_PICKUP_DURATION;
      if (typeof showGameNotification === "function") showGameNotification("Magnet! XP/Coin cekilir.");
      if (typeof playSfx === "function") playSfx(660, 0.12);
      scene.remove(p.mesh);
      magnetPickups.splice(i, 1);
    }
  }
}

// Coin pickup drops
let coinPickups = [];
function spawnCoinPickup(pos, amount) {
  if (coinPickups.length >= 100) return;
  const mesh = makeCoinMesh();
  mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.5, (Math.random() - 0.5) * 0.8));
  scene.add(mesh);
  coinPickups.push({ mesh, amount, phase: Math.random() * Math.PI * 2 });
}

function updateCoinPickups(dt) {
  const t = state.time || 0;
  const magnetBurst = state.magnetBurstUntil && state.time < state.magnetBurstUntil;
  const pullRange = magnetBurst ? 40 : Math.max(5, stats.magnetRange);
  const pullSpeed = magnetBurst ? 12 : Math.max(2, (stats.magnetStrength || 0) * 0.7 + 2);
  for (let i = coinPickups.length - 1; i >= 0; i--) {
    const c = coinPickups[i];
    const baseY = sampleTerrainHeight(c.mesh.position.x, c.mesh.position.z) + 0.5;
    c.mesh.position.y = baseY + Math.sin(t * 4 + c.phase) * 0.15;
    c.mesh.rotation.y += dt * 4;
    const d = player.mesh.position.distanceTo(c.mesh.position);
    if (d < pullRange) {
      const pull = v0.copy(player.mesh.position).sub(c.mesh.position).setY(0).normalize().multiplyScalar(dt * pullSpeed);
      c.mesh.position.add(pull);
    }
    if (d < 2.5) {
      state.coins += c.amount;
      if (state.coins >= 999 && !state.coin999EasterEgg) {
        state.coin999EasterEgg = true;
        if (typeof showGameNotification === "function") showGameNotification("999 COIN! ZENGIN!", { rainbow: true });
      }
      addFloatingGold(c.amount);
      spawnDamageText(c.mesh.position, `+${c.amount} Coin`, false, "coin");
      playSfx(880, 0.06, 0.55);
      scene.remove(c.mesh);
      coinPickups.splice(i, 1);
    }
  }
}

function updateXpOrbs(dt) {
  state.xpOrbMergeTimer = (state.xpOrbMergeTimer || 0) - dt;
  if (state.xpOrbMergeTimer <= 0) {
    state.xpOrbMergeTimer = XP_ORB_MERGE_INTERVAL;
    mergeNearbyXpOrbs();
  }

  const pickupR2 = stats.pickupRange * stats.pickupRange;
  const magnetBurst = state.magnetBurstUntil && state.time < state.magnetBurstUntil;
  const magnetR2 = magnetBurst ? 40 * 40 : stats.magnetRange * stats.magnetRange;
  const magnetStr = magnetBurst ? 42 : (stats.magnetStrength || 0) * 0.55;
  const magnetRangeVal = magnetBurst ? 40 : stats.magnetRange;

  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const orb = xpOrbs[i];
    orb.labelLife = (orb.labelLife ?? 5) - dt;
    orb.groundTick -= dt;
    if (orb.groundTick <= 0) {
      orb.groundY = sampleTerrainHeight(orb.mesh.position.x, orb.mesh.position.z) + 0.30;
      orb.groundTick = 0.28;
    }

    const pullTarget = v0.copy(player.mesh.position).add(new THREE.Vector3(0, 0.95, 0));
    const toPlayer = v1.copy(pullTarget).sub(orb.mesh.position);
    const d2 = toPlayer.lengthSq();

    if (d2 <= pickupR2) {
      gainXp(orb.xp);
      scene.remove(orb.mesh);
      if (orb.nameLabel && scene.children.includes(orb.nameLabel)) scene.remove(orb.nameLabel);
      xpOrbs.splice(i, 1);
      continue;
    }

    if (d2 <= magnetR2 && magnetStr > 0) {
      const d = Math.max(0.001, Math.sqrt(d2));
      const pull = magnetStr * (1.1 - Math.min(1, d / Math.max(1, magnetRangeVal)));
      orb.vel.addScaledVector(toPlayer, (pull * dt) / d);
    }

    orb.vel.multiplyScalar(Math.exp(-4.2 * dt));
    orb.mesh.position.x += orb.vel.x * dt;
    orb.mesh.position.z += orb.vel.z * dt;
    orb.mesh.position.y = orb.groundY + Math.sin(state.time * 7 + orb.phase) * 0.10;
    orb.mesh.rotation.y += dt * 2.2;
  }

  const CLOSE_R2 = 36;
  const playerPos = player.mesh.position;
  xpOrbs.forEach((o) => { if (o.nameLabel) o.nameLabel.visible = false; });
  const sorted = xpOrbs.slice().sort((a, b) => a.mesh.position.distanceToSquared(playerPos) - b.mesh.position.distanceToSquared(playerPos));
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    const orb = sorted[i];
    const d2 = orb.mesh.position.distanceToSquared(playerPos);
    if (d2 > CLOSE_R2 || (orb.labelLife ?? 0) <= 0) continue;
    if (!orb.nameLabel) {
      orb.nameLabel = makeNameLabel("XP " + Math.round(orb.xp), orb.tier || "normal");
      orb.nameLabel.position.y = 0.5;
      scene.add(orb.nameLabel);
    }
    orb.nameLabel.position.copy(orb.mesh.position).add(new THREE.Vector3(0, 0.5, 0));
    orb.nameLabel.visible = true;
  }
}

// Floating XP/Coin tracker near player
let floatingXpAccum = 0;
let floatingCoinAccum = 0;
let floatingXpTimer = 0;
let floatingCoinTimer = 0;
let floatingOffsetX = 0;
let floatingOffsetY = 0;

function clearFloatingCounters() {
  floatingXpAccum = 0;
  floatingCoinAccum = 0;
  floatingXpTimer = 0;
  floatingCoinTimer = 0;
  const el = document.getElementById("floatingCounters");
  if (el) {
    el.style.display = "none";
    el.innerHTML = "";
  }
}

function gainXp(amount) {
  const caveMult = state.caveXpMult || 1;
  const gained = amount * (stats.xpGainMult || 1) * caveMult;
  addFloatingXp(gained);
  state.xp += gained;
  let leveled = false;
  while (state.xp >= state.xpNext && state.level < MAX_LEVEL) {
    leveled = true;
    state.xp -= state.xpNext;
    state.level = Math.min(state.level + 1, MAX_LEVEL);
    state.pendingLevels += 1;
    state.xpNext = getXpNextForLevel(state.level);
    const L = state.level;
    if (L >= 10 && L % 10 === 0) {
      state.difficultyPoints = (state.difficultyPoints || 0) + 1;
      if (typeof showGameNotification === "function") showGameNotification("Oyun Zorlugu puani +1 (P ile harcayin)", { rainbow: false });
    }
    if (L === 11 && typeof showGameNotification === "function") showGameNotification("MASTER LEVEL 11!", { rainbow: true });
    else if (L === 22 && typeof showGameNotification === "function") showGameNotification("DUO MASTER 22!", { rainbow: true });
    else if (L === 31 && typeof showGameNotification === "function") showGameNotification("LEGENDARY LEVEL 31!", { rainbow: true });
    else if (L === 42 && typeof showGameNotification === "function") showGameNotification("42 - HAYATIN ANLAMI!", { rainbow: true });
  }
  if (leveled && !leveling && !gameOver) {
    if (state.exileMode) {
      state.skillPoints = (state.skillPoints || 0) + 1;
      if (typeof showGameNotification === "function") showGameNotification("Skill Puanı +1 (P ile agac)");
    } else openLevelup();
  }
  if (leveled) { checkAchievements(); playSfxLevel(); }
}

function canPickSkill(skill) {
  const lv = skillLevels[skill.id] || 0;
  if (lv >= (skill.max || 1)) return false;
  if (skill.requires && !ownedSkills.has(skill.requires) && !(skillLevels[skill.requires] > 0)) return false;
  return true;
}

const ABILITY_UNLOCK_IDS = new Set(["unlock_fireball", "unlock_comet", "unlock_swords", "unlock_meteor", "unlock_nova", "unlock_frostball", "unlock_frost_nova", "unlock_dash", "unlock_meteor_ult", "unlock_explosion", "unlock_spark", "unlock_smite", "unlock_kinetic_blast", "unlock_arrow_shock", "unlock_arrow_burn", "unlock_arrow_freeze", "comp_phoenix", "comp_drone", "comp_golem", "comp_skeleton_minion", "comp_wolf_minion", "comp_goblin_minion", "comp_healer_minion", "comp_archer_minion", "comp_mage_minion", "minyon_sayisi", "unlock_banana", "unlock_sword_throw", "unlock_boomerang", "unlock_shuriken", "unlock_bomb", "unlock_line_shot", "unlock_laser", "unlock_light_beam", "unlock_cone_blast", "unlock_reload_weapon", "unlock_dismantle", "unlock_gorilla_aura", "unlock_herald_thunder", "unlock_herald_ice", "unlock_herald_ash", "unlock_flicker_strike", "unlock_saturn_rings", "unlock_ult_mega_explosion", "unlock_ult_ice_apocalypse", "unlock_ult_lightning_storm", "unlock_ult_inferno", "unlock_ult_void_blast", "unlock_chain_bolt", "unlock_black_hole", "unlock_poison_trail"]);
const GENERIC_STRENGTHENER_IDS = new Set(["dmg", "firerate", "speed", "hp", "proj_speed", "crit", "pierce", "multishot", "armor", "xp_gain", "sharp_edges", "regen", "impact", "pickup", "sans", "magnet_aura", "xp_magnet", "lucky", "heal", "global_cd"]);
const CORE_SKILL_IDS = new Set([
  "dmg", "firerate", "speed", "hp", "heal", "pickup", "magnet", "armor", "crit", "crit_dmg", "cdr", "xp_boost", "gold_finder", "thick_skin", "quick_hands", "berserker_rage", "lucky_strike", "vampiric_touch", "elemental_affinity", "unlock_fireball", "fireball_dmg", "fireball_cd", "fireball_proj_speed", "multishot", "pierce", "regen", "sans", "xp_gain", "magnet_force", "lucky_coin", "coin_hunter",
  "unlock_meteor", "meteor_dmg", "meteor_radius", "meteor_cd", "unlock_meteor_ult",
  "ricochet", "static_shiv", "unlock_chain", "chain_plus", "chain_lightning",
  "unlock_comet", "comet_dmg", "comet_cd", "comet_proj_speed", "unlock_nova", "nova_dmg", "nova_radius", "nova_cd",
  "unlock_swords", "sword_count", "sword_dmg", "unlock_frostball", "frostball_dmg", "frostball_freeze", "frostball_shards",
  "unlock_banana", "banana_dmg", "banana_orbit", "banana_proj_speed", "unlock_sword_throw", "sword_throw_dmg", "unlock_boomerang", "boomerang_dmg", "unlock_shuriken", "shuriken_dmg", "unlock_bomb", "bomb_dmg", "bomb_radius",
  "unlock_line_shot", "unlock_laser", "unlock_dismantle", "dismantle_dmg", "dismantle_radius", "dismantle_cd", "dismantle_proj_speed", "unlock_dash", "unlock_frost_nova", "unlock_turret", "unlock_explosion", "turret_slot_2", "turret_slot_3", "turret_master",
  "unlock_herald_thunder", "herald_thunder_dmg", "unlock_herald_ice", "herald_ice_dmg", "unlock_herald_ash", "herald_ash_dmg",
  "unlock_gorilla_aura", "gorilla_radius", "gorilla_dmg", "unlock_flicker_strike", "flicker_range", "flicker_dmg", "unlock_saturn_rings", "saturn_radius", "saturn_dmg",
  "unlock_spark", "spark_count", "spark_dmg", "spark_speed", "spark_cd", "unlock_smite", "smite_dmg", "smite_radius", "unlock_kinetic_blast", "kinetic_blast_targets", "kinetic_blast_dmg",
  "arrow_dmg", "arrow_speed", "unlock_arrow_shock", "unlock_arrow_burn", "unlock_arrow_freeze", "arrow_multishot",
  "comp_phoenix", "comp_drone", "comp_golem", "comp_skeleton_minion", "comp_wolf_minion", "comp_goblin_minion", "comp_healer_minion", "comp_archer_minion", "comp_mage_minion", "minyon_sayisi",
  "unlock_ult_mega_explosion", "unlock_ult_ice_apocalypse", "unlock_ult_lightning_storm", "unlock_ult_inferno", "unlock_ult_void_blast",
  "lifesteal", "execute", "berserker", "thorns", "bleed", "burn", "freeze", "shock", "splash", "pack_frost", "pack_fire", "pack_shock",
  "unlock_chain_bolt", "chain_bolt_dmg", "unlock_black_hole", "black_hole_dmg", "unlock_poison_trail", "poison_trail_dmg", "greed", "executioner",
  "explosive_shot", "frost_aura", "bloodlust", "fire_trail", "dodge", "second_wind", "shadow_clone", "rage_mode", "glass_cannon", "tank_mode",
  "unlock_shield", "shield_regen", "impact", "unlock_sprint", "unlock_toxic_trail", "toxic_trail_radius", "toxic_trail_poison",
  "runaan", "rapid_fire",
  "exp_balloon_gun", "exp_vacuum", "exp_glue", "exp_spring_glove",
]);
const SKILL_UNLOCKS = [
  { id: "unlock_comet", condition: (s) => s.kills >= 32 },
  { id: "unlock_swords", condition: (s) => s.kills >= 52 },
  { id: "unlock_herald_thunder", condition: (s) => s.kills >= 58 },
  { id: "unlock_nova", condition: (s) => s.kills >= 68 },
  { id: "unlock_herald_ice", condition: (s) => s.kills >= 90 },
  { id: "unlock_frostball", condition: (s) => s.kills >= 85 },
  { id: "unlock_banana", condition: (s) => s.kills >= 105 },
  { id: "unlock_herald_ash", condition: (s) => s.kills >= 118 },
  { id: "unlock_line_shot", condition: (s) => (s.level || 0) >= 6 || (s.kills || 0) >= 48 },
  { id: "unlock_laser", condition: (s) => (s.level || 0) >= 5 || (s.kills || 0) >= 38 },
  { id: "unlock_dismantle", condition: (s) => s.kills >= 112 },
  { id: "unlock_sword_throw", condition: (s) => (s.chestsOpened || 0) >= 1 },
  { id: "unlock_boomerang", condition: (s) => (s.chestsOpened || 0) >= 2 },
  { id: "unlock_shuriken", condition: (s) => (s.chestsOpened || 0) >= 3 },
  { id: "unlock_meteor", condition: (s) => s.bossesDefeated >= 1 || (s.level || 0) >= 3 || (s.kills || 0) >= 18 },
  { id: "unlock_dash", condition: (s) => (s.level || 0) >= 10 },
  { id: "unlock_frost_nova", condition: (s) => (s.level || 0) >= 12 },
  { id: "ricochet", condition: (s) => (s.kills || 0) >= 22 },
  { id: "static_shiv", condition: (s) => (s.kills || 0) >= 42 },
  { id: "unlock_chain", condition: (s) => (s.kills || 0) >= 35 },
  { id: "chain_lightning", condition: (s) => (s.kills || 0) >= 85 },
  { id: "unlock_meteor_ult", condition: (s) => (s.bossesDefeated || 0) >= 1 || (s.level || 0) >= 10 },
  { id: "lifesteal", condition: (s) => (s.kills || 0) >= 180 },
  { id: "execute", condition: (s) => (s.kills || 0) >= 250 },
  { id: "unlock_chain_bolt", condition: (s) => (s.kills || 0) >= 40 },
  { id: "unlock_black_hole", condition: (s) => (s.kills || 0) >= 70 || (s.level || 0) >= 8 },
  { id: "unlock_poison_trail", condition: (s) => (s.kills || 0) >= 28 },
  { id: "greed", condition: (s) => (s.kills || 0) >= 20 },
  { id: "executioner", condition: (s) => (s.kills || 0) >= 120 },
];
function tryUnlockSkills() {
  if (!state.unlockedSkillIds) return;
  for (const u of SKILL_UNLOCKS) {
    if (state.unlockedSkillIds.has(u.id)) continue;
    if (u.condition(state)) {
      state.unlockedSkillIds.add(u.id);
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), "KILIT AÇILDI: " + (skillLookup[u.id] ? skillLookup[u.id].name : u.id), true, "unlock");
      playSfx(880, 0.12, 0.55);
    }
  }
}

function countAbilityUnlocks() {
  let n = 0;
  ABILITY_UNLOCK_IDS.forEach((id) => { if (ownedSkills.has(id) || (skillLevels[id] || 0) > 0) n++; });
  return n;
}

function countDistinctPassives() {
  const passiveIds = acquiredOrder.filter((id) => !ABILITY_UNLOCK_IDS.has(id));
  return new Set(passiveIds).size;
}

const SHRINE_EXCLUDED_PERK_IDS = new Set(["firerate", "mod_speed_demon", "rapid_fire", "quick_hands"]);
function pickSkills(count) {
  const chapter = state.chapter || 0;
  const maxAbilityUnlocks = chapter >= 3 ? 99 : MAX_ABILITY_UNLOCKS;
  const maxPassives = chapter >= 3 ? 99 : MAX_PASSIVE_SKILLS;
  const isInPool = (s) => CORE_SKILL_IDS.has(s.id) || (state.unlockedSkillIds && state.unlockedSkillIds.has(s.id)) || (s.requires && ownedSkills.has(s.requires));
  let pool = skills.filter((s) => canPickSkill(s) && (isInPool(s) || (state.level || 0) <= 20));
  if (shrineSkillPanelOpen) pool = pool.filter((s) => !SHRINE_EXCLUDED_PERK_IDS.has(s.id));
  const abilityUnlocks = countAbilityUnlocks();
  const distinctPassives = countDistinctPassives();
  if (abilityUnlocks >= maxAbilityUnlocks) {
    pool = pool.filter((s) => s.requires || !ABILITY_UNLOCK_IDS.has(s.id));
  }
  if (distinctPassives >= maxPassives) {
    const passiveSet = new Set(acquiredOrder.filter((id) => !ABILITY_UNLOCK_IDS.has(id)));
    pool = pool.filter((s) => ABILITY_UNLOCK_IDS.has(s.id) || passiveSet.has(s.id) || (s.requires && passiveSet.has(s.requires)) || GENERIC_STRENGTHENER_IDS.has(s.id));
  }
  if (pool.length === 0) {
    pool = skills.filter((s) => canPickSkill(s) && (CORE_SKILL_IDS.has(s.id) || (state.unlockedSkillIds && state.unlockedSkillIds.has(s.id)) || (s.requires && ownedSkills.has(s.requires))));
  }
  if (pool.length === 0) {
    const fallbackPool = [
      { id: "fallback_dmg", name: "Hasar +10%", desc: "Kucuk hasar artisi.", max: 99, rarity: "common", apply() { stats.damage *= 1.10; } },
      { id: "fallback_hp", name: "Max HP +15", desc: "Kucuk can artisi.", max: 99, rarity: "common", apply() { stats.maxHp += 15; stats.hp = Math.min(stats.maxHp, stats.hp + 15); } },
      { id: "fallback_speed", name: "Hiz +8%", desc: "Kucuk hiz artisi.", max: 99, rarity: "common", apply() { stats.moveSpeed *= 1.08; } },
      { id: "fallback_proj", name: "Proj. Hiz +10%", desc: "Mermi hizi artar.", max: 99, rarity: "common", apply() { stats.projectileSpeedMult = (stats.projectileSpeedMult || 1) * 1.10; } },
      { id: "fallback_heal_small", name: "Can +25", desc: "Az iyilesme.", max: 99, rarity: "common", apply() { stats.hp = Math.min(stats.maxHp, stats.hp + 25); } },
    ];
    pool = fallbackPool.filter((s) => (skillLevels[s.id] || 0) < (s.max || 99));
    if (pool.length === 0) pool = fallbackPool;
  }
  if (pool.length === 0) return [];
  const RARITY_WEIGHT = { common: 42, magic: 26, rare: 14, unique: 22, legendary: 10 };
  const level = state.level || 0;
  const charId = state.selectedCharacter || DEFAULT_CHARACTER_ID;
  const preferCharSkills = level <= 10 && charId !== DEFAULT_CHARACTER_ID && CHARACTER_SKILL_PRIORITY[charId];
  const charSkillSet = preferCharSkills ? CHARACTER_SKILL_PRIORITY[charId] : null;
  const picks = [];
  let uniq = [...pool];
  while (picks.length < count && uniq.length > 0) {
    let total = 0;
    for (const s of uniq) {
      let w = RARITY_WEIGHT[s.rarity] || 10;
      if (charSkillSet && (charSkillSet.has(s.id) || (s.requires && charSkillSet.has(s.requires)))) w *= 3.5;
      total += w;
    }
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < uniq.length; i++) {
      let w = RARITY_WEIGHT[uniq[i].rarity] || 10;
      if (charSkillSet && (charSkillSet.has(uniq[i].id) || (uniq[i].requires && charSkillSet.has(uniq[i].requires)))) w *= 3.5;
      r -= w;
      if (r <= 0) { idx = i; break; }
    }
    picks.push(uniq.splice(idx, 1)[0]);
  }
  while (picks.length < count) {
    const s = pool[Math.floor(Math.random() * pool.length)];
    picks.push(s);
  }
  picks.forEach((s) => {
    if (s.tierRange && s.tierRange.length >= 2) {
      const [lo, hi] = s.tierRange;
      s._tierValue = lo + (hi - lo) * Math.random();
      const v = s._tierValue;
      if (/\d+\.?\d*/.test(s.name)) s._tierName = s.name.replace(/\d+\.?\d*/, v < 1 && v > 0 ? String(Math.round(v * 100) / 100) : String(Math.round(v)));
      if (s.desc && /\d+\.?\d*/.test(s.desc)) s._tierDesc = s.desc.replace(/\d+\.?\d*/, v < 1 && v > 0 ? String(Math.round(v * 100) / 100) : String(Math.round(v)));
    }
  });
  return picks;
}

function tryEvolveSkills() {
  function owned(id) { return ownedSkills.has(id) || (skillLevels[id] || 0) > 0; }
  if (abilityState.fireball && !abilityState.fireball.evolved && abilityState.fireball.level > 0 && (skillLevels.fireball_dmg || 0) >= 5 && owned("burn")) {
    abilityState.fireball.evolved = "inferno";
    abilityState.fireball.aoe *= 1.4;
    abilityState.fireball.damage *= 1.25;
    abilityState.fireball.shots = (abilityState.fireball.shots || 1) + 1;
    abilityState.fireball.cooldown *= 0.85;
    showGameNotification("Evrim: Inferno Orb!");
  }
  if (abilityState.frostball && !abilityState.frostball.evolved && abilityState.frostball.level > 0 && (skillLevels.frostball_dmg || 0) >= 4 && owned("freeze")) {
    abilityState.frostball.evolved = "glacier";
    abilityState.frostball.freeze *= 1.5;
    abilityState.frostball.shards += 2;
    abilityState.frostball.damage *= 1.2;
    showGameNotification("Evrim: Glacier!");
  }
  if (abilityState.swords && !abilityState.swords.evolved && abilityState.swords.level > 0 && (skillLevels.sword_dmg || 0) >= 5 && owned("crit")) {
    abilityState.swords.evolved = "bladestorm";
    abilityState.swords.count += 2;
    abilityState.swords.damage *= 1.2;
    abilityState.swords.radius += 0.8;
    abilityState.swords.spin *= 1.25;
    showGameNotification("Evrim: Blade Storm!");
  }
}
function evolvedSkillName(kind, fallback) {
  if (kind === "fireball" && abilityState.fireball && abilityState.fireball.evolved === "inferno") return "Inferno Orb";
  if (kind === "frostball" && abilityState.frostball && abilityState.frostball.evolved === "glacier") return "Glacier";
  if (kind === "swords" && abilityState.swords && abilityState.swords.evolved === "bladestorm") return "Blade Storm";
  return fallback;
}

function applySkill(skill) {
  if (!skill || typeof skill.apply !== "function") return;
  skillLevels[skill.id] = (skillLevels[skill.id] || 0) + 1;
  ownedSkills.add(skill.id);
  skill.apply(skill._tierValue);
  acquiredOrder.push(skill.id);
  tryEvolveSkills();
  const r = skill.rarity || "common";
  if (typeof playSfx === "function") {
    if (r === "common") playSfx(440, 0.12, 0.6);
    else if (r === "magic") playSfx(520, 0.14, 0.65);
    else if (r === "rare") playSfx(620, 0.16, 0.7);
    else if (r === "unique" || r === "legendary") playSfx(720, 0.18, 0.75);
    else playSfx(440, 0.12, 0.6);
  }
}

function makeMinionMesh(kind) {
  const g = new THREE.Group();
  const s = 0.5;
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xddddcc, emissive: 0x222218, roughness: 0.6, metalness: 0.05 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  if (kind === "skeleton_minion") {
    const skull = new THREE.Mesh(new THREE.SphereGeometry(s * 0.4, 10, 8), boneMat);
    skull.position.y = s * 1.0;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(s * 0.06, 5, 5), eyeMat);
    eyeL.position.set(-s * 0.14, s * 1.02, s * 0.28);
    const eyeR = eyeL.clone(); eyeR.position.x *= -1;
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(s * 0.25, s * 0.08, s * 0.15), boneMat);
    jaw.position.set(0, s * 0.88, s * 0.25);
    const ribcage = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.4, s * 0.35, s * 0.5, 8), boneMat);
    ribcage.position.y = s * 0.5;
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.08, s * 0.1, s * 0.4, 6), boneMat);
    spine.position.set(0, s * 0.35, -s * 0.2); spine.rotation.x = 0.2;
    const legFL = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.08, s * 0.1, s * 0.35, 6), boneMat);
    legFL.position.set(-s * 0.22, s * 0.12, s * 0.2);
    const legFR = legFL.clone(); legFR.position.x *= -1;
    const legBL = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.08, s * 0.1, s * 0.33, 6), boneMat);
    legBL.position.set(-s * 0.2, s * 0.13, -s * 0.2);
    const legBR = legBL.clone(); legBR.position.x *= -1;
    g.add(skull, eyeL, eyeR, jaw, ribcage, spine, legFL, legFR, legBL, legBR);
  } else if (kind === "wolf_minion") {
    const wolfMat = new THREE.MeshStandardMaterial({ color: 0x5c4a3a, emissive: 0x1a1510, emissiveIntensity: 0.2, roughness: 0.5 });
    const wolfDark = new THREE.MeshStandardMaterial({ color: 0x3d3228, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.38, s * 0.5, s * 0.72, 8), wolfMat);
    body.scale.set(1, 1.05, 1.55); body.position.y = s * 0.46;
    const head = new THREE.Mesh(new THREE.SphereGeometry(s * 0.3, 10, 8), wolfMat);
    head.scale.set(1, 0.95, 1.25); head.position.set(0, s * 0.92, s * 0.5);
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.07, s * 0.11, s * 0.52, 6), wolfDark);
    snout.position.set(0, s * 0.86, s * 0.82); snout.rotation.x = 0.12;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(s * 0.05, 5, 5), eyeMat);
    eyeL.position.set(-s * 0.12, s * 0.94, s * 0.58);
    const eyeR = eyeL.clone(); eyeR.position.x *= -1;
    const earL = new THREE.Mesh(new THREE.ConeGeometry(s * 0.11, s * 0.38, 4), wolfDark);
    earL.position.set(-s * 0.24, s * 1.14, s * 0.38); earL.rotation.z = 0.35; earL.rotation.x = -0.25;
    const earR = earL.clone(); earR.position.x *= -1; earR.rotation.z *= -0.35;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(s * 0.09, s * 0.58, 5), wolfMat);
    tail.position.set(0, s * 0.38, -s * 0.72); tail.rotation.x = 0.45;
    g.add(body, head, snout, eyeL, eyeR, earL, earR, tail);
  } else if (kind === "goblin_minion") {
    const gobMat = new THREE.MeshStandardMaterial({ color: 0x44aa44, emissive: 0x1a441a, emissiveIntensity: 0.2, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.45, s * 0.5, s * 0.6, 8), gobMat);
    body.position.y = s * 0.5;
    const head = new THREE.Mesh(new THREE.SphereGeometry(s * 0.35, 10, 8), gobMat);
    head.position.y = s * 0.95;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(s * 0.06, 5, 5), eyeMat);
    eyeL.position.set(-s * 0.12, s * 0.98, s * 0.28);
    const eyeR = eyeL.clone(); eyeR.position.x *= -1;
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.08, s * 0.1, s * 0.35, 6), gobMat);
    legL.position.set(-s * 0.18, s * 0.12, s * 0.15);
    const legR = legL.clone(); legR.position.x *= -1;
    g.add(body, head, eyeL, eyeR, legL, legR);
  } else if (kind === "healer_minion") {
    const healMat = new THREE.MeshStandardMaterial({ color: 0x88ff88, emissive: 0x228822, emissiveIntensity: 0.35, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 10, 8), healMat);
    body.position.y = s * 0.55;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(s * 0.15, s * 0.5, s * 0.15), healMat);
    cross.position.y = s * 0.9;
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.15, s * 0.15), healMat);
    cross2.position.y = s * 0.9;
    g.add(body, cross, cross2);
  } else if (kind === "archer_minion") {
    const archMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, emissive: 0x2a1a0a, emissiveIntensity: 0.15, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.4, s * 0.45, s * 0.7, 8), archMat);
    body.position.y = s * 0.5;
    const head = new THREE.Mesh(new THREE.SphereGeometry(s * 0.3, 8, 6), archMat);
    head.position.y = s * 0.95;
    const bow = new THREE.Mesh(new THREE.TorusGeometry(s * 0.35, s * 0.04, 4, 12, Math.PI * 0.85), archMat);
    bow.rotation.z = Math.PI / 2;
    bow.position.set(0, s * 0.6, s * 0.4);
    g.add(body, head, bow);
  } else if (kind === "mage_minion") {
    const mageMat = new THREE.MeshStandardMaterial({ color: 0xaa66ff, emissive: 0x331866, emissiveIntensity: 0.4, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 10, 8), mageMat);
    body.position.y = s * 0.55;
    const hat = new THREE.Mesh(new THREE.ConeGeometry(s * 0.35, s * 0.5, 6), mageMat);
    hat.position.y = s * 1.05;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffccff }));
    orb.position.set(0, s * 0.7, s * 0.35);
    g.add(body, hat, orb);
  } else if (kind === "golem") {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb8a58a, emissive: 0x2a2520, emissiveIntensity: 0.15, roughness: 0.75, metalness: 0.05 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.9, s * 1.0, s * 0.55), stoneMat);
    body.position.y = s * 0.55;
    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.45, s * 0.45), stoneMat);
    head.position.y = s * 1.15;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 5, 5), eyeMat);
    eyeL.position.set(-s * 0.12, s * 1.18, s * 0.2);
    const eyeR = eyeL.clone(); eyeR.position.x *= -1;
    const armL = new THREE.Mesh(new THREE.BoxGeometry(s * 0.25, s * 0.5, s * 0.3), stoneMat);
    armL.position.set(-s * 0.55, s * 0.6, 0); armL.rotation.z = 0.2;
    const armR = new THREE.Mesh(new THREE.BoxGeometry(s * 0.25, s * 0.5, s * 0.3), stoneMat);
    armR.position.set(s * 0.55, s * 0.6, 0); armR.rotation.z = -0.2;
    const legL = new THREE.Mesh(new THREE.BoxGeometry(s * 0.3, s * 0.45, s * 0.25), stoneMat);
    legL.position.set(-s * 0.22, s * 0.12, s * 0.08);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(s * 0.3, s * 0.45, s * 0.25), stoneMat);
    legR.position.set(s * 0.22, s * 0.12, s * 0.08);
    g.add(body, head, eyeL, eyeR, armL, armR, legL, legR);
  } else {
    const mat = new THREE.MeshStandardMaterial({ color: companionsData[kind]?.color || 0x888888, emissive: companionsData[kind]?.color || 0x333333, emissiveIntensity: 0.3 });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(s * 0.7, 10, 8), mat));
  }
  g.scale.setScalar(1);
  return g;
}

function addCompanion(kind) {
  const maxComp = Math.min(6, stats.maxCompanions || 3);
  if (companions.length >= maxComp) return;
  const data = companionsData[kind];
  if (!data) return;
  const pos = player.mesh.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2));
  pos.y = (typeof getGroundHeight === "function" ? getGroundHeight(pos.x, pos.z) : 0) + 0.6;
  let body;
  if (data.meshType === "creature") {
    body = makeMinionMesh(kind);
    body.position.copy(pos);
  } else {
    body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({ color: data.color, emissive: data.color, emissiveIntensity: 0.3 }));
    body.position.copy(pos);
  }
  scene.add(body);
  companions.push({ kind, mesh: body, timer: 0, healTimer: 0, level: 1, xp: 0, data });
}

function openLevelup() {
  leveling = true;
  running = false;
  levelupAutoPick = 0;
  levelupRerollsLeft = 2;
  levelupPaidRerollCount = 0;
  if (pointerLocked) document.exitPointerLock();
  levelupPanel.classList.remove("hidden");
  const xpBar = document.getElementById("xpBarBottom");
  if (xpBar) {
    xpBar.classList.add("xpBarFlash");
    setTimeout(function () { xpBar.classList.remove("xpBarFlash"); }, 600);
  }
  if (player.mesh && running === false) {
    spawnWave(player.mesh.position, 6, 0x88ff88);
    playSfx(440, 0.15, 0.5);
  }
  renderLevelupCards();
  updateRerollButton();
}

function closeLevelupAndResume() {
  currentChoices = [];
  document.querySelectorAll(".cardTooltip").forEach(function(el) { el.remove(); });
  if (cardRow && cardRow.children) {
    Array.from(cardRow.children).forEach(function(card) {
      if (card._ttEl && card._ttEl.parentNode) card._ttEl.parentNode.removeChild(card._ttEl);
      card._ttEl = null;
      if (card._ttMove) document.removeEventListener("mousemove", card._ttMove);
    });
  }
  levelupPanel.classList.add("hidden");
  leveling = false;
  paused = false;
  shrineSkillPanelOpen = false;
  running = !gameOver;
  if (running && !gameOver && canvas) canvas.requestPointerLock();
}

const SKILL_SYNERGY = {
  unlock_fireball: ["burn", "Yanma ile birlesir"],
  burn: ["unlock_fireball", "Fireball ile birlesir"],
  unlock_frostball: ["freeze", "Freeze ile birlesir"],
  freeze: ["unlock_frostball", "Frostball ile birlesir"],
  unlock_swords: ["crit", "Kritik ile birlesir"],
  crit: ["unlock_swords", "Kiliclar ile birlesir"],
  lifesteal: ["vampiric_touch", "Vampirik ile birlesir"],
  thorns: ["hp", "Can ile birlesir"],
  execute: ["executioner", "Cellat ile birlesir"],
  executioner: ["execute", "Infaz ile birlesir"],
  unlock_chain_bolt: ["shock", "Sok ile birlesir"],
  greed: ["gold_finder", "Altin Bulucu ile birlesir"]
};
function renderLevelupCards() {
  levelInfo.textContent = `Level ${state.level} - 1 kart sec (bekleyen: ${state.pendingLevels})`;
  cardRow.innerHTML = "";

  const skillsListEl = document.getElementById("levelupSkillsList");
  if (skillsListEl) {
    const actives = [];
    if (abilityState.fireball.level > 0) actives.push({ name: evolvedSkillName("fireball", "Fireball"), lvl: abilityState.fireball.level });
    if (abilityState.chainBolt?.level > 0) actives.push({ name: "Zincir Yildirim", lvl: abilityState.chainBolt.level });
    if (abilityState.blackHole?.level > 0) actives.push({ name: "Kara Delik", lvl: abilityState.blackHole.level });
    if (abilityState.poisonTrail?.level > 0) actives.push({ name: "Zehir Izi", lvl: abilityState.poisonTrail.level });
    if (abilityState.comet.level > 0) actives.push({ name: "Comet", lvl: abilityState.comet.level });
    if (abilityState.swords.level > 0) actives.push({ name: evolvedSkillName("swords", "Kiliclar"), lvl: abilityState.swords.count });
    if (abilityState.frostball?.level > 0) actives.push({ name: evolvedSkillName("frostball", "Frostball"), lvl: abilityState.frostball.level });
    if (abilityState.meteor.level > 0) actives.push({ name: "Meteor", lvl: abilityState.meteor.level });
    if (abilityState.nova?.level > 0) actives.push({ name: "Nova", lvl: abilityState.nova.level });
    if (abilityState.banana?.level > 0) actives.push({ name: "Muz", lvl: abilityState.banana.level });
    if (abilityState.swordThrow?.level > 0) actives.push({ name: "Kilic Firlatma", lvl: abilityState.swordThrow.level });
    if (abilityState.boomerang?.level > 0) actives.push({ name: "Bumerang", lvl: abilityState.boomerang.level });
    if (abilityState.shuriken?.level > 0) actives.push({ name: "Shuriken", lvl: abilityState.shuriken.count || 3 });
    if (abilityState.laser?.level > 0) actives.push({ name: "Lazer", lvl: abilityState.laser.level });
    if (abilityState.dismantle?.level > 0) actives.push({ name: "Dismantle", lvl: abilityState.dismantle.level });
    const passives = acquiredOrder.filter((id) => !["fireball", "comet", "swords", "meteor", "nova", "unlock_banana", "unlock_sword_throw", "unlock_boomerang", "unlock_shuriken", "unlock_laser", "unlock_dismantle"].includes(id)).slice(-8).map((id) => ({ name: (skillLookup[id] && skillLookup[id].name) || id, lvl: skillLevels[id] || 1 }));
    skillsListEl.innerHTML = "<div class=\"statRow\"><strong>âš¡ Aktif</strong></div>" + actives.map((s) => `<div class="skillItem">${s.name} Lv${s.lvl}</div>`).join("") + "<div class=\"statRow\"><strong>ðŸ“‹ Pasif</strong></div>" + passives.map((s) => `<div class="skillItem">${s.name} Lv${s.lvl}</div>`).join("") || "<div class=\"skillItem\">-</div>";
  }

  const statsListEl = document.getElementById("levelupStatsList");
  if (statsListEl) {
    statsListEl.innerHTML = `
      <div class="statRow">â¤ï¸ HP ${Math.floor(stats.hp)} / ${Math.floor(stats.maxHp)}</div>
      <div class="statRow">ðŸ›¡ï¸ Kalkan ${Math.floor(stats.shield || 0)}</div>
      <div class="statRow">âš”ï¸ Hasar ${stats.damage.toFixed(1)}</div>
      <div class="statRow">ðŸ”¥ Atis/s ${(1/stats.fireRate).toFixed(1)}</div>
      <div class="statRow">ðŸ‘Ÿ Hiz ${stats.moveSpeed.toFixed(1)}</div>
      <div class="statRow">âš¡ Kritik %${Math.min(100, Math.round((stats.critChance||0)*100))}</div>
      <div class="statRow">âš¡ Krit hasar x${(stats.critMult||1.9).toFixed(1)}</div>
      <div class="statRow">ðŸ§² Magnet ${stats.magnetRange.toFixed(1)}</div>
      <div class="statRow">ðŸ“¦ Toplama ${stats.pickupRange.toFixed(1)}</div>
      <div class="statRow">ðŸ’‰ Vampir %${((stats.lifesteal||0)*100).toFixed(0)}</div>
      <div class="statRow">ðŸ›¡ï¸ Zirh %${((stats.armor||0)*100).toFixed(0)}</div>
      <div class="statRow">ðŸ”§ Turret ${placeableTurrets.length} / ${stats.maxTurrets || 1}</div>
      <div class="statRow">ðŸ° Bhop Streak ${bhop.streak} (+${bhop.speedBonus.toFixed(1)} hiz)</div>
      <div class="statRow">ðŸš€ Proj. Hiz ${(stats.projectileSpeed * (stats.projectileSpeedMult || 1)).toFixed(1)}</div>
    `;
  }

  currentChoices = pickSkills(3);

  if (currentChoices.length === 0) {
    const fallback = { id: "fallback_heal", name: "Can +35", desc: "Havuz bitti. Guvenli secenek.", rarity: "common", apply() { stats.hp = Math.min(stats.maxHp, stats.hp + 35); } };
    currentChoices = [fallback, fallback, fallback];
  }

  const critChancePct = Math.min(100, Math.round((stats.critChance || 0) * 100));
  const critMultVal = (stats.critMult || 1.9);
  currentChoices.forEach((skill, idx) => {
    const rarity = skill.rarity || "common";
    const card = document.createElement("article");
    card.className = "card " + rarity + " rarity-" + rarity;
    const displayName = skill._tierName != null ? skill._tierName : skill.name;
    const displayDesc = skill._tierDesc != null ? skill._tierDesc : skill.desc;
    card.setAttribute("data-desc", displayDesc || "");
    let detail = "";
    if (skill.id === "crit" || skill.id === "critical_master" || skill.id === "crit_dmg") {
      const critAdd = skill._tierValue != null ? skill._tierValue : (skill.id === "crit" ? 8 : skill.id === "critical_master" ? 12 : 25);
      if (skill.id === "crit") detail = `<div class="cardStat">Krit: %${critChancePct} -> %${Math.min(100, critChancePct + Math.round(critAdd))}</div>`;
      else if (skill.id === "critical_master") detail = `<div class="cardStat">Krit: %${critChancePct} -> %${Math.min(100, critChancePct + 12)} | Krit hasar: x${critMultVal.toFixed(1)} -> x${(critMultVal + 0.3).toFixed(1)}</div>`;
      else detail = `<div class="cardStat">Krit hasar carpani: x${critMultVal.toFixed(1)} -> x${(critMultVal + (critAdd / 100)).toFixed(1)}</div>`;
    }
    const iconSrc = "assets/ui/icon-card.svg";
    const syn = SKILL_SYNERGY[skill.id];
    const synHtml = (syn && ownedSkills.has(syn[0])) ? `<span class="synergyBadge">${syn[1]}</span>` : "";
    card.title = displayDesc ? "Ne yapar: " + displayDesc : "";
    card.innerHTML = `<span class="cardIcon"><img src="${iconSrc}" alt=""></span><h3>${idx + 1}. ${displayName}</h3><span class="badge rarity-${rarity}">${rarity.toUpperCase()}</span><p>${displayDesc}</p>${detail}${synHtml}`;
    card.addEventListener("click", () => chooseLevelCard(idx));
    let tooltipEl = null;
    card.addEventListener("mouseenter", function(e) {
      if (tooltipEl) return;
      tooltipEl = document.createElement("div");
      tooltipEl.className = "cardTooltip";
      tooltipEl.textContent = displayDesc || "";
      document.body.appendChild(tooltipEl);
      function move(ev) {
        tooltipEl.style.left = (ev.clientX + 12) + "px";
        tooltipEl.style.top = (ev.clientY + 8) + "px";
      }
      card._ttMove = move;
      card._ttEl = tooltipEl;
      move(e);
      document.addEventListener("mousemove", move);
      card.addEventListener("mouseleave", function leave() {
        document.removeEventListener("mousemove", move);
        if (tooltipEl && tooltipEl.parentNode) tooltipEl.parentNode.removeChild(tooltipEl);
        tooltipEl = null;
        card._ttEl = null;
      }, { once: true });
    });
    cardRow.appendChild(card);
  });
}

function chooseLevelCard(index) {
  if (!leveling) return;
  const skill = currentChoices[index];
  if (skill) applySkill(skill);
  state.pendingLevels = Math.max(0, state.pendingLevels - 1);
  if (state.pendingLevels > 0) { renderLevelupCards(); levelupAutoPick = 0; updateRerollButton(); return; }
  closeLevelupAndResume();
}

function getRerollCost() {
  return Math.ceil(REROLL_BASE_COIN + REROLL_COIN_LOG_FACTOR * Math.log2(1 + levelupPaidRerollCount));
}
function updateRerollButton() {
  if (!rerollCountEl) return;
  if (levelupRerollsLeft > 0) {
    rerollCountEl.textContent = levelupRerollsLeft + " ucretsiz";
    if (rerollBtn) rerollBtn.disabled = false;
  } else {
    const cost = getRerollCost();
    rerollCountEl.textContent = cost + " coin";
    if (rerollBtn) rerollBtn.disabled = (state.coins || 0) < cost;
  }
}
function doReroll() {
  if (!leveling) return;
  if (levelupRerollsLeft > 0) {
    levelupRerollsLeft--;
    renderLevelupCards();
    updateRerollButton();
    return;
  }
  const cost = getRerollCost();
  if ((state.coins || 0) < cost) return;
  state.coins -= cost;
  levelupPaidRerollCount++;
  renderLevelupCards();
  updateRerollButton();
}

let shrineSkillPanelOpen = false;

function updateWorldDecors() {
  if (worldDecorInstanced) return;
  return withSharedGeo(updateWorldDecorsInner);
}
function updateWorldDecorsInner() {
  if (!player.mesh || !mapGroup || !worldDecorData.length) return;
  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  if (!worldDecorRockMats) {
    worldDecorRockMats = [
      new THREE.MeshStandardMaterial({ color: 0x7a8a8a, emissive: 0x3a4a4a, emissiveIntensity: 0.08, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x8a7a6a, emissive: 0x4a3a2a, emissiveIntensity: 0.08, roughness: 0.92 }),
    ];
  }
  if (!worldDecorBushMat) {
    worldDecorBushMat = new THREE.MeshStandardMaterial({ color: 0x2d7a2d, emissive: 0x0d3a0d, emissiveIntensity: 0.1, roughness: 0.88 });
  }
  if (!worldDecorMushroomStemMat) {
    worldDecorMushroomStemMat = new THREE.MeshStandardMaterial({ color: 0xf5e6d3, roughness: 0.9 });
    worldDecorMushroomCapRed = new THREE.MeshStandardMaterial({ color: 0xcc4444, emissive: 0x440808, emissiveIntensity: 0.08, roughness: 0.85 });
    worldDecorMushroomCapBrown = new THREE.MeshStandardMaterial({ color: 0x8b6914, emissive: 0x2a2008, emissiveIntensity: 0.08, roughness: 0.85 });
  }
  if (!worldDecorMiniMats) {
    worldDecorMiniMats = {
      chair: new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.8 }),
      leg: new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.5, roughness: 0.5 }),
      cone: new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x882200, emissiveIntensity: 0.2, roughness: 0.7 }),
      box: new THREE.MeshStandardMaterial({ color: 0xb8956e, roughness: 0.85 }),
      tire: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }),
      ball: new THREE.MeshStandardMaterial({ color: 0xdd4444, roughness: 0.4 }),
    };
  }
  if (!worldDecorFlowerMats) {
    worldDecorFlowerMats = FLOWER_COLOR_LIST.map(function(c) {
      return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.3, roughness: 0.4 });
    });
  }
  const load2 = WORLD_DECOR_LOAD_DIST * WORLD_DECOR_LOAD_DIST;
  const unload2 = WORLD_DECOR_UNLOAD_DIST * WORLD_DECOR_UNLOAD_DIST;
  const n = worldDecorData.length;
  const start = worldDecorUpdateOffset % n;
  worldDecorUpdateOffset = (worldDecorUpdateOffset + WORLD_DECOR_CHUNK) % n;
  for (let c = 0; c < WORLD_DECOR_CHUNK && c < n; c++) {
    const i = (start + c) % n;
    const d = worldDecorData[i];
    const dx = d.x - px, dz = d.z - pz;
    const dist2 = dx * dx + dz * dz;
    if (d.mesh) d.mesh.visible = dist2 <= 2025;
    if (dist2 < load2 && !d.mesh) {
      const y = sampleTerrainHeight(d.x, d.z);
      if (d.type === "rock") {
        const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), worldDecorRockMats[d.matIndex]);
        mesh.scale.set(d.s, d.sy, d.s);
        mesh.position.set(d.x, y + 0.15 * d.s, d.z);
        mesh.rotation.set(d.rot[0], d.rot[1], d.rot[2]);
        mapGroup.add(mesh);
        d.mesh = mesh;
      } else if (d.type === "bush") {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 6, 5), worldDecorBushMat);
        mesh.scale.set(d.s, d.s * 0.85, d.s);
        mesh.position.set(d.x, y + 0.2 * d.s, d.z);
        mapGroup.add(mesh);
        d.mesh = mesh;
      } else if (d.type === "flower") {
        const fi = FLOWER_COLOR_LIST.indexOf(d.flowerColor);
        const mat = worldDecorFlowerMats[fi >= 0 ? fi : 0];
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), mat);
        const fy = sampleTerrainHeight(d.x, d.z) + 0.45 * d.s;
        mesh.position.set(d.x, fy, d.z);
        mapGroup.add(mesh);
        d.mesh = mesh;
      } else if (d.type === "mushroom") {
        const capMat = d.variant === "red" ? worldDecorMushroomCapRed : worldDecorMushroomCapBrown;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * d.s, 0.12 * d.s, 0.25 * d.s, 5), worldDecorMushroomStemMat);
        stem.position.y = 0.125 * d.s;
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2 * d.s, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), capMat);
        cap.position.y = 0.28 * d.s;
        const group = new THREE.Group();
        group.add(stem); group.add(cap);
        const my = sampleTerrainHeight(d.x, d.z);
        group.position.set(d.x, my, d.z);
        mapGroup.add(group);
        d.mesh = group;
      } else if (d.type === "chair") {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5 * d.s, 0.08 * d.s, 0.45 * d.s), worldDecorMiniMats.chair);
        seat.position.y = 0.25 * d.s;
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.5 * d.s, 0.4 * d.s, 0.06 * d.s), worldDecorMiniMats.chair);
        back.position.set(0, 0.45 * d.s, -0.22 * d.s);
        const g = new THREE.Group();
        g.add(seat); g.add(back);
        [ [-1,1], [1,1], [-1,-1], [1,-1] ].forEach(([sx, sz]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * d.s, 0.04 * d.s, 0.25 * d.s, 6), worldDecorMiniMats.leg);
          leg.position.set(sx * 0.2 * d.s, 0.125 * d.s, sz * 0.18 * d.s);
          g.add(leg);
        });
        g.position.set(d.x, y, d.z); g.rotation.y = d.rot || 0;
        mapGroup.add(g); d.mesh = g;
      } else if (d.type === "cone") {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2 * d.s, 0.5 * d.s, 6), worldDecorMiniMats.cone);
        cone.position.set(d.x, y + 0.25 * d.s, d.z);
        cone.rotation.y = d.rot || 0;
        mapGroup.add(cone); d.mesh = cone;
      } else if (d.type === "box") {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.4 * d.s, 0.35 * d.s, 0.35 * d.s), worldDecorMiniMats.box);
        box.position.set(d.x, y + 0.175 * d.s, d.z);
        box.rotation.y = d.rot || 0;
        mapGroup.add(box); d.mesh = box;
      } else if (d.type === "tire") {
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.25 * d.s, 0.08 * d.s, 6, 12), worldDecorMiniMats.tire);
        tire.rotation.x = Math.PI / 2;
        tire.position.set(d.x, y + 0.25 * d.s, d.z);
        tire.rotation.z = d.rot || 0;
        mapGroup.add(tire); d.mesh = tire;
      } else if (d.type === "ball") {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2 * d.s, 8, 6), worldDecorMiniMats.ball);
        ball.position.set(d.x, y + 0.2 * d.s, d.z);
        mapGroup.add(ball); d.mesh = ball;
      }
    } else if (dist2 > unload2 && d.mesh) {
      mapGroup.remove(d.mesh);
      if (d.mesh.type === "Group") {
        d.mesh.traverse(function(c) { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
      } else {
        if (d.mesh.geometry) d.mesh.geometry.dispose();
        if (d.mesh.material && d.type !== "bush" && d.type !== "rock") d.mesh.material.dispose();
      }
      d.mesh = null;
    }
  }
}

function updateMapAnimations(dt) {
  const t = state.time || clock.getElapsedTime();
  const shrineHintEl = document.getElementById("shrineHint");

  let nearShrine = false;
  for (const shrine of shrineGroups) {
    if (!shrine.userData?.isShrine) continue;
    const phase = shrine.userData.phase || 0;
    // Animate orb (green glow, index 6 after dome)
    if (shrine.children[6]) {
      shrine.children[6].position.y = 2.5 + Math.sin(t * 2.5 + phase) * 0.25;
      shrine.children[6].scale.setScalar(1 + Math.sin(t * 3 + phase) * 0.12);
    }
    // Animate bubble ring (index 7)
    if (shrine.children[7] && shrine.children[7].material) {
      shrine.children[7].material.opacity = 0.35 + Math.sin(t * 1.5 + phase) * 0.15;
    }

    if (!running || gameOver) continue;

    // Cooldown tick
    if (shrine.userData.cooldown > 0) { shrine.userData.cooldown -= dt; continue; }
    if (shrine.userData.used) continue;

    const dist = player.mesh.position.distanceTo(shrine.position);
    if (dist < SHRINE_RADIUS) {
      nearShrine = true;
      shrine.userData.insideTime = (shrine.userData.insideTime || 0) + dt;

      // Bar dolma sesi: her 0.5 saniyede yukselen tik
      if (shrine.userData.insideTime > 0.2 && shrine.userData.insideTime < SHRINE_HOLD_TIME - 0.05) {
        const seg = Math.floor(shrine.userData.insideTime / 0.5);
        const prevSeg = Math.floor((shrine.userData.insideTime - dt) / 0.5);
        if (seg > prevSeg) {
          const progress = shrine.userData.insideTime / SHRINE_HOLD_TIME;
          playSfx(320 + progress * 380, 0.12, 0.65);
        }
      }

      // Show progress
      if (shrineHintEl) {
        shrineHintEl.classList.add("visible");
        shrineHintEl.style.display = "block";
        const progress = Math.min(shrine.userData.insideTime, SHRINE_HOLD_TIME);
        shrineHintEl.textContent = `Shrine aktiflestirilyor... ${progress.toFixed(1)}/${SHRINE_HOLD_TIME}s`;
      }

      // Activate! (tek sefer acilsin - double-tap bug onleme)
      if (shrine.userData.insideTime >= SHRINE_HOLD_TIME) {
        shrine.userData.used = true;
        shrine.userData.insideTime = 0;
        shrine.traverse(function(c) {
          if (c.isMesh && c.material) {
            const mats = Array.isArray(c.material) ? c.material : [c.material];
            mats.forEach(function(m) {
              if (m && m.color) { m.color.setHex(0x1a1a1a); if (m.emissive) m.emissive.setHex(0x080808); }
            });
          }
        });
        if (!shrine.userData._panelOpened) {
          shrine.userData._panelOpened = true;
          shrine.traverse(function(c) {
            if (c.isMesh && c.material) {
              const mats = Array.isArray(c.material) ? c.material : [c.material];
              mats.forEach(function(m) {
                if (m && m.color) { m.color.setHex(0x1a1a1a); if (m.emissive) m.emissive.setHex(0x080808); }
              });
            }
          });
          spawnRing(shrine.position, SHRINE_RADIUS, 0xffe890, 0.5);
          playSfx(600, 0.18, 0.6);
          playSfx(800, 0.15, 0.55);
          playSfx(1000, 0.12, 0.5);
          openShrineSkillPanel(shrine);
        }
      }
    } else {
      if (shrine.userData.insideTime > 0) {
        shrine.userData.insideTime = 0;
      }
    }
  }

  state.nearShrine = nearShrine;
  if (!nearShrine && shrineHintEl) {
    shrineHintEl.style.display = "none";
    shrineHintEl.classList.remove("visible");
  }

  // Boss Summon Shrine: son bossu erkenden cagir (3/6/10 dk bosslari - hepsi gelir, hasar dengeli)
  for (const bss of bossSummonShrines) {
    if (!bss.userData?.isBossSummonShrine || bss.userData.used) continue;
    if (state.inMegaArena) continue;
    const phase = bss.userData.phase !== undefined ? bss.userData.phase : (bss.userData.phase = Math.random() * Math.PI * 2);
    if (bss.children[2] && bss.children[2].material && bss.children[2].material.emissiveIntensity !== undefined) {
      bss.children[2].material.emissiveIntensity = 0.6 + Math.sin(t * 2.5 + phase) * 0.3;
    }
    if (bss.children[3] && bss.children[3].material) {
      bss.children[3].material.opacity = 0.45 + Math.sin(t * 2 + phase) * 0.25;
    }
    const distBss = player.mesh.position.distanceTo(bss.position);
    if (distBss < BOSS_SUMMON_SHRINE_RADIUS) {
      bss.userData.insideTime = (bss.userData.insideTime || 0) + dt;
      if (bss.userData.insideTime > 0.2 && bss.userData.insideTime < BOSS_SUMMON_SHRINE_HOLD - 0.05) {
        const seg = Math.floor(bss.userData.insideTime / 0.5);
        const prevSeg = Math.floor((bss.userData.insideTime - dt) / 0.5);
        if (seg > prevSeg) {
          const progress = bss.userData.insideTime / BOSS_SUMMON_SHRINE_HOLD;
          playSfx(340 + progress * 400, 0.12, 0.6);
        }
      }
      if (shrineHintEl) {
        shrineHintEl.classList.add("visible");
        shrineHintEl.style.display = "block";
        const progress = Math.min(bss.userData.insideTime, BOSS_SUMMON_SHRINE_HOLD);
        shrineHintEl.textContent = `Boss Cagir... ${progress.toFixed(1)}/${BOSS_SUMMON_SHRINE_HOLD}s - Son bossu erkenden cagir`;
      }
      if (bss.userData.insideTime >= BOSS_SUMMON_SHRINE_HOLD) {
        bss.userData.insideTime = 0;
        bss.userData.used = true;
        const ch = state.chapter || 1;
        const bossIndex = Math.max(0, ch - 1);
        const slots = state.bossSlotsSpawnedThisChapter;
        let spawned = 0;
        for (let slot = 0; slot < 3; slot++) {
          if (!slots[slot]) {
            state.bossSlotsSpawnedThisChapter[slot] = true;
            state.bossSpawnedThisChapter[bossIndex] = true;
            spawnBoss(bossIndex, true, true, slot === 2, slot);
            spawned++;
          }
        }
        spawnRing(bss.position, BOSS_SUMMON_SHRINE_RADIUS, 0xaa44ee, 0.7);
        playSfx(180, 0.2, 0.65);
        playSfx(500, 0.15, 0.55);
        if (typeof showGameNotification === "function") showGameNotification(spawned > 0 ? "Boss Cagir! " + spawned + " boss cagirildi - Kesince portal acilir." : "Boss Cagir - Zaten cagrilmisti.");
      }
    } else {
      bss.userData.insideTime = 0;
    }
  }

  // Boss Shrine: basili tut = bosslari cogaltir, zorluk +5%, boss drop artar
  for (const bs of bossShrines) {
    if (!bs.userData?.isBossShrine) continue;
    if (bs.userData.cooldown > 0) { bs.userData.cooldown -= dt; continue; }
    const dist = player.mesh.position.distanceTo(bs.position);
    if (dist < BOSS_SHRINE_RADIUS) {
      bs.userData.insideTime = (bs.userData.insideTime || 0) + dt;
      if (bs.userData.insideTime > 0.2 && bs.userData.insideTime < SHRINE_HOLD_TIME - 0.05) {
        const seg = Math.floor(bs.userData.insideTime / 0.5);
        const prevSeg = Math.floor((bs.userData.insideTime - dt) / 0.5);
        if (seg > prevSeg) {
          const progress = bs.userData.insideTime / SHRINE_HOLD_TIME;
          playSfx(320 + progress * 380, 0.12, 0.65);
        }
      }
      if (shrineHintEl) {
        shrineHintEl.classList.add("visible");
        shrineHintEl.style.display = "block";
        const progress = Math.min(bs.userData.insideTime, SHRINE_HOLD_TIME);
        shrineHintEl.textContent = `Boss Shrine... ${progress.toFixed(1)}/${SHRINE_HOLD_TIME}s - Boss cogalt, zorluk +5%, drop artar`;
      }
      if (bs.userData.insideTime >= SHRINE_HOLD_TIME) {
        bs.userData.insideTime = 0;
        bs.userData.cooldown = BOSS_SHRINE_COOLDOWN;
        bs.traverse(function(c) {
          if (c.isMesh && c.material) {
            const mats = Array.isArray(c.material) ? c.material : [c.material];
            mats.forEach(function(m) {
              if (m && m.color) { m.color.setHex(0x1a1a1a); if (m.emissive) m.emissive.setHex(0x080808); }
            });
          }
        });
        const bossCount = enemies.filter((e) => e.isBoss).length;
        const ch = state.chapter || 1;
        const bossIndex = Math.max(0, ch - 1);
        for (let i = 0; i < bossCount; i++) spawnBoss(bossIndex, true);
        state.difficultyMult = (state.difficultyMult || 1) + 0.05;
        state.bossDropMult = (state.bossDropMult || 1) + 0.2;
        spawnRing(bs.position, BOSS_SHRINE_RADIUS, 0xff6622, 0.6);
        playSfx(180, 0.2, 0.7);
        playSfx(400, 0.15, 0.6);
        if (typeof showGameNotification === "function") showGameNotification("Boss Shrine! Bosslar cogaltildi, zorluk +5%, boss drop +20%");
      }
    } else {
      bs.userData.insideTime = 0;
    }
  }

  // Hafif agac sallanmasi (sadece oyuncuya yakin agaclar)
  if (mapGroup && player.mesh && running) {
    const px = player.mesh.position.x, pz = player.mesh.position.z;
    const near = 70 * 70;
    mapGroup.traverse((c) => {
      if (!c.userData.isTree) return;
      const dx = c.position.x - px, dz = c.position.z - pz;
      if (dx * dx + dz * dz > near) return;
      c.rotation.z = Math.sin(t * 1.1 + (c.userData.phase || 0)) * 0.022;
      c.rotation.x = Math.sin(t * 0.85 + (c.userData.phase || 0) * 1.2) * 0.015;
    });
  }

  for (const p of ambientParticles) {
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.rotation.y += dt * 0.5;
    p.mesh.rotation.x += Math.sin(t + p.phase) * 0.02;
    if (p.mesh.position.y < 0) p.mesh.position.y += 15;
    if (Math.abs(p.mesh.position.x) > WORLD_HALF + 5) p.mesh.position.x *= -0.95;
    if (Math.abs(p.mesh.position.z) > WORLD_HALF + 5) p.mesh.position.z *= -0.95;
  }
  if (grassField) grassField.position.y = Math.sin(t * 0.4) * 0.02;
  for (const pond of pondMeshes) pond.material.opacity = 0.82 + Math.sin(t * 1.2) * 0.06;
}

function openShrineSkillPanel(shrine) {
  // Reuse levelup UI to select a skill from shrine
  shrineSkillPanelOpen = true;
  paused = true;
  leveling = true;
  state.pendingLevels = 1;
  if (levelInfo) levelInfo.textContent = "Shrine Aktif! Bir ozellik sec";
  renderLevelupCards();
  levelupPanel.classList.remove("hidden");
}

function updateCamera(dt) {
  if (!player.mesh) return;
  const playerPos = player.mesh.position;
  const angleMode = camSettings.cameraAngle || "default";
  const isometric = angleMode === "isometric";
  const isometricAngled = angleMode === "isometric_angled";
  const firstPerson = angleMode === "first_person";
  const graphics2D = camSettings.graphics2D === true;

  if (graphics2D) {
    if (!camera2D) {
      const aspect = window.innerWidth / window.innerHeight;
      const h = 32;
      const w = h * aspect;
      camera2D = new THREE.OrthographicCamera(-w, w, h, -h, 0.1, 200);
    }
    const aspect = window.innerWidth / window.innerHeight;
    const h = 32;
    const w = h * aspect;
    camera2D.left = -w;
    camera2D.right = w;
    camera2D.top = h;
    camera2D.bottom = -h;
    camera2D.updateProjectionMatrix();
    camera2D.position.set(playerPos.x, playerPos.y + 48, playerPos.z);
    camera2D.lookAt(playerPos.x, playerPos.y, playerPos.z);
    applyCameraShake();
    return;
  }

  if (firstPerson) {
    const headY = playerPos.y + 1.15;
    const dx = Math.sin(camYaw) * Math.cos(camPitch);
    const dy = Math.sin(camPitch);
    const dz = Math.cos(camYaw) * Math.cos(camPitch);
    camera.position.copy(playerPos).add(new THREE.Vector3(0, 1.15, 0));
    const lookAt = v1.copy(camera.position).add(new THREE.Vector3(dx, dy, dz));
    camera.lookAt(lookAt);
    if (camera.fov !== Math.min(90, camSettings.fov + 12)) {
      camera.fov = Math.min(90, camSettings.fov + 12);
      camera.updateProjectionMatrix();
    }
    applyCameraShake();
    return;
  }

  const dist = isometric ? 22 : (isometricAngled ? 18 : camSettings.cameraDistance);
  const height = isometric ? 28 : (isometricAngled ? 14 : camSettings.cameraHeight);
  const pitch = isometric ? -1.32 : (isometricAngled ? -0.55 : camPitch);
  const yaw = isometricAngled ? camYaw + 0.785 : camYaw;
  const offset = new THREE.Vector3(
    -Math.sin(yaw) * dist * Math.cos(pitch),
    height + Math.sin(pitch) * 4.0,
    -Math.cos(yaw) * dist * Math.cos(pitch)
  );
  const desired = v1.copy(playerPos).add(new THREE.Vector3(0, 0.6, 0)).add(offset);
  const smooth = paused ? 0.15 : 0.28;
  camera.position.x += (desired.x - camera.position.x) * smooth;
  camera.position.y += (desired.y - camera.position.y) * (smooth * 0.9);
  camera.position.z += (desired.z - camera.position.z) * smooth;
  if (camera.fov !== camSettings.fov) {
    camera.fov = camSettings.fov;
    camera.updateProjectionMatrix();
  }
  const lookPoint = v2.copy(playerPos).add(new THREE.Vector3(0, isometric ? 0.3 : (isometricAngled ? 0.5 : 1.1), 0));
  camera.lookAt(lookPoint);
  applyCameraShake();
}

function updateHud() {
  state.bossMusicActive = !!(running && !gameOver && enemies.length > 0 && enemies.some((e) => e.isBoss));
  const hpPct = clamp(stats.hp / stats.maxHp, 0, 1);
  if (hpFill) hpFill.style.width = `${(hpPct * 100).toFixed(2)}%`;
  if (hpText) hpText.textContent = `${Math.floor(stats.hp)} / ${Math.floor(stats.maxHp)}`;
  const sh = stats.shield || 0;
  const shieldWrapEl = document.getElementById("shieldWrap");
  if (shieldWrapEl) shieldWrapEl.style.display = sh > 0 ? "" : "none";
  if (sh > 0 && shieldFill) {
    const maxSh = Math.max(sh, stats.maxHp);
    shieldFill.style.width = `${(clamp(sh / maxSh, 0, 1) * 100).toFixed(2)}%`;
    if (shieldText) shieldText.textContent = `${Math.floor(sh)}`;
  }
  // Mana bar
  const manaFill = document.getElementById("manaFill");
  const manaText = document.getElementById("manaText");
  if (manaFill) manaFill.style.width = `${(clamp(state.mana / state.maxMana, 0, 1) * 100).toFixed(1)}%`;
  if (manaText) manaText.textContent = `${Math.floor(state.mana)} / ${Math.floor(state.maxMana)}`;
  // Bottom XP bar
  const xpPct = clamp(state.xp / state.xpNext, 0, 1);
  const xpBarFill = document.getElementById("xpBarBottomFill");
  const xpBarText = document.getElementById("xpBarBottomText");
  if (xpBarFill) xpBarFill.style.width = `${(xpPct * 100).toFixed(1)}%`;
  if (xpBarText) xpBarText.textContent = `Lvl ${state.level} \u2022 ${Math.floor(state.xp)} / ${state.xpNext} XP \u2022 ${state.xpNext - Math.floor(state.xp)} kaldi`;
  if (xpFill) xpFill.style.width = `${(xpPct * 100).toFixed(2)}%`;
  if (levelChip) levelChip.textContent = `Lvl ${state.level}`;
  if (killChip) killChip.textContent = (state.endlessMode ? `Kill ${state.kills}` : `Kill ${state.kills}`) + ((state.killCombo || 0) >= 2 ? ` | x${state.killCombo} COMBO` : "");
  if (timeChip) timeChip.textContent = state.endlessMode ? formatTime(state.endlessTime) + " S" : formatTime(state.time);
  const topCenterTime = document.getElementById("topCenterTime");
  if (topCenterTime) topCenterTime.textContent = state.endlessMode ? formatTime(state.endlessTime) + " S" : formatTime(state.time);

  const activeEffectsBar = document.getElementById("activeEffectsBar");
  if (activeEffectsBar) {
    const t = state.time || 0;
    const effects = [];
    if (state.bonusTime && state.bonusTimeEnd) {
      const left = Math.max(0, state.bonusTimeEnd - t);
      effects.push({ name: "BONUS", icon: "\u2728", sec: left, color: "#ffdd44" });
    }
    if (state.rageUntil && t < state.rageUntil) {
      effects.push({ name: "Rage", icon: "\uD83D\uDD25", sec: state.rageUntil - t, color: "#ff6644" });
    }
    if (state._bloodlustUntil && t < state._bloodlustUntil) {
      effects.push({ name: "Bloodlust", icon: "\uD83E\uDDE8", sec: state._bloodlustUntil - t, color: "#cc2244" });
    }
    if (state.doublePointsUntil && t < state.doublePointsUntil) {
      effects.push({ name: "2X XP", icon: "\u2728", sec: state.doublePointsUntil - t, color: "#ffdd44" });
    }
    if (state.instaKillUntil && t < state.instaKillUntil) {
      effects.push({ name: "Insta Kill", icon: "\u2620", sec: state.instaKillUntil - t, color: "#ff2222" });
    }
    if (state.magnetBurstUntil && t < state.magnetBurstUntil) {
      effects.push({ name: "Magnet", icon: "\uD83E\uDDF2", sec: state.magnetBurstUntil - t, color: "#63e0ff" });
    }
    if (state.dodgeUntil && t < state.dodgeUntil) {
      effects.push({ name: "Dodge", icon: "\u26A1", sec: state.dodgeUntil - t, color: "#aaccff" });
    }
    if (state.slowmoUntil && t < state.slowmoUntil) {
      effects.push({ name: "Ağır çekim", icon: "\u23F1", sec: state.slowmoUntil - t, color: "#ffcc00" });
    }
    activeEffectsBar.innerHTML = effects.length
      ? effects.map((e) => `<span class="activeEffectChip" style="border-color:${e.color}60"><span class="effectIcon" aria-hidden="true">${e.icon}</span><span>${e.name}</span><span class="effectTime">${e.sec.toFixed(1)}s</span></span>`).join("")
      : "";
    activeEffectsBar.style.display = effects.length ? "flex" : "none";
  }

  if (stageChip) stageChip.textContent = (state.endlessMode ? `Dalga ${state.endlessWave}` : `Bolum ${state.chapter}`) + " | Portal " + (state.portalsEntered || 0) + "/3" + (state.hardcoreMode ? " | HARDCORE x4" : "");
  const coinChip = document.getElementById("coinChip");
  if (coinChip) coinChip.textContent = `${state.coins} Coin`;

  const auraListEl = document.getElementById("auraList");
  if (auraListEl) {
    const auras = [];
    if ((stats.heraldOfThunder || 0) > 0) auras.push({ name: "Herald of Thunder", count: state.auraTriggers?.thunder || 0, color: "#4488ff" });
    if ((stats.heraldOfIce || 0) > 0) auras.push({ name: "Herald of Ice", count: state.auraTriggers?.ice || 0, color: "#66bbff" });
    if ((stats.heraldOfAsh || 0) > 0) auras.push({ name: "Herald of Ash", count: state.auraTriggers?.ash || 0, color: "#ff6622" });
    auraListEl.innerHTML = auras.length
      ? "<div class=\"auraTitle\">AURALAR</div>" + auras.map((a) => `<div class=\"auraItem\" style=\"color:${a.color}\">${a.name} <span class=\"auraCount\">${a.count}</span></div>`).join("")
      : "";
    auraListEl.style.display = auras.length ? "" : "none";
  }

  const bosses = enemies.filter((e) => e.isBoss);
  const bossBarListEl = document.getElementById("bossBarList");
  if (bossBarWrap && bossBarListEl) {
    if (bosses.length > 0) {
      bossBarWrap.classList.remove("hidden");
      const currentIds = bosses.map((b) => b.barId);
      const existing = bossBarListEl.querySelectorAll("[data-boss-bar-id]");
      existing.forEach((el) => {
        const id = parseInt(el.getAttribute("data-boss-bar-id"), 10);
        if (currentIds.indexOf(id) === -1) el.remove();
      });
      bosses.forEach((b) => {
        let inner = bossBarListEl.querySelector(`[data-boss-bar-id="${b.barId}"]`);
        if (!inner) {
          inner = document.createElement("div");
          inner.className = "bossBarInner";
          inner.setAttribute("data-boss-bar-id", String(b.barId));
          inner.innerHTML = '<span class="bossBarName"></span><div class="bossBarTrack"><div class="bossBarFill"></div></div><span class="bossBarHp"></span>';
          bossBarListEl.appendChild(inner);
        }
        const nameEl = inner.querySelector(".bossBarName");
        const fillEl = inner.querySelector(".bossBarFill");
        const hpEl = inner.querySelector(".bossBarHp");
        if (nameEl) nameEl.textContent = b.isVoidBoss ? "HARITA BOSU" : (b.isHerobrine ? "HEROBRINE" : (b.isAngel ? "ANGEL" : (b.isMegaBoss ? "MEGA BOSS" : `BOSS ${(b.bossIndex || 0) + 1} - ${b.name || "Boss"}`)));
        if (b.isHerobrine) inner.setAttribute("data-herobrine", "1"); else inner.removeAttribute("data-herobrine");
        if (b.isAngel) inner.setAttribute("data-angel", "1"); else inner.removeAttribute("data-angel");
        const pct = Math.max(0, b.hp / b.maxHp);
        if (fillEl) fillEl.style.width = `${(pct * 100).toFixed(1)}%`;
        if (hpEl) hpEl.textContent = `${Math.floor(b.hp)} / ${Math.floor(b.maxHp)}`;
      });
    } else {
      bossBarWrap.classList.add("hidden");
      if (bossBarListEl) bossBarListEl.innerHTML = "";
    }
  }
  const bhopStr = bhop.streak > 1 ? ` | BHOP x${bhop.streak} (+${bhop.speedBonus.toFixed(1)})` : "";
  const rageStr = state.rageUntil && state.time < state.rageUntil ? " | RAGE!" : ` | Rage ${Math.floor(state.rageMeter || 0)}%`;
  const magnetStr = state.magnetBurstUntil && state.time < state.magnetBurstUntil ? " | MAGNET!" : ((state.magnetBurstCd || 0) > 0 ? ` | G ${(state.magnetBurstCd || 0).toFixed(0)}s` : " | [G] hazir");
  const lv = state.level || 1;
  const effectiveFireRate = stats.fireRate * (3.4 - 2.4 * Math.min(1, lv / 14));
  statsText.textContent = `DMG ${stats.damage.toFixed(1)}  FR ${(1 / effectiveFireRate).toFixed(1)}/s  MS ${(stats.moveSpeed + bhop.speedBonus).toFixed(1)}  Magnet ${stats.magnetRange.toFixed(1)}${bhopStr}${rageStr}${magnetStr}`;
  if (player.mesh && player.healthBar) updateHpBar(player.healthBar, stats.hp, stats.maxHp);
  if (player.mesh && player.shieldRing) {
    player.shieldRing.visible = (stats.shield || 0) > 0;
    if (player.shieldRing.visible && player.shieldRing.material.opacity !== undefined)
      player.shieldRing.material.opacity = 0.35 + Math.min(0.25, (stats.shield || 0) / 200);
  }
  if (player.mesh && player.shieldBubble) {
    player.shieldBubble.visible = (stats.shield || 0) > 0;
    if (player.shieldBubble.visible && player.shieldBubble.material.opacity !== undefined)
      player.shieldBubble.material.opacity = 0.28 + Math.min(0.2, (stats.shield || 0) / 250);
  }
  const reloadWrap = document.getElementById("reloadAmmoWrap");
  if (reloadWrap) {
    reloadWrap.style.display = state.reloadWeaponUnlocked ? "" : "none";
    if (state.reloadWeaponUnlocked) {
      const ammoEl = document.getElementById("reloadAmmoText");
      if (ammoEl) ammoEl.textContent = state.reloadTimer > 0 ? "Yeniden..." : `${state.reloadAmmo || 0}/${state.reloadMax || 4}`;
      const reloadBar = document.getElementById("reloadBarFill");
      if (reloadBar) reloadBar.style.width = state.reloadTimer > 0 && state.reloadDuration ? `${(1 - state.reloadTimer / state.reloadDuration) * 100}%` : "0%";
    }
  }
  updateSkillHud();
  updateSkillBar();
  updateAcquiredSkillsIcons();
  updatePassiveSkillsLeft();
  const chestNearEl = document.getElementById("chestNearHint");
  if (chestNearEl) {
    if (state.nearWorldChest && !chestPanelOpen) {
      chestNearEl.classList.remove("hidden");
      chestNearEl.classList.add("visible");
      chestNearEl.textContent = "F - Ac";
      const wc = state.nearWorldChest;
      const v = wc.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0));
      v.project(camera);
      const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
      chestNearEl.style.left = sx + "px";
      chestNearEl.style.top = sy + "px";
      chestNearEl.style.bottom = "auto";
      chestNearEl.style.transform = "translate(-50%, -50%)";
    } else {
      chestNearEl.classList.add("hidden");
      chestNearEl.classList.remove("visible");
      chestNearEl.style.left = "";
      chestNearEl.style.top = "";
      chestNearEl.style.bottom = "";
      chestNearEl.style.transform = "";
    }
  }
  if (state.quests && state.quests.length && _perfFrame % 4 === 0) {
    state.quests.forEach(function(q) {
      if (q.claimed) return;
      if (q.type === "kills") q.progress = Math.min(q.target, state.kills || 0);
      if (q.type === "bosses") q.progress = Math.min(q.target, state.bossesDefeated || 0);
      if (q.type === "coins") q.progress = Math.min(q.target, state.coins || 0);
    });
    saveQuests();
  }
}

const SKILL_STRIP_ICONS = {
  fireball: "\uD83D\uDD25", frostball: "\u2744", comet: "\u2604", swords: "\u2694", meteor: "\uD83C\uDF0C",
  nova: "\u2728", banana: "\uD83C\uDF4C", swordThrow: "\uD83D\uDDE1", boomerang: "\uD83E\uDE83", shuriken: "\u2725",
  bomb: "\uD83D\uDCA3", lineShot: "\u2192", laser: "\uD83D\uDCA1", frostNova: "\u2744", dash: "\u26A1",
  meteorUlt: "\uD83C\uDF0C", explosion: "\uD83D\uDCA5"
};

function updateAcquiredSkillsIcons() {
  const el = document.getElementById("acquiredSkillsIcons");
  if (!el) return;
  const items = [];
  const push = (key, state, icon) => {
    if (!state || (state.level || 0) <= 0) return;
    const cd = state.cooldown || 1;
    const timer = (state.timer || 0);
    const pct = timer > 0 ? 1 - timer / cd : 0;
    items.push({ key, icon: icon || SKILL_STRIP_ICONS[key] || "\u2726", pct, onCd: timer > 0 });
  };
  push("fireball", abilityState.fireball);
  push("frostball", abilityState.frostball);
  push("comet", abilityState.comet);
  push("swords", abilityState.swords);
  push("meteor", abilityState.meteor);
  push("nova", abilityState.nova);
  push("banana", abilityState.banana);
  push("swordThrow", abilityState.swordThrow);
  push("boomerang", abilityState.boomerang);
  push("shuriken", abilityState.shuriken);
  push("bomb", abilityState.bomb);
  push("lineShot", abilityState.lineShot);
  push("laser", abilityState.laser);
  if (specialUnlocks.frostNova) items.push({ key: "frostNova", icon: "\u2744", pct: specialState.frostNova.timer > 0 ? 1 - specialState.frostNova.timer / specialState.frostNova.cd : 0, onCd: specialState.frostNova.timer > 0 });
  if (specialUnlocks.dash) items.push({ key: "dash", icon: "\u26A1", pct: specialState.dash.timer > 0 ? 1 - specialState.dash.timer / specialState.dash.cd : 0, onCd: specialState.dash.timer > 0 });
  if (specialUnlocks.meteorUlt) items.push({ key: "meteorUlt", icon: "\uD83C\uDF0C", pct: specialState.meteorUlt.timer > 0 ? 1 - specialState.meteorUlt.timer / specialState.meteorUlt.cd : 0, onCd: specialState.meteorUlt.timer > 0 });
  if (specialUnlocks.explosion) items.push({ key: "explosion", icon: "\uD83D\uDCA5", pct: specialState.explosion.timer > 0 ? 1 - specialState.explosion.timer / specialState.explosion.cd : 0, onCd: specialState.explosion.timer > 0 });
  el.innerHTML = items.map((s) => `<div class="skillIconWrap skillStripIcon ${s.onCd ? "onCd" : ""}" title="${s.key}"><span class="skillStripEmoji">${s.icon}</span><div class="skillStripCd" style="height:${((1 - s.pct) * 100).toFixed(0)}%"></div></div>`).join("");
  el.style.display = items.length ? "flex" : "none";
}

function updatePassiveSkillsLeft() {
  const el = document.getElementById("passiveSkillsLeft");
  if (!el) return;
  const abilityIds = new Set(["fireball", "comet", "swords", "meteor", "nova", "unlock_banana", "unlock_sword_throw", "unlock_boomerang", "unlock_shuriken", "unlock_frostball", "unlock_line_shot", "unlock_laser", "unlock_dismantle", "unlock_gorilla_aura", "unlock_flicker_strike", "unlock_saturn_rings", "unlock_herald_thunder", "unlock_herald_ice", "unlock_herald_ash"]);
  const ordered = acquiredOrder.filter((id) => !abilityIds.has(id));
  const passives = [];
  for (let i = ordered.length - 1; i >= 0 && passives.length < 14; i--) {
    const id = ordered[i];
    const lvl = skillLevels[id] || 0;
    if (lvl <= 0) continue;
    const meta = skillLookup[id] || { name: id, rarity: "common" };
    passives.push({ name: meta.name, lvl, rarity: meta.rarity });
  }
  passives.reverse();
  el.innerHTML = passives.length
    ? "<div class=\"passiveSkillLabel\">PASIF</div>" + passives.map((s) => `<div class="passiveSkillItem"><span>${s.name}</span><span class="rarity">Lv${s.lvl}</span></div>`).join("")
    : "";
  el.style.display = "none";
}

function updateSkillHud() {
  if (!activeSkillsEl || !passiveSkillsEl) return;
  const actives = [];
  const passives = [];

  const pushActive = (id, lvl) => {
    const meta = skillLookup[id] || { name: id, rarity: "common" };
    actives.push({ name: meta.name, lvl, rarity: meta.rarity });
  };

  if (abilityState.fireball.level > 0) {
    pushActive("fireball", abilityState.fireball.level);
    if (abilityState.fireball.evolved) actives[actives.length - 1].name = evolvedSkillName("fireball", "Fireball");
  }
  if (abilityState.comet.level > 0) pushActive("comet", abilityState.comet.level);
  if (abilityState.swords.level > 0) {
    pushActive("swords", abilityState.swords.count);
    if (abilityState.swords.evolved) actives[actives.length - 1].name = evolvedSkillName("swords", "Kiliclar");
  }
  if (abilityState.meteor.level > 0) pushActive("meteor", abilityState.meteor.level);
  if (abilityState.nova?.level > 0) pushActive("nova", abilityState.nova.level);
  if (abilityState.banana?.level > 0) pushActive("unlock_banana", abilityState.banana.level);
  if (abilityState.swordThrow?.level > 0) pushActive("unlock_sword_throw", abilityState.swordThrow.level);
  if (abilityState.boomerang?.level > 0) pushActive("unlock_boomerang", abilityState.boomerang.level);
  if (abilityState.shuriken?.level > 0) pushActive("unlock_shuriken", abilityState.shuriken.count || 3);
  if (abilityState.frostball?.level > 0) {
    pushActive("unlock_frostball", abilityState.frostball.level);
    if (abilityState.frostball.evolved) actives[actives.length - 1].name = evolvedSkillName("frostball", "Frostball");
  }
  if (abilityState.lineShot?.level > 0) pushActive("unlock_line_shot", abilityState.lineShot.level);
  if (abilityState.laser?.level > 0) pushActive("unlock_laser", abilityState.laser.level);
  if (abilityState.dismantle?.level > 0) pushActive("unlock_dismantle", abilityState.dismantle.level);
  if (abilityState.gorillaAura?.level > 0) pushActive("unlock_gorilla_aura", abilityState.gorillaAura.level);
  if (abilityState.flickerStrike?.level > 0) pushActive("unlock_flicker_strike", abilityState.flickerStrike.level);
  if (abilityState.saturnRings?.level > 0) pushActive("unlock_saturn_rings", abilityState.saturnRings.level);
  if ((stats.heraldOfThunder || 0) > 0) pushActive("unlock_herald_thunder", stats.heraldOfThunder);
  if ((stats.heraldOfIce || 0) > 0) pushActive("unlock_herald_ice", stats.heraldOfIce);
  if ((stats.heraldOfAsh || 0) > 0) pushActive("unlock_herald_ash", stats.heraldOfAsh);
  if (typeof companions !== "undefined") companions.forEach((c) => pushActive("comp_" + c.kind, c.level || 1));
  const seen = new Set(["fireball", "comet", "swords", "meteor", "nova", "unlock_banana", "unlock_sword_throw", "unlock_boomerang", "unlock_shuriken", "unlock_frostball", "unlock_line_shot", "unlock_laser", "unlock_dismantle", "unlock_gorilla_aura", "unlock_flicker_strike", "unlock_saturn_rings", "unlock_herald_thunder", "unlock_herald_ice", "unlock_herald_ash"]);

  const ordered = acquiredOrder.filter((id) => !seen.has(id));
  for (let i = ordered.length - 1; i >= 0; i--) {
    const id = ordered[i];
    const lvl = skillLevels[id] || 0;
    if (lvl <= 0) continue;
    const meta = skillLookup[id] || { name: id, rarity: "common" };
    passives.push({ name: meta.name, lvl, rarity: meta.rarity });
    if (passives.length >= 5) break;
  }

  activeSkillsEl.innerHTML = actives.length
    ? actives.map((s) => `<div class="skillItem"><span>${s.name}</span><span class="rarity">${s.rarity.toUpperCase()} \u2022 Lv${s.lvl}</span></div>`).join("")
    : `<div class="skillItem"><span>Skill yok</span></div>`;

  passiveSkillsEl.innerHTML = passives.length
    ? passives.map((s) => `<div class="skillItem"><span>${s.name}</span><span class="rarity">${s.rarity.toUpperCase()} \u2022 Lv${s.lvl}</span></div>`).join("")
    : `<div class="skillItem"><span>Pasif yok</span></div>`;

  if (skillsHud) skillsHud.style.display = (running && !gameOver && (actives.length || passives.length)) ? "" : "none";
}

function updateTabPanel() {
  const skillsEl = document.getElementById("tabPanelSkills");
  const statsEl = document.getElementById("tabPanelStats");
  if (!skillsEl || !statsEl) return;
  const actives = [];
  const pushActive = (id, lvl) => {
    const meta = skillLookup[id] || { name: id, rarity: "common" };
    actives.push({ name: meta.name, lvl, rarity: meta.rarity });
  };
  if (abilityState.fireball?.level > 0) {
    pushActive("fireball", abilityState.fireball.level);
    if (abilityState.fireball.evolved) actives[actives.length - 1].name = evolvedSkillName("fireball", "Fireball");
  }
  if (abilityState.comet?.level > 0) pushActive("comet", abilityState.comet.level);
  if (abilityState.swords?.level > 0) {
    pushActive("swords", abilityState.swords.count);
    if (abilityState.swords.evolved) actives[actives.length - 1].name = evolvedSkillName("swords", "Kiliclar");
  }
  if (abilityState.meteor?.level > 0) pushActive("meteor", abilityState.meteor.level);
  if (abilityState.nova?.level > 0) pushActive("nova", abilityState.nova.level);
  if (abilityState.banana?.level > 0) pushActive("Muz", abilityState.banana.level);
  if (abilityState.swordThrow?.level > 0) pushActive("Kilic Firlatma", abilityState.swordThrow.level);
  if (abilityState.boomerang?.level > 0) pushActive("Bumerang", abilityState.boomerang.level);
  if (abilityState.shuriken?.level > 0) pushActive("Shuriken", abilityState.shuriken.count || 3);
  if (abilityState.frostball?.level > 0) {
    pushActive("Frostball", abilityState.frostball.level);
    if (abilityState.frostball.evolved) actives[actives.length - 1].name = evolvedSkillName("frostball", "Frostball");
  }
  if (abilityState.lineShot?.level > 0) pushActive("Line Shot", abilityState.lineShot.level);
  if (abilityState.laser?.level > 0) pushActive("Lazer", abilityState.laser.level);
  if (abilityState.dismantle?.level > 0) pushActive("Dismantle", abilityState.dismantle.level);
  if (abilityState.gorillaAura?.level > 0) pushActive("Goril Aura", abilityState.gorillaAura.level);
  if (abilityState.flickerStrike?.level > 0) pushActive("Flicker Strike", abilityState.flickerStrike.level);
  if (abilityState.saturnRings?.level > 0) pushActive("Saturn Halkalari", abilityState.saturnRings.level);
  if ((stats.heraldOfThunder || 0) > 0) pushActive("Herald of Thunder", stats.heraldOfThunder);
  if ((stats.heraldOfIce || 0) > 0) pushActive("Herald of Ice", stats.heraldOfIce);
  if ((stats.heraldOfAsh || 0) > 0) pushActive("Herald of Ash", stats.heraldOfAsh);
  if (typeof companions !== "undefined") companions.forEach((c) => pushActive("comp_" + c.kind, c.level || 1));
  const seen = new Set(["fireball", "comet", "swords", "meteor", "nova", "unlock_banana", "unlock_sword_throw", "unlock_boomerang", "unlock_shuriken", "unlock_frostball", "unlock_line_shot", "unlock_laser", "unlock_dismantle", "unlock_gorilla_aura", "unlock_flicker_strike", "unlock_saturn_rings", "unlock_herald_thunder", "unlock_herald_ice", "unlock_herald_ash"]);
  const passives = acquiredOrder.filter((id) => !seen.has(id)).slice(-20).map((id) => ({ name: (skillLookup[id] && skillLookup[id].name) || id, lvl: skillLevels[id] || 1, rarity: (skillLookup[id] && skillLookup[id].rarity) || "common" }));
  skillsEl.innerHTML = "<div class=\"tabPanelSection\"><strong>Aktif & Minyonlar</strong></div>" + (actives.length ? actives.map((s) => `<div class="tabPanelRow"><span>${s.name}</span><span class="tabPanelLvl">Lv${s.lvl}</span></div>`).join("") : "<div class=\"tabPanelRow\">-</div>") + "<div class=\"tabPanelSection\"><strong>Pasif / Buff</strong></div>" + (passives.length ? passives.map((s) => `<div class="tabPanelRow"><span>${s.name}</span><span class="tabPanelLvl">Lv${s.lvl}</span></div>`).join("") : "<div class=\"tabPanelRow\">-</div>");
  statsEl.innerHTML = `
    <div class="tabPanelStatRow">HP ${Math.floor(stats.hp)} / ${Math.floor(stats.maxHp)}</div>
    <div class="tabPanelStatRow">Kalkan ${Math.floor(stats.shield || 0)}</div>
    <div class="tabPanelStatRow">Hasar ${stats.damage.toFixed(1)}</div>
    <div class="tabPanelStatRow">Atis/s ${(1/stats.fireRate).toFixed(1)}</div>
    <div class="tabPanelStatRow">Hiz ${stats.moveSpeed.toFixed(1)}</div>
    <div class="tabPanelStatRow">Krit %${Math.min(100, Math.round((stats.critChance||0)*100))} | x${(stats.critMult||1.9).toFixed(1)}</div>
    <div class="tabPanelStatRow">Magnet ${stats.magnetRange.toFixed(1)}</div>
    <div class="tabPanelStatRow">Toplama ${stats.pickupRange.toFixed(1)}</div>
    <div class="tabPanelStatRow">Zirh %${((stats.armor||0)*100).toFixed(0)}</div>
    <div class="tabPanelStatRow">Vampir %${((stats.lifesteal||0)*100).toFixed(0)}</div>
    <div class="tabPanelStatRow">XP kazanc x${(stats.xpGainMult||1).toFixed(2)}</div>
    <div class="tabPanelStatRow">Proj. hiz ${(stats.projectileSpeed * (stats.projectileSpeedMult||1)).toFixed(1)}</div>
    <div class="tabPanelStatRow">Turret ${placeableTurrets.length} / ${stats.maxTurrets||1}</div>
  `.trim();
}

function updateSkillBar() {
  if (!skillBarEl) return;
  const slotE = skillBarEl.querySelector('[data-key="e"]');
  const slotR = skillBarEl.querySelector('[data-key="r"]');
  const slotT = skillBarEl.querySelector('[data-key="t"]');
  if (slotE) {
    slotE.style.display = specialUnlocks.frostNova ? "" : "none";
    if (specialUnlocks.frostNova && cdEFill) {
      const fn = specialState.frostNova;
      const pctE = fn.timer > 0 ? 1 - fn.timer / fn.cd : 1;
      cdEFill.style.transform = `scaleX(${pctE})`;
      if (cdEText) cdEText.textContent = fn.timer > 0 ? fn.timer.toFixed(1) : "";
      slotE.classList.toggle("onCd", fn.timer > 0);
    }
  }
  if (slotR) {
    slotR.style.display = specialUnlocks.dash ? "" : "none";
    if (specialUnlocks.dash && cdRFill) {
      const dash = specialState.dash;
      const pctR = dash.timer > 0 ? 1 - dash.timer / dash.cd : 1;
      cdRFill.style.transform = `scaleX(${pctR})`;
      if (cdRText) cdRText.textContent = dash.timer > 0 ? dash.timer.toFixed(1) : "";
      slotR.classList.toggle("onCd", dash.timer > 0);
    }
  }
  if (slotT) {
    slotT.style.display = specialUnlocks.meteorUlt ? "" : "none";
    if (specialUnlocks.meteorUlt && cdTFill) {
      const met = specialState.meteorUlt;
      const pctT = met.timer > 0 ? 1 - met.timer / met.cd : 1;
      cdTFill.style.transform = `scaleX(${pctT})`;
      if (cdTText) cdTText.textContent = met.timer > 0 ? met.timer.toFixed(1) : "";
      slotT.classList.toggle("onCd", met.timer > 0);
    }
  }
  const slotX = skillBarEl.querySelector('[data-key="x"]');
  if (slotX) {
    slotX.style.display = specialUnlocks.explosion ? "" : "none";
    if (specialUnlocks.explosion && cdXFill) {
      const exp = specialState.explosion;
      const pctX = exp.timer > 0 ? 1 - exp.timer / exp.cd : 1;
      cdXFill.style.transform = `scaleX(${pctX})`;
      if (cdXText) cdXText.textContent = exp.timer > 0 ? exp.timer.toFixed(1) : "";
      slotX.classList.toggle("onCd", exp.timer > 0);
    }
  }
  const slotY = skillBarEl.querySelector('[data-key="y"]');
  if (slotY) {
    slotY.style.display = stateUltimate ? "" : "none";
    if (stateUltimate && cdYFill) {
      const pctY = stateUltimate.timer > 0 ? 1 - stateUltimate.timer / stateUltimate.cooldown : 1;
      cdYFill.style.transform = `scaleX(${pctY})`;
      if (cdYText) {
        if (stateUltimate.timer > 0) {
          const m = Math.floor(stateUltimate.timer / 60);
          const s = Math.floor(stateUltimate.timer % 60);
          cdYText.textContent = `${m}:${String(s).padStart(2, "0")}`;
        } else cdYText.textContent = "HAZIR";
      }
      slotY.classList.toggle("onCd", stateUltimate.timer > 0);
      if (ultSkillNameEl && ULT_DEFS[stateUltimate.id]) ultSkillNameEl.textContent = ULT_DEFS[stateUltimate.id].name;
    }
  }
  const hasAny = specialUnlocks.frostNova || specialUnlocks.dash || specialUnlocks.meteorUlt || specialUnlocks.explosion || stateUltimate;
  const showBar = running && !gameOver && !paused && hasAny;
  skillBarEl.style.display = showBar ? "" : "none";
  if (showBar) skillBarEl.classList.remove("hidden"); else skillBarEl.classList.add("hidden");
}

function drawMinimap() {
  if (!minimapCtx || !player.mesh) return;
  const w = minimap.width;
  const h = minimap.height;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const range = 200;
  const scale = (w * 0.5) / range;

  minimapCtx.clearRect(0, 0, w, h);
  minimapCtx.fillStyle = "rgba(8,15,22,0.9)";
  minimapCtx.fillRect(0, 0, w, h);
  minimapCtx.strokeStyle = "rgba(255,255,255,0.15)";
  minimapCtx.strokeRect(1.5, 1.5, w - 3, h - 3);

  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  const maxOrbsDraw = 28;
  const maxEnemiesDraw = 20;

  for (let i = 0; i < Math.min(xpOrbs.length, maxOrbsDraw); i++) {
    const p = xpOrbs[i].mesh.position;
    const dx = (p.x - px) * scale;
    const dz = (p.z - pz) * scale;
    if (Math.abs(dx) > cx - 2 || Math.abs(dz) > cy - 2) continue;
    minimapCtx.fillStyle = "#9eff7d";
    minimapCtx.fillRect(cx + dx - 1, cy + dz - 1, 2, 2);
  }

  for (let i = 0; i < Math.min(enemies.length, maxEnemiesDraw); i++) {
    const e = enemies[i];
    const dx = (e.mesh.position.x - px) * scale;
    const dz = (e.mesh.position.z - pz) * scale;
    if (Math.abs(dx) > cx - 2 || Math.abs(dz) > cy - 2) continue;
    let color = "#ff5f68";
    let size = 3;
    if (e.tier === "magic") color = "#6fdfff";
    if (e.tier === "rare") color = "#ffd37f";
    if (e.tier === "unique") { color = "#ff9cff"; size = 5; }
    if (e.isBoss) { color = "#ff3046"; size = 7; }
    minimapCtx.fillStyle = color;
    minimapCtx.fillRect(cx + dx - size * 0.5, cy + dz - size * 0.5, size, size);
  }

  for (let i = 0; i < shrineGroups.length; i++) {
    const s = shrineGroups[i];
    if (s.userData?.used) continue;
    const dx = (s.position.x - px) * scale;
    const dz = (s.position.z - pz) * scale;
    if (Math.abs(dx) > cx - 2 || Math.abs(dz) > cy - 2) continue;
    minimapCtx.fillStyle = "#ffe890";
    minimapCtx.beginPath();
    minimapCtx.arc(cx + dx, cy + dz, 4, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  for (let i = 0; i < placeableTurrets.length; i++) {
    const t = placeableTurrets[i];
    const dx = (t.mesh.position.x - px) * scale;
    const dz = (t.mesh.position.z - pz) * scale;
    if (Math.abs(dx) > cx - 2 || Math.abs(dz) > cy - 2) continue;
    minimapCtx.fillStyle = "#63e0ff";
    minimapCtx.beginPath();
    minimapCtx.arc(cx + dx, cy + dz, 3, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  if (state.portalActive && state.portalPos) {
    const pdx = (state.portalPos.x - px) * scale;
    const pdz = (state.portalPos.z - pz) * scale;
    if (Math.abs(pdx) <= cx - 2 && Math.abs(pdz) <= cy - 2) {
      minimapCtx.fillStyle = "#ff4444";
      minimapCtx.strokeStyle = "#ff0000";
      minimapCtx.lineWidth = 2;
      minimapCtx.beginPath();
      minimapCtx.arc(cx + pdx, cy + pdz, 7, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.stroke();
    }
  }

  function markPoi(wx, wz, color, size, edge) {
    const dx = (wx - px) * scale;
    const dz = (wz - pz) * scale;
    const maxX = cx - 6;
    const maxZ = cy - 6;
    const ox = Math.abs(dx) > maxX;
    const oz = Math.abs(dz) > maxZ;
    if (ox || oz) {
      if (!edge) return;
      const mx = clamp(dx, -maxX, maxX);
      const mz = clamp(dz, -maxZ, maxZ);
      minimapCtx.fillStyle = color;
      minimapCtx.beginPath();
      minimapCtx.moveTo(cx + mx, cy + mz);
      minimapCtx.lineTo(cx + mx - 4, cy + mz + 3);
      minimapCtx.lineTo(cx + mx + 4, cy + mz + 3);
      minimapCtx.closePath();
      minimapCtx.fill();
      return;
    }
    minimapCtx.fillStyle = color;
    minimapCtx.beginPath();
    minimapCtx.arc(cx + dx, cy + dz, size, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  for (let i = 0; i < VILLAGES.length; i++) markPoi(VILLAGES[i].x, VILLAGES[i].z, "#e8c070", 4, true);
  for (let i = 0; i < worldChests.length; i++) {
    if (worldChests[i] && !worldChests[i].opened && worldChests[i].mesh) markPoi(worldChests[i].mesh.position.x, worldChests[i].mesh.position.z, "#ffcc44", 3, true);
  }
  for (let i = 0; i < vendingMachines.length; i++) {
    const v = vendingMachines[i];
    if (v && v.position) markPoi(v.position.x, v.position.z, "#66ddaa", 3, true);
  }
  for (let i = 0; i < breaches.length; i++) {
    const b = breaches[i];
    if (b && b.center && b.phase !== "done") markPoi(b.center.x, b.center.z, "#cc44ff", 5, true);
  }
  for (let i = 0; i < abyssPits.length; i++) {
    const a = abyssPits[i];
    if (a && a.center && a.phase !== "done") markPoi(a.center.x, a.center.z, "#44ff88", 5, true);
  }
  for (let i = 0; i < rituals.length; i++) {
    const r = rituals[i];
    if (r && r.center && r.phase !== "done") markPoi(r.center.x, r.center.z, "#ff8844", 5, true);
  }
  if (hardcorePortalData && hardcorePortalData.pos) markPoi(hardcorePortalData.pos.x, hardcorePortalData.pos.z, "#ff2266", 5, true);
  for (let i = 0; i < parkourRewards.length; i++) {
    const r = parkourRewards[i];
    if (r && !r.taken && r.mesh) markPoi(r.mesh.position.x, r.mesh.position.z, "#ffe066", 3, true);
  }

  minimapCtx.save();
  minimapCtx.translate(cx, cy);
  minimapCtx.rotate(-player.mesh.rotation.y);
  minimapCtx.fillStyle = "#ffffff";
  minimapCtx.beginPath();
  minimapCtx.moveTo(0, -6);
  minimapCtx.lineTo(4, 4);
  minimapCtx.lineTo(-4, 4);
  minimapCtx.closePath();
  minimapCtx.fill();
  minimapCtx.restore();
}

const LEADERBOARD_KEY = "ctb_leaderboard";
const PLAYER_NAME_KEY = "zegabong_player_name";
const LEADERBOARD_MAX = 20;
// Sunucu liderligi: "user_bilgisi/" gibi klasor yolu. Bos ise sadece localStorage kullanilir.
const LEADERBOARD_API_URL = "user_bilgisi/";

function getPlayerName() {
  try {
    return (localStorage.getItem(PLAYER_NAME_KEY) || "").trim() || "Oyuncu";
  } catch (e) { return "Oyuncu"; }
}

function saveLeaderboard() {
  try {
    const list = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    const name = getPlayerName();
    const score = (state.kills || 0) * 100 + Math.floor(state.time || 0);
    const entry = { name, kills: state.kills, time: state.time, date: Date.now(), score };
    list.push(entry);
    list.sort((a, b) => (b.score ?? (b.kills * 100 + Math.floor(b.time))) - (a.score ?? (a.kills * 100 + Math.floor(a.time))));
    const top = list.slice(0, LEADERBOARD_MAX);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top));
    const canFetchApi = typeof location !== "undefined" && (location.protocol === "http:" || location.protocol === "https:");
    if (LEADERBOARD_API_URL && canFetchApi) {
      fetch(LEADERBOARD_API_URL + "api.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, score, kills: state.kills, time: state.time }) }).catch(function() {});
    }
    const best = top[0] || {};
    return { kills: best.kills, time: best.time, score: best.score, list: top };
  } catch (e) { return { list: [] }; }
}

function getLeaderboardList() {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
  } catch (e) { return []; }
}

// === NPC INTERACTION ===
let npcShopOpen = false;
let currentNpc = null;
const NPC_SHOP_ITEMS = {
  Silahci: [
    { name: "Ates Kilici", cost: 30, effect: () => { stats.damage += 8; }, desc: "+8 Hasar" },
    { name: "Hiz Botlari", cost: 25, effect: () => { stats.moveSpeed += 1; }, desc: "+1 Hiz" },
    { name: "Zirh Parcasi", cost: 35, effect: () => { stats.maxHp += 30; stats.hp += 30; }, desc: "+30 Max HP" },
  ],
  Sifaci: [
    { name: "Can Iksiri", cost: 10, effect: () => { stats.hp = Math.min(stats.maxHp, stats.hp + 50); }, desc: "+50 Can" },
    { name: "Kalkan Buyusu", cost: 20, effect: () => { stats.shield = (stats.shield || 0) + 25; }, desc: "+25 Kalkan" },
    { name: "Mana Iksiri", cost: 15, effect: () => { state.mana = state.maxMana; }, desc: "Tam Mana" },
  ],
  Tezgahtar: [
    { name: "XP Amplifier", cost: 20, effect: () => { stats.xpGainMult = (stats.xpGainMult || 1) + 0.15; }, desc: "+15% XP" },
    { name: "Magnet Plus", cost: 15, effect: () => { stats.magnetRange += 4; }, desc: "+4 Magnet" },
    { name: "Crit Takviye", cost: 40, effect: () => { stats.critChance = Math.min(1, (stats.critChance || 0) + 0.08); }, desc: "+8% Krit Sans" },
  ],
  Buyucu: [
    { name: "Ates Topu+", cost: 50, effect: () => { stats.damage += 15; stats.aoe += 0.5; }, desc: "+15 Hasar, +0.5 AoE" },
    { name: "Pierce Buyusu", cost: 30, effect: () => { stats.pierce += 1; }, desc: "+1 Pierce" },
    { name: "Multishot", cost: 60, effect: () => { stats.multiShot += 1; }, desc: "+1 Multishot" },
  ],
};

function updateNpcInteraction(dt) {
  if (!running || gameOver || npcShopOpen) return;
  let nearNpc = null;
  for (const npc of npcMeshes) {
    const dist = Math.hypot(player.mesh.position.x - npc.position.x, player.mesh.position.z - npc.position.z);
    if (dist < 4) { nearNpc = npc; break; }
  }
  const hintEl = document.getElementById("npcHint");
  if (nearNpc) {
    if (!hintEl) {
      const h = document.createElement("div");
      h.id = "npcHint";
      h.style.cssText = "position:fixed;bottom:170px;left:50%;transform:translateX(-50%);padding:6px 16px;background:rgba(40,60,30,0.9);border:2px solid rgba(100,255,100,0.5);border-radius:2px;font-size:8px;font-family:var(--retro-font);color:#88ff88;pointer-events:none;z-index:10;";
      h.textContent = `E - ${nearNpc.userData.npcType} (${nearNpc.userData.village})`;
      document.getElementById("hud").appendChild(h);
    } else {
      hintEl.textContent = `E - ${nearNpc.userData.npcType} (${nearNpc.userData.village})`;
      hintEl.style.display = "block";
    }
    if (keys.e && !npcShopOpen) {
      keys.e = false;
      openNpcShop(nearNpc);
    }
  } else {
    if (hintEl) hintEl.style.display = "none";
  }
}

function openNpcShop(npc) {
  npcShopOpen = true;
  paused = true;
  currentNpc = npc;
  // Release pointer lock so mouse is free for clicking
  if (document.pointerLockElement) document.exitPointerLock();
  // Move camera to face the NPC
  const npcPos = npc.position.clone();
  const playerPos = player.mesh.position.clone();
  const dir = new THREE.Vector3().subVectors(npcPos, playerPos).normalize();
  const camOffset = dir.clone().multiplyScalar(-4).add(new THREE.Vector3(0, 3, 0));
  const targetCamPos = npcPos.clone().add(camOffset);
  camera.position.copy(targetCamPos);
  camera.lookAt(npcPos.clone().add(new THREE.Vector3(0, 1.5, 0)));
  
  const items = NPC_SHOP_ITEMS[npc.userData.npcType] || NPC_SHOP_ITEMS.Tezgahtar;
  if (!npc.userData.soldIndices) npc.userData.soldIndices = [];
  let html = `<div style="position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,0.7);z-index:100;pointer-events:auto;" id="npcShopOverlay">
    <div style="background:linear-gradient(180deg,rgba(10,18,28,0.96),rgba(4,8,14,0.94));border:2px solid rgba(100,255,100,0.3);border-radius:4px;padding:20px;min-width:300px;max-width:420px;">
      <h3 style="font-family:var(--retro-font);font-size:10px;color:#88ff88;text-align:center;margin-bottom:14px;">${npc.userData.npcType} - ${npc.userData.village}</h3>
      <p style="font-family:var(--retro-font);font-size:7px;color:#ffd700;text-align:center;margin-bottom:10px;">Coin: ${state.coins}</p>`;
  items.forEach((item, i) => {
    if (npc.userData.soldIndices.indexOf(i) !== -1) return;
    const canBuy = state.coins >= item.cost;
    html += `<div style="padding:8px;margin:6px 0;background:rgba(0,0,0,0.3);border:1px solid ${canBuy ? "rgba(255,215,0,0.4)" : "rgba(255,50,50,0.3)"};border-radius:3px;cursor:${canBuy ? "pointer" : "not-allowed"};opacity:${canBuy ? 1 : 0.5};" onclick="buyNpcItem(${i})" class="npcShopItem">
        <span style="font-family:var(--retro-font);font-size:8px;color:#fff;">${item.name}</span>
        <span style="font-family:var(--retro-font);font-size:7px;color:#ffd700;float:right;">${item.cost} Coin</span>
        <div style="font-family:var(--retro-font);font-size:6px;color:#aaa;margin-top:4px;">${item.desc}</div>
      </div>`;
  });
  html += `<button onclick="closeNpcShop()" style="display:block;margin:12px auto 0;padding:8px 20px;font-family:var(--retro-font);font-size:8px;background:rgba(255,100,100,0.2);border:2px solid rgba(255,100,100,0.4);color:#ff8888;border-radius:3px;cursor:pointer;">KAPAT</button>
    </div></div>`;
  const div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div.firstChild);
}

window.buyNpcItem = function(idx) {
  if (!currentNpc) return;
  if (!currentNpc.userData.soldIndices) currentNpc.userData.soldIndices = [];
  if (currentNpc.userData.soldIndices.indexOf(idx) !== -1) return;
  const items = NPC_SHOP_ITEMS[currentNpc.userData.npcType] || NPC_SHOP_ITEMS.Tezgahtar;
  const item = items[idx];
  if (!item || state.coins < item.cost) return;
  state.coins -= item.cost;
  currentNpc.userData.soldIndices.push(idx);
  item.effect();
  playSfx(660, 0.08);
  closeNpcShop();
};

window.closeNpcShop = function() {
  const el = document.getElementById("npcShopOverlay");
  if (el) el.remove();
  npcShopOpen = false;
  paused = false;
  currentNpc = null;
  // Re-lock pointer for gameplay
  try { canvas.requestPointerLock(); } catch (e) {}
};

// === DIFFICULTY ALTARS ===
function updateAltarInteraction(dt) {
  if (!running || gameOver) return;
  for (const altar of difficultyAltars) {
    if (altar.userData.used) continue;
    const dist = Math.hypot(player.mesh.position.x - altar.position.x, player.mesh.position.z - altar.position.z);
    if (dist < 3.5) {
      // Show hint
      let hintEl = document.getElementById("altarHint");
      if (!hintEl) {
        hintEl = document.createElement("div");
        hintEl.id = "altarHint";
        hintEl.style.cssText = "position:fixed;bottom:200px;left:50%;transform:translateX(-50%);padding:6px 16px;background:rgba(60,10,10,0.9);border:2px solid rgba(255,60,60,0.5);border-radius:2px;font-size:7px;font-family:var(--retro-font);color:#ff6666;pointer-events:none;z-index:10;";
        document.getElementById("hud").appendChild(hintEl);
      }
      hintEl.textContent = `E - Zorluk +5% (Odul +5%) [x${state.difficultyMult.toFixed(2)}]`;
      hintEl.style.display = "block";

      if (keys.e) {
        keys.e = false;
        altar.userData.used = true;
        state.difficultyMult += altar.userData.boost;
        altar.children.forEach(c => { if (c.material) { c.material.opacity = 0.3; c.material.emissiveIntensity = 0.1; } });
        const pct = Math.round((state.difficultyMult - 1) * 100);
        spawnDamageText(altar.position.clone().add(new THREE.Vector3(0, 3, 0)), "Zorluk artti! +5%", true);
        spawnDamageText(altar.position.clone().add(new THREE.Vector3(0, 4.5, 0)), "Toplam: " + pct + "%", false);
        showGameNotification("Oyun zorlugu %5 artti - Toplam: " + pct + "%");
        playSfx(180, 0.12, 0.55);
      }
    }
  }
  // Hide hint if not near any
  const hintEl = document.getElementById("altarHint");
  if (hintEl) {
    let near = false;
    for (const a of difficultyAltars) {
      if (a.userData.used) continue;
      if (Math.hypot(player.mesh.position.x - a.position.x, player.mesh.position.z - a.position.z) < 3.5) { near = true; break; }
    }
    if (!near) hintEl.style.display = "none";
  }
}

// === MANA SYSTEM ===
function updateMana(dt) {
  if (!running || gameOver) return;
  state.mana = Math.min(state.maxMana, state.mana + 3 * dt);
}

// === ENHANCED WEATHER SYSTEM ===
let weatherTimer = 0;
let activeWeatherEvent = null;
let weatherDuration = 0;
let poisonZone = null;
let lightningFlashEl = null;

function updateWeatherEvents(dt) {
  if (!running || gameOver) return;
  weatherTimer += dt;

  // Trigger random weather every 90-150 seconds (first event after 90s minimum)
  if (!activeWeatherEvent && weatherTimer > 90 + Math.random() * 60) {
    weatherTimer = 0;
    const events = ["lightning", "meteor_rain", "poison_zone"];
    activeWeatherEvent = events[Math.floor(Math.random() * events.length)];
    weatherDuration = 0;

    if (activeWeatherEvent === "lightning") {
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "SIMSEK FIRTINASI!", true, "SIMSEK FIRTINASI!");
    } else if (activeWeatherEvent === "meteor_rain") {
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "METEOR YAGMURU!", true, "METEOR YAGMURU!");
    } else if (activeWeatherEvent === "poison_zone") {
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "ZEHIRLI GAZ!", true, "ZEHIRLI GAZ!");
      // Create a shrinking safe zone
      const px = player.mesh.position.x + (Math.random() - 0.5) * 60;
      const pz = player.mesh.position.z + (Math.random() - 0.5) * 60;
      poisonZone = { cx: px, cz: pz, safeRadius: 80, shrinkRate: 3 };
    }
  }

  if (activeWeatherEvent) {
    weatherDuration += dt;

    if (activeWeatherEvent === "lightning" && weatherDuration < 12) {
      // Random lightning strikes
      if (Math.random() < dt * 1.5) {
        const lx = player.mesh.position.x + (Math.random() - 0.5) * 80;
        const lz = player.mesh.position.z + (Math.random() - 0.5) * 80;
        const ly = sampleTerrainHeight(lx, lz);
        // Flash
        if (!lightningFlashEl) {
          lightningFlashEl = document.getElementById("lightningFlash");
          if (!lightningFlashEl) {
            lightningFlashEl = document.createElement("div");
            lightningFlashEl.id = "lightningFlash";
            document.body.appendChild(lightningFlashEl);
          }
        }
        lightningFlashEl.classList.remove("flash");
        void lightningFlashEl.offsetWidth;
        lightningFlashEl.classList.add("flash");
        // Damage in area
        const strikePos = new THREE.Vector3(lx, ly, lz);
        radialDamageEnemies(strikePos, 5, 30 * (state.difficultyMult || 1));
        // Damage player if close
        const pd = Math.hypot(player.mesh.position.x - lx, player.mesh.position.z - lz);
        if (pd < 5 && (!state.invincibleUntil || state.time >= state.invincibleUntil)) {
          stats.hp -= 15;
          state.invincibleUntil = state.time + 0.22;
          triggerCameraShake();
        }
        spawnRing(strikePos, 5, 0xffff44, 0.3);
        playSfx(120, 0.2, 0.55);
        // Lightning bolt visual
        const boltMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.9 });
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 30, 4), boltMat);
        bolt.position.set(lx, ly + 15, lz);
        scene.add(bolt);
        setTimeout(() => scene.remove(bolt), 200);
      }
    } else if (activeWeatherEvent === "meteor_rain" && weatherDuration < 10) {
      // Random meteors falling
      if (Math.random() < dt * 2) {
        const mx = player.mesh.position.x + (Math.random() - 0.5) * 100;
        const mz = player.mesh.position.z + (Math.random() - 0.5) * 100;
        const targetPos = new THREE.Vector3(mx, sampleTerrainHeight(mx, mz), mz);
        // Spawn telegraph
        const tel = new THREE.Mesh(new THREE.RingGeometry(2, 3, 16), new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
        tel.rotation.x = -Math.PI / 2;
        tel.position.copy(targetPos).add(new THREE.Vector3(0, 0.2, 0));
        scene.add(tel);
        // Delayed impact
        setTimeout(() => {
          scene.remove(tel);
          radialDamageEnemies(targetPos, 4, 40 * (state.difficultyMult || 1));
          const pd2 = Math.hypot(player.mesh.position.x - mx, player.mesh.position.z - mz);
          if (pd2 < 4 && (!state.invincibleUntil || state.time >= state.invincibleUntil)) {
            stats.hp -= 20;
            state.invincibleUntil = state.time + 0.22;
            triggerCameraShake();
          }
          spawnRing(targetPos, 4, 0xff6600, 0.4);
          playSfx(160, 0.15, 0.55);
        }, 1500);
      }
    } else if (activeWeatherEvent === "poison_zone" && poisonZone && weatherDuration < 15) {
      poisonZone.safeRadius = Math.max(15, poisonZone.safeRadius - poisonZone.shrinkRate * dt);
      const pdist = Math.hypot(player.mesh.position.x - poisonZone.cx, player.mesh.position.z - poisonZone.cz);
      if (pdist > poisonZone.safeRadius) {
        stats.hp -= 8 * dt;
        // Green tint on screen
        const lowHp = document.getElementById("lowHpOverlay");
        if (lowHp) { lowHp.style.background = "radial-gradient(ellipse at center, transparent 20%, rgba(0,150,0,0.3) 80%)"; lowHp.style.opacity = "0.8"; }
      }
    }

    // End weather
    if ((activeWeatherEvent === "lightning" && weatherDuration > 12) ||
        (activeWeatherEvent === "meteor_rain" && weatherDuration > 10) ||
        (activeWeatherEvent === "poison_zone" && weatherDuration > 15)) {
      activeWeatherEvent = null;
      poisonZone = null;
      const lowHp = document.getElementById("lowHpOverlay");
      if (lowHp) { lowHp.style.background = ""; lowHp.style.opacity = ""; }
    }
  }
}

// === CAMERA SHAKE - improved with intensity levels ===
let cameraShakeAmount = 0;
let cameraShakeDecay = 0;
function triggerCameraShake(intensity) {
  if ((camSettings.screenShake === false)) return;
  const str = intensity != null ? intensity : 0.48;
  cameraShakeAmount = Math.max(cameraShakeAmount, str);
  cameraShakeDecay = 0.2;
}
function triggerBigShake() { triggerCameraShake(0.8); }
function applyCameraShake() {
  if (cameraShakeAmount > 0.01) {
    camera.position.x += (Math.random() - 0.5) * cameraShakeAmount;
    camera.position.y += (Math.random() - 0.5) * cameraShakeAmount * 0.6;
    cameraShakeAmount *= 0.82;
  } else {
    cameraShakeAmount = 0;
  }
}

// === HIT FREEZE - brief pause on big hits for impact feel ===
let hitFreezeTimer = 0;
var MAX_HIT_FREEZE = 0.035;
function triggerHitFreeze(duration) { hitFreezeTimer = Math.min(MAX_HIT_FREEZE, Math.max(hitFreezeTimer, duration || 0.02)); }

// === DUST / SMOKE PARTICLES ===
function spawnDustCloud(pos, color, count) {
  for (let i = 0; i < count && effects.length < MAX_EFFECTS; i++) {
    const size = 0.12 + Math.random() * 0.15;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 5, 5), new THREE.MeshBasicMaterial({ color: color || 0xbbaa88, transparent: true, opacity: 0.4 }));
    mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.3, (Math.random() - 0.5) * 0.8));
    scene.add(mesh);
    effects.push({ type: "particle", mesh, life: 0.4 + Math.random() * 0.3, total: 0.7, vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 1.5) });
  }
}

// === FLOATING XP / GOLD COUNTER near character (uses floatingXpAccum, floatingCoinAccum, floatingXpTimer, floatingCoinTimer) ===
function addFloatingXp(amount) {
  floatingXpAccum += amount;
  floatingXpTimer = 2.5;
  floatingOffsetX = (Math.random() - 0.5) * 80;
  floatingOffsetY = (Math.random() - 0.5) * 40;
}
function addFloatingGold(amount) {
  floatingCoinAccum += amount;
  floatingCoinTimer = 2.5;
  floatingOffsetX = (Math.random() - 0.5) * 80;
  floatingOffsetY = (Math.random() - 0.5) * 40;
}

function updateFloatingCounters(dt) {
  if (floatingXpTimer > 0) {
    floatingXpTimer -= dt;
    if (floatingXpTimer <= 0) { floatingXpAccum = 0; }
  }
  if (floatingCoinTimer > 0) {
    floatingCoinTimer -= dt;
    if (floatingCoinTimer <= 0) { floatingCoinAccum = 0; }
  }
  if (_perfFrame % 2 === 0) {
    const el = document.getElementById("floatingCounters");
    if (el) {
      if (floatingXpAccum > 0 || floatingCoinAccum > 0) {
        let html = "";
        if (floatingXpAccum > 0) html += `<div class="floatXp">+${Math.floor(floatingXpAccum)} XP</div>`;
        if (floatingCoinAccum > 0) html += `<div class="floatGold">+${Math.floor(floatingCoinAccum)} $</div>`;
        el.innerHTML = html;
        el.style.display = "block";
        el.style.left = `calc(50% + ${floatingOffsetX}px)`;
        el.style.top = `calc(28% + ${floatingOffsetY}px)`;
        el.style.opacity = Math.min(1, Math.max(floatingXpTimer / 2.5, floatingCoinTimer / 2.5));
      } else {
        el.style.display = "none";
      }
    }
  }
}

// === LOW HP RED SCREEN EFFECT ===
function updateLowHpEffect() {
  const lowHp = document.getElementById("lowHpOverlay");
  if (!lowHp || !running) return;
  if (activeWeatherEvent === "poison_zone") return; // Don't override poison visual
  const hpPct = stats.hp / stats.maxHp;
  if (hpPct < 0.3) {
    lowHp.classList.add("active");
  } else {
    lowHp.classList.remove("active");
  }
}

// === DIFFICULTY SCALING: 5dk sonra +50%, sonra her 2.5dk'da +15% ===
const DIFFICULTY_FIRST_BUMPS_AT = 300;
const DIFFICULTY_RAMP_INTERVAL = 200;
let lastDifficultyScaleTime = 0;
function updateDifficultyScaling(dt) {
  if (!running || gameOver) return;
  const t = state.time || 0;
  if (t >= DIFFICULTY_FIRST_BUMPS_AT && !state.difficultyFirstBumpApplied) {
    state.difficultyFirstBumpApplied = true;
    state.difficultyRampStepsApplied = 0;
    state.difficultyMult = (state.difficultyMult || 1) * 1.12;
    if (typeof showGameNotification === "function") showGameNotification("Zorluk +12% (5 dk)", { color: "#ff8844" });
  }
  if (state.difficultyFirstBumpApplied && t >= DIFFICULTY_FIRST_BUMPS_AT) {
    const steps = Math.floor((t - DIFFICULTY_FIRST_BUMPS_AT) / DIFFICULTY_RAMP_INTERVAL);
    const alreadyApplied = state.difficultyRampStepsApplied || 0;
    for (let i = alreadyApplied; i < steps; i++) {
      state.difficultyMult = (state.difficultyMult || 1) * 1.04;
      if (typeof showGameNotification === "function") showGameNotification("Zorluk +4%", { color: "#ffaa66" });
    }
    state.difficultyRampStepsApplied = steps;
  }
  if (t - lastDifficultyScaleTime >= 30) {
    lastDifficultyScaleTime = t;
    for (const e of enemies) {
      e.maxHp *= 1.003;
      e.hp = Math.min(e.hp * 1.003, e.maxHp);
    }
  }
}

// === VENDING MACHINES (CoD Zombies style) ===
let vendingMachines = [];
const VENDING_ITEMS = [
  { name: "Speed Cola", cost: 40, duration: 30, color: 0x44ff44, desc: "Hiz x2 (30sn)", effect: () => { stats.moveSpeed *= 2; }, revert: () => { stats.moveSpeed /= 2; } },
  { name: "Juggernaut", cost: 60, color: 0xff4444, duration: 45, desc: "Max HP +100 (45sn)", effect: () => { stats.maxHp += 100; stats.hp += 100; }, revert: () => { stats.maxHp -= 100; stats.hp = Math.min(stats.hp, stats.maxHp); } },
  { name: "Double Tap", cost: 50, color: 0xffaa00, duration: 30, desc: "Ates hizi x2 (30sn)", effect: () => { stats.fireRate *= 0.5; }, revert: () => { stats.fireRate *= 2; } },
  { name: "Quick Revive", cost: 30, color: 0x4488ff, duration: 40, desc: "Regen +5/sn (40sn)", effect: () => { stats.regen = (stats.regen || 0) + 5; }, revert: () => { stats.regen = Math.max(0, (stats.regen || 0) - 5); } },
  { name: "Deadshot", cost: 45, color: 0xff44ff, duration: 35, desc: "Krit +30% (35sn)", effect: () => { stats.critChance = Math.min(1, (stats.critChance || 0) + 0.30); }, revert: () => { stats.critChance = Math.max(0, (stats.critChance || 0) - 0.30); } },
];
let activeVendingBuffs = [];

function addVendingMachines() {
  const positions = [
    { x: 30, z: 30 }, { x: -100, z: 60 }, { x: 150, z: -80 },
    { x: -50, z: -150 }, { x: 200, z: 200 }, { x: -200, z: -100 },
    { x: 300, z: -150 }, { x: -300, z: 200 },
  ];
  for (let i = 0; i < positions.length; i++) {
    const item = VENDING_ITEMS[i % VENDING_ITEMS.length];
    const vp = positions[i];
    const vy = sampleTerrainHeight(vp.x, vp.z);
    const g = new THREE.Group();
    // Machine body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 0.8), new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.6, metalness: 0.3 }));
    body.position.y = 1.25;
    body.castShadow = true;
    // Screen
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), new THREE.MeshBasicMaterial({ color: item.color }));
    screen.position.set(0, 1.8, 0.43);
    // Label
    const glow = new THREE.PointLight(item.color, 0.5, 8);
    glow.position.set(0, 2, 0.5);
    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 1.0), new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.8 }));
    base.position.y = 0.1;
    g.add(body, screen, glow, base);
    g.position.set(vp.x, vy, vp.z);
    g.userData.vendingItem = item;
    g.userData.vendingIndex = i;
    mapGroup.add(g);
    vendingMachines.push(g);
    colliders.push({ x: vp.x, z: vp.z, r: 1.0 });
  }
}

function updateVendingMachines(dt) {
  if (!running || gameOver) return;
  // Update active buffs
  for (let i = activeVendingBuffs.length - 1; i >= 0; i--) {
    const buff = activeVendingBuffs[i];
    buff.timeLeft -= dt;
    if (buff.timeLeft <= 0) {
      buff.revert();
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), `${buff.name} BITTI`, false, `${buff.name} BITTI`);
      activeVendingBuffs.splice(i, 1);
    }
  }
  // Check proximity
  for (const vm of vendingMachines) {
    const dist = Math.hypot(player.mesh.position.x - vm.position.x, player.mesh.position.z - vm.position.z);
    if (dist < 3.5) {
      const item = vm.userData.vendingItem;
      let hint = document.getElementById("vendingHint");
      if (!hint) {
        hint = document.createElement("div");
        hint.id = "vendingHint";
        hint.className = "vendingHint";
        document.getElementById("hud").appendChild(hint);
      }
      hint.textContent = `E - ${item.name} (${item.cost} Coin) - ${item.desc}`;
      hint.style.display = "block";
      if (keys.e) {
        keys.e = false;
        if (state.coins >= item.cost) {
          state.coins -= item.cost;
          item.effect();
          activeVendingBuffs.push({ name: item.name, timeLeft: item.duration, revert: item.revert });
          spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), `${item.name} AKTIF!`, true, `${item.name} AKTIF!`);
          playSfx(880, 0.08, 0.55);
        } else {
          spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), "YETERSIZ COIN!", false, "YETERSIZ COIN!");
        }
      }
      return;
    }
  }
  const hint = document.getElementById("vendingHint");
  if (hint) hint.style.display = "none";
}

// === DAY/NIGHT CYCLE === (4 min full cycle: 2 min day, 2 min night)
const DAY_NIGHT_PERIOD = 240;
let dayNightTime = 0;
function updateDayNight(dt) {
  if (!running) return;
  if (state.activeRitual) {
    scene.background.setHex(0x000000);
    if (scene.fog) { scene.fog.color.setRGB(0, 0, 0); scene.fog.density = 0.028; }
    return;
  }
  if (state.chapter >= 2) return; // Keep map theme fog in chapter 2/3
  dayNightTime += dt;
  const cycle = (Math.sin((dayNightTime / DAY_NIGHT_PERIOD) * Math.PI * 2) + 1) * 0.5; // 0=night, 1=day (4 min full cycle)
  // Adjust fog color and density (daha aydinlik)
  const fogR = THREE.MathUtils.lerp(0.22, 0.68, cycle);
  const fogG = THREE.MathUtils.lerp(0.28, 0.82, cycle);
  const fogB = THREE.MathUtils.lerp(0.38, 0.92, cycle);
  scene.fog.color.setRGB(fogR, fogG, fogB);
  // Adjust ambient via exposure (gunduz daha aydinlik)
  renderer.toneMappingExposure = THREE.MathUtils.lerp(0.95, 1.9, cycle);
  // Night overlay (daha hafif)
  let nightOverlay = document.getElementById("dayNightOverlay");
  if (!nightOverlay) {
    nightOverlay = document.createElement("div");
    nightOverlay.id = "dayNightOverlay";
    document.body.appendChild(nightOverlay);
  }
  const nightAlpha = THREE.MathUtils.lerp(0.18, 0, cycle);
  nightOverlay.style.background = `rgba(5,5,20,${nightAlpha})`;
  nightOverlay.style.opacity = "1";
}

// === BOSS CHALLENGE AREAS ===
let bossArenas = [];
function addBossArenas() {
  const arenaPositions = [
    { x: -350, z: -350, r: 30, boss: "Karanlik Sovalye" },
    { x: 380, z: -380, r: 28, boss: "Ates Iblisi" },
    { x: -380, z: 380, r: 32, boss: "Buz Krali" },
  ];
  const arenaMat = new THREE.MeshStandardMaterial({ color: 0x880000, emissive: 0x330000, emissiveIntensity: 0.2, roughness: 0.7 });
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
  for (const ap of arenaPositions) {
    const ay = getGroundHeight(ap.x, ap.z);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(ap.r, 32), arenaMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(ap.x, ay + 0.08, ap.z);
    mapGroup.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(ap.r - 1, ap.r + 1, 48), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ap.x, ay + 0.15, ap.z);
    mapGroup.add(ring);
    // Skull markers
    for (let s = 0; s < 6; s++) {
      const sa = (s / 6) * Math.PI * 2;
      const sx = ap.x + Math.cos(sa) * ap.r;
      const sz = ap.z + Math.sin(sa) * ap.r;
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), new THREE.MeshStandardMaterial({ color: 0xccccaa, roughness: 0.5 }));
      skull.position.set(sx, ay + 0.8, sz);
      mapGroup.add(skull);
    }
    const light = new THREE.PointLight(0xff2222, 0.6, ap.r);
    light.position.set(ap.x, ay + 4, ap.z);
    mapGroup.add(light);
    bossArenas.push({ ...ap, y: ay, triggered: false });
  }
}

function updateBossArenas(dt) {
  if (!running || gameOver) return;
  for (const arena of bossArenas) {
    if (arena.triggered) continue;
    const dist = Math.hypot(player.mesh.position.x - arena.x, player.mesh.position.z - arena.z);
    if (dist < arena.r) {
      arena.triggered = true;
      spawnDamageText(new THREE.Vector3(arena.x, arena.y + 5, arena.z), `BOSS: ${arena.boss}`, true, `BOSS: ${arena.boss}`);
      // Spawn a tough boss
      const bossCfg = { ...tierConfig.boss, hp: tierConfig.boss.hp * 2.5, damage: tierConfig.boss.damage * 1.5, xp: tierConfig.boss.xp * 3 };
      const boss = createEnemy("boss", bossCfg);
      boss.mesh.position.set(arena.x, arena.y + 0.1, arena.z);
      boss.name = arena.boss;
      enemies.push(boss);
      scene.add(boss.mesh);
      playSfx(150, 0.2);
      triggerCameraShake();
    }
  }
}

// === PARKOUR ZONES ===
function addParkourZones() {
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x55aa88, emissive: 0x114422, emissiveIntensity: 0.2, roughness: 0.5, metalness: 0.1 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x44ffaa, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3a8a5a, roughness: 0.6, metalness: 0.15 });

  // Parkour course 1 - spiral tower (inside map bounds)
  const pk1 = { x: 260, z: 320 };
  const pk1Y = getGroundHeight(pk1.x, pk1.z);
  // Central pillar
  const centerPost = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 20, 8), postMat);
  centerPost.position.set(pk1.x, pk1Y + 10, pk1.z); mapGroup.add(centerPost);
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 3;
    const r = 8 + Math.sin(i * 0.8) * 3;
    const h = 2 + i * 2;
    const px = pk1.x + Math.cos(angle) * r;
    const pz = pk1.z + Math.sin(angle) * r;
    const w = 2.5 - i * 0.08;
    const hw = w * 0.5;
    classicPlatforms.push({ x: px, z: pz, hw, hd: hw, topY: pk1Y + h + 0.2 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, w), platformMat);
    platform.position.set(px, pk1Y + h, pz); platform.castShadow = true; mapGroup.add(platform);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.2, 12), glowMat);
    ring.rotation.x = -Math.PI / 2; ring.position.set(px, pk1Y + h + 0.25, pz); mapGroup.add(ring);
  }
  classicPlatforms.push({ x: pk1.x, z: pk1.z, hw: 1.4, hd: 1.4, topY: pk1Y + 23.2 });
  const reward1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.8, roughness: 0.1 }));
  reward1.position.set(pk1.x, pk1Y + 24, pk1.z); mapGroup.add(reward1);
  parkourRewards.push({ mesh: reward1, taken: false, coins: 80 });
  parkourRewards.push({ mesh: reward1, taken: false, coins: 180 });

  // Parkour course 2 - straight line jumps
  const pk2 = { x: -300, z: -280 };
  const pk2Y = getGroundHeight(pk2.x, pk2.z);
  for (let i = 0; i < 8; i++) {
    const px = pk2.x + i * 6 * ((i % 2 === 0) ? 1 : -0.3);
    const pz = pk2.z + i * 5;
    const h = 1.5 + i * 1.8;
    classicPlatforms.push({ x: px, z: pz, hw: 1.1, hd: 1.1, topY: pk2Y + h + 0.2 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 2.2), platformMat);
    platform.position.set(px, pk2Y + h, pz); platform.castShadow = true; mapGroup.add(platform);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.0, 10), glowMat);
    ring.rotation.x = -Math.PI / 2; ring.position.set(px, pk2Y + h + 0.25, pz); mapGroup.add(ring);
  }
  classicPlatforms.push({ x: pk2.x + 36, z: pk2.z + 35, hw: 1.0, hd: 1.0, topY: pk2Y + 17.4 });
  const reward2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.8, roughness: 0.1 }));
  reward2.position.set(pk2.x + 36, pk2Y + 18, pk2.z + 35); mapGroup.add(reward2);
  parkourRewards.push({ mesh: reward2, taken: false, coins: 60 });

  // Start markers for both courses
  for (const base of [pk1, pk2]) {
    const startRing = new THREE.Mesh(new THREE.RingGeometry(3, 4, 24), new THREE.MeshBasicMaterial({ color: 0x44ffaa, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
    startRing.rotation.x = -Math.PI / 2;
    startRing.position.set(base.x, getGroundHeight(base.x, base.z) + 0.1, base.z);
    mapGroup.add(startRing);
  }

  // Parkour course 3 - wall-jump koridoru
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x444a66, emissive: 0x111320, emissiveIntensity: 0.25, roughness: 0.9, metalness: 0.08 });
  const base3 = { x: 40, z: 140 };
  const baseY3 = getGroundHeight(base3.x, base3.z);
  const length = 40;
  const height = 8;
  const gap = 6;

  classicPlatforms.push({ x: base3.x, z: base3.z, hw: (length + 4) * 0.5, hd: (gap + 10) * 0.5, topY: baseY3 + 0.35 });
  const floor3 = new THREE.Mesh(new THREE.BoxGeometry(length + 4, 0.5, gap + 10), platformMat);
  floor3.position.set(base3.x, baseY3 + 0.1, base3.z);
  floor3.castShadow = true;
  mapGroup.add(floor3);

  // Sol duvar
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, height, length), wallMat);
  leftWall.position.set(base3.x - gap * 0.5, baseY3 + height * 0.5, base3.z);
  leftWall.castShadow = true;
  leftWall.userData.isWallJumpWall = true;
  mapGroup.add(leftWall);
  colliders.push({ x: leftWall.position.x, z: leftWall.position.z, r: length * 0.55, isWall: true });

  // Sag duvar
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, height, length), wallMat);
  rightWall.position.set(base3.x + gap * 0.5, baseY3 + height * 0.5, base3.z);
  rightWall.castShadow = true;
  rightWall.userData.isWallJumpWall = true;
  mapGroup.add(rightWall);
  colliders.push({ x: rightWall.position.x, z: rightWall.position.z, r: length * 0.55, isWall: true });

  // Duvarlara dogru yukselen mini platformlar
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const z = base3.z - length * 0.5 + 4 + t * (length - 8);
    const h = 1.6 + i * 1.2;
    const side = i % 2 === 0 ? -1 : 1;
    const px = base3.x + side * (gap * 0.33);
    classicPlatforms.push({ x: px, z: z, hw: 0.9, hd: 0.9, topY: baseY3 + h + 0.175 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 1.8), platformMat);
    platform.position.set(px, baseY3 + h, z);
    platform.castShadow = true;
    mapGroup.add(platform);
  }

  // Giris isareti
  const startRing3 = new THREE.Mesh(new THREE.RingGeometry(3, 4, 24), new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
  startRing3.rotation.x = -Math.PI / 2;
  startRing3.position.set(base3.x, baseY3 + 0.12, base3.z - length * 0.5 - 2);
  mapGroup.add(startRing3);
  const reward3 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.8, roughness: 0.1 }));
  reward3.position.set(base3.x, baseY3 + height + 0.6, base3.z + length * 0.45);
  mapGroup.add(reward3);
  parkourRewards.push({ mesh: reward3, taken: false, coins: 70 });
}

function updateParkourRewards() {
  if (!player.mesh || !parkourRewards.length) return;
  const px = player.mesh.position.x;
  const py = player.mesh.position.y;
  const pz = player.mesh.position.z;
  for (let i = 0; i < parkourRewards.length; i++) {
    const r = parkourRewards[i];
    if (!r || r.taken || !r.mesh) continue;
    const dx = r.mesh.position.x - px;
    const dy = r.mesh.position.y - py;
    const dz = r.mesh.position.z - pz;
    if (dx * dx + dy * dy + dz * dz > 6.25) continue;
    r.taken = true;
    r.mesh.visible = false;
    state.coins = (state.coins || 0) + (r.coins || 50);
    if (typeof spawnWorldChestAt === "function") spawnWorldChestAt(r.mesh.position.clone());
    if (typeof showGameNotification === "function") showGameNotification("Parkour odulu! +" + (r.coins || 50) + " coin");
    playSfxLevel();
  }
}

// === RANDOM TELEPORT PORTALS === (one point to another on the map)
const RANDOM_PORTAL_COUNT = 8;
const RANDOM_PORTAL_RADIUS = 3.5;
function addRandomTeleportPortals() {
  randomTeleportPortals = [];
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x88eeff, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
  const positions = [];
  const isIsland = state.currentMapId === "island";
  const maxDist = isIsland ? ISLAND_RADIUS - 28 : WORLD_HALF - 30;
  const minDist = 40;
  for (let i = 0; i < RANDOM_PORTAL_COUNT; i++) {
    let x, z;
    do {
      if (isIsland) {
        var angle = Math.random() * Math.PI * 2;
        var r = minDist + Math.random() * (maxDist - minDist);
        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;
      } else {
        x = (Math.random() - 0.5) * 2 * maxDist;
        z = (Math.random() - 0.5) * 2 * maxDist;
      }
    } while (!isIsland && (Math.hypot(x, z) < minDist || Math.hypot(x, z) > maxDist) || positions.some((p) => Math.hypot(p.x - x, p.z - z) < 120));
    const y = getGroundHeight(x, z);
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.8, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.12;
    const glow = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.2, 32), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.08;
    g.add(ring, glow);
    g.position.set(x, y, z);
    g.userData.isRandomPortal = true;
    g.userData.portalIndex = i;
    g.userData.ring = ring;
    mapGroup.add(g);
    randomTeleportPortals.push({ group: g, pos: new THREE.Vector3(x, y + 0.1, z), index: i });
    positions.push({ x, z });
  }
}

function updateRandomTeleportPortals(dt) {
  if (!running || gameOver || !player.mesh || randomTeleportPortals.length < 2) return;
  if (state.randomPortalCooldown > 0) {
    state.randomPortalCooldown -= dt;
    return;
  }
  const playerPos = player.mesh.position;
  const sBound = (state.currentMapId === "island" ? ISLAND_RADIUS : WORLD_HALF) - 3;
  for (let i = 0; i < randomTeleportPortals.length; i++) {
    const p = randomTeleportPortals[i];
    if (p.group && p.group.userData && p.group.userData.ring) p.group.userData.ring.rotation.z += dt * 2.5;
    const dist = Math.hypot(playerPos.x - p.pos.x, playerPos.z - p.pos.z);
    if (dist < RANDOM_PORTAL_RADIUS) {
      let targetIndex = Math.floor(Math.random() * randomTeleportPortals.length);
      if (targetIndex === i) targetIndex = (i + 1) % randomTeleportPortals.length;
      const target = randomTeleportPortals[targetIndex];
      let destX = target.pos.x;
      let destZ = target.pos.z;
      if (state.currentMapId === "island" && Math.hypot(destX, destZ) >= ISLAND_RADIUS - 5) {
        for (let ti = 0; ti < randomTeleportPortals.length; ti++) {
          if (ti === i) continue;
          const alt = randomTeleportPortals[ti];
          if (Math.hypot(alt.pos.x, alt.pos.z) < ISLAND_RADIUS - 10) {
            destX = alt.pos.x;
            destZ = alt.pos.z;
            break;
          }
        }
      }
      destX = clamp(destX, -sBound, sBound);
      destZ = clamp(destZ, -sBound, sBound);
      const destY = typeof getGroundHeight === "function" ? getGroundHeight(destX, destZ) : 0;
      player.mesh.position.set(destX, destY, destZ);
      player.vel.set(0, 0, 0);
      player.vy = 0;
      spawnFlash(player.mesh.position.clone(), 0x44ddff, 2.5, 0.25);
      spawnRing(player.mesh.position.clone(), 4, 0x44ddff, 0.4);
      spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), "ISINLANDI!", true, "ISINLANDI!");
      state.randomPortalCooldown = 2.5;
      playSfx(520, 0.12, 0.55);
      break;
    }
  }
}

// === HARDCORE PORTAL (Minecraft end-portal style: enter = difficulty x4, faster enemies, 4x rewards) ===
const HARDCORE_PORTAL_RADIUS = 6;
function addHardcorePortal() {
  var isIsland = state.currentMapId === "island";
  var px, pz;
  if (isIsland) {
    for (var retries = 0; retries < 50; retries++) {
      var angle = Math.random() * Math.PI * 2;
      var r = 35 + Math.random() * (ISLAND_RADIUS - 80);
      px = Math.cos(angle) * r;
      pz = Math.sin(angle) * r;
      if (Math.hypot(px, pz) < ISLAND_RADIUS - 30) break;
    }
  } else {
    var bound = WORLD_HALF - 45;
    px = (Math.random() - 0.5) * 2 * bound;
    pz = (Math.random() - 0.5) * 2 * bound;
    if (Math.hypot(px, pz) < 30) { px += 40; pz += 40; }
  }
  const y = getGroundHeight(px, pz);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a0a1a, emissive: 0x220822, emissiveIntensity: 0.4, roughness: 0.9, metalness: 0.1 });
  const innerMat = new THREE.MeshBasicMaterial({ color: 0x4400aa, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const g = new THREE.Group();
  const frameW = 5;
  const frameH = 7;
  const thick = 0.8;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(frameW + thick * 2, thick, frameW + thick * 2), frameMat);
  floor.position.y = thick * 0.5;
  g.add(floor);
  const left = new THREE.Mesh(new THREE.BoxGeometry(thick, frameH, thick), frameMat);
  left.position.set(-frameW * 0.5 - thick * 0.5, frameH * 0.5 + thick * 0.5, 0);
  g.add(left);
  const right = left.clone();
  right.position.x = frameW * 0.5 + thick * 0.5;
  g.add(right);
  const top = new THREE.Mesh(new THREE.BoxGeometry(frameW + thick * 2, thick, thick), frameMat);
  top.position.set(0, frameH + thick * 0.5, 0);
  g.add(top);
  const bottom = top.clone();
  bottom.position.y = thick * 0.5;
  g.add(bottom);
  const portalFace = new THREE.Mesh(new THREE.PlaneGeometry(frameW - 0.2, frameH - 0.2, 1, 1), innerMat);
  portalFace.rotation.x = -Math.PI / 2;
  portalFace.position.set(0, thick + (frameH - 0.2) * 0.5 + 0.1, 0);
  g.add(portalFace);
  const glowRing = new THREE.Mesh(new THREE.RingGeometry(frameW * 0.48, frameW * 0.55, 32), new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = thick + frameH * 0.5 + 0.05;
  g.add(glowRing);
  var labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256; labelCanvas.height = 64;
  var lctx = labelCanvas.getContext("2d");
  lctx.font = "bold 38px Segoe UI, sans-serif";
  lctx.textAlign = "center";
  lctx.fillStyle = "#aa44ff";
  lctx.strokeStyle = "#000";
  lctx.lineWidth = 4;
  lctx.strokeText("HARDCORE", 128, 42);
  lctx.fillText("HARDCORE", 128, 42);
  var labelTex = new THREE.CanvasTexture(labelCanvas);
  var labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }));
  labelSprite.scale.set(5, 1.4, 1);
  labelSprite.position.y = frameH + 1.5;
  g.add(labelSprite);
  var starMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.9 });
  var stars = [];
  for (var si = 0; si < 12; si++) {
    var star = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), starMat);
    star.position.set((Math.random() - 0.5) * 8, frameH + 2 + Math.random() * 4, (Math.random() - 0.5) * 8);
    g.add(star);
    stars.push(star);
  }
  g.userData.starMeshes = stars;
  g.position.set(px, y, pz);
  g.userData.isHardcorePortal = true;
  g.userData.portalFace = portalFace;
  g.userData.glowRing = glowRing;
  mapGroup.add(g);
  const light = new THREE.PointLight(0x8844ff, 0.8, 20);
  light.position.set(px, y + 4, pz);
  mapGroup.add(light);
  hardcorePortalData = { group: g, pos: new THREE.Vector3(px, y + 0.2, pz) };
}

function updateHardcorePortal(dt) {
  if (!running || gameOver || !hardcorePortalData || state.hardcoreMode) return;
  const p = hardcorePortalData;
  if (p.group.userData.glowRing) {
    p.group.userData.glowRing.rotation.z += dt * 3;
    p.group.userData.portalFace.material.opacity = 0.7 + Math.sin(state.time * 4) * 0.2;
  }
  if (p.group.userData.starMeshes) {
    p.group.userData.starMeshes.forEach(function(star, i) {
      star.position.y = 9 + Math.sin(state.time * 2 + i * 0.7) * 1.2;
      if (star.material && star.material.opacity !== undefined) star.material.opacity = 0.5 + Math.sin(state.time * 3 + i) * 0.4;
    });
  }
  const dist = Math.hypot(player.mesh.position.x - p.pos.x, player.mesh.position.z - p.pos.z);
  if (dist < HARDCORE_PORTAL_RADIUS) {
    state.hardcoreMode = true;
    state.difficultyMult = (state.difficultyMult || 1) * 4;
    showGameNotification("HARDCORE - Zorluk x4! Odul x4.");
    spawnFlash(player.mesh.position.clone(), 0xaa44ff, 6, 0.5);
    spawnRing(player.mesh.position.clone(), 12, 0xaa44ff, 0.8);
    spawnDamageText(player.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), "HARDCORE!", true, "HARDCORE!");
    spawnBurst(player.mesh.position.clone(), 0x8844ff, 16);
    playSfx(180, 0.25);
    triggerCameraShake();
    let overlay = document.getElementById("hardcoreOverlay");
    if (!overlay) {
      const style = document.createElement("style");
      style.textContent = "@keyframes hardcoreFlash { 0% { opacity:1; } 100% { opacity:0; } }";
      document.head.appendChild(style);
      overlay = document.createElement("div");
      overlay.id = "hardcoreOverlay";
      overlay.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:50;background:linear-gradient(180deg,rgba(80,20,120,0.5),transparent 35%, transparent 65%, rgba(80,20,120,0.4));opacity:0;";
      document.getElementById("hud").appendChild(overlay);
    }
    overlay.style.opacity = "1";
    overlay.style.animation = "hardcoreFlash 0.9s ease-out forwards";
    setTimeout(() => { overlay.style.opacity = "0"; overlay.style.animation = "none"; }, 950);
  }
}

function onPlayerDeath() {
  resetChestPanel();
  if (document.body) document.body.classList.remove("death-grayscale");
  stopBgMusic();
  stopMenuMusic();
  const best = saveLeaderboard();
  gameOver = true;
  running = false;
  leveling = false;
  levelupPanel.classList.add("hidden");
  hud.classList.add("hidden");
  skillsHud.classList.add("hidden");
  if (skillBarEl) skillBarEl.classList.add("hidden");
  if (bossBarWrap) bossBarWrap.classList.add("hidden");
  gameOverPanel.classList.remove("hidden");
  const attacker = state.lastAttacker;
  const dmgType = state.lastDamageType || "";
  let deathMsg = "";
  if (attacker && dmgType === "melee") deathMsg = attacker + " tarafından öldürüldün.";
  else if (attacker && dmgType === "fireball") deathMsg = attacker + " tarafından ateş topu ile vurulup öldün.";
  else if (attacker && dmgType === "projectile") deathMsg = attacker + " tarafından vurulup öldürüldün.";
  else if (attacker && dmgType === "creeper") deathMsg = attacker + " tarafından patlatıldın.";
  else if (attacker && dmgType === "lifesteal") deathMsg = attacker + " tarafından can emilerek öldün.";
  else if (attacker && dmgType === "shark") deathMsg = attacker + " tarafından ısırıldın.";
  else if (attacker && dmgType === "laser") deathMsg = attacker + " lazeri ile vurulup öldün.";
  else if (dmgType === "fall") deathMsg = "Düşerek öldün.";
  else if (dmgType === "lightning") deathMsg = "Yıldırım tarafından çarpıldın.";
  else if (attacker) deathMsg = attacker + " tarafından öldürüldün.";
  if (!deathMsg) deathMsg = MEME_DEATH_MESSAGES[Math.floor(Math.random() * MEME_DEATH_MESSAGES.length)];
  const goStatsEl = document.getElementById("gameOverStats");
  if (goStatsEl) {
    goStatsEl.innerHTML = `
      <div class="goStat"><span class="goStatLabel">SURE</span><span class="goStatValue">${formatTime(state.time)}</span></div>
      <div class="goStat"><span class="goStatLabel">KILL</span><span class="goStatValue">${state.kills}</span></div>
      <div class="goStat"><span class="goStatLabel">LEVEL</span><span class="goStatValue">${state.level}</span></div>
      <div class="goStat"><span class="goStatLabel">BOLUM</span><span class="goStatValue">${state.chapter}</span></div>
      <div class="goStat"><span class="goStatLabel">COIN</span><span class="goStatValue">${state.coins}</span></div>
      <div class="goStat"><span class="goStatLabel">BOSS</span><span class="goStatValue">${state.bossesDefeated}</span></div>
      ${state.endlessMode ? `<div class="goStat"><span class="goStatLabel">SONSUZ SURE</span><span class="goStatValue">${formatTime(state.endlessTime)}</span></div>
      <div class="goStat"><span class="goStatLabel">DALGA</span><span class="goStatValue">${state.endlessWave}</span></div>` : ""}
    `;
  }
  const bestKills = best.kills || 0;
  const bestTime = formatTime(best.time || 0);
  const isNewRecord = (state.kills >= bestKills && state.kills > 0) || (state.time >= (best.time || 0) && state.time > 0);
  const unluckyLines = ["Hahaha unlucky! Level aldın ama öldün...", "Ölüm menüsü – level atladın ama bu sefer olmadı!", "Ne yazık! Öldün. Bir dahaki sefere!", "Level aldın ama düşmanlar da seni aldı. RIP!", "Unlucky! Ölüm menüsüne hoş geldin."];
  const unluckySub = unluckyLines[Math.floor(Math.random() * unluckyLines.length)];
  gameOverText.innerHTML = "<h3 style=\"margin:0 0 8px 0;font-size:14px;color:#ff8888;\">ÖLÜM MENÜSÜ</h3><p style=\"margin:0 0 6px 0;font-size:11px;color:#ccc;\">" + unluckySub + "</p><strong>" + deathMsg + "</strong><br><br><small>Bu run: " + state.kills + " kill \u2022 " + formatTime(state.time) + "</small><br><strong>En iyi rekor: " + bestKills + " kill \u2022 " + bestTime + "</strong>" + (isNewRecord ? "<br><span style=\"color:rgba(255,215,0,0.95);\">Yeni rekor!</span>" : "");
  playSfx(130, 0.55, 0.5);
  playSfx(100, 0.35, 0.35);
}

function animate() {
  requestAnimationFrame(animate);
  const rawDt = clock.getDelta();
  const dt = Math.min(0.065, Math.max(0, Number(rawDt) || 0));
  const frameBehind = rawDt > 0.055;

  try {
    if (running && !paused) {
      if (hitFreezeTimer > 0) hitFreezeTimer -= dt;
      state.time += dt;
    }
    if (running && !paused) {
      if (state.time >= state.nextSoulRoundAt && !state.soulRoundActive) {
        state.soulRoundActive = true;
        state.soulRoundEndTime = state.time + SOUL_ROUND_DURATION;
        state.nextSoulRoundAt += SOUL_ROUND_INTERVAL;
        state.soulRoundSpawnTimer = 0;
        playSoulRoundSound();
        showGameNotification("Siyah Ruhlar Round!", { rainbow: true });
        for (let i = enemies.length - 1; i >= 0; i--) {
          releaseEnemyVisuals(enemies[i]);
          if (scene && enemies[i].mesh) scene.remove(enemies[i].mesh);
          enemies.splice(i, 1);
        }
      }
      if (state.soulRoundActive && state.time >= state.soulRoundEndTime) {
        state.soulRoundActive = false;
        showGameNotification("Siyah Ruhlar round bitti!");
        if (player.mesh) spawnWorldChestAt(player.mesh.position.clone());
      }
      if (state.time >= state.nextHordeSurgeAt && !state.hordeSurgeActive && !state.soulRoundActive) {
        state.hordeSurgeActive = true;
        state.hordeSurgeEndTime = state.time + HORDE_SURGE_DURATION;
        state.nextHordeSurgeAt += HORDE_SURGE_INTERVAL;
        state.hordeSurgeSpawnTimer = 0;
        showGameNotification("Horde Surge!");
      }
      if (state.hordeSurgeActive && state.time >= state.hordeSurgeEndTime) {
        state.hordeSurgeActive = false;
        showGameNotification("Horde Surge bitti!");
        if (player.mesh) spawnWorldChestAt(player.mesh.position.clone());
      }
      if (state.time >= ATTACK_ROUND_START_TIME && !state.attackRoundStarted) {
        state.attackRoundStarted = true;
        state.attackRoundActive = true;
        state.attackRoundPhase = 1;
        for (let i = enemies.length - 1; i >= 0; i--) {
          releaseEnemyVisuals(enemies[i]);
          if (scene && enemies[i].mesh) scene.remove(enemies[i].mesh);
          enemies.splice(i, 1);
        }
        const goblin1 = 35;
        const other1 = 15;
        for (let i = 0; i < goblin1; i++) spawnAttackRoundGoblin(1);
        for (let i = 0; i < other1; i++) spawnEnemy(undefined, true);
        if (typeof showGameNotification === "function") showGameNotification("SALDIRI ROUND! Goblin + yaratiklar - kes!");
      }
      if (state.attackRoundActive) {
        let remaining = 0;
        for (let i = 0; i < enemies.length; i++) { if (enemies[i].isAttackRound && enemies[i].attackRoundWave === state.attackRoundPhase) remaining++; }
        if (remaining === 0) {
          if (state.attackRoundPhase === 1) {
            state.attackRoundPhase = 2;
            const goblin2 = 60;
            const other2 = 20;
            for (let i = 0; i < goblin2; i++) spawnAttackRoundGoblin(2);
            for (let i = 0; i < other2; i++) spawnEnemy(undefined, true);
            if (typeof showGameNotification === "function") showGameNotification("Goblin + yaratiklar - Dalga 2!");
          } else {
            state.attackRoundActive = false;
            if (typeof showGameNotification === "function") showGameNotification("Saldiri round bitti!");
            if (player.mesh) spawnWorldChestAt(player.mesh.position.clone());
          }
        }
      }
      state._achievementCheckTimer = (state._achievementCheckTimer || 0) - dt;
      if (state._achievementCheckTimer <= 0) { state._achievementCheckTimer = 2.5; checkAchievements(); }
      if (state.magnetBurstCd != null) state.magnetBurstCd = Math.max(0, state.magnetBurstCd - dt);
      if (state.endlessMode) state.endlessTime += dt;
      if (state.time - (state.lastKillTime || 0) > 2.5) state.killCombo = 0;
      if (state.reloadTimer > 0) {
        state.reloadTimer -= dt;
        if (state.reloadTimer <= 0) state.reloadAmmo = state.reloadMax || 4;
      }
      windAmbientTimer -= dt;
      if (windAmbientTimer <= 0) {
        windAmbientTimer = 10 + Math.random() * 8;
        ensureAudio();
        if (audioCtx && (camSettings.soundVolume || 0) > 0) {
          const now = audioCtx.currentTime;
          const vol = 0.04 * (camSettings.soundVolume || 1) * (camSettings.effectVolume ?? 1);
          const osc = audioCtx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(72 + Math.random() * 24, now);
          osc.frequency.setValueAtTime(65 + Math.random() * 18, now + 0.3);
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(vol, now + 0.15);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(g); g.connect(audioCtx.destination);
          osc.start(now); osc.stop(now + 0.52);
        }
      }
      if (!frameBehind || _perfFrame % 6 === 0) updateFloatingCounters(dt);
      updateChapterAndBoss(dt);
      updatePortal(dt);
      updateRandomTeleportPortals(dt);
      updateHardcorePortal(dt);
      updateBonusTime(dt);
      updateWeather(dt);
      updatePlayer(dt);
      updateParkourRewards();
      updateSpawning(dt);
      updateEnemies(dt);
      updateEnemyProjectiles(dt);
      updateEnemyLasers(dt);
      updateAbilities(dt);
      updateProjectiles(dt);
      updateGroundSlipHazards(dt);
      updateXpOrbs(dt);
      updateChests(dt);
      updateWorldPickups(dt);
      updateBhopTrail(dt);
      updateCoinPickups(dt);
      updateMagnetPickups(dt);
      updateSlowmoPickups(dt);
      updateWorldChests(dt);
      updateBreaches(dt);
      updateAbyssPits(dt);
      updateRituals(dt);
      updateCompanions(dt);
      updateTurrets(dt);
      updateEffects(dt);
      updateRagdoll(dt);
      updateFlyingEnemies(dt);
      updateWaterSharks(dt);
      updateShadowMode(dt);
      updateNpcInteraction(dt);
      updateAltarInteraction(dt);
      updateMana(dt);
      updateWeatherEvents(dt);
      updateVendingMachines(dt);
      updateDifficultyScaling(dt);
      updateBossArenas(dt);
      updateLowHpEffect();
      turretPlaceCd -= dt;
      const maxTurrets = Math.min(4, stats.maxTurrets || MAX_TURRETS_DEFAULT);
      if (specialUnlocks.turret && keys.f && turretPlaceCd <= 0 && placeableTurrets.length < maxTurrets) {
        turretPlaceCd = TURRET_PLACE_CD;
        const pos = player.mesh.position.clone().add(player.aimDir.clone().multiplyScalar(2));
        pos.y = sampleTerrainHeight(pos.x, pos.z) + 0.02;
        spawnTurret(pos);
        playSfx(520, 0.08, 0.55);
      }
      // Regen
      if (stats.regen) stats.hp = Math.min(stats.maxHp, stats.hp + stats.regen * dt);
      // Berserker damage boost when low HP
      if ((stats.berserker > 0 || stats.berserkerLegendary) && stats.hp < stats.maxHp * 0.4) {
        stats._berserkerActive = true;
      } else {
        stats._berserkerActive = false;
      }
      if (stats.hp <= 0 && stats.secondWind > 0) {
        stats.hp = stats.maxHp * 0.3;
        stats.secondWind = 0;
      }
      if (state.challengeTimerEnd != null && state.time >= state.challengeTimerEnd) onPlayerDeath();
      if (stats.hp <= 0 && !state.playerDying) {
        state.playerDying = true;
        state.deathRagdollStart = state.time;
        state.deathRagdollDuration = 2.6;
        if (document.body && !document.body.classList.contains("death-grayscale")) document.body.classList.add("death-grayscale");
        if (typeof playSfx === "function") {
          playSfx(72, 0.6, 0.95);
          setTimeout(() => { if (typeof playSfx === "function") playSfx(55, 0.4, 0.7); }, 120);
        }
      }
      if (state.playerDying) {
        const deathDt = dt * 0.12;
        state.time += deathDt;
        const elapsed = state.time - state.deathRagdollStart;
        if (player.mesh) {
          player.mesh.rotation.x = Math.min(Math.PI / 2, (elapsed / state.deathRagdollDuration) * (Math.PI / 2));
          player.mesh.rotation.z = Math.sin(state.time * 4) * 0.15 * Math.min(1, elapsed / 0.5);
        }
        updateCamera(dt);
        if (elapsed >= state.deathRagdollDuration) {
          if (document.body) document.body.classList.remove("death-grayscale");
          onPlayerDeath();
        }
        renderer.render(scene, (camSettings.graphics2D && camera2D) ? camera2D : camera);
        return;
      }
    } else if (leveling) {
      levelupAutoPick += dt;
      if (levelupAutoPick > 10 && currentChoices.length > 0) chooseLevelCard(0);
    }

    if (!frameBehind) updateMapAnimations(dt);
    if (!running && dioramaOn) {
      const t = clock.elapsedTime;
      if (player.mesh) player.mesh.rotation.y = t * 0.4;
      if (dioramaGroup) {
        for (let i = 0; i < dioramaGroup.children.length; i++) {
          const c = dioramaGroup.children[i];
          if (!c.userData || !c.userData.idleTurn) continue;
          c.rotation.y = t * (0.45 + i * 0.12);
        }
      }
    }
    if (!frameBehind && _perfFrame % 14 === 0) updateWorldDecors();
    updateCamera(dt);
    if (!frameBehind) { updateDayNight(dt); updateChaos(dt); }
    _perfFrame++;
    const hudInterval = frameBehind ? 8 : 5;
    if (_perfFrame % hudInterval === 0) {
      updateHud();
      if (!frameBehind) drawMinimap();
    }
    renderer.render(scene, (camSettings.graphics2D && camera2D) ? camera2D : camera);
  } catch (err) {
    console.error("Runtime error:", err);
    stopBgMusic();
    running = false;
    leveling = false;
    gameOver = true;
    gameOverPanel.classList.remove("hidden");
    gameOverText.textContent = "Runtime error oldu. Restart ile yeniden dene.";
    renderer.render(scene, (camSettings.graphics2D && camera2D) ? camera2D : camera);
  }
}

function disposeProjectileMesh(p) {
  if (!p || !p.mesh) return;
  const key = p.mesh.userData && p.mesh.userData.poolKey;
  if (key && stashProjMesh(p.mesh, key)) {
    p.mesh = null;
  } else {
    if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
    if (p.mesh.geometry) p.mesh.geometry.dispose();
    if (p.mesh.material) {
      if (Array.isArray(p.mesh.material)) p.mesh.material.forEach(function(m) { if (m) m.dispose(); });
      else p.mesh.material.dispose();
    }
    p.mesh = null;
  }
  if (p.telegraphMesh && p.telegraphMesh.parent) {
    scene.remove(p.telegraphMesh);
    if (p.telegraphMesh.geometry) p.telegraphMesh.geometry.dispose();
    if (p.telegraphMesh.material) p.telegraphMesh.material.dispose();
    p.telegraphMesh = null;
  }
}

function spawnMeteor(targetPos, damage, radius) {
  if (projectiles.length >= MAX_PROJECTILES) return;
  const meteorGeo = new THREE.SphereGeometry(0.6, 10, 10);
  const meteorMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, emissive: 0xff4500, emissiveIntensity: 0.6, roughness: 0.7, metalness: 0.3 });
  const meteorMesh = new THREE.Mesh(meteorGeo, meteorMat);
  const startPos = targetPos.clone().add(new THREE.Vector3(0, 35, 0));
  meteorMesh.position.copy(startPos);
  scene.add(meteorMesh);
  const telegraphMesh = new THREE.Mesh(new THREE.RingGeometry(radius * 0.25, radius, 40), new THREE.MeshBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.42, side: THREE.DoubleSide }));
  telegraphMesh.rotation.x = -Math.PI / 2;
  telegraphMesh.position.copy(targetPos).setY(sampleTerrainHeight(targetPos.x, targetPos.z) + 0.09);
  scene.add(telegraphMesh);
  projectiles.push({
    mesh: meteorMesh,
    vel: new THREE.Vector3(0, -28, 0),
    life: 20,
    isMeteor: true,
    meteorAge: 0,
    targetPos: targetPos.clone(),
    damage,
    radius,
    impacted: false,
    owner: "player",
    telegraphMesh,
  });
}

function spawnComet(targetPos, damage, radius) {
  if (projectiles.length >= MAX_PROJECTILES) return;
  const cometGeo = new THREE.SphereGeometry(0.55, 10, 10);
  const cometMat = new THREE.MeshStandardMaterial({ color: 0x4a8abb, emissive: 0x2288cc, emissiveIntensity: 0.65, roughness: 0.5, metalness: 0.2 });
  const cometMesh = new THREE.Mesh(cometGeo, cometMat);
  const startPos = targetPos.clone().add(new THREE.Vector3(0, 35, 0));
  cometMesh.position.copy(startPos);
  scene.add(cometMesh);
  const telegraphMesh = new THREE.Mesh(new THREE.RingGeometry(radius * 0.25, radius, 40), new THREE.MeshBasicMaterial({ color: 0x4d9dff, transparent: true, opacity: 0.42, side: THREE.DoubleSide }));
  telegraphMesh.rotation.x = -Math.PI / 2;
  telegraphMesh.position.copy(targetPos).setY(sampleTerrainHeight(targetPos.x, targetPos.z) + 0.09);
  scene.add(telegraphMesh);
  projectiles.push({
    mesh: cometMesh,
    vel: new THREE.Vector3(0, -26, 0),
    life: 20,
    isMeteor: true,
    isComet: true,
    meteorAge: 0,
    targetPos: targetPos.clone(),
    damage,
    radius,
    impacted: false,
    owner: "player",
    telegraphMesh,
  });
}

function spawnImpactRock(pos, color) {
  if (effects.length >= MAX_EFFECTS) return;
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.12 }));
  rock.position.copy(pos).add(new THREE.Vector3(0, 10, 0));
  rock.userData = { vel: new THREE.Vector3(0, -20, 0), life: 0.6 };
  scene.add(rock);
  effects.push({ type: "impactRock", mesh: rock });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function onReady() {
    requestAnimationFrame(function firstPaint() {
      setTimeout(init, 0);
    });
  });
} else {
  requestAnimationFrame(function firstPaint() {
    setTimeout(init, 0);
  });
}
