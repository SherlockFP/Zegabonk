import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "tests/artifacts/props";

test("voxel prop screenshots", async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err.message || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("console:" + msg.text());
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/models/preview-props.html?all=1", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__PROPS_READY === true && window.__PROPS, null, { timeout: 30000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + "/gallery-all.png" });

  const ids = await page.evaluate(() => window.PROP_MODEL_IDS || []);
  expect(ids.length).toBe(13);
  const catalog = await page.evaluate(() => window.__PROPS.catalog);
  const counts = {};
  for (const row of catalog) counts[row.id] = row.voxels;

  const trees = ["tree_oak", "tree_pine"];
  for (const id of ids) {
    const n = counts[id];
    if (trees.indexOf(id) >= 0) expect(n, id + " tree budget").toBeLessThan(250);
    else expect(n, id + " small budget").toBeLessThan(80);
  }

  const angles = ["front", "threequarter"];
  for (const id of ids) {
    for (const angle of angles) {
      await page.goto("/models/preview-props.html?id=" + id + "&angle=" + angle, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => window.__PROPS_READY === true && window.__PROPS && !window.__PROPS.all, null, { timeout: 20000 });
      await page.waitForTimeout(220);
      await page.screenshot({ path: OUT + "/" + id + "-" + angle + ".png" });
    }
  }

  expect(errors, errors.join("\n")).toEqual([]);
});
