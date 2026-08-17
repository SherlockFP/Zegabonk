import { chromium } from "@playwright/test";

const out = "tests/artifacts";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(90000);
const errors = [];
page.on("pageerror", (err) => errors.push(String(err.message || err)));

async function shot(name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/${name}.png` });
}

await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#playBtn", { state: "visible" });
await page.waitForTimeout(700);
await shot("final-menu");

await page.click("#menuSettingsBtn");
await page.waitForSelector("#settingsMenu:not(.hidden)");
await shot("final-settings");
await page.click("#settingsBackBtn");
await page.waitForSelector("#startScreen:not(.hidden)");

await page.click("#leaderboardBtn");
await page.waitForSelector("#leaderboardPanel:not(.hidden)");
await shot("final-leaderboard");
await page.click("#leaderboardBackBtn");
await page.waitForSelector("#startScreen:not(.hidden)");

await page.click("#playBtn");
await page.waitForSelector("#lobbyScreen:not(.hidden)", { timeout: 15000 });
await page.waitForTimeout(500);
await shot("final-lobby");

await page.click("#lobbyStartBtn");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 60000 });
const skip = page.locator("#onboardingSkip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(1600);
await shot("final-run");

await page.evaluate(() => {
  if (player && player.mesh) {
    player.mesh.position.set(0, 0, 8);
    if (typeof sampleTerrainHeight === "function") {
      player.mesh.position.y = sampleTerrainHeight(0, 8);
    }
  }
  if (typeof camYaw === "number") camYaw = 0;
  if (typeof camPitch === "number") camPitch = -0.58;
  if (typeof spawnEnemy === "function") {
    for (let i = 0; i < 10; i++) spawnEnemy();
  }
});
await page.waitForTimeout(1800);
await shot("final-combat");

await page.evaluate(() => {
  if (typeof openPauseMenu === "function") openPauseMenu();
});
await page.waitForSelector("#pauseMenu:not(.hidden)");
await shot("final-pause");

await page.click("#settingsBtn");
await page.waitForSelector("#settingsMenu:not(.hidden)");
await shot("final-pause-settings");
await page.click("#settingsBackBtn");
await page.waitForSelector("#pauseMenu:not(.hidden)");
await page.click("#pauseResumeBtn");
await page.locator("#pauseMenu").waitFor({ state: "hidden" });

await page.evaluate(() => {
  try { gainXp(500); } catch (e) {}
});
await page.waitForTimeout(800);
await shot("final-levelup");
await page.evaluate(() => {
  const card = document.querySelector("#levelup .card, #levelup .lvlCard, #levelupChoiceBar .card");
  if (card) card.click();
});
await page.waitForTimeout(400);

await page.evaluate(() => {
  state.pendingLevels = 0;
  if (typeof closeLevelupAndResume === "function") closeLevelupAndResume();
});
await page.waitForTimeout(300);

await page.evaluate(() => {
  if (typeof applyBiomeTheme === "function") applyBiomeTheme(2);
  if (player && player.mesh) {
    player.mesh.position.set(-72, 0, 18);
    if (typeof sampleTerrainHeight === "function") {
      player.mesh.position.y = sampleTerrainHeight(-72, 18);
    }
  }
});
await page.waitForTimeout(700);
await shot("final-ch2");

await page.evaluate(() => {
  if (typeof applyBiomeTheme === "function") applyBiomeTheme(3);
  if (player && player.mesh) {
    player.mesh.position.set(8, 0, 108);
    if (typeof sampleTerrainHeight === "function") {
      player.mesh.position.y = sampleTerrainHeight(8, 108);
    }
  }
});
await page.waitForTimeout(700);
await shot("final-ch3");

await page.evaluate(() => {
  if (typeof onPlayerDeath === "function") onPlayerDeath();
});
await page.waitForSelector("#gameOver:not(.hidden)");
await shot("final-gameover");

const info = await page.evaluate(() => {
  const vis = (id) => {
    const el = document.getElementById(id);
    if (!el) return "missing";
    return el.classList.contains("hidden") ? "hidden" : "open";
  };
  const r = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { t: Math.round(b.top), l: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height) };
  };
  return {
    goTitle: (document.getElementById("gameOverTitle") || {}).textContent,
    goHook: (document.getElementById("goHook") || {}).textContent,
    obj: (document.getElementById("runObjective") || {}).textContent,
    youRank: (document.getElementById("menuLbYouRank") || {}).textContent,
    lbRows: document.querySelectorAll("#menuLeaderboardList .lbRow").length,
    lobbyCards: document.querySelectorAll(".lobbyCharCard").length,
    vis: {
      start: vis("startScreen"),
      lobby: vis("lobbyScreen"),
      hud: vis("hud"),
      pause: vis("pauseMenu"),
      levelup: vis("levelup"),
      gameOver: vis("gameOver"),
    },
    boxes: {
      playBtn: r("playBtn"),
      menuLb: r("menuLeaderboardList"),
      radar: r("radarWrap"),
      obj: r("runObjective"),
      xp: r("xpBarBottom"),
    },
  };
});
console.log(JSON.stringify({ info, errors }, null, 2));
await browser.close();
