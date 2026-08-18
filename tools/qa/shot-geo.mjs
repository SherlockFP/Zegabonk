import { chromium } from "@playwright/test";

const out = "tests/artifacts";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.setDefaultTimeout(90000);
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#playBtn", { state: "visible" });
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/geo-menu.png` });

await page.click("#playBtn");
await page.waitForSelector("#lobbyScreen", { state: "visible" });
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/geo-lobby.png` });

await page.click("#lobbyStartBtn");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 60000 });
const skip = page.locator("#onboardingSkip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(8000);

await page.evaluate(() => {
  if (player && player.mesh) {
    player.mesh.position.set(0, 0, 6);
    if (typeof sampleTerrainHeight === "function") {
      player.mesh.position.y = sampleTerrainHeight(0, 6);
    }
  }
  if (typeof camYaw === "number") camYaw = 0;
  if (typeof camPitch === "number") camPitch = -0.58;
  if (camSettings) {
    camSettings.cameraDistance = 15.4;
    camSettings.cameraHeight = 10.8;
    camSettings.fov = 64;
  }
  if (typeof spawnEnemy === "function") {
    for (let i = 0; i < 12; i++) spawnEnemy();
  }
});

await page.waitForTimeout(2800);
await page.screenshot({ path: `${out}/geo-gameplay.png` });

await page.evaluate(() => {
  if (player && player.mesh) {
    player.mesh.position.set(0, 0, 8);
    if (typeof sampleTerrainHeight === "function") {
      player.mesh.position.y = sampleTerrainHeight(0, 8);
    }
  }
  if (typeof camYaw === "number") camYaw = 0;
  if (typeof camPitch === "number") camPitch = -0.48;
  if (camSettings) {
    camSettings.cameraDistance = 28;
    camSettings.cameraHeight = 16;
    camSettings.fov = 60;
  }
});
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/geo-overview.png` });

await page.evaluate(() => {
  if (typeof camPitch === "number") camPitch = -0.58;
  if (camSettings) {
    camSettings.cameraDistance = 15.4;
    camSettings.cameraHeight = 10.8;
    camSettings.fov = 64;
  }
  try { gainXp(400); } catch (e) {}
});
await page.waitForTimeout(1000);
await page.screenshot({ path: `${out}/geo-levelup.png` });

const info = await page.evaluate(() => {
  const hud = document.getElementById("hud");
  return {
    hud: !!(hud && !hud.classList.contains("hidden")),
    timeText: (document.getElementById("topCenterTime") || {}).textContent || "",
    enemyCount: typeof enemies !== "undefined" ? enemies.length : -1,
    playerY: player && player.mesh ? player.mesh.position.y : null,
    playerXZ: player && player.mesh ? [player.mesh.position.x, player.mesh.position.z] : null,
    levelup: !document.getElementById("levelup")?.classList.contains("hidden"),
    classicWorld: typeof classicWorld !== "undefined" && !!classicWorld,
    arenaName: classicWorld && classicWorld.root ? classicWorld.root.name : null,
    fogD: scene && scene.fog ? scene.fog.density : null,
  };
});
console.log(JSON.stringify({ info, errors }, null, 2));
await browser.close();
if (errors.length) process.exit(1);
