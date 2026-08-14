import type { RunOutcome, SimulationSnapshot } from "./Simulation";

const STORAGE_KEY = "zegabonk_v2_profile";
const PROFILE_VERSION = 2;

export interface DailyProgress {
  date: string;
  kills: number;
  bossClears: number;
  bestSurvivalSeconds: number;
}

export interface PlayerProfile {
  version: number;
  displayName: string;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  lifetimeKills: number;
  bestScore: number;
  expeditions: number;
  victories: number;
  crownShards: number;
  storyCompleted: boolean;
  recordedRunIds: readonly string[];
  daily: DailyProgress;
}

export interface RunRecord {
  outcome: RunOutcome;
  score: number;
  kills: number;
  elapsed: number;
  level: number;
}

const today = (): string => new Date().toISOString().slice(0, 10);

function levelFromXp(totalXp: number): { level: number; xpIntoLevel: number; xpToNextLevel: number } {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  let next = 600;
  while (remaining >= next) {
    remaining -= next;
    level += 1;
    next = 600 + (level - 1) * 180;
  }
  return { level, xpIntoLevel: remaining, xpToNextLevel: next };
}

function defaultProfile(): PlayerProfile {
  const progression = levelFromXp(0);
  return {
    version: PROFILE_VERSION,
    displayName: "BONK SOVALYESI",
    totalXp: 0,
    lifetimeKills: 0,
    bestScore: 0,
    expeditions: 0,
    victories: 0,
    crownShards: 0,
    storyCompleted: false,
    recordedRunIds: [],
    daily: { date: today(), kills: 0, bossClears: 0, bestSurvivalSeconds: 0 },
    ...progression,
  };
}

/** Local-only profile. Global leaderboard state intentionally belongs to the future server gate. */
export class ProfileStore {
  private value = this.load();

  get(): Readonly<PlayerProfile> {
    return this.value;
  }

  recordRun(snapshot: Readonly<SimulationSnapshot>): Readonly<PlayerProfile> {
    if (snapshot.outcome === "playing") return this.value;
    if (this.value.recordedRunIds.includes(snapshot.runId)) return this.value;
    const daily = this.currentDaily();
    const rewardXp = Math.max(80, Math.floor(snapshot.score / 7) + snapshot.level * 35 + (snapshot.outcome === "victory" ? 250 : 0));
    const totalXp = this.value.totalXp + rewardXp;
    this.value = {
      ...this.value,
      totalXp,
      lifetimeKills: this.value.lifetimeKills + snapshot.kills,
      bestScore: Math.max(this.value.bestScore, snapshot.score),
      expeditions: this.value.expeditions + 1,
      victories: this.value.victories + (snapshot.outcome === "victory" ? 1 : 0),
      crownShards: this.value.crownShards + (snapshot.outcome === "victory" ? 3 : 0),
      storyCompleted: this.value.storyCompleted || snapshot.outcome === "victory",
      recordedRunIds: [...this.value.recordedRunIds, snapshot.runId].slice(-32),
      daily: {
        ...daily,
        kills: daily.kills + snapshot.kills,
        bossClears: daily.bossClears + (snapshot.outcome === "victory" ? 1 : 0),
        bestSurvivalSeconds: Math.max(daily.bestSurvivalSeconds, Math.floor(snapshot.elapsed)),
      },
      ...levelFromXp(totalXp),
    };
    this.save();
    return this.value;
  }

  private currentDaily(): DailyProgress {
    return this.value.daily.date === today() ? this.value.daily : { date: today(), kills: 0, bossClears: 0, bestSurvivalSeconds: 0 };
  }

  private load(): PlayerProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProfile();
      const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
      if (parsed.version !== 1 && parsed.version !== PROFILE_VERSION) return defaultProfile();
      const totalXp = Math.max(0, parsed.totalXp ?? 0);
      const daily = parsed.daily?.date === today()
        ? { date: today(), kills: Math.max(0, parsed.daily.kills ?? 0), bossClears: Math.max(0, parsed.daily.bossClears ?? 0), bestSurvivalSeconds: Math.max(0, parsed.daily.bestSurvivalSeconds ?? 0) }
        : { date: today(), kills: 0, bossClears: 0, bestSurvivalSeconds: 0 };
      return {
        ...defaultProfile(),
        ...parsed,
        version: PROFILE_VERSION,
        totalXp,
        lifetimeKills: Math.max(0, parsed.lifetimeKills ?? 0),
        bestScore: Math.max(0, parsed.bestScore ?? 0),
        expeditions: Math.max(0, parsed.expeditions ?? 0),
        victories: Math.max(0, parsed.victories ?? 0),
        crownShards: Math.max(0, parsed.crownShards ?? 0),
        storyCompleted: Boolean(parsed.storyCompleted),
        recordedRunIds: Array.isArray(parsed.recordedRunIds)
          ? parsed.recordedRunIds.filter((id): id is string => typeof id === "string").slice(-32)
          : [],
        daily,
        ...levelFromXp(totalXp),
      };
    } catch {
      return defaultProfile();
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.value));
  }
}
