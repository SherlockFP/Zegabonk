import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ASSET_MANIFEST } from "../assets/AssetManifest";
import type { CombatEvent, SimulationSnapshot } from "../core/Simulation";
import type { GameSettings } from "../core/SettingsStore";

const MAX_VISIBLE_ENEMIES = 200;
const MAX_DETAILED_ENEMY_ACTORS = 24;
const MAX_VISIBLE_ORBS = 96;
const MAX_IMPACT_PULSES = 14;
const MAX_IMPACT_FLARES = 16;
const MAX_BONK_SHARDS = 120;
const MAX_DAMAGE_POPUPS = 12;

export type RenderMode = "menu" | "game";

export interface RenderDiagnostics {
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

interface ImpactPulse {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  startedAt: number;
  expiresAt: number;
  strength: number;
}

interface ImpactFlare {
  sprite: THREE.Sprite;
  startedAt: number;
  expiresAt: number;
  strength: number;
}

interface BonkShard {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  startedAt: number;
  expiresAt: number;
  scale: number;
}

interface DamagePopup {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  startedAt: number;
  expiresAt: number;
  x: number;
  y: number;
  z: number;
}

interface PortalVisual {
  ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  veil: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  beacon: THREE.Mesh<THREE.OctahedronGeometry, THREE.MeshStandardMaterial>;
}

export class WorldRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(62, 1, 0.1, 250);
  private readonly player = new THREE.Group();
  private readonly worldStages: readonly [THREE.Group, THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
  private readonly stagePortals: PortalVisual[] = [];
  private readonly forest = new THREE.Group();
  private readonly playerFallback = new THREE.Group();
  private readonly hammerPivot = new THREE.Group();
  private readonly cape: THREE.Mesh;
  private readonly enemyBodies: THREE.InstancedMesh;
  private readonly enemyHeads: THREE.InstancedMesh;
  private readonly enemyMasks: THREE.InstancedMesh;
  private readonly enemyEyes: THREE.InstancedMesh;
  private readonly enemyTelegraphs: THREE.InstancedMesh;
  private readonly enemyFallbacks = new THREE.Group();
  private readonly enemyActors: THREE.Group[] = [];
  private heroActor: THREE.Group | null = null;
  private heroActorRest: THREE.Euler | null = null;
  private guardianActor: THREE.Group | null = null;
  private guardianAttackPivot: THREE.Object3D | null = null;
  private guardianAttackRest: THREE.Euler | null = null;
  private guardianCrownPivot: THREE.Object3D | null = null;
  private heroHammerActor: THREE.Object3D | null = null;
  private heroHammerRest: THREE.Euler | null = null;
  private heroHammerRestPosition: THREE.Vector3 | null = null;
  private heroLeftArm: THREE.Object3D | null = null;
  private heroRightArm: THREE.Object3D | null = null;
  private heroLeftForearm: THREE.Object3D | null = null;
  private heroRightForearm: THREE.Object3D | null = null;
  private heroLeftLeg: THREE.Object3D | null = null;
  private heroRightLeg: THREE.Object3D | null = null;
  private heroLeftLowerLeg: THREE.Object3D | null = null;
  private heroRightLowerLeg: THREE.Object3D | null = null;
  private heroCapeActor: THREE.Object3D | null = null;
  private heroLeftArmRest: THREE.Euler | null = null;
  private heroRightArmRest: THREE.Euler | null = null;
  private heroLeftForearmRest: THREE.Euler | null = null;
  private heroRightForearmRest: THREE.Euler | null = null;
  private heroLeftLegRest: THREE.Euler | null = null;
  private heroRightLegRest: THREE.Euler | null = null;
  private heroLeftLowerLegRest: THREE.Euler | null = null;
  private heroRightLowerLegRest: THREE.Euler | null = null;
  private heroCapeRest: THREE.Euler | null = null;
  private readonly xpOrbs: THREE.InstancedMesh;
  private readonly swingRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private readonly impactPulses: ImpactPulse[] = [];
  private readonly impactFlares: ImpactFlare[] = [];
  private readonly bonkShards: THREE.InstancedMesh;
  private readonly shardState: BonkShard[] = [];
  private readonly damagePopups: DamagePopup[] = [];
  private readonly matrix = new THREE.Matrix4();
  private readonly position = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();
  private readonly quaternion = new THREE.Quaternion();
  private mode: RenderMode = "menu";
  private settings: Readonly<GameSettings>;
  private cameraShake = 0;
  private cameraSnapRequested = false;
  private readonly cameraBasePosition = new THREE.Vector3();
  private lastCameraTime = 0;
  private activeWorldStage = 0;
  private lastAnimationSample = 0;
  private locomotionBlend = 0;
  private locomotionPhase = 0;
  private groundMaterial: THREE.MeshStandardMaterial | null = null;
  private groundTexture: THREE.Texture | null = null;
  private pathTexture: THREE.Texture | null = null;
  private pathMaterial: THREE.MeshStandardMaterial | null = null;
  private sharedCrystals: THREE.InstancedMesh | null = null;

  constructor(canvas: HTMLCanvasElement, settings: Readonly<GameSettings>) {
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene.background = new THREE.Color(0x77bde8);
    this.scene.fog = new THREE.FogExp2(0xaed6df, 0.012);
    this.createLights();
    this.createWorld();
    this.cape = this.createPlayer();
    [this.enemyBodies, this.enemyHeads, this.enemyMasks, this.enemyEyes, this.enemyTelegraphs] = this.createEnemyActors();
    this.xpOrbs = this.createXpOrbs();
    this.swingRing = this.createSwingRing();
    this.createImpactPool();
    this.createImpactFlarePool();
    this.bonkShards = this.createBonkShards();
    this.createDamagePopupPool();
    void this.loadPrototypeActors();
    void this.loadEnvironmentPrototype();
    this.applySettings(settings);
    window.addEventListener("resize", this.resize);
    this.resize();
  }

  setMode(mode: RenderMode): void {
    if (mode === "game" && this.mode !== mode) this.cameraSnapRequested = true;
    this.mode = mode;
  }

  applySettings(settings: Readonly<GameSettings>): void {
    this.settings = settings;
    const presetScale = settings.quality === "low" ? 0.7 : settings.quality === "medium" ? 0.9 : 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5) * settings.resolutionScale * presetScale);
    this.camera.fov = settings.fov;
    this.camera.updateProjectionMatrix();
    this.scene.fog = settings.highContrast ? new THREE.FogExp2(0xc7e3df, 0.008) : new THREE.FogExp2(0xaed6df, 0.012);
    document.documentElement.dataset.contrast = settings.highContrast ? "high" : "normal";
    document.documentElement.dataset.motion = settings.reducedMotion ? "reduced" : "full";
    document.documentElement.dataset.colorAssist = settings.colorAssist;
    this.resize();
  }

  render(state: Readonly<SimulationSnapshot>, time: number, events: readonly CombatEvent[]): void {
    this.applyEvents(events, time);
    this.updatePlayer(state, time);
    this.updateWorldStage(state.stage);
    this.updatePortalState(state, time);
    this.updateEnemies(state, time);
    this.updateXpOrbs(state, time);
    this.updateEffects(time);

    if (this.mode === "game") {
      const distance = this.settings.cameraDistance;
      const offset = new THREE.Vector3(distance * 0.54, 7.2 + state.cameraPitch * 8.2, distance * 0.78).applyAxisAngle(THREE.Object3D.DEFAULT_UP, state.cameraYaw);
      const desired = new THREE.Vector3(state.playerX, 0, state.playerZ).add(offset);
      const cameraDelta = this.lastCameraTime === 0 ? 1 / 60 : THREE.MathUtils.clamp(time - this.lastCameraTime, 1 / 240, 0.1);
      this.lastCameraTime = time;
      if (this.cameraSnapRequested) {
        this.cameraBasePosition.copy(desired);
        this.cameraSnapRequested = false;
      } else {
        this.cameraBasePosition.lerp(desired, 1 - Math.exp(-cameraDelta * 9.5));
      }
      this.camera.position.copy(this.cameraBasePosition);
      const shake = this.settings.screenShake && !this.settings.reducedMotion ? this.cameraShake : 0;
      this.camera.position.x += Math.sin(time * 96) * shake * 0.14;
      this.camera.position.y += Math.cos(time * 71) * shake * 0.1;
      const focus = new THREE.Vector3(0, 1.15, -2.45).applyAxisAngle(THREE.Object3D.DEFAULT_UP, state.cameraYaw);
      this.camera.lookAt(state.playerX + focus.x, focus.y, state.playerZ + focus.z);
      this.cameraShake *= Math.exp(-cameraDelta * 12);
      if (this.cameraShake < 0.001) this.cameraShake = 0;
    } else {
      this.lastCameraTime = time;
      const orbit = this.settings.reducedMotion ? 0 : Math.sin(time * 0.08) * 1.1;
      this.camera.position.set(12 + orbit, 9.5, 18);
      this.camera.lookAt(0, 1.5, 1);
    }

    this.renderer.render(this.scene, this.camera);
  }

  getDiagnostics(): RenderDiagnostics {
    const info = this.renderer.info;
    return {
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
    };
  }

  private createLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xd9f2ff, 0x294a35, 1.25));
    const sun = new THREE.DirectionalLight(0xffd7a3, 2.15);
    sun.position.set(-18, 28, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -34;
    sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 34;
    sun.shadow.camera.bottom = -34;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x76a6c7, 0.35);
    fill.position.set(16, 10, -12);
    this.scene.add(fill);
  }

  private createWorld(): void {
    this.groundTexture = new THREE.TextureLoader().load("/assets/textures/mosswatch-ground.webp");
    this.groundTexture.colorSpace = THREE.SRGBColorSpace;
    this.groundTexture.wrapS = THREE.RepeatWrapping;
    this.groundTexture.wrapT = THREE.RepeatWrapping;
    this.groundTexture.repeat.set(11, 11);
    this.groundTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.groundMaterial = new THREE.MeshStandardMaterial({ color: 0xa8b99b, map: this.groundTexture, roughness: 0.96 });
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(84, 91, 2.4, 24), this.groundMaterial);
    ground.position.y = -1.25;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.pathTexture = new THREE.TextureLoader().load("/assets/textures/mosswatch-road.webp");
    this.pathTexture.colorSpace = THREE.SRGBColorSpace;
    this.pathTexture.wrapS = THREE.RepeatWrapping;
    this.pathTexture.wrapT = THREE.RepeatWrapping;
    this.pathTexture.repeat.set(2, 4);
    this.pathTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.pathMaterial = new THREE.MeshStandardMaterial({ color: 0xc0aa7f, map: this.pathTexture, roughness: 0.98 });
    const pathEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x5e633f, roughness: 1 });
    const pathGroup = new THREE.Group();
    const paths: readonly [number, number, number, number, number][] = [
      [0, 14, -4, -9, 10],
      [-4, -9, -25, -23, 6.6],
      [-4, -9, 21, -21, 6.6],
      [-25, -23, -8.5, -37, 6.2],
      [21, -21, -8.5, -37, 6.2],
    ];
    const addPath = ([x1, z1, x2, z2, width]: readonly [number, number, number, number, number]): void => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const rotation = Math.atan2(dx, dz);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(width + 1.15, 0.075, length + 0.75), pathEdgeMaterial);
      edge.position.set((x1 + x2) * 0.5, -0.01, (z1 + z2) * 0.5);
      edge.rotation.y = rotation;
      edge.receiveShadow = true;
      const segment = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, length), this.pathMaterial!);
      segment.position.set((x1 + x2) * 0.5, 0.025, (z1 + z2) * 0.5);
      segment.rotation.y = rotation;
      segment.receiveShadow = true;
      pathGroup.add(edge, segment);
    };
    for (const path of paths) addPath(path);
    for (const [x, z, radius] of [[0, 14, 7.5], [-25, -23, 5.8], [21, -21, 5.8], [-8.5, -37, 6.8]] as const) {
      const edge = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.65, radius + 1, 0.075, 24), pathEdgeMaterial);
      edge.position.set(x, -0.01, z);
      edge.receiveShadow = true;
      const clearing = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.35, 0.09, 24), this.pathMaterial);
      clearing.position.set(x, 0.025, z);
      clearing.receiveShadow = true;
      pathGroup.add(edge, clearing);
    }
    const wearGeometry = new THREE.CircleGeometry(1, 7);
    wearGeometry.rotateX(-Math.PI / 2);
    const wearPatches = new THREE.InstancedMesh(
      wearGeometry,
      new THREE.MeshBasicMaterial({ color: 0x5b432c, transparent: true, opacity: 0.42, depthWrite: false }),
      35,
    );
    const dustPatches = new THREE.InstancedMesh(
      wearGeometry,
      new THREE.MeshBasicMaterial({ color: 0xd0b47c, transparent: true, opacity: 0.3, depthWrite: false }),
      20,
    );
    const roadStones = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.19, 0),
      new THREE.MeshStandardMaterial({ color: 0x746853, roughness: 0.98 }),
      35,
    );
    for (let index = 0; index < 35; index += 1) {
      const [x1, z1, x2, z2, width] = paths[index % paths.length]!;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const t = 0.1 + Math.floor(index / paths.length) * 0.13;
      const lateral = ((index * 7) % 9 - 4) * width * 0.085;
      const x = x1 + dx * t - dz / length * lateral;
      const z = z1 + dz * t + dx / length * lateral;
      this.position.set(x, 0.076, z);
      this.scale.set(1.45 + (index % 4) * 0.58, 1, 0.75 + (index % 3) * 0.38);
      this.quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, index * 1.17);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      wearPatches.setMatrixAt(index, this.matrix);
      this.position.set(x + Math.sin(index) * 0.45, 0.13, z + Math.cos(index * 1.3) * 0.38);
      this.scale.setScalar(0.65 + (index % 3) * 0.22);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      roadStones.setMatrixAt(index, this.matrix);
    }
    for (let index = 0; index < 20; index += 1) {
      const [x1, z1, x2, z2, width] = paths[index % paths.length]!;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const t = 0.16 + Math.floor(index / paths.length) * 0.2;
      const lateral = ((index * 5) % 7 - 3) * width * 0.09;
      this.position.set(x1 + dx * t - dz / length * lateral, 0.079, z1 + dz * t + dx / length * lateral);
      this.scale.set(1.15 + (index % 3) * 0.62, 1, 0.55 + (index % 4) * 0.22);
      this.quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, index * 0.91 + 0.4);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      dustPatches.setMatrixAt(index, this.matrix);
    }
    wearPatches.instanceMatrix.needsUpdate = true;
    dustPatches.instanceMatrix.needsUpdate = true;
    roadStones.instanceMatrix.needsUpdate = true;
    roadStones.castShadow = true;
    roadStones.receiveShadow = true;
    pathGroup.add(wearPatches, dustPatches, roadStones);
    this.scene.add(pathGroup);

    const distanceToPath = (x: number, z: number): number => {
      let closest = Infinity;
      for (const [x1, z1, x2, z2, width] of paths) {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const lengthSq = dx * dx + dz * dz;
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / lengthSq));
        closest = Math.min(closest, Math.hypot(x - (x1 + dx * t), z - (z1 + dz * t)) - width * 0.5);
      }
      return closest;
    };
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));


    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x647563, roughness: 0.94 });
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), rockMaterial, 68);
    
    for (let index = 0; index < 68; index += 1) {
      const angle = index * goldenAngle + 0.4;
      let radius = 30 + (index * 17 % 39);
      let x = Math.cos(angle) * radius;
      let z = Math.sin(angle) * radius - 7;
      if (distanceToPath(x, z) < 3.5) {
        radius += 10;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius - 7;
      }
      this.position.set(x, 0.65 + (index % 4) * 0.16, z);
      this.scale.set(0.75 + (index % 5) * 0.32, 0.7 + (index % 3) * 0.28, 0.82 + (index % 4) * 0.24);
      this.quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, index * 0.71);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      rocks.setMatrixAt(index, this.matrix);
    }
    rocks.instanceMatrix.needsUpdate = true;
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    this.scene.add(rocks);
    const hills = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: 0x456b4f, roughness: 0.96 }),
      20,
    );
    for (let index = 0; index < 20; index += 1) {
      const angle = index / 20 * Math.PI * 2 + 0.18;
      const radius = 74 + (index % 3) * 3;
      this.position.set(Math.cos(angle) * radius, 1.5 + (index % 4) * 0.45, Math.sin(angle) * radius - 7);
      this.scale.set(7.5 + (index % 5) * 0.9, 2.5 + (index % 4) * 0.7, 5.4 + (index % 3) * 0.8);
      this.quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, angle + index * 0.2);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      hills.setMatrixAt(index, this.matrix);
    }
    hills.instanceMatrix.needsUpdate = true;
    hills.castShadow = true;
    hills.receiveShadow = true;
    this.forest.add(hills);

    const trunkGeometry = new THREE.CylinderGeometry(0.34, 0.52, 3.5, 7);
    const crownGeometry = new THREE.DodecahedronGeometry(1.5, 0);
    const trunks = new THREE.InstancedMesh(trunkGeometry, new THREE.MeshStandardMaterial({ color: 0x6b4630, roughness: 0.94 }), 88);
    const crowns = new THREE.InstancedMesh(crownGeometry, new THREE.MeshStandardMaterial({ color: 0x245f45, roughness: 0.9 }), 88);
    const crownTops = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.06, 0), new THREE.MeshStandardMaterial({ color: 0x4f8450, roughness: 0.92 }), 88);
    let treeCount = 0;
    for (let candidate = 0; candidate < 180 && treeCount < 88; candidate += 1) {
      const angle = candidate * goldenAngle - 0.2;
      const radius = 18 + (candidate * 23 % 51);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius - 8;
      if (distanceToPath(x, z) < 4.2 || Math.hypot(x + 8.5, z + 37) < 10) continue;
      const treeScale = 0.78 + (candidate % 5) * 0.1;
      this.composeMatrix(x, 1.75 * treeScale, z, treeScale, candidate * 0.37);
      trunks.setMatrixAt(treeCount, this.matrix);
      this.position.set(x, 3.78 * treeScale, z);
      this.scale.set(1.18 * treeScale, 0.9 * treeScale, 1.06 * treeScale);
      this.quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, candidate * 0.53);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      crowns.setMatrixAt(treeCount, this.matrix);
      this.position.set(x + Math.sin(candidate) * 0.25, 4.72 * treeScale, z + Math.cos(candidate) * 0.2);
      this.scale.set(0.72 * treeScale, 0.64 * treeScale, 0.7 * treeScale);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      crownTops.setMatrixAt(treeCount, this.matrix);
      treeCount += 1;
    }
    for (const mesh of [trunks, crowns, crownTops]) {
      mesh.count = treeCount;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
    }
    this.forest.add(trunks, crowns, crownTops);

    const grassTufts = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.18, 0.7, 4),
      new THREE.MeshStandardMaterial({ color: 0x77a34d, roughness: 0.96 }),
      220,
    );
    let tuftCount = 0;
    for (let candidate = 0; candidate < 320 && tuftCount < 220; candidate += 1) {
      const angle = candidate * goldenAngle;
      const radius = 9 + (candidate * 29 % 61);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius - 6;
      if (distanceToPath(x, z) < 1.5) continue;
      const tuftScale = 0.5 + (candidate % 5) * 0.1;
      this.composeMatrix(x, 0.31 * tuftScale, z, tuftScale, candidate * 0.73);
      grassTufts.setMatrixAt(tuftCount, this.matrix);
      tuftCount += 1;
    }
    grassTufts.count = tuftCount;
    grassTufts.instanceMatrix.needsUpdate = true;
    grassTufts.castShadow = true;
    this.forest.add(grassTufts);
    this.scene.add(this.forest);

    const ruinMaterial = new THREE.MeshStandardMaterial({ color: 0xb7a789, roughness: 0.88 });
    const timberMaterial = new THREE.MeshStandardMaterial({ color: 0x70472e, roughness: 0.94 });
    this.addWatchtower(-25, -23, ruinMaterial, timberMaterial);
    this.addMushroomShrine(21, -21);

    const crystalMaterial = new THREE.MeshStandardMaterial({ color: 0x46b9d6, emissive: 0x07546b, emissiveIntensity: 0.55, roughness: 0.38 });
    const crystals = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1.4, 6), crystalMaterial, 24);
    for (let index = 0; index < 24; index += 1) {
      const cluster = index % 3;
      const centerX = ([-16, 15, -4] as const)[cluster]!;
      const centerZ = ([-32, -29, 27] as const)[cluster]!;
      const angle = index * 1.7;
      const radius = 1.8 + (index % 5) * 0.7;
      this.composeMatrix(centerX + Math.cos(angle) * radius, 0.55, centerZ + Math.sin(angle) * radius, 0.75 + (index % 4) * 0.13, angle);
      crystals.setMatrixAt(index, this.matrix);
    }
    crystals.instanceMatrix.needsUpdate = true;
    crystals.castShadow = true;
    this.sharedCrystals = crystals;
    this.scene.add(crystals);
    this.createWorldStages();
  }

  private addWatchtower(x: number, z: number, stone: THREE.Material, timber: THREE.Material): void {
    const tower = new THREE.Group();
    tower.position.set(x, 0, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.5, 0.58, 10), stone);
    base.position.y = 0.29;
    const keep = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.9, 4.7, 9), stone);
    keep.position.y = 2.65;
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.15, 0.38, 10), timber);
    deck.position.y = 5.05;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.65, 9), new THREE.MeshStandardMaterial({ color: 0x386f52, roughness: 0.9 }));
    roof.position.y = 6.12;
    for (let index = 0; index < 4; index += 1) {
      const angle = index * Math.PI * 0.5 + Math.PI * 0.25;
      const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 2.6, 6), timber);
      brace.position.set(Math.cos(angle) * 1.75, 4.3, Math.sin(angle) * 1.75);
      brace.rotation.z = Math.cos(angle) * 0.23;
      brace.rotation.x = Math.sin(angle) * 0.23;
      tower.add(brace);
    }
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.54, 0), new THREE.MeshStandardMaterial({ color: 0xffc45f, emissive: 0xb95b14, emissiveIntensity: 1.3, roughness: 0.34 }));
    beacon.position.y = 7.45;
    tower.add(base, keep, deck, roof, beacon);
    tower.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(tower);
  }

  private addMushroomShrine(x: number, z: number): void {
    const shrine = new THREE.Group();
    shrine.position.set(x, 0, z);
    const stone = new THREE.MeshStandardMaterial({ color: 0x746f68, roughness: 0.92 });
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0xd8c9a7, roughness: 0.88 });
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0xd8614f, emissive: 0x5f1713, emissiveIntensity: 0.16, roughness: 0.8 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.7, 0.5, 12), stone);
    base.position.y = 0.25;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.15, 3.8, 9), stemMaterial);
    stem.position.y = 2.35;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(2.7, 14, 7, 0, Math.PI * 2, 0, Math.PI * 0.52), capMaterial);
    cap.scale.y = 0.52;
    cap.position.y = 4.15;
    shrine.add(base, stem, cap);
    for (let index = 0; index < 6; index += 1) {
      const angle = index / 6 * Math.PI * 2;
      const smallStem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.9 + (index % 2) * 0.25, 7), stemMaterial);
      smallStem.position.set(Math.cos(angle) * 2.45, 0.85, Math.sin(angle) * 2.45);
      const smallCap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 9, 5, 0, Math.PI * 2, 0, Math.PI * 0.52), capMaterial);
      smallCap.scale.y = 0.5;
      smallCap.position.set(smallStem.position.x, 1.38 + (index % 2) * 0.24, smallStem.position.z);
      shrine.add(smallStem, smallCap);
    }
    shrine.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(shrine);
  }

  private createWorldStages(): void {
    const goldStone = new THREE.MeshStandardMaterial({ color: 0xd0a765, roughness: 0.76, metalness: 0.08 });
    const violetStone = new THREE.MeshStandardMaterial({ color: 0x72728b, roughness: 0.72 });

    const [greenhills, riftScar, crownAscent] = this.worldStages;
    this.stagePortals[0] = this.addPortal(greenhills, -8.5, -37, 0x48e7ff, 0x0b7684, 1.35);
    this.addCrystalCluster(greenhills, 9.8, -29.5, 0x43dfff, 1.25);
    this.addFlowerPatch(greenhills, -15.5, -17.5, 0xffcf77);
    this.addFlowerPatch(greenhills, 7.2, -24.8, 0x78d3ff);

    this.stagePortals[1] = this.addPortal(riftScar, -8.5, -37, 0xd85cff, 0x4b1c78, 1.52);
    this.addCrystalCluster(riftScar, 10.6, -30.4, 0xff5bd5, 1.5);
    this.addRubbleField(riftScar, -18.5, -25.2, goldStone);
    this.addRubbleField(riftScar, 17.5, -23.2, goldStone);

    this.stagePortals[2] = this.addPortal(crownAscent, -8.5, -37, 0xa86cff, 0x45266e, 1.7);
    this.addFloatingRocks(crownAscent, -21, -28.5, violetStone);
    this.addFloatingRocks(crownAscent, 18.5, -27.5, violetStone);
    this.addCrystalCluster(crownAscent, 8.5, -27.5, 0xc892ff, 1.65);

    for (const stage of this.worldStages) {
      stage.visible = false;
      this.scene.add(stage);
    }
  }

  private addPortal(group: THREE.Group, x: number, z: number, color: number, emissive: number, scale: number): PortalVisual {
    const stone = new THREE.MeshStandardMaterial({ color: 0x8b8477, roughness: 0.86 });
    const glow = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const veilMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.025, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.35 * scale, 2.72 * scale, 0.42, 12), stone);
    pedestal.position.set(x, 0.21, z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35 * scale, 0.12 * scale, 8, 24), glow);
    ring.scale.y = 1.35;
    ring.position.set(x, 2.12 * scale, z);
    const veil = new THREE.Mesh(new THREE.CircleGeometry(1.27 * scale, 32), veilMaterial);
    veil.scale.y = 1.32;
    veil.position.set(x, 2.12 * scale, z + 0.012);
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.5 * scale, 0), new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 1.4, roughness: 0.25 }));
    beacon.position.set(x, 4.15 * scale, z);
    group.add(pedestal, ring, veil, beacon);
    return { ring, veil, beacon };
  }

  private addCrystalCluster(group: THREE.Group, x: number, z: number, color: number, scale: number): void {
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.42, roughness: 0.3 });
    for (let index = 0; index < 4; index += 1) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry((0.42 + index * 0.12) * scale, 0), material);
      crystal.scale.y = 1.7 + index * 0.35;
      crystal.position.set(x + (index - 1.5) * 0.5 * scale, 0.62 * scale, z + (index % 2 ? 0.28 : -0.18) * scale);
      crystal.rotation.y = index * 0.65;
      group.add(crystal);
    }
  }

  private addFlowerPatch(group: THREE.Group, x: number, z: number, color: number): void {
    const material = new THREE.MeshBasicMaterial({ color });
    for (let index = 0; index < 7; index += 1) {
      const flower = new THREE.Mesh(new THREE.CircleGeometry(0.19, 6), material);
      flower.rotation.x = -Math.PI / 2;
      flower.position.set(x + (index % 3 - 1) * 0.48, 0.035, z + (Math.floor(index / 3) - 1) * 0.44);
      group.add(flower);
    }
  }

  private addRubbleField(group: THREE.Group, x: number, z: number, material: THREE.Material): void {
    for (let index = 0; index < 9; index += 1) {
      const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + (index % 3) * 0.24, 0), material);
      rubble.position.set(x + (index % 3 - 1) * 1.05, 0.36, z + (Math.floor(index / 3) - 1) * 0.95);
      rubble.rotation.set(index * 0.3, index * 0.47, index * 0.16);
      group.add(rubble);
    }
  }

  private addFloatingRocks(group: THREE.Group, x: number, z: number, material: THREE.Material): void {
    for (let index = 0; index < 4; index += 1) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + index * 0.2, 0), material);
      rock.scale.y = 0.66;
      rock.position.set(x + (index - 1.5) * 1.7, 2.4 + (index % 2) * 1.3, z + (index % 3 - 1) * 1.1);
      rock.rotation.set(index * 0.31, index * 0.7, index * 0.19);
      group.add(rock);
    }
  }

  private updateWorldStage(stage: number): void {
    if (stage === this.activeWorldStage) return;
    this.activeWorldStage = stage;
    const palette = stage === 1
      ? { ground: 0xa8b99b, path: 0xc0aa7f, fog: 0x9fc9d3, forest: true, textured: true }
      : stage === 2
        ? { ground: 0x5f403a, path: 0x9e6546, fog: 0xcf947b, forest: false, textured: false }
        : { ground: 0x59677d, path: 0xb9b8ab, fog: 0xaec0e2, forest: false, textured: false };
    this.groundMaterial?.color.setHex(palette.ground);
    if (this.groundMaterial) {
      this.groundMaterial.map = palette.textured ? this.groundTexture : null;
      this.groundMaterial.needsUpdate = true;
    }
    this.pathMaterial?.color.setHex(palette.path);
    if (this.pathMaterial) {
      this.pathMaterial.map = palette.textured ? this.pathTexture : null;
      this.pathMaterial.needsUpdate = true;
    }
    this.scene.fog?.color.setHex(palette.fog);
    this.forest.visible = palette.forest;
    if (this.sharedCrystals) this.sharedCrystals.visible = palette.forest;
    for (let index = 0; index < this.worldStages.length; index += 1) {
      const group = this.worldStages[index];
      if (group) group.visible = index === stage - 1;
    }
  }

  private updatePortalState(state: Readonly<SimulationSnapshot>, time: number): void {
    const portal = this.stagePortals[state.stage - 1];
    if (!portal) return;
    const open = state.portal !== null;
    const pulse = open ? 1 + Math.sin(time * 5.2) * 0.06 : 1;
    portal.ring.scale.set(pulse, pulse * 1.35, pulse);
    portal.ring.material.opacity = open ? 0.97 : 0.16;
    portal.veil.scale.set(pulse, pulse * 1.32, pulse);
    portal.veil.material.opacity = open ? 0.42 : 0.025;
    portal.beacon.material.emissiveIntensity = open ? 3.2 : 1.1;
    portal.beacon.rotation.y = time * (open ? 1.8 : 0.32);
  }

  private createPlayer(): THREE.Mesh {
    const navy = new THREE.MeshStandardMaterial({ color: 0x162c4b, roughness: 0.72 });
    const cyan = new THREE.MeshStandardMaterial({ color: 0x50d7e8, emissive: 0x0b5b66, emissiveIntensity: 0.25, roughness: 0.58 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x6e4932, roughness: 0.9 });
    const stone = new THREE.MeshStandardMaterial({ color: 0x697985, emissive: 0x0b7684, emissiveIntensity: 0.22, roughness: 0.66 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 0.75, 5, 8), navy);
    torso.position.y = 1.25;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 1), cyan);
    head.position.y = 2.25;
    const hammerHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 0), stone);
    hammerHead.scale.set(1.4, 0.9, 0.9);
    hammerHead.position.set(1.05, 1.7, 0.1);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.85, 7), leather);
    handle.position.set(0.62, 1.18, 0.08);
    handle.rotation.z = -0.5;
    this.hammerPivot.add(hammerHead, handle);
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.25), cyan);
    cape.position.set(0, 1.2, 0.46);
    cape.rotation.x = -0.1;
    this.playerFallback.add(torso, head, this.hammerPivot, cape);
    this.player.add(this.playerFallback);
    this.player.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = true;
    });
    this.scene.add(this.player);
    return cape;
  }

  private createEnemyActors(): [THREE.InstancedMesh, THREE.InstancedMesh, THREE.InstancedMesh, THREE.InstancedMesh, THREE.InstancedMesh] {
    // The 200-enemy crowd path is intentionally simpler than the nearby GLB
    // actors: silhouette first, so the stress budget stays available for combat.
    const body = new THREE.InstancedMesh(new THREE.ConeGeometry(0.42, 1.16, 5), new THREE.MeshLambertMaterial({ color: 0x2e743b }), MAX_VISIBLE_ENEMIES);
    const head = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.46, 0), new THREE.MeshLambertMaterial({ color: 0x8ac44b }), MAX_VISIBLE_ENEMIES);
    const mask = new THREE.InstancedMesh(new THREE.BoxGeometry(0.58, 0.36, 0.12), new THREE.MeshBasicMaterial({ color: 0xf0dfac }), MAX_VISIBLE_ENEMIES);
    const eyes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.11, 0.06), new THREE.MeshBasicMaterial({ color: 0xffa91f, transparent: true, opacity: 0.94 }), MAX_VISIBLE_ENEMIES);
    const telegraphGeometry = new THREE.RingGeometry(0.08, 1.9, 28, 1, -Math.PI / 2 - 0.62, 1.24);
    telegraphGeometry.rotateX(-Math.PI / 2);
    const telegraph = new THREE.InstancedMesh(telegraphGeometry, new THREE.MeshBasicMaterial({ color: 0xff1236, transparent: true, opacity: 0.98, side: THREE.DoubleSide, depthWrite: false }), MAX_VISIBLE_ENEMIES);
    telegraph.count = 0;
    for (const mesh of [body, head, mask, eyes]) {
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.scene.add(mesh);
    }
    telegraph.frustumCulled = false;
    this.scene.add(telegraph);
    this.scene.add(this.enemyFallbacks);
    return [body, head, mask, eyes, telegraph];
  }

  private createXpOrbs(): THREE.InstancedMesh {
    // World crystals are tall cones; XP is a flat, bright hex token so a moving
    // pickup reads differently before the magnet carries it to the player.
    const orbs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.18, 0.11, 6), new THREE.MeshStandardMaterial({ color: 0x8df7ff, emissive: 0x1496b8, emissiveIntensity: 1.7, roughness: 0.2, metalness: 0.16 }), MAX_VISIBLE_ORBS);
    orbs.count = 0;
    orbs.frustumCulled = false;
    this.scene.add(orbs);
    return orbs;
  }

  private createSwingRing(): THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.76, 1.02, 40, 1, -0.28, Math.PI * 1.18), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    this.scene.add(ring);
    return ring;
  }

  private createImpactPool(): void {
    for (let index = 0; index < MAX_IMPACT_PULSES; index += 1) {
      const mesh = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.72, 24), new THREE.MeshBasicMaterial({ color: 0xffc64d, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.scene.add(mesh);
      this.impactPulses.push({ mesh, startedAt: 0, expiresAt: 0, strength: 0 });
    }
  }

  private createImpactFlarePool(): void {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.translate(64, 64);
    context.fillStyle = "#ffffff";
    context.beginPath();
    for (let index = 0; index < 16; index += 1) {
      const angle = -Math.PI / 2 + index * Math.PI / 8;
      const radius = index % 2 === 0 ? 59 : 17;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    for (let index = 0; index < MAX_IMPACT_FLARES; index += 1) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      sprite.visible = false;
      this.scene.add(sprite);
      this.impactFlares.push({ sprite, startedAt: 0, expiresAt: 0, strength: 0 });
    }
  }

  private createBonkShards(): THREE.InstancedMesh {
    const shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: 0xffc64d, transparent: true, opacity: 0.98, blending: THREE.AdditiveBlending, depthWrite: false }), MAX_BONK_SHARDS);
    shards.count = 0;
    shards.frustumCulled = false;
    this.scene.add(shards);
    return shards;
  }

  private createDamagePopupPool(): void {
    for (let index = 0; index < MAX_DAMAGE_POPUPS; index += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const context = canvas.getContext("2d");
      if (!context) continue;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }));
      sprite.visible = false;
      sprite.scale.set(2.2, 1.1, 1);
      this.scene.add(sprite);
      this.damagePopups.push({ sprite, canvas, context, startedAt: 0, expiresAt: 0, x: 0, y: 0, z: 0 });
    }
  }

  private updatePlayer(state: Readonly<SimulationSnapshot>, time: number): void {
    const useCrowdHeroLod = Boolean(this.heroActor && state.enemies.length > MAX_DETAILED_ENEMY_ACTORS);
    if (this.heroActor) this.heroActor.visible = !useCrowdHeroLod;
    this.playerFallback.visible = useCrowdHeroLod || !this.heroActor;
    this.player.position.set(state.playerX, 0, state.playerZ);
    this.player.rotation.y = state.facing;

    const delta = this.lastAnimationSample === 0 ? 1 / 60 : Math.min(0.05, Math.max(0, time - this.lastAnimationSample));
    this.lastAnimationSample = time;
    const speedRatio = Math.min(1, state.speed / 7.5);
    const locomotionResponse = speedRatio > this.locomotionBlend ? 14 : 10;
    this.locomotionBlend += (speedRatio - this.locomotionBlend) * (1 - Math.exp(-locomotionResponse * delta));
    this.locomotionPhase += delta * (4.8 + speedRatio * 7.2);

    const motionScale = this.settings.reducedMotion ? 0.35 : 1;
    const stride = Math.sin(this.locomotionPhase) * this.locomotionBlend;
    const idleSway = Math.sin(time * 2.1) * (1 - this.locomotionBlend);
    this.player.position.y = Math.abs(stride) * 0.045 * motionScale;
    this.cape.rotation.x = -0.08 - Math.abs(stride) * 0.08 * motionScale;

    const attackPhase = state.attackPhase;
    const windup = attackPhase <= 0 || attackPhase >= 0.42
      ? 0
      : attackPhase < 0.22
        ? THREE.MathUtils.smoothstep(attackPhase, 0, 0.22)
        : 1 - THREE.MathUtils.smoothstep(attackPhase, 0.22, 0.42);
    const contact = attackPhase <= 0.18 || attackPhase >= 0.78
      ? 0
      : attackPhase < 0.46
        ? THREE.MathUtils.smoothstep(attackPhase, 0.18, 0.46)
        : 1 - THREE.MathUtils.smoothstep(attackPhase, 0.46, 0.78);
    const followThrough = attackPhase <= 0.42
      ? 0
      : attackPhase < 0.66
        ? THREE.MathUtils.smoothstep(attackPhase, 0.42, 0.66)
        : 1 - THREE.MathUtils.smoothstep(attackPhase, 0.66, 1);
    const attackWeight = Math.max(windup, contact, followThrough);
    const hammerSwing = -0.95 * windup + 1.75 * contact + 0.78 * followThrough;
    const armWalk = stride * (1 - attackWeight);

    this.player.position.y += (-windup * 0.055 + contact * 0.025) * motionScale;
    this.hammerPivot.rotation.z = -hammerSwing * 1.35;
    this.hammerPivot.rotation.x = attackWeight * 0.34;
    this.playerFallback.rotation.z = hammerSwing * 0.08;
    if (this.heroActor && this.heroActorRest) {
      this.heroActor.rotation.copy(this.heroActorRest);
      this.heroActor.rotation.x += this.locomotionBlend * 0.1 + windup * 0.26 - contact * 0.26 - followThrough * 0.14;
      this.heroActor.rotation.y += windup * 0.68 - contact * 0.68 - followThrough * 0.36;
      this.heroActor.rotation.z += stride * 0.035 + windup * 0.26 - contact * 0.22 - followThrough * 0.3;
    }
    if (this.heroLeftArm && this.heroLeftArmRest) {
      this.heroLeftArm.rotation.copy(this.heroLeftArmRest);
      this.heroLeftArm.rotation.x += armWalk * 1.0 + idleSway * 0.04 - windup * 0.45 + contact * 0.36 + followThrough * 0.16;
      this.heroLeftArm.rotation.y += -windup * 0.18 + contact * 0.22 + followThrough * 0.1;
      this.heroLeftArm.rotation.z += -windup * 0.42 + contact * 0.48 + followThrough * 0.24;
    }
    if (this.heroLeftForearm && this.heroLeftForearmRest) {
      this.heroLeftForearm.rotation.copy(this.heroLeftForearmRest);
      this.heroLeftForearm.rotation.x += windup * 0.18 - contact * 0.26 - followThrough * 0.12;
      this.heroLeftForearm.rotation.z += -windup * 0.72 + contact * 0.92 + followThrough * 0.44;
    }
    if (this.heroRightArm && this.heroRightArmRest) {
      this.heroRightArm.rotation.copy(this.heroRightArmRest);
      this.heroRightArm.rotation.x -= armWalk * 0.78 + idleSway * 0.03 + hammerSwing * 0.34;
      this.heroRightArm.rotation.y += -windup * 0.24 + contact * 0.3 + followThrough * 0.14;
      this.heroRightArm.rotation.z += windup * 0.32 - contact * 0.68 - followThrough * 0.4;
    }
    if (this.heroRightForearm && this.heroRightForearmRest) {
      this.heroRightForearm.rotation.copy(this.heroRightForearmRest);
      this.heroRightForearm.rotation.x += windup * 0.24 - contact * 0.42 - followThrough * 0.2;
      this.heroRightForearm.rotation.z += windup * 0.4 - contact * 0.9 - followThrough * 0.62;
    }
    if (this.heroLeftLeg && this.heroLeftLegRest) {
      this.heroLeftLeg.rotation.copy(this.heroLeftLegRest);
      this.heroLeftLeg.rotation.x -= stride * 1.05 - windup * 0.4 + contact * 0.34 + followThrough * 0.16;
      this.heroLeftLeg.rotation.z += windup * 0.24 + contact * 0.18 + followThrough * 0.1;
    }
    if (this.heroLeftLowerLeg && this.heroLeftLowerLegRest) {
      this.heroLeftLowerLeg.rotation.copy(this.heroLeftLowerLegRest);
      this.heroLeftLowerLeg.rotation.x += windup * 0.42 - contact * 0.28 - followThrough * 0.14;
      this.heroLeftLowerLeg.rotation.z += windup * 0.3 - contact * 0.2;
    }
    if (this.heroRightLeg && this.heroRightLegRest) {
      this.heroRightLeg.rotation.copy(this.heroRightLegRest);
      this.heroRightLeg.rotation.x += stride * 1.05 + windup * 0.4 - contact * 0.34 - followThrough * 0.2;
      this.heroRightLeg.rotation.z -= windup * 0.22 + contact * 0.16 + followThrough * 0.18;
    }
    if (this.heroRightLowerLeg && this.heroRightLowerLegRest) {
      this.heroRightLowerLeg.rotation.copy(this.heroRightLowerLegRest);
      this.heroRightLowerLeg.rotation.x -= windup * 0.5 - contact * 0.36 - followThrough * 0.18;
      this.heroRightLowerLeg.rotation.z -= windup * 0.34 + contact * 0.24 + followThrough * 0.1;
    }
    if (this.heroCapeActor && this.heroCapeRest) {
      this.heroCapeActor.rotation.copy(this.heroCapeRest);
      this.heroCapeActor.rotation.x -= 0.07 + (Math.abs(stride) * 0.22 + windup * 0.14 + contact * 0.24 + followThrough * 0.18) * motionScale;
      this.heroCapeActor.rotation.z += (stride * 0.045 + windup * 0.18 - contact * 0.22 - followThrough * 0.32) * motionScale;
    }
    if (this.heroHammerActor && this.heroHammerRest) {
      this.heroHammerActor.rotation.copy(this.heroHammerRest);
      if (this.heroHammerRestPosition) {
        this.heroHammerActor.position.copy(this.heroHammerRestPosition);
        this.heroHammerActor.position.x += -windup * 0.8 + contact * 1.0 + followThrough * 0.55;
      }
      this.heroHammerActor.rotation.z += windup * 0.12 - contact * 0.28 - followThrough * 0.14;
      this.heroHammerActor.rotation.y += windup * 0.06 - contact * 0.12 - followThrough * 0.05;
      this.heroHammerActor.rotation.x += attackWeight * 0.08;
    }
    this.swingRing.visible = state.attackPhase > 0.3 && state.attackPhase < 0.86;
    if (this.swingRing.visible) {
      const radius = 1.65 + state.attackPhase * 1.45;
      this.swingRing.position.set(state.playerX, 0.055, state.playerZ);
      this.swingRing.rotation.z = state.facing - Math.PI;
      this.swingRing.scale.setScalar(radius);
      this.swingRing.material.opacity = (1 - state.attackPhase) * 1.05;
    }
  }

  private updateEnemies(state: Readonly<SimulationSnapshot>, time: number): void {
    const enemyCount = Math.min(state.enemies.length, MAX_VISIBLE_ENEMIES);
    this.enemyBodies.count = enemyCount;
    this.enemyHeads.count = enemyCount;
    this.enemyMasks.count = enemyCount;
    this.enemyEyes.count = enemyCount;
    let telegraphCount = 0;
    for (let index = 0; index < enemyCount; index += 1) {
      const enemy = state.enemies[index];
      if (!enemy) continue;
      const guardian = enemy.kind === "guardian";
      const scale = (guardian ? 1.7 : 1) * (1 + enemy.hitPulse * 0.16);
      const facing = Math.atan2(state.playerX - enemy.x, state.playerZ - enemy.z);
      const bounce = Math.abs(Math.sin(time * (guardian ? 4 : 8) + enemy.id)) * (guardian ? 0.06 : 0.1);
      this.composeMatrix(enemy.x, 0.76 * scale + bounce, enemy.z, scale, facing);
      this.enemyBodies.setMatrixAt(index, this.matrix);
      this.composeMatrix(enemy.x, 1.55 * scale + bounce, enemy.z, scale, facing);
      this.enemyHeads.setMatrixAt(index, this.matrix);
      this.composeMatrix(enemy.x, 1.54 * scale + bounce, enemy.z - 0.41 * scale, scale, facing);
      this.enemyMasks.setMatrixAt(index, this.matrix);
      this.composeMatrix(enemy.x, 1.56 * scale + bounce, enemy.z - 0.49 * scale, scale, facing);
      this.enemyEyes.setMatrixAt(index, this.matrix);
      if (enemy.telegraph > 0 && telegraphCount < MAX_VISIBLE_ENEMIES) {
        const telegraphScale = guardian ? 1.78 : 1.05;
        this.composeMatrix(enemy.x, 0.06, enemy.z, telegraphScale, facing);
        this.enemyTelegraphs.setMatrixAt(telegraphCount, this.matrix);
        telegraphCount += 1;
      }
    }
    this.enemyBodies.instanceMatrix.needsUpdate = true;
    this.enemyHeads.instanceMatrix.needsUpdate = true;
    this.enemyMasks.instanceMatrix.needsUpdate = true;
    this.enemyEyes.instanceMatrix.needsUpdate = true;
    this.enemyTelegraphs.count = telegraphCount;
    this.enemyTelegraphs.instanceMatrix.needsUpdate = true;
    const guardian = state.enemies.find((enemy) => enemy.kind === "guardian");
    const useDetailedActors = this.enemyActors.length > 0 && state.enemies.length <= MAX_DETAILED_ENEMY_ACTORS;
    const useGuardianActor = Boolean(useDetailedActors && guardian && this.guardianActor);
    const useInstancedFallback = !useDetailedActors || Boolean(guardian && !useGuardianActor);
    this.enemyBodies.visible = useInstancedFallback;
    this.enemyHeads.visible = useInstancedFallback;
    this.enemyMasks.visible = useInstancedFallback;
    this.enemyEyes.visible = useInstancedFallback;
    if (this.enemyActors.length > 0) {
      const detailedEnemies = useDetailedActors ? state.enemies.filter((enemy) => enemy.kind === "rattlecap") : [];
      for (let index = 0; index < this.enemyActors.length; index += 1) {
        const actor = this.enemyActors[index];
        const enemy = detailedEnemies[index];
        if (!actor) continue;
        if (!enemy) {
          actor.visible = false;
          continue;
        }
        actor.visible = true;
        const scale = 0.76 * (1 + enemy.hitPulse * 0.18);
        const bounce = Math.abs(Math.sin(time * 8 + enemy.id)) * 0.08;
        actor.position.set(enemy.x, 0.02 + bounce, enemy.z);
        actor.rotation.y = Math.atan2(state.playerX - enemy.x, state.playerZ - enemy.z) + Math.PI;
        actor.scale.setScalar(scale);
        actor.rotation.z = enemy.hitPulse * Math.sin(time * 38 + enemy.id) * 0.22;
      }
    }
    if (this.guardianActor) {
      this.guardianActor.visible = useGuardianActor;
      if (guardian && useGuardianActor) {
        const facing = Math.atan2(state.playerX - guardian.x, state.playerZ - guardian.z) + Math.PI;
        const bounce = Math.sin(time * 2.4 + guardian.id) * 0.035;
        this.guardianActor.position.set(guardian.x, bounce, guardian.z);
        this.guardianActor.rotation.set(0, facing, guardian.hitPulse * Math.sin(time * 30 + guardian.id) * 0.08);
        const scale = 0.72 * (1 + guardian.hitPulse * 0.12);
        this.guardianActor.scale.setScalar(scale);
        if (this.guardianAttackPivot && this.guardianAttackRest) {
          this.guardianAttackPivot.rotation.copy(this.guardianAttackRest);
          this.guardianAttackPivot.rotation.x -= guardian.telegraph * 0.54;
        }
        if (this.guardianCrownPivot) this.guardianCrownPivot.rotation.y = time * 1.55;
      }
    }
  }

  private updateXpOrbs(state: Readonly<SimulationSnapshot>, time: number): void {
    const orbCount = Math.min(state.xpOrbs.length, MAX_VISIBLE_ORBS);
    this.xpOrbs.count = orbCount;
    for (let index = 0; index < orbCount; index += 1) {
      const orb = state.xpOrbs[index];
      if (!orb) continue;
      this.composeMatrix(orb.x, 0.45 + Math.sin(time * 6 + orb.id) * 0.14, orb.z, 1, time * 2 + orb.id);
      this.xpOrbs.setMatrixAt(index, this.matrix);
    }
    this.xpOrbs.instanceMatrix.needsUpdate = true;
  }

  private applyEvents(events: readonly CombatEvent[], time: number): void {
    for (const event of events) {
      if (event.type === "swing") continue;
      if (event.type === "impact" || event.type === "hurt" || event.type === "enemyDeath" || event.type === "guardianSpawn" || event.type === "levelUp" || event.type === "portalOpen") this.startPulse(event, time);
      if (event.type === "impact" && event.value !== undefined) {
        this.startBonkBurst(event, time);
        if (this.settings.damageNumbers) this.startDamagePopup(event, time);
        this.cameraShake = Math.max(this.cameraShake, event.strength * 0.58);
      }
      if (event.type === "enemyDeath") this.startBonkBurst(event, time);
      if (event.type === "hurt") this.cameraShake = Math.max(this.cameraShake, event.strength * 0.52);
    }
  }

  private startPulse(event: CombatEvent, time: number): void {
    const pulse = this.impactPulses.find((candidate) => candidate.expiresAt <= time) ?? this.impactPulses[0];
    if (!pulse) return;
    const missed = event.type === "impact" && event.value === undefined;
    pulse.startedAt = time;
    pulse.expiresAt = time + (event.type === "guardianSpawn" || event.type === "portalOpen" ? 1.1 : event.type === "hurt" ? 0.42 : missed ? 0.24 : 0.58);
    pulse.strength = event.strength;
    pulse.mesh.position.set(event.x, 0.07, event.z);
    pulse.mesh.scale.setScalar(0.25);
    pulse.mesh.material.color.set(event.type === "guardianSpawn" ? 0xa56cff : event.type === "portalOpen" ? 0x64efff : event.type === "levelUp" ? 0x64efff : event.type === "hurt" ? 0xff214f : event.type === "enemyDeath" ? 0xffffff : missed ? 0x7ec5cf : 0xff572e);
    pulse.mesh.visible = true;
    if (event.type === "impact" && !missed) this.startImpactFlare(event, time);
  }

  private startImpactFlare(event: CombatEvent, time: number): void {
    for (const [index, color] of [0xff7a32, 0x54edff].entries()) {
      const flare = this.impactFlares.find((candidate) => candidate.expiresAt <= time) ?? this.impactFlares[index];
      if (!flare) continue;
      flare.startedAt = time;
      flare.expiresAt = time + 0.32 + index * 0.06;
      flare.strength = event.strength;
      flare.sprite.position.set(event.x, 0.65 + index * 0.08, event.z);
      flare.sprite.material.color.set(color);
      flare.sprite.material.rotation = index * 0.4;
      flare.sprite.visible = true;
    }
  }

  private updateEffects(time: number): void {
    for (const pulse of this.impactPulses) {
      if (pulse.expiresAt <= time) {
        pulse.mesh.visible = false;
        continue;
      }
      const progress = (time - pulse.startedAt) / (pulse.expiresAt - pulse.startedAt);
      const scale = 0.6 + progress * (2.2 + pulse.strength * 1.3);
      pulse.mesh.scale.setScalar(scale);
      pulse.mesh.material.opacity = (1 - progress) * 0.76;
    }
    for (const flare of this.impactFlares) {
      if (flare.expiresAt <= time) {
        flare.sprite.visible = false;
        continue;
      }
      const progress = (time - flare.startedAt) / (flare.expiresAt - flare.startedAt);
      flare.sprite.visible = true;
      flare.sprite.scale.setScalar((0.44 + flare.strength * 0.38) * (1 + progress * 1.08));
      flare.sprite.material.opacity = (1 - progress) * 0.92;
    }
    let visibleShards = 0;
    for (let index = 0; index < this.shardState.length; index += 1) {
      const shard = this.shardState[index];
      if (!shard || shard.expiresAt <= time) continue;
      const age = time - shard.startedAt;
      const progress = age / (shard.expiresAt - shard.startedAt);
      const x = shard.x + shard.vx * age;
      const y = shard.y + shard.vy * age - 4.5 * age * age;
      const z = shard.z + shard.vz * age;
      this.composeMatrix(x, Math.max(0.08, y), z, shard.scale * (1 - progress * 0.45), age * 15 + index);
      this.bonkShards.setMatrixAt(visibleShards, this.matrix);
      visibleShards += 1;
    }
    this.bonkShards.count = visibleShards;
    this.bonkShards.instanceMatrix.needsUpdate = true;
    for (const popup of this.damagePopups) {
      if (popup.expiresAt <= time) {
        popup.sprite.visible = false;
        continue;
      }
      const progress = (time - popup.startedAt) / (popup.expiresAt - popup.startedAt);
      popup.sprite.visible = true;
      popup.sprite.position.set(popup.x, popup.y + progress * 1.7, popup.z);
      const scale = (1 + progress * 0.5) * (1 - progress * 0.28);
      popup.sprite.scale.set(2.2 * scale, 1.1 * scale, 1);
      popup.sprite.material.opacity = Math.min(1, (1 - progress) * 1.4);
    }
  }

  private startBonkBurst(event: CombatEvent, time: number): void {
    const count = event.type === "enemyDeath" ? 11 : 7;
    for (let index = 0; index < count; index += 1) {
      const slot = this.shardState.findIndex((shard) => shard.expiresAt <= time);
      const direction = event.id * 1.71 + index / count * Math.PI * 2;
      const strength = event.strength * (1.6 + (index % 3) * 0.45);
      const next: BonkShard = {
        x: event.x,
        y: 0.34,
        z: event.z,
        vx: Math.cos(direction) * strength,
        vy: 2.1 + (index % 4) * 0.48,
        vz: Math.sin(direction) * strength,
        startedAt: time,
        expiresAt: time + 0.56 + (index % 3) * 0.07,
        scale: 0.42 + event.strength * 0.11,
      };
      if (slot >= 0) this.shardState[slot] = next;
      else if (this.shardState.length < MAX_BONK_SHARDS) this.shardState.push(next);
      else this.shardState[index % MAX_BONK_SHARDS] = next;
    }
  }

  private startDamagePopup(event: CombatEvent, time: number): void {
    const popup = this.damagePopups.find((candidate) => candidate.expiresAt <= time) ?? this.damagePopups[0];
    if (!popup || !event.value) return;
    const { context, canvas } = popup;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "900 68px Barlow Condensed, Arial Black, sans-serif";
    context.textAlign = "center";
    context.lineJoin = "round";
    context.lineWidth = 14;
    context.strokeStyle = "#15101a";
    context.strokeText(`-${event.value}`, canvas.width / 2, 80);
    context.fillStyle = event.strength > 1.2 ? "#fff2b0" : "#ffc64d";
    context.fillText(`-${event.value}`, canvas.width / 2, 80);
    const material = popup.sprite.material;
    if (material.map) material.map.needsUpdate = true;
    popup.x = event.x;
    popup.y = 1.35;
    popup.z = event.z;
    popup.startedAt = time;
    popup.expiresAt = time + 0.8;
    popup.sprite.visible = true;
  }

  private composeMatrix(x: number, y: number, z: number, uniformScale: number, rotationY = 0): void {
    this.position.set(x, y, z);
    this.scale.setScalar(uniformScale);
    this.quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rotationY);
    this.matrix.compose(this.position, this.quaternion, this.scale);
  }

  private async loadPrototypeActors(): Promise<void> {
    const loader = new GLTFLoader();
    try {
      const heroAsset = ASSET_MANIFEST["hero.crown-runner.v1"];
      const enemyAsset = ASSET_MANIFEST["enemy.rattlecap.v1"];
      const guardianAsset = ASSET_MANIFEST["boss.king-grom.v1"];
      if (!heroAsset?.runtimeUrl || !enemyAsset?.runtimeUrl || !guardianAsset?.runtimeUrl) return;
      const [heroGltf, enemyGltf, guardianGltf] = await Promise.all([
        loader.loadAsync(heroAsset.runtimeUrl),
        loader.loadAsync(enemyAsset.runtimeUrl),
        loader.loadAsync(guardianAsset.runtimeUrl),
      ]);
      const hero = heroGltf.scene;
      hero.scale.setScalar(0.74);
      hero.rotation.y = Math.PI;
      // `crown_runner_v1` is authored around a ground-at-zero gameplay pivot
      // and exported Y-up; its local bounds extend downward from its root.
      hero.position.set(0, 2.84, 0);
      hero.traverse((child) => {
        if (child instanceof THREE.Mesh) child.castShadow = true;
      });
      this.player.add(hero);
      this.heroActor = hero;
      this.heroActorRest = hero.rotation.clone();
      this.playerFallback.visible = false;
      this.heroHammerActor = hero.getObjectByName("Hero_HammerPivot") ?? null;
      this.heroHammerRest = this.heroHammerActor?.rotation.clone() ?? null;
      this.heroHammerRestPosition = this.heroHammerActor?.position.clone() ?? null;
      this.heroLeftArm = hero.getObjectByName("Hero_Arm_L") ?? null;
      this.heroRightArm = hero.getObjectByName("Hero_Arm_R") ?? null;
      this.heroLeftForearm = hero.getObjectByName("Hero_Forearm_L") ?? null;
      this.heroRightForearm = hero.getObjectByName("Hero_Forearm_R") ?? null;
      this.heroLeftLeg = hero.getObjectByName("Hero_Leg_L") ?? null;
      this.heroRightLeg = hero.getObjectByName("Hero_Leg_R") ?? null;
      this.heroLeftLowerLeg = hero.getObjectByName("Hero_LowerLeg_L") ?? null;
      this.heroRightLowerLeg = hero.getObjectByName("Hero_LowerLeg_R") ?? null;
      this.heroCapeActor = hero.getObjectByName("Hero_Cape") ?? null;
      this.heroLeftArmRest = this.heroLeftArm?.rotation.clone() ?? null;
      this.heroRightArmRest = this.heroRightArm?.rotation.clone() ?? null;
      this.heroLeftForearmRest = this.heroLeftForearm?.rotation.clone() ?? null;
      this.heroRightForearmRest = this.heroRightForearm?.rotation.clone() ?? null;
      this.heroLeftLegRest = this.heroLeftLeg?.rotation.clone() ?? null;
      this.heroRightLegRest = this.heroRightLeg?.rotation.clone() ?? null;
      this.heroLeftLowerLegRest = this.heroLeftLowerLeg?.rotation.clone() ?? null;
      this.heroRightLowerLegRest = this.heroRightLowerLeg?.rotation.clone() ?? null;
      this.heroCapeRest = this.heroCapeActor?.rotation.clone() ?? null;

      for (let index = 0; index < MAX_DETAILED_ENEMY_ACTORS; index += 1) {
        const actor = enemyGltf.scene.clone(true);
        actor.visible = false;
        actor.traverse((child) => {
          if (child instanceof THREE.Mesh) child.castShadow = true;
        });
        this.enemyActors.push(actor);
        this.enemyFallbacks.add(actor);
      }
      const guardian = guardianGltf.scene;
      guardian.visible = false;
      guardian.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.guardianActor = guardian;
      this.guardianAttackPivot = guardian.getObjectByName("SOCKET_Grom_ATTACK") ?? null;
      this.guardianAttackRest = this.guardianAttackPivot?.rotation.clone() ?? null;
      this.guardianCrownPivot = guardian.getObjectByName("SOCKET_Grom_FLOATING_CROWN") ?? null;
      this.enemyFallbacks.add(guardian);
      this.enemyBodies.visible = false;
      this.enemyHeads.visible = false;
      this.enemyMasks.visible = false;
      this.enemyEyes.visible = false;
    } catch {
      // The low-poly fallback actors keep the run playable if optional GLBs fail.
    }
  }

  private async loadEnvironmentPrototype(): Promise<void> {
    await Promise.all([
      this.loadEnvironmentAsset("environment.mosswatch-tower.v1", 0, new THREE.Vector3(-8.5, 0, -45.6), -0.18, 1.9),
      this.loadEnvironmentAsset("environment.rift-scar-arch.v1", 1, new THREE.Vector3(-8.5, 0, -43.8), 0.12, 2.1),
      this.loadEnvironmentAsset("environment.crown-ascent-spire.v1", 2, new THREE.Vector3(-8.5, 0, -46.2), -0.18, 1.95),
    ]);
  }

  private async loadEnvironmentAsset(
    assetId: keyof typeof ASSET_MANIFEST,
    stageIndex: 0 | 1 | 2,
    position: THREE.Vector3,
    rotationY: number,
    scale: number,
  ): Promise<void> {
    const asset = ASSET_MANIFEST[assetId];
    if (!asset?.runtimeUrl) return;
    try {
      const gltf = await new GLTFLoader().loadAsync(asset.runtimeUrl);
      const landmark = gltf.scene;
      landmark.position.copy(position);
      landmark.rotation.y = rotationY;
      landmark.scale.setScalar(scale);
      const bounds = new THREE.Box3().setFromObject(landmark);
      landmark.position.y -= bounds.min.y;
      landmark.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.worldStages[stageIndex].add(landmark);
    } catch {
      // The stage remains playable with its procedural portal and landmark fallback.
    }
  }

  private readonly resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };
}
