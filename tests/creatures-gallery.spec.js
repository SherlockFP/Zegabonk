import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "tests/artifacts/creatures";

test("voxel gallery screenshots", async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err.message || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("console:" + msg.text());
  });

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/models/gallery.html?set=creatures", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__GALLERY_READY === true, null, { timeout: 30000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT + "/gallery-all.png" });

  const ids = await page.evaluate(() => (window.__GALLERY && window.__GALLERY.ids) || []);
  expect(ids.length).toBeGreaterThan(0);

  await page.locator("#spin").uncheck();
  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT + "/gallery-all-still.png" });

  for (const id of ids) {
    await page.goto("/models/gallery.html?id=" + id, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__GALLERY_READY === true, null, { timeout: 20000 });
    await page.locator("#spin").uncheck();
    await page.waitForTimeout(350);
    await page.screenshot({ path: OUT + "/" + id + "-front.png" });
    await page.evaluate(() => {
      var e = window.__GALLERY.entries[0];
      if (e) e.model.rotation.y = Math.PI * 0.35;
    });
    await page.waitForTimeout(120);
    await page.screenshot({ path: OUT + "/" + id + "-threequarter.png" });
  }

  expect(errors, errors.join("\n")).toEqual([]);
});
