import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const outDir = "tests/artifacts/bosses";
mkdirSync(outDir, { recursive: true });

const ids = [
  "boss_arachne", "boss_kraken", "boss_kral_slime", "boss_golem",
  "boss_herobrine", "boss_serafim", "boss_void", "boss_temple", "boss_zonk_avatar"
];
const angles = ["front", "side"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (err) => errors.push(String(err.message || err)));
page.on("console", (msg) => { if (msg.type() === "error") errors.push("console:" + msg.text()); });

for (const id of ids) {
  for (const phase of [1, 2]) {
    for (const angle of angles) {
      const url = `http://localhost:5173/models/preview-bosses.html?id=${id}&phase=${phase}&angle=${angle}`;
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.BOSS_PREVIEW && window.BOSS_VOXEL_DEFS);
      await page.waitForTimeout(250);
      const name = `${id}-p${phase}-${angle}`;
      await page.screenshot({ path: `${outDir}/${name}.png` });
      console.log("shot", name);
    }
  }
}

const stats = await page.evaluate(() => window.BOSS_CATALOG);
console.log(JSON.stringify(stats, null, 2));
if (errors.length) {
  console.log("ERRORS", errors);
  process.exitCode = 1;
}
await browser.close();
