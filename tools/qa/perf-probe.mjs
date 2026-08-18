// Performance probe (TEST-PLAYBOOK bolum 3).
// Bos harita / 50 dusman / 150 dusman + guclu oyuncu senaryolarini kosar,
// her 5 sn renderer.info + FPS orneklemesi alir, restart sizinti kontrolu yapar.
// Cikti: tests/artifacts/perf-<tarih>.json + stdout ozet tablo.
//
// Kullanim:  node tools/qa/perf-probe.mjs [--fast] [--headed] [--label=<isim>]
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const FAST = argv.includes("--fast");
const HEADED = argv.includes("--headed");
// A/B icin: paylasilan geometry/material cache'ini calisma aninda kapat.
const NOCACHE = argv.includes("--nocache");
const LABEL = (argv.find((a) => a.startsWith("--label=")) || "--label=run").slice(8);
const URL = process.env.PERF_URL || "http://localhost:5173/";

const SEC = (s) => (FAST ? Math.max(5, Math.round(s / 3)) : s);
const outDir = "tests/artifacts";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: !HEADED,
  args: ["--enable-unsafe-swiftshader", "--disable-frame-rate-limit", "--use-angle=default"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(120000);
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror:" + String(e.message || e)));
page.on("console", (m) => { if (m.type() === "error") errors.push("console:" + m.text()); });

// Frame zamanlarini toplayan kanca. Oyunun kendi rAF dongusu ile ayni vsync'te kosar.
async function installHook() {
  await page.evaluate(() => {
    if (window.__perf) return;
    window.__perf = { d: [], last: performance.now() };
    const loop = () => {
      const t = performance.now();
      window.__perf.d.push(t - window.__perf.last);
      window.__perf.last = t;
      if (window.__perf.d.length > 900) window.__perf.d.shift();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

async function sample(scene) {
  return await page.evaluate((sceneName) => {
    const d = (window.__perf && window.__perf.d) || [];
    window.__perf.d = [];
    const sorted = d.slice().sort((a, b) => a - b);
    const pick = (q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] : 0);
    const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
    const r = typeof renderer !== "undefined" && renderer ? renderer.info : null;
    return {
      scene: sceneName,
      frames: sorted.length,
      fps: avg ? +(1000 / avg).toFixed(1) : 0,
      medianMs: +pick(0.5).toFixed(2),
      p95Ms: +pick(0.95).toFixed(2),
      maxMs: +(sorted[sorted.length - 1] || 0).toFixed(2),
      drawCalls: r ? r.render.calls : -1,
      triangles: r ? r.render.triangles : -1,
      geometries: r ? r.memory.geometries : -1,
      textures: r ? r.memory.textures : -1,
      programs: r && r.programs ? r.programs.length : -1,
      enemies: typeof enemies !== "undefined" ? enemies.length : -1,
      projectiles: typeof projectiles !== "undefined" ? projectiles.length : -1,
      effects: typeof effects !== "undefined" ? effects.length : -1,
      pixelRatio: typeof renderer !== "undefined" && renderer ? renderer.getPixelRatio() : -1,
    };
  }, scene);
}

// Belirtilen sure boyunca 5 sn'de bir ornek al, ortalamalari dondur.
async function measure(name, seconds) {
  const rows = [];
  const steps = Math.max(1, Math.round(seconds / 5));
  await page.waitForTimeout(1500);
  await page.evaluate(() => { if (window.__perf) window.__perf.d = []; });
  for (let i = 0; i < steps; i++) {
    await page.waitForTimeout(5000);
    rows.push(await sample(name));
  }
  const num = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
  const agg = {
    scene: name,
    samples: rows.length,
    fps: +num("fps").toFixed(1),
    medianMs: +num("medianMs").toFixed(2),
    p95Ms: +num("p95Ms").toFixed(2),
    maxMs: +Math.max(...rows.map((r) => r.maxMs)).toFixed(2),
    drawCalls: Math.round(num("drawCalls")),
    triangles: Math.round(num("triangles")),
    geometries: Math.round(num("geometries")),
    textures: Math.round(num("textures")),
    enemies: Math.round(num("enemies")),
    pixelRatio: rows[0].pixelRatio,
    rows,
  };
  console.log(
    `${name.padEnd(24)} fps=${String(agg.fps).padStart(6)}  p95=${String(agg.p95Ms).padStart(7)}ms  max=${String(agg.maxMs).padStart(8)}ms  calls=${String(agg.drawCalls).padStart(5)}  tris=${String(agg.triangles).padStart(8)}  geo=${String(agg.geometries).padStart(6)}  enemies=${agg.enemies}`
  );
  return agg;
}

// Dusman sayisini hedefte tut: oyunun kendi capi seviyeye bagli (getMaxEnemies),
// olcum icin capi kaldirip 300ms'de bir eksigi tamamla.
async function holdEnemies(target) {
  await page.evaluate((n) => {
    window.getMaxEnemies = function () { return n + 50; };
    if (window.__topUp) clearInterval(window.__topUp);
    const fill = () => {
      if (typeof enemies === "undefined") return;
      let guard = 0;
      while (enemies.length < n && guard++ < 400) { try { spawnEnemy(); } catch (e) { break; } }
    };
    fill();
    window.__topUp = setInterval(fill, 300);
  }, target);
}

async function stopHold() {
  await page.evaluate(() => { if (window.__topUp) { clearInterval(window.__topUp); window.__topUp = null; } });
}

// Gec oyun gucunu taklit et: bir dizi aktif skill ver.
async function makePowerful() {
  return await page.evaluate(() => {
    const wanted = [
      "unlock_fireball", "unlock_swords", "unlock_nova", "unlock_frostball", "unlock_spark",
      "unlock_comet", "unlock_meteor", "unlock_explosion", "unlock_boomerang", "unlock_shuriken",
      "unlock_saturn_rings", "unlock_laser", "unlock_bomb", "unlock_banana", "unlock_sword_throw",
    ];
    let applied = 0;
    if (typeof skills === "undefined" || typeof applySkill !== "function") return { applied, reason: "no skills" };
    wanted.forEach((id) => {
      const s = skills.find((x) => x.id === id);
      if (!s) return;
      try { applySkill(s); applySkill(s); applied++; } catch (e) {}
    });
    return { applied };
  });
}

const report = { label: LABEL, url: URL, startedAt: new Date().toISOString(), fast: FAST, headed: HEADED, scenarios: [], leak: null, errors: [] };

await page.addInitScript(() => {
  window.__perfNoCache = false;
});
if (NOCACHE) {
  await page.addInitScript(() => {
    window.__perfNoCache = true;
    // app.js yuklendikten sonra sarmalayicilari etkisiz hale getir.
    const strip = () => {
      if (typeof window.withSharedGeo !== "function") return false;
      window.withSharedGeo = function (fn) { return fn(); };
      window.withSharedGeoMat = function (fn) { return fn(); };
      window.installSharedCaches = function () {};
      return true;
    };
    const t = setInterval(() => { if (strip()) clearInterval(t); }, 10);
  });
}

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#playBtn", { state: "visible" });
report.noCache = await page.evaluate(() => !!window.__perfNoCache);
await installHook();
report.scenarios.push(await measure("menu", SEC(10)));

await page.click("#playBtn");
const lobbyStart = page.locator("#lobbyStartBtn");
await lobbyStart.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
if (await lobbyStart.isVisible().catch(() => false)) await lobbyStart.click();
await page.waitForSelector("#hud:not(.hidden)", { timeout: 120000 });
const skip = page.locator("#onboardingSkip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await installHook();

report.scenarios.push(await measure("ingame-empty", SEC(30)));

await holdEnemies(50);
report.scenarios.push(await measure("ingame-50", SEC(30)));

const power = await makePowerful();
report.power = power;
await holdEnemies(150);
report.scenarios.push(await measure("ingame-150-power", SEC(60)));
await stopHold();

// Restart x5 -> geometry sizinti kontrolu
const leak = [];
for (let i = 0; i < 5; i++) {
  await page.evaluate(() => { try { startRun(1, "classic"); } catch (e) {} });
  await page.waitForTimeout(9000);
  const s = await sample("restart" + (i + 1));
  leak.push({ run: i + 1, geometries: s.geometries, textures: s.textures, programs: s.programs, drawCalls: s.drawCalls });
  console.log(`restart ${i + 1}: geometries=${s.geometries} textures=${s.textures} programs=${s.programs}`);
}
report.leak = leak;
report.errors = errors.slice(0, 40);

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const file = `${outDir}/perf-${LABEL}-${stamp}.json`;
writeFileSync(file, JSON.stringify(report, null, 2));
console.log("\nreport:", file);
console.log("errors:", report.errors.length);
if (report.errors.length) console.log(report.errors.join("\n"));
await browser.close();
