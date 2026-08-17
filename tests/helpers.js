import { expect } from '@playwright/test';

export async function enterLobbyFromPlay(page) {
  await page.waitForFunction(() => typeof enterTownHub === 'function', null, { timeout: 20000 });
  await page.click('#playBtn');
  await page.waitForFunction(() => typeof state !== 'undefined' && state.inTown === true, null, { timeout: 20000 });
  await page.waitForTimeout(350);
  await page.evaluate(() => { if (typeof openLobby === 'function') openLobby(); });
  await expect(page.locator('#lobbyScreen')).toBeVisible({ timeout: 15000 });
}
