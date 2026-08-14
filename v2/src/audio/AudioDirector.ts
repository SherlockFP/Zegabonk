import type { GameSettings } from "../core/SettingsStore";

type MusicScene = "menu" | "game" | null;

const MENU_TRACKS = [
  new URL("../../../menu1.mp3", import.meta.url).href,
  new URL("../../../menu2.mp3", import.meta.url).href,
  new URL("../../../menu3.mp3", import.meta.url).href,
  new URL("../../../menu4.mp3", import.meta.url).href,
  new URL("../../../menu5.mp3", import.meta.url).href,
  new URL("../../../menu6.mp3", import.meta.url).href,
  new URL("../../../menu7.mp3", import.meta.url).href,
];
const GAME_TRACK = new URL("../../../background.mp3", import.meta.url).href;

/** Reuses the legacy Zegabonk score while keeping menu/game playback exclusive. */
export class AudioDirector {
  private readonly menu = new Audio();
  private readonly game = new Audio(GAME_TRACK);
  private scene: MusicScene = null;
  private nextMenuTrack = Math.floor(Math.random() * MENU_TRACKS.length);
  private settings: Readonly<GameSettings>;

  constructor(settings: Readonly<GameSettings>) {
    this.settings = settings;
    this.game.loop = true;
    this.menu.addEventListener("ended", this.playNextMenuTrack);
    this.applyVolumes();
  }

  applySettings(settings: Readonly<GameSettings>): void {
    this.settings = settings;
    this.applyVolumes();
  }

  startMenu(): void {
    if (this.scene === "menu" && !this.menu.paused) return;
    this.scene = "menu";
    this.stop(this.game);
    this.playNextMenuTrack();
  }

  startGame(): void {
    if (this.scene === "game" && !this.game.paused) return;
    this.scene = "game";
    this.stop(this.menu);
    this.game.play().catch(() => {});
  }

  dispose(): void {
    this.stop(this.menu);
    this.stop(this.game);
    this.menu.removeEventListener("ended", this.playNextMenuTrack);
  }

  private readonly playNextMenuTrack = (): void => {
    if (this.scene !== "menu") return;
    this.menu.src = MENU_TRACKS[this.nextMenuTrack] ?? MENU_TRACKS[0]!;
    this.nextMenuTrack = (this.nextMenuTrack + 1) % MENU_TRACKS.length;
    this.menu.currentTime = 0;
    this.menu.play().catch(() => {});
  };

  private applyVolumes(): void {
    const volume = this.settings.masterVolume * this.settings.musicVolume;
    this.menu.volume = Math.min(1, volume * 0.18);
    this.game.volume = Math.min(1, volume * 0.16);
  }

  private stop(audio: HTMLAudioElement): void {
    audio.pause();
    audio.currentTime = 0;
  }
}
