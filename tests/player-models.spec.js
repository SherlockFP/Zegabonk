import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "tests/artifacts/player";
const IDS = ["scout", "brawler", "mage", "survivor", "samurai", "gorilla", "monk", "paladin", "archer"];

test("player voxel screenshots", async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err.message || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("console:" + msg.text());
  });

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/models/preview-player.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__PLAYER_READY === true, null, { timeout: 30000 });
  await page.locator("#spin").uncheck();
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + "/lineup-all.png" });

  const ids = await page.evaluate(() => (window.__PLAYER && window.__PLAYER.ids) || []);
  expect(ids).toEqual(IDS);

  await page.locator("#sil").check();
  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT + "/lineup-sil.png" });

  const heights = await page.evaluate(() => {
    return window.__PLAYER.entries.map(function (e) {
      return { id: e.id, h: e.info.height, n: e.info.voxelCount, w: e.info.width, d: e.info.depth };
    });
  });
  for (const row of heights) {
    const voxH = row.h / 0.125;
    expect(voxH, row.id + " height " + voxH).toBeGreaterThanOrEqual(13);
    expect(voxH, row.id + " height " + voxH).toBeLessThanOrEqual(20);
  }

  for (const id of IDS) {
    await page.goto("/models/preview-player.html?id=" + id, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__PLAYER_READY === true, null, { timeout: 20000 });
    await page.locator("#spin").uncheck();
    await page.waitForTimeout(250);
    await page.screenshot({ path: OUT + "/" + id + "-front.png" });
    await page.evaluate(() => {
      var e = window.__PLAYER.entries[0];
      if (e) e.model.rotation.y = Math.PI * 0.5;
    });
    await page.waitForTimeout(80);
    await page.screenshot({ path: OUT + "/" + id + "-side.png" });
    await page.evaluate(() => {
      var e = window.__PLAYER.entries[0];
      if (e) e.model.rotation.y = Math.PI * 0.35;
    });
    await page.waitForTimeout(80);
    await page.screenshot({ path: OUT + "/" + id + "-threequarter.png" });
    await page.goto("/models/preview-player.html?id=" + id + "&sil=1", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__PLAYER_READY === true, null, { timeout: 20000 });
    await page.locator("#spin").uncheck();
    await page.waitForTimeout(200);
    await page.screenshot({ path: OUT + "/" + id + "-sil.png" });
  }

  expect(errors, errors.join("\n")).toEqual([]);
});
