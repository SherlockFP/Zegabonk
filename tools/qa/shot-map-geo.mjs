import { chromium } from '@playwright/test';

const out = 'tests/artifacts';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.setDefaultTimeout(90000);
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));

await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  try {
    const raw = JSON.parse(localStorage.getItem('zegabong_settings') || '{}');
    raw.cameraDistance = 15.4;
    raw.cameraHeight = 10.8;
    raw.pitchMax = -0.28;
    raw.fov = 64;
    raw.camPreset = 5;
    localStorage.setItem('zegabong_settings', JSON.stringify(raw));
  } catch (e) {}
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#playBtn', { state: 'visible' });
await page.waitForTimeout(400);
await page.click('#playBtn');
await page.waitForSelector('#lobbyScreen', { state: 'visible' });
await page.waitForTimeout(300);
await page.click('#lobbyStartBtn');
await page.waitForSelector('#hud:not(.hidden)', { timeout: 60000 });
const skip = page.locator('#onboardingSkip');
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(11000);
await page.evaluate(() => {
  if (typeof camSettings !== 'undefined') {
    camSettings.cameraDistance = 15.4;
    camSettings.cameraHeight = 10.8;
    camSettings.pitchMax = -0.28;
    camSettings.fov = 64;
  }
  if (typeof camPitch !== 'undefined') camPitch = -0.52;
  if (player && player.mesh) {
    player.mesh.position.set(4, 0, 6);
    if (typeof sampleTerrainHeight === 'function') {
      player.mesh.position.y = sampleTerrainHeight(4, 6);
    }
  }
  if (typeof addHorizonSilhouettes === 'function') addHorizonSilhouettes();
  if (typeof spawnEnemy === 'function') {
    for (let i = 0; i < 10; i++) spawnEnemy();
  }
});
await page.keyboard.down('KeyW');
await page.waitForTimeout(1400);
await page.keyboard.up('KeyW');
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/map-geo-gameplay.png` });

const overview = await page.evaluate(() => {
  if (!camera) return { ok: false };
  if (typeof addHorizonSilhouettes === 'function') addHorizonSilhouettes();
  if (typeof updateCamera === 'function') {
    window._savedUpdateCamera = updateCamera;
    updateCamera = function() {};
  }
  running = false;
  camera.position.set(8, 42, -28);
  camera.lookAt(4, 6, 90);
  camera.far = 980;
  camera.updateProjectionMatrix();
  if (renderer) renderer.render(scene, camera);
  const names = [];
  if (typeof classicWorld !== 'undefined' && classicWorld && classicWorld.root) {
    names.push(classicWorld.root.name);
  }
  return {
    ok: true,
    arena: names,
    bossRing: (typeof classicWorld !== 'undefined' && classicWorld && classicWorld.landmarks)
      ? classicWorld.landmarks.bossRing
      : null,
    cam: { far: camera.far, fov: camera.fov, y: camera.position.y },
    player: player && player.mesh ? { x: player.mesh.position.x, z: player.mesh.position.z } : null,
    horizon: !!(mapGroup && mapGroup.userData && mapGroup.userData.horizonSilhouettes),
    treeCount: (typeof _chunkTreePositions !== 'undefined' && _chunkTreePositions) ? _chunkTreePositions.length : null,
  };
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${out}/map-geo-overview.png` });
console.log(JSON.stringify({ overview, errors }, null, 2));
await browser.close();
if (errors.length) process.exit(1);
