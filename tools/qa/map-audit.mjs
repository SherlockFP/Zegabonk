// Map geometry audit (TEST-PLAYBOOK bolum 4).
// Grid sampleTerrainHeight vs mesh raycast, slope flags.
// Cikti: tests/artifacts/map-audit.json + map-audit.png
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const URL = process.env.PERF_URL || "http://localhost:5173/";
const outDir = "tests/artifacts";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(120000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message || e)));
page.on("console", (m) => { if (m.type() === "error") errors.push("console:" + m.text()); });

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#playBtn", { state: "visible" });
await page.click("#playBtn");
const lobbyStart = page.locator("#lobbyStartBtn");
await lobbyStart.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
if (await lobbyStart.isVisible().catch(() => false)) await lobbyStart.click();
await page.waitForSelector("#hud:not(.hidden)", { timeout: 90000 });
const skip = page.locator("#onboardingSkip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(2500);

const result = await page.evaluate(() => {
  const HALF = typeof WORLD_HALF === "number" ? WORLD_HALF : 460;
  const step = 8;
  const critical = [];
  const slopeFlags = [];
  const rc = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  const targets = [];
  if (typeof ground !== "undefined" && ground) targets.push(ground);

  function meshY(x, z) {
    origin.set(x, 400, z);
    rc.set(origin, down);
    try {
      const hits = rc.intersectObjects(targets, false);
      if (!hits.length) return null;
      return hits[0].point.y;
    } catch (err) {
      return null;
    }
  }

  const sampleH = typeof sampleTerrainHeight === "function" ? sampleTerrainHeight : function () { return 0; };
  let maxAbs = 0;
  let n = 0;
  for (let x = -HALF + 8; x <= HALF - 8; x += step) {
    for (let z = -HALF + 8; z <= HALF - 8; z += step) {
      if (Math.hypot(x, z) > HALF - 6) continue;
      const h = sampleH(x, z);
      const my = meshY(x, z);
      n++;
      if (my == null) continue;
      const d = Math.abs(my - h);
      if (d > maxAbs) maxAbs = d;
      if (d > 0.35 && critical.length < 80) {
        critical.push({ x, z, sample: +h.toFixed(3), mesh: +my.toFixed(3), d: +d.toFixed(3) });
      }
      const hx = sampleH(x + step, z);
      const hz = sampleH(x, z + step);
      const slope = Math.atan(Math.max(Math.abs(hx - h), Math.abs(hz - h)) / step) * 180 / Math.PI;
      if (slope > 50 && slopeFlags.length < 40) {
        slopeFlags.push({ x, z, slope: +slope.toFixed(1) });
      }
    }
  }

  const ramps = (typeof RAMP_ZONES !== "undefined" && RAMP_ZONES) || [];
  const rampMismatch = [];
  for (let i = 0; i < ramps.length; i++) {
    const r = ramps[i];
    const h0 = sampleH(r.x, r.z);
    const my = meshY(r.x, r.z);
    if (my != null && Math.abs(my - h0) > 0.35) {
      rampMismatch.push({ i, x: r.x, z: r.z, sample: +h0.toFixed(3), mesh: +my.toFixed(3) });
    }
  }

  const floaters = [];
  const box = new THREE.Box3();
  if (typeof mapGroup !== "undefined" && mapGroup) {
    const kids = mapGroup.children || [];
    for (let i = 0; i < kids.length && floaters.length < 40; i++) {
      const obj = kids[i];
      if (!obj || obj.isInstancedMesh) continue;
      const ud = obj.userData || {};
      if (ud.isJumpPad || ud.isTree) continue;
      box.setFromObject(obj);
      if (!isFinite(box.min.y)) continue;
      const cx = (box.min.x + box.max.x) * 0.5;
      const cz = (box.min.z + box.max.z) * 0.5;
      const gy = sampleH(cx, cz);
      const gap = box.min.y - gy;
      if (gap > 0.5 && gap < 3.5) {
        floaters.push({ x: +cx.toFixed(1), z: +cz.toFixed(1), y: +box.min.y.toFixed(2), g: +gy.toFixed(2), gap: +gap.toFixed(2) });
      }
    }
  }

  const cnv = document.createElement("canvas");
  cnv.width = 512;
  cnv.height = 512;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = "#142018";
  ctx.fillRect(0, 0, 512, 512);
  function toPx(x, z) {
    return [((x + HALF) / (HALF * 2)) * 512, ((z + HALF) / (HALF * 2)) * 512];
  }
  ctx.fillStyle = "#ff3344";
  for (let i = 0; i < critical.length; i++) {
    const p = toPx(critical[i].x, critical[i].z);
    ctx.fillRect(p[0] - 1, p[1] - 1, 3, 3);
  }
  ctx.fillStyle = "#ffcc00";
  for (let i = 0; i < slopeFlags.length; i++) {
    const p = toPx(slopeFlags[i].x, slopeFlags[i].z);
    ctx.fillRect(p[0], p[1], 2, 2);
  }
  return {
    samples: n,
    maxAbs: +maxAbs.toFixed(3),
    criticalCount: critical.length,
    critical,
    slopeFlags,
    rampMismatch,
    rampCount: ramps.length,
    floaterCount: floaters.length,
    floaters,
    pngData: cnv.toDataURL("image/png")
  };
});

if (result.pngData) {
  const b64 = result.pngData.split(",")[1];
  writeFileSync(outDir + "/map-audit.png", Buffer.from(b64, "base64"));
}
const dump = { ...result };
delete dump.pngData;
dump.errors = errors.slice(0, 20);
writeFileSync(outDir + "/map-audit.json", JSON.stringify(dump, null, 2));
console.log(JSON.stringify({
  samples: result.samples,
  maxAbs: result.maxAbs,
  criticalCount: result.criticalCount,
  slopeFlags: (result.slopeFlags || []).length,
  rampMismatch: (result.rampMismatch || []).length,
  floaterCount: result.floaterCount || 0,
  errors: errors.slice(0, 8)
}, null, 2));
await browser.close();
process.exit(0);
