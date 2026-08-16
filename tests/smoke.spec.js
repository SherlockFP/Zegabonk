import { test, expect } from '@playwright/test';

test('menu renders with no console errors / failed requests', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) =>
    failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText}`)
  );
  page.on('response', (res) => {
    if (res.status() >= 400)
      failedRequests.push(`HTTP ${res.status()} ${res.request().method()} ${res.url()}`);
  });

  await page.goto('/');

  // Game bootstraps via dynamically-injected script; menu appears once ready.
  await expect(page.locator('#startScreen')).toBeVisible({ timeout: 30000 });

  // Small settle time so late-loading assets (maps/audio) can resolve.
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'tests/artifacts/baseline-menu.png', fullPage: true });

  console.log('--- console errors ---');
  console.log(consoleErrors.length ? consoleErrors.join('\n') : 'none');
  console.log('--- page errors ---');
  console.log(pageErrors.length ? pageErrors.join('\n') : 'none');
  console.log('--- failed requests ---');
  console.log(failedRequests.length ? failedRequests.join('\n') : 'none');

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
