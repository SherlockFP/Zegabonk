import type { GameSettings, SettingsStore } from "../core/SettingsStore";
import type { SimulationSnapshot, UpgradeChoice } from "../core/Simulation";
import type { ProfileStore } from "../core/ProfileStore";

type Screen = "main" | "lobby" | "game";
type SettingsTab = "gameplay" | "display" | "audio" | "controls" | "accessibility";

export interface AppShellCallbacks {
  onStartRun(): void;
  onRetryRun(): void;
  onQuitToMenu(): void;
  onAttack(): void;
  onChooseUpgrade(id: UpgradeChoice["id"]): void;
  onPauseChange(paused: boolean): void;
  onSettingsChange(settings: Readonly<GameSettings>): void;
  onMenuInteraction(): void;
}

export class AppShell {
  private screen: Screen = "main";
  private paused = false;
  private settingsOpen = false;
  private settingsTab: SettingsTab = "gameplay";
  private levelUpChoices: readonly UpgradeChoice[] | null = null;
  private result: Readonly<SimulationSnapshot> | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly settingsStore: SettingsStore,
    private readonly profileStore: ProfileStore,
    private readonly callbacks: AppShellCallbacks,
  ) {
    this.render();
    window.addEventListener("keydown", this.onKeyDown);
  }

  setElapsed(seconds: number): void {
    const timer = this.root.querySelector<HTMLElement>("[data-hud-time]");
    if (!timer) return;
    const whole = Math.floor(seconds);
    timer.textContent = `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  }

  setHud(state: Readonly<SimulationSnapshot>): void {
    const setText = (selector: string, value: string): void => {
      const element = this.root.querySelector<HTMLElement>(selector);
      if (element) element.textContent = value;
    };
    const whole = Math.floor(state.elapsed);
    setText("[data-hud-time]", `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`);
    setText("[data-hud-level]", `LEVEL ${state.level}`);
    setText("[data-hud-health]", `${Math.ceil(state.health)} / ${state.maxHealth}`);
    setText("[data-hud-score]", state.score.toLocaleString("tr-TR").padStart(6, "0"));
    setText("[data-hud-kills]", `${state.kills} KIRILDI`);
    setText("[data-hud-stage]", state.stageName);
    setText("[data-hud-objective]", state.objective);
    setText("[data-hud-xp]", `${state.xp} / ${state.xpToNext} XP`);
    const attack = this.root.querySelector<HTMLElement>("[data-hud-attack]");
    if (attack) {
      const ready = state.attackCooldown <= 0;
      attack.textContent = ready ? "HAZIR" : `${state.attackCooldown.toFixed(1)} sn`;
      attack.dataset.ready = String(ready);
      attack.parentElement?.setAttribute("data-ready", String(ready));
      this.root.querySelector<HTMLElement>(".ability-key")?.setAttribute("data-ready", String(ready));
    }
    const portalGuide = this.root.querySelector<HTMLElement>("[data-hud-portal]");
    if (portalGuide) {
      portalGuide.hidden = !state.portal;
      if (state.portal) {
        const dx = state.portal.x - state.playerX;
        const dz = state.portal.z - state.playerZ;
        const cameraAngle = state.cameraYaw + Math.atan2(0.72, 1);
        const screenRight = Math.cos(cameraAngle) * dx - Math.sin(cameraAngle) * dz;
        const screenForward = -Math.sin(cameraAngle) * dx - Math.cos(cameraAngle) * dz;
        const arrow = portalGuide.querySelector<HTMLElement>("b");
        const distance = portalGuide.querySelector<HTMLElement>("em");
        if (arrow) arrow.style.transform = `rotate(${Math.atan2(screenRight, screenForward)}rad)`;
        if (distance) distance.textContent = `PORTAL ${Math.ceil(Math.hypot(dx, dz))} m`;
      }
    }
    const health = this.root.querySelector<HTMLElement>("[data-hud-health-fill]");
    if (health) health.style.width = `${Math.max(0, Math.min(100, state.health / state.maxHealth * 100))}%`;
    const xp = this.root.querySelector<HTMLElement>("[data-hud-xp-fill]");
    if (xp) xp.style.width = `${Math.max(0, Math.min(100, state.xp / state.xpToNext * 100))}%`;
  }

  setPerf(metrics: { fps: number; frameMs: number; activeEnemies: number; calls: number; triangles: number }): void {
    const element = this.root.querySelector<HTMLElement>("[data-hud-perf]");
    if (!element) return;
    element.hidden = false;
    element.textContent = `${metrics.fps.toFixed(0)} FPS | ${metrics.frameMs.toFixed(1)} ms | ${metrics.activeEnemies} ENEMY | ${metrics.calls} CALL | ${metrics.triangles} TRI`;
  }

  openLevelUp(choices: readonly UpgradeChoice[]): void {
    this.levelUpChoices = choices;
    this.render();
  }

  showResult(state: Readonly<SimulationSnapshot>): void {
    this.result = state;
    this.render();
  }

  clearRunOverlays(): void {
    this.levelUpChoices = null;
    this.result = null;
  }

  private render(): void {
    const settings = this.settingsStore.get();
    this.root.innerHTML = `
      <div class="shell ${this.screen === "game" ? "shell--game" : ""}">
        ${this.screen === "main" ? this.mainMenu() : ""}
        ${this.screen === "lobby" ? this.lobby() : ""}
        ${this.screen === "game" ? this.hud() : ""}
        ${this.paused ? this.pauseMenu() : ""}
        ${this.levelUpChoices ? this.levelUpModal(this.levelUpChoices) : ""}
        ${this.result ? this.resultModal(this.result) : ""}
        ${this.settingsOpen ? this.settingsModal(settings) : ""}
      </div>
    `;
    this.bindEvents();
  }

  private mainMenu(): string {
    const profile = this.profileStore.get();
    const dailyKills = Math.min(200, profile.daily.kills);
    const survivalMinutes = Math.min(15, Math.floor(profile.daily.bestSurvivalSeconds / 60));
    const xpPercent = Math.round(profile.xpIntoLevel / profile.xpToNextLevel * 100);
    return `
      <main class="main-menu" aria-label="Ana menu">
        <div class="keyart" aria-hidden="true"></div>
        <div class="menu-shade" aria-hidden="true"></div>
        <div class="menu-bubbles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <header class="brand-bar">
          <div class="brand-lockup"><span class="brand-crown">Z</span><span>ZEGABONK</span></div>
          <div class="build-tag"><i></i><span>KRALLIK BAGLI</span><strong>SEFER PANOSU</strong></div>
        </header>
        <section class="menu-stage"><div class="hero-copy">
          <p class="eyebrow">KIRIK TAC SEFERI</p>
          <h1>Krallik dustu.<br><em>Cekici sen kaldir.</em></h1>
          <p class="hero-lede">Uc bolgeyi yar, Grom'u BONK'la ve Prenses Zega'yi Tac Yarigi acilmadan kurtar.</p>
          <div class="hero-actions hero-actions--stacked">
            <button class="action action--primary action--play" data-action="open-lobby"><b class="action-orb" aria-hidden="true">▶</b><span>MACERAYA BASLA</span><small>Tek oyuncu hikaye</small></button>
            <button class="action action--secondary action--settings" data-action="open-settings"><b class="action-orb" aria-hidden="true">✦</b><span>AYARLAR</span><small>Goruntu, ses, kontroller</small></button>
          </div>
          <div class="mode-strip" aria-label="Oyun modlari">
          <div class="mode-card mode-card--active"><b class="mode-orb">1</b><strong>HIKAYE</strong><span>3 bolge / Grom finali</span></div>
          <div class="mode-card ${profile.storyCompleted ? "mode-card--active" : "mode-card--locked"}"><b class="mode-orb">✦</b><strong>TAC YARIGI</strong><span>${profile.storyCompleted ? "Kilit acildi / sonraki sefer" : "Hikayeden sonra acilir"}</span></div>
          <div class="mode-card mode-card--locked"><b class="mode-orb">+</b><strong>CO-OP</strong><span>Takim seferi yakinda</span></div>
          </div>
        </div>
          <aside class="command-deck" aria-label="Sefer panosu">
            <section class="profile-card"><div class="profile-avatar">CR</div><div class="profile-copy"><strong>${profile.displayName}</strong><span>SEVIYE ${profile.level}</span><div class="profile-xp"><i style="width:${xpPercent}%"></i><b>${profile.xpIntoLevel.toLocaleString("tr-TR")} / ${profile.xpToNextLevel.toLocaleString("tr-TR")} XP</b></div></div><div class="profile-shards"><b>*</b><span>${profile.crownShards}</span></div></section>
            <section class="live-card"><header><strong>GUNLUK SEFER</strong><span>BUGUN</span></header><div class="quest-row"><div><b>200 dusman BONK'la</b><span>${dailyKills} / 200</span></div><i><em style="width:${dailyKills / 2}%"></em></i></div><div class="quest-row"><div><b>Bir muhafiz yen</b><span>${Math.min(1, profile.daily.bossClears)} / 1</span></div><i><em style="width:${Math.min(1, profile.daily.bossClears) * 100}%"></em></i></div><div class="quest-row"><div><b>15 dakika dayan</b><span>${survivalMinutes} / 15 dk</span></div><i><em style="width:${survivalMinutes / 15 * 100}%"></em></i></div></section>
            <section class="record-card"><header><strong>SEFER KAYDI</strong><span>YEREL</span></header><div><small>EN IYI SKOR</small><b>${profile.bestScore.toLocaleString("tr-TR").padStart(6, "0")}</b></div><div class="record-split"><span><small>ZAFER</small><b>${profile.victories}</b></span><span><small>TOPLAM BONK</small><b>${profile.lifetimeKills.toLocaleString("tr-TR")}</b></span><span><small>SEFER</small><b>${profile.expeditions}</b></span></div></section>
            <section class="update-card"><header><strong>SEFER REHBERI</strong><span>YOL 01</span></header><p><b>Yarigi gec.</b> Her bolge temizlendiginde yolun onundeki portal acilir.</p><p><b>Hedef:</b> Tac Yarigi'na ulas ve Prenses Zega'yi geri getir.</p></section>
          </aside>
        </section>
        <footer class="menu-footer"><span>YOL HARITASI</span><span>GERI BILDIRIM</span><span>SEFER NOTLARI</span></footer>
      </main>
    `;
  }

  private lobby(): string {
    return `
      <main class="lobby-screen">
        <header class="lobby-header">
          <button class="icon-button" data-action="back-main" aria-label="Ana menuye don">&larr;</button>
          <div><p class="eyebrow">RUN HAZIRLIGI</p><h1>Kirik Tac Seferi</h1></div>
          <div class="party-pill"><span class="status-dot"></span> SOLO / STANDARD</div>
        </header>
        <div class="lobby-grid">
          <section class="lobby-panel hero-select">
            <div class="section-kicker">01 / SAVASCI</div>
            <article class="hero-card hero-card--selected">
              <div class="hero-portrait"><span>CR</span><i></i><b>⚒</b></div>
              <div><h2>Crown Runner</h2><p>Cevik vurucu / Buyuk cekic</p><div class="tag-row"><span>BONK</span><span>HIZ</span><span>KRITIK</span></div></div>
              <span class="selected-mark">SECILI</span>
            </article>
            <div class="hero-showcase" aria-label="Crown Runner, Grom'un Bonk cekiciyle">
              <div class="hero-showcase-copy"><span>IMZA SILAHI</span><strong>GROM'UN BONK'U</strong><small>Hizli yon degistir. Temasta genis alani kir.</small></div>
              <div class="hero-statline"><span><b>120</b> CAN</span><span><b>7.5</b> HIZ</span><span><b>3.25</b> MENZIL</span></div>
            </div>
            <div class="locked-row"><span>Yeni savascilar</span><strong>Hikaye ilerlemesiyle acilir</strong></div>
          </section>
          <section class="lobby-panel route-select">
            <div class="section-kicker">02 / ROTA</div>
            <div class="route-visual">
              <div class="route-line"></div>
              <div class="route-node route-node--active"><span>1</span><strong>Yesil Yukuslar</strong><small>Fundalik ve Tac Isareti</small></div>
              <div class="route-node route-node--locked"><span>2</span><strong>Gunes Kirigi</strong><small>Portal sonrasinda</small></div>
              <div class="route-node route-node--locked"><span>3</span><strong>Bulut Taci</strong><small>Grom'un kalesi</small></div>
            </div>
          </section>
          <aside class="lobby-panel run-contract">
            <div class="section-kicker">03 / KONTRAT</div>
            <h2>Standard Sefer</h2>
            <ul><li><span>Hedef</span><strong>Portal muhafizini yen</strong></li><li><span>Sure</span><strong>Serbest</strong></li><li><span>Guclenme</span><strong>Her level 3 secim</strong></li><li><span>Risk</span><strong>Olum run'i bitirir</strong></li></ul>
            <button class="action action--primary action--wide" data-action="start-run"><span>SEFERE CIK</span><small>Yesil Yukuslar / Bolum 1</small></button>
          </aside>
        </div>
      </main>
    `;
  }

  private hud(): string {
    return `
      <div class="hud" aria-label="Oyun arayuzu">
        <div class="hud-left"><div class="hero-chip"><span>CR</span><div><strong>CROWN RUNNER</strong><small data-hud-level>LEVEL 1</small></div></div><div class="bar"><i data-hud-health-fill style="width:100%"></i><span data-hud-health>120 / 120</span></div></div>
        <div class="hud-center"><small data-hud-stage>MOSSWATCH HARABELERI / BOLUM 1</small><strong data-hud-time>00:00</strong><span data-hud-objective>Yarigi temizle ve muhafizi cagir</span><div class="portal-guide" data-hud-portal hidden><b>↑</b><em>PORTAL</em></div></div>
        <div class="hud-right"><span>SKOR</span><strong data-hud-score>000 000</strong><small data-hud-kills>0 KIRILDI</small></div>
        <div class="ability-dock">
          <button class="ability-key" data-action="attack" aria-label="Bonk saldirisi">Q</button>
          <div class="ability-state"><small>SALDIRI</small><strong>BONK</strong><b data-hud-attack data-ready="true">HAZIR</b></div>
          <div class="xp-dock"><small>TECRUBE</small><div class="xp-track"><i data-hud-xp-fill></i><span data-hud-xp>0 / 40 XP</span></div></div>
        </div>
        <div class="perf-overlay" data-hud-perf hidden></div>
        <div class="game-hint">WASD hareket / Q BONK / E portal / ESC duraklat</div>
      </div>
    `;
  }

  private pauseMenu(): string {
    return `<div class="modal-backdrop"><section class="pause-card" role="dialog" aria-modal="true"><p class="eyebrow">SEFER DURAKLATILDI</p><h2>Nefesini topla.</h2><button class="action action--primary" data-action="resume"><span>DEVAM ET</span></button><button class="action action--secondary" data-action="open-settings"><span>AYARLAR</span></button><button class="text-button" data-action="quit-main">Seferi birak ve ana menuye don</button></section></div>`;
  }

  private levelUpModal(choices: readonly UpgradeChoice[]): string {
    return `
      <div class="modal-backdrop levelup-backdrop">
        <section class="levelup-card" role="dialog" aria-modal="true" aria-labelledby="levelup-title">
          <p class="eyebrow">TAC GUCUNE CEVAP VERDI</p>
          <h2 id="levelup-title">Bir guc sec.</h2>
          <p>Secimin sonraki dalgayi degistirsin.</p>
          <div class="upgrade-grid">${choices.map((choice) => `<button class="upgrade-card" data-upgrade="${choice.id}"><small>${choice.stat}</small><strong>${choice.title}</strong><span>${choice.detail}</span></button>`).join("")}</div>
        </section>
      </div>
    `;
  }

  private resultModal(state: Readonly<SimulationSnapshot>): string {
    const victory = state.outcome === "victory";
    return `
      <div class="modal-backdrop result-backdrop">
        <section class="result-card" role="dialog" aria-modal="true" aria-labelledby="result-title">
          <p class="eyebrow">${victory ? "ZEGA SERBEST / TAC YARIGI ACILDI" : "SEFER SONLANDI"}</p>
          <h2 id="result-title">${victory ? "Catlak Kral Grom dustu." : "Tac seni tekrar cagiracak."}</h2>
          <div class="result-stats"><div><small>SKOR</small><strong>${state.score.toLocaleString("tr-TR")}</strong></div><div><small>KIRILAN</small><strong>${state.kills}</strong></div><div><small>SEVIYE</small><strong>${state.level}</strong></div></div>
          <button class="action action--primary action--wide" data-action="retry-run"><span>TEKRAR GIR</span><small>Ayni ilk bolge / temiz kosu</small></button>
          <button class="text-button" data-action="quit-main">Ana menuye don</button>
        </section>
      </div>
    `;
  }

  private settingsModal(settings: Readonly<GameSettings>): string {
    const tab = (id: SettingsTab, label: string) => `<button class="settings-tab ${this.settingsTab === id ? "is-active" : ""}" data-settings-tab="${id}">${label}</button>`;
    return `
      <div class="modal-backdrop modal-backdrop--settings">
        <section class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <header><div><p class="eyebrow">SISTEM</p><h2 id="settings-title">Ayarlar</h2></div><button class="icon-button" data-action="close-settings" aria-label="Ayarlari kapat">X</button></header>
          <div class="settings-layout">
            <nav>${tab("gameplay", "Oynanis")}${tab("display", "Goruntu")}${tab("audio", "Ses")}${tab("controls", "Kontroller")}${tab("accessibility", "Erisilebilirlik")}</nav>
            <div class="settings-content">${this.settingsPanel(settings)}</div>
          </div>
          <footer><button class="text-button" data-action="reset-settings">Varsayilana don</button><button class="action action--primary action--compact" data-action="close-settings"><span>UYGULA VE KAPAT</span></button></footer>
        </section>
      </div>
    `;
  }

  private settingsPanel(settings: Readonly<GameSettings>): string {
    if (this.settingsTab === "display") return `
      ${this.selectSetting("Goruntu kalitesi", "quality", settings.quality, [["low","Dusuk"],["medium","Orta"],["high","Yuksek"]])}
      ${this.rangeSetting("Cozunurluk olcegi", "resolutionScale", settings.resolutionScale, 0.65, 1.25, 0.05, `${Math.round(settings.resolutionScale * 100)}%`)}
      ${this.rangeSetting("Gorus acisi", "fov", settings.fov, 50, 80, 1, `${settings.fov}`)}
      ${this.selectSetting("FPS limiti", "fpsCap", String(settings.fpsCap), [["0","Sinirsiz"],["30","30"],["60","60"],["120","120"]])}
      <button class="setting-button" data-action="fullscreen">Tam ekran modunu degistir</button>`;
    if (this.settingsTab === "audio") return `
      ${this.rangeSetting("Genel ses", "masterVolume", settings.masterVolume, 0, 1, 0.05, `${Math.round(settings.masterVolume * 100)}%`)}
      ${this.rangeSetting("Muzik", "musicVolume", settings.musicVolume, 0, 1, 0.05, `${Math.round(settings.musicVolume * 100)}%`)}
      ${this.rangeSetting("Efektler", "sfxVolume", settings.sfxVolume, 0, 1, 0.05, `${Math.round(settings.sfxVolume * 100)}%`)}`;
    if (this.settingsTab === "controls") return `
      ${this.rangeSetting("Mouse hassasiyeti", "mouseSensitivity", settings.mouseSensitivity, 0.4, 2, 0.1, settings.mouseSensitivity.toFixed(1))}
      <div class="key-grid"><span>Hareket</span><kbd>W A S D</kbd><span>Birincil saldiri</span><kbd>Q</kbd><span>Etkilesim</span><kbd>E</kbd><span>Duraklat</span><kbd>ESC</kbd></div>`;
    if (this.settingsTab === "accessibility") return `
      ${this.toggleSetting("Azaltilmis hareket", "reducedMotion", settings.reducedMotion, "Menu ve kamera hareketlerini azaltir.")}
      ${this.toggleSetting("Yuksek kontrast", "highContrast", settings.highContrast, "Sis ve panel ayrimini guclendirir.")}
      ${this.selectSetting("Renk destegi", "colorAssist", settings.colorAssist, [["off","Kapali"],["deuteranopia","Deuteranopia"],["protanopia","Protanopia"],["tritanopia","Tritanopia"]])}`;
    return `
      ${this.rangeSetting("Kamera mesafesi", "cameraDistance", settings.cameraDistance, 8, 16, 0.5, settings.cameraDistance.toFixed(1))}
      ${this.toggleSetting("Otomatik saldiri", "autoAttack", settings.autoAttack, "En yakin hedefe temel saldiriyi tekrarlar.")}
      ${this.toggleSetting("Hasar sayilari", "damageNumbers", settings.damageNumbers, "Kritik ve toplam hasar geri bildirimi.")}
      ${this.toggleSetting("Ekran sarsintisi", "screenShake", settings.screenShake, "Agir BONK darbelerinde kamera tepkisi.")}`;
  }

  private rangeSetting(label: string, key: keyof GameSettings, value: number, min: number, max: number, step: number, display: string): string {
    return `<label class="setting-row"><span><strong>${label}</strong><small>${display}</small></span><input type="range" data-setting="${key}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
  }

  private toggleSetting(label: string, key: keyof GameSettings, checked: boolean, detail: string): string {
    return `<label class="setting-row setting-row--toggle"><span><strong>${label}</strong><small>${detail}</small></span><input type="checkbox" data-setting="${key}" ${checked ? "checked" : ""}><i></i></label>`;
  }

  private selectSetting(label: string, key: keyof GameSettings, value: string, options: string[][]): string {
    return `<label class="setting-row"><span><strong>${label}</strong></span><select data-setting="${key}">${options.map(([id, text]) => `<option value="${id}" ${id === value ? "selected" : ""}>${text}</option>`).join("")}</select></label>`;
  }

  private bindEvents(): void {
    this.root.querySelectorAll<HTMLElement>("[data-action]").forEach((element) => {
      element.addEventListener("click", () => this.handleAction(element.dataset.action ?? ""));
    });
    this.root.querySelectorAll<HTMLElement>("[data-settings-tab]").forEach((element) => {
      element.addEventListener("click", () => {
        this.settingsTab = element.dataset.settingsTab as SettingsTab;
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-setting]").forEach((element) => {
      element.addEventListener("input", () => this.updateSetting(element));
    });
    this.root.querySelectorAll<HTMLElement>("[data-upgrade]").forEach((element) => {
      element.addEventListener("click", () => {
        const id = element.dataset.upgrade as UpgradeChoice["id"];
        this.levelUpChoices = null;
        this.callbacks.onChooseUpgrade(id);
        this.render();
      });
    });
  }

  private handleAction(action: string): void {
    this.callbacks.onMenuInteraction();
    if (action === "open-lobby") this.screen = "lobby";
    if (action === "back-main") {
      this.screen = "main";
      this.paused = false;
    }
    if (action === "quit-main") {
      this.screen = "main";
      this.paused = false;
      this.callbacks.onQuitToMenu();
    }
    if (action === "start-run") {
      this.screen = "game";
      this.paused = false;
      this.clearRunOverlays();
      this.callbacks.onStartRun();
    }
    if (action === "retry-run") {
      this.screen = "game";
      this.paused = false;
      this.clearRunOverlays();
      this.callbacks.onRetryRun();
    }
    if (action === "attack") this.callbacks.onAttack();
    if (action === "open-settings") this.settingsOpen = true;
    if (action === "close-settings") this.settingsOpen = false;
    if (action === "resume") {
      this.paused = false;
      this.callbacks.onPauseChange(false);
    }
    if (action === "reset-settings") {
      const settings = this.settingsStore.reset();
      this.callbacks.onSettingsChange(settings);
    }
    if (action === "fullscreen") void this.toggleFullscreen();
    this.render();
  }

  private updateSetting(element: HTMLInputElement | HTMLSelectElement): void {
    const key = element.dataset.setting as keyof GameSettings;
    let value: string | number | boolean = element.value;
    if (element instanceof HTMLInputElement && element.type === "checkbox") value = element.checked;
    if (element instanceof HTMLInputElement && element.type === "range") value = Number(element.value);
    if (key === "fpsCap") value = Number(value);
    const settings = this.settingsStore.update({ [key]: value } as Partial<GameSettings>);
    this.callbacks.onSettingsChange(settings);
    this.render();
  }

  private async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== "Escape" || this.settingsOpen) return;
    if (this.levelUpChoices || this.result) return;
    if (this.screen !== "game") return;
    this.paused = !this.paused;
    this.callbacks.onPauseChange(this.paused);
    this.render();
  };
}
