import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const outDir = "tests/artifacts";
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(90000);
const errors = [];
page.on("pageerror", (err) => errors.push(String(err.message || err)));
page.on("console", (msg) => { if (msg.type() === "error") errors.push("console:" + msg.text()); });

async function shot(name) {
  await page.waitForTimeout(200);
  await page.screenshot({ path: outDir + "/" + name + ".png" });
  console.log("shot", name);
}

await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#playBtn", { state: "visible" });
await page.waitForTimeout(800);
await shot("dir-menu");

const mage = page.locator(".menuCharTile[data-char=mage]");
if (await mage.count()) {
  await mage.click();
  await page.waitForTimeout(200);
  await shot("dir-menu-mage");
}

await page.click("#leaderboardBtn");
await page.waitForSelector("#leaderboardPanel:not(.hidden)");
await shot("dir-leaderboard");
await page.click("#leaderboardBackBtn");
await page.waitForSelector("#startScreen:not(.hidden)");

await page.click("#playBtn");
const lobbyStart = page.locator("#lobbyStartBtn");
await lobbyStart.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
if (await lobbyStart.isVisible().catch(() => false)) {
  await shot("dir-lobby");
  await lobbyStart.click();
}
await page.waitForSelector("#hud:not(.hidden)", { timeout: 90000 });
const skip = page.locator("#onboardingSkip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(1800);
await shot("dir-run");

await page.evaluate(() => {
  try {
    if (player && player.mesh) {
      player.mesh.position.set(0, 0, 6);
      if (typeof sampleTerrainHeight === "function") player.mesh.position.y = sampleTerrainHeight(0, 6);
    }
    if (typeof camYaw === "number") camYaw = 0.2;
    if (typeof camPitch === "number") camPitch = -0.45;
    if (typeof spawnEnemy === "function") {
      for (let i = 0; i < 8; i++) spawnEnemy();
    }
  } catch (e) {}
});
await page.waitForTimeout(1600);
await shot("dir-combat");

const info = await page.evaluate(() => {
  const hud = document.getElementById("hud");
  const start = document.getElementById("startScreen");
  return {
    hud: !!(hud && !hud.classList.contains("hidden")),
    startHidden: !!(start && start.classList.contains("hidden")),
    selected: (typeof state !== "undefined" && state.selectedCharacter) || null,
    map: (typeof state !== "undefined" && (state.selectedMapId || state.currentMapId)) || null,
    useGltf: !!(typeof player !== "undefined" && player.useGltf),
    creatureKeys: typeof creatureCache !== "undefined" ? Object.keys(creatureCache) : [],
    enemyCount: typeof enemies !== "undefined" && Array.isArray(enemies) ? enemies.length : -1,
    title: document.title
  };
});
console.log(JSON.stringify({ info, errors: errors.slice(0, 20) }, null, 2));
await browser.close();
