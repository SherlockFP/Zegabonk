import { chromium } from "@playwright/test";

const out = "tests/artifacts";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(60000);
const errors = [];
page.on("pageerror", (err) => errors.push(String(err.message || err)));
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#playBtn", { state: "visible" });
await page.waitForTimeout(400);
await page.screenshot({ path: out + "/menu-live.png" });
await page.click("#playBtn");
await page.waitForSelector("#lobbyScreen:not(.hidden)", { timeout: 15000 });
await page.waitForTimeout(500);
await page.screenshot({ path: out + "/lobby-live.png" });
const lobby = await page.evaluate(() => {
  const cards = [...document.querySelectorAll(".lobbyCharCard")];
  return {
    n: cards.length,
    locked: cards.filter((c) => c.classList.contains("charLocked")).length,
    ids: cards.map((c) => c.getAttribute("data-char")),
    scoutOpen: !document.querySelector('.lobbyCharCard[data-char="scout"]')?.classList.contains("charLocked"),
    kabukcuLocked: !!document.querySelector('.lobbyCharCard[data-char="kabukcu"]')?.classList.contains("charLocked"),
  };
});
await page.click("#lobbyStartBtn");
await page.waitForSelector("#hud:not(.hidden)", { timeout: 60000 });
const skip = page.locator("#onboardingSkip");
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(1800);
await page.screenshot({ path: out + "/run-live.png" });
await page.keyboard.down("KeyW");
await page.waitForTimeout(1400);
await page.keyboard.up("KeyW");
await page.waitForTimeout(300);
await page.screenshot({ path: out + "/hud-readability.png" });
const hud = await page.evaluate(() => {
  const vw = innerWidth, vh = innerHeight;
  const cx = { x: vw * 0.35, y: vh * 0.28, w: vw * 0.3, h: vh * 0.44 };
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.display === "none" || Number(cs.opacity) === 0 || r.width < 2 || r.height < 2) return { hidden: true };
    const overlap = !(r.right < cx.x || r.left > cx.x + cx.w || r.bottom < cx.y || r.top > cx.y + cx.h);
    return { t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), overlap };
  };
  return {
    ach: box(document.getElementById("achievementPopup")),
    note: box(document.getElementById("gameNotification")),
    obj: box(document.getElementById("runObjective")),
    radar: box(document.getElementById("radarWrap")),
    hp: (document.getElementById("hpText") || {}).textContent,
    kills: (document.getElementById("killChip") || {}).textContent,
  };
});
console.log(JSON.stringify({ lobby, hud, errors }, null, 2));
await browser.close();
