import type { InputController } from "./InputController";
import { SpatialHash } from "./SpatialHash";

const ARENA_LIMIT = 72;
const PLAYER_SPEED = 7.5;
const PLAYER_ACCELERATION = 22;
const PLAYER_FRICTION = 10;
const PLAYER_TURN_RESPONSE = 18;
const ATTACK_DURATION = 0.42;
const ATTACK_COOLDOWN = 0.58;
const ATTACK_RANGE = 3.25;
const NORMAL_ENEMY_LIMIT = 18;
const STRESS_ENEMY_COUNT = 200;
const ENEMY_AI_INTERVAL = 1 / 20;
const STAGE_CLEAR_TARGETS: readonly [number, number, number] = [5, 6, 7];
const PORTAL_X = -8.5;
const PORTAL_Z = -37;
const PORTAL_INTERACT_RANGE = 4;
const XP_MAGNET_RANGE = 10;

export type EnemyKind = "rattlecap" | "guardian";
export type UpgradeId = "heavy-swing" | "wide-swing" | "crown-guard";
export type RunOutcome = "playing" | "victory" | "defeat";
export type ExpeditionStage = 1 | 2 | 3;
export type RoutePhase = "combat" | "portal" | "boss";
export type PortalDestination = 2 | 3 | "grom";

export interface PortalSnapshot {
  x: number;
  z: number;
  destination: PortalDestination;
}

export interface EnemySnapshot {
  id: number;
  kind: EnemyKind;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  hitPulse: number;
  telegraph: number;
}

export interface XpOrbSnapshot {
  id: number;
  x: number;
  z: number;
}

export interface UpgradeChoice {
  id: UpgradeId;
  title: string;
  detail: string;
  stat: string;
}

export interface CombatEvent {
  id: number;
  type: "swing" | "impact" | "enemyDeath" | "hurt" | "guardianSpawn" | "levelUp" | "portalOpen";
  x: number;
  z: number;
  strength: number;
  value?: number;
}

export interface SimulationSnapshot {
  runId: string;
  playerX: number;
  playerZ: number;
  facing: number;
  cameraYaw: number;
  cameraPitch: number;
  speed: number;
  elapsed: number;
  health: number;
  maxHealth: number;
  level: number;
  xp: number;
  xpToNext: number;
  kills: number;
  score: number;
  stage: ExpeditionStage;
  stageName: string;
  attackPhase: number;
  attackCooldown: number;
  enemies: readonly EnemySnapshot[];
  xpOrbs: readonly XpOrbSnapshot[];
  objective: string;
  routePhase: RoutePhase;
  portal: PortalSnapshot | null;
  pendingUpgrades: readonly UpgradeChoice[] | null;
  outcome: RunOutcome;
}

interface Enemy extends EnemySnapshot {
  speed: number;
  touchDamage: number;
  attackCooldown: number;
  knockback: number;
}

interface XpOrb extends XpOrbSnapshot {
  value: number;
}

const UPGRADE_CHOICES: readonly UpgradeChoice[] = [
  { id: "heavy-swing", title: "Agir Bas", detail: "Her BONK daha sert iner.", stat: "+%35 hasar" },
  { id: "wide-swing", title: "Yarici Cekic", detail: "Darbe daha genis bir alani kavrar.", stat: "+%30 menzil" },
  { id: "crown-guard", title: "Tac Muhafizi", detail: "Kirilmayan irade seni ayakta tutar.", stat: "+45 can, iyiles" },
];

export class Simulation {
  private readonly snapshot: SimulationSnapshot = {
    runId: "bootstrap",
    playerX: 0,
    playerZ: 12,
    facing: Math.PI,
    cameraYaw: 0,
    cameraPitch: 0,
    speed: 0,
    elapsed: 0,
    health: 120,
    maxHealth: 120,
    level: 1,
    xp: 0,
    xpToNext: 40,
    kills: 0,
    score: 0,
    stage: 1,
    stageName: "MOSSWATCH HARABELERI / BOLUM 1",
    attackPhase: 0,
    attackCooldown: 0,
    enemies: [],
    xpOrbs: [],
    objective: "Yarigi temizle ve muhafizi cagir",
    routePhase: "combat",
    portal: null,
    pendingUpgrades: null,
    outcome: "playing",
  };
  private readonly enemies: Enemy[] = [];
  private readonly enemyPool: Enemy[] = [];
  private readonly enemyGrid = new SpatialHash<Enemy>(5);
  private readonly xpOrbs: XpOrb[] = [];
  private readonly visualEvents: CombatEvent[] = [];
  private nextEnemyId = 1;
  private nextOrbId = 1;
  private nextEventId = 1;
  private runSerial = 0;
  private spawnTimer = 0;
  private attackTimer = 0;
  private attackCooldown = 0;
  private playerHurtCooldown = 0;
  private attackHitPending = false;
  private spawnSequence = 0;
  private guardianSpawned = false;
  private baseDamage = 44;
  private attackRange = ATTACK_RANGE;
  private pendingUpgrades: readonly UpgradeChoice[] | null = null;
  private autoAttack = true;
  private stressMode = false;
  private guardianPreviewMode = false;
  private enemyAiAccumulator = 0;
  private stageKills = 0;
  private portalOpen = false;
  private playerVelocityX = 0;
  private playerVelocityZ = 0;

  constructor(private readonly input: InputController) {}

  setStressMode(enabled: boolean): void {
    this.stressMode = enabled;
  }

  setGuardianPreviewMode(enabled: boolean): void {
    this.guardianPreviewMode = enabled;
  }

  reset(): void {
    this.recycleEnemies();
    this.xpOrbs.length = 0;
    this.visualEvents.length = 0;
    this.nextEnemyId = 1;
    this.nextOrbId = 1;
    this.nextEventId = 1;
    this.spawnTimer = 2.8;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.playerHurtCooldown = 0;
    this.attackHitPending = false;
    this.enemyAiAccumulator = 0;
    this.spawnSequence = 0;
    this.guardianSpawned = false;
    this.baseDamage = 44;
    this.attackRange = ATTACK_RANGE;
    this.pendingUpgrades = null;
    this.stageKills = 0;
    this.portalOpen = false;
    this.playerVelocityX = 0;
    this.playerVelocityZ = 0;
    Object.assign(this.snapshot, {
      runId: `run-${Date.now().toString(36)}-${++this.runSerial}`,
      playerX: 0,
      playerZ: 12,
      facing: Math.PI,
      cameraYaw: this.input.getCameraYaw(),
      cameraPitch: this.input.getCameraPitch(),
      speed: 0,
      elapsed: 0,
      health: 120,
      maxHealth: 120,
      level: 1,
      xp: 0,
      xpToNext: 40,
      kills: 0,
      score: 0,
      stage: 1,
      stageName: "MOSSWATCH HARABELERI / BOLUM 1",
      attackPhase: 0,
      attackCooldown: 0,
      objective: "Bolgeyi temizle: 0 / 5",
      routePhase: "combat",
      portal: null,
      pendingUpgrades: null,
      outcome: "playing",
    });
    if (this.guardianPreviewMode) {
      this.snapshot.stage = 3;
      this.snapshot.stageName = "TAC YUKSELISI / GROM ONIZLEME";
      this.snapshot.routePhase = "boss";
      this.guardianSpawned = true;
      this.spawnGuardian(2.6);
    } else if (this.stressMode) {
      this.snapshot.objective = `PERF STRESS: ${STRESS_ENEMY_COUNT} aktif Rattlecap`;
      this.spawnStressWave();
    } else {
      // Put the first readable exchange in front of the player before the wider horde ramps up.
      this.spawnRattlecapAt(this.snapshot.playerX, this.snapshot.playerZ - 2.6, 0.62);
      this.spawnRattlecap(9.4);
    }
    this.enemyGrid.rebuild(this.enemies);
    this.syncCollections();
  }

  update(dt: number): void {
    if (this.snapshot.outcome !== "playing" || this.pendingUpgrades) return;

    this.snapshot.elapsed += dt;
    this.updatePlayer(dt);
    this.updateRoute();
    this.updateAttack(dt);
    this.updateSpawning(dt);
    if (this.updateEnemies(dt)) this.enemyGrid.rebuild(this.enemies);
    this.updateXpOrbs(dt);
    this.syncCollections();
  }

  chooseUpgrade(id: UpgradeId): void {
    if (!this.pendingUpgrades || this.snapshot.outcome !== "playing") return;
    if (id === "heavy-swing") this.baseDamage *= 1.35;
    if (id === "wide-swing") this.attackRange *= 1.3;
    if (id === "crown-guard") {
      this.snapshot.maxHealth += 45;
      this.snapshot.health = this.snapshot.maxHealth;
    }
    this.pendingUpgrades = null;
    this.snapshot.pendingUpgrades = null;
    this.snapshot.objective = this.getExpeditionObjective();
    this.syncCollections();
  }

  setAutoAttack(enabled: boolean): void {
    this.autoAttack = enabled;
  }

  consumeVisualEvents(): readonly CombatEvent[] {
    const events = [...this.visualEvents];
    this.visualEvents.length = 0;
    return events;
  }

  getState(): Readonly<SimulationSnapshot> {
    return this.snapshot;
  }

  private updatePlayer(dt: number): void {
    const move = this.input.getMoveIntent();
    const moving = Math.abs(move.x) + Math.abs(move.z) > 0.01;
    const targetVelocityX = moving ? move.x * PLAYER_SPEED : 0;
    const targetVelocityZ = moving ? move.z * PLAYER_SPEED : 0;
    const response = moving ? Math.min(1, PLAYER_ACCELERATION * dt) : 1 - Math.exp(-PLAYER_FRICTION * dt);
    this.playerVelocityX += (targetVelocityX - this.playerVelocityX) * response;
    this.playerVelocityZ += (targetVelocityZ - this.playerVelocityZ) * response;
    if (!moving && Math.hypot(this.playerVelocityX, this.playerVelocityZ) < 0.02) {
      this.playerVelocityX = 0;
      this.playerVelocityZ = 0;
    }

    const nextX = this.snapshot.playerX + this.playerVelocityX * dt;
    const nextZ = this.snapshot.playerZ + this.playerVelocityZ * dt;
    const radius = Math.hypot(nextX, nextZ);
    const clampScale = radius > ARENA_LIMIT ? ARENA_LIMIT / radius : 1;
    this.snapshot.playerX = nextX * clampScale;
    this.snapshot.playerZ = nextZ * clampScale;
    if (radius > ARENA_LIMIT) {
      const normalX = nextX / radius;
      const normalZ = nextZ / radius;
      const outwardSpeed = this.playerVelocityX * normalX + this.playerVelocityZ * normalZ;
      if (outwardSpeed > 0) {
        this.playerVelocityX -= normalX * outwardSpeed;
        this.playerVelocityZ -= normalZ * outwardSpeed;
      }
    }

    const speed = Math.hypot(this.playerVelocityX, this.playerVelocityZ);
    if (speed > 0.05) {
      const targetFacing = Math.atan2(this.playerVelocityX, this.playerVelocityZ);
      const deltaFacing = Math.atan2(Math.sin(targetFacing - this.snapshot.facing), Math.cos(targetFacing - this.snapshot.facing));
      this.snapshot.facing += deltaFacing * (1 - Math.exp(-PLAYER_TURN_RESPONSE * dt));
    }
    this.snapshot.cameraYaw = this.input.getCameraYaw();
    this.snapshot.cameraPitch = this.input.getCameraPitch();
    this.snapshot.speed = speed;
  }

  private updateAttack(dt: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.snapshot.attackCooldown = this.attackCooldown;
    if (this.attackTimer > 0) {
      const previous = this.attackTimer;
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      this.snapshot.attackPhase = 1 - this.attackTimer / ATTACK_DURATION;
      if (this.attackHitPending && previous > 0.18 && this.attackTimer <= 0.18) {
        this.attackHitPending = false;
        this.resolveHammerHit();
      }
      if (this.attackTimer === 0) this.snapshot.attackPhase = 0;
      return;
    }

    const manualAttack = this.input.consumeAttackIntent();
    const autoAttack = this.autoAttack && this.hasAutoTarget();
    if (this.attackCooldown === 0 && (manualAttack || autoAttack)) this.startAttack();
  }

  private startAttack(): void {
    this.attackTimer = ATTACK_DURATION;
    this.attackCooldown = ATTACK_COOLDOWN;
    this.snapshot.attackCooldown = this.attackCooldown;
    this.attackHitPending = true;
    this.pushEvent("swing", this.snapshot.playerX, this.snapshot.playerZ, 1);
  }

  private resolveHammerHit(): void {
    let connected = false;
    this.enemyGrid.forEachNearby(this.snapshot.playerX, this.snapshot.playerZ, this.attackRange, (enemy) => {
      const dx = enemy.x - this.snapshot.playerX;
      const dz = enemy.z - this.snapshot.playerZ;
      const distance = Math.hypot(dx, dz);
      if (distance > this.attackRange) return;
      const damage = Math.round(this.baseDamage * (enemy.kind === "guardian" ? 0.9 : 1));
      enemy.hp -= damage;
      enemy.hitPulse = 1;
      enemy.knockback = enemy.kind === "guardian" ? 5 : 7;
      connected = true;
      this.pushEvent("impact", enemy.x, enemy.z, enemy.kind === "guardian" ? 1.4 : 1, damage);
      if (enemy.hp <= 0) this.killEnemy(enemy);
    });
    if (!connected) this.pushEvent("impact", this.snapshot.playerX + Math.sin(this.snapshot.facing) * 2.2, this.snapshot.playerZ + Math.cos(this.snapshot.facing) * 2.2, 0.35);
  }

  private updateSpawning(dt: number): void {
    if (this.stressMode || this.guardianSpawned || this.portalOpen) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0 || this.enemies.length >= NORMAL_ENEMY_LIMIT) return;
    this.spawnTimer = Math.max(2.6, 3.8 - this.snapshot.elapsed * 0.012);
    this.spawnRattlecap(13 + (this.spawnSequence % 3));
  }

  private updateEnemies(dt: number): boolean {
    this.playerHurtCooldown = Math.max(0, this.playerHurtCooldown - dt);
    this.enemyAiAccumulator += dt;
    if (this.enemyAiAccumulator < ENEMY_AI_INTERVAL) return false;
    const aiDt = this.enemyAiAccumulator;
    this.enemyAiAccumulator = 0;
    for (const enemy of this.enemies) {
      const dx = this.snapshot.playerX - enemy.x;
      const dz = this.snapshot.playerZ - enemy.z;
      const distance = Math.hypot(dx, dz) || 1;
      enemy.hitPulse = Math.max(0, enemy.hitPulse - aiDt * 4);
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - aiDt);
      if (enemy.telegraph > 0) {
        enemy.telegraph = Math.max(0, enemy.telegraph - aiDt);
        if (enemy.telegraph === 0 && this.playerHurtCooldown === 0) this.resolveEnemyStrike(enemy);
        continue;
      }
      if (enemy.knockback > 0) {
        const force = enemy.knockback;
        enemy.x -= (dx / distance) * force * aiDt;
        enemy.z -= (dz / distance) * force * aiDt;
        enemy.knockback = Math.max(0, enemy.knockback - aiDt * 20);
      } else if (distance > 1.35) {
        enemy.x += (dx / distance) * enemy.speed * aiDt;
        enemy.z += (dz / distance) * enemy.speed * aiDt;
      } else if (enemy.attackCooldown === 0 && this.playerHurtCooldown === 0) {
        enemy.attackCooldown = enemy.kind === "guardian" ? 0.8 : 1.1;
        enemy.telegraph = enemy.kind === "guardian" ? 0.62 : 0.42;
      }
    }
    return true;
  }

  private resolveEnemyStrike(enemy: Enemy): void {
    this.playerHurtCooldown = enemy.kind === "guardian" ? 0.7 : 1.2;
    this.snapshot.health = Math.max(0, this.snapshot.health - enemy.touchDamage);
    this.pushEvent("hurt", this.snapshot.playerX, this.snapshot.playerZ, enemy.kind === "guardian" ? 1.5 : 0.7, enemy.touchDamage);
    if (this.snapshot.health === 0) {
      this.snapshot.outcome = "defeat";
      this.snapshot.objective = "Tac dusmeden geri don";
    }
  }

  private updateXpOrbs(dt: number): void {
    for (const orb of [...this.xpOrbs]) {
      const dx = this.snapshot.playerX - orb.x;
      const dz = this.snapshot.playerZ - orb.z;
      const distance = Math.hypot(dx, dz) || 1;
      if (distance < XP_MAGNET_RANGE) {
        const pull = 10 + (XP_MAGNET_RANGE - distance) * 4;
        orb.x += (dx / distance) * pull * dt;
        orb.z += (dz / distance) * pull * dt;
      }
      if (distance > 1.1) continue;
      this.xpOrbs.splice(this.xpOrbs.indexOf(orb), 1);
      this.grantXp(orb.value);
      if (this.pendingUpgrades) return;
    }
  }

  private grantXp(value: number): void {
    this.snapshot.xp += value;
    if (this.snapshot.xp < this.snapshot.xpToNext) return;
    this.snapshot.xp -= this.snapshot.xpToNext;
    this.snapshot.level += 1;
    this.snapshot.xpToNext = Math.round(this.snapshot.xpToNext * 1.32 + 5);
    this.pendingUpgrades = UPGRADE_CHOICES;
    this.snapshot.pendingUpgrades = UPGRADE_CHOICES;
    this.snapshot.objective = "Gucunu sec";
    this.pushEvent("levelUp", this.snapshot.playerX, this.snapshot.playerZ, 1.4);
  }

  private killEnemy(enemy: Enemy): void {
    const index = this.enemies.indexOf(enemy);
    if (index === -1) return;
    const last = this.enemies.pop();
    if (last && index < this.enemies.length) this.enemies[index] = last;
    this.snapshot.kills += 1;
    this.snapshot.score += enemy.kind === "guardian" ? 2500 : 125;
    this.pushEvent("enemyDeath", enemy.x, enemy.z, enemy.kind === "guardian" ? 1.6 : 0.8);
    const orbCount = enemy.kind === "guardian" ? 7 : 1;
    const orbValue = enemy.kind === "guardian" ? 12 : 6;
    for (let index = 0; index < orbCount; index += 1) {
      const angle = (index / orbCount) * Math.PI * 2;
      this.xpOrbs.push({ id: this.nextOrbId++, x: enemy.x + Math.cos(angle) * 0.55, z: enemy.z + Math.sin(angle) * 0.55, value: orbValue });
    }
    this.enemyPool.push(enemy);
    if (enemy.kind !== "guardian") {
      this.stageKills += 1;
      if (this.stageKills >= (STAGE_CLEAR_TARGETS[this.snapshot.stage - 1] ?? 0)) this.openPortal();
      else this.snapshot.objective = this.getExpeditionObjective();
      return;
    }
    this.snapshot.outcome = "victory";
    this.snapshot.objective = "Catlak Kral Grom yenildi";
  }

  private updateRoute(): void {
    const interactRequested = this.input.consumeInteractIntent();
    if (!this.portalOpen) return;
    const distance = Math.hypot(this.snapshot.playerX - PORTAL_X, this.snapshot.playerZ - PORTAL_Z);
    if (!interactRequested) return;
    if (distance > PORTAL_INTERACT_RANGE) {
      this.snapshot.objective = "Portala yaklas ve E tusuna bas";
      return;
    }
    if (this.snapshot.stage === 3) {
      this.portalOpen = false;
      this.snapshot.routePhase = "boss";
      this.snapshot.portal = null;
      this.guardianSpawned = true;
      this.recycleEnemies();
      this.xpOrbs.length = 0;
      this.enemyGrid.rebuild(this.enemies);
      this.spawnGuardian();
      return;
    }
    this.advanceToNextStage();
  }

  private getExpeditionObjective(): string {
    if (this.guardianSpawned) return "Catlak Kral Grom'u BONK'la";
    if (this.portalOpen) return "Acik portala ilerle ve E tusuna bas";
    const target = STAGE_CLEAR_TARGETS[this.snapshot.stage - 1];
    return `Bolgeyi temizle: ${this.stageKills} / ${target}`;
  }

  private openPortal(): void {
    if (this.portalOpen || this.guardianSpawned) return;
    this.portalOpen = true;
    const destination: PortalDestination = this.snapshot.stage === 1 ? 2 : this.snapshot.stage === 2 ? 3 : "grom";
    this.snapshot.routePhase = "portal";
    this.snapshot.portal = { x: PORTAL_X, z: PORTAL_Z, destination };
    this.snapshot.objective = "Acik portala ilerle ve E tusuna bas";
    this.pushEvent("portalOpen", PORTAL_X, PORTAL_Z, 1.65);
  }

  private advanceToNextStage(): void {
    const nextStage = (this.snapshot.stage + 1) as ExpeditionStage;
    this.portalOpen = false;
    this.stageKills = 0;
    this.recycleEnemies();
    this.xpOrbs.length = 0;
    this.enemyGrid.rebuild(this.enemies);
    this.snapshot.stage = nextStage;
    this.snapshot.stageName = nextStage === 2 ? "YARIK SIRTI / BOLUM 2" : "TAC YUKSELISI / BOLUM 3";
    this.snapshot.routePhase = "combat";
    this.snapshot.portal = null;
    this.snapshot.playerX = 0;
    this.snapshot.playerZ = 12;
    this.playerVelocityX = 0;
    this.playerVelocityZ = 0;
    this.spawnTimer = 0.8;
    this.snapshot.objective = this.getExpeditionObjective();
    this.spawnRattlecapAt(this.snapshot.playerX, this.snapshot.playerZ - 4.2, 0.7);
    this.enemyGrid.rebuild(this.enemies);
  }

  private spawnRattlecap(distance: number): void {
    const angle = this.spawnSequence++ * 2.3999632297;
    this.spawnRattlecapAt(
      clamp(this.snapshot.playerX + Math.cos(angle) * distance, -ARENA_LIMIT, ARENA_LIMIT),
      clamp(this.snapshot.playerZ + Math.sin(angle) * distance, -ARENA_LIMIT, ARENA_LIMIT),
    );
  }

  private spawnRattlecapAt(x: number, z: number, telegraph = 0): void {
    const enemy = this.acquireEnemy();
    Object.assign(enemy, {
      id: this.nextEnemyId++, kind: "rattlecap", x, z, hp: 108, maxHp: 108,
      speed: 2.15, touchDamage: 2, attackCooldown: 0.65, knockback: 0, hitPulse: 0, telegraph,
    });
    this.enemies.push(enemy);
  }

  private spawnGuardian(distanceFromPlayer = 28): void {
    const enemy = this.acquireEnemy();
    Object.assign(enemy, {
      id: this.nextEnemyId++, kind: "guardian", x: this.snapshot.playerX,
      z: clamp(this.snapshot.playerZ - distanceFromPlayer, -ARENA_LIMIT, ARENA_LIMIT), hp: 390, maxHp: 390,
      speed: 1.35, touchDamage: 10, attackCooldown: 1.2, knockback: 0, hitPulse: 0, telegraph: 0,
    });
    this.enemies.push(enemy);
    this.snapshot.objective = "Catlak Kral Grom'u BONK'la";
    this.pushEvent("guardianSpawn", this.snapshot.playerX, this.snapshot.playerZ - distanceFromPlayer, 1.6);
  }

  private hasAutoTarget(): boolean {
    let found = false;
    this.enemyGrid.forEachNearby(this.snapshot.playerX, this.snapshot.playerZ, this.attackRange, (enemy) => {
      if (Math.hypot(enemy.x - this.snapshot.playerX, enemy.z - this.snapshot.playerZ) <= this.attackRange) found = true;
    });
    return found;
  }

  private spawnStressWave(): void {
    for (let index = 0; index < STRESS_ENEMY_COUNT; index += 1) {
      const angle = index * 2.3999632297;
      const radius = 11 + (index % 8) * 1.45;
      this.spawnRattlecapAt(
        clamp(this.snapshot.playerX + Math.cos(angle) * radius, -ARENA_LIMIT, ARENA_LIMIT),
        clamp(this.snapshot.playerZ + Math.sin(angle) * radius, -ARENA_LIMIT, ARENA_LIMIT),
      );
    }
  }

  private acquireEnemy(): Enemy {
    return this.enemyPool.pop() ?? {
      id: 0, kind: "rattlecap", x: 0, z: 0, hp: 0, maxHp: 0,
      hitPulse: 0, telegraph: 0, speed: 0, touchDamage: 0, attackCooldown: 0, knockback: 0,
    };
  }

  private recycleEnemies(): void {
    while (this.enemies.length > 0) {
      const enemy = this.enemies.pop();
      if (enemy) this.enemyPool.push(enemy);
    }
  }

  private pushEvent(type: CombatEvent["type"], x: number, z: number, strength: number, value?: number): void {
    this.visualEvents.push({ id: this.nextEventId++, type, x, z, strength, value });
  }

  private syncCollections(): void {
    this.snapshot.enemies = this.enemies;
    this.snapshot.xpOrbs = this.xpOrbs;
    this.snapshot.pendingUpgrades = this.pendingUpgrades;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
