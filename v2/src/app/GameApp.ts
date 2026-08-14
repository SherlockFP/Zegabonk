import { InputController } from "../core/InputController";
import { ProfileStore } from "../core/ProfileStore";
import { SettingsStore } from "../core/SettingsStore";
import { Simulation } from "../core/Simulation";
import { AudioDirector } from "../audio/AudioDirector";
import type { RenderDiagnostics, WorldRenderer } from "../render/WorldRenderer";
import { AppShell } from "../ui/AppShell";

const FIXED_STEP = 1 / 60;

interface PerfSnapshot extends RenderDiagnostics {
  fps: number;
  frameMs: number;
  activeEnemies: number;
}

declare global {
  interface Window {
    __zegabonkPerf?: PerfSnapshot;
  }
}

export class GameApp {
  private readonly input = new InputController();
  private readonly settings = new SettingsStore();
  private readonly profile = new ProfileStore();
  private readonly audio = new AudioDirector(this.settings.get());
  private readonly simulation = new Simulation(this.input);
  private renderer: WorldRenderer | null = null;
  private readonly ui: AppShell;
  private running = false;
  private paused = false;
  private accumulator = 0;
  private hitStopRemaining = 0;
  private outcomeRecorded = false;
  private previousTime = performance.now();
  private lastRenderedAt = 0;
  private readonly stressMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("stress") === "200";
  private readonly guardianPreviewMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("preview") === "grom";
  private perfWindowStartedAt = performance.now();
  private perfFrames = 0;
  private perfFrameSeconds = 0;

  constructor(private readonly canvas: HTMLCanvasElement, root: HTMLElement) {
    this.input.setPointerTarget(canvas);
    this.ui = new AppShell(root, this.settings, this.profile, {
      onStartRun: () => { void this.startRun(); },
      onRetryRun: () => { void this.startRun(); },
      onQuitToMenu: () => this.quitToMenu(),
      onAttack: () => this.input.requestAttack(),
      onChooseUpgrade: (id) => this.chooseUpgrade(id),
      onPauseChange: (paused) => this.setPaused(paused),
      onSettingsChange: (settings) => {
        this.simulation.setAutoAttack(settings.autoAttack);
        this.input.setMouseSensitivity(settings.mouseSensitivity);
        this.renderer?.applySettings(settings);
        this.audio.applySettings(settings);
      },
      onMenuInteraction: () => {
        if (!this.running) this.audio.startMenu();
      },
    });
    this.simulation.setAutoAttack(this.settings.get().autoAttack);
    this.input.setMouseSensitivity(this.settings.get().mouseSensitivity);
    this.simulation.setStressMode(this.stressMode);
    this.simulation.setGuardianPreviewMode(this.guardianPreviewMode);
  }

  start(): void {
    requestAnimationFrame(this.frame);
  }

  private async startRun(): Promise<void> {
    this.audio.startGame();
    const renderer = await this.ensureRenderer();
    this.simulation.reset();
    this.ui.clearRunOverlays();
    this.running = true;
    this.paused = false;
    this.accumulator = 0;
    this.hitStopRemaining = 0;
    this.outcomeRecorded = false;
    this.input.setEnabled(true);
    renderer.setMode("game");
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.input.setEnabled(this.running && !paused);
    if (!this.running) this.renderer?.setMode("menu");
  }

  private quitToMenu(): void {
    this.running = false;
    this.paused = false;
    this.accumulator = 0;
    this.hitStopRemaining = 0;
    this.input.setEnabled(false);
    this.renderer?.setMode("menu");
    this.audio.startMenu();
  }

  private chooseUpgrade(id: Parameters<Simulation["chooseUpgrade"]>[0]): void {
    this.simulation.chooseUpgrade(id);
    this.paused = false;
    this.input.setEnabled(true);
  }

  private readonly frame = (time: number): void => {
    const settings = this.settings.get();
    const frameInterval = settings.fpsCap > 0 ? 1000 / settings.fpsCap : 0;
    if (frameInterval > 0 && time - this.lastRenderedAt < frameInterval) {
      requestAnimationFrame(this.frame);
      return;
    }
    this.lastRenderedAt = time;

    const delta = Math.min((time - this.previousTime) / 1000, 0.1);
    this.previousTime = time;
    if (this.running && !this.paused && this.hitStopRemaining <= 0) {
      this.accumulator += delta;
      while (this.accumulator >= FIXED_STEP) {
        this.simulation.update(FIXED_STEP);
        this.accumulator -= FIXED_STEP;
      }
    } else if (this.hitStopRemaining > 0) {
      this.hitStopRemaining = Math.max(0, this.hitStopRemaining - delta);
    }
    const state = this.simulation.getState();
    this.ui.setHud(state);
    if (state.pendingUpgrades && !this.paused) {
      this.paused = true;
      this.input.setEnabled(false);
      this.ui.openLevelUp(state.pendingUpgrades);
    }
    if (state.outcome !== "playing" && !this.outcomeRecorded) {
      this.outcomeRecorded = true;
      this.profile.recordRun(state);
    }
    if (state.outcome !== "playing" && !this.paused) {
      this.paused = true;
      this.input.setEnabled(false);
      this.ui.showResult(state);
    }
    const events = this.simulation.consumeVisualEvents();
    if (!settings.reducedMotion && events.some((event) => event.type === "impact" && event.strength >= 1)) {
      this.hitStopRemaining = Math.max(this.hitStopRemaining, 0.034);
    }
    this.renderer?.render(state, time / 1000, events);
    if (this.stressMode) this.updateStressDiagnostics(time, delta, state.enemies.length);
    requestAnimationFrame(this.frame);
  };

  private updateStressDiagnostics(time: number, delta: number, activeEnemies: number): void {
    this.perfFrames += 1;
    this.perfFrameSeconds += delta;
    const elapsed = time - this.perfWindowStartedAt;
    if (elapsed < 1000) return;
    const renderer = this.renderer;
    if (!renderer) return;
    const metrics: PerfSnapshot = {
      ...renderer.getDiagnostics(),
      fps: this.perfFrames * 1000 / elapsed,
      frameMs: this.perfFrameSeconds * 1000 / this.perfFrames,
      activeEnemies,
    };
    window.__zegabonkPerf = metrics;
    this.ui.setPerf(metrics);
    this.perfWindowStartedAt = time;
    this.perfFrames = 0;
    this.perfFrameSeconds = 0;
  }

  private async ensureRenderer(): Promise<WorldRenderer> {
    if (this.renderer) return this.renderer;
    const { WorldRenderer } = await import("../render/WorldRenderer");
    this.renderer = new WorldRenderer(this.canvas, this.settings.get());
    return this.renderer;
  }
}
