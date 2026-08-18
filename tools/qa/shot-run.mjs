import { chromium } from '@playwright/test';

const out = 'tests/artifacts';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.setDefaultTimeout(60000);
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#playBtn', { state: 'visible' });
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/menu-live.png` });
await page.click('#playBtn');
await page.waitForSelector('#lobbyScreen', { state: 'visible' });
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/lobby-live.png` });
await page.click('#lobbyStartBtn');
await page.waitForSelector('#hud:not(.hidden)', { timeout: 60000 });
const skip = page.locator('#onboardingSkip');
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/run-live.png` });
await page.keyboard.down('KeyW');
await page.waitForTimeout(1600);
await page.keyboard.up('KeyW');
await page.keyboard.down('KeyD');
await page.waitForTimeout(700);
await page.keyboard.up('KeyD');
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/run-chase.png` });
const info = await page.evaluate(() => {
  const hud = document.getElementById('hud');
  return {
    hud: !!(hud && !hud.classList.contains('hidden')),
    killText: (document.getElementById('killChip') || {}).textContent || '',
    timeText: (document.getElementById('topCenterTime') || {}).textContent || '',
    onboarding: !document.getElementById('onboardingOverlay')?.classList.contains('hidden'),
    unlockBoard: (document.getElementById('unlockBoard') || {}).innerText || '',
  };
});
console.log(JSON.stringify({ info, errors }, null, 2));
await browser.close();
